'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Upload, Search, CheckCircle2, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { BUILTIN_BOOKS } from '@/resources/books'
import { db } from '@/db'
import { dictionaryLoader } from '@/core/dictionaryLoader'
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
      const updatedBuiltins = await Promise.all(
        BUILTIN_BOOKS.map(async (b) => {
          const actualTotal = await dictionaryLoader.getBookTotalWords(b.id)
          return { ...b, totalWords: actualTotal }
        })
      )
      // 过滤掉所有非用户自定义或与官方词库冲突的旧条目
      const customOnly = stored.filter((s) => s.isCustom && !updatedBuiltins.some((b) => b.id === s.id))
      const combined = [...updatedBuiltins, ...customOnly]
      setAllBooks(combined)

      // 同步更新当前在学词书的最新名称与词数
      const currentId = useWorkspaceStore.getState().currentBookId || useWorkspaceStore.getState().currentBook?.id
      if (currentId) {
        const found = combined.find((b) => b.id === currentId)
        if (found) {
          useWorkspaceStore.setState({ currentBook: found })
        }
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
  const unitSize = currentBook?.unitSize || 20
  const totalUnits = Math.max(1, Math.ceil((currentBook?.totalWords || 2600) / unitSize))
  const unitsPerPage = 24
  const totalUnitPages = Math.ceil(totalUnits / unitsPerPage)
  const currentUnits = Array.from(
    { length: Math.min(unitsPerPage, totalUnits - unitPage * unitsPerPage) },
    (_, i) => unitPage * unitsPerPage + i
  )

  // 学习进度百分比计算 (已完成单元比例)
  const masteredUnits = Math.min(totalUnits, currentUnitIndex)
  const progressPercent = totalUnits > 0 ? Math.min(100, Math.max(0, Math.round((masteredUnits / totalUnits) * 100))) : 0

  // SVG 进度环参数 (r=38, 周长约 238.76)
  const strokeRadius = 38
  const strokeCircumference = 2 * Math.PI * strokeRadius
  const strokeDashoffset = strokeCircumference - (strokeCircumference * progressPercent) / 100

  // 当切换词书或进入时，自动翻到当前正在学的单元所在页
  useEffect(() => {
    if (currentUnitIndex >= 0 && totalUnits > 0) {
      const targetPage = Math.floor(currentUnitIndex / unitsPerPage)
      setUnitPage(targetPage)
    }
  }, [currentBook?.id, currentUnitIndex, totalUnits])

  const handleSelectUnit = async (idx: number) => {
    await setUnitIndex(idx)
    // 选完单元先去学习页，检验记忆再由用户自己切到默写页
    router.push('/learn')
  }

  const handleSelectBook = async (bookId: string) => {
    await setBookId(bookId)
    setUnitPage(0)
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6 text-white">
      {/* 1. 顶部操作栏 */}
      <div className="flex items-center justify-between gap-3">
        {/* Tab 切换 */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('official')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'official'
                ? 'bg-primary text-[#0B0C0E] shadow-[0_0_16px_rgba(0,255,136,0.3)]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            官方词库
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'custom'
                ? 'bg-primary text-[#0B0C0E] shadow-[0_0_16px_rgba(0,255,136,0.3)]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            自定义词库
          </button>
        </div>

        {/* 搜索与导入按钮 */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索词库..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-36 sm:w-48"
            />
          </div>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-[#0B0C0E] text-xs font-bold btn-neon-glow transition-all whitespace-nowrap"
          >
            <Upload className="size-3.5" />
            <span>+ 导入单词</span>
          </button>
        </div>
      </div>

      {/* 2. 当前选中词库看板大卡片 */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-bold uppercase">
              当前在学词库
            </span>
            <span className="text-xs text-muted-foreground">{currentBook?.category}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{currentBook?.name}</h2>
          <p className="text-xs text-[#9CA3AF] max-w-xl leading-relaxed">{currentBook?.description}</p>

          <div className="flex items-center gap-6 pt-1 font-mono text-xs">
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
              <span className="text-accent font-bold">{unitSize} 词/章</span>
            </div>
          </div>
        </div>

        {/* 右侧动态真实进度环 */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative size-24 sm:size-28 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 96 96">
              {/* 背景底环 */}
              <circle
                cx="48"
                cy="48"
                r={strokeRadius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="6"
              />
              {/* 真实动态进度环 */}
              <circle
                cx="48"
                cy="48"
                r={strokeRadius}
                fill="transparent"
                stroke="#34D399"
                strokeWidth="6"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{
                  filter: progressPercent > 0 ? 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.5))' : 'none'
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-primary leading-none">
                {progressPercent}%
              </span>
              <p className="text-[10px] text-muted-foreground uppercase mt-1">学习进度</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 单元矩阵网格 (Unit Grid - 紧凑型卡片设计) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider font-mono">
            章节单元列表 (第 {unitPage + 1}/{totalUnitPages} 页，共 {totalUnits} 单元)
          </h3>
          
          {/* 翻页控制器 */}
          {totalUnitPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUnitPage((p) => Math.max(0, p - 1))}
                disabled={unitPage === 0}
                className="p-1 rounded-lg border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="text-xs font-mono text-muted-foreground">
                {unitPage + 1} / {totalUnitPages}
              </span>
              <button
                onClick={() => setUnitPage((p) => Math.min(totalUnitPages - 1, p + 1))}
                disabled={unitPage === totalUnitPages - 1}
                className="p-1 rounded-lg border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {currentUnits.map((idx) => {
            const isMastered = idx < currentUnitIndex
            const isCurrent = idx === currentUnitIndex

            return (
              <div
                key={idx}
                onClick={() => handleSelectUnit(idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group min-h-[76px] ${
                  isCurrent
                    ? 'border-accent bg-accent/[0.09] shadow-[0_0_18px_rgba(254,188,46,0.2)] ring-1 ring-accent/70'
                    : isMastered
                    ? 'border-primary/30 bg-white/[0.025] hover:border-primary/60 hover:bg-white/[0.05]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                {/* 顶部标题与状态标签 */}
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-bold text-sm ${isCurrent ? 'text-accent' : 'text-white'}`}>
                    Unit {idx + 1}
                  </span>
                  {isCurrent ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold border border-accent/30 flex items-center gap-1 leading-none">
                      在学中
                    </span>
                  ) : isMastered ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold border border-primary/25 flex items-center gap-1 leading-none">
                      <CheckCircle2 className="size-3 text-primary" />
                      已完成
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground/60 leading-none">
                      未开始
                    </span>
                  )}
                </div>

                {/* 底部词数与操作提示 */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#9CA3AF] text-[11px] font-mono">
                    {unitSize} 词
                  </span>
                  
                  {isCurrent ? (
                    <span className="text-[11px] font-bold text-accent flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <Play className="size-2.5 fill-current" />
                      继续
                    </span>
                  ) : isMastered ? (
                    <span className="text-[10px] font-mono text-primary/80 font-semibold">
                      100%
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors">
                      进入 →
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. 可选其他词书列表 */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider font-mono">
          切换到其他词库 (Quick Switch)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredBooks.map((b) => (
            <div
              key={b.id}
              onClick={() => handleSelectBook(b.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                currentBook?.id === b.id
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm text-white">{b.name}</span>
                <span className="text-xs font-mono text-primary">{b.totalWords} 词</span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
