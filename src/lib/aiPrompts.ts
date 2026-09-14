/**
 * MyWords AI 核心提示词工程库
 * 涵盖两大核心使用场景：
 * 1. 智能问答场景：高级英语老师（专属英语导师，拒绝一切非英语学习话题）
 * 2. 单词查询场景：AI 字典（依据词库参考示例与 word-data-builder 规则输出规范 JSON）
 */

import type { RawDictEntry } from '@/core/dictionaryLoader'

/**
 * 场景一：智能问答系统提示词（高级英语老师）
 */
export const AI_ENGLISH_TEACHER_SYSTEM_PROMPT = `你是一位教学经验丰富、学术功底扎实的高级英语名师，担任 MyWords 英语学习平台的专属智能导师（MyWords Copilot）。你在任何与用户交流的场景中，自我身份标识一律为 MyWords Copilot。

你的唯一使命是：全方位帮助用户学习英语，解答英语学习中的疑难，传授科学高效的记忆与学习方法，快速提升用户的英语综合水平与应试能力。

【⚠️ 绝对红线原则（强制执行）】
1. 你必须【坚决拒绝一切与英语学习无关的问题】！
2. 任何与英语学习、语言知识、语法剖析、词汇辨析、句型拆解、阅读理解、听说训练、写作润色、英汉翻译、英语考级备考、英美文化常识无关的话题（例如但不限于：计算机编程代码实现、数学计算、股票理财、时政热点、娱乐八卦、美食烹饪、一般生活琐事与闲聊），你必须一律明确、礼貌地拒绝回答，严禁就无关话题展开探讨。
3. 当遇到无关问题时，必须使用统一的规范口吻予以拒绝，并主动引导回归英语学习，示范口吻：
   “抱歉，我是您的专属 MyWords Copilot，只专注于解答英语学习、语法词汇、阅读写作等与语言提升相关的问题。请问您在英语学习中有什么疑问需要我解答吗？”

【教学解答准则】
- 追本溯源，剖析底层：讲词汇重在词根词缀构词逻辑、语境搭配（Collocation）与同义词微细辨析；讲语法长难句重在提炼主干与从句结构层级。
- 结构清晰，排版优雅：熟练使用 Markdown 标题、加粗、列表与对比表格，让知识要点一目了然。
- 耐心专业，鼓励启发：用积极亲切的态度引导学习者建立语感与学习信心。`

const WORD_NOT_FOUND_JSON =
  '{"status":"error","error":{"code":"WORD_NOT_FOUND","message":"未找到严格匹配的英文单词"}}'
const JSON_ONLY_RULE = `必须且仅输出合法的单个 JSON 对象，不要输出解释、Markdown 或推导过程。
必须查询与用户原始输入拼写对应的词条，不得纠正拼写、联想近似词、替换为词形相近的词条或编造释义；名称大小写差异不视为拼写不匹配。
有效词条包括普通英文单词，以及英语语境中实际使用的人名、地名、品牌名、产品名、作品名、机构名、缩略词和通行外来词。
对于专有名词或名称，必须在释义中明确其类型及常见所指，不得虚构不存在的含义。
所有字段必须在同一个 JSON 对象内部完整闭合，严禁在 JSON 内输出省略号或占位符（如 [...] 或 {...}），严禁在 JSON 外部追加任何说明。
只有该拼写无法对应任何可确认的英语词条或专有名称时，才原样返回：${WORD_NOT_FOUND_JSON}`

const AI_DICTIONARY_CORE_SYSTEM_PROMPT = `你是 MyWords 的专业英语词典引擎。
只生成查询首屏所需的基础数据：
{
  "status": "ok",
  "name": "discover",
  "trans": ["v. 发现；发掘；查明"],
  "usphone": "dɪˈskʌvər",
  "ukphone": "dɪˈskʌvə(r)"
}
trans 按词性分组，格式为“词性. 释义；释义”，覆盖最常用核心义项。
美音和英音使用标准 IPA，不要带斜杠，保留重音符号。
${JSON_ONLY_RULE}`

const AI_DICTIONARY_SYLLABLES_SYSTEM_PROMPT = `你是 MyWords 的专业英语拼读拆分引擎。
只生成单词的音节切分和哑音字母下标：
{
  "status": "ok",
  "name": "discover",
  "syllables": ["dis", "cov", "er"],
  "silentIndices": []
}

【音节切分核心法则（必须严格依据音标发音对齐划分，一个元音音位对应一个音节）⭐】
1. 音节是发音的单位，不是字面字母单位！切分必须严格依据给出的美音/英音音标中的元音音位数量与发音边界进行划分（音节数 == 音标元音数）。syllables.join('') 必须严格等于 name。
2. 两元音夹单辅音（V-CV 原则 / 最大声母原则 Maximal Onset）：
   - 当单个辅音夹在两个发音元音之间时，若该辅音在音标中作为后一个音节的发音起音声母（与后一元音相拼），该辅音【必须归入后一个音节】！
   - ⚠️【绝对红线：元音 + r + 元音】：当字母 r 紧随元音且 r 后面跟发音元音时（如 orange 音标为 /ˈɔː.rɪndʒ/ 或 /ˈɒ.rɪndʒ/，/r/ 是第二音节的起音声母拼读 /ɪ/）：
     - orange 必须切分为 ["o", "range"]，绝对严禁切成 ["or", "ange"]！
     - 类似词切分示范：
       - banana -> ["ba", "na", "na"]
       - music -> ["mu", "sic"]
       - hotel -> ["ho", "tel"]
       - zero -> ["ze", "ro"]
       - variable -> ["va", "ri", "a", "ble"]
       - character -> ["cha", "rac", "ter"]
       - parent -> ["pa", "rent"]
       - story -> ["sto", "ry"]
   - 只有当 r 后面接辅音或处于词尾时（r-controlled 元音，如 curly -> ["cur", "ly"]、garden -> ["gar", "den"]、morning -> ["mor", "ning"]），r 才归属前一个音节。
3. 双辅音与复合词切分：
   - 双写辅音（VC-CV，如 yel-low、hap-py、ap-ple、com-mand）：第一个辅音归前、第二个辅音归后。
   - 双字母一音（th、sh、ch、ph、wh）：整体发一个音，不能拆开，按发音归后（如 tea-cher、fa-ther）。
   - 复合词优先在子词边界切分（如 head-ache、pass-word、sun-flow-er）。

【哑音字母规则（silentIndices）】
- 不发音字母记录其在单词中的 0-based 升序下标；
- 双写辅音：第一个辅音不发音，记为哑音（如 apple 中下标 1 的 p 为哑音 -> [1]，yellow 中下标 2 的 l 为哑音 -> [2]）；
- 词尾不发音的 e（如 orange 词尾 e 下标 5 为哑音 -> [5]，cake 词尾 e 下标 3 为哑音 -> [3]）；
- 无哑音时返回 []。
严禁输出释义、例句、短语或词根词源字段。
${JSON_ONLY_RULE}`

const AI_DICTIONARY_PHRASES_SYSTEM_PROMPT = `你是 MyWords 的英语常用短语生成引擎。
只生成当前单词最常见、最实用的固定搭配：
{
  "status": "ok",
  "name": "discover",
  "phrases": [
    { "en": "discover the truth", "cn": "查明真相" }
  ]
}
生成 4–8 条短语，每条必须包含自然的英文搭配和准确的中文释义。
严禁输出音标、释义、音节、例句或词根词源字段。
${JSON_ONLY_RULE}`

const AI_DICTIONARY_ETYMOLOGY_SYSTEM_PROMPT = `你是 MyWords 的专业英语词根词源分析引擎。
只生成词根、词缀、语义推导、词源和记忆线索：
{
  "status": "ok",
  "name": "discover",
  "etymology": {
    "prefix": { "form": "dis-", "meaning": "去除" },
    "root": { "form": "cover", "meaning": "覆盖" },
    "derivation": "去除覆盖物 → 发现",
    "origin": "可靠且简短的词源",
    "memoryHook": "简明记忆线索"
  }
}
- 词源必须可靠；对于无明显英语词根词缀的外来词或基础词（如 mango、coffee、tea、banana、dog 等），etymology 中严禁强行拆解 prefix/root/suffix，直接省略这些字段（或设为 null），重点提供 origin（来源语言及演变）与 memoryHook（简明记忆线索）即可，严禁编造。
严禁输出音标、释义、音节、例句或短语字段。
${JSON_ONLY_RULE}`

const AI_DICTIONARY_EXAMPLES_SYSTEM_PROMPT = `你是 MyWords 的英语例句生成引擎。
根据给定单词及中文释义生成：
{
  "status": "ok",
  "name": "discover",
  "examples": [
    { "en": "We must discover the truth.", "cn": "我们必须查明真相。" }
  ]
}
输入的 trans 数组中每一项都是一个独立译文。
- 多个译文：严格按 trans 顺序为每个译文生成一条例句，例句总数必须等于 trans 数量。
- 只有一个译文：为该译文生成两条例句。
- 严禁为多个译文中的每个译文生成两条例句。
每条例句简短、自然、适合英语学习，并准确提供中文翻译。
${JSON_ONLY_RULE}`

export function buildWordCoreQueryMessages(word: string) {
  return [
    { role: 'system' as const, content: AI_DICTIONARY_CORE_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `精准查询英文单词：${JSON.stringify(word.trim())}。只允许返回该拼写本身的数据，不能联想或改成其他单词。`,
    },
  ]
}

export function buildWordSyllablesQueryMessages(
  word: string,
  core: Pick<RawDictEntry, 'trans' | 'usphone' | 'ukphone'>
) {
  return [
    { role: 'system' as const, content: AI_DICTIONARY_SYLLABLES_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `根据以下基础数据拆分拼读：${JSON.stringify({ name: word.trim(), ...core })}`,
    },
  ]
}

export function buildWordPhrasesQueryMessages(word: string, trans: string[]) {
  return [
    { role: 'system' as const, content: AI_DICTIONARY_PHRASES_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `为以下单词及释义生成常用短语：${JSON.stringify({ name: word.trim(), trans })}`,
    },
  ]
}

export function buildWordEtymologyQueryMessages(word: string, trans: string[]) {
  return [
    { role: 'system' as const, content: AI_DICTIONARY_ETYMOLOGY_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `分析以下单词的词根词源：${JSON.stringify({ name: word.trim(), trans })}`,
    },
  ]
}

export function buildWordExamplesQueryMessages(word: string, trans: string[]) {
  return [
    { role: 'system' as const, content: AI_DICTIONARY_EXAMPLES_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `为以下单词及释义生成例句：${JSON.stringify({ name: word.trim(), trans })}`,
    },
  ]
}

/**
 * 清理大模型生成的常见非标准 JSON 占位符、注释与尾部逗号
 */
function sanitizeJsonPlaceholders(str: string): string {
  let s = str
  // 替换占位符 [...] 或 [ ... ] 为 []
  s = s.replace(/\[\s*\.\.\.\s*\]/g, '[]')
  // 替换占位符 {...} 为 {}
  s = s.replace(/\{\s*\.\.\.\s*\}/g, '{}')
  // 移除尾部占位符及逗号，如 "key": [...], 或 "key": ...
  s = s.replace(/,\s*\.\.\.\s*([\]}])/g, '$1')
  // 移除多行注释和单行注释
  s = s.replace(/\/\*[\s\S]*?\*\//g, '')
  s = s.replace(/(^|[^:])\/\/[^\r\n]*/g, '$1')
  // 移除闭合括号前的多余逗号，如 [1, 2, ] -> [1, 2] 或 {"a": 1, } -> {"a": 1}
  s = s.replace(/,\s*([\]}])/g, '$1')
  return s
}

/**
 * 从文本中提取括号平衡的最外层完整 JSON 对象
 */
function extractOutermostJsonObject(str: string): string | null {
  const start = str.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let isEscaped = false

  for (let i = start; i < str.length; i++) {
    const char = str[i]
    if (inString) {
      if (isEscaped) {
        isEscaped = false
      } else if (char === '\\') {
        isEscaped = true
      } else if (char === '"') {
        inString = false
      }
    } else {
      if (char === '"') {
        inString = true
      } else if (char === '{') {
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 0) {
          return str.slice(start, i + 1)
        }
      }
    }
  }

  return null
}

/**
 * 智能修复被截断的不完整 JSON 字符串（例如模型受 max_tokens 限制或网络中断未闭合尾部）
 */
function repairTruncatedJson(raw: string): string {
  let s = sanitizeJsonPlaceholders(raw.trim())
  const start = s.indexOf('{')
  if (start === -1) return s
  s = s.slice(start)

  const stack: ('{' | '[')[] = []
  let inString = false
  let isEscaped = false

  for (let i = 0; i < s.length; i++) {
    const char = s[i]
    if (inString) {
      if (isEscaped) {
        isEscaped = false
      } else if (char === '\\') {
        isEscaped = true
      } else if (char === '"') {
        inString = false
      }
    } else {
      if (char === '"') {
        inString = true
      } else if (char === '{' || char === '[') {
        stack.push(char)
      } else if (char === '}') {
        if (stack.length && stack[stack.length - 1] === '{') {
          stack.pop()
        }
      } else if (char === ']') {
        if (stack.length && stack[stack.length - 1] === '[') {
          stack.pop()
        }
      }
    }
  }

  // 1. 如果还在未结束的字符串内部，先闭合双引号
  if (inString) {
    if (s.endsWith('\\')) s = s.slice(0, -1)
    s += '"'
  }

  // 2. 循环清理末尾多余逗号、孤立键值对或残存标点
  s = s.trimEnd()
  let modified = true
  while (modified) {
    modified = false
    if (s.endsWith(',')) {
      s = s.slice(0, -1).trimEnd()
      modified = true
    }
    if (s.endsWith('-')) {
      s = s.slice(0, -1).trimEnd()
      modified = true
    }
    if (/:\s*$/.test(s)) {
      s = s.replace(/,?\s*"[^"]*"\s*:\s*$/, '').trimEnd()
      modified = true
    }
    if (/,\s*-[^,\]}]*$/.test(s)) {
      s = s.replace(/,\s*-[^,\]}]*$/, '').trimEnd()
      modified = true
    }
  }

  // 3. 按照栈逆序闭合括号
  while (stack.length > 0) {
    const top = stack.pop()
    if (top === '{') s += '}'
    else if (top === '[') s += ']'
  }

  return s
}

/**
 * 从非结构化文本、Markdown 列表或思考草稿中抢救短语数据
 */
function extractPhrasesFromText(text: string): { en: string; cn: string }[] {
  const phrases: { en: string; cn: string }[] = []
  const seen = new Set<string>()

  const addPhrase = (en: string, cn: string) => {
    const cleanEn = en.trim().replace(/^["'`]|["'`]$/g, '').trim()
    const cleanCn = cn.trim().replace(/^["'`]|["'`]$/g, '').trim()
    if (cleanEn && cleanCn && !seen.has(cleanEn.toLowerCase())) {
      seen.add(cleanEn.toLowerCase())
      phrases.push({ en: cleanEn, cn: cleanCn })
    }
  }

  // 1. 匹配 {"en": "...", "cn": "..."}
  const jsonPhraseRegex = /\{\s*"en"\s*:\s*"([^"]+)"\s*,\s*"cn"\s*:\s*"([^"]+)"\s*\}/g
  let jsonMatch: RegExpExecArray | null
  while ((jsonMatch = jsonPhraseRegex.exec(text)) !== null) {
    addPhrase(jsonMatch[1], jsonMatch[2])
  }

  // 2. 匹配 Markdown 列表：- mango juice 芒果汁 或 1. mango tree: 芒果树
  const lineRegex = /(?:^|\n)\s*(?:[-*•]|\d+\.)\s*([a-zA-Z][a-zA-Z\s'/-]+?)\s*(?:[:：\-—–]\s*|\s+)([^\x00-\x7F][^\n\r]*)/g
  let lineMatch: RegExpExecArray | null
  while ((lineMatch = lineRegex.exec(text)) !== null) {
    const enPart = lineMatch[1].trim()
    const cnPart = lineMatch[2].trim()
    if (enPart.length >= 2 && cnPart.length >= 1) {
      addPhrase(enPart, cnPart)
    }
  }

  return phrases
}

export class AiDictionaryLookupError extends Error {
  readonly code = 'WORD_NOT_FOUND'

  constructor() {
    super('未找到严格匹配的英文单词，请检查拼写。')
    this.name = 'AiDictionaryLookupError'
  }
}

function parseDictionaryPayload(json: string): RawDictEntry | null {
  const parsed: unknown = JSON.parse(json)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const payload = parsed as {
    status?: unknown
    name?: unknown
    error?: { code?: unknown }
  }
  if (
    payload.status === 'error' &&
    payload.error?.code === 'WORD_NOT_FOUND'
  ) {
    throw new AiDictionaryLookupError()
  }
  if (
    (payload.status === undefined || payload.status === 'ok') &&
    typeof payload.name === 'string' &&
    payload.name.trim()
  ) {
    return parsed as RawDictEntry
  }
  return null
}

function tryParseOrRepair(rawCandidate: string): RawDictEntry | null {
  if (!rawCandidate || !rawCandidate.trim()) return null

  // 1. 尝试直接解析
  try {
    const direct = parseDictionaryPayload(rawCandidate)
    if (direct) return direct
  } catch (err) {
    if (err instanceof AiDictionaryLookupError) throw err
  }

  // 2. 尝试清洗占位符与微小语法瑕疵后解析
  const sanitized = sanitizeJsonPlaceholders(rawCandidate)
  try {
    const cleanParsed = parseDictionaryPayload(sanitized)
    if (cleanParsed) return cleanParsed
  } catch (err) {
    if (err instanceof AiDictionaryLookupError) throw err
  }

  // 3. 尝试截断补全与语法修复后解析
  try {
    const repaired = repairTruncatedJson(sanitized)
    const repParsed = parseDictionaryPayload(repaired)
    if (repParsed) return repParsed
  } catch (err) {
    if (err instanceof AiDictionaryLookupError) throw err
  }

  return null
}

/**
 * 从大模型回复中提取并解析 JSON 对象（带抗截断、推理思考草稿过滤与智能短语抢救的高鲁棒性解析器）
 */
export function extractJsonFromAiReply(reply: string): RawDictEntry {
  if (!reply || !reply.trim()) {
    throw new Error('模型未返回有效文本内容（回复为空）')
  }

  let cleaned = reply.trim()

  // 1. 彻底剔除 <think> ... </think> 标签（兼容 DeepSeek R1 等推理思考模型）
  cleaned = cleaned.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim()

  const candidates: string[] = []

  // 2. 优先从 markdown ```json ... ``` 代码块中提取（逆序，优先采纳最后一个成型代码块）
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)(?:```|$)/gi
  let cbMatch: RegExpExecArray | null
  const blocks: string[] = []
  while ((cbMatch = codeBlockRegex.exec(cleaned)) !== null) {
    if (cbMatch[1]?.trim()) {
      blocks.push(cbMatch[1].trim())
    }
  }
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i]
    if (/"name"\s*:/i.test(block) || /"error"\s*:/i.test(block)) {
      candidates.push(block)
    }
  }

  // 3. 从所有 "name": 出现位置向前寻找包裹对象的 '{'
  const nameRegex = /"name"\s*:/gi
  const nameIndices: number[] = []
  let nMatch: RegExpExecArray | null
  while ((nMatch = nameRegex.exec(cleaned)) !== null) {
    nameIndices.push(nMatch.index)
  }

  // 逆序查找（越靠后的 name 越可能是最终输出，而非前期思考草稿）
  for (let i = nameIndices.length - 1; i >= 0; i--) {
    const idx = nameIndices[i]
    let braceIndex = -1
    for (let j = idx; j >= 0; j--) {
      if (cleaned[j] === '{') {
        braceIndex = j
        break
      }
    }
    if (braceIndex !== -1) {
      const sliceText = cleaned.slice(braceIndex)
      const outermost = extractOutermostJsonObject(sliceText)
      if (outermost) {
        candidates.push(outermost)
      }
      candidates.push(sliceText)
    }
  }

  // 4. 兜底首个 '{' 开始的切片（用于处理无 "name" 字段的 error 对象或特殊返回）
  const firstBrace = cleaned.indexOf('{')
  if (firstBrace !== -1) {
    const sliceText = cleaned.slice(firstBrace)
    const outermost = extractOutermostJsonObject(sliceText)
    if (outermost) candidates.push(outermost)
    candidates.push(sliceText)
  }

  // 逐一尝试候选片段
  for (const cand of candidates) {
    try {
      const parsed = tryParseOrRepair(cand)
      if (parsed) {
        // 成功提取！若 phrases 缺失或为空，从原始回复周围文本中抢救短语列表
        if (!parsed.phrases || parsed.phrases.length === 0) {
          const extracted = extractPhrasesFromText(reply)
          if (extracted.length > 0) {
            parsed.phrases = extracted
          }
        }
        return parsed
      }
    } catch (err) {
      if (err instanceof AiDictionaryLookupError) throw err
    }
  }

  console.error('Failed to repair truncated AI JSON:', cleaned.slice(0, 500))
  throw new Error('模型生成的词典数据格式不完整或受截断，请重试或检查 API 配置。')
}


