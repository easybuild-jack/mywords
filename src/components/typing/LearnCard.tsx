'use client'

import React, { useState } from 'react'
import { ArrowRight, Scissors, Combine, BookOpen, Quote, Lightbulb } from 'lucide-react'
import type { WordItem } from '@/types'
import { splitIntoMorphemes, MORPHEME_ROLE_LABEL, resolveSyllables } from '@/lib/syllables'
import { splitIntoGraphemes, type GraphemeKind, type GraphemeSegment } from '@/lib/graphemes'
import { listPhonetics, formatMeaningText } from '@/lib/wordDisplay'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { getWordExamples, getWordEtymologyExtras } from '@/lib/wordExamples'

interface LearnCardProps {
  word: WordItem
  currentInput: string
  hasTypo: boolean
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

/** 长单词按字数降档，避免撑破卡片 */
function wordSizeClass(length: number) {
  if (length <= 8) return 'text-5xl sm:text-6xl'
  if (length <= 12) return 'text-4xl sm:text-5xl'
  return 'text-3xl sm:text-4xl'
}

/** 四类字母组合在界面上共用一套黄色，不按类别再分色 */
const COMBO_KINDS = new Set<GraphemeKind>([
  'vowel-team',
  'r-controlled',
  'consonant-digraph',
  'suffix-chunk',
])

const COMBO_TONES = ['text-accent', 'text-[#FDE68A]']

function isCombo(segment: GraphemeSegment | undefined): boolean {
  return segment !== undefined && COMBO_KINDS.has(segment.kind)
}

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

/** 例句中的目标单词高亮渲染 */
function HighlightSentence({ sentence, wordName }: { sentence: string; wordName: string }) {
  const cleanWord = wordName.trim()
  if (!cleanWord) return <span>{sentence}</span>

  // 匹配单词本身或复数/过去式等变形词干
  const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(\\b${escaped}[a-zA-Z]*\\b)`, 'gi')
  const parts = sentence.split(regex)

  return (
    <span className="text-sm text-gray-100 leading-relaxed font-sans">
      {parts.map((part, i) => {
        if (part.toLowerCase().startsWith(cleanWord.toLowerCase())) {
          return (
            <span
              key={i}
              className="text-primary font-bold px-0.5 underline decoration-primary/60 decoration-2 underline-offset-2"
            >
              {part}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

/** 跟学卡片：上半区专注跟打，下半区分栏展示词根词源与2条精选双语例句 */
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
  const displayLength = word.name.length

  // 获取例句与词源扩展数据（2 条）
  const examples = getWordExamples(word)
  const { origin, memoryHook, derivation } = getWordEtymologyExtras(word)

  return (
    <WordCardShell word={word} phoneticPreference={phoneticPreference} remainingLoops={remainingLoops}>
      {/* 上半区（音标 + 单词 + 释义 + 跟打槽） */}
      <div className="space-y-1">
        {/* 音标栏 */}
        <div className="h-8 flex items-center justify-center gap-x-5">
          {phonetics.map((entry) => (
            <span key={entry.label ?? 'single'} className="inline-flex items-baseline gap-1.5">
              {entry.label && (
                <span className="font-sans text-xs font-semibold text-[#6B7280]">{entry.label}</span>
              )}
              <span
                className={`font-mono tracking-wide text-gray-300 ${
                  phonetics.length > 1 ? 'text-lg' : 'text-xl'
                }`}
              >
                {entry.text}
              </span>
            </span>
          ))}
        </div>

        {/* 单词主体展示与音节切分切换 */}
        <div className="h-16 flex items-center justify-center relative">
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
              {isSplit ? <Combine className="size-4" /> : <Scissors className="size-4" />}
            </button>
          </div>
        </div>

        {/* 单词释义 */}
        <div className="h-9 flex items-center justify-center px-4">
          <p className="text-sm sm:text-base text-gray-300 font-medium line-clamp-1">
            {meaningText}
          </p>
        </div>

        {/* 跟打输入槽 */}
        <div className="relative w-full pt-1">
          <div
            className={`h-14 flex items-center justify-center overflow-hidden tracking-widest font-mono text-4xl font-bold rounded-2xl border-2 px-6 transition-all ${
              hasTypo
                ? 'border-destructive bg-destructive/10 text-destructive animate-shake'
                : 'border-primary/45 bg-primary/[0.05] text-primary shadow-[0_0_24px_rgb(var(--primary-rgb)/0.16)]'
            }`}
          >
            {currentInput && <span className="mr-1">{currentInput}</span>}
            <span
              className={`inline-block w-0.5 h-9 animate-cursor shrink-0 ${
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

      {/* 下半区：左右分栏排版（左侧占 8/12 宽幅双语例句；右侧占 4/12 词根词源/助记） */}
      <div className="grid grid-cols-12 gap-3.5 pt-3 flex-1 min-h-0 text-left">
        {/* 左栏：2 条精选双语例句（col-span-8，宽幅排版，文字舒展） */}
        <div className="col-span-8 rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex flex-col justify-between overflow-hidden shadow-inner">
          <div className="space-y-2.5">
            {/* 顶栏小标题 */}
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <Quote className="size-3.5 text-accent" />
                <span className="text-xs font-bold text-white/90">语境双语例句</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold">
                2 EXAMPLES
              </span>
            </div>

            {/* 2 示例句列表（宽幅排版，文字舒展） */}
            <div className="space-y-2.5">
              {examples.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.025] border border-white/5 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="size-5 rounded-lg bg-accent/15 text-accent text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border border-accent/25">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <HighlightSentence sentence={item.en} wordName={word.name} />
                      <div className="text-xs text-gray-400 leading-relaxed mt-1">
                        {item.cn}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右栏：词根词源与构词助记（col-span-4） */}
        <div className="col-span-4 rounded-2xl bg-white/[0.03] border border-white/10 p-4 flex flex-col justify-between overflow-hidden shadow-inner">
          <div className="space-y-3">
            {/* 顶栏小标题 */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="size-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-white/90 truncate">词根 · 助记</span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold shrink-0">
                ROOTS
              </span>
            </div>

            {/* 词根拆解块或词源探究（字号全面放大） */}
            {morphemes.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-stretch justify-start gap-2 flex-wrap">
                  {morphemes.map((morpheme, index) => {
                    const startIdx = morphemes.slice(0, index).reduce((sum, m) => sum + m.text.length, 0)
                    const endIdx = startIdx + morpheme.text.length
                    const isCompleted = currentInput.length >= endIdx
                    const isCurrent = currentInput.length >= startIdx && currentInput.length < endIdx

                    return (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <span className="self-center text-sm text-gray-500 font-mono font-bold">+</span>
                        )}
                        <div
                          className={`px-2.5 py-1.5 rounded-xl border transition-all duration-200 ${
                            isCurrent
                              ? 'border-[#F05F5A] bg-[#F05F5A]/25 shadow-[0_0_12px_rgba(240,95,90,0.4)] scale-105'
                              : isCompleted
                              ? 'border-primary bg-primary/20 shadow-[0_0_10px_rgb(var(--primary-rgb)/0.2)]'
                              : 'border-white/10 bg-white/[0.05]'
                          }`}
                        >
                          <div
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              isCurrent ? 'text-[#FFA8A3]' : isCompleted ? 'text-primary' : 'text-gray-400'
                            }`}
                          >
                            {MORPHEME_ROLE_LABEL[morpheme.role]}
                          </div>
                          <div
                            className={`font-mono text-base font-bold my-0.5 ${
                              isCurrent ? 'text-white' : isCompleted ? 'text-primary' : 'text-white'
                            }`}
                          >
                            {morpheme.text}
                          </div>
                          {morpheme.meaning && (
                            <div className="text-xs text-gray-300 truncate max-w-28">
                              {morpheme.meaning}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>

                {derivation && (
                  <div className="flex items-start gap-2 text-sm text-gray-200 font-normal leading-relaxed pt-1">
                    <ArrowRight className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{derivation}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-left">
                {origin && (
                  <p className="text-sm text-gray-200 leading-relaxed">{origin}</p>
                )}

                {derivation && (
                  <div className="flex items-start gap-2 text-sm text-gray-200 font-normal leading-relaxed pt-1">
                    <ArrowRight className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{derivation}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 联想助记口诀提示条（字号放大） */}
          {memoryHook && (
            <div className="mt-2 text-sm text-accent/95 bg-accent/[0.06] p-3 rounded-xl border border-accent/20 flex items-start gap-2.5">
              <Lightbulb className="size-4.5 text-accent shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{memoryHook}</span>
            </div>
          )}
        </div>
      </div>
    </WordCardShell>
  )
}

