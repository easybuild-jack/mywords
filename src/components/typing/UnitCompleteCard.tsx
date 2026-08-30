'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/** 学习页与默写页共用的通关结算卡片，文案按当前场景切换 */
export function UnitCompleteCard() {
  const router = useRouter()

  const restartButtonRef = React.useRef<HTMLButtonElement>(null)
  const dictationButtonRef = React.useRef<HTMLButtonElement>(null)
  const nextButtonRef = React.useRef<HTMLButtonElement>(null)
  const exitToErrorsButtonRef = React.useRef<HTMLButtonElement>(null)

  const {
    mode,
    currentUnitIndex,
    isErrorPracticeActive,
    restartUnit,
    exitErrorPractice,
    setUnitIndex,
  } = useWorkspaceStore()

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
  }, [])

  // 按当前模式组装按钮引用数组，供键盘左右切换时定位
  const buttonRefs = React.useMemo(() => {
    if (isErrorPracticeActive) {
      return [exitToErrorsButtonRef, nextButtonRef]
    }
    const refs: React.RefObject<HTMLButtonElement | null>[] = [restartButtonRef]
    if (mode === 'learn') refs.push(dictationButtonRef)
    refs.push(nextButtonRef)
    return refs
  }, [isErrorPracticeActive, mode])

  // 单元完成后自动聚焦主按钮（下一单元 / 继续常规章节默写）
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // 默认聚焦最后一个（主按钮）；左右键后续会从这里开始切换
      const lastRef = buttonRefs[buttonRefs.length - 1]
      lastRef?.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
    // buttonRefs 由 mode/error 派生，挂载时聚焦即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isErrorPracticeActive, mode])

  // 左右键在按钮组里循环切换焦点；Enter 走原生按钮 onClick，所以这里不重复绑 Enter
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

      e.preventDefault()
      const active = document.activeElement as HTMLElement | null
      const currentIndex = buttonRefs.findIndex((ref) => ref.current === active)
      // 没有按钮处于焦点（例如刚打开结算卡）→ 把焦点放到最后一个（主按钮）
      if (currentIndex === -1) {
        buttonRefs[buttonRefs.length - 1]?.current?.focus()
        return
      }
      const delta = e.key === 'ArrowRight' ? 1 : -1
      const newIndex = (currentIndex + delta + buttonRefs.length) % buttonRefs.length
      buttonRefs[newIndex]?.current?.focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [buttonRefs])

  // 几个按钮共用的 focus 描边样式 —— 让左右键切换时每个按钮都能看见焦点
  const baseFocusRing =
    'focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background'

  return (
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
          <h2 className="text-2xl font-bold text-white">🎉 恭喜完成第 {currentUnitIndex + 1} 单元！</h2>
          <p className="text-sm text-[#9CA3AF]">
            {mode === 'learn'
              ? '本单元所有单词均已跟学拼读完成，接下来可以到默写页检验记忆。'
              : '所有单词均已在默写模式下 100% 正确击键通过，肌肉记忆已牢固建立。'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        {isErrorPracticeActive ? (
          <>
            <button
              ref={exitToErrorsButtonRef}
              onClick={async () => {
                await exitErrorPractice()
                router.push('/errors')
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12] text-sm font-medium transition-all cursor-pointer ${baseFocusRing}`}
            >
              <span>返回错词本</span>
            </button>
            <button
              ref={nextButtonRef}
              onClick={async () => {
                await exitErrorPractice()
                router.push('/dictation')
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer ${baseFocusRing}`}
            >
              <span>继续常规章节默写</span>
              <ArrowRight className="size-4" />
            </button>
          </>
        ) : (
          <>
            <button
              ref={restartButtonRef}
              onClick={restartUnit}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12] text-sm font-medium transition-all cursor-pointer ${baseFocusRing}`}
            >
              <RotateCcw className="size-4 text-accent" />
              <span>重做本单元</span>
            </button>

            {mode === 'learn' && (
              <button
                ref={dictationButtonRef}
                onClick={() => router.push('/dictation')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-all cursor-pointer ${baseFocusRing}`}
              >
                <span>去默写检验</span>
              </button>
            )}

            <button
              ref={nextButtonRef}
              onClick={() => setUnitIndex(currentUnitIndex + 1)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer ${baseFocusRing}`}
            >
              <span>下一单元</span>
              <ArrowRight className="size-4" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
