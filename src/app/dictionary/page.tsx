'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { DictHeaderToolbar } from '@/components/dictionary/DictHeaderToolbar'
import { DictWordCard } from '@/components/dictionary/DictWordCard'
import { DictEmptyState } from '@/components/dictionary/DictEmptyState'
import { DictSearchingCard } from '@/components/dictionary/DictSearchingCard'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import {
  searchWordSuggestions,
  type DictSearchResult,
  type DictSuggestionItem,
} from '@/core/dictionarySearch'
import { getWordFromAiCache } from '@/db'
import { audioEngine } from '@/core/audioEngine'
import { queryAiWordCore } from '@/lib/aiWordCore'
import { getWordValidationError, isLikelyEnglishWord } from '@/lib/wordValidation'
import { AiDictionaryLookupError } from '@/lib/aiPrompts'
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
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiWordNotFound, setAiWordNotFound] = useState(false)

  // 查词输入与状态
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [currentResult, setCurrentResult] = useState<DictSearchResult | null>(null)
  const [notFoundQuery, setNotFoundQuery] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<DictSuggestionItem[]>([])
  const [searchValidationError, setSearchValidationError] = useState<string | null>(null)

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
      // 不主动消耗 AI；已有缓存时才恢复默认展示词
      const sequence = searchSequenceRef.current
      getWordFromAiCache('discover').then((word) => {
        if (word && searchSequenceRef.current === sequence) {
          setCurrentResult({
            word,
            sourceBookId: 'ai_cache',
            sourceBookName: '',
            isCurrentBook: false,
          })
          setSearchQuery('discover')
        }
      })
    }
  }, [currentBook?.id, currentBook?.name, currentLoadedWords, activeWordIndex, syncStarredWordIds])

  // 校验是否已配置有效的大模型 API Key（具备 AI 能力）
  const hasAiKey = Boolean(aiConfig?.apiKey?.trim())

  useEffect(() => () => aiAbortRef.current?.abort(), [])

  // 主动查词只走 AI 缓存，未命中时查询 AI 基础数据并写回缓存
  const handleSearchSubmit = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim()
      const sequence = ++searchSequenceRef.current
      aiAbortRef.current?.abort()
      aiAbortRef.current = null

      const validationError = getWordValidationError(trimmed)
      if (validationError) {
        setSearchValidationError(validationError)
        setAiWordNotFound(false)
        setIsSearching(false)
        setIsAiSearching(false)
        setSuggestions([])
        return
      }

      setSearchValidationError(null)
      setIsSearching(true)
      setIsAiSearching(false)
      setAiError(null)
      setAiWordNotFound(false)

      try {
        const cachedWord = await getWordFromAiCache(trimmed)
        if (searchSequenceRef.current !== sequence) return

        if (cachedWord) {
          setCurrentResult({
            word: cachedWord,
            sourceBookId: 'ai_cache',
            sourceBookName: '',
            isCurrentBook: false,
          })
          setNotFoundQuery(null)
          setIsSearching(false)
          // 单词查询页不自动发音，保留卡片右上角喇叭按钮与音标点击手动播放
          return
        }

        // 缓存未命中时才调用 AI
        if (hasAiKey) {
          setIsSearching(false)
          setIsAiSearching(true)
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
              // 单词查询页不自动发音，等待用户手动点击播放
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
            if (aiErr instanceof AiDictionaryLookupError) {
              setAiError(null)
              setAiWordNotFound(true)
              setCurrentResult(null)
              setNotFoundQuery(trimmed)
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
      hasAiKey,
      aiConfig,
    ]
  )

  // 搜索框输入变化并防抖获取联想
  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
    setSearchValidationError(null)

    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current)
    }

    if (!text.trim()) {
      setSuggestions([])
      return
    }

    if (!isLikelyEnglishWord(text)) {
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
    <div className="flex-1 min-h-full flex flex-col justify-between relative py-1">
      {/* 顶部工具栏：仅保留搜索输入框、发音口音切换与皮肤选择 */}
      <DictHeaderToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        isSearching={isSearching}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectSuggestion}
        validationError={searchValidationError}
      />

      {/* 中部舞台：单词卡片展示区（尺寸与内边距与单词学习完全一致） */}
      <div className="flex-1 flex items-center justify-center relative w-full px-4 py-2 my-auto shrink-0">
        <div className="relative w-[800px] h-[580px] xl:w-[940px] xl:h-[630px] 2xl:w-[1060px] 2xl:h-[680px] max-w-[94vw] rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl transition-all duration-300 shrink-0">
          {isAiSearching ? (
            <DictSearchingCard />
          ) : currentResult ? (
            <DictWordCard
              word={currentResult.word}
              phoneticPreference={phoneticPreference}
              onWordChange={(updatedWord) => {
                setCurrentResult((prev) => prev ? { ...prev, word: updatedWord } : null)
              }}
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
              wordNotFound={aiWordNotFound}
            />
          )}
        </div>
      </div>

      {/* 底部占位平衡区：尺寸与 PracticeFooter 严格一致，确保中部卡片垂直定位与单词学习完全对齐 */}
      <footer
        className="w-full p-4 xl:p-6 flex items-center justify-center pointer-events-none opacity-0 select-none invisible shrink-0"
        aria-hidden="true"
      >
        <div className="rounded-2xl xl:rounded-3xl px-5 xl:px-7 py-2.5 xl:py-3.5 flex items-center text-sm xl:text-base border border-transparent">
          <div className="h-7 xl:h-8 flex items-center">&nbsp;</div>
        </div>
      </footer>
    </div>
  )
}
