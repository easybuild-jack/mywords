'use client'

import React, { useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, ArrowRight, SearchX } from 'lucide-react'
import { BUILTIN_ROOTS } from '@/resources/roots'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { RootCard } from './RootCard'

export function RootsStage() {
  const {
    activeRootIndex,
    rootSearchQuery,
    setRootIndex,
    setRootSearchQuery,
  } = useWorkspaceStore()

  // 根据搜索词在词根列表里实时过滤
  const filteredRoots = useMemo(() => {
    const q = rootSearchQuery.trim().toLowerCase()
    if (!q) return BUILTIN_ROOTS
    return BUILTIN_ROOTS.filter((root) => {
      const matchForm = root.form.toLowerCase().includes(q)
      const matchMeaning = root.meaning.toLowerCase().includes(q)
      const matchOrigin = root.origin.toLowerCase().includes(q)
      const matchWord = root.words.some(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q) ||
          w.breakdown.toLowerCase().includes(q)
      )
      return matchForm || matchMeaning || matchOrigin || matchWord
    })
  }, [rootSearchQuery])

  const totalFiltered = filteredRoots.length
  // 保证索引在过滤结果的安全范围内
  const safeIndex = totalFiltered > 0 ? Math.min(Math.max(0, activeRootIndex), totalFiltered - 1) : 0
  const currentRoot = filteredRoots[safeIndex]

  const handlePrev = useCallback(() => {
    if (safeIndex > 0) {
      setRootIndex(safeIndex - 1)
    }
  }, [safeIndex, setRootIndex])

  const handleNext = useCallback(() => {
    if (safeIndex < totalFiltered - 1) {
      setRootIndex(safeIndex + 1)
    }
  }, [safeIndex, totalFiltered, setRootIndex])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 避免在输入框中触发全局翻页
      const activeTag = document.activeElement?.tagName
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    },
    [handlePrev, handleNext]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="relative w-full flex-1 min-h-0 flex items-center justify-center gap-6">
      {/* 左侧切词根按钮（在卡片外部左侧，尺寸与样式与练习页完全统一） */}
      <button
        onClick={handlePrev}
        disabled={safeIndex === 0 || totalFiltered === 0}
        className={`shrink-0 size-10 rounded-full glass-card flex items-center justify-center transition-all ${
          safeIndex === 0 || totalFiltered === 0
            ? 'opacity-20 cursor-not-allowed text-gray-600'
            : 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95 cursor-pointer shadow-lg'
        }`}
        title="上一词根 (←)"
        aria-label="上一词根"
      >
        <ArrowLeft className="size-5" />
      </button>

      {/* 中间词根卡片容器 */}
      <div className="relative flex flex-col items-center">
        <div className="relative w-[800px] h-[580px] max-w-[94vw] rounded-3xl overflow-hidden glass-card border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {totalFiltered === 0 ? (
            /* 搜索无结果时的温和提示 */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                <SearchX className="size-8 text-gray-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white">未找到匹配的词根</h3>
                <p className="text-sm text-gray-400 max-w-md">
                  未找到与 “<span className="text-primary font-mono font-bold">{rootSearchQuery}</span>” 相关的词根、释义或派生词
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRootSearchQuery('')
                  setRootIndex(0)
                }}
                className="px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-sm font-bold transition-all cursor-pointer"
              >
                清空搜索条件
              </button>
            </div>
          ) : (
            currentRoot && (
              <RootCard
                root={currentRoot}
                currentIndex={safeIndex}
                totalRoots={totalFiltered}
              />
            )
          )}
        </div>
      </div>

      {/* 右侧切词根按钮（在卡片外部右侧，尺寸与样式与练习页完全统一） */}
      <button
        onClick={handleNext}
        disabled={safeIndex >= totalFiltered - 1 || totalFiltered === 0}
        className={`shrink-0 size-10 rounded-full glass-card flex items-center justify-center transition-all ${
          safeIndex >= totalFiltered - 1 || totalFiltered === 0
            ? 'opacity-20 cursor-not-allowed text-gray-600'
            : 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95 cursor-pointer shadow-lg'
        }`}
        title="下一词根 (→)"
        aria-label="下一词根"
      >
        <ArrowRight className="size-5" />
      </button>
    </div>
  )
}
