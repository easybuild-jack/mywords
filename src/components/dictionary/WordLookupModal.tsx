'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Volume2, Star, X, Loader2 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { searchWordAcrossDictionaries, type DictSearchResult } from '@/core/dictionarySearch'
import { audioEngine } from '@/core/audioEngine'
import { toggleStarWord } from '@/db'

export interface WordLookupModalProps {
  isOpen: boolean
  onClose: () => void
  wordQuery: string | null
  sentenceEn?: string
  sentenceCn?: string
  targetRect?: DOMRect | null
}

export function WordLookupModal({
  isOpen,
  onClose,
  wordQuery,
  sentenceEn,
  sentenceCn,
  targetRect,
}: WordLookupModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DictSearchResult | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const popoverRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{
    top: number
    left: number
    arrowLeft: number
    placement: 'top' | 'bottom'
  }>({
    top: 0,
    left: 0,
    arrowLeft: 0,
    placement: 'top',
  })

  const currentBook = useWorkspaceStore((s) => s.currentBook)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const starredWordIds = useWorkspaceStore((s) => s.starredWordIds)

  // 避免 SSR 水合不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  // 监听 Esc 键关闭
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 点击外部自动关闭 Tooltip
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // 延迟 20ms 绑定，避免被当前触发点击事件冒泡误关
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handlePointerDown)
      window.addEventListener('touchstart', handlePointerDown)
    }, 20)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen, onClose])

  // 执行查词
  useEffect(() => {
    if (!isOpen || !wordQuery?.trim()) {
      setResult(null)
      return
    }

    let isCancelled = false
    const cleanWord = wordQuery.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim()
    if (!cleanWord) return

    setIsLoading(true)
    searchWordAcrossDictionaries(
      cleanWord,
      currentBook?.id || 'book_cet4',
      currentBook?.name || 'CET-4 核心词库'
    )
      .then((res) => {
        if (!isCancelled) {
          setResult(res)
          setIsLoading(false)
          // 查到单词后自动播放一次发音
          if (res?.word?.name) {
            audioEngine.playPronunciation(res.word.name, phoneticPreference)
          }
        }
      })
      .catch((err) => {
        console.error('Word lookup error:', err)
        if (!isCancelled) {
          setResult(null)
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [isOpen, wordQuery, currentBook?.id, currentBook?.name, phoneticPreference])

  // 计算智能浮动位置 (Tooltip Positioning)
  const updatePosition = useCallback(() => {
    if (!targetRect || typeof window === 'undefined') return

    const TOOLTIP_WIDTH = Math.min(360, window.innerWidth - 24)
    const popoverEl = popoverRef.current
    const popoverHeight = popoverEl ? popoverEl.offsetHeight : 180
    const GAP = 10

    const spaceAbove = targetRect.top
    const spaceBelow = window.innerHeight - targetRect.bottom

    // 优先放置于上方，若上方空间不足且下方更大则放置于下方
    let placement: 'top' | 'bottom' = 'top'
    if (spaceAbove < popoverHeight + GAP && spaceBelow > spaceAbove) {
      placement = 'bottom'
    }

    let top = 0
    if (placement === 'top') {
      top = Math.max(10, targetRect.top - popoverHeight - GAP)
    } else {
      top = Math.min(window.innerHeight - popoverHeight - 10, targetRect.bottom + GAP)
    }

    const wordCenter = targetRect.left + targetRect.width / 2
    let left = wordCenter - TOOLTIP_WIDTH / 2
    left = Math.max(12, Math.min(window.innerWidth - TOOLTIP_WIDTH - 12, left))

    const arrowLeft = Math.max(16, Math.min(TOOLTIP_WIDTH - 16, wordCenter - left))

    setPosition({
      top,
      left,
      arrowLeft,
      placement,
    })
  }, [targetRect])

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition, result, isLoading])

  // 监听窗口缩放动态调整
  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, updatePosition])

  // 发音播放
  const handlePlayAudio = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!result?.word?.name) return
      setIsPlaying(true)
      audioEngine.playPronunciation(result.word.name, phoneticPreference)
      setTimeout(() => {
        setIsPlaying(false)
      }, 1000)
    },
    [result?.word?.name, phoneticPreference]
  )

  // 生词本收藏切换
  const isStarred = Boolean(result?.word && starredWordIds?.includes(result.word.id))
  const handleToggleStar = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!result?.word) return
      await toggleStarWord(result.word.id, result.sourceBookId || 'book_cet4', result.word)
      await useWorkspaceStore.getState().syncStarredWordIds()
    },
    [result]
  )

  // 解析当前语境释义与其他常见释义
  const { currentPos, currentContextMean, otherMeansText } = useMemo(() => {
    if (!result?.word) return { currentPos: '', currentContextMean: '', otherMeansText: '' }

    const word = result.word
    const allPosMeans: { pos: string; mean: string }[] = []
    for (const p of word.posList || []) {
      for (const m of p.means || []) {
        allPosMeans.push({ pos: p.pos, mean: m })
      }
    }

    if (allPosMeans.length === 0) {
      return { currentPos: '', currentContextMean: '核心词义', otherMeansText: '' }
    }

    // 若例句中文译文存在，优先从译文中找到最符合句意的那个词义
    let matched = allPosMeans[0]
    if (sentenceCn) {
      const direct = allPosMeans.find((item) => {
        const cleanM = item.mean.replace(/[（(].*?[)）]/g, '').trim()
        return cleanM.length >= 2 && sentenceCn.includes(cleanM)
      })
      if (direct) matched = direct
    }

    const currentPos = matched.pos && matched.pos !== 'other' ? matched.pos : ''
    const currentContextMean = matched.mean

    // 其它常见释义（排除掉已被选为当前语境的那项）
    const others = allPosMeans
      .filter((item) => item !== matched && item.mean !== currentContextMean)
      .map((item) => item.mean)

    return {
      currentPos,
      currentContextMean,
      otherMeansText: others.join('、'),
    }
  }, [result?.word, sentenceCn])

  // 音标显示（美 /.../ 或 英 /.../）
  const displayPhonetic = useMemo(() => {
    if (!result?.word) return ''
    const w = result.word
    const isUk = phoneticPreference === 'uk'
    const phone = isUk ? w.phoneticUk || w.phoneticUs : w.phoneticUs || w.phoneticUk
    const label = isUk ? '英' : '美'
    if (phone) {
      const cleanPhone = phone.replace(/^\/+|\/+$/g, '').trim()
      return `${label} /${cleanPhone}/`
    }
    return ''
  }, [result?.word, phoneticPreference])

  if (!mounted || !isOpen) return null

  const cleanDisplayQuery = (wordQuery || '').replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-[120] w-[340px] sm:w-[360px] rounded-xl p-4 sm:p-4.5 bg-[#181B22] border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.55)] text-white select-text transition-all duration-150 animate-in fade-in zoom-in-95"
    >
      {/* 箭头指示角 */}
      {targetRect && (
        <div
          style={{ left: `${position.arrowLeft}px` }}
          className={`absolute size-2.5 -translate-x-1/2 rotate-45 bg-[#181B22] border-white/15 pointer-events-none transition-all ${
            position.placement === 'top'
              ? '-bottom-1.5 border-r border-b'
              : '-top-1.5 border-l border-t'
          }`}
        />
      )}

      {isLoading ? (
        <div className="py-5 flex flex-col items-center justify-center gap-2 text-gray-400">
          <Loader2 className="size-5 animate-spin text-primary" />
          <p className="text-xs font-sans">
            正在检索 <span className="text-white font-semibold">"{cleanDisplayQuery}"</span>...
          </p>
        </div>
      ) : result ? (
        <div className="space-y-2.5">
          {/* 顶栏：单词名 + 词性 (斜体) + 发音/收藏/关闭按钮 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-baseline flex-wrap gap-x-2 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans truncate">
                {result.word.name}
              </h3>
              {currentPos && (
                <span className="italic text-xs text-gray-400 font-normal font-sans">
                  {currentPos}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 -mr-1 -mt-0.5 shrink-0">
              {/* 朗读发音 */}
              <button
                type="button"
                onClick={handlePlayAudio}
                className={`p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
                  isPlaying ? 'text-primary animate-pulse' : ''
                }`}
                title="朗读发音"
                aria-label="朗读发音"
              >
                <Volume2 className="size-3.5 sm:size-4" />
              </button>

              {/* 加入/移出生词本 */}
              <button
                type="button"
                onClick={handleToggleStar}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isStarred
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-gray-400 hover:text-amber-400 hover:bg-white/10'
                }`}
                title={isStarred ? '已在生词本 (点击移出)' : '加入生词本'}
                aria-label={isStarred ? '移出生词本' : '加入生词本'}
              >
                <Star className={`size-3.5 sm:size-4 ${isStarred ? 'fill-amber-400' : ''}`} />
              </button>

              {/* 关闭按钮 */}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="关闭"
                aria-label="关闭"
              >
                <X className="size-3.5 sm:size-4" />
              </button>
            </div>
          </div>

          {/* 音标栏：如 美 /'rɛfərəns/ */}
          {displayPhonetic && (
            <div className="text-xs text-gray-400 font-mono tracking-wide -mt-0.5">
              {displayPhonetic}
            </div>
          )}

          {/* 当前语境释义：[当前语境] 标签 + 加粗释义 */}
          <div className="pt-2 border-t border-white/10 flex items-baseline gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0 select-none">
              当前语境
            </span>
            <span className="text-sm sm:text-base font-bold text-white leading-snug">
              {currentContextMean}
            </span>
          </div>

          {/* 其他常见义 */}
          {otherMeansText && (
            <div className="flex items-start gap-2 text-xs leading-relaxed text-gray-400 pt-0.5">
              <span className="text-gray-500 shrink-0 select-none">其他常见义</span>
              <span className="text-gray-300 font-sans">{otherMeansText}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 py-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-sans">{cleanDisplayQuery}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            暂未在现有词库中查询到该单词的释义。
          </p>
        </div>
      )}
    </div>,
    document.body
  )
}
