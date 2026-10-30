'use client'

import React from 'react'
import { Plus, Search } from 'lucide-react'

interface TranslateHeaderProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  totalGroupsCount: number
  totalSentencesCount: number
  onOpenImport: () => void
}

export function TranslateHeader({
  searchQuery,
  onSearchChange,
  totalGroupsCount,
  totalSentencesCount,
  onOpenImport,
}: TranslateHeaderProps) {
  return (
    <div className="shrink-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 select-none">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">句子翻译</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          实词热身，整句拼写，语法精解 · <span className="font-mono">{totalGroupsCount}</span> 个分组 ·{' '}
          <span className="font-mono">{totalSentencesCount}</span> 个句子
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-48 sm:w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索分组、场景或句子"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-white/[0.05] border border-transparent focus:border-border focus:bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onOpenImport}
          className="h-8 px-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="size-3.5" />
          导入练习语句
        </button>
      </div>
    </div>
  )
}
