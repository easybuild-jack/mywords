'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Flame, CheckCircle, Volume2, ArrowRight, Play, Swords, Trash2, GraduationCap, PenLine } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { getActiveErrorWords, removeErrorWord } from '@/db'
import { audioEngine } from '@/core/audioEngine'
import type { WordMasteryRecord, WordItem } from '@/types'

export default function ErrorBookPage() {
  const router = useRouter()
  const { startErrorPractice, startErrorLearnPractice } = useWorkspaceStore()
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

  // 从错词本删除单个错词
  const handleDeleteError = async (wordId: string) => {
    await removeErrorWord(wordId)
    setErrorList((prev) => prev.filter((item) => item.word.id !== wordId))
  }

  // 启动错词跟学练习
  const handleStartPractice = (wordsToPractice?: WordItem[], startIdx: number = 0) => {
    const list = wordsToPractice || filteredList.map((item) => item.word)
    if (!list.length) return
    startErrorLearnPractice(list, startIdx)
    router.push('/learn')
  }

  // 启动错词攻坚默写
  const handleStartAnnihilation = (wordsToPractice?: WordItem[], startIdx: number = 0) => {
    const list = wordsToPractice || filteredList.map((item) => item.word)
    if (!list.length) return
    startErrorPractice(list, startIdx)
    // 错词攻坚是默写页的一种词源，复用默写页的全套逻辑
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
            <h1 className="text-2xl font-extrabold text-white">错词攻坚本 (Error Annihilator)</h1>
            <p className="text-xs text-[#9CA3AF]">高频错误肌肉记忆重塑，单个单词只要连续 3 次无提示默写正确即自动消除</p>
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
              在常规章节默写中，如果遇到拼写错误或按 Tab 偷看的单词，系统会自动将其收录至此开展专项攻坚。
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => router.push('/dictation')}
              className="px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] font-bold text-xs btn-neon-glow transition-all cursor-pointer"
            >
              返回默写页继续练习 →
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
                错词消灭机制 (3-Streak Rule)
              </span>
              <h2 className="text-xl font-bold text-white">
                当前共有 <span className="text-destructive font-extrabold font-mono text-2xl">{filteredList.length}</span> 个错词待彻底攻克
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                消除规则：只要该单词在默写模式下连续正确 3 次，系统立即自动删除该词的错词记录。
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStartPractice()}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-bold text-sm shadow-[0_0_20px_rgba(var(--primary-rgb)/0.2)] transition-all cursor-pointer"
              >
                <GraduationCap className="size-4" />
                <span>错词跟学练习</span>
              </button>
              <button
                onClick={() => handleStartAnnihilation()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold text-sm shadow-[0_0_25px_rgba(255,95,87,0.4)] transition-all cursor-pointer"
              >
                <Flame className="size-4" />
                <span>🚀 开启错词默写</span>
              </button>
            </div>
          </div>

          {/* 3. 错词详细明细表格 */}
          <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-muted-foreground font-mono text-xs">
                  <th className="py-2.5 px-4 w-48 font-semibold">单词拼写</th>
                  <th className="py-2.5 px-4 w-52 font-semibold">音标</th>
                  <th className="py-2.5 px-4 font-semibold">中文核心释义</th>
                  <th className="py-2.5 px-4 w-44 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredList.map((item, idx) => {
                  const w = item.word

                  return (
                    <tr key={w.id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-4 font-bold text-white text-lg tracking-wide whitespace-nowrap">{w.name}</td>
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
                            title="从该词开始错词跟学练习"
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
                            onClick={() => handleDeleteError(w.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                            title="从错词本中移除该词"
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
