'use client'

import React from 'react'
import { GrammarTabType } from '@/resources/grammarData'

interface GrammarHeaderProps {
  activeTab: GrammarTabType
  onTabChange: (tab: GrammarTabType) => void
}

const TABS: { id: GrammarTabType; label: string; sublabel: string }[] = [
  { id: 'partsOfSpeech', label: '十大词性', sublabel: 'Parts of Speech' },
  { id: 'prepositions', label: '介词详解', sublabel: 'Prepositions' },
  { id: 'sentenceSyntax', label: '语法结构', sublabel: 'Sentence Structure' },
  { id: 'tenses', label: '时态诠释', sublabel: '16 Tenses' },
]

export function GrammarHeader({ activeTab, onTabChange }: GrammarHeaderProps) {
  return (
    <header className="sticky top-0 isolate z-30 w-full bg-background border-b border-border">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10 pt-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">基础语法</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          从古英语源流到现代分析语，空间认知介词图解，递进式句型解构，16 种时态坐标
        </p>

        <nav className="mt-4 -mb-px flex items-center gap-7 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`-mb-px pb-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'text-foreground font-medium border-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                <span className="text-sm">{tab.label}</span>
                <span className="ml-2 font-serif italic text-[13px] text-muted-foreground">{tab.sublabel}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
