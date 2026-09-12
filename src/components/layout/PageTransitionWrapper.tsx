'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
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

  return (
    <div className="flex-1 min-h-full flex flex-col justify-between relative">
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
            <div className="glass-card px-8 py-6 rounded-3xl border border-border shadow-[0_24px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.8)] flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="size-11 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="size-4.5 text-primary absolute animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-foreground text-sm font-semibold tracking-wide">
                  正在同步页面与词库数据...
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  编排音节切分 · 构词释义 · 练习进度
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 真实页面内容：稳态渲染在底层，等遮罩淡出后已完全就绪 */}
      <div className="flex-1 min-h-full flex flex-col justify-between relative">
        {children}
      </div>
    </div>
  )
}
