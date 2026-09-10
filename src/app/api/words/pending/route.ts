import { NextResponse } from 'next/server'
import { popPendingWords, isTokenValid } from '@/lib/server/collectStore'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-token',
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
  const customHeader = req.headers.get('x-api-token')
  if (customHeader) {
    return customHeader.trim()
  }
  const url = new URL(req.url)
  return url.searchParams.get('token')?.trim() || null
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

/**
 * GET: 消费当前暂存的所有待同步单词
 */
export async function GET(req: Request) {
  try {
    const token = extractToken(req)

    if (!isTokenValid(token)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    const words = await popPendingWords(token)

    return NextResponse.json(
      {
        code: 0,
        count: words.length,
        data: words,
      },
      { headers: CORS_HEADERS }
    )
  } catch (err: any) {
    console.error('[API /api/words/pending] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
