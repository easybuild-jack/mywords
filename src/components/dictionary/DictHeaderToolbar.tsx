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
      className={`sticky top-0 z-50 w-full bg-background transition-[border-color,box-shadow,padding] duration-300 flex items-center justify-center px-4 xl:px-6 pointer-events-auto shrink-0 ${
        isScrolled
          ? 'py-2.5 xl:py-3 border-b border-border/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'
          : 'py-3.5 xl:py-5 border-b border-transparent shadow-none'
      }`}
    >
      <div className="glass-card rounded-2xl xl:rounded-3xl px-4 xl:px-6 py-2 xl:py-2.5 flex items-center gap-3.5 xl:gap-5 text-sm xl:text-base w-[800px] xl:w-[940px] 2xl:w-[1060px] max-w-[94vw] shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10 transition-all duration-300 justify-between">
        {/* 搜索输入栏与历史记录切换区 */}
        <div ref={containerRef} className="relative flex-1 flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 size-4 xl:size-4.5 text-muted-foreground pointer-events-none" />
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

          {/* 历史记录按钮 */}
          <button
            type="button"
            onClick={() => {
              setShowSuggestions(false)
              setShowHistory((prev) => !prev)
            }}
            className={`h-10 xl:h-11 px-3 rounded-xl border flex items-center gap-1.5 text-xs xl:text-sm font-medium transition-all cursor-pointer shrink-0 ${
              showHistory
                ? 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_12px_rgba(var(--primary-rgb),0.25)]'
                : 'bg-white/[0.06] hover:bg-white/[0.09] text-muted-foreground hover:text-white border-white/10'
            }`}
            title="查询历史记录 (最多保留20条)"
          >
            <History className="size-4" />
            <span className="hidden sm:inline">历史</span>
            {history.length > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors ${
                  showHistory
                    ? 'bg-primary text-black font-bold'
                    : 'bg-white/10 text-muted-foreground'
                }`}
              >
                {history.length}
              </span>
            )}
          </button>

          {validationError && (
            <p className="absolute left-2 top-full mt-1 text-[11px] text-destructive z-10">
              {validationError}
            </p>
          )}

          {/* 实时搜索联想下拉卡片 */}
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
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#12141A] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-black/40 overflow-hidden z-[100] animate-in fade-in-50 zoom-in-95 duration-150">
              {/* 顶部标题与清空按钮 */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <History className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold text-white/90">查询历史记录</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ({history.length}/20)
                  </span>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory?.()
                    }}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-rose-400 hover:bg-white/5 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    title="清空所有查询记录"
                  >
                    <Trash2 className="size-3" />
                    <span>清空历史</span>
                  </button>
                )}
              </div>

              {/* 列表内容 */}
              {history.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <History className="size-6 text-muted-foreground/30" />
                  <span>暂无查询记录，查询单词后将自动在此保留最近 20 条</span>
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                  {history.map((item, idx) => (
                    <div
                      key={`${item.word}-${idx}`}
                      onClick={() => {
                        setShowHistory(false)
                        onSelectHistory?.(item.word)
                      }}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.08] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-baseline gap-2.5 min-w-0 flex-1 pr-2">
                        <span className="text-[11px] font-mono text-muted-foreground/50 w-4 shrink-0 text-right">
                          {idx + 1}
                        </span>
                        <span className="text-white font-mono font-bold text-sm xl:text-base group-hover:text-primary transition-colors shrink-0">
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
                        className="p-1 rounded-md text-muted-foreground/60 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                        title="删除此记录"
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
