'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { TranslateHeader } from '@/components/translate/TranslateHeader'
import { TranslateFilters } from '@/components/translate/TranslateFilters'
import { TranslateGroupList } from '@/components/translate/TranslateGroupList'
import { TranslateCard } from '@/components/translate/TranslateCard'
import { SentenceGrammarModal } from '@/components/translate/SentenceGrammarModal'
import { TranslateImportModal } from '@/components/translate/TranslateImportModal'
import { useTranslateStore } from '@/store/useTranslateStore'
import { audioEngine } from '@/core/audioEngine'
import { BookOpen, ArrowLeft, ArrowRight, Plus } from 'lucide-react'

export default function TranslatePage() {
  // 当前激活的 Tab：'list' (句库列表页，默认) | 'practice' (翻译练习页)
  const [activeTab, setActiveTab] = useState<'list' | 'practice'>('list')

  // 场景与搜索检索状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScenario, setSelectedScenario] = useState<string>('all')

  const {
    books,
    currentBookId,
    currentSentenceIndex,
    selectBook,
    deleteCustomBook,
    nextSentence,
    prevSentence,
    setImportModalOpen,
    isGrammarModalOpen,
    setGrammarModalOpen,
    repeatCurrentSentence,
    isSpeaking,
    audioRate,
    playSentenceAudio,
    toggleAudioRate,
    completedSentenceIds,
  } = useTranslateStore()

  // 当前选中的分组与句子
  const currentBook = useMemo(() => {
    return books.find((b) => b.id === currentBookId) || books[0]
  }, [books, currentBookId])

  const sentences = currentBook?.sentences || []
  const currentSentence = sentences[currentSentenceIndex]
  const totalSentences = sentences.length

  // 全库句子总计
  const totalSentencesAllBooks = useMemo(() => {
    return books.reduce((sum, b) => sum + (b.sentences?.length || 0), 0)
  }, [books])

  // 所有可用场景列表 (固定与听力场景分类一致 + 自动提取已有场景)
  const availableScenarios = useMemo(() => {
    const defaultOrder = [
      '日常生活',
      '职场商务',
      '旅游出行',
      '餐饮美食',
      '购物消费',
    ]
    const set = new Set<string>(defaultOrder)
    books.forEach((b) => {
      if (b.scenario && b.scenario !== '影视原声' && b.scenario !== '播客访谈') {
        const normalized = b.scenario === '机场出行' ? '旅游出行' : b.scenario
        set.add(normalized)
      }
    })
    return Array.from(set)
  }, [books])

  // 各场景下的分组数量
  const scenarioCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    books.forEach((b) => {
      let sc = b.scenario || '日常生活'
      if (sc === '机场出行') sc = '旅游出行'
      if (sc === '影视原声' || sc === '播客访谈') return
      counts[sc] = (counts[sc] || 0) + 1
    })
    return counts
  }, [books])

  // 根据当前选中的场景与搜索词筛选后的分组列表
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      let sc = book.scenario || '日常生活'
      if (sc === '机场出行') sc = '旅游出行'
      if (sc === '影视原声' || sc === '播客访谈') return false

      if (selectedScenario !== 'all' && sc !== selectedScenario) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = book.name.toLowerCase().includes(q)
        const matchDesc = book.description?.toLowerCase().includes(q)
        const matchScenario = sc.toLowerCase().includes(q)
        const matchSentence = book.sentences.some(
          (s) =>
            s.sentenceEn.toLowerCase().includes(q) ||
            s.sentenceZh.toLowerCase().includes(q)
        )
        if (!matchName && !matchDesc && !matchScenario && !matchSentence) {
          return false
        }
      }
      return true
    })
  }, [books, selectedScenario, searchQuery])

  // 选择某个分组后，自动切换到翻译练习页
  const handleSelectGroup = useCallback(
    (bookId: string) => {
      selectBook(bookId)
      setActiveTab('practice')
    },
    [selectBook]
  )

  // 删除自定义分组
  const handleDeleteCustomGroup = useCallback(
    (bookId: string, name: string) => {
      if (window.confirm(`确定删除自定义分组「${name}」吗？`)) {
        deleteCustomBook(bookId)
      }
    },
    [deleteCustomBook]
  )

  // 支持键盘 ← / → 左右方向键翻页切换上一句 / 下一句 (仅在练习页激活)
  useEffect(() => {
    if (activeTab !== 'practice') return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        Boolean(document.querySelector('[role="dialog"]'))
      ) {
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevSentence()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextSentence()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, prevSentence, nextSentence])

  return (
    <div className="translate-page flex-1 min-h-full w-full flex flex-col bg-background text-foreground animate-fadeIn pb-12 selection:bg-primary/20">
      {/* 主工作舞台容器：与听力电台一致的规范宽度与间距 */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-10 pt-6 space-y-5 flex flex-col">
        {/* 顶部标题、搜索与导入主入口 */}
        <TranslateHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalGroupsCount={books.length}
          totalSentencesCount={totalSentencesAllBooks}
          onOpenImport={() => setImportModalOpen(true)}
        />

        {/* Tab 导航：句库列表（默认）与翻译练习 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border">
          <div className="flex items-center gap-6 select-none">
            <button
              type="button"
              onClick={() => {
                audioEngine.cancelPendingPlayback()
                setActiveTab('list')
              }}
              className={`-mb-px pb-2.5 text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'text-foreground font-medium border-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              句库列表
              <span className="ml-1.5 text-xs font-mono text-muted-foreground">{filteredBooks.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={`-mb-px pb-2.5 text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === 'practice'
                  ? 'text-foreground font-medium border-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              翻译练习
              {currentBook && (
                <span className="ml-1.5 text-xs font-mono text-muted-foreground">
                  {currentSentenceIndex + 1}/{totalSentences}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'practice' ? (
            <div className="mb-1.5 flex items-center gap-3 ml-auto">
              {currentBook && (
                <span className="text-xs text-muted-foreground select-none animate-fadeIn">
                  {currentBook.scenario || '日常生活'} ·{' '}
                  <span className="text-foreground">{currentBook.name}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  audioEngine.cancelPendingPlayback()
                  setActiveTab('list')
                }}
                className="h-7 px-2 rounded-md inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="size-3.5" />
                返回列表
              </button>
            </div>
          ) : (
            currentBook && (
              <button
                type="button"
                onClick={() => setActiveTab('practice')}
                className="mb-1.5 hidden sm:inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="前往翻译练习"
              >
                当前：
                <span className="text-foreground truncate max-w-[200px] md:max-w-[280px]">
                  {currentBook.name}（第 {currentSentenceIndex + 1}/{totalSentences} 句）
                </span>
                <span className="text-primary">→</span>
              </button>
            )
          )}
        </div>

        {/* Tab 1 页面内容：句库列表页 (默认展示) */}
        <div className={activeTab === 'list' ? 'space-y-6 animate-fadeIn' : 'hidden'}>
          {/* 场景分类页签筛选 (与听力模块分类完全一致) */}
          <TranslateFilters
            selectedScenario={selectedScenario}
            onSelectScenario={setSelectedScenario}
            availableScenarios={availableScenarios}
            scenarioCounts={scenarioCounts}
            totalCount={books.length}
          />

          {/* 场景分组卡片网格列表 */}
          <TranslateGroupList
            books={filteredBooks}
            currentBookId={currentBookId}
            completedSentenceIds={completedSentenceIds}
            onSelectGroup={handleSelectGroup}
            onDeleteCustomGroup={handleDeleteCustomGroup}
          />
        </div>

        {/* Tab 2 页面内容：翻译练习舞台 (独立沉浸练习) */}
        <div
          className={
            activeTab === 'practice'
              ? 'flex-1 flex flex-col justify-center items-center py-2 animate-fadeIn'
              : 'hidden'
          }
        >
          {/* 主卡片与左右翻页操作区 */}
          <div className="relative w-full flex items-center justify-center gap-4 xl:gap-6 shrink-0 my-auto">
            {/* 左侧上一句按钮 */}
            <button
              type="button"
              onClick={prevSentence}
              disabled={currentSentenceIndex <= 0}
              className="shrink-0 size-10 xl:size-11 rounded-full flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title="上一句 (←)"
            >
              <ArrowLeft className="size-5 xl:size-6" />
            </button>

            {/* 居中固定尺寸卡片 */}
            <div className="relative flex flex-col items-center shrink-0">
              <div className="relative w-[800px] h-[540px] xl:w-[940px] xl:h-[590px] 2xl:w-[1060px] 2xl:h-[640px] max-w-[94vw] overflow-hidden shrink-0 flex flex-col">
                {currentSentence ? (
                  <TranslateCard
                    key={`${currentBook.id}_${currentSentence.id}`}
                    sentence={currentSentence}
                    sentenceIndex={currentSentenceIndex}
                    totalSentences={totalSentences}
                    onNext={nextSentence}
                    onPrev={prevSentence}
                    isActive={activeTab === 'practice'}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center select-none space-y-4">
                    <BookOpen className="size-8 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">该分组暂无练习语句</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                      您可以点击下方按钮，导入自定义的英文句子与中文译文。
                    </p>
                    <button
                      type="button"
                      onClick={() => setImportModalOpen(true)}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>导入练习语句</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧下一句按钮 */}
            <button
              type="button"
              onClick={nextSentence}
              disabled={currentSentenceIndex >= totalSentences - 1}
              className="shrink-0 size-10 xl:size-11 rounded-full flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title="下一句 (→)"
            >
              <ArrowRight className="size-5 xl:size-6" />
            </button>
          </div>
        </div>
      </div>

      {/* 句法分析弹窗 */}
      {currentSentence && (
        <SentenceGrammarModal
          isOpen={isGrammarModalOpen}
          onClose={() => setGrammarModalOpen(false)}
          sentence={currentSentence}
          isSpeaking={isSpeaking}
          audioRate={audioRate}
          onPlayAudio={playSentenceAudio}
          onToggleAudioRate={toggleAudioRate}
          onNext={() => {
            setGrammarModalOpen(false)
            nextSentence()
          }}
          onRepeat={repeatCurrentSentence}
        />
      )}

      {/* 自定义上传练习语句弹窗 */}
      <TranslateImportModal />
    </div>
  )
}
