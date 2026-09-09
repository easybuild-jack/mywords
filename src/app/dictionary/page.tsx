'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { DictHeaderToolbar } from '@/components/dictionary/DictHeaderToolbar'
import { DictWordCard } from '@/components/dictionary/DictWordCard'
import { DictEmptyState } from '@/components/dictionary/DictEmptyState'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import {
  searchWordAcrossDictionaries,
  searchWordSuggestions,
  type DictSearchResult,
  type DictSuggestionItem,
} from '@/core/dictionarySearch'
import { audioEngine } from '@/core/audioEngine'
import type { WordItem } from '@/types'

export default function DictionaryPage() {
  const currentBook = useWorkspaceStore((s) => s.currentBook)
  const currentLoadedWords = useWorkspaceStore((s) => s.currentLoadedWords)
  const activeWordIndex = useWorkspaceStore((s) => s.activeWordIndex)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const syncStarredWordIds = useWorkspaceStore((s) => s.syncStarredWordIds)

  // 查词输入与状态
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [currentResult, setCurrentResult] = useState<DictSearchResult | null>(null)
  const [notFoundQuery, setNotFoundQuery] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<DictSuggestionItem[]>([])

  const suggestionDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // 初始化：同步生词本，并默认展示当前学习中的单词条目（保证进入词典页面即有丰富内容）
  useEffect(() => {
    syncStarredWordIds()

    const activeWord = currentLoadedWords[activeWordIndex]
    if (activeWord) {
      setCurrentResult({
        word: activeWord,
        sourceBookId: currentBook?.id || 'book_cet4',
        sourceBookName: currentBook?.name || 'CET-4 核心词库',
        isCurrentBook: true,
      })
      setSearchQuery(activeWord.name)
    } else {
      // 默认 fallback 查 CET4 第一个词
      searchWordAcrossDictionaries('discover', currentBook?.id, currentBook?.name).then((res) => {
        if (res) {
          setCurrentResult(res)
          setSearchQuery('discover')
        }
      })
    }
  }, [currentBook?.id, currentBook?.name, currentLoadedWords, activeWordIndex, syncStarredWordIds])

  // 执行检索
  const handleSearchSubmit = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim()
      if (!trimmed) return

      setIsSearching(true)
      try {
        const result = await searchWordAcrossDictionaries(
          trimmed,
          currentBook?.id || 'book_cet4',
          currentBook?.name || 'CET-4 核心词库'
        )

        if (result) {
          setCurrentResult(result)
          setNotFoundQuery(null)
          // 朗读找到的单词发音
          audioEngine.playPronunciation(result.word.name, phoneticPreference)
        } else {
          setCurrentResult(null)
          setNotFoundQuery(trimmed)
        }
      } catch (err) {
        console.error('Search error:', err)
        setCurrentResult(null)
        setNotFoundQuery(trimmed)
      } finally {
        setIsSearching(false)
      }
    },
    [currentBook?.id, currentBook?.name, phoneticPreference]
  )

  // 搜索框输入变化并防抖获取联想
  const handleSearchChange = (text: string) => {
    setSearchQuery(text)

    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current)
    }

    if (!text.trim()) {
      setSuggestions([])
      return
    }

    suggestionDebounceRef.current = setTimeout(async () => {
      try {
        const list = await searchWordSuggestions(
          text,
          currentBook?.id || 'book_cet4',
          currentBook?.name || 'CET-4 核心词库'
        )
        setSuggestions(list)
      } catch (err) {
        console.error('Failed to get suggestions:', err)
      }
    }, 150)
  }

  // 点击联想建议项
  const handleSelectSuggestion = (item: DictSuggestionItem) => {
    setSearchQuery(item.name)
    handleSearchSubmit(item.name)
  }

  // 全局快捷键：Ctrl+J 发音
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        if (currentResult?.word) {
          audioEngine.playPronunciation(currentResult.word.name, phoneticPreference)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentResult, phoneticPreference])

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between h-full relative">
      {/* 顶部工具栏：仅保留搜索输入框、发音口音切换与皮肤选择 */}
      <DictHeaderToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        isSearching={isSearching}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectSuggestion}
      />

      {/* 中部舞台：单词卡片展示区（垂直完美居中，彻底去除打字输入槽，底部无工具栏） */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative w-full px-4 py-3">
        <div className="relative w-[800px] h-[580px] xl:w-[940px] xl:h-[630px] 2xl:w-[1060px] 2xl:h-[680px] max-w-[94vw] rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl transition-all duration-300">
          {currentResult ? (
            <DictWordCard
              word={currentResult.word}
              phoneticPreference={phoneticPreference}
            />
          ) : (
            <DictEmptyState
              query={notFoundQuery || searchQuery || '所搜单词'}
              currentBookName={currentBook?.name || '当前词库'}
              onQuickSearch={(word) => {
                setSearchQuery(word)
                handleSearchSubmit(word)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
