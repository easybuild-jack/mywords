'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Scissors, BookOpen, Sparkles, Check, RotateCcw, AlertCircle, Save, VolumeX } from 'lucide-react'
import type { WordItem, WordEtymology } from '@/types'
import { splitIntoSyllables, analyzeEtymology, resolveSyllables } from '@/lib/syllables'
import { splitIntoGraphemes, type GraphemeKind, type GraphemeSegment } from '@/lib/graphemes'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface EditWordSplitModalProps {
  isOpen: boolean
  onClose: () => void
  word: WordItem
}

/** 四类字母组合在界面上共用一套黄色 */
const COMBO_KINDS = new Set<GraphemeKind>([
  'vowel-team',
  'r-controlled',
  'consonant-digraph',
  'suffix-chunk',
])

const COMBO_TONES = ['text-accent', 'text-[#FDE68A]']

function isCombo(segment: GraphemeSegment | undefined): boolean {
  return segment !== undefined && COMBO_KINDS.has(segment.kind)
}

function comboToneIndex(segments: GraphemeSegment[], index: number): number {
  let run = 0
  for (let i = index - 1; i >= 0 && isCombo(segments[i]); i--) run++
  return run % COMBO_TONES.length
}

function segmentClass(segments: GraphemeSegment[], index: number): string | undefined {
  const segment = segments[index]
  if (segment?.kind === 'silent-e' || segment?.kind === 'silent') {
    return 'text-gray-400'
  }
  if (!isCombo(segment)) {
    return segment.kind === 'vowel' ? 'text-primary' : undefined
  }
  return COMBO_TONES[comboToneIndex(segments, index)]
}

/** 音节切分与哑音实时预览渲染 */
function SyllablePreview({
  wordName,
  syllables,
  silentIndices,
}: {
  wordName: string
  syllables: string[]
  silentIndices?: number[]
}) {
  const allSegments = splitIntoGraphemes(wordName, syllables, silentIndices)
  let currentOffset = 0
  const syllableGroups: GraphemeSegment[][] = []

  for (const syl of syllables) {
    const sylLen = syl.length
    let accumulated = 0
    const currentSylSegments: GraphemeSegment[] = []

    while (currentOffset < allSegments.length && accumulated < sylLen) {
      const seg = allSegments[currentOffset]
      currentSylSegments.push(seg)
      accumulated += seg.text.length
      currentOffset++
    }
    syllableGroups.push(currentSylSegments)
  }

  return (
    <div className="flex items-center justify-center flex-wrap gap-1.5 font-mono text-2xl sm:text-3xl font-bold tracking-wide py-2 select-none">
      {syllableGroups.map((group, sIdx) => (
        <React.Fragment key={sIdx}>
          {sIdx > 0 && (
            <span className="text-gray-500 font-normal px-0.5">·</span>
          )}
          <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 inline-flex items-center">
            {group.map((segment, index) => (
              <span key={index} className={segmentClass(group, index)}>
                {segment.text}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

/** 把切点集合转化为音节数组 */
function cutPointsToSyllables(wordName: string, cutPoints: Set<number>): string[] {
  const clean = wordName.trim()
  const sortedPoints = Array.from(cutPoints).filter((p) => p > 0 && p < clean.length).sort((a, b) => a - b)
  const bounds = [0, ...sortedPoints, clean.length]
  const syllables: string[] = []
  for (let i = 0; i < bounds.length - 1; i++) {
    syllables.push(clean.slice(bounds[i], bounds[i + 1]))
  }
  return syllables.filter(Boolean)
}

/** 把音节数组转化为切点集合 */
function syllablesToCutPoints(wordName: string, syllables: string[]): Set<number> {
  const clean = wordName.trim()
  const points = new Set<number>()
  if (!syllables.length || syllables.join('').toLowerCase() !== clean.toLowerCase()) {
    return points
  }
  let offset = 0
  for (let i = 0; i < syllables.length - 1; i++) {
    offset += syllables[i].length
    points.add(offset)
  }
  return points
}

/** 解析用户输入的拆分文本（支持 - · / 空格 等分隔符） */
function parseSyllableText(wordName: string, text: string): { syllables: string[]; isValid: boolean } {
  const cleanWord = wordName.trim().toLowerCase()
  const pieces = text
    .split(/[-·/\\,\s+]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (!pieces.length) {
    return { syllables: [cleanWord], isValid: true }
  }

  const joined = pieces.join('').toLowerCase()
  if (joined !== cleanWord) {
    return { syllables: pieces, isValid: false }
  }

  return { syllables: pieces, isValid: true }
}

export function EditWordSplitModal({ isOpen, onClose, word }: EditWordSplitModalProps) {
  const updateWordSplit = useWorkspaceStore((s) => s.updateWordSplit)
  const [activeTab, setActiveTab] = useState<'syllables' | 'etymology'>('syllables')

  // 音节拆分状态
  const [cutPoints, setCutPoints] = useState<Set<number>>(new Set())
  const [silentIndices, setSilentIndices] = useState<Set<number>>(new Set())
  const [textInput, setTextInput] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  // 构词词根词缀状态
  const [prefixForm, setPrefixForm] = useState(word.etymology?.prefix?.form || '')
  const [prefixMeaning, setPrefixMeaning] = useState(word.etymology?.prefix?.meaning || '')
  const [rootForm, setRootForm] = useState(word.etymology?.root?.form || '')
  const [rootMeaning, setRootMeaning] = useState(word.etymology?.root?.meaning || '')
  const [suffixForm, setSuffixForm] = useState(word.etymology?.suffix?.form || '')
  const [suffixMeaning, setSuffixMeaning] = useState(word.etymology?.suffix?.meaning || '')
  const [derivation, setDerivation] = useState(word.etymology?.derivation || '')
  const [memoryHook, setMemoryHook] = useState(word.etymology?.memoryHook || '')

  // 初始化状态（每次打开必重置为音节切分 Tab，不记忆上次选中的 Tab）
  useEffect(() => {
    if (isOpen && word) {
      setActiveTab('syllables')
      const syls = resolveSyllables(word)
      const points = syllablesToCutPoints(word.name, syls)
      setCutPoints(points)
      setSilentIndices(new Set(word.silentIndices || []))
      setTextInput(syls.join(' - '))
      setIsSaved(false)
      setSaveError('')

      // 构词同步
      setPrefixForm(word.etymology?.prefix?.form || '')
      setPrefixMeaning(word.etymology?.prefix?.meaning || '')
      setRootForm(word.etymology?.root?.form || '')
      setRootMeaning(word.etymology?.root?.meaning || '')
      setSuffixForm(word.etymology?.suffix?.form || '')
      setSuffixMeaning(word.etymology?.suffix?.meaning || '')
      setDerivation(word.etymology?.derivation || '')
      setMemoryHook(word.etymology?.memoryHook || '')
    }
  }, [isOpen, word])

  // 当前有效音节拆分结果
  const currentSyllables = useMemo(() => {
    return cutPointsToSyllables(word.name, cutPoints)
  }, [word.name, cutPoints])

  // 校验当前音节拆分
  const { isValid: isTextValid } = useMemo(() => {
    return parseSyllableText(word.name, textInput)
  }, [word.name, textInput])

  // 点击字母之间的切分点
  const handleToggleCutPoint = useCallback((index: number) => {
    setCutPoints((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      const nextSyllables = cutPointsToSyllables(word.name, next)
      setTextInput(nextSyllables.join(' - '))
      return next
    })
  }, [word.name])

  // 点击字母切换不发音/哑音状态
  const handleToggleSilentIndex = useCallback((index: number) => {
    setSilentIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  // 文本框输入更新
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTextInput(val)
    const { syllables, isValid } = parseSyllableText(word.name, val)
    if (isValid) {
      const nextPoints = syllablesToCutPoints(word.name, syllables)
      setCutPoints(nextPoints)
    }
  }

  // 恢复算法智能切分
  const handleResetToAlgorithm = () => {
    const algoSyllables = splitIntoSyllables(word.name)
    const points = syllablesToCutPoints(word.name, algoSyllables)
    setCutPoints(points)
    setSilentIndices(new Set())
    setTextInput(algoSyllables.join(' - '))
  }

  // 智能推导构词
  const handleAutoAnalyzeEtymology = () => {
    const autoEtymology = analyzeEtymology(word.name)
    if (autoEtymology.prefix) {
      setPrefixForm(autoEtymology.prefix.form)
      setPrefixMeaning(autoEtymology.prefix.meaning)
    }
    if (autoEtymology.root) {
      setRootForm(autoEtymology.root.form)
      setRootMeaning(autoEtymology.root.meaning)
    }
    if (autoEtymology.suffix) {
      setSuffixForm(autoEtymology.suffix.form)
      setSuffixMeaning(autoEtymology.suffix.meaning)
    }
    if (autoEtymology.derivation) {
      setDerivation(autoEtymology.derivation)
    }
  }

  // 保存修改
  const handleSave = useCallback(async () => {
    if (!currentSyllables.length || currentSyllables.join('').toLowerCase() !== word.name.trim().toLowerCase()) {
      setSaveError('音节拆分拼接后必须与单词原拼写完全一致')
      return
    }

    let etymology: WordEtymology | undefined
    const hasEtymologyContent =
      prefixForm.trim() ||
      rootForm.trim() ||
      suffixForm.trim() ||
      derivation.trim() ||
      memoryHook.trim()

    if (hasEtymologyContent) {
      etymology = {
        prefix: prefixForm.trim() ? { form: prefixForm.trim(), meaning: prefixMeaning.trim() } : undefined,
        root: rootForm.trim() ? { form: rootForm.trim(), meaning: rootMeaning.trim() } : undefined,
        suffix: suffixForm.trim() ? { form: suffixForm.trim(), meaning: suffixMeaning.trim() } : undefined,
        derivation: derivation.trim() || undefined,
        memoryHook: memoryHook.trim() || undefined,
      }
    }

    await updateWordSplit(word.id, {
      syllables: currentSyllables,
      etymology,
      silentIndices: silentIndices.size > 0 ? Array.from(silentIndices) : undefined,
    })

    setIsSaved(true)
    setTimeout(() => {
      setActiveTab('syllables')
      onClose()
    }, 400)
  }, [
    currentSyllables,
    word.name,
    word.id,
    prefixForm,
    prefixMeaning,
    rootForm,
    rootMeaning,
    suffixForm,
    suffixMeaning,
    derivation,
    memoryHook,
    updateWordSplit,
    silentIndices,
    onClose,
  ])

  // 弹窗内键盘快捷操作 (Esc 关闭，Enter / Ctrl+Enter 保存)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setActiveTab('syllables')
        onClose()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSave()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleSave])

  const handleClose = () => {
    setActiveTab('syllables')
    onClose()
  }

  if (!isOpen) return null

  const wordChars = word.name.split('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-[#131720] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶栏 Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Scissors className="size-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                修改单词切分与构词
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {word.name}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                自定义音节划分、不发音字母与构词词根 (支持 Enter / Esc 快捷操作)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 模式选项卡 Tab */}
        <div className="flex border-b border-white/10 bg-white/[0.01] px-6">
          <button
            type="button"
            onClick={() => setActiveTab('syllables')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'syllables'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Scissors className="size-4" />
            音节切分 & 不发音控制
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('etymology')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'etymology'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="size-4" />
            词根构词 (Morphemes)
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
          {activeTab === 'syllables' ? (
            <div className="space-y-5">
              {/* 实时切分渲染预览 */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
                <SyllablePreview
                  wordName={word.name}
                  syllables={currentSyllables}
                  silentIndices={Array.from(silentIndices)}
                />
              </div>

              {/* 交互式点选切分区域 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <Scissors className="size-3.5 text-primary" />
                    <span>音节划分（点击字母间的圆点切换切分）：</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetToAlgorithm}
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    恢复算法智能切分
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center flex-wrap gap-1">
                  {wordChars.map((char, index) => {
                    const isCutAfter = cutPoints.has(index + 1)
                    const isSilent = silentIndices.has(index)
                    const isLastChar = index === wordChars.length - 1

                    return (
                      <React.Fragment key={index}>
                        <div
                          className={`size-10 sm:size-11 rounded-xl border font-mono text-xl sm:text-2xl font-bold flex items-center justify-center transition-all select-none ${
                            isSilent
                              ? 'bg-gray-800/80 border-gray-600 text-gray-400 shadow-inner'
                              : 'bg-white/10 border-white/15 text-white shadow-sm'
                          }`}
                        >
                          {char}
                        </div>

                        {!isLastChar && (
                          <button
                            type="button"
                            onClick={() => handleToggleCutPoint(index + 1)}
                            className={`size-7 sm:size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer font-bold text-sm ${
                              isCutAfter
                                ? 'bg-primary text-black font-mono shadow-[0_0_10px_rgb(var(--primary-rgb)/0.4)] scale-110'
                                : 'bg-white/5 text-gray-500 hover:bg-white/15 hover:text-gray-300'
                            }`}
                            title={isCutAfter ? '点击取消该切分点' : '点击在此处切分'}
                          >
                            {isCutAfter ? '·' : '+'}
                          </button>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {/* 交互式不发音/哑音控制 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <VolumeX className="size-3.5 text-gray-400" />
                    <span>不发音/哑音控制（点击对应字母标记为灰化不发音）：</span>
                  </label>
                  {silentIndices.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSilentIndices(new Set())}
                      className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      清空哑音标记
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white/[0.025] border border-white/5 flex items-center justify-center flex-wrap gap-2">
                  {wordChars.map((char, index) => {
                    const isSilent = silentIndices.has(index)
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleToggleSilentIndex(index)}
                        className={`px-3 py-1.5 rounded-xl border font-mono text-sm sm:text-base font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSilent
                            ? 'border-gray-500 bg-gray-500/20 text-gray-300 shadow-[0_0_10px_rgba(156,163,175,0.2)]'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={isSilent ? '点击取消不发音标记' : '点击标记为不发音字母（灰化）'}
                      >
                        <span>{char}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-normal ${
                          isSilent ? 'bg-gray-400/20 text-gray-300 font-semibold' : 'text-gray-500'
                        }`}>
                          {isSilent ? '不发音' : '发音'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 文本输入框辅助 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span>直接输入拆分（支持 - · / 空格 分隔）：</span>
                  {!isTextValid && (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="size-3" /> 字母拼接与原词不一致
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={textInput}
                    onChange={handleTextInputChange}
                    placeholder="例如：dis-cov-er"
                    className={`w-full px-4 py-2.5 rounded-xl font-mono text-base bg-white/5 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                      isTextValid
                        ? 'border-white/10 focus:border-primary/60 focus:ring-primary/20'
                        : 'border-destructive/60 focus:border-destructive focus:ring-destructive/20'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <span className="text-xs font-semibold text-gray-300">
                  编辑前缀、词根与后缀信息
                </span>
                <button
                  type="button"
                  onClick={handleAutoAnalyzeEtymology}
                  className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="size-3" />
                  智能分析构词
                </button>
              </div>

              {/* 前缀 */}
              <div className="grid grid-cols-12 gap-2.5 items-center">
                <label className="col-span-3 text-xs font-medium text-gray-400">前缀 (Prefix)</label>
                <input
                  type="text"
                  placeholder="如 dis-"
                  value={prefixForm}
                  onChange={(e) => setPrefixForm(e.target.value)}
                  className="col-span-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
                <input
                  type="text"
                  placeholder="前缀释义 (如 否定/相反)"
                  value={prefixMeaning}
                  onChange={(e) => setPrefixMeaning(e.target.value)}
                  className="col-span-5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* 词根 */}
              <div className="grid grid-cols-12 gap-2.5 items-center">
                <label className="col-span-3 text-xs font-medium text-gray-400">词根 (Root)</label>
                <input
                  type="text"
                  placeholder="如 cover / spect"
                  value={rootForm}
                  onChange={(e) => setRootForm(e.target.value)}
                  className="col-span-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
                <input
                  type="text"
                  placeholder="词根释义 (如 覆盖/看)"
                  value={rootMeaning}
                  onChange={(e) => setRootMeaning(e.target.value)}
                  className="col-span-5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* 后缀 */}
              <div className="grid grid-cols-12 gap-2.5 items-center">
                <label className="col-span-3 text-xs font-medium text-gray-400">后缀 (Suffix)</label>
                <input
                  type="text"
                  placeholder="如 -y / -ive"
                  value={suffixForm}
                  onChange={(e) => setSuffixForm(e.target.value)}
                  className="col-span-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
                <input
                  type="text"
                  placeholder="后缀释义 (如 形容词后缀)"
                  value={suffixMeaning}
                  onChange={(e) => setSuffixMeaning(e.target.value)}
                  className="col-span-5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* 语义推导 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">构词语义推导 (Derivation)</label>
                <input
                  type="text"
                  placeholder="如 去除覆盖 → 发现、发掘"
                  value={derivation}
                  onChange={(e) => setDerivation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* 助记口诀 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">联想助记口诀 (Memory Hook)</label>
                <input
                  type="text"
                  placeholder="如 揭开盖子发现新大陆"
                  value={memoryHook}
                  onChange={(e) => setMemoryHook(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
        </div>

        {/* 底部按钮栏 Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="text-xs text-gray-500">
            修改将自动保存到本地数据库
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaved || !isTextValid}
              className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isSaved
                  ? 'bg-green-600 text-white shadow-[0_0_12px_rgba(22,163,74,0.4)]'
                  : !isTextValid
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-black hover:opacity-90 shadow-[0_0_16px_rgb(var(--primary-rgb)/0.3)]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="size-4" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  保存拆分与发音设置
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
