'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type EyeState = 'open' | 'closed' | 'peek'

interface LookingWordmarkProps {
  /** 眼睛注视的元素：输入框时看向光标位置，其他元素看向中心；为空时跟随鼠标 */
  gazeTarget: HTMLElement | null
  /** open 睁眼；closed 闭眼（输入密码）；peek 右眼眯缝偷看（显示明文密码） */
  eyeState: EyeState
  className?: string
}

const BLINK_INTERVAL = 4200
const BLINK_DURATION = 160
/** 输入框左内边距，需与表单输入框的 px-3 保持一致 */
const INPUT_PADDING_X = 12

let measureCanvas: HTMLCanvasElement | null = null

/** 估算输入框光标所在的屏幕坐标：左内边距 + 已输入文本宽度 */
function getCaretPoint(input: HTMLInputElement): [number, number] {
  const rect = input.getBoundingClientRect()
  measureCanvas ??= document.createElement('canvas')
  const ctx = measureCanvas.getContext('2d')
  let textWidth = 0
  if (ctx) {
    ctx.font = getComputedStyle(input).font
    const text = input.type === 'password' ? '•'.repeat(input.value.length) : input.value
    textWidth = ctx.measureText(text).width
  }
  const x = rect.left + INPUT_PADDING_X + Math.min(textWidth, rect.width - INPUT_PADDING_X * 2)
  return [x, rect.top + rect.height / 2]
}

/**
 * 登录页字标 LinguaLoop：把 "Loop" 里的两个 o 做成眼睛，
 * 瞳孔会看向当前输入框的光标，输入密码时闭眼。
 */
export function LookingWordmark({ gazeTarget, eyeState, className }: LookingWordmarkProps) {
  const leftEyeRef = useRef<HTMLSpanElement>(null)
  const rightEyeRef = useRef<HTMLSpanElement>(null)
  const leftPupilRef = useRef<HTMLSpanElement>(null)
  const rightPupilRef = useRef<HTMLSpanElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const [blinking, setBlinking] = useState(false)

  const lookAt = useCallback((x: number, y: number) => {
    const pairs = [
      [leftEyeRef.current, leftPupilRef.current],
      [rightEyeRef.current, rightPupilRef.current],
    ] as const
    for (const [eye, pupil] of pairs) {
      if (!eye || !pupil) continue
      const rect = eye.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const angle = Math.atan2(y - cy, x - cx)
      const distance = Math.min(rect.width * 0.2, Math.hypot(x - cx, y - cy) / 12)
      pupil.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`
    }
  }, [])

  const update = useCallback(() => {
    if (gazeTarget instanceof HTMLInputElement) {
      lookAt(...getCaretPoint(gazeTarget))
    } else if (gazeTarget) {
      const rect = gazeTarget.getBoundingClientRect()
      lookAt(rect.left + rect.width / 2, rect.top + rect.height / 2)
    } else if (mouseRef.current) {
      lookAt(mouseRef.current.x, mouseRef.current.y)
    }
  }, [gazeTarget, lookAt])

  // 注视目标变化、输入内容变化、窗口变化时重新计算视线
  useEffect(() => {
    update()
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      if (!gazeTarget) update()
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', update)
    gazeTarget?.addEventListener('input', update)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', update)
      gazeTarget?.removeEventListener('input', update)
    }
  }, [gazeTarget, update])

  // 闭眼 / 眯眼的过渡结束后瞳孔位置会变，延迟再校准一次
  useEffect(() => {
    const timer = window.setTimeout(update, 180)
    return () => window.clearTimeout(timer)
  }, [eyeState, update])

  // 睁眼状态下定时眨眼
  useEffect(() => {
    if (eyeState !== 'open') return
    let resetTimer: number | undefined
    const timer = window.setInterval(() => {
      setBlinking(true)
      resetTimer = window.setTimeout(() => setBlinking(false), BLINK_DURATION)
    }, BLINK_INTERVAL)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(resetTimer)
    }
  }, [eyeState])

  const leftClosed = blinking || eyeState !== 'open'
  const rightClosed = blinking || eyeState === 'closed'
  const rightPeek = !blinking && eyeState === 'peek'

  return (
    <h1
      aria-label="LinguaLoop"
      className={cn(
        'font-serif text-[52px] leading-none font-medium tracking-[-0.02em] text-foreground select-none',
        className
      )}
    >
      <span aria-hidden>
        LinguaL
        <Eye eyeRef={leftEyeRef} pupilRef={leftPupilRef} closed={leftClosed} />
        <Eye eyeRef={rightEyeRef} pupilRef={rightPupilRef} closed={rightClosed} peek={rightPeek} />
        p
      </span>
    </h1>
  )
}

function Eye({
  eyeRef,
  pupilRef,
  closed,
  peek = false,
}: {
  eyeRef: React.Ref<HTMLSpanElement>
  pupilRef: React.Ref<HTMLSpanElement>
  closed: boolean
  peek?: boolean
}) {
  return (
    <span
      ref={eyeRef}
      className={cn(
        'relative inline-block w-[0.46em] mx-[0.012em] align-[-0.02em] rounded-full border-[0.062em] border-current overflow-hidden',
        'transition-[height,translate] duration-150 ease-out',
        closed ? 'h-[0.062em] translate-y-[0.2em]' : peek ? 'h-[0.24em] translate-y-[0.11em]' : 'h-[0.46em]'
      )}
    >
      <span
        ref={pupilRef}
        className={cn(
          'absolute left-1/2 top-1/2 size-[0.17em] -ml-[0.085em] -mt-[0.085em] rounded-full bg-primary',
          'transition-[transform,opacity] duration-100 ease-out',
          closed && 'opacity-0'
        )}
      />
    </span>
  )
}

