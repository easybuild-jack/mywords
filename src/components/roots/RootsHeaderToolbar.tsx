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
    <header className="w-full max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10 pt-6 relative z-30 shrink-0">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border">
        <div className="flex items-end gap-8">
          <h1 className="text-xl font-semibold tracking-tight text-foreground pb-2">词根词缀</h1>
          <div className="flex items-center gap-6">
            {ROOT_TABS.map((tab) => {
              const isActive = rootTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRootTab(tab.id)}
                  className={`-mb-px pb-2.5 text-sm border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-foreground font-medium border-primary'
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 pb-2">
          <div className="relative w-[220px] sm:w-[300px] flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={rootSearchQuery}
              onChange={(e) => {
                setRootSearchQuery(e.target.value)
                setRootIndex(0)
              }}
              placeholder={`搜索${currentTabLabel}、释义或派生词`}
              className="w-full h-8 pl-8 pr-8 rounded-md bg-white/[0.05] border border-transparent focus:border-border focus:bg-transparent text-white placeholder:text-muted-foreground/70 text-[13px] transition-colors outline-none"
            />
            {rootSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setRootSearchQuery('')
                  setRootIndex(0)
                  inputRef.current?.focus()
                }}
                className="absolute right-2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="清空搜索"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <SkinPicker />
        </div>
      </div>
    </header>
  )
}
