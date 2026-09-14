'use client'

import React, { useState } from 'react'
import {
  Volume2,
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
export function renderHighlightedWord(word: string, highlight?: string) {
  if (!highlight) return <span className="font-black text-foreground">{word}</span>
  const lowerWord = word.toLowerCase()
  const lowerHighlight = highlight.toLowerCase()
  const idx = lowerWord.indexOf(lowerHighlight)
  if (idx === -1) return <span className="font-black text-foreground">{word}</span>

  const before = word.slice(0, idx)
  const matched = word.slice(idx, idx + highlight.length)
  const after = word.slice(idx + highlight.length)

  return (
    <span className="text-foreground font-black">
      {before}
      <span className="phonics-highlight font-black underline underline-offset-[5px] decoration-amber-400 decoration-[2.5px] drop-shadow-[0_0_8px_rgba(253,224,71,0.45)]">
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
        <p className="text-base text-muted-foreground">没有找到匹配的国际音标，请尝试调整筛选或关键词</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
      {items.map((item) => {
        const isSymbolPlaying = playingSymbol === item.symbol

        return (
          <div
            key={item.id}
            onClick={() => onSelectSymbol(item)}
            className="group relative flex flex-col justify-between bg-sidebar/90 hover:bg-sidebar border border-white/10 hover:border-primary/60 rounded-2xl p-3.5 sm:p-4 transition-[background-color,border-color,box-shadow] duration-200 hover:shadow-lg hover:shadow-primary/10 cursor-pointer backdrop-blur-xl space-y-3.5"
          >
            {/* 顶部：音标大字、分类徽章、发音按钮与精读详情 */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <span className="font-mono text-3xl sm:text-4xl font-black tracking-wider text-primary group-hover:scale-[1.03] transition-transform origin-left inline-block">
                      /{item.symbol}/
                    </span>
                  </div>

                  <span className="text-xs sm:text-[13px] px-2.5 py-1 rounded-lg font-bold border shrink-0 bg-primary/10 text-primary border-primary/30">
                    {item.subcategory}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* 音标单音素试听按钮 */}
                  <button
                    type="button"
                    onClick={(e) => handlePlaySymbol(e, item)}
                    title="试听音标发音"
                    className={`size-9 rounded-xl flex items-center justify-center border transition-colors ${
                      isSymbolPlaying
                        ? 'bg-primary text-black border-primary shadow-sm'
                        : 'bg-white/[0.05] hover:bg-primary/20 text-gray-300 hover:text-primary border-white/10'
                    }`}
                  >
                    <Volume2 className={`size-5 ${isSymbolPlaying ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 发音要诀简述 */}
              <p className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-[13px] sm:text-sm text-foreground/85 leading-relaxed">
                {item.articulationTip}
              </p>

              {/* 常见字母组合标签（显著加大英文字母与标签尺寸） */}
              <div className="flex items-center flex-wrap gap-2 pt-0.5">
                <span className="text-sm font-bold text-gray-200 mr-0.5">常见字母:</span>
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
                    className="text-base sm:text-[17px] font-mono font-black px-3 py-1 rounded-lg bg-white/10 hover:bg-primary/25 hover:text-primary border border-white/20 text-white transition-all cursor-pointer shadow-xs"
                  >
                    {sp}
                  </span>
                ))}
              </div>
            </div>

            {/* 底部：6个代表性单词网格（英文字母加大加粗，释义清晰明亮） */}
            <div className="space-y-2 pt-1 border-t border-border/40">
              <div className="flex items-center justify-between text-sm px-0.5">
                <span className="font-bold text-gray-200">6个代表性单词</span>
                <span className="text-xs font-mono text-muted-foreground/80">点击朗读</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {item.words.map((repWord, index) => {
                  const isWordPlaying = playingWord === repWord.word

                  return (
                    <button
                      key={`${item.id}-${index}`}
                      type="button"
                      onClick={(e) => handlePlayWord(e, repWord)}
                      title={`朗读单词: ${repWord.word} ${repWord.phonetic} (${repWord.meaning})`}
                      className={`group/word relative text-left px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border transition-all overflow-hidden ${
                        isWordPlaying
                          ? 'bg-primary/20 border-primary text-white shadow-sm'
                          : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-primary/50 text-foreground'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-base sm:text-lg font-black font-mono leading-tight flex items-baseline gap-1.5 flex-wrap text-foreground tracking-wide">
                          {renderHighlightedWord(repWord.word, repWord.highlight)}
                          <span className="text-xs sm:text-[13px] font-semibold text-muted-foreground font-mono">
                            {repWord.phonetic}
                          </span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-semibold text-foreground/80 truncate leading-snug mt-1">
                          {repWord.meaning}
                        </div>
                      </div>

                      <Volume2
                        className={`size-3.5 absolute right-1.5 top-1.5 transition-opacity pointer-events-none ${
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
