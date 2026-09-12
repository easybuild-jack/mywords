'use client'

import React, { useEffect, useState } from 'react'
import { Sparkles, Loader2, Volume2, Quote, Cpu } from 'lucide-react'

const PARSING_STAGES = [
  '正在连接 AI 词典模型...',
  '正在严格校验单词拼写...',
  '正在生成美英 IPA 音标...',
  '正在整理词性与中文释义...',
  '正在校验基础数据格式...',
]

export function DictSearchingCard() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 依据耗时动态切换步骤提示
  const stageIndex = Math.min(Math.floor(elapsed / 3), PARSING_STAGES.length - 1)
  const currentStageText = PARSING_STAGES[stageIndex]

  return (
    <div className="relative w-full h-full flex flex-col justify-between text-center select-none pt-5 pb-6 px-7 xl:pt-6 xl:pb-7 xl:px-10 2xl:pt-8 2xl:pb-8 2xl:px-12 overflow-hidden">
      {/* 顶部左侧：AI 状态徽标 */}
      <div className="absolute top-4 left-4 xl:top-5 xl:left-5 2xl:top-6 2xl:left-6 flex items-center gap-2.5 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-semibold backdrop-blur-md shadow-sm">
          <Sparkles className="size-3.5 animate-spin text-primary" />
          <span>AI 字典推导中</span>
        </div>
        <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-muted-foreground flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-ping" />
          <span>{elapsed}s</span>
        </span>
      </div>

      {/* 顶部右侧：发音控件骨架占位 */}
      <div className="absolute top-4 right-4 xl:top-5 xl:right-5 2xl:top-6 2xl:right-6 flex items-center gap-2 z-20">
        <div className="size-10 xl:size-11 rounded-xl bg-white/[0.04] border border-white/10 text-muted-foreground/40 flex items-center justify-center animate-pulse">
          <Volume2 className="size-4.5 xl:size-5 opacity-40" />
        </div>
      </div>

      {/* 中上部：查询结果返回前只显示中性骨架，不提前展示输入内容 */}
      <div className="flex flex-col items-center mt-6 xl:mt-7 2xl:mt-8">
        <div className="h-12 xl:h-16 w-64 xl:w-80 rounded-xl bg-white/[0.05] animate-pulse" />

        {/* 音标与发音骨架条 */}
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="h-6 w-32 xl:w-40 rounded-full bg-white/[0.06] border border-white/10 relative overflow-hidden animate-pulse">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="h-6 w-28 xl:w-36 rounded-full bg-white/[0.06] border border-white/10 relative overflow-hidden animate-pulse">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>

        {/* 自然拼读音节骨架点阵 */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-5 w-16 rounded-md bg-primary/10 border border-primary/20 animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-primary/70 font-mono">···</span>
          </div>
          <span className="text-white/20 text-xs">·</span>
          <div className="h-5 w-20 rounded-md bg-primary/10 border border-primary/20 animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-primary/70 font-mono">···</span>
          </div>
          <span className="text-white/20 text-xs">·</span>
          <div className="h-5 w-14 rounded-md bg-primary/10 border border-primary/20 animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-primary/70 font-mono">···</span>
          </div>
        </div>
      </div>

      {/* 中部：词义释义骨架 */}
      <div className="my-auto py-3 max-w-xl mx-auto w-full flex flex-col gap-2.5">
        <div className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
          <div className="h-6 w-10 rounded-md bg-primary/20 text-primary/80 text-xs font-mono font-bold flex items-center justify-center shrink-0 animate-pulse">
            n.
          </div>
          <div className="h-5 flex-1 rounded bg-white/[0.05] relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
          <div className="h-6 w-10 rounded-md bg-accent/20 text-accent/80 text-xs font-mono font-bold flex items-center justify-center shrink-0 animate-pulse">
            adj.
          </div>
          <div className="h-5 w-3/4 rounded bg-white/[0.05] relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
      </div>

      {/* 下部：词源流变卡与语境例句卡（双卡对称骨架） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xl:gap-4 w-full text-left">
        {/* 左卡：构词词源推导骨架 */}
        <div className="p-3.5 xl:p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden flex flex-col justify-between h-[120px] xl:h-[135px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary/80 flex items-center gap-1.5">
              <Cpu className="size-3.5" />
              <span>词根词缀流变</span>
            </span>
            <span className="size-2 rounded-full bg-primary/40 animate-ping" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-4/5 rounded bg-white/[0.06] relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="h-3.5 w-3/5 rounded bg-white/[0.06] relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
          <div className="h-3 w-2/3 rounded bg-white/[0.04] mt-1" />
        </div>

        {/* 右卡：语境例句骨架 */}
        <div className="p-3.5 xl:p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden flex flex-col justify-between h-[120px] xl:h-[135px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400/80 flex items-center gap-1.5">
              <Quote className="size-3.5" />
              <span>语境原声例句</span>
            </span>
            <span className="size-2 rounded-full bg-emerald-400/40 animate-ping" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded bg-white/[0.06] relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="h-3.5 w-4/5 rounded bg-white/[0.06] relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
          <div className="h-3 w-1/2 rounded bg-white/[0.04] mt-1" />
        </div>
      </div>

      {/* 底部实时状态引导条 */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground px-2">
        <div className="flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          <span className="text-foreground/90 font-medium">{currentStageText}</span>
        </div>
        <span className="text-white/40 hidden sm:inline-block">AI 实时推导与知识图谱构建中</span>
      </div>
    </div>
  )
}
