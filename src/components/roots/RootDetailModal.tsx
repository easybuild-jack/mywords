'use client'

import React, { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { RootItem } from '@/types'
import { RootCard } from './RootCard'

interface RootDetailModalProps {
  isOpen: boolean
  onClose: () => void
  items: RootItem[]
  currentIndex: number
  onNavigate: (index: number) => void
  tabLabel: string
}

export function RootDetailModal({
  isOpen,
  onClose,
  items,
  currentIndex,
  onNavigate,
  tabLabel,
}: RootDetailModalProps) {
  const currentRoot = items[currentIndex]

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1)
    }
  }, [currentIndex, onNavigate])

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      onNavigate(currentIndex + 1)
    }
  }, [currentIndex, items.length, onNavigate])

  // 全局键盘监听：ESC 关闭，左右键直接翻页切换详情卡片
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ChevronLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ChevronRight') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrev, handleNext, onClose])

  if (!isOpen || !currentRoot) return null

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 xl:p-6 bg-background/80 backdrop-blur-sm animate-fade-in"
    >
      {/* 弹窗核心区域：左右翻页 + 居中自适应卡片 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex items-center justify-center gap-2.5 sm:gap-4 xl:gap-6 max-w-full px-1"
      >
        {/* 左翻页按钮 */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className="shrink-0 size-10 xl:size-11 rounded-full flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title={`上一${tabLabel} (←)`}
          aria-label={`上一${tabLabel}`}
        >
          <ChevronLeft className="size-5 xl:size-6" />
        </button>

        {/* 详情卡片容器（实底不透明，杜绝透光干扰底层数据） */}
        <div className="relative w-[800px] h-[580px] xl:w-[940px] xl:h-[630px] 2xl:w-[1060px] 2xl:h-[680px] max-w-[calc(100%-100px)] sm:max-w-[calc(100%-130px)] rounded-xl overflow-hidden bg-sidebar border border-border shadow-xl">
          {/* 弹框卡片右上角关闭按钮 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 xl:top-5 xl:right-5 size-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer z-30"
            title="关闭详情 (ESC)"
            aria-label="关闭详情"
          >
            <X className="size-5" />
          </button>

          <RootCard
            root={currentRoot}
            currentIndex={currentIndex}
            totalRoots={items.length}
          />
        </div>

        {/* 右翻页按钮 */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= items.length - 1}
          className="shrink-0 size-10 xl:size-11 rounded-full flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title={`下一${tabLabel} (→)`}
          aria-label={`下一${tabLabel}`}
        >
          <ChevronRight className="size-5 xl:size-6" />
        </button>
      </div>
    </div>
  )
}
