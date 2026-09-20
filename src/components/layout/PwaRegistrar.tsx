'use client'

import { useEffect } from 'react'

/**
 * Service Worker 注册器（无 UI）
 * 在浏览器支持时注册 /sw.js，使应用满足 PWA 可安装条件并具备离线能力。
 */
export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // 生产环境立即注册；开发环境延迟到页面完全空闲后再注册，
    // 避免干扰 Next.js 热更新（HMR 请求本身已在 SW 中放行）。
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('[PWA] Service Worker 注册失败:', err))
    }

    if (process.env.NODE_ENV === 'production') {
      register()
    } else {
      const idle =
        typeof window.requestIdleCallback === 'function'
          ? window.requestIdleCallback
          : (cb: () => void) => window.setTimeout(cb, 2000)
      idle(() => register())
    }
  }, [])

  return null
}
