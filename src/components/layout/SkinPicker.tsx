'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Palette, Check } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { SKINS } from '@/lib/skins'
import { Tooltip } from '@/components/ui/Tooltip'

/**
 * 头部工具栏的皮肤切换按钮 + 下拉浮层。
 * 浮层定位于按钮下方，点击外部自动关闭，遵循现有 toolbar 风格。
 */
export function SkinPicker() {
  const skinId = useWorkspaceStore((s) => s.skinId)
  const setSkinId = useWorkspaceStore((s) => s.setSkinId)

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部自动关闭
  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Tooltip content="切换皮肤（仅配色）" side="bottom">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
          aria-label="切换皮肤"
        >
          <Palette className="size-4" />
        </button>
      </Tooltip>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-[100] w-72 rounded-2xl bg-[#12141A] p-2 border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.85)] ring-1 ring-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            选择皮肤 · 仅配色
          </div>
          <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
            {SKINS.map((skin) => {
              const isActive = skin.id === skinId
              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => {
                    setSkinId(skin.id)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary/15 border border-primary/30'
                      : 'hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  {/* 配色预览：用 skin 的 token 实时渲染两块小色块 */}
                  <div className="flex items-center -space-x-1 shrink-0">
                    <span
                      className="size-5 rounded-md border border-white/15"
                      style={{ background: skin.tokens.sidebarBg }}
                      aria-hidden
                    />
                    <span
                      className="size-5 rounded-md border border-white/15"
                      style={{ background: skin.tokens.primary }}
                      aria-hidden
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-white'}`}>
                      {skin.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{skin.tagline}</div>
                  </div>
                  {isActive && <Check className="size-4 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
