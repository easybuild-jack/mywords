'use client'

import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  BookOpen,
  Upload,
  Search,
  X,
  CheckCircle2,
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
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { BUILTIN_BOOKS } from '@/resources/books'
import { db, getBookUnitProgressRecords, reconcileUnitProgressRecord, getCustomBooks } from '@/db'
import { buildFixedUnitId, dictionaryLoader } from '@/core/dictionaryLoader'
import { startRouteProgressBar } from '@/components/layout/RouteProgressBar'
import type { DictUnit, UnitProgressRecord, VocabularyBook, PracticeMode } from '@/types'

interface BookTheme {
  icon: React.ComponentType<{ className?: string }>
  accentColor: string
  tag: string
  ribbonColor: string
}

function getBookTheme(bookId: string, isCustom?: boolean): BookTheme {
  if (isCustom) {
    if (bookId === 'book_custom_sample') {
      return {
        icon: Sparkles,
        accentColor: 'text-amber-400',
        tag: '示例词库',
        ribbonColor: 'bg-amber-400',
      }
    }
    return {
      icon: Sparkles,
      accentColor: 'text-fuchsia-400',
      tag: '专属定制',
      ribbonColor: 'bg-fuchsia-500',
    }
  }

  switch (bookId) {
    case 'book_basewords':
      return {
        icon: Compass,
        accentColor: 'text-emerald-400',
        tag: '核心打底',
        ribbonColor: 'bg-emerald-400',
      }
    case 'book_cet4':
      return {
        icon: GraduationCap,
        accentColor: 'text-amber-400',
        tag: '大学考级',
        ribbonColor: 'bg-amber-400',
      }
    case 'book_kaoyan':
      return {
        icon: Flame,
        accentColor: 'text-rose-400',
        tag: '考研攻坚',
        ribbonColor: 'bg-rose-500',
      }
    case 'book_ielts':
      return {
        icon: Globe,
        accentColor: 'text-sky-400',
        tag: '出国高阶',
        ribbonColor: 'bg-sky-400',
      }
    case 'book_coder':
      return {
        icon: Terminal,
        accentColor: 'text-violet-400',
        tag: '技术极客',
        ribbonColor: 'bg-violet-400',
      }
    default:
      return {
        icon: BookOpen,
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
    progressTitle = '音标练习进度'
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

  // 累计全书各单元进度与已学词量（即使单元处于进行中，也按已完成单词数如实计入全书总进度）
  let totalCompletedWords = 0
  let totalBookCapacity = 0
  let masteredUnitsCount = 0

  for (let index = 0; index < totalUnits; index++) {
    const unitMeta = activeUnits?.[index]
    const unitId = unitMeta?.id ?? buildFixedUnitId(activeBook.id, index)
    const progress = unitProgressById[unitId]
    const expectedCount =
      unitWordCountById[unitId] ??
      unitMeta?.wordCount ??
      Math.min(unitSize, Math.max(0, (activeBook?.totalWords || 0) - index * unitSize))

    totalBookCapacity += expectedCount

    if (progress?.status === 'completed') {
      masteredUnitsCount += 1
      totalCompletedWords += expectedCount
    } else if (progress?.completedWordIds?.length) {
      totalCompletedWords += Math.min(expectedCount, progress.completedWordIds.length)
    }
  }

  const effectiveTotalWords = totalBookCapacity > 0 ? totalBookCapacity : (activeBook?.totalWords || 1)
  const rawProgressPercent = totalCompletedWords > 0
    ? Math.min(100, (totalCompletedWords / effectiveTotalWords) * 100)
    : 0

  // 格式化总进度百分比显示：
  // 1. 如果完全未开始，显示 0%
  // 2. 如果已有练习数据但未满 1%，显示 1 位小数（如 0.3%），避免因四舍五入为 0% 导致用户感觉进度丢失
  // 3. 如果在 1% ~ 10% 之间，显示 1 位小数（如 4.6%），提供更灵敏的正向反馈
  // 4. 达到 10% 后，以整数显示（如 15%、80%、100%）
  let formattedProgressPercent: string
  if (totalCompletedWords === 0) {
    formattedProgressPercent = '0'
  } else if (rawProgressPercent < 1) {
    const dec = rawProgressPercent.toFixed(1)
    formattedProgressPercent = dec === '0.0' ? '0.1' : dec
  } else if (rawProgressPercent < 10) {
    formattedProgressPercent = rawProgressPercent.toFixed(1)
  } else {
    formattedProgressPercent = Math.min(100, Math.round(rawProgressPercent)).toString()
  }

  // SVG 进度环参数 (r=38, 周长约 238.76)
  const strokeRadius = 38
  const strokeCircumference = 2 * Math.PI * strokeRadius
  const ringProgressPercent = totalCompletedWords > 0
    ? Math.max(0.6, Math.min(100, rawProgressPercent))
    : 0
  const strokeDashoffset = strokeCircumference - (strokeCircumference * ringProgressPercent) / 100

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
      if (targetMode === 'learn') {
        useWorkspaceStore.getState().setShouldAutoStartLearn(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mywords_auto_start_learn', 'true')
        }
      } else if (targetMode === 'dictation') {
        useWorkspaceStore.getState().setShouldAutoStartDictation(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mywords_auto_start_dictation', 'true')
        }
      }
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

  const tabClass = (active: boolean) =>
    `relative -mb-px pb-2.5 text-sm transition-colors cursor-pointer border-b-2 ${
      active ? 'text-foreground font-medium border-primary' : 'text-muted-foreground hover:text-foreground border-transparent'
    }`
  const pagerButtonClass =
    'size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors cursor-pointer'

  return (
    <div className="w-full text-foreground min-h-full flex flex-col">
      {/* 顶部吸顶区域：标题、分类、搜索与当前词库概览 */}
      <div
        className={`sticky top-0 z-30 w-full bg-background border-b transition-colors duration-300 ${
          isScrolled ? 'border-border' : 'border-transparent'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10 pt-6 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border">
            <div className="flex items-end gap-8">
              <h1 className="text-xl font-semibold tracking-tight pb-2">词库</h1>
              <div className="flex items-center gap-6">
                <button type="button" onClick={() => handleTabChange('official')} className={tabClass(activeTab === 'official')}>
                  内置词库
                </button>
                <button type="button" onClick={() => handleTabChange('custom')} className={tabClass(activeTab === 'custom')}>
                  自定义词库
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pb-2">
              <div className="relative flex items-center">
                <Search className="size-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索词库"
                  className="h-8 pl-8 pr-8 rounded-md bg-white/[0.05] border border-transparent focus:border-border focus:bg-transparent text-[13px] text-white placeholder:text-muted-foreground/70 outline-none w-48 sm:w-64 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="清空搜索"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="h-8 px-3 rounded-md bg-primary hover:bg-primary/90 text-[#0B0C0E] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Upload className="size-3.5" />
                导入单词
              </button>
            </div>
          </div>

          {/* 当前浏览词库概览 */}
          <div className="pt-5 flex items-center justify-between gap-8">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-white tracking-tight">{activeBook?.name}</h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-3xl leading-relaxed line-clamp-2">
                {activeBook?.description}
              </p>
              <dl className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[13px]">
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">总词量</dt>
                  <dd className="font-mono text-foreground">{activeBook?.totalWords}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">已学</dt>
                  <dd className="font-mono text-primary">{totalCompletedWords}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">单元</dt>
                  <dd className="font-mono text-foreground">{totalUnits}</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">{activeUnits ? '平均每单元' : '每章'}</dt>
                  <dd className="font-mono text-foreground">
                    {activeUnits
                      ? Math.round((activeBook?.totalWords || 0) / Math.max(1, totalUnits))
                      : unitSize}{' '}
                    <span className="font-sans text-muted-foreground">词</span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* 全书进度环 */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="font-mono text-2xl text-foreground leading-none">{formattedProgressPercent}%</div>
                <div className="mt-1.5 text-xs text-muted-foreground">{progressTitle}</div>
              </div>
              <svg className="size-14 -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={strokeRadius}
                  fill="transparent"
                  strokeWidth="7"
                  className="progress-ring-track transition-colors duration-300"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={strokeRadius}
                  fill="transparent"
                  stroke="var(--primary)"
                  strokeWidth="7"
                  strokeDasharray={strokeCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-8 lg:px-10 pt-5 pb-12 space-y-10">
        {/* 单元网格（固定最小高度，切页或换书时不跳动） */}
        <section>
          <div className="flex items-center justify-between min-h-8 mb-3">
            <h3 className="text-sm font-medium text-foreground">
              {activeUnits ? '语义单元' : '章节单元'}
              <span className="ml-2 text-xs text-muted-foreground font-normal">共 {totalUnits} 个</span>
            </h3>

            {totalUnitPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setUnitPage((p) => Math.max(0, p - 1))}
                  disabled={unitPage === 0}
                  className={pagerButtonClass}
                  aria-label="上一页"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs font-mono text-muted-foreground tabular-nums px-1">
                  {unitPage + 1} / {totalUnitPages}
                </span>
                <button
                  type="button"
                  onClick={() => setUnitPage((p) => Math.min(totalUnitPages - 1, p + 1))}
                  disabled={unitPage === totalUnitPages - 1}
                  className={pagerButtonClass}
                  aria-label="下一页"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div
            className={`min-h-[352px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 content-start transition-opacity duration-200 ${
              isPreviewSwitching ? 'opacity-40' : 'opacity-100'
            }`}
          >
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
                  className={`relative h-[110px] p-3 rounded-lg border flex flex-col justify-between transition-colors ${
                    isLoadingThisUnit
                      ? 'border-primary bg-primary/[0.06] cursor-wait'
                      : isCurrent
                        ? 'border-accent/70 bg-accent/[0.05] cursor-pointer'
                        : 'border-border hover:border-foreground/25 hover:bg-muted/40 cursor-pointer'
                  } ${loadingUnitIndex !== null && !isLoadingThisUnit ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center justify-between gap-1 text-xs">
                    <span className={`font-mono ${isCurrent ? 'text-accent' : 'text-muted-foreground'}`}>
                      Unit {idx + 1}
                    </span>
                    {isLoadingThisUnit ? (
                      <span className="text-primary flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        载入中
                      </span>
                    ) : isMastered ? (
                      <span className="text-primary flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        已完成
                      </span>
                    ) : isCurrent || isStarted ? (
                      <span className="text-accent">进行中</span>
                    ) : (
                      <span className="text-muted-foreground/60">未开始</span>
                    )}
                  </div>

                  <p
                    className={`text-sm leading-snug line-clamp-2 ${
                      unitMeta ? 'font-medium text-white' : 'text-gray-300'
                    }`}
                    title={unitMeta?.name}
                  >
                    {unitMeta ? unitMeta.name : `第 ${idx + 1} 单元`}
                  </p>

                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-muted-foreground">
                        {unitMeta ? unitMeta.wordCount : unitSize} <span className="font-sans">词</span>
                      </span>
                      <span
                        className={
                          isMastered ? 'text-primary' : unitProgressPercent > 0 ? 'text-accent' : 'text-muted-foreground/60'
                        }
                      >
                        {unitProgressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1 progress-track rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMastered ? 'bg-primary' : unitProgressPercent > 0 ? 'bg-accent' : 'bg-transparent'
                        }`}
                        style={{ width: `${unitProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 词库书架 */}
        <section className="pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">
              {activeTab === 'official' ? '全部词库' : '我的自定义词库'}
              <span className="ml-2 text-xs text-muted-foreground font-normal">共 {filteredBooks.length} 本</span>
            </h3>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="py-14 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-center">
              <p className="text-sm text-white">{searchQuery ? '没有找到匹配的词库' : '还没有自定义词库'}</p>
              <p className="mt-1.5 text-[13px] text-muted-foreground max-w-sm">
                {searchQuery
                  ? '换个关键词试试，或者导入单词创建新的词库。'
                  : '导入单词文本或 CSV 文件，就能建立专属词库。'}
              </p>
              {!searchQuery && activeTab === 'custom' && (
                <button
                  type="button"
                  onClick={() => setImportModalOpen(true)}
                  className="mt-4 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-[#0B0C0E] text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="size-4" />
                  立即导入单词
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredBooks.map((b) => {
                const theme = getBookTheme(b.id, b.isCustom)
                const ThemeIcon = theme.icon
                const isSelected = activeBook?.id === b.id

                return (
                  <div
                    key={b.id}
                    onClick={() => handleSelectPreviewBook(b.id)}
                    className={`group relative h-[172px] rounded-lg border pl-5 pr-4 py-4 flex flex-col cursor-pointer select-none overflow-hidden transition-colors ${
                      isSelected ? 'border-primary/70 bg-primary/[0.04]' : 'border-border hover:border-foreground/25 hover:bg-muted/40'
                    }`}
                  >
                    {/* 书脊色条 */}
                    <span className={`absolute left-0 top-0 bottom-0 w-1 ${theme.ribbonColor} opacity-80`} />

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={`flex items-center gap-1.5 ${theme.accentColor}`}>
                        <ThemeIcon className="size-3.5" />
                        {theme.tag}
                      </span>
                      {isSelected && <span className="text-primary">正在浏览</span>}
                    </div>

                    <h4 className="mt-3 text-base font-semibold text-white line-clamp-1 group-hover:text-primary transition-colors">
                      {b.name}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{b.description}</p>

                    <div className="mt-auto pt-3 flex items-center justify-between text-xs">
                      <span className="font-mono text-gray-300">
                        {b.totalWords} <span className="font-sans text-muted-foreground">词</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {!isSelected && (
                          <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            切换 →
                          </span>
                        )}
                        {b.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setBookToDelete(b)
                            }}
                            className="ml-1 size-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="删除该词库"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 删除二次确认弹窗 */}
        {bookToDelete && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-xl bg-sidebar border border-border shadow-xl p-6 text-left animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-5 text-destructive shrink-0" />
                <h3 className="text-base font-semibold text-white">删除自定义词库</h3>
              </div>
              <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                确定要删除「<span className="text-white font-medium">{bookToDelete.name}</span>」吗？
              </p>
              <ul className="mt-3 space-y-1 text-[13px] text-muted-foreground leading-relaxed list-disc pl-5">
                <li>
                  其中的 <span className="font-mono text-foreground">{bookToDelete.totalWords}</span> 个单词将被永久清除
                </li>
                <li>对应单元的学习进度会一并删除</li>
                {currentBook?.id === bookToDelete.id && <li className="text-accent">当前正在学习该词库，删除后会切回默认内置词库</li>}
              </ul>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBookToDelete(null)}
                  disabled={isDeleting}
                  className="h-9 px-4 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="h-9 px-4 rounded-md bg-destructive hover:bg-destructive/90 text-white text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  {isDeleting ? '正在删除…' : '确认删除'}
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
