'use client'

import React from 'react'
import { IPA_KEYBOARD_GROUPS } from '@/lib/dictationValidator'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { audioEngine } from '@/core/audioEngine'

interface InlineIpaKeyboardProps {
  onSelectSymbol: (symbol: string) => void
}

const GROUP_DOT_CLASS: Record<string, string> = {
  '单元音': 'bg-emerald-400',
  '双元音': 'bg-amber-400',
  '爆破音 & 破擦音': 'bg-sky-400',
  '摩擦音': 'bg-violet-400',
  '鼻音 & 辅音': 'bg-pink-400',
}

const KEY_CLASS =
  'min-w-9 xl:min-w-10 h-9 xl:h-10 px-2 rounded-md border border-border border-b-2 font-serif text-lg text-gray-200 hover:text-foreground hover:bg-muted active:translate-y-px active:border-b transition-colors cursor-pointer flex items-center justify-center'

function KeyGroup({
  category,
  symbols,
  onPick,
  bordered,
}: {
  category: string
  symbols: string[]
  onPick: (sym: string) => void
  bordered?: boolean
}) {
  return (
    <div className={bordered ? 'pt-2.5 mt-2.5 border-t border-dashed border-border' : ''}>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={`size-1.5 rounded-full ${GROUP_DOT_CLASS[category] ?? 'bg-sky-400'}`} />
        {category}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {symbols.map((sym) => (
          <button key={sym} type="button" onClick={() => onPick(sym)} className={KEY_CLASS}>
            {sym}
          </button>
        ))}
      </div>
    </div>
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

  const [monophthongs, diphthongs, ...consonants] = IPA_KEYBOARD_GROUPS

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 select-none">
      <div>
        <KeyGroup category={monophthongs.category} symbols={monophthongs.symbols} onPick={handleSymbolClick} />
        <KeyGroup category={diphthongs.category} symbols={diphthongs.symbols} onPick={handleSymbolClick} bordered />
      </div>
      <div className="md:border-l md:border-border md:pl-8">
        {consonants.map((group, idx) => (
          <KeyGroup
            key={group.category}
            category={group.category}
            symbols={group.symbols}
            onPick={handleSymbolClick}
            bordered={idx > 0}
          />
        ))}
      </div>
    </div>
  )
}
