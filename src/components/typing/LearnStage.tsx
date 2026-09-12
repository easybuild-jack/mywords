'use client'

import React from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useTypingKeyboard } from '@/hooks/useTypingKeyboard'
import { LearnCard } from '@/components/typing/LearnCard'
import { PracticeStageFrame } from '@/components/typing/PracticeStageFrame'
import { UnitCompleteCard } from '@/components/typing/UnitCompleteCard'
import { UnitLoadingSkeleton } from '@/components/typing/UnitLoadingSkeleton'

interface LearnStageProps {
  isReady?: boolean
}

/** 跟学舞台：单词全程可见，专注拼读与构词法跟打 */
export function LearnStage({ isReady = true }: LearnStageProps) {
  const currentWord = useWorkspaceStore((s) => s.currentLoadedWords[s.activeWordIndex])
  const isUnitLoading = useWorkspaceStore((s) => s.isUnitLoading)
  const currentInput = useWorkspaceStore((s) => s.currentInput)
  const hasTypo = useWorkspaceStore((s) => s.hasTypo)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const currentWordRemainingLoops = useWorkspaceStore((s) => s.currentWordRemainingLoops)
  const isUnitFinished = useWorkspaceStore((s) => s.isUnitFinished)

  // 跟学页单词常驻可见，不需要偷看
  useTypingKeyboard({ enablePeek: false })

  return (
    <div className="relative w-full flex items-center justify-center gap-4 xl:gap-6 shrink-0">
      {isUnitFinished ? (
        <UnitCompleteCard />
      ) : (
        <PracticeStageFrame>
          {!isReady || isUnitLoading || !currentWord ? (
            <UnitLoadingSkeleton />
          ) : (
            <LearnCard
              word={currentWord}
              currentInput={currentInput}
              hasTypo={hasTypo}
              phoneticPreference={phoneticPreference}
              remainingLoops={currentWordRemainingLoops}
            />
          )}
        </PracticeStageFrame>
      )}
    </div>
  )
}
