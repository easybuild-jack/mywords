import type {
  SentenceTokenGrammar,
  TranslationSentenceItem,
  SentenceKeywordItem,
} from '@/types'

export interface ParsedWordToken {
  id: string
  wordIndex: number
  rawText: string
  cleanWord: string
  leadingPunct?: string
  trailingPunct?: string
  grammar?: SentenceTokenGrammar
}

/**
 * 常见英语虚词/停用词集合 (用于智能提取实词核心词)
 */
export const STOPWORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'it', 'its', 'this', 'that', 'these', 'those', 'there', 'here',
  'and', 'but', 'or', 'so', 'as', 'if', 'then', 'because', 'while',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'our', 'their',
])

/**
 * 将常见的动词变体、复数、进行时、过去时、比较级等转换为词汇基础原形 (Lemma)
 * 例如："Birds" -> "bird", "tastes" -> "taste", "looking" -> "look"
 */
export function toLemmaBaseForm(rawWord: string): string {
  const word = rawWord.trim().toLowerCase()
  if (word.length <= 3) return word

  // 常见不规则变形与高频实词原形映射
  const IRREGULAR_LEMMAS: Record<string, string> = {
    birds: 'bird',
    apples: 'apple',
    children: 'child',
    people: 'person',
    men: 'man',
    women: 'woman',
    feet: 'foot',
    teeth: 'tooth',
    mice: 'mouse',
    gave: 'give',
    given: 'give',
    made: 'make',
    went: 'go',
    gone: 'go',
    took: 'take',
    taken: 'take',
    saw: 'see',
    seen: 'see',
    came: 'come',
    ran: 'run',
    wrote: 'write',
    written: 'write',
    spoke: 'speak',
    spoken: 'speak',
    flew: 'fly',
    flown: 'fly',
    swam: 'swim',
    swum: 'swim',
    bought: 'buy',
    brought: 'bring',
    taught: 'teach',
    thought: 'think',
    warmer: 'warm',
    warmest: 'warm',
    better: 'good',
    best: 'good',
    faster: 'fast',
    fastest: 'fast',
    sweeter: 'sweet',
    sweetest: 'sweet',
    tasted: 'taste',
    tastes: 'taste',
    plays: 'play',
    played: 'play',
    playing: 'play',
    achieved: 'achieve',
    achieves: 'achieve',
    achieving: 'achieve',
    distinguishes: 'distinguish',
    distinguished: 'distinguish',
  }

  if (IRREGULAR_LEMMAS[word]) {
    return IRREGULAR_LEMMAS[word]
  }

  // -ies -> -y (flies -> fly, carries -> carry)
  if (word.endsWith('ies') && word.length > 4) {
    return word.slice(0, -3) + 'y'
  }

  // -ied -> -y (tried -> try)
  if (word.endsWith('ied') && word.length > 4) {
    return word.slice(0, -3) + 'y'
  }

  // -ing (looking -> look, learning -> learn)
  if (word.endsWith('ing') && word.length > 5) {
    const stem = word.slice(0, -3)
    // 双写辅音还原 (swimming -> swim, running -> run)
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1)
    }
    return stem
  }

  // -es (distinguishes -> distinguish, passes -> pass, watches -> watch)
  if (
    word.endsWith('es') &&
    (word.endsWith('shes') ||
      word.endsWith('ches') ||
      word.endsWith('sses') ||
      word.endsWith('xes') ||
      word.endsWith('zes'))
  ) {
    return word.slice(0, -2)
  }

  // -ed (achieved -> achieve, walked -> walk)
  if (word.endsWith('ed') && word.length > 4) {
    if (word.endsWith('eed')) return word
    const stem = word.slice(0, -2)
    if (
      word.endsWith('ved') ||
      word.endsWith('zed') ||
      word.endsWith('ced') ||
      word.endsWith('sed')
    ) {
      return stem + 'e'
    }
    return stem
  }

  // -s (名词复数或单三：apples -> apple, birds -> bird, storybooks -> storybook)
  if (
    word.endsWith('s') &&
    !word.endsWith('ss') &&
    !word.endsWith('us') &&
    !word.endsWith('is') &&
    word.length > 3
  ) {
    return word.slice(0, -1)
  }

  return word
}

/**
 * 从英文句子中智能提取 2~4 个最具代表性的核心实词 (以词汇基础原形输出，如 "Birds" -> "bird")
 */
export function extractAutoKeywords(
  sentenceEn: string,
  grammarTokens?: SentenceTokenGrammar[],
  _sentenceZh?: string
): SentenceKeywordItem[] {
  const words = parseSentenceIntoWords(sentenceEn, grammarTokens)
  const candidateKeywords: SentenceKeywordItem[] = []
  const seenWords = new Set<string>()

  // 1. 如果有逐词语法标注，优先提取主谓宾表等核心实词
  if (grammarTokens && grammarTokens.length > 0) {
    for (const w of words) {
      const lower = w.cleanWord.toLowerCase()
      if (STOPWORDS.has(lower) || lower.length < 2) continue

      const baseWord = toLemmaBaseForm(w.cleanWord)
      if (seenWords.has(baseWord)) continue

      const g = w.grammar
      const isCoreRole =
        g?.roleCode && ['S', 'V', 'O', 'Oi', 'Od', 'P', 'Comp'].includes(g.roleCode)
      const isContentPos =
        g?.pos && ['n.', 'v.', 'adj.'].some((p) => g.pos?.startsWith(p))

      if (isCoreRole || isContentPos) {
        seenWords.add(baseWord)
        // 尝试从 explanation 中提取中文
        let extractedMeaning = ''
        if (g?.explanation) {
          const match = g.explanation.match(/[\u4e00-\u9fa5]{1,6}/)
          if (match) extractedMeaning = match[0]
        }
        if (!extractedMeaning && g?.roleZh) {
          extractedMeaning = g.roleZh
        }

        candidateKeywords.push({
          id: `k-${candidateKeywords.length + 1}-${baseWord}`,
          word: baseWord,
          meaningZh: extractedMeaning || baseWord,
          pos: g?.pos,
        })
      }
      if (candidateKeywords.length >= 3) break
    }
  }

  // 2. 兜底提取：过滤停用词，提取句中较长的实词并转换为原形
  if (candidateKeywords.length < 2) {
    for (const w of words) {
      const lower = w.cleanWord.toLowerCase()
      if (STOPWORDS.has(lower) || lower.length <= 2) continue

      const baseWord = toLemmaBaseForm(w.cleanWord)
      if (seenWords.has(baseWord)) continue

      seenWords.add(baseWord)
      candidateKeywords.push({
        id: `k-${candidateKeywords.length + 1}-${baseWord}`,
        word: baseWord,
        meaningZh: baseWord,
      })
      if (candidateKeywords.length >= 3) break
    }
  }

  return candidateKeywords
}

/**
 * 标点符号正则判定：包含各类英文常用标点符号
 */
export const PUNCTUATION_REGEX = /[.,!?;:"'“”‘’()—\-[\]{}]/

/**
 * 从英文单词中分离前置标点、核心纯字母单词、后置标点
 * 例如：`"Hello,"` -> `{ leading: '"', clean: 'Hello', trailing: ',"' }`
 */
export function dissectWord(raw: string): { leading: string; clean: string; trailing: string } {
  let leading = ''
  let trailing = ''
  let clean = raw

  // 提取前置非字母标点
  const leadingMatch = clean.match(/^[^a-zA-Z0-9]+/)
  if (leadingMatch) {
    leading = leadingMatch[0]
    clean = clean.slice(leading.length)
  }

  // 提取后置非字母标点
  const trailingMatch = clean.match(/[^a-zA-Z0-9]+$/)
  if (trailingMatch) {
    trailing = trailingMatch[0]
    clean = clean.slice(0, clean.length - trailing.length)
  }

  return { leading, clean, trailing }
}

/**
 * 将整句按空格拆解为对齐的单词槽列表，提取出纯拼写、前置标点、后置标点，
 * 并与可能存在的 grammar.tokens 逐项智能匹配
 */
export function parseSentenceIntoWords(
  sentenceEn: string,
  grammarTokens?: SentenceTokenGrammar[]
): ParsedWordToken[] {
  if (!sentenceEn) return []

  // 以空格切分
  const rawWords = sentenceEn.trim().split(/\s+/)
  const result: ParsedWordToken[] = []

  let wordIdx = 0
  for (let i = 0; i < rawWords.length; i++) {
    const raw = rawWords[i]
    if (!raw) continue

    const { leading, clean, trailing } = dissectWord(raw)

    // 匹配 grammarTokens 中的标注（优先按 wordIndex，其次按 cleanText 模糊对齐）
    let matchedGrammar: SentenceTokenGrammar | undefined
    if (grammarTokens && grammarTokens.length > 0) {
      if (grammarTokens[wordIdx] && grammarTokens[wordIdx].cleanText.toLowerCase() === clean.toLowerCase()) {
        matchedGrammar = grammarTokens[wordIdx]
      } else {
        matchedGrammar = grammarTokens.find(
          (t) => t.cleanText.toLowerCase() === clean.toLowerCase()
        )
      }
    }

    result.push({
      id: `w-${wordIdx}-${clean.toLowerCase()}`,
      wordIndex: wordIdx,
      rawText: raw,
      cleanWord: clean,
      leadingPunct: leading || undefined,
      trailingPunct: trailing || undefined,
      grammar: matchedGrammar,
    })

    wordIdx++
  }

  return result
}

/**
 * 将用户上传的纯文本行解析为 TranslationSentenceItem 数组
 * 支持格式：
 * 1. `English sentence | 中文翻译`
 * 2. `English sentence \t 中文翻译`
 * 3. `English sentence ---- 中文翻译`
 */
export function parseCustomSentenceText(rawContent: string): TranslationSentenceItem[] {
  const lines = rawContent.split(/\r?\n/)
  const items: TranslationSentenceItem[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) continue

    let en = ''
    let zh = ''

    if (line.includes('|')) {
      const parts = line.split('|')
      en = parts[0]?.trim() || ''
      zh = parts[1]?.trim() || ''
    } else if (line.includes('\t')) {
      const parts = line.split('\t')
      en = parts[0]?.trim() || ''
      zh = parts[1]?.trim() || ''
    } else if (line.includes('----')) {
      const parts = line.split('----')
      en = parts[0]?.trim() || ''
      zh = parts[1]?.trim() || ''
    } else if (line.includes('——')) {
      const parts = line.split('——')
      en = parts[0]?.trim() || ''
      zh = parts[1]?.trim() || ''
    } else {
      // 逗号分隔 (CSV 常见格式)
      const commaIdx = line.indexOf(',')
      if (commaIdx !== -1) {
        en = line.slice(0, commaIdx).trim()
        zh = line.slice(commaIdx + 1).trim()
      }
    }

    if (en && zh) {
      // 自动生成基础 tokens
      const words = parseSentenceIntoWords(en)
      const defaultTokens: SentenceTokenGrammar[] = words.map((w) => ({
        text: w.rawText,
        cleanText: w.cleanWord,
        roleZh: '词汇',
        roleCode: 'Word',
      }))

      items.push({
        id: `custom-sen-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        sentenceEn: en,
        sentenceZh: zh,
        category: '自定义练习',
        difficulty: 'medium',
        isCustom: true,
        createdAt: Date.now(),
        keywords: extractAutoKeywords(en, defaultTokens, zh),
        grammar: {
          patternZh: '练习句型',
          patternCode: 'Sentence',
          summary: '自定义导入句子，通关后可查看完整原文并磨练听音跟读。',
          tokens: defaultTokens,
        },
      })
    }
  }

  return items
}

/**
 * 语法成分色彩映射表 (与基础语法研习模块保持严密统一)
 */
export const GRAMMAR_ROLE_STYLES: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  S: {
    label: '主语',
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
  },
  V: {
    label: '谓语',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  O: {
    label: '宾语',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  Oi: {
    label: '间接宾语',
    bg: 'bg-amber-600/15',
    text: 'text-amber-300',
    border: 'border-amber-600/30',
  },
  Od: {
    label: '直接宾语',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
  },
  P: {
    label: '表语',
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
  Adv: {
    label: '状语',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  Attr: {
    label: '定语',
    bg: 'bg-teal-500/15',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
  },
  Comp: {
    label: '补语',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
  Link: {
    label: '系动词',
    bg: 'bg-emerald-600/15',
    text: 'text-emerald-300',
    border: 'border-emerald-600/30',
  },
  Prep: {
    label: '介词',
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
  },
  Default: {
    label: '修饰成分',
    bg: 'bg-muted/30',
    text: 'text-muted-foreground',
    border: 'border-border/40',
  },
}
