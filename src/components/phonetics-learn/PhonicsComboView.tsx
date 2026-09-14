'use client'

import React, { useState } from 'react'
import {
  Volume2,
  ExternalLink,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react'
import { PhonicsRuleItem, PhonicsExampleWord } from '@/resources/phonicsComboData'
import { audioEngine } from '@/core/audioEngine'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { renderHighlightedWord } from './IpaMatrixView'

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
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-3 bg-white/[0.02] border border-white/10 rounded-2xl">
        <Sparkles className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">未找到匹配的字母组合规则，请尝试调整搜索词</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
      {items.map((rule) => {
        const isVowelVowel = rule.category === 'vowel-vowel'
        const isVowelConsonant = rule.category === 'vowel-consonant'

        return (
          <div
            key={rule.id}
            className="group relative flex flex-col justify-between bg-sidebar/90 hover:bg-sidebar border border-white/10 hover:border-primary/60 rounded-2xl p-5 transition-[background-color,border-color,box-shadow] duration-200 hover:shadow-lg hover:shadow-primary/10 backdrop-blur-xl space-y-4"
          >
            {/* 卡片头部：组合模式大字、分类徽标、对应发音音标徽章 */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-3xl sm:text-4xl font-black text-amber-400 tracking-wide drop-shadow-[0_0_12px_rgba(251,191,36,0.25)] group-hover:scale-[1.03] transition-transform origin-left inline-block">
                      {rule.pattern}
                    </span>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-lg font-semibold border ${
                        isVowelVowel
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : isVowelConsonant
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {rule.categoryLabel}
                    </span>
                  </div>

                  {rule.positionTip && (
                    <div className="text-xs text-muted-foreground">
                      位置规律: <span className="text-foreground/80 font-medium">{rule.positionTip}</span>
                    </div>
                  )}
                </div>

                {/* 对应发音音标列表 */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {rule.phonetics.map((ipa) => {
                    const isIpaPlaying = playingIpa === ipa
                    const cleanIpa = ipa.replace(/[\/\[\]]/g, '').trim()

                    return (
                      <button
                        key={ipa}
                        type="button"
                        onClick={(e) => handlePlayIpa(e, ipa)}
                        title={`点击试听音标 ${ipa} 发音`}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-mono text-xs sm:text-sm font-bold transition-colors ${
                          isIpaPlaying
                            ? 'bg-primary text-black border-primary shadow-sm'
                            : 'bg-white/[0.06] hover:bg-primary/20 text-primary border-primary/30'
                        }`}
                      >
                        <Volume2 className="size-3.5" />
                        <span>{ipa}</span>
                        {onJumpToIpa && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              onJumpToIpa(cleanIpa)
                            }}
                            title="前往48音标图谱定位"
                            className="ml-0.5 hover:text-white"
                          >
                            <ExternalLink className="size-2.5 opacity-60 hover:opacity-100" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 规律说明与拼读诀窍 */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-[13px] sm:text-sm text-foreground/85 leading-relaxed">
                {rule.ruleDescription}
              </div>
            </div>

            {/* 代表例词列表 */}
            <div className="space-y-2 pt-1 border-t border-border/40">
              <div className="flex items-center justify-between text-sm px-0.5">
                <span className="font-bold text-gray-200">代表性例词</span>
                <span className="text-xs font-mono text-muted-foreground/80">点击朗读</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {rule.examples.map((ex) => {
                  const isWordPlaying = playingWord === ex.word

                  return (
                    <button
                      key={ex.word}
                      type="button"
                      onClick={(e) => handlePlayWord(e, ex)}
                      title={`朗读例词: ${ex.word} ${ex.phonetic} (${ex.meaning})`}
                      className={`group/ex text-left px-3.5 py-3 rounded-xl border transition-all flex items-center justify-between gap-1.5 overflow-hidden ${
                        isWordPlaying
                          ? 'bg-primary/20 border-primary text-white shadow-sm'
                          : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-primary/50 text-foreground'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-base sm:text-lg font-black font-mono truncate leading-tight flex items-center gap-1.5 text-white tracking-wide">
                          {renderHighlightedWord(ex.word, ex.highlight)}
                          <span className="text-xs sm:text-[13px] font-semibold text-muted-foreground/90 font-mono">
                            {ex.phonetic}
                          </span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-semibold text-gray-200 truncate leading-snug mt-1.5">
                          {ex.meaning}
                        </div>
                      </div>

                      <Volume2
                        className={`size-4 shrink-0 transition-opacity ml-1 ${
                          isWordPlaying
                            ? 'text-primary opacity-100 animate-pulse'
                            : 'text-muted-foreground opacity-0 group-hover/ex:opacity-100'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
