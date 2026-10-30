'use client'

import React from 'react'
import { Plus, Search } from 'lucide-react'

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
  videoCount,
  audioCount,
  onOpenUpload,
}: RadioHeaderProps) {
  return (
    <div className="shrink-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 select-none">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">听力电台</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          母语级影音听力，随身磨耳朵 · <span className="font-mono">{audioCount}</span> 个音频 ·{' '}
          <span className="font-mono">{videoCount}</span> 个视频
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-48 sm:w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索片段标题或场景"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-white/[0.05] border border-transparent focus:border-border focus:bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onOpenUpload}
          className="h-8 px-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="size-3.5" />
          上传音视频
        </button>
      </div>
    </div>
  )
}
