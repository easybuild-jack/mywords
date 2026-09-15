'use client'

import React from 'react'
import {
  Layers,
  Compass,
  Clock,
  Puzzle,
  BookMarked,
} from 'lucide-react'
import { GrammarTabType } from '@/resources/grammarData'

interface GrammarHeaderProps {
  activeTab: GrammarTabType
  onTabChange: (tab: GrammarTabType) => void
}

export function GrammarHeader({
  activeTab,
  onTabChange,
}: GrammarHeaderProps) {
  const tabs: {
    id: GrammarTabType
    label: string
    sublabel: string
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    {
      id: 'partsOfSpeech',
      label: '十大词性',
      sublabel: 'Parts of Speech',
      icon: BookMarked,
    },
    {
      id: 'prepositions',
      label: '介词详解',
      sublabel: 'Spatial Prepositions',
      icon: Compass,
    },
    {
      id: 'sentenceSyntax',
      label: '语法结构',
      sublabel: 'Sentence Structure',
      icon: Puzzle,
    },
    {
      id: 'tenses',
      label: '时态诠释',
      sublabel: '16 Tenses Matrix',
      icon: Clock,
    },
  ]
  return (
    <>
      <header className="fixed top-0 left-64 right-0 z-30 bg-background border-b border-border/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10 pt-5 pb-4 space-y-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Layers className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              基础语法详解
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              从古英语源流到现代分析语 · 空间认知介词图解 · 递进式句型解构 · 16时态动态坐标轴
            </p>
          </div>
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
