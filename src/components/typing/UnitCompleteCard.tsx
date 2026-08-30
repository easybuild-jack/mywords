'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle2, RotateCcw, ArrowRight, BookOpen } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/** 学习页与默写页共用的通关结算卡片，文案按当前场景切换 */
export function UnitCompleteCard() {
  const router = useRouter()
  const primaryActionRef = React.useRef<HTMLButtonElement>(null)

  const {
    mode,
    currentBook,
    unitSize,
    currentUnitIndex,
    isErrorPracticeActive,
    restartUnit,
    exitErrorPractice,
    setUnitIndex,
  } = useWorkspaceStore()

  const totalWords = currentBook?.words?.length || currentBook?.totalWords || 0
  const effectiveUnitSize = unitSize || currentBook?.unitSize || 20
  const totalUnits = Math.max(1, Math.ceil(totalWords / effectiveUnitSize))
  const hasNextUnit = !isErrorPracticeActive && currentUnitIndex + 1 < totalUnits

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
  }, [])

  // 单元完成后自动聚焦主动作按钮（有下一单元则聚焦“下一单元”，最后一单元则聚焦“返回词库”）
  React.useEffect(() => {
    const timer = setTimeout(() => {
      primaryActionRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [hasNextUnit, isErrorPracticeActive])

  // 监听确认键 (Enter)，直接执行主动作
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在弹窗或其他输入框存在时触发
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault()
        if (isErrorPracticeActive) {
          exitErrorPractice().then(() => router.push('/dictation'))
        } else if (hasNextUnit) {
          setUnitIndex(currentUnitIndex + 1)
        } else {
          router.push('/books')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isErrorPracticeActive, hasNextUnit, currentUnitIndex, exitErrorPractice, router, setUnitIndex])

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
              ? (hasNextUnit ? '本单元所有单词均已跟学拼读完成，按 Enter 键可直接进入下一单元。' : '恭喜！本词书所有单元已全部学习完毕。')
              : (hasNextUnit ? '所有单词均已在默写模式下 100% 正确击键通过，按 Enter 键可直接进入下一单元。' : '恭喜！本词书所有单元已全部默写通关。')}
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
              ref={primaryActionRef}
              onClick={async () => {
                await exitErrorPractice()
                router.push('/dictation')
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
            >
              <span>继续常规章节默写</span>
              <span className="text-[10px] opacity-75 font-mono bg-black/20 px-1.5 py-0.5 rounded">Enter ↵</span>
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
              <span>重做本单元</span>
            </button>

            {mode === 'learn' && (
              <button
                onClick={() => router.push('/dictation')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-all cursor-pointer"
              >
                <span>去默写检验</span>
              </button>
            )}

            {hasNextUnit ? (
              <button
                ref={primaryActionRef}
                onClick={() => setUnitIndex(currentUnitIndex + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
              >
                <span>下一单元</span>
                <span className="text-[10px] opacity-75 font-mono bg-black/20 px-1.5 py-0.5 rounded">Enter ↵</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                ref={primaryActionRef}
                onClick={() => router.push('/books')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background"
              >
                <BookOpen className="size-4" />
                <span>返回词库</span>
                <span className="text-[10px] opacity-75 font-mono bg-black/20 px-1.5 py-0.5 rounded">Enter ↵</span>
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
