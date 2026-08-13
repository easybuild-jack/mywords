'use client'

import React from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { formatShortcutDisplay } from '@/lib/shortcuts'

interface PracticeFooterProps {
  /** 学习页单词常驻可见，不提示偷看键 */
  showPeekHint?: boolean
}

/** 练习页面底部的进度与快捷键提示条 */
export function PracticeFooter({ showPeekHint = false }: PracticeFooterProps) {
  const {
    activeWordIndex,
    currentLoadedWords,
    shortcuts,
    replayAudio,
    prevWord,
    nextWord,
    isErrorPracticeActive,
    conqueredErrorWordIds,
  } = useWorkspaceStore()

  const total = currentLoadedWords.length || 20
  const currentNum = Math.min(activeWordIndex + 1, total)

  return (
    <footer className="w-full p-4 flex items-center justify-center pointer-events-auto z-30">
      {/* 尺寸以 HeaderToolbar 为准：同样的 px-5 py-2.5 与 28px 内容行高，两条工具栏等高 */}
      <div className="glass-card rounded-2xl px-5 py-2.5 flex items-center gap-4 text-sm text-[#9CA3AF] border border-white/10 shadow-lg flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary font-bold">
            {isErrorPracticeActive
              ? `${conqueredErrorWordIds?.length || 0} / ${total}`
              : `${currentNum} / ${total}`}
          </span>
          <span className="text-gray-500">{isErrorPracticeActive ? '已消灭' : '单词'}</span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-4 font-mono text-xs flex-wrap justify-center">
          {showPeekHint && (
            <span className="flex items-center gap-1.5">
              <kbd className="h-7 px-2 inline-flex items-center rounded bg-white/[0.08] text-white border border-white/10 font-bold">
                {formatShortcutDisplay(shortcuts.peekHint)}
              </kbd>
              <span>偷看提示</span>
            </span>
          )}

          <button
            type="button"
            onClick={replayAudio}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <kbd className="h-7 px-2 inline-flex items-center rounded bg-white/[0.08] text-white border border-white/10 font-bold">
              {formatShortcutDisplay(shortcuts.replayAudio)}
            </kbd>
            <span>发音</span>
          </button>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevWord}
                title={`上一个单词 (${formatShortcutDisplay(shortcuts.prevWord)})`}
                className="h-7 px-2 inline-flex items-center rounded bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all"
              >
                {formatShortcutDisplay(shortcuts.prevWord)}
              </button>
              <button
                type="button"
                onClick={nextWord}
                title={`下一个单词 (${formatShortcutDisplay(shortcuts.nextWord)})`}
                className="h-7 px-2 inline-flex items-center rounded bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all"
              >
                {formatShortcutDisplay(shortcuts.nextWord)}
              </button>
            </div>
            <span>切换单词</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
