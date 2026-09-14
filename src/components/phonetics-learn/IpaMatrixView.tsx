'use client'

import React, { useState } from 'react'
import {
  Volume2,
  Maximize2,
  Sparkles,
  ExternalLink,
  Check,
} from 'lucide-react'
import { IpaSymbolItem, RepresentativeWord } from '@/resources/phoneticsData'
import { audioEngine } from '@/core/audioEngine'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface IpaMatrixViewProps {
  items: IpaSymbolItem[]
  onSelectSymbol: (item: IpaSymbolItem) => void
  onJumpToCombo?: (combo: string) => void
}

/** 辅助函数：根据 highlight 字母将单词拆分并对组合部分加色加粗显示 */
export function renderHighlightedWord(word: string, highlight: string) {
  if (!highlight) return <span>{word}</span>
  const lowerWord = word.toLowerCase()
  const lowerHighlight = highlight.toLowerCase()
  const idx = lowerWord.indexOf(lowerHighlight)
  if (idx === -1) return <span>{word}</span>

  const before = word.slice(0, idx)
  const matched = word.slice(idx, idx + highlight.length)
  const after = word.slice(idx + highlight.length)

  return (
    <span>
      {before}
      <span className="text-amber-400 font-extrabold underline underline-offset-2 decoration-amber-400/60 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
        {matched}
      </span>
      {after}
    </span>
  )
}

export function IpaMatrixView({ items, onSelectSymbol, onJumpToCombo }: IpaMatrixViewProps) {
  const { phoneticPreference, audioRate } = useWorkspaceStore()
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null)
  const [playingWord, setPlayingWord] = useState<string | null>(null)

  const handlePlaySymbol = (e: React.MouseEvent, sym: IpaSymbolItem) => {
    e.stopPropagation()
    setPlayingSymbol(sym.symbol)
    audioEngine.playPhoneticSound(sym.symbol, 0.9)
    setTimeout(() => {
      setPlayingSymbol((cur) => (cur === sym.symbol ? null : cur))
    }, 1200)
  }

  const handlePlayWord = (e: React.MouseEvent, repWord: RepresentativeWord) => {
    e.stopPropagation()
    setPlayingWord(repWord.word)
    audioEngine.playPronunciation(repWord.word, phoneticPreference, audioRate)
    setTimeout(() => {
      setPlayingWord((cur) => (cur === repWord.word ? null : cur))
    }, 1500)
  }

  if (items.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-3 bg-white/[0.02] border border-white/10 rounded-2xl">
        <Sparkles className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">没有找到匹配的国际音标，请尝试调整筛选或关键词</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-8">
      {items.map((item) => {
        const isSymbolPlaying = playingSymbol === item.symbol
        const isVowel = item.category === 'monophthong' || item.category === 'diphthong'

        return (
          <div
            key={item.id}
            onClick={() => onSelectSymbol(item)}
            className="group relative flex flex-col justify-between bg-sidebar/90 hover:bg-sidebar border border-white/10 hover:border-primary/40 rounded-2xl p-4.5 transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] cursor-pointer backdrop-blur-xl"
          >
            {/* 顶部：音标大字、分类徽章、发音按钮与精读详情 */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <span className="font-mono text-3xl font-black tracking-wider text-primary group-hover:text-primary-focus transition-colors">
                      /{item.symbol}/
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-lg font-semibold border ${
                      isVowel
                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        : item.isVoiced
                        ? 'bg-accent/15 text-accent border-accent/25'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {item.subcategory}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* 音标单音素试听按钮 */}
                  <button
                    type="button"
                    onClick={(e) => handlePlaySymbol(e, item)}
                    title="试听音标发音"
                    className={`size-8.5 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
                      isSymbolPlaying
                        ? 'bg-primary text-black border-primary shadow-sm scale-105'
                        : 'bg-white/[0.05] hover:bg-primary/20 text-gray-300 hover:text-primary border-white/10'
                    }`}
                  >
                    <Volume2 className={`size-4.5 ${isSymbolPlaying ? 'animate-pulse' : ''}`} />
                  </button>

                  {/* 沉浸精读展开 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectSymbol(item)
                    }}
                    title="展开精读详情"
                    className="size-8.5 rounded-xl flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.12] text-gray-400 hover:text-white border border-white/10 transition-all active:scale-90"
                  >
                    <Maximize2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* 发音要诀简述 */}
              <p className="text-[13px] sm:text-sm text-foreground/85 line-clamp-2 leading-snug min-h-[38px]">
                {item.articulationTip}
              </p>

              {/* 常见字母组合标签 */}
              <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                <span className="text-xs text-muted-foreground font-medium mr-0.5">常见字母:</span>
                {item.commonSpellings.map((sp) => (
                  <span
                    key={sp}
                    onClick={(e) => {
                      if (onJumpToCombo) {
                        e.stopPropagation()
                        onJumpToCombo(sp)
                      }
                    }}
                    title={`点击查看 ${sp} 组合规则`}
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.07] hover:bg-primary/20 hover:text-primary border border-white/10 text-foreground transition-colors cursor-pointer"
                  >
                    {sp}
                  </span>
                ))}
              </div>
            </div>

            {/* 中间横线 */}
            <div className="h-px bg-border/40 my-3.5" />

            {/* 底部：6个代表性单词网格 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                <span className="font-semibold text-foreground/80">6个代表性单词</span>
                <span className="text-xs font-mono text-muted-foreground/70">点击朗读</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {item.words.map((repWord) => {
                  const isWordPlaying = playingWord === repWord.word

                  return (
                    <button
                      key={repWord.word}
                      type="button"
                      onClick={(e) => handlePlayWord(e, repWord)}
                      title={`朗读单词: ${repWord.word} ${repWord.phonetic} (${repWord.meaning})`}
                      className={`group/word text-left px-2.5 py-2 rounded-xl border transition-all flex items-center justify-between gap-1 overflow-hidden ${
                        isWordPlaying
                          ? 'bg-primary/20 border-primary text-white shadow-sm'
                          : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-primary/40 text-foreground'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm sm:text-[15px] font-bold font-mono truncate leading-tight flex items-center gap-1">
                          {renderHighlightedWord(repWord.word, repWord.highlight)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate leading-snug mt-1">
                          {repWord.meaning}
                        </div>
                      </div>

                      <Volume2
                        className={`size-3.5 shrink-0 transition-opacity ml-1 ${
                          isWordPlaying
                            ? 'text-primary opacity-100 animate-pulse'
                            : 'text-muted-foreground opacity-0 group-hover/word:opacity-100'
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
