'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Loader2, History, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { SkinPicker } from '@/components/layout/SkinPicker'
import { Select, type SelectOption } from '@/components/ui/Select'
import type { DictSuggestionItem } from '@/core/dictionarySearch'
import type { DictHistoryItem } from '@/lib/dictHistory'

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
  history?: DictHistoryItem[]
  onSelectHistory?: (word: string) => void
  onRemoveHistoryItem?: (word: string) => void
  onClearHistory?: () => void
}

export function DictHeaderToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  isSearching,
  suggestions = [],
  onSelectSuggestion,
  validationError,
  history = [],
  onSelectHistory,
  onRemoveHistoryItem,
  onClearHistory,
}: DictHeaderToolbarProps) {
  const { phoneticPreference, setPhoneticPreference } = useWorkspaceStore()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭联想与历史下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [isScrolled, setIsScrolled] = useState(false)

  // 监听主滚动容器，只有在向下滚动时才显现吸顶底部分割线与阴影（参考词库管理页 books/page.tsx）
  useEffect(() => {
    const mainEl = document.querySelector('main')
    const handleScroll = () => {
      const top = mainEl ? mainEl.scrollTop : window.scrollY
      setIsScrolled(top > 10)
    }

    handleScroll()
    mainEl?.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      mainEl?.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false)
      setShowHistory(false)
      onSearchSubmit(searchQuery)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setShowHistory(false)
    }
  }

  const handleClear = () => {
    onSearchChange('')
    setShowSuggestions(false)
    if (history.length > 0) {
      setShowHistory(true)
    }
    inputRef.current?.focus()
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-background flex items-center justify-center px-6 pointer-events-auto shrink-0 border-b border-border transition-shadow ${
        isScrolled ? 'shadow-[0_4px_16px_-8px_rgba(0,0,0,0.25)]' : ''
      }`}
    >
      <div className="h-14 xl:h-15 flex items-center gap-4 xl:gap-6 text-sm w-[800px] xl:w-[940px] 2xl:w-[1060px] max-w-[94vw] justify-between">
        {/* 搜索输入栏与历史记录切换区 */}
        <div ref={containerRef} className="relative flex-1 max-w-xl flex items-center gap-1.5">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value
                onSearchChange(val)
                if (val.trim()) {
                  setShowHistory(false)
                  setShowSuggestions(true)
                } else {
                  setShowSuggestions(false)
                  if (history.length > 0) {
                    setShowHistory(true)
                  }
                }
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  if (suggestions.length > 0) setShowSuggestions(true)
                } else if (history.length > 0) {
                  setShowHistory(true)
                }
              }}
              onKeyDown={handleKeyDown}
              aria-invalid={Boolean(validationError)}
              title={validationError || undefined}
              placeholder="查一个单词，如 discover"
              className={`w-full h-9 pl-9 pr-9 rounded-lg bg-white/[0.05] border text-white placeholder:text-muted-foreground/70 text-sm transition-colors focus:outline-none ${
                validationError
                  ? 'border-destructive/60'
                  : 'border-transparent focus:border-white/15 focus:bg-transparent'
              }`}
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 size-4 text-primary animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="清空"
                aria-label="清空"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* 历史记录按钮 */}
          <button
            type="button"
            onClick={() => {
              setShowSuggestions(false)
              setShowHistory((prev) => !prev)
            }}
            className={`h-9 px-2.5 rounded-md flex items-center gap-1.5 text-sm transition-colors cursor-pointer shrink-0 ${
              showHistory
                ? 'text-foreground bg-muted'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            title="查询历史记录 (最多保留20条)"
            aria-expanded={showHistory}
          >
            <History className="size-4" />
            <span className="hidden sm:inline">历史</span>
            {history.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">{history.length}</span>
            )}
          </button>

          {validationError && (
            <p className="absolute left-2 top-full mt-1 text-xs text-destructive z-10">
              {validationError}
            </p>
          )}

          {/* 实时搜索联想下拉卡片 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[#12141A] border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.4)] overflow-hidden z-[100] py-1 animate-in fade-in-50 duration-150">
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.name}-${idx}`}
                  type="button"
                  onClick={() => {
                    setShowSuggestions(false)
                    onSelectSuggestion?.(item)
                  }}
                  className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-white/[0.05] transition-colors cursor-pointer group"
                >
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="text-white font-serif text-base xl:text-lg group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[280px] xl:max-w-[340px]">
                      {item.meaning}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 搜索历史记录下拉卡片 */}
          {showHistory && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[#12141A] border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.4)] overflow-hidden z-[100] animate-in fade-in-50 duration-150">
              {/* 顶部标题与清空按钮 */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/10">
                <span className="text-xs text-muted-foreground">
                  最近查询 <span className="tabular-nums">{history.length}/20</span>
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory?.()
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title="清空所有查询记录"
                  >
                    <Trash2 className="size-3" />
                    <span>清空</span>
                  </button>
                )}
              </div>

              {/* 列表内容 */}
              {history.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  暂无查询记录，查询单词后将自动在此保留最近 20 条
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto py-1 custom-scrollbar">
                  {history.map((item, idx) => (
                    <div
                      key={`${item.word}-${idx}`}
                      onClick={() => {
                        setShowHistory(false)
                        onSelectHistory?.(item.word)
                      }}
                      className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-white/[0.05] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-baseline gap-3 min-w-0 flex-1 pr-2">
                        <span className="text-white font-serif text-base xl:text-lg group-hover:text-primary transition-colors shrink-0">
                          {item.word}
                        </span>
                        {item.meaning && (
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {item.meaning}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveHistoryItem?.(item.word)
                        }}
                        className="p-1 rounded-md text-muted-foreground/60 hover:text-destructive transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="删除此记录"
                        aria-label="删除此记录"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：发音口音切换与皮肤定制 */}
        <div className="flex items-center gap-1.5 xl:gap-2.5">
          <Select<'us' | 'uk'>
            value={phoneticPreference}
            onChange={setPhoneticPreference}
            options={ACCENT_OPTIONS}
          />
          <SkinPicker />
        </div>
      </div>
    </header>
  )
}
