'use client'

import React from 'react'
import {
  Volume2,
  VolumeX,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Gauge,
} from 'lucide-react'
import type { TranslationSentenceItem } from '@/types'
import { GRAMMAR_ROLE_STYLES } from '@/lib/sentenceParser'

interface SentenceGrammarPanelProps {
  sentence: TranslationSentenceItem
  isSpeaking: boolean
  audioRate: number
  onPlayAudio: () => void
  onToggleAudioRate: () => void
  onNext: () => void
}

export function SentenceGrammarPanel({
  sentence,
  isSpeaking,
  audioRate,
  onPlayAudio,
  onToggleAudioRate,
  onNext,
}: SentenceGrammarPanelProps) {
  const grammar = sentence.grammar
  const tokens = grammar?.tokens || []

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 p-6 sm:p-8 rounded-3xl bg-card/90 border border-primary/30 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_24px_rgba(var(--primary-rgb),0.12)] animate-fadeIn space-y-6">
      {/* 顶部通关标识与句型骨架 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                翻译通关 · 句法精析
              </span>
              <Sparkles className="size-3.5 text-amber-400 animate-spin-slow" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              {grammar?.patternZh || '标准英语句型'}
            </h3>
          </div>
        </div>

        {/* 句型公式标签 */}
        {grammar?.patternCode && (
          <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs sm:text-sm font-mono font-bold tracking-wide shadow-xs">
            {grammar.patternCode}
          </div>
        )}
      </div>

      {/* 核心亮点：逐词语法成分彩色标注 (主谓宾、主系表等对应单词) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <BookOpen className="size-3.5 text-primary" />
          <span>每个单词对应的语法成分拆解</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {tokens.map((token, i) => {
            const roleStyle =
              (token.roleCode && GRAMMAR_ROLE_STYLES[token.roleCode]) ||
              GRAMMAR_ROLE_STYLES.Default

            return (
              <div
                key={i}
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-102 ${roleStyle.bg} ${roleStyle.border}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                  >
                    {token.roleZh || roleStyle.label}
                  </span>
                  {token.pos && (
                    <span className="text-[10px] font-mono text-muted-foreground/70">
                      {token.pos}
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-foreground truncate font-mono">
                  {token.text || token.cleanText}
                </div>

                {token.explanation && (
                  <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2 leading-tight">
                    {token.explanation}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 语法精解与点拨 */}
      {grammar?.summary && (
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground mr-1.5">💡 句法点拨:</span>
          {grammar.summary}
        </div>
      )}

      {/* 底部复读发音控制与下一句按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          {/* 重播读音按钮 */}
          <button
            type="button"
            onClick={onPlayAudio}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_16px_rgba(var(--primary-rgb),0.5)] scale-102'
                : 'bg-card hover:bg-card/80 text-foreground border-border hover:border-primary/50'
            }`}
          >
            <Volume2
              className={`size-4 ${isSpeaking ? 'animate-bounce text-primary-foreground' : 'text-primary'}`}
            />
            <span>{isSpeaking ? '正在朗读原声...' : '重听整句原声'}</span>
          </button>

          {/* 语速调节 */}
          <button
            type="button"
            onClick={onToggleAudioRate}
            title="点击切换朗读倍速"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card/60 hover:bg-card text-xs font-mono text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <Gauge className="size-3.5 text-accent" />
            <span>{audioRate}x</span>
          </button>
        </div>

        {/* 下一句按钮 */}
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-[0_4px_16px_rgba(var(--primary-rgb),0.35)] transition-all hover:scale-102 cursor-pointer ml-auto"
        >
          <span>进入下一句</span>
          <span className="text-[11px] opacity-75 font-mono px-1.5 py-0.5 rounded bg-black/20">
            Enter ↵
          </span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
