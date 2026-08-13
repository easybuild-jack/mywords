'use client'

import React, { useState } from 'react'
import { Delete, RotateCcw, Check, X } from 'lucide-react'
import { IPA_KEYBOARD_GROUPS } from '@/lib/dictationValidator'

interface IpaKeyboardProps {
  onSelectSymbol: (symbol: string) => void
  onBackspace: () => void
  onClear: () => void
  onSubmit: () => void
  onClose: () => void
}

export function IpaKeyboard({
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
      className="w-[640px] max-w-full glass-card rounded-2xl p-4 border border-primary/30 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl space-y-3 select-none animate-in fade-in slide-in-from-top-2 duration-200 z-50 pointer-events-auto"
    >
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary tracking-wider uppercase">
            IPA 国际音标键盘
          </span>
          <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2 py-0.5 rounded transition-all ${
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
              className={`px-2 py-0.5 rounded transition-all ${
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
              className={`px-2 py-0.5 rounded transition-all ${
                activeTab === 'consonant'
                  ? 'bg-primary text-[#0B0C0E] font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              辅音
            </button>
          </div>
        </div>

        {/* 操作区：退格、清空、确认、关闭 */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBackspace}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-gray-200 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="退格 (Backspace)"
          >
            <Delete className="size-3.5" />
            <span>退格</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="清空"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary hover:bg-primary/90 text-[#0B0C0E] text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            title="确认音标"
          >
            <Check className="size-3.5" />
            <span>校验</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer ml-1"
            title="收起键盘"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* 音标符号网格 */}
      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
        {filteredGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            <div className="text-[10px] text-gray-400 font-medium px-1 flex items-center gap-1.5">
              <span className="inline-block size-1 rounded-full bg-primary/60" />
              <span>{group.category}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.symbols.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => onSelectSymbol(sym)}
                  className="min-w-9 h-8 px-2 rounded-lg bg-white/[0.04] hover:bg-primary/20 hover:border-primary/50 hover:text-primary border border-white/10 font-mono text-sm font-bold text-white transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
