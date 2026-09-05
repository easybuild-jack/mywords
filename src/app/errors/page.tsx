'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Flame,
  CheckCircle,
  Volume2,
  ArrowRight,
  Play,
  Swords,
  Trash2,
  GraduationCap,
  PenLine,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { getActiveTroubleWords, removeErrorWord } from '@/db'
import { audioEngine } from '@/core/audioEngine'
import type { WordMasteryRecord, WordItem } from '@/types'

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages: (number | '...')[] = [1]
  if (currentPage > 3) {
    pages.push('...')
  }
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  if (currentPage < totalPages - 2) {
    pages.push('...')
  }
  pages.push(totalPages)
  return pages
}

export default function TroubleWordsPage() {
  const router = useRouter()
  const { startErrorPractice, startErrorLearnPractice } = useWorkspaceStore()
  const [troubleList, setTroubleList] = useState<{ word: WordItem; record: WordMasteryRecord }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'starred' | 'error' | 'severe'>('all')

  // 分页配置：每页 20 条
  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)

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

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE))
  const paginatedList = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // 避免删除或筛选导致当前页超出总页数
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages))
    }
  }, [totalPages, currentPage])

  const handleFilterChange = (type: 'all' | 'starred' | 'error' | 'severe') => {
    setFilterType(type)
    setCurrentPage(1)
  }

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
    <div className="flex-1 min-h-0 h-full flex flex-col p-6 md:p-8 max-w-6xl mx-auto w-full space-y-4 text-white overflow-hidden">
      {/* 1. 顶部标题与筛选 */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center border border-destructive/30">
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
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-destructive text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              全部待攻克 ({troubleList.length})
            </button>
            <button
              onClick={() => handleFilterChange('starred')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'starred'
                  ? 'bg-amber-500 text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ⭐ 生词 ({starredCount})
            </button>
            <button
              onClick={() => handleFilterChange('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'error'
                  ? 'bg-destructive text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              🔥 错词 ({errorCount})
            </button>
            <button
              onClick={() => handleFilterChange('severe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'severe'
                  ? 'bg-red-600 text-white'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              高危 (≥3次) ({severeCount})
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">
          正在检索本地生错词记录...
        </div>
      ) : troubleList.length === 0 ? (
        /* 暂无生错词时的空状态 */
        <div className="flex-1 flex items-center justify-center">
          <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-4 shadow-xl max-w-lg">
            <div className="size-16 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto">
              <CheckCircle className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">太棒了！当前没有待攻克的生错词 🎉</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
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
        </div>
      ) : (
        <>
          {/* 2. 攻坚统计总览卡片 */}
          <div className="glass-card p-4 md:p-5 rounded-2xl border border-destructive/30 bg-destructive/5 flex items-center justify-between shrink-0">
            <div className="space-y-1">
              <span className="text-xs text-destructive font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Swords className="size-3.5" />
                生错词攻克机制 (3-Streak Rule)
              </span>
              <h2 className="text-lg md:text-xl font-bold text-white">
                当前共有 <span className="text-destructive font-extrabold font-mono text-2xl">{filteredList.length}</span> 个生错词待彻底攻克
              </h2>
              <p className="text-xs text-[#9CA3AF]">
                消除规则：只要该单词在默写模式下连续正确 3 次，系统立即自动将其攻克消除并归档。
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStartPractice()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <GraduationCap className="size-4" />
                <span>生错词跟学练习</span>
              </button>
              <button
                onClick={() => handleStartAnnihilation()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Flame className="size-4" />
                <span>🚀 开启生错词默写</span>
              </button>
            </div>
          </div>

          {/* 3. 生错词详细明细表格及分页控制 */}
          <div className="flex-1 min-h-0 flex flex-col glass-card rounded-2xl border border-white/10 shadow-lg overflow-hidden">
            {/* 表格滚动容器：仅在此区域内产生纵向滚动条 */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#12141a]/95 backdrop-blur-md border-b border-white/10 text-muted-foreground font-mono text-xs">
                  <tr>
                    <th className="py-2.5 px-4 w-52 font-semibold">单词拼写与来源</th>
                    <th className="py-2.5 px-4 w-48 font-semibold">音标</th>
                    <th className="py-2.5 px-4 font-semibold">中文核心释义</th>
                    <th className="py-2.5 px-4 w-44 text-right font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {paginatedList.map((item, idx) => {
                    const globalIdx = (currentPage - 1) * PAGE_SIZE + idx
                    const w = item.word

                    return (
                      <tr key={w.id || globalIdx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base sm:text-lg tracking-wide">{w.name}</span>
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
                        <td className="py-2 px-4 text-gray-300 font-sans text-base sm:text-lg whitespace-nowrap">
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
                        <td className="py-2 px-4 text-white font-sans text-sm sm:text-base font-normal leading-snug">
                          {w.posList?.[0]?.pos && (
                            <span className="text-primary font-mono font-semibold mr-2 text-sm sm:text-base">
                              {w.posList[0].pos}
                            </span>
                          )}
                          <span>{w.posList?.[0]?.means?.join('； ')}</span>
                        </td>
                        <td className="py-2 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleStartPractice(filteredList.map((i) => i.word), globalIdx)}
                              className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                              title="从该词开始生错词跟学练习"
                            >
                              <GraduationCap className="size-3.5" />
                              <span>练习</span>
                            </button>
                            <button
                              onClick={() => handleStartAnnihilation(filteredList.map((i) => i.word), globalIdx)}
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

            {/* 底部紧凑分页栏 */}
            <div className="shrink-0 px-4 py-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>
                  第 <strong className="text-white font-mono">{currentPage}</strong> / <strong className="text-white font-mono">{totalPages}</strong> 页
                </span>
                <span className="text-white/20">|</span>
                <span>每页 <strong className="text-white font-mono">{PAGE_SIZE}</strong> 条</span>
                <span className="text-white/20">|</span>
                <span>共 <strong className="text-primary font-mono">{filteredList.length}</strong> 条待攻克</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-sans text-xs"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>上一页</span>
                </button>

                <div className="flex items-center gap-1 font-mono">
                  {getPageNumbers(currentPage, totalPages).map((pageNum, i) =>
                    pageNum === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground/60">...</span>
                    ) : (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum as number)}
                        className={`size-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-destructive text-white font-bold'
                            : 'hover:bg-white/[0.06] text-muted-foreground hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-sans text-xs"
                >
                  <span>下一页</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
