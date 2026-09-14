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
        return (
          <div
            key={rule.id}
            className="group relative flex flex-col justify-between bg-sidebar/90 hover:bg-sidebar border border-white/10 hover:border-primary/60 rounded-2xl p-3.5 sm:p-4 transition-[background-color,border-color,box-shadow] duration-200 hover:shadow-lg hover:shadow-primary/10 backdrop-blur-xl space-y-3.5"
          >
            {/* 卡片头部：组合模式大字、分类徽标、对应发音音标徽章 */}
            <div className="space-y-2.5">
              {/* 第一行：左侧字母组合大字+分类标签，右侧音标发音按钮 */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="phonics-pattern-title font-mono text-3xl sm:text-4xl font-black tracking-wide group-hover:scale-[1.03] transition-transform origin-left inline-block">
                    {rule.pattern}
                  </span>

                  <span className="text-xs px-2.5 py-0.5 rounded-lg font-semibold border shrink-0 bg-primary/10 text-primary border-primary/30">
                    {rule.categoryLabel}
                  </span>
                </div>

                {/* 对应发音音标列表：右对齐、不被文本挤压、强制不折行 */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                  {rule.phonetics.map((ipa) => {
                    const isIpaPlaying = playingIpa === ipa
                    const cleanIpa = ipa.replace(/[\/\[\]]/g, '').trim()

                    return (
                      <button
                        key={ipa}
                        type="button"
                        onClick={(e) => handlePlayIpa(e, ipa)}
                        title={`点击试听音标 ${ipa} 发音`}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-mono text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${
                          isIpaPlaying
                            ? 'bg-primary text-black border-primary shadow-sm'
                            : 'bg-white/[0.06] hover:bg-primary/20 text-primary border-primary/30'
                        }`}
                      >
                        <Volume2 className="size-3.5 shrink-0" />
                        <span className="whitespace-nowrap select-none">{ipa}</span>
                        {onJumpToIpa && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              onJumpToIpa(cleanIpa)
                            }}
                            title="前往48音标图谱定位"
                            className="ml-0.5 p-0.5 rounded hover:text-white shrink-0 flex items-center justify-center"
                          >
                            <ExternalLink className="size-2.5 opacity-60 hover:opacity-100 shrink-0" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 第二行：位置规律说明（独占一行，不挤压发音按钮） */}
              {rule.positionTip && (
                <div className="text-xs text-muted-foreground leading-relaxed">
                  位置规律: <span className="text-foreground/80 font-medium">{rule.positionTip}</span>
                </div>
              )}

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

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {rule.examples.map((ex, index) => {
                  const isWordPlaying = playingWord === ex.word

                  return (
                    <button
                      key={`${rule.id}-${index}`}
                      type="button"
                      onClick={(e) => handlePlayWord(e, ex)}
                      title={`朗读例词: ${ex.word} ${ex.phonetic} (${ex.meaning})`}
                      className={`group/ex relative text-left px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border transition-all overflow-hidden ${
                        isWordPlaying
                          ? 'bg-primary/20 border-primary text-white shadow-sm'
                          : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-primary/50 text-foreground'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-base sm:text-lg font-black font-mono leading-tight flex items-baseline gap-1.5 flex-wrap text-foreground tracking-wide">
                          {renderHighlightedWord(ex.word, ex.highlight)}
                          <span className="text-xs sm:text-[13px] font-semibold text-muted-foreground font-mono">
                            {ex.phonetic}
                          </span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-semibold text-foreground/80 truncate leading-snug mt-1">
                          {ex.meaning}
                        </div>
                      </div>

                      <Volume2
                        className={`size-3.5 absolute right-1.5 top-1.5 transition-opacity pointer-events-none ${
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
