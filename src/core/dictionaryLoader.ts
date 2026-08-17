import type { WordEtymology, WordItem } from '@/types'
import { splitIntoSyllables, analyzeEtymology, isUsableSyllableSplit } from '@/lib/syllables'
import { buildWordId } from '@/lib/wordId'

/** 导入时由用户提供的字段，填了就跳过对应的自动推导 */
export interface WordEnrichOverrides {
  meaning?: string
  phonetic?: string
  syllables?: string[]
  etymology?: WordEtymology
}

interface RawDictEntry {
  name: string
  trans?: string[]
  usphone?: string
  ukphone?: string
  phone?: string
  translation?: string
  /** 人工校订过的音节拆分与构词法，只有基础词汇这类精编词表会带，缺省时走自动推导 */
  syllables?: string[]
  etymology?: WordEtymology
}

// 官方内置大词库文件映射关系
export const OFFICIAL_BOOK_FILE_MAP: Record<string, { path: string; totalWords: number; name: string }> = {
  'book_basewords': { path: '/dicts/basewords.json', totalWords: 1195, name: '基础词汇' },
  'book_cet4': { path: '/dicts/CET4_T.json', totalWords: 2600, name: 'CET-4 核心词库' },
  'book_kaoyan': { path: '/dicts/2025KaoYanHongBaoShu.json', totalWords: 3700, name: '考研英语 2025 高频词' },
  'book_coder': { path: '/dicts/it-words.json', totalWords: 1700, name: 'Coder Dict (通用 IT 编程词库)' },
  'book_ielts': { path: '/dicts/4000_Essential_English_Words-meaning.json', totalWords: 4000, name: '核心高频 4000 词' },
}

function formatPhonetic(rawPhone?: string): string | undefined {
  if (!rawPhone) return undefined
  const cleaned = rawPhone.replace(/^\/+|\/+$/g, '').trim()
  return cleaned ? `/${cleaned}/` : undefined
}

class DictionaryLoader {
  private localLexiconMap: Map<string, { trans: string[]; usphone?: string; ukphone?: string }> = new Map()
  private bookJsonCache: Map<string, RawDictEntry[]> = new Map()
  private isIndexInitialized = false

  /**
   * 预热初始化基础词典索引（在浏览器后台静默建立 4000+ 核心词索引与 IT 编程词库索引）
   */
  public async ensureLexiconIndex() {
    if (this.isIndexInitialized || typeof window === 'undefined') return
    try {
      const [resCet4, resIt] = await Promise.all([
        fetch('/dicts/CET4_T.json').catch(() => null),
        fetch('/dicts/it-words.json').catch(() => null),
      ])

      if (resCet4 && resCet4.ok) {
        const data: RawDictEntry[] = await resCet4.json()
        for (const item of data) {
          if (item.name) {
            this.localLexiconMap.set(item.name.toLowerCase().trim(), {
              trans: item.trans || (item.translation ? [item.translation] : []),
              usphone: formatPhonetic(item.usphone) || formatPhonetic(item.phone),
              ukphone: formatPhonetic(item.ukphone) || formatPhonetic(item.phone),
            })
          }
        }
      }

      if (resIt && resIt.ok) {
        const data: RawDictEntry[] = await resIt.json()
        for (const item of data) {
          if (item.name && !this.localLexiconMap.has(item.name.toLowerCase().trim())) {
            this.localLexiconMap.set(item.name.toLowerCase().trim(), {
              trans: item.trans || (item.translation ? [item.translation] : []),
              usphone: formatPhonetic(item.usphone) || formatPhonetic(item.phone),
              ukphone: formatPhonetic(item.ukphone) || formatPhonetic(item.phone),
            })
          }
        }
      }

      this.isIndexInitialized = true
    } catch (err) {
      console.warn('Silent dictionary index init skipped:', err)
    }
  }

  /**
   * 异步在线查词兜底 (Online Dictionary Fallback)
   */
  public async fetchOnlineWordInfo(word: string): Promise<{ trans: string[]; usphone?: string; ukphone?: string } | null> {
    if (typeof window === 'undefined' || !word) return null
    const cleanWord = encodeURIComponent(word.trim().toLowerCase())

    try {
      // 优先请求有道开放词典 Suggest API
      const res = await fetch(`https://dict.youdao.com/suggest?q=${cleanWord}&num=1&doctype=json`)
      if (res.ok) {
        const data = await res.json()
        const entry = data?.data?.entries?.[0]
        if (entry && entry.explain) {
          return {
            trans: [entry.explain],
            usphone: `/${word.toLowerCase()}/`,
            ukphone: `/${word.toLowerCase()}/`,
          }
        }
      }
    } catch (e) {
      // 忽略在线请求网络异常
    }

    return null
  }

  /**
   * 解析中文释义字符串，提取词性 (pos) 与释义列表
   */
  public parsePosAndMeans(rawTrans: string[] | string): { pos: 'n.' | 'v.' | 'adj.' | 'adv.' | 'prep.' | 'conj.' | 'other'; means: string[] }[] {
    const lines = Array.isArray(rawTrans) ? rawTrans : [rawTrans]
    const result: { pos: any; means: string[] }[] = []

    for (const line of lines) {
      if (!line) continue
      const match = line.match(/^(n\.|v\.|vt\.|vi\.|adj\.|adv\.|prep\.|conj\.|art\.|pron\.)\s*(.*)$/i)
      if (match) {
        let posTag: any = match[1].toLowerCase()
        if (posTag === 'vt.' || posTag === 'vi.') posTag = 'v.'
        const content = match[2].trim()
        const means = content.split(/[；;,，]/).map((m) => m.trim()).filter(Boolean)
        result.push({
          pos: ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.'].includes(posTag) ? posTag : 'other',
          means: means.length > 0 ? means : [content || '常用释义'],
        })
      } else {
        const means = line.split(/[；;,，]/).map((m) => m.trim()).filter(Boolean)
        result.push({
          pos: 'n.',
          means: means.length > 0 ? means : [line],
        })
      }
    }

    return result.length > 0 ? result : [{ pos: 'n.', means: ['核心词义'] }]
  }

  /**
   * 核心三级自动补全函数 (Enrich Word)
   * 自动为单词填充音标、词性、中文释义、音节切分与构词法拆解
   *
   * overrides 里的每一项都是「用户填了就不再自动推导」，导入模板的选填列直接对应到这里。
   */
  public async enrichWord(name: string, overrides: WordEnrichOverrides = {}): Promise<WordItem> {
    const { meaning: customMeaning, phonetic: customPhonetic, syllables: customSyllables, etymology: customEtymology } = overrides

    const cleanName = name.trim()
    const lowerName = cleanName.toLowerCase()

    await this.ensureLexiconIndex()

    let transList: string[] = customMeaning ? [customMeaning] : []
    let usPhone = customPhonetic
    let ukPhone = customPhonetic

    // 1. 本地词库精确匹配 (Local Match)
    if (!customMeaning || !customPhonetic) {
      const localMatch = this.localLexiconMap.get(lowerName)
      if (localMatch) {
        if (!customMeaning && localMatch.trans.length) transList = localMatch.trans
        if (!customPhonetic) {
          usPhone = localMatch.usphone || `/ ${lowerName} /`
          ukPhone = localMatch.ukphone || localMatch.usphone || `/ ${lowerName} /`
        }
      }
    }

    // 2. 本地未命中时，尝试在线补全 (Online Match)
    if ((!transList.length || transList[0] === '用户导入释义') && !customMeaning) {
      const onlineInfo = await this.fetchOnlineWordInfo(cleanName)
      if (onlineInfo) {
        transList = onlineInfo.trans
        if (!usPhone) usPhone = onlineInfo.usphone
        if (!ukPhone) ukPhone = onlineInfo.ukphone
      }
    }

    // 3. 兜底处理
    if (!transList.length) transList = ['核心词义']
    if (!usPhone) usPhone = `/ ${lowerName} /`
    if (!ukPhone) ukPhone = `/ ${lowerName} /`

    // 4. 音节与构词法：人工拆解优先，没填才按字母启发式推导（两者都不涉及读音）
    const syllables = customSyllables?.length ? customSyllables : splitIntoSyllables(cleanName)
    const etymology = customEtymology ?? undefined
    const posList = this.parsePosAndMeans(transList)

    return {
      id: buildWordId(cleanName),
      name: cleanName,
      syllables,
      phoneticUs: usPhone,
      phoneticUk: ukPhone,
      posList,
      etymology,
    }
  }

  /**
   * 动态加载官方词书指定章节的 20 个单词
   */
  public async loadBookUnitWords(bookId: string, unitIndex: number, unitSize: number = 20): Promise<WordItem[]> {
    const config = OFFICIAL_BOOK_FILE_MAP[bookId] || OFFICIAL_BOOK_FILE_MAP['book_cet4']

    let allRawWords = this.bookJsonCache.get(config.path)
    if (!allRawWords && typeof window !== 'undefined') {
      try {
        const res = await fetch(config.path)
        if (res.ok) {
          allRawWords = await res.json()
          if (allRawWords) {
            this.bookJsonCache.set(config.path, allRawWords)
          }
        }
      } catch (err) {
        console.error('Failed to load book json file:', config.path, err)
      }
    }

    if (!allRawWords || !allRawWords.length) {
      return []
    }

    const startIndex = unitIndex * unitSize
    const rawSlice = allRawWords.slice(startIndex, startIndex + unitSize)

    // 批量补全并转化为标准 WordItem
    const enrichedList: WordItem[] = rawSlice.map((entry) => {
      const name = entry.name || ''
      const rawTrans = entry.trans || (entry.translation ? [entry.translation] : ['核心词义'])
      const rawUs = formatPhonetic(entry.usphone) || formatPhonetic(entry.phone)
      const rawUk = formatPhonetic(entry.ukphone) || formatPhonetic(entry.phone) || rawUs
      const usphone = rawUs || `/ ${name.toLowerCase()} /`
      const ukphone = rawUk || usphone

      // 词表自带的拆解优先，但音节仍要过一遍校验：拼不回原词的分段会让学习卡高亮错位
      const curatedSyllables = entry.syllables
      const syllables =
        curatedSyllables && isUsableSyllableSplit(name, curatedSyllables)
          ? curatedSyllables
          : splitIntoSyllables(name)
      const etymology = entry.etymology
      const posList = this.parsePosAndMeans(rawTrans)

      return {
        id: buildWordId(name),
        name,
        syllables,
        phoneticUs: usphone,
        phoneticUk: ukphone,
        posList,
        etymology,
      }
    })

    return enrichedList
  }

  /**
   * 动态读取官方词库 JSON 文件的实际单词总量
   */
  public async getBookTotalWords(bookId: string): Promise<number> {
    const config = OFFICIAL_BOOK_FILE_MAP[bookId]
    if (!config) return 0
    let allRawWords = this.bookJsonCache.get(config.path)
    if (!allRawWords && typeof window !== 'undefined') {
      try {
        const res = await fetch(config.path)
        if (res.ok) {
          allRawWords = await res.json()
          if (allRawWords) {
            this.bookJsonCache.set(config.path, allRawWords)
          }
        }
      } catch (err) {
        console.error('Failed to load book json file:', config.path, err)
      }
    }
    return allRawWords?.length || config.totalWords
  }
}

export const dictionaryLoader = new DictionaryLoader()
