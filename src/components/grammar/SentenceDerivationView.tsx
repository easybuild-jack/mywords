'use client'

import React, { useState } from 'react'
import {
  Volume2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react'
import {
  SENTENCE_CORE_CONCEPTS,
  SENTENCE_MODIFIERS_DATA,
  APPLE_SENTENCE_GROWTH_STEPS,
  LINKING_SENTENCE_GROWTH_STEPS,
  SV_SENTENCE_GROWTH_STEPS,
  SVOO_SENTENCE_GROWTH_STEPS,
  SVOC_SENTENCE_GROWTH_STEPS,
  THERE_BE_SENTENCE_GROWTH_STEPS,
  type SentenceGrowthStep,
} from '@/resources/grammarData'

interface SentenceDerivationViewProps {
  searchQuery?: string
}

const SENTENCE_GROWTH_SERIES = [
  {
    id: 'sv',
    tabLabel: '主谓',
    tabSublabel: 'S + V',
    title: '主谓推演：看着“鸟会飞”一句话长大',
    description: '从 Birds fly. 开始，理解不需要宾语也能成立的句子。',
    idPrefix: 'sv-step',
    steps: SV_SENTENCE_GROWTH_STEPS,
  },
  {
    id: 'svc',
    tabLabel: '主系表',
    tabSublabel: 'S + V-link + P',
    title: '主系表推演：看着“苹果是红的”一句话长大',
    description: '从 The apple is red. 开始，理解系动词如何连接主语和表语。',
    idPrefix: 'linking-step',
    steps: LINKING_SENTENCE_GROWTH_STEPS,
  },
  {
    id: 'svo',
    tabLabel: '主谓宾',
    tabSublabel: 'S + V + O',
    title: '主谓宾推演：看着“吃苹果”一句话长大',
    description: '从 I eat apples. 开始，每一步只增加一个成分。',
    idPrefix: 'step',
    steps: APPLE_SENTENCE_GROWTH_STEPS,
  },
  {
    id: 'svoo',
    tabLabel: '主谓双宾',
    tabSublabel: 'S + V + Oi + Od',
    title: '主谓双宾推演：看着“妈妈给我一本书”一句话长大',
    description: '从 Mom gives me a book. 开始，分清“给谁”和“给什么”。',
    idPrefix: 'svoo-step',
    steps: SVOO_SENTENCE_GROWTH_STEPS,
  },
  {
    id: 'svoc',
    tabLabel: '主谓宾宾补',
    tabSublabel: 'S + V + O + C',
    title: '主谓宾宾补推演：看着“消息让我开心”一句话长大',
    description: '从 The news makes me happy. 开始，理解宾语后为什么还需要补充说明。',
    idPrefix: 'svoc-step',
    steps: SVOC_SENTENCE_GROWTH_STEPS,
  },
  {
    id: 'there-be',
    tabLabel: 'There be',
    tabSublabel: 'There + be + N',
    title: 'There be 推演：看着“有一本书”一句话长大',
    description: '从 There is a book. 开始，学习如何表达某处存在某人或某物。',
    idPrefix: 'there-be-step',
    steps: THERE_BE_SENTENCE_GROWTH_STEPS,
  },
] as const

type GrowthSeriesId = (typeof SENTENCE_GROWTH_SERIES)[number]['id']

/** 辅助函数：高亮本步新增的关键词，采用与音标例词一致的琥珀色 (#F59E0B)，无下划线 */
function renderGrowthSentence(sentence: string, highlightWords: string[]) {
  if (!highlightWords || highlightWords.length === 0) {
    return <span className="font-semibold text-foreground">{sentence}</span>
  }

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

function SentenceGrowthSeries({
  title,
  description,
  idPrefix,
  steps,
  onSpeak,
}: {
  title: string
  description: string
  idPrefix: string
  steps: SentenceGrowthStep[]
  onSpeak: (text: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xl font-extrabold text-white">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <span className="text-sm font-mono text-primary font-bold">{steps.length} 阶生长</span>
      </div>

      <div className="space-y-4">
        {steps.map((stepItem) => (
          <article
            key={stepItem.step}
            id={`${idPrefix}-${stepItem.step}`}
            className="glass-card rounded-2xl border border-white/10 p-5 sm:p-6 flex flex-col gap-4"
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-lg font-bold text-primary">
                    Step 0{stepItem.step}
                  </span>
                  <h3 className="text-2xl font-extrabold text-foreground">
                    {stepItem.titleZh}
                  </h3>
                  <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {stepItem.tagZh}
                  </span>
                </div>
                <p className="mt-3 text-lg leading-relaxed text-foreground">
                  <strong className="text-primary">新增演进：</strong>
                  {stepItem.addedElementDesc}
                </p>
                <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">为什么加这个成分：</strong>
                  {stepItem.whyAddIt}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSpeak(stepItem.sentenceEn)}
                title="朗读本步例句"
                className="size-10 shrink-0 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center cursor-pointer"
              >
                <Volume2 className="size-5" />
              </button>
            </header>

            <section className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex items-baseline gap-x-4 gap-y-1 flex-wrap">
                <p className="text-xl sm:text-2xl font-semibold leading-relaxed text-foreground tracking-wide">
                  {renderGrowthSentence(stepItem.sentenceEn, stepItem.highlightWords)}
                </p>
                <span className="text-base sm:text-lg text-muted-foreground">
                  {stepItem.sentenceZh}
                </span>
              </div>

              <div className="divide-y divide-white/10 border-y border-white/10">
                {stepItem.breakdown.map((token, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-4 py-2.5 leading-relaxed items-baseline"
                  >
                    <span
                      className={`font-mono text-xl sm:text-2xl tracking-wide ${
                        token.isNew
                          ? 'grammar-keyword font-black'
                          : 'text-foreground font-bold'
                      }`}
                    >
                      {token.text}
                    </span>
                    <span className="text-base text-muted-foreground">{token.role}</span>
                  </div>
                ))}
              </div>
            </section>

            <aside className="mt-auto border-l-2 border-primary pl-4 flex items-start gap-3">
              <Lightbulb className="size-5 shrink-0 text-primary mt-1" />
              <p className="text-base leading-relaxed text-foreground/85">
                <strong className="text-primary">演变心法：</strong>
                {stepItem.takeaway}
              </p>
            </aside>
          </article>
        ))}
      </div>
    </div>
  )
}

export function SentenceDerivationView({ searchQuery }: SentenceDerivationViewProps) {
  const [activeStepId, setActiveStepId] = useState<number>(1)
  const [activeSeriesId, setActiveSeriesId] = useState<GrowthSeriesId>('svo')
  const activeSeries =
    SENTENCE_GROWTH_SERIES.find((series) => series.id === activeSeriesId) ??
    SENTENCE_GROWTH_SERIES[0]

  // 语音播报
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
    <div className="space-y-8">
      {/* 模块导引条（与词性页风格完全一致） */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Module 02 · 句子主干与成分演进
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              吃苹果推导法
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            英语句子成分与结构演变：从“谁在干什么”开始
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            用通俗易懂的语言理解句子核心主干，并通过一个简单的“吃苹果”例句，直观看到一句话是如何从3个词逐步演变为丰满长句的。
          </p>
        </div>

        {/* 步骤快速跳转胶囊 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              const el = document.getElementById('sentence-foundation')
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            className="text-sm px-3 py-1.5 rounded-lg border bg-primary/20 text-primary border-primary/40 font-semibold cursor-pointer"
          >
            句法核心认知
          </button>
          {activeSeries.steps.map((s) => (
            <button
              key={s.step}
              onClick={() => {
                const el = document.getElementById(`${activeSeries.idPrefix}-${s.step}`)
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                setActiveStepId(s.step)
              }}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                activeStepId === s.step
                  ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
              }`}
            >
              步骤 0{s.step} <span className="font-mono text-xs text-muted-foreground">({s.tagZh.slice(0, 4)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 第一部分：通俗解释句子成分的作用（核心认知大卡片） */}
      <article
        id="sentence-foundation"
        className="glass-card rounded-2xl border border-white/10 p-6 sm:p-7 space-y-7"
      >
        <header className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-lg font-bold text-primary">01</span>
            <h3 className="text-2xl font-extrabold text-foreground">
              核心认知：英语句子到底在表达什么？
            </h3>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground">
            任何英语句子，无论在考试中看起来多么冗长复杂，其核心本质永远只在回答两个问题：<strong className="text-foreground">“谁在干什么”（动作主干）</strong>，或者 <strong className="text-foreground">“谁是什么状态”（状态主干）</strong>。
          </p>
        </header>

        {/* 两大核心主干 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-white/10 pt-6">
          {SENTENCE_CORE_CONCEPTS.map((concept) => (
            <div
              key={concept.id}
              className="rounded-xl bg-white/[0.02] border border-white/10 p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-lg font-bold text-foreground">{concept.titleZh}</h4>
                  <span className="font-mono text-xs text-primary font-semibold">{concept.formula}</span>
                </div>
                <p className="text-sm font-semibold text-primary/90">
                  {concept.coreQuestion}
                </p>
                <p className="text-base leading-relaxed text-foreground/85">
                  {concept.plainExplanation}
                </p>
              </div>

              {/* 拆解项 */}
              <div className="border-t border-white/10 pt-4 space-y-2.5">
                <div className="flex items-center justify-between text-base">
                  <span className="font-mono text-xl font-bold text-foreground">
                    {concept.exampleEn}
                  </span>
                  <span className="text-muted-foreground">{concept.exampleZh}</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  {concept.components.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-muted-foreground">
                      <span className="font-mono font-bold text-primary">
                        {comp.code} ({comp.nameZh})
                      </span>
                      <span>{comp.role} · 例：<strong className="text-foreground font-mono">{comp.exampleWord}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 枝叶成分的作用 */}
        <div className="border-t border-white/10 pt-6 space-y-4">
          <div className="flex items-baseline gap-3">
            <h4 className="text-lg font-bold text-foreground">枝叶成分：给句子穿衣服与添细节</h4>
            <span className="text-sm text-muted-foreground">剥离它们，句子依然成立；加上它们，意思更加丰富</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SENTENCE_MODIFIERS_DATA.map((mod) => (
              <div
                key={mod.id}
                className="rounded-xl bg-white/[0.02] border border-white/10 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-foreground">{mod.nameZh}</span>
                  <span className="text-xs text-primary font-mono">{mod.questionZh}</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {mod.plainExplanation}
                </p>
                <div className="pt-2 border-t border-white/10 text-sm flex items-center justify-between">
                  <span className="font-mono font-semibold text-foreground">{mod.exampleEn}</span>
                  <span className="text-xs text-muted-foreground">{mod.exampleZh}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="border-l-2 border-primary pl-4 flex items-start gap-3">
          <Lightbulb className="size-5 shrink-0 text-primary mt-0.5" />
          <p className="text-base leading-relaxed text-foreground/85">
            <strong className="text-primary">初学者学习心法：</strong>
            阅读英语时，千万别把一句话当成零散的一堆单词。先找动词，顺藤摸瓜找到“谁发出的动作”和“对谁发出的”，把主干抓牢，再看其他修饰词，长句瞬间变简单！
          </p>
        </aside>
      </article>

      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/[0.04] border border-white/10 w-fit max-w-full overflow-x-auto custom-scrollbar">
        {SENTENCE_GROWTH_SERIES.map((series) => {
          const isActive = activeSeriesId === series.id
          return (
            <button
              key={series.id}
              type="button"
              onClick={() => setActiveSeriesId(series.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary text-[#0B0C0E]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {series.tabLabel}
              <span className={`ml-2 font-mono text-xs ${
                isActive ? 'text-[#0B0C0E]/70' : 'text-muted-foreground/70'
              }`}>
                {series.tabSublabel}
              </span>
            </button>
          )
        })}
      </div>

      <SentenceGrowthSeries
        title={activeSeries.title}
        description={activeSeries.description}
        idPrefix={activeSeries.idPrefix}
        steps={activeSeries.steps}
        onSpeak={speakText}
      />
    </div>
  )
}
