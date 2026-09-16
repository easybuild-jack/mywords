'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigationStore } from '@/store/useNavigationStore'

/**
 * 页面平滑过渡与加载遮罩
 * 核心优化：
 * 1. 采用 fixed 定位固定在右侧主视口，彻底隔离 <main> 内部滚动条变化与 scrollTop 瞬移导致的卡片位移与抖动；
 * 2. 采用 Framer Motion AnimatePresence 驱动关闭退场动画，实现 60/120fps 硬件加速的微缩放（scale 1 -> 0.96）与透明度淡出；
 * 3. 避免在渐隐层内部使用 backdrop-filter，杜绝 GPU 合成重绘频闪，带来极致丝滑的离场体验。
 */
export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const isLoading = useNavigationStore((s) => s.isLoading)
  const loadingText = useNavigationStore((s) => s.loadingText) || '数据加载中...'

  return (
    <div className="flex-1 min-h-full flex flex-col relative">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="page-loading-veil"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.28, ease: 'easeOut' },
            }}
            className="fixed top-0 bottom-0 left-0 md:left-64 right-0 z-50 flex items-center justify-center select-none pointer-events-auto"
            style={{ backgroundColor: 'var(--background)', willChange: 'opacity' }}
          >
            <div className="px-10 py-7 rounded-2xl bg-sidebar border border-white/10 shadow-2xl shadow-black/30 flex flex-col items-center gap-4.5 min-w-[180px]">
              <div className="relative flex items-center justify-center">
                <div className="size-16 rounded-full border-[2.5px] border-primary/20 border-t-primary animate-spin" />
                <img
                  src="/logo111.png"
                  alt="MyWords"
                  className="size-9 object-contain absolute animate-pulse select-none pointer-events-none"
                />
              </div>
              <span className="text-foreground text-[15px] font-semibold tracking-wide">
                {loadingText}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 真实页面内容：稳态渲染在底层，等遮罩淡出后已完全就绪 */}
      <div className="flex-1 min-h-full flex flex-col relative">
        {children}
      </div>
    </div>
  )
}
