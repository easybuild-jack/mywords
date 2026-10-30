'use client'

import React, { useState } from 'react'
import { Scissors, Combine, Star, Pencil } from 'lucide-react'
import type { WordItem } from '@/types'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { EditWordSplitModal } from '@/components/modals/EditWordSplitModal'
import { useCanEditWordSplit } from '@/hooks/usePermissions'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { formatShortcutDisplay } from '@/lib/shortcuts'
import { useEnsureAiWordSections, type AiWordSection } from '@/hooks/useEnsureAiWordSections'
import {
  WordHeadline,
  WordPhonetics,
  WordMeaning,
  WordContextPanels,
  WORD_HEADER_BUTTON_CLASS,
  type WordContextTab,
} from '@/components/word/WordDisplay'

interface LearnCardProps {
  word: WordItem
  currentInput: string
  hasTypo: boolean
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

/** 练习册四线三格跟打区：无外框，字母紧凑排版，光标贴合输入末尾 */
function TypingLines({
  target,
  currentInput,
  hasTypo,
}: {
  target: string
  currentInput: string
  hasTypo: boolean
}) {
  const totalSlots = Math.max(target.length, currentInput.length)
  const fontClass =
    totalSlots <= 6
      ? 'text-4xl sm:text-5xl xl:text-6xl'
      : totalSlots <= 9
        ? 'text-3xl sm:text-4xl xl:text-5xl'
        : 'text-2xl sm:text-3xl xl:text-4xl'
  const lineClass = hasTypo ? 'border-destructive/50' : 'border-foreground/15'
  const softLineClass = hasTypo ? 'border-destructive/30' : 'border-foreground/10'

  return (
    <div
      className={`relative mx-auto mt-3 xl:mt-4 w-full max-w-xl h-16 sm:h-18 xl:h-20 flex items-center justify-center font-mono ${
        hasTypo ? 'animate-shake' : ''
      }`}
    >
      <div className="absolute inset-x-0 inset-y-1.5 pointer-events-none flex flex-col justify-between z-0">
        <div className={`w-full border-b ${lineClass}`} />
        <div className={`w-full border-b border-dashed ${softLineClass}`} />
        <div className={`w-full border-b ${lineClass}`} />
        <div className={`w-full border-b ${softLineClass}`} />
      </div>

      <div className={`relative z-10 inline-flex items-center justify-center h-full font-mono ${fontClass}`}>
        {Array.from({ length: totalSlots }).map((_, idx) => {
          const targetChar = target[idx]
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
              {isCurrent && (
                <span
                  className={`absolute left-0 top-2 bottom-5 w-0.5 animate-cursor ${
                    hasTypo ? 'bg-destructive' : 'bg-primary'
                  }`}
                />
              )}

              {isTyped && (
                <span
                  className={`${fontClass} -translate-y-1.5 sm:-translate-y-2 ${
                    isCorrect ? 'text-white' : 'text-destructive font-semibold animate-error-flash rounded'
                  }`}
                  title={!isCorrect ? '输入错误，请按退格键 (Backspace) 修正' : undefined}
                >
                  {typedChar}
                </span>
              )}

              {/* 未输入的占位短横：落在最下方的第 4 线上 */}
              <span
                className={`absolute bottom-1.5 left-[22%] right-[22%] h-0.5 rounded-full pointer-events-none transition-opacity ${
                  isTyped ? 'opacity-0' : hasTypo ? 'bg-destructive/40' : 'bg-foreground/25'
                }`}
              />
            </div>
          )
        })}

        {currentInput.length >= totalSlots && (
          <span
            className={`w-0.5 h-7 sm:h-9 xl:h-11 animate-cursor self-center -translate-y-1.5 ${
              hasTypo ? 'bg-destructive' : 'bg-primary'
            }`}
          />
        )}
      </div>
    </div>
  )
}

/** 跟学单词页：上半区专注跟打，下半区左右分栏展示例句/短语与构词 */
export function LearnCard({
  word: sourceWord,
  currentInput,
  hasTypo,
  phoneticPreference,
  remainingLoops = 1,
}: LearnCardProps) {
  const isSplit = useWorkspaceStore((s) => s.isCurrentWordSplit)
  const toggleSplit = useWorkspaceStore((s) => s.toggleCurrentWordSplit)
  const isEditModalOpen = useWorkspaceStore((s) => s.isEditWordSplitModalOpen)
  const setEditModalOpen = useWorkspaceStore((s) => s.setEditWordSplitModalOpen)
  const shortcuts = useWorkspaceStore((s) => s.shortcuts)
  const isErrorPracticeActive = useWorkspaceStore((s) => s.isErrorPracticeActive)
  const starredWordIds = useWorkspaceStore((s) => s.starredWordIds)
  const starCurrentWord = useWorkspaceStore((s) => s.starCurrentWord)
  const canEditWordSplit = useCanEditWordSplit()
  const [contextTab, setContextTab] = useState<WordContextTab>('examples')
  const requestedSections: AiWordSection[] = [
    'core',
    'etymology',
    contextTab,
    ...(isSplit ? ['syllables' as const] : []),
  ]
  const word = useEnsureAiWordSections(sourceWord, requestedSections)

  const isStarred = Boolean(starredWordIds?.includes(word.id))
  const splitShortcutText = formatShortcutDisplay(shortcuts.toggleSplit || 'Alt+S')
  const starShortcutText = formatShortcutDisplay(shortcuts.toggleStar || 'Alt+W')

  const headerActions = (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleSplit()
        }}
        className={`${WORD_HEADER_BUTTON_CLASS} ${
          isSplit ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title={isSplit ? `合并单词 (${splitShortcutText})` : `音节切分 (${splitShortcutText})`}
        aria-label={isSplit ? '合并单词' : '音节切分'}
        aria-pressed={isSplit}
      >
        {isSplit ? <Combine className="size-3.5" /> : <Scissors className="size-3.5" />}
        <span>{isSplit ? '合并' : '音节'}</span>
      </button>

      {canEditWordSplit && (
        <button
          type="button"
          onClick={() => setEditModalOpen(true)}
          className={`${WORD_HEADER_BUTTON_CLASS} text-muted-foreground hover:text-foreground hover:bg-muted`}
          title="修改单词切分与构词"
          aria-label="修改单词切分与构词"
        >
          <Pencil className="size-3.5" />
          <span>修改</span>
        </button>
      )}

      {!isErrorPracticeActive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            starCurrentWord()
          }}
          className={`${WORD_HEADER_BUTTON_CLASS} ${
            isStarred ? 'text-amber-400 hover:text-amber-300' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title={isStarred ? `已在生词本（点击或 ${starShortcutText} 移出）` : `一键加入生词本 (${starShortcutText})`}
          aria-label={isStarred ? '移出生词本' : '加入生词本'}
          aria-pressed={isStarred}
        >
          <Star className={`size-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{isStarred ? '已在生词本' : '加入生词本'}</span>
        </button>
      )}
    </>
  )

  return (
    <WordCardShell
      word={word}
      phoneticPreference={phoneticPreference}
      remainingLoops={remainingLoops}
      headerActions={headerActions}
      showAudioButton={false}
      className="pt-12 xl:pt-14 pb-2"
    >
      <div>
        <WordHeadline word={word} isSplit={isSplit} />
        <WordPhonetics word={word} phoneticPreference={phoneticPreference} />
        {/* 释义：预留两行高度，避免释义换行时挤压跟打槽 */}
        <div className="min-h-[48px] xl:min-h-[56px] flex items-center justify-center px-6 mt-1">
          <WordMeaning word={word} className="text-base xl:text-lg" />
        </div>
        <TypingLines target={word.name} currentInput={currentInput} hasTypo={hasTypo} />
      </div>

      <WordContextPanels
        word={word}
        phoneticPreference={phoneticPreference}
        contextTab={contextTab}
        onContextTabChange={setContextTab}
        etymologyErrorText="构词分析失败，下次进入时将重新补全"
      />

      <EditWordSplitModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        word={word}
      />
    </WordCardShell>
  )
}
