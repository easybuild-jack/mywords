'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Star, Sparkles, Volume2, Play } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { INITIAL_SAMPLE_WORDS } from '@/resources/books'
import { audioEngine } from '@/core/audioEngine'

export function StarredWordsPage() {
  const router = useRouter()
  const { setMode } = useWorkspaceStore()

  // 示例生词数据
  const starredList = INITIAL_SAMPLE_WORDS.slice(0, 6)

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 text-white overflow-y-auto">
      {/* 1. 顶部标题与专属特训按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30 shadow-[0_0_20px_rgba(254,188,46,0.2)]">
            <Star className="size-5 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">重点生词本 (Starred Notebook)</h1>
            <p className="text-xs text-[#9CA3AF]">练习过程中一键加星（Ctrl+S）收藏的难记词汇，随时发起专项攻坚</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMode('learn')
            router.push('/')
          }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-[#0B0C0E] font-bold text-xs shadow-[0_0_20px_rgba(254,188,46,0.3)] hover:brightness-110 transition-all"
        >
          <Play className="size-3.5 fill-current" />
          <span>开始生词特训</span>
        </button>
      </div>

      {/* 2. 生词卡片列表 */}
      <div className="grid grid-cols-2 gap-4">
        {starredList.map((item) => (
          <div
            key={item.id}
            className="glass-card p-5 rounded-2xl border border-white/10 space-y-3 hover:border-primary/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-mono text-white">{item.name}</h3>
                <span className="text-xs font-mono text-primary font-medium">{item.syllables.join(' · ')}</span>
              </div>
              <button
                onClick={() => audioEngine.playPronunciation(item.name)}
                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
              >
                <Volume2 className="size-4" />
              </button>
            </div>

            <div className="text-xs text-[#9CA3AF]">
              {item.phoneticUs} · <span className="text-gray-200">{item.posList[0]?.pos} {item.posList[0]?.means.join('； ')}</span>
            </div>

            {item.etymology?.derivation && (
              <div className="p-2 rounded-lg bg-black/30 text-[11px] text-accent font-mono">
                {item.etymology.derivation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StarredWordsPage
