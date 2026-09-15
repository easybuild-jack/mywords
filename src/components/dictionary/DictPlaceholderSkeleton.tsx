'use client'

import React from 'react'
import { Search, Quote, BookOpen, Volume2, Star } from 'lucide-react'

/**
 * 单词查询页首次未查询时的占位骨架屏卡片
 * 与真实的 DictWordCard 采用 1:1 的几何分栏与尺寸规范：
 * 上半区：音标、大单词展示槽、释义槽
 * 下半区：左侧 8/12 双语例句槽、右侧 4/12 词根助记槽
 */
export function DictPlaceholderSkeleton() {
  return (
    <div className="relative w-full h-full flex flex-col justify-between pt-3 xl:pt-4 2xl:pt-5 pb-3.5 xl:pb-4 2xl:pb-5 px-5 sm:px-7 xl:px-9 2xl:px-11 text-center select-none overflow-hidden animate-in fade-in-50 duration-300">
      {/* 顶部左侧占位徽标 */}
      <div className="absolute top-3.5 left-5 sm:left-7 xl:top-4 xl:left-9 2xl:top-5 2xl:left-11 flex items-center gap-2 z-20">
        <div className="h-7 xl:h-8 px-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2 text-xs font-mono text-muted-foreground/60">
          <Search className="size-3.5 opacity-40" />
          <span>DICTIONARY</span>
        </div>
      </div>

      {/* 顶部右侧占位控件 */}
      <div className="absolute top-3.5 right-5 sm:right-7 xl:top-4 xl:right-9 2xl:top-5 2xl:right-11 flex items-center gap-2 z-20">
        <div className="h-10 xl:h-11 px-3.5 xl:px-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-2 text-xs xl:text-sm text-muted-foreground/40">
          <Star className="size-4 opacity-30" />
          <span>加入生词本</span>
        </div>
      </div>

      {/* 上半区（音标 + 大单词 + 释义） */}
      <div className="space-y-1 sm:space-y-1.5 xl:space-y-2 mt-1">
        {/* 音标栏骨架 */}
        <div className="h-6 sm:h-7 xl:h-7 flex items-center justify-center gap-3">
          <div className="h-6 w-28 rounded-lg bg-white/[0.03] border border-white/5 animate-pulse" />
          <div className="h-6 w-28 rounded-lg bg-white/[0.03] border border-white/5 animate-pulse" />
        </div>

        {/* 单词主体骨架 */}
        <div className="h-20 xl:h-24 2xl:h-28 flex items-center justify-center relative">
          <div className="h-12 sm:h-14 xl:h-16 2xl:h-18 w-56 sm:w-72 xl:w-96 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground/50 font-mono">
              <Search className="size-4 opacity-40 animate-pulse" />
              <span>输入单词，即刻开始查询</span>
            </div>
          </div>
        </div>

        {/* 单词释义骨架 */}
        <div className="min-h-9 xl:min-h-11 flex items-center justify-center px-4">
          <div className="h-5 xl:h-6 w-64 sm:w-80 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
        </div>
      </div>

      {/* 下半区：左右分栏排版（左侧 8/12 例句区；右侧 4/12 词根区） */}
      <div className="grid grid-cols-12 gap-3.5 xl:gap-5 pt-4 xl:pt-5 flex-1 min-h-0 text-left">
        {/* 左栏：双语例句骨架 */}
        <div className="col-span-8 rounded-2xl bg-white/[0.02] border border-white/5 p-3.5 xl:p-4 2xl:p-5 flex flex-col justify-between overflow-hidden shadow-inner">
          <div className="flex h-full min-h-0 flex-col gap-2.5 xl:gap-3.5">
            <div className="flex items-center justify-between pb-1.5 xl:pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5 xl:gap-2">
                <Quote className="size-3.5 xl:size-4 text-accent/40" />
                <div className="flex items-center rounded-lg bg-white/[0.03] p-0.5">
                  <span className="rounded-md px-2.5 py-1 text-xs font-bold text-accent/60 bg-accent/[0.08]">
                    例句
                  </span>
                  <span className="rounded-md px-2.5 py-1 text-xs font-bold text-muted-foreground/40">
                    短语
                  </span>
                </div>
              </div>
              <div className="h-4 w-16 rounded bg-white/[0.03] animate-pulse" />
            </div>

            {/* 例句条目骨架 */}
            <div className="space-y-2.5 xl:space-y-3.5 flex-1 flex flex-col justify-center">
              <div className="p-3 xl:p-3.5 rounded-xl bg-white/[0.015] border border-white/5 space-y-2">
                <div className="h-4 w-4/5 rounded bg-white/[0.04] animate-pulse" />
                <div className="h-3.5 w-3/5 rounded bg-white/[0.025]" />
              </div>
              <div className="p-3 xl:p-3.5 rounded-xl bg-white/[0.015] border border-white/5 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/[0.04] animate-pulse" />
                <div className="h-3.5 w-1/2 rounded bg-white/[0.025]" />
              </div>
            </div>
          </div>
        </div>

        {/* 右栏：词根助记骨架 */}
        <div className="col-span-4 rounded-2xl bg-white/[0.02] border border-white/5 p-4 xl:p-5 flex flex-col justify-between overflow-hidden shadow-inner">
          <div className="space-y-3 xl:space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 xl:size-4.5 text-primary/40 shrink-0" />
                <span className="text-sm xl:text-base font-bold text-white/50">
                  词根 · 助记
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/[0.06] text-primary/40 border border-primary/10">
                ROOTS
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="h-4 w-3/4 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-white/[0.03]" />
              <div className="h-16 rounded-xl bg-white/[0.015] border border-white/5 p-3 flex items-center justify-center">
                <span className="text-xs text-muted-foreground/40 font-sans">
                  解析前缀、词根与词源衍生
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
