'use client'

import React, { useState } from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'bottom'
  align?: 'start' | 'center' | 'end'
  className?: string
}

/**
 * shadcn/ui 风格的极简 Tooltip：用 hover/focus 触发，浮在子元素上方。
 * 相比原生 title=：立即出现（不用等 1.5s）、样式可控、深色背景下也清晰。
 * 不挡点击（pointer-events-none）。
 */
export function Tooltip({
  content,
  children,
  side = 'bottom',
  align = 'center',
  className = '',
}: TooltipProps) {
  const [visible, setVisible] = useState(false)

  const sideClass = side === 'bottom' ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]'
  const alignClass =
    align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute z-[80] ${sideClass} ${alignClass} px-2 py-1 rounded-md text-[11px] font-medium leading-snug whitespace-nowrap bg-[#12141A] text-white/90 border border-white/15 shadow-[0_6px_18px_rgba(0,0,0,0.5)] pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100`}
        >
          {content}
        </span>
      )}
    </span>
  )
}
