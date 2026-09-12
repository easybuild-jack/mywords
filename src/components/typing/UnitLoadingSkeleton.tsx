'use client'

import React from 'react'
import { Sparkles, BookOpen, Volume2, Loader2 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/**
 * 单词练习舞台专属骨架屏
 * 在章节/词库加载或切词瞬间渲染，具有现代玻璃拟态与平滑流动扫光动效，
 * 消除卡片空白或硬切闪烁。
 */
export function UnitLoadingSkeleton() {
  const currentBook = useWorkspaceStore((s) => s.currentBook)
  const currentUnitIndex = useWorkspaceStore((s) => s.currentUnitIndex)
  const unitLoadingTarget = useWorkspaceStore((s) => s.unitLoadingTarget)

  const bookName = unitLoadingTarget?.bookName || currentBook?.name || '当前词库'
  const unitNumber = (unitLoadingTarget?.unitIndex ?? currentUnitIndex) + 1

  return (
    <div className="relative w-full h-full flex flex-col justify-between text-center select-none pt-5 pb-6 px-7 xl:pt-6 xl:pb-7 xl:px-10 2xl:pt-8 2xl:pb-8 2xl:px-12 overflow-hidden">
      {/* 顶部左侧：词库与章节加载徽标 */}
      <div className="absolute top-4 left-4 xl:top-5 xl:left-5 2xl:top-6 2xl:left-6 flex items-center gap-2.5 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-semibold backdrop-blur-md shadow-sm">
          <BookOpen className="size-3.5 text-primary animate-pulse" />
          <span>{bookName} · Unit {unitNumber}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-muted-foreground font-mono">
          <Loader2 className="size-3 animate-spin text-primary" />
          <span>正在编排词表...</span>
        </div>
      </div>

      {/* 顶部右侧：发音按钮骨架 */}
      <div className="absolute top-4 right-4 xl:top-5 xl:right-5 2xl:top-6 2xl:right-6 flex items-center gap-2 z-20">
        <div className="size-10 xl:size-11 rounded-xl bg-white/[0.04] border border-white/10 text-muted-foreground/30 flex items-center justify-center animate-pulse">
          <Volume2 className="size-4.5 xl:size-5 opacity-40" />
        </div>
      </div>

      {/* 中部核心单词与音标骨架 */}
      <div className="flex flex-col items-center mt-7 xl:mt-9 2xl:mt-10">
        {/* 单词主字号骨架 */}
        <div className="h-12 sm:h-14 xl:h-16 2xl:h-20 w-64 sm:w-80 xl:w-96 rounded-2xl bg-white/[0.06] border border-white/10 relative overflow-hidden animate-pulse">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* 音标与发音胶囊骨架 */}
        <div className="mt-3.5 flex items-center justify-center gap-3">
          <div className="h-7 w-28 xl:w-32 rounded-full bg-white/[0.05] border border-white/10 relative overflow-hidden animate-pulse">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="h-7 w-24 xl:w-28 rounded-full bg-white/[0.05] border border-white/10 relative overflow-hidden animate-pulse">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>

        {/* 自然拼读音节骨架点阵 */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-6 w-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
            <span className="text-[10px] text-primary/60 font-mono">···</span>
          </div>
          <span className="text-white/20 text-xs">·</span>
          <div className="h-6 w-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
            <span className="text-[10px] text-primary/60 font-mono">···</span>
          </div>
          <span className="text-white/20 text-xs">·</span>
          <div className="h-6 w-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
            <span className="text-[10px] text-primary/60 font-mono">···</span>
          </div>
        </div>
      </div>

      {/* 下方卡片：释义与构词拓展骨架 */}
      <div className="mt-auto space-y-3 pt-4">
        {/* 中文核心释义条 */}
        <div className="h-12 w-full max-w-lg mx-auto rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center px-4 relative overflow-hidden animate-pulse">
          <div className="h-3 w-48 rounded bg-white/10" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* 构词法或双语例句占位框 */}
        <div className="h-20 w-full max-w-xl mx-auto rounded-2xl bg-white/[0.03] border border-white/5 p-3 flex flex-col justify-center gap-2 relative overflow-hidden">
          <div className="h-2.5 w-3/4 rounded bg-white/10 animate-pulse" />
          <div className="h-2.5 w-1/2 rounded bg-white/[0.07] animate-pulse" />
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>

        {/* 底部微提示 */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 font-mono pt-1">
          <span className="size-1.5 rounded-full bg-primary animate-ping" />
          <span>正在构建音节切分、词根记忆与发音映射链路</span>
        </div>
      </div>
    </div>
  )
}
