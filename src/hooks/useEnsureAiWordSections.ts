'use client'

import { useEffect, useRef, useState } from 'react'
import { dictionaryLoader } from '@/core/dictionaryLoader'
import { getWordFromAiCache, getWordOverride, mergeWordIntoAiCache, saveWordOverride } from '@/db'
import {
  fetchAiDictionaryWordEtymology,
  fetchAiDictionaryWordExamples,
  fetchAiDictionaryWordPhrases,
  fetchAiDictionaryWordSyllables,
  hasValidEtymology,
  type AiClientConfig,
} from '@/lib/aiClient'
import { isAiWordCoreReady, mergeAiWordCore, queryAiWordCore } from '@/lib/aiWordCore'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { WordItem, WordOverrideRecord } from '@/types'

export type AiWordSection = 'core' | 'syllables' | 'examples' | 'phrases' | 'etymology'

const inFlightSections = new Map<
  string,
  { fingerprint: string; promise: Promise<WordItem | null> }
>()

function configFingerprint(config: AiClientConfig) {
  return `${config.enabled !== false}::${config.endpoint}::${config.model}::${config.apiKey}`
}

export function isSectionReady(word: WordItem, section: AiWordSection): boolean {
  if (section === 'core') return isAiWordCoreReady(word)
  if (section === 'syllables') {
    return Boolean(
      word.syllables?.length &&
      word.syllables.join('').toLowerCase() === word.name.toLowerCase() &&
      Array.isArray(word.silentIndices)
    )
  }
  if (section === 'examples') return Boolean(word.examples?.length)
  if (section === 'phrases') {
    const phrases = word.phrases || []
    const isLegacyPlaceholder =
      phrases.length === 1 &&
      phrases[0].en.trim().toLowerCase() === word.name.trim().toLowerCase()
    return phrases.length > 0 && !isLegacyPlaceholder
  }
  return hasValidEtymology(word.etymology)
}

function mergeSectionWord(
  current: WordItem,
  updated: WordItem,
  section: AiWordSection
): WordItem {
  if (section === 'core') {
    return mergeAiWordCore(current, updated)
  }
  if (section === 'syllables') {
    return {
      ...current,
      syllables: updated.syllables,
      silentIndices: updated.silentIndices,
      aiSections: { ...current.aiSections, ...updated.aiSections },
    }
  }
  if (section === 'examples') {
    return {
      ...current,
      examples: updated.examples,
      aiSections: { ...current.aiSections, ...updated.aiSections },
    }
  }
  if (section === 'phrases') {
    return {
      ...current,
      phrases: updated.phrases,
      aiSections: { ...current.aiSections, ...updated.aiSections },
    }
  }
  return {
    ...current,
    etymology: updated.etymology,
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

type WordOverride = Awaited<ReturnType<typeof getWordOverride>>

function overrideKeys(section: AiWordSection): (keyof WordOverrideRecord)[] {
  if (section === 'syllables') return ['syllables', 'silentIndices']
  if (section === 'examples') return ['examples']
  if (section === 'phrases') return ['phrases']
  if (section === 'etymology') return ['etymology']
  return []
}

function overrideValue(
  record: Partial<WordOverrideRecord> | undefined,
  section: AiWordSection
): unknown {
  if (section === 'syllables') return [record?.syllables, record?.silentIndices]
  if (section === 'examples') return record?.examples
  if (section === 'phrases') return record?.phrases
  if (section === 'etymology') return record?.etymology
  return undefined
}

function sectionOverridePatch(
  record: WordOverride,
  section: AiWordSection
): Partial<WordItem> {
  if (!record) return {}
  if (section === 'syllables') {
    return { syllables: record.syllables, silentIndices: record.silentIndices }
  }
  if (section === 'examples') return { examples: record.examples }
  if (section === 'phrases') return { phrases: record.phrases }
  if (section === 'etymology') return { etymology: record.etymology }
  return {}
}

async function generateSection(
  config: AiClientConfig,
  snapshot: WordItem,
  section: AiWordSection
): Promise<WordItem | null> {
  const cached = await getWordFromAiCache(snapshot.name)
  let word = cached ? { ...snapshot, ...cached } : snapshot
  if (isSectionReady(word, section)) return word
  const overrideBefore = section === 'core' ? undefined : await getWordOverride(word.id)

  try {
    if (section === 'core') {
      const updated = await queryAiWordCore(config, word.name, word)
      return updated && isAiWordCoreReady(updated)
        ? mergeSectionWord(word, updated, 'core')
        : null
    }

    if (!isAiWordCoreReady(word)) {
      const core = await ensureSection(config, word, 'core')
      if (!core || !isAiWordCoreReady(core)) {
        throw new Error('基础音标或译文补全失败')
      }
      word = mergeSectionWord(word, core, 'core')
    }

    await mergeWordIntoAiCache(
      { name: word.name, aiSections: { [section]: 'pending' } },
      word
    )

    const trans = word.posList.map(
      ({ pos, means }) => `${pos} ${means.join('；')}`
    )
    let patch: Partial<WordItem>

    if (section === 'syllables') {
      const raw = await fetchAiDictionaryWordSyllables(config, word.name, {
        trans,
        usphone: word.phoneticUs?.replace(/^\/+|\/+$/g, ''),
        ukphone: word.phoneticUk?.replace(/^\/+|\/+$/g, ''),
      })
      if (!raw) throw new Error('拼读拆分数据为空')
      const converted = await dictionaryLoader.convertRawEntryToWordItem(raw)
      patch = {
        syllables: converted.syllables,
        silentIndices: converted.silentIndices,
      }
    } else if (section === 'examples') {
      const raw = await fetchAiDictionaryWordExamples(config, word.name, trans)
      if (!raw?.examples?.length) throw new Error('例句数据为空')
      patch = { examples: raw.examples }
    } else if (section === 'phrases') {
      const raw = await fetchAiDictionaryWordPhrases(config, word.name, trans)
      if (!raw?.phrases?.length) throw new Error('短语数据为空')
      patch = { phrases: raw.phrases }
    } else {
      const raw = await fetchAiDictionaryWordEtymology(config, word.name, trans)
      if (!raw?.etymology) throw new Error('词根词源数据为空')
      patch = { etymology: raw.etymology }
    }

    const keys = overrideKeys(section)
    const savedOverride = await saveWordOverride(word.id, word.name, patch, {
      keys,
      snapshot: JSON.stringify(keys.map((key) => overrideBefore?.[key])),
    })
    if (
      JSON.stringify(overrideValue(savedOverride, section)) !==
      JSON.stringify(overrideValue(patch, section))
    ) {
      const manualPatch = sectionOverridePatch(savedOverride, section)
      const manuallyUpdated = { ...word, ...manualPatch }
      return await mergeWordIntoAiCache(
        {
          name: word.name,
          ...manualPatch,
          aiSections: { [section]: 'ready' },
        },
        manuallyUpdated
      )
    }

    return await mergeWordIntoAiCache(
      {
        name: word.name,
        ...patch,
        aiSections: { [section]: 'ready' },
      },
      word
    )
  } catch (error) {
    console.warn(`AI word ${section} query failed:`, error)
    if (section === 'core') return null
    return await mergeWordIntoAiCache(
      { name: word.name, aiSections: { [section]: 'error' } },
      word
    )
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

/** 只为页面当前显示且确实缺失的模块触发独立 AI 查询。 */
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
  const canUseAi = aiConfig.enabled !== false && Boolean(aiConfig.apiKey?.trim())

  useEffect(() => {
    attemptedRef.current.clear()
    contextRef.current = contextKey
    return () => {
      if (contextRef.current === contextKey) contextRef.current = null
    }
  }, [contextKey])

  useEffect(() => {
    const visible = new Set(sectionsKey.split(',').filter(Boolean))
    for (const key of attemptedRef.current) {
      const section = key.slice(key.lastIndexOf('::') + 2)
      if (!visible.has(section)) attemptedRef.current.delete(key)
    }
  }, [sectionsKey])

  useEffect(() => {
    if (!canUseAi) return

    for (const section of sectionsKey.split(',').filter(Boolean) as AiWordSection[]) {
      if (isSectionReady(word, section)) continue
      const attemptKey = `${fingerprint}::${word.id}::${section}`
      if (attemptedRef.current.has(attemptKey)) continue
      attemptedRef.current.add(attemptKey)

      if (section !== 'core') {
        queueMicrotask(() => {
          if (contextRef.current !== contextKey) return
          setResolved((current) => ({
            fingerprint,
            word: {
              ...(current?.word.id === word.id ? current.word : word),
              aiSections: {
                ...(current?.word.id === word.id ? current.word.aiSections : word.aiSections),
                [section]: 'pending',
              },
            },
          }))
        })
      }

      void ensureSection(aiConfig, word, section)
        .then((updated) => {
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
        .catch((error) => {
          console.warn(`AI word ${section} query failed:`, error)
        })
    }
  }, [aiConfig, canUseAi, contextKey, fingerprint, sectionsKey, word])

  const effectiveWord =
    resolved?.word.id === word.id && resolved.fingerprint === fingerprint
      ? { ...word, ...resolved.word }
      : word

  const pendingSections = { ...(effectiveWord.aiSections || {}) }
  let hasPending = false
  for (const section of sections) {
    if (section !== 'core' && !isSectionReady(effectiveWord, section) && canUseAi) {
      if (pendingSections[section] !== 'error') {
        pendingSections[section] = 'pending'
        hasPending = true
      }
    }
  }
  return hasPending || effectiveWord.aiSections
    ? { ...effectiveWord, aiSections: pendingSections }
    : effectiveWord
}
