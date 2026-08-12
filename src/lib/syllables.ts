import type { WordEtymology, WordItem } from '@/types'

export type MorphemeRole = 'prefix' | 'root' | 'suffix' | 'syllable'

export interface WordMorpheme {
  text: string
  role: MorphemeRole
  meaning?: string
}

export const MORPHEME_ROLE_LABEL: Record<MorphemeRole, string> = {
  prefix: '前缀',
  root: '词根',
  suffix: '后缀',
  syllable: '音节',
}

/** 常见英语前缀字典库 */
const PREFIXES: Record<string, string> = {
  'anti': '反对/抗',
  'auto': '自己/自动',
  'co': '共同/一起',
  'col': '共同/一起',
  'com': '完全/共同',
  'con': '共同/完全',
  'contra': '相反/反对',
  'counter': '相反/对抗',
  'de': '向下/离开/去除',
  'dis': '否定/相反/去除',
  'em': '使进入/使具有',
  'en': '使进入/使具有',
  'ex': '出/向外/以前的',
  'extra': '额外的/超过',
  'fore': '在前/预先',
  'hyper': '超过/过度',
  'il': '不/无/非',
  'im': '不/非/向内',
  'in': '不/非/向内',
  'inter': '在...之间/相互',
  'intra': '在...之内',
  'ir': '不/非',
  'macro': '宏大的',
  'micro': '微小的',
  'mid': '中间的',
  'mis': '错误/坏',
  'mono': '单一/独个',
  'multi': '多数/多元',
  'non': '非/不',
  'over': '过度/在...之上',
  'pan': '全/总',
  'poly': '多元/许多',
  'post': '在...之后',
  'pre': '在...之前/预先',
  'pro': '向前/支持',
  'pseudo': '虚假/伪',
  're': '再次/返回/重复',
  'retro': '向后/复古',
  'semi': '半/部分',
  'sub': '在...之下/次级',
  'super': '超级/在...之上',
  'syn': '共同/相同',
  'sym': '共同/相同',
  'tele': '远程/远距离',
  'trans': '穿越/转移',
  'tri': '三/三个',
  'ultra': '极端/超越',
  'un': '不/未/非/去除',
  'under': '在...之下/不足',
}

/** 常见英语后缀字典库 */
const SUFFIXES: Record<string, string> = {
  'able': '能...的/可以...的 (adj.)',
  'ible': '能...的/可以...的 (adj.)',
  'al': '...的 (adj.) / 行为 (n.)',
  'ance': '性质/状态 (n.)',
  'ence': '性质/状态 (n.)',
  'ant': '人/具有...特性的 (n./adj.)',
  'ent': '人/...的 (n./adj.)',
  'ary': '与...有关的 (adj./n.)',
  'ate': '使成为 (v.) / 具有...的 (adj.)',
  'ation': '动作/过程/状态 (n.)',
  'tion': '动作/过程/结果 (n.)',
  'sion': '动作/状态 (n.)',
  'ed': '已完成的/被动的 (adj./v.)',
  'en': '使变成 (v.) / 由...制成的 (adj.)',
  'er': '从事...的人/物 (n.)',
  'or': '从事...的人/物 (n.)',
  'est': '最高级的 (adj./adv.)',
  'ful': '充满...的 (adj.)',
  'fy': '使化/使成 (v.)',
  'ic': '...的 (adj.)',
  'ical': '...的 (adj.)',
  'ing': '正在进行的 (adj./n.)',
  'ish': '微...的/带有...特征的 (adj.)',
  'ism': '主义/学说/行为 (n.)',
  'ist': '专家/信奉者 (n.)',
  'ity': '性质/状态 (n.)',
  'ty': '性质/状态 (n.)',
  'ive': '有...倾向的 (adj./n.)',
  'ize': '使...化 (v.)',
  'ise': '使...化 (v.)',
  'less': '无...的/没有...的 (adj.)',
  'ly': '...地 (adv.) / 具有...特性的 (adj.)',
  'ment': '行为/结果/状态 (n.)',
  'ness': '状态/性质 (n.)',
  'ous': '充满...的 (adj.)',
  'ious': '充满...的 (adj.)',
  'ship': '身份/状态/关系 (n.)',
  'ward': '向...方向 (adv./adj.)',
  'wise': '在...方面/照...方式 (adv.)',
  'y': '多...的/性质 (adj./n.)',
}

/** 常见经典词根库 */
const ROOTS: Record<string, string> = {
  'spect': '看 / 观察',
  'cover': '遮盖 / 覆盖',
  'port': '携带 / 搬运',
  'form': '形状 / 形成',
  'dict': '说话 / 断言',
  'tract': '拉 / 抽',
  'struct': '建造 / 构成',
  'ject': '投 / 掷',
  'vis': '看见',
  'vid': '看见',
  'aud': '听',
  'duc': '引导 / 带来',
  'duct': '引导 / 带来',
  'script': '写',
  'scrib': '写',
  'fact': '做 / 制造',
  'fect': '做 / 制造',
  'fic': '做 / 制造',
  'mit': '送 / 放出',
  'miss': '送 / 放出',
  'cap': '抓 / 头',
  'cept': '抓 / 接收',
  'ceive': '接收 / 握住',
  'cur': '跑 / 发生',
  'curs': '跑 / 发生',
  'gen': '出生 / 产生',
  'log': '言语 / 逻辑 / 学问',
  'path': '感情 / 痛苦',
  'phon': '声音',
  'vers': '转 / 转向',
  'vert': '转 / 转向',
  'voc': '声音 / 呼喊',
  'vok': '声音 / 呼喊',
}

/**
 * 单词音节划分启发式算法 (Syllable Splitter)
 * 将英文单词根据元音和辅音规则切分成音节数组
 */
export function splitIntoSyllables(word: string): string[] {
  const cleanWord = word.trim().toLowerCase()
  if (!cleanWord) return []
  if (cleanWord.length <= 3) return [cleanWord]

  // 特殊固定词典音节映射
  const knownOverrides: Record<string, string[]> = {
    'discover': ['dis', 'cov', 'er'],
    'perspective': ['per', 'spec', 'tive'],
    'international': ['in', 'ter', 'na', 'tion', 'al'],
    'developer': ['de', 'vel', 'op', 'er'],
    'education': ['ed', 'u', 'ca', 'tion'],
    'computer': ['com', 'pu', 'ter'],
    'algorithm': ['al', 'go', 'rithm'],
    'vocabulary': ['vo', 'cab', 'u', 'lar', 'y'],
    'application': ['ap', 'pli', 'ca', 'tion'],
    'javascript': ['java', 'script'],
    'kubernetes': ['ku', 'ber', 'ne', 'tes'],
    'important': ['im', 'por', 'tant'],
    'beautiful': ['beau', 'ti', 'ful'],
    'understand': ['un', 'der', 'stand'],
    'information': ['in', 'for', 'ma', 'tion'],
    'experience': ['ex', 'pe', 'ri', 'ence'],
  }

  if (knownOverrides[cleanWord]) {
    return knownOverrides[cleanWord]
  }

  // 基础音节切分规则
  const vowels = 'aeiouy'
  const syllables: string[] = []
  let currentSyllable = ''

  for (let i = 0; i < cleanWord.length; i++) {
    const char = cleanWord[i]
    currentSyllable += char

    const isVowel = vowels.includes(char)
    const nextChar = cleanWord[i + 1]
    const nextNextChar = cleanWord[i + 2]

    if (isVowel && nextChar && !vowels.includes(nextChar)) {
      // 遇到元音 + 辅音，判断是否切分
      if (nextNextChar && vowels.includes(nextNextChar)) {
        // V-C-V 结构切分 (如 e-du)
        if (i < cleanWord.length - 2 && currentSyllable.length >= 2) {
          syllables.push(currentSyllable)
          currentSyllable = ''
        }
      } else if (nextNextChar && !vowels.includes(nextNextChar) && i < cleanWord.length - 3) {
        // V-C-C-V 结构在辅音之间切分 (如 in-ter)
        currentSyllable += nextChar
        i++
        if (currentSyllable.length >= 2) {
          syllables.push(currentSyllable)
          currentSyllable = ''
        }
      }
    }
  }

  if (currentSyllable) {
    if (syllables.length > 0 && currentSyllable.length <= 1) {
      syllables[syllables.length - 1] += currentSyllable
    } else {
      syllables.push(currentSyllable)
    }
  }

  return syllables.length > 0 ? syllables : [cleanWord]
}

/**
 * 按构词法把单词切成「前缀 + 词根 + 后缀」，让学习者看到词义是怎么拼出来的。
 *
 * 词根库里的 form 是规范形式（perspective 的词根记作 spect），不保证和单词字面一致，
 * 所以这里只用词缀去对齐首尾，中间剩下的字母整段作为词根，确保各段拼接后仍等于原词，
 * 跟打进度才能按段高亮。一个词缀都对不上时退回音节切分。
 */
export function splitIntoMorphemes(word: WordItem): WordMorpheme[] {
  const name = word.name.trim().toLowerCase()
  const letters = (form?: string) => (form ? form.replace(/-/g, '').toLowerCase() : '')

  const prefix = letters(word.etymology?.prefix?.form)
  const suffix = letters(word.etymology?.suffix?.form)

  let start = 0
  let end = name.length

  if (prefix && name.startsWith(prefix) && prefix.length < name.length) {
    start = prefix.length
  }
  if (suffix && name.endsWith(suffix) && end - suffix.length > start) {
    end -= suffix.length
  }

  const middle = name.slice(start, end)

  if (!middle || (start === 0 && end === name.length)) {
    const fallback = word.syllables?.length ? word.syllables : splitIntoSyllables(name)
    return fallback.map((text) => ({ text, role: 'syllable' as const }))
  }

  const morphemes: WordMorpheme[] = []
  if (start > 0) {
    morphemes.push({ text: name.slice(0, start), role: 'prefix', meaning: word.etymology?.prefix?.meaning })
  }
  morphemes.push({ text: middle, role: 'root', meaning: word.etymology?.root?.meaning })
  if (end < name.length) {
    morphemes.push({ text: name.slice(end), role: 'suffix', meaning: word.etymology?.suffix?.meaning })
  }
  return morphemes
}

/**
 * 结构化解析单词的词根词缀 (Etymology Parser)
 */
export function analyzeEtymology(word: string): WordEtymology {
  const cleanWord = word.trim().toLowerCase()

  // 预置经典单词拆解示例
  const presets: Record<string, WordEtymology> = {
    'discover': {
      prefix: { form: 'dis-', meaning: '否定/相反/去除' },
      root: { form: 'cover', meaning: '覆盖/遮盖' },
      derivation: '去除覆盖的东西 → 揭开、发现、发掘',
    },
    'perspective': {
      prefix: { form: 'per-', meaning: '完全/透过' },
      root: { form: 'spect', meaning: '看/观察' },
      suffix: { form: '-ive', meaning: '形容词/名词后缀' },
      derivation: '透过现象看本质 → 视角、观点、透视画法',
    },
    'international': {
      prefix: { form: 'inter-', meaning: '在...之间/相互' },
      root: { form: 'nation', meaning: '国家/民族' },
      suffix: { form: '-al', meaning: '...的 (形容词后缀)' },
      derivation: '在国家与国家之间的 → 国际的、世界性的',
    },
    'inspect': {
      prefix: { form: 'in-', meaning: '向内/深入' },
      root: { form: 'spect', meaning: '看/观察' },
      derivation: '往里面仔细看 → 检查、视察',
    },
    'export': {
      prefix: { form: 'ex-', meaning: '向外/出' },
      root: { form: 'port', meaning: '携带/搬运' },
      derivation: '向外运送 → 出口、输出',
    },
    'import': {
      prefix: { form: 'im-', meaning: '向内/入' },
      root: { form: 'port', meaning: '携带/搬运' },
      derivation: '向内运送 → 进口、输入',
    },
  }

  if (presets[cleanWord]) {
    return presets[cleanWord]
  }

  // 动态匹配前缀与后缀
  let matchedPrefix: { form: string; meaning: string } | undefined
  let matchedSuffix: { form: string; meaning: string } | undefined
  let remaining = cleanWord

  // 检查前缀
  for (const [pre, mean] of Object.entries(PREFIXES)) {
    if (remaining.startsWith(pre) && remaining.length > pre.length + 2) {
      matchedPrefix = { form: `${pre}-`, meaning: mean }
      remaining = remaining.slice(pre.length)
      break
    }
  }

  // 检查后缀
  for (const [suf, mean] of Object.entries(SUFFIXES)) {
    if (remaining.endsWith(suf) && remaining.length > suf.length + 2) {
      matchedSuffix = { form: `-${suf}`, meaning: mean }
      remaining = remaining.slice(0, remaining.length - suf.length)
      break
    }
  }

  // 检查词根
  let matchedRoot: { form: string; meaning: string } | undefined
  for (const [root, mean] of Object.entries(ROOTS)) {
    if (remaining.includes(root)) {
      matchedRoot = { form: root, meaning: mean }
      break
    }
  }

  const rootDisplay = matchedRoot?.form || (remaining.length > 0 ? remaining : cleanWord)
  const rootMeaning = matchedRoot?.meaning || '词根核心'

  let derivation = ''
  if (matchedPrefix && matchedSuffix) {
    derivation = `${matchedPrefix.form} (${matchedPrefix.meaning}) + ${rootDisplay} (${rootMeaning}) + ${matchedSuffix.form} (${matchedSuffix.meaning})`
  } else if (matchedPrefix) {
    derivation = `${matchedPrefix.form} (${matchedPrefix.meaning}) + ${rootDisplay} (${rootMeaning}) → 核心派生义`
  } else if (matchedSuffix) {
    derivation = `${rootDisplay} (${rootMeaning}) + ${matchedSuffix.form} (${matchedSuffix.meaning})`
  } else {
    derivation = `${cleanWord} → 基础词汇`
  }

  return {
    prefix: matchedPrefix,
    root: matchedRoot || { form: rootDisplay, meaning: rootMeaning },
    suffix: matchedSuffix,
    derivation,
  }
}
