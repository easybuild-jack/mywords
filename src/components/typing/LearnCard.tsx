'use client'

import React, { useState } from 'react'
import { ArrowRight, Scissors, Combine } from 'lucide-react'
import type { WordItem } from '@/types'
import { splitIntoMorphemes, MORPHEME_ROLE_LABEL, resolveSyllables } from '@/lib/syllables'
import { splitIntoGraphemes, type GraphemeKind, type GraphemeSegment } from '@/lib/graphemes'
import { listPhonetics, formatMeaningText } from '@/lib/wordDisplay'
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

  if (segment?.kind === 'silent-e') {
    return 'text-gray-400'
  }

  if (!isCombo(segment)) {
    return segment.kind === 'vowel' ? 'text-primary' : undefined
  }

  return COMBO_TONES[comboToneIndex(segments, index)]
}

/** 逐段渲染单词：固定发音的字母组合整组标黄，落单的元音标绿，辅音沿用外层白色，不发音的词尾哑音e标灰 */
function MarkedWord({ word }: { word: WordItem }) {
  const segments = splitIntoGraphemes(word.name, resolveSyllables(word))

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

/** 按音节切分逐段渲染单词 */
function MarkedSplitWord({ word, syllables }: { word: WordItem; syllables: string[] }) {
  const allSegments = splitIntoGraphemes(word.name, resolveSyllables(word))

  let currentOffset = 0
  const syllableGroups: GraphemeSegment[][] = []

  for (const syl of syllables) {
    const sylLen = syl.length
    let accumulated = 0
    const currentSylSegments: GraphemeSegment[] = []

    while (currentOffset < allSegments.length && accumulated < sylLen) {
      const seg = allSegments[currentOffset]
      currentSylSegments.push(seg)
      accumulated += seg.text.length
      currentOffset++
    }
    syllableGroups.push(currentSylSegments)
  }

  return (
    <>
      {syllableGroups.map((group, sIdx) => (
        <React.Fragment key={sIdx}>
          {sIdx > 0 && (
            <span className="text-gray-500 font-normal select-none px-1">·</span>
          )}
          <span className="inline-block">
            {group.map((segment, index) => (
              <span key={index} className={segmentClass(group, index)}>
                {segment.text}
              </span>
            ))}
          </span>
        </React.Fragment>
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
  const [isSplit, setIsSplit] = useState(false)
  const phonetics = listPhonetics(word)
  const meaningText = formatMeaningText(word)
  const morphemes = splitIntoMorphemes(word)

  const hasMultipleSyllables = Array.isArray(word.syllables) && word.syllables.length > 1
  // 切分模式只插入 · 视觉分隔符，不计入长度 —— 否则单词一切分就掉一档字号，与原词不一致
  const displayLength = word.name.length

  const hasEtymology = Boolean(
    word.etymology && (
      morphemes.length > 0 ||
      word.etymology.prefix ||
      word.etymology.root ||
      word.etymology.suffix ||
      word.etymology.derivation
    )
  )

  return (
    <WordCardShell word={word} phoneticPreference={phoneticPreference} remainingLoops={remainingLoops}>
      {/*
        上半区（音标 + 单词 + 释义 + 输入槽）四行高度全部写死：h-9 / h-20 / h-16 / h-16。
        外壳是 justify-between，只要这一块总高恒定，输入框就钉在同一个纵向位置上，
        既不会因为单词长短换字号而移动，也不会被下方色块的高低挤上挤下。
      */}
      <div>
        <div className="space-y-1">
          {/* 并列两条音标时字号降一档，不锁死高度会让下面的单词随词上下跳 */}
          <div className="h-9 flex items-center justify-center gap-x-5">
            {phonetics.map((entry) => (
              <span key={entry.label ?? 'single'} className="inline-flex items-baseline gap-1.5">
                {entry.label && (
                  <span className="font-sans text-xs font-semibold text-[#6B7280]">{entry.label}</span>
                )}
                <span
                  className={`font-mono tracking-wide text-gray-300 ${
                    phonetics.length > 1 ? 'text-xl' : 'text-2xl'
                  }`}
                >
                  {entry.text}
                </span>
              </span>
            ))}
          </div>
          {/* 长单词会降字号，套一层定高容器再居中，字号变化就不会顶动下面的输入框 */}
          <div className="h-20 flex items-center justify-center relative">
            <div className="inline-flex items-center justify-center gap-2.5 sm:gap-3">
              <h2
                className={`${wordSizeClass(displayLength)} font-extrabold tracking-tight text-white font-mono leading-tight`}
              >
                {isSplit && hasMultipleSyllables ? (
                  <MarkedSplitWord word={word} syllables={word.syllables} />
                ) : (
                  <MarkedWord word={word} />
                )}
              </h2>
              <button
                type="button"
                onClick={() => setIsSplit((prev) => !prev)}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isSplit
                    ? 'border-primary/50 bg-primary/15 text-primary shadow-[0_0_12px_rgb(var(--primary-rgb)/0.2)]'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                }`}
                title={isSplit ? '合并单词' : '音节切分'}
                aria-label={isSplit ? '合并单词' : '音节切分'}
              >
                {isSplit ? <Combine className="size-4 sm:size-5" /> : <Scissors className="size-4 sm:size-5" />}
              </button>
            </div>
          </div>
          {/* 按两行译文预留高度（text-lg 配 leading-relaxed 单行约 29px，h-16 刚好装两行），
              并统一从顶部起排：一行、两行的释义都落在同一个位置，
              输入框既不会被行数顶动，也不会紧贴单词 */}
          <div className="h-16 flex items-start justify-center">
            <p className="text-base sm:text-lg text-[#9CA3AF] line-clamp-2 font-medium leading-relaxed">
              {meaningText}
            </p>
          </div>
        </div>

        {/* 跟打输入槽：外框用 primary 色（响应皮肤），光晕颜色由 var(--primary-rgb) 拼出，
            靠更高的饱和度与明度拉开层次，所以透明度要压住，否则框会比字还抢眼。
            框内下划线只铺剩余字母，敲一个顶掉一个，打字途中底线不消失。
            overflow-hidden 兜住超长词：48px 字号下约 17 个字母就到边，宁可裁掉尾巴也别撑破框。
            槽位仍是 h-16，字号变化不会动到输入框的纵向位置。
            这一整套样式与默写页的拼写槽保持一致，改动要两边同步 */}
        <div className="relative w-full pt-6">
          <div
            className={`h-16 flex items-center justify-center overflow-hidden tracking-widest font-mono text-5xl font-bold rounded-2xl border-2 px-6 transition-all ${
              hasTypo
                ? 'border-destructive bg-destructive/10 text-destructive animate-shake'
                : 'border-primary/45 bg-primary/[0.05] text-primary shadow-[0_0_24px_rgb(var(--primary-rgb)/0.16)]'
            }`}
          >
            {currentInput && <span className="mr-1">{currentInput}</span>}
            <span
              className={`inline-block w-0.5 h-11 animate-cursor shrink-0 ${
                hasTypo ? 'bg-destructive' : 'bg-primary'
              }`}
            />
            <span
              className={`ml-1 font-normal ${
                hasTypo ? 'text-destructive/40' : 'text-primary/35'
              }`}
            >
              {'_'.repeat(Math.max(0, word.name.length - currentInput.length))}
            </span>
          </div>
        </div>
      </div>

      {/* 下半区：构词法拆解讲解 / 基础单词 */}
      <div className="space-y-3 mb-4 min-h-[104px] flex flex-col justify-center">
        {hasEtymology ? (
          <>
            {morphemes.length > 0 && (
              <div className="flex items-stretch justify-center gap-3 flex-wrap">
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
            )}

            {/* 词根语义推导说明：跟在拆分色块后面，一起构成最下方的拆分讲解 */}
            <div className="h-7 flex items-center justify-center gap-2 text-sm sm:text-base text-[#9CA3AF] font-medium leading-relaxed">
              {word.etymology?.derivation && (
                <>
                  <ArrowRight className="size-4 text-[#F05F5A]/80 shrink-0" />
                  <span className="min-w-0 truncate text-[#9CA3AF] font-medium">
                    {word.etymology.derivation}
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="h-[104px] flex flex-col items-center justify-center">
            <div className="px-6 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] text-gray-400 font-medium text-sm sm:text-base flex items-center gap-2 select-none">
              <span className="size-2 rounded-full bg-primary/40 inline-block" />
              <span>基础单词</span>
            </div>
          </div>
        )}
      </div>
    </WordCardShell>
  )
}
