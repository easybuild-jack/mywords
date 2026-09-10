import { NextResponse } from 'next/server'
import { pushPendingWords, isTokenValid, getStorageMode } from '@/lib/server/collectStore'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-token',
}

function extractToken(req: Request, body?: any): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
  const customHeader = req.headers.get('x-api-token')
  if (customHeader) {
    return customHeader.trim()
  }
  const url = new URL(req.url)
  const queryToken = url.searchParams.get('token')
  if (queryToken) {
    return queryToken.trim()
  }
  if (body && typeof body === 'object' && body.token) {
    return String(body.token).trim()
  }
  return null
}

/**
 * 跨域 OPTIONS 预检请求
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

/**
 * GET: 联通性检查与状态查询
 */
export async function GET(req: Request) {
  const token = extractToken(req)
  const valid = isTokenValid(token)

  return NextResponse.json(
    {
      code: 0,
      message: 'MyWords Word Collection API is running',
      status: 'online',
      storageMode: getStorageMode(),
      tokenRequired: Boolean(process.env.COLLECT_TOKEN?.trim()),
      tokenValid: valid,
    },
    { headers: CORS_HEADERS }
  )
}

/**
 * POST: 接收外部翻译小工具提交的生词列表（批量模式）
 * 入参支持 { words: ["apple", "banana"] }、直接数组或单词兼容模式
 * 出参返回 { code: "success", message: "成功", data: { total, words } }
 */
export async function POST(req: Request) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { code: 'failed', message: '无效的 JSON 请求体' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const token = extractToken(req, body)

    // 鉴权校验
    if (!isTokenValid(token)) {
      return NextResponse.json(
        { code: 'failed', message: '鉴权未通过：Token 无效' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    // 提取待收集单词列表（兼容 { words: [...] }、纯数组 [...] 或单词 { word: "..." }）
    let rawList: any[] = []
    if (Array.isArray(body)) {
      rawList = body
    } else if (Array.isArray(body?.words)) {
      rawList = body.words
    } else if (typeof body?.word === 'string' && body.word.trim()) {
      rawList = [body.word]
    } else if (typeof body?.name === 'string' && body.name.trim()) {
      rawList = [body.name]
    }

    const cleanWords = rawList
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object' && typeof item.word === 'string') return item.word.trim()
        return ''
      })
      .filter(Boolean)

    if (cleanWords.length === 0) {
      return NextResponse.json(
        { code: 'failed', message: '缺少参数：words 单词列表不能为空' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    await pushPendingWords(cleanWords, token)

    return NextResponse.json(
      {
        code: 'success',
        message: '成功',
        data: {
          total: cleanWords.length,
          words: cleanWords,
        },
      },
      { headers: CORS_HEADERS }
    )
  } catch (err: any) {
    console.error('[API /api/words/collect] Error:', err)
    return NextResponse.json(
      { code: 'failed', message: err?.message || '服务器内部错误' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
