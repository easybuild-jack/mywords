'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface PracticeStageFrameProps {
  children: React.ReactNode
  hasStarted?: boolean
}

const NAV_BUTTON_CLASS =
  'shrink-0 size-10 xl:size-11 rounded-full flex items-center justify-center transition-colors'

/** 练习页共用的舞台框架：左右切词按钮与居中的单词区域 */
export function PracticeStageFrame({ children, hasStarted = true }: PracticeStageFrameProps) {
  const prevWord = useWorkspaceStore((s) => s.prevWord)
  const nextWord = useWorkspaceStore((s) => s.nextWord)

  const navStateClass = hasStarted
    ? 'text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer'
    : 'text-muted-foreground/30 cursor-not-allowed'

  return (
    <>
      <button
        onClick={prevWord}
        disabled={!hasStarted}
        className={`${NAV_BUTTON_CLASS} ${navStateClass}`}
        title={hasStarted ? '上一词 (←)' : '请先点击开始学习'}
        aria-label="上一词"
      >
        <ChevronLeft className="size-6" />
      </button>

      <div className="relative flex flex-col items-center shrink-0">
        <div className="relative w-[800px] h-[580px] xl:w-[940px] xl:h-[630px] 2xl:w-[1060px] 2xl:h-[680px] max-w-[94vw] overflow-hidden shrink-0">
          {children}
        </div>
      </div>

      <button
        onClick={() => nextWord()}
        disabled={!hasStarted}
        className={`${NAV_BUTTON_CLASS} ${navStateClass}`}
        title={hasStarted ? '下一词 (→)' : '请先点击开始学习'}
        aria-label="下一词"
      >
        <ChevronRight className="size-6" />
      </button>
    </>
  )
}
