'use client'

import React from 'react'
import { Volume2 } from 'lucide-react'
import type { WordItem } from '@/types'
import { audioEngine } from '@/core/audioEngine'

interface WordCardShellProps {
  word: WordItem
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
  headerActions?: React.ReactNode
  children: React.ReactNode
}

/** 学习卡与默写卡共用的外壳：发音按钮与循环剩余次数角标 */
export function WordCardShell({
  word,
  phoneticPreference,
  remainingLoops = 1,
  headerActions,
  children,
}: WordCardShellProps) {
  const speak = (e: React.MouseEvent) => {
    e.stopPropagation()
    audioEngine.playPronunciation(word.name, phoneticPreference)
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between pt-5 pb-6 px-7 xl:pt-6 xl:pb-7 xl:px-10 2xl:pt-8 2xl:pb-8 2xl:px-12 text-center select-none">
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

      {/* 剩余遍数角标跟右上角发音按钮共用一套主色描边：两者都是卡片上的附属控件，
          用同一套配色能和正文里的琥珀（字母组合）、珊瑚红（当前词根）区分开 */}
      {remainingLoops > 1 && (
        <span className="absolute top-4 left-4 text-xs font-mono px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 z-10 font-bold tracking-wider">
          Again x{remainingLoops}
        </span>
      )}

      {children}
    </div>
  )
}
