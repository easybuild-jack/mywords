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
必须严格查询用户给出的原始单词，不得纠正拼写、联想近似词、替换为词形相近的单词或编造释义。
如果无法确认该拼写是有效英文单词，必须原样返回：${WORD_NOT_FOUND_JSON}`

export const AI_DICTIONARY_CORE_SYSTEM_PROMPT = `你是 MyWords 的专业英语词典引擎。
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

export const AI_DICTIONARY_STRUCTURE_SYSTEM_PROMPT = `你是 MyWords 的专业英语构词与音节分析引擎。
根据给出的单词拼写、IPA 音标及中文释义生成完整的构词、音节与短语数据：
{
  "status": "ok",
  "name": "discover",
  "syllables": ["dis", "cov", "er"],
  "silentIndices": [],
  "etymology": {
    "prefix": { "form": "dis-", "meaning": "去除" },
    "root": { "form": "cover", "meaning": "覆盖" },
    "derivation": "去除覆盖物 → 发现",
    "origin": "可靠且简短的词源",
    "memoryHook": "简明记忆线索"
  },
  "phrases": [
    { "en": "discover the truth", "cn": "查明真相" }
  ]
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

【词源与短语规则】
- 词源必须可靠；没有可靠词根词缀时省略相应字段，严禁编造。
- phrases 生成 4–8 条最常见、最实用的固定搭配，并提供准确中文释义。
${JSON_ONLY_RULE}`

export const AI_DICTIONARY_EXAMPLES_SYSTEM_PROMPT = `你是 MyWords 的英语例句生成引擎。
根据给定单词及中文释义生成：
{
  "status": "ok",
  "name": "discover",
  "examples": [
    { "en": "We must discover the truth.", "cn": "我们必须查明真相。" }
  ]
}
例句应覆盖给出的不同词性和主要义项；单义词至少生成两条。
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

export function buildWordStructureQueryMessages(
  word: string,
  core: Pick<RawDictEntry, 'trans' | 'usphone' | 'ukphone'>
) {
  return [
    { role: 'system' as const, content: AI_DICTIONARY_STRUCTURE_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `分析以下基础数据：${JSON.stringify({ name: word.trim(), ...core })}`,
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
 * 从文本中寻找首个括号平衡的最外层完整 JSON 对象
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
 * 寻找包含 "name" 属性的最外层单词 JSON 对象（避免误匹配杂乱思考文本中的内部对象）
 */
function findWordJsonObject(text: string): string | null {
  const nameMatch = text.search(/"name"\s*:/i)
  if (nameMatch === -1) {
    return extractOutermostJsonObject(text)
  }

  let startIndex = -1
  for (let i = nameMatch; i >= 0; i--) {
    if (text[i] === '{') {
      startIndex = i
      break
    }
  }

  if (startIndex === -1) {
    return extractOutermostJsonObject(text)
  }

  const candidate = extractOutermostJsonObject(text.slice(startIndex))
  if (candidate) return candidate

  return text.slice(startIndex)
}

/**
 * 智能修复被截断的不完整 JSON 字符串（例如模型受 max_tokens 限制或网络中断未闭合尾部）
 */
export function repairTruncatedJson(raw: string): string {
  let s = raw.trim()
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

  // 2. 循环清理末尾多余逗号或孤立键值对（如 `"incompleteKey":` 或 `...,`）
  s = s.trimEnd()
  let modified = true
  while (modified) {
    modified = false
    if (s.endsWith(',')) {
      s = s.slice(0, -1).trimEnd()
      modified = true
    }
    if (/:\s*$/.test(s)) {
      s = s.replace(/,?\s*"[^"]*"\s*:\s*$/, '').trimEnd()
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

/**
 * 从大模型回复中提取并解析 JSON 对象（带抗截断与思考标签过滤的高鲁棒性解析器）
 */
export function extractJsonFromAiReply(reply: string): RawDictEntry {
  if (!reply || !reply.trim()) {
    throw new Error('模型未返回有效文本内容（回复为空）')
  }

  let cleaned = reply.trim()

  // 1. 彻底剔除 <think> ... </think> 标签（兼容 DeepSeek R1 等推理思考模型）
  cleaned = cleaned.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim()

  // 2. 剔除 markdown ```json ... ``` 标记（即使尾部 ``` 被截断也能匹配）
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i)
    if (match && match[1]) {
      cleaned = match[1].trim()
    }
  }

  // 3. 首选方案：寻找包含 "name" 单词根对象的最外层完整 JSON 对象
  const outermost = findWordJsonObject(cleaned)
  if (outermost) {
    try {
      const parsed = parseDictionaryPayload(outermost)
      if (parsed) return parsed
    } catch (error) {
      if (error instanceof AiDictionaryLookupError) throw error
      // 若提取的最外层包含微小语法问题，继续尝试修复
    }
  }


  // 4. 次选方案：寻找第一个 { 开始尝试直接解析
  const firstBrace = cleaned.indexOf('{')
  if (firstBrace === -1) {
    throw new Error('模型返回内容中未检测到合法的 JSON 格式')
  }

  const candidateJson = cleaned.slice(firstBrace)

  // 尝试直接解析
  try {
    const parsed = parseDictionaryPayload(candidateJson)
    if (parsed) return parsed
  } catch (error) {
    if (error instanceof AiDictionaryLookupError) throw error
    // 5. 兜底容错：模型输出在末尾被截断，执行智能语法修复
    try {
      const repaired = repairTruncatedJson(candidateJson)
      const parsed = parseDictionaryPayload(repaired)
      if (parsed) {
        console.warn('AI dictionary reply was truncated by token limit and successfully auto-repaired.')
        return parsed
      }
    } catch (repairError) {
      if (repairError instanceof AiDictionaryLookupError) throw repairError
      console.error('Failed to repair truncated AI JSON:', candidateJson)
      throw new Error('模型生成的词典数据格式不完整或受截断，请重试或检查 API 配置。')
    }
  }

  throw new Error('模型返回数据缺少必要的单词字段 name')
}

