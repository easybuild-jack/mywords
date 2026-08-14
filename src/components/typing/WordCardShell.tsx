'use client'

import React from 'react'
import { Volume2 } from 'lucide-react'
import type { WordItem } from '@/types'
import { audioEngine } from '@/core/audioEngine'

interface WordCardShellProps {
  word: WordItem
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
  children: React.ReactNode
}

/** 学习卡与默写卡共用的外壳：发音按钮与循环剩余次数角标 */
export function WordCardShell({
  word,
  phoneticPreference,
  remainingLoops = 1,
  children,
}: WordCardShellProps) {
  const speak = (e: React.MouseEvent) => {
    e.stopPropagation()
    audioEngine.playPronunciation(word.name, phoneticPreference)
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between pt-5 pb-6 px-8 text-center select-none">
      <button
        onClick={speak}
        className="absolute top-4 right-4 size-10 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/20 transition-all z-10 cursor-pointer"
        title="发音 (Ctrl+J)"
      >
        <Volume2 className="size-4.5" />
      </button>

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
