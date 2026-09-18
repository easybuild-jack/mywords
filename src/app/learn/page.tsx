'use client'

import React, { useState, useEffect } from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { LearnStage } from '@/components/typing/LearnStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function LearnPage() {
  const [isReady, setIsReady] = useState(() => {
    const s = useWorkspaceStore.getState()
    return s.mode === 'learn' && s.currentLoadedWords.length > 0 && !s.isUnitLoading
  })
  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)
  const playCurrentWordAudio = useWorkspaceStore((s) => s.playCurrentWordAudio)
  const syncStarredWordIds = useWorkspaceStore((s) => s.syncStarredWordIds)

  // 模式由路由声明；进入学习页会退出错词攻坚并载入学习页自己的进度
  useEffect(() => {
    let cancelled = false
    void syncStarredWordIds()

    void (async () => {
      try {
        const s = useWorkspaceStore.getState()
        const isCurrentUnitAlreadyLoaded =
          s.mode === 'learn' &&
          s.currentLoadedWords.length > 0 &&
          !s.isUnitLoading

        if (!isCurrentUnitAlreadyLoaded) {
          setIsReady(false)
        }

        await enterMode('learn')
        if (cancelled) return

        const currentStore = useWorkspaceStore.getState()
        if (currentStore.currentLoadedWords.length === 0 || !currentStore.currentUnitMeta) {
          const loadSequence = await loadCurrentUnitWords()
          if (cancelled) return
          if (loadSequence === null && !useWorkspaceStore.getState().isErrorPracticeActive) return
        }

        playCurrentWordAudio()
      } finally {
        // 只有最后一次仍存活的初始化才能开放页面，旧请求不能发音或回写 ready。
        if (!cancelled) setIsReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enterMode, loadCurrentUnitWords, playCurrentWordAudio, syncStarredWordIds])

  return (
    <div className="flex-1 min-h-full flex flex-col justify-between relative py-1">
      <HeaderToolbar />

      <div className="flex-1 flex items-center justify-center relative w-full px-4 py-2 my-auto shrink-0">
        <LearnStage isReady={isReady} />
      </div>

      <PracticeFooter isReady={isReady} />
    </div>
  )
}
