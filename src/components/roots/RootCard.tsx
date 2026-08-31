'use client'

import React from 'react'
import { Volume2 } from 'lucide-react'
import type { RootItem } from '@/types'
import { audioEngine } from '@/core/audioEngine'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface RootCardProps {
  root: RootItem
  currentIndex: number
  totalRoots: number
}

export function RootCard({ root }: RootCardProps) {
  const { phoneticPreference } = useWorkspaceStore()

  const handlePlayWordAudio = (wordName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    audioEngine.playPronunciation(wordName, phoneticPreference)
  }

  return (
    <div className="flex flex-col justify-between h-full w-full p-6 sm:p-7 text-left space-y-4">
      {/* 顶部：词根核心信息与溯源 */}
      <div className="space-y-3">
        {/* 词根大字形态、读音音标与核心本义 */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
              <span className="text-primary drop-shadow-[0_0_20px_rgb(var(--primary-rgb)/0.3)]">
                {root.form}
              </span>
            </h2>
            {root.phonetic && (
              <span className="font-mono text-xl sm:text-2xl text-gray-300 font-normal">
                {root.phonetic}
              </span>
            )}
          </div>
          <div className="text-lg sm:text-xl font-bold text-gray-200">
            本义：<span className="text-accent">{root.meaning}</span>
          </div>
        </div>

        {/* 词源故事与演变逻辑（字号放大，清晰易读） */}
        <div className="space-y-1.5 text-base sm:text-[17px] text-gray-200 leading-relaxed bg-white/[0.025] p-3.5 rounded-2xl border border-white/5">
          <p className="text-gray-100">{root.origin}</p>
          {root.derivationNote && (
            <p className="text-sm sm:text-base text-primary font-medium">{root.derivationNote}</p>
          )}
        </div>
      </div>

      {/* 下半区：派生核心词族矩阵 (简化分割线，去除多余子标题栏，留出最大垂直空间) */}
      <div className="flex-1 min-h-0 flex flex-col pt-2 border-t border-white/10">
        {/* 纯文字单词列表（左右固定 2 列，每个派生词严格分为 3 行：拼写/拆解/释义） */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-4 pt-1 overflow-y-auto max-h-[340px] pr-1 custom-scrollbar text-left">
          {root.words.map((wordItem, idx) => (
            <div
              key={idx}
              className="group space-y-0.5"
            >
              {/* 第 1 行：单词拼写 + 音标 + 发音按钮 */}
              <div className="flex items-center gap-2">
                <span
                  onClick={(e) => handlePlayWordAudio(wordItem.name, e)}
                  className="font-mono text-xl font-extrabold text-white hover:text-primary transition-colors cursor-pointer"
                >
                  {wordItem.name}
                </span>

                {wordItem.phonetic && (
                  <span className="font-mono text-sm text-gray-400 font-normal">
                    {wordItem.phonetic}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => handlePlayWordAudio(wordItem.name, e)}
                  className="p-1 rounded-lg text-gray-400 hover:text-primary hover:bg-white/10 transition-all cursor-pointer"
                  title={`发音 ${wordItem.name}`}
                  aria-label={`发音 ${wordItem.name}`}
                >
                  <Volume2 className="size-4" />
                </button>
              </div>

              {/* 第 2 行：核心构词拆解公式 */}
              <div className="text-base sm:text-[17px] font-bold text-primary tracking-wide">
                → {wordItem.breakdown}
              </div>

              {/* 第 3 行：中文译文释义 */}
              <div className="text-base sm:text-[17px] font-bold text-gray-100">
                {wordItem.meaning}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
