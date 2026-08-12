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
    <div className="relative w-full h-full flex flex-col justify-between p-10 text-center select-none">
      {/* 右上角发音按钮（默写模式下卡片中央已有大喇叭，这里不再重复） */}
      {mode === 'learn' && (
        <button
          onClick={speak}
          className="absolute top-5 right-5 size-11 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/20 transition-all z-10"
          title="发音 (Ctrl+J)"
        >
          <Volume2 className="size-5" />
        </button>
      )}

      {remainingLoops > 1 && (
        <span className="absolute top-5 left-5 text-xs font-mono px-2 py-1 rounded-lg bg-accent/15 text-accent border border-accent/30 z-10">
          余 {remainingLoops} 次
        </span>
      )}

      {/* ========================================================= */}
      {/* A. 模式 1：跟学模式 (Learn & Follow Mode)                */}
      {/* ========================================================= */}
      {mode === 'learn' ? (
        <>
          {/* 1. 音标 + 单词 + 释义 */}
          <div className="space-y-2 pt-4">
            <p className="font-mono text-3xl tracking-wide text-gray-300">{phonetic}</p>
            <h2 className={`${wordSizeClass(word.name.length)} font-extrabold tracking-tight text-white font-mono leading-tight`}>
              {word.name}
            </h2>
            {/* 固定预留两行，切换译文或换词时卡片内容不上下跳动 */}
            <div className="h-12 flex items-center justify-center">
              <p
                className={`text-base text-[#9CA3AF] line-clamp-2 font-medium leading-6 ${
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
                  {index > 0 && <span className="pb-4 text-lg text-gray-600 font-mono">+</span>}
                  <div
                    className={`px-4 py-2 rounded-2xl border transition-all duration-200 min-w-20 ${
                      isCurrent
                        ? 'border-accent bg-accent/10 shadow-[0_0_16px_rgba(254,188,46,0.3)] scale-105'
                        : isCompleted
                        ? 'border-primary bg-primary/15 shadow-[0_0_16px_rgb(var(--primary-rgb)/0.2)]'
                        : 'border-white/10 bg-white/[0.04]'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">
                      {MORPHEME_ROLE_LABEL[morpheme.role]}
                    </div>
                    <div
                      className={`font-mono text-2xl font-bold ${
                        isCurrent ? 'text-accent' : isCompleted ? 'text-primary' : 'text-gray-200'
                      }`}
                    >
                      {morpheme.text}
                    </div>
                    {morpheme.meaning && (
                      <div className="text-[11px] text-gray-400 max-w-32 leading-snug">{morpheme.meaning}</div>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>

          {/* 3. 语义推导：说明这样切分是为了推出词义 */}
          <div className="h-6 flex items-center justify-center gap-1.5 text-sm text-gray-400 font-mono">
            {word.etymology?.derivation && (
              <>
                <ArrowRight className="size-4 text-accent shrink-0" />
                <span className="min-w-0 truncate">{word.etymology.derivation}</span>
              </>
            )}
          </div>

          {/* 4. 跟打实时输入槽 (Active Typing Line) */}
          <div className="relative w-full max-w-sm mx-auto">
            <div
              className={`h-14 flex items-center justify-center font-mono text-3xl font-bold rounded-xl border px-4 transition-all ${
                hasTypo
                  ? 'border-destructive bg-destructive/15 text-destructive animate-shake'
                  : 'border-white/10 bg-white/[0.03] text-primary'
              }`}
            >
              {/* 未输入时光标落在居中内容的左侧，输入后跟在文字末尾 */}
              {currentInput && <span className="mr-1">{currentInput}</span>}
              <span className="inline-block w-0.5 h-7 bg-primary animate-cursor shrink-0" />
              {!currentInput && (
                <span className="ml-3 text-base text-muted-foreground font-normal">敲击键盘开始跟练...</span>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ========================================================= */
        /* B. 模式 2：纯盲打默写模式 (Blind Dictation Mode)          */
        /* ========================================================= */
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          {/* 1. 巨型发音喇叭 */}
          <button
            onClick={speak}
            className="size-20 rounded-3xl bg-primary/15 border border-primary/40 flex items-center justify-center text-primary hover:scale-105 transition-all shadow-[0_0_24px_rgb(var(--primary-rgb)/0.3)] group"
            title="发音 (Ctrl+J)"
          >
            <Volume2 className="size-10 group-hover:scale-110 transition-transform" />
          </button>

          {/* 2. 中文释义（固定预留两行，切换译文时不撑动布局）
              音标会直接暴露拼写线索，默写模式下不展示 */}
          <div className="h-14 flex items-center justify-center">
            {isTranslationVisible ? (
              <p className="text-xl font-bold text-white max-w-md line-clamp-2 leading-7">{meaningText}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">[ 纯听音默写模式 ]</p>
            )}
          </div>

          {/* 3. 按住 Tab 偷看答案（定高占位，出现/消失不撑动布局） */}
          <div className="h-9 flex items-center justify-center">
            {isPeeking && (
              <span className="font-mono text-2xl font-bold tracking-widest text-accent px-4 py-1 rounded-lg bg-accent/10 border border-accent/30">
                {word.name}
              </span>
            )}
          </div>

          {/* 4. 盲打下划线与实时光标 */}
          <div className="w-full max-w-sm space-y-2 pt-2">
            <div
              className={`h-14 flex items-center justify-center tracking-widest font-mono text-2xl font-bold rounded-xl border px-4 transition-all ${
                hasTypo
                  ? 'border-destructive bg-destructive/15 text-destructive animate-shake'
                  : 'border-primary/40 bg-white/[0.04] text-primary'
              }`}
            >
              {/* 未输入时光标落在下划线左侧，输入后跟在文字末尾 */}
              {currentInput && <span className="mr-1.5">{currentInput}</span>}
              <span className="inline-block w-0.5 h-7 bg-primary animate-cursor shrink-0" />
              {!currentInput && (
                <span className="ml-1.5 text-muted-foreground/60 text-base tracking-normal font-normal">
                  {Array(word.name.length).fill('_').join(' ')}
                </span>
              )}
            </div>

            <div className="h-9">
              {hasTypo && (
                <div className="flex items-center justify-center gap-1.5 h-full text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertTriangle className="size-4" />
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
