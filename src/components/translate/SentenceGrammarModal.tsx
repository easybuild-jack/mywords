'use client'

import React, { useEffect } from 'react'
import {
  X,
  Volume2,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Gauge,
  Lightbulb,
  RotateCcw,
} from 'lucide-react'
import type { TranslationSentenceItem } from '@/types'
import { GRAMMAR_ROLE_STYLES } from '@/lib/sentenceParser'
import { useTranslateStore } from '@/store/useTranslateStore'

interface SentenceGrammarModalProps {
  isOpen: boolean
  onClose: () => void
  sentence: TranslationSentenceItem
  isSpeaking: boolean
  audioRate: number
  onPlayAudio: () => void
  onToggleAudioRate: () => void
  onNext: () => void
  onRepeat?: () => void
}

export function SentenceGrammarModal({
  isOpen,
  onClose,
  sentence,
  isSpeaking,
  audioRate,
  onPlayAudio,
  onToggleAudioRate,
  onNext,
  onRepeat,
}: SentenceGrammarModalProps) {
  const grammar = sentence.grammar
  const tokens = grammar?.tokens || []
  const playWordAudio = useTranslateStore((s) => s.playWordAudio)

  // 快捷键支持：Enter 进入下一句，Esc 关闭弹窗
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onNext()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onNext, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-5xl 2xl:max-w-6xl rounded-xl bg-sidebar border border-border shadow-xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-scaleUp">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 sm:py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
                        <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">翻译通关 · 句法分析</span>
              </div>
              <h2 className="mt-0.5 text-base sm:text-lg font-semibold tracking-tight text-foreground">
                {grammar?.patternZh || '标准英语句型分析'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {grammar?.patternCode && (
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono">
                {grammar.patternCode}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              title="关闭弹窗 (Esc)"
              className="size-8 rounded-md inline-flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 弹窗内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 space-y-5 custom-scrollbar">
          {/* 原文与译文展示卡片（紧凑纵向间距，节省空间给下方内容） */}
          <div className="space-y-1.5">
            <div className="text-xl sm:text-2xl font-serif text-foreground leading-snug">
              {sentence.sentenceEn}
            </div>
            <div className="text-sm sm:text-base font-normal text-gray-300 leading-snug">
              {sentence.sentenceZh}
            </div>
          </div>

          {/* 核心亮点：逐词语法成分彩色卡片拆解 */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <BookOpen className="size-3.5 text-muted-foreground" />
              <span>逐词语法成分映射 (主谓宾 / 主系表 / 定状补等)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {tokens.map((token, i) => {
                const roleStyle =
                  (token.roleCode && GRAMMAR_ROLE_STYLES[token.roleCode]) ||
                  GRAMMAR_ROLE_STYLES.Default

                return (
                  <div
                    key={i}
                    onClick={() => {
                      const wordToPlay = (token.cleanText || token.text || '').replace(/[^a-zA-Z'-]/g, '')
                      if (wordToPlay) playWordAudio(wordToPlay)
                    }}
                    title="点击播放该词读音"
                    className={`p-3 rounded-lg border border-border flex flex-col justify-between transition-colors hover:bg-muted cursor-pointer group/card`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${roleStyle.bg} ${roleStyle.text}`}
                      >
                        {token.roleZh || roleStyle.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {token.pos && (
                          <span className="text-xs font-mono text-muted-foreground">
                            {token.pos}
                          </span>
                        )}
                        <Volume2 className="size-3 text-muted-foreground/40 group-hover/card:text-primary transition-colors" />
                      </div>
                    </div>

                    <div className="text-base sm:text-lg text-foreground font-serif break-words mb-0.5 group-hover/card:text-primary transition-colors">
                      {token.text || token.cleanText}
                    </div>

                    {token.explanation && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-snug">
                        {token.explanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 句法语义精解点拨 */}
          {grammar?.summary && (
            <div className="pt-4 border-t border-dashed border-border text-[13px] text-gray-300 leading-relaxed flex items-start gap-2">
              <Lightbulb className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-foreground mr-1.5">句法要领</span>
                {grammar.summary}
              </div>
            </div>
          )}
        </div>

        {/* 底部控制器与按钮栏 */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 sm:px-8 py-3 border-t border-border shrink-0">
          <div className="flex items-center gap-1">
            {/* 重听整句原声 */}
            <button
              type="button"
              onClick={onPlayAudio}
              className={`h-8 px-3 rounded-md inline-flex items-center gap-1.5 text-[13px] transition-colors cursor-pointer ${
                isSpeaking ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Volume2
                className={`size-3.5 ${isSpeaking ? 'animate-pulse' : ''}`}
              />
              <span>{isSpeaking ? '正在朗读原声...' : '重听整句原声'}</span>
            </button>

            {/* 语速调节 */}
            <button
              type="button"
              onClick={onToggleAudioRate}
              title="点击切换朗读倍速"
              className="h-8 px-3 rounded-md inline-flex items-center gap-1.5 text-[13px] transition-colors cursor-pointer font-mono text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Gauge className="size-3.5" />
              <span>{audioRate}x</span>
            </button>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {/* 再练一次本句 */}
            {onRepeat && (
              <button
                type="button"
                onClick={onRepeat}
                className="h-8 px-3 rounded-md inline-flex items-center gap-1.5 text-[13px] transition-colors cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <RotateCcw className="size-3.5" />
                <span>再练一次本句</span>
              </button>
            )}

            {/* 下一句按钮 */}
            <button
              type="button"
              onClick={onNext}
              className="ml-1 h-8 px-3 rounded-md inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium transition-colors cursor-pointer"
            >
              <span>进入下一句</span>
              <span className="text-[10px] opacity-70 font-mono">
                Enter ↵
              </span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
