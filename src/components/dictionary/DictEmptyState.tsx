'use client'

import React from 'react'
import { SearchX } from 'lucide-react'

interface DictEmptyStateProps {
  query?: string
  currentBookName?: string
  onQuickSearch?: (word: string) => void
}

export function DictEmptyState({
  query,
}: DictEmptyStateProps) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center select-none animate-in fade-in-50 duration-300">
      {/* 居中图标徽标 */}
      <div className="relative mb-5">
        <div className="size-16 xl:size-20 rounded-2xl xl:rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-muted-foreground shadow-2xl relative z-10 backdrop-blur-xl">
          <SearchX className="size-8 xl:size-10 text-[#9CA3AF]" />
        </div>
        <div className="absolute -inset-2 bg-primary/10 blur-xl rounded-full -z-0" />
      </div>

      {/* 标题 */}
      <h3 className="text-xl xl:text-2xl font-bold text-foreground tracking-tight mb-2.5">
        暂未查询到信息
      </h3>

      {/* 简洁描述 */}
      <p className="text-sm xl:text-base text-muted-foreground max-w-sm leading-relaxed">
        {query ? (
          <>
            未找到单词 <span className="text-foreground font-mono font-bold px-1.5 py-0.5 rounded bg-foreground/5 border border-foreground/10">{query}</span>，请检查拼写是否有误
          </>
        ) : (
          '请检查单词拼写是否有误'
        )}
      </p>
    </div>
  )
}

