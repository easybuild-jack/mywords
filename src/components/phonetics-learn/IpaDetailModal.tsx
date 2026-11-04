'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react'
import { IpaSymbolItem } from '@/resources/phoneticsData'
import { audioEngine } from '@/core/audioEngine'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { renderHighlightedWord } from './IpaMatrixView'

interface IpaDetailModalProps {
  isOpen: boolean
  onClose: () => void
  currentIndex: number
  allSymbols: IpaSymbolItem[]
  onNavigate: (index: number) => void
  onJumpToCombo?: (combo: string) => void
}

const NAV_BUTTON_CLASS =
  'shrink-0 size-10 xl:size-11 rounded-full flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent'

export function IpaDetailModal({
  isOpen,
  onClose,
  currentIndex,
  allSymbols,
  onNavigate,
  onJumpToCombo,
}: IpaDetailModalProps) {
  const { phoneticPreference, audioRate } = useWorkspaceStore()
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const [activeWordPlaying, setActiveWordPlaying] = useState<string | null>(null)
  const [isSymbolPlaying, setIsSymbolPlaying] = useState(false)

  const currentItem = allSymbols[currentIndex]

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1)
    }
  }, [currentIndex, onNavigate])

  const handleNext = useCallback(() => {
    if (currentIndex < allSymbols.length - 1) {
      onNavigate(currentIndex + 1)
    }
  }, [currentIndex, allSymbols.length, onNavigate])

  // 全局键盘监听：ESC 关闭，左右键直接翻页切换，空格重播音标
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === ' ' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        if (currentItem) playSymbolSound(currentItem.symbol)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrev, handleNext, onClose, currentItem])

  if (!isOpen || !currentItem) return null

  const playSymbolSound = (sym: string) => {
    setIsSymbolPlaying(true)
    audioEngine.playPhoneticSound(sym, 0.9)
    setTimeout(() => setIsSymbolPlaying(false), 1200)
  }

  const playSingleWord = (word: string) => {
    setActiveWordPlaying(word)
    audioEngine.playPronunciation(word, phoneticPreference, audioRate)
    setTimeout(() => {
      setActiveWordPlaying((cur) => (cur === word ? null : cur))
    }, 1500)
  }

  // 顺序连读全部 6 个代表词
  const handlePlayAllWords = async () => {
    if (isPlayingAll) return
    setIsPlayingAll(true)

    for (const w of currentItem.words) {
      setActiveWordPlaying(w.word)
      audioEngine.playPronunciation(w.word, phoneticPreference, audioRate)
      await new Promise((r) => setTimeout(r, 1600))
    }

    setActiveWordPlaying(null)
    setIsPlayingAll(false)
  }

  return (
    <div
      onClick={onClose}
      className="fixed top-0 bottom-0 left-0 md:left-56 right-0 z-40 flex items-center justify-center p-3 sm:p-5 xl:p-6 bg-background/80 backdrop-blur-sm animate-fade-in select-none"
    >
      {/* 弹窗核心区域：左右翻页 + 居中卡片，仅覆盖右侧内容区 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex items-center justify-center gap-2 sm:gap-4 xl:gap-6 max-w-full px-1"
      >
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className={NAV_BUTTON_CLASS}
          title="上一音标 (←)"
          aria-label="上一音标"
        >
          <ChevronLeft className="size-5 xl:size-6" />
        </button>

        <div className="relative w-[800px] h-[580px] xl:w-[940px] xl:h-[630px] 2xl:w-[1060px] 2xl:h-[680px] max-w-[calc(100%-100px)] sm:max-w-[calc(100%-130px)] rounded-xl overflow-hidden bg-sidebar border border-border shadow-xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 xl:top-5 xl:right-5 size-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer z-30"
            title="关闭详情 (ESC)"
            aria-label="关闭详情"
          >
            <X className="size-5" />
          </button>

          <div className="flex flex-col h-full w-full px-6 py-6 xl:px-9 xl:py-8 text-left select-none">
            {/* 顶部：音标、名称、分类与发音 */}
            <header className="shrink-0 pr-12">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="font-serif text-5xl xl:text-6xl text-primary leading-none">/{currentItem.symbol}/</h2>
                <button
                  type="button"
                  onClick={() => playSymbolSound(currentItem.symbol)}
                  className={`size-9 self-center rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                    isSymbolPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title="播放单音素发音 (Space)"
                  aria-label="播放发音"
                >
                  <Volume2 className={`size-5 ${isSymbolPlaying ? 'animate-pulse' : ''}`} />
                </button>
                <span className="text-sm text-muted-foreground">
                  {currentItem.name} · {currentItem.categoryLabel} · {currentItem.subcategory}
                </span>
                <span className="ml-auto text-xs font-mono text-muted-foreground/70 tabular-nums">
                  {currentIndex + 1} / {allSymbols.length}
                </span>
              </div>

              <p className="mt-5 text-[15px] xl:text-base text-gray-200 leading-relaxed max-h-[4.8em] overflow-y-auto custom-scrollbar pr-1">
                {currentItem.articulationTip}
              </p>

              <div className="mt-3 flex items-center gap-x-1 gap-y-1 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1.5">常见拼写</span>
                {currentItem.commonSpellings.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => {
                      if (onJumpToCombo) {
                        onClose()
                        onJumpToCombo(sp)
                      }
                    }}
                    className="h-7 px-1.5 rounded-md font-serif text-lg text-accent hover:bg-muted transition-colors cursor-pointer"
                    title={`查看 ${sp} 拼读规则`}
                  >
                    {sp}
                  </button>
                ))}
                <span className="text-xs text-muted-foreground/70 ml-auto hidden sm:inline">点击拼写查看对应拼读规则</span>
              </div>
            </header>

            {/* 下半区：代表词 */}
            <section className="flex-1 min-h-0 flex flex-col mt-5 xl:mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-1 shrink-0">
                <h3 className="text-sm font-medium text-foreground">
                  代表单词 <span className="ml-1 text-xs font-mono text-muted-foreground">{currentItem.words.length}</span>
                </h3>
                <button
                  type="button"
                  onClick={handlePlayAllWords}
                  disabled={isPlayingAll}
                  className={`h-7 px-2.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                    isPlayingAll ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Play className="size-3" />
                  {isPlayingAll ? '正在连读…' : '连读全部'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 content-start overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-0">
                {currentItem.words.map((wordItem, idx) => {
                  const isWordPlaying = activeWordPlaying === wordItem.word

                  return (
                    <div
                      key={idx}
                      onClick={() => playSingleWord(wordItem.word)}
                      className="group/item flex items-start justify-between gap-3 py-3 border-b border-dashed border-border cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          <span className="font-serif text-2xl xl:text-[26px] leading-tight">
                            {renderHighlightedWord(wordItem.word, wordItem.highlight)}
                          </span>
                          {wordItem.phonetic && (
                            <span className="font-serif text-sm text-muted-foreground">{wordItem.phonetic}</span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] xl:text-sm text-gray-300 leading-snug">{wordItem.meaning}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="phonics-highlight font-serif text-[13px]">{wordItem.highlight}</span> 发{' '}
                          <span className="font-serif text-[13px]">/{currentItem.symbol}/</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          playSingleWord(wordItem.word)
                        }}
                        className={`size-8 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isWordPlaying
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground/60 group-hover/item:text-foreground hover:bg-muted'
                        }`}
                        title={`发音 ${wordItem.word}`}
                        aria-label={`发音 ${wordItem.word}`}
                      >
                        <Volume2 className={`size-4 ${isWordPlaying ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= allSymbols.length - 1}
          className={NAV_BUTTON_CLASS}
          title="下一音标 (→)"
          aria-label="下一音标"
        >
          <ChevronRight className="size-5 xl:size-6" />
        </button>
      </div>
    </div>
  )
}
