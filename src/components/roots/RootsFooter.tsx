'use client'

import React, { useMemo } from 'react'
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

  return (
    <footer className="w-full max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10 py-3 flex items-center justify-between gap-4 text-xs text-muted-foreground shrink-0">
      <span>
        {rootSearchQuery ? `匹配的${tabLabel}` : tabLabel}
        <span className="ml-1.5 font-mono text-foreground">{filteredRoots.length}</span> 条
      </span>
      <span className="hidden sm:inline">点击任意一行查看详情，详情中可用 ESC 关闭、← → 翻阅</span>
    </footer>
  )
}
