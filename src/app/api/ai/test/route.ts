import { NextResponse } from 'next/server'
import { resolveChatCompletionsUrl } from '@/lib/aiClient'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { endpoint, apiKey, model } = body

    if (!apiKey) {
      return NextResponse.json({ success: false, error: '请先填写 API Key' }, { status: 400 })
    }

    const targetUrl = resolveChatCompletionsUrl(endpoint)
    const startTime = Date.now()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        temperature: 0.1,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latencyMs = Date.now() - startTime

    if (!upstreamRes.ok) {
      let errMsg = `HTTP ${upstreamRes.status}`
      try {
        const errJson = await upstreamRes.json()
        errMsg = errJson?.error?.message || errJson?.message || errMsg
      } catch {
        const rawText = await upstreamRes.text()
        if (rawText) errMsg = rawText.slice(0, 120)
      }
      return NextResponse.json({ success: false, error: errMsg, latencyMs }, { status: 200 })
    }

    const data = await upstreamRes.json()
    if (!data?.choices || data.choices.length === 0) {
      return NextResponse.json({ success: false, error: '响应格式不符合预期，未返回 choices', latencyMs }, { status: 200 })
    }

    return NextResponse.json({ success: true, latencyMs })
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return NextResponse.json({ success: false, error: '连接超时 (12秒无响应)' }, { status: 200 })
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 200 })
    }
    return NextResponse.json({ success: false, error: '未知网络错误' }, { status: 500 })
  }
}
