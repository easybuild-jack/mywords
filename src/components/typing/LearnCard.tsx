'use client'

import React, { useState } from 'react'
import { Scissors, Combine, Star, Pencil } from 'lucide-react'
import type { WordItem } from '@/types'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { TypingLines } from '@/components/typing/TypingLines'
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
          <WordMeaning word={word} className="text-base xl:text-lg text-gray-200" />
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
