'use client'

import React, { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { SkinPicker } from '@/components/layout/SkinPicker'
import { ROOT_TAB_LABELS, type RootTabType } from '@/resources/roots'

const ROOT_TABS: { id: RootTabType; label: string }[] = [
  { id: 'prefix', label: '前缀' },
  { id: 'suffix', label: '后缀' },
  { id: 'root', label: '词根' },
]

export function RootsHeaderToolbar() {
  const { rootTab, setRootTab, rootSearchQuery, setRootSearchQuery, setRootIndex } = useWorkspaceStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const currentTabLabel = ROOT_TAB_LABELS[rootTab] || '词根'

  return (
    <header className="w-full flex items-center justify-center p-4 xl:p-6 sticky top-0 z-30 pointer-events-auto">
      <div className="glass-card rounded-2xl xl:rounded-3xl px-5 xl:px-7 py-2.5 xl:py-3.5 flex items-center gap-3 xl:gap-4 text-sm xl:text-base shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10 w-auto flex-wrap justify-center transition-all duration-300">
        {/* 1. Tab 切换 (词根 / 前缀 / 后缀) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
          {ROOT_TABS.map((tab) => {
            const isActive = rootTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRootTab(tab.id)}
                className={`px-3 xl:px-4 py-1 xl:py-1.5 rounded-lg text-xs xl:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-[#0B0C0E] font-bold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 分隔线 */}
        <div className="h-4 xl:h-5 w-px bg-white/10 hidden sm:block" />

        {/* 2. 页面直接输入搜索框 */}
        <div className="relative w-[220px] sm:w-[320px] xl:w-[360px] flex items-center">
          <Search className="absolute left-3 size-3.5 xl:size-4 text-primary pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={rootSearchQuery}
            onChange={(e) => {
              setRootSearchQuery(e.target.value)
              setRootIndex(0)
            }}
            placeholder={`搜索${currentTabLabel}、释义或派生词...`}
            className="w-full pl-8.5 pr-8 py-1.5 xl:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] focus:bg-white/[0.08] border border-white/10 focus:border-primary/50 text-white placeholder:text-gray-500 text-xs xl:text-sm transition-all outline-none"
          />
          {rootSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setRootSearchQuery('')
                setRootIndex(0)
                inputRef.current?.focus()
              }}
              className="absolute right-2.5 p-0.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="清空搜索"
            >
              <X className="size-3.5 xl:size-4" />
            </button>
          )}
        </div>

        {/* 分隔线 */}
        <div className="h-4 xl:h-5 w-px bg-white/10" />

        {/* 3. 皮肤配色选择器 */}
        <SkinPicker />
      </div>
    </header>
  )
}
