'use client'

import React from 'react'
import { Volume2 } from 'lucide-react'
import type { RootItem } from '@/types'
import { audioEngine } from '@/core/audioEngine'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface RootCardProps {
  root: RootItem
  currentIndex: number
  totalRoots: number
}

// 常见词性标注匹配正则：v./n. / v. / n. / adj. / adv. / prep. / vt. / vi. 等
const POS_PATTERN = /(v\.\/n\.|n\.\/v\.|adj\.\/adv\.|adj\.|adv\.|prep\.|conj\.|pron\.|num\.|art\.|interj\.|vt\.|vi\.|v\.|n\.)/gi
const POS_EXACT_CHECK = /^(v\.\/n\.|n\.\/v\.|adj\.\/adv\.|adj\.|adv\.|prep\.|conj\.|pron\.|num\.|art\.|interj\.|vt\.|vi\.|v\.|n\.)$/i

function renderMeaning(meaning: string) {
  const parts = meaning.split(POS_PATTERN)
  if (parts.length <= 1) {
    return <span>{meaning}</span>
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
      {parts.map((part, index) => {
        if (POS_EXACT_CHECK.test(part)) {
          return (
            <span
              key={index}
              className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-accent/15 text-accent border border-accent/25 select-none leading-none inline-block shrink-0 align-baseline shadow-xs"
            >
              {part.trim()}
            </span>
          )
        }
        if (!part.trim()) return null
        return (
          <span key={index} className="text-gray-100">
            {part.trim()}
          </span>
        )
      })}
    </span>
  )
}

export function RootCard({ root }: RootCardProps) {
  const { phoneticPreference } = useWorkspaceStore()

  const handlePlayWordAudio = (wordName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    audioEngine.playPronunciation(wordName, phoneticPreference)
  }

  return (
    <div className="flex flex-col h-full w-full p-5 sm:p-6 xl:p-7 text-left select-none">
      {/* 顶部：核心形态与词源故事 */}
      <div className="space-y-2 xl:space-y-2.5 shrink-0">
        {/* 大字形态、读音音标、核心本义 */}
        <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3.5 xl:gap-4 pr-12 sm:pr-14">
          <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
            <span className="text-primary">
              {root.form}
            </span>
          </h2>
          {root.phonetic && (
            <span className="font-mono text-lg sm:text-xl xl:text-2xl text-gray-300 font-normal">
              {root.phonetic}
            </span>
          )}
          <div className="text-base sm:text-lg xl:text-xl font-bold text-gray-200">
            本义：<span className="text-accent">{root.meaning}</span>
          </div>
        </div>

        {/* 词源故事与演变逻辑（主解释区：上面留给 origin 词源，下面固定呈现 derivationNote 派生解析） */}
        <div className="h-[96px] sm:h-[102px] xl:h-[108px] text-xs sm:text-sm xl:text-[15px] bg-white/[0.04] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-white/10 flex flex-col justify-between select-none">
          {/* 上面：留给词根词缀的 origin 字段 */}
          <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-1">
            <p className="text-gray-100 leading-relaxed">
              {root.origin}
            </p>
          </div>

          {/* 下面：固定在主解释区的底部 */}
          {root.derivationNote && (
            <div className="pt-1.5 mt-auto shrink-0 border-t border-white/10">
              <p className="text-primary font-medium text-xs sm:text-[13px] xl:text-sm leading-snug">
                {root.derivationNote}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 下半区：派生核心词族矩阵 */}
      <div className="flex-1 min-h-0 flex flex-col mt-3.5 sm:mt-4">
        {/* 小节标题：标明派生例词及数量，提供操作提示 */}
        <div className="flex items-center justify-between mb-2 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full bg-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-gray-300 tracking-wider">
              派生核心词族
            </h3>
            <span className="px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white/10 text-gray-400">
              {root.words.length}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-normal hidden sm:inline">
            点击卡片或喇叭播放发音
          </span>
        </div>

        {/* 单词列表网格：采用卡片化精致排版，支持舒适滚动 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 xl:gap-3 content-start overflow-y-auto pr-1.5 custom-scrollbar text-left flex-1 min-h-0">
          {root.words.map((wordItem, idx) => {
            const cleanBreakdown = wordItem.breakdown.replace(/^→\s*/, '')

            return (
              <div
                key={idx}
                onClick={(e) => handlePlayWordAudio(wordItem.name, e)}
                className="group/item relative flex flex-col justify-between gap-1.5 xl:gap-2 p-2.5 sm:p-3 xl:p-3.5 rounded-xl xl:rounded-2xl bg-white/[0.035] hover:bg-white/[0.075] border border-white/10 hover:border-primary/40 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
              >
                {/* 第 1 行：单词拼写 + 音标 + 发音按钮 */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                    <span className="font-mono text-base sm:text-[17px] xl:text-lg font-bold text-white group-hover/item:text-primary transition-colors tracking-tight">
                      {wordItem.name}
                    </span>

                    {wordItem.phonetic && (
                      <span className="font-mono text-xs text-gray-400 font-normal">
                        {wordItem.phonetic}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handlePlayWordAudio(wordItem.name, e)}
                    className="size-6.5 sm:size-7 rounded-lg flex items-center justify-center text-gray-400 group-hover/item:text-primary group-hover/item:bg-primary/10 hover:bg-primary/20 active:scale-90 transition-all cursor-pointer shrink-0 border border-transparent group-hover/item:border-primary/20"
                    title={`发音 ${wordItem.name}`}
                    aria-label={`发音 ${wordItem.name}`}
                  >
                    <Volume2 className="size-3.5 sm:size-4" />
                  </button>
                </div>

                {/* 第 2 行：核心构词拆解公式 (精致胶囊公式条) */}
                <div className="flex items-start gap-1.5 px-2.5 py-1 rounded-lg bg-primary/[0.07] border border-primary/15 text-xs sm:text-[12.5px] font-mono text-primary leading-snug group-hover/item:bg-primary/[0.12] group-hover/item:border-primary/25 transition-colors">
                  <span className="text-accent font-bold select-none shrink-0 mt-0.5">→</span>
                  <span className="font-medium tracking-tight break-words">
                    {cleanBreakdown}
                  </span>
                </div>

                {/* 第 3 行：中文释义（词性微徽标 + 精准释义） */}
                <div className="text-xs sm:text-[13px] xl:text-sm font-semibold text-gray-100 leading-snug">
                  {renderMeaning(wordItem.meaning)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
