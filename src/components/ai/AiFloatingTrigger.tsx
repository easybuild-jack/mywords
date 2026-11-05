'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'
import { isChromelessRoute } from '@/lib/chromelessRoutes'

export function AiFloatingTrigger() {
  const { isOpen, toggleDrawer } = useAiAssistantStore()
  const pathname = usePathname()

  // 登录页等独立页面不展示 AI 悬浮入口
  if (isChromelessRoute(pathname)) return null

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
      <AnimatePresence initial={false}>
        {!isOpen && (
          <motion.button
            key="ai-floating-trigger"
            onClick={toggleDrawer}
            initial={{ x: '100%', opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
              transition: {
                type: 'spring',
                stiffness: 420,
                damping: 32,
                mass: 0.75,
                delay: 0.08,
              },
            }}
            exit={{
              x: '100%',
              opacity: 0,
              transition: {
                duration: 0.18,
                ease: [0.32, 0.72, 0, 1],
              },
            }}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.94 }}
            className="pointer-events-auto group flex items-center justify-center w-12 h-12 rounded-l-xl bg-card/95 backdrop-blur-md hover:bg-muted border border-r-0 border-border shadow-[0_8px_24px_-6px_rgba(0,0,0,0.28)] p-1.5 transition-colors duration-200 cursor-pointer"
            aria-label="打开 LinguaLoop Copilot"
          >
            <img
              src="/logo222.png"
              alt="LinguaLoop Copilot"
              className="size-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.34,1.4,0.64,1)] group-hover:rotate-[360deg] group-hover:scale-110"
            />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
