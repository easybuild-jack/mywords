'use client'

import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  Upload,
  Search,
  X,
  CheckCircle2,
  Play,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Loader2,
  Compass,
  GraduationCap,
  Flame,
  Globe,
  Terminal,
  Sparkles,
  Library,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { BUILTIN_BOOKS } from '@/resources/books'
import { db, getBookUnitProgressRecords, reconcileUnitProgressRecord, getCustomBooks } from '@/db'
import { buildFixedUnitId, dictionaryLoader } from '@/core/dictionaryLoader'
import { startRouteProgressBar } from '@/components/layout/RouteProgressBar'
import type { DictUnit, UnitProgressRecord, VocabularyBook, PracticeMode } from '@/types'

interface BookTheme {
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  accentColor: string
  tag: string
  ribbonColor: string
}

function getBookTheme(bookId: string, isCustom?: boolean): BookTheme {
  if (isCustom) {
    if (bookId === 'book_custom_sample') {
      return {
        icon: Sparkles,
        gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
        accentColor: 'text-amber-400',
        tag: '示例词库',
        ribbonColor: 'bg-amber-400',
      }
    }
    return {
      icon: Sparkles,
      gradient: 'from-fuchsia-500/20 via-pink-500/10 to-transparent',
      accentColor: 'text-fuchsia-400',
      tag: '专属定制',
      ribbonColor: 'bg-fuchsia-500',
    }
  }

  switch (bookId) {
    case 'book_basewords':
      return {
        icon: Compass,
        gradient: 'from-emerald-500/25 via-teal-500/10 to-transparent',
        accentColor: 'text-emerald-400',
        tag: '核心打底',
        ribbonColor: 'bg-emerald-400',
      }
    case 'book_cet4':
      return {
        icon: GraduationCap,
        gradient: 'from-amber-500/25 via-yellow-500/10 to-transparent',
        accentColor: 'text-amber-400',
        tag: '大学考级',
        ribbonColor: 'bg-amber-400',
      }
    case 'book_kaoyan':
      return {
        icon: Flame,
        gradient: 'from-rose-500/25 via-red-500/10 to-transparent',
        accentColor: 'text-rose-400',
        tag: '考研攻坚',
        ribbonColor: 'bg-rose-500',
      }
    case 'book_ielts':
      return {
        icon: Globe,
        gradient: 'from-sky-500/25 via-blue-500/10 to-transparent',
        accentColor: 'text-sky-400',
        tag: '出国高阶',
        ribbonColor: 'bg-sky-400',
      }
    case 'book_coder':
      return {
        icon: Terminal,
        gradient: 'from-violet-500/25 via-purple-500/10 to-transparent',
        accentColor: 'text-violet-400',
        tag: '技术极客',
        ribbonColor: 'bg-violet-400',
      }
    default:
      return {
        icon: BookOpen,
        gradient: 'from-primary/25 via-teal-500/10 to-transparent',
        accentColor: 'text-primary',
        tag: '精品词库',
        ribbonColor: 'bg-primary',
      }
  }
}

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
  const [loadingUnitIndex, setLoadingUnitIndex] = useState<number | null>(null)
  const [isPreviewSwitching, setIsPreviewSwitching] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // 监听主滚动容器，只有在向下滚动时才显现吸顶磨砂背景与极细分割线
  useEffect(() => {
    const mainEl = document.querySelector('main')
    const handleScroll = () => {
      const top = mainEl ? mainEl.scrollTop : window.scrollY
      setIsScrolled(top > 10)
    }

    handleScroll()
    mainEl?.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      mainEl?.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  /** 当前浏览词库的语义单元目录；为 null 表示该词库按固定词数切章 */
  const [unitCatalog, setUnitCatalog] = useState<{ bookId: string; units: DictUnit[] | null }>({
    bookId: '',
    units: null,
  })
  const [progressSnapshot, setProgressSnapshot] = useState<{
    key: string
    progressById: Record<string, UnitProgressRecord>
    wordCountById: Record<string, number>
  }>({ key: '', progressById: {}, wordCountById: {} })

  const loadBooks = useCallback(async () => {
    const updatedBuiltins = await Promise.all(
      BUILTIN_BOOKS.map(async (b) => {
        const actualTotal = await dictionaryLoader.getBookTotalWords(b.id)
        return { ...b, totalWords: actualTotal }
      })
    )
    const customOnly = await getCustomBooks()
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
  }, [])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // 当进入词库管理页或全局正在学习的词库就绪时，默认展示当前选中的词库
  useEffect(() => {
    if (currentBookId) {
      setPreviewBookId(currentBookId)
      const targetBook = allBooks.find((b) => b.id === currentBookId)
      if (targetBook?.isCustom) {
        setActiveTab('custom')
      }
    }
  }, [currentBookId, allBooks])

  // 切换内置 / 自定义词库 Tab 时，看板与单元联动切换至对应分类的词库
  const handleTabChange = (tab: 'official' | 'custom') => {
    setActiveTab(tab)
    if (tab === 'official') {
      if (activeBook?.isCustom) {
        const firstOfficial = allBooks.find((b) => !b.isCustom) || BUILTIN_BOOKS[0]
        setPreviewBookId(firstOfficial.id)
        setUnitPage(0)
      }
    } else {
      if (!activeBook?.isCustom) {
        const firstCustom = allBooks.find((b) => b.isCustom)
        if (firstCustom) {
          setPreviewBookId(firstCustom.id)
          setUnitPage(0)
        }
      }
    }
  }

  const filteredBooks = allBooks.filter((b) => {
    const matchesTab = activeTab === 'official' ? !b.isCustom : b.isCustom
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  // 当前正在浏览/查看的词库对象（优先使用 previewBookId）
  const activeBook = allBooks.find((b) => b.id === previewBookId) || currentBook || BUILTIN_BOOKS[0]
  const activeUnits = unitCatalog.bookId === activeBook.id ? unitCatalog.units : null
  const progressSnapshotKey = `${activeBook.id}|${progressMode}`
  const unitProgressById =
    progressSnapshot.key === progressSnapshotKey ? progressSnapshot.progressById : {}
  const unitWordCountById =
    progressSnapshot.key === progressSnapshotKey ? progressSnapshot.wordCountById : {}

  // 拉取当前浏览词库的语义单元目录（只有基础词汇这类按词义归类的词库才有）
  useEffect(() => {
    let cancelled = false
    dictionaryLoader
      .loadBookUnits(activeBook.id)
      .then((units) => {
        if (!cancelled) setUnitCatalog({ bookId: activeBook.id, units: units.length ? units : null })
      })
      .catch(() => {
        if (!cancelled) setUnitCatalog({ bookId: activeBook.id, units: null })
      })
    return () => {
      cancelled = true
    }
  }, [activeBook.id])

  useEffect(() => {
    let cancelled = false
    async function loadAccurateProgress() {
      const unitSize = activeBook.unitSize || 20
      const [records, builtinMembership] = await Promise.all([
        getBookUnitProgressRecords(activeBook.id, progressMode),
        activeBook.isCustom
          ? Promise.resolve<Record<string, string[]>>({})
          : dictionaryLoader.loadBookUnitWordIds(activeBook.id, unitSize),
      ])

      const membership = activeBook.isCustom
        ? Object.fromEntries(
            Array.from(
              { length: Math.ceil((activeBook.words?.length ?? 0) / unitSize) },
              (_, index) => [
                buildFixedUnitId(activeBook.id, index),
                (activeBook.words ?? []).slice(index * unitSize, (index + 1) * unitSize).map((word) => word.id),
              ]
            )
          )
        : builtinMembership

      const reconciled = await Promise.all(
        records.map((record) => {
          const currentWordIds = membership[record.unitId]
          return currentWordIds?.length
            ? reconcileUnitProgressRecord({
                bookId: activeBook.id,
                unitId: record.unitId,
                mode: progressMode,
                unitWordIds: currentWordIds,
              })
            : Promise.resolve(undefined)
        })
      )

      if (cancelled) return
      setProgressSnapshot({
        key: `${activeBook.id}|${progressMode}`,
        wordCountById: Object.fromEntries(
          Object.entries(membership).map(([unitId, wordIds]) => [unitId, wordIds.length])
        ),
        progressById: Object.fromEntries(
          reconciled
            .filter((record): record is UnitProgressRecord => Boolean(record))
            .map((record) => [record.unitId, record])
        ),
      })
    }
    loadAccurateProgress().catch(() => {
      if (!cancelled) {
        setProgressSnapshot({
          key: `${activeBook.id}|${progressMode}`,
          progressById: {},
          wordCountById: {},
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [activeBook.id, activeBook.isCustom, activeBook.totalWords, activeBook.unitSize, activeBook.words, progressMode])

  // 该词库在当前对应模式（学习 vs 默写）下的单元进度
  const rawModeUnit = getBookModeUnit(activeBook.id, progressMode)

  // 计算单元总数与分页：带语义单元目录的词库按目录长度算，其余按固定词数切章算
  const unitSize = activeBook?.unitSize || 20
  const totalUnits = activeUnits
    ? activeUnits.length
    : Math.max(1, Math.ceil((activeBook?.totalWords || 2600) / unitSize))

  // 旧进度是按「每 20 词一章」存下来的，换成语义单元后序号可能越界，越界就从第一个单元看起
  const activeModeUnit = rawModeUnit >= 0 && rawModeUnit < totalUnits ? rawModeUnit : 0
  const unitsPerPage = 18
  const totalUnitPages = Math.ceil(totalUnits / unitsPerPage)
  const currentUnits = Array.from(
    { length: Math.min(unitsPerPage, totalUnits - unitPage * unitsPerPage) },
    (_, i) => unitPage * unitsPerPage + i
  )

  // 完成度只认 unitProgress；当前浏览到第几个单元不代表前面的单元已经完成。
  const masteredUnits = Array.from({ length: totalUnits }, (_, index) => {
    const unitMeta = activeUnits?.[index]
    const unitId = unitMeta?.id ?? buildFixedUnitId(activeBook.id, index)
    const progress = unitProgressById[unitId]
    return progress?.status === 'completed'
  }).filter(Boolean).length
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
    if (loadingUnitIndex !== null) return
    setLoadingUnitIndex(idx)
    startRouteProgressBar()
    try {
      await commitBookAndUnit(activeBook.id, idx, targetMode)
      router.push(targetRoute)
    } catch (err) {
      console.error('Failed to select unit:', err)
      setLoadingUnitIndex(null)
    }
  }

  // 切换词库卡片：微动画平滑过渡预览词库
  const handleSelectPreviewBook = (bookId: string) => {
    if (bookId === previewBookId) return
    setIsPreviewSwitching(true)
    setPreviewBookId(bookId)
    const modeUnit = getBookModeUnit(bookId, progressMode)
    const targetPage = Math.floor(modeUnit / unitsPerPage)
    setUnitPage(targetPage)
    setTimeout(() => setIsPreviewSwitching(false), 200)
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
    <div className="w-full text-foreground min-h-full flex flex-col">
      {/* 顶部吸顶固定区域：操作栏 + 选中词库看板卡片 */}
      <div
        className={`sticky top-0 z-30 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-background/90 backdrop-blur-xl border-b border-border/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'
            : 'bg-transparent border-b border-transparent shadow-none'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10 pt-5 pb-4 space-y-3.5">
          {/* 1. 顶部操作栏 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Tab 切换 */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/[0.04] border border-white/10 shrink-0">
              <button
                onClick={() => handleTabChange('official')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'official'
                    ? 'bg-primary text-[#0B0C0E]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                内置词库
              </button>
              <button
                onClick={() => handleTabChange('custom')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'custom'
                    ? 'bg-primary text-[#0B0C0E]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                自定义词库
              </button>
            </div>

            {/* 搜索与导入按钮 */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative flex items-center">
                <Search className="size-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索词库..."
                  className="pl-9 pr-9 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-52 sm:w-72 md:w-88 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-0.5 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="清空搜索"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow transition-all whitespace-nowrap cursor-pointer"
              >
                <Upload className="size-4" />
                <span>+ 导入单词</span>
              </button>
            </div>
          </div>

          {/* 2. 当前选中词库看板大卡片 */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-white/10 flex items-center justify-between gap-6">
            <div className="space-y-2.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{activeBook?.name}</h2>
              <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-2xl lg:max-w-3xl leading-relaxed">{activeBook?.description}</p>

              <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1 font-mono text-sm sm:text-base">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-muted-foreground text-xs sm:text-sm font-sans">总词量：</span>
                  <span className="text-primary font-bold text-base sm:text-lg">{activeBook?.totalWords} 词</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-muted-foreground text-xs sm:text-sm font-sans">总单元：</span>
                  <span className="text-white font-bold text-base sm:text-lg">{totalUnits} 单元</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-muted-foreground text-xs sm:text-sm font-sans">{activeUnits ? '平均每单元：' : '单章容量：'}</span>
                  <span className="text-accent font-bold text-base sm:text-lg">
                    {activeUnits
                      ? `${Math.round((activeBook?.totalWords || 0) / Math.max(1, totalUnits))} 词`
                      : `${unitSize} 词/章`}
                  </span>
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
                  <p className="text-[11px] text-muted-foreground uppercase font-medium mt-1">{progressTitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主体滚动内容区 */}
      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-8 lg:px-10 pt-6 pb-12 space-y-7">
        {/* 3. 单元矩阵网格 (Unit Grid - 固定高度容器，防止切页或词书变化时高度跳动) */}
        <div className="space-y-3.5">
        <div className="flex items-center justify-between min-h-[32px]">
          <h3 className="text-sm sm:text-base font-bold uppercase text-muted-foreground tracking-wider font-mono">
            {activeUnits ? '语义单元列表' : '章节单元列表'} (第 {unitPage + 1}/{totalUnitPages} 页，共 {totalUnits} 单元)
          </h3>
          
          {/* 翻页控制器 */}
          {totalUnitPages > 1 && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setUnitPage((p) => Math.max(0, p - 1))}
                disabled={unitPage === 0}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-mono text-muted-foreground">
                {unitPage + 1} / {totalUnitPages}
              </span>
              <button
                onClick={() => setUnitPage((p) => Math.min(totalUnitPages - 1, p + 1))}
                disabled={unitPage === totalUnitPages - 1}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>

        <div className={`min-h-[400px] lg:h-[400px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 content-start overflow-y-auto pr-1 transition-all duration-200 ${
          isPreviewSwitching ? 'opacity-40 scale-[0.995]' : 'opacity-100 scale-100'
        }`}>
          {currentUnits.map((idx) => {
            const unitMeta = activeUnits?.[idx]
            const unitId = unitMeta?.id ?? buildFixedUnitId(activeBook.id, idx)
            const unitProgress = unitProgressById[unitId]
            const expectedCount =
              unitWordCountById[unitId] ??
              unitMeta?.wordCount ??
              Math.min(unitSize, activeBook.totalWords - idx * unitSize)
            const isMastered = unitProgress?.status === 'completed'
            const isStarted = unitProgress?.status === 'in_progress'
            const isCurrent = idx === activeModeUnit
            const isLoadingThisUnit = loadingUnitIndex === idx
            const unitProgressPercent = isMastered
              ? 100
              : unitProgress
                ? Math.min(99, Math.round((unitProgress.completedWordIds.length / Math.max(1, expectedCount)) * 100))
                : 0

            return (
              <div
                key={idx}
                onClick={() => handleSelectUnit(idx)}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col justify-between group h-[124px] ${
                  isLoadingThisUnit
                    ? 'border-primary bg-primary/20 ring-2 ring-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb)/0.3)] animate-pulse cursor-wait scale-[1.02]'
                    : isCurrent
                    ? 'border-accent bg-accent/[0.09] ring-1 ring-accent/70 cursor-pointer'
                    : isMastered
                    ? 'border-primary/30 bg-white/[0.025] hover:border-primary/60 hover:bg-white/[0.05] cursor-pointer'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] cursor-pointer'
                } ${loadingUnitIndex !== null && !isLoadingThisUnit ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {/* 顶部序号与状态标签 */}
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-mono text-xs sm:text-sm font-bold shrink-0 ${isLoadingThisUnit ? 'text-primary' : isCurrent ? 'text-accent' : 'text-[#9CA3AF]'}`}>
                    {unitMeta ? `UNIT ${idx + 1}` : `Unit ${idx + 1}`}
                  </span>
                  {isLoadingThisUnit ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/20 text-primary font-bold border border-primary/30 flex items-center gap-1 leading-none shrink-0">
                      <Loader2 className="size-3 animate-spin text-primary" />
                      准备中
                    </span>
                  ) : isMastered ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/15 text-primary font-bold border border-primary/25 flex items-center gap-1 leading-none shrink-0">
                      <CheckCircle2 className="size-3.5 text-primary" />
                      已完成
                    </span>
                  ) : isCurrent || isStarted ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/20 text-accent font-bold border border-accent/30 flex items-center gap-1 leading-none shrink-0">
                      进行中
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground/60 leading-none shrink-0">
                      未开始
                    </span>
                  )}
                </div>

                {/* 中部：语义单元名称（仅按词义归类的词库有） */}
                {unitMeta ? (
                  <p
                    className={`text-sm sm:text-[15px] font-bold leading-snug line-clamp-2 mt-1 ${
                      isLoadingThisUnit ? 'text-primary' : isCurrent ? 'text-accent' : 'text-white'
                    }`}
                    title={unitMeta.name}
                  >
                    {unitMeta.name}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-white/80 mt-1">
                    第 {idx + 1} 单元
                  </p>
                )}

                {/* 底部：词数、横条进度条与进度百分比 */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9CA3AF] text-xs sm:text-[13px] font-mono">
                      {unitMeta ? `${unitMeta.wordCount} 词` : `${unitSize} 词`}
                    </span>
                    
                    {isLoadingThisUnit ? (
                      <span className="text-xs font-bold text-primary flex items-center gap-1 leading-none">
                        <Loader2 className="size-3 animate-spin text-primary shrink-0" />
                        <span>载入中...</span>
                      </span>
                    ) : (
                      <span
                        className={`text-xs sm:text-sm font-extrabold font-mono leading-none ${
                          isMastered
                            ? 'text-primary'
                            : unitProgressPercent > 0
                            ? 'text-accent'
                            : 'text-muted-foreground/60'
                        }`}
                      >
                        {unitProgressPercent}%
                      </span>
                    )}
                  </div>

                  {/* 横条进度条 */}
                  <div className="w-full h-1.5 sm:h-2 bg-white/[0.08] rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMastered
                          ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb)/0.5)]'
                          : unitProgressPercent > 0
                          ? 'bg-accent shadow-[0_0_8px_rgba(254,188,46,0.4)]'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${unitProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. 精选词库书架 (立式精装书本封面造型，打破纯长方形单调视觉) */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="size-4 text-primary" />
            <h3 className="text-sm sm:text-base font-bold uppercase text-muted-foreground tracking-wider font-mono">
              {activeTab === 'official' ? '精品词库书架 (VOCABULARY BOOKSHELF)' : '我的自定义词库书架'}
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            共 {filteredBooks.length} 本词书
          </span>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-3 bg-white/[0.01]">
            <div className="size-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-muted-foreground">
              <BookOpen className="size-6 opacity-40" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-white">
                {searchQuery ? '未找到匹配的词库' : '暂无自定义词库'}
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery
                  ? '请尝试其他关键词搜索，或点击右上角导入新单词创建词库。'
                  : '您可以导入自定义单词文本或 CSV 文件，快速建立专属词库。'}
              </p>
            </div>
            {!searchQuery && activeTab === 'custom' && (
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow transition-all mt-1 cursor-pointer"
              >
                <Upload className="size-4" />
                <span>+ 立即导入单词</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredBooks.map((b) => {
              const theme = getBookTheme(b.id, b.isCustom)
              const ThemeIcon = theme.icon
              const isSelected = activeBook?.id === b.id

              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectPreviewBook(b.id)}
                  className={`group relative rounded-2xl border transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between overflow-hidden select-none p-5 h-[280px] transform-gpu hover:z-20 hover:scale-[1.04] hover:-translate-y-2 ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/40 bg-gradient-to-b ' +
                        theme.gradient +
                        ' shadow-[0_12px_32px_rgba(var(--primary-rgb)/0.25)] hover:shadow-[0_20px_45px_rgba(var(--primary-rgb)/0.35)]'
                      : 'border-white/10 bg-white/[0.025] hover:border-white/30 hover:bg-white/[0.06] hover:shadow-[0_20px_45px_rgba(0,0,0,0.5)]'
                  }`}
                >
                  {/* 书脊装订立体暗线与阴影 (Left book spine fold) */}
                  <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none border-r border-white/5" />
                  <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-white/[0.06] pointer-events-none" />

                  {/* 右侧立体书页切边层次 (Right paper edge texture) */}
                  <div className="absolute right-1 top-2 bottom-2 w-1 rounded-r border-r-2 border-white/10 bg-white/[0.02] pointer-events-none" />

                  {/* 顶部悬挂书签飘带 (Bookmark Ribbon) */}
                  <div className="absolute top-0 right-3.5 flex flex-col items-center pointer-events-none z-10">
                    <div
                      className={`w-3.5 h-6.5 ${theme.ribbonColor} shadow-md rounded-b-[2px] transition-all duration-300 group-hover:h-8`}
                    />
                    <div className="w-0 h-0 border-x-[7px] border-x-transparent border-t-[5px] border-t-black/20" />
                  </div>

                  {/* 1. 卡片顶部：分类标签与在学状态 (固定 h-7，标签稍微放大) */}
                  <div className="h-7 flex items-center justify-between pl-1.5 pr-6 shrink-0">
                    <span
                      className={`text-xs font-mono px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 ${theme.accentColor} font-bold flex items-center gap-1.5 leading-none shrink-0`}
                    >
                      <ThemeIcon className="size-3.5" />
                      {theme.tag}
                    </span>
                    {isSelected && (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(var(--primary-rgb)/0.4)] shrink-0">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                        在学
                      </span>
                    )}
                  </div>

                  {/* 2. 封面中心：固定各层高度，彻底杜绝不同简介行数导致的错位 */}
                  <div className="flex flex-col items-center text-center pl-1.5 my-auto">
                    {/* 固定图标槽位 */}
                    <div
                      className={`size-13 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center ${theme.accentColor} shadow-inner group-hover:scale-105 transition-transform duration-300 group-hover:shadow-[0_0_20px_currentColor] shrink-0`}
                    >
                      <ThemeIcon className="size-6.5" />
                    </div>

                    {/* 固定书名槽位 (h-7) */}
                    <div className="h-7 flex items-center justify-center w-full mt-2.5">
                      <h4 className="text-base sm:text-lg font-extrabold text-white group-hover:text-primary transition-colors line-clamp-1 tracking-tight text-center">
                        {b.name}
                      </h4>
                    </div>

                    {/* 固定简介槽位 (h-9: 无论单行或双行，垂直高度锁定相同) */}
                    <div className="h-9 flex items-center justify-center w-full mt-1">
                      <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed text-center px-1">
                        {b.description}
                      </p>
                    </div>
                  </div>

                  {/* 3. 卡片底部：词量标签与操作按钮 (固定 h-8) */}
                  <div className="h-8 pt-2.5 border-t border-white/[0.06] flex items-center justify-between pl-1.5 shrink-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-mono font-bold text-white tracking-tight">
                        {b.totalWords}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">词</span>
                    </div>

                    {b.isCustom ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-semibold transition-all flex items-center gap-0.5 ${
                            isSelected
                              ? 'text-primary font-bold'
                              : 'text-muted-foreground group-hover:text-white'
                          }`}
                        >
                          <span>{isSelected ? '正在浏览' : '切换'}</span>
                          {!isSelected && <span>→</span>}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBookToDelete(b)
                          }}
                          className="p-1 rounded text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                          title="删除该词库"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-mono font-semibold transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground group-hover:text-white group-hover:translate-x-0.5'
                        }`}
                      >
                        <span>{isSelected ? '正在浏览' : '切换'}</span>
                        <span>→</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. 删除二次确认弹窗 */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-[#12141a] border border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">确认删除自定义词库？</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  您即将删除词库 <span className="font-bold text-white">「{bookToDelete.name}」</span>。
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/[0.06] border border-rose-500/20 text-sm text-rose-300/90 leading-relaxed space-y-1.5">
              <p>• 该词库包含的 <strong className="text-rose-300 font-mono">{bookToDelete.totalWords}</strong> 个单词条目将被永久清除。</p>
              <p>• 对应章节的学习进度数据将被一并删除。</p>
              {currentBook?.id === bookToDelete.id && (
                <p className="text-accent">• 当前正在学习该词库，删除后将自动为您切回默认内置词库。</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>正在删除...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    <span>确认删除</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
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
