'use client'

import React, { useMemo } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { BUILTIN_ROOTS } from '@/resources/roots'

/** 词根页底部的进度与快捷键提示条（与 PracticeFooter 保持完全一致的视觉规格） */
export function RootsFooter() {
  const { activeRootIndex, rootSearchQuery, setRootIndex } = useWorkspaceStore()

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
  const safeIndex = totalFiltered > 0 ? Math.min(Math.max(0, activeRootIndex), totalFiltered - 1) : 0
  const currentNum = totalFiltered > 0 ? safeIndex + 1 : 0

  const handlePrev = () => {
    if (safeIndex > 0) {
      setRootIndex(safeIndex - 1)
    }
  }

  const handleNext = () => {
    if (safeIndex < totalFiltered - 1) {
      setRootIndex(safeIndex + 1)
    }
  }

  return (
    <footer className="w-full p-4 flex items-center justify-center pointer-events-auto z-30">
      <div className="glass-card rounded-2xl px-5 py-2.5 flex items-center gap-4 text-sm text-[#9CA3AF] border border-white/10 shadow-lg flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary font-bold">
            {currentNum} / {totalFiltered}
          </span>
          <span className="text-gray-500">
            {rootSearchQuery ? '搜索结果' : '词根'}
          </span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-4 font-mono text-xs flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={safeIndex === 0 || totalFiltered === 0}
                title="上一个词根 (←)"
                className="h-7 px-2 inline-flex items-center rounded bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={safeIndex >= totalFiltered - 1 || totalFiltered === 0}
                title="下一个词根 (→)"
                className="h-7 px-2 inline-flex items-center rounded bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
            <span>切换词根</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
