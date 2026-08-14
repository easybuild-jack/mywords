'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import type { WordItem } from '@/types'
import { splitIntoMorphemes, MORPHEME_ROLE_LABEL } from '@/lib/syllables'
import { splitIntoGraphemes, type GraphemeKind, type GraphemeSegment } from '@/lib/graphemes'
import { pickPhonetic, formatMeaningText } from '@/lib/wordDisplay'
import { WordCardShell } from '@/components/typing/WordCardShell'

interface LearnCardProps {
  word: WordItem
  currentInput: string
  hasTypo: boolean
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

/** 长单词按字数降档，避免撑破卡片 */
function wordSizeClass(length: number) {
  if (length <= 8) return 'text-6xl'
  if (length <= 12) return 'text-5xl'
  return 'text-4xl'
}

/** 四类字母组合在界面上共用一套黄色，不按类别再分色 */
const COMBO_KINDS = new Set<GraphemeKind>([
  'vowel-team',
  'r-controlled',
  'consonant-digraph',
  'suffix-chunk',
])

/**
 * 相邻的组合交替取这两档黄，靠深浅区分边界。shorts 的 sh 和 or 紧挨着，
 * 同色会连成一片、看不出是两个单位还是一个 shor；这样字距不用动。
 * 第二档取更浅而不是更暗，避免看着像被禁用、地位低一等。
 */
const COMBO_TONES = ['text-accent', 'text-[#FDE68A]']

function isCombo(segment: GraphemeSegment | undefined): boolean {
  return segment !== undefined && COMBO_KINDS.has(segment.kind)
}

/**
 * 往左数连续相邻的组合个数来决定取哪一档。
 * 孤立的组合数到 0，一律取第一档，所以 with 这类只有一个组合的词配色始终稳定。
 */
function comboToneIndex(segments: GraphemeSegment[], index: number): number {
  let run = 0
  for (let i = index - 1; i >= 0 && isCombo(segments[i]); i--) run++

  return run % COMBO_TONES.length
}

function segmentClass(segments: GraphemeSegment[], index: number): string | undefined {
  const segment = segments[index]

  if (!isCombo(segment)) {
    return segment.kind === 'vowel' ? 'text-primary' : undefined
  }

  return COMBO_TONES[comboToneIndex(segments, index)]
}

/** 逐段渲染单词：固定发音的字母组合整组标黄，落单的元音标绿，辅音沿用外层白色 */
function MarkedWord({ name }: { name: string }) {
  const segments = splitIntoGraphemes(name)

  return (
    <>
      {segments.map((segment, index) => (
        <span key={index} className={segmentClass(segments, index)}>
          {segment.text}
        </span>
      ))}
    </>
  )
}

/** 跟学卡片：单词、音标、释义、构词法拆解与跟打输入槽全部常驻可见 */
export function LearnCard({
  word,
  currentInput,
  hasTypo,
  phoneticPreference,
  remainingLoops = 1,
}: LearnCardProps) {
  const phonetic = pickPhonetic(word, phoneticPreference)
  const meaningText = formatMeaningText(word)
  const morphemes = splitIntoMorphemes(word)

  return (
    <WordCardShell word={word} phoneticPreference={phoneticPreference} remainingLoops={remainingLoops}>
      {/* 1. 音标 + 单词 + 释义 */}
      <div className="space-y-1 pt-0">
        <p className="font-mono text-2xl tracking-wide text-gray-300">{phonetic}</p>
        <h2
          className={`${wordSizeClass(word.name.length)} font-extrabold tracking-tight text-white font-mono leading-tight`}
        >
          <MarkedWord name={word.name} />
        </h2>
        <div className="h-10 flex items-center justify-center">
          <p className="text-sm sm:text-base text-[#9CA3AF] line-clamp-2 font-medium leading-relaxed">
            {meaningText}
          </p>
        </div>
      </div>

      {/* 2. 构词法切分：前缀 + 词根 + 后缀，跟打进度按段点亮 */}
      <div className="flex items-end justify-center gap-3 flex-wrap">
        {morphemes.map((morpheme, index) => {
          const startIdx = morphemes.slice(0, index).reduce((sum, m) => sum + m.text.length, 0)
          const endIdx = startIdx + morpheme.text.length
          const isCompleted = currentInput.length >= endIdx
          const isCurrent = currentInput.length >= startIdx && currentInput.length < endIdx

          return (
            <React.Fragment key={index}>
              {/* 撑满整行再居中：色块高度随有无释义变化，写死的边距会让 + 忽高忽低 */}
              {index > 0 && (
                <span className="self-stretch flex items-center text-2xl text-gray-400 font-mono font-bold">
                  +
                </span>
              )}
              <div
                className={`px-4 py-3 rounded-2xl border transition-all duration-200 min-w-22 ${
                  isCurrent
                    ? 'border-[#F05F5A] bg-[#F05F5A]/25 shadow-[0_0_20px_rgba(240,95,90,0.4)] scale-105'
                    : isCompleted
                    ? 'border-primary bg-primary/20 shadow-[0_0_16px_rgb(var(--primary-rgb)/0.2)]'
                    : 'border-white/20 bg-white/[0.08]'
                }`}
              >
                <div
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isCurrent ? 'text-[#FFA8A3]' : isCompleted ? 'text-primary' : 'text-gray-300'
                  }`}
                >
                  {MORPHEME_ROLE_LABEL[morpheme.role]}
                </div>
                <div
                  className={`font-mono text-3xl font-bold my-1 ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-primary' : 'text-white'
                  }`}
                >
                  {morpheme.text}
                </div>
                {morpheme.meaning && (
                  <div
                    className={`text-sm font-medium max-w-32 leading-tight ${
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
            <span className="ml-3 text-lg text-muted-foreground/70 font-normal font-sans">
              敲击键盘开始跟练...
            </span>
          )}
        </div>
      </div>
    </WordCardShell>
  )
}
