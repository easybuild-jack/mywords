'use client'

import React from 'react'
import {
  AlertTriangle,
  Quote,
  Volume2,
} from 'lucide-react'
import type { DictationCueMode, WordItem } from '@/types'
import { formatMeaningText } from '@/lib/wordDisplay'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { getWordExamples } from '@/lib/wordExamples'
import { audioEngine } from '@/core/audioEngine'
import { InteractiveSentence } from '@/components/sentence/InteractiveSentence'
import { WordLookupModal } from '@/components/dictionary/WordLookupModal'
import { useEnsureAiWordSections } from '@/hooks/useEnsureAiWordSections'

interface DictationCardProps {
  word: WordItem
  currentInput: string
  hasTypo: boolean
  isPeeking: boolean
  cueMode?: DictationCueMode
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

const DICTATION_AI_SECTIONS = ['core', 'examples'] as const
/**
 * 默写卡片：英文遮蔽，顶部提供中文释义与原声发音辅助，直接进行单词拼写盲打。
 */
export function DictationCard({
  word: sourceWord,
  currentInput,
  hasTypo,
  isPeeking,
  phoneticPreference,
  remainingLoops = 1,
}: DictationCardProps) {
  const word = useEnsureAiWordSections(sourceWord, DICTATION_AI_SECTIONS)

  const [speakingSentenceIdx, setSpeakingSentenceIdx] = React.useState<number | null>(null)
  const [lookupWordInfo, setLookupWordInfo] = React.useState<{
    word: string
    sentenceEn: string
    sentenceCn?: string
    targetRect?: DOMRect
  } | null>(null)
  const examplesStatus = word.aiSections?.examples
  const examples =
    word.examples?.length
      ? word.examples
      : word.aiSections?.examples
        ? []
        : getWordExamples(word)

  const handlePlaySentence = (sentence: string, idx: number) => {
    setSpeakingSentenceIdx(idx)
    audioEngine.playSentence(sentence, phoneticPreference, () => {
      setSpeakingSentenceIdx((current) => (current === idx ? null : current))
    })
  }

  const meaningText = formatMeaningText(word)

  return (
    <WordCardShell
      word={word}
      phoneticPreference={phoneticPreference}
      remainingLoops={remainingLoops}
    >
      {/*
        卡片内容整体往上靠：从居中改为顶部对齐（justify-start），
        使看译文/听音线索与输入阶梯自然向上排布，消除上下过度空旷感。
      */}
      <div className="flex flex-col h-full justify-start pt-1.5 sm:pt-2.5 xl:pt-3.5 gap-2 sm:gap-2.5 xl:gap-3">
        {/* 顶部线索槽：核心中文释义醒目呈现 */}
        <div className="min-h-12 max-h-20 shrink-0 flex items-center justify-center px-4 sm:px-6">
          <p className="max-w-2xl xl:max-w-3xl 2xl:max-w-4xl text-base sm:text-lg xl:text-xl font-bold text-white line-clamp-2 leading-relaxed text-center">
            {meaningText}
          </p>
        </div>

        {/* 模式提示 */}
        <div className="h-5 shrink-0 flex items-center justify-center px-4">
          <span className="text-xs text-muted-foreground/80 font-mono">
            [ 单词默写 · 原声发音与盲打拼写 ]
          </span>
        </div>

        {/* 中间主要输入阶梯区：宽度随着卡片自适应扩大 */}
        <div className="w-full max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto space-y-2 sm:space-y-2.5">
          {/* 单词拼写盲打槽：直接开启拼写打字 */}
          <div
            className="relative w-full cursor-pointer"
            onClick={() => {
              if (typeof document !== 'undefined' && document.activeElement && document.activeElement !== document.body) {
                (document.activeElement as HTMLElement).blur()
              }
            }}
          >
            {(() => {
              const wordLength = word.name.length
              const totalSlots = Math.max(wordLength, currentInput.length)
              const fontClass =
                totalSlots <= 6
                  ? 'text-4xl sm:text-5xl xl:text-6xl'
                  : totalSlots <= 9
                  ? 'text-3xl sm:text-4xl xl:text-5xl'
                  : 'text-2xl sm:text-3xl xl:text-4xl'

              return (
                <div
                  className={`relative flex items-center justify-center py-2.5 sm:py-3 xl:py-3.5 px-4 sm:px-6 overflow-hidden font-mono rounded-2xl border-2 transition-all shadow-inner ${
                    hasTypo
                      ? 'border-destructive/70 bg-destructive/[0.04] animate-error-box'
                      : 'border-primary/40 bg-white/[0.02]'
                  }`}
                >
                  {/* 4 线格打字区与光标 */}
                  <div className="relative w-full h-16 sm:h-18 xl:h-20 flex items-center justify-center">
                    {/* 4 线格参考线：顶线、中虚线、基准底线（同色软蓝无红线）、下延底线（最后的横线） */}
                    <div className="absolute inset-x-4 inset-y-1.5 pointer-events-none flex flex-col justify-between opacity-70 z-0">
                      {/* 第 1 线：顶线 */}
                      <div className="w-full border-b border-sky-400/35 dark:border-sky-400/25" />
                      {/* 第 2 线：中线（虚线） */}
                      <div className="w-full border-b border-dashed border-sky-400/45 dark:border-sky-400/30" />
                      {/* 第 3 线：基准线（实线，与参考线统一青蓝色，无红线） */}
                      <div className="w-full border-b border-sky-400/35 dark:border-sky-400/25" />
                      {/* 第 4 线：下延底线（最后的横线） */}
                      <div className="w-full border-b border-sky-400/25 dark:border-sky-400/15" />
                    </div>

                    {/* 字母与光标槽列表：字间距紧凑贴合，光标精确贴合在已输入字符末尾 */}
                    <div className={`relative z-10 inline-flex items-center justify-center h-full font-mono ${fontClass}`}>
                      {Array.from({ length: totalSlots }).map((_, idx) => {
                        const targetChar = word.name[idx]
                        const typedChar = currentInput[idx]
                        const isTyped = idx < currentInput.length
                        const isCurrent = idx === currentInput.length
                        const isCorrect =
                          isTyped && targetChar && typedChar.toLowerCase() === targetChar.toLowerCase()

                        return (
                          <div
                            key={idx}
                            style={{ width: '1.05ch' }}
                            className="relative w-[1.05ch] h-full flex items-center justify-center"
                          >
                            {/* 光标：精确处于当前未打字母的左边缘起始位置 */}
                            {isCurrent && (
                              <span
                                className={`absolute left-0 top-2 bottom-5 w-0.5 animate-cursor ${
                                  hasTypo ? 'bg-destructive' : 'bg-primary'
                                }`}
                              />
                            )}

                            {/* 已输入字符（坐落在基准线之上） */}
                            {isTyped && (
                              <span
                                className={`${fontClass} font-extrabold -translate-y-1.5 sm:-translate-y-2 ${
                                  isCorrect
                                    ? 'text-primary'
                                    : 'text-destructive font-black animate-error-flash px-0.5 rounded-lg bg-destructive/20 border border-destructive/40 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                                }`}
                                title={!isCorrect ? '输入错误，请按退格键 (Backspace) 修正' : undefined}
                              >
                                {typedChar}
                              </span>
                            )}

                            {/* 占位的 _ ：精确坐落在最后的横线（第 4 线）上 */}
                            <span
                              className={`absolute -bottom-1 sm:-bottom-1.5 font-mono text-xl sm:text-2xl xl:text-3xl font-black select-none pointer-events-none transition-opacity ${
                                isTyped
                                  ? 'opacity-0'
                                  : hasTypo
                                  ? 'text-destructive/40'
                                  : 'text-primary/45'
                              }`}
                            >
                              _
                            </span>
                          </div>
                        )
                      })}

                      {/* 全部输入完成后，光标显示在末尾 */}
                      {currentInput.length >= totalSlots && (
                        <span
                          className={`w-0.5 h-7 sm:h-9 xl:h-11 animate-cursor self-center -translate-y-1.5 ${
                            hasTypo ? 'bg-destructive' : 'bg-primary'
                          }`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

            <div className="h-5 mt-1">
              {hasTypo && (
                <div className="flex items-center justify-center gap-1.5 h-full text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg animate-in fade-in-50">
                  <AlertTriangle className="size-3.5" />
                  <span>字母输入错误，请按退格键 (Backspace) 修正</span>
                </div>
              )}
            </div>
          </div>

        {/* 下半区：语境双语例句（挖空填空线索，看译文与听音模式保持完全一致） */}
        {(examples.length > 0 || examplesStatus === 'pending' || examplesStatus === 'error') && (
          <div className="w-full max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto flex-1 min-h-0 flex flex-col justify-start text-left pt-1">
            <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-3 shadow-inner xl:p-4 2xl:p-4.5">
              <div className="flex h-full min-h-0 flex-col gap-2 xl:gap-2.5">
                {/* 顶栏小标题与偷看状态 */}
                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                  <div className="flex items-center gap-1.5 xl:gap-2">
                    <Quote className="size-3.5 xl:size-4 text-accent" />
                    <span className="text-xs xl:text-sm font-bold text-white/90">语境例句填空</span>
                    <span className="text-[11px] text-muted-foreground/75 hidden sm:inline">
                      （结合上下文推导单词拼写，按 Tab 偷看）
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPeeking && (
                      <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 rounded-md bg-accent/20 border border-accent/40 animate-pulse">
                        答案: {word.name}
                      </span>
                    )}
                    <button
                      type="button"
                      onPointerDown={() => useWorkspaceStore.getState().peekHint(true)}
                      onPointerUp={() => useWorkspaceStore.getState().peekHint(false)}
                      onPointerLeave={() => useWorkspaceStore.getState().peekHint(false)}
                      className={`text-[10px] xl:text-xs font-mono px-2 py-0.5 rounded border font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                        isPeeking
                          ? 'bg-accent/20 text-accent border-accent/40'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-white/10'
                      }`}
                      title="按住或按 Tab 键偷看答案"
                    >
                      {isPeeking ? '👀 REVEALED' : '按住偷看 (Tab)'}
                    </button>
                  </div>
                </div>

                {/* 示例句列表（挖空呈现） */}
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar xl:space-y-2.5">
                  {examplesStatus === 'pending' ? (
                    <div className="space-y-2 animate-pulse" aria-label="AI 例句生成中">
                      {[0, 1].map((item) => (
                        <div key={item} className="h-20 rounded-xl border border-white/5 bg-white/[0.04]" />
                      ))}
                    </div>
                  ) : examplesStatus === 'error' ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      例句生成失败，下次进入时将重新补全
                    </div>
                  ) : examples.map((item, idx) => {
                    const isPlaying = speakingSentenceIdx === idx
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 xl:p-3 rounded-xl bg-white/[0.02] border transition-all duration-200 group ${
                          isPlaying
                            ? 'border-primary/40 bg-primary/[0.04]'
                            : 'border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 xl:gap-3">
                          <span className="size-5 xl:size-5.5 rounded-lg bg-accent/15 text-accent text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 border border-accent/25">
                            0{idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <InteractiveSentence
                                sentence={item.en}
                                wordName={word.name}
                                sentenceCn={item.cn}
                                isCloze={true}
                                isRevealed={isPeeking}
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
                                title="朗读例句"
                                aria-label="朗读例句"
                              >
                                <Volume2 className="size-3.5 xl:size-4" />
                              </button>
                            </div>
                            <div className="text-xs xl:text-sm text-gray-400 leading-relaxed mt-1">
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
          </div>
        )}
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
