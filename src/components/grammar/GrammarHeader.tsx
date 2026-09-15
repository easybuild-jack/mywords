'use client'

import React from 'react'
import {
  Layers,
  Search,
  X,
  Compass,
  Clock,
  Puzzle,
  BookMarked,
} from 'lucide-react'
import { GrammarTabType } from '@/resources/grammarData'

interface GrammarHeaderProps {
  activeTab: GrammarTabType
  onTabChange: (tab: GrammarTabType) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function GrammarHeader({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: GrammarHeaderProps) {
  const tabs: {
    id: GrammarTabType
    label: string
    sublabel: string
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    {
      id: 'partsOfSpeech',
      label: '十大词类源流',
      sublabel: 'Parts of Speech',
      icon: BookMarked,
    },
    {
      id: 'sentenceSyntax',
      label: '句子结构演进',
      sublabel: 'Sentence Structure',
      icon: Puzzle,
    },
    {
      id: 'tenses',
      label: '时态全景坐标轴',
      sublabel: '16 Tenses Matrix',
      icon: Clock,
    },
    {
      id: 'prepositions',
      label: '介词认知空间图',
      sublabel: 'Spatial Prepositions',
      icon: Compass,
    },
  ]
  return (
    <>
      <header className="fixed top-0 left-64 right-0 z-30 bg-background border-b border-border/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10 pt-5 pb-4 space-y-3.5">
      {/* 顶部标题与快速搜索 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Layers className="size-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                基础语法研习系统
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Visual Grammar v2.0
                </span>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              从古英语源流到现代分析语 · 递进式句型解构 · 16时态动态坐标轴 · 空间认知介词图解
            </p>
          </div>
        </div>

        {/* 全局检索框 */}
        <div className="relative w-full lg:w-80">
          <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索词类、句型、时态 (如: 主系表, have done, through)..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              title="清除搜索"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* 四大主模块切换栏 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer select-none border ${
                isActive
                  ? 'bg-primary text-[#0B0C0E] border-primary'
                  : 'bg-white/[0.02] text-muted-foreground border-white/10 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Icon className={`size-4 ${isActive ? 'text-[#0B0C0E]' : 'text-muted-foreground'}`} />
              <div className="flex flex-col text-left leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className={isActive ? 'font-semibold text-[#0B0C0E]' : ''}>{tab.label}</span>
                </div>
                <span className={`text-xs font-mono ${isActive ? 'text-[#0B0C0E]/70' : 'text-muted-foreground/80'}`}>
                  {tab.sublabel}
                </span>
              </div>
            </button>
          )
        })}
      </div>
      </div>
      </header>
      <div className="h-[210px] lg:h-[154px] shrink-0" aria-hidden="true" />
    </>
  )
}
