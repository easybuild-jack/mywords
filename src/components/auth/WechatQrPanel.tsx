'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { RotateCw } from 'lucide-react'

/** 二维码有效期，接入后端后以接口返回的过期时间为准 */
const QR_TTL_MS = 120_000
const GRID = 25

/** 带种子的伪随机数，保证服务端与客户端渲染出同一张占位二维码 */
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function isFinderArea(x: number, y: number) {
  return (x < 8 && y < 8) || (x > GRID - 9 && y < 8) || (x < 8 && y > GRID - 9)
}

/** 占位二维码：仅用于静态页面展示，后续替换为微信开放平台返回的真实二维码 */
function PlaceholderQr({ seed }: { seed: number }) {
  const cells = useMemo(() => {
    const random = seededRandom(seed)
    const list: [number, number][] = []
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (!isFinderArea(x, y) && random() > 0.5) list.push([x, y])
      }
    }
    return list
  }, [seed])

  const finders: [number, number][] = [
    [0, 0],
    [GRID - 7, 0],
    [0, GRID - 7],
  ]

  return (
    <svg viewBox={`0 0 ${GRID} ${GRID}`} className="block size-[168px]" shapeRendering="crispEdges" aria-hidden>
      <rect width={GRID} height={GRID} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill="#111" />
      ))}
      {finders.map(([x, y]) => (
        <g key={`f-${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} fill="#111" />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill="#111" />
        </g>
      ))}
    </svg>
  )
}

function WechatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#07C160" className={className} aria-hidden>
      <path d="M8.7 3C4.5 3 1 5.9 1 9.5c0 2 1.1 3.8 2.8 5l-.7 2.2 2.6-1.4c.9.3 1.9.4 3 .4h.6a5.6 5.6 0 0 1-.2-1.5c0-3.5 3.3-6.3 7.5-6.3h.6C16.5 5 13 3 8.7 3zM6 8.3a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5.3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM23 14.2c0-3-2.9-5.4-6.5-5.4S10 11.2 10 14.2s2.9 5.4 6.5 5.4c.8 0 1.6-.1 2.3-.4l2 1.1-.5-1.8c1.6-1 2.7-2.6 2.7-4.3zm-8.6-.9a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zm4.3 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z" />
    </svg>
  )
}

/**
 * 微信扫码登录面板。ref 指向二维码方框，供字标眼睛注视。
 */
export function WechatQrPanel({ ref: qrRef }: { ref?: React.Ref<HTMLDivElement> }) {
  const [seed, setSeed] = useState(1)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (expired) return
    const timer = window.setTimeout(() => setExpired(true), QR_TTL_MS)
    return () => window.clearTimeout(timer)
  }, [expired, seed])

  const refresh = () => {
    setSeed((s) => s + 1)
    setExpired(false)
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={qrRef} className="relative p-2.5 rounded-md bg-white border border-border">
        <PlaceholderQr seed={seed} />
        {expired && (
          <div className="absolute inset-0 rounded-md bg-white/95 flex flex-col items-center justify-center gap-2">
            <span className="text-[13px] text-[#1C1917]">二维码已失效</span>
            <button
              type="button"
              onClick={refresh}
              className="h-7 px-3 rounded-md bg-[#1C1917] hover:bg-[#1C1917]/90 text-white text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCw className="size-3.5" />
              刷新
            </button>
          </div>
        )}
      </div>
      <p className="mt-5 text-sm text-foreground inline-flex items-center gap-1.5">
        <WechatIcon className="size-4" />
        打开微信，扫一扫登录
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {expired ? '二维码 2 分钟内有效' : '首次扫码会自动创建账号'}
      </p>
    </div>
  )
}
