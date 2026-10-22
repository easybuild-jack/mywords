'use client'

import React, { useRef, useEffect } from 'react'
import { Radio, Wifi, Play, Pause } from 'lucide-react'
import { SCENARIO_ICONS, type RadioItem } from '@/resources/radioData'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { getSkin } from '@/lib/skins'

interface RadioStudioVisualizerProps {
  item: RadioItem
  isPlaying: boolean
  onTogglePlay: () => void
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  audioRef?: React.RefObject<HTMLAudioElement | null>
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * 将 skins.ts 中的空格分隔 primaryRgb（如 "127 169 33"）转换为
 * Canvas 2D API 兼容的标准逗号分隔 "rgba(127, 169, 33, 0.8)"
 */
function toRgba(rgbStr: string | undefined, alpha: number): string {
  if (!rgbStr) return `rgba(127, 169, 33, ${alpha})`
  const parts = rgbStr.trim().split(/\s+/)
  const r = parts[0] || '127'
  const g = parts[1] || '169'
  const b = parts[2] || '33'
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function RadioStudioVisualizer({
  item,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  volume,
  playbackRate,
}: RadioStudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 响应式监听全局皮肤主题
  const skinId = useWorkspaceStore((s) => s.skinId)
  const currentSkin = getSkin(skinId)
  const tokens = currentSkin.tokens
  // 浅色主题判定 (如 酪梨青灰 avocado-cream、晨曦纸墨 muted-parchment)
  const isLight = skinId === 'avocado-cream' || skinId === 'muted-parchment'

  // 将主题 token 存入 Ref，供 60 FPS 渲染循环随时读取，无需频繁重建动画
  const themeTokensRef = useRef({ tokens, isLight })
  useEffect(() => {
    themeTokensRef.current = { tokens, isLight }
  }, [tokens, isLight])

  // 60 FPS 物理声学生态状态 (保存在 Ref 中，动画循环完全不触发 React 重渲染)
  const animStateRef = useRef({
    phase: 0,
    energy: 0,
    // 56 列平铺全景音柱数据结构
    bars: Array.from({ length: 56 }, (_, i) => {
      const norm = i / 56
      const weight = 0.55 + 0.5 * Math.sin(norm * Math.PI) + (norm < 0.25 ? 0.25 : 0)
      return {
        current: 6,
        target: 6,
        peak: 6,
        hold: 0,
        weight,
        speedFactor: 0.85 + 0.3 * Math.cos(i * 0.4),
      }
    }),
    // 演播室微光悬浮粒子
    particles: Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 1 + Math.random() * 2,
      speedX: (Math.random() - 0.5) * 0.03,
      speedY: -0.015 - Math.random() * 0.04,
      alpha: 0.12 + Math.random() * 0.28,
    })),
    lastTime: performance.now(),
  })

  // 将音量、倍速与播放状态放入 Ref，60 FPS 循环内直接无缝读取，调节音量绝不重启 Canvas 循环与黑闪
  const propsRef = useRef({ isPlaying, volume, playbackRate })
  useEffect(() => {
    propsRef.current = { isPlaying, volume, playbackRate }
  }, [isPlaying, volume, playbackRate])

  // 60 FPS 核心 Canvas 渲染：随皮肤主题无缝同步背景、主色、音柱与示波器
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let animationFrameId: number
    let isMounted = true

    // 高分屏 Retina 适应 (仅在尺寸实际发生像素级改变时才重置 canvas 缓冲区，彻底避免清空闪黑)
    const resizeCanvas = () => {
      if (!canvas || !container) return
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const targetW = Math.max(320, Math.floor(rect.width * dpr))
      const targetH = Math.max(360, Math.floor(rect.height * dpr))
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    resizeCanvas()
    const resizeObserver = new ResizeObserver(() => resizeCanvas())
    resizeObserver.observe(container)

    const renderLoop = (now: number) => {
      if (!isMounted) return

      const state = animStateRef.current
      const { tokens: curTokens, isLight: curIsLight } = themeTokensRef.current
      const { isPlaying: curPlaying, volume: curVolume, playbackRate: curRate } = propsRef.current

      const dt = Math.min((now - state.lastTime) / 1000, 0.045)
      state.lastTime = now

      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // 1. 全局音量与能量物理平滑过渡 (直接读取即时音量，0延迟响应，平滑缩放)
      const targetEnergy = curPlaying ? Math.max(0.25, curVolume) : 0
      state.energy += (targetEnergy - state.energy) * (curPlaying ? 0.22 : 0.08)

      // 示波正弦相位
      state.phase += (curPlaying ? 3.6 * curRate : 0.5) * dt

      // 2. 清除背景并绘制【与主题完全同步】的渐变底色
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      if (curIsLight) {
        // 浅色模式：以 sidebarBg 和 background 柔美融合，形成温润淡雅声学底色
        bgGrad.addColorStop(0, curTokens.sidebarBg)
        bgGrad.addColorStop(0.6, curTokens.background)
        bgGrad.addColorStop(1, curTokens.sidebarBg)
      } else {
        // 深色模式：以当前深色主题的 background 与 sidebarBg 自然过渡
        bgGrad.addColorStop(0, curTokens.background)
        bgGrad.addColorStop(0.6, curTokens.sidebarBg)
        bgGrad.addColorStop(1, curTokens.background)
      }
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // 绘制主题声学校准微孔网格
      ctx.strokeStyle = toRgba(curTokens.primaryRgb, curIsLight ? 0.08 : 0.04)
      ctx.lineWidth = 1
      const gridSize = 28
      ctx.beginPath()
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()

      // 3. 主题同色悬浮声学微光粒子
      ctx.save()
      for (const p of state.particles) {
        p.x += p.speedX * (curPlaying ? 1.4 : 0.5) * dt
        p.y += p.speedY * (curPlaying ? 1.4 : 0.5) * dt
        if (p.y < 0) p.y = 1
        if (p.x < 0) p.x = 1
        if (p.x > 1) p.x = 0

        const px = p.x * width
        const py = p.y * height
        const alpha = p.alpha * (curPlaying ? (curIsLight ? 0.45 : 0.75) : 0.2)
        ctx.fillStyle = toRgba(curTokens.primaryRgb, alpha)
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // 4. 背景流体示波声波束 (Phosphor Oscilloscope Beams · 主题同步)
      const centerY = height * 0.42
      const waveAmp = (curPlaying ? 22 * state.energy : 4) * (height / 450)

      // 4.1 主波束：品牌主题主色正弦波
      ctx.save()
      ctx.shadowColor = toRgba(curTokens.primaryRgb, curIsLight ? 0.35 : 0.75)
      ctx.shadowBlur = curPlaying ? (curIsLight ? 8 : 12) : 3
      ctx.strokeStyle = curTokens.primary
      ctx.lineWidth = curPlaying ? 2.4 : 1.2
      ctx.beginPath()

      const waveStep = 5
      for (let x = 0; x <= width; x += waveStep) {
        const normX = (x / width) * Math.PI * 6
        const envelope = Math.sin((x / width) * Math.PI)
        const yOff =
          (Math.sin(normX - state.phase) * 0.65 +
            Math.sin(normX * 2.2 + state.phase * 1.3) * 0.25 +
            Math.sin(normX * 4.1 - state.phase * 0.8) * 0.1) *
          waveAmp *
          envelope

        const y = centerY + yOff
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.restore()

      // 4.2 副波束：次级暖金泛音波束
      ctx.save()
      ctx.shadowColor = curIsLight ? 'rgba(217, 119, 6, 0.3)' : 'rgba(251, 191, 36, 0.5)'
      ctx.shadowBlur = curPlaying ? 6 : 2
      ctx.strokeStyle = curIsLight ? 'rgba(217, 119, 6, 0.7)' : 'rgba(251, 191, 36, 0.65)'
      ctx.lineWidth = 1.2
      ctx.beginPath()

      for (let x = 0; x <= width; x += waveStep) {
        const normX = (x / width) * Math.PI * 7.5
        const envelope = Math.sin((x / width) * Math.PI)
        const yOff =
          (Math.cos(normX + state.phase * 1.2) * 0.5 +
            Math.sin(normX * 1.8 - state.phase) * 0.3) *
          (waveAmp * 0.7) *
          envelope

        const y = centerY + yOff
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.restore()

      // 5. 核心：【音柱平铺】全屏横向均布阵列 (色彩与主题主色完全同步)
      const numBars = state.bars.length
      const horizontalPadding = Math.max(16, width * 0.035)
      const availableWidth = width - horizontalPadding * 2
      const barGap = Math.max(2, Math.min(6, availableWidth / (numBars * 3)))
      const barWidth = Math.max(3, (availableWidth - (numBars - 1) * barGap) / numBars)

      const baselineY = height - 76
      const maxBarHeight = Math.min(height * 0.62, 320)

      ctx.save()

      for (let i = 0; i < numBars; i++) {
        const bar = state.bars[i]

        let targetH = 6
        if (curPlaying && state.energy > 0) {
          const normIdx = i / numBars
          // 低频贝斯脉冲
          const bassPulse =
            normIdx < 0.28
              ? (Math.sin(now * 0.009 * curRate) > 0.3 ? 1.4 : 0.8) *
                (1 + Math.sin(now * 0.016 * curRate))
              : 0.8

          // 中频人声共鸣
          const vocalPresence =
            Math.sin(now * 0.008 * curRate * bar.speedFactor + i * 0.35) * 0.45 +
            Math.cos(now * 0.013 * curRate - i * 0.22) * 0.35 +
            Math.sin(now * 0.022 * curRate + i * 0.6) * 0.2

          // 高频空气感泛音
          const sparkle =
            normIdx > 0.7
              ? Math.sin(now * 0.025 * curRate + i) * 0.35
              : 0

          const combined = Math.max(0.05, (vocalPresence + 1) * 0.5 * bassPulse + sparkle)
          targetH = combined * maxBarHeight * bar.weight * curVolume * state.energy
          targetH = Math.max(8, Math.min(maxBarHeight, targetH))
        }

        const lerpFactor = targetH > bar.current ? 0.34 : 0.18
        bar.current += (targetH - bar.current) * lerpFactor

        // 峰值驻留与重力加速度下落
        if (bar.current >= bar.peak) {
          bar.peak = bar.current
          bar.hold = 14
        } else {
          if (bar.hold > 0) {
            bar.hold--
          } else {
            bar.peak = Math.max(6, bar.peak - 2.8)
          }
        }

        const bx = horizontalPadding + i * (barWidth + barGap)
        const currentH = Math.max(5, bar.current)
        const by = baselineY - currentH

        // 5.1 柱体垂直渐变：紧贴主题主色 (如 酪梨绿 / 薄荷绿 / 樱粉 / 珊瑚橙)
        const colGrad = ctx.createLinearGradient(0, baselineY, 0, by)
        if (curIsLight) {
          colGrad.addColorStop(0, toRgba(curTokens.primaryRgb, 0.7))
          colGrad.addColorStop(0.7, curTokens.primary)
          colGrad.addColorStop(1, '#d97706') // 浅色下的暖金琥珀峰值
        } else {
          colGrad.addColorStop(0, toRgba(curTokens.primaryRgb, 0.75))
          colGrad.addColorStop(0.65, curTokens.primaryHover || curTokens.primary)
          colGrad.addColorStop(1, '#fde047') // 深色下的亮黄峰值
        }

        ctx.fillStyle = colGrad
        ctx.beginPath()
        ctx.roundRect(bx, by, barWidth, currentH, [barWidth * 0.35, barWidth * 0.35, 1, 1])
        ctx.fill()

        // 5.2 微分段硬件 LED 刻线
        if (barWidth >= 5 && currentH > 24) {
          ctx.fillStyle = curIsLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.35)'
          const segmentHeight = 5
          for (let sy = by + segmentHeight; sy < baselineY - 2; sy += segmentHeight + 1.5) {
            ctx.fillRect(bx, sy, barWidth, 1.2)
          }
        }

        // 5.3 顶部悬浮驻留重力掉落峰值跳点
        const peakY = baselineY - Math.max(bar.peak, currentH + 3.5)
        ctx.fillStyle = curIsLight ? '#d97706' : '#fef08a'
        ctx.shadowColor = curIsLight ? 'rgba(217, 119, 6, 0.4)' : 'rgba(254, 240, 138, 0.8)'
        ctx.shadowBlur = curPlaying ? (curIsLight ? 3 : 6) : 1
        ctx.beginPath()
        ctx.roundRect(bx, peakY, barWidth, Math.max(2, barWidth * 0.35), 1)
        ctx.fill()
        ctx.shadowBlur = 0

        // 5.4 基底主题微镜面倒影
        const reflectH = Math.min(22, currentH * 0.25)
        const reflectGrad = ctx.createLinearGradient(0, baselineY, 0, baselineY + reflectH)
        reflectGrad.addColorStop(0, toRgba(curTokens.primaryRgb, curIsLight ? 0.18 : 0.25))
        reflectGrad.addColorStop(1, toRgba(curTokens.primaryRgb, 0))

        ctx.fillStyle = reflectGrad
        ctx.beginPath()
        ctx.roundRect(bx, baselineY + 2, barWidth, reflectH, [0, 0, 1, 1])
        ctx.fill()
      }

      ctx.restore()

      // 6. 频轴基准刻度线 (底部分度刻度)
      ctx.strokeStyle = curIsLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(horizontalPadding, baselineY + 1)
      ctx.lineTo(width - horizontalPadding, baselineY + 1)
      ctx.stroke()

      // 底部频率标尺字样
      ctx.fillStyle = curIsLight ? 'rgba(36, 43, 35, 0.7)' : 'rgba(148, 163, 184, 0.65)'
      ctx.font = '9px monospace'
      ctx.fillText('20Hz (SUB)', horizontalPadding, baselineY + 18)
      ctx.fillText('250Hz (BASS)', horizontalPadding + availableWidth * 0.25, baselineY + 18)
      ctx.fillText('1kHz (VOCAL)', horizontalPadding + availableWidth * 0.5 - 20, baselineY + 18)
      ctx.fillText('4kHz (TREBLE)', horizontalPadding + availableWidth * 0.75 - 20, baselineY + 18)
      ctx.fillText('20kHz (AIR)', width - horizontalPadding - 64, baselineY + 18)

      animationFrameId = requestAnimationFrame(renderLoop)
    }

    animationFrameId = requestAnimationFrame(renderLoop)

    return () => {
      isMounted = false
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      onClick={onTogglePlay}
      className="relative size-full min-h-[400px] md:min-h-[480px] lg:min-h-[540px] flex flex-col justify-between overflow-hidden bg-sidebar select-none cursor-pointer group"
      title={isPlaying ? '点击画面暂停 (空格键)' : '点击画面播放 (空格键)'}
    >
      {/* 60 FPS 全景平铺音柱生态 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 size-full block pointer-events-none" />

      {/* 1. 顶部电台信息与模拟调频刻度尺栏 (完全同步主题卡片与文字颜色) */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-border/70 bg-card/85 backdrop-blur-md">
        {/* 左侧：ON AIR 直播指示灯与电台频标 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 border border-border shadow-xs">
            <span
              className={`size-2.5 rounded-full transition-all duration-300 ${
                isPlaying
                  ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse'
                  : 'bg-amber-500/80'
              }`}
            />
            <span
              className={`text-[11px] font-mono font-bold tracking-wider ${
                isPlaying ? 'text-rose-500' : 'text-amber-500'
              }`}
            >
              {isPlaying ? 'ON AIR' : 'STANDBY'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-foreground font-semibold">
            <Radio className="size-4 text-primary" />
            <span className="tracking-tight">FM 104.2 MHz</span>
          </div>
        </div>

        {/* 中间：FM 模拟调频标尺刻度 */}
        <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-muted-foreground select-none">
          <span>88</span>
          <span className="opacity-40 tracking-widest">········</span>
          <span>96</span>
          <span className="opacity-40 tracking-widest">········</span>
          <span className="px-2.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-bold shadow-xs">
            104.2
          </span>
          <span className="opacity-40 tracking-widest">········</span>
          <span>108</span>
        </div>

        {/* 右侧：场景标签与高保真广播微标 */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="hidden sm:inline text-xs text-muted-foreground font-medium">
            {item.scenario} {SCENARIO_ICONS[item.scenario] || '📻'}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/80 border border-border/60 text-primary text-[10px] font-semibold">
            <Wifi className="size-3.5 text-primary" />
            <span>STEREO HI-FI</span>
          </div>
        </div>
      </div>

      {/* 2. 中间：中央播放指示按键 (画面悬浮微操作，播放时自动隐去) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none p-4">
        <button
          id="radio-visualizer-toggle-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onTogglePlay()
          }}
          className={`pointer-events-auto size-16 sm:size-20 rounded-full border border-border/80 flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer ${
            isPlaying
              ? 'bg-card/75 text-foreground/70 hover:text-foreground hover:bg-card opacity-0 group-hover:opacity-100 scale-95 hover:scale-105 backdrop-blur-md'
              : 'bg-primary text-primary-foreground opacity-100 scale-100 shadow-primary/30 hover:scale-110 active:scale-95'
          }`}
          title={isPlaying ? '暂停 (空格键)' : '播放 (空格键)'}
        >
          {isPlaying ? (
            <Pause className="size-7 sm:size-8" />
          ) : (
            <Play className="size-7 sm:size-8 ml-0.5 fill-current" />
          )}
        </button>
      </div>

      {/* 3. 底部信息栏与电台实时状态 (主题色系) */}
      <div className="relative z-10 flex items-center justify-between px-6 py-2.5 border-t border-border/70 bg-card/85 backdrop-blur-md text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <>
              <span className="size-2 rounded-full bg-primary animate-ping" />
              <span className="text-primary font-medium">电台正在广播</span>
            </>
          ) : (
            <>
              <span className="size-2 rounded-full bg-amber-500" />
              <span>电台待机中 · 空格键随时启播</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold flex items-center gap-1.5">
            <span className="font-mono text-primary font-bold text-base tracking-tight">
              {formatTime(currentTime)}
            </span>
            <span className="text-muted-foreground/60 font-mono">/</span>
            <span className="font-mono text-muted-foreground text-xs">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
