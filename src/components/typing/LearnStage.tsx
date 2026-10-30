'use client'

import React, { useEffect } from 'react'
import { Play } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useTypingKeyboard } from '@/hooks/useTypingKeyboard'
import { LearnCard } from '@/components/typing/LearnCard'
import { PracticeStageFrame } from '@/components/typing/PracticeStageFrame'
import { UnitCompleteCard } from '@/components/typing/UnitCompleteCard'
import { UnitLoadingSkeleton } from '@/components/typing/UnitLoadingSkeleton'

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
  const currentUnitMeta = useWorkspaceStore((s) => s.currentUnitMeta)
  const activeWordIndex = useWorkspaceStore((s) => s.activeWordIndex)
  const totalWords = useWorkspaceStore((s) => s.currentLoadedWords.length)

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
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center select-none">
              <p className="text-base text-muted-foreground mb-4">当前单元暂无单词或未能成功加载</p>
              <button
                onClick={() => useWorkspaceStore.getState().loadCurrentUnitWords()}
                className="h-9 px-4 rounded-lg border border-border text-foreground hover:bg-muted text-sm transition-colors cursor-pointer"
              >
                重新加载
              </button>
            </div>
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
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm p-6 text-center select-none animate-fadeIn">
                  <p className="text-sm text-muted-foreground mb-3">
                    {currentUnitMeta?.name || `Unit ${(currentUnitMeta?.order ?? 0) + 1}`} · 第 {activeWordIndex + 1} / {totalWords || 20} 词
                  </p>

                  <h2 className="text-3xl xl:text-4xl font-medium text-foreground tracking-tight mb-3">
                    准备好了就开始吧
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                    开始后会自动播放发音，边听边把单词打出来
                  </p>

                  <button
                    type="button"
                    onClick={() => onStartLearning?.()}
                    className="inline-flex items-center gap-2.5 h-11 px-6 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-base active:scale-[0.98] transition-colors cursor-pointer"
                  >
                    <Play className="size-4 fill-current" />
                    <span>开始学习</span>
                  </button>

                  <p className="text-xs text-muted-foreground mt-4">
                    或按 <kbd className="font-mono px-1.5 py-px rounded border border-border border-b-2 text-foreground/80">Space</kbd> / <kbd className="font-mono px-1.5 py-px rounded border border-border border-b-2 text-foreground/80">Enter</kbd>
                  </p>
                </div>
              )}
            </div>
          )}
        </PracticeStageFrame>
      )}
    </div>
  )
}
