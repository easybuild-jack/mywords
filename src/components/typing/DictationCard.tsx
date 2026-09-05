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
  Quote,
  Volume2,
} from 'lucide-react'
import type { DictationCueMode, WordItem } from '@/types'
import { formatMeaningText } from '@/lib/wordDisplay'
import { isMeaningStepActive } from '@/lib/dictationCue'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { getWordExamples } from '@/lib/wordExamples'
import { audioEngine } from '@/core/audioEngine'

interface DictationCardProps {
  word: WordItem
  currentInput: string
  hasTypo: boolean
  isPeeking: boolean
  cueMode: DictationCueMode
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

/** 例句中的目标单词挖空渲染，未揭晓时呈现 [ _____ ]，揭晓或偷看时高亮展开 */
function ClozeSentence({
  sentence,
  wordName,
  isRevealed,
}: {
  sentence: string
  wordName: string
  isRevealed: boolean
}) {
  const cleanWord = wordName.trim()
  if (!cleanWord) return <span>{sentence}</span>

  // 匹配单词本身或变形词干（如复数、时态等变形）
  const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(\\b${escaped}[a-zA-Z]*\\b)`, 'gi')
  const parts = sentence.split(regex)

  return (
    <span className="text-sm xl:text-base text-gray-100 leading-relaxed font-sans">
      {parts.map((part, i) => {
        if (part.toLowerCase().startsWith(cleanWord.toLowerCase())) {
          if (isRevealed) {
            return (
              <span
                key={i}
                className="inline-block mx-1 px-2 py-0.5 font-mono text-sm xl:text-base font-bold text-accent bg-accent/15 border border-accent/40 rounded-md animate-in fade-in duration-200"
              >
                {part}
              </span>
            )
          }

          const underlineLen = Math.max(3, Math.min(part.length, 7))
          return (
            <span
              key={i}
              className="inline-flex items-center justify-center mx-1 px-2 py-0.5 font-mono text-xs xl:text-sm font-bold text-primary bg-primary/10 border border-dashed border-primary/40 rounded-md select-none tracking-widest"
              title="按 Tab 键可临时偷看答案"
            >
              [{'_'.repeat(underlineLen)}]
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

/**
 * 默写卡片：英文全部遮蔽，按「音标 → 译文 → 拼写」三级闯关推进。
 *
 * 顶部线索由 cueMode 决定：听音模式只给发音、隐藏中文；
 * 看译文模式只给中文、不自动发音（想听得自己点），下半区配备语境双语例句挖空辅助。
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
    isDictationMeaningEnabled,
    toggleDictationMeaning,
    dictationMeaningInput,
    setDictationMeaningInput,
    isMeaningPassed,
    submitMeaning,
    isMeaningError,
  } = useWorkspaceStore()

  const [speakingSentenceIdx, setSpeakingSentenceIdx] = React.useState<number | null>(null)
  const examples = getWordExamples(word)

  const handlePlaySentence = (sentence: string, idx: number) => {
    setSpeakingSentenceIdx(idx)
    audioEngine.playSentence(sentence, phoneticPreference, () => {
      setSpeakingSentenceIdx((current) => (current === idx ? null : current))
    })
  }

  const meaningText = formatMeaningText(word)

  const isMeaningStepEnabled = isMeaningStepActive(cueMode, isDictationMeaningEnabled)

  // 拼写槽激活条件：开启的前置译文环节必须通过
  const isSpellingUnlocked = !isMeaningStepEnabled || isMeaningPassed

  // 释义可能很长，输入框是多行文本域，但回车仍然是校验而不是换行
  const handleMeaningSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitMeaning()
    }
  }

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
        {/* 顶部线索槽：只在看译文模式出现，作为核心提示醒目呈现 */}
        {cueMode === 'meaning' && (
          <div className="min-h-12 max-h-20 shrink-0 flex items-center justify-center px-4 sm:px-6">
            <p className="max-w-2xl xl:max-w-3xl 2xl:max-w-4xl text-base sm:text-lg xl:text-xl font-bold text-white line-clamp-2 leading-relaxed text-center">
              {meaningText}
            </p>
          </div>
        )}

        {/* 模式提示：常驻自己这一行，只有文案变化，高度不动 */}
        <div className="h-5 shrink-0 flex items-center justify-center px-4">
          <span className="text-xs text-muted-foreground/80 font-mono">
            {cueMode === 'listen' ? '[ 听音默写 · 释义已隐藏 ]' : '[ 看译文默写 · 发音需手动触发 ]'}
          </span>
        </div>

        {/* 中间主要输入阶梯区：宽度随着卡片自适应扩大 */}
        <div className="w-full max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto space-y-2 sm:space-y-2.5">
          {/* 中文译文输入行。看译文模式下释义已摆在顶部，这一级整体撤掉 */}
          {cueMode === 'listen' && (
            <div className="flex items-center gap-2.5">
              <div
                className={`flex-1 h-24 rounded-2xl border px-3.5 py-2.5 flex items-start justify-between transition-all duration-200 ${!isDictationMeaningEnabled
                  ? 'border-primary/10 bg-primary/[0.02] opacity-40 cursor-not-allowed'
                  : isMeaningPassed
                    ? 'border-primary/60 bg-primary/10'
                    : isMeaningError
                      ? 'border-destructive bg-destructive/15 animate-shake'
                      : 'border-primary/20 bg-primary/[0.03] focus-within:border-primary focus-within:bg-primary/[0.06]'
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

          {/* 单词拼写盲打槽，前置完成后激活。
              样式与学习页的跟打槽保持一致（霓虹绿描边 + 48px 字号 + 剩余字母下划线），
              只多一个未解锁态，改动要两边同步 */}
          <div className="relative w-full">
            <div
              className={`h-16 sm:h-18 xl:h-20 2xl:h-22 flex items-center justify-center overflow-hidden tracking-widest font-mono text-5xl xl:text-6xl font-bold rounded-2xl border-2 px-6 transition-all ${!isSpellingUnlocked
                ? 'border-primary/15 bg-primary/[0.02] text-muted-foreground/50 opacity-60'
                : hasTypo
                  ? 'border-destructive bg-destructive/10 text-destructive animate-shake'
                  : 'border-primary/45 bg-primary/[0.05] text-primary'
                }`}
            >
              {!isSpellingUnlocked ? (
                <div className="flex items-center gap-2 text-sm font-sans font-normal text-muted-foreground">
                  <Lock className="size-4 text-accent/80" />
                  <span>请先完成上方译文输入后开启拼写</span>
                </div>
              ) : (
                <>
                  {currentInput && <span className="mr-1">{currentInput}</span>}
                  <span
                    className={`inline-block w-0.5 h-10 sm:h-11 xl:h-13 animate-cursor shrink-0 ${
                      hasTypo ? 'bg-destructive' : 'bg-primary'
                    }`}
                  />
                  {/* 下划线只铺剩余字母，敲一个顶掉一个，打字途中底线不会消失 */}
                  <span
                    className={`ml-1 font-normal ${
                      hasTypo ? 'text-destructive/40' : 'text-primary/35'
                    }`}
                  >
                    {'_'.repeat(Math.max(0, word.name.length - currentInput.length))}
                  </span>
                </>
              )}
            </div>

            <div className="h-5 mt-1">
              {hasTypo && (
                <div className="flex items-center justify-center gap-1.5 h-full text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertTriangle className="size-3.5" />
                  <span>拼写错误，已重置重试</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 下半区：语境双语例句（挖空填空线索，看译文与听音模式保持完全一致） */}
        {examples.length > 0 && (
          <div className="w-full max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto flex-1 min-h-0 flex flex-col justify-start text-left pt-1">
            <div className="rounded-2xl bg-white/[0.025] border border-white/10 p-3 xl:p-4 2xl:p-4.5 flex flex-col justify-between overflow-hidden shadow-inner">
              <div className="space-y-2 xl:space-y-2.5">
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

                {/* 2 示例句列表（挖空呈现） */}
                <div className="space-y-2 xl:space-y-2.5">
                  {examples.map((item, idx) => {
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
                              <ClozeSentence
                                sentence={item.en}
                                wordName={word.name}
                                isRevealed={isPeeking}
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
    </WordCardShell>
  )
}
