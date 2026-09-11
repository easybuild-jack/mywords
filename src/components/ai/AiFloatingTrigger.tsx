'use client'

import React from 'react'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'
import { Tooltip } from '@/components/ui/Tooltip'

export function AiFloatingTrigger() {
  const { isOpen, toggleDrawer } = useAiAssistantStore()

  // 如果已经展开，悬浮按钮可隐藏或淡化以避免重叠
  if (isOpen) return null

  return (
    <div className="fixed right-0 top-[50%] -translate-y-1/2 z-40 pointer-events-auto">
      <Tooltip content="点击展开 MyWords 顾问 (快捷键 Ctrl + /)" side="left">
        <button
          onClick={toggleDrawer}
          className="group relative flex items-center gap-2.5 pl-3.5 pr-2.5 py-3 rounded-l-2xl bg-sidebar/95 hover:bg-sidebar border-l border-t border-b border-white/15 hover:border-primary/40 shadow-[-6px_0_24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:pl-4.5 cursor-pointer"
        >
          {/* 边缘微光呼吸高亮条 */}
          <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary opacity-60 group-hover:opacity-100 group-hover:shadow-[0_0_10px_rgba(94,234,212,0.8)] transition-all" />

          {/* 专属 Logo 图标 */}
          <div className="size-7.5 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
            <img src="/logo.svg" alt="MyWords 顾问" className="size-full object-contain" />
          </div>

          {/* 竖排紧凑文字 */}
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[11px] font-bold text-white tracking-wider group-hover:text-primary transition-colors">
              MyWords
            </span>
            <span className="text-[10px] font-mono text-primary font-semibold">
              顾问
            </span>
          </div>
        </button>
      </Tooltip>
    </div>
  )
}
