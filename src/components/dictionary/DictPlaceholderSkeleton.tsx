'use client'

import React from 'react'
import type { DictHistoryItem } from '@/lib/dictHistory'

/**
 * 单词查询页首次未查询时的占位：
 * 居中提示输入单词，有历史记录时给出最近查询的快捷入口
 */
interface DictPlaceholderSkeletonProps {
  history?: DictHistoryItem[]
  onQuickSearch?: (word: string) => void
}

export function DictPlaceholderSkeleton({
  history = [],
  onQuickSearch,
}: DictPlaceholderSkeletonProps = {}) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center text-center select-none animate-in fade-in-50 duration-300 pb-16">
      <h2 className="text-3xl xl:text-4xl font-medium tracking-tight text-white/90">
        查一个单词
      </h2>
      <p className="mt-4 text-base text-muted-foreground">
        在上方输入单词，查看音标、释义、例句与构词
      </p>

      {history.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <span className="text-xs text-muted-foreground">最近查询</span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 max-w-xl">
            {history.slice(0, 8).map((item) => (
              <button
                key={item.word}
                type="button"
                onClick={() => onQuickSearch?.(item.word)}
                className="font-serif text-lg text-gray-300 hover:text-primary underline-offset-4 hover:underline transition-colors cursor-pointer pointer-events-auto"
              >
                {item.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
