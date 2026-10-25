'use client'

import React from 'react'
import { Languages, Plus, Search, BookOpen, Layers } from 'lucide-react'

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
    <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/60 select-none">
      {/* 标题与统计微标 */}
      <div className="flex items-center gap-3.5">
        <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center p-2.5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
          <Languages className="size-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              句子翻译
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-primary/10 border border-primary/30 text-primary font-medium">
                Sentence Hub
              </span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>核心实词热身 · 语境整句拼写 · 深度语法精解</span>
            <span className="inline-block size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1 font-mono">
              <Layers className="size-3 text-muted-foreground" /> {totalGroupsCount} 分组
            </span>
            <span className="inline-block size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1 font-mono">
              <BookOpen className="size-3 text-muted-foreground" /> {totalSentencesCount} 句子
            </span>
          </p>
        </div>
      </div>

      {/* 搜索与导入主入口 */}
      <div className="flex items-center gap-3">
        {/* 分组/场景/句子搜索 */}
        <div className="relative w-48 sm:w-56 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索分组名称 / 场景 / 句子..."
            className="w-full h-9.5 pl-9 pr-3.5 rounded-xl bg-card/80 border border-border/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all shadow-xs"
          />
        </div>

        {/* 触发导入练习语句弹窗 */}
        <button
          type="button"
          onClick={onOpenImport}
          className="group flex items-center gap-2 h-9.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_16px_rgba(var(--primary-rgb),0.35),0_1px_2px_rgba(0,0,0,0.15)] border border-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="size-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>导入练习语句</span>
        </button>
      </div>
    </div>
  )
}
