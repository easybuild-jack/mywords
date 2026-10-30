'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { dictionaryLoader } from '@/core/dictionaryLoader'

/**
 * 单词练习舞台专属骨架屏
 * 在章节/词库加载或切词瞬间渲染，版式与单词页一致，消除空白或硬切闪烁。
 */
export function UnitLoadingSkeleton() {
  const currentBook = useWorkspaceStore((s) => s.currentBook)
  const currentBookId = useWorkspaceStore((s) => s.currentBookId)
  const currentUnitIndex = useWorkspaceStore((s) => s.currentUnitIndex)
  const unitLoadingTarget = useWorkspaceStore((s) => s.unitLoadingTarget)

  const bookName = unitLoadingTarget?.bookName || currentBook?.name || '当前词库'
  const targetUnitIndex = unitLoadingTarget?.unitIndex ?? currentUnitIndex
  const unitNumber = targetUnitIndex + 1
  // 目录已在词库页加载过，这里同步读缓存即可拿到单元名，避免骨架屏只显示「Unit N」
  const unitName = dictionaryLoader.getCachedBookUnits(currentBookId)?.[targetUnitIndex]?.name

  return (
    <div className="relative w-full h-full flex flex-col select-none pt-12 xl:pt-14 pb-2 overflow-hidden">
      <div className="absolute top-3 left-0 xl:top-4 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin text-primary" />
        <span>
          正在载入 {unitName ? `${bookName} · ${unitName}` : `${bookName} · Unit ${unitNumber}`}
        </span>
      </div>

      <div className="flex flex-col items-center animate-pulse">
        <div className="h-20 sm:h-24 xl:h-28 2xl:h-30 flex items-center">
          <div className="h-14 xl:h-16 w-64 xl:w-80 rounded-lg bg-muted" />
        </div>
        <div className="mt-2 h-9 flex items-center">
          <div className="h-5 w-32 rounded bg-muted" />
        </div>
        <div className="mt-1 min-h-[48px] xl:min-h-[56px] flex items-center">
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
        <div className="mt-3 xl:mt-4 w-full max-w-xl h-16 sm:h-18 xl:h-20 flex flex-col justify-between py-1.5">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="border-b border-foreground/10" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 mt-5 xl:mt-7 border-t border-border flex-1 min-h-0 animate-pulse">
        <div className="col-span-8 pt-5 pr-8 space-y-5">
          <div className="h-4 w-20 rounded bg-muted" />
          {[0, 1].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-5 w-11/12 rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="col-span-4 pt-5 pl-8 border-l border-border space-y-3">
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-7 w-3/5 rounded bg-muted" />
          <div className="h-4 w-4/5 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
