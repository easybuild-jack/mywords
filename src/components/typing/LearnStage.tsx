'use client'

import React, { useEffect } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useTypingKeyboard } from '@/hooks/useTypingKeyboard'
import { LearnCard } from '@/components/typing/LearnCard'
import { PracticeStageFrame } from '@/components/typing/PracticeStageFrame'
import { UnitCompleteCard } from '@/components/typing/UnitCompleteCard'
import { UnitLoadingSkeleton } from '@/components/typing/UnitLoadingSkeleton'
import { EmptyUnitState, StartOverlay } from '@/components/typing/PracticeStageStates'

interface LearnStageProps {
  isReady?: boolean
  hasStarted?: boolean
  onStartLearning?: () => void
}

/** 跟学舞台：单词全程可见，专注拼读与构词法跟打 */
export function LearnStage({
  isReady = true,
  hasStarted = true,
  onStartLearning,
}: LearnStageProps) {
  const currentWord = useWorkspaceStore((s) => s.currentLoadedWords[s.activeWordIndex])
  const isUnitLoading = useWorkspaceStore((s) => s.isUnitLoading)
  const currentInput = useWorkspaceStore((s) => s.currentInput)
  const hasTypo = useWorkspaceStore((s) => s.hasTypo)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const currentWordRemainingLoops = useWorkspaceStore((s) => s.currentWordRemainingLoops)
  const isUnitFinished = useWorkspaceStore((s) => s.isUnitFinished)

  // 跟学页单词常驻可见，未点击「开始学习」前禁用键盘输入
  useTypingKeyboard({ enablePeek: false, disabled: !hasStarted })

  // 未开始时支持按 Space 或 Enter 键开始学习
  useEffect(() => {
    if (hasStarted || !isReady || isUnitLoading) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest?.('[role="dialog"]') ||
        Boolean(document.querySelector('[role="dialog"]'))
      ) {
        return
      }

      if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        onStartLearning?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasStarted, isReady, isUnitLoading, onStartLearning])

  return (
    <div className="relative w-full flex items-center justify-center gap-4 xl:gap-6 shrink-0">
      {isUnitFinished ? (
        <UnitCompleteCard />
      ) : (
        <PracticeStageFrame hasStarted={hasStarted}>
          {!isReady || isUnitLoading ? (
            <UnitLoadingSkeleton />
          ) : !currentWord ? (
            <EmptyUnitState />
          ) : (
            <div className="relative w-full h-full">
              <LearnCard
                word={currentWord}
                currentInput={currentInput}
                hasTypo={hasTypo}
                phoneticPreference={phoneticPreference}
                remainingLoops={currentWordRemainingLoops}
              />

              {/* 未点击「开始学习」时的沉浸引导蒙层 */}
              {!hasStarted && (
                <StartOverlay
                  title="准备好了就开始吧"
                  description="开始后会自动播放发音，边听边把单词打出来"
                  buttonLabel="开始学习"
                  onStart={onStartLearning}
                />
              )}
            </div>
          )}
        </PracticeStageFrame>
      )}
    </div>
  )
}
