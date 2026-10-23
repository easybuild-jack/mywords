'use client'

import React from 'react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react'
import { useTranslateStore } from '@/store/useTranslateStore'

export function TranslateHeader() {
  const {
    books,
    currentBookId,
    currentSentenceIndex,
    selectBook,
    deleteCustomBook,
    prevSentence,
    nextSentence,
    setImportModalOpen,
  } = useTranslateStore()

  const currentBook = books.find((b) => b.id === currentBookId) || books[0]
  const totalSentences = currentBook?.sentences?.length || 0

  return (
    <header className="shrink-0 w-full px-4 sm:px-6 py-3 border-b border-border/70 bg-card/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
      {/* 左侧：题库切换下拉与导入入口 */}
      <div className="flex items-center gap-2.5">
        <div className="relative group">
          <select
            value={currentBookId}
            onChange={(e) => selectBook(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 rounded-xl bg-card border border-border/80 text-foreground font-semibold text-xs sm:text-sm hover:border-primary/50 focus:border-primary focus:outline-none transition-all cursor-pointer shadow-xs"
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name} ({book.sentences.length} 句) {book.isCustom ? '· 自定义' : ''}
              </option>
            ))}
          </select>

          <Layers className="size-4 text-primary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <ChevronDown className="size-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 导入语句按钮 */}
        <button
          type="button"
          onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">导入练习语句</span>
          <span className="sm:hidden">导入</span>
        </button>

        {/* 删除自定义题库 */}
        {currentBook?.isCustom && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`确定删除自定义句库「${currentBook.name}」吗？`)) {
                deleteCustomBook(currentBook.id)
              }
            }}
            title="删除此自定义句库"
            className="p-2 rounded-xl border border-border/60 hover:border-destructive/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      {/* 右侧：翻页控制器与进度 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-medium text-muted-foreground mr-1">
          进度: <strong className="text-foreground">{currentSentenceIndex + 1}</strong> / {totalSentences}
        </span>

        <button
          type="button"
          onClick={prevSentence}
          disabled={currentSentenceIndex <= 0}
          title="上一句 (ArrowLeft)"
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            currentSentenceIndex > 0
              ? 'border-border bg-card hover:bg-muted text-foreground'
              : 'border-border/30 text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="size-4" />
        </button>

        <button
          type="button"
          onClick={nextSentence}
          disabled={currentSentenceIndex >= totalSentences - 1}
          title="下一句 (ArrowRight)"
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            currentSentenceIndex < totalSentences - 1
              ? 'border-border bg-card hover:bg-muted text-foreground'
              : 'border-border/30 text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </header>
  )
}
