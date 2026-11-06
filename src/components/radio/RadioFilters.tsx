'use client'

import React from 'react'
import { type RadioScenario } from '@/resources/radioData'

interface RadioFiltersProps {
  selectedScenario: RadioScenario | 'all'
  onSelectScenario: (sc: RadioScenario | 'all') => void
  availableScenarios: string[]
}

function chipClass(active: boolean) {
  return `shrink-0 h-7 px-2.5 rounded-md text-[13px] transition-colors cursor-pointer ${
    active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
  }`
}

export function RadioFilters({
  selectedScenario,
  onSelectScenario,
  availableScenarios,
}: RadioFiltersProps) {
  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-1 overflow-x-auto max-w-full custom-scrollbar -ml-2.5">
        <button type="button" onClick={() => onSelectScenario('all')} className={chipClass(selectedScenario === 'all')}>
          全部场景
        </button>
        {availableScenarios.map((sc) => (
          <button key={sc} type="button" onClick={() => onSelectScenario(sc)} className={chipClass(selectedScenario === sc)}>
            {sc}
          </button>
        ))}
      </div>
    </div>
  )
}
