'use client'

import React, { useMemo } from 'react'

export interface InteractiveSentenceProps {
  sentence: string
  wordName: string
  sentenceCn?: string
  isCloze?: boolean
  isRevealed?: boolean
  onWordClick: (word: string, sentenceEn: string, sentenceCn?: string, targetRect?: DOMRect) => void
  className?: string
}

/**
 * 匹配英文单词（含内部撇号与连字符，如 don't, long-term）与非单词字符/空白
 */
const TOKEN_REGEX = /([a-zA-Z0-9]+(?:['’-][a-zA-Z0-9]+)*|[^a-zA-Z0-9\s]+|\s+)/g

export function InteractiveSentence({
  sentence,
  wordName,
  sentenceCn,
  isCloze = false,
  isRevealed = false,
  onWordClick,
  className = '',
}: InteractiveSentenceProps) {
  const cleanTarget = useMemo(() => wordName?.trim().toLowerCase() || '', [wordName])

  // 预编译目标词匹配正则（支持目标词复数、时态等常规变形）
  const targetRegex = useMemo(() => {
    if (!cleanTarget) return null
    const escaped = cleanTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`^${escaped}(s|es|ed|ing|d|r|er|est)?$`, 'i')
  }, [cleanTarget])

  const tokens = useMemo(() => {
    if (!sentence) return []
    return sentence.match(TOKEN_REGEX) || [sentence]
  }, [sentence])

  return (
    <span
      className={`text-sm xl:text-base 2xl:text-[1.05rem] text-gray-100 leading-relaxed font-sans ${className}`}
    >
      {tokens.map((token, idx) => {
        const isWord = /^[a-zA-Z0-9]/.test(token)

        // 空白或标点符号直接渲染
        if (!isWord) {
          return <span key={idx}>{token}</span>
        }

        const isTarget = targetRegex ? targetRegex.test(token) : false

        // 1. 默写挖空模式下的目标词
        if (isCloze && isTarget) {
          if (isRevealed) {
            return (
              <span
                key={idx}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = e.currentTarget.getBoundingClientRect()
                  onWordClick(token, sentence, sentenceCn, rect)
                }}
                className="inline-block mx-1 px-2 py-0.5 font-mono text-sm xl:text-base font-bold text-accent bg-accent/15 border border-accent/40 rounded-md animate-in fade-in duration-200 cursor-pointer hover:underline hover:bg-accent/25 transition-colors"
                title="点击查词"
              >
                {token}
              </span>
            )
          }

          const underlineLen = Math.max(3, Math.min(token.length, 7))
          return (
            <span
              key={idx}
              className="inline-flex items-center justify-center mx-1 px-2 py-0.5 font-mono text-xs xl:text-sm font-bold text-primary bg-primary/10 border border-dashed border-primary/40 rounded-md select-none tracking-widest"
              title="按 Tab 键可临时偷看答案"
            >
              [{'_'.repeat(underlineLen)}]
            </span>
          )
        }

        // 2. 正常高亮模式下的目标词
        if (isTarget) {
          return (
            <span
              key={idx}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                onWordClick(token, sentence, sentenceCn, rect)
              }}
              className="text-primary font-bold px-0.5 underline decoration-primary/60 decoration-2 underline-offset-2 cursor-pointer hover:bg-primary/15 rounded transition-colors"
              title="点击查词"
            >
              {token}
            </span>
          )
        }

        // 3. 例句中的其他可点击英文单词
        return (
          <span
            key={idx}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              onWordClick(token, sentence, sentenceCn, rect)
            }}
            className="cursor-pointer hover:text-primary hover:underline hover:bg-primary/10 rounded-sm px-0.5 transition-colors duration-150 inline-block"
            title="点击查词"
          >
            {token}
          </span>
        )
      })}
    </span>
  )
}
