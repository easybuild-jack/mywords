import { NextResponse } from 'next/server'
import { resolveChatCompletionsUrl } from '@/lib/aiClient'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      endpoint,
      apiKey,
      model,
      messages,
      temperature = 0.7,
      maxTokens = 4096,
      stream = false,
    } = body

    if (!apiKey) {
      return NextResponse.json({ error: { message: '缺少 API Key' } }, { status: 400 })
    }

    const targetUrl = resolveChatCompletionsUrl(endpoint)

    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: Boolean(stream),
      }),
    })

    if (!upstreamRes.ok) {
      let errMsg = `Upstream HTTP ${upstreamRes.status}`
      try {
        const errJson = await upstreamRes.json()
        errMsg = errJson?.error?.message || errJson?.message || errMsg
      } catch {
        const rawText = await upstreamRes.text()
        if (rawText) errMsg = rawText.slice(0, 150)
      }
      return NextResponse.json({ error: { message: errMsg } }, { status: upstreamRes.status })
    }

    // 词典场景或明确非流式请求 (stream = false)：返回单体 JSON
    if (!stream) {
      const data = await upstreamRes.json()
      return NextResponse.json(data)
    }

    // 对话场景 (stream = true)：转发 SSE 流式数据 (流水输出)
    return new Response(upstreamRes.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '代理请求异常'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
