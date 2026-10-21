'use client'

import React from 'react'
import {
  type RadioScenario,
  type RadioMediaType,
  SCENARIO_ICONS,
} from '@/resources/radioData'
import { Video, Headphones } from 'lucide-react'

interface RadioFiltersProps {
  selectedScenario: RadioScenario | 'all'
  onSelectScenario: (sc: RadioScenario | 'all') => void
  selectedMediaType: RadioMediaType | 'all'
  onSelectMediaType: (type: RadioMediaType | 'all') => void
  availableScenarios: string[]
}

export function RadioFilters({
  selectedScenario,
  onSelectScenario,
  selectedMediaType,
  onSelectMediaType,
  availableScenarios,
}: RadioFiltersProps) {
  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 pt-3 select-none">
      {/* 场景分类 Chips 水平滚动区 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full sm:max-w-2xl lg:max-w-4xl custom-scrollbar">
        <button
          onClick={() => onSelectScenario('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 border transition-all cursor-pointer ${
            selectedScenario === 'all'
              ? 'bg-primary/20 border-primary/50 text-primary font-bold shadow-xs'
              : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <span>✨</span>
          <span>全部场景</span>
        </button>

        {availableScenarios.map((sc) => {
          const icon = SCENARIO_ICONS[sc] || '🏷️'
          const isSelected = selectedScenario === sc

          return (
            <button
              key={sc}
              onClick={() => onSelectScenario(sc)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary/20 border-primary/50 text-primary font-bold shadow-xs'
                  : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <span>{icon}</span>
              <span>{sc}</span>
            </button>
          )
        })}
      </div>

      {/* 媒体类型过滤（全部 / 视频 / 音频） */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-card/60 border border-border/70 shadow-xs shrink-0">
        <button
          onClick={() => onSelectMediaType('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            selectedMediaType === 'all'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => onSelectMediaType('video')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            selectedMediaType === 'video'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Video className="size-3.5" />
          <span>视频</span>
        </button>
        <button
          onClick={() => onSelectMediaType('audio')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            selectedMediaType === 'audio'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Headphones className="size-3.5" />
          <span>音频</span>
        </button>
      </div>
    </div>
  )
}
