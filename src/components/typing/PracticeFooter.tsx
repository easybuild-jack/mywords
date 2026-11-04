'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { formatShortcutDisplay } from '@/lib/shortcuts'

const KBD_CLASS =
  'h-6 min-w-6 px-1.5 inline-flex items-center justify-center rounded border border-border border-b-2 font-mono text-[11px] text-foreground/70 transition-colors'

interface PracticeFooterProps {
  /** 学习页单词常驻可见，不提示偷看键 */
  showPeekHint?: boolean
  /** 页面数据就绪标识 */
  isReady?: boolean
}

/** 练习页面底部的进度与快捷键提示条 */
export function PracticeFooter({ showPeekHint = false, isReady = true }: PracticeFooterProps) {
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
    starredWordIds,
    starCurrentWord,
    isUnitLoading,
  } = useWorkspaceStore()

  const total = currentLoadedWords.length || 20
  const currentNum = Math.min(activeWordIndex + 1, total)
  const isDictationError = isErrorPracticeActive && mode === 'dictation'

  const currentWord = currentLoadedWords[activeWordIndex]
  const isStarred = Boolean(currentWord && starredWordIds?.includes(currentWord.id))

  const isPreparing = !isReady || isUnitLoading

  return (
    <footer className="w-full px-6 py-3 xl:py-4 flex items-center justify-center pointer-events-auto z-30 shrink-0">
      <div className="w-[800px] xl:w-[940px] 2xl:w-[1060px] max-w-[94vw] pt-3 xl:pt-4 border-t border-border flex items-center justify-between gap-4 text-[13px] text-muted-foreground flex-wrap">
        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-foreground font-medium">
            {isPreparing
              ? '···'
              : isDictationError
              ? `${conqueredErrorWordIds?.length || 0} / ${total}`
              : `${currentNum} / ${total}`}
          </span>
          <span>{isDictationError ? '已消灭' : '单词'}</span>
        </div>

        <div className="flex items-center gap-4 xl:gap-5 flex-wrap justify-end">
          {showPeekHint && (
            <button
              type="button"
              onPointerDown={() => useWorkspaceStore.getState().peekHint(true)}
              onPointerUp={() => useWorkspaceStore.getState().peekHint(false)}
              onPointerLeave={() => useWorkspaceStore.getState().peekHint(false)}
              className="flex items-center gap-1.5 cursor-pointer select-none group focus:outline-none"
              title="按住鼠标或按 Tab 键偷看"
            >
              <kbd className={`${KBD_CLASS} group-hover:text-accent`}>
                {formatShortcutDisplay(shortcuts.peekHint)}
              </kbd>
              <span className="group-hover:text-accent transition-colors">偷看提示</span>
            </button>
          )}

          {mode === 'learn' && !isErrorPracticeActive && (
            <button
              type="button"
              onClick={starCurrentWord}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                isStarred ? 'text-amber-400 hover:text-amber-300' : 'hover:text-foreground'
              }`}
              title={isStarred ? `已在生词本（点击或 ${formatShortcutDisplay(shortcuts.toggleStar || 'Alt+W')} 移出）` : `一键加入生词本 (${formatShortcutDisplay(shortcuts.toggleStar || 'Alt+W')})`}
            >
              <kbd className={KBD_CLASS}>
                {formatShortcutDisplay(shortcuts.toggleStar || 'Alt+W')}
              </kbd>
              <Star className={`size-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isStarred ? '已在生词本' : '加入生词本'}</span>
            </button>
          )}

          {mode === 'learn' && (
            <button
              type="button"
              onClick={toggleCurrentWordSplit}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
              title={`音节拆分/合并 (${formatShortcutDisplay(shortcuts.toggleSplit || 'Alt+S')})`}
            >
              <kbd className={KBD_CLASS}>
                {formatShortcutDisplay(shortcuts.toggleSplit || 'Alt+S')}
              </kbd>
              <span>音节切分</span>
            </button>
          )}

          <button
            type="button"
            onClick={replayAudio}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
            title={`发音朗读 (${formatShortcutDisplay(shortcuts.replayAudio)})`}
          >
            <kbd className={KBD_CLASS}>
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
                className={`${KBD_CLASS} hover:text-foreground hover:border-foreground/30 cursor-pointer`}
              >
                {formatShortcutDisplay(shortcuts.prevWord)}
              </button>
              <button
                type="button"
                onClick={() => nextWord()}
                title={`下一个单词 (${formatShortcutDisplay(shortcuts.nextWord)})`}
                className={`${KBD_CLASS} hover:text-foreground hover:border-foreground/30 cursor-pointer`}
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
