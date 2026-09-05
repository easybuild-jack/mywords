'use client'

import React, { useState, useEffect } from 'react'
import { Eye, SearchX, ChevronLeft, ChevronRight } from 'lucide-react'
import type { RootItem } from '@/types'

interface RootsTableViewProps {
  items: RootItem[]
  tabLabel: string
  searchQuery: string
  onViewDetail: (index: number) => void
  onClearSearch: () => void
}

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

export function RootsTableView({
  items,
  tabLabel,
  searchQuery,
  onViewDetail,
  onClearSearch,
}: RootsTableViewProps) {
  // 分页设置：每页 20 条
  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)

  // 搜索词或 Tab 切换时自动重置回第 1 页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, tabLabel])

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages))
    }
  }, [totalPages, currentPage])

  const paginatedItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  if (items.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-2 sm:px-4">
        <div className="glass-card rounded-2xl xl:rounded-3xl border border-white/10 p-10 xl:p-14 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="size-16 xl:size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
            <SearchX className="size-8 xl:size-10 text-gray-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl xl:text-2xl font-bold text-white">未找到匹配的{tabLabel}</h3>
            <p className="text-sm xl:text-base text-gray-400 max-w-md">
              未找到与 “<span className="text-primary font-mono font-bold">{searchQuery}</span>” 相关的{tabLabel}或释义
            </p>
          </div>
          <button
            type="button"
            onClick={onClearSearch}
            className="px-5 py-2.5 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-sm font-bold transition-all cursor-pointer"
          >
            清空搜索条件
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-2 sm:px-4">
      {/* 现代化半透明毛玻璃大卡片容器：自适应宽幅展开 */}
      <div className="flex-1 min-h-0 flex flex-col w-full glass-card rounded-2xl xl:rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300">
        {/* 滚动表格区域：紧凑行内间距 */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            {/* 紧凑精致毛玻璃表头 */}
            <thead className="sticky top-0 z-10 bg-[#12141a]/95 backdrop-blur-xl border-b border-white/10 text-xs font-semibold text-gray-300 select-none shadow-sm">
              <tr>
                <th className="py-2.5 px-5 sm:px-6 w-52 sm:w-60 xl:w-68">
                  <div className="flex items-center gap-2 text-gray-200 tracking-wide font-medium">
                    <span className="size-2 rounded-full bg-primary" />
                    <span>形态与读音</span>
                  </div>
                </th>
                <th className="py-2.5 px-5 sm:px-6 w-56 sm:w-64 xl:w-76">
                  <div className="flex items-center gap-2 text-gray-200 tracking-wide font-medium">
                    <span className="size-2 rounded-full bg-accent" />
                    <span>核心本义</span>
                  </div>
                </th>
                <th className="py-2.5 px-5 sm:px-6">
                  <div className="flex items-center gap-2 text-gray-200 tracking-wide font-medium">
                    <span className="size-2 rounded-full bg-amber-400" />
                    <span>词源溯源与构词逻辑</span>
                  </div>
                </th>
                <th className="py-2.5 px-5 sm:px-6 w-28 text-right">
                  <span className="text-gray-400 font-medium tracking-wide">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] font-sans">
              {paginatedItems.map((item, index) => {
                const globalIndex = (currentPage - 1) * PAGE_SIZE + index
                return (
                  <tr
                    key={item.id || globalIndex}
                    onClick={() => onViewDetail(globalIndex)}
                    className="hover:bg-white/[0.035] transition-all duration-150 cursor-pointer group"
                  >
                    {/* 1. 形态与音标 (行内间距调紧为 py-2.5) */}
                    <td className="py-2.5 px-5 sm:px-6 whitespace-nowrap">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono text-base xl:text-lg font-bold text-white group-hover:text-primary transition-colors tracking-wide">
                          {item.form}
                        </span>
                        {item.phonetic && (
                          <span className="font-mono text-xs text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/5">
                            {item.phonetic}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. 核心本义 */}
                    <td className="py-2.5 px-5 sm:px-6 text-sm sm:text-[15px] font-semibold text-accent leading-snug">
                      {item.meaning}
                    </td>

                    {/* 3. 词源出处 */}
                    <td className="py-2.5 px-5 sm:px-6 text-xs sm:text-sm text-gray-300 leading-snug">
                      <p className="line-clamp-2 text-gray-300 group-hover:text-gray-100 transition-colors">
                        {item.origin}
                      </p>
                      {item.derivationNote && (
                        <p className="text-primary/80 font-medium text-xs mt-0.5 line-clamp-1">
                          → {item.derivationNote}
                        </p>
                      )}
                    </td>

                    {/* 4. 右侧操作栏：查看按钮 */}
                    <td className="py-2.5 px-5 sm:px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewDetail(globalIndex)
                        }}
                        className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(var(--primary-rgb)/0.12)] hover:scale-105 active:scale-95"
                        title={`查看 ${item.form} 详情卡片`}
                      >
                        <Eye className="size-3.5" />
                        <span>查看</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 底部紧凑分页控制栏 (每页 20 条) */}
        <div className="shrink-0 px-5 sm:px-6 py-2 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>
              第 <strong className="text-white font-mono">{currentPage}</strong> / <strong className="text-white font-mono">{totalPages}</strong> 页
            </span>
            <span className="text-white/20">|</span>
            <span>每页 <strong className="text-white font-mono">{PAGE_SIZE}</strong> 条</span>
            <span className="text-white/20">|</span>
            <span>共 <strong className="text-primary font-mono">{items.length}</strong> 条{tabLabel}</span>
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
                        ? 'bg-primary text-[#0B0C0E] shadow-[0_0_10px_rgb(var(--primary-rgb)/0.3)] font-bold'
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
    </div>
  )
}
