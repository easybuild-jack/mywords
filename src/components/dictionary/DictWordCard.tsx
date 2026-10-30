'use client'

import React, { useState } from 'react'
import { Scissors, Combine, Star } from 'lucide-react'
import type { WordItem } from '@/types'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useEnsureAiWordSections, type AiWordSection } from '@/hooks/useEnsureAiWordSections'
import {
  WordHeadline,
  WordPhonetics,
  WordMeaning,
  WordContextPanels,
  WORD_HEADER_BUTTON_CLASS,
  type WordContextTab,
} from '@/components/word/WordDisplay'

interface DictWordCardProps {
  word: WordItem
  phoneticPreference: 'us' | 'uk'
  onWordChange?: (updatedWord: WordItem) => void
}

/** 查词结果页：与跟学页同一版式，去掉跟打区，释义更舒展 */
export function DictWordCard({
  word: sourceWord,
  phoneticPreference,
}: DictWordCardProps) {
  const [isSplit, setIsSplit] = useState(false)
  const [contextTab, setContextTab] = useState<WordContextTab>('examples')
  const requestedSections: AiWordSection[] = [
    'core',
    'etymology',
    contextTab,
    ...(isSplit ? ['syllables' as const] : []),
  ]
  const word = useEnsureAiWordSections(sourceWord, requestedSections)

  const starredWordIds = useWorkspaceStore((s) => s.starredWordIds)
  const currentBook = useWorkspaceStore((s) => s.currentBook)
  const isStarred = Boolean(starredWordIds?.includes(word.id))

  const headerActions = (
    <>
      <button
        type="button"
        onClick={() => setIsSplit(!isSplit)}
        className={`${WORD_HEADER_BUTTON_CLASS} ${
          isSplit ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title={isSplit ? '合并单词' : '音节切分'}
        aria-label={isSplit ? '合并单词' : '音节切分'}
        aria-pressed={isSplit}
      >
        {isSplit ? <Combine className="size-3.5" /> : <Scissors className="size-3.5" />}
        <span>{isSplit ? '合并' : '音节'}</span>
      </button>

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
        className={`${WORD_HEADER_BUTTON_CLASS} ${
          isStarred ? 'text-amber-400 hover:text-amber-300' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title={isStarred ? '已在生词本（点击移出）' : '一键加入生词本'}
        aria-label={isStarred ? '移出生词本' : '加入生词本'}
        aria-pressed={isStarred}
      >
        <Star className={`size-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
        <span>{isStarred ? '已在生词本' : '加入生词本'}</span>
      </button>
    </>
  )

  return (
    <WordCardShell
      word={word}
      phoneticPreference={phoneticPreference}
      remainingLoops={1}
      headerActions={headerActions}
      showAudioButton={false}
      className="pt-12 xl:pt-14 pb-2"
    >
      <div>
        <WordHeadline word={word} isSplit={isSplit} />
        <WordPhonetics word={word} phoneticPreference={phoneticPreference} />
        <div className="min-h-[56px] xl:min-h-[64px] flex items-center justify-center px-6 mt-2">
          <WordMeaning word={word} className="text-lg xl:text-xl" />
        </div>
      </div>

      <WordContextPanels
        word={word}
        phoneticPreference={phoneticPreference}
        contextTab={contextTab}
        onContextTabChange={setContextTab}
        etymologyErrorText="构词分析失败，重新查询可再次补全"
      />
    </WordCardShell>
  )
}
