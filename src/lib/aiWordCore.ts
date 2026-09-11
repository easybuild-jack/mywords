'use client'

import { dictionaryLoader } from '@/core/dictionaryLoader'
import { getWordFromAiCache, mergeWordIntoAiCache } from '@/db'
import {
  fetchAiDictionaryWordCore,
  type AiClientConfig,
} from '@/lib/aiClient'
import { isLikelyEnglishWord } from '@/lib/wordValidation'
import type { WordItem } from '@/types'

const inFlightCore = new Map<string, Promise<WordItem | null>>()

function configFingerprint(config: AiClientConfig) {
  return `${config.endpoint}::${config.model}::${config.apiKey}`
}

/** 查询并缓存音标、释义，不生成构词、例句和短语。 */
export function queryAiWordCore(
  config: AiClientConfig,
  word: string
): Promise<WordItem | null> {
  if (!isLikelyEnglishWord(word)) return Promise.resolve(null)

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
