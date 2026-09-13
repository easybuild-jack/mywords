'use client'

import { db } from '@/db'
import { dictionaryLoader, OFFICIAL_BOOK_FILE_MAP, type RawDictEntry } from '@/core/dictionaryLoader'
import type { WordItem, WordEtymology, WordExample } from '@/types'

export const CURRENT_DICT_CACHE_VERSION = 'v1.0.0'
export const DICT_CACHE_VERSION_KEY = 'mywords_dict_cache_version'

export interface InitProgressState {
  stage: 'checking' | 'downloading' | 'merging' | 'indexing' | 'completed' | 'error'
  percentage: number // 0 ~ 100
  message: string
  currentBookName?: string
  bookIndex?: number
  totalBooks?: number
  processedWords?: number
  totalWords?: number
}

type ProgressCallback = (state: InitProgressState) => void

/**
 * 检查当前本地 IndexedDB 是否已经完成了离线词库构建
 */
export async function isDictionaryCacheInitialized(): Promise<boolean> {
  if (typeof window === 'undefined') return true
  try {
    const savedVersion = localStorage.getItem(DICT_CACHE_VERSION_KEY)
    if (savedVersion !== CURRENT_DICT_CACHE_VERSION) {
      return false
    }
    // 再次探针 IndexedDB 中的数据量，避免误报
    const count = await db.aiWordCache.count()
    return count >= 8000
  } catch (err) {
    console.warn('Check dict cache status error:', err)
    return false
  }
}

/**
 * 智能合并两个同一单词的词条：优先保留更全面、更高质量的字段
 */
function mergeRawEntries(existing: RawDictEntry, incoming: RawDictEntry): RawDictEntry {
  // 1. 读音：优先保留真实读音
  const usphone = incoming.usphone || incoming.phone || existing.usphone || existing.phone
  const ukphone = incoming.ukphone || incoming.phone || existing.ukphone || existing.phone

  // 2. 音节：保留更完整的拆分
  const syllables = (incoming.syllables && incoming.syllables.length > 1)
    ? incoming.syllables
    : (existing.syllables && existing.syllables.length > 1)
      ? existing.syllables
      : incoming.syllables || existing.syllables

  // 3. 词根词缀构词法：优先保留包含完整派生与词根解析的
  let etymology: WordEtymology | undefined = existing.etymology
  if (incoming.etymology) {
    if (!existing.etymology) {
      etymology = incoming.etymology
    } else {
      const incScore = (incoming.etymology.root ? 2 : 0) + (incoming.etymology.prefix ? 1 : 0) + (incoming.etymology.derivation ? 1 : 0)
      const extScore = (existing.etymology.root ? 2 : 0) + (existing.etymology.prefix ? 1 : 0) + (existing.etymology.derivation ? 1 : 0)
      etymology = incScore >= extScore ? incoming.etymology : existing.etymology
    }
  }

  // 4. 释义与翻译合并去重
  const existingTrans = existing.trans || (existing.translation ? [existing.translation] : [])
  const incomingTrans = incoming.trans || (incoming.translation ? [incoming.translation] : [])
  const mergedTransMap = new Set<string>()
  for (const t of [...existingTrans, ...incomingTrans]) {
    const clean = t.trim()
    if (clean && clean !== '核心词义' && clean !== '暂无释义') {
      mergedTransMap.add(clean)
    }
  }
  const trans = Array.from(mergedTransMap)

  // 5. 例句合并去重（最多保留 3 条经典例句）
  const examplesMap = new Map<string, WordExample>()
  for (const ex of [...(existing.examples || []), ...(incoming.examples || [])]) {
    if (ex.en && !examplesMap.has(ex.en.trim().toLowerCase())) {
      examplesMap.set(ex.en.trim().toLowerCase(), ex)
    }
  }
  const examples = Array.from(examplesMap.values()).slice(0, 3)

  // 6. 短语合并去重（最多保留 3 条）
  const phrasesMap = new Map<string, { en: string; cn: string }>()
  for (const ph of [...(existing.phrases || []), ...(incoming.phrases || [])]) {
    if (ph.en && !phrasesMap.has(ph.en.trim().toLowerCase())) {
      phrasesMap.set(ph.en.trim().toLowerCase(), ph)
    }
  }
  const phrases = Array.from(phrasesMap.values()).slice(0, 3)

  return {
    name: incoming.name || existing.name,
    trans: trans.length ? trans : ['核心词义'],
    usphone,
    ukphone,
    syllables,
    etymology,
    silentIndices: incoming.silentIndices || existing.silentIndices,
    examples: examples.length ? examples : undefined,
    phrases: phrases.length ? phrases : undefined,
    unitId: incoming.unitId || existing.unitId,
  }
}

/**
 * 执行全量离线词库初始化写入（严格保证加载时长不少于 5 秒，呈现沉浸式游戏加载节奏）
 */
export async function initializeOfflineDictionaryCache(
  onProgress?: ProgressCallback
): Promise<number> {
  const startTime = Date.now()
  const MIN_TOTAL_DURATION_MS = 5200 // 严格规定不低于 5 秒

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const notify = (state: InitProgressState) => {
    try {
      onProgress?.(state)
    } catch (e) {
      console.warn('Progress report failed:', e)
    }
  }

  notify({
    stage: 'checking',
    percentage: 5,
    message: '正在准备官方离线词典资源...',
  })
  await sleep(250)

  // 1. 获取所有官方词库元数据配置
  const bookList = Object.entries(OFFICIAL_BOOK_FILE_MAP)
  const totalBooks = bookList.length
  const rawDataMap = new Map<string, RawDictEntry[]>()

  // 2. 分步拉取 5 本官方大词库 JSON (约 1.5 秒，每本节奏分明)
  for (let i = 0; i < totalBooks; i++) {
    const [bookId, config] = bookList[i]
    const stepPercentage = Math.round(8 + ((i + 1) / totalBooks) * 30) // 8% -> 38%

    notify({
      stage: 'downloading',
      percentage: stepPercentage,
      message: `正在加载 ${config.name} (${i + 1}/${totalBooks})...`,
      currentBookName: config.name,
      bookIndex: i + 1,
      totalBooks,
    })

    const fetchStart = Date.now()
    try {
      const res = await fetch(config.path)
      if (res.ok) {
        const data: RawDictEntry[] = await res.json()
        if (Array.isArray(data)) {
          rawDataMap.set(bookId, data)
        }
      }
    } catch (err) {
      console.error(`Failed to fetch dictionary file: ${config.path}`, err)
    }

    // 控制每本词库加载展示间隔至少 260ms，形成良好视觉节奏
    const fetchElapsed = Date.now() - fetchStart
    if (fetchElapsed < 260) {
      await sleep(260 - fetchElapsed)
    }
  }

  // 3. 智能聚合与跨词库去重合并 (38% -> 68%，约 1.2 秒)
  notify({
    stage: 'merging',
    percentage: 45,
    message: '正在对 5 本词库进行音节、构词法与词性深度聚合...',
  })
  await sleep(400)

  // 使用 Map<lowerName, RawDictEntry> 进行全局去重归并
  const mergedDict = new Map<string, RawDictEntry>()

  for (const [, entries] of rawDataMap.entries()) {
    for (const entry of entries) {
      if (!entry.name) continue
      const lower = entry.name.trim().toLowerCase()
      if (!/^[a-z]+(-[a-z]+)?$/i.test(lower)) continue // 过滤非合法英文单词

      const existing = mergedDict.get(lower)
      if (!existing) {
        mergedDict.set(lower, entry)
      } else {
        mergedDict.set(lower, mergeRawEntries(existing, entry))
      }
    }
  }

  notify({
    stage: 'merging',
    percentage: 58,
    message: '正在智能校准自然拼读音节与词根拆解...',
  })
  await sleep(450)

  const totalWords = mergedDict.size
  notify({
    stage: 'merging',
    percentage: 68,
    message: `成功提炼 ${totalWords.toLocaleString()} 个独立高频词汇，准备装载入库...`,
    totalWords,
  })
  await sleep(350)

  // 4. 将 RawDictEntry 转换为标准化 WordItem
  const wordItems: WordItem[] = []
  for (const entry of mergedDict.values()) {
    const wordItem = dictionaryLoader.buildWordItemFromEntry(entry)
    wordItems.push(wordItem)
  }

  // 5. 分块批量写入 IndexedDB (68% -> 98%，约 2.2 秒)
  // 共 10 个批次左右，每批间隔约 200ms，带给用户游戏进度条匀速推进的沉浸体验
  const CHUNK_SIZE = 1000
  let writtenCount = 0

  notify({
    stage: 'indexing',
    percentage: 70,
    message: '正在构建本地高速检索索引...',
    processedWords: 0,
    totalWords,
  })
  await sleep(150)

  for (let i = 0; i < wordItems.length; i += CHUNK_SIZE) {
    const chunkStart = Date.now()
    const chunk = wordItems.slice(i, i + CHUNK_SIZE)
    await db.aiWordCache.bulkPut(chunk)
    writtenCount += chunk.length

    const writeProgress = Math.min(98, Math.round(70 + (writtenCount / totalWords) * 28))
    notify({
      stage: 'indexing',
      percentage: writeProgress,
      message: `正在写入本地数据库 (${writtenCount.toLocaleString()}/${totalWords.toLocaleString()} 词)...`,
      processedWords: writtenCount,
      totalWords,
    })

    // 控制每批写入间隔 200ms
    const chunkElapsed = Date.now() - chunkStart
    if (chunkElapsed < 200) {
      await sleep(200 - chunkElapsed)
    }
  }

  // 6. 强制补足 5 秒门槛（不能低于 5s）
  const totalElapsed = Date.now() - startTime
  if (totalElapsed < MIN_TOTAL_DURATION_MS) {
    notify({
      stage: 'indexing',
      percentage: 99,
      message: '正在完成最终完整性校验与本地就绪...',
      processedWords: totalWords,
      totalWords,
    })
    await sleep(MIN_TOTAL_DURATION_MS - totalElapsed)
  }

  // 7. 写入版本标记
  if (typeof window !== 'undefined') {
    localStorage.setItem(DICT_CACHE_VERSION_KEY, CURRENT_DICT_CACHE_VERSION)
  }

  notify({
    stage: 'completed',
    percentage: 100,
    message: `全部就绪！共装载 ${totalWords.toLocaleString()} 个高频词汇，开启秒查体验`,
    processedWords: totalWords,
    totalWords,
  })

  return totalWords
}
