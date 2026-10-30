'use client'

import React, { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { IpaSymbolItem, RepresentativeWord } from '@/resources/phoneticsData'
import { audioEngine } from '@/core/audioEngine'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface IpaMatrixViewProps {
  items: IpaSymbolItem[]
  onSelectSymbol: (item: IpaSymbolItem) => void
  onJumpToCombo?: (combo: string) => void
}

/** 辅助函数：根据 highlight 字母将单词拆分，并对发音组合部分着色加下划线 */
export function renderHighlightedWord(word: string, highlight?: string) {
  if (!highlight) return <span className="text-foreground">{word}</span>
  const lowerWord = word.toLowerCase()
  const lowerHighlight = highlight.toLowerCase()
  const idx = lowerWord.indexOf(lowerHighlight)
  if (idx === -1) return <span className="text-foreground">{word}</span>

  const before = word.slice(0, idx)
  const matched = word.slice(idx, idx + highlight.length)
  const after = word.slice(idx + highlight.length)

  return (
    <span className="text-foreground">
      {before}
      <span className="phonics-highlight underline underline-offset-4 decoration-[1.5px]">{matched}</span>
      {after}
    </span>
  )
}

/** 音标 / 拼读页通用的代表词条目：点击朗读 */
export function ExampleWordButton({
  word,
  phonetic,
  meaning,
  highlight,
  isPlaying,
  onClick,
}: {
  word: string
  phonetic?: string
  meaning: string
  highlight?: string
  isPlaying: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`朗读单词: ${word} ${phonetic ?? ''} (${meaning})`}
      className={`group/word relative text-left -mx-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer min-w-0 ${
        isPlaying ? 'bg-primary/10' : 'hover:bg-muted'
      }`}
    >
      <div className="flex items-baseline gap-2 min-w-0 pr-5">
        <span className="font-serif text-lg leading-tight">{renderHighlightedWord(word, highlight)}</span>
        {phonetic && <span className="font-serif text-[13px] text-muted-foreground truncate">{phonetic}</span>}
      </div>
      <div className="text-xs text-muted-foreground truncate mt-0.5">{meaning}</div>
      <Volume2
        className={`size-3.5 absolute right-2 top-2.5 transition-opacity pointer-events-none ${
          isPlaying ? 'text-primary opacity-100 animate-pulse' : 'text-muted-foreground opacity-0 group-hover/word:opacity-100'
        }`}
      />
    </button>
  )
}

export function PhoneticsEmptyState({ text }: { text: string }) {
  return <div className="w-full py-20 text-center text-sm text-muted-foreground">{text}</div>
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
    return <PhoneticsEmptyState text="没有找到匹配的音标，试试调整筛选或关键词" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 pb-8">
      {items.map((item) => {
        const isSymbolPlaying = playingSymbol === item.symbol

        return (
          <article
            key={item.id}
            onClick={() => onSelectSymbol(item)}
            className="group border-t border-border py-5 cursor-pointer"
            title="查看详情"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-baseline gap-3 min-w-0">
                <span className="font-serif text-4xl text-primary leading-none">/{item.symbol}/</span>
                <span className="text-xs text-muted-foreground">{item.subcategory}</span>
              </div>
              <button
                type="button"
                onClick={(e) => handlePlaySymbol(e, item)}
                title="试听音标发音"
                className={`size-8 -mt-1 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                  isSymbolPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Volume2 className={`size-4 ${isSymbolPlaying ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            <p className="mt-3 text-[13px] xl:text-sm text-gray-300 leading-relaxed group-hover:text-foreground transition-colors">
              {item.articulationTip}
            </p>

            <div className="mt-3 flex items-center flex-wrap gap-x-1 gap-y-1">
              <span className="text-xs text-muted-foreground mr-1.5">常见拼写</span>
              {item.commonSpellings.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={(e) => {
                    if (onJumpToCombo) {
                      e.stopPropagation()
                      onJumpToCombo(sp)
                    }
                  }}
                  title={`查看 ${sp} 组合规则`}
                  className="h-7 px-1.5 rounded-md font-serif text-base text-white hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                >
                  {sp}
                </button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-dashed border-border grid grid-cols-2 gap-x-4">
              {item.words.map((repWord, index) => (
                <ExampleWordButton
                  key={`${item.id}-${index}`}
                  word={repWord.word}
                  phonetic={repWord.phonetic}
                  meaning={repWord.meaning}
                  highlight={repWord.highlight}
                  isPlaying={playingWord === repWord.word}
                  onClick={(e) => handlePlayWord(e, repWord)}
                />
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}
