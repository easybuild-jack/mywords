'use client'

import React from 'react'
import { SearchX, Loader2 } from 'lucide-react'

interface DictEmptyStateProps {
  query?: string
  currentBookName?: string
  onQuickSearch?: (word: string) => void
  onAiLookup?: (word: string) => void
  isAiSearching?: boolean
  aiError?: string | null
  wordNotFound?: boolean
}

function QueryWord({ children }: { children: React.ReactNode }) {
  return <span className="font-serif text-lg text-foreground">{children}</span>
}

function StateLayout({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 pb-20 text-center select-none animate-in fade-in-50 duration-300">
      <div className="mb-5 text-muted-foreground">{icon}</div>
      <h3 className="text-2xl font-medium text-foreground tracking-tight mb-3">{title}</h3>
      {children}
    </div>
  )
}

export function DictEmptyState({
  query,
  onAiLookup,
  isAiSearching,
  aiError,
  wordNotFound,
}: DictEmptyStateProps) {
  const cleanWord = query?.trim()

  // 1. AI 自动查询与生成中的加载状态
  if (isAiSearching) {
    return (
      <StateLayout
        icon={<Loader2 className="size-8 animate-spin text-primary" strokeWidth={1.5} />}
        title="AI 字典正在解析词条"
      >
        <p className="text-sm xl:text-base text-muted-foreground max-w-md leading-relaxed">
          本地词库未收录 <QueryWord>{cleanWord || '目标词'}</QueryWord>，正在生成音标、音节、构词与例句…
        </p>
      </StateLayout>
    )
  }

  if (wordNotFound) {
    return (
      <StateLayout icon={<SearchX className="size-8" strokeWidth={1.5} />} title="未找到有效英文单词">
        <p className="text-sm xl:text-base text-muted-foreground max-w-md leading-relaxed">
          AI 词典无法确认 <QueryWord>{cleanWord || '该拼写'}</QueryWord> 是有效英文单词，请检查拼写后重新查询。
        </p>
      </StateLayout>
    )
  }

  // 2. 没有等到结果或 AI 生成失败时的重试状态
  if (aiError) {
    return (
      <StateLayout icon={<SearchX className="size-8" strokeWidth={1.5} />} title="没有等到结果，请稍后再试">
        <p className="text-sm xl:text-base text-muted-foreground max-w-md leading-relaxed">
          <QueryWord>{cleanWord || '目标词'}</QueryWord> 的 AI 词典解析遇到中断或网络延迟
        </p>
        <p className="mt-2 text-xs text-muted-foreground/70 max-w-md">{aiError}</p>

        {cleanWord && onAiLookup && (
          <button
            type="button"
            onClick={() => onAiLookup(cleanWord)}
            className="mt-6 h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium transition-colors cursor-pointer"
          >
            重新尝试解析
          </button>
        )}
      </StateLayout>
    )
  }

  // 3. 本地词库未收录（普通未收录状态）
  return (
    <StateLayout icon={<SearchX className="size-8" strokeWidth={1.5} />} title="本地词库暂未收录">
      <p className="text-sm xl:text-base text-muted-foreground max-w-sm leading-relaxed">
        {cleanWord ? (
          <>
            本地词库未找到单词 <QueryWord>{cleanWord}</QueryWord>
          </>
        ) : (
          '请检查单词拼写是否有误'
        )}
      </p>
    </StateLayout>
  )
}
