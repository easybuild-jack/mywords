'use client'

import React from 'react'
import { Delete, RotateCcw, Check } from 'lucide-react'
import type { WordItem } from '@/types'
import { formatMeaningText, listPhonetics } from '@/lib/wordDisplay'
import { formatShortcutDisplay, DEFAULT_SHORTCUTS } from '@/lib/shortcuts'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { InlineIpaKeyboard } from '@/components/typing/InlineIpaKeyboard'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface PhoneticCardProps {
  word: WordItem
  phoneticPreference: 'us' | 'uk'
  remainingLoops?: number
}

function cleanPhoneticDisplay(raw?: string): string {
  if (!raw) return ''
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : ''
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
    isPeeking,
    shortcuts,
    peekHint,
    appendPhoneticSymbol,
    backspacePhonetic,
    clearPhonetic,
    submitPhoneticDictation,
  } = useWorkspaceStore()

  const phonetics = listPhonetics(word)
  const meaningText = formatMeaningText(word)
  const targetPhoneticPreview =
    phoneticPreference === 'uk'
      ? word.phoneticUk || word.phoneticUs
      : word.phoneticUs || word.phoneticUk

  return (
    <WordCardShell
      word={word}
      phoneticPreference={phoneticPreference}
      remainingLoops={remainingLoops}
      className="pt-3 pb-5 px-6 xl:pt-3.5 xl:pb-6 xl:px-8 2xl:pt-4 2xl:pb-7 2xl:px-10"
      headerActions={
        <button
          type="button"
          onPointerDown={() => peekHint(true)}
          onPointerUp={() => peekHint(false)}
          onPointerLeave={() => peekHint(false)}
          className={`h-9 xl:h-10 px-2.5 xl:px-3 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
            isPeeking
              ? 'bg-accent/20 text-accent border-accent/40 shadow-sm'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground/70 hover:text-white border-white/10'
          }`}
          title="按住鼠标或按 Tab 键偷看音标"
        >
          <span>{isPeeking ? '👀 已展开' : '按住偷看'}</span>
          <kbd className="px-1 py-0.5 rounded bg-white/10 text-[10px] font-mono">
            {formatShortcutDisplay(shortcuts?.peekHint || DEFAULT_SHORTCUTS.peekHint)}
          </kbd>
        </button>
      }
    >
      <div className="flex flex-col h-full justify-between gap-2.5 sm:gap-3 py-0.5">
        {/* 顶部线索区：英文单词 + 发音按钮 + 音标偷看提示 + 完整中文译文 */}
        <div className="space-y-1 sm:space-y-1.5">
          {/* 英文单词标题 */}
          <div className="flex items-center justify-center">
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white font-mono leading-tight">
              {word.name}
            </h2>
          </div>

          {/* 音标预留占位与提示区：高度固定预留（h-8 sm:h-9），展开与收起绝不撑大或抖动单词卡 */}
          <div className="h-8 sm:h-9 flex items-center justify-center">
            {isPeeking ? (
              <div className="h-full inline-flex items-center gap-2.5 px-3.5 sm:px-4 rounded-xl bg-accent/15 border border-accent/35 text-accent font-mono shadow-sm animate-in fade-in-50 duration-100">
                <span className="text-xs sm:text-sm font-sans font-bold opacity-90 flex items-center gap-1 shrink-0">
                  <span>👀</span>
                  <span>音标:</span>
                </span>
                <div className="flex items-center gap-3 text-base sm:text-lg xl:text-xl font-bold tracking-wide">
                  {phonetics.length > 0 ? (
                    phonetics.map((p, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        {p.label && (
                          <span className="text-xs sm:text-sm font-sans opacity-75 font-semibold">
                            {p.label}
                          </span>
                        )}
                        <span>{cleanPhoneticDisplay(p.text)}</span>
                      </span>
                    ))
                  ) : (
                    <span>{cleanPhoneticDisplay(targetPhoneticPreview) || '暂无音标'}</span>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onPointerDown={() => peekHint(true)}
                onPointerUp={() => peekHint(false)}
                onPointerLeave={() => peekHint(false)}
                className="h-full inline-flex items-center gap-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground/60 hover:text-muted-foreground border border-white/5 hover:border-white/10 text-xs sm:text-sm font-mono transition-all cursor-pointer select-none active:scale-95 group"
                title="按住鼠标或按快捷键偷看音标"
              >
                <span className="group-hover:text-accent transition-colors">按住偷看音标</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] sm:text-xs font-bold text-foreground/80 group-hover:bg-accent/20 group-hover:text-accent transition-colors">
                  {formatShortcutDisplay(shortcuts?.peekHint || DEFAULT_SHORTCUTS.peekHint)}
                </kbd>
              </button>
            )}
          </div>

          {/* 中文释义提示 */}
          <div className="min-h-5 sm:min-h-6 flex items-center justify-center px-4">
            <p className="text-xs sm:text-sm xl:text-base text-gray-300 font-medium line-clamp-1 leading-normal max-w-2xl">
              {meaningText}
            </p>
          </div>
        </div>

        {/* 中间：音标默写回显槽与操作控制 */}
        <div className="w-full max-w-2xl mx-auto space-y-2">
          <div
            className={`h-13 sm:h-14 rounded-2xl border-2 px-4 sm:px-6 flex items-center justify-between transition-all duration-200 ${
              isPhoneticPassed
                ? 'border-emerald-500/70 bg-emerald-500/15 ring-1 ring-emerald-500/50'
                : isPhoneticError
                  ? 'border-destructive bg-destructive/15 animate-shake'
                  : 'border-primary/45 bg-primary/[0.05]'
            }`}
          >
            {/* 默写音标内容：纯粹显示用户录入，偷看时绝不在输入框出现提示 */}
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
