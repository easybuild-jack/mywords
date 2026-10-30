'use client'

import React, { useState, useEffect } from 'react'
import { SearchX, ChevronLeft, ChevronRight } from 'lucide-react'
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
    return Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1)
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

  const pagerButtonClass =
    'h-7 px-2 rounded-md inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors cursor-pointer'
  const colgroup = (
    <colgroup>
      <col className="w-[20%] min-w-[150px]" />
      <col className="w-[24%] min-w-[180px]" />
      <col className="w-[44%] min-w-[260px]" />
      <col className="w-[12%] min-w-[90px]" />
    </colgroup>
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full h-full max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10">
      {/* 表头固定在滚动区外，表体独立滚动 */}
      <div className="shrink-0 border-b border-border text-xs text-muted-foreground select-none pr-1.5">
        <table className="w-full table-fixed text-left border-collapse">
          {colgroup}
          <thead>
            <tr>
              <th className="py-2.5 pr-5 font-normal">形态与读音</th>
              <th className="py-2.5 px-5 font-normal">本义</th>
              <th className="py-2.5 px-5 font-normal">词源与构词</th>
              <th className="py-2.5 pl-5 text-right font-normal">操作</th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <table className="w-full table-fixed text-left border-collapse">
          {colgroup}
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-28 text-center">
                  <div className="max-w-md mx-auto select-none">
                    <SearchX className="size-6 mx-auto text-muted-foreground" />
                    <h4 className="mt-3 text-sm text-white">没有找到匹配的{tabLabel}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      与「<span className="font-serif text-foreground">{searchQuery}</span>」相关的{tabLabel}或释义都没有找到
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={onClearSearch}
                        className="mt-4 h-8 px-3 rounded-md text-xs text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        清空搜索条件
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, index) => {
                const globalIndex = (currentPage - 1) * PAGE_SIZE + index
                return (
                  <tr
                    key={item.id || `${item.form}-${globalIndex}`}
                    onClick={() => onViewDetail(globalIndex)}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 pr-5">
                      <div className="flex items-baseline gap-2.5 truncate">
                        <span className="font-serif text-lg xl:text-xl text-white group-hover:text-primary transition-colors">
                          {item.form}
                        </span>
                        {item.phonetic && (
                          <span className="font-serif text-[13px] text-muted-foreground truncate">{item.phonetic}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-5 text-sm text-gray-200 leading-snug">
                      <span className="line-clamp-2">{item.meaning}</span>
                    </td>

                    <td className="py-3 px-5 text-[13px] leading-snug">
                      <p className="line-clamp-2 text-gray-300">{item.origin}</p>
                      {item.derivationNote && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">→ {item.derivationNote}</p>
                      )}
                    </td>

                    <td className="py-3 pl-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewDetail(globalIndex)
                        }}
                        className="h-7 px-2 rounded-md inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title={`查看 ${item.form} 详情`}
                      >
                        查看
                        <ChevronRight className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 分页：位置固定在底部 */}
      <div className="shrink-0 pt-3 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <span>
          共 <span className="font-mono text-foreground">{items.length}</span> 条，每页 {PAGE_SIZE} 条
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || items.length === 0}
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
                  disabled={items.length === 0}
                  className={`size-7 rounded-md text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    currentPage === pageNum && items.length > 0
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
            disabled={currentPage >= totalPages || items.length === 0}
            className={pagerButtonClass}
          >
            下一页
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
