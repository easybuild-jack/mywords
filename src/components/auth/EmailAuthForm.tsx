'use client'

import React, { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EyeState } from './LookingWordmark'

export type EmailAuthMode = 'login' | 'register'

interface EmailAuthFormProps {
  mode: EmailAuthMode
  onModeChange: (mode: EmailAuthMode) => void
  /** 某个输入框获得焦点时通知字标：看向哪里、眼睛什么状态 */
  onGaze: (target: HTMLElement | null, eyeState: EyeState) => void
}

const RESEND_SECONDS = 60

const inputClass =
  'h-10 w-full px-3 rounded-md border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors'
const labelClass = 'block text-xs text-muted-foreground'

/**
 * 邮箱登录 / 注册表单（同页切换）。
 * 登录：邮箱 + 密码；注册：邮箱 + 邮箱验证码 + 密码。
 * 目前仅为静态页面，提交与发送验证码尚未接入接口。
 */
export function EmailAuthForm({ mode, onModeChange, onGaze }: EmailAuthFormProps) {
  const isRegister = mode === 'register'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((n) => n - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  const passwordEyeState: EyeState = showPassword ? 'peek' : 'closed'

  const handleSendCode = () => {
    // TODO: 接入发送邮箱验证码接口
    setCountdown(RESEND_SECONDS)
  }

  const handleTogglePassword = () => {
    const next = !showPassword
    setShowPassword(next)
    const input = document.getElementById('auth-password')
    input?.focus()
    onGaze(input, next ? 'peek' : 'closed')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 接入登录 / 注册接口
  }

  const handleBlur = () => onGaze(null, 'open')

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="auth-email" className={cn(labelClass, 'mb-1.5')}>
          邮箱
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={(e) => onGaze(e.currentTarget, 'open')}
          onBlur={handleBlur}
          className={inputClass}
        />
      </div>

      {isRegister && (
        <div>
          <label htmlFor="auth-code" className={cn(labelClass, 'mb-1.5')}>
            验证码
          </label>
          <div className="flex gap-2">
            <input
              id="auth-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6 位数字"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onFocus={(e) => onGaze(e.currentTarget, 'open')}
              onBlur={handleBlur}
              className={cn(inputClass, 'tracking-[0.3em]')}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0}
              className="h-10 px-3 shrink-0 rounded-md border border-border text-[13px] text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent whitespace-nowrap transition-colors cursor-pointer"
            >
              {countdown > 0 ? `${countdown} 秒后重发` : '发送验证码'}
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="auth-password" className={labelClass}>
            密码
          </label>
          {!isRegister && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              忘记密码
            </button>
          )}
        </div>
        <div className="relative">
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder={isRegister ? '设置登录密码' : '请输入密码'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={(e) => onGaze(e.currentTarget, passwordEyeState)}
            onBlur={handleBlur}
            className={cn(inputClass, 'pr-10')}
          />
          <button
            type="button"
            // 阻止按钮抢走焦点，避免密码框 blur 导致眼睛先睁开再闭上
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleTogglePassword}
            title={showPassword ? '隐藏密码' : '显示密码'}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        </div>
        {isRegister && <p className="mt-1.5 text-xs text-muted-foreground">至少 8 位，需包含字母和数字</p>}
      </div>

      <button
        type="submit"
        className="!mt-6 w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors cursor-pointer"
      >
        {isRegister ? '注册并登录' : '登录'}
      </button>

      <p className="text-center text-[13px] text-muted-foreground">
        {isRegister ? '已有账号？' : '还没有账号？'}
        <button
          type="button"
          onClick={() => onModeChange(isRegister ? 'login' : 'register')}
          className="font-medium text-foreground hover:underline underline-offset-2 cursor-pointer"
        >
          {isRegister ? '登录' : '注册'}
        </button>
      </p>
    </form>
  )
}

