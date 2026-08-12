'use client'

import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle2, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { WordCardContent } from '@/components/typing/WordCardContent'

export function Card3DCarousel() {
  const {
    getSurrounding5Words,
    currentInput,
    hasTypo,
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

  const words = getSurrounding5Words()
  const currentWord = words[2]

  // 单元通关烟花庆祝
  useEffect(() => {
    if (isUnitFinished) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00FF88', '#FEBC2E', '#3aff9f', '#ffffff'],
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

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 5 张卡片 3D 透视参数配置
  const cardTransforms = [
    // Left 2 (已学前前词)
    { x: -440, z: -240, rotateY: 42, scale: 0.74, blur: 'blur(5px)', opacity: 0.35, zIndex: 10 },
    // Left 1 (已学前一词)
    { x: -230, z: -120, rotateY: 26, scale: 0.88, blur: 'blur(2.5px)', opacity: 0.7, zIndex: 20 },
    // Center (当前活跃中心词)
    { x: 0, z: 0, rotateY: 0, scale: 1.0, blur: 'blur(0px)', opacity: 1.0, zIndex: 30 },
    // Right 1 (即将到来的下一词)
    { x: 230, z: -120, rotateY: -26, scale: 0.88, blur: 'blur(2.5px)', opacity: 0.7, zIndex: 20 },
    // Right 2 (后后词)
    { x: 440, z: -240, rotateY: -42, scale: 0.74, blur: 'blur(5px)', opacity: 0.35, zIndex: 10 },
  ]

  return (
    <div className="relative w-full max-w-5xl h-[460px] flex items-center justify-center perspective-container overflow-visible my-auto">
      {/* 单元通关完成结算卡片 */}
      {isUnitFinished ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card w-[480px] p-8 rounded-3xl text-center space-y-6 z-40 border-primary/40 shadow-[0_0_50px_rgba(0,255,136,0.25)]"
        >
          <div className="size-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(0,255,136,0.4)]">
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
        /* 3D 5 张卡片空间层叠展示 */
        <div className="relative w-[440px] h-[390px] flex items-center justify-center preserve-3d">
          {words.map((word, index) => {
            if (!word) return null
            const transform = cardTransforms[index]
            const isCenter = index === 2

            return (
              <motion.div
                key={`${word.id}-${index}`}
                layout
                initial={false}
                animate={{
                  x: transform.x,
                  z: transform.z,
                  rotateY: transform.rotateY,
                  scale: transform.scale,
                  opacity: transform.opacity,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 28,
                }}
                style={{
                  filter: transform.blur,
                  zIndex: transform.zIndex,
                }}
                className={`absolute inset-0 w-full h-full rounded-3xl transition-colors duration-200 cursor-pointer ${
                  isCenter
                    ? 'glass-card border-primary/30 shadow-[0_0_40px_rgba(0,255,136,0.15)] ring-1 ring-primary/20'
                    : 'glass-panel border-white/5 opacity-80'
                }`}
                onClick={() => {
                  if (index < 2) prevWord()
                  if (index > 2) nextWord()
                }}
              >
                <WordCardContent
                  word={word}
                  isCenter={isCenter}
                  mode={mode}
                  currentInput={isCenter ? currentInput : ''}
                  hasTypo={isCenter ? hasTypo : false}
                  isTranslationVisible={isTranslationVisible}
                  phoneticPreference={phoneticPreference}
                  remainingLoops={isCenter ? currentWordRemainingLoops : 1}
                />
              </motion.div>
            )
          })}
        </div>
      )}

      {/* 左右切词快捷按钮 */}
      <button
        onClick={prevWord}
        className="absolute -left-12 top-1/2 -translate-y-1/2 size-10 rounded-full glass-card flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-primary/50 transition-all z-40"
        title="上一词 (Ctrl+←)"
      >
        <ArrowLeft className="size-5" />
      </button>

      <button
        onClick={nextWord}
        className="absolute -right-12 top-1/2 -translate-y-1/2 size-10 rounded-full glass-card flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-primary/50 transition-all z-40"
        title="下一词 (Ctrl+→)"
      >
        <ArrowRight className="size-5" />
      </button>
    </div>
  )
}
