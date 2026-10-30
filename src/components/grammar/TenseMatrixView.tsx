'use client'

import React, { useState } from 'react'
import { TENSES_DATA, TimeDimension, AspectDimension } from '@/resources/grammarData'
import {
  Clock,
  Volume2,
  AlertTriangle,
} from 'lucide-react'

/** 辅助函数：将例句中的核心动词形式高亮，样式与词性/句型页保持一致 */
function renderSentenceWithVerbHighlight(sentence: string, verbPart?: string) {
  if (!verbPart) {
    return <span>{sentence}</span>
  }
  const escaped = verbPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = sentence.split(regex)

  return (
    <span>
      {parts.map((part, idx) => {
        if (part.toLowerCase() === verbPart.toLowerCase()) {
          return (
            <span key={idx} className="grammar-keyword font-medium">
              {part}
            </span>
          )
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>
      })}
    </span>
  )
}

export function TenseMatrixView() {
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

  return (
    <div className="space-y-6">
      {/* 模块导引 */}
      <div className="pb-6 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Module 04 · 时空坐标与矩阵
            </span>
            <span className="text-xs text-muted-foreground">
              4 时间 × 4 动作体态 = 16 态
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            英语时态全景矩阵与时间轴：时空二维交汇的坐标系
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            所谓“时态”，就是“时间（Time: 过去、现在、将来）”与“体貌（Aspect: 一般、进行、完成、完成进行）”在平面直角坐标系上的交汇点。只要看清动作发生与关注的时空坐标，就不必死记规则。
          </p>
        </div>

        {/* 高频 8 态 vs 全部 16 态切换 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setOnlyHighFrequency(false)}
            className={`h-8 px-3 rounded-md text-sm transition-colors cursor-pointer cursor-pointer ${
              !onlyHighFrequency
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            16 时态全景表
          </button>
          <button
            onClick={() => setOnlyHighFrequency(true)}
            className={`h-8 px-3 rounded-md text-sm transition-colors cursor-pointer cursor-pointer ${
              onlyHighFrequency
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            日常核心高频 8 态
          </button>
        </div>
      </div>

      {/* 4x4 矩阵交互图谱 */}
      <div className="border-y border-border overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[840px]">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-muted-foreground font-medium w-40 text-sm">
                时间 \ 体貌 <span className="text-xs font-mono font-normal opacity-80">(Aspect)</span>
              </th>
              {aspectCols.map((col) => (
                <th key={col.key} className="p-4 text-foreground font-semibold text-sm">
                  <div className="flex items-baseline gap-1.5">
                    <span>{col.labelZh}</span>
                    <span className="text-xs font-mono text-muted-foreground font-normal">
                      ({col.labelEn})
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {timeRows.map((row) => (
              <tr key={row.key}>
                <td className="p-4 font-semibold text-foreground border-r border-border">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{row.labelZh}</span>
                    <span className="text-xs text-muted-foreground font-mono mt-0.5">
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

                  return (
                    <td
                      key={col.key}
                      onClick={() => setSelectedTenseId(tense.id)}
                      className={`p-3.5 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-primary/[0.08] shadow-[inset_0_-2px_0_var(--primary)]'
                          : 'hover:bg-muted/40'
                      } ${isDimmed ? 'opacity-25 grayscale' : ''}`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-sm ${
                              isSelected ? 'text-primary font-bold' : 'text-foreground font-semibold'
                            }`}
                          >
                            {tense.nameZh}
                          </span>
                          {tense.isHighFrequency && (
                            <span className="text-[11px] text-primary font-sans">
                              高频
                            </span>
                          )}
                        </div>
                        <p className={`font-mono text-sm leading-normal ${
                          isSelected ? 'text-primary/95 font-medium' : 'text-foreground/80'
                        }`}>
                          {tense.formula}
                        </p>
                        <p className="text-sm font-mono text-muted-foreground/85 truncate">
                          {tense.examples[0]?.verbPart}
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

      {/* 选定时态深度研读舞台 */}
      <div className="border-t border-border pt-6 space-y-6">
        {/* 顶部标题与时态公式 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {selectedTense.timeZh} · {selectedTense.aspectZh}
              </span>
              <span className="text-sm text-muted-foreground font-mono">
                {selectedTense.nameEn}
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-foreground tracking-tight">
              {selectedTense.nameZh}
            </h3>
          </div>

          <div className="px-4 py-2 rounded-md border border-border">
            <span className="text-xs text-muted-foreground block">
              结构公式 (Grammar Formula)
            </span>
            <span className="text-base font-mono font-bold text-primary">
              {selectedTense.formula}
            </span>
          </div>
        </div>

        {/* 动态时间轴可视化模型 */}
        <div className="rounded-lg p-5 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              时空坐标轴解构 (Spatiotemporal Coordinate)
            </span>
            <span className="text-sm font-mono text-primary">
              {selectedTense.timelineVisual.coordinateHint}
            </span>
          </div>

          {/* 时间轴图形化示意条 */}
          <div className="relative py-6 px-4">
            {/* 时间主轴线 */}
            <div className="h-1 w-full bg-white/10 rounded-full relative">
              {/* 过去刻度 */}
              <div className="absolute left-[15%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="size-3 rounded-full bg-white/20 border border-white/30" />
                <span className="text-xs font-mono text-muted-foreground mt-2">Past (过去)</span>
              </div>

              {/* 现在刻度 (NOW - 焦点中轴) */}
              <div className="absolute left-[50%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="size-4 rounded-full bg-primary border-2 border-white/80 shadow-md shadow-primary/30" />
                <span className="text-sm font-mono font-bold text-primary mt-2">NOW (现在)</span>
              </div>

              {/* 将来刻度 */}
              <div className="absolute left-[85%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="size-3 rounded-full bg-white/20 border border-white/30" />
                <span className="text-xs font-mono text-muted-foreground mt-2">Future (将来)</span>
              </div>

              {/* 动态时态覆盖指示条 */}
              {selectedTense.time === 'present' && selectedTense.aspect === 'simple' && (
                <div className="absolute left-[15%] right-[15%] -top-1 h-3 bg-primary/20 rounded-full border border-primary/40" />
              )}
              {selectedTense.time === 'present' && selectedTense.aspect === 'continuous' && (
                <div className="absolute left-[44%] right-[44%] -top-1.5 h-4 bg-primary/30 rounded-full border-2 border-primary " />
              )}
              {selectedTense.time === 'present' && selectedTense.aspect === 'perfect' && (
                <div className="absolute left-[20%] w-[30%] -top-1 h-3 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/60 rounded-full border border-primary/40 " />
              )}
              {selectedTense.time === 'past' && selectedTense.aspect === 'simple' && (
                <div className="absolute left-[25%] -top-2 size-5 rounded-full bg-primary border-2 border-white/80 shadow-md shadow-primary/30" />
              )}
              {selectedTense.time === 'past' && selectedTense.aspect === 'perfect' && (
                <div className="absolute left-[10%] w-[18%] -top-1 h-3 bg-primary/30 rounded-full border border-primary/40" />
              )}
              {selectedTense.time === 'future' && (
                <div className="absolute left-[65%] w-[25%] -top-1 h-3 bg-primary/25 rounded-full border border-primary/40" />
              )}
            </div>
          </div>

          <p className="text-base text-foreground/90 leading-relaxed pt-3 border-t border-border">
            💡 <span className="font-semibold text-primary">认知内核：</span>
            {selectedTense.coreConcept}
          </p>
        </div>

        {/* 例句 */}
        <section className="border-t border-border pt-5 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h4 className="text-base font-bold text-foreground">例句</h4>
            <span className="text-sm font-semibold text-primary">
              {selectedTense.nameZh} · {selectedTense.nameEn}
            </span>
          </div>

          <div className="space-y-4">
            {selectedTense.examples.map((example, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <span className="font-mono text-sm font-bold text-primary pt-1 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono font-serif text-xl sm:text-2xl leading-relaxed text-foreground">
                      {renderSentenceWithVerbHighlight(example.en, example.verbPart)}
                    </p>
                    <button
                      type="button"
                      onClick={() => speakText(example.en)}
                      title="朗读例句"
                      className="mt-1.5 size-8 shrink-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  </div>
                  <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                    {example.zh}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 典型时间状语标志词 */}
        <div className="rounded-lg p-5 border border-border space-y-3">
          <span className="text-base font-bold text-foreground block">
            典型时间标志词 (Time Signals)
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedTense.signalWords.map((word, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-muted text-foreground/90 font-serif text-lg"
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* 经典混淆辨析擂台 */}
        {selectedTense.contrastTrap && (
          <div className="rounded-lg p-5 border border-border space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-primary" />
              <h4 className="text-base font-bold text-foreground tracking-wide">
                经典辨析：{selectedTense.nameZh} VS {selectedTense.contrastTrap.vsTenseName}
              </h4>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              {selectedTense.contrastTrap.differenceZh}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="border-l-2 border-border pl-3.5 py-1 space-y-1">
                <span className="text-sm font-mono font-bold text-primary block">
                  {selectedTense.contrastTrap.examplePair.tenseA}
                </span>
                <p className="text-base text-foreground font-medium">
                  {selectedTense.contrastTrap.examplePair.sentenceA}
                </p>
              </div>
              <div className="border-l-2 border-border pl-3.5 py-1 space-y-1">
                <span className="text-sm font-mono font-bold text-muted-foreground block">
                  {selectedTense.contrastTrap.examplePair.tenseB}
                </span>
                <p className="text-base text-foreground font-medium">
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

