'use client'

import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle2, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { WordCardContent } from '@/components/typing/WordCardContent'

export function WordStage() {
  const {
    getSurrounding5Words,
    currentInput,
    hasTypo,
    isPeeking,
    mode,
    isTranslationVisible,
    phoneticPreference,
    currentWordRemainingLoops,
    handleCharacterInput,
    handleBackspace,
    peekHint,
    replayAudio,
    starCurrentWord,
    nextWord,
    prevWord,
    isUnitFinished,
    restartUnit,
    currentUnitIndex,
  } = useWorkspaceStore()

  const currentWord = getSurrounding5Words()[2]

  // 单元通关烟花庆祝
  useEffect(() => {
    if (isUnitFinished) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34D399', '#FEBC2E', '#6EE7B7', '#ffffff'],
      })
    }
  }, [isUnitFinished])

  // 全局键盘击键监听
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 忽略输入框/模态框中的按键
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        peekHint(true)
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        replayAudio()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        starCurrentWord()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault()
        nextWord()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault()
        prevWord()
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
    [handleCharacterInput, handleBackspace, peekHint, replayAudio, starCurrentWord, nextWord, prevWord]
  )

  // 松开 Tab 收起提示，实现「按住偷看」
  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Tab') peekHint(false)
    },
    [peekHint]
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
    <div className="relative w-full flex-1 min-h-0 flex items-center justify-center gap-6">
      {/* 单元通关完成结算卡片 */}
      {isUnitFinished ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card w-[480px] p-8 rounded-3xl text-center space-y-6 z-40 border-primary/40 shadow-[0_0_50px_rgb(var(--primary-rgb)/0.25)]"
        >
          <div className="size-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto shadow-[0_0_24px_rgb(var(--primary-rgb)/0.4)]">
            <CheckCircle2 className="size-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">🎉 恭喜通关第 {currentUnitIndex + 1} 单元！</h2>
            <p className="text-sm text-[#9CA3AF]">
              所有单词均已在默写模式下 100% 正确击键通过，肌肉记忆已牢固建立。
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={restartUnit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12] text-sm font-medium transition-all"
            >
              <RotateCcw className="size-4 text-accent" />
              <span>重新复习本单元</span>
            </button>
            <button
              onClick={() => {
                restartUnit()
                useWorkspaceStore.getState().setUnitIndex(currentUnitIndex + 1)
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow transition-all"
            >
              <span>下一单元</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </motion.div>
      ) : (
        /* 单张活跃词卡 + 两侧切词按钮 */
        <>
          <button
            onClick={prevWord}
            className="shrink-0 size-10 rounded-full glass-card flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-primary/50 transition-all"
            title="上一词 (Ctrl+←)"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="relative w-[640px] h-[520px]">
            <AnimatePresence mode="wait">
              {currentWord && (
                <motion.div
                  key={currentWord.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute inset-0 overflow-hidden rounded-3xl glass-card border-transparent shadow-[0_0_40px_rgba(0,0,0,0.45)]"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={nextWord}
            className="shrink-0 size-10 rounded-full glass-card flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-primary/50 transition-all"
            title="下一词 (Ctrl+→)"
          >
            <ArrowRight className="size-5" />
          </button>
        </>
      )}
    </div>
  )
}
