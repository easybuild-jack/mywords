'use client'

import React from 'react'
import Link from 'next/link'
import { RotateCcw, Flame, X, Headphones, Languages } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export function HeaderToolbar() {
  const {
    currentBook,
    currentUnitIndex,
    isErrorPracticeActive,
    conqueredErrorWordIds,
    currentLoadedWords,
    exitErrorPractice,
    loopCountSetting,
    setLoopCountSetting,
    mode,
    dictationCueMode,
    setDictationCueMode,
    phoneticPreference,
    setPhoneticPreference,
    restartUnit,
  } = useWorkspaceStore()

  return (
    <header className="w-full flex items-center justify-center p-4 sticky top-0 z-30 pointer-events-auto">
      <div className="glass-card rounded-2xl px-5 py-2.5 flex items-center gap-4 text-sm max-w-5xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10">
        {/* 1. 词书与章节快速入口 / 错词本攻坚模式指示 */}
        {isErrorPracticeActive ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/15 border border-destructive/30 text-white font-medium">
            <Flame className="size-4 text-destructive animate-pulse" />
            <span className="text-destructive font-bold text-xs">错词攻坚</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-gray-300 font-mono">
              已消灭 {conqueredErrorWordIds?.length || 0} / {currentLoadedWords.length} 词
            </span>
            <button
              onClick={exitErrorPractice}
              className="ml-1 p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-all cursor-pointer"
              title="退出错词攻坚，返回常规章节"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/books"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium transition-all"
          >
            <span className="text-primary font-bold">{currentBook?.name || 'CET-4'}</span>
            <span className="text-muted-foreground">·</span>
            <span>第 {currentUnitIndex + 1} 章</span>
          </Link>
        )}

        {/* 2. 发音口音下拉切换 */}
        <div className="flex items-center gap-1.5">
          <select
            value={phoneticPreference}
            onChange={(e) => setPhoneticPreference(e.target.value as 'us' | 'uk')}
            className="bg-white/[0.06] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="us" className="bg-[#12141A] text-white">美音 (US)</option>
            <option value="uk" className="bg-[#12141A] text-white">英音 (UK)</option>
          </select>
        </div>

        {/* 分隔线 */}
        <div className="h-4 w-px bg-white/10" />

        {/* 3. 单个单词循环次数配置 */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isErrorPracticeActive ? (
            <div
              className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
              title="错词攻坚强制连续 3 次无误默写"
            >
              循环 3次 (3-Streak)
            </div>
          ) : (
            <select
              value={loopCountSetting}
              onChange={(e) => setLoopCountSetting(Number(e.target.value) as 1 | 2 | 3 | 5)}
              className="bg-white/[0.06] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value={1} className="bg-[#12141A] text-white">循环 1次</option>
              <option value={2} className="bg-[#12141A] text-white">循环 2次</option>
              <option value={3} className="bg-[#12141A] text-white">循环 3次</option>
              <option value={5} className="bg-[#12141A] text-white">循环 5次</option>
            </select>
          )}
        </div>

        {/* 4. 默写线索来源二选一，学习页不出现 */}
        {mode === 'dictation' && (
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setDictationCueMode('listen')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                dictationCueMode === 'listen'
                  ? 'bg-primary/20 text-primary font-bold'
                  : 'text-muted-foreground hover:text-white'
              }`}
              title="只给发音，需要写出中文释义与拼写"
            >
              <Headphones className="size-3.5" />
              <span>听音默写</span>
            </button>
            <button
              onClick={() => setDictationCueMode('meaning')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                dictationCueMode === 'meaning'
                  ? 'bg-accent/20 text-accent font-bold'
                  : 'text-muted-foreground hover:text-white'
              }`}
              title="只给中文释义，不自动发音（可手动点或按 Ctrl+J 听），需要写出拼写"
            >
              <Languages className="size-3.5" />
              <span>看译文默写</span>
            </button>
          </div>
        )}

        {/* 5. Restart 按钮 */}
        <button
          onClick={restartUnit}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-[#0B0C0E] font-bold text-xs btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer whitespace-nowrap"
          title="Restart (回到第一个单词)"
        >
          <RotateCcw className="size-3.5" />
          <span>Restart</span>
        </button>
      </div>
    </header>
  )
}
