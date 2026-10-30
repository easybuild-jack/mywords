'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle,
  Volume2,
  ArrowRight,
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
import { startRouteProgressBar } from '@/components/layout/RouteProgressBar'
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
    startRouteProgressBar()
    useWorkspaceStore.getState().setShouldAutoStartLearn(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mywords_auto_start_learn', 'true')
    }
    startErrorLearnPractice(list, startIdx)
    router.push('/learn')
  }

  // 启动生错词攻坚默写
  const handleStartAnnihilation = (wordsToPractice?: WordItem[], startIdx: number = 0) => {
    const list = wordsToPractice || filteredList.map((item) => item.word)
    if (!list.length) return
    startRouteProgressBar()
    useWorkspaceStore.getState().setShouldAutoStartDictation(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mywords_auto_start_dictation', 'true')
    }
    startErrorPractice(list, startIdx)
    router.push('/dictation')
  }

  const filterTabs: { id: 'all' | 'starred' | 'error' | 'severe'; label: string; count: number }[] = [
    { id: 'all', label: '全部', count: troubleList.length },
    { id: 'starred', label: '生词', count: starredCount },
    { id: 'error', label: '错词', count: errorCount },
    { id: 'severe', label: '高频错误 ≥3 次', count: severeCount },
  ]
  const rowActionClass =
    'h-7 px-2 rounded-md inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer whitespace-nowrap'
  const pagerButtonClass =
    'h-7 px-2 rounded-md inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors cursor-pointer'

  return (
    <div className="flex-1 min-h-full flex flex-col px-6 md:px-8 lg:px-10 pt-6 pb-4 max-w-[1440px] mx-auto w-full text-white">
      {/* 标题、说明与批量练习入口 */}
      <div className="flex flex-wrap items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">生错词本</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            收藏的生词与拼写出错的单词汇集在这里；在默写中连续 3 次无提示拼对，就会自动归档
          </p>
        </div>

        {troubleList.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStartPractice()}
              className="h-9 px-3.5 rounded-md border border-border text-sm text-foreground hover:bg-muted inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <GraduationCap className="size-4" />
              跟学这些词
            </button>
            <button
              type="button"
              onClick={() => handleStartAnnihilation()}
              className="h-9 px-3.5 rounded-md bg-destructive hover:bg-destructive/90 text-white text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <PenLine className="size-4" />
              默写这些词
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">正在读取本地生错词记录…</div>
      ) : troubleList.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <CheckCircle className="size-8 text-primary mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-white">没有待攻克的生错词</h3>
            <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
              学习时加星的生词，以及默写出错或按 Tab 偷看过的单词，都会自动汇集到这里，方便集中练习。
            </p>
            <button
              type="button"
              onClick={() => {
                startRouteProgressBar()
                router.push('/learn')
              }}
              className="mt-5 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-[#0B0C0E] text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              继续学习单词
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 筛选标签（下划线指示） */}
          <div className="mt-4 flex items-center gap-6 border-b border-border shrink-0">
            {filterTabs.map((tab) => {
              const active = filterType === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterChange(tab.id)}
                  className={`-mb-px pb-2.5 text-sm border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'text-foreground font-medium border-destructive'
                      : 'text-muted-foreground hover:text-foreground border-transparent'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs font-mono text-muted-foreground">{tab.count}</span>
                </button>
              )
            })}
          </div>

          {/* 明细表：表头固定，表体独立滚动 */}
          <div className="flex-1 min-h-0 flex flex-col mt-1">
            <div className="shrink-0 border-b border-border text-xs text-muted-foreground select-none pr-1.5">
              <table className="w-full table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-56" />
                  <col className="w-48" />
                  <col />
                  <col className="w-52" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="py-2.5 pr-4 font-normal">单词</th>
                    <th className="py-2.5 px-4 font-normal">音标</th>
                    <th className="py-2.5 px-4 font-normal">释义</th>
                    <th className="py-2.5 pl-4 text-right font-normal">操作</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <table className="w-full table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-56" />
                  <col className="w-48" />
                  <col />
                  <col className="w-52" />
                </colgroup>
                <tbody>
                  {paginatedList.map((item, idx) => {
                    const globalIdx = (currentPage - 1) * PAGE_SIZE + idx
                    const w = item.word

                    return (
                      <tr key={w.id || globalIdx} className="group border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className="font-serif text-lg text-white">{w.name}</span>
                            {item.record.isStarred && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-400" title="生词">
                                <Star className="size-3 fill-current" />
                                生词
                              </span>
                            )}
                            {item.record.isError && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-destructive" title="错词">
                                <AlertCircle className="size-3" />
                                错词
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <span className="font-serif text-[15px] text-muted-foreground">{w.phoneticUs || '-'}</span>
                            <button
                              type="button"
                              onClick={() => audioEngine.playPronunciation(w.name)}
                              className="size-7 rounded-md inline-flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="发音"
                            >
                              <Volume2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-sm text-gray-200 leading-snug">
                          {w.posList?.[0]?.pos && w.posList[0].pos !== 'other' && (
                            <span className="font-serif italic text-muted-foreground mr-1.5">{w.posList[0].pos}</span>
                          )}
                          <span>{w.posList?.[0]?.means?.join('；')}</span>
                        </td>
                        <td className="py-2.5 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleStartPractice(filteredList.map((i) => i.word), globalIdx)}
                              className={rowActionClass}
                              title="从该词开始生错词跟学练习"
                            >
                              <GraduationCap className="size-3.5" />
                              跟学
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartAnnihilation(filteredList.map((i) => i.word), globalIdx)}
                              className={rowActionClass}
                              title="从该词开始专项默写"
                            >
                              <PenLine className="size-3.5" />
                              默写
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(w.id)}
                              className="size-7 rounded-md inline-flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="从生错词本中移除该词"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="shrink-0 pt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                共 <span className="font-mono text-foreground">{filteredList.length}</span> 个，每页 {PAGE_SIZE} 个
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className={pagerButtonClass}
                >
                  <ChevronLeft className="size-3.5" />
                  上一页
                </button>

                <div className="flex items-center gap-0.5 font-mono">
                  {getPageNumbers(currentPage, totalPages).map((pageNum, i) =>
                    pageNum === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground/60">…</span>
                    ) : (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum as number)}
                        className={`size-7 rounded-md text-xs transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-muted text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
                  className={pagerButtonClass}
                >
                  下一页
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
