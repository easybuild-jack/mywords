import type { WordItem } from '@/types'

/**
 * 归一化清洗音标字符串（去除重音符号、次重音、长音点、斜杠、空格）
 */
export function normalizePhonetic(raw?: string): string {
  if (!raw) return ''
  return raw
    .toLowerCase()
    .replace(/[ˈ'ˌ]/g, '') // 移除主重音、次重音符号
    .replace(/[ː:]/g, '') // 移除长音符号与冒号
    .replace(/[\/\\\[\]\(\)\s]/g, '') // 移除斜杠、括号与空格
    .replace(/;/g, '')
    .trim()
}

/**
 * 校验用户输入的音标与目标单词的音标（支持美音/英音任一完全匹配）
 */
export function validatePhonetic(
  input: string,
  targetPhoneticUs?: string,
  targetPhoneticUk?: string
): boolean {
  const cleanInput = normalizePhonetic(input)
  if (!cleanInput) return false

  const cleanUs = normalizePhonetic(targetPhoneticUs)
  const cleanUk = normalizePhonetic(targetPhoneticUk)

  // 支持目标音标中包含多音标（以分号或斜杠隔开）
  const usCandidates = (targetPhoneticUs || '').split(/[/;]/).map(normalizePhonetic).filter(Boolean)
  const ukCandidates = (targetPhoneticUk || '').split(/[/;]/).map(normalizePhonetic).filter(Boolean)
  const allCandidates = new Set([cleanUs, cleanUk, ...usCandidates, ...ukCandidates].filter(Boolean))

  return allCandidates.has(cleanInput)
}

/**
 * 提取单词的所有核心中文释义关键词素
 */
export function extractMeaningKeywords(word: WordItem): string[] {
  const rawList: string[] = []

  if (word.posList?.length) {
    for (const posItem of word.posList) {
      if (posItem.means?.length) {
        rawList.push(...posItem.means)
      }
    }
  }

  const cleanedKeywords: string[] = []

  for (const item of rawList) {
    if (!item) continue
    // 去除词性前缀（如 vt. n. adj.）、去除括号注释（如 [计算机]、(某物)）
    const clean = item
      .replace(/^(n\.|v\.|vt\.|vi\.|adj\.|adv\.|prep\.|conj\.|art\.|pron\.)\s*/i, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/（.*?）/g, '')
      .trim()

    // 按标点符号切分为独立词素
    const subMeans = clean.split(/[；;,，、/ \t]/).map((m) => m.trim()).filter((m) => m.length > 0)
    cleanedKeywords.push(...subMeans)
  }

  return Array.from(new Set(cleanedKeywords))
}

/**
 * 宽松校验用户输入的中文释义
 * 规则：只要用户输入的中文包含目标释义库中任意一个或多个有效词素，即算正确
 */
export function validateMeaning(input: string, word: WordItem): boolean {
  const cleanInput = input
    .trim()
    .replace(/[，,、；; \t]/g, '')
    .toLowerCase()

  if (!cleanInput) return false

  const keywords = extractMeaningKeywords(word)
  if (!keywords.length) return true // 词库若无释义则默认放行

  // 1. 完整包含或被包含匹配
  for (const kw of keywords) {
    const cleanKw = kw.replace(/[，,、；; \t]/g, '').toLowerCase()
    if (!cleanKw) continue

    // 用户输入包含该关键词素（例如输入 "用法使用"，包含 "用法"）
    // 或者该关键词素包含用户输入且字数>=2（例如关键词素 "使用方法"，用户输入 "使用"）
    if (cleanInput.includes(cleanKw) || (cleanKw.includes(cleanInput) && cleanInput.length >= 2)) {
      return true
    }
  }

  // 2. 检查用户输入是否由多个逗号分隔的合法词素组成
  const userSubItems = input
    .split(/[，,、；; \t]/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (userSubItems.length > 0) {
    const hasValidSubItem = userSubItems.some((sub) => {
      const cleanSub = sub.toLowerCase()
      return keywords.some((kw) => {
        const cleanKw = kw.replace(/[，,、；; \t]/g, '').toLowerCase()
        return cleanSub.includes(cleanKw) || (cleanKw.includes(cleanSub) && cleanSub.length >= 2)
      })
    })
    if (hasValidSubItem) return true
  }

  return false
}

/**
 * 英语国际音标分类键盘符号表
 */
export const IPA_KEYBOARD_GROUPS = [
  {
    category: '单元音',
    symbols: ['ɪ', 'iː', 'e', 'æ', 'ɜː', 'ə', 'ʌ', 'uː', 'ʊ', 'ɔː', 'ɒ', 'ɑː'],
  },
  {
    category: '双元音',
    symbols: ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'oʊ', 'ɪə', 'eə', 'ʊə'],
  },
  {
    category: '爆破音 & 破擦音',
    symbols: ['p', 'b', 't', 'd', 'k', 'ɡ', 'tʃ', 'dʒ', 'tr', 'dr'],
  },
  {
    category: '摩擦音',
    symbols: ['f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'h', 'ts', 'dz'],
  },
  {
    category: '鼻音 & 辅音',
    symbols: ['m', 'n', 'ŋ', 'l', 'r', 'w', 'j'],
  },
]
