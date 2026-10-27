'use client'

import React, { useEffect } from 'react'
import { Play, Sparkles } from 'lucide-react'
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
                className="px-4 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 text-sm font-medium transition-all cursor-pointer"
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
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-6 text-center select-none animate-fadeIn">
                  {/* 单元与进度微标 */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs sm:text-sm font-semibold mb-5 shadow-[0_0_16px_rgba(var(--primary-rgb),0.2)]">
                    <Sparkles className="size-4" />
                    <span>
                      {currentUnitMeta?.name || `Unit ${(currentUnitMeta?.order ?? 0) + 1}`} · 第 {activeWordIndex + 1}/{totalWords || 20} 词已就绪
                    </span>
                  </div>

                  {/* 引导文案 */}
                  <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-foreground tracking-tight mb-2.5">
                    准备好开始学习了吗？
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-md mx-auto mb-8 leading-relaxed">
                    点击下方按钮进入本单元单词跟学流程，开启原声发音与智能拼打
                  </p>

                  {/* 开始学习按钮 */}
                  <button
                    type="button"
                    onClick={() => onStartLearning?.()}
                    className="group relative inline-flex items-center gap-3 px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base sm:text-lg shadow-[0_4px_24px_rgba(var(--primary-rgb),0.45)] hover:shadow-[0_6px_36px_rgba(var(--primary-rgb),0.65)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Play className="size-5 sm:size-6 fill-current transition-transform duration-200 group-hover:scale-110" />
                    <span>开始学习</span>
                    <span className="text-xs font-mono opacity-85 px-2 py-0.5 rounded-lg bg-black/25 border border-white/10">
                      Space / Enter ↵
                    </span>
                  </button>

                  <p className="text-xs text-muted-foreground/60 font-mono mt-4">
                    也可直接敲击键盘 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-foreground font-bold">Space</kbd> 或 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-foreground font-bold">Enter</kbd> 开启
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
