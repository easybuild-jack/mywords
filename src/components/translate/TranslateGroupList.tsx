'use client'

import React from 'react'
import type { TranslationBook } from '@/types'
import { ArrowRight, Trash2, CheckCircle2 } from 'lucide-react'

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
      <div className="py-20 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-foreground">没有找到符合条件的练习分组</p>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">
          切换上方的场景试试，或通过「导入练习语句」添加自定义分组
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2">
        <span>
          共 <span className="font-mono text-foreground">{books.length}</span> 个分组
        </span>
        <span>点击分组进入翻译练习</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10">
        {books.map((book) => {
          const isCurrent = book.id === currentBookId
          const scenario = book.scenario || '日常生活'
          const total = book.sentences.length
          const completedCount = book.sentences.filter((s) => completedSentenceIds[s.id]).length
          const isAllCompleted = total > 0 && completedCount === total
          const firstSentence = book.sentences[0]

          return (
            <article
              key={book.id}
              onClick={() => onSelectGroup(book.id)}
              className="group border-t border-border py-5 flex flex-col gap-3 cursor-pointer select-none"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {scenario} · <span className="font-mono">{total}</span> 句
                  {isCurrent && <span className="ml-2 text-primary">上次练习</span>}
                </span>
                {book.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteCustomGroup(book.id, book.name)
                    }}
                    title="删除此自定义分组"
                    className="size-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {book.name}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {book.description || '精选场景地道英文表达，学练结合'}
                </p>
              </div>

              {firstSentence && (
                <blockquote className="border-l-2 border-border pl-3">
                  <p className="font-serif text-[15px] text-gray-200 line-clamp-1">{firstSentence.sentenceEn}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{firstSentence.sentenceZh}</p>
                </blockquote>
              )}

              <div className="mt-auto flex items-center justify-between text-xs">
                {isAllCompleted ? (
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle2 className="size-3.5" />
                    已全部完成
                  </span>
                ) : completedCount > 0 ? (
                  <span className="text-muted-foreground">
                    已练习 <span className="font-mono text-foreground">{completedCount}</span> / {total}
                  </span>
                ) : (
                  <span className="text-muted-foreground">未开始练习</span>
                )}

                <span className="flex items-center gap-1 text-primary opacity-70 group-hover:opacity-100 transition-opacity">
                  {completedCount > 0 ? '继续练习' : '开始练习'}
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
