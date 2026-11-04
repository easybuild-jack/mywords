'use client'

import React from 'react'
import { Volume2 } from 'lucide-react'
import type { WordItem } from '@/types'
import { audioEngine } from '@/core/audioEngine'

interface WordCardShellProps {
  word: WordItem
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
  headerLeft?: React.ReactNode
  headerActions?: React.ReactNode
  showAudioButton?: boolean
  className?: string
  children: React.ReactNode
}

/** 学习卡与默写卡共用的外壳：发音按钮与循环剩余次数角标 */
export function WordCardShell({
  word,
  phoneticPreference,
  remainingLoops = 1,
  headerLeft,
  headerActions,
  showAudioButton = true,
  className,
  children,
}: WordCardShellProps) {
  const speak = (e: React.MouseEvent) => {
    e.stopPropagation()
    audioEngine.playPronunciation(word.name, phoneticPreference)
  }

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between text-center select-none ${
        className || 'pt-5 pb-6 px-7 xl:pt-6 xl:pb-7 xl:px-10 2xl:pt-8 2xl:pb-8 2xl:px-12'
      }`}
    >
      {/* 顶部左侧区域：词库来源徽标或循环剩余次数角标 */}
      <div className="absolute top-3 left-0 xl:top-4 flex items-center gap-3 z-20 text-[13px] text-muted-foreground">
        {headerLeft}
        {remainingLoops > 1 && (
          <span className="tabular-nums">
            还需再打 <span className="text-primary font-medium">{remainingLoops}</span> 遍
          </span>
        )}
      </div>

      <div className="absolute top-2 right-0 xl:top-3 flex items-center gap-1 z-20">
        {headerActions}
        {showAudioButton && (
          <button
            onClick={speak}
            className="size-9 rounded-md text-muted-foreground hover:text-primary hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
            title="发音 (Ctrl+J)"
            aria-label="发音"
          >
            <Volume2 className="size-4.5" />
          </button>
        )}
      </div>

      {children}
    </div>
  )
}
