/**
 * OpenAI 兼容协议大模型客户端
 * 支持 DeepSeek、字节豆包 (Doubao/Ark)、ChatGPT/OpenAI、通义千问 (Qwen) 以及各类自定义中转/本地端点 (Ollama 等)
 *
 * 核心涵盖两大使用场景：
 * 1. 智能问答场景 (高级英语老师，拒绝非英语学习话题)
 * 2. 单词查询场景 (AI 字典，依照词库标准与规则生成结构化 JSON)
 */

import type { RawDictEntry } from '@/core/dictionaryLoader'
import {
  buildWordCoreQueryMessages,
  buildWordExamplesQueryMessages,
  buildWordStructureQueryMessages,
  extractJsonFromAiReply,
} from '@/lib/aiPrompts'

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiClientConfig {
  endpoint: string
  apiKey: string
  model: string
  provider?: string
  temperature?: number
  maxTokens?: number
}


/** 规范化拼接 chat/completions 端点 */
export function resolveChatCompletionsUrl(rawEndpoint: string): string {
  let clean = (rawEndpoint || '').trim().replace(/\/+$/, '')
  if (!clean || clean === 'https://api.deepseek.com/v1') {
    clean = 'https://api.deepseek.com'
  }
  // 若用户输入的地址已包含 /chat/completions，直接使用
  if (clean.endsWith('/chat/completions')) {
    return clean
  }
  return `${clean}/chat/completions`
}

/** 测试大模型连通性与 Key 有效性 (含代理 fallback) */
export async function testAiConnection(
  config: AiClientConfig
): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  if (!config.apiKey?.trim()) {
    return { success: false, error: '请先填写 API Key' }
  }

  const url = resolveChatCompletionsUrl(config.endpoint)
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: config.model || 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        temperature: 0.1,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latencyMs = Date.now() - startTime

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`
      try {
        const errJson = await res.json()
        errMsg = errJson?.error?.message || errJson?.message || errMsg
      } catch {
        const rawText = await res.text()
        if (rawText) errMsg = rawText.slice(0, 120)
      }
      return { success: false, error: errMsg, latencyMs }
    }

    const data = await res.json()
    if (!data?.choices || data.choices.length === 0) {
      return { success: false, error: '响应格式不符合预期，未返回 choices', latencyMs }
    }

    return { success: true, latencyMs }
  } catch (err: unknown) {
    // 若浏览器直连出现网络故障/跨域错误，尝试走本地服务端安全代理
    try {
      const proxyRes = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          model: config.model,
        }),
      })
      if (proxyRes.ok) {
        return await proxyRes.json()
      }
    } catch {
      // 忽略代理降级失败，保留原始异常
    }

    const latencyMs = Date.now() - startTime
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { success: false, error: '连接超时 (12秒无响应)，请检查网络或接口地址', latencyMs }
      }
      return { success: false, error: err.message || '网络连接异常或存在跨域(CORS)限制', latencyMs }
    }
    return { success: false, error: '未知网络错误', latencyMs }
  }
}

/**
 * 从 SSE 数据流 (ReadableStream) 中实时逐行解析并触发 onChunk 回调
 */
export async function readSseStream(
  response: Response,
  onChunk: (chunk: string) => void
): Promise<string> {
  if (!response.body) {
    throw new Error('未接收到流式响应数据')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let accumulated = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue
        if (trimmed === 'data: [DONE]') continue

        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim()
          if (!jsonStr) continue
          try {
            const parsed = JSON.parse(jsonStr)
            const delta = parsed?.choices?.[0]?.delta
            const chunk = delta?.content ?? ''
            if (chunk) {
              accumulated += chunk
              onChunk(chunk)
            }
          } catch {
            // 忽略未成完整 JSON 的片段行
          }
        }
      }
    }

    // 读完后如果末尾仍有缓冲区数据
    if (buffer.trim().startsWith('data:') && !buffer.includes('[DONE]')) {
      try {
        const parsed = JSON.parse(buffer.trim().slice(5).trim())
        const chunk = parsed?.choices?.[0]?.delta?.content ?? ''
        if (chunk) {
          accumulated += chunk
          onChunk(chunk)
        }
      } catch {
        // ignore
      }
    }
  } finally {
    reader.releaseLock()
  }

  return accumulated
}

/**
 * 场景一：智能问答对话接口（流式输出 / 流水输出）
 * 专供对话场景使用，通过 SSE 协议实现打字机逐字输出效果
 */
export async function streamAiChatCompletion(
  config: AiClientConfig,
  messages: AiChatMessage[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  if (!config.apiKey?.trim()) {
    throw new Error('未配置 API Key，请在偏好设置中绑定您的模型密钥。')
  }

  const url = resolveChatCompletionsUrl(config.endpoint)

  // 1. 尝试直接请求远端大模型流式端点 (stream: true)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 4096,
        stream: true,
      }),
      signal,
    })

    if (!res.ok) {
      let errMsg = `接口返回状态码 ${res.status}`
      try {
        const errJson = await res.json()
        errMsg = errJson?.error?.message || errJson?.message || errMsg
      } catch {
        const rawText = await res.text()
        if (rawText) errMsg = rawText.slice(0, 150)
      }
      throw new Error(errMsg)
    }

    // 若远端返回的是 SSE 流或数据体
    if (res.headers.get('content-type')?.includes('text/event-stream') || res.body) {
      return await readSseStream(res, onChunk)
    }

    // 兜底：若远端强行返回了完整 JSON
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content || ''
    if (content) {
      onChunk(content)
      return content
    }
    throw new Error('未获取到有效流式响应')
  } catch (err: unknown) {
    if (signal?.aborted) {
      throw new Error('用户已中断生成')
    }

    // 2. 直连遇到跨域 CORS 或网络拦截时，降级通过本地 Next.js 服务端路由流式代理
    try {
      const proxyRes = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          model: config.model,
          messages,
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 4096,
          stream: true,
        }),
        signal,
      })

      if (proxyRes.ok) {
        if (proxyRes.headers.get('content-type')?.includes('text/event-stream') || proxyRes.body) {
          return await readSseStream(proxyRes, onChunk)
        }
        const data = await proxyRes.json()
        const content = data?.choices?.[0]?.message?.content || ''
        if (content) {
          onChunk(content)
          return content
        }
      } else {
        const errJson = await proxyRes.json().catch(() => null)
        if (errJson?.error?.message) {
          throw new Error(errJson.error.message)
        }
      }
    } catch (proxyErr) {
      if (proxyErr instanceof Error && !proxyErr.message.includes('Failed to fetch')) {
        throw proxyErr
      }
    }

    if (err instanceof Error) {
      throw err
    }
    throw new Error('网络请求异常，请检查接口与网络连接。')
  }
}

/**
 * 场景二：单词查询非流式请求接口（非流式 / 一次性返回）
 * 专供词典场景或不需要打字机流式输出的结构化数据提取
 */
export async function callAiChatCompletion(
  config: AiClientConfig,
  messages: AiChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  if (!config.apiKey?.trim()) {
    throw new Error('未配置 API Key，请在偏好设置中绑定您的模型密钥。')
  }

  const url = resolveChatCompletionsUrl(config.endpoint)
  const controller = new AbortController()
  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })
  if (signal?.aborted) controller.abort()
  // 延迟请求超时时间至 120 秒，为带思考推理的模型预留充足时间
  const timeoutId = setTimeout(() => controller.abort(), 120000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 4096,
        stream: false, // 严格非流式
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      let errMsg = `接口返回状态码 ${res.status}`
      try {
        const errJson = await res.json()
        errMsg = errJson?.error?.message || errJson?.message || errMsg
      } catch {
        const rawText = await res.text()
        if (rawText) errMsg = rawText.slice(0, 150)
      }
      throw new Error(errMsg)
    }

    const data = await res.json()
    const choice = data?.choices?.[0]
    let reply = choice?.message?.content || choice?.text

    // 若 content 为空但 reasoning_content 中包含 "name" 字段，尝试从 reasoning_content 救回 JSON
    if ((!reply || !reply.trim()) && choice?.message?.reasoning_content) {
      if (choice.message.reasoning_content.includes('"name"')) {
        reply = choice.message.reasoning_content
      }
    }

    if (typeof reply !== 'string' || !reply.trim()) {
      if (choice?.message?.reasoning_content) {
        throw new Error('思考模型（如 R1/Reasoner）在推理阶段耗尽了 Token，未输出最终单词数据。已自动优化模型参数，请重试或在设置中选择 deepseek-chat。')
      }
      throw new Error('模型未返回合法的文本内容，请检查模型服务或 API 配置。')
    }

    return reply
  } catch (err: unknown) {
    if (signal?.aborted) {
      signal.removeEventListener('abort', abortFromCaller)
      throw new Error('用户已中断生成')
    }

    // 若直连遇到跨域 CORS 或网络故障，自动通过本地 Next.js 服务端路由非流式代理
    try {
      const proxyRes = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          model: config.model,
          messages,
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens ?? 4096,
          stream: false, // 严格非流式
        }),
        signal: controller.signal,
      })

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json()
        const choice = proxyData?.choices?.[0]
        let reply = choice?.message?.content || choice?.text

        // 若代理返回的 content 为空但思考草稿中存在 JSON，尝试从草稿中提取
        if ((!reply || !reply.trim()) && choice?.message?.reasoning_content) {
          if (choice.message.reasoning_content.includes('"name"')) {
            reply = choice.message.reasoning_content
          }
        }

        if (typeof reply === 'string' && reply.trim()) {
          return reply
        }

        if (choice?.message?.reasoning_content) {
          throw new Error('思考模型（如 R1/Reasoner）在推理阶段耗尽了 Token，未输出最终单词数据。已自动优化模型参数，请重试或在设置中选择 deepseek-chat。')
        }
      } else {
        const errJson = await proxyRes.json().catch(() => null)
        if (errJson?.error?.message) {
          throw new Error(errJson.error.message)
        }
      }
    } catch (proxyErr) {
      if (proxyErr instanceof Error && !proxyErr.message.includes('Failed to fetch')) {
        throw proxyErr
      }
    }

    if (err instanceof Error) {
      signal?.removeEventListener('abort', abortFromCaller)
      if (err.name === 'AbortError') {
        throw new Error('AI 词典生成请求响应超时 (超过 120 秒)，没有等到模型结果，请稍后再试。')
      }
      throw err
    }
    throw new Error('网络请求异常，请检查接口与网络连接。')
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

function resolveDictionaryConfig(config: AiClientConfig, maxTokens: number): AiClientConfig {
  let model = config.model?.trim() || 'deepseek-chat'
  const lowerModel = model.toLowerCase()
  const lowerEndpoint = (config.endpoint || '').toLowerCase()

  if (lowerModel.includes('reasoner') || lowerModel.includes('r1')) {
    if (lowerEndpoint.includes('siliconflow')) {
      model = 'deepseek-ai/DeepSeek-V3'
    } else {
      model = 'deepseek-chat'
    }
  }

  return {
    ...config,
    model,
    temperature: 0.1,
    maxTokens,
  }
}

async function fetchDictionarySection(
  config: AiClientConfig,
  messages: AiChatMessage[],
  maxTokens: number,
  signal?: AbortSignal
): Promise<RawDictEntry | null> {
  if (!config.apiKey?.trim()) return null
  const rawReply = await callAiChatCompletion(
    resolveDictionaryConfig(config, maxTokens),
    messages,
    signal
  )
  return extractJsonFromAiReply(rawReply)
}

function assertMatchingWord(entry: RawDictEntry, word: string) {
  if (entry.name.trim().toLowerCase() !== word.trim().toLowerCase()) {
    throw new Error('模型返回的单词与查询目标不一致')
  }
}

function hasValidEtymology(value: RawDictEntry['etymology']): boolean {
  if (value === undefined) return true
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const hasValidPart = (part: unknown) => {
    if (part === undefined || part === null) return true
    if (!part || typeof part !== 'object' || Array.isArray(part)) return false
    const candidate = part as { form?: unknown; meaning?: unknown }
    return (
      typeof candidate.form === 'string' &&
      Boolean(candidate.form.trim()) &&
      typeof candidate.meaning === 'string'
    )
  }

  return (
    hasValidPart(value.prefix) &&
    hasValidPart(value.root) &&
    hasValidPart(value.suffix) &&
    [value.derivation, value.origin, value.memoryHook].every(
      (item) => item === undefined || typeof item === 'string'
    )
  )
}

/** 首屏基础数据：音标与释义。 */
export async function fetchAiDictionaryWordCore(
  config: AiClientConfig,
  word: string,
  signal?: AbortSignal
): Promise<RawDictEntry | null> {
  const entry = await fetchDictionarySection(
    config,
    buildWordCoreQueryMessages(word),
    1024,
    signal
  )
  if (!entry) return null
  assertMatchingWord(entry, word)
  if (
    !entry.trans?.length ||
    entry.trans.some((item) => typeof item !== 'string' || !item.trim()) ||
    !entry.usphone?.trim() ||
    !entry.ukphone?.trim()
  ) {
    throw new Error('模型返回的音标或释义数据不完整')
  }
  return entry
}

/** 后台构词数据：音节、哑音与词源。 */
export async function fetchAiDictionaryWordStructure(
  config: AiClientConfig,
  word: string,
  core: Pick<RawDictEntry, 'trans' | 'usphone' | 'ukphone'>,
  signal?: AbortSignal
): Promise<RawDictEntry | null> {
  const entry = await fetchDictionarySection(
    config,
    buildWordStructureQueryMessages(word, core),
    2048,
    signal
  )
  if (!entry) return null
  assertMatchingWord(entry, word)
  const silentIndices = entry.silentIndices
  if (
    !entry.syllables?.length ||
    entry.syllables.some(
      (syllable) => typeof syllable !== 'string' || !syllable.trim()
    ) ||
    entry.syllables.join('').toLowerCase() !== word.trim().toLowerCase() ||
    !Array.isArray(silentIndices) ||
    silentIndices.some(
      (index) => !Number.isInteger(index) || index < 0 || index >= word.trim().length
    ) ||
    silentIndices.some((index, position) =>
      position > 0 ? index <= silentIndices[position - 1] : false
    ) ||
    !hasValidEtymology(entry.etymology) ||
    !entry.phrases?.length ||
    entry.phrases.some(
      (phrase) =>
        typeof phrase.en !== 'string' ||
        !phrase.en.trim() ||
        typeof phrase.cn !== 'string' ||
        !phrase.cn.trim()
    )
  ) {
    throw new Error('模型返回的构词或短语数据不完整')
  }
  return entry
}

/** 后台语境数据：覆盖核心释义的双语例句。 */
export async function fetchAiDictionaryWordExamples(
  config: AiClientConfig,
  word: string,
  trans: string[],
  signal?: AbortSignal
): Promise<RawDictEntry | null> {
  const entry = await fetchDictionarySection(
    config,
    buildWordExamplesQueryMessages(word, trans),
    4096,
    signal
  )
  if (!entry) return null
  assertMatchingWord(entry, word)
  if (
    !entry.examples?.length ||
    entry.examples.some(
      (example) =>
        typeof example.en !== 'string' ||
        !example.en.trim() ||
        typeof example.cn !== 'string' ||
        !example.cn.trim()
    )
  ) {
    throw new Error('模型返回的例句数据不完整')
  }
  return entry
}

/**
 * 一次等待完整单词数据的兼容接口。
 *
 * @deprecated 请优先调用 `fetchAiDictionaryWordCore`，并在页面实际需要时按分区补全。
 *
 * 性能警告：该接口会先请求基础数据，再并行请求构词/短语和例句。调用方必须等待
 * 所有模型输出完成，首屏响应更慢、Token 消耗更高，任一分区失败也会导致整次查询失败。
 * 仅限确实需要在单次操作中拿到完整离线数据的场景，不要用于查词弹窗、导入或页面首屏。
 */
export async function fetchAiDictionaryWord(
  config: AiClientConfig,
  word: string,
  signal?: AbortSignal
): Promise<RawDictEntry | null> {
  const core = await fetchAiDictionaryWordCore(config, word, signal)
  if (!core) return null

  const [structure, examples] = await Promise.all([
    fetchAiDictionaryWordStructure(config, word, core, signal),
    fetchAiDictionaryWordExamples(config, word, core.trans || [], signal),
  ])

  return { ...core, ...structure, ...examples, name: core.name }
}
