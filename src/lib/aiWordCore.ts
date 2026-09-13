'use client'

import { dictionaryLoader } from '@/core/dictionaryLoader'
import { getWordFromAiCache, getWordOverride, mergeWordIntoAiCache, saveWordOverride } from '@/db'
import {
  fetchAiDictionaryWordCore,
  getAiConfigFingerprint,
  type AiClientConfig,
} from '@/lib/aiClient'
import { isLikelyEnglishWord } from '@/lib/wordValidation'
import { buildWordId } from '@/lib/wordId'
import type { WordItem, WordOverrideRecord } from '@/types'

const inFlightCore = new Map<string, Promise<WordItem | null>>()

function isAiPhoneticReady(word: string, value?: string): boolean {
  const normalizedName = word.trim().toLowerCase()
  const raw = value?.trim() || ''
  const normalized = raw.replace(/^\/+|\/+$/g, '').trim()
  return Boolean(normalized && raw.toLowerCase() !== `/ ${normalizedName} /`)
}

function isAiMeaningReady(posList: WordItem['posList']): boolean {
  return Boolean(posList?.some(({ means }) =>
    means.some((meaning) => {
      const normalized = meaning.trim()
      return normalized && normalized !== '核心词义' && normalized !== '暂无释义'
    })
  ))
}

export function mergeAiWordCore(current: WordItem, generated: WordItem): WordItem {
  return {
    ...current,
    phoneticUs: isAiPhoneticReady(current.name, current.phoneticUs)
      ? current.phoneticUs
      : generated.phoneticUs,
    phoneticUk: isAiPhoneticReady(current.name, current.phoneticUk)
      ? current.phoneticUk
      : generated.phoneticUk,
    posList: isAiMeaningReady(current.posList) ? current.posList : generated.posList,
  }
}

export function isAiWordCoreReady(word: WordItem): boolean {
  return Boolean(
    isAiPhoneticReady(word.name, word.phoneticUs) &&
    isAiPhoneticReady(word.name, word.phoneticUk) &&
    isAiMeaningReady(word.posList)
  )
}

/** 查询并缓存音标、释义，不生成构词、例句和短语。 */
export function queryAiWordCore(
  config: AiClientConfig,
  word: string,
  fallback?: WordItem
): Promise<WordItem | null> {
  if (!isLikelyEnglishWord(word)) return Promise.resolve(null)

  const key = `${getAiConfigFingerprint(config)}::${word.trim().toLowerCase()}`
  const existing = inFlightCore.get(key)
  if (existing) return existing

  const task = (async () => {
    const cached = await getWordFromAiCache(word)
    const current = cached && fallback
      ? mergeAiWordCore(fallback, cached)
      : cached || fallback
    if (current && isAiWordCoreReady(current)) return current
    if (config.enabled === false || !config.apiKey?.trim()) return current || null
    const overrideBefore = await getWordOverride(current?.id || cached?.id || buildWordId(word))

    const raw = await fetchAiDictionaryWordCore(config, word)
    if (!raw) return null
    const coreWord = await dictionaryLoader.convertRawEntryToWordItem(raw)
    const merged = current ? mergeAiWordCore(current, coreWord) : coreWord
    const overridePatch: Partial<WordOverrideRecord> = {
      phoneticUs:
        !current || !isAiPhoneticReady(current.name, current.phoneticUs)
          ? merged.phoneticUs
          : undefined,
      phoneticUk:
        !current || !isAiPhoneticReady(current.name, current.phoneticUk)
          ? merged.phoneticUk
          : undefined,
      posList:
        !current || !isAiMeaningReady(current.posList)
          ? merged.posList
          : undefined,
    }
    const keys = (['phoneticUs', 'phoneticUk', 'posList'] as const)
      .filter((key) => overridePatch[key] !== undefined)
    const savedOverride = await saveWordOverride(merged.id, merged.name, overridePatch, {
      keys: [...keys],
      snapshot: JSON.stringify(keys.map((key) => overrideBefore?.[key])),
    })
    const finalWord = {
      ...merged,
      ...Object.fromEntries(keys.map((key) => [key, savedOverride[key]])),
    }

    return await mergeWordIntoAiCache(
      {
        name: finalWord.name,
        phoneticUs: finalWord.phoneticUs,
        phoneticUk: finalWord.phoneticUk,
        posList: finalWord.posList,
      },
      finalWord
    )
  })().finally(() => {
    if (inFlightCore.get(key) === task) inFlightCore.delete(key)
  })
  inFlightCore.set(key, task)
  return task
}
