'use client'

import React, { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SkinPicker } from '@/components/layout/SkinPicker'
import { LookingWordmark, type EyeState } from './LookingWordmark'
import { WechatQrPanel } from './WechatQrPanel'
import { EmailAuthForm, type EmailAuthMode } from './EmailAuthForm'

type AuthTab = 'wechat' | 'email'

const TABS: { id: AuthTab; label: string }[] = [
  { id: 'wechat', label: '微信扫码' },
  { id: 'email', label: '邮箱' },
]

/**
 * 登录 / 注册页：微信扫码 + 邮箱（登录用密码，注册用验证码 + 密码）。
 * 字标里的两只眼睛会看向当前操作的区域。
 */
export function LoginView() {
  const [tab, setTab] = useState<AuthTab>('wechat')
  const [emailMode, setEmailMode] = useState<EmailAuthMode>('login')
  const [gazeTarget, setGazeTarget] = useState<HTMLElement | null>(null)
  const [eyeState, setEyeState] = useState<EyeState>('open')

  // 二维码挂载后让眼睛盯着它
  const qrCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setGazeTarget(node)
  }, [])

  const handleGaze = useCallback((target: HTMLElement | null, state: EyeState) => {
    setGazeTarget(target)
    setEyeState(state)
  }, [])

  const switchTab = (next: AuthTab) => {
    setTab(next)
    setEyeState('open')
    setGazeTarget(null)
  }

  const subtitle =
    tab === 'email' && emailMode === 'register'
      ? '用邮箱创建账号，之后可在任意设备同步'
      : '登录后同步词库、生错词本和学习进度'

  return (
    <div className="flex-1 min-h-full flex flex-col text-foreground">
      <header className="flex items-center justify-between px-6 h-14 shrink-0">
        <img src="/logo111.png" alt="LinguaLoop" className="size-7 object-contain" />
        <div className="flex items-center gap-3">
          <Link
            href="/learn"
            className="text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            跳过，继续本地使用
            <ArrowRight className="size-3.5" />
          </Link>
          <SkinPicker />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[360px]">
          <LookingWordmark gazeTarget={gazeTarget} eyeState={eyeState} className="text-center" />
          <p className="mt-3 text-center text-[13px] text-muted-foreground">{subtitle}</p>

          <div role="tablist" className="mt-9 flex gap-6 border-b border-border">
            {TABS.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchTab(item.id)}
                  className={cn(
                    'relative h-9 text-sm transition-colors cursor-pointer',
                    active
                      ? 'text-foreground font-medium after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="pt-7">
            {tab === 'wechat' ? (
              <WechatQrPanel ref={qrCallbackRef} />
            ) : (
              <EmailAuthForm mode={emailMode} onModeChange={setEmailMode} onGaze={handleGaze} />
            )}
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            继续即表示同意{' '}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
              用户协议
            </a>{' '}
            和{' '}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
              隐私政策
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
