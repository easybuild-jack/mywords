'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Flame, CheckCircle, Volume2, Star, Filter } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { db } from '@/db'
import { INITIAL_SAMPLE_WORDS } from '@/resources/books'
import { audioEngine } from '@/core/audioEngine'
import type { WordMasteryRecord, WordItem } from '@/types'

export default function ErrorBookPage() {
  const router = useRouter()
  const { currentBook, setMode } = useWorkspaceStore()
  const [errorRecords, setErrorRecords] = useState<WordMasteryRecord[]>([])
  const [filterType, setFilterType] = useState<'all' | 'severe'>('all')

  useEffect(() => {
    async function loadErrorWords() {
      const records = await db.wordRecords.where('isError').equals(1 as any).toArray()
      setErrorRecords(records)
    }
    loadErrorWords()
  }, [])

  // 映射对应的单词数据
  const displayWords: (WordItem & { errorRecord?: WordMasteryRecord })[] = INITIAL_SAMPLE_WORDS.slice(0, 8).map((w, idx) => ({
    ...w,
    errorRecord: errorRecords.find((r) => r.wordId === w.id) || {
      wordId: w.id,
      bookId: 'book_cet4',
      isMastered: false,
      isStarred: idx % 2 === 0,
      isError: true,
      totalPracticeCount: 4,
      dictationErrorCount: 3 + idx * 2,
      consecutiveCorrectCount: idx === 1 ? 1 : 0,
      lastPracticedAt: Date.now() - idx * 3600000,
    },
  }))

  const filteredList = displayWords.filter((w) => {
    if (filterType === 'severe') return (w.errorRecord?.dictationErrorCount || 0) >= 4
    return true
  })

  // 启动错词歼灭战
  const handleStartAnnihilation = () => {
    setMode('dictation')
    router.push('/')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 text-white overflow-y-auto">
      {/* 1. 顶部标题与筛选 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center border border-destructive/30 shadow-[0_0_20px_rgba(255,95,87,0.2)]">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">错词本与专属歼灭中心 (Error Killer Hub)</h1>
            <p className="text-xs text-[#9CA3AF]">自动沉淀所有默写错误的生词，死磕直到连续 2 次无提示盲打正确</p>
          </div>
        </div>

        {/* 筛选下拉 */}
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'severe')}
            className="bg-white/[0.06] border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="all" className="bg-[#12141A]">全部活跃错词 ({filteredList.length})</option>
            <option value="severe" className="bg-[#12141A]">重灾区错词 (错 &gt; 3 次)</option>
          </select>
        </div>
      </div>

      {/* 2. 错词歼灭战横幅卡片 */}
      <div className="glass-card p-7 rounded-3xl border border-destructive/30 bg-destructive/5 flex items-center justify-between shadow-[0_0_40px_rgba(255,95,87,0.12)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-wider font-mono">
            <Flame className="size-4 animate-pulse" />
            <span>Error Annihilation Arena (错词攻坚战场)</span>
          </div>

          <h2 className="text-2xl font-extrabold text-white">当前共有 {filteredList.length} 个待攻克活跃错词</h2>
          <p className="text-xs text-[#9CA3AF]">
            消除规则：只有在纯盲打默写模式下连续正确 2 次，错词才会从活跃列表中攻克归档。
          </p>
        </div>

        <button
          onClick={handleStartAnnihilation}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-[#0B0C0E] font-bold text-sm btn-neon-glow hover:bg-primary-hover transition-all"
        >
          <span>🚀 开始错词歼灭战</span>
        </button>
      </div>

      {/* 3. 错词详细明细表格 */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-muted-foreground font-mono">
              <th className="py-3.5 px-4 w-12 text-center">收藏</th>
              <th className="py-3.5 px-4">单词拼写</th>
              <th className="py-3.5 px-4">音标与音节拆分</th>
              <th className="py-3.5 px-4">中文核心释义</th>
              <th className="py-3.5 px-4 text-center">累计错误次数</th>
              <th className="py-3.5 px-4 text-center">连续攻克进度</th>
              <th className="py-3.5 px-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filteredList.map((item) => {
              const errors = item.errorRecord?.dictationErrorCount || 1
              const streak = item.errorRecord?.consecutiveCorrectCount || 0
              const isStarred = item.errorRecord?.isStarred

              return (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    <Star className={`size-4 mx-auto ${isStarred ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white text-sm">{item.name}</td>
                  <td className="py-3.5 px-4 text-gray-300">
                    <span className="text-primary font-semibold">{item.syllables.join(' · ')}</span>
                    <span className="text-muted-foreground ml-2 text-[11px]">{item.phoneticUs}</span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-200 font-sans text-xs">
                    {item.posList[0]?.pos} {item.posList[0]?.means.join('； ')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 font-bold">
                      {errors} 次
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className={`size-2.5 rounded-full ${streak >= 1 ? 'bg-primary shadow-[0_0_8px_rgb(var(--primary-rgb)/0.6)]' : 'bg-white/10'}`} />
                      <div className={`size-2.5 rounded-full ${streak >= 2 ? 'bg-primary shadow-[0_0_8px_rgb(var(--primary-rgb)/0.6)]' : 'bg-white/10'}`} />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => audioEngine.playPronunciation(item.name)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors mr-1"
                      title="发音"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
