'use client'

import React from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { LearnStage } from '@/components/typing/LearnStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export default function LearnPage() {
  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)

  // 模式由路由声明；进入学习页会退出错词攻坚并载入学习页自己的进度
  React.useEffect(() => {
    enterMode('learn').then(() => loadCurrentUnitWords())
  }, [enterMode, loadCurrentUnitWords])

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between h-full relative">
      <HeaderToolbar />

      <div className="flex-1 min-h-0 flex items-center justify-center relative w-full px-4">
        <LearnStage />
      </div>

      <PracticeFooter />
    </div>
  )
}
