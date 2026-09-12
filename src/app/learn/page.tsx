'use client'

import React, { useState, useEffect } from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { LearnStage } from '@/components/typing/LearnStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function LearnPage() {
  const [isReady, setIsReady] = useState(false)
  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)
  const playCurrentWordAudio = useWorkspaceStore((s) => s.playCurrentWordAudio)
  const syncStarredWordIds = useWorkspaceStore((s) => s.syncStarredWordIds)

  // 模式由路由声明；进入学习页会退出错词攻坚并载入学习页自己的进度
  useEffect(() => {
    setIsReady(false)
    syncStarredWordIds()
    enterMode('learn')
      .then(() => loadCurrentUnitWords())
      .then(() => playCurrentWordAudio())
      .finally(() => {
        // 数据就绪并完成游标对齐后开放展示，彻底消除第一词瞬切到当前在学词的闪烁
        setIsReady(true)
      })
  }, [enterMode, loadCurrentUnitWords, playCurrentWordAudio, syncStarredWordIds])

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between h-full relative">
      <HeaderToolbar />

      <div className="flex-1 min-h-0 flex items-center justify-center relative w-full px-4">
        <LearnStage isReady={isReady} />
      </div>

      <PracticeFooter isReady={isReady} />
    </div>
  )
}
