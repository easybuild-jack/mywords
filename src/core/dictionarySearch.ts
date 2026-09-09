import type { WordItem } from '@/types'
import { dictionaryLoader, OFFICIAL_BOOK_FILE_MAP } from '@/core/dictionaryLoader'
import { db } from '@/db'

export interface DictSearchResult {
  word: WordItem
  sourceBookId: string
  sourceBookName: string
  isCurrentBook: boolean
}

export interface DictSuggestionItem {
  name: string
  meaning: string
  sourceBookName: string
  isCurrentBook: boolean
}

// 内存快速检索缓存，避免重复检索
const searchResultCache = new Map<string, DictSearchResult | null>()

/**
 * 核心查词方法：
 * 1. 默认从当前学习的词库检索
 * 2. 检索不到再从其他官方/自定义词库检索
 * 3. 最终查询不到，返回 null
 */
export async function searchWordAcrossDictionaries(
  query: string,
  currentBookId: string = 'book_cet4',
  currentBookName: string = 'CET-4 核心词库'
): Promise<DictSearchResult | null> {
  const clean = query.trim().toLowerCase()
  if (!clean) return null

  const cacheKey = `${currentBookId}::${clean}`
  if (searchResultCache.has(cacheKey)) {
    return searchResultCache.get(cacheKey) || null
  }

  // ---- 阶段 1：优先检索当前词库 ----
  // 1.1 当前为自定义词库
  if (currentBookId.startsWith('book_custom_')) {
    try {
      const customBook = await db.books.get(currentBookId)
      if (customBook?.words?.length) {
        const found = customBook.words.find((w) => w.name.toLowerCase() === clean)
        if (found) {
          const result: DictSearchResult = {
            word: found,
            sourceBookId: currentBookId,
            sourceBookName: customBook.name,
            isCurrentBook: true,
          }
          searchResultCache.set(cacheKey, result)
          return result
        }
      }
    } catch (err) {
      console.warn('Failed to search in current custom book:', err)
    }
  } else {
    // 1.2 当前为官方词库
    const officialEntries = await dictionaryLoader.loadAllBookRawWords(currentBookId)
    const match = officialEntries.find((entry) => entry.name?.toLowerCase() === clean)
    if (match) {
      const word = await dictionaryLoader.convertRawEntryToWordItem(match)
      const bookConfig = OFFICIAL_BOOK_FILE_MAP[currentBookId]
      const result: DictSearchResult = {
        word,
        sourceBookId: currentBookId,
        sourceBookName: bookConfig?.name || currentBookName,
        isCurrentBook: true,
      }
      searchResultCache.set(cacheKey, result)
      return result
    }
  }

  // ---- 阶段 2：检索不到再从其他官方词库检索 ----
  const otherOfficialBookIds = Object.keys(OFFICIAL_BOOK_FILE_MAP).filter((id) => id !== currentBookId)
  for (const bookId of otherOfficialBookIds) {
    const entries = await dictionaryLoader.loadAllBookRawWords(bookId)
    const match = entries.find((entry) => entry.name?.toLowerCase() === clean)
    if (match) {
      const word = await dictionaryLoader.convertRawEntryToWordItem(match)
      const bookConfig = OFFICIAL_BOOK_FILE_MAP[bookId]
      const result: DictSearchResult = {
        word,
        sourceBookId: bookId,
        sourceBookName: bookConfig?.name || '官方扩展词库',
        isCurrentBook: false,
      }
      searchResultCache.set(cacheKey, result)
      return result
    }
  }

  // ---- 阶段 3：从其他自定义词库检索 ----
  try {
    const customBooks = await db.books.filter((b) => Boolean(b.isCustom && b.id !== currentBookId)).toArray()
    for (const book of customBooks) {
      if (book.words?.length) {
        const found = book.words.find((w) => w.name.toLowerCase() === clean)
        if (found) {
          const result: DictSearchResult = {
            word: found,
            sourceBookId: book.id,
            sourceBookName: book.name,
            isCurrentBook: false,
          }
          searchResultCache.set(cacheKey, result)
          return result
        }
      }
    }
  } catch (err) {
    console.warn('Failed to search custom books:', err)
  }

  // ---- 阶段 4：最终查询不到 ----
  searchResultCache.set(cacheKey, null)
  return null
}

/**
 * 快速前缀搜索补全联想（用于搜索输入框下拉推荐）
 */
export async function searchWordSuggestions(
  prefix: string,
  currentBookId: string = 'book_cet4',
  currentBookName: string = 'CET-4 核心词库',
  limit: number = 6
): Promise<DictSuggestionItem[]> {
  const clean = prefix.trim().toLowerCase()
  if (!clean) return []

  const results: DictSuggestionItem[] = []
  const seenWords = new Set<string>()

  // 1. 当前词库前缀匹配
  if (!currentBookId.startsWith('book_custom_')) {
    const currentEntries = await dictionaryLoader.loadAllBookRawWords(currentBookId)
    for (const entry of currentEntries) {
      if (!entry.name) continue
      const lower = entry.name.toLowerCase()
      if (lower.startsWith(clean) && !seenWords.has(lower)) {
        seenWords.add(lower)
        const rawTrans = entry.trans?.[0] || entry.translation || '常用释义'
        results.push({
          name: entry.name,
          meaning: rawTrans,
          sourceBookName: OFFICIAL_BOOK_FILE_MAP[currentBookId]?.name || currentBookName,
          isCurrentBook: true,
        })
        if (results.length >= limit) return results
      }
    }
  } else {
    try {
      const customBook = await db.books.get(currentBookId)
      for (const w of customBook?.words || []) {
        const lower = w.name.toLowerCase()
        if (lower.startsWith(clean) && !seenWords.has(lower)) {
          seenWords.add(lower)
          const meaning = w.posList?.[0]?.means?.join('; ') || '常用释义'
          results.push({
            name: w.name,
            meaning,
            sourceBookName: customBook?.name || currentBookName,
            isCurrentBook: true,
          })
          if (results.length >= limit) return results
        }
      }
    } catch {}
  }

  // 2. 其它词库补齐
  const otherOfficialBookIds = Object.keys(OFFICIAL_BOOK_FILE_MAP).filter((id) => id !== currentBookId)
  for (const bookId of otherOfficialBookIds) {
    const entries = await dictionaryLoader.loadAllBookRawWords(bookId)
    for (const entry of entries) {
      if (!entry.name) continue
      const lower = entry.name.toLowerCase()
      if (lower.startsWith(clean) && !seenWords.has(lower)) {
        seenWords.add(lower)
        const rawTrans = entry.trans?.[0] || entry.translation || '常用释义'
        results.push({
          name: entry.name,
          meaning: rawTrans,
          sourceBookName: OFFICIAL_BOOK_FILE_MAP[bookId]?.name || '其他词库',
          isCurrentBook: false,
        })
        if (results.length >= limit) return results
      }
    }
  }

  return results
}
