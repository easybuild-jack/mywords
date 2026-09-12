'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, X, BookMarked } from 'lucide-react'
import { db, mergeWordsIntoBook } from '@/db'
import { buildWordId } from '@/lib/wordId'
import { audioEngine } from '@/core/audioEngine'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'
import { queryAiWordCore } from '@/lib/aiWordCore'
import { AiDictionaryLookupError } from '@/lib/aiPrompts'
import type { WordItem, WordMasteryRecord, VocabularyBook } from '@/types'

export const COLLECTED_BOOK_ID = 'book_custom_collected'

interface SyncToastItem {
  id: string
  word: string
  meaning?: string
  source?: string
  count?: number
  timestamp: number
}

export function ExternalSyncManager() {
  const router = useRouter()
  const aiConfig = useAiAssistantStore((state) => state.aiConfig)
  const [toasts, setToasts] = useState<SyncToastItem[]>([])
  const isPollingRef = useRef(false)

  const syncPendingWords = useCallback(async () => {
    if (isPollingRef.current) return
    isPollingRef.current = true

    try {
      // 1. 获取用户自定义的 Token (若无则不传，由服务端处理默认)
      const token = typeof window !== 'undefined' ? localStorage.getItem('mywords_sync_token') || '' : ''
      const url = token ? `/api/words/pending?token=${encodeURIComponent(token)}` : '/api/words/pending'

      const res = await fetch(url)
      if (!res.ok) {
        return
      }

      const json = await res.json()
      const items: any[] = json?.data || []

      if (!items || items.length === 0) {
        return
      }

      // 2. 核心逻辑：先查重（若已在生错词则直接跳过），未在生错词则走通用查词接口检索入库
      const newlyAddedWords = []

      for (const item of items) {
        if (!item?.word) continue
        const cleanWord = item.word.trim()
        const canonicalId = buildWordId(cleanWord)

        // 步骤 1：先检查是否已存在生错词里 (isStarred || isError)
        const existingRecord = await db.wordRecords.get(canonicalId)
        if (existingRecord && (existingRecord.isStarred || existingRecord.isError)) {
          // 已经在生错词里了，直接判定为成功，无需重复检索和入库
          continue
        }

        // 步骤 2：只查 AI 缓存；未命中时调用 AI 基础查询
        let targetWord: WordItem | null
        try {
          targetWord = await queryAiWordCore(aiConfig, cleanWord)
        } catch (error) {
          if (!(error instanceof AiDictionaryLookupError)) {
            console.warn('[ExternalSyncManager] AI lookup failed:', error)
          }
          continue
        }
        if (!targetWord) {
          continue
        }

        // 步骤 3：检索到了，直接加入生错词（标记 isStarred: true）
        if (!existingRecord) {
          const newRecord: WordMasteryRecord = {
            wordId: targetWord.id,
            bookId: COLLECTED_BOOK_ID,
            wordName: targetWord.name,
            wordItem: targetWord,
            isMastered: false,
            isStarred: true, // 核心：加入生错词本
            isError: false,
            totalPracticeCount: 0,
            dictationErrorCount: 0,
            consecutiveCorrectCount: 0,
            lastPracticedAt: Date.now(),
          }
          await db.wordRecords.put(newRecord)
        } else {
          await db.wordRecords.update(targetWord.id, {
            isStarred: true,
            wordItem: targetWord,
            lastPracticedAt: Date.now(),
          })
        }

        newlyAddedWords.push(targetWord)
      }

      const enrichedWords = newlyAddedWords

      // 3. 同时维护一本名为「翻译工具收藏」的专属自定义词库
      if (enrichedWords.length > 0) {
        let book = await db.books.get(COLLECTED_BOOK_ID)
        if (!book) {
          const newBook: VocabularyBook = {
            id: COLLECTED_BOOK_ID,
            name: '翻译工具收藏',
            description: '从外部翻译小工具实时同步的专属单词库',
            category: 'custom',
            isCustom: true,
            unitSize: 20,
            totalWords: enrichedWords.length,
            words: enrichedWords,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          await db.books.put(newBook)
        } else {
          await mergeWordsIntoBook(COLLECTED_BOOK_ID, enrichedWords)
        }

        // 4. 刷新全局星标状态
        await useWorkspaceStore.getState().syncStarredWordIds()

        // 5. 播放轻柔提示音
        try {
          audioEngine.playCorrectSound(0.4)
        } catch {}

        // 6. 弹出 Toast 提示
        const latestWord = enrichedWords[enrichedWords.length - 1]
        const meaningPreview = latestWord.posList?.[0]?.means?.[0] || items[items.length - 1]?.meaning || ''

        const newToast: SyncToastItem = {
          id: `toast_${Date.now()}`,
          word: latestWord.name,
          meaning: meaningPreview,
          source: items[0]?.source || '翻译工具',
          count: enrichedWords.length,
          timestamp: Date.now(),
        }

        setToasts((prev) => [...prev.slice(-2), newToast])
      }
    } catch (err) {
      console.warn('[ExternalSyncManager] Sync error:', err)
    } finally {
      isPollingRef.current = false
    }
  }, [aiConfig])

  // 监听窗口激活与定时轮询
  useEffect(() => {
    // 首次加载立即同步一次
    syncPendingWords()

    // 窗口获得焦点时（例如从翻译小工具切换回浏览器）立即同步
    const handleFocus = () => {
      syncPendingWords()
    }
    window.addEventListener('focus', handleFocus)

    // 每 20 秒轻量轮询一次
    const timer = setInterval(() => {
      syncPendingWords()
    }, 20000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(timer)
    }
  }, [syncPendingWords])

  // Toast 自动消退倒计时
  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 6000)
    return () => clearTimeout(timer)
  }, [toasts])

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleGoToErrors = (id: string) => {
    dismissToast(id)
    router.push('/errors')
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-gray-900/95 backdrop-blur-md border border-amber-500/40 shadow-2xl shadow-amber-500/10 text-white animate-in slide-in-from-bottom-5 duration-300 select-none"
        >
          <div className="size-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
            <Sparkles className="size-4.5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                {toast.source || '外部同步'}
              </span>
              {toast.count && toast.count > 1 ? (
                <span className="text-xs text-amber-200/80 font-mono">+{toast.count} 词</span>
              ) : null}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-white">{toast.word}</span>
              {toast.meaning && (
                <span className="text-xs text-gray-300 truncate max-w-[170px]">{toast.meaning}</span>
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleGoToErrors(toast.id)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <span>前往生错词本练习</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="text-gray-400 hover:text-gray-200 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="关闭提示"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

