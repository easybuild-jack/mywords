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
                router.push('/dictation')
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow transition-all cursor-pointer"
            >
              <span>继续常规章节默写</span>
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

            <button
              onClick={() => setUnitIndex(currentUnitIndex + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold btn-neon-glow transition-all cursor-pointer"
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
