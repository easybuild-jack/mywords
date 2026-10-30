'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'pwa-install-dismissed-at'
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 关闭后 7 天内不再提示

/**
 * PWA 安装提示浮窗（右下角）
 * 浏览器触发 beforeinstallprompt 时出现，引导用户将应用安装到桌面。
 */
export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
      const inCooldown = Date.now() - dismissedAt < DISMISS_COOLDOWN_MS
      if (inCooldown) return
      setInstallEvent(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    const onInstalled = () => {
      setVisible(false)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') setVisible(false)
    // 用户拒绝弹窗时保留浮窗，但不再主动弹出原生对话框
    setInstallEvent(null)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  // 已在独立窗口（安装后的 App 模式）中运行时不提示
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
    return null
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3 shadow-lg"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="LinguaLoop" className="h-7 w-7 rounded-md" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">安装 LinguaLoop</p>
            <p className="text-xs text-foreground/60">添加到桌面，像本机应用一样启动</p>
          </div>
          <button
            onClick={handleInstall}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-3.5 w-3.5" />
            安装
          </button>
          <button
            onClick={handleDismiss}
            aria-label="关闭安装提示"
            className="shrink-0 rounded-md p-1 text-foreground/40 transition-colors hover:bg-white/5 hover:text-foreground/70"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
