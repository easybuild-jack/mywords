'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { TranslateHeader } from '@/components/translate/TranslateHeader'
import { TranslateFilters } from '@/components/translate/TranslateFilters'
import { TranslateGroupList } from '@/components/translate/TranslateGroupList'
import { TranslateCard } from '@/components/translate/TranslateCard'
import { SentenceGrammarModal } from '@/components/translate/SentenceGrammarModal'
import { TranslateImportModal } from '@/components/translate/TranslateImportModal'
import { useTranslateStore } from '@/store/useTranslateStore'
import { SCENARIO_ICONS } from '@/resources/radioData'
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Layers,
  Languages,
  Plus,
} from 'lucide-react'

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
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-10 pt-6 space-y-6 flex flex-col">
        {/* 顶部标题、搜索与导入主入口 */}
        <TranslateHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalGroupsCount={books.length}
          totalSentencesCount={totalSentencesAllBooks}
          onOpenImport={() => setImportModalOpen(true)}
        />

        {/* Tab 导航切换栏 (默认第一个是句库列表页，第二个是翻译练习页) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="inline-flex p-1 rounded-xl bg-card border border-border/80 shadow-xs select-none">
            {/* Tab 1: 句库列表 (默认) */}
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Layers className="size-4" />
              <span>句库列表</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-mono transition-colors ${
                  activeTab === 'list'
                    ? 'bg-primary-foreground/20 text-primary-foreground font-bold'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {filteredBooks.length}
              </span>
            </button>

            {/* Tab 2: 翻译练习 */}
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Languages className="size-4" />
              <span>翻译练习</span>
              {currentBook && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono transition-colors ${
                    activeTab === 'practice'
                      ? 'bg-primary-foreground/20 text-primary-foreground font-bold'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentSentenceIndex + 1}/{totalSentences}
                </span>
              )}
            </button>
          </div>

          {/* 右侧：当前练习分组标识（靠右）与返回列表按钮 */}
          {activeTab === 'practice' ? (
            <div className="flex items-center gap-4 sm:gap-6 ml-auto">
              {currentBook && (
                <div className="flex items-center gap-2 select-none animate-fadeIn">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-xs">
                    <span>{SCENARIO_ICONS[currentBook.scenario || '日常生活'] || '☕'}</span>
                    <span>{currentBook.scenario || '日常生活'}</span>
                  </span>
                  <span className="font-semibold text-xs sm:text-sm text-foreground tracking-wide">
                    {currentBook.name}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card border border-border/70 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="size-3.5" />
                <span>返回列表选组</span>
              </button>
            </div>
          ) : (
            currentBook && (
              <div
                onClick={() => setActiveTab('practice')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/60 hover:bg-card border border-border/60 hover:border-primary/40 text-xs text-muted-foreground transition-all cursor-pointer group"
                title="点击前往翻译练习页"
              >
                <span className="text-muted-foreground/80">当前就绪:</span>
                <span className="font-medium text-foreground truncate max-w-[200px] md:max-w-[280px]">
                  {currentBook.name} (第 {currentSentenceIndex + 1}/{totalSentences} 句)
                </span>
                <span className="text-primary group-hover:translate-x-0.5 transition-transform font-medium">
                  前往练习页 &rarr;
                </span>
              </div>
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
              className={`shrink-0 size-10 xl:size-12 rounded-full glass-card flex items-center justify-center transition-all cursor-pointer ${
                currentSentenceIndex > 0
                  ? 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95'
                  : 'opacity-30 cursor-not-allowed text-[#9CA3AF]'
              }`}
              title="上一句 (←)"
            >
              <ArrowLeft className="size-5 xl:size-6" />
            </button>

            {/* 居中固定尺寸卡片 */}
            <div className="relative flex flex-col items-center shrink-0">
              <div className="relative w-[800px] h-[540px] xl:w-[940px] xl:h-[590px] 2xl:w-[1060px] 2xl:h-[640px] max-w-[94vw] rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl transition-all duration-300 shrink-0 flex flex-col">
                {currentSentence ? (
                  <TranslateCard
                    key={`${currentBook.id}_${currentSentence.id}`}
                    sentence={currentSentence}
                    sentenceIndex={currentSentenceIndex}
                    totalSentences={totalSentences}
                    onNext={nextSentence}
                    onPrev={prevSentence}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center select-none space-y-4">
                    <div className="size-16 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground">
                      <BookOpen className="size-8" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">该分组暂无练习语句</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                      您可以点击下方按钮，导入自定义的英文句子与中文译文。
                    </p>
                    <button
                      type="button"
                      onClick={() => setImportModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md transition-all cursor-pointer"
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
              className={`shrink-0 size-10 xl:size-12 rounded-full glass-card flex items-center justify-center transition-all cursor-pointer ${
                currentSentenceIndex < totalSentences - 1
                  ? 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95'
                  : 'opacity-30 cursor-not-allowed text-[#9CA3AF]'
              }`}
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
