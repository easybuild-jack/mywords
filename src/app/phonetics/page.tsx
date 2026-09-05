'use client'

import React from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { PhoneticStage } from '@/components/typing/PhoneticStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function PhoneticsPage() {
  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)

  React.useEffect(() => {
    enterMode('phonetic')
      .then(() => loadCurrentUnitWords())
  }, [enterMode, loadCurrentUnitWords])

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between h-full relative">
      <HeaderToolbar />

      <div className="flex-1 min-h-0 flex items-center justify-center relative w-full px-4">
        <PhoneticStage />
      </div>

      <PracticeFooter />
    </div>
  )
}
