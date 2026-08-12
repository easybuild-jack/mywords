'use client'

import React from 'react'
import { Volume2, Sparkles, AlertTriangle } from 'lucide-react'
import type { WordItem, PracticeMode } from '@/types'
import { audioEngine } from '@/core/audioEngine'

interface WordCardContentProps {
  word: WordItem
  isCenter: boolean
  mode: PracticeMode
  currentInput: string
  hasTypo: boolean
  isTranslationVisible: boolean
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

export function WordCardContent({
  word,
  isCenter,
  mode,
  currentInput,
  hasTypo,
  isTranslationVisible,
  phoneticPreference,
  remainingLoops = 1,
}: WordCardContentProps) {
  const phonetic = phoneticPreference === 'uk' ? word.phoneticUk || word.phoneticUs : word.phoneticUs || word.phoneticUk
  const meaningText = word.posList?.map((p) => `${p.pos} ${p.means.join('； ')}`).join('  ') || ''

  // 计算音节高亮状态
  let charCount = 0

  return (
    <div className="w-full h-full flex flex-col justify-between p-7 text-center select-none">
      {/* ========================================================= */}
      {/* A. 模式 1：跟学模式 (Learn & Follow Mode)                */}
      {/* ========================================================= */}
      {mode === 'learn' ? (
        <>
          {/* 1. 顶部发音与音标 */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <button
              onClick={(e) => {
                e.stopPropagation()
                audioEngine.playPronunciation(word.name, phoneticPreference)
              }}
              className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
              title="发音 (Ctrl+J)"
            >
              <Volume2 className="size-4" />
            </button>
            <span className="font-mono text-sm tracking-wide text-gray-300">{phonetic}</span>
            {remainingLoops > 1 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 ml-1">
                余 {remainingLoops} 次
              </span>
            )}
          </div>

          {/* 2. 单词标题与释义 */}
          <div className="space-y-1.5 my-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-mono">{word.name}</h2>
            {isTranslationVisible && (
              <p className="text-sm text-[#9CA3AF] line-clamp-1 font-medium">{meaningText}</p>
            )}
          </div>

          {/* 3. 自然拼读音节切分胶囊 (Syllable Pills) */}
          <div className="flex items-center justify-center gap-2 my-3">
            {word.syllables.map((syllable, sIdx) => {
              const startIdx = charCount
              const endIdx = charCount + syllable.length
              charCount += syllable.length

              const isCompleted = isCenter && currentInput.length >= endIdx
              const isCurrent = isCenter && currentInput.length >= startIdx && currentInput.length < endIdx

              return (
                <div
                  key={sIdx}
                  className={`px-3 py-1.5 rounded-xl font-mono text-lg font-bold transition-all duration-200 border ${
                    isCurrent
                      ? 'border-accent bg-accent/10 text-accent shadow-[0_0_16px_rgba(254,188,46,0.3)] scale-105'
                      : isCompleted
                      ? 'border-primary bg-primary/15 text-primary shadow-[0_0_16px_rgba(0,255,136,0.2)]'
                      : 'border-white/10 bg-white/[0.04] text-muted-foreground'
                  }`}
                >
                  [ {syllable} ]
                </div>
              )
            })}
          </div>

          {/* 4. 跟打实时输入槽 (Active Typing Line) */}
          {isCenter && (
            <div className="relative w-full max-w-xs mx-auto my-2">
              <div
                className={`h-9 flex items-center justify-center font-mono text-xl font-bold rounded-lg border px-3 transition-all ${
                  hasTypo
                    ? 'border-destructive bg-destructive/15 text-destructive animate-shake'
                    : 'border-white/10 bg-white/[0.03] text-primary'
                }`}
              >
                {currentInput ? (
                  <span>{currentInput}</span>
                ) : (
                  <span className="text-xs text-muted-foreground font-normal">敲击键盘开始跟练...</span>
                )}
                <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-cursor" />
              </div>
            </div>
          )}

          {/* 5. 构词法拆解 (前缀 / 词根 / 后缀) */}
          {word.etymology && (
            <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-left text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-accent font-semibold text-[11px] uppercase tracking-wider">
                <Sparkles className="size-3" />
                <span>构词法拆解 (Etymology)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-300">
                {word.etymology.prefix && (
                  <span className="mr-2">
                    <span className="text-accent font-mono">{word.etymology.prefix.form}</span> ({word.etymology.prefix.meaning})
                  </span>
                )}
                {word.etymology.root && (
                  <span className="mr-2">
                    <span className="text-primary font-mono">{word.etymology.root.form}</span> ({word.etymology.root.meaning})
                  </span>
                )}
                {word.etymology.suffix && (
                  <span>
                    <span className="text-accent font-mono">{word.etymology.suffix.form}</span> ({word.etymology.suffix.meaning})
                  </span>
                )}
              </p>
              {word.etymology.derivation && (
                <p className="text-[11px] text-gray-400 border-t border-white/5 pt-1 mt-1 font-mono">
                  → {word.etymology.derivation}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        /* ========================================================= */
        /* B. 模式 2：纯盲打默写模式 (Blind Dictation Mode)          */
        /* ========================================================= */
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          {/* 1. 巨型发音喇叭 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              audioEngine.playPronunciation(word.name, phoneticPreference)
            }}
            className="size-16 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center text-primary hover:scale-105 transition-all shadow-[0_0_24px_rgba(0,255,136,0.3)] group"
            title="发音 (Ctrl+J)"
          >
            <Volume2 className="size-8 group-hover:scale-110 transition-transform" />
          </button>

          {/* 2. 音标 */}
          <span className="font-mono text-sm tracking-wide text-gray-300">{phonetic}</span>

          {/* 3. 中文释义 */}
          {isTranslationVisible ? (
            <p className="text-lg font-bold text-white max-w-sm">{meaningText}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">[ 纯听音默写模式 ]</p>
          )}

          {/* 4. 盲打下划线与实时光标 */}
          {isCenter && (
            <div className="w-full max-w-xs space-y-2 pt-2">
              <div
                className={`h-11 flex items-center justify-center tracking-widest font-mono text-xl font-bold rounded-xl border px-4 transition-all ${
                  hasTypo
                    ? 'border-destructive bg-destructive/15 text-destructive animate-shake'
                    : 'border-primary/40 bg-white/[0.04] text-primary'
                }`}
              >
                {currentInput ? (
                  <span>{currentInput}</span>
                ) : (
                  <span className="text-muted-foreground/60 text-sm tracking-normal font-normal">
                    {Array(word.name.length).fill('_').join(' ')}
                  </span>
                )}
                <span className="inline-block w-0.5 h-6 bg-primary ml-1.5 animate-cursor" />
              </div>

              {hasTypo && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/30 py-1 rounded-lg">
                  <AlertTriangle className="size-3.5" />
                  <span>拼写错误，已重置重试</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
