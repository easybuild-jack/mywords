'use client'

import React from 'react'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'
import { Tooltip } from '@/components/ui/Tooltip'

export function AiFloatingTrigger() {
  const { isOpen, toggleDrawer } = useAiAssistantStore()

  // 如果已经展开，悬浮按钮隐藏以避免遮挡
  if (isOpen) return null

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
      <Tooltip content="MyWords Copilot (Ctrl + /)" side="left">
        <button
          onClick={toggleDrawer}
          className="group flex items-center justify-center size-10 rounded-l-xl bg-card hover:bg-muted shadow-[-4px_0_16px_rgba(0,0,0,0.15)] dark:shadow-[-4px_0_16px_rgba(0,0,0,0.5)] p-2 transition-all duration-200 hover:scale-105 cursor-pointer"
          aria-label="打开 MyWords Copilot"
        >
          <img
            src="/logo.svg"
            alt="MyWords Copilot"
            className="size-full object-contain group-hover:scale-110 transition-transform"
          />
        </button>
      </Tooltip>
    </div>
  )
}
