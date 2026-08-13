'use client'

import React from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { formatShortcutDisplay } from '@/lib/shortcuts'
import { isAudioMuted } from '@/lib/dictationCue'

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
    mode,
    dictationCueMode,
  } = useWorkspaceStore()

  const total = currentLoadedWords.length || 20
  const currentNum = Math.min(activeWordIndex + 1, total)
  const isMuted = isAudioMuted(mode, dictationCueMode)

  return (
    <footer className="w-full p-4 flex items-center justify-center pointer-events-auto z-30">
      <div className="glass-card rounded-2xl px-8 py-4 flex items-center gap-7 text-base text-[#9CA3AF] border border-white/10 shadow-lg flex-wrap justify-center">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-lg text-primary font-bold">
            {isErrorPracticeActive
              ? `${conqueredErrorWordIds?.length || 0} / ${total}`
              : `${currentNum} / ${total}`}
          </span>
          <span className="text-gray-500">{isErrorPracticeActive ? '已消灭' : '单词'}</span>
        </div>

        <div className="h-5 w-px bg-white/10" />

        <div className="flex items-center gap-6 font-mono text-sm flex-wrap justify-center">
          {showPeekHint && (
            <span className="flex items-center gap-2">
              <kbd className="px-2.5 py-1.5 rounded-md bg-white/[0.08] text-white border border-white/10 font-bold">
                {formatShortcutDisplay(shortcuts.peekHint)}
              </kbd>
              <span>偷看提示</span>
            </span>
          )}

          {/* 看译文默写全程静音，发音快捷键在这里也没有意义 */}
          {!isMuted && (
            <button
              type="button"
              onClick={replayAudio}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <kbd className="px-2.5 py-1.5 rounded-md bg-white/[0.08] text-white border border-white/10 font-bold">
                {formatShortcutDisplay(shortcuts.replayAudio)}
              </kbd>
              <span>发音</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevWord}
                title={`上一个单词 (${formatShortcutDisplay(shortcuts.prevWord)})`}
                className="px-2.5 py-1.5 rounded-md bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all"
              >
                {formatShortcutDisplay(shortcuts.prevWord)}
              </button>
              <button
                type="button"
                onClick={nextWord}
                title={`下一个单词 (${formatShortcutDisplay(shortcuts.nextWord)})`}
                className="px-2.5 py-1.5 rounded-md bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all"
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
