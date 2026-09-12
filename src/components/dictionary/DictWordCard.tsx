'use client'

import React, { useState } from 'react'
import { ArrowRight, Scissors, Combine, BookOpen, Quote, Volume2, Star } from 'lucide-react'
import type { WordItem } from '@/types'
import { splitIntoMorphemes, resolveSyllables } from '@/lib/syllables'
import { splitIntoGraphemes, type GraphemeKind, type GraphemeSegment } from '@/lib/graphemes'
import { listPhonetics, formatMeaningText } from '@/lib/wordDisplay'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { getWordExamples, getWordEtymologyExtras } from '@/lib/wordExamples'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { audioEngine } from '@/core/audioEngine'
import { InteractiveSentence } from '@/components/sentence/InteractiveSentence'
import { WordLookupModal } from '@/components/dictionary/WordLookupModal'
import { useEnsureAiWordSections } from '@/hooks/useEnsureAiWordSections'

interface DictWordCardProps {
  word: WordItem
  phoneticPreference: 'us' | 'uk'
  sourceBookName?: string
}

function wordSizeClass(length: number) {
  if (length <= 8) return 'text-5xl sm:text-6xl xl:text-7xl 2xl:text-[5.25rem]'
  if (length <= 12) return 'text-4xl sm:text-5xl xl:text-6xl 2xl:text-[4.25rem]'
  return 'text-3xl sm:text-4xl xl:text-5xl 2xl:text-[3.5rem]'
}

const COMBO_KINDS = new Set<GraphemeKind>([
  'vowel-team',
  'r-controlled',
  'consonant-digraph',
  'suffix-chunk',
])

const COMBO_TONES = ['text-accent', 'text-[#FDE68A]']
const FULL_AI_SECTIONS = ['structure', 'examples'] as const

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
    return 'text-gray-400'
  }
  if (!isCombo(segment)) {
    return segment.kind === 'vowel' ? 'text-primary' : undefined
  }
  return COMBO_TONES[comboToneIndex(segments, index)]
}

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
          {sIdx > 0 && <span className="text-gray-500 font-normal select-none px-1">·</span>}
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



export function DictWordCard({
  word: sourceWord,
  phoneticPreference,
  sourceBookName,
}: DictWordCardProps) {
  const word = useEnsureAiWordSections(sourceWord, FULL_AI_SECTIONS)
  const [isSplit, setIsSplit] = useState(false)
  const [contextTab, setContextTab] = useState<'examples' | 'phrases'>('examples')
  const [speakingSentenceIdx, setSpeakingSentenceIdx] = useState<number | null>(null)
  const [lookupWordInfo, setLookupWordInfo] = useState<{
    word: string
    sentenceEn: string
    sentenceCn?: string
    targetRect?: DOMRect
  } | null>(null)

  const starredWordIds = useWorkspaceStore((s) => s.starredWordIds)
  const starCurrentWord = useWorkspaceStore((s) => s.starCurrentWord)
  const currentBook = useWorkspaceStore((s) => s.currentBook)

  const isStarred = Boolean(starredWordIds?.includes(word.id))

  const phonetics = listPhonetics(word)
  const meaningText = formatMeaningText(word)
  const morphemes = splitIntoMorphemes(word)
  const syllables = resolveSyllables(word)
  const displayLength = word.name.length

  const structureStatus = word.aiSections?.structure
  const examplesStatus = word.aiSections?.examples
  const examples =
    word.examples?.length
      ? word.examples
      : word.aiSections
        ? []
        : getWordExamples(word)
  const phrases = word.phrases || []
  const contextItems = contextTab === 'examples' ? examples : phrases
  const contextStatus =
    contextTab === 'examples' ? examplesStatus : structureStatus
  const { origin, derivation } =
    !structureStatus || structureStatus === 'ready'
      ? getWordEtymologyExtras(word)
      : {}

  const handlePlaySentence = (sentence: string, idx: number) => {
    setSpeakingSentenceIdx(idx)
    audioEngine.playSentence(sentence, phoneticPreference, () => {
      setSpeakingSentenceIdx((current) => (current === idx ? null : current))
    })
  }

  const starButton = (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation()
        // 同步加星状态到 Dexie
        const { toggleStarWord } = await import('@/db')
        await toggleStarWord(word.id, currentBook?.id || 'book_cet4', word)
        // 刷新 store 中的加星列表
        useWorkspaceStore.getState().syncStarredWordIds()
      }}
      className={`h-10 xl:h-11 px-3.5 xl:px-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs xl:text-sm font-medium select-none active:scale-95 ${
        isStarred
          ? 'border-amber-400/60 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 hover:border-amber-400/80'
          : 'border-white/10 bg-white/5 text-gray-300 hover:text-amber-300 hover:border-amber-400/40 hover:bg-amber-400/10'
      }`}
      title={isStarred ? '已在生词本（点击移出）' : '一键加入生词本'}
      aria-label={isStarred ? '移出生词本' : '加入生词本'}
    >
      <Star
        className={`size-4 xl:size-4.5 transition-transform duration-200 ${
          isStarred
            ? 'fill-amber-400 text-amber-400 scale-105'
            : 'text-gray-400 group-hover:text-amber-300'
        }`}
      />
      <span>{isStarred ? '已在生词本' : '加入生词本'}</span>
    </button>
  )

  const sourceBookBadge = sourceBookName ? (
    <div
      className="h-10 xl:h-11 px-3.5 xl:px-4 rounded-xl border border-white/10 bg-white/5 text-gray-300 flex items-center gap-2 text-xs xl:text-sm font-medium select-none shadow-sm backdrop-blur-md"
      title={`所在词库：${sourceBookName}`}
    >
      <BookOpen className="size-3.5 xl:size-4 text-primary" />
      <span className="truncate max-w-[160px] xl:max-w-[220px]">{sourceBookName}</span>
    </div>
  ) : null

  return (
    <WordCardShell
      word={word}
      phoneticPreference={phoneticPreference}
      remainingLoops={1}
      headerLeft={sourceBookBadge}
      headerActions={starButton}
    >
      {/* 上半区（音标 + 单词 + 音节拆分 + 释义）无跟打输入槽 */}
      <div className="space-y-2 xl:space-y-3 pt-2">
        {/* 音标栏：支持用户手动点击播放对应口音发音 */}
        <div className="h-8 xl:h-9 flex items-center justify-center gap-x-3 sm:gap-x-4">
          {phonetics.map((entry) => (
            <button
              key={entry.label ?? 'single'}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                audioEngine.playPronunciation(
                  word.name,
                  entry.label === '英' ? 'uk' : 'us'
                )
              }}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer select-none"
              title={`点击播放 ${entry.label || ''} 读音`}
            >
              {entry.label && (
                <span className="font-sans text-xs xl:text-sm font-semibold text-[#6B7280] group-hover:text-primary transition-colors">
                  {entry.label}
                </span>
              )}
              <span
                className={`font-mono tracking-wide text-gray-300 group-hover:text-white transition-colors flex items-center gap-1.5 ${
                  phonetics.length > 1 ? 'text-lg xl:text-xl' : 'text-xl xl:text-2xl'
                }`}
              >
                <span>{entry.text}</span>
                <Volume2 className="size-3.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            </button>
          ))}
        </div>

        {/* 单词主体展示与音节切分切换 */}
        <div className="h-20 xl:h-24 2xl:h-28 flex items-center justify-center relative">
          <div className="inline-flex items-center justify-center gap-2.5 sm:gap-3 xl:gap-4">
            <h2
              className={`${wordSizeClass(
                displayLength
              )} font-extrabold tracking-tight text-white font-mono leading-tight`}
            >
              {isSplit ? (
                <MarkedSplitWord word={word} syllables={syllables} />
              ) : (
                <MarkedWord word={word} />
              )}
            </h2>
            <div className="flex items-center gap-1.5 xl:gap-2">
              <button
                type="button"
                onClick={() => setIsSplit(!isSplit)}
                className={`p-1.5 sm:p-2 xl:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isSplit
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                }`}
                title={isSplit ? '合并单词' : '音节切分'}
                aria-label={isSplit ? '合并单词' : '音节切分'}
              >
                {isSplit ? <Combine className="size-4 xl:size-5" /> : <Scissors className="size-4 xl:size-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 单词释义（去掉跟打槽后，释义有更舒展的排版展示） */}
        <div className="min-h-9 xl:min-h-11 flex items-center justify-center px-4">
          <p className="text-base sm:text-lg xl:text-xl 2xl:text-2xl text-gray-200 font-medium">
            {meaningText}
          </p>
        </div>
      </div>

      {/* 下半区：左右分栏排版（左侧占 8/12 宽幅双语例句；右侧占 4/12 词根词源/助记） */}
      <div className="grid grid-cols-12 gap-3.5 xl:gap-5 pt-4 xl:pt-5 flex-1 min-h-0 text-left">
        {/* 左栏：精选双语例句 */}
        <div className="col-span-8 rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 xl:p-4 2xl:p-5 flex flex-col justify-between overflow-hidden shadow-inner">
          <div className="flex h-full min-h-0 flex-col gap-2.5 xl:gap-3.5">
            <div className="flex items-center justify-between pb-1.5 xl:pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5 xl:gap-2">
                <Quote className="size-3.5 xl:size-4 text-accent" />
                <div className="flex items-center rounded-lg bg-white/5 p-0.5" role="tablist" aria-label="语境内容">
                  {([
                    ['examples', '例句'],
                    ['phrases', '短语'],
                  ] as const).map(([tab, label]) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={contextTab === tab}
                      onClick={() => setContextTab(tab)}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                        contextTab === tab
                          ? 'bg-accent/15 text-accent'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-[10px] xl:text-xs font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold">
                {contextStatus === 'pending'
                  ? 'LOADING'
                  : contextStatus === 'error'
                    ? 'FAILED'
                    : `${contextItems.length} ${contextTab === 'examples' ? 'EXAMPLES' : 'PHRASES'}`}
              </span>
            </div>

            <div className={`min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar ${
              contextTab === 'phrases'
                ? 'grid grid-cols-2 content-start gap-2.5 xl:gap-3.5'
                : 'space-y-2.5 xl:space-y-3.5'
            }`}>
              {contextStatus === 'pending' ? (
                <div className="col-span-2 space-y-3 animate-pulse" aria-label="AI 语境内容生成中">
                  {[0, 1].map((item) => (
                    <div key={item} className="h-24 rounded-xl border border-white/5 bg-white/[0.04]" />
                  ))}
                </div>
              ) : contextStatus === 'error' ? (
                <div className="col-span-2 h-full flex items-center justify-center text-sm text-gray-400">
                  {contextTab === 'examples' ? '例句' : '短语'}生成失败，重新查询可再次补全
                </div>
              ) : contextItems.length === 0 ? (
                <div className="col-span-2 h-full flex items-center justify-center text-sm text-gray-400">
                  暂无{contextTab === 'examples' ? '例句' : '常用短语'}
                </div>
              ) : contextItems.map((item, idx) => {
                const isPlaying = speakingSentenceIdx === idx
                return (
                  <div
                    key={idx}
                    className={`p-3 xl:p-3.5 2xl:p-4 rounded-xl bg-white/[0.025] border transition-all duration-200 group ${
                      isPlaying
                        ? 'border-primary/40 bg-primary/[0.04]'
                        : 'border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3 xl:gap-3.5">
                      <span className="size-5 xl:size-6 rounded-lg bg-accent/15 text-accent text-xs xl:text-sm font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border border-accent/25">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <InteractiveSentence
                            sentence={item.en}
                            wordName={word.name}
                            sentenceCn={item.cn}
                            onWordClick={(clickedWord, en, cn, rect) => {
                              setLookupWordInfo({ word: clickedWord, sentenceEn: en, sentenceCn: cn, targetRect: rect })
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlaySentence(item.en, idx)
                            }}
                            className={`p-1.5 -mr-1 -mt-0.5 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                              isPlaying
                                ? 'border-primary/50 bg-primary/20 text-primary animate-pulse'
                                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/15'
                            }`}
                            title={`朗读${contextTab === 'examples' ? '例句' : '短语'}`}
                            aria-label={`朗读${contextTab === 'examples' ? '例句' : '短语'}`}
                          >
                            <Volume2 className="size-3.5 xl:size-4" />
                          </button>
                        </div>
                        <div className="text-xs xl:text-sm text-gray-400 leading-relaxed mt-1 xl:mt-1.5">
                          {item.cn}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 右栏：词根词源与构词助记 */}
        <div className="col-span-4 rounded-2xl bg-white/[0.03] border border-white/10 p-4 xl:p-5 flex flex-col justify-between overflow-hidden shadow-inner">
          <div className="space-y-3 xl:space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="size-4 xl:size-4.5 text-primary shrink-0" />
                <span className="text-sm xl:text-base font-bold text-white/90 truncate">
                  词根 · 助记
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs xl:text-sm font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold">
                  {structureStatus === 'pending'
                    ? 'LOADING'
                    : structureStatus === 'error'
                      ? 'FAILED'
                      : 'ROOTS'}
                </span>
              </div>
            </div>

            {structureStatus === 'pending' ? (
              <div className="space-y-3 animate-pulse" aria-label="AI 构词分析中">
                <div className="h-5 w-4/5 rounded bg-white/[0.06]" />
                <div className="h-5 w-3/5 rounded bg-white/[0.06]" />
                <div className="h-16 rounded-lg bg-white/[0.04]" />
              </div>
            ) : structureStatus === 'error' ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                构词分析失败，重新查询可再次补全
              </div>
            ) : morphemes.length > 0 ? (
              <div className="space-y-3 xl:space-y-4">
                <div className="text-sm xl:text-base leading-relaxed flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                  {morphemes.map((morpheme, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="text-gray-500 font-mono font-bold">+</span>}
                      <span className="whitespace-nowrap">
                        <span
                          className={`font-mono text-base xl:text-lg font-bold ${
                            morpheme.role === 'root' ? 'text-primary' : 'text-gray-100'
                          }`}
                        >
                          {morpheme.text}
                        </span>
                        {morpheme.meaning && (
                          <span className="text-sm xl:text-base text-gray-400">
                            （{morpheme.meaning}）
                          </span>
                        )}
                      </span>
                    </React.Fragment>
                  ))}
                </div>

                {derivation && (
                  <div className="flex items-start gap-2 text-sm xl:text-base text-gray-200 font-normal leading-relaxed pt-1">
                    <ArrowRight className="size-4 xl:size-4.5 text-primary shrink-0 mt-0.5" />
                    <span>{derivation}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 xl:space-y-3 text-left">
                {origin && <p className="text-sm xl:text-base text-gray-200 leading-relaxed">{origin}</p>}
                {derivation && (
                  <div className="flex items-start gap-2 text-sm xl:text-base text-gray-200 font-normal leading-relaxed pt-1">
                    <ArrowRight className="size-4 xl:size-4.5 text-primary shrink-0 mt-0.5" />
                    <span>{derivation}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 例句单词点击查词浮层弹窗 */}
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
    </WordCardShell>
  )
}
