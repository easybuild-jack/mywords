'use client'

import React from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useNavigationStore } from '@/store/useNavigationStore'

/**
 * 页面平滑过渡与遮罩容器
 * 严格遵从：
 * 1. 换页前拉起加载遮罩，完全遮蔽底层 DOM 重绘与数据回显，杜绝页面闪烁抖动；
 * 2. 只有等顶部流光进度条彻底走到 100% 并完成时，加载遮罩才平滑揭开；
 * 3. 展现已经完全稳定就绪的页面数据。
 */
export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const isLoading = useNavigationStore((s) => s.isLoading)

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between h-full relative">
      {/* 全景实底防抖遮罩：
          - 实底深黑 bg-[#0B0C0E]（100% 不透光），彻底隔绝底层 DOM 销毁与页面删刷重绘
          - 换页启动瞬间立即盖住（transition-none），杜绝第 0 帧闪白或组件闪烁
          - 严格遵照：只有在顶部流光进度条彻底走完 100% 并稳态停留后，才以 300ms 平滑淡出揭开完全就绪的页面
      */}
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center bg-[#0B0C0E] select-none ${
          isLoading
            ? 'opacity-100 pointer-events-auto transition-none'
            : 'opacity-0 pointer-events-none transition-opacity duration-300 ease-out'
        }`}
        aria-hidden={!isLoading}
      >
        <div className="glass-card px-8 py-6 rounded-3xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.8)] flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="size-11 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="size-4.5 text-primary absolute animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-white text-sm font-semibold tracking-wide">
              正在同步页面与词库数据...
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              编排音节切分 · 构词释义 · 练习进度
            </span>
          </div>
        </div>
      </div>

      {/* 真实页面内容：稳态渲染在底层，等遮罩淡出后已完全就绪 */}
      <div className="flex-1 min-h-0 flex flex-col justify-between h-full relative">
        {children}
      </div>
    </div>
  )
}
