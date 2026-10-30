'use client'

import React from 'react'

interface TranslateFiltersProps {
  selectedScenario: string
  onSelectScenario: (scenario: string) => void
  availableScenarios: string[]
  scenarioCounts: Record<string, number>
  totalCount: number
}

function chipClass(active: boolean) {
  return `shrink-0 h-7 px-2.5 rounded-md text-[13px] transition-colors cursor-pointer ${
    active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
  }`
}

export function TranslateFilters({
  selectedScenario,
  onSelectScenario,
  availableScenarios,
  scenarioCounts,
  totalCount,
}: TranslateFiltersProps) {
  return (
    <div className="shrink-0 flex items-center gap-1 overflow-x-auto max-w-full custom-scrollbar select-none -ml-2.5">
      <button type="button" onClick={() => onSelectScenario('all')} className={chipClass(selectedScenario === 'all')}>
        全部场景
        <span className="ml-1 text-[11px] font-mono opacity-60">{totalCount}</span>
      </button>
      {availableScenarios.map((sc) => (
        <button key={sc} type="button" onClick={() => onSelectScenario(sc)} className={chipClass(selectedScenario === sc)}>
          {sc}
          <span className="ml-1 text-[11px] font-mono opacity-60">{scenarioCounts[sc] || 0}</span>
        </button>
      ))}
    </div>
  )
}
