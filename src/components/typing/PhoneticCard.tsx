'use client'

import React from 'react'
import { Delete, RotateCcw, Check } from 'lucide-react'
import type { WordItem } from '@/types'
import { formatMeaningText } from '@/lib/wordDisplay'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { InlineIpaKeyboard } from '@/components/typing/InlineIpaKeyboard'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface PhoneticCardProps {
  word: WordItem
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

/**
 * 默写音标卡片：
 * 根据当前【英文单词】和【中文译文】，默写出目标音标。
 * 音标键盘直接平铺展示在默写框下方，采用点选方式录入。
 */
export function PhoneticCard({
  word,
  phoneticPreference,
  remainingLoops = 1,
}: PhoneticCardProps) {
  const {
    dictationPhoneticInput,
    isPhoneticPassed,
    isPhoneticError,
    appendPhoneticSymbol,
    backspacePhonetic,
    clearPhonetic,
    submitPhoneticDictation,
  } = useWorkspaceStore()

  const meaningText = formatMeaningText(word)

  return (
    <WordCardShell
      word={word}
      phoneticPreference={phoneticPreference}
      remainingLoops={remainingLoops}
    >
      <div className="flex flex-col h-full justify-between gap-3 sm:gap-4 py-1">
        {/* 顶部线索区：英文单词 + 发音按钮 + 完整中文译文 */}
        <div className="space-y-1.5 sm:space-y-2">
          {/* 英文单词标题 */}
          <div className="flex items-center justify-center">
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white font-mono leading-tight">
              {word.name}
            </h2>
          </div>

          {/* 中文释义提示 */}
          <div className="min-h-7 flex items-center justify-center px-4">
            <p className="text-sm sm:text-base xl:text-lg text-gray-300 font-medium line-clamp-2 leading-relaxed max-w-2xl">
              {meaningText}
            </p>
          </div>
        </div>

        {/* 中间：音标默写回显槽与操作控制 */}
        <div className="w-full max-w-2xl mx-auto space-y-2">
          <div
            className={`h-14 sm:h-16 rounded-2xl border-2 px-4 sm:px-6 flex items-center justify-between transition-all duration-200 ${
              isPhoneticPassed
                ? 'border-emerald-500/70 bg-emerald-500/15 shadow-[0_0_24px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
                : isPhoneticError
                  ? 'border-destructive bg-destructive/15 animate-shake shadow-[0_0_24px_rgba(239,68,68,0.2)]'
                  : 'border-primary/45 bg-primary/[0.05] shadow-[0_0_20px_rgb(var(--primary-rgb)/0.15)]'
            }`}
          >
            {/* 默写音标内容 */}
            <div className="flex-1 min-w-0 flex items-center gap-2.5 h-full">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 font-sans select-none">
                音标
              </span>
              <div className="flex-1 min-w-0 flex items-center">
                {dictationPhoneticInput ? (
                  <span
                    className={`font-mono text-xl sm:text-2xl xl:text-3xl font-bold tracking-wider truncate leading-tight ${
                      isPhoneticPassed ? 'text-emerald-300' : 'text-primary'
                    }`}
                  >
                    /{dictationPhoneticInput}/
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm text-muted-foreground/60 font-sans font-normal truncate select-none">
                    请点选下方键盘输入音标，按 Enter 校验...
                  </span>
                )}
              </div>
            </div>

            {/* 右侧操作按钮群：退格、清空、校验确认 */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={backspacePhonetic}
                disabled={!dictationPhoneticInput}
                className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-xs font-medium text-gray-200 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                title="退格删除最后一个音标符号"
              >
                <Delete className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">退格</span>
              </button>

              <button
                type="button"
                onClick={clearPhonetic}
                disabled={!dictationPhoneticInput}
                className="h-9 sm:h-10 px-2 sm:px-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                title="清空已录入音标"
              >
                <RotateCcw className="size-3.5 sm:size-4" />
              </button>

              <button
                type="button"
                onClick={submitPhoneticDictation}
                disabled={!dictationPhoneticInput}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0C0E] text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-sm cursor-pointer flex items-center gap-1.5"
                title="校验音标 (Enter)"
              >
                <Check className="size-4 stroke-[2.5]" />
                <span>校验</span>
              </button>
            </div>
          </div>
        </div>

        {/* 下方：直接平铺展示在默写框下方的点选音标键盘 */}
        <div className="w-full">
          <InlineIpaKeyboard onSelectSymbol={appendPhoneticSymbol} />
        </div>
      </div>
    </WordCardShell>
  )
}
