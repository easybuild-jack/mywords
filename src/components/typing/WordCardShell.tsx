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
      <div className="absolute top-4 left-4 xl:top-5 xl:left-5 2xl:top-6 2xl:left-6 flex items-center gap-2 z-20">
        {headerLeft}
        {remainingLoops > 1 && (
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 font-bold tracking-wider">
            Again x{remainingLoops}
          </span>
        )}
      </div>

      {/* 顶部右侧区域：加星收藏与发音控件 */}
      <div className="absolute top-4 right-4 xl:top-5 xl:right-5 2xl:top-6 2xl:right-6 flex items-center gap-2 xl:gap-2.5 z-20">
        {headerActions}
        <button
          onClick={speak}
          className="size-10 xl:size-11 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all cursor-pointer shadow-sm"
          title="发音 (Ctrl+J)"
        >
          <Volume2 className="size-4.5 xl:size-5" />
        </button>
      </div>

      {children}
    </div>
  )
}
