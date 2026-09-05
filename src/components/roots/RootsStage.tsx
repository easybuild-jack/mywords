'use client'

import React, { useState, useMemo } from 'react'
import { BUILTIN_ROOTS, ROOT_DATA_MAP, ROOT_TAB_LABELS } from '@/resources/roots'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { RootsTableView } from './RootsTableView'
import { RootDetailModal } from './RootDetailModal'

export function RootsStage() {
  const {
    rootTab,
    rootSearchQuery,
    setRootSearchQuery,
    setRootIndex,
    activeRootIndex,
  } = useWorkspaceStore()

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)

  const currentDataset = useMemo(() => ROOT_DATA_MAP[rootTab] || BUILTIN_ROOTS, [rootTab])
  const tabLabel = ROOT_TAB_LABELS[rootTab] || '词根'

  // 根据搜索词在当前数据源中过滤（过滤形态、读音、释义、词源）
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

  const handleOpenDetail = (index: number) => {
    setModalIndex(index)
    setRootIndex(index)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
  }

  const handleNavigateModal = (newIndex: number) => {
    setModalIndex(newIndex)
    setRootIndex(newIndex)
  }

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col py-1">
      {/* 1. 默认常驻主视图：概览列表（表格看大概，无派生词干扰） */}
      <RootsTableView
        items={filteredRoots}
        tabLabel={tabLabel}
        searchQuery={rootSearchQuery}
        onViewDetail={handleOpenDetail}
        onClearSearch={() => setRootSearchQuery('')}
      />

      {/* 2. 顶层详情卡片弹窗：点击右侧【查看】后弹出，浮于最顶层，下层列表保持常驻 */}
      <RootDetailModal
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        items={filteredRoots}
        currentIndex={modalIndex}
        onNavigate={handleNavigateModal}
        tabLabel={tabLabel}
      />
    </div>
  )
}
