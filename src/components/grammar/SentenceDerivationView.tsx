'use client'

import React, { useState } from 'react'
import {
  SENTENCE_ELEMENTS_DATA,
  SENTENCE_DERIVATION_STEPS,
  DerivationStep,
} from '@/resources/grammarData'
import {
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  Volume2,
  GitBranch,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react'

interface SentenceDerivationViewProps {
  searchQuery: string
}

export function SentenceDerivationView({ searchQuery }: SentenceDerivationViewProps) {
  const [currentLevel, setCurrentLevel] = useState<number>(1)
  const [stripModifiers, setStripModifiers] = useState<boolean>(false)

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

  const currentStep: DerivationStep =
    SENTENCE_DERIVATION_STEPS.find((s) => s.level === currentLevel) ||
    SENTENCE_DERIVATION_STEPS[0]

  return (
    <div className="space-y-8">
      {/* 模块导引 */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Module 02 · 句法解构与演进
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              从 2 词原核到参天长句
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            句子成分与结构递进：由极简到复合的推导演化
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            任何复杂的英文长难句，本质上都是从五大基本句型（简单句核）衍生而来。通过添加修饰语（定语、状语）与逻辑分句（三大从句），句子如同树木般长出繁茂枝叶。
          </p>
        </div>

        {/* 剥离修饰语开关 */}
        <button
          onClick={() => setStripModifiers(!stripModifiers)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer select-none ${
            stripModifiers
              ? 'bg-primary/20 text-primary border-primary/40'
              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          {stripModifiers ? <EyeOff className="size-4 text-primary" /> : <Eye className="size-4" />}
          <span>{stripModifiers ? '已剥离修饰语 (裸露主干模式)' : '一键剥离修饰语看主干'}</span>
        </button>
      </div>

      {/* 句子八大成分总览图例 (Legends) */}
      <div className="rounded-2xl p-5 bg-surface/40 border border-white/10 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            句子成分色块图例 (Sentence Component Legend)
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">
            点击下方步骤卡片直接跳转层级
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {SENTENCE_ELEMENTS_DATA.map((elem) => (
            <div
              key={elem.id}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded border ${elem.badgeClass}`}>
                  {elem.code}
                </span>
                <span className="text-xs font-semibold text-white">{elem.nameZh}</span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1" title={elem.definition}>
                {elem.definition}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 递进推导主控制台 (Step Stepper) */}
      <div className="rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40">
        {/* 顶部横向进度步进轴 */}
        <div className="border-b border-white/10 bg-black/40 p-4 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            {SENTENCE_DERIVATION_STEPS.map((step) => {
              const isActive = step.level === currentLevel
              const isPast = step.level < currentLevel
              return (
                <button
                  key={step.level}
                  onClick={() => setCurrentLevel(step.level)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'bg-primary/20 text-primary border-primary/50 font-bold shadow-md shadow-primary/10'
                      : isPast
                      ? 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                      : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  <span
                    className={`size-5 rounded-full flex items-center justify-center font-mono text-[11px] ${
                      isActive
                        ? 'bg-primary text-black font-bold'
                        : isPast
                        ? 'bg-white/10 text-white'
                        : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {step.level}
                  </span>
                  <span>{step.pattern.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* 上一步 / 下一步 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              disabled={currentLevel === 1}
              onClick={() => setCurrentLevel((prev) => Math.max(1, prev - 1))}
              className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="上一步推导"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              disabled={currentLevel === SENTENCE_DERIVATION_STEPS.length}
              onClick={() => setCurrentLevel((prev) => Math.min(SENTENCE_DERIVATION_STEPS.length, prev + 1))}
              className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="下一步推导"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* 核心展示区 */}
        <div className="p-6 md:p-8 space-y-8">
          {/* 关卡标题与逻辑 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Level {currentStep.level} / {SENTENCE_DERIVATION_STEPS.length}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {currentStep.pattern}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {currentStep.titleZh}
              </h3>
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-primary/[0.04] border border-primary/20 max-w-sm space-y-1 shrink-0">
              <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                <GitBranch className="size-3.5" />
                认知演变逻辑
              </span>
              <p className="text-xs text-gray-300 leading-snug">
                {currentStep.conceptLogic}
              </p>
            </div>
          </div>

          {/* 阶段 1：极简原核骨架 (Minimal Example) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-sky-400" />
                第 1 阶段 · 极简原核骨架 (Atomic Skeleton)
              </span>
              <button
                onClick={() => speakText(currentStep.minimalExample.en)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 transition-all"
              >
                <Volume2 className="size-3.5" />
                <span>朗读原核</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center gap-3 flex-wrap text-xl md:text-2xl font-mono font-bold tracking-wide">
                {currentStep.minimalExample.tokens.map((tok, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className={tok.color}>{tok.word}</span>
                    <span className="text-[10px] font-sans font-normal text-gray-400 bg-white/5 px-2 py-0.5 rounded-full mt-1 border border-white/10">
                      {tok.role}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 font-sans border-t border-white/5 pt-2">
                含义：{currentStep.minimalExample.zh}
              </p>
            </div>
          </div>

          {/* 演变引桥 (Derivation Story) */}
          <div className="p-4 rounded-xl bg-indigo-500/[0.07] border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed flex items-start gap-3">
            <Info className="size-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-300">进化推导脉络：</span>
              {currentStep.derivationStory}
            </div>
          </div>

          {/* 阶段 2：有机参天句子扩充 (Enriched Sentence) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-400" />
                第 2 阶段 · 枝叶繁茂扩充句 (Organic Expansion)
              </span>
              <button
                onClick={() => speakText(currentStep.enrichedSentence.en)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 transition-all"
              >
                <Volume2 className="size-3.5" />
                <span>朗读长句</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
              {/* 拆解词块流 */}
              <div className="flex items-center gap-2 flex-wrap text-base md:text-lg leading-loose font-mono">
                {currentStep.enrichedSentence.tokens.map((tok, idx) => {
                  const isHidden = stripModifiers && tok.isModifier
                  return (
                    <span
                      key={idx}
                      className={`transition-all duration-300 px-2 py-1 rounded-lg border ${
                        isHidden
                          ? 'opacity-20 line-through bg-transparent border-transparent scale-95'
                          : tok.isModifier
                          ? 'bg-white/[0.04] border-white/10 text-gray-300'
                          : 'bg-primary/10 border-primary/40 font-bold shadow-sm shadow-primary/10'
                      }`}
                    >
                      <span className={isHidden ? 'text-gray-600' : tok.color}>
                        {tok.word}
                      </span>
                      <span className="ml-1.5 text-[10px] font-sans opacity-70">
                        [{tok.role}]
                      </span>
                    </span>
                  )
                })}
              </div>

              {/* 译文 */}
              <p className="text-xs text-gray-400 font-sans border-t border-white/5 pt-2">
                译文：{currentStep.enrichedSentence.zh}
              </p>

              {stripModifiers && (
                <div className="text-[11px] font-mono text-amber-300/90 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                  ⚡ 剥离修饰语后，无论修饰成分多冗长，其核心主干依然牢牢稳固在 Level {currentStep.level} 的基本模式中！
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
