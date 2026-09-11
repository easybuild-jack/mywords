'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { SkinPicker } from '@/components/layout/SkinPicker'
import { Select, type SelectOption } from '@/components/ui/Select'
import type { DictSuggestionItem } from '@/core/dictionarySearch'

const ACCENT_OPTIONS: SelectOption<'us' | 'uk'>[] = [
  { value: 'us', label: '美音 (US)' },
  { value: 'uk', label: '英音 (UK)' },
]

interface DictHeaderToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearchSubmit: (query: string) => void
  isSearching: boolean
  suggestions?: DictSuggestionItem[]
  onSelectSuggestion?: (item: DictSuggestionItem) => void
  validationError?: string | null
}

export function DictHeaderToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  isSearching,
  suggestions = [],
  onSelectSuggestion,
  validationError,
}: DictHeaderToolbarProps) {
  const { phoneticPreference, setPhoneticPreference } = useWorkspaceStore()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭联想下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false)
      onSearchSubmit(searchQuery)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleClear = () => {
    onSearchChange('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <header className="w-full flex items-center justify-center p-4 xl:p-6 sticky top-0 z-50 pointer-events-auto">
      <div className="glass-card rounded-2xl xl:rounded-3xl px-4 xl:px-6 py-2 xl:py-2.5 flex items-center gap-3.5 xl:gap-5 text-sm xl:text-base w-[800px] xl:w-[940px] 2xl:w-[1060px] max-w-[94vw] shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10 transition-all duration-300 justify-between">
        {/* 搜索输入栏（自然舒展填充剩余宽度） */}
        <div ref={containerRef} className="relative flex-1">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 size-4 xl:size-4.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              onKeyDown={handleKeyDown}
              aria-invalid={Boolean(validationError)}
              title={validationError || undefined}
              placeholder="搜索单词 (如: discover, perspective...)"
              className={`w-full h-10 xl:h-11 pl-10 pr-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-black/40 border text-white placeholder:text-muted-foreground/60 text-xs xl:text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                validationError
                  ? 'border-destructive/70 focus:border-destructive focus:ring-destructive/20'
                  : 'border-white/10 focus:border-primary/50 focus:ring-primary/20'
              }`}
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 size-4 text-primary animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="清空"
              >
                <X className="size-3.5 xl:size-4" />
              </button>
            ) : null}
          </div>
          {validationError && (
            <p className="absolute left-2 top-full mt-1 text-[11px] text-destructive">
              {validationError}
            </p>
          )}

          {/* 实时搜索联想下拉卡片（纯色不透明背景，层级覆盖背景内容） */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#12141A] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-black/40 overflow-hidden z-[100] divide-y divide-white/10 animate-in fade-in-50 zoom-in-95 duration-150">
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.name}-${idx}`}
                  type="button"
                  onClick={() => {
                    setShowSuggestions(false)
                    onSelectSuggestion?.(item)
                  }}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.08] transition-colors cursor-pointer group"
                >
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <span className="text-white font-mono font-bold text-sm xl:text-base group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px] xl:max-w-[260px]">
                      {item.meaning}
                    </span>
                  </div>
                  {item.sourceBookName ? (
                    <span
                      className={`text-[10px] xl:text-[11px] font-mono px-2 py-0.5 rounded-md shrink-0 border ${
                        item.isCurrentBook
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-white/5 text-gray-400 border-white/10'
                      }`}
                    >
                      {item.sourceBookName}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：发音口音切换与皮肤定制 */}
        <div className="flex items-center gap-3 xl:gap-4">
          <Select<'us' | 'uk'>
            value={phoneticPreference}
            onChange={setPhoneticPreference}
            options={ACCENT_OPTIONS}
          />
          <div className="h-4 xl:h-5 w-px bg-white/10" />
          <SkinPicker />
        </div>
      </div>
    </header>
  )
}
