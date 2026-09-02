import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import type { WordEtymology } from '@/types'

const OFFICIAL_FILES = [
  'basewords.json',
  'CET4_T.json',
  '2025KaoYanHongBaoShu.json',
  'it-words.json',
  '4000_Essential_English_Words-meaning.json',
]

const BOOK_ID_TO_FILE: Record<string, string> = {
  'book_basewords': 'basewords.json',
  'book_cet4': 'CET4_T.json',
  'book_kaoyan': '2025KaoYanHongBaoShu.json',
  'book_coder': 'it-words.json',
  'book_ielts': '4000_Essential_English_Words-meaning.json',
}

interface UpdateWordPayload {
  bookId?: string
  wordName: string
  syllables?: string[]
  silentIndices?: number[]
  etymology?: WordEtymology
}

export async function POST(req: Request) {
  try {
    const payload: UpdateWordPayload = await req.json()
    const { bookId, wordName, syllables, silentIndices, etymology } = payload

    if (!wordName || typeof wordName !== 'string') {
      return NextResponse.json({ error: 'Missing wordName' }, { status: 400 })
    }

    const cleanName = wordName.trim().toLowerCase()
    const dictsDir = path.join(process.cwd(), 'public', 'dicts')
    const updatedFiles: string[] = []

    // 优先确定要搜索的文件列表
    const targetFile = bookId ? BOOK_ID_TO_FILE[bookId] : undefined
    const filesToSearch = targetFile
      ? [targetFile, ...OFFICIAL_FILES.filter((f) => f !== targetFile)]
      : OFFICIAL_FILES

    for (const fileName of filesToSearch) {
      const filePath = path.join(dictsDir, fileName)
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const items = JSON.parse(content)

        if (Array.isArray(items)) {
          let found = false
          for (const item of items) {
            if (item && item.name && item.name.trim().toLowerCase() === cleanName) {
              if (syllables && syllables.length > 0) {
                item.syllables = syllables
              }
              if (silentIndices && silentIndices.length > 0) {
                item.silentIndices = silentIndices
              } else {
                delete item.silentIndices
              }
              if (etymology) {
                item.etymology = etymology
              } else {
                delete item.etymology
              }
              found = true
            }
          }

          if (found) {
            await fs.writeFile(filePath, JSON.stringify(items, null, 4), 'utf-8')
            updatedFiles.push(fileName)
            // 如果指定了具体词库且在该词库中已更新，就只需更新包含该词的词库
          }
        }
      } catch (err) {
        console.error(`Failed to update ${fileName}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      updatedFiles,
      wordName: cleanName,
    })
  } catch (err: any) {
    console.error('Update word error:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
