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

  // 1. AI 自动查询与生成中的优雅加载状态
  if (isAiSearching) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center select-none animate-in fade-in-50 duration-300">
        <div className="relative mb-5">
          <div className="size-16 xl:size-20 rounded-2xl xl:rounded-3xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-2xl relative z-10 backdrop-blur-xl">
            <Sparkles className="size-8 xl:size-10 text-primary animate-pulse" />
          </div>
          <div className="absolute -inset-3 bg-primary/20 blur-2xl rounded-full -z-0 animate-pulse" />
        </div>

        <h3 className="text-xl xl:text-2xl font-bold text-white tracking-tight mb-2.5 flex items-center gap-2.5">
          <span>AI 字典正在解析词条</span>
          <Loader2 className="size-5 animate-spin text-primary" />
        </h3>

        <p className="text-sm xl:text-base text-muted-foreground max-w-md leading-relaxed mb-4">
          本地词库未收录 <span className="text-foreground font-mono font-bold px-1.5 py-0.5 rounded bg-foreground/5 border border-foreground/10">{cleanWord || '目标词'}</span>，已自动启用 AI 字典引擎生成完整结构化数据...
        </p>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-muted-foreground font-mono">
          <span className="size-2 rounded-full bg-primary animate-ping" />
          <span>实时推导 IPA 音标 · 音节拆分 · 构词源流 · 语境例句</span>
        </div>
      </div>
    )
  }

  // 2. 本地词库未收录（未配置 AI 或 AI 查询失败时的原生空状态）
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

      {/* 错误或手动重试（如有） */}
      {aiError && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs max-w-md">
          <p className="font-semibold mb-1">AI 解析提示：{aiError}</p>
          {cleanWord && onAiLookup && (
            <button
              type="button"
              onClick={() => onAiLookup(cleanWord)}
              className="mt-2 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs transition-colors cursor-pointer"
            >
              点击重新尝试 AI 生成
            </button>
          )}
        </div>
      )}
    </div>
  )
}
