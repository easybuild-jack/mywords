'use client'

import React from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useTypingKeyboard } from '@/hooks/useTypingKeyboard'
import { DictationCard } from '@/components/typing/DictationCard'
import { PracticeStageFrame } from '@/components/typing/PracticeStageFrame'
import { UnitCompleteCard } from '@/components/typing/UnitCompleteCard'
import { UnitLoadingSkeleton } from '@/components/typing/UnitLoadingSkeleton'

interface DictationStageProps {
  isReady?: boolean
}

/** 默写单词舞台：英文遮蔽，听音/看译文 → 拼写盲打 */
export function DictationStage({ isReady = true }: DictationStageProps) {
  const currentWord = useWorkspaceStore((s) => s.currentLoadedWords[s.activeWordIndex])
  const isUnitLoading = useWorkspaceStore((s) => s.isUnitLoading)
  const currentInput = useWorkspaceStore((s) => s.currentInput)
  const hasTypo = useWorkspaceStore((s) => s.hasTypo)
  const isPeeking = useWorkspaceStore((s) => s.isPeeking)
  const dictationCueMode = useWorkspaceStore((s) => s.dictationCueMode)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const currentWordRemainingLoops = useWorkspaceStore((s) => s.currentWordRemainingLoops)
  const isUnitFinished = useWorkspaceStore((s) => s.isUnitFinished)

  useTypingKeyboard({ enablePeek: true })

  return (
    <div className="relative w-full flex items-center justify-center gap-4 xl:gap-6 shrink-0">
      {isUnitFinished ? (
        <UnitCompleteCard />
      ) : (
        <PracticeStageFrame>
          {!isReady || isUnitLoading ? (
            <UnitLoadingSkeleton />
          ) : !currentWord ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center select-none">
              <p className="text-base text-muted-foreground mb-4">当前单元暂无单词或未能成功加载</p>
              <button
                onClick={() => useWorkspaceStore.getState().loadCurrentUnitWords()}
                className="px-4 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 text-sm font-medium transition-all cursor-pointer"
              >
                重新加载
              </button>
            </div>
          ) : (
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
