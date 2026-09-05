'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Upload, Search, X, CheckCircle2, Play, ChevronLeft, ChevronRight, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { BUILTIN_BOOKS } from '@/resources/books'
import { db } from '@/db'
import { dictionaryLoader } from '@/core/dictionaryLoader'
import type { VocabularyBook, PracticeMode } from '@/types'

function BooksHubContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from')

  // 根据来源页面判断：做题目标模式、跳转路由、以及词库页要展示哪种模式的单元进度
  // 规则：
  // 1. 默认或从 learn 来：展示学习进度，点击单元去 /learn
  // 2. 从 dictation 来：展示默写进度，点击单元去 /dictation
  // 3. 从 phonetic 来：展示学习进度（依用户明确要求），点击单元去 /phonetics
  let targetMode: PracticeMode = 'learn'
  let targetRoute = '/learn'
  let progressMode: PracticeMode = 'learn'
  let progressTitle = '学习进度'

  if (fromParam === 'dictation') {
    targetMode = 'dictation'
    targetRoute = '/dictation'
    progressMode = 'dictation'
    progressTitle = '默写进度'
  } else if (fromParam === 'phonetic' || fromParam === 'phonetics') {
    targetMode = 'phonetic'
    targetRoute = '/phonetics'
    progressMode = 'phonetic'
    progressTitle = '音标默写进度'
  }

  const {
    currentBook,
    currentBookId,
    getBookModeUnit,
    commitBookAndUnit,
    setImportModalOpen,
    deleteCustomBook,
  } = useWorkspaceStore()

  const [allBooks, setAllBooks] = useState<VocabularyBook[]>(BUILTIN_BOOKS)
  const [activeTab, setActiveTab] = useState<'official' | 'custom'>('official')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewBookId, setPreviewBookId] = useState<string>(currentBookId || BUILTIN_BOOKS[0].id)
  const [unitPage, setUnitPage] = useState(0)
  const [bookToDelete, setBookToDelete] = useState<VocabularyBook | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 当进入词库管理页或全局正在学习的词库就绪时，默认展示当前选中的词库
  useEffect(() => {
    if (currentBookId) {
      setPreviewBookId(currentBookId)
    }
  }, [currentBookId])

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

  // 当前正在浏览/查看的词库对象（优先使用 previewBookId）
  const activeBook = allBooks.find((b) => b.id === previewBookId) || currentBook || BUILTIN_BOOKS[0]

  // 该词库在当前对应模式（学习 vs 默写）下的单元进度
  const activeModeUnit = getBookModeUnit(activeBook.id, progressMode)

  // 计算单元总数与分页
  const unitSize = activeBook?.unitSize || 20
  const totalUnits = Math.max(1, Math.ceil((activeBook?.totalWords || 2600) / unitSize))
  const unitsPerPage = 24
  const totalUnitPages = Math.ceil(totalUnits / unitsPerPage)
  const currentUnits = Array.from(
    { length: Math.min(unitsPerPage, totalUnits - unitPage * unitsPerPage) },
    (_, i) => unitPage * unitsPerPage + i
  )

  // 进度百分比计算 (已完成单元比例)
  const masteredUnits = Math.min(totalUnits, activeModeUnit)
  const progressPercent = totalUnits > 0 ? Math.min(100, Math.max(0, Math.round((masteredUnits / totalUnits) * 100))) : 0

  // SVG 进度环参数 (r=38, 周长约 238.76)
  const strokeRadius = 38
  const strokeCircumference = 2 * Math.PI * strokeRadius
  const strokeDashoffset = strokeCircumference - (strokeCircumference * progressPercent) / 100

  // 当切换浏览词书或初始加载时，自动翻到该词库在当前模式下正在学的单元所在页
  useEffect(() => {
    if (activeModeUnit >= 0 && totalUnits > 0) {
      const targetPage = Math.floor(activeModeUnit / unitsPerPage)
      setUnitPage(targetPage)
    }
  }, [previewBookId, activeModeUnit, totalUnits])

  // 只有真正点击了某个具体的单元卡片，才将所选词库与单元生效并进入做题
  const handleSelectUnit = async (idx: number) => {
    await commitBookAndUnit(activeBook.id, idx, targetMode)
    router.push(targetRoute)
  }

  // 切换词库卡片：仅更新当前页面的预览词库，不修改正在做题的状态数据
  const handleSelectPreviewBook = (bookId: string) => {
    setPreviewBookId(bookId)
    const modeUnit = getBookModeUnit(bookId, progressMode)
    const targetPage = Math.floor(modeUnit / unitsPerPage)
    setUnitPage(targetPage)
  }

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return
    setIsDeleting(true)
    try {
      const targetId = bookToDelete.id
      const isDeletingPreview = activeBook?.id === targetId
      const success = await deleteCustomBook(targetId)
      if (success) {
        setAllBooks((prev) => prev.filter((b) => b.id !== targetId))
        setBookToDelete(null)
        if (isDeletingPreview) {
          setPreviewBookId(BUILTIN_BOOKS[0].id)
          setUnitPage(0)
        }
      }
    } catch (err) {
      console.error('Failed to delete book:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6 text-white">
      {/* 1. 顶部操作栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tab 切换 */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('official')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'official'
                ? 'bg-primary text-[#0B0C0E]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            官方词库
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'custom'
                ? 'bg-primary text-[#0B0C0E]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            自定义词库
          </button>
        </div>

        {/* 搜索与导入按钮 */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative flex items-center">
            <Search className="size-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索词库..."
              className="pl-8 pr-8 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-44 sm:w-64 md:w-80 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-0.5 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
                title="清空搜索"
              >
                <X className="size-3.5" />
              </button>
            )}
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{activeBook?.name}</h2>
          <p className="text-xs text-[#9CA3AF] max-w-xl leading-relaxed">{activeBook?.description}</p>

          <div className="flex items-center gap-6 pt-1 font-mono text-xs">
            <div>
              <span className="text-muted-foreground">总词量：</span>
              <span className="text-primary font-bold">{activeBook?.totalWords} 词</span>
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
                stroke="var(--primary)"
                strokeWidth="6"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-primary leading-none">
                {progressPercent}%
              </span>
              <p className="text-[10px] text-muted-foreground uppercase mt-1">{progressTitle}</p>
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
            const isMastered = idx < activeModeUnit
            const isCurrent = idx === activeModeUnit

            return (
              <div
                key={idx}
                onClick={() => handleSelectUnit(idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group min-h-[76px] ${
                  isCurrent
                    ? 'border-accent bg-accent/[0.09] ring-1 ring-accent/70'
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
                      进行中
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
                      进入
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

      {/* 4. 可选其他词书列表 (点击仅切换当前预览，不立刻改动全局做题数据) */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider font-mono">
          {activeTab === 'official' ? '切换到其他词库 (Quick Switch)' : '我的自定义词库列表'}
        </h3>

        {filteredBooks.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-3 bg-white/[0.01]">
            <div className="size-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-muted-foreground">
              <BookOpen className="size-6 opacity-40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {searchQuery ? '未找到匹配的词库' : '暂无自定义词库'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchQuery
                  ? '请尝试其他关键词搜索，或点击右上角导入新单词创建词库。'
                  : '您可以导入自定义单词文本或 CSV 文件，快速建立专属词库。'}
              </p>
            </div>
            {!searchQuery && activeTab === 'custom' && (
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-[#0B0C0E] text-xs font-bold btn-neon-glow transition-all mt-1 cursor-pointer"
              >
                <Upload className="size-3.5" />
                <span>+ 立即导入单词</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredBooks.map((b) => (
              <div
                key={b.id}
                onClick={() => handleSelectPreviewBook(b.id)}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  activeBook?.id === b.id
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white line-clamp-1">{b.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {b.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBookToDelete(b)
                          }}
                          className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 hover:text-rose-300 transition-all cursor-pointer"
                          title="删除该词库"
                        >
                          <Trash2 className="size-3" />
                          <span>删除</span>
                        </button>
                      )}
                      <span className="text-xs font-mono text-primary">{b.totalWords} 词</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. 删除二次确认弹窗 */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#12141a] border border-white/10 shadow-2xl p-6 space-y-5 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">确认删除自定义词库？</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  您即将删除词库 <span className="font-bold text-white">「{bookToDelete.name}」</span>。
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/[0.06] border border-rose-500/20 text-xs text-rose-300/90 leading-relaxed space-y-1">
              <p>• 该词库包含的 <strong className="text-rose-300 font-mono">{bookToDelete.totalWords}</strong> 个单词条目将被永久清除。</p>
              <p>• 对应章节的学习进度数据将被一并删除。</p>
              {currentBook?.id === bookToDelete.id && (
                <p className="text-accent">• 当前正在学习该词库，删除后将自动为您切回默认官方词库。</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>正在删除...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>确认删除</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BooksHubPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-mono text-sm">加载词库中...</div>}>
      <BooksHubContent />
    </Suspense>
  )
}
