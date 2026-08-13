'use client'

import React from 'react'
import {
  AlertTriangle,
  Check,
  ToggleLeft,
  ToggleRight,
  Keyboard,
  FileText,
  Lock,
} from 'lucide-react'
import type { DictationCueMode, WordItem } from '@/types'
import { formatMeaningText } from '@/lib/wordDisplay'
import { isMeaningStepActive } from '@/lib/dictationCue'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { WordCardShell } from '@/components/typing/WordCardShell'

interface DictationCardProps {
  word: WordItem
  currentInput: string
  hasTypo: boolean
  isPeeking: boolean
  cueMode: DictationCueMode
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

/**
 * 默写卡片：英文全部遮蔽，按「音标 → 译文 → 拼写」三级闯关推进。
 *
 * 顶部线索由 cueMode 决定：听音模式只给发音、隐藏中文；
 * 看译文模式只给中文、全程静音，并且撤掉译文输入这一级（写它等于照抄）。
 */
export function DictationCard({
  word,
  currentInput,
  hasTypo,
  isPeeking,
  cueMode,
  phoneticPreference,
  remainingLoops = 1,
}: DictationCardProps) {
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
    isPhoneticError,
    isMeaningError,
  } = useWorkspaceStore()

  const meaningText = formatMeaningText(word)

  const isMeaningStepEnabled = isMeaningStepActive(cueMode, isDictationMeaningEnabled)

  // 拼写槽激活条件：开启的前置环节必须全部通过
  const isSpellingUnlocked =
    (!isDictationPhoneticEnabled || isPhoneticPassed) && (!isMeaningStepEnabled || isMeaningPassed)

  // 释义可能很长，输入框是多行文本域，但回车仍然是校验而不是换行
  const handleMeaningSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitMeaning()
    }
  }

  const handlePhoneticSlotClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isPhoneticPassed) {
      setIsPhoneticFocused(true)
    }
  }

  return (
    <WordCardShell
      word={word}
      phoneticPreference={phoneticPreference}
      remainingLoops={remainingLoops}
      allowAudio={cueMode === 'listen'}
    >
      <div className="flex flex-col h-full py-1">
        {/*
          顶部线索槽：高度固定，听音模式留空也不塌陷，两个模式下方的排版才完全一致。
          偷看出来的单词也占这一格，避免它把下面的输入阶梯顶下去。
          pt-8 是为了让长释义避开左上角那枚绝对定位的 Again 角标。
        */}
        <div className="h-32 shrink-0 flex items-center justify-center px-6 pt-8">
          {isPeeking ? (
            <span className="font-mono text-2xl font-bold tracking-widest text-accent px-4 py-0.5 rounded-lg bg-accent/10 border border-accent/30">
              {word.name}
            </span>
          ) : cueMode === 'meaning' ? (
            <p className="max-w-lg text-base font-bold text-white line-clamp-3 leading-relaxed text-center">
              {meaningText}
            </p>
          ) : null}
        </div>

        {/* 模式提示：常驻自己这一行，只有文案变化，位置与高度都不动 */}
        <div className="h-6 shrink-0 flex items-center justify-center px-4">
          <span className="text-xs text-muted-foreground/80 font-mono">
            {cueMode === 'listen' ? '[ 听音默写 · 释义已隐藏 ]' : '[ 看译文默写 · 全程静音 ]'}
          </span>
        </div>

        {/* 中间主要输入阶梯区 */}
        <div className="w-full max-w-lg mx-auto space-y-3.5 flex-1 flex flex-col justify-center">
          {/* 第一级：音标点选输入行 */}
          <div className="flex items-center gap-2.5">
            <div
              onClick={handlePhoneticSlotClick}
              className={`flex-1 h-12 rounded-2xl border px-3.5 flex items-center justify-between transition-all duration-200 cursor-pointer ${!isDictationPhoneticEnabled
                ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                : isPhoneticPassed
                  ? 'border-primary/60 bg-primary/10 shadow-[0_0_16px_rgb(var(--primary-rgb)/0.2)]'
                  : isPhoneticError
                    ? 'border-destructive bg-destructive/15 animate-shake'
                    : isPhoneticFocused
                      ? 'border-primary bg-white/[0.06] shadow-[0_0_20px_rgb(var(--primary-rgb)/0.25)] ring-1 ring-primary/50'
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
                      submitPhonetic()
                    }}
                    className="text-[11px] font-semibold px-2 py-1 rounded-md bg-white/[0.08] hover:bg-primary hover:text-[#0B0C0E] text-gray-300 transition-all cursor-pointer"
                  >
                    校验
                  </button>
                ) : null}
              </div>
            </div>

            {/* 音标环节独立开关 */}
            <button
              type="button"
              onClick={() => toggleDictationPhonetic()}
              className={`h-12 px-2.5 rounded-2xl border flex items-center justify-center gap-1 text-xs transition-all cursor-pointer shrink-0 ${isDictationPhoneticEnabled
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

          {/* 第二级：中文译文输入行。看译文模式下释义已摆在顶部，这一级整体撤掉 */}
          {cueMode === 'listen' && (
            <div className="flex items-center gap-2.5">
              <div
                className={`flex-1 h-24 rounded-2xl border px-3.5 py-2.5 flex items-start justify-between transition-all duration-200 ${!isDictationMeaningEnabled
                  ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                  : isMeaningPassed
                    ? 'border-primary/60 bg-primary/10 shadow-[0_0_16px_rgb(var(--primary-rgb)/0.2)]'
                    : isMeaningError
                      ? 'border-destructive bg-destructive/15 animate-shake'
                      : 'border-white/15 bg-white/[0.04] focus-within:border-primary focus-within:bg-white/[0.06] focus-within:shadow-[0_0_20px_rgb(var(--primary-rgb)/0.25)]'
                  }`}
              >
                <div className="flex items-start gap-2 flex-1 min-w-0 mr-2 h-full">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0 pt-0.5">
                    <FileText className="size-3.5 text-accent/80" />
                    <span>译文</span>
                  </span>
                  {isMeaningPassed ? (
                    <span className="text-sm font-semibold text-primary text-left line-clamp-3 leading-relaxed">
                      {dictationMeaningInput}
                    </span>
                  ) : (
                    <textarea
                      rows={3}
                      disabled={!isDictationMeaningEnabled}
                      value={dictationMeaningInput}
                      onChange={(e) => setDictationMeaningInput(e.target.value)}
                      onKeyDown={handleMeaningSubmit}
                      placeholder={
                        isDictationMeaningEnabled ? '输入中文释义（部分即可），按回车校验...' : '已关闭译文输入'
                      }
                      className="w-full h-full resize-none bg-transparent border-none text-sm leading-relaxed text-white placeholder:text-muted-foreground/60 focus:outline-none font-sans"
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
                      onClick={() => submitMeaning()}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md bg-white/[0.08] hover:bg-primary hover:text-[#0B0C0E] text-gray-300 transition-all cursor-pointer"
                    >
                      回车/校验
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 译文环节独立开关 */}
              <button
                type="button"
                onClick={() => toggleDictationMeaning()}
                className={`h-12 px-2.5 rounded-2xl border flex items-center justify-center gap-1 text-xs transition-all cursor-pointer shrink-0 ${isDictationMeaningEnabled
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
          )}

          {/* 第三级：单词拼写盲打槽，前置完成后激活 */}
          <div className="relative w-full">
            <div
              className={`h-16 flex items-center justify-center tracking-widest font-mono text-3xl font-bold rounded-2xl border px-5 transition-all shadow-inner ${!isSpellingUnlocked
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
                    {!isPhoneticPassed && isDictationPhoneticEnabled && !isMeaningPassed && isMeaningStepEnabled
                      ? '与'
                      : ''}
                    {!isMeaningPassed && isMeaningStepEnabled ? '译文' : ''}
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
    </WordCardShell>
  )
}
