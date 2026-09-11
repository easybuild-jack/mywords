/**
 * OpenAI 兼容协议大模型客户端
 * 支持 DeepSeek、字节豆包 (Doubao/Ark)、ChatGPT/OpenAI、通义千问 (Qwen) 以及各类自定义中转/本地端点 (Ollama 等)
 */

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiClientConfig {
  endpoint: string
  apiKey: string
  model: string
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

/** 测试大模型连通性与 Key 有效性 */
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
        messages: [
          { role: 'user', content: 'Hi' },
        ],
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

/** 执行实际对话请求 */
export async function callAiChatCompletion(
  config: AiClientConfig,
  messages: AiChatMessage[]
): Promise<string> {
  if (!config.apiKey?.trim()) {
    throw new Error('未配置 API Key，请在偏好设置中绑定您的模型密钥。')
  }

  const url = resolveChatCompletionsUrl(config.endpoint)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

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
        stream: false,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

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
    const reply = data?.choices?.[0]?.message?.content
    if (typeof reply !== 'string') {
      throw new Error('模型未返回合法的文本内容。')
    }

    return reply
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('模型响应超时 (超过 60 秒)，请重试或更换模型。')
      }
      throw err
    }
    throw new Error('网络请求异常，请检查接口与网络连接。')
  }
}
