'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Flame, CheckCircle, Volume2, ArrowRight, Play, Swords, Trash2, GraduationCap, PenLine, Star } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { getActiveTroubleWords, removeErrorWord } from '@/db'
import { audioEngine } from '@/core/audioEngine'
import type { WordMasteryRecord, WordItem } from '@/types'

export default function TroubleWordsPage() {
  const router = useRouter()
  const { startErrorPractice, startErrorLearnPractice } = useWorkspaceStore()
  const [troubleList, setTroubleList] = useState<{ word: WordItem; record: WordMasteryRecord }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'starred' | 'error' | 'severe'>('all')

  useEffect(() => {
    async function loadTroubleWords() {
      setIsLoading(true)
      const realTroubles = await getActiveTroubleWords()
      setTroubleList(realTroubles)
      setIsLoading(false)
    }
    loadTroubleWords()
  }, [])

  const starredCount = troubleList.filter((i) => i.record.isStarred).length
  const errorCount = troubleList.filter((i) => i.record.isError).length
  const severeCount = troubleList.filter((i) => (i.record.dictationErrorCount || 0) >= 3).length

  const filteredList = troubleList.filter((item) => {
    if (filterType === 'starred') {
      return item.record.isStarred
    }
    if (filterType === 'error') {
      return item.record.isError
    }
    if (filterType === 'severe') {
      return (item.record.dictationErrorCount || 0) >= 3
    }
    return true
  })

  // 从生错词本删除单个生错词
  const handleDelete = async (wordId: string) => {
    await removeErrorWord(wordId)
    setTroubleList((prev) => prev.filter((item) => item.word.id !== wordId))
    useWorkspaceStore.setState((s) => ({
      starredWordIds: s.starredWordIds.filter((id) => id !== wordId),
    }))
  }

  // 启动生错词跟学练习
  const handleStartPractice = (wordsToPractice?: WordItem[], startIdx: number = 0) => {
    const list = wordsToPractice || filteredList.map((item) => item.word)
    if (!list.length) return
    startErrorLearnPractice(list, startIdx)
    router.push('/learn')
  }

  // 启动生错词攻坚默写
  const handleStartAnnihilation = (wordsToPractice?: WordItem[], startIdx: number = 0) => {
    const list = wordsToPractice || filteredList.map((item) => item.word)
    if (!list.length) return
    startErrorPractice(list, startIdx)
    router.push('/dictation')
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
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <span>生错词攻坚</span>
              <span className="text-xs font-mono font-normal text-muted-foreground bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10">
                Trouble Words
              </span>
            </h1>
            <p className="text-xs text-[#9CA3AF]">收藏生词与拼写薄弱错词聚合攻坚池，单个单词连续 3 次无提示默写正确即自动攻克归档</p>
          </div>
        </div>

        {troubleList.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-destructive text-white shadow-[0_0_12px_rgba(255,95,87,0.3)]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              全部待攻克 ({troubleList.length})
            </button>
            <button
              onClick={() => setFilterType('starred')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'starred'
                  ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ⭐ 生词 ({starredCount})
            </button>
            <button
              onClick={() => setFilterType('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'error'
                  ? 'bg-destructive text-white shadow-[0_0_12px_rgba(255,95,87,0.3)]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              🔥 错词 ({errorCount})
            </button>
            <button
              onClick={() => setFilterType('severe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'severe'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              高危 (≥3次) ({severeCount})
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-[#9CA3AF] text-sm">正在检索本地生错词记录...</div>
      ) : troubleList.length === 0 ? (
        /* 暂无生错词时的空状态 */
        <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <div className="size-16 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto shadow-[0_0_30px_rgb(var(--primary-rgb)/0.2)]">
            <CheckCircle className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">太棒了！当前没有待攻克的生错词 🎉</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              学习过程中主动标记的生词（快捷键加星），以及默写失误或按 Tab 偷看的错词，均会自动汇集于此开展专项练习与攻坚。
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push('/learn')}
              className="px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] font-bold text-xs btn-neon-glow transition-all cursor-pointer"
            >
              前往单词跟学继续练习 →
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
                生错词攻克机制 (3-Streak Rule)
              </span>
              <h2 className="text-xl font-bold text-white">
                当前共有 <span className="text-destructive font-extrabold font-mono text-2xl">{filteredList.length}</span> 个生错词待彻底攻克
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                消除规则：只要该单词在默写模式下连续正确 3 次，系统立即自动将其攻克消除并归档。
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStartPractice()}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-bold text-sm shadow-[0_0_20px_rgba(var(--primary-rgb)/0.2)] transition-all cursor-pointer"
              >
                <GraduationCap className="size-4" />
                <span>生错词跟学练习</span>
              </button>
              <button
                onClick={() => handleStartAnnihilation()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold text-sm shadow-[0_0_25px_rgba(255,95,87,0.4)] transition-all cursor-pointer"
              >
                <Flame className="size-4" />
                <span>🚀 开启生错词默写</span>
              </button>
            </div>
          </div>

          {/* 3. 生错词详细明细表格 */}
          <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-muted-foreground font-mono text-xs">
                  <th className="py-2.5 px-4 w-52 font-semibold">单词拼写与来源</th>
                  <th className="py-2.5 px-4 w-48 font-semibold">音标</th>
                  <th className="py-2.5 px-4 font-semibold">中文核心释义</th>
                  <th className="py-2.5 px-4 w-44 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredList.map((item, idx) => {
                  const w = item.word

                  return (
                    <tr key={w.id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-lg tracking-wide">{w.name}</span>
                          {item.record.isStarred && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-0.5 font-sans font-medium">
                              ⭐ 生词
                            </span>
                          )}
                          {item.record.isError && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30 inline-flex items-center gap-0.5 font-sans font-medium">
                              🔥 错词
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-gray-300 font-sans text-lg whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-gray-300">{w.phoneticUs || '-'}</span>
                          <button
                            onClick={() => audioEngine.playPronunciation(w.name)}
                            className="p-1 rounded-lg text-primary/80 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="发音"
                          >
                            <Volume2 className="size-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-white font-sans text-base font-normal leading-snug">
                        {w.posList?.[0]?.pos && (
                          <span className="text-primary font-mono font-semibold mr-2 text-base">
                            {w.posList[0].pos}
                          </span>
                        )}
                        <span>{w.posList?.[0]?.means?.join('； ')}</span>
                      </td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleStartPractice(filteredList.map((i) => i.word), idx)}
                            className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                            title="从该词开始生错词跟学练习"
                          >
                            <GraduationCap className="size-3.5" />
                            <span>练习</span>
                          </button>
                          <button
                            onClick={() => handleStartAnnihilation(filteredList.map((i) => i.word), idx)}
                            className="px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                            title="从该词开始专项攻坚默写"
                          >
                            <PenLine className="size-3.5" />
                            <span>默写</span>
                          </button>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                            title="从生错词本中移除该词"
                          >
                            <Trash2 className="size-4" />
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
