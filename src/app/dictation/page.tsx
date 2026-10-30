'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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

  // 是否已进入流程：
  // 1. 从词库选章、从学习完成卡片「去默写检验」、生错词攻坚等直达：直接开始 (hasStarted = true)，无需开始过渡层；
  // 2. 从菜单点击进入：需要「开始默写」过渡层 (hasStarted = false)，防止切页自动发音突兀。
  const [hasStarted, setHasStarted] = useState(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('mywords_auto_start_dictation') === 'true') {
        return true
      }
    }
    return Boolean(useWorkspaceStore.getState().shouldAutoStartDictation)
  })

  // 记录初次挂载时是否判定为自动开始
  const isAutoStartedRef = useRef(hasStarted)

  // 在副作用中清理自动开始标记（绝不能在 useState / render 阶段调用 setState，防止破坏 React 渲染纯度）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mywords_auto_start_dictation')
    }
    if (useWorkspaceStore.getState().shouldAutoStartDictation) {
      useWorkspaceStore.setState({ shouldAutoStartDictation: false })
    }
  }, [])

  const enterMode = useWorkspaceStore((s) => s.enterMode)
  const loadCurrentUnitWords = useWorkspaceStore((s) => s.loadCurrentUnitWords)
  const playDictationCue = useWorkspaceStore((s) => s.playDictationCue)

  // 错词攻坚同样落在本页，此时 enterMode 会保留攻坚现场与它自己的词表。
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

        // 仅在直达场景（isAutoStartedRef.current = true）在就绪后立即发音；
        // 从菜单点击切入时保留未开始状态，等待用户点击「开始默写」按钮后再播报，避免切页突兀！
        if (isAutoStartedRef.current) {
          playDictationCue()
        }
      } finally {
        if (!cancelled) setIsReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enterMode, loadCurrentUnitWords, playDictationCue])

  // 用户点击「开始默写」或按空格/回车进入流程
  const handleStartDictation = useCallback(() => {
    setHasStarted(true)
    playDictationCue()
  }, [playDictationCue])

  return (
    <div className="flex-1 min-h-full flex flex-col justify-between relative pb-1">
      <HeaderToolbar />

      <div className="flex-1 flex items-center justify-center relative w-full px-4 py-2 my-auto shrink-0">
        <DictationStage
          isReady={isReady}
          hasStarted={hasStarted}
          onStartDictation={handleStartDictation}
        />
      </div>

      <PracticeFooter showPeekHint isReady={isReady} />
    </div>
  )
}
