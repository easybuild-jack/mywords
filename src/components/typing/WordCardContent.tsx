'use client'

import React, { useState } from 'react'
import {
  Volume2,
  AlertTriangle,
  ArrowRight,
  Check,
  ToggleLeft,
  ToggleRight,
  Keyboard,
  FileText,
  Lock,
} from 'lucide-react'
import type { WordItem, PracticeMode } from '@/types'
import { audioEngine } from '@/core/audioEngine'
import { splitIntoMorphemes, MORPHEME_ROLE_LABEL } from '@/lib/syllables'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

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
  const {
    isDictationPhoneticEnabled,
    toggleDictationPhonetic,
    dictationPhoneticInput,
    isPhoneticPassed,
    submitPhonetic,
    isPhoneticFocused,
    setIsPhoneticFocused,
    isDictationMeaningEnabled,
    toggleDictationMeaning,
    dictationMeaningInput,
    setDictationMeaningInput,
    isMeaningPassed,
    submitMeaning,
  } = useWorkspaceStore()

  const [phoneticError, setPhoneticError] = useState(false)
  const [meaningError, setMeaningError] = useState(false)

  const phonetic = phoneticPreference === 'uk' ? word.phoneticUk || word.phoneticUs : word.phoneticUs || word.phoneticUk
  const meaningText = word.posList?.map((p) => `${p.pos} ${p.means.join('； ')}`).join('  ') || ''

  const morphemes = splitIntoMorphemes(word)

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation()
    audioEngine.playPronunciation(word.name, phoneticPreference)
  }

  // 默写模式下拼写槽激活条件：开启的前置环节必须全部通过
  const isSpellingUnlocked =
    (!isDictationPhoneticEnabled || isPhoneticPassed) &&
    (!isDictationMeaningEnabled || isMeaningPassed)

  const handleMeaningSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const passed = submitMeaning()
      if (!passed) {
        setMeaningError(true)
        setTimeout(() => setMeaningError(false), 900)
      }
    }
  }

  const handlePhoneticSlotClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isPhoneticPassed) {
      setIsPhoneticFocused(true)
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between pt-5 pb-6 px-8 text-center select-none">
      {/* 1. 发音按钮 */}
      <button
        onClick={speak}
        className="absolute top-4 right-4 size-10 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/20 transition-all z-10 cursor-pointer"
        title="发音 (Ctrl+J)"
      >
        <Volume2 className="size-4.5" />
      </button>

      {/* 2. 循环剩余次数角标 */}
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
          {/* 1. 音标 + 单词 + 释义 */}
          <div className="space-y-1 pt-0">
            <p className="font-mono text-2xl tracking-wide text-gray-300">{phonetic}</p>
            <h2 className={`${wordSizeClass(word.name.length)} font-extrabold tracking-tight text-white font-mono leading-tight`}>
              {word.name}
            </h2>
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

          {/* 3. 词根语义推导说明 */}
          <div className="h-7 flex items-center justify-center gap-2 text-sm sm:text-base text-[#9CA3AF] font-medium leading-relaxed">
            {word.etymology?.derivation && (
              <>
                <ArrowRight className="size-4 text-[#F05F5A]/80 shrink-0" />
                <span className="min-w-0 truncate text-[#9CA3AF] font-medium">{word.etymology.derivation}</span>
              </>
            )}
          </div>

          {/* 4. 跟打实时输入槽 */}
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
        /* B. 模式 2：纯盲打默写模式 (Blind Dictation Mode) - 3 层布局 */
        /* ========================================================= */
        <div className="flex flex-col justify-between h-full py-1 space-y-4">
          {/* 顶部：偷看提示或发音提示区域 */}
          <div className="h-8 flex items-center justify-center">
            {isPeeking ? (
              <span className="font-mono text-2xl font-bold tracking-widest text-accent px-4 py-0.5 rounded-lg bg-accent/10 border border-accent/30">
                {word.name}
              </span>
            ) : isTranslationVisible ? (
              <p className="text-sm font-semibold text-gray-300 max-w-lg truncate leading-relaxed">
                {meaningText}
              </p>
            ) : (
              <span className="text-xs text-muted-foreground/80 font-mono">
                [ 听音默写模式 · 按 Tab 偷看 ]
              </span>
            )}
          </div>

          {/* 中间主要输入阶梯区 */}
          <div className="w-full max-w-lg mx-auto space-y-3.5 flex-1 flex flex-col justify-center">
            {/* -------------------------------------------------- */}
            {/* 第一行：音标点选输入行                             */}
            {/* -------------------------------------------------- */}
            <div className="flex items-center gap-2.5">
              <div
                onClick={handlePhoneticSlotClick}
                className={`flex-1 h-12 rounded-2xl border px-3.5 flex items-center justify-between transition-all duration-200 cursor-pointer ${
                  !isDictationPhoneticEnabled
                    ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                    : isPhoneticPassed
                    ? 'border-primary/60 bg-primary/10 shadow-[0_0_16px_rgb(var(--primary-rgb)/0.2)]'
                    : isPhoneticFocused
                    ? 'border-primary bg-white/[0.06] shadow-[0_0_20px_rgb(var(--primary-rgb)/0.25)] ring-1 ring-primary/50'
                    : phoneticError
                    ? 'border-destructive bg-destructive/15 animate-shake'
                    : 'border-white/15 bg-white/[0.04] hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <Keyboard className="size-3.5 text-primary/80" />
                    <span>音标</span>
                  </span>
                  <div className="font-mono text-base font-bold text-white truncate text-left">
                    {dictationPhoneticInput ? (
                      <span className="text-primary tracking-wider">/{dictationPhoneticInput}/</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 font-sans font-normal">
                        {isDictationPhoneticEnabled ? '点击点选音标符号...' : '已关闭音标输入'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isPhoneticPassed ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-md border border-primary/30">
                      <Check className="size-3" />
                      <span>通过</span>
                    </span>
                  ) : isDictationPhoneticEnabled ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const passed = submitPhonetic()
                        if (!passed) {
                          setPhoneticError(true)
                          setTimeout(() => setPhoneticError(false), 900)
                        }
                      }}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md bg-white/[0.08] hover:bg-primary hover:text-[#0B0C0E] text-gray-300 transition-all cursor-pointer"
                    >
                      校验
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 音标独立开关 */}
              <button
                type="button"
                onClick={() => toggleDictationPhonetic()}
                className={`h-12 px-2.5 rounded-2xl border flex items-center justify-center gap-1 text-xs transition-all cursor-pointer shrink-0 ${
                  isDictationPhoneticEnabled
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-white/10 bg-white/[0.04] text-muted-foreground hover:text-white'
                }`}
                title={isDictationPhoneticEnabled ? '点击关闭音标输入环节' : '点击开启音标输入环节'}
              >
                {isDictationPhoneticEnabled ? (
                  <ToggleRight className="size-5" />
                ) : (
                  <ToggleLeft className="size-5" />
                )}
              </button>
            </div>

            {/* -------------------------------------------------- */}
            {/* 第二行：中文译文输入行                             */}
            {/* -------------------------------------------------- */}
            <div className="flex items-center gap-2.5">
              <div
                className={`flex-1 h-12 rounded-2xl border px-3.5 flex items-center justify-between transition-all duration-200 ${
                  !isDictationMeaningEnabled
                    ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                    : isMeaningPassed
                    ? 'border-primary/60 bg-primary/10 shadow-[0_0_16px_rgb(var(--primary-rgb)/0.2)]'
                    : meaningError
                    ? 'border-destructive bg-destructive/15 animate-shake'
                    : 'border-white/15 bg-white/[0.04] focus-within:border-primary focus-within:bg-white/[0.06] focus-within:shadow-[0_0_20px_rgb(var(--primary-rgb)/0.25)]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <FileText className="size-3.5 text-accent/80" />
                    <span>译文</span>
                  </span>
                  {isMeaningPassed ? (
                    <span className="text-sm font-semibold text-primary truncate text-left">
                      {dictationMeaningInput}
                    </span>
                  ) : (
                    <input
                      type="text"
                      disabled={!isDictationMeaningEnabled}
                      value={dictationMeaningInput}
                      onChange={(e) => setDictationMeaningInput(e.target.value)}
                      onKeyDown={handleMeaningSubmit}
                      placeholder={
                        isDictationMeaningEnabled
                          ? '输入中文释义（部分即可），按回车校验...'
                          : '已关闭译文输入'
                      }
                      className="w-full bg-transparent border-none text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none font-sans"
                    />
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isMeaningPassed ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-md border border-primary/30">
                      <Check className="size-3" />
                      <span>通过</span>
                    </span>
                  ) : isDictationMeaningEnabled ? (
                    <button
                      type="button"
                      onClick={() => {
                        const passed = submitMeaning()
                        if (!passed) {
                          setMeaningError(true)
                          setTimeout(() => setMeaningError(false), 900)
                        }
                      }}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md bg-white/[0.08] hover:bg-primary hover:text-[#0B0C0E] text-gray-300 transition-all cursor-pointer"
                    >
                      回车/校验
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 译文独立开关 */}
              <button
                type="button"
                onClick={() => toggleDictationMeaning()}
                className={`h-12 px-2.5 rounded-2xl border flex items-center justify-center gap-1 text-xs transition-all cursor-pointer shrink-0 ${
                  isDictationMeaningEnabled
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-white/10 bg-white/[0.04] text-muted-foreground hover:text-white'
                }`}
                title={isDictationMeaningEnabled ? '点击关闭译文输入环节' : '点击开启译文输入环节'}
              >
                {isDictationMeaningEnabled ? (
                  <ToggleRight className="size-5" />
                ) : (
                  <ToggleLeft className="size-5" />
                )}
              </button>
            </div>

            {/* -------------------------------------------------- */}
            {/* 第三行：单词拼写盲打槽 (现有功能，前置完成后激活)     */}
            {/* -------------------------------------------------- */}
            <div className="relative w-full">
              <div
                className={`h-16 flex items-center justify-center tracking-widest font-mono text-3xl font-bold rounded-2xl border px-5 transition-all shadow-inner ${
                  !isSpellingUnlocked
                    ? 'border-white/10 bg-white/[0.02] text-muted-foreground/50 opacity-60'
                    : hasTypo
                    ? 'border-destructive bg-destructive/15 text-destructive animate-shake'
                    : 'border-primary/40 bg-white/[0.04] text-primary shadow-[0_0_20px_rgba(0,0,0,0.2)]'
                }`}
              >
                {!isSpellingUnlocked ? (
                  <div className="flex items-center gap-2 text-sm font-sans font-normal text-muted-foreground">
                    <Lock className="size-4 text-accent/80" />
                    <span>
                      请先完成上方
                      {!isPhoneticPassed && isDictationPhoneticEnabled ? '音标' : ''}
                      {!isPhoneticPassed && isDictationPhoneticEnabled && !isMeaningPassed && isDictationMeaningEnabled ? '与' : ''}
                      {!isMeaningPassed && isDictationMeaningEnabled ? '译文' : ''}
                      输入后开启拼写
                    </span>
                  </div>
                ) : (
                  <>
                    {currentInput && <span className="mr-2">{currentInput}</span>}
                    <span className="inline-block w-0.5 h-8 bg-primary animate-cursor shrink-0" />
                    {!currentInput && (
                      <span className="ml-2 text-muted-foreground/60 text-xl tracking-widest font-normal font-mono">
                        {Array(word.name.length).fill('_').join(' ')}
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="h-6 mt-1.5">
                {hasTypo && (
                  <div className="flex items-center justify-center gap-1.5 h-full text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertTriangle className="size-3.5" />
                    <span>拼写错误，已重置重试</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
