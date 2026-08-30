'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption<T extends string | number> {
  value: T
  label: string
}

interface SelectProps<T extends string | number> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  className?: string
  /** 触发器宽度不够时，下拉按内容撑开 */
  align?: 'start' | 'end'
}

/**
 * shadcn/ui 风格的自定义下拉：用 button + 浮层取代原生 <select>，
 * 解决"原生下拉框在不同浏览器下长相不一致、不能换肤"的问题。
 * 触发器和浮层都使用全局 token（皮肤同步）。
 */
export function Select<T extends string | number>({
  value,
  onChange,
  options,
  className = '',
  align = 'start',
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = options.find((o) => o.value === value)

  // 点击外部自动关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-md border border-white/10 bg-white/[0.04] text-xs text-white/90 hover:bg-white/[0.08] hover:border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
      >
        <span className="truncate">{current?.label ?? '—'}</span>
        <ChevronDown
          className={`size-3.5 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute top-[calc(100%+4px)] z-[80] min-w-full w-max rounded-md border border-white/10 bg-[#12141A] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.55)] ring-1 ring-black/30 ${
            align === 'end' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-white/85 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span className="whitespace-nowrap">{opt.label}</span>
                {isSelected && <Check className="size-3.5 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
