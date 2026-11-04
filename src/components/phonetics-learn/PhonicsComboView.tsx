'use client'

import React, { useState } from 'react'
import { Volume2, ExternalLink } from 'lucide-react'
import { PhonicsRuleItem, PhonicsExampleWord } from '@/resources/phonicsComboData'
import { audioEngine } from '@/core/audioEngine'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { ExampleWordButton, PhoneticsEmptyState } from './IpaMatrixView'

interface PhonicsComboViewProps {
  items: PhonicsRuleItem[]
  onJumpToIpa?: (symbol: string) => void
}

export function PhonicsComboView({ items, onJumpToIpa }: PhonicsComboViewProps) {
  const { phoneticPreference, audioRate } = useWorkspaceStore()
  const [playingWord, setPlayingWord] = useState<string | null>(null)
  const [playingIpa, setPlayingIpa] = useState<string | null>(null)

  const handlePlayWord = (e: React.MouseEvent, example: PhonicsExampleWord) => {
    e.stopPropagation()
    setPlayingWord(example.word)
    audioEngine.playPronunciation(example.word, phoneticPreference, audioRate)
    setTimeout(() => {
      setPlayingWord((cur) => (cur === example.word ? null : cur))
    }, 1500)
  }

  const handlePlayIpa = (e: React.MouseEvent, rawPhonetic: string) => {
    e.stopPropagation()
    // 去除斜杠 /
    const cleanSym = rawPhonetic.replace(/[\/\[\]]/g, '').trim()
    setPlayingIpa(rawPhonetic)
    audioEngine.playPhoneticSound(cleanSym, 0.9)
    setTimeout(() => {
      setPlayingIpa((cur) => (cur === rawPhonetic ? null : cur))
    }, 1200)
  }

  if (items.length === 0) {
    return <PhoneticsEmptyState text="没有找到匹配的字母组合，试试调整搜索词" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 pb-8">
      {items.map((rule) => (
        <article key={rule.id} className="border-t border-border py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="phonics-pattern-title font-serif text-4xl leading-none">{rule.pattern}</span>
              <span className="text-xs text-muted-foreground">{rule.categoryLabel}</span>
            </div>

            <div className="flex items-center gap-0.5 flex-wrap justify-end shrink-0 -mt-1">
              {rule.phonetics.map((ipa) => {
                const isIpaPlaying = playingIpa === ipa
                const cleanIpa = ipa.replace(/[\/\[\]]/g, '').trim()

                return (
                  <span key={ipa} className="inline-flex items-center">
                    <button
                      type="button"
                      onClick={(e) => handlePlayIpa(e, ipa)}
                      title={`试听音标 ${ipa}`}
                      className={`h-8 pl-1.5 pr-2 rounded-md inline-flex items-center gap-1 font-serif text-base whitespace-nowrap transition-colors cursor-pointer ${
                        isIpaPlaying ? 'text-primary bg-primary/10' : 'text-primary hover:bg-muted'
                      }`}
                    >
                      <Volume2 className={`size-3.5 ${isIpaPlaying ? 'animate-pulse' : 'opacity-60'}`} />
                      {ipa}
                    </button>
                    {onJumpToIpa && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onJumpToIpa(cleanIpa)
                        }}
                        title="前往 48 音标图谱定位"
                        className="size-6 rounded-md inline-flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <ExternalLink className="size-3" />
                      </button>
                    )}
                  </span>
                )
              })}
            </div>
          </div>

          {rule.positionTip && (
            <p className="mt-3 text-xs text-muted-foreground">
              位置规律：<span className="text-gray-300">{rule.positionTip}</span>
            </p>
          )}

          <p className="mt-2 text-[13px] xl:text-sm text-gray-300 leading-relaxed">{rule.ruleDescription}</p>

          <div className="mt-3 pt-3 border-t border-dashed border-border grid grid-cols-2 gap-x-4">
            {rule.examples.map((ex, index) => (
              <ExampleWordButton
                key={`${rule.id}-${index}`}
                word={ex.word}
                phonetic={ex.phonetic}
                meaning={ex.meaning}
                highlight={ex.highlight}
                isPlaying={playingWord === ex.word}
                onClick={(e) => handlePlayWord(e, ex)}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
