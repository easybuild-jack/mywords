'use client'

import React, { useState } from 'react'
import {
  TENSES_DATA,
  TenseItem,
  TimeDimension,
  AspectDimension,
} from '@/resources/grammarData'
import {
  Clock,
  Sparkles,
  Volume2,
  AlertTriangle,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  GitCommit,
  CheckCircle2,
} from 'lucide-react'

interface TenseMatrixViewProps {
  searchQuery: string
}

export function TenseMatrixView({ searchQuery }: TenseMatrixViewProps) {
  const [onlyHighFrequency, setOnlyHighFrequency] = useState<boolean>(false)
  const [selectedTenseId, setSelectedTenseId] = useState<string>('present_perfect')

  const timeRows: { key: TimeDimension; labelZh: string; labelEn: string }[] = [
    { key: 'present', labelZh: '现在时', labelEn: 'Present' },
    { key: 'past', labelZh: '过去时', labelEn: 'Past' },
    { key: 'future', labelZh: '将来时', labelEn: 'Future' },
    { key: 'past_future', labelZh: '过去将来时', labelEn: 'Past Future' },
  ]

  const aspectCols: { key: AspectDimension; labelZh: string; labelEn: string }[] = [
    { key: 'simple', labelZh: '一般', labelEn: 'Simple' },
    { key: 'continuous', labelZh: '进行', labelEn: 'Continuous' },
    { key: 'perfect', labelZh: '完成', labelEn: 'Perfect' },
    { key: 'perfect_continuous', labelZh: '完成进行', labelEn: 'Perf Cont.' },
  ]

  // 选中的时态详情
  const selectedTense =
    TENSES_DATA.find((t) => t.id === selectedTenseId) || TENSES_DATA[2]

  // 语音播放
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  // 搜索高亮过滤
  const isMatchSearch = (item: TenseItem) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      item.nameEn.toLowerCase().includes(q) ||
      item.nameZh.includes(q) ||
      item.formula.toLowerCase().includes(q) ||
      item.coreConcept.toLowerCase().includes(q) ||
      item.signalWords.some((s) => s.toLowerCase().includes(q)) ||
      item.exampleSentence.en.toLowerCase().includes(q)
    )
  }

  return (
    <div className="space-y-8">
      {/* 模块导引 */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Module 03 · 时空罗盘与坐标
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              4 时间 × 4 动作体态 = 16 态
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            英语时态全景矩阵与时间轴：时空二维交汇的坐标系
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            所谓“时态”，就是“时间（Time: 过去、现在、将来）”与“体貌（Aspect: 一般、进行、完成、完成进行）”在平面直角坐标系上的交汇点。只要看清动作发生与关注的时空坐标，就不必死记规则。
          </p>
        </div>

        {/* 高频 8 态 vs 全部 16 态切换 */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setOnlyHighFrequency(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !onlyHighFrequency
                ? 'bg-primary text-[#0B0C0E] border border-primary font-semibold'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            16 时态全景表
          </button>
          <button
            onClick={() => setOnlyHighFrequency(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              onlyHighFrequency
                ? 'bg-primary text-[#0B0C0E] border border-primary font-semibold'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            日常核心高频 8 态
          </button>
        </div>
      </div>

      {/* 4x4 矩阵交互图谱 */}
      <div className="rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-xl overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-white/10 bg-black/40 text-xs font-mono">
              <th className="p-4 text-muted-foreground font-medium w-36">
                时间 \ 体貌 (Aspect)
              </th>
              {aspectCols.map((col) => (
                <th key={col.key} className="p-4 text-gray-300 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span>{col.labelZh}</span>
                    <span className="text-[10px] text-muted-foreground">({col.labelEn})</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {timeRows.map((row) => (
              <tr key={row.key} className="hover:bg-white/[0.01] transition-colors">
                <td className="p-4 font-semibold text-white bg-black/20 border-r border-white/5">
                  <div className="flex flex-col">
                    <span className="text-sm">{row.labelZh}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {row.labelEn}
                    </span>
                  </div>
                </td>
                {aspectCols.map((col) => {
                  const tense = TENSES_DATA.find(
                    (t) => t.time === row.key && t.aspect === col.key
                  )
                  if (!tense) return <td key={col.key} />

                  const isSelected = selectedTenseId === tense.id
                  const isDimmed = onlyHighFrequency && !tense.isHighFrequency
                  const isMatch = isMatchSearch(tense)

                  return (
                    <td
                      key={col.key}
                      onClick={() => setSelectedTenseId(tense.id)}
                      className={`p-3 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-amber-500/15 ring-1 ring-amber-500/40'
                          : 'hover:bg-white/[0.04]'
                      } ${isDimmed ? 'opacity-25 grayscale' : ''} ${
                        !isMatch ? 'opacity-20' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold text-xs ${
                              isSelected ? 'text-amber-300 font-bold' : 'text-white'
                            }`}
                          >
                            {tense.nameZh}
                          </span>
                          {tense.isHighFrequency && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              高频
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-amber-400/90 truncate">
                          {tense.formula}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[160px]">
                          {tense.exampleSentence.verbPart}
                        </p>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 选定时态深度研读舞台 (Detailed Stage + Interactive Timeline) */}
      <div className="rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-xl shadow-black/40">
        {/* 顶部标题与时态公式 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {selectedTense.timeZh} · {selectedTense.aspectZh}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedTense.nameEn}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {selectedTense.nameZh}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-black/40 border border-amber-500/30">
              <span className="text-[10px] uppercase text-muted-foreground block font-mono">
                结构公式 (Grammar Formula)
              </span>
              <span className="text-sm font-mono font-bold text-amber-300">
                {selectedTense.formula}
              </span>
            </div>
            <button
              onClick={() => speakText(selectedTense.exampleSentence.en)}
              className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
              title="朗读典范例句"
            >
              <Volume2 className="size-5" />
            </button>
          </div>
        </div>

        {/* 动态时间轴可视化模型 (Interactive Timeline Visualizer) */}
        <div className="rounded-2xl p-5 bg-black/50 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="size-3.5 text-amber-400" />
              时空坐标轴解构 (Spatiotemporal Coordinate)
            </span>
            <span className="text-xs font-mono text-amber-300">
              {selectedTense.timelineVisual.coordinateHint}
            </span>
          </div>

          {/* 时间轴图形化示意条 */}
          <div className="relative py-6 px-4">
            {/* 时间主轴线 */}
            <div className="h-1 w-full bg-white/10 rounded-full relative">
              {/* 过去刻度 */}
              <div className="absolute left-[15%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="size-3 rounded-full bg-gray-600 border border-white/20" />
                <span className="text-[10px] font-mono text-gray-500 mt-2">Past (过去)</span>
              </div>

              {/* 现在刻度 (NOW - 焦点中轴) */}
              <div className="absolute left-[50%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg shadow-primary/40 animate-pulse" />
                <span className="text-xs font-mono font-bold text-primary mt-2">NOW (现在)</span>
              </div>

              {/* 将来刻度 */}
              <div className="absolute left-[85%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="size-3 rounded-full bg-gray-600 border border-white/20" />
                <span className="text-[10px] font-mono text-gray-500 mt-2">Future (将来)</span>
              </div>

              {/* 动态时态覆盖指示条 */}
              {selectedTense.time === 'present' && selectedTense.aspect === 'simple' && (
                <div className="absolute left-[15%] right-[15%] -top-1 h-3 bg-gradient-to-r from-amber-500/20 via-amber-400/40 to-amber-500/20 rounded-full border border-amber-400/40" />
              )}
              {selectedTense.time === 'present' && selectedTense.aspect === 'continuous' && (
                <div className="absolute left-[44%] right-[44%] -top-1.5 h-4 bg-amber-400/40 rounded-full border-2 border-amber-300 shadow-md shadow-amber-400/30" />
              )}
              {selectedTense.time === 'present' && selectedTense.aspect === 'perfect' && (
                <div className="absolute left-[20%] w-[30%] -top-1 h-3 bg-gradient-to-r from-rose-500/40 to-amber-400 rounded-full border border-amber-400 shadow-lg shadow-amber-400/20" />
              )}
              {selectedTense.time === 'past' && selectedTense.aspect === 'simple' && (
                <div className="absolute left-[25%] -top-2 size-5 rounded-full bg-rose-500 border-2 border-white shadow-lg shadow-rose-500/40" />
              )}
              {selectedTense.time === 'past' && selectedTense.aspect === 'perfect' && (
                <div className="absolute left-[10%] w-[18%] -top-1 h-3 bg-rose-500/60 rounded-full border border-rose-400" />
              )}
              {selectedTense.time === 'future' && (
                <div className="absolute left-[65%] w-[25%] -top-1 h-3 bg-sky-500/40 rounded-full border border-sky-400" />
              )}
            </div>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed pt-2 border-t border-white/5">
            💡 <span className="font-semibold text-amber-300">认知内核：</span>
            {selectedTense.coreConcept}
          </p>
        </div>

        {/* 标志词与典范例句 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 典型时间状语标志词 */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              典型时间标志词 (Time Signals)
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedTense.signalWords.map((word, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-white/5 text-amber-300/90 text-xs font-mono border border-white/10"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* 典范例句 */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                典范语境例句 (Example Sentence)
              </span>
              <span className="text-[11px] font-mono text-primary">
                动词形式: {selectedTense.exampleSentence.verbPart}
              </span>
            </div>
            <p className="text-sm font-medium text-white">
              {selectedTense.exampleSentence.en}
            </p>
            <p className="text-xs text-gray-400 font-sans">
              {selectedTense.exampleSentence.zh}
            </p>
          </div>
        </div>

        {/* 经典混淆辨析擂台 (Contrast Trap) */}
        {selectedTense.contrastTrap && (
          <div className="rounded-xl p-4 bg-rose-500/[0.06] border border-rose-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-400" />
              <h4 className="text-xs font-bold text-rose-300 tracking-wide uppercase">
                经典辨析擂台：{selectedTense.nameZh} VS {selectedTense.contrastTrap.vsTenseName}
              </h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {selectedTense.contrastTrap.differenceZh}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-black/30 border border-white/10 space-y-1">
                <span className="text-[11px] font-mono font-bold text-amber-400 block">
                  {selectedTense.contrastTrap.examplePair.tenseA}
                </span>
                <p className="text-xs text-gray-200">
                  {selectedTense.contrastTrap.examplePair.sentenceA}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-white/10 space-y-1">
                <span className="text-[11px] font-mono font-bold text-rose-400 block">
                  {selectedTense.contrastTrap.examplePair.tenseB}
                </span>
                <p className="text-xs text-gray-200">
                  {selectedTense.contrastTrap.examplePair.sentenceB}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
