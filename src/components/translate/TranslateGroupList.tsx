'use client'

import React from 'react'
import type { TranslationBook } from '@/types'
import { SCENARIO_ICONS } from '@/resources/radioData'
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react'

interface TranslateGroupListProps {
  books: TranslationBook[]
  currentBookId: string
  completedSentenceIds: Record<string, boolean>
  onSelectGroup: (bookId: string) => void
  onDeleteCustomGroup: (bookId: string, name: string) => void
}

export function TranslateGroupList({
  books,
  currentBookId,
  completedSentenceIds,
  onSelectGroup,
  onDeleteCustomGroup,
}: TranslateGroupListProps) {
  if (books.length === 0) {
    return (
      <div className="py-20 text-center rounded-2xl bg-card/40 border border-border/60 text-muted-foreground space-y-3">
        <div className="size-12 mx-auto rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground/60">
          <BookOpen className="size-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">没有找到符合条件的练习分组</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          尝试切换上方的场景页签，或点击右上角「导入练习语句」添加自定义练习组
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            场景练习分组 ({books.length})
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          点击分组卡片即可进入翻译练习
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5">
        {books.map((book) => {
          const isCurrent = book.id === currentBookId
          const scenario = book.scenario || '日常生活'
          const icon = SCENARIO_ICONS[scenario] || '🏷️'
          const total = book.sentences.length
          const completedCount = book.sentences.filter(
            (s) => completedSentenceIds[s.id]
          ).length
          const isAllCompleted = total > 0 && completedCount === total
          const firstSentence = book.sentences[0]

          return (
            <div
              key={book.id}
              onClick={() => onSelectGroup(book.id)}
              className={`group relative rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 select-none ${
                isCurrent
                  ? 'bg-card border-primary/60 shadow-[0_4px_24px_rgba(var(--primary-rgb),0.18)] ring-1 ring-primary/40'
                  : 'bg-card/50 hover:bg-card border-border/70 hover:border-border hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {/* 卡片头部：场景标签、句数与自定义删除 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-semibold text-primary">
                  <span>{icon}</span>
                  <span>{scenario}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground bg-white/[0.04] px-2.5 py-0.5 rounded-lg border border-white/10">
                    {total} 句练习
                  </span>

                  {book.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteCustomGroup(book.id, book.name)
                      }}
                      title="删除此自定义分组"
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 卡片主体：分组名称与描述 */}
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                  <span className="truncate">{book.name}</span>
                  {isCurrent && (
                    <span className="shrink-0 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                      上次就绪
                    </span>
                  )}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {book.description || '精选场景地道英文表达，学练结合'}
                </p>
              </div>

              {/* 首句例句预览小卡片 */}
              {firstSentence && (
                <div className="p-3 rounded-xl bg-background/50 border border-border/50 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground/80 font-mono text-[11px]">
                    <Sparkles className="size-3 text-amber-400" />
                    <span>例句预览</span>
                  </div>
                  <p className="text-foreground/90 font-medium line-clamp-1 italic">
                    "{firstSentence.sentenceEn}"
                  </p>
                  <p className="text-muted-foreground text-[11px] line-clamp-1">
                    {firstSentence.sentenceZh}
                  </p>
                </div>
              )}

              {/* 卡片底部操作与进度指示 */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                  {isAllCompleted ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3.5" />
                      <span>已全部完成</span>
                    </span>
                  ) : completedCount > 0 ? (
                    <span className="flex items-center gap-1 text-primary">
                      <Clock className="size-3.5" />
                      <span>已练习 {completedCount} / {total}</span>
                    </span>
                  ) : (
                    <span>未开始练习</span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  <span>{completedCount > 0 ? '继续练习' : '开始练习'}</span>
                  <ArrowRight className="size-3.5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
