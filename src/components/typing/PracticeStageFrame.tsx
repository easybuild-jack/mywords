'use client'

import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface PracticeStageFrameProps {
  children: React.ReactNode
  hasStarted?: boolean
}

/** 练习页共用的舞台框架：左右切词按钮与居中卡片容器 */
export function PracticeStageFrame({ children, hasStarted = true }: PracticeStageFrameProps) {
  const prevWord = useWorkspaceStore((s) => s.prevWord)
  const nextWord = useWorkspaceStore((s) => s.nextWord)

  return (
    <>
      <button
        onClick={prevWord}
        disabled={!hasStarted}
        className={`shrink-0 size-10 xl:size-12 rounded-full glass-card flex items-center justify-center transition-all ${
          hasStarted
            ? 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95 cursor-pointer'
            : 'text-[#9CA3AF]/40 border-white/5 opacity-40 cursor-not-allowed'
        }`}
        title={hasStarted ? '上一词 (←)' : '请先点击开始学习'}
      >
        <ArrowLeft className="size-5 xl:size-6" />
      </button>

      <div className="relative flex flex-col items-center shrink-0">
        <div className="relative w-[800px] h-[580px] xl:w-[940px] xl:h-[630px] 2xl:w-[1060px] 2xl:h-[680px] max-w-[94vw] rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl transition-all duration-300 shrink-0">
          {children}
        </div>
      </div>

      <button
        onClick={() => nextWord()}
        disabled={!hasStarted}
        className={`shrink-0 size-10 xl:size-12 rounded-full glass-card flex items-center justify-center transition-all ${
          hasStarted
            ? 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95 cursor-pointer'
            : 'text-[#9CA3AF]/40 border-white/5 opacity-40 cursor-not-allowed'
        }`}
        title={hasStarted ? '下一词 (→)' : '请先点击开始学习'}
      >
        <ArrowRight className="size-5 xl:size-6" />
      </button>
    </>
  )
}
