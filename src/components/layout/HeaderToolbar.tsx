'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw, Flame, X, ChevronDown } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { SkinPicker } from '@/components/layout/SkinPicker'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Tooltip } from '@/components/ui/Tooltip'

const ACCENT_OPTIONS: SelectOption<'us' | 'uk'>[] = [
  { value: 'us', label: '美音 (US)' },
  { value: 'uk', label: '英音 (UK)' },
]

const LOOP_OPTIONS: SelectOption<1 | 2 | 3 | 5>[] = [
  { value: 1, label: '循环 1次' },
  { value: 2, label: '循环 2次' },
  { value: 3, label: '循环 3次' },
  { value: 5, label: '循环 5次' },
]

export function HeaderToolbar() {
  const {
    currentBook,
    currentUnitIndex,
    currentUnitMeta,
    activeWordIndex,
    isErrorPracticeActive,
    conqueredErrorWordIds,
    currentLoadedWords,
    exitErrorPractice,
    loopCountSetting,
    setLoopCountSetting,
    mode,
    phoneticPreference,
    setPhoneticPreference,
    restartUnit,
  } = useWorkspaceStore()

  const [isScrolled, setIsScrolled] = useState(false)

  // 监听主滚动容器，只有在向下滚动时才显现吸顶底部分割线与阴影（参考词库管理页 books/page.tsx）
  useEffect(() => {
    const mainEl = document.querySelector('main')
    const handleScroll = () => {
      const top = mainEl ? mainEl.scrollTop : window.scrollY
      setIsScrolled(top > 10)
    }

    handleScroll()
    mainEl?.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      mainEl?.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const total = currentLoadedWords.length
  const progress = total > 0 ? Math.min(100, ((activeWordIndex + 1) / total) * 100) : 0

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-background flex items-center justify-center px-6 pointer-events-auto shrink-0 border-b border-border transition-shadow ${
        isScrolled ? 'shadow-[0_4px_16px_-8px_rgba(0,0,0,0.25)]' : ''
      }`}
    >
      <div className="h-14 xl:h-15 flex items-center gap-4 xl:gap-5 text-sm w-[800px] xl:w-[940px] 2xl:w-[1060px] max-w-[94vw] justify-between">
        <div className="flex items-center flex-1 min-w-0">
          {isErrorPracticeActive ? (
            <div className="flex items-center gap-2 min-w-0">
              <Flame className="size-4 text-destructive shrink-0" />
              <span className="text-destructive font-medium shrink-0">
                {mode === 'learn' ? '生错词练习' : '生错词攻坚'}
              </span>
              <span className="text-muted-foreground/50 shrink-0">/</span>
              <span className="text-muted-foreground tabular-nums truncate">
                {mode === 'learn'
                  ? `第 ${activeWordIndex + 1} / ${currentLoadedWords.length} 词`
                  : `已消灭 ${conqueredErrorWordIds?.length || 0} / ${currentLoadedWords.length} 词`}
              </span>
              <Tooltip content="退出生错词练习，返回常规章节" side="bottom">
                <button
                  onClick={exitErrorPractice}
                  className="ml-1 size-6 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="退出生错词练习"
                >
                  <X className="size-3.5" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <Link
              href={`/books?from=${mode}`}
              className="group flex items-center gap-2 min-w-0 max-w-full text-muted-foreground hover:text-foreground transition-colors"
              title="切换词书与单元"
            >
              <span className="text-foreground font-medium shrink-0">{currentBook?.name || 'CET-4'}</span>
              <span className="text-muted-foreground/50 shrink-0">/</span>
              {currentUnitMeta ? (
                <span className="truncate min-w-0">
                  Unit {currentUnitIndex + 1} · {currentUnitMeta.name}
                </span>
              ) : (
                <span className="shrink-0">第 {currentUnitIndex + 1} 章</span>
              )}
              <ChevronDown className="size-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5 xl:gap-2.5 shrink-0">
          <Select<'us' | 'uk'>
            value={phoneticPreference}
            onChange={setPhoneticPreference}
            options={ACCENT_OPTIONS}
          />

          {isErrorPracticeActive && mode === 'dictation' ? (
            <Tooltip content="错词攻坚强制连续 3 次无误默写" side="bottom">
              <span className="h-8 px-2.5 inline-flex items-center text-sm text-destructive cursor-default">
                循环 3 次
              </span>
            </Tooltip>
          ) : (
            <Select<1 | 2 | 3 | 5>
              value={loopCountSetting}
              onChange={setLoopCountSetting}
              options={LOOP_OPTIONS}
            />
          )}

          <Tooltip content="回到本单元第一个单词" side="bottom">
            <button
              onClick={restartUnit}
              className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <RotateCcw className="size-3.5" />
              <span>从头开始</span>
            </button>
          </Tooltip>

          <SkinPicker />
        </div>
      </div>

      {!isErrorPracticeActive && total > 0 && (
        <div className="absolute left-0 right-0 -bottom-px h-0.5 pointer-events-none" aria-hidden="true">
          <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
    </header>
  )
}
