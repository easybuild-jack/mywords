'use client'

import React from 'react'
import { Play } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/** 单元没有单词或加载失败时的占位 */
export function EmptyUnitState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center select-none">
      <p className="text-base text-muted-foreground mb-4">当前单元暂无单词或未能成功加载</p>
      <button
        onClick={() => useWorkspaceStore.getState().loadCurrentUnitWords()}
        className="h-9 px-4 rounded-lg border border-border text-foreground hover:bg-muted text-sm transition-colors cursor-pointer"
      >
        重新加载
      </button>
    </div>
  )
}

interface StartOverlayProps {
  title: string
  description: string
  buttonLabel: string
  onStart?: () => void
}

/** 未点击「开始」前覆盖在单词页上的引导层，避免切页后自动发音太突兀 */
export function StartOverlay({ title, description, buttonLabel, onStart }: StartOverlayProps) {
  const currentUnitMeta = useWorkspaceStore((s) => s.currentUnitMeta)
  const activeWordIndex = useWorkspaceStore((s) => s.activeWordIndex)
  const totalWords = useWorkspaceStore((s) => s.currentLoadedWords.length)

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm p-6 text-center select-none animate-fadeIn">
      <p className="text-sm text-muted-foreground mb-3">
        {currentUnitMeta?.name || `Unit ${(currentUnitMeta?.order ?? 0) + 1}`} · 第 {activeWordIndex + 1} / {totalWords || 20} 词
      </p>

      <h2 className="text-3xl xl:text-4xl font-medium text-foreground tracking-tight mb-3">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">{description}</p>

      <button
        type="button"
        onClick={() => onStart?.()}
        className="inline-flex items-center gap-2.5 h-11 px-6 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-base active:scale-[0.98] transition-colors cursor-pointer"
      >
        <Play className="size-4 fill-current" />
        <span>{buttonLabel}</span>
      </button>

      <p className="text-xs text-muted-foreground mt-4">
        或按 <kbd className="font-mono px-1.5 py-px rounded border border-border border-b-2 text-foreground/80">Space</kbd> /{' '}
        <kbd className="font-mono px-1.5 py-px rounded border border-border border-b-2 text-foreground/80">Enter</kbd>
      </p>
    </div>
  )
}
