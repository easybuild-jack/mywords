'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { dictionaryLoader } from '@/core/dictionaryLoader'
import { WordLayoutSkeleton } from '@/components/word/WordDisplay'

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
    <WordLayoutSkeleton
      showTypingLines
      status={
        <>
          <Loader2 className="size-3.5 animate-spin text-primary" />
          <span>
            正在载入 {unitName ? `${bookName} · ${unitName}` : `${bookName} · Unit ${unitNumber}`}
          </span>
        </>
      }
    />
  )
}
