'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { DictHeaderToolbar } from '@/components/dictionary/DictHeaderToolbar'
import { DictWordCard } from '@/components/dictionary/DictWordCard'
import { DictEmptyState } from '@/components/dictionary/DictEmptyState'
import { DictSearchingCard } from '@/components/dictionary/DictSearchingCard'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import {
  searchWordAcrossDictionaries,
  searchWordSuggestions,
  type DictSearchResult,
  type DictSuggestionItem,
} from '@/core/dictionarySearch'
import { audioEngine } from '@/core/audioEngine'
import { queryAiWordCore } from '@/hooks/useEnsureAiWordSections'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'

export default function DictionaryPage() {
  const currentBook = useWorkspaceStore((s) => s.currentBook)
  const currentLoadedWords = useWorkspaceStore((s) => s.currentLoadedWords)
  const activeWordIndex = useWorkspaceStore((s) => s.activeWordIndex)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const syncStarredWordIds = useWorkspaceStore((s) => s.syncStarredWordIds)

  // AI 字典配置与状态
  const aiConfig = useAiAssistantStore((s) => s.aiConfig)
  const [isAiSearching, setIsAiSearching] = useState(false)
  const [searchingWord, setSearchingWord] = useState<string>('')
  const [aiError, setAiError] = useState<string | null>(null)

  // 查词输入与状态
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [currentResult, setCurrentResult] = useState<DictSearchResult | null>(null)
  const [notFoundQuery, setNotFoundQuery] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<DictSuggestionItem[]>([])

  const suggestionDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const aiAbortRef = useRef<AbortController | null>(null)
  const searchSequenceRef = useRef(0)

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
      const sequence = searchSequenceRef.current
      searchWordAcrossDictionaries('discover', currentBook?.id, currentBook?.name).then((res) => {
        if (res && searchSequenceRef.current === sequence) {
          setCurrentResult(res)
          setSearchQuery('discover')
        }
      })
    }
  }, [currentBook?.id, currentBook?.name, currentLoadedWords, activeWordIndex, syncStarredWordIds])

  // 校验是否已配置有效的大模型 API Key（具备 AI 能力）
  const hasAiKey = Boolean(aiConfig?.apiKey?.trim())

  useEffect(() => () => aiAbortRef.current?.abort(), [])

  // 执行检索（自顶向下：AI 缓存表 -> 本地各词库 -> 自动触发 AI 查询并缓存）
  const handleSearchSubmit = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim()
      if (!trimmed) return

      const sequence = ++searchSequenceRef.current
      aiAbortRef.current?.abort()
      aiAbortRef.current = null
      setIsSearching(true)
      setIsAiSearching(false)
      setAiError(null)

      try {
        // 步骤 1：本地检索（首先查 AI 单词缓存表，其次查当前词库、其他词库与词形还原）
        const localResult = await searchWordAcrossDictionaries(
          trimmed,
          currentBook?.id || 'book_cet4',
          currentBook?.name || 'CET-4 核心词库'
        )
        if (searchSequenceRef.current !== sequence) return

        if (localResult) {
          setCurrentResult(localResult)
          setNotFoundQuery(null)
          setIsSearching(false)
          audioEngine.playPronunciation(localResult.word.name, phoneticPreference)
          return
        }

        // 步骤 2：本地完全查询不到时，检测是否具备 AI 能力
        if (hasAiKey) {
          setIsSearching(false)
          setIsAiSearching(true)
          setSearchingWord(trimmed)
          setCurrentResult(null) // 立即清空旧卡片，进入全卡查询中骨架动画
          setNotFoundQuery(null)
          setAiError(null)

          const controller = new AbortController()
          aiAbortRef.current = controller
          try {
            const wordItem = await queryAiWordCore(aiConfig, trimmed)
            if (searchSequenceRef.current !== sequence || controller.signal.aborted) return

            if (wordItem) {
              // 基础数据一旦返回就立即渲染；富内容在后台分块补全
              setCurrentResult({
                word: wordItem,
                sourceBookId: 'ai_live',
                sourceBookName: '',
                isCurrentBook: false,
              })
              setIsAiSearching(false)
              setNotFoundQuery(null)
              setAiError(null)
              audioEngine.playPronunciation(wordItem.name, phoneticPreference)
              return
            } else {
              setAiError('模型未返回有效单词结构数据，没有等到结果，请稍后再试。')
              setCurrentResult(null)
              setNotFoundQuery(trimmed)
            }
          } catch (aiErr: unknown) {
            console.warn('AI dictionary query failed:', aiErr)
            if (
              controller.signal.aborted ||
              searchSequenceRef.current !== sequence
            ) {
              return
            }
            const isTimeout =
              aiErr instanceof Error &&
              (aiErr.name === 'AbortError' || aiErr.message.includes('超时'))
            const msg = isTimeout
              ? 'AI 词典响应超时（未在预期时间内返回数据），没有等到结果，请稍后再试。'
              : aiErr instanceof Error
              ? aiErr.message
              : 'AI 字典生成失败，没有等到结果，请稍后再试。'

            setAiError(msg)
            setCurrentResult(null)
            setNotFoundQuery(trimmed)
          } finally {
            if (searchSequenceRef.current === sequence) {
              setIsAiSearching(false)
            }
          }
        } else {
          // 未配置 AI API Key：静默不处理，不使用 AI 字典功能，直接显示未收录
          setCurrentResult(null)
          setNotFoundQuery(trimmed)
        }
      } catch (err) {
        if (searchSequenceRef.current !== sequence) return
        console.error('Search error:', err)
        setCurrentResult(null)
        setNotFoundQuery(trimmed)
      } finally {
        if (searchSequenceRef.current === sequence) {
          setIsSearching(false)
        }
      }
    },
    [
      currentBook,
      phoneticPreference,
      hasAiKey,
      aiConfig,
    ]
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
          {isAiSearching ? (
            <DictSearchingCard word={searchingWord || searchQuery || notFoundQuery || '目标词'} />
          ) : currentResult ? (
            <DictWordCard
              word={currentResult.word}
              phoneticPreference={phoneticPreference}
              sourceBookName={currentResult.sourceBookName}
            />
          ) : (
            <DictEmptyState
              query={notFoundQuery || searchQuery || '所搜单词'}
              currentBookName={currentBook?.name || '当前词库'}
              onQuickSearch={(word) => {
                setSearchQuery(word)
                handleSearchSubmit(word)
              }}
              onAiLookup={hasAiKey ? (w) => handleSearchSubmit(w) : undefined}
              aiError={aiError}
            />
          )}
        </div>
      </div>
    </div>
  )
}
