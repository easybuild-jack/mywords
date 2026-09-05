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
    <div className="flex flex-col h-full w-full p-6 sm:p-7 xl:p-8 2xl:p-9 text-left select-none">
      {/* 顶部：核心形态与词源故事 */}
      <div className="space-y-2.5 xl:space-y-3 shrink-0">
        {/* 大字形态、读音音标、核心本义 */}
        <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 xl:gap-5">
          <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
            <span className="text-primary">
              {root.form}
            </span>
          </h2>
          {root.phonetic && (
            <span className="font-mono text-xl sm:text-2xl xl:text-3xl text-gray-300 font-normal">
              {root.phonetic}
            </span>
          )}
          <div className="text-lg sm:text-xl xl:text-2xl font-bold text-gray-200">
            本义：<span className="text-accent">{root.meaning}</span>
          </div>
        </div>

        {/* 词源故事与演变逻辑（主解释区固定高度：上面留给 origin 词源，下面固定呈现 derivationNote 派生解析） */}
        <div className="h-[116px] sm:h-[120px] xl:h-[126px] 2xl:h-[130px] text-sm sm:text-base xl:text-[17px] bg-white/[0.04] px-4 py-2.5 xl:px-4.5 xl:py-3 rounded-xl border border-white/10 flex flex-col justify-between select-none">
          {/* 上面：留给词根词缀的 origin 字段 */}
          <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1">
            <p className="text-gray-100 leading-relaxed">
              {root.origin}
            </p>
          </div>

          {/* 下面：固定在主解释区的底部 */}
          {root.derivationNote && (
            <div className="pt-2 mt-auto shrink-0 border-t border-white/10">
              <p className="text-primary font-medium text-xs sm:text-sm xl:text-base leading-snug">
                {root.derivationNote}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 下半区：派生核心词族矩阵 */}
      {/* 词根主数据与例词之间保留清晰的舒适呼吸间距 (mt-5 xl:mt-6) */}
      <div className="flex-1 min-h-0 flex flex-col mt-5 xl:mt-6">
        {/* 单词列表：使用 content-start 防止网格行被强制均匀拉伸，使例词之间紧凑聚集 (gap-y 适度紧凑) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 xl:gap-x-12 2xl:gap-x-14 gap-y-3 sm:gap-y-3.5 xl:gap-y-4 content-start overflow-y-auto pr-1.5 custom-scrollbar text-left flex-1 min-h-0">
          {root.words.map((wordItem, idx) => (
            <div
              key={idx}
              className="group space-y-0.5"
            >
              {/* 第 1 行：单词拼写 + 音标 + 发音按钮 */}
              <div className="flex items-center gap-2">
                <span
                  onClick={(e) => handlePlayWordAudio(wordItem.name, e)}
                  className="font-mono text-lg sm:text-xl xl:text-2xl font-extrabold text-white hover:text-primary transition-colors cursor-pointer"
                >
                  {wordItem.name}
                </span>

                {wordItem.phonetic && (
                  <span className="font-mono text-xs sm:text-sm xl:text-base text-gray-400 font-normal">
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
                  <Volume2 className="size-3.5 sm:size-4 xl:size-4.5" />
                </button>
              </div>

              {/* 第 2 行：核心构词拆解公式 */}
              <div className="text-sm sm:text-base xl:text-[17px] font-bold text-primary tracking-wide">
                → {wordItem.breakdown}
              </div>

              {/* 第 3 行：中文译文释义 */}
              <div className="text-sm sm:text-base xl:text-[17px] font-bold text-gray-100">
                {wordItem.meaning}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
