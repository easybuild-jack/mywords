'use client'

import React from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useTypingKeyboard } from '@/hooks/useTypingKeyboard'
import { DictationCard } from '@/components/typing/DictationCard'
import { PracticeStageFrame } from '@/components/typing/PracticeStageFrame'
import { UnitCompleteCard } from '@/components/typing/UnitCompleteCard'

/** 默写单词舞台：英文遮蔽，听音/看译文 → 拼写盲打 */
export function DictationStage() {
  const currentWord = useWorkspaceStore((s) => s.currentLoadedWords[s.activeWordIndex])
  const currentInput = useWorkspaceStore((s) => s.currentInput)
  const hasTypo = useWorkspaceStore((s) => s.hasTypo)
  const isPeeking = useWorkspaceStore((s) => s.isPeeking)
  const dictationCueMode = useWorkspaceStore((s) => s.dictationCueMode)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const currentWordRemainingLoops = useWorkspaceStore((s) => s.currentWordRemainingLoops)
  const isUnitFinished = useWorkspaceStore((s) => s.isUnitFinished)

  useTypingKeyboard({ enablePeek: true })

  return (
    <div className="relative w-full flex-1 min-h-0 flex items-center justify-center gap-6">
      {isUnitFinished ? (
        <UnitCompleteCard />
      ) : (
        <PracticeStageFrame>
          {currentWord && (
            <DictationCard
              word={currentWord}
              currentInput={currentInput}
              hasTypo={hasTypo}
              isPeeking={isPeeking}
              cueMode={dictationCueMode}
              phoneticPreference={phoneticPreference}
              remainingLoops={currentWordRemainingLoops}
            />
          )}
        </PracticeStageFrame>
      )}
    </div>
  )
}
