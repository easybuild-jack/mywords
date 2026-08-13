import Dexie, { type Table } from 'dexie'
import type { VocabularyBook, WordMasteryRecord, UnitProgressRecord, WordItem } from '@/types'
import { BUILTIN_BOOKS } from '@/resources/books'
import { buildWordId } from '@/lib/wordId'

const STORE_SCHEMA: Record<string, string> = {
  books: 'id, name, category, isCustom, updatedAt',
  wordRecords: 'wordId, bookId, isMastered, isStarred, isError, lastPracticedAt',
  unitProgress: '[bookId+unitIndex], bookId, isFinished',
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

  constructor() {
    super('MyWordsDB')
    this.version(1).stores(STORE_SCHEMA)

    // v1 的 wordId 掺了随机数与时间戳，同一个单词每次加载都会写成一条新记录。
    // 改用拼写派生的确定性 id 后，把历史数据按拼写归并回同一条，避免错词本重复与进度归零。
    this.version(2)
      .stores(STORE_SCHEMA)
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
