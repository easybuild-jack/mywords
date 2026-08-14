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

/** 常见经典词根库 (拉丁/希腊常用核心词根) */
const ROOTS: Record<string, string> = {
  // 爆破、拍击与动作
  'plos': '拍击 / 爆破 / 裂开',
  'plod': '拍击 / 爆破 / 轰鸣',
  'plaud': '拍击 / 鼓掌 / 称赞',
  'plaus': '拍击 / 鼓掌 / 认可',
  'rupt': '破裂 / 折断 / 爆发',
  'press': '压 / 按 / 挤',
  'tract': '拉 / 抽 / 吸引',
  'pel': '推 / 驱逐 / 促使',
  'puls': '推 / 驱动 / 脉冲',
  'pend': '悬挂 / 称量 / 支付',
  'pens': '悬挂 / 称量 / 支付',
  'tend': '伸展 / 趋向 / 照料',
  'tens': '伸展 / 拉紧',
  'tent': '伸展 / 触碰 / 保持',
  'flect': '弯曲 / 折射',
  'flex': '弯曲 / 灵活',
  'fract': '打碎 / 破裂',
  'frag': '打碎 / 易碎',
  'tort': '扭曲 / 折磨',
  'strict': '拉紧 / 束缚 / 严厉',
  'string': '拉紧 / 束缚',
  'strain': '拉紧 / 尽力',

  // 视觉、听觉、感觉与言语
  'spect': '看 / 观察 / 视角',
  'spic': '看 / 观察',
  'vis': '看 / 见 / 景象',
  'vid': '看 / 见 / 查明',
  'scop': '看 / 观察仪器',
  'aud': '听 / 声音',
  'phon': '声音 / 语音',
  'son': '声音 / 共鸣',
  'voc': '声音 / 呼喊 / 召唤',
  'vok': '声音 / 呼喊 / 召唤',
  'dict': '说话 / 断言 / 宣判',
  'nounce': '宣告 / 报告',
  'nunc': '宣告 / 传递',
  'log': '言语 / 逻辑 / 学问',
  'path': '感情 / 痛苦 / 感受',
  'sens': '感觉 / 意识 / 理解',
  'sent': '感觉 / 意识 / 意见',

  // 移动、空间与位置
  'ced': '走 / 让步 / 发生',
  'ceed': '走 / 前进 / 达到',
  'cess': '走 / 让步 / 过程',
  'cur': '跑 / 发生 / 流通',
  'curs': '跑 / 发生 / 进程',
  'grad': '步 / 走 / 阶级',
  'gress': '步 / 走 / 前进',
  'vad': '走 / 漫步 / 侵入',
  'vas': '走 / 漫步',
  'ven': '来 / 到达 / 聚集',
  'vent': '来 / 到达 / 发生',
  'err': '漫游 / 走错 / 误差',
  'migr': '迁移 / 移居',
  'mov': '移动 / 激发',
  'mot': '移动 / 动机',
  'mob': '移动 / 流动',
  'flu': '流 / 流动',
  'flux': '流 / 变迁',
  'vers': '转 / 转向 / 变化',
  'vert': '转 / 转向 / 改变',
  'vol': '滚 / 转 / 意愿',
  'volv': '滚 / 转 / 卷',
  'volut': '滚 / 转 / 旋转',
  'scend': '攀登 / 上升',
  'scent': '攀登 / 上升',

  // 放置、携带与创造
  'pos': '放置 / 摆放 / 姿态',
  'posit': '放置 / 定位 / 存放',
  'pon': '放置 / 安排',
  'port': '携带 / 搬运 / 港口',
  'fer': '运送 / 带来 / 产生',
  'lat': '携带 / 带来 / 侧面',
  'ject': '投 / 掷 / 发射',
  'jac': '投 / 掷 / 卧',
  'mit': '送 / 发射 / 允许',
  'miss': '送 / 派遣 / 散开',
  'fact': '做 / 制造 / 事实',
  'fect': '做 / 产生 / 影响',
  'fic': '做 / 产生 / 使成',
  'form': '形状 / 形式 / 形成',
  'struct': '建造 / 构成 / 组织',
  'labor': '劳动 / 工作 / 努力',
  'oper': '工作 / 操作 / 运转',

  // 保持、抓取、统治与能力
  'cap': '抓 / 拿 / 头 / 容纳',
  'cept': '抓 / 接收 / 领会',
  'ceive': '接收 / 握住 / 构想',
  'cip': '抓 / 拿 / 首要',
  'ten': '握住 / 保持 / 容纳',
  'tain': '握住 / 保持 / 支撑',
  'tin': '握住 / 延续',
  'sta': '站立 / 建立 / 稳定',
  'stat': '站立 / 状态 / 规定',
  'sist': '站立 / 保持 / 存在',
  'stit': '建立 / 设置',
  'serv': '保持 / 服务 / 留存',
  'hab': '拥有 / 居住 / 习惯',
  'habit': '拥有 / 居住 / 习性',
  'hibit': '持 / 握 / 展现 / 阻止',
  'mand': '命令 / 委托 / 托付',
  'pot': '力量 / 能力 / 有效',
  'poss': '能够 / 拥有 / 力量',
  'val': '强壮 / 价值 / 力量',
  'vail': '强壮 / 价值 / 效用',
  'vict': '战胜 / 征服 / 证明',
  'vinc': '战胜 / 征服 / 说服',

  // 思想、记忆、生命与人
  'cogn': '知道 / 认识 / 理解',
  'sci': '知晓 / 知识 / 明白',
  'not': '知道 / 标记 / 记录',
  'mem': '记忆 / 记住',
  'memor': '记忆 / 纪念',
  'ment': '思考 / 心智 / 意愿',
  'cord': '心 / 心意 / 和谐',
  'card': '心 / 心脏',
  'cred': '相信 / 信任 / 凭据',
  'fid': '信任 / 忠诚 / 信心',
  'viv': '生命 / 活着 / 活力',
  'vit': '生命 / 关键 / 必需',
  'bio': '生命 / 生物',
  'gen': '出生 / 产生 / 种族',
  'gener': '产生 / 种类 / 繁衍',
  'nat': '出生 / 天生 / 民族',
  'mort': '死亡 / 终结',
  'mori': '死亡 / 衰亡',
  'corp': '身体 / 实体 / 组织',
  'ped': '脚 / 足 / 基础',
  'pod': '脚 / 足',
  'man': '手 / 操作',
  'manu': '手 / 手工',

  // 关系、切割、界限与度量
  'junct': '连接 / 结合 / 汇合',
  'join': '连接 / 加入',
  'nect': '绑定 / 连接',
  'nex': '绑定 / 纽带',
  'cid': '切 / 割 / 杀',
  'cis': '切 / 割 / 剖',
  'sect': '切割 / 划分 / 部分',
  'tom': '切 / 割 / 分解',
  'part': '部分 / 分开 / 参与',
  'fin': '界限 / 终点 / 结束',
  'term': '界限 / 期限 / 终点',
  'termin': '界限 / 结束 / 确定',
  'tact': '接触 / 触摸 / 完整',
  'tang': '接触 / 触摸',
  'teg': '完整 / 覆盖',
  'cover': '遮盖 / 覆盖 / 发现',
  'plic': '折叠 / 重叠 / 纠缠',
  'ply': '折叠 / 应用 / 回应',
  'ple': '充满 / 折叠 / 倍数',
  'plet': '充满 / 完备',
  'plex': '重叠 / 复杂',

  // 文本、法律、自然与真理
  'script': '写 / 记录 / 剧本',
  'scrib': '写 / 描绘',
  'graph': '写 / 画 / 记录仪',
  'gram': '写 / 图 / 字母',
  'leg': '读 / 收集 / 法律 / 挑选',
  'lect': '读 / 收集 / 选择',
  'lig': '挑选 / 收集 / 绑定',
  'jur': '法律 / 发誓 / 正义',
  'jud': '审判 / 判断 / 裁决',
  'just': '公正 / 正确 / 正义',
  'norm': '规范 / 标准 / 规则',
  'rect': '正 / 直 / 引导 / 纠正',
  'veri': '真实 / 准确',
  'fall': '欺骗 / 犯错',
  'fals': '虚假 / 错误',
  'nov': '新 / 新奇',
  'dur': '持续 / 坚固 / 忍受',
  'vac': '空 / 空出 / 虚',
  'van': '空 / 消失 / 虚无',
  'geo': '地球 / 土地',
  'terr': '土地 / 地面 / 领域',
  'mari': '海洋 / 航海',
  'aer': '空气 / 天空 / 航空',
  'hydr': '水 / 液体',
  'therm': '热 / 温度',
  'chron': '时间 / 时代',
  'tele': '远 / 远程',
  'auto': '自己 / 自动',
}

const VOWEL_LETTERS = 'aeiou'

/** 双字母组合只发一个音素，切分时不能从中间拆开 */
const DIGRAPHS = new Set(['th', 'sh', 'ch', 'ph', 'wh', 'ck', 'ng', 'gh', 'qu'])

/** 元音核：一段连续元音字母，闭区间 */
interface VowelNucleus {
  start: number
  end: number
}

/**
 * 判断某一位是不是元音字母。两个特例：
 * - y 只在词首且后接元音时是辅音（yes、young），其余位置算元音（happy、rhythm、day）
 * - qu 里的 u 不独立成核，它属于辅音簇（quick、queen）
 *
 * 学习卡给元音上色也用这个判断，保证配色和音节切分对「元音」的认定是同一套。
 * 注意只识别小写字母，调用方需要先把单词转成小写。
 */
export function isVowelAt(word: string, index: number): boolean {
  const char = word[index]
  if (char === 'u' && index > 0 && word[index - 1] === 'q') return false
  if (VOWEL_LETTERS.includes(char)) return true
  if (char !== 'y') return false
  return !(index === 0 && word[1] !== undefined && VOWEL_LETTERS.includes(word[1]))
}

/** 找出所有元音核，连续的元音字母合并为一个（beau、rain 各算一个核） */
function findVowelNuclei(word: string): VowelNucleus[] {
  const nuclei: VowelNucleus[] = []
  let i = 0
  while (i < word.length) {
    if (!isVowelAt(word, i)) {
      i++
      continue
    }
    const start = i
    while (i + 1 < word.length && isVowelAt(word, i + 1)) i++
    nuclei.push({ start, end: i })
    i++
  }
  return nuclei
}

/**
 * 摘掉不发音的元音核，否则会多切出一个音节。
 * 词尾哑 e：cake 是一个音节而不是 ca-ke；
 * -ed 结尾：前一个字母不是 t/d 时 e 不发音，hoped 一个音节，wanted 两个。
 */
function dropSilentNuclei(word: string, nuclei: VowelNucleus[]): VowelNucleus[] {
  if (nuclei.length < 2) return nuclei
  const last = nuclei[nuclei.length - 1]
  const isSingleLetter = last.start === last.end

  if (isSingleLetter && last.end === word.length - 1 && word.endsWith('e')) {
    return nuclei.slice(0, -1)
  }

  if (isSingleLetter && last.end === word.length - 2 && word.endsWith('ed')) {
    const before = word[word.length - 3]
    if (before && !'td'.includes(before)) return nuclei.slice(0, -1)
  }

  return nuclei
}

/**
 * 在相邻元音核之间选一个切点，切点即下一音节的起始下标。
 *
 * 单辅音归后一个音节（V-CV：o-pen、ba-by），这是教材默认规则；
 * 两个以上辅音则从第一个之后切开（VC-CV：let-ter、mon-ster），
 * 但双字母一音必须整体留给后一个音节（mo-ther、tea-cher）。
 */
function findCutPoints(word: string, nuclei: VowelNucleus[]): number[] {
  const cuts: number[] = []

  for (let n = 0; n < nuclei.length - 1; n++) {
    // 元音核是极大连续段，两核之间必然夹着至少一个辅音
    const clusterStart = nuclei[n].end + 1
    const clusterSize = nuclei[n + 1].start - clusterStart

    if (clusterSize === 1) {
      cuts.push(clusterStart)
      continue
    }

    const firstPair = word.slice(clusterStart, clusterStart + 2)
    cuts.push(DIGRAPHS.has(firstPair) ? clusterStart : clusterStart + 1)
  }

  return cuts
}

/**
 * 单词音节划分启发式算法 (Syllable Splitter)
 *
 * 先定位元音核，再在核之间分配辅音，因此每个音节必然含且仅含一个元音核——
 * 旧实现是顺序扫字母遇到辅音就切，会产出 ht、pt 这类无元音、读不出来的碎片。
 * 无法判断时一律少切（整词返回），错在保守总比给出读不出的音节好。
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

  // 「辅音 + le」结尾自成一个音节（ta-ble、lit-tle、a-ble）。
  // 先把它摘走再切前半部分，否则 table 会被切成 tab-le。
  // 前面是元音时不算（whole、while 的 le 不独立成节）
  if (cleanWord.endsWith('le') && cleanWord.length >= 4 && !isVowelAt(cleanWord, cleanWord.length - 3)) {
    const head = cleanWord.slice(0, cleanWord.length - 3)
    return [...splitIntoSyllables(head), cleanWord.slice(cleanWord.length - 3)]
  }

  const nuclei = dropSilentNuclei(cleanWord, findVowelNuclei(cleanWord))
  const bounds = [0, ...findCutPoints(cleanWord, nuclei), cleanWord.length]

  const syllables: string[] = []
  for (let i = 0; i < bounds.length - 1; i++) {
    syllables.push(cleanWord.slice(bounds[i], bounds[i + 1]))
  }

  // 跟打进度要按段高亮，各段拼接必须还原成原词。
  // 切点算错时宁可整词返回，也不能给出对不上原词的分段
  if (syllables.join('') !== cleanWord) return [cleanWord]

  return syllables.filter(Boolean)
}

/**
 * 判断一份现成的音节切分能不能直接用。两条硬性要求：
 * 拼接必须还原成单词（学习卡按段高亮跟打进度），且每段都要含元音字母。
 *
 * 导入时人工填写的拆分照此放行；而错词本在 IndexedDB 里存的旧快照会被挡下来——
 * 旧切分算法会产出 ht 这类无元音碎片，它拼接得回原词，只能靠元音这一条拦住。
 * 代价是 rhythm 这种含成音节辅音的词（rhy-thm）也会被拒，退回自动切分，属于可接受的误伤。
 */
export function isUsableSyllableSplit(name: string, syllables?: string[]): boolean {
  if (!syllables?.length) return false

  const clean = name.trim().toLowerCase()
  if (syllables.join('').toLowerCase() !== clean) return false

  return syllables.every((part) => [...part.toLowerCase()].some((char) => 'aeiouy'.includes(char)))
}

/**
 * 音节的统一取用口径：人工拆分过了校验就用它，否则现算。
 *
 * 音节拆分模块和主词的字母组合上色都要按同一份音节来，
 * 各自算一套的话会出现「拆分显示 di-rec-to-ry，上色却把 ir 当成一个单位」这种自相矛盾。
 */
export function resolveSyllables(word: WordItem): string[] {
  return isUsableSyllableSplit(word.name, word.syllables) ? word.syllables : splitIntoSyllables(word.name)
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
    return resolveSyllables(word).map((text) => ({ text, role: 'syllable' as const }))
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
    'explosive': {
      prefix: { form: 'ex-', meaning: '向外/出' },
      root: { form: 'plos', meaning: '拍击/爆破/裂开' },
      suffix: { form: '-ive', meaning: '有...特性的 (adj./n.)' },
      derivation: '向外爆破裂开的特性/物品 → 爆炸的、爆炸物',
    },
    'explode': {
      prefix: { form: 'ex-', meaning: '向外/出' },
      root: { form: 'plod', meaning: '拍击/爆破/轰鸣' },
      derivation: '向外轰然爆开 → 爆炸、爆发',
    },
    'explosion': {
      prefix: { form: 'ex-', meaning: '向外/出' },
      root: { form: 'plos', meaning: '拍击/爆破/裂开' },
      suffix: { form: '-ion', meaning: '动作/过程/结果 (n.)' },
      derivation: '向外爆破的过程 → 爆炸、爆发',
    },
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

  // 动态匹配前缀与后缀 (按长度降序优先匹配最长词缀)
  let matchedPrefix: { form: string; meaning: string } | undefined
  let matchedSuffix: { form: string; meaning: string } | undefined
  let remaining = cleanWord

  // 检查前缀
  const sortedPrefixes = Object.entries(PREFIXES).sort((a, b) => b[0].length - a[0].length)
  for (const [pre, mean] of sortedPrefixes) {
    if (remaining.startsWith(pre) && remaining.length > pre.length + 2) {
      matchedPrefix = { form: `${pre}-`, meaning: mean }
      remaining = remaining.slice(pre.length)
      break
    }
  }

  // 检查后缀
  const sortedSuffixes = Object.entries(SUFFIXES).sort((a, b) => b[0].length - a[0].length)
  for (const [suf, mean] of sortedSuffixes) {
    if (remaining.endsWith(suf) && remaining.length > suf.length + 2) {
      matchedSuffix = { form: `-${suf}`, meaning: mean }
      remaining = remaining.slice(0, remaining.length - suf.length)
      break
    }
  }

  // 检查词根 (按词根长度降序优先匹配)
  let matchedRoot: { form: string; meaning: string } | undefined
  const sortedRoots = Object.entries(ROOTS).sort((a, b) => b[0].length - a[0].length)
  for (const [root, mean] of sortedRoots) {
    if (remaining.includes(root)) {
      matchedRoot = { form: root, meaning: mean }
      break
    }
  }

  const rootDisplay = matchedRoot?.form || (remaining.length > 0 ? remaining : cleanWord)
  const rootMeaning = matchedRoot?.meaning || (matchedPrefix || matchedSuffix ? '核心词基' : '基础词根')

  let derivation = ''
  if (matchedPrefix && matchedSuffix) {
    derivation = `${matchedPrefix.form} (${matchedPrefix.meaning}) + ${rootDisplay} (${rootMeaning}) + ${matchedSuffix.form} (${matchedSuffix.meaning})`
  } else if (matchedPrefix) {
    derivation = `${matchedPrefix.form} (${matchedPrefix.meaning}) + ${rootDisplay} (${rootMeaning}) → 派生拓展义`
  } else if (matchedSuffix) {
    derivation = `${rootDisplay} (${rootMeaning}) + ${matchedSuffix.form} (${matchedSuffix.meaning})`
  } else if (matchedRoot) {
    derivation = `词根 ${matchedRoot.form} (${matchedRoot.meaning}) → 基础词汇`
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
