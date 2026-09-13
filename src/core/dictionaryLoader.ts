import type { DictUnit, DictUnitCatalog, WordEtymology, WordExample, WordItem } from '@/types'
import { splitIntoSyllables, isUsableSyllableSplit } from '@/lib/syllables'
import { buildWordId } from '@/lib/wordId'
import { db } from '@/db'

/** 导入时由用户提供的字段，填了就跳过对应的自动推导 */
export interface WordEnrichOverrides {
  meaning?: string
  phonetic?: string
  syllables?: string[]
  etymology?: WordEtymology
  silentIndices?: number[]
  unitId?: string
}

export interface RawDictEntry {
  name: string
  /** 语义单元 ID (基础词汇带，如 "base_animals")；其他词库缺省 */
  unitId?: string
  trans?: string[]
  usphone?: string
  ukphone?: string
  phone?: string
  translation?: string
  /** 人工校订过的音节拆分与构词法，只有基础词汇这类精编词表会带，缺省时走自动推导 */
  syllables?: string[]
  etymology?: WordEtymology
  silentIndices?: number[]
  examples?: WordExample[]
  phrases?: { en: string; cn: string }[]
}

// 官方内置大词库文件映射关系
export const OFFICIAL_BOOK_FILE_MAP: Record<string, { path: string; totalWords: number; name: string }> = {
  'book_basewords': { path: '/dicts/basewords.json', totalWords: 4427, name: '基础词汇' },
  'book_cet4': { path: '/dicts/CET4_T.json', totalWords: 2607, name: 'CET-4 核心词库' },
  'book_kaoyan': { path: '/dicts/2025KaoYanHongBaoShu.json', totalWords: 3700, name: '考研英语 2025 高频词' },
  'book_ielts': { path: '/dicts/4000_Essential_English_Words-meaning.json', totalWords: 4000, name: '核心高频 4000 词' },
  'book_coder': { path: '/dicts/it-words.json', totalWords: 3824, name: '程序员词库' },
}

/**
 * 带语义单元目录的词库：单元不再按固定词数切片，而是由 unitId 归类而成。
 * 没有登记在这里的词库走「每 unitSize 个词一章」的老逻辑。
 */
export const OFFICIAL_BOOK_UNITS_FILE_MAP: Record<string, string> = {
  'book_basewords': '/dicts/basewords.units.json',
  'book_cet4': '/dicts/cet4.units.json',
  'book_coder': '/dicts/it-words.units.json',
}

function formatPhonetic(rawPhone?: string): string | undefined {
  if (!rawPhone) return undefined
  const cleaned = rawPhone.replace(/^\/+|\/+$/g, '').trim()
  return cleaned ? `/${cleaned}/` : undefined
}

class DictionaryLoader {
  private localLexiconMap: Map<string, { trans: string[]; usphone?: string; ukphone?: string }> = new Map()
  private bookJsonCache: Map<string, RawDictEntry[]> = new Map()
  private bookUnitsCache: Map<string, DictUnit[]> = new Map()
  private isIndexInitialized = false

  public clearCache() {
    this.bookJsonCache.clear()
    this.bookUnitsCache.clear()
  }

  /**
   * 加载词库的语义单元目录（仅登记在 OFFICIAL_BOOK_UNITS_FILE_MAP 的词库有）。
   * 没有目录的词库返回空数组，调用方据此回退到固定词数切片。
   */
  public async loadBookUnits(bookId: string): Promise<DictUnit[]> {
    const unitsPath = OFFICIAL_BOOK_UNITS_FILE_MAP[bookId]
    if (!unitsPath) return []

    const cached = this.bookUnitsCache.get(bookId)
    if (cached) return cached
    if (typeof window === 'undefined') return []

    try {
      const res = await fetch(unitsPath)
      if (!res.ok) return []
      const catalog: DictUnitCatalog = await res.json()
      const units = Array.isArray(catalog?.units)
        ? [...catalog.units].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : []
      if (units.length) this.bookUnitsCache.set(bookId, units)
      return units
    } catch (err) {
      console.error('Failed to load book units file:', unitsPath, err)
      return []
    }
  }

  /** 已经加载过的单元目录（同步读取，供渲染使用，未加载时返回 null） */
  public getCachedBookUnits(bookId: string): DictUnit[] | null {
    return this.bookUnitsCache.get(bookId) || null
  }

  /**
   * 词库的单元总数：有语义单元目录时取目录长度，否则返回 0（表示按词数切片）
   */
  public async getBookUnitCount(bookId: string): Promise<number> {
    const units = await this.loadBookUnits(bookId)
    return units.length
  }

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
            const rawTrans = item.trans || (item.translation ? [item.translation] : [])
            this.localLexiconMap.set(item.name.toLowerCase(), {
              trans: rawTrans,
              usphone: formatPhonetic(item.usphone) || formatPhonetic(item.phone),
              ukphone: formatPhonetic(item.ukphone) || formatPhonetic(item.phone),
            })
          }
        }
      }

      if (resIt && resIt.ok) {
        const itData: RawDictEntry[] = await resIt.json()
        for (const item of itData) {
          if (item.name) {
            const rawTrans = item.trans || (item.translation ? [item.translation] : [])
            const existing = this.localLexiconMap.get(item.name.toLowerCase())
            if (!existing) {
              this.localLexiconMap.set(item.name.toLowerCase(), {
                trans: rawTrans,
                usphone: formatPhonetic(item.usphone) || formatPhonetic(item.phone),
                ukphone: formatPhonetic(item.ukphone) || formatPhonetic(item.phone),
              })
            }
          }
        }
      }

      this.isIndexInitialized = true
    } catch (err) {
      console.warn('Failed to preheat lexicon index:', err)
    }
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
          pos: 'other',
          means: means.length > 0 ? means : [line],
        })
      }
    }

    return result.length > 0 ? result : [{ pos: 'other', means: ['核心词义'] }]
  }

  /**
   * 在线查词兜底接口（查不到时由外部免费词典 API 补全）
   */
  private async fetchOnlineWordInfo(word: string): Promise<{ trans: string[]; usphone?: string; ukphone?: string } | null> {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      if (!res.ok) return null
      const data = await res.json()
      if (!Array.isArray(data) || !data[0]) return null

      const first = data[0]
      const trans: string[] = []
      let usphone: string | undefined
      let ukphone: string | undefined

      if (first.phonetics && Array.isArray(first.phonetics)) {
        for (const p of first.phonetics) {
          if (p.text) {
            if (p.audio && p.audio.includes('-us.')) usphone = formatPhonetic(p.text)
            else if (p.audio && p.audio.includes('-uk.')) ukphone = formatPhonetic(p.text)
            else if (!usphone) usphone = formatPhonetic(p.text)
          }
        }
      }

      if (first.meanings && Array.isArray(first.meanings)) {
        for (const m of first.meanings) {
          const partOfSpeech = m.partOfSpeech ? `${m.partOfSpeech}.` : 'def.'
          if (m.definitions && m.definitions[0]?.definition) {
            trans.push(`${partOfSpeech} ${m.definitions[0].definition}`)
          }
        }
      }

      return {
        trans: trans.length ? trans : ['核心词义'],
        usphone,
        ukphone,
      }
    } catch {
      return null
    }
  }

  /**
   * 核心三级自动补全函数 (Enrich Word)
   * 自动为单词填充音标、词性、中文释义、音节切分与构词法拆解
   *
   * overrides 里的每一项都是「用户填了就不再自动推导」，导入模板的选填列直接对应到这里。
   */
  public async enrichWord(name: string, overrides: WordEnrichOverrides = {}): Promise<WordItem> {
    const {
      meaning: customMeaning,
      phonetic: customPhonetic,
      syllables: customSyllables,
      etymology: customEtymology,
      silentIndices: customSilentIndices,
      unitId: customUnitId,
    } = overrides

    const cleanName = name.trim()
    const lowerName = cleanName.toLowerCase()
    const wordId = buildWordId(cleanName)

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
    let syllables = customSyllables?.length ? customSyllables : splitIntoSyllables(cleanName)
    let etymology = customEtymology ?? undefined
    let silentIndices: number[] | undefined = customSilentIndices

    // 5. 检查本地 DB 中的用户修改覆盖
    if (typeof window !== 'undefined' && !customSyllables && !customEtymology) {
      try {
        const savedOverride = await db.wordOverrides.get(wordId)
        if (savedOverride) {
          if (savedOverride.syllables?.length) syllables = savedOverride.syllables
          if (savedOverride.etymology !== undefined) etymology = savedOverride.etymology
          if (savedOverride.silentIndices !== undefined) silentIndices = savedOverride.silentIndices
        }
      } catch {}
    }

    const posList = this.parsePosAndMeans(transList)

    return {
      id: wordId,
      name: cleanName,
      unitId: customUnitId,
      syllables,
      phoneticUs: usPhone,
      phoneticUk: ukPhone,
      posList,
      etymology,
      silentIndices,
    }
  }

  /** 拉取并缓存官方词库的原始词条数组 */
  private async fetchBookRawWords(bookId: string): Promise<RawDictEntry[]> {
    const config = OFFICIAL_BOOK_FILE_MAP[bookId] || OFFICIAL_BOOK_FILE_MAP['book_cet4']
    if (!config) return []

    const cached = this.bookJsonCache.get(config.path)
    if (cached) return cached
    if (typeof window === 'undefined') return []

    try {
      const res = await fetch(config.path)
      if (!res.ok) return []
      const data: RawDictEntry[] = await res.json()
      if (Array.isArray(data)) {
        this.bookJsonCache.set(config.path, data)
        return data
      }
      return []
    } catch (err) {
      console.error('Failed to load book json file:', config.path, err)
      return []
    }
  }

  /**
   * 把一条原始词条转成标准 WordItem（不含用户在 IndexedDB 里的覆盖）
   */
  private buildWordItemFromEntry(entry: RawDictEntry): WordItem {
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

    return {
      id: buildWordId(name),
      name,
      unitId: entry.unitId,
      syllables,
      phoneticUs: usphone,
      phoneticUk: ukphone,
      posList: this.parsePosAndMeans(rawTrans),
      etymology: entry.etymology,
      silentIndices: entry.silentIndices,
      examples: entry.examples,
      phrases: entry.phrases,
    }
  }

  /** 批量套用用户自定义覆盖（音节拆分/构词/例句/短语） */
  private async applyUserOverrides(words: WordItem[]): Promise<WordItem[]> {
    if (typeof window === 'undefined' || words.length === 0) return words
    try {
      const overrides = await db.wordOverrides.bulkGet(words.map((w) => w.id))
      for (let i = 0; i < words.length; i++) {
        const override = overrides[i]
        if (!override) continue
        if (override.syllables && override.syllables.length) {
          words[i].syllables = override.syllables
        }
        if (override.etymology !== undefined) {
          words[i].etymology = override.etymology
        }
        if (override.silentIndices !== undefined) {
          words[i].silentIndices = override.silentIndices
        }
        if (override.examples !== undefined && override.examples.length > 0) {
          words[i].examples = override.examples
        }
        if (override.phrases !== undefined && override.phrases.length > 0) {
          words[i].phrases = override.phrases
        }
      }
    } catch (err) {
      // 容错处理
    }
    return words
  }

  /**
   * 加载词库中某个单元的单词。
   *
   * - 登记了语义单元目录的词库（如基础词汇）：一个单元 = 该 unitId 下的全部单词，
   *   与 unitSize 无关；unitIndex 越界会钳到最后一个单元，避免旧进度读出空单元。
   * - 其他词库：维持「第 unitIndex 个 unitSize 词的切片」。
   */
  public async loadBookUnitWords(bookId: string, unitIndex: number, unitSize: number = 20): Promise<WordItem[]> {
    const allRawWords = await this.fetchBookRawWords(bookId)
    if (!allRawWords.length) return []

    const units = await this.loadBookUnits(bookId)
    let rawSlice: RawDictEntry[]

    if (units.length) {
      const safeIndex = Math.min(Math.max(0, unitIndex), units.length - 1)
      const targetUnitId = units[safeIndex].id
      rawSlice = allRawWords.filter((entry) => entry.unitId === targetUnitId)
    } else {
      const startIndex = Math.max(0, unitIndex) * unitSize
      rawSlice = allRawWords.slice(startIndex, startIndex + unitSize)
    }

    const enrichedList = rawSlice.map((entry) => this.buildWordItemFromEntry(entry))
    return this.applyUserOverrides(enrichedList)
  }

  /**
   * 加载官方词库的全部原始词条数据（带内存缓存）
   */
  public async loadAllBookRawWords(bookId: string): Promise<RawDictEntry[]> {
    return this.fetchBookRawWords(bookId)
  }

  /**
   * 将单个 RawDictEntry 转换为带有音节、发音、构词法与用户覆盖的标准 WordItem
   */
  public async convertRawEntryToWordItem(entry: RawDictEntry): Promise<WordItem> {
    const [wordItem] = await this.applyUserOverrides([this.buildWordItemFromEntry(entry)])
    return wordItem
  }

  /**
   * 动态读取官方词库 JSON 文件的实际单词总量
   */
  public async getBookTotalWords(bookId: string): Promise<number> {
    const config = OFFICIAL_BOOK_FILE_MAP[bookId]
    if (!config) return 0
    const allRawWords = await this.fetchBookRawWords(bookId)
    return allRawWords.length || config.totalWords
  }
}

export const dictionaryLoader = new DictionaryLoader()
