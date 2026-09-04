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
    toggleCurrentWordSplit,
    setEditWordSplitModalOpen,
    mode,
  } = useWorkspaceStore()

  const total = currentLoadedWords.length || 20
  const currentNum = Math.min(activeWordIndex + 1, total)
  const isDictationError = isErrorPracticeActive && mode === 'dictation'

  return (
    <footer className="w-full p-4 xl:p-6 flex items-center justify-center pointer-events-auto z-30">
      {/* 尺寸以 HeaderToolbar 为准：同样的 px-5 py-2.5 到 xl:px-7 xl:py-3.5，两条工具栏等高并同步放大 */}
      <div className="glass-card rounded-2xl xl:rounded-3xl px-5 xl:px-7 py-2.5 xl:py-3.5 flex items-center gap-4 xl:gap-6 text-sm xl:text-base text-[#9CA3AF] border border-white/10 shadow-lg flex-wrap justify-center transition-all duration-300">
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary font-bold text-sm xl:text-base">
            {isDictationError
              ? `${conqueredErrorWordIds?.length || 0} / ${total}`
              : `${currentNum} / ${total}`}
          </span>
          <span className="text-gray-500 text-xs xl:text-sm">{isDictationError ? '已消灭' : '单词'}</span>
        </div>

        <div className="h-4 xl:h-5 w-px bg-white/10" />

        <div className="flex items-center gap-4 xl:gap-5 font-mono text-xs xl:text-sm flex-wrap justify-center">
          {showPeekHint && (
            <span className="flex items-center gap-1.5 xl:gap-2">
              <kbd className="h-7 xl:h-8 px-2 xl:px-2.5 inline-flex items-center rounded-md xl:rounded-lg bg-white/[0.08] text-white border border-white/10 font-bold">
                {formatShortcutDisplay(shortcuts.peekHint)}
              </kbd>
              <span>偷看提示</span>
            </span>
          )}

          <button
            type="button"
            onClick={toggleCurrentWordSplit}
            className="flex items-center gap-1.5 xl:gap-2 hover:text-white transition-colors cursor-pointer"
            title={`音节拆分/合并 (${formatShortcutDisplay(shortcuts.toggleSplit || 'Alt+S')})`}
          >
            <kbd className="h-7 xl:h-8 px-2 xl:px-2.5 inline-flex items-center rounded-md xl:rounded-lg bg-white/[0.08] text-white border border-white/10 font-bold">
              {formatShortcutDisplay(shortcuts.toggleSplit || 'Alt+S')}
            </kbd>
            <span>音节切分</span>
          </button>

          <button
            type="button"
            onClick={replayAudio}
            className="flex items-center gap-1.5 xl:gap-2 hover:text-white transition-colors cursor-pointer"
            title={`发音朗读 (${formatShortcutDisplay(shortcuts.replayAudio)})`}
          >
            <kbd className="h-7 xl:h-8 px-2 xl:px-2.5 inline-flex items-center rounded-md xl:rounded-lg bg-white/[0.08] text-white border border-white/10 font-bold">
              {formatShortcutDisplay(shortcuts.replayAudio)}
            </kbd>
            <span>发音</span>
          </button>

          <div className="flex items-center gap-1.5 xl:gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevWord}
                title={`上一个单词 (${formatShortcutDisplay(shortcuts.prevWord)})`}
                className="h-7 xl:h-8 px-2 xl:px-2.5 inline-flex items-center rounded-md xl:rounded-lg bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              >
                {formatShortcutDisplay(shortcuts.prevWord)}
              </button>
              <button
                type="button"
                onClick={nextWord}
                title={`下一个单词 (${formatShortcutDisplay(shortcuts.nextWord)})`}
                className="h-7 xl:h-8 px-2 xl:px-2.5 inline-flex items-center rounded-md xl:rounded-lg bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
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
