'use client'

import React from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { WordStage } from '@/components/typing/WordStage'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { formatShortcutDisplay } from '@/lib/shortcuts'

export default function HomePage() {
  const {
    activeWordIndex,
    getUnitWords,
    replayAudio,
    prevWord,
    nextWord,
    shortcuts,
    loadCurrentUnitWords,
    isErrorPracticeActive,
    conqueredErrorWordIds,
  } = useWorkspaceStore()

  React.useEffect(() => {
    loadCurrentUnitWords()
  }, [loadCurrentUnitWords])

  const unitWords = getUnitWords()
  const totalInUnit = unitWords.length || 20
  const currentNum = Math.min(activeWordIndex + 1, totalInUnit)

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between h-full relative">
      {/* 1. 顶部综合控制栏 */}
      <HeaderToolbar />

      {/* 2. 中间单张活跃词卡 */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative w-full px-4">
        <WordStage />
      </div>

      {/* 3. 底部极简状态与快捷键提示栏 */}
      <footer className="w-full p-4 flex items-center justify-center pointer-events-auto z-30">
        <div className="glass-card rounded-2xl px-6 py-3 flex items-center gap-5 text-sm text-[#9CA3AF] border border-white/10 shadow-lg flex-wrap justify-center">
          {/* 当前单元/错词进度 */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-primary font-bold">
              {isErrorPracticeActive ? `${conqueredErrorWordIds?.length || 0} / ${totalInUnit}` : `${currentNum} / ${totalInUnit}`}
            </span>
            <span className="text-gray-500">{isErrorPracticeActive ? '已消灭' : '单词'}</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* 快捷键提示胶囊 */}
          <div className="flex items-center gap-5 font-mono text-xs flex-wrap justify-center">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 rounded bg-white/[0.08] text-white border border-white/10 font-bold">
                {formatShortcutDisplay(shortcuts.peekHint)}
              </kbd>
              <span>偷看提示</span>
            </span>

            <button
              type="button"
              onClick={replayAudio}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <kbd className="px-2 py-1 rounded bg-white/[0.08] text-white border border-white/10 font-bold">
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
                  className="px-1.5 py-1 rounded bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all"
                >
                  {formatShortcutDisplay(shortcuts.prevWord)}
                </button>
                <button
                  type="button"
                  onClick={nextWord}
                  title={`下一个单词 (${formatShortcutDisplay(shortcuts.nextWord)})`}
                  className="px-1.5 py-1 rounded bg-white/[0.08] text-white border border-white/10 font-bold hover:bg-white/20 active:scale-95 transition-all"
                >
                  {formatShortcutDisplay(shortcuts.nextWord)}
                </button>
              </div>
              <span>切换单词</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
