'use client'

import React from 'react'
import Link from 'next/link'
import { RotateCcw, Flame, X, Headphones, Languages } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { SkinPicker } from '@/components/layout/SkinPicker'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Tooltip } from '@/components/ui/Tooltip'

const ACCENT_OPTIONS: SelectOption<'us' | 'uk'>[] = [
  { value: 'us', label: '美音 (US)' },
  { value: 'uk', label: '英音 (UK)' },
]

const LOOP_OPTIONS: SelectOption<1 | 2 | 3 | 5>[] = [
  { value: 1, label: '循环 1次' },
  { value: 2, label: '循环 2次' },
  { value: 3, label: '循环 3次' },
  { value: 5, label: '循环 5次' },
]

export function HeaderToolbar() {
  const {
    currentBook,
    currentUnitIndex,
    activeWordIndex,
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
    <header className="w-full flex items-center justify-center p-4 xl:p-6 sticky top-0 z-30 pointer-events-auto">
      <div className="glass-card rounded-2xl xl:rounded-3xl px-5 xl:px-7 py-2.5 xl:py-3.5 flex items-center gap-4 xl:gap-5 text-sm xl:text-base max-w-5xl xl:max-w-6xl 2xl:max-w-7xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10 transition-all duration-300">
        {/* 1. 词书与章节快速入口 / 错词本攻坚模式指示 */}
        {isErrorPracticeActive ? (
          <div className="flex items-center gap-2 px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-destructive/15 border border-destructive/30 text-white font-medium">
            <Flame className="size-4 xl:size-4.5 text-destructive animate-pulse" />
            <span className="text-destructive font-bold text-xs xl:text-sm">
              {mode === 'learn' ? '错词练习' : '错词攻坚'}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs xl:text-sm text-gray-300 font-mono">
              {mode === 'learn'
                ? `第 ${activeWordIndex + 1} / ${currentLoadedWords.length} 词`
                : `已消灭 ${conqueredErrorWordIds?.length || 0} / ${currentLoadedWords.length} 词`}
            </span>
            <Tooltip content="退出错词练习，返回常规章节" side="bottom">
              <button
                onClick={exitErrorPractice}
                className="ml-1 p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-all cursor-pointer"
              >
                <X className="size-3.5 xl:size-4" />
              </button>
            </Tooltip>
          </div>
        ) : (
          <Link
            href="/books"
            className="flex items-center gap-2 px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium transition-all text-xs xl:text-sm"
          >
            <span className="text-primary font-bold">{currentBook?.name || 'CET-4'}</span>
            <span className="text-muted-foreground">·</span>
            <span>第 {currentUnitIndex + 1} 章</span>
          </Link>
        )}

        {/* 2. 发音口音下拉 */}
        <Select<'us' | 'uk'>
          value={phoneticPreference}
          onChange={setPhoneticPreference}
          options={ACCENT_OPTIONS}
        />

        {/* 分隔线 */}
        <div className="h-4 xl:h-5 w-px bg-white/10" />

        {/* 3. 单个单词循环次数配置 */}
        {isErrorPracticeActive && mode === 'dictation' ? (
          <Tooltip content="错词攻坚强制连续 3 次无误默写" side="bottom">
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md xl:rounded-lg h-8 xl:h-9 px-3 xl:px-3.5 inline-flex items-center text-xs xl:text-sm font-mono font-bold cursor-default">
              循环 3次 (3-Streak)
            </div>
          </Tooltip>
        ) : (
          <Select<1 | 2 | 3 | 5>
            value={loopCountSetting}
            onChange={setLoopCountSetting}
            options={LOOP_OPTIONS}
          />
        )}

        {/* 4. 默写线索来源二选一，学习页不出现 */}
        {mode === 'dictation' && (
          <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg xl:rounded-xl border border-white/10">
            <Tooltip content="只给发音，需要写出中文释义与拼写" side="bottom">
              <button
                onClick={() => setDictationCueMode('listen')}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1 xl:py-1.5 rounded-md xl:rounded-lg text-xs xl:text-sm transition-all cursor-pointer ${
                  dictationCueMode === 'listen'
                    ? 'bg-primary/20 text-primary font-bold'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Headphones className="size-3.5 xl:size-4" />
                <span>听音默写</span>
              </button>
            </Tooltip>
            <Tooltip content="只给中文释义，不自动发音（可手动点或按 Ctrl+J 听），需要写出拼写" side="bottom">
              <button
                onClick={() => setDictationCueMode('meaning')}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1 xl:py-1.5 rounded-md xl:rounded-lg text-xs xl:text-sm transition-all cursor-pointer ${
                  dictationCueMode === 'meaning'
                    ? 'bg-accent/20 text-accent font-bold'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Languages className="size-3.5 xl:size-4" />
                <span>看译文默写</span>
              </button>
            </Tooltip>
          </div>
        )}

        {/* 5. 皮肤切换（仅配色） */}
        <SkinPicker />

        {/* 6. Restart 按钮 */}
        <Tooltip content="Restart (回到第一个单词)" side="bottom">
          <button
            onClick={restartUnit}
            className="flex items-center gap-1.5 px-4 xl:px-5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-primary text-[#0B0C0E] font-bold text-xs xl:text-sm btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
          >
            <RotateCcw className="size-3.5 xl:size-4" />
            <span>Restart</span>
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
