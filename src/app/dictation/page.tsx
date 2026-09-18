'use client'

import React, { useState, useEffect } from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { DictationStage } from '@/components/typing/DictationStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore, ensureWorkspaceHydrated } from '@/store/useWorkspaceStore'

export default function DictationPage() {
  const [isReady, setIsReady] = useState(() => {
    const s = useWorkspaceStore.getState()
    const isHydrated = s._hasHydrated || useWorkspaceStore.persist?.hasHydrated?.()
    if (!isHydrated) return false
    if (s.isErrorPracticeActive) return s.currentLoadedWords.length > 0 && !s.isUnitLoading
    return (
      s.mode === 'dictation' &&
      s.currentLoadedWords.length > 0 &&
      s.currentUnitMeta !== null &&
      s.currentUnitMeta.order === s.currentUnitIndex &&
      !s.isUnitLoading
    )
  })
  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)
  const playDictationCue = useWorkspaceStore((s) => s.playDictationCue)

  // 错词攻坚同样落在本页，此时 enterMode 会保留攻坚现场与它自己的词表。
  // 词表就位后再补线索，否则听音模式下的第一个词会既没有发音也没有释义。
  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        await ensureWorkspaceHydrated()
        if (cancelled) return

        await enterMode('dictation')
        if (cancelled) return

        const s = useWorkspaceStore.getState()
        const isTargetUnitReady = s.isErrorPracticeActive
          ? s.currentLoadedWords.length > 0 && !s.isUnitLoading
          : s.mode === 'dictation' &&
            s.currentLoadedWords.length > 0 &&
            s.currentUnitMeta !== null &&
            s.currentUnitMeta.order === s.currentUnitIndex &&
            !s.isUnitLoading

        if (!isTargetUnitReady) {
          setIsReady(false)
          const loadSequence = await loadCurrentUnitWords()
          if (cancelled) return
          if (loadSequence === null && !useWorkspaceStore.getState().isErrorPracticeActive) return
        }

        playDictationCue()
      } finally {
        if (!cancelled) setIsReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enterMode, loadCurrentUnitWords, playDictationCue])

  return (
    <div className="flex-1 min-h-full flex flex-col justify-between relative py-1">
      <HeaderToolbar />

      <div className="flex-1 flex items-center justify-center relative w-full px-4 py-2 my-auto shrink-0">
        <DictationStage isReady={isReady} />
      </div>

      <PracticeFooter showPeekHint isReady={isReady} />
    </div>
  )
}
