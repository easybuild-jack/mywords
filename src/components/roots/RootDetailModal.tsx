'use client'

import React, { useEffect, useCallback } from 'react'
import { X, ArrowLeft, ArrowRight } from 'lucide-react'
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
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      {/* 右上角关闭按钮 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 size-10 xl:size-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-50 shadow-xl hover:scale-105 active:scale-95"
        title="关闭详情 (ESC)"
        aria-label="关闭详情"
      >
        <X className="size-5" />
      </button>

      {/* 弹窗核心区域：左右翻页 + 居中自适应卡片 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex items-center justify-center gap-4 sm:gap-6 max-w-full"
      >
        {/* 左翻页按钮 */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className={`shrink-0 size-10 xl:size-12 rounded-full glass-card flex items-center justify-center transition-all ${
            currentIndex <= 0
              ? 'opacity-20 cursor-not-allowed text-gray-600'
              : 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95 cursor-pointer shadow-xl'
          }`}
          title={`上一${tabLabel} (←)`}
          aria-label={`上一${tabLabel}`}
        >
          <ArrowLeft className="size-5 xl:size-6" />
        </button>

        {/* 详情卡片容器（复用自适应规格） */}
        <div className="relative w-[800px] h-[580px] xl:w-[940px] xl:h-[630px] 2xl:w-[1060px] 2xl:h-[680px] max-w-[92vw] rounded-3xl overflow-hidden glass-card border border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.8)] transition-all duration-300">
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
          className={`shrink-0 size-10 xl:size-12 rounded-full glass-card flex items-center justify-center transition-all ${
            currentIndex >= items.length - 1
              ? 'opacity-20 cursor-not-allowed text-gray-600'
              : 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95 cursor-pointer shadow-xl'
          }`}
          title={`下一${tabLabel} (→)`}
          aria-label={`下一${tabLabel}`}
        >
          <ArrowRight className="size-5 xl:size-6" />
        </button>
      </div>
    </div>
  )
}
