'use client'

import React from 'react'
import type { ParsedWordToken } from '@/lib/sentenceParser'

interface SentenceUnderlineSlotsProps {
  tokens: ParsedWordToken[]
  activeWordIndex: number
  typedWords: string[]
  errorIndices: number[]
  isPeeking: boolean
  isCompleted: boolean
  onWordClick?: (index: number) => void
}

export function SentenceUnderlineSlots({
  tokens,
  activeWordIndex,
  typedWords,
  errorIndices,
  isPeeking,
  isCompleted,
  onWordClick,
}: SentenceUnderlineSlotsProps) {
  return (
    <div className="w-full flex flex-wrap items-end justify-center gap-x-4 gap-y-6 sm:gap-x-5 py-4 px-2 select-none">
      {tokens.map((token, idx) => {
        const isCurrent = !isCompleted && idx === activeWordIndex
        const hasError = errorIndices.includes(idx)
        const typedText = typedWords[idx] || ''

        const cleanWord = token.cleanWord
        const targetLen = cleanWord.length
        const currentLen = typedText.length

        return (
          <div
            key={token.id}
            onClick={() => onWordClick?.(idx)}
            className="relative inline-flex items-end h-12 sm:h-14 xl:h-16 font-serif text-2xl sm:text-3xl xl:text-4xl cursor-pointer bg-transparent"
          >
            {/* 前置标点 (自动放置，不需输入) */}
            {token.leadingPunct && (
              <span className="h-full flex items-end pb-1.5 text-muted-foreground/60 mr-1 font-serif select-none leading-none">
                {token.leadingPunct}
              </span>
            )}

            {/*
              核心单词槽位：
              1. 绝不出现任何边框背景或发光阴影块 (bg-transparent, 无 shadow)，只有底部的单线下划横杠
              2. 翻译时英文字体字号放大，与主题色 (text-primary / border-primary) 严格保持一致
              3. 提示已移至页面最上方，此处绝不重叠提示，保证输入纯净
              4. 只有在检查发现错误时才显示红色 (text-destructive / border-destructive)
            */}
            <div
              style={{
                width: `${Math.max(targetLen, currentLen, 1)}ch`,
              }}
              className={`relative h-full flex items-end justify-start px-0.5 pb-1.5 bg-transparent transition-colors ${
                hasError
                  ? 'text-destructive border-b-2 border-destructive animate-shake'
                  : isCompleted || isCurrent || typedText.length > 0
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground border-b-2 border-border hover:border-primary/50'
              }`}
            >
              <div className="relative w-full h-full flex items-end justify-start tracking-normal bg-transparent">
                {/* 用户已输入的英文字符：字号放大，清晰醒目，仅报错时才转红 */}
                {typedText && (
                  <span
                    className={`leading-none ${
                      hasError ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {typedText}
                  </span>
                )}

                {/* 当前活动词的闪烁光标 */}
                {isCurrent && (
                  <span
                    className={`inline-block w-0.5 h-[1.15em] mb-0.5 animate-pulse shrink-0 ${
                      hasError ? 'bg-destructive' : 'bg-primary'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* 后置标点 (自动放置，紧贴单词，免输入，对齐底线) */}
            {token.trailingPunct && (
              <span className="h-full flex items-end pb-1.5 text-muted-foreground/70 ml-0.5 font-serif select-none leading-none">
                {token.trailingPunct}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
