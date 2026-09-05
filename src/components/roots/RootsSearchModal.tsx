'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X, Sprout, ArrowRight } from 'lucide-react'
import { BUILTIN_ROOTS, ROOT_DATA_MAP, ROOT_TAB_LABELS } from '@/resources/roots'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface RootsSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RootsSearchModal({ isOpen, onClose }: RootsSearchModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { rootTab, setRootIndex, activeRootIndex } = useWorkspaceStore()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const currentDataset = useMemo(() => ROOT_DATA_MAP[rootTab] || BUILTIN_ROOTS, [rootTab])
  const tabLabel = ROOT_TAB_LABELS[rootTab] || '词根'

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // 模糊匹配形态、释义、以及下辖单词拼写/中文
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return currentDataset.map((item, index) => ({ root: item, index, matchedWord: null }))
    }

    const results: { root: (typeof currentDataset)[0]; index: number; matchedWord: string | null }[] = []

    currentDataset.forEach((item, index) => {
      const matchForm = item.form.toLowerCase().includes(q)
      const matchMeaning = item.meaning.toLowerCase().includes(q)
      const matchOrigin = item.origin.toLowerCase().includes(q)
      const matchedWordItem = item.words.find(
        (w) => w.name.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
      )

      if (matchForm || matchMeaning || matchOrigin || matchedWordItem) {
        results.push({
          root: item,
          index,
          matchedWord: matchedWordItem ? `${matchedWordItem.name} (${matchedWordItem.meaning})` : null,
        })
      }
    })

    return results
  }, [query, currentDataset])

  // 键盘快捷上下选择与回车确认
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter') {
        if (searchResults.length > 0 && searchResults[selectedIndex]) {
          e.preventDefault()
          const target = searchResults[selectedIndex]
          setRootIndex(target.index)
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, searchResults, selectedIndex, setRootIndex, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[#12141A]/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部搜索输入栏 */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
          <Search className="size-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder={`搜索${tabLabel}、释义或派生词...`}
            className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[11px] font-mono text-gray-400 px-2 py-0.5 rounded border border-white/10 bg-white/5">
            ESC 关闭
          </kbd>
        </div>

        {/* 搜索结果列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <Sprout className="size-8 mx-auto mb-2 text-gray-600 opacity-60" />
              未找到匹配的{tabLabel}或派生单词
            </div>
          ) : (
            searchResults.map(({ root, index, matchedWord }, itemIdx) => {
              const isSelected = itemIdx === selectedIndex
              const isCurrent = index === activeRootIndex
              return (
                <div
                  key={root.id}
                  onClick={() => {
                    setRootIndex(index)
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(itemIdx)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'bg-primary/15 border-primary/40 text-white'
                      : isCurrent
                      ? 'bg-white/[0.06] border-white/20 text-white'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.04] text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="size-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 border bg-white/5 text-primary border-white/10">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-bold text-white tracking-wide">
                          {root.form}
                        </span>
                        <span className="text-xs font-medium text-gray-400">·</span>
                        <span className="text-sm font-semibold text-primary">{root.meaning}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                          {root.categoryLabel}
                        </span>
                      </div>

                      {matchedWord && (
                        <div className="text-xs text-accent mt-1 flex items-center gap-1 truncate">
                          <span>包含匹配词：</span>
                          <span className="font-medium">{matchedWord}</span>
                        </div>
                      )}

                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        {root.words.slice(0, 4).map((w, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-300 font-mono text-[11px]"
                          >
                            {w.name}
                          </span>
                        ))}
                        {root.words.length > 4 && (
                          <span className="text-[10px] text-gray-500">+{root.words.length - 4} 词</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    className={`size-4 shrink-0 transition-transform ${
                      isSelected ? 'text-primary translate-x-1' : 'text-gray-600'
                    }`}
                  />
                </div>
              )
            })
          )}
        </div>

        {/* 底部快捷按键提示 */}
        <div className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-white/5 border border-white/10 mr-1">
                ↑
              </kbd>
              <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-white/5 border border-white/10 mr-1">
                ↓
              </kbd>
              切换选中
            </span>
            <span>
              <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-white/5 border border-white/10 mr-1">
                Enter
              </kbd>
              直接前往
            </span>
          </div>
          <span>共 {currentDataset.length} 个经典{tabLabel}</span>
        </div>
      </div>
    </div>
  )
}
