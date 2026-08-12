'use client'

import React from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { Card3DCarousel } from '@/components/carousel/Card3DCarousel'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { Star, Keyboard } from 'lucide-react'

export default function HomePage() {
  const {
    currentBook,
    currentUnitIndex,
    activeWordIndex,
    getUnitWords,
    keySoundPack,
    starCurrentWord,
  } = useWorkspaceStore()

  const unitWords = getUnitWords()
  const totalInUnit = unitWords.length || 20
  const currentNum = Math.min(activeWordIndex + 1, totalInUnit)

  return (
    <div className="flex-1 flex flex-col justify-between h-full relative overflow-hidden">
      {/* 1. 顶部综合控制栏 */}
      <HeaderToolbar />

      {/* 2. 中间 3D 空间 5 卡片立体轮播 */}
      <div className="flex-1 flex items-center justify-center relative w-full px-4">
        <Card3DCarousel />
      </div>

      {/* 3. 底部极简状态与快捷键提示栏 */}
      <footer className="w-full p-4 flex items-center justify-center pointer-events-auto z-30">
        <div className="glass-card rounded-2xl px-6 py-2 flex items-center gap-6 text-xs text-[#9CA3AF] border border-white/10 shadow-lg">
          {/* 当前单元进度 */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-primary font-bold">
              {currentNum} / {totalInUnit}
            </span>
            <span className="text-gray-500">单词</span>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          {/* 快捷键提示胶囊 */}
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white border border-white/10 font-bold">Tab</kbd>
              <span>偷看提示</span>
            </span>

            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white border border-white/10 font-bold">Ctrl+J</kbd>
              <span>发音</span>
            </span>

            <button
              onClick={starCurrentWord}
              className="flex items-center gap-1.5 hover:text-accent transition-colors"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white border border-white/10 font-bold">Ctrl+S</kbd>
              <span className="flex items-center gap-1">
                <Star className="size-3 text-accent fill-accent" /> 收藏
              </span>
            </button>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          {/* 当前轴体指示 */}
          <div className="flex items-center gap-1.5 text-accent font-medium">
            <Keyboard className="size-3.5" />
            <span className="font-mono">{keySoundPack}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
