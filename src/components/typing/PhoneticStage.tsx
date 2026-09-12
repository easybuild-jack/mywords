'use client'

import React, { useEffect } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { isShortcutMatch, DEFAULT_SHORTCUTS } from '@/lib/shortcuts'
import { PhoneticCard } from '@/components/typing/PhoneticCard'
import { PracticeStageFrame } from '@/components/typing/PracticeStageFrame'
import { UnitCompleteCard } from '@/components/typing/UnitCompleteCard'
import { UnitLoadingSkeleton } from '@/components/typing/UnitLoadingSkeleton'

interface PhoneticStageProps {
  isReady?: boolean
}

/** 默写音标舞台：根据单词与释义默写出音标，点选输入附带键盘辅助 */
export function PhoneticStage({ isReady = true }: PhoneticStageProps) {
  const currentWord = useWorkspaceStore((s) => s.currentLoadedWords[s.activeWordIndex])
  const isUnitLoading = useWorkspaceStore((s) => s.isUnitLoading)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const currentWordRemainingLoops = useWorkspaceStore((s) => s.currentWordRemainingLoops)
  const isUnitFinished = useWorkspaceStore((s) => s.isUnitFinished)
  const shortcuts = useWorkspaceStore((s) => s.shortcuts)

  const submitPhoneticDictation = useWorkspaceStore((s) => s.submitPhoneticDictation)
  const backspacePhonetic = useWorkspaceStore((s) => s.backspacePhonetic)
  const replayAudio = useWorkspaceStore((s) => s.replayAudio)
  const nextWord = useWorkspaceStore((s) => s.nextWord)
  const prevWord = useWorkspaceStore((s) => s.prevWord)
  const restartUnit = useWorkspaceStore((s) => s.restartUnit)
  const peekHint = useWorkspaceStore((s) => s.peekHint)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUnitFinished) return

      // 忽略原生输入框内部击键
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      if (isShortcutMatch(e, shortcuts?.peekHint || DEFAULT_SHORTCUTS.peekHint)) {
        e.preventDefault()
        peekHint(true)
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        submitPhoneticDictation()
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        backspacePhonetic()
        return
      }

      if (isShortcutMatch(e, shortcuts?.replayAudio || DEFAULT_SHORTCUTS.replayAudio)) {
        e.preventDefault()
        replayAudio()
        return
      }

      if (isShortcutMatch(e, shortcuts.prevWord)) {
        e.preventDefault()
        prevWord()
        return
      }

      if (isShortcutMatch(e, shortcuts.nextWord)) {
        e.preventDefault()
        nextWord()
        return
      }

      if (isShortcutMatch(e, shortcuts.restartUnit)) {
        e.preventDefault()
        restartUnit()
        return
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isShortcutMatch(e, shortcuts?.peekHint || DEFAULT_SHORTCUTS.peekHint)) {
        peekHint(false)
      }
    }

    const handleBlur = () => {
      peekHint(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      peekHint(false)
    }
  }, [
    isUnitFinished,
    shortcuts,
    peekHint,
    submitPhoneticDictation,
    backspacePhonetic,
    replayAudio,
    prevWord,
    nextWord,
    restartUnit,
  ])

  return (
    <div className="relative w-full flex-1 min-h-0 flex items-center justify-center gap-6">
      {isUnitFinished ? (
        <UnitCompleteCard />
      ) : (
        <PracticeStageFrame>
          {!isReady || isUnitLoading || !currentWord ? (
            <UnitLoadingSkeleton />
          ) : (
            <PhoneticCard
              word={currentWord}
              phoneticPreference={phoneticPreference}
              remainingLoops={currentWordRemainingLoops}
            />
          )}
        </PracticeStageFrame>
      )}
    </div>
  )
}
