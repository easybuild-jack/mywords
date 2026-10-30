'use client'

import React from 'react'
import { type RadioScenario, type RadioMediaType } from '@/resources/radioData'

interface RadioFiltersProps {
  selectedScenario: RadioScenario | 'all'
  onSelectScenario: (sc: RadioScenario | 'all') => void
  selectedMediaType: RadioMediaType | 'all'
  onSelectMediaType: (type: RadioMediaType | 'all') => void
  availableScenarios: string[]
}

function chipClass(active: boolean) {
  return `shrink-0 h-7 px-2.5 rounded-md text-[13px] transition-colors cursor-pointer ${
    active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
  }`
}

const MEDIA_TYPES: { id: RadioMediaType | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'video', label: '视频' },
  { id: 'audio', label: '音频' },
]

export function RadioFilters({
  selectedScenario,
  onSelectScenario,
  selectedMediaType,
  onSelectMediaType,
  availableScenarios,
}: RadioFiltersProps) {
  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-1 overflow-x-auto max-w-full sm:max-w-2xl lg:max-w-4xl custom-scrollbar -ml-2.5">
        <button type="button" onClick={() => onSelectScenario('all')} className={chipClass(selectedScenario === 'all')}>
          全部场景
        </button>
        {availableScenarios.map((sc) => (
          <button key={sc} type="button" onClick={() => onSelectScenario(sc)} className={chipClass(selectedScenario === sc)}>
            {sc}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {MEDIA_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectMediaType(t.id)}
            className={`h-7 px-2.5 rounded-md text-xs transition-colors cursor-pointer ${
              selectedMediaType === t.id ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
