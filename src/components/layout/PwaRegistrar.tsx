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
      // 开发环境主动注销 Service Worker 并清空旧缓存，防止 Turbopack 动态编译的静态 chunk 被强缓存导致模块缺失报错
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister()
        }
      })
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key)
          }
        })
      }
    }
  }, [])

  return null
}
