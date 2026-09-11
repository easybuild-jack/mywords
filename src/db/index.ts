import Dexie, { type Table } from 'dexie'
import type { VocabularyBook, WordMasteryRecord, UnitProgressRecord, WordItem, WordOverrideRecord, WordEtymology, PracticeMode } from '@/types'
import { BUILTIN_BOOKS } from '@/resources/books'
import { buildWordId } from '@/lib/wordId'

const STORE_SCHEMA_V1: Record<string, string> = {
  books: 'id, name, category, isCustom, updatedAt',
  wordRecords: 'wordId, bookId, isMastered, isStarred, isError, lastPracticedAt',
  unitProgress: '[bookId+unitIndex], bookId, isFinished',
}

const STORE_SCHEMA_V3: Record<string, string> = {
  ...STORE_SCHEMA_V1,
  wordOverrides: 'wordId, name, updatedAt',
}

const STORE_SCHEMA_V4: Record<string, string> = {
  ...STORE_SCHEMA_V3,
  aiWordCache: 'id, name',
}

/**
 * 把同一个单词散落的多条记录合成一条：
 * 累计类字段相加，「当前状态」类字段取最近一次练习的那条，加星是用户意图不能丢。
 */
function mergeMasteryRecords(a: WordMasteryRecord, b: WordMasteryRecord): WordMasteryRecord {
  const latest = (b.lastPracticedAt || 0) >= (a.lastPracticedAt || 0) ? b : a
  const older = latest === b ? a : b

  return {
    ...latest,
    wordItem: latest.wordItem || older.wordItem,
    wordName: latest.wordName || older.wordName,
    totalPracticeCount: (a.totalPracticeCount || 0) + (b.totalPracticeCount || 0),
    dictationErrorCount: (a.dictationErrorCount || 0) + (b.dictationErrorCount || 0),
    isStarred: Boolean(a.isStarred || b.isStarred),
  }
}

export class MyWordsDatabase extends Dexie {
  books!: Table<VocabularyBook, string>
  wordRecords!: Table<WordMasteryRecord, string>
  unitProgress!: Table<UnitProgressRecord, string>
  wordOverrides!: Table<WordOverrideRecord, string>
  aiWordCache!: Table<WordItem, string>

  constructor() {
    super('MyWordsDB')
    this.version(1).stores(STORE_SCHEMA_V1)

    // v1 的 wordId 掺了随机数与时间戳，同一个单词每次加载都会写成一条新记录。
    // 改用拼写派生的确定性 id 后，把历史数据按拼写归并回同一条，避免错词本重复与进度归零。
    this.version(2)
      .stores(STORE_SCHEMA_V1)
      .upgrade(async (tx) => {
        const booksTable = tx.table<VocabularyBook, string>('books')
        const customBooks = await booksTable.toArray()
        for (const book of customBooks) {
          if (!book.words?.length) continue
          const rekeyed = book.words.map((w) => ({ ...w, id: buildWordId(w.name) }))
          await booksTable.put({ ...book, words: rekeyed })
        }

        const recordsTable = tx.table<WordMasteryRecord, string>('wordRecords')
        const legacyRecords = await recordsTable.toArray()

        const mergedById = new Map<string, WordMasteryRecord>()
        const consumedIds: string[] = []

        for (const record of legacyRecords) {
          const name = record.wordItem?.name || record.wordName
          // 连拼写都没有的记录无法归位（例如仅加星过、未练习过的词），原样留下
          if (!name) continue

          const canonicalId = buildWordId(name)
          const existing = mergedById.get(canonicalId)
          const next = existing ? mergeMasteryRecords(existing, record) : record

          mergedById.set(canonicalId, { ...next, wordId: canonicalId })
          consumedIds.push(record.wordId)
        }

        if (consumedIds.length) await recordsTable.bulkDelete(consumedIds)
        if (mergedById.size) await recordsTable.bulkPut(Array.from(mergedById.values()))
      })

    // v3: 增加用户自定义单词拆分与构词覆盖表
    this.version(3).stores(STORE_SCHEMA_V3)

    // v4: 增加 AI 字典单词本地缓存表
    this.version(4).stores(STORE_SCHEMA_V4)
  }

  async initializeDefaults() {
    for (const book of BUILTIN_BOOKS) {
      const existing = await this.books.get(book.id)
      if (!existing || !existing.isCustom) {
        await this.books.put(book)
      }
    }
  }
}

export const db = new MyWordsDatabase()

// 初始化默认词库
if (typeof window !== 'undefined') {
  db.initializeDefaults().catch(console.error)
  ;(window as any).__mywords_db = db
}


/**
 * 记录单词练习结果 (支持存储完整 wordItem 保证错词本跨词库独立展示与练习)
 */
export async function recordWordAttempt(
  wordId: string,
  bookId: string,
  isCorrect: boolean,
  mode: PracticeMode,
  wordItem?: WordItem
) {
  try {
    const existing = await db.wordRecords.get(wordId)
    const now = Date.now()

    if (!existing) {
      const isDictationError = !isCorrect && mode === 'dictation'
      const newRecord: WordMasteryRecord = {
        wordId,
        bookId,
        wordName: wordItem?.name,
        wordItem,
        isMastered: isCorrect && mode === 'dictation',
        isStarred: false,
        isError: isDictationError,
        totalPracticeCount: 1,
        dictationErrorCount: isDictationError ? 1 : 0,
        consecutiveCorrectCount: isCorrect && mode === 'dictation' ? 1 : 0,
        lastPracticedAt: now,
      }
      await db.wordRecords.put(newRecord)
      return newRecord
    }

    const consecutive = isCorrect && mode === 'dictation' ? existing.consecutiveCorrectCount + 1 : 0
    const dictationErrors = !isCorrect && mode === 'dictation' ? existing.dictationErrorCount + 1 : existing.dictationErrorCount

    // 只有在【默写模式】下出现错误或偷看提示才加入错词本；
    // 在【跟学模式】下的输入错误完全不记录为错词；
    // 连续正确 3 次且在默写模式下，自动移出错词本
    let isError = existing.isError
    if (mode === 'dictation') {
      if (!isCorrect) {
        isError = true
      } else if (consecutive >= 3) {
        isError = false
      }
    }
    const isMastered = consecutive >= 3 || (isCorrect && mode === 'dictation')

    const updated: WordMasteryRecord = {
      ...existing,
      wordItem: wordItem || existing.wordItem,
      wordName: wordItem?.name || existing.wordName,
      totalPracticeCount: existing.totalPracticeCount + 1,
      dictationErrorCount: dictationErrors,
      consecutiveCorrectCount: consecutive,
      isError,
      isMastered,
      lastPracticedAt: now,
    }

    await db.wordRecords.put(updated)
    return updated
  } catch (err) {
    console.error('Failed to record word attempt:', err)
  }
}

/**
 * 彻底消除单个生错词记录 (连续 3 次无误默写通关后调用)
 */
export async function eliminateErrorWord(wordId: string) {
  try {
    const existing = await db.wordRecords.get(wordId)
    if (existing) {
      await db.wordRecords.update(wordId, {
        isError: false,
        isStarred: false,
        isMastered: true,
        consecutiveCorrectCount: 3,
        lastPracticedAt: Date.now(),
      })
    }
  } catch (err) {
    console.error('Failed to eliminate error word:', err)
  }
}

/**
 * 手动从生错词本移除/删除单个生错词
 */
export async function removeErrorWord(wordId: string) {
  try {
    const existing = await db.wordRecords.get(wordId)
    if (existing) {
      await db.wordRecords.update(wordId, {
        isError: false,
        isStarred: false,
        consecutiveCorrectCount: 0,
        lastPracticedAt: Date.now(),
      })
    }
  } catch (err) {
    console.error('Failed to remove error word:', err)
  }
}

/**
 * 获取所有活跃待攻克的生错词（加星生词 + 默写错词）及完整信息
 */
export async function getActiveTroubleWords(): Promise<{ word: WordItem; record: WordMasteryRecord }[]> {
  try {
    const records = await db.wordRecords.toArray()
    const troubleRecords = records.filter((r) => r.isError || r.isStarred)
    const result: { word: WordItem; record: WordMasteryRecord }[] = []

    for (const r of troubleRecords) {
      if (r.wordItem) {
        result.push({ word: r.wordItem, record: r })
      } else if (r.wordName) {
        result.push({
          word: {
            id: r.wordId,
            name: r.wordName,
            syllables: [r.wordName],
            posList: [],
          },
          record: r,
        })
      }
    }
    return result
  } catch (err) {
    console.error('Failed to get active trouble words:', err)
    return []
  }
}

/** 向前兼容 */
export const getActiveErrorWords = getActiveTroubleWords

/**
 * 切换单词生词本加星状态
 */
export async function toggleStarWord(wordId: string, bookId: string, wordItem?: WordItem): Promise<boolean> {
  try {
    const existing = await db.wordRecords.get(wordId)
    if (!existing) {
      await db.wordRecords.put({
        wordId,
        bookId,
        wordName: wordItem?.name,
        wordItem,
        isMastered: false,
        isStarred: true,
        isError: false,
        totalPracticeCount: 0,
        dictationErrorCount: 0,
        consecutiveCorrectCount: 0,
        lastPracticedAt: Date.now(),
      })
      return true
    }

    const nextStarred = !existing.isStarred
    await db.wordRecords.update(wordId, {
      isStarred: nextStarred,
      wordItem: wordItem || existing.wordItem,
      wordName: wordItem?.name || existing.wordName,
    })
    return nextStarred
  } catch (err) {
    console.error('Failed to toggle star word:', err)
    return false
  }
}

/**
 * 取出全部自定义词库，供导入时选择目标。
 *
 * 只返回自定义词库：官方词库的词是从 /dicts 下的 JSON 按需加载的，
 * db.books 里那条只是占位（setBookId 还会主动删掉它），写进去也不会被读出来。
 */
export async function getCustomBooks(): Promise<VocabularyBook[]> {
  try {
    const all = await db.books.toArray()
    return all.filter((b) => b.isCustom).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  } catch (err) {
    console.error('Failed to load custom books:', err)
    return []
  }
}

/**
 * 把导入的单词并进已有词库：同名单词覆盖原条目，新词追加到末尾。
 *
 * 同名的判断直接用 id，它由拼写派生（见 buildWordId），所以"已存在"就是"拼写相同"。
 * 覆盖时保留原有位置，否则重新导入一遍会打乱整本书的顺序，章节划分跟着全变。
 */
export async function mergeWordsIntoBook(bookId: string, words: WordItem[]) {
  try {
    const book = await db.books.get(bookId)
    if (!book) return null

    const merged = [...(book.words || [])]
    const indexById = new Map(merged.map((word, index) => [word.id, index]))
    let updated = 0
    let added = 0

    for (const word of words) {
      const at = indexById.get(word.id)
      if (at === undefined) {
        indexById.set(word.id, merged.length)
        merged.push(word)
        added++
      } else {
        merged[at] = word
        updated++
      }
    }

    const nextBook: VocabularyBook = {
      ...book,
      words: merged,
      totalWords: merged.length,
      updatedAt: Date.now(),
    }

    await db.books.put(nextBook)
    return { book: nextBook, updated, added }
  } catch (err) {
    console.error('Failed to merge words into book:', err)
    return null
  }
}

/**
 * 保存自定义新词库
 */
export async function saveCustomVocabularyBook(name: string, description: string, words: WordItem[]) {
  const newBook: VocabularyBook = {
    id: `book_custom_${Date.now()}`,
    name: name.trim() || '自定义生词本',
    description: description.trim() || '用户自定义导入词库',
    category: 'custom',
    isCustom: true,
    unitSize: 20,
    totalWords: words.length,
    words,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await db.books.put(newBook)
  return newBook
}

/**
 * 删除用户自定义词库及关联的章节进度数据
 * 内置/官方词库受到保护，无法被删除
 */
export async function deleteCustomVocabularyBook(bookId: string): Promise<boolean> {
  try {
    const book = await db.books.get(bookId)
    // 保护：仅允许删除明确标记为自定义的词库
    if (!book || !book.isCustom) return false

    // 1. 删除词库主体
    await db.books.delete(bookId)

    // 2. 级联清理该词库的所有单元学习进度记录
    await db.unitProgress.where('bookId').equals(bookId).delete()

    return true
  } catch (err) {
    console.error('Failed to delete custom vocabulary book:', err)
    return false
  }
}

/**
 * 保存单个单词的用户自定义切分与构词覆盖
 * 1. 写入 wordOverrides 表
 * 2. 同步更新 wordRecords 中已有的离线快照
 * 3. 同步更新自定义词库中该词条的持久化数据
 */
export async function saveWordOverride(
  wordId: string,
  name: string,
  overrides: { syllables?: string[]; etymology?: WordEtymology; silentIndices?: number[] }
): Promise<WordOverrideRecord> {
  const cleanName = name.trim()
  const record: WordOverrideRecord = {
    wordId,
    name: cleanName,
    syllables: overrides.syllables,
    etymology: overrides.etymology,
    silentIndices: overrides.silentIndices,
    updatedAt: Date.now(),
  }

  try {
    await db.wordOverrides.put(record)

    // 1. 同步更新 wordRecords 快照
    const existingWordRecord = await db.wordRecords.get(wordId)
    if (existingWordRecord?.wordItem) {
      await db.wordRecords.update(wordId, {
        wordItem: {
          ...existingWordRecord.wordItem,
          syllables: overrides.syllables || existingWordRecord.wordItem.syllables,
          etymology: overrides.etymology !== undefined ? overrides.etymology : existingWordRecord.wordItem.etymology,
          silentIndices: overrides.silentIndices !== undefined ? overrides.silentIndices : existingWordRecord.wordItem.silentIndices,
        },
      })
    }

    // 2. 同步更新自定义词库中的条目
    const customBooks = await db.books.filter((b) => Boolean(b.isCustom)).toArray()
    for (const book of customBooks) {
      if (book.words?.some((w) => w.id === wordId || w.name.toLowerCase() === cleanName.toLowerCase())) {
        const updatedWords = book.words.map((w) => {
          if (w.id === wordId || w.name.toLowerCase() === cleanName.toLowerCase()) {
            return {
              ...w,
              syllables: overrides.syllables || w.syllables,
              etymology: overrides.etymology !== undefined ? overrides.etymology : w.etymology,
              silentIndices: overrides.silentIndices !== undefined ? overrides.silentIndices : w.silentIndices,
            }
          }
          return w
        })
        await db.books.update(book.id, {
          words: updatedWords,
          updatedAt: Date.now(),
        })
      }
    }
  } catch (err) {
    console.error('Failed to save word override:', err)
  }

  return record
}

/**
 * 查询单个单词的自定义覆盖
 */
export async function getWordOverride(wordId: string): Promise<WordOverrideRecord | undefined> {
  try {
    return await db.wordOverrides.get(wordId)
  } catch (err) {
    console.error('Failed to get word override:', err)
    return undefined
  }
}

/**
 * 查询全部单词覆盖
 */
export async function getAllWordOverrides(): Promise<WordOverrideRecord[]> {
  try {
    return await db.wordOverrides.toArray()
  } catch (err) {
    console.error('Failed to get all word overrides:', err)
    return []
  }
}

/**
 * =================================================================
 * AI 字典单词缓存相关操作（结构与 WordItem 完全一致）
 * =================================================================
 */

/**
 * 从 AI 单词缓存表中查询单词（大小写不敏感匹配）
 */
export async function getWordFromAiCache(cleanWord: string): Promise<WordItem | null> {
  if (!cleanWord || typeof window === 'undefined') return null
  try {
    const lower = cleanWord.trim().toLowerCase()
    const directId = buildWordId(lower)

    // 1. 优先根据确定性 wordId 直查
    const byId = await db.aiWordCache.get(directId)
    if (byId) return byId

    // 2. 备选：根据 name 字段做大小写不敏感匹配
    const byName = await db.aiWordCache
      .filter((item) => item.name?.toLowerCase() === lower)
      .first()

    return byName || null
  } catch (err) {
    console.warn('Failed to query AI word cache:', err)
    return null
  }
}

/**
 * 将 AI 字典生成的完整 WordItem 存入缓存表
 */
export async function saveWordToAiCache(wordItem: WordItem): Promise<void> {
  if (!wordItem?.name || typeof window === 'undefined') return
  try {
    const canonicalId = buildWordId(wordItem.name)
    await db.aiWordCache.put({
      ...wordItem,
      id: canonicalId,
    })
  } catch (err) {
    console.warn('Failed to save word to AI cache:', err)
  }
}

/**
 * 前缀检索 AI 缓存中的单词（用于搜索下拉建议）
 */
export async function searchWordsInAiCache(
  prefix: string,
  limit: number = 6
): Promise<WordItem[]> {
  if (!prefix || typeof window === 'undefined') return []
  try {
    const lower = prefix.trim().toLowerCase()
    return await db.aiWordCache
      .filter((item) => Boolean(item.name?.toLowerCase().startsWith(lower)))
      .limit(limit)
      .toArray()
  } catch {
    return []
  }
}

/**
 * 清空 AI 字典缓存
 */
export async function clearAiWordCache(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    await db.aiWordCache.clear()
  } catch (err) {
    console.warn('Failed to clear AI word cache:', err)
  }
}

/**
 * 从 AI 缓存表中删除指定单词（单词有了具体词库归属后移出缓存）
 */
export async function deleteWordFromAiCache(cleanWord: string): Promise<void> {
  if (!cleanWord || typeof window === 'undefined') return
  try {
    const lower = cleanWord.trim().toLowerCase()
    const directId = buildWordId(lower)
    await db.aiWordCache.delete(directId)
    // 防御性清除以 name 匹配的条目
    await db.aiWordCache.filter((item) => item.name?.toLowerCase() === lower).delete()
  } catch (err) {
    console.warn('Failed to delete word from AI cache:', err)
  }
}

/**
 * 批量从 AI 缓存表中删除单词
 */
export async function deleteWordsFromAiCache(wordNames: string[]): Promise<void> {
  if (!wordNames?.length || typeof window === 'undefined') return
  try {
    const lowerNames = wordNames.map((w) => w.trim().toLowerCase()).filter(Boolean)
    if (!lowerNames.length) return

    const ids = lowerNames.map((w) => buildWordId(w))
    await db.aiWordCache.bulkDelete(ids)

    const lowerSet = new Set(lowerNames)
    await db.aiWordCache.filter((item) => lowerSet.has(item.name?.toLowerCase())).delete()
  } catch (err) {
    console.warn('Failed to bulk delete words from AI cache:', err)
  }
}



