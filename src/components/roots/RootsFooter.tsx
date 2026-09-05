'use client'

import React, { useMemo } from 'react'
import { Eye } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { BUILTIN_ROOTS, ROOT_DATA_MAP, ROOT_TAB_LABELS } from '@/resources/roots'

/** 词根词缀页底部的进度与提示栏 */
export function RootsFooter() {
  const { rootTab, rootSearchQuery } = useWorkspaceStore()

  const currentDataset = useMemo(() => ROOT_DATA_MAP[rootTab] || BUILTIN_ROOTS, [rootTab])
  const tabLabel = ROOT_TAB_LABELS[rootTab] || '词根'

  const filteredRoots = useMemo(() => {
    const q = rootSearchQuery.trim().toLowerCase()
    if (!q) return currentDataset
    return currentDataset.filter((item) => {
      const matchForm = item.form.toLowerCase().includes(q)
      const matchMeaning = item.meaning.toLowerCase().includes(q)
      const matchOrigin = item.origin.toLowerCase().includes(q)
      const matchPhonetic = item.phonetic?.toLowerCase().includes(q)
      return matchForm || matchMeaning || matchOrigin || matchPhonetic
    })
  }, [rootSearchQuery, currentDataset])

  const totalFiltered = filteredRoots.length

  return (
    <footer className="w-full p-4 xl:p-6 flex items-center justify-center pointer-events-auto z-30">
      <div className="glass-card rounded-2xl xl:rounded-3xl px-5 xl:px-7 py-2.5 xl:py-3.5 flex items-center gap-4 xl:gap-6 text-sm xl:text-base text-[#9CA3AF] border border-white/10 shadow-lg flex-wrap justify-center transition-all duration-300">
        {/* 当前数量统计 */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary font-bold text-sm xl:text-base">
            共 {totalFiltered} 条
          </span>
          <span className="text-gray-500 text-xs xl:text-sm">
            {rootSearchQuery ? `匹配的${tabLabel}` : tabLabel}
          </span>
        </div>

        <div className="h-4 xl:h-5 w-px bg-white/10" />

        {/* 交互提示 */}
        <div className="flex items-center gap-3 font-mono text-xs xl:text-sm text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5 text-primary" />
            <span>点击行或【查看】弹出详情卡片</span>
          </span>
          <span className="text-gray-600 hidden sm:inline">·</span>
          <span className="hidden sm:inline">弹窗支持 ESC 关闭及 ← → 翻阅</span>
        </div>
      </div>
    </footer>
  )
}
