'use client'

import React from 'react'
import { Volume2, AlertTriangle, ArrowRight } from 'lucide-react'
import type { WordItem, PracticeMode } from '@/types'
import { audioEngine } from '@/core/audioEngine'
import { splitIntoMorphemes, MORPHEME_ROLE_LABEL } from '@/lib/syllables'

interface WordCardContentProps {
  word: WordItem
  mode: PracticeMode
  currentInput: string
  hasTypo: boolean
  isPeeking: boolean
  isTranslationVisible: boolean
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

/** 长单词按字数降档，避免撑破卡片 */
function wordSizeClass(length: number) {
  if (length <= 8) return 'text-6xl'
  if (length <= 12) return 'text-5xl'
  return 'text-4xl'
}

export function WordCardContent({
  word,
  mode,
  currentInput,
  hasTypo,
  isPeeking,
  isTranslationVisible,
  phoneticPreference,
  remainingLoops = 1,
}: WordCardContentProps) {
  const phonetic = phoneticPreference === 'uk' ? word.phoneticUk || word.phoneticUs : word.phoneticUs || word.phoneticUk
  const meaningText = word.posList?.map((p) => `${p.pos} ${p.means.join('； ')}`).join('  ') || ''

  const morphemes = splitIntoMorphemes(word)

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation()
    audioEngine.playPronunciation(word.name, phoneticPreference)
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between pt-5 pb-6 px-8 text-center select-none">
      {/* 右上角发音按钮 */}
      {mode === 'learn' && (
        <button
          onClick={speak}
          className="absolute top-4 right-4 size-10 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/20 transition-all z-10 cursor-pointer"
          title="发音 (Ctrl+J)"
        >
          <Volume2 className="size-4.5" />
        </button>
      )}

      {remainingLoops > 1 && (
        <span className="absolute top-4 left-4 text-xs font-mono px-2.5 py-1 rounded-lg bg-accent/15 text-accent border border-accent/30 z-10 font-bold tracking-wider">
          Again x{remainingLoops}
        </span>
      )}

      {/* ========================================================= */}
      {/* A. 模式 1：跟学模式 (Learn & Follow Mode)                */}
      {/* ========================================================= */}
      {mode === 'learn' ? (
        <>
          {/* 1. 音标 + 单词 + 释义 (整体上移，紧凑顶部间距) */}
          <div className="space-y-1 pt-0">
            <p className="font-mono text-2xl tracking-wide text-gray-300">{phonetic}</p>
            <h2 className={`${wordSizeClass(word.name.length)} font-extrabold tracking-tight text-white font-mono leading-tight`}>
              {word.name}
            </h2>
            {/* 固定预留高度，切换译文或换词时卡片内容不上下跳动 */}
            <div className="h-10 flex items-center justify-center">
              <p
                className={`text-sm sm:text-base text-[#9CA3AF] line-clamp-2 font-medium leading-relaxed ${
                  isTranslationVisible ? '' : 'invisible'
                }`}
              >
                {meaningText}
              </p>
            </div>
          </div>

          {/* 2. 构词法切分：前缀 + 词根 + 后缀，跟打进度按段点亮 */}
          <div className="flex items-end justify-center gap-2 flex-wrap">
            {morphemes.map((morpheme, index) => {
              const startIdx = morphemes.slice(0, index).reduce((sum, m) => sum + m.text.length, 0)
              const endIdx = startIdx + morpheme.text.length
              const isCompleted = currentInput.length >= endIdx
              const isCurrent = currentInput.length >= startIdx && currentInput.length < endIdx

              return (
                <React.Fragment key={index}>
                  {index > 0 && <span className="pb-3 text-lg text-gray-400 font-mono font-bold">+</span>}
                  <div
                    className={`px-3.5 py-2 rounded-2xl border transition-all duration-200 min-w-18 ${
                      isCurrent
                        ? 'border-[#F05F5A] bg-[#F05F5A]/25 shadow-[0_0_20px_rgba(240,95,90,0.4)] scale-105'
                        : isCompleted
                        ? 'border-primary bg-primary/20 shadow-[0_0_16px_rgb(var(--primary-rgb)/0.2)]'
                        : 'border-white/20 bg-white/[0.08]'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isCurrent
                          ? 'text-[#FFA8A3]'
                          : isCompleted
                          ? 'text-primary'
                          : 'text-gray-300'
                      }`}
                    >
                      {MORPHEME_ROLE_LABEL[morpheme.role]}
                    </div>
                    <div
                      className={`font-mono text-xl font-bold my-0.5 ${
                        isCurrent
                          ? 'text-white'
                          : isCompleted
                          ? 'text-primary'
                          : 'text-white'
                      }`}
                    >
                      {morpheme.text}
                    </div>
                    {morpheme.meaning && (
                      <div
                        className={`text-xs font-medium max-w-32 leading-tight ${
                          isCurrent
                            ? 'text-white font-bold'
                            : isCompleted
                            ? 'text-primary/90'
                            : 'text-[#9CA3AF]'
                        }`}
                      >
                        {morpheme.meaning}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>

          {/* 3. 词根语义推导说明 (与上方译文保持一致的灰色与排版样式) */}
          <div className="h-7 flex items-center justify-center gap-2 text-sm sm:text-base text-[#9CA3AF] font-medium leading-relaxed">
            {word.etymology?.derivation && (
              <>
                <ArrowRight className="size-4 text-[#F05F5A]/80 shrink-0" />
                <span className="min-w-0 truncate text-[#9CA3AF] font-medium">{word.etymology.derivation}</span>
              </>
            )}
          </div>

          {/* 4. 跟打实时输入槽 (加大高度与字体) */}
          <div className="relative w-full max-w-md mx-auto">
            <div
              className={`h-16 flex items-center justify-center font-mono text-4xl font-bold rounded-2xl border px-5 transition-all shadow-inner ${
                hasTypo
                  ? 'border-destructive bg-destructive/15 text-destructive animate-shake'
                  : 'border-white/15 bg-white/[0.04] text-primary shadow-[0_0_20px_rgba(0,0,0,0.2)]'
              }`}
            >
              {currentInput && <span className="mr-1.5">{currentInput}</span>}
              <span className="inline-block w-0.5 h-8 bg-primary animate-cursor shrink-0" />
              {!currentInput && (
                <span className="ml-3 text-lg text-muted-foreground/70 font-normal font-sans">敲击键盘开始跟练...</span>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ========================================================= */
        /* B. 模式 2：纯盲打默写模式 (Blind Dictation Mode)          */
        /* ========================================================= */
        <div className="flex flex-col items-center justify-center h-full space-y-4 pt-1">
          {/* 1. 巨型发音喇叭 */}
          <button
            onClick={speak}
            className="size-18 rounded-3xl bg-primary/15 border border-primary/40 flex items-center justify-center text-primary hover:scale-105 transition-all shadow-[0_0_24px_rgb(var(--primary-rgb)/0.3)] group cursor-pointer"
            title="发音 (Ctrl+J)"
          >
            <Volume2 className="size-9 group-hover:scale-110 transition-transform" />
          </button>

          {/* 2. 中文释义 */}
          <div className="h-12 flex items-center justify-center">
            {isTranslationVisible ? (
              <p className="text-xl font-bold text-white max-w-md line-clamp-2 leading-7">{meaningText}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">[ 纯听音默写模式 ]</p>
            )}
          </div>

          {/* 3. 按住 Tab 偷看答案 */}
          <div className="h-8 flex items-center justify-center">
            {isPeeking && (
              <span className="font-mono text-2xl font-bold tracking-widest text-accent px-4 py-0.5 rounded-lg bg-accent/10 border border-accent/30">
                {word.name}
              </span>
            )}
          </div>

          {/* 4. 盲打下划线与实时输入槽 (加大高度与字体) */}
          <div className="w-full max-w-md space-y-2">
            <div
              className={`h-16 flex items-center justify-center tracking-widest font-mono text-3xl font-bold rounded-2xl border px-5 transition-all shadow-inner ${
                hasTypo
                  ? 'border-destructive bg-destructive/15 text-destructive animate-shake'
                  : 'border-primary/40 bg-white/[0.04] text-primary shadow-[0_0_20px_rgba(0,0,0,0.2)]'
              }`}
            >
              {currentInput && <span className="mr-2">{currentInput}</span>}
              <span className="inline-block w-0.5 h-8 bg-primary animate-cursor shrink-0" />
              {!currentInput && (
                <span className="ml-2 text-muted-foreground/60 text-xl tracking-widest font-normal font-mono">
                  {Array(word.name.length).fill('_').join(' ')}
                </span>
              )}
            </div>

            <div className="h-8">
              {hasTypo && (
                <div className="flex items-center justify-center gap-1.5 h-full text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertTriangle className="size-3.5" />
                  <span>拼写错误，已重置重试</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
