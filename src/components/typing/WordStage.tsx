'use client'

import React, { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle2, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { WordCardContent } from '@/components/typing/WordCardContent'
import { IpaKeyboard } from '@/components/typing/IpaKeyboard'
import { isShortcutMatch } from '@/lib/shortcuts'

export function WordStage() {
  const router = useRouter()
  const stageRef = useRef<HTMLDivElement>(null)

  const {
    getSurrounding5Words,
    currentInput,
    hasTypo,
    isPeeking,
    mode,
    setMode,
    isTranslationVisible,
    toggleTranslation,
    phoneticPreference,
    currentWordRemainingLoops,
    shortcuts,
    handleCharacterInput,
    handleBackspace,
    peekHint,
    replayAudio,
    nextWord,
    prevWord,
    isUnitFinished,
    restartUnit,
    currentUnitIndex,
    isErrorPracticeActive,
    exitErrorPractice,
    isPhoneticFocused,
    setIsPhoneticFocused,
    dictationPhoneticInput,
    setDictationPhoneticInput,
    submitPhonetic,
  } = useWorkspaceStore()

  const currentWord = getSurrounding5Words()[2]

  // 单元通关烟花庆祝
  useEffect(() => {
    if (isUnitFinished && typeof window !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
  }, [isUnitFinished])

  // 点击外部收起音标键盘
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isPhoneticFocused && stageRef.current && !stageRef.current.contains(e.target as Node)) {
        setIsPhoneticFocused(false)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [isPhoneticFocused, setIsPhoneticFocused])

  // 全局键盘监听中心
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

      // 1. 偷看提示
      if (isShortcutMatch(e, shortcuts.peekHint)) {
        e.preventDefault()
        peekHint(true)
        return
      }

      // 2. 发音朗读
      if (isShortcutMatch(e, shortcuts.replayAudio)) {
        e.preventDefault()
        replayAudio()
        return
      }

      // 3. 上一个词
      if (isShortcutMatch(e, shortcuts.prevWord)) {
        e.preventDefault()
        prevWord()
        return
      }

      // 4. 下一个词
      if (isShortcutMatch(e, shortcuts.nextWord)) {
        e.preventDefault()
        nextWord()
        return
      }

      // 5. 切换中文释义显隐
      if (isShortcutMatch(e, shortcuts.toggleTranslation)) {
        e.preventDefault()
        toggleTranslation()
        return
      }

      // 6. 切换跟学/默写模式
      if (isShortcutMatch(e, shortcuts.toggleMode)) {
        e.preventDefault()
        if (!isErrorPracticeActive) {
          setMode(mode === 'learn' ? 'dictation' : 'learn')
        }
        return
      }

      // 7. 重做本单元
      if (isShortcutMatch(e, shortcuts.restartUnit)) {
        e.preventDefault()
        restartUnit()
        return
      }

      // 退格删除
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
      handleCharacterInput,
      handleBackspace,
      peekHint,
      replayAudio,
      nextWord,
      prevWord,
      toggleTranslation,
      setMode,
      mode,
      restartUnit,
      shortcuts,
      isErrorPracticeActive,
      isUnitFinished,
    ]
  )

  // 松开按键收起提示，实现「按住偷看」
  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (isShortcutMatch(e, shortcuts.peekHint)) {
        peekHint(false)
      }
    },
    [peekHint, shortcuts.peekHint]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  return (
    <div ref={stageRef} className="relative w-full flex-1 min-h-0 flex items-center justify-center gap-6">
      {/* 通关完成结算卡片 */}
      {isUnitFinished ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card w-[520px] p-8 rounded-3xl text-center space-y-6 z-40 border-primary/40 shadow-[0_0_50px_rgb(var(--primary-rgb)/0.25)]"
        >
          <div className="size-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto shadow-[0_0_24px_rgb(var(--primary-rgb)/0.4)]">
            <CheckCircle2 className="size-10" />
          </div>

          {isErrorPracticeActive ? (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">🎉 错词歼灭战圆满胜利！</h2>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">
                恭喜！本次攻坚的所有高频错词均已连续 3 次无误默写通关，肌肉记忆重塑完成，已从错词本中全部消除归档。
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">🎉 恭喜通关第 {currentUnitIndex + 1} 单元！</h2>
              <p className="text-sm text-[#9CA3AF]">
                所有单词均已在默写模式下 100% 正确击键通过，肌肉记忆已牢固建立。
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            {isErrorPracticeActive ? (
              <>
                <button
                  onClick={async () => {
                    await exitErrorPractice()
                    router.push('/errors')
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12] text-sm font-medium transition-all cursor-pointer"
                >
                  <span>返回错词本</span>
                </button>
                <button
                  onClick={async () => {
                    await exitErrorPractice()
                    router.push('/')
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow transition-all cursor-pointer"
                >
                  <span>继续常规章节学习</span>
                  <ArrowRight className="size-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={restartUnit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12] text-sm font-medium transition-all cursor-pointer"
                >
                  <RotateCcw className="size-4 text-accent" />
                  <span>重新复习本单元</span>
                </button>
                <button
                  onClick={() => {
                    restartUnit()
                    useWorkspaceStore.getState().setUnitIndex(currentUnitIndex + 1)
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow transition-all cursor-pointer"
                >
                  <span>下一单元</span>
                  <ArrowRight className="size-4" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      ) : (
        /* 单张活跃词卡 + 两侧切词按钮 + 外部浮动音标键盘 */
        <>
          <button
            onClick={prevWord}
            className="shrink-0 size-10 rounded-full glass-card flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95 transition-all"
            title="上一词 (←)"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="relative flex flex-col items-center">
            <div className="relative w-[640px] h-[520px] rounded-3xl overflow-hidden glass-card border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              {currentWord && (
                <WordCardContent
                  word={currentWord}
                  mode={mode}
                  currentInput={currentInput}
                  hasTypo={hasTypo}
                  isPeeking={isPeeking}
                  isTranslationVisible={isTranslationVisible}
                  phoneticPreference={phoneticPreference}
                  remainingLoops={currentWordRemainingLoops}
                />
              )}
            </div>

            {/* 外部独立浮动 IPA 音标键盘（仅在聚焦音标输入框时从卡片正下方浮现） */}
            {mode === 'dictation' && isPhoneticFocused && (
              <div className="absolute top-[102%] left-1/2 -translate-x-1/2 z-50 pt-1">
                <IpaKeyboard
                  onSelectSymbol={(sym) => setDictationPhoneticInput(dictationPhoneticInput + sym)}
                  onBackspace={() => setDictationPhoneticInput(dictationPhoneticInput.slice(0, -1))}
                  onClear={() => setDictationPhoneticInput('')}
                  onSubmit={() => submitPhonetic()}
                  onClose={() => setIsPhoneticFocused(false)}
                />
              </div>
            )}
          </div>

          <button
            onClick={nextWord}
            className="shrink-0 size-10 rounded-full glass-card flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95 transition-all"
            title="下一词 (→)"
          >
            <ArrowRight className="size-5" />
          </button>
        </>
      )}
    </div>
  )
}
