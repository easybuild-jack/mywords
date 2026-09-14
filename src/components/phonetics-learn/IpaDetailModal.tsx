'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Volume2,
  ArrowLeft,
  ArrowRight,
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
      className="fixed top-0 bottom-0 left-0 md:left-64 right-0 z-40 flex items-center justify-center p-3 sm:p-5 xl:p-6 bg-black/80 backdrop-blur-sm animate-fade-in select-none"
    >
      {/* 弹窗核心区域：左右翻页 + 居中自适应卡片（严格对齐词根词缀详情弹窗模式，非全屏） */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex items-center justify-center gap-2.5 sm:gap-4 xl:gap-6 max-w-full px-1"
      >
        {/* 左翻页按钮 */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className={`shrink-0 size-9 sm:size-10 xl:size-12 rounded-full bg-sidebar flex items-center justify-center transition-all border ${
            currentIndex <= 0
              ? 'opacity-20 cursor-not-allowed text-gray-600 border-white/5'
              : 'text-[#9CA3AF] hover:text-white border-white/15 hover:border-primary/50 hover:bg-white/[0.08] hover:scale-110 active:scale-95 cursor-pointer shadow-xl'
          }`}
          title="上一音标 (←)"
          aria-label="上一音标"
        >
          <ArrowLeft className="size-5 xl:size-6" />
        </button>

        {/* 详情卡片容器（实底不透明 bg-sidebar，杜绝透光干扰底层数据） */}
        <div className="relative w-[800px] h-[580px] xl:w-[940px] xl:h-[630px] 2xl:w-[1060px] 2xl:h-[680px] max-w-[calc(100%-100px)] sm:max-w-[calc(100%-130px)] rounded-3xl overflow-hidden bg-sidebar border border-white/15 shadow-2xl transition-all duration-300">
          {/* 右上角关闭按钮 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 xl:top-6 xl:right-6 size-9 sm:size-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer z-30 shadow-md hover:scale-105 active:scale-95"
            title="关闭详情 (ESC)"
            aria-label="关闭详情"
          >
            <X className="size-5" />
          </button>

          {/* 详情卡片内容 */}
          <div className="flex flex-col h-full w-full p-5 sm:p-6 xl:p-7 text-left select-none">
            {/* 顶部：核心形态与发音概览 */}
            <div className="space-y-2 xl:space-y-2.5 shrink-0">
              {/* 大字形态、读音名称、分类归属与内联发音按钮 */}
              <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3.5 xl:gap-4 pr-12 sm:pr-14">
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-primary font-mono tracking-tight flex items-center gap-2">
                  <span>/{currentItem.symbol}/</span>
                  <button
                    type="button"
                    onClick={() => playSymbolSound(currentItem.symbol)}
                    className="size-7 sm:size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer"
                    title="播放单音素发音 (Space)"
                    aria-label="播放发音"
                  >
                    <Volume2 className={`size-4 sm:size-5 ${isSymbolPlaying ? 'text-primary animate-pulse' : ''}`} />
                  </button>
                </h2>

                <span className="font-mono text-lg sm:text-xl xl:text-2xl text-gray-300 font-normal">
                  {currentItem.name}
                </span>

                <div className="text-base sm:text-lg xl:text-xl font-bold text-gray-200">
                  分类：<span className="text-accent">{currentItem.categoryLabel} · {currentItem.subcategory}</span>
                </div>
              </div>

              {/* 口型发音指引与常见组合（主解释区：上面为技巧指引，下面为常见拼写） */}
              <div className="h-[96px] sm:h-[102px] xl:h-[108px] text-xs sm:text-sm xl:text-[15px] bg-white/[0.04] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-white/10 flex flex-col justify-between select-none">
                {/* 上面：发音要领口诀 */}
                <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1">
                  <p className="text-gray-100 leading-relaxed">
                    {currentItem.articulationTip}
                  </p>
                </div>

                {/* 下面：常见对应字母组合 */}
                <div className="pt-1.5 mt-auto shrink-0 border-t border-white/10 flex items-center gap-2 flex-wrap">
                  <span className="text-primary font-medium text-xs sm:text-[13px] xl:text-sm leading-snug">
                    常见拼写对应：
                  </span>
                  {currentItem.commonSpellings.map((sp) => (
                    <span
                      key={sp}
                      onClick={() => {
                        if (onJumpToCombo) {
                          onClose()
                          onJumpToCombo(sp)
                        }
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-accent/15 text-accent border border-accent/25 select-none leading-none inline-block shrink-0 cursor-pointer hover:bg-accent/25 hover:scale-105 active:scale-95 transition-all"
                      title={`查看 ${sp} 拼读规则`}
                    >
                      {sp}
                    </span>
                  ))}
                  <span className="text-[11px] text-muted-foreground ml-auto hidden sm:inline">
                    (点击拼写可直通对应拼读规则)
                  </span>
                </div>
              </div>
            </div>

            {/* 下半区：代表性单词矩阵 */}
            <div className="flex-1 min-h-0 flex flex-col mt-3.5 sm:mt-4">
              {/* 小节标题：标明代表词数量，提供连续朗读与操作提示 */}
              <div className="flex items-center justify-between mb-2 shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-3.5 rounded-full bg-primary" />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-300 tracking-wider">
                    6个核心代表性单词
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white/10 text-gray-400">
                    6
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePlayAllWords}
                    disabled={isPlayingAll}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isPlayingAll
                        ? 'bg-primary/20 text-primary border-primary/40 animate-pulse'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-white border-white/10'
                    }`}
                  >
                    <Play className="size-3" />
                    <span>{isPlayingAll ? '正在连读中...' : '连读全部6词'}</span>
                  </button>
                  <span className="text-[11px] text-gray-400 font-normal hidden sm:inline">
                    点击卡片或喇叭播放发音
                  </span>
                </div>
              </div>

              {/* 单词列表网格：采用与 RootCard 一致的精致排版 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 xl:gap-3 content-start overflow-y-auto pr-1.5 custom-scrollbar text-left flex-1 min-h-0">
                {currentItem.words.map((wordItem, idx) => {
                  const isWordPlaying = activeWordPlaying === wordItem.word

                  return (
                    <div
                      key={idx}
                      onClick={() => playSingleWord(wordItem.word)}
                      className="group/item relative flex flex-col justify-between gap-1.5 xl:gap-2 p-2.5 sm:p-3 xl:p-3.5 rounded-xl xl:rounded-2xl bg-white/[0.035] hover:bg-white/[0.075] border border-white/10 hover:border-primary/40 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
                    >
                      {/* 第 1 行：单词拼写 + 音标 + 发音按钮 */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                          <span className="font-mono text-base sm:text-[17px] xl:text-lg font-bold text-white group-hover/item:text-primary transition-colors tracking-tight">
                            {renderHighlightedWord(wordItem.word, wordItem.highlight)}
                          </span>

                          {wordItem.phonetic && (
                            <span className="font-mono text-xs text-gray-400 font-normal">
                              {wordItem.phonetic}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            playSingleWord(wordItem.word)
                          }}
                          className={`size-6.5 sm:size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                            isWordPlaying
                              ? 'bg-primary text-black border-primary shadow-xs'
                              : 'text-gray-400 group-hover/item:text-primary group-hover/item:bg-primary/10 hover:bg-primary/20 border-transparent group-hover/item:border-primary/20'
                          }`}
                          title={`发音 ${wordItem.word}`}
                          aria-label={`发音 ${wordItem.word}`}
                        >
                          <Volume2 className="size-3.5 sm:size-4" />
                        </button>
                      </div>

                      {/* 第 2 行：核心发音字母组合微胶囊 */}
                      <div className="flex items-start gap-1.5 px-2.5 py-1 rounded-lg bg-primary/[0.07] border border-primary/15 text-xs sm:text-[12.5px] font-mono text-primary leading-snug group-hover/item:bg-primary/[0.12] group-hover/item:border-primary/25 transition-colors">
                        <span className="text-accent font-bold select-none shrink-0 mt-0.5">→</span>
                        <span className="font-medium tracking-tight break-words">
                          发音核心组合：<span className="text-amber-400 font-bold">{wordItem.highlight}</span> 发 /{currentItem.symbol}/
                        </span>
                      </div>

                      {/* 第 3 行：中文释义 */}
                      <div className="text-xs sm:text-[13px] xl:text-sm font-semibold text-gray-100 leading-snug">
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-accent/15 text-accent border border-accent/25 select-none leading-none inline-block shrink-0 align-baseline shadow-xs mr-1.5">
                          释义
                        </span>
                        {wordItem.meaning}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 右翻页按钮 */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= allSymbols.length - 1}
          className={`shrink-0 size-9 sm:size-10 xl:size-12 rounded-full bg-sidebar flex items-center justify-center transition-all border ${
            currentIndex >= allSymbols.length - 1
              ? 'opacity-20 cursor-not-allowed text-gray-600 border-white/5'
              : 'text-[#9CA3AF] hover:text-white border-white/15 hover:border-primary/50 hover:bg-white/[0.08] hover:scale-110 active:scale-95 cursor-pointer shadow-xl'
          }`}
          title="下一音标 (→)"
          aria-label="下一音标"
        >
          <ArrowRight className="size-5 xl:size-6" />
        </button>
      </div>
    </div>
  )
}
