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
      className={`font-serif text-base xl:text-lg 2xl:text-xl text-gray-100 leading-snug ${className}`}
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
                className="font-medium text-accent underline decoration-accent/60 decoration-2 underline-offset-4 animate-in fade-in duration-200 cursor-pointer"
              >
                {token}
              </span>
            )
          }

          const underlineLen = Math.max(3, Math.min(token.length, 7))
          return (
            <span
              key={idx}
              className="inline-block align-baseline mx-0.5 border-b-2 border-primary/60 select-none"
              style={{ width: `${underlineLen * 0.62}em` }}
              title="按 Tab 键可临时偷看答案"
              aria-label="待默写的单词"
            >
              &nbsp;
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
              className="font-medium underline decoration-primary decoration-2 underline-offset-4 cursor-pointer hover:text-primary transition-colors"
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
            className="cursor-pointer hover:text-primary hover:underline decoration-primary/50 underline-offset-4 transition-colors duration-150"
          >
            {token}
          </span>
        )
      })}
    </span>
  )
}
