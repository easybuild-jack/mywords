'use client'

import React from 'react'
import { Delete, RotateCcw, Check } from 'lucide-react'
import type { WordItem } from '@/types'
import { listPhonetics } from '@/lib/wordDisplay'
import { formatShortcutDisplay, DEFAULT_SHORTCUTS } from '@/lib/shortcuts'
import { WordCardShell } from '@/components/typing/WordCardShell'
import { InlineIpaKeyboard } from '@/components/typing/InlineIpaKeyboard'
import { WORD_HEADER_BUTTON_CLASS, WordMeaning } from '@/components/word/WordDisplay'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useEnsureAiWordSections } from '@/hooks/useEnsureAiWordSections'
import { isAiWordCoreReady } from '@/lib/aiWordCore'

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

const GHOST_ACTION_CLASS =
  'h-8 px-2 rounded-md inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors cursor-pointer'

/**
 * 默写音标卡片：
 * 根据当前【英文单词】和【中文译文】，默写出目标音标。
 * 音标键盘直接平铺展示在默写框下方，采用点选方式录入。
 */
export function PhoneticCard({
  word: sourceWord,
  phoneticPreference,
  remainingLoops = 1,
}: PhoneticCardProps) {
  const word = useEnsureAiWordSections(sourceWord, ['core'])
  const isCoreReady = isAiWordCoreReady(word)
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
  const peekKey = formatShortcutDisplay(shortcuts?.peekHint || DEFAULT_SHORTCUTS.peekHint)
  const targetPhoneticPreview =
    phoneticPreference === 'uk'
      ? word.phoneticUk || word.phoneticUs
      : word.phoneticUs || word.phoneticUk

  const peekHandlers = {
    onPointerDown: () => peekHint(true),
    onPointerUp: () => peekHint(false),
    onPointerLeave: () => peekHint(false),
  }

  return (
    <WordCardShell
      word={word}
      phoneticPreference={phoneticPreference}
      remainingLoops={remainingLoops}
      className="pt-10 xl:pt-12 pb-3"
      headerActions={
        <button
          type="button"
          {...peekHandlers}
          className={`${WORD_HEADER_BUTTON_CLASS} ${
            isPeeking ? 'text-accent bg-accent/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="按住鼠标或按快捷键偷看音标"
        >
          {isPeeking ? '正在偷看' : '按住偷看'}
          <kbd className="font-mono text-[10px] opacity-70">{peekKey}</kbd>
        </button>
      }
    >
      <div className="flex flex-col h-full justify-between gap-3">
        {/* 线索：英文单词 + 偷看音标 + 中文释义 */}
        <div className="text-center">
          <h2 className="font-serif text-4xl sm:text-5xl xl:text-[56px] text-white leading-tight">{word.name}</h2>

          {/* 音标占位行：高度固定，展开与收起不引起抖动 */}
          <div className="h-8 mt-1 flex items-center justify-center">
            {isPeeking ? (
              <div className="flex items-baseline gap-4 font-serif text-lg xl:text-xl text-accent animate-in fade-in-50 duration-100">
                {phonetics.length > 0 ? (
                  phonetics.map((p, i) => (
                    <span key={i} className="flex items-baseline gap-1.5">
                      {p.label && <span className="font-sans text-xs text-muted-foreground">{p.label}</span>}
                      {cleanPhoneticDisplay(p.text)}
                    </span>
                  ))
                ) : (
                  <span>{cleanPhoneticDisplay(targetPhoneticPreview) || '暂无音标'}</span>
                )}
              </div>
            ) : (
              <button
                type="button"
                {...peekHandlers}
                className="h-7 px-2 rounded-md text-xs text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors cursor-pointer select-none"
                title="按住鼠标或按快捷键偷看音标"
              >
                按住 {peekKey} 偷看音标
              </button>
            )}
          </div>

          <WordMeaning word={word} className="mt-1 mx-auto px-4 text-sm xl:text-base text-gray-300" />
        </div>

        <fieldset disabled={!isCoreReady} className="contents">
          {/* 默写回显：下划线输入行 + 右侧操作 */}
          <div className="w-full max-w-2xl mx-auto">
            <div
              className={`h-14 flex items-center gap-3 border-b-2 transition-colors ${
                isPhoneticPassed
                  ? 'border-emerald-500'
                  : isPhoneticError
                    ? 'border-destructive animate-shake'
                    : 'border-primary/50'
              }`}
            >
              <div className="flex-1 min-w-0 flex items-center">
                {dictationPhoneticInput ? (
                  <span
                    className={`font-serif text-2xl xl:text-3xl truncate leading-tight ${
                      isPhoneticPassed ? 'text-emerald-300' : isPhoneticError ? 'text-destructive' : 'text-white'
                    }`}
                  >
                    /{dictationPhoneticInput}/
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground/70 truncate select-none">
                    {isCoreReady ? '点选下方音标拼出读音，按 Enter 校验' : '正在补全音标与译文…'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={backspacePhonetic}
                  disabled={!dictationPhoneticInput || !isCoreReady}
                  className={GHOST_ACTION_CLASS}
                  title="退格删除最后一个音标符号"
                >
                  <Delete className="size-4" />
                  <span className="hidden sm:inline">退格</span>
                </button>
                <button
                  type="button"
                  onClick={clearPhonetic}
                  disabled={!dictationPhoneticInput}
                  className={GHOST_ACTION_CLASS}
                  title="清空已录入音标"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">清空</span>
                </button>
                <button
                  type="button"
                  onClick={submitPhoneticDictation}
                  disabled={!dictationPhoneticInput}
                  className="ml-1.5 h-8 px-3 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0C0E] text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="校验音标 (Enter)"
                >
                  <Check className="size-3.5" />
                  校验
                </button>
              </div>
            </div>
          </div>

          <InlineIpaKeyboard onSelectSymbol={appendPhoneticSymbol} />
        </fieldset>
      </div>
    </WordCardShell>
  )
}
