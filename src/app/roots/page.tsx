'use client'

import React from 'react'
import { RootsHeaderToolbar } from '@/components/roots/RootsHeaderToolbar'
import { RootsStage } from '@/components/roots/RootsStage'
import { RootsFooter } from '@/components/roots/RootsFooter'

export default function RootsPage() {
  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between h-full relative">
      {/* 头部专属精简工具栏（含词根进度、全局搜索、掌握标记、皮肤与Restart） */}
      <RootsHeaderToolbar />

      {/* 核心词根卡片研习舞台 */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative w-full px-4">
        <RootsStage />
      </div>

      {/* 底部进度与快捷键提示条 */}
      <RootsFooter />
    </div>
  )
}
