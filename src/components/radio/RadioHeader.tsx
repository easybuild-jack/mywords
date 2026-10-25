'use client'

import React from 'react'
import { Radio, Plus, Search, Sparkles, Headphones, Video } from 'lucide-react'

interface RadioHeaderProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  totalCount: number
  videoCount: number
  audioCount: number
  onOpenUpload: () => void
}

export function RadioHeader({
  searchQuery,
  onSearchChange,
  totalCount,
  videoCount,
  audioCount,
  onOpenUpload,
}: RadioHeaderProps) {
  return (
    <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/60 select-none">
      {/* 标题与统计微标 */}
      <div className="flex items-center gap-3.5">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center p-2.5 shadow-[0_0_20px_rgba(var(--primary-rgb)/0.2)]">
          <Radio className="size-6 text-primary animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              听力电台
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-primary/10 border border-primary/30 text-primary font-medium">
                Audio & Video Hub
              </span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>母语级影音听觉浸润 · 随身磨耳朵</span>
            <span className="inline-block size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1 font-mono">
              <Headphones className="size-3 text-muted-foreground" /> {audioCount} 音频
            </span>
            <span className="inline-block size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1 font-mono">
              <Video className="size-3 text-muted-foreground" /> {videoCount} 视频
            </span>
          </p>
        </div>
      </div>

      {/* 搜索与上传主入口 */}
      <div className="flex items-center gap-3">
        {/* 标题/场景搜索 */}
        <div className="relative w-48 sm:w-56 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索片段标题 / 场景..."
            className="w-full h-9.5 pl-9 pr-3.5 rounded-xl bg-card/80 border border-border/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all shadow-xs"
          />
        </div>

        {/* 触发上传视频/音频弹窗 */}
        <button
          onClick={onOpenUpload}
          className="group flex items-center gap-2 h-9.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-[0_4px_16px_rgba(var(--primary-rgb)/0.35),0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.35)] border border-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="size-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>上传音视频</span>
        </button>
      </div>
    </div>
  )
}
