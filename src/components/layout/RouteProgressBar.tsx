'use client'

import React, { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useNavigationStore } from '@/store/useNavigationStore'

/**
 * 全局顶部流光路由进度条
 * 严格与全局加载遮罩同步：
 * 点击导航立即起跑，随着页面与数据加载稳步推进，
 * 最终冲刺到 100% 后才允许关闭加载，给予用户稳重、不晃动的高阶视觉反馈。
 */
export function RouteProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isBarVisible = useNavigationStore((s) => s.isBarVisible)
  const progress = useNavigationStore((s) => s.progress)
  const startNavigation = useNavigationStore((s) => s.startNavigation)
  const onRouteChanged = useNavigationStore((s) => s.onRouteChanged)

  // 路由变更时通知加载中心开始收尾冲刺
  useEffect(() => {
    onRouteChanged()
  }, [pathname, searchParams, onRouteChanged])

  // 全局拦截内部链接点击，在路由跳变前瞬间拉起加载，从根源杜绝页面首帧闪烁
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // 排除外链、哈希锚点、新窗口打开及快捷键组合点击
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        anchor.target === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return
      }

      // 如果目标路径与当前完全一致，不触发换页加载
      try {
        const url = new URL(href, window.location.href)
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return
        }
      } catch {
        return
      }

      startNavigation()
    }

    document.addEventListener('click', handleGlobalClick, { capture: true })
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true })
    }
  }, [startNavigation])

  if (!isBarVisible && progress === 0) return null

  // 当 progress === 0 时禁用过渡，防止重置时向左逆行滑回；推进时使用平滑动效
  const progressTransition =
    progress === 0
      ? 'none'
      : progress === 100
      ? 'all 320ms cubic-bezier(0.16, 1, 0.3, 1)'
      : 'all 280ms ease-out'

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-[3.5px] z-[9999] pointer-events-none transition-opacity duration-200 ${
        isBarVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* 流光进度条主体 */}
      <div
        className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary-hover shadow-[0_0_14px_var(--primary)]"
        style={{
          width: `${progress}%`,
          transition: progressTransition,
        }}
      />
      {/* 头部微光光晕核 */}
      <div
        className="absolute top-0 bottom-0 w-32 -ml-32 pointer-events-none blur-[4px] bg-gradient-to-r from-transparent to-primary"
        style={{
          left: `${progress}%`,
          transition: progressTransition,
        }}
      />
    </div>
  )
}

/** 供代码中（如 router.push 前）手动触发进度条的辅助工具函数 */
export function startRouteProgressBar() {
  useNavigationStore.getState().startNavigation()
}

export function completeRouteProgressBar() {
  useNavigationStore.getState().finishNavigation()
}
