import path from 'path'
import fs from 'fs/promises'
import { Redis } from '@upstash/redis'

export interface CollectedWordPayload {
  id: string
  word: string
  meaning?: string
  phonetic?: string
  contextSentence?: string
  contextTranslation?: string
  source?: string
  createdAt: number
}

// 检查是否具备 Upstash Redis 配置
const hasRedisConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

let redisClient: Redis | null = null
if (hasRedisConfig) {
  try {
    redisClient = Redis.fromEnv()
  } catch (err) {
    console.warn('[CollectStore] Failed to initialize Redis from env:', err)
  }
}

const LOCAL_DATA_FILE = path.join(process.cwd(), 'data', 'pending_words.json')

/**
 * 校验 API Token
 * - 如果服务端配置了 COLLECT_TOKEN 环境变量，必须完全匹配
 * - 如果服务端未配置 COLLECT_TOKEN，则允许免密访问（方便本地与内网极简使用）
 */
export function isTokenValid(token?: string | null): boolean {
  const configuredToken = process.env.COLLECT_TOKEN?.trim()
  if (!configuredToken) {
    return true
  }
  return token?.trim() === configuredToken
}

function getRedisKey(token?: string | null): string {
  const clean = (token || 'default').trim().replace(/[^a-zA-Z0-9_-]/g, '')
  return `mywords:pending:${clean || 'default'}`
}

/**
 * 读取本地文件队列
 */
async function readLocalFile(): Promise<Record<string, CollectedWordPayload[]>> {
  try {
    const raw = await fs.readFile(LOCAL_DATA_FILE, 'utf-8')
    return JSON.parse(raw) || {}
  } catch {
    return {}
  }
}

/**
 * 写入本地文件队列
 */
async function writeLocalFile(data: Record<string, CollectedWordPayload[]>) {
  try {
    const dir = path.dirname(LOCAL_DATA_FILE)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('[CollectStore] Failed to write local pending words:', err)
  }
}

/**
 * 批量将翻译小工具发来的单词推入暂存队列
 */
export async function pushPendingWords(
  words: string[],
  token?: string | null
): Promise<{ success: boolean; mode: 'redis' | 'local_file'; count: number }> {
  const cleanWords = words.map((w) => w.trim()).filter(Boolean)
  if (cleanWords.length === 0) {
    return { success: true, mode: redisClient ? 'redis' : 'local_file', count: 0 }
  }

  const items: CollectedWordPayload[] = cleanWords.map((w, index) => ({
    id: `collect_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
    word: w,
    createdAt: Date.now(),
  }))

  // 1. 优先使用 Upstash Redis (Vercel Serverless 环境)
  if (redisClient) {
    const key = getRedisKey(token)
    const stringified = items.map((i) => JSON.stringify(i))
    await redisClient.rpush(key, ...stringified)
    const length = await redisClient.llen(key)
    return { success: true, mode: 'redis', count: length }
  }

  // 2. 本地文件降级存储 (本地开发或纯单机部署环境)
  const allData = await readLocalFile()
  const queueKey = token?.trim() || 'default'
  if (!allData[queueKey]) {
    allData[queueKey] = []
  }
  allData[queueKey].push(...items)
  await writeLocalFile(allData)

  return { success: true, mode: 'local_file', count: allData[queueKey].length }
}

/**
 * 单个单词推入暂存队列（向后兼容）
 */
export async function pushPendingWord(
  payload: { word: string },
  token?: string | null
): Promise<{ success: boolean; mode: 'redis' | 'local_file'; count: number }> {
  return pushPendingWords([payload.word], token)
}

/**
 * 获取并清空属于当前 Token 的待同步生词队列（消费型读取）
 */
export async function popPendingWords(token?: string | null): Promise<CollectedWordPayload[]> {
  // 1. Upstash Redis
  if (redisClient) {
    const key = getRedisKey(token)
    const rawItems = await redisClient.lrange<string | CollectedWordPayload>(key, 0, -1)
    if (!rawItems || rawItems.length === 0) {
      return []
    }
    await redisClient.del(key)

    return rawItems
      .map((item) => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item) as CollectedWordPayload
          } catch {
            return null
          }
        }
        return item as CollectedWordPayload
      })
      .filter((item): item is CollectedWordPayload => Boolean(item && item.word))
  }

  // 2. 本地文件存储
  const allData = await readLocalFile()
  const queueKey = token?.trim() || 'default'
  const items = allData[queueKey] || []

  if (items.length > 0) {
    allData[queueKey] = []
    await writeLocalFile(allData)
  }

  return items
}

/**
 * 查询当前存储模式
 */
export function getStorageMode(): 'redis' | 'local_file' {
  return redisClient ? 'redis' : 'local_file'
}
