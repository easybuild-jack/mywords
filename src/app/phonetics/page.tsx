'use client'

import React, { useState, useEffect } from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { PhoneticStage } from '@/components/typing/PhoneticStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore, ensureWorkspaceHydrated } from '@/store/useWorkspaceStore'

export default function PhoneticsPage() {
  const [isReady, setIsReady] = useState(() => {
    const s = useWorkspaceStore.getState()
    const isHydrated = s._hasHydrated || useWorkspaceStore.persist?.hasHydrated?.()
    if (!isHydrated) return false
    return (
      s.mode === 'phonetic' &&
      s.currentLoadedWords.length > 0 &&
      s.currentUnitMeta !== null &&
      s.currentUnitMeta.order === s.currentUnitIndex &&
      !s.isUnitLoading
    )
  })
  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        await ensureWorkspaceHydrated()
        if (cancelled) return

        await enterMode('phonetic')
        if (cancelled) return

        const s = useWorkspaceStore.getState()
        const isTargetUnitReady =
          s.mode === 'phonetic' &&
          s.currentLoadedWords.length > 0 &&
          s.currentUnitMeta !== null &&
          s.currentUnitMeta.order === s.currentUnitIndex &&
          !s.isUnitLoading

        if (!isTargetUnitReady) {
          setIsReady(false)
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
