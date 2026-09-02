'use client'

import { useCallback, useEffect } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { isShortcutMatch, DEFAULT_SHORTCUTS } from '@/lib/shortcuts'

interface UseTypingKeyboardOptions {
  /** 学习页的单词本来就摆在眼前，偷看没有意义，只有默写页需要 */
  enablePeek?: boolean
}

/**
 * 练习页面共用的全局键盘中枢：快捷键分发、退格、逐字符输入。
 *
 * 学习页与默写页都依赖这套逻辑，包括「按住 Tab 偷看、松手收起」的 keydown/keyup 配对，
 * 因此只能有一份实现，否则两个页面的键盘行为会随时间漂移。
 */
export function useTypingKeyboard({ enablePeek = false }: UseTypingKeyboardOptions = {}) {
  const shortcuts = useWorkspaceStore((s) => s.shortcuts)
  const isUnitFinished = useWorkspaceStore((s) => s.isUnitFinished)
  const handleCharacterInput = useWorkspaceStore((s) => s.handleCharacterInput)
  const handleBackspace = useWorkspaceStore((s) => s.handleBackspace)
  const peekHint = useWorkspaceStore((s) => s.peekHint)
  const replayAudio = useWorkspaceStore((s) => s.replayAudio)
  const nextWord = useWorkspaceStore((s) => s.nextWord)
  const prevWord = useWorkspaceStore((s) => s.prevWord)
  const restartUnit = useWorkspaceStore((s) => s.restartUnit)
  const toggleCurrentWordSplit = useWorkspaceStore((s) => s.toggleCurrentWordSplit)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isUnitFinished) return

      // 忽略输入框/下拉框/模态框中的按键，否则方向键会同时改选项和切词
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      if (enablePeek && isShortcutMatch(e, shortcuts?.peekHint || DEFAULT_SHORTCUTS.peekHint)) {
        e.preventDefault()
        peekHint(true)
        return
      }

      if (isShortcutMatch(e, shortcuts?.replayAudio || DEFAULT_SHORTCUTS.replayAudio)) {
        e.preventDefault()
        replayAudio()
        return
      }

      if (isShortcutMatch(e, shortcuts?.toggleSplit || DEFAULT_SHORTCUTS.toggleSplit)) {
        e.preventDefault()
        toggleCurrentWordSplit()
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

      if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
        return
      }

      // 允许敲击英文单字符与常见字符
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        handleCharacterInput(e.key)
      }
    },
    [
      enablePeek,
      isUnitFinished,
      shortcuts,
      peekHint,
      replayAudio,
      prevWord,
      nextWord,
      restartUnit,
      toggleCurrentWordSplit,
      handleBackspace,
      handleCharacterInput,
    ]
  )

  // 松开按键收起提示，实现「按住偷看」
  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (enablePeek && isShortcutMatch(e, shortcuts.peekHint)) {
        peekHint(false)
      }
    },
    [enablePeek, peekHint, shortcuts.peekHint]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])
}
