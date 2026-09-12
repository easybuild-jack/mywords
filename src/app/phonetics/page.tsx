'use client'

import React, { useState, useEffect } from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { PhoneticStage } from '@/components/typing/PhoneticStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function PhoneticsPage() {
  const [isReady, setIsReady] = useState(false)
  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)

  useEffect(() => {
    setIsReady(false)
    enterMode('phonetic')
      .then(() => loadCurrentUnitWords())
      .finally(() => {
        setIsReady(true)
      })
  }, [enterMode, loadCurrentUnitWords])

  return (
    <div className="flex-1 min-h-full flex flex-col justify-between relative py-1">
      <HeaderToolbar />

      <div className="flex-1 flex items-center justify-center relative w-full px-4 py-2 my-auto shrink-0">
        <PhoneticStage isReady={isReady} />
      </div>

      <PracticeFooter showPeekHint isReady={isReady} />
    </div>
  )
}
