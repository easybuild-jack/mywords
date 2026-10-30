'use client'

import React, { useEffect } from 'react'
import {
  X,
  Volume2,
  ArrowRight,
  Sparkles,
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
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-5xl 2xl:max-w-6xl rounded-3xl bg-sidebar border border-border shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_32px_rgba(var(--primary-rgb),0.15)] overflow-hidden flex flex-col max-h-[92vh] my-auto animate-scaleUp">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 sm:py-4 border-b border-border bg-secondary/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 sm:size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="size-5 sm:size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400">
                  翻译通关 · 句法分析
                </span>
                <Sparkles className="size-3.5 text-amber-400" />
              </div>
              <h2 className="text-base sm:text-lg xl:text-xl font-bold text-foreground">
                {grammar?.patternZh || '标准英语句型分析'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {grammar?.patternCode && (
              <span className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs sm:text-sm font-mono font-bold tracking-wide">
                {grammar.patternCode}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              title="关闭弹窗 (Esc)"
              className="p-1.5 sm:p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* 弹窗内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8 sm:py-4.5 space-y-3.5 custom-scrollbar">
          {/* 原文与译文展示卡片（紧凑纵向间距，节省空间给下方内容） */}
          <div className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-secondary/40 border border-border space-y-1">
            <div className="text-xl sm:text-2xl xl:text-[24px] font-bold font-mono text-foreground tracking-wide leading-snug">
              {sentence.sentenceEn}
            </div>
            <div className="text-sm sm:text-base font-normal text-white leading-snug">
              {sentence.sentenceZh}
            </div>
          </div>

          {/* 核心亮点：逐词语法成分彩色卡片拆解 */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground/80 uppercase tracking-wider">
              <BookOpen className="size-4 text-primary" />
              <span>逐词语法成分映射 (主谓宾 / 主系表 / 定状补等)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
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
                    className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col justify-between transition-all hover:scale-102 bg-secondary/30 ${roleStyle.bg} ${roleStyle.border} cursor-pointer group/card`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                      >
                        {token.roleZh || roleStyle.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {token.pos && (
                          <span className="text-xs font-mono text-muted-foreground/80">
                            {token.pos}
                          </span>
                        )}
                        <Volume2 className="size-3 text-muted-foreground/40 group-hover/card:text-primary transition-colors" />
                      </div>
                    </div>

                    <div className="text-base sm:text-lg font-bold text-foreground font-mono break-words mb-0.5 group-hover/card:text-primary transition-colors">
                      {token.text || token.cleanText}
                    </div>

                    {token.explanation && (
                      <p className="text-xs sm:text-[13px] text-muted-foreground/90 mt-1 line-clamp-3 leading-snug">
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
            <div className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-secondary/40 border border-border text-xs sm:text-sm text-foreground/90 leading-relaxed flex items-start gap-2.5">
              <Lightbulb className="size-4.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground mr-1.5">句法要领:</span>
                {grammar.summary}
              </div>
            </div>
          )}
        </div>

        {/* 底部控制器与按钮栏 */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 sm:px-8 py-3.5 sm:py-4 border-t border-border bg-secondary/30 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* 重听整句原声 */}
            <button
              type="button"
              onClick={onPlayAudio}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl border text-sm sm:text-base font-semibold transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_14px_rgba(var(--primary-rgb),0.5)]'
                  : 'bg-secondary/60 hover:bg-secondary text-foreground border-border hover:border-primary/50'
              }`}
            >
              <Volume2
                className={`size-4.5 ${isSpeaking ? 'animate-bounce text-primary-foreground' : 'text-primary'}`}
              />
              <span>{isSpeaking ? '正在朗读原声...' : '重听整句原声'}</span>
            </button>

            {/* 语速调节 */}
            <button
              type="button"
              onClick={onToggleAudioRate}
              title="点击切换朗读倍速"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-xs sm:text-sm font-mono font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <Gauge className="size-4 text-accent" />
              <span>{audioRate}x</span>
            </button>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* 再练一次本句 */}
            {onRepeat && (
              <button
                type="button"
                onClick={onRepeat}
                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-foreground text-sm sm:text-base font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="size-4 text-primary" />
                <span>再练一次本句</span>
              </button>
            )}

            {/* 下一句按钮 */}
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm sm:text-base shadow-[0_4px_16px_rgba(var(--primary-rgb),0.35)] transition-all hover:scale-102 cursor-pointer"
            >
              <span>进入下一句</span>
              <span className="text-xs opacity-80 font-mono px-2 py-0.5 rounded bg-black/20">
                Enter ↵
              </span>
              <ArrowRight className="size-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
