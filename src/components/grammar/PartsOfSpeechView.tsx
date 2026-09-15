'use client'

import React, { useState } from 'react'
import { Volume2, AlertTriangle } from 'lucide-react'
import { PARTS_OF_SPEECH_DATA } from '@/resources/grammarData'

/** 辅助函数：将例句中的关键词高亮，样式与音标学习页例词关键词保持完全一致 */
function renderSentenceWithHighlights(sentence: string, highlightWords?: string[]) {
  if (!highlightWords || highlightWords.length === 0) {
    return <span className="font-semibold text-foreground">{sentence}</span>
  }

  // 排序优先匹配较长词汇，避免部分匹配截断
  const sortedWords = [...highlightWords].sort((a, b) => b.length - a.length)
  const pattern = sortedWords
    .map((w) => {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const hasTrailingPunct = /[!.,?;:]$/.test(w)
      return `\\b${escaped}${hasTrailingPunct ? '' : '\\b'}`
    })
    .join('|')

  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = sentence.split(regex)

  return (
    <span className="font-semibold text-foreground">
      {parts.map((part, idx) => {
        const isMatch = sortedWords.some((w) => w.toLowerCase() === part.toLowerCase())
        if (isMatch) {
          return (
            <span
              key={idx}
              className="grammar-keyword font-black"
            >
              {part}
            </span>
          )
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>
      })}
    </span>
  )
}

export function PartsOfSpeechView() {
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
  const filteredList = PARTS_OF_SPEECH_DATA

  return (
    <div className="space-y-6">
      {/* 模块导引条 */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Module 01 · 词性与句法
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              共 10 大词类
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">英语十大词类：理解词性在句子中的作用</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            通过核心句法功能、例句和句子成分解析，理解不同词性在真实句子中的位置与作用。
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredList.map((item) => (
          <article
            key={item.id}
            id={`pos-${item.id}`}
            className="glass-card rounded-2xl border border-white/10 p-6 sm:p-7 flex flex-col gap-6"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-lg font-bold text-primary">{item.abbr}</span>
                  <h3 className="text-2xl font-extrabold text-foreground">{item.name}</h3>
                  <span className="text-lg font-semibold text-muted-foreground">{item.nameZh}</span>
                </div>
                <p className="mt-4 text-lg leading-relaxed text-foreground">
                  {item.plainDescription}
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">常见语法位置：</strong>
                  {item.positionRules}
                </p>
              </div>
              <button
                type="button"
                onClick={() => speakText(item.exampleSentence.en)}
                title="朗读例句"
                className="size-10 shrink-0 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
              >
                <Volume2 className="size-5" />
              </button>
            </header>

            <section className="border-t border-white/10 pt-5 space-y-4">
              <h4 className="text-lg font-bold text-foreground">核心句法功能</h4>
              <ol className="space-y-3">
                {item.functions.map((fn, idx) => (
                  <li key={idx} className="grid grid-cols-[2rem_1fr] gap-3 text-base leading-relaxed">
                    <span className="font-mono font-bold text-primary">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-foreground/85">{fn}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="border-t border-white/10 pt-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-foreground">例句与句子解析</h4>
                <span className="text-base text-muted-foreground">高亮为当前词性</span>
              </div>
              <p className="text-xl sm:text-2xl font-semibold leading-relaxed text-foreground tracking-wide">
                {renderSentenceWithHighlights(
                  item.exampleSentence.en,
                  item.exampleSentence.highlightWords
                )}
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                {item.exampleSentence.zh}
              </p>
              <div className="divide-y divide-white/10 border-y border-white/10">
                {item.exampleSentence.breakdown.map((token, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-4 py-3.5 leading-relaxed items-baseline"
                  >
                    <span
                      className={`font-mono text-xl sm:text-2xl tracking-wide ${
                        token.isHighlight
                          ? 'grammar-keyword font-black'
                          : 'text-foreground font-bold'
                      }`}
                    >
                      {token.text}
                    </span>
                    <span className="text-base text-muted-foreground">
                      {token.role}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {item.proTips && (
              <aside className="mt-auto pt-4 border-l-2 border-primary pl-4 flex items-start gap-3 min-h-[5.5rem]">
                <AlertTriangle className="size-5 shrink-0 text-primary mt-1" />
                <p className="text-base leading-relaxed text-foreground/85 min-h-[4.875rem]">
                  <strong className="text-primary">重点提醒：</strong>
                  {item.proTips}
                </p>
              </aside>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
