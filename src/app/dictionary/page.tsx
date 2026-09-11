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
import { dictionaryLoader } from '@/core/dictionaryLoader'
import { fetchAiDictionaryWord } from '@/lib/aiClient'
import { saveWordToAiCache } from '@/db'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'
import type { WordItem } from '@/types'

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

  // 校验是否已配置有效的大模型 API Key（具备 AI 能力）
  const hasAiKey = Boolean(aiConfig?.apiKey?.trim())

  // 执行检索（自顶向下：AI 缓存表 -> 本地各词库 -> 自动触发 AI 查询并缓存）
  const handleSearchSubmit = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim()
      if (!trimmed) return

      setIsSearching(true)
      setAiError(null)

      try {
        // 步骤 1：本地检索（首先查 AI 单词缓存表，其次查当前词库、其他词库与词形还原）
        const localResult = await searchWordAcrossDictionaries(
          trimmed,
          currentBook?.id || 'book_cet4',
          currentBook?.name || 'CET-4 核心词库'
        )

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
          try {
            const rawEntry = await fetchAiDictionaryWord(aiConfig, trimmed)
            if (rawEntry) {
              const wordItem = await dictionaryLoader.convertRawEntryToWordItem(rawEntry)
              // 自动存入本地 AI 单词缓存表，以备下次直接命中，降低 AI 查询次数
              await saveWordToAiCache(wordItem)

              // 立即返回页面渲染，其他（AI 来源）不要展示来源名称
              setCurrentResult({
                word: wordItem,
                sourceBookId: 'ai_live',
                sourceBookName: '', // 其他不要展示来源！
                isCurrentBook: false,
              })
              setNotFoundQuery(null)
              audioEngine.playPronunciation(wordItem.name, phoneticPreference)
              return
            } else {
              setCurrentResult(null)
              setNotFoundQuery(trimmed)
            }
          } catch (aiErr: unknown) {
            console.warn('AI dictionary query failed, attempting offline dictionary fallback:', aiErr)
            // 自动优雅降级到本地 50,000+ 离线大词库，确保用户始终能看到清晰的单词卡片，绝不卡死在报错上
            try {
              const enriched = await dictionaryLoader.enrichWord(trimmed)
              if (
                enriched &&
                enriched.posList?.length > 0 &&
                enriched.posList[0].means?.[0] &&
                enriched.posList[0].means[0] !== '核心词义'
              ) {
                setCurrentResult({
                  word: enriched,
                  sourceBookId: 'dict_extended',
                  sourceBookName: '', // 其他不要展示来源
                  isCurrentBook: false,
                })
                setNotFoundQuery(null)
                audioEngine.playPronunciation(enriched.name, phoneticPreference)
                return
              }
            } catch (fallbackErr) {
              console.warn('Offline fallback failed:', fallbackErr)
            }

            const msg = aiErr instanceof Error ? aiErr.message : 'AI 字典生成失败，请检查网络或配置'
            setAiError(msg)
            setCurrentResult(null)
            setNotFoundQuery(trimmed)
          } finally {
            setIsAiSearching(false)
          }
        } else {
          // 未配置 AI API Key：静默不处理，不使用 AI 字典功能，直接显示未收录
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
    [currentBook?.id, currentBook?.name, phoneticPreference, hasAiKey, aiConfig]
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
              isAiSearching={isAiSearching}
              aiError={aiError}
            />
          )}
        </div>
      </div>
    </div>
  )
}
