'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { HeaderToolbar } from '@/components/layout/HeaderToolbar'
import { LearnStage } from '@/components/typing/LearnStage'
import { PracticeFooter } from '@/components/typing/PracticeFooter'
import { useWorkspaceStore, ensureWorkspaceHydrated } from '@/store/useWorkspaceStore'

export default function LearnPage() {
  const [isReady, setIsReady] = useState(() => {
    const s = useWorkspaceStore.getState()
    const isHydrated = s._hasHydrated || useWorkspaceStore.persist?.hasHydrated?.()
    if (!isHydrated) return false
    return (
      s.mode === 'learn' &&
      s.currentLoadedWords.length > 0 &&
      s.currentUnitMeta !== null &&
      s.currentUnitMeta.order === s.currentUnitIndex &&
      !s.isUnitLoading
    )
  })

  // 是否已进入流程：
  // 1. 从词库选择章节后进入：直接开始 (hasStarted = true)，无需开始过渡层；
  // 2. 从菜单点击进入：需要「开始学习」过渡层 (hasStarted = false)，防止切页自动发音突兀。
  const [hasStarted, setHasStarted] = useState(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('mywords_auto_start_learn') === 'true') {
        return true
      }
    }
    return Boolean(useWorkspaceStore.getState().shouldAutoStartLearn)
  })

  // 记录初次挂载时是否判定为自动开始
  const isAutoStartedRef = useRef(hasStarted)

  // 在副作用中清理自动开始标记（绝不能在 useState / render 阶段调用 setState，防止破坏 React 渲染纯度）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mywords_auto_start_learn')
    }
    if (useWorkspaceStore.getState().shouldAutoStartLearn) {
      useWorkspaceStore.setState({ shouldAutoStartLearn: false })
    }
  }, [])

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
        // 先确保本地持久化存储（localStorage）已水合到位，避免读到默认初始单元（Unit 0 am）
        await ensureWorkspaceHydrated()
        if (cancelled) return

        await enterMode('learn')
        if (cancelled) return

        const s = useWorkspaceStore.getState()
        const isTargetUnitReady =
          s.mode === 'learn' &&
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

        // 仅在从词库选章直达时（isAutoStartedRef.current = true）在就绪后立即发音；
        // 从菜单点击切入时保留未开始状态，等待用户点击「开始学习」按钮后再播报，避免切页突兀！
        if (isAutoStartedRef.current) {
          playCurrentWordAudio()
        }
      } finally {
        // 只有最后一次仍存活的初始化才能开放页面，旧请求不能发音或回写 ready。
        if (!cancelled) setIsReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enterMode, loadCurrentUnitWords, playCurrentWordAudio, syncStarredWordIds])

  // 用户点击「开始学习」或按空格/回车进入流程
  const handleStartLearning = useCallback(() => {
    setHasStarted(true)
    playCurrentWordAudio()
  }, [playCurrentWordAudio])

  return (
    <div className="flex-1 min-h-full flex flex-col justify-between relative pb-1">
      <HeaderToolbar />

      <div className="flex-1 flex items-center justify-center relative w-full px-4 py-2 my-auto shrink-0">
        <LearnStage
          isReady={isReady}
          hasStarted={hasStarted}
          onStartLearning={handleStartLearning}
        />
      </div>

      <PracticeFooter isReady={isReady} />
    </div>
  )
}
