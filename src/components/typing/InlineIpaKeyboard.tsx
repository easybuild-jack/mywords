'use client'

import React from 'react'
import { IPA_KEYBOARD_GROUPS } from '@/lib/dictationValidator'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { audioEngine } from '@/core/audioEngine'

interface InlineIpaKeyboardProps {
  onSelectSymbol: (symbol: string) => void
}

interface GroupStyle {
  titleClass: string
  dotClass: string
  keyHoverClass: string
}

const GROUP_STYLES: Record<string, GroupStyle> = {
  '单元音': {
    titleClass: 'text-emerald-300',
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
    keyHoverClass: 'hover:bg-emerald-400/20 hover:border-emerald-400/50 hover:text-emerald-300',
  },
  '双元音': {
    titleClass: 'text-amber-300',
    dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]',
    keyHoverClass: 'hover:bg-amber-400/20 hover:border-amber-400/50 hover:text-amber-300',
  },
  '爆破音 & 破擦音': {
    titleClass: 'text-sky-300',
    dotClass: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]',
    keyHoverClass: 'hover:bg-sky-400/20 hover:border-sky-400/50 hover:text-sky-300',
  },
  '摩擦音': {
    titleClass: 'text-violet-300',
    dotClass: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]',
    keyHoverClass: 'hover:bg-violet-400/20 hover:border-violet-400/50 hover:text-violet-300',
  },
  '鼻音 & 辅音': {
    titleClass: 'text-pink-300',
    dotClass: 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.7)]',
    keyHoverClass: 'hover:bg-rose-400/20 hover:border-rose-400/50 hover:text-pink-300',
  },
}

function getGroupStyle(category: string): GroupStyle {
  return (
    GROUP_STYLES[category] || {
      titleClass: 'text-sky-300',
      dotClass: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]',
      keyHoverClass: 'hover:bg-sky-400/20 hover:border-sky-400/50 hover:text-sky-300',
    }
  )
}

/** 默写音标页面内嵌平铺式点选音标键盘 */
export function InlineIpaKeyboard({ onSelectSymbol }: InlineIpaKeyboardProps) {
  const {
    isKeySoundEnabled,
    keySoundPack,
    keySoundVolume,
    isPhoneticSoundEnabled,
    phoneticSoundVolume,
  } = useWorkspaceStore()

  const handleSymbolClick = (sym: string) => {
    if (isPhoneticSoundEnabled) {
      audioEngine.playPhoneticSound(sym, phoneticSoundVolume)
    } else if (isKeySoundEnabled) {
      audioEngine.playKeySound(keySoundPack, keySoundVolume)
    }
    onSelectSymbol(sym)
  }

  const monophthongsStyle = getGroupStyle(IPA_KEYBOARD_GROUPS[0].category)
  const diphthongsStyle = getGroupStyle(IPA_KEYBOARD_GROUPS[1].category)

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-white/[0.02] border border-white/10 p-3 sm:p-4 2xl:p-5 shadow-inner space-y-2.5 sm:space-y-3 select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* 元音区（单元音 + 双元音） */}
        <div className="space-y-2.5 rounded-xl bg-white/[0.02] border border-white/5 p-2.5 sm:p-3">
          {/* 单元音 */}
          <div className="space-y-2">
            <div className={`text-xs sm:text-sm font-bold ${monophthongsStyle.titleClass} px-1 flex items-center gap-2 tracking-wide`}>
              <span className={`inline-block size-2 rounded-full ${monophthongsStyle.dotClass}`} />
              <span>{IPA_KEYBOARD_GROUPS[0].category}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {IPA_KEYBOARD_GROUPS[0].symbols.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleSymbolClick(sym)}
                  className={`min-w-9 sm:min-w-10 xl:min-w-11 h-9 sm:h-10 xl:h-10.5 px-2 rounded-lg bg-white/[0.04] ${monophthongsStyle.keyHoverClass} text-gray-200 border border-white/10 font-mono text-base sm:text-lg font-bold transition-all active:scale-90 cursor-pointer shadow-sm flex items-center justify-center`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* 双元音 */}
          <div className="space-y-2 pt-1.5 border-t border-white/5">
            <div className={`text-xs sm:text-sm font-bold ${diphthongsStyle.titleClass} px-1 flex items-center gap-2 tracking-wide`}>
              <span className={`inline-block size-2 rounded-full ${diphthongsStyle.dotClass}`} />
              <span>{IPA_KEYBOARD_GROUPS[1].category}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {IPA_KEYBOARD_GROUPS[1].symbols.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleSymbolClick(sym)}
                  className={`min-w-10 sm:min-w-11 xl:min-w-12 h-9 sm:h-10 xl:h-10.5 px-2 rounded-lg bg-white/[0.04] ${diphthongsStyle.keyHoverClass} text-gray-200 border border-white/10 font-mono text-base sm:text-lg font-bold transition-all active:scale-90 cursor-pointer shadow-sm flex items-center justify-center`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 辅音区（爆破/破擦、摩擦、鼻音/辅音） */}
        <div className="space-y-2.5 rounded-xl bg-white/[0.02] border border-white/5 p-2.5 sm:p-3">
          {IPA_KEYBOARD_GROUPS.slice(2).map((group, idx) => {
            const style = getGroupStyle(group.category)
            return (
              <div key={group.category} className={`space-y-2 ${idx > 0 ? 'pt-2 border-t border-white/5' : ''}`}>
                <div className={`text-xs sm:text-sm font-bold ${style.titleClass} px-1 flex items-center gap-2 tracking-wide`}>
                  <span className={`inline-block size-2 rounded-full ${style.dotClass}`} />
                  <span>{group.category}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {group.symbols.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleSymbolClick(sym)}
                      className={`min-w-9 sm:min-w-10 xl:min-w-11 h-9 sm:h-10 xl:h-10.5 px-2 rounded-lg bg-white/[0.04] ${style.keyHoverClass} text-gray-200 border border-white/10 font-mono text-base sm:text-lg font-bold transition-all active:scale-90 cursor-pointer shadow-sm flex items-center justify-center`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
