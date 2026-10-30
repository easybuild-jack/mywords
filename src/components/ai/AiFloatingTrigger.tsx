'use client'

import React from 'react'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'
export function AiFloatingTrigger() {
  const { isOpen, toggleDrawer } = useAiAssistantStore()

  // 如果已经展开，悬浮按钮隐藏以避免遮挡
  if (isOpen) return null

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
      <button
        onClick={toggleDrawer}
        className="group flex items-center justify-center w-12 h-12 rounded-l-xl bg-card hover:bg-muted border border-r-0 border-border shadow-md p-1.5 transition-colors duration-200 cursor-pointer"
        aria-label="打开 LinguaLoop Copilot"
      >
        <img
          src="/logo222.png"
          alt="LinguaLoop Copilot"
          className="size-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.34,1.4,0.64,1)] group-hover:rotate-[360deg] group-hover:scale-110"
        />
      </button>
    </div>
  )
}
