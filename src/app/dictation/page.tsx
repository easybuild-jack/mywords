'use client'

import React, { useState, useEffect } from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { DictationStage } from '@/components/typing/DictationStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function DictationPage() {
  const [isReady, setIsReady] = useState(false)
  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)
  const playDictationCue = useWorkspaceStore((s) => s.playDictationCue)

  // 错词攻坚同样落在本页，此时 enterMode 会保留攻坚现场与它自己的词表。
  // 词表就位后再补线索，否则听音模式下的第一个词会既没有发音也没有释义。
  useEffect(() => {
    setIsReady(false)
    enterMode('dictation')
      .then(() => loadCurrentUnitWords())
      .then(() => playDictationCue())
      .finally(() => {
        setIsReady(true)
      })
  }, [enterMode, loadCurrentUnitWords, playDictationCue])

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between h-full relative">
      <HeaderToolbar />

      <div className="flex-1 min-h-0 flex items-center justify-center relative w-full px-4">
        <DictationStage isReady={isReady} />
      </div>

      <PracticeFooter showPeekHint isReady={isReady} />
    </div>
  )
}
