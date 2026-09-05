'use client'

import React, { useMemo } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { BUILTIN_ROOTS, ROOT_DATA_MAP, ROOT_TAB_LABELS } from '@/resources/roots'

/** 词根词缀页底部的进度与快捷键提示条（与 PracticeFooter 保持完全一致的视觉规格与大屏自适应） */
export function RootsFooter() {
  const { rootTab, activeRootIndex, rootSearchQuery, setRootIndex } = useWorkspaceStore()

  const currentDataset = useMemo(() => ROOT_DATA_MAP[rootTab] || BUILTIN_ROOTS, [rootTab])
  const tabLabel = ROOT_TAB_LABELS[rootTab] || '词根'

  // 根据搜索词在当前列表里实时过滤
  const filteredRoots = useMemo(() => {
    const q = rootSearchQuery.trim().toLowerCase()
    if (!q) return currentDataset
    return currentDataset.filter((item) => {
      const matchForm = item.form.toLowerCase().includes(q)
      const matchMeaning = item.meaning.toLowerCase().includes(q)
      const matchOrigin = item.origin.toLowerCase().includes(q)
      const matchWord = item.words.some(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q) ||
          w.breakdown.toLowerCase().includes(q)
      )
      return matchForm || matchMeaning || matchOrigin || matchWord
    })
  }, [rootSearchQuery, currentDataset])

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
    <footer className="w-full p-4 xl:p-6 flex items-center justify-center pointer-events-auto z-30">
      <div className="glass-card rounded-2xl xl:rounded-3xl px-5 xl:px-7 py-2.5 xl:py-3.5 flex items-center gap-4 xl:gap-6 text-sm xl:text-base text-[#9CA3AF] border border-white/10 shadow-lg flex-wrap justify-center transition-all duration-300">
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary font-bold text-sm xl:text-base">
            {currentNum} / {totalFiltered}
          </span>
          <span className="text-gray-500 text-xs xl:text-sm">
            {rootSearchQuery ? '搜索结果' : tabLabel}
          </span>
        </div>

        <div className="h-4 xl:h-5 w-px bg-white/10" />

        <div className="flex items-center gap-4 xl:gap-5 font-mono text-xs xl:text-sm flex-wrap justify-center">
          <div className="flex items-center gap-1.5 xl:gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={safeIndex === 0 || totalFiltered === 0}
                title={`上一个${tabLabel} (←)`}
                className="h-7 xl:h-8 px-2 xl:px-2.5 inline-flex items-center rounded bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={safeIndex >= totalFiltered - 1 || totalFiltered === 0}
                title={`下一个${tabLabel} (→)`}
                className="h-7 xl:h-8 px-2 xl:px-2.5 inline-flex items-center rounded bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
            <span>切换{tabLabel}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
