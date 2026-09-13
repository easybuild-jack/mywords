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
    currentUnitMeta,
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
    <header className="w-full flex items-center justify-center p-4 xl:p-6 relative z-30 pointer-events-auto shrink-0">
      {/* 宽度与单词卡（PracticeStageFrame）保持一致：w-[800px] xl:w-[940px] 2xl:w-[1060px] */}
      <div className="glass-card rounded-2xl xl:rounded-3xl px-5 xl:px-7 py-2.5 xl:py-3.5 flex items-center gap-4 xl:gap-5 text-sm xl:text-base w-[800px] xl:w-[940px] 2xl:w-[1060px] max-w-[94vw] justify-between shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10 transition-all duration-300">
        {/* 左区：词书 / 单元入口（flex-1 预留展示空间，长词书名、长单元名可完整显示） */}
        <div className="flex items-center flex-1 min-w-0">
          {isErrorPracticeActive ? (
            <div className="flex items-center gap-2 px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-destructive/15 border border-destructive/30 text-white font-medium">
              <Flame className="size-4 xl:size-4.5 text-destructive animate-pulse" />
              <span className="text-destructive font-bold text-xs xl:text-sm">
                {mode === 'learn' ? '生错词练习' : '生错词攻坚'}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs xl:text-sm text-gray-300 font-mono">
                {mode === 'learn'
                  ? `第 ${activeWordIndex + 1} / ${currentLoadedWords.length} 词`
                  : `已消灭 ${conqueredErrorWordIds?.length || 0} / ${currentLoadedWords.length} 词`}
              </span>
              <Tooltip content="退出生错词练习，返回常规章节" side="bottom">
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
              href={`/books?from=${mode}`}
              className="flex items-center gap-2 px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium transition-all text-xs xl:text-sm min-w-0 max-w-full"
            >
              <span className="text-primary font-bold shrink-0">{currentBook?.name || 'CET-4'}</span>
              <span className="text-muted-foreground shrink-0">·</span>
              {currentUnitMeta ? (
                <>
                  <span className="font-mono shrink-0">Unit {currentUnitIndex + 1}</span>
                  <span className="text-muted-foreground shrink-0">·</span>
                  <span className="text-white/90 truncate min-w-0">{currentUnitMeta.name}</span>
                </>
              ) : (
                <span className="shrink-0">第 {currentUnitIndex + 1} 章</span>
              )}
            </Link>
          )}
        </div>

        {/* 右区：控制项（shrink-0 不压缩，始终靠右对齐） */}
        <div className="flex items-center gap-4 xl:gap-5 shrink-0">
          {/* 默写线索来源二选一（置前展示，默认「看译文默写」） */}
          {mode === 'dictation' && (
            <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg xl:rounded-xl border border-white/10">
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
            </div>
          )}

          {/* 发音口音下拉 */}
          <Select<'us' | 'uk'>
            value={phoneticPreference}
            onChange={setPhoneticPreference}
            options={ACCENT_OPTIONS}
          />

          {/* 分隔线 */}
          <div className="h-4 xl:h-5 w-px bg-white/10" />

          {/* 单个单词循环次数配置 */}
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

          {/* 皮肤切换（仅配色） */}
          <SkinPicker />

          {/* Restart 按钮 */}
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
      </div>
    </header>
  )
}
