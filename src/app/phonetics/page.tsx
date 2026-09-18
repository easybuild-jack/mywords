'use client'

import React, { useState, useEffect } from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { PhoneticStage } from '@/components/typing/PhoneticStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function PhoneticsPage() {
  const [isReady, setIsReady] = useState(() => {
    const s = useWorkspaceStore.getState()
    return s.mode === 'phonetic' && s.currentLoadedWords.length > 0 && !s.isUnitLoading
  })
  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const s = useWorkspaceStore.getState()
        const isCurrentUnitAlreadyLoaded =
          s.mode === 'phonetic' &&
          s.currentLoadedWords.length > 0 &&
          !s.isUnitLoading

        if (!isCurrentUnitAlreadyLoaded) {
          setIsReady(false)
        }

        await enterMode('phonetic')
        if (cancelled) return

        const currentStore = useWorkspaceStore.getState()
        if (currentStore.currentLoadedWords.length === 0 || !currentStore.currentUnitMeta) {
          if (!cancelled) await loadCurrentUnitWords()
        }
      } finally {
        if (!cancelled) setIsReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
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
