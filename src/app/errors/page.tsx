'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Flame, CheckCircle, Volume2, ArrowRight, Play, Swords } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { getActiveErrorWords } from '@/db'
import { audioEngine } from '@/core/audioEngine'
import type { WordMasteryRecord, WordItem } from '@/types'

export default function ErrorBookPage() {
  const router = useRouter()
  const { startErrorPractice } = useWorkspaceStore()
  const [errorList, setErrorList] = useState<{ word: WordItem; record: WordMasteryRecord }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'severe'>('all')

  useEffect(() => {
    async function loadErrorWords() {
      setIsLoading(true)
      const realErrors = await getActiveErrorWords()
      setErrorList(realErrors)
      setIsLoading(false)
    }
    loadErrorWords()
  }, [])

  const filteredList = errorList.filter((item) => {
    if (filterType === 'severe') {
      return (item.record.dictationErrorCount || 0) >= 3
    }
    return true
  })

  // 启动错词歼灭战
  const handleStartAnnihilation = (wordsToPractice?: WordItem[], startIdx: number = 0) => {
    const list = wordsToPractice || filteredList.map((item) => item.word)
    if (!list.length) return
    startErrorPractice(list, startIdx)
    router.push('/')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 text-white overflow-y-auto">
      {/* 1. 顶部标题与筛选 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center border border-destructive/30 shadow-[0_0_20px_rgba(255,95,87,0.25)]">
            <Flame className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">错词攻坚本 (Error Annihilator)</h1>
            <p className="text-xs text-[#9CA3AF]">高频错误肌肉记忆重塑，死磕直到连续 2 次无提示盲打正确</p>
          </div>
        </div>

        {errorList.length > 0 && (
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-destructive text-white shadow-[0_0_12px_rgba(255,95,87,0.3)]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              全部待消灭 ({errorList.length})
            </button>
            <button
              onClick={() => setFilterType('severe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'severe'
                  ? 'bg-destructive text-white shadow-[0_0_12px_rgba(255,95,87,0.3)]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              高危重灾词 (&ge;3次)
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-[#9CA3AF] text-sm">正在检索本地错词记录...</div>
      ) : errorList.length === 0 ? (
        /* 暂无错词时的空状态 */
        <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <div className="size-16 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto shadow-[0_0_30px_rgb(var(--primary-rgb)/0.2)]">
            <CheckCircle className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">太棒了！当前没有待攻克的错词 🎉</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              在常规章节练习中，如果遇到默写错误或按 Tab 偷看的单词，系统会自动将其收录至此开展专项攻坚。
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] font-bold text-xs btn-neon-glow transition-all"
            >
              返回主页继续练习 →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. 攻坚统计总览卡片 */}
          <div className="glass-card p-6 rounded-3xl border border-destructive/30 bg-destructive/5 flex items-center justify-between shadow-[0_0_40px_rgba(255,95,87,0.1)]">
            <div className="space-y-1">
              <span className="text-xs text-destructive font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Swords className="size-3.5" />
                错词消灭机制 (2-Streak Rule)
              </span>
              <h2 className="text-xl font-bold text-white">
                当前共有 <span className="text-destructive font-extrabold font-mono text-2xl">{filteredList.length}</span> 个错词待彻底攻克
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                消除规则：在默写攻坚模式下连续正确 2 次，错词即可从攻坚列表中消除归档。
              </p>
            </div>

            <button
              onClick={() => handleStartAnnihilation()}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold text-sm shadow-[0_0_25px_rgba(255,95,87,0.4)] transition-all cursor-pointer"
            >
              <Flame className="size-4" />
              <span>🚀 开启错词歼灭战</span>
            </button>
          </div>

          {/* 3. 错词详细明细表格 */}
          <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-muted-foreground font-mono">
                  <th className="py-3.5 px-4">单词拼写</th>
                  <th className="py-3.5 px-4">音标与音节拆分</th>
                  <th className="py-3.5 px-4">中文核心释义</th>
                  <th className="py-3.5 px-4 text-center">累计错误次数</th>
                  <th className="py-3.5 px-4 text-center">连续攻克进度</th>
                  <th className="py-3.5 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredList.map((item, idx) => {
                  const errors = item.record.dictationErrorCount || 1
                  const streak = item.record.consecutiveCorrectCount || 0
                  const w = item.word

                  return (
                    <tr key={w.id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white text-sm">{w.name}</td>
                      <td className="py-3.5 px-4 text-gray-300">
                        <span className="text-primary font-semibold">{w.syllables?.join(' · ')}</span>
                        <span className="text-muted-foreground ml-2 text-[11px]">{w.phoneticUs}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-200 font-sans text-xs">
                        {w.posList?.[0]?.pos} {w.posList?.[0]?.means?.join('； ')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 font-bold">
                          {errors} 次
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" title={`连续正确 ${streak}/2 次`}>
                          <div className={`size-2.5 rounded-full ${streak >= 1 ? 'bg-primary shadow-[0_0_8px_rgb(var(--primary-rgb)/0.6)]' : 'bg-white/10'}`} />
                          <div className={`size-2.5 rounded-full ${streak >= 2 ? 'bg-primary shadow-[0_0_8px_rgb(var(--primary-rgb)/0.6)]' : 'bg-white/10'}`} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => audioEngine.playPronunciation(w.name)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="发音"
                          >
                            <Volume2 className="size-4" />
                          </button>
                          <button
                            onClick={() => handleStartAnnihilation(filteredList.map((i) => i.word), idx)}
                            className="px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30 text-xs font-semibold transition-all cursor-pointer"
                            title="从该词开始专项攻坚"
                          >
                            攻坚 →
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
