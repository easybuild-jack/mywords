'use client'

import { useEffect, useRef, useState } from 'react'
import { dictionaryLoader } from '@/core/dictionaryLoader'
import { getWordFromAiCache, mergeWordIntoAiCache } from '@/db'
import {
  fetchAiDictionaryWordCore,
  fetchAiDictionaryWordExamples,
  fetchAiDictionaryWordStructure,
  type AiClientConfig,
} from '@/lib/aiClient'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { WordItem } from '@/types'

export type AiWordSection = 'structure' | 'examples'

const inFlightSections = new Map<
  string,
  { fingerprint: string; promise: Promise<WordItem | null> }
>()
const inFlightCore = new Map<string, Promise<WordItem | null>>()

function configFingerprint(config: AiClientConfig) {
  return `${config.endpoint}::${config.model}::${config.apiKey}`
}

function mergeSectionWord(
  current: WordItem,
  updated: WordItem,
  section: AiWordSection
): WordItem {
  return section === 'structure'
    ? {
        ...current,
        syllables: updated.syllables,
        silentIndices: updated.silentIndices,
        etymology: updated.etymology,
        aiSections: updated.aiSections,
      }
    : {
        ...current,
        examples: updated.examples,
        aiSections: updated.aiSections,
      }
}

function syncWorkspaceWord(word: WordItem, section: AiWordSection) {
  const loaded = useWorkspaceStore.getState().currentLoadedWords
  if (!loaded.some((item) => item.id === word.id)) return
  useWorkspaceStore.setState({
    currentLoadedWords: loaded.map((item) =>
      item.id === word.id ? mergeSectionWord(item, word, section) : item
    ),
  })
}

async function generateSection(
  config: AiClientConfig,
  snapshot: WordItem,
  section: AiWordSection
): Promise<WordItem | null> {
  const cached = await getWordFromAiCache(snapshot.name)
  const word = cached || snapshot
  if (!word.aiSections || word.aiSections[section] === 'ready') return word

  await mergeWordIntoAiCache({
    name: word.name,
    aiSections: { [section]: 'pending' },
  }, word)

  try {
    const trans = word.posList.map(
      ({ pos, means }) => `${pos} ${means.join('；')}`
    )

    if (section === 'structure') {
      const raw = await fetchAiDictionaryWordStructure(config, word.name, {
        trans,
        usphone: word.phoneticUs?.replace(/^\/+|\/+$/g, ''),
        ukphone: word.phoneticUk?.replace(/^\/+|\/+$/g, ''),
      })
      if (!raw) throw new Error('构词数据为空')
      const converted = await dictionaryLoader.convertRawEntryToWordItem(raw)
      return await mergeWordIntoAiCache({
        name: word.name,
        syllables: converted.syllables,
        silentIndices: converted.silentIndices,
        etymology: converted.etymology,
        aiSections: { structure: 'ready' },
      }, word)
    }

    const raw = await fetchAiDictionaryWordExamples(config, word.name, trans)
    if (!raw?.examples?.length) throw new Error('例句数据为空')
    return await mergeWordIntoAiCache({
      name: word.name,
      examples: raw.examples,
      aiSections: { examples: 'ready' },
    }, word)
  } catch (error) {
    console.warn(`AI word ${section} query failed:`, error)
    return await mergeWordIntoAiCache({
      name: word.name,
      aiSections: { [section]: 'error' },
    }, word)
  }
}

function ensureSection(
  config: AiClientConfig,
  word: WordItem,
  section: AiWordSection
): Promise<WordItem | null> {
  const fingerprint = configFingerprint(config)
  const key = `${word.name.toLowerCase()}::${section}`
  const existing = inFlightSections.get(key)
  if (existing) {
    if (existing.fingerprint === fingerprint) return existing.promise
    return existing.promise.then((updated) =>
      updated?.aiSections?.[section] === 'ready'
        ? updated
        : ensureSection(config, updated || word, section)
    )
  }

  const task = generateSection(config, word, section).finally(() => {
    if (inFlightSections.get(key)?.promise === task) inFlightSections.delete(key)
  })
  inFlightSections.set(key, { fingerprint, promise: task })
  return task
}

/** 只查询弹窗和首屏需要的音标、释义，并缓存为待补全词条。 */
export function queryAiWordCore(
  config: AiClientConfig,
  word: string
): Promise<WordItem | null> {
  const key = `${configFingerprint(config)}::${word.trim().toLowerCase()}`
  const existing = inFlightCore.get(key)
  if (existing) return existing

  const task = (async () => {
    const cached = await getWordFromAiCache(word)
    if (cached) return cached

    const raw = await fetchAiDictionaryWordCore(config, word)
    if (!raw) return null
    const coreWord = await dictionaryLoader.convertRawEntryToWordItem(raw)
    coreWord.aiSections = { structure: 'pending', examples: 'pending' }

    return await mergeWordIntoAiCache(
      {
        name: coreWord.name,
        phoneticUs: coreWord.phoneticUs,
        phoneticUk: coreWord.phoneticUk,
        posList: coreWord.posList,
        aiSections: coreWord.aiSections,
      },
      coreWord
    )
  })().finally(() => {
    if (inFlightCore.get(key) === task) inFlightCore.delete(key)
  })
  inFlightCore.set(key, task)
  return task
}

/** 在卡片实际需要某类富数据时才触发 AI 补全。 */
export function useEnsureAiWordSections(
  word: WordItem,
  sections: readonly AiWordSection[]
): WordItem {
  const aiConfig = useAiAssistantStore((state) => state.aiConfig)
  const fingerprint = configFingerprint(aiConfig)
  const [resolved, setResolved] = useState<{
    fingerprint: string
    word: WordItem
  } | null>(null)
  const attemptedRef = useRef(new Set<string>())
  const sectionsKey = sections.join(',')
  const contextKey = `${fingerprint}::${word.id}`
  const contextRef = useRef<string | null>(null)

  useEffect(() => {
    attemptedRef.current.clear()
    contextRef.current = contextKey
    return () => {
      if (contextRef.current === contextKey) contextRef.current = null
    }
  }, [contextKey])

  useEffect(() => {
    if (!word.aiSections || !aiConfig.apiKey?.trim()) return

    for (const section of sectionsKey.split(',').filter(Boolean) as AiWordSection[]) {
      if (word.aiSections[section] === 'ready') continue
      const attemptKey = `${fingerprint}::${word.id}::${section}`
      if (attemptedRef.current.has(attemptKey)) continue
      attemptedRef.current.add(attemptKey)

      void ensureSection(aiConfig, word, section).then((updated) => {
        if (contextRef.current !== contextKey || !updated) return
        setResolved((current) => ({
          fingerprint,
          word: mergeSectionWord(
            current?.word.id === word.id ? current.word : word,
            updated,
            section
          ),
        }))
        syncWorkspaceWord(updated, section)
      })
    }
  }, [aiConfig, contextKey, fingerprint, sectionsKey, word])

  if (resolved?.word.id === word.id && resolved.fingerprint === fingerprint) {
    return { ...word, ...resolved.word }
  }

  if (!word.aiSections) return word
  const pendingSections = { ...word.aiSections }
  for (const section of sections) {
    if (pendingSections[section] !== 'ready') {
      pendingSections[section] = aiConfig.apiKey?.trim() ? 'pending' : 'error'
    }
  }
  return { ...word, aiSections: pendingSections }
}
