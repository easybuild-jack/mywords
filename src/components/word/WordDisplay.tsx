'use client'

import React, { useState } from 'react'
import { Volume2 } from 'lucide-react'
import type { WordItem } from '@/types'
import { splitIntoMorphemes, resolveSyllables } from '@/lib/syllables'
import { splitIntoGraphemes, type GraphemeKind, type GraphemeSegment } from '@/lib/graphemes'
import { listPhonetics, formatMeaningText } from '@/lib/wordDisplay'
import { getWordExamples, getWordEtymologyExtras } from '@/lib/wordExamples'
import { audioEngine } from '@/core/audioEngine'
import { InteractiveSentence } from '@/components/sentence/InteractiveSentence'
import { WordLookupModal } from '@/components/dictionary/WordLookupModal'

export type WordContextTab = 'examples' | 'phrases'

/** 单词页右上角的文字型操作按钮（音节、修改、生词本） */
export const WORD_HEADER_BUTTON_CLASS =
  'h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-[13px] transition-colors cursor-pointer select-none'

/** 长单词按字数降档，避免撑破版心，大屏下按比例自适应放大 */
export function wordSizeClass(length: number) {
  if (length <= 8) return 'text-6xl sm:text-7xl xl:text-8xl 2xl:text-[6.5rem]'
  if (length <= 12) return 'text-5xl sm:text-6xl xl:text-7xl 2xl:text-[5rem]'
  return 'text-4xl sm:text-5xl xl:text-6xl 2xl:text-[3.75rem]'
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
  if (segment?.kind === 'silent-e' || segment?.kind === 'silent') {
    return 'text-gray-500'
  }
  if (!isCombo(segment)) {
    return segment.kind === 'vowel' ? 'text-primary' : undefined
  }
  return COMBO_TONES[comboToneIndex(segments, index)]
}

/** 逐段渲染单词：固定发音的字母组合整组标黄，落单的元音标主色，辅音沿用正文色，哑音标灰 */
function MarkedWord({ word }: { word: WordItem }) {
  const segments = splitIntoGraphemes(word.name, resolveSyllables(word), word.silentIndices)
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
  const allSegments = splitIntoGraphemes(word.name, syllables, word.silentIndices)
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
          {sIdx > 0 && <span className="text-gray-500 select-none px-[0.08em]">·</span>}
          <span
            className="inline-block syllable-font-light select-none"
            style={{ animationDelay: `${sIdx * 0.6}s` }}
          >
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

/** 衬线大字单词，按拼读规则着色，可切换音节切分 */
export function WordHeadline({ word, isSplit }: { word: WordItem; isSplit: boolean }) {
  return (
    <div className="h-20 sm:h-24 xl:h-28 2xl:h-30 flex items-center justify-center">
      <h2
        className={`${wordSizeClass(word.name.length)} font-serif font-normal tracking-tight text-white leading-none`}
      >
        {isSplit ? (
          <MarkedSplitWord word={word} syllables={resolveSyllables(word)} />
        ) : (
          <MarkedWord word={word} />
        )}
      </h2>
    </div>
  )
}

/** 音标行：点击播放对应口音 */
export function WordPhonetics({
  word,
  phoneticPreference,
}: {
  word: WordItem
  phoneticPreference: 'us' | 'uk'
}) {
  const phonetics = listPhonetics(word)
  return (
    <div className="h-9 mt-2 flex items-center justify-center gap-x-4 xl:gap-x-6">
      {phonetics.map((entry) => (
        <button
          key={entry.label ?? 'single'}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            audioEngine.playPronunciation(
              word.name,
              entry.label === '英' ? 'uk' : entry.label === '美' ? 'us' : phoneticPreference
            )
          }}
          className="group h-9 inline-flex items-center gap-2 px-2.5 rounded-md hover:bg-muted transition-colors cursor-pointer select-none"
          title={`点击播放 ${entry.label ? `${entry.label}音` : ''}读音 (Ctrl+J)`}
        >
          {entry.label && <span className="text-xs text-muted-foreground">{entry.label}</span>}
          <span className="font-serif text-lg xl:text-xl text-gray-300 group-hover:text-white transition-colors leading-none">
            {entry.text}
          </span>
          <Volume2 className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      ))}
    </div>
  )
}

/** 释义行：词性用衬线斜体弱化，释义正文居中 */
export function WordMeaning({ word, className = '' }: { word: WordItem; className?: string }) {
  return (
    <p className={`text-gray-200 line-clamp-2 leading-relaxed text-center max-w-3xl ${className}`}>
      {word.posList?.length
        ? word.posList.map((p, i) => (
            <span key={i} className={i > 0 ? 'ml-5' : undefined}>
              {p.pos && p.pos !== 'other' && (
                <i className="font-serif text-muted-foreground mr-1.5">{p.pos}</i>
              )}
              {p.means.join('；')}
            </span>
          ))
        : formatMeaningText(word)}
    </p>
  )
}

/** 单词页骨架：版式与真实单词页一致，左上角显示当前状态 */
export function WordLayoutSkeleton({
  status,
  showTypingLines = false,
}: {
  status?: React.ReactNode
  showTypingLines?: boolean
}) {
  return (
    <div className="relative w-full h-full flex flex-col select-none pt-12 xl:pt-14 pb-2 overflow-hidden">
      {status && (
        <div className="absolute top-3 left-0 xl:top-4 flex items-center gap-2 text-[13px] text-muted-foreground">
          {status}
        </div>
      )}

      <div className="flex flex-col items-center animate-pulse">
        <div className="h-20 sm:h-24 xl:h-28 2xl:h-30 flex items-center">
          <div className="h-14 xl:h-16 w-64 xl:w-80 rounded-lg bg-muted" />
        </div>
        <div className="mt-2 h-9 flex items-center">
          <div className="h-5 w-32 rounded bg-muted" />
        </div>
        <div className="mt-1 min-h-[48px] xl:min-h-[56px] flex items-center">
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
        {showTypingLines && (
          <div className="mt-3 xl:mt-4 w-full max-w-xl h-16 sm:h-18 xl:h-20 flex flex-col justify-between py-1.5">
            {[0, 1, 2, 3].map((line) => (
              <div key={line} className="border-b border-foreground/10" />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 mt-5 xl:mt-7 border-t border-border flex-1 min-h-0 animate-pulse">
        <div className="col-span-8 pt-5 pr-8 space-y-5">
          <div className="h-4 w-20 rounded bg-muted" />
          {[0, 1].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-5 w-11/12 rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="col-span-4 pt-5 pl-8 border-l border-border space-y-3">
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-7 w-3/5 rounded bg-muted" />
          <div className="h-4 w-4/5 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

interface WordContextPanelsProps {
  word: WordItem
  phoneticPreference: 'us' | 'uk'
  contextTab: WordContextTab
  onContextTabChange: (tab: WordContextTab) => void
  etymologyErrorText: string
}

/** 下半区：左侧例句/短语，右侧构词；用细线分隔，不套卡片 */
export function WordContextPanels({
  word,
  phoneticPreference,
  contextTab,
  onContextTabChange,
  etymologyErrorText,
}: WordContextPanelsProps) {
  const [speakingSentenceIdx, setSpeakingSentenceIdx] = useState<number | null>(null)
  const [lookupWordInfo, setLookupWordInfo] = useState<{
    word: string
    sentenceEn: string
    sentenceCn?: string
    targetRect?: DOMRect
  } | null>(null)

  const morphemes = splitIntoMorphemes(word)
  const etymologyStatus = word.aiSections?.etymology
  const examples =
    word.examples?.length
      ? word.examples
      : word.aiSections?.examples
        ? []
        : getWordExamples(word)
  const phrases = word.phrases || []
  const contextItems = contextTab === 'examples' ? examples : phrases
  const contextStatus =
    contextTab === 'examples' ? word.aiSections?.examples : word.aiSections?.phrases
  const contextLabel = contextTab === 'examples' ? '例句' : '短语'
  const { origin, derivation } =
    !etymologyStatus || etymologyStatus === 'ready' ? getWordEtymologyExtras(word) : {}

  const handlePlaySentence = (sentence: string, idx: number) => {
    setSpeakingSentenceIdx(idx)
    audioEngine.playSentence(sentence, phoneticPreference, () => {
      setSpeakingSentenceIdx((current) => (current === idx ? null : current))
    })
  }

  return (
    <div className="grid grid-cols-12 mt-5 xl:mt-7 border-t border-border flex-1 min-h-0 text-left">
      <section className="col-span-8 pt-4 xl:pt-5 pr-6 xl:pr-8 flex flex-col min-h-0">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-5" role="tablist" aria-label="语境内容">
            {([
              ['examples', '例句'],
              ['phrases', '短语'],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={contextTab === tab}
                onClick={() => onContextTabChange(tab)}
                className={`pb-1.5 text-sm border-b-2 transition-colors cursor-pointer ${
                  contextTab === tab
                    ? 'border-foreground text-foreground font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="pb-1.5 text-xs text-muted-foreground">
            {contextStatus === 'pending'
              ? '生成中…'
              : contextStatus === 'error'
                ? '生成失败'
                : contextItems.length > 0
                  ? `${contextItems.length} 条 · 点击单词可查词`
                  : null}
          </span>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto pr-1 mt-2 custom-scrollbar ${
            contextTab === 'phrases' ? 'grid grid-cols-2 content-start gap-x-8' : ''
          }`}
        >
          {contextStatus === 'pending' ? (
            <div className="col-span-2 space-y-4 pt-3 animate-pulse" aria-label="AI 语境内容生成中">
              {[0, 1].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="h-5 w-11/12 rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : contextStatus === 'error' ? (
            <div className="col-span-2 h-full flex items-center justify-center py-6 text-sm text-muted-foreground">
              {contextLabel}生成失败
            </div>
          ) : contextItems.length === 0 ? (
            <div className="col-span-2 h-full flex items-center justify-center py-6 text-sm text-muted-foreground">
              暂无{contextTab === 'examples' ? '例句' : '常用短语'}
            </div>
          ) : (
            contextItems.map((item, idx) => {
              const isPlaying = speakingSentenceIdx === idx
              return (
                <div
                  key={idx}
                  className={`group grid grid-cols-[1.5rem_1fr_auto] gap-x-1 py-3 ${
                    contextTab === 'examples' && idx > 0 ? 'border-t border-dashed border-border' : ''
                  }`}
                >
                  <span
                    className={`font-serif text-base pt-0.5 tabular-nums ${
                      isPlaying ? 'text-primary' : 'text-muted-foreground/70'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <InteractiveSentence
                      sentence={item.en}
                      wordName={word.name}
                      sentenceCn={item.cn}
                      onWordClick={(clickedWord, en, cn, rect) => {
                        setLookupWordInfo({ word: clickedWord, sentenceEn: en, sentenceCn: cn, targetRect: rect })
                      }}
                    />
                    <p className="text-[13px] xl:text-sm text-muted-foreground leading-relaxed mt-1">
                      {item.cn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlaySentence(item.en, idx)
                    }}
                    className={`size-8 -mt-1 rounded-md transition-colors cursor-pointer flex items-center justify-center ${
                      isPlaying
                        ? 'text-primary animate-pulse'
                        : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted'
                    }`}
                    title={`朗读${contextLabel}`}
                    aria-label={`朗读${contextLabel}`}
                  >
                    <Volume2 className="size-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="col-span-4 pt-4 xl:pt-5 pl-6 xl:pl-8 border-l border-border min-h-0 overflow-y-auto custom-scrollbar">
        <div className="flex items-end justify-between pb-1.5">
          <span className="text-sm text-muted-foreground">构词</span>
          {etymologyStatus === 'pending' && (
            <span className="text-xs text-muted-foreground">分析中…</span>
          )}
        </div>

        {etymologyStatus === 'pending' ? (
          <div className="space-y-3 pt-3 animate-pulse" aria-label="AI 构词分析中">
            <div className="h-7 w-3/5 rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        ) : etymologyStatus === 'error' ? (
          <p className="pt-3 text-sm text-muted-foreground">{etymologyErrorText}</p>
        ) : morphemes.length > 0 ? (
          <div className="pt-3">
            <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
              {morphemes.map((morpheme, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="font-serif text-2xl text-muted-foreground/60 leading-none pt-0.5">+</span>
                  )}
                  <span className="flex flex-col gap-1.5 min-w-0">
                    <span
                      className={`font-serif text-2xl xl:text-[1.75rem] leading-none ${
                        morpheme.role === 'root' ? 'text-primary' : 'text-gray-100'
                      }`}
                    >
                      {morpheme.text}
                    </span>
                    {morpheme.meaning && (
                      <span className="text-xs text-muted-foreground">{morpheme.meaning}</span>
                    )}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {derivation && (
              <p className="mt-4 text-sm xl:text-[15px] text-gray-300 leading-relaxed">{derivation}</p>
            )}
          </div>
        ) : (
          <div className="pt-3 space-y-3">
            {origin && <p className="text-sm xl:text-[15px] text-gray-300 leading-relaxed">{origin}</p>}
            {derivation && (
              <p className="text-sm xl:text-[15px] text-gray-300 leading-relaxed">{derivation}</p>
            )}
          </div>
        )}
      </section>

      {lookupWordInfo && (
        <WordLookupModal
          isOpen={Boolean(lookupWordInfo)}
          onClose={() => setLookupWordInfo(null)}
          wordQuery={lookupWordInfo.word}
          sentenceEn={lookupWordInfo.sentenceEn}
          sentenceCn={lookupWordInfo.sentenceCn}
          targetRect={lookupWordInfo.targetRect}
        />
      )}
    </div>
  )
}
