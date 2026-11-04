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
            <span key={index} className="font-serif italic text-muted-foreground select-none">
              {part.trim()}
            </span>
          )
        }
        if (!part.trim()) return null
        return <span key={index}>{part.trim()}</span>
      })}
    </span>
  )
}

export function RootCard({ root, currentIndex, totalRoots }: RootCardProps) {
  const { phoneticPreference } = useWorkspaceStore()

  const handlePlayWordAudio = (wordName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    audioEngine.playPronunciation(wordName, phoneticPreference)
  }

  return (
    <div className="flex flex-col h-full w-full px-6 py-6 xl:px-9 xl:py-8 text-left select-none">
      {/* 顶部：形态、读音、本义与词源 */}
      <header className="shrink-0 pr-12">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-serif text-5xl xl:text-6xl text-primary leading-none">{root.form}</h2>
          {root.phonetic && <span className="font-serif text-xl text-muted-foreground">{root.phonetic}</span>}
          <span className="text-base xl:text-lg text-white">{root.meaning}</span>
          <span className="ml-auto text-xs font-mono text-muted-foreground/70 tabular-nums">
            {currentIndex + 1} / {totalRoots}
          </span>
        </div>

        <p className="mt-5 text-[15px] xl:text-base text-gray-200 leading-relaxed max-h-[4.8em] overflow-y-auto custom-scrollbar pr-1">
          {root.origin}
        </p>
        {root.derivationNote && (
          <p className="mt-2 text-[13px] xl:text-sm text-muted-foreground leading-snug">→ {root.derivationNote}</p>
        )}
      </header>

      {/* 下半区：派生词族 */}
      <section className="flex-1 min-h-0 flex flex-col mt-5 xl:mt-6 border-t border-border pt-4">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <h3 className="text-sm font-medium text-foreground">
            派生词 <span className="ml-1 text-xs font-mono text-muted-foreground">{root.words.length}</span>
          </h3>
          <span className="text-xs text-muted-foreground/70 hidden sm:inline">点击单词播放发音</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 content-start overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-0">
          {root.words.map((wordItem, idx) => {
            const cleanBreakdown = wordItem.breakdown.replace(/^→\s*/, '')

            return (
              <div
                key={idx}
                onClick={(e) => handlePlayWordAudio(wordItem.name, e)}
                className="group/item flex items-start justify-between gap-3 py-3 border-b border-dashed border-border cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="font-serif text-xl xl:text-2xl text-white group-hover/item:text-primary transition-colors leading-tight">
                      {wordItem.name}
                    </span>
                    {wordItem.phonetic && (
                      <span className="font-serif text-sm text-muted-foreground">{wordItem.phonetic}</span>
                    )}
                  </div>
                  <p className="mt-1 font-serif text-[13px] xl:text-sm text-primary/90 break-words">{cleanBreakdown}</p>
                  <div className="mt-0.5 text-[13px] xl:text-sm text-gray-300 leading-snug">{renderMeaning(wordItem.meaning)}</div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handlePlayWordAudio(wordItem.name, e)}
                  className="size-8 rounded-md flex items-center justify-center text-muted-foreground/60 group-hover/item:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                  title={`发音 ${wordItem.name}`}
                  aria-label={`发音 ${wordItem.name}`}
                >
                  <Volume2 className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
