'use client'

import React from 'react'
import { SearchX, Sparkles, Loader2 } from 'lucide-react'

interface DictEmptyStateProps {
  query?: string
  currentBookName?: string
  onQuickSearch?: (word: string) => void
  onAiLookup?: (word: string) => void
  isAiSearching?: boolean
  aiError?: string | null
}

export function DictEmptyState({
  query,
  onAiLookup,
  isAiSearching,
  aiError,
}: DictEmptyStateProps) {
  const cleanWord = query?.trim()

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
        本地词库暂未收录
      </h3>

      {/* 简洁描述 */}
      <p className="text-sm xl:text-base text-muted-foreground max-w-sm leading-relaxed">
        {cleanWord ? (
          <>
            本地词库未找到单词 <span className="text-foreground font-mono font-bold px-1.5 py-0.5 rounded bg-foreground/5 border border-foreground/10">{cleanWord}</span>
          </>
        ) : (
          '请检查单词拼写是否有误'
        )}
      </p>

      {/* 场景二：AI 字典深度生成与解析按钮 */}
      {cleanWord && onAiLookup && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => onAiLookup(cleanWord)}
            disabled={isAiSearching}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 hover:bg-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-sm btn-neon-glow"
          >
            {isAiSearching ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>AI 字典正在解析并生成完整词条...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>使用 AI 字典生成完整词条</span>
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground/80">
            依照词库规范与音节切分规则，实时生成 IPA 音标、音节切分、词根词缀与双语例句
          </p>
          {aiError && (
            <p className="text-xs text-rose-400 mt-1 max-w-sm">
              {aiError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
