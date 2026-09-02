import Dexie, { type Table } from 'dexie'
import type { VocabularyBook, WordMasteryRecord, UnitProgressRecord, WordItem, WordOverrideRecord, WordEtymology } from '@/types'
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
}

/**
 * 记录单词练习结果 (支持存储完整 wordItem 保证错词本跨词库独立展示与练习)
 */
export async function recordWordAttempt(
  wordId: string,
  bookId: string,
  isCorrect: boolean,
  mode: 'learn' | 'dictation',
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
 * 彻底消除单个错词记录 (连续 3 次无误默写通关后调用)
 */
export async function eliminateErrorWord(wordId: string) {
  try {
    const existing = await db.wordRecords.get(wordId)
    if (existing) {
      await db.wordRecords.update(wordId, {
        isError: false,
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
 * 手动从错词本移除/删除单个错词
 */
export async function removeErrorWord(wordId: string) {
  try {
    const existing = await db.wordRecords.get(wordId)
    if (existing) {
      await db.wordRecords.update(wordId, {
        isError: false,
        consecutiveCorrectCount: 0,
        lastPracticedAt: Date.now(),
      })
    }
  } catch (err) {
    console.error('Failed to remove error word:', err)
  }
}

/**
 * 获取所有活跃待消灭的真实错词及完整信息
 */
export async function getActiveErrorWords(): Promise<{ word: WordItem; record: WordMasteryRecord }[]> {
  try {
    const records = await db.wordRecords.toArray()
    const errorRecords = records.filter((r) => r.isError)
    const result: { word: WordItem; record: WordMasteryRecord }[] = []

    for (const r of errorRecords) {
      if (r.wordItem) {
        result.push({ word: r.wordItem, record: r })
      }
    }
    return result
  } catch (err) {
    console.error('Failed to get active error words:', err)
    return []
  }
}

/**
 * 切换单词生词本加星状态
 */
export async function toggleStarWord(wordId: string, bookId: string): Promise<boolean> {
  try {
    const existing = await db.wordRecords.get(wordId)
    if (!existing) {
      await db.wordRecords.put({
        wordId,
        bookId,
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
    await db.wordRecords.update(wordId, { isStarred: nextStarred })
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

