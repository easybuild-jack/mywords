export interface DictHistoryItem {
  word: string
  meaning?: string
  timestamp: number
}

export const DICT_HISTORY_STORAGE_KEY = 'mywords_dict_history_v1'
export const MAX_DICT_HISTORY_COUNT = 20

/**
 * 从 localStorage 读取单词查询历史记录，按时间倒序排列，上限 20 条
 */
export function loadDictHistory(): DictHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DICT_HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item): item is DictHistoryItem =>
            Boolean(item && typeof item.word === 'string' && item.word.trim().length > 0)
        )
        .slice(0, MAX_DICT_HISTORY_COUNT)
    }
  } catch (err) {
    console.warn('Failed to load dict history:', err)
  }
  return []
}

/**
 * 写入持久化存储
 */
export function saveDictHistory(items: DictHistoryItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      DICT_HISTORY_STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_DICT_HISTORY_COUNT))
    )
  } catch (err) {
    console.warn('Failed to save dict history:', err)
  }
}

/**
 * 添加或置顶单词查询历史记录（不区分大小写去重，最新在前，最多保留20条）
 */
export function addDictHistoryItem(word: string, meaning?: string): DictHistoryItem[] {
  const cleanWord = word.trim()
  if (!cleanWord) return loadDictHistory()

  const current = loadDictHistory()
  const existing = current.find(
    (item) => item.word.toLowerCase() === cleanWord.toLowerCase()
  )

  const finalMeaning = meaning?.trim() || existing?.meaning

  const filtered = current.filter(
    (item) => item.word.toLowerCase() !== cleanWord.toLowerCase()
  )

  const newItem: DictHistoryItem = {
    word: cleanWord,
    meaning: finalMeaning,
    timestamp: Date.now(),
  }

  const updated = [newItem, ...filtered].slice(0, MAX_DICT_HISTORY_COUNT)
  saveDictHistory(updated)
  return updated
}

/**
 * 补全或更新历史记录中指定单词的释义
 */
export function updateDictHistoryMeaning(word: string, meaning: string): DictHistoryItem[] {
  const cleanWord = word.trim()
  const cleanMeaning = meaning.trim()
  if (!cleanWord || !cleanMeaning) return loadDictHistory()

  const current = loadDictHistory()
  let hasChange = false
  const updated = current.map((item) => {
    if (item.word.toLowerCase() === cleanWord.toLowerCase()) {
      if (item.meaning !== cleanMeaning) {
        hasChange = true
        return { ...item, meaning: cleanMeaning }
      }
    }
    return item
  })

  if (hasChange) {
    saveDictHistory(updated)
  }
  return updated
}

/**
 * 删除单条历史记录
 */
export function removeDictHistoryItem(word: string): DictHistoryItem[] {
  const cleanWord = word.trim()
  if (!cleanWord) return loadDictHistory()

  const current = loadDictHistory()
  const updated = current.filter(
    (item) => item.word.toLowerCase() !== cleanWord.toLowerCase()
  )
  saveDictHistory(updated)
  return updated
}

/**
 * 清空所有历史记录
 */
export function clearDictHistory(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(DICT_HISTORY_STORAGE_KEY)
  } catch (err) {
    console.warn('Failed to clear dict history:', err)
  }
}
