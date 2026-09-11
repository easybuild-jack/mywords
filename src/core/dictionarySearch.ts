import type { WordItem, WordEtymology } from '@/types'
import { dictionaryLoader, OFFICIAL_BOOK_FILE_MAP } from '@/core/dictionaryLoader'
import { db, getWordFromAiCache, searchWordsInAiCache } from '@/db'
import { queryAiWordCore } from '@/lib/aiWordCore'
import type { AiClientConfig } from '@/lib/aiClient'
import { isLikelyEnglishWord } from '@/lib/wordValidation'
import { AiDictionaryLookupError } from '@/lib/aiPrompts'


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
 * 针对常见英语名词复数、动词时态与词缀进行轻量词形还原，生成候选原型
 */
function generateLemmaCandidates(word: string): string[] {
  const clean = word.toLowerCase().trim()
  if (clean.length < 3) return []

  const candidates: string[] = []
  const add = (w: string) => {
    if (w && w.length >= 2 && w !== clean && !candidates.includes(w)) {
      candidates.push(w)
    }
  }

  // 1. 所有格 's 或 s'
  if (clean.endsWith("'s")) add(clean.slice(0, -2))
  else if (clean.endsWith("s'")) add(clean.slice(0, -1))

  // 2. 复数 / 第三人称单数 -ies -> -y (如 studies -> study, stories -> story)
  if (clean.endsWith('ies') && clean.length > 4) {
    add(clean.slice(0, -3) + 'y')
  }

  // 3. -es (如 watches -> watch, boxes -> box, references -> reference, tastes -> taste)
  if (clean.endsWith('es') && clean.length > 4) {
    add(clean.slice(0, -2))
    add(clean.slice(0, -1))
  }

  // 4. -s (如 practices -> practice, strengthens -> strengthen, words -> word)
  if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 3) {
    add(clean.slice(0, -1))
  }

  // 5. -ied -> -y (如 studied -> study, copied -> copy)
  if (clean.endsWith('ied') && clean.length > 4) {
    add(clean.slice(0, -3) + 'y')
  }

  // 6. -ed (如 discovered -> discover, practiced -> practice, stopped -> stop)
  if (clean.endsWith('ed') && clean.length > 4) {
    add(clean.slice(0, -2))
    add(clean.slice(0, -1))
    const stem = clean.slice(0, -2)
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      add(stem.slice(0, -1))
    }
  }

  // 7. -ing (如 paying -> pay, making -> make, running -> run)
  if (clean.endsWith('ing') && clean.length > 4) {
    add(clean.slice(0, -3))
    add(clean.slice(0, -3) + 'e')
    const stem = clean.slice(0, -3)
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      add(stem.slice(0, -1))
    }
  }

  // 8. -ly (如 easily -> easy, quickly -> quick)
  if (clean.endsWith('ly') && clean.length > 4) {
    if (clean.endsWith('ily')) {
      add(clean.slice(0, -3) + 'y')
    }
    add(clean.slice(0, -2))
  }

  return candidates
}

/**
 * 在官方和自定义词库中检索指定确切单词
 */
async function searchExactWordInBooks(
  clean: string,
  currentBookId: string,
  currentBookName: string
): Promise<DictSearchResult | null> {
  // ---- 阶段 1：优先检索当前词库 ----
  if (currentBookId.startsWith('book_custom_')) {
    try {
      const customBook = await db.books.get(currentBookId)
      if (customBook?.words?.length) {
        const found = customBook.words.find((w) => w.name.toLowerCase() === clean)
        if (found) {
          return {
            word: found,
            sourceBookId: currentBookId,
            sourceBookName: customBook.name,
            isCurrentBook: true,
          }
        }
      }
    } catch (err) {
      console.warn('Failed to search in current custom book:', err)
    }
  } else {
    const officialEntries = await dictionaryLoader.loadAllBookRawWords(currentBookId)
    const match = officialEntries.find((entry) => entry.name?.toLowerCase() === clean)
    if (match) {
      const word = await dictionaryLoader.convertRawEntryToWordItem(match)
      const bookConfig = OFFICIAL_BOOK_FILE_MAP[currentBookId]
      return {
        word,
        sourceBookId: currentBookId,
        sourceBookName: bookConfig?.name || currentBookName,
        isCurrentBook: true,
      }
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
      return {
        word,
        sourceBookId: bookId,
        sourceBookName: bookConfig?.name || '官方扩展词库',
        isCurrentBook: false,
      }
    }
  }

  // ---- 阶段 3：从其他自定义词库检索 ----
  try {
    const customBooks = await db.books.filter((b) => Boolean(b.isCustom && b.id !== currentBookId)).toArray()
    for (const book of customBooks) {
      if (book.words?.length) {
        const found = book.words.find((w) => w.name.toLowerCase() === clean)
        if (found) {
          return {
            word: found,
            sourceBookId: book.id,
            sourceBookName: book.name,
            isCurrentBook: false,
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to search custom books:', err)
  }

  return null
}

/**
 * 核心查词方法：
 * 1. 优先从当前学习的词库检索精确匹配
 * 2. 检索不到再从其他官方/自定义词库检索
 * 3. 仍未命中时，尝试词形还原（复数、时态变形等）
 * 4. 仍未命中时，尝试本地词典索引及在线词库兜底 (enrichWord)
 * 5. 最终查询不到，返回 null
 */
export async function searchWordAcrossDictionaries(
  query: string,
  currentBookId: string = 'book_cet4',
  currentBookName: string = 'CET-4 核心词库'
): Promise<DictSearchResult | null> {
  const clean = query.trim().toLowerCase()
  if (!isLikelyEnglishWord(clean)) return null

  // ---- 核心流转第 1 步：优先从 AI 单词缓存表中检索 ----
  const cachedWord = await getWordFromAiCache(clean)
  if (cachedWord) {
    return {
      word: cachedWord,
      sourceBookId: 'ai_cache',
      sourceBookName: '', // 其他不要展示来源
      isCurrentBook: false,
    }
  }

  const cacheKey = `${currentBookId}::${clean}`
  if (searchResultCache.has(cacheKey)) {
    return searchResultCache.get(cacheKey) || null
  }

  // ---- 核心流转第 2 步：当前词库与其它词库精确匹配 ----
  let match = await searchExactWordInBooks(clean, currentBookId, currentBookName)
  if (match) {
    searchResultCache.set(cacheKey, match)
    return match
  }

  // ---- 核心流转第 3 步：词形还原匹配（复数、时态、变形原型） ----
  const candidates = generateLemmaCandidates(clean)
  for (const candidate of candidates) {
    // 词形还原也先看缓存
    const lemmaCached = await getWordFromAiCache(candidate)
    if (lemmaCached) {
      const res: DictSearchResult = {
        word: lemmaCached,
        sourceBookId: 'ai_cache',
        sourceBookName: '', // 其他不要展示来源
        isCurrentBook: false,
      }
      searchResultCache.set(cacheKey, res)
      return res
    }

    match = await searchExactWordInBooks(candidate, currentBookId, currentBookName)
    if (match) {
      searchResultCache.set(cacheKey, match)
      return match
    }
  }

  // ---- 核心流转第 4 步：本地综合词表与在线词库 enrichWord 兜底 ----
  try {
    const enriched = await dictionaryLoader.enrichWord(clean)
    if (
      enriched &&
      enriched.posList?.length > 0 &&
      enriched.posList[0].means?.[0] &&
      enriched.posList[0].means[0] !== '核心词义'
    ) {
      const result: DictSearchResult = {
        word: enriched,
        sourceBookId: 'dict_extended',
        sourceBookName: '', // 非词库来源不展示来源
        isCurrentBook: false,
      }
      searchResultCache.set(cacheKey, result)
      return result
    }
  } catch (err) {
    console.warn('enrichWord fallback failed:', err)
  }

  // 本地词库体系全部未查到，返回 null 供上层判断是否流转至 AI 查询
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
  if (!isLikelyEnglishWord(clean)) return []

  const results: DictSuggestionItem[] = []
  const seenWords = new Set<string>()

  // 0. 优先匹配 AI 缓存中的单词（不展示来源）
  const cachedMatches = await searchWordsInAiCache(clean, limit)
  for (const item of cachedMatches) {
    if (!item.name) continue
    const lower = item.name.toLowerCase()
    if (lower.startsWith(clean) && !seenWords.has(lower)) {
      seenWords.add(lower)
      const meaning = item.posList?.[0]?.means?.[0] || '常用释义'
      results.push({
        name: item.name,
        meaning,
        sourceBookName: '', // 其他不要展示来源
        isCurrentBook: false,
      })
      if (results.length >= limit) return results
    }
  }

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

export interface ImportWordCandidate {
  rawName: string
  customMeaning?: string
  customPhonetic?: string
  customSyllables?: string[]
  customEtymology?: WordEtymology
}

export interface ReconciledImportWord {
  word: WordItem
  sourceBookId: string // 'ai_cache' | 'book_xxx' | 'dict_extended' | 'new'
  sourceBookName: string
  isFromAiCache: boolean
}

/**
 * 单词导入核心比对与补全流转：
 * 1. 调用全局词典检索接口（优先查询 AI 缓存表、当前/其它各官方/自定义词库、词形还原与本地词库）
 * 2. 对比导入数据，补齐缺失字段（音节拆分、词根词缀、例句短语等），修正错误格式（音标、词性格式）
 * 3. 标记数据来源（特别标明是否源自 AI 缓存 'ai_cache'，以备后续入库后执行精准清理）
 */
export async function reconcileWordForImport(
  candidate: ImportWordCandidate,
  aiConfig?: AiClientConfig
): Promise<ReconciledImportWord | null> {
  const cleanName = candidate.rawName.trim()
  const lowerName = cleanName.toLowerCase()

  // 1. 调用全局查询接口查词（带 AI 缓存优先、所有词库、词形还原）
  let queryResult = await searchWordAcrossDictionaries(cleanName)

  // 本地与在线词典均未命中时，导入只查询 AI 基础数据，富内容留到实际展示时按需补全
  if (!queryResult && aiConfig?.apiKey?.trim()) {
    let aiWord: WordItem | null
    try {
      aiWord = await queryAiWordCore(aiConfig, cleanName)
    } catch (error) {
      if (error instanceof AiDictionaryLookupError) return null
      throw error
    }
    if (aiWord) {
      queryResult = {
        word: aiWord,
        sourceBookId: 'ai_cache',
        sourceBookName: '',
        isCurrentBook: false,
      }
    }
  }

  if (queryResult) {
    const baseWord = queryResult.word
    const isFromAiCache = queryResult.sourceBookId === 'ai_cache'

    // 2. 字段比对、补齐与纠偏
    // 音标：如导入数据有自定义音标且格式合理则采纳，否则用查询结果
    const customPhonetic = candidate.customPhonetic?.trim()
    const phoneticUs = customPhonetic || baseWord.phoneticUs || baseWord.phoneticUk || `/ ${lowerName} /`
    const phoneticUk = customPhonetic || baseWord.phoneticUk || baseWord.phoneticUs || `/ ${lowerName} /`

    // 音节拆分：导入数据提供且无误（拼接等于原词）则优先保留，否则以权威查询结果补齐
    let syllables = baseWord.syllables
    if (
      candidate.customSyllables?.length &&
      candidate.customSyllables.join('').toLowerCase() === lowerName
    ) {
      syllables = candidate.customSyllables
    }

    // 词根词缀：以权威查询结果为底，若候选有自定义扩展则合并
    const etymology = baseWord.etymology || candidate.customEtymology

    // 释义与词性：若用户导入时提供了自定义释义，将其解析为 posList 并置顶融合
    let posList = baseWord.posList
    if (candidate.customMeaning?.trim()) {
      const parsedUserPos = dictionaryLoader.parsePosAndMeans([candidate.customMeaning.trim()])
      if (parsedUserPos.length > 0) {
        posList = [
          ...parsedUserPos,
          ...baseWord.posList.filter(
            (p) => !parsedUserPos.some((up) => up.pos.toLowerCase() === p.pos.toLowerCase())
          ),
        ]
      }
    }

    const mergedWord: WordItem = {
      ...baseWord,
      name: cleanName,
      phoneticUs,
      phoneticUk,
      syllables: syllables?.length ? syllables : [cleanName],
      etymology,
      posList: posList?.length ? posList : [{ pos: 'other', means: ['核心词义'] }],
      examples: baseWord.examples?.length ? baseWord.examples : [],
      phrases: baseWord.phrases?.length ? baseWord.phrases : [],
    }

    return {
      word: mergedWord,
      sourceBookId: queryResult.sourceBookId,
      sourceBookName: queryResult.sourceBookName,
      isFromAiCache,
    }
  }

  // 3. 本地与词库未收录的单词，使用 dictionaryLoader.enrichWord 兜底补齐
  const enriched = await dictionaryLoader.enrichWord(cleanName, {
    meaning: candidate.customMeaning,
    phonetic: candidate.customPhonetic,
    syllables: candidate.customSyllables,
    etymology: candidate.customEtymology,
  })

  return {
    word: enriched,
    sourceBookId: 'new',
    sourceBookName: '',
    isFromAiCache: false,
  }
}

