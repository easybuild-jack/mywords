'use client'

import { useEffect, useRef, useState } from 'react'
import { dictionaryLoader } from '@/core/dictionaryLoader'
import { getWordFromAiCache, mergeWordIntoAiCache, saveWordOverride } from '@/db'
import {
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

function configFingerprint(config: AiClientConfig) {
  return `${config.endpoint}::${config.model}::${config.apiKey}`
}

export function isSectionReady(word: WordItem, section: AiWordSection): boolean {
  if (section === 'structure') {
    return Boolean(
      word.etymology &&
      word.phrases?.length &&
      (!word.aiSections || word.aiSections.structure === 'ready')
    )
  }
  if (section === 'examples') {
    return Boolean(
      word.examples?.length &&
      (!word.aiSections || word.aiSections.examples === 'ready')
    )
  }
  return false
}

function mergeSectionWord(
  current: WordItem,
  updated: WordItem,
  section: AiWordSection
): WordItem {
  if (section === 'structure') {
    return {
      ...current,
      syllables: updated.syllables,
      silentIndices: updated.silentIndices,
      etymology: updated.etymology,
      phrases: updated.phrases ?? current.phrases,
      aiSections: { ...current.aiSections, ...updated.aiSections },
    }
  }
  return {
    ...current,
    examples: updated.examples,
    aiSections: { ...current.aiSections, ...updated.aiSections },
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
  if (isSectionReady(word, section)) return word

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
      await saveWordOverride(word.id, word.name, {
        syllables: converted.syllables,
        silentIndices: converted.silentIndices,
        etymology: converted.etymology,
        phrases: raw.phrases,
      })
      return await mergeWordIntoAiCache({
        name: word.name,
        syllables: converted.syllables,
        silentIndices: converted.silentIndices,
        etymology: converted.etymology,
        phrases: raw.phrases,
        aiSections: { structure: 'ready' },
      }, word)
    }

    const raw = await fetchAiDictionaryWordExamples(config, word.name, trans)
    if (!raw?.examples?.length) throw new Error('例句数据为空')
    await saveWordOverride(word.id, word.name, { examples: raw.examples })
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
      updated && isSectionReady(updated, section)
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

/** 在卡片实际需要某类富数据时才触发 AI 补全（支持缺失自动触发）。 */
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
    if (!aiConfig.apiKey?.trim()) return

    for (const section of sectionsKey.split(',').filter(Boolean) as AiWordSection[]) {
      if (isSectionReady(word, section)) continue
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

  const effectiveWord =
    resolved?.word.id === word.id && resolved.fingerprint === fingerprint
      ? { ...word, ...resolved.word }
      : word

  const pendingSections = { ...(effectiveWord.aiSections || {}) }
  let hasPending = false
  for (const section of sections) {
    if (!isSectionReady(effectiveWord, section)) {
      if (aiConfig.apiKey?.trim()) {
        pendingSections[section] = 'pending'
        hasPending = true
      }
    }
  }
  return hasPending || effectiveWord.aiSections
    ? { ...effectiveWord, aiSections: pendingSections }
    : effectiveWord
}
