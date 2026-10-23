'use client'

import React from 'react'
import { SCENARIO_ICONS, type RadioScenario } from '@/resources/radioData'
import { Layers } from 'lucide-react'

interface TranslateFiltersProps {
  selectedScenario: string
  onSelectScenario: (scenario: string) => void
  availableScenarios: string[]
  scenarioCounts: Record<string, number>
  totalCount: number
}

export function TranslateFilters({
  selectedScenario,
  onSelectScenario,
  availableScenarios,
  scenarioCounts,
  totalCount,
}: TranslateFiltersProps) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-3 pt-1 select-none">
      {/* 场景分类 Chips 水平滚动区 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
        {/* 全部场景 */}
        <button
          type="button"
          onClick={() => onSelectScenario('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all cursor-pointer ${
            selectedScenario === 'all'
              ? 'bg-primary/20 border-primary/50 text-primary shadow-xs'
              : 'bg-card/60 border-border/70 text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <span>✨</span>
          <span>全部场景</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedScenario === 'all'
                ? 'bg-primary text-primary-foreground font-bold'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* 动态场景 Tabs (与听力模块完全一致) */}
        {availableScenarios.map((sc) => {
          const icon = SCENARIO_ICONS[sc] || '🏷️'
          const isSelected = selectedScenario === sc
          const count = scenarioCounts[sc] || 0

          return (
            <button
              key={sc}
              type="button"
              onClick={() => onSelectScenario(sc)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary/20 border-primary/50 text-primary shadow-xs'
                  : 'bg-card/60 border-border/70 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <span>{icon}</span>
              <span>{sc}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
