'use client'

import React, { useState } from 'react'
import {
  PREPOSITIONS_DATA,
  PrepositionItem,
  SpatialDimension,
} from '@/resources/grammarData'
import {
  Compass,
  Sparkles,
  Volume2,
  Box,
  Square,
  Dot,
  Maximize2,
  ArrowUpCircle,
  Users,
  Lightbulb,
  ArrowRight,
  HelpCircle,
} from 'lucide-react'

interface PrepositionViewProps {
  searchQuery: string
}

export function PrepositionView({ searchQuery }: PrepositionViewProps) {
  const [selectedDimension, setSelectedDimension] = useState<SpatialDimension | 'all'>('all')
  const [activePrepId, setActivePrepId] = useState<string>('prep_at')

  // 发音辅助
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  // 维度筛选与搜索
  const filteredList = PREPOSITIONS_DATA.filter((item) => {
    if (selectedDimension !== 'all' && item.dimension !== selectedDimension) {
      return false
    }
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      item.word.toLowerCase().includes(q) ||
      item.dimensionLabelZh.includes(q) ||
      item.spatialEssence.toLowerCase().includes(q) ||
      item.spaceToTimeTransfer.ruleZh.includes(q) ||
      item.metaphoricalTransfer.collocations.some(
        (c) => c.en.toLowerCase().includes(q) || c.zh.includes(q)
      )
    )
  })

  return (
    <div className="space-y-8">
      {/* 模块导引 */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Module 04 · 空间感知与认知隐喻
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              认知语言学图解
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            英语介词认知空间网络：告别死记硬背的几何具象
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            介词不是随意的中文对译，而是人类空间经验的自然投射。从“零维坐标点 (at)”、“二维支撑接触面 (on)”、“三维包围容器 (in)”，再一步步升维至时间长河与抽象心理隐喻。
          </p>
        </div>

        {/* 空间维度快速过滤器 */}
        <div className="flex items-center gap-1.5 flex-wrap bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setSelectedDimension('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedDimension === 'all'
                ? 'bg-primary text-[#0B0C0E] border border-primary font-semibold'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            全部空间类型
          </button>
          <button
            onClick={() => setSelectedDimension('0D_point')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedDimension === '0D_point'
                ? 'bg-primary text-[#0B0C0E] border border-primary font-semibold'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            0D 坐标点 (at)
          </button>
          <button
            onClick={() => setSelectedDimension('1D_2D_surface')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedDimension === '1D_2D_surface'
                ? 'bg-primary text-[#0B0C0E] border border-primary font-semibold'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            1D/2D 接触面 (on)
          </button>
          <button
            onClick={() => setSelectedDimension('3D_container')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedDimension === '3D_container'
                ? 'bg-primary text-[#0B0C0E] border border-primary font-semibold'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            3D 容器 (in)
          </button>
          <button
            onClick={() => setSelectedDimension('vector_movement')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedDimension === 'vector_movement'
                ? 'bg-primary text-[#0B0C0E] border border-primary font-semibold'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            动态矢量轨迹
          </button>
        </div>
      </div>

      {/* 空间核心几何可视化模型总览卡片 (At / On / In 空间坐标三体图) */}
      <div className="rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-xl p-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Sparkles className="size-3.5 text-purple-400" />
          三大核心介词空间三维模型（The Trinity of Space）
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AT: 0D 点 */}
          <div className="p-4 rounded-xl bg-rose-500/[0.04] border border-rose-500/20 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold font-mono text-rose-400">at</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                0D 无维点
              </span>
            </div>
            {/* SVG 示意图形 */}
            <div className="h-24 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center relative">
              <div className="size-4 rounded-full bg-rose-500 border-2 border-white shadow-lg shadow-rose-500/50 animate-ping" />
              <div className="size-3 rounded-full bg-rose-500 border-2 border-white absolute" />
              <span className="absolute bottom-2 text-[10px] font-mono text-gray-500">
                Point: 精确定位靶心
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              将客体抽象为地图上的一个坐标点。不计长宽高：<strong className="text-white">at the bus stop</strong>, <strong className="text-white">at 3:00 PM</strong>.
            </p>
          </div>

          {/* ON: 1D/2D 面 */}
          <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold font-mono text-amber-400">on</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                1D/2D 接触承载面
              </span>
            </div>
            {/* SVG 示意图形 */}
            <div className="h-24 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center relative">
              <div className="size-3 rounded-sm bg-amber-400 border border-white shadow-md -mb-0.5" />
              <div className="w-24 h-1.5 bg-amber-500/60 rounded-full" />
              <span className="absolute bottom-2 text-[10px] font-mono text-gray-500">
                Surface: 物理贴合支撑
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              存在表面物理接触与支撑。不论方向向上还是挂在墙侧：<strong className="text-white">on the table</strong>, <strong className="text-white">on Monday</strong>.
            </p>
          </div>

          {/* IN: 3D 容器 */}
          <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold font-mono text-emerald-400">in</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                3D 三维包围体
              </span>
            </div>
            {/* SVG 示意图形 */}
            <div className="h-24 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center relative">
              <div className="size-12 border-2 border-dashed border-emerald-400/60 rounded-lg flex items-center justify-center">
                <div className="size-3.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              </div>
              <span className="absolute bottom-2 text-[10px] font-mono text-gray-500">
                Container: 容积包围感
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              处于封闭或半封闭的三维立体容器内：<strong className="text-white">in the room</strong>, <strong className="text-white">in July</strong>, <strong className="text-white">in love</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 详细介词卡片列表 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl p-6 bg-surface/50 border border-white/10 hover:border-purple-500/30 transition-all backdrop-blur-md space-y-5 shadow-lg shadow-black/20"
          >
            {/* 卡片头部 */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-2xl font-bold font-mono text-white tracking-wide">
                    {item.word}
                  </h3>
                  <span className="text-xs font-mono text-muted-foreground">
                    {item.phonetic}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {item.dimensionLabelZh}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  几何本质：{item.geometricModel}
                </p>
              </div>

              <button
                onClick={() => speakText(item.word)}
                className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                title="发音"
              >
                <Volume2 className="size-4" />
              </button>
            </div>

            {/* 核心空间感知 */}
            <div className="rounded-xl p-3.5 bg-black/30 border border-white/5 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 block font-mono">
                空间感知图景 (Spatial Perception)
              </span>
              <p className="text-xs text-gray-200 leading-relaxed font-sans">
                {item.spatialEssence}
              </p>
            </div>

            {/* 认知跃迁：空间 -> 时间 */}
            <div className="rounded-xl p-3.5 bg-sky-500/[0.04] border border-sky-500/15 space-y-2">
              <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1.5">
                <Compass className="size-3.5" />
                时间轴认知映射 (Space ➔ Time Transfer)
              </span>
              <p className="text-xs text-gray-300 leading-snug">
                {item.spaceToTimeTransfer.ruleZh}
              </p>
              <div className="flex items-center justify-between text-xs bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                <span className="font-mono font-medium text-sky-300">
                  {item.spaceToTimeTransfer.example}
                </span>
                <span className="text-gray-400">
                  {item.spaceToTimeTransfer.exampleZh}
                </span>
              </div>
            </div>

            {/* 认知跃迁：隐喻与固定搭配 */}
            <div className="rounded-xl p-3.5 bg-purple-500/[0.04] border border-purple-500/15 space-y-2.5">
              <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                抽象逻辑隐喻 (Metaphorical Extension)
              </span>
              <p className="text-xs text-gray-300 leading-snug">
                {item.metaphoricalTransfer.ruleZh}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.metaphoricalTransfer.collocations.map((c, cIdx) => (
                  <div
                    key={cIdx}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 text-xs"
                  >
                    <span className="font-medium text-purple-200">{c.en}</span>
                    <span className="text-[11px] text-gray-400">{c.zh}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 辨析陷阱 (Contrast Trap) */}
            {item.contrastTrap && (
              <div className="rounded-xl p-3.5 bg-amber-500/[0.06] border border-amber-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <Lightbulb className="size-4 text-amber-400" />
                  <span>核心陷阱辨析：{item.word} vs {item.contrastTrap.rivalWord}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {item.contrastTrap.coreDistinction}
                </p>
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                  <p className="text-white font-medium">
                    {item.contrastTrap.contrastSentenceEn}
                  </p>
                  <p className="text-gray-400 text-[11px]">
                    {item.contrastTrap.contrastSentenceZh}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
