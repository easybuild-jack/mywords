'use client'

import React, { useState } from 'react'
import {
  Volume2,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles,
  Info,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react'
import { PARTS_OF_SPEECH_DATA, PartOfSpeechItem } from '@/resources/grammarData'

interface PartsOfSpeechViewProps {
  searchQuery: string
}

export function PartsOfSpeechView({ searchQuery }: PartsOfSpeechViewProps) {
  const [expandedOriginId, setExpandedOriginId] = useState<string | null>(null)
  const [activeSpeechId, setActiveSpeechId] = useState<string>('noun')

  // 发音辅助
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  // 搜索过滤
  const filteredList = PARTS_OF_SPEECH_DATA.filter((item) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      item.name.toLowerCase().includes(q) ||
      item.nameZh.includes(q) ||
      item.abbr.toLowerCase().includes(q) ||
      item.origin.etymology.toLowerCase().includes(q) ||
      item.evolution.toLowerCase().includes(q) ||
      item.commonWords.some((w) => w.word.toLowerCase().includes(q) || w.meaning.includes(q)) ||
      item.exampleSentence.en.toLowerCase().includes(q) ||
      item.exampleSentence.zh.includes(q)
    )
  })

  const toggleOrigin = (id: string) => {
    setExpandedOriginId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {/* 模块导引条 */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Module 01 · 语源与基石
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              共 10 大词类
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">英语十大词类：探寻从屈折到分析的千年演化</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            传统语法常将词类当成死记硬背的标签。但在古英语向现代英语的演进中，格位词尾的脱落彻底改变了名词、动词与介词的共生关系。理解源流与功能，语法规则便能融会贯通。
          </p>
        </div>

        {/* 快速定位小标签条 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PARTS_OF_SPEECH_DATA.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                const el = document.getElementById(`pos-${item.id}`)
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                setActiveSpeechId(item.id)
              }}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                activeSpeechId === item.id
                  ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
              }`}
            >
              {item.nameZh} <span className="font-mono text-xs text-muted-foreground">({item.abbr})</span>
            </button>
          ))}
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground bg-white/[0.02] rounded-2xl border border-white/5">
          <Info className="size-8 mx-auto mb-2 opacity-50" />
          <p>未找到匹配 “{searchQuery}” 的词类内容</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredList.map((item) => {
            const isOriginExpanded = expandedOriginId === item.id

            return (
              <div
                key={item.id}
                id={`pos-${item.id}`}
                className={`rounded-2xl p-6 bg-surface/50 border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md flex flex-col justify-between space-y-5 relative group shadow-lg shadow-black/20 ${item.borderColor}`}
              >
                {/* 顶部标题行 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${item.badgeBg}`}>
                      <span className="font-mono font-bold text-base">{item.abbr}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <span className="text-sm font-semibold text-gray-300">
                          {item.nameZh}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {item.origin.etymology} · <span className="text-gray-300">{item.origin.meaning}</span>
                      </p>
                    </div>
                  </div>

                  {/* 朗读例句按钮 */}
                  <button
                    onClick={() => speakText(item.exampleSentence.en)}
                    title="朗读典范例句"
                    className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Volume2 className="size-4" />
                  </button>
                </div>

                {/* 历史演变折叠卡 (Origin & Evolution) */}
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5 space-y-2">
                  <button
                    onClick={() => toggleOrigin(item.id)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-1.5 text-emerald-400/90">
                      <History className="size-3.5" />
                      语源与历史演变透镜 (Etymology & Evolution)
                    </span>
                    {isOriginExpanded ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                  </button>

                  {isOriginExpanded && (
                    <div className="pt-2 text-xs text-gray-300/90 leading-relaxed border-t border-white/5 animate-fadeIn">
                      <p className="bg-black/20 p-3 rounded-lg border border-white/5 font-sans">
                        {item.evolution}
                      </p>
                    </div>
                  )}
                </div>

                {/* 核心句法功能列表 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <Sparkles className="size-3 text-primary" />
                    核心句法功能 (Syntactic Functions)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {item.functions.map((fn, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5 opacity-80" />
                        <span className="leading-snug">{fn}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 高频核心词汇 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    典型高频词汇 (Representative Words)
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.commonWords.map((wordObj, idx) => (
                      <button
                        key={idx}
                        onClick={() => speakText(wordObj.word)}
                        className="group/word flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:border-primary/40 hover:bg-white/[0.08] transition-all text-xs"
                      >
                        <span className="font-semibold text-white group-hover/word:text-primary">
                          {wordObj.word}
                        </span>
                        {wordObj.phonetic && (
                          <span className="text-[10px] font-mono text-muted-foreground/70">
                            {wordObj.phonetic}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 font-sans">
                          {wordObj.meaning}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 剖析例句卡片 */}
                <div className="rounded-xl p-4 bg-black/30 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                      深度拆解例句 (Sentence Breakdown)
                    </span>
                    <span className="text-[11px] font-mono text-primary/80">
                      位置规律: {item.positionRules.slice(0, 18)}...
                    </span>
                  </div>

                  {/* 英文句子 */}
                  <p className="text-sm font-medium text-white leading-relaxed">
                    {item.exampleSentence.en}
                  </p>
                  <p className="text-xs text-gray-400 font-sans">
                    {item.exampleSentence.zh}
                  </p>

                  {/* 词成分标签分解 */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {item.exampleSentence.breakdown.map((token, bIdx) => (
                      <div
                        key={bIdx}
                        className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          token.isHighlight
                            ? 'bg-primary/20 text-primary border-primary/40 font-semibold shadow-sm shadow-primary/10'
                            : 'bg-white/5 text-gray-400 border-white/5'
                        }`}
                      >
                        <span className="font-mono text-white/90">{token.text}</span>
                        <span className="text-[10px] opacity-75">· {token.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 避坑提示与进阶窍门 */}
                <div className="rounded-xl px-3.5 py-2.5 bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
                  <Lightbulb className="size-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-semibold text-amber-300">进阶秘籍: </span>
                    {item.proTips}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
