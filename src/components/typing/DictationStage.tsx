'use client'

import React, { useEffect } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useTypingKeyboard } from '@/hooks/useTypingKeyboard'
import { DictationCard } from '@/components/typing/DictationCard'
import { PracticeStageFrame } from '@/components/typing/PracticeStageFrame'
import { UnitCompleteCard } from '@/components/typing/UnitCompleteCard'
import { UnitLoadingSkeleton } from '@/components/typing/UnitLoadingSkeleton'
import { EmptyUnitState, StartOverlay } from '@/components/typing/PracticeStageStates'

interface DictationStageProps {
  isReady?: boolean
  hasStarted?: boolean
  onStartDictation?: () => void
}

/** 默写单词舞台：英文遮蔽，听音与中文释义提示 → 拼写盲打 */
export function DictationStage({
  isReady = true,
  hasStarted = true,
  onStartDictation,
}: DictationStageProps) {
  const currentWord = useWorkspaceStore((s) => s.currentLoadedWords[s.activeWordIndex])
  const isUnitLoading = useWorkspaceStore((s) => s.isUnitLoading)
  const currentInput = useWorkspaceStore((s) => s.currentInput)
  const hasTypo = useWorkspaceStore((s) => s.hasTypo)
  const isPeeking = useWorkspaceStore((s) => s.isPeeking)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const currentWordRemainingLoops = useWorkspaceStore((s) => s.currentWordRemainingLoops)
  const isUnitFinished = useWorkspaceStore((s) => s.isUnitFinished)

  // 默写卡键盘监听：支持按住 Tab 偷看；未点击「开始默写」前禁用键盘输入
  useTypingKeyboard({ enablePeek: true, disabled: !hasStarted })

  // 未开始时支持按 Space 或 Enter 键开始默写
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
        onStartDictation?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasStarted, isReady, isUnitLoading, onStartDictation])

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
              <DictationCard
                word={currentWord}
                currentInput={currentInput}
                hasTypo={hasTypo}
                isPeeking={isPeeking}
                phoneticPreference={phoneticPreference}
                remainingLoops={currentWordRemainingLoops}
              />

              {/* 未点击「开始默写」时的沉浸引导蒙层 */}
              {!hasStarted && (
                <StartOverlay
                  title="准备好开始默写了吗"
                  description="开始后会播放发音，根据释义和例句拼写出单词"
                  buttonLabel="开始默写"
                  onStart={onStartDictation}
                />
              )}
            </div>
          )}
        </PracticeStageFrame>
      )}
    </div>
  )
}
