'use client'

import React, { useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { SkinPicker } from '@/components/layout/SkinPicker'

export function RootsHeaderToolbar() {
  const { rootSearchQuery, setRootSearchQuery, setRootIndex } = useWorkspaceStore()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="w-full flex items-center justify-center p-4 sticky top-0 z-30 pointer-events-auto">
      <div className="glass-card rounded-2xl px-4 py-2 flex items-center gap-3 text-sm shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10 w-auto">
        {/* 1. 词根页面直接输入搜索框 */}
        <div className="relative w-[280px] sm:w-[360px] flex items-center">
          <Search className="absolute left-3 size-3.5 text-primary pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={rootSearchQuery}
            onChange={(e) => {
              setRootSearchQuery(e.target.value)
              setRootIndex(0)
            }}
            placeholder="搜索词根 (如 spect, tract)、释义或派生词..."
            className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] focus:bg-white/[0.08] border border-white/10 focus:border-primary/50 text-white placeholder:text-gray-500 text-xs transition-all outline-none"
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
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* 分隔线 */}
        <div className="h-4 w-px bg-white/10" />

        {/* 2. 皮肤配色选择器 */}
        <SkinPicker />
      </div>
    </header>
  )
}
