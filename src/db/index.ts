import Dexie, { type Table } from 'dexie'
import type { VocabularyBook, WordMasteryRecord, UnitProgressRecord, WordItem } from '@/types'
import { BUILTIN_BOOKS } from '@/resources/books'

export class MyWordsDatabase extends Dexie {
  books!: Table<VocabularyBook, string>
  wordRecords!: Table<WordMasteryRecord, string>
  unitProgress!: Table<UnitProgressRecord, string>

  constructor() {
    super('MyWordsDB')
    this.version(1).stores({
      books: 'id, name, category, isCustom, updatedAt',
      wordRecords: 'wordId, bookId, isMastered, isStarred, isError, lastPracticedAt',
      unitProgress: '[bookId+unitIndex], bookId, isFinished',
    })
  }

  async initializeDefaults() {
    const existingCount = await this.books.count()
    if (existingCount === 0) {
      await this.books.bulkPut(BUILTIN_BOOKS)
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
      const newRecord: WordMasteryRecord = {
        wordId,
        bookId,
        wordName: wordItem?.name,
        wordItem,
        isMastered: isCorrect && mode === 'dictation',
        isStarred: false,
        isError: !isCorrect,
        totalPracticeCount: 1,
        dictationErrorCount: isCorrect ? 0 : 1,
        consecutiveCorrectCount: isCorrect ? 1 : 0,
        lastPracticedAt: now,
      }
      await db.wordRecords.put(newRecord)
      return newRecord
    }

    const consecutive = isCorrect ? existing.consecutiveCorrectCount + 1 : 0
    const dictationErrors = !isCorrect ? existing.dictationErrorCount + 1 : existing.dictationErrorCount
    // 连续正确 2 次且在默写模式下，自动移出错词本
    const isError = !isCorrect ? true : (consecutive >= 2 ? false : existing.isError)
    const isMastered = consecutive >= 2 || (isCorrect && mode === 'dictation')

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
