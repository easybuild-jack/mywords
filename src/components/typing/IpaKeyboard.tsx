'use client'

import React, { useState } from 'react'
import { Delete, RotateCcw, Check, X } from 'lucide-react'
import { IPA_KEYBOARD_GROUPS } from '@/lib/dictationValidator'

interface IpaKeyboardProps {
  /** 当前已点选的音标，键盘底部要回显它——放大后的键盘会盖住卡片上的音标输入框 */
  value: string
  /** 校验失败：整块边框红闪两下 */
  hasError: boolean
  onSelectSymbol: (symbol: string) => void
  onBackspace: () => void
  onClear: () => void
  onSubmit: () => void
  onClose: () => void
}

export function IpaKeyboard({
  value,
  hasError,
  onSelectSymbol,
  onBackspace,
  onClear,
  onSubmit,
  onClose,
}: IpaKeyboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'vowel' | 'consonant'>('all')

  const filteredGroups = IPA_KEYBOARD_GROUPS.filter((g) => {
    if (activeTab === 'vowel') return g.category.includes('元音')
    if (activeTab === 'consonant') return !g.category.includes('元音')
    return true
  })

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-[1000px] max-w-[calc(100vw-300px)] bg-[#12141A] rounded-2xl p-5 border shadow-[0_12px_40px_rgba(0,0,0,0.75)] space-y-4 select-none animate-in fade-in slide-in-from-top-2 duration-200 z-50 pointer-events-auto ${
        hasError ? 'border-destructive animate-border-flash' : 'border-primary/30'
      }`}
    >
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-primary tracking-wider uppercase">
            IPA 国际音标键盘
          </span>
          <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'all'
                  ? 'bg-primary text-[#0B0C0E] font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              全部
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vowel')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'vowel'
                  ? 'bg-primary text-[#0B0C0E] font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              元音
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('consonant')}
              className={`px-3 py-1 rounded transition-all ${
                activeTab === 'consonant'
                  ? 'bg-primary text-[#0B0C0E] font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              辅音
            </button>
          </div>
        </div>

        {/* 操作区：退格、清空、关闭。确认按钮挪到底部已选栏，紧邻要提交的内容 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackspace}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-sm text-gray-200 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="退格"
          >
            <Delete className="size-4" />
            <span>退格</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="清空"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer ml-1"
            title="收起键盘"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* 音标符号网格 */}
      <div className="space-y-3.5 max-h-[56vh] overflow-y-auto pr-1">
        {filteredGroups.map((group) => (
          <div key={group.category} className="space-y-1.5">
            <div className="text-xs text-gray-400 font-medium px-1 flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-primary/60" />
              <span>{group.category}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {group.symbols.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => onSelectSymbol(sym)}
                  className="min-w-14 h-14 px-3 rounded-xl bg-white/[0.04] hover:bg-primary/20 hover:border-primary/50 hover:text-primary border border-white/10 font-mono text-2xl font-bold text-white transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 底部已选栏：键盘盖住了卡片上的音标框，点选结果必须在这里能看到 */}
      <div className="flex items-center gap-3 border-t border-white/10 pt-3.5">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">已选</span>

        <div
          className={`flex-1 min-w-0 h-14 rounded-xl border px-4 flex items-center transition-all ${
            hasError ? 'border-destructive/60 bg-destructive/10' : 'border-white/15 bg-white/[0.04]'
          }`}
        >
          {value ? (
            <span className="font-mono text-2xl font-bold text-primary tracking-wider truncate">
              /{value}/
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/60">点选上方符号拼出这个单词的音标...</span>
          )}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center gap-1.5 h-14 px-6 rounded-xl bg-primary hover:bg-primary/90 text-[#0B0C0E] text-base font-bold transition-all active:scale-95 shadow-sm cursor-pointer shrink-0"
          title="确认并校验音标"
        >
          <Check className="size-5" />
          <span>确认</span>
        </button>
      </div>
    </div>
  )
}
