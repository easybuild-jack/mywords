'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Upload, Search, CheckCircle2, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { BUILTIN_BOOKS } from '@/resources/books'
import { db } from '@/db'
import type { VocabularyBook } from '@/types'

export default function BooksHubPage() {
  const router = useRouter()
  const {
    currentBook,
    currentUnitIndex,
    setBookId,
    setUnitIndex,
    setImportModalOpen,
  } = useWorkspaceStore()

  const [allBooks, setAllBooks] = useState<VocabularyBook[]>(BUILTIN_BOOKS)
  const [activeTab, setActiveTab] = useState<'official' | 'custom'>('official')
  const [searchQuery, setSearchQuery] = useState('')
  const [unitPage, setUnitPage] = useState(0)

  useEffect(() => {
    async function loadBooks() {
      const stored = await db.books.toArray()
      if (stored.length > 0) {
        setAllBooks(stored)
      }
    }
    loadBooks()
  }, [])

  const filteredBooks = allBooks.filter((b) => {
    const matchesTab = activeTab === 'official' ? !b.isCustom : b.isCustom
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  // 计算单元总数与分页
  const totalUnits = Math.max(1, Math.ceil((currentBook?.totalWords || 2600) / (currentBook?.unitSize || 20)))
  const unitsPerPage = 16
  const totalUnitPages = Math.ceil(totalUnits / unitsPerPage)
  const currentUnits = Array.from(
    { length: Math.min(unitsPerPage, totalUnits - unitPage * unitsPerPage) },
    (_, i) => unitPage * unitsPerPage + i
  )

  const handleSelectUnit = async (idx: number) => {
    await setUnitIndex(idx)
    router.push('/')
  }

  const handleSelectBook = async (bookId: string) => {
    await setBookId(bookId)
    setUnitPage(0)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 text-white overflow-y-auto">
      {/* 1. 顶部操作栏 */}
      <div className="flex items-center justify-between">
        {/* Tab 切换 */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            onClick={() => setActiveTab('official')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'official'
                ? 'bg-primary text-[#0B0C0E] shadow-[0_0_16px_rgba(0,255,136,0.3)]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            官方词库 (Official Books)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'custom'
                ? 'bg-primary text-[#0B0C0E] shadow-[0_0_16px_rgba(0,255,136,0.3)]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            自定义词库 (My Custom)
          </button>
        </div>

        {/* 搜索与导入按钮 */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索词库..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-56"
            />
          </div>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-[#0B0C0E] text-xs font-bold btn-neon-glow transition-all"
          >
            <Upload className="size-4" />
            <span>+ 导入单词</span>
          </button>
        </div>
      </div>

      {/* 2. 当前选中词库看板大卡片 */}
      <div className="glass-card p-7 rounded-3xl border border-white/10 flex items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-bold uppercase">
              当前在学词库
            </span>
            <span className="text-xs text-muted-foreground">{currentBook?.category}</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white">{currentBook?.name}</h2>
          <p className="text-xs text-[#9CA3AF] max-w-xl leading-relaxed">{currentBook?.description}</p>

          <div className="flex items-center gap-6 pt-2 font-mono text-xs">
            <div>
              <span className="text-muted-foreground">总词量：</span>
              <span className="text-primary font-bold">{currentBook?.totalWords} 词</span>
            </div>
            <div>
              <span className="text-muted-foreground">总单元：</span>
              <span className="text-white font-bold">{totalUnits} 单元</span>
            </div>
            <div>
              <span className="text-muted-foreground">单章容量：</span>
              <span className="text-accent font-bold">{currentBook?.unitSize || 20} 词/章</span>
            </div>
          </div>
        </div>

        {/* 右侧 45% 进度环 */}
        <div className="flex items-center gap-4">
          <div className="size-28 rounded-full border-4 border-white/10 border-t-primary border-r-primary flex items-center justify-center relative shadow-[0_0_24px_rgba(0,255,136,0.15)]">
            <div className="text-center">
              <span className="text-2xl font-extrabold font-mono text-primary">
                {Math.round(((currentUnitIndex + 1) / totalUnits) * 100)}%
              </span>
              <p className="text-[10px] text-muted-foreground uppercase">学习进度</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 单元矩阵网格 (Unit Grid - 20词/单元) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider font-mono">
            章节单元列表 (第 {unitPage + 1}/{totalUnitPages} 页，共 {totalUnits} 单元)
          </h3>
          
          {/* 翻页控制器 */}
          {totalUnitPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUnitPage((p) => Math.max(0, p - 1))}
                disabled={unitPage === 0}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-xs font-mono text-muted-foreground">
                {unitPage + 1} / {totalUnitPages}
              </span>
              <button
                onClick={() => setUnitPage((p) => Math.min(totalUnitPages - 1, p + 1))}
                disabled={unitPage === totalUnitPages - 1}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {currentUnits.map((idx) => {
            const isMastered = idx < currentUnitIndex
            const isCurrent = idx === currentUnitIndex

            return (
              <div
                key={idx}
                onClick={() => handleSelectUnit(idx)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  isCurrent
                    ? 'border-accent bg-accent/10 shadow-[0_0_24px_rgba(254,188,46,0.25)] ring-1 ring-accent'
                    : isMastered
                    ? 'border-primary/40 bg-white/[0.03] hover:border-primary'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-white">Unit {idx + 1}</span>
                  {isMastered && <CheckCircle2 className="size-4.5 text-primary" />}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#9CA3AF]">
                    <span>20 words</span>
                    {isCurrent && <span className="font-mono text-accent font-bold">在学中</span>}
                  </div>

                  {isCurrent ? (
                    <button className="w-full py-1.5 rounded-lg bg-primary text-[#0B0C0E] text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,255,136,0.3)]">
                      <Play className="size-3 fill-current" />
                      <span>Continue</span>
                    </button>
                  ) : isMastered ? (
                    <div className="text-[11px] font-mono text-primary font-semibold">Mastered 100%</div>
                  ) : (
                    <div className="text-[11px] font-mono text-muted-foreground">未开始</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. 可选其他词书列表 */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider font-mono">
          切换到其他词库 (Quick Switch)
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {filteredBooks.map((b) => (
            <div
              key={b.id}
              onClick={() => handleSelectBook(b.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                currentBook?.id === b.id
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{b.name}</span>
                <span className="text-xs font-mono text-primary">{b.totalWords} 词</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
