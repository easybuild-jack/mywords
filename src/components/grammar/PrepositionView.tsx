'use client'

import React, { useState } from 'react'
import { PREPOSITIONS_DATA, SpatialDimension } from '@/resources/grammarData'
import { Compass, Sparkles, Volume2, Lightbulb } from 'lucide-react'

export function PrepositionView() {
  const [selectedDimension, setSelectedDimension] = useState<SpatialDimension | 'all'>('all')

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

  // 维度筛选
  const filteredList =
    selectedDimension === 'all'
      ? PREPOSITIONS_DATA
      : PREPOSITIONS_DATA.filter((item) => item.dimension === selectedDimension)

  return (
    <div className="space-y-8">
      {/* 模块导引 */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Module 02 · 空间感知与认知隐喻
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
      <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary" />
          三大核心介词空间三维模型（The Trinity of Space）
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AT: 0D 点 */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold font-mono text-primary">at</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                0D 无维点
              </span>
            </div>
            {/* SVG 示意图形 */}
            <div className="h-24 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center relative">
              <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg shadow-primary/30 animate-ping" />
              <div className="size-3 rounded-full bg-primary border-2 border-white absolute" />
              <span className="absolute bottom-2 text-[10px] font-mono text-muted-foreground">
                Point: 精确定位靶心
              </span>
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">
              将客体抽象为地图上的一个坐标点。不计长宽高：<strong className="text-foreground">at the bus stop</strong>, <strong className="text-foreground">at 3:00 PM</strong>.
            </p>
          </div>

          {/* ON: 1D/2D 面 */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold font-mono text-primary">on</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                1D/2D 接触承载面
              </span>
            </div>
            {/* SVG 示意图形 */}
            <div className="h-24 rounded-lg bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center relative">
              <div className="size-3 rounded-sm bg-primary border border-white shadow-md -mb-0.5" />
              <div className="w-24 h-1.5 bg-primary/60 rounded-full" />
              <span className="absolute bottom-2 text-[10px] font-mono text-muted-foreground">
                Surface: 物理贴合支撑
              </span>
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">
              存在表面物理接触与支撑。不论方向向上还是挂在墙侧：<strong className="text-foreground">on the table</strong>, <strong className="text-foreground">on Monday</strong>.
            </p>
          </div>

          {/* IN: 3D 容器 */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold font-mono text-primary">in</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                3D 三维包围体
              </span>
            </div>
            {/* SVG 示意图形 */}
            <div className="h-24 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center relative">
              <div className="size-12 border-2 border-dashed border-primary/60 rounded-lg flex items-center justify-center">
                <div className="size-3.5 rounded-full bg-primary shadow-lg shadow-primary/30" />
              </div>
              <span className="absolute bottom-2 text-[10px] font-mono text-muted-foreground">
                Container: 容积包围感
              </span>
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed">
              处于封闭或半封闭的三维立体容器内：<strong className="text-foreground">in the room</strong>, <strong className="text-foreground">in July</strong>, <strong className="text-foreground">in love</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 详细介词卡片列表 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredList.map((item) => (
          <article
            key={item.id}
            className="glass-card rounded-2xl border border-white/10 p-6 sm:p-7 flex flex-col gap-6"
          >
            {/* 卡片头部 */}
            <header className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="font-mono text-2xl font-extrabold text-foreground tracking-wide">
                    {item.word}
                  </h3>
                  <span className="font-mono text-lg font-semibold text-muted-foreground">
                    {item.phonetic}
                  </span>
                  <span className="text-base font-semibold text-primary">
                    {item.dimensionLabelZh}
                  </span>
                </div>
                <p className="mt-3 text-base leading-relaxed text-foreground/85">
                  几何本质：{item.geometricModel}
                </p>
              </div>

              <button
                onClick={() => speakText(item.word)}
                className="size-10 shrink-0 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="发音"
              >
                <Volume2 className="size-5" />
              </button>
            </header>

            {/* 核心空间感知 */}
            <section className="border-t border-white/10 pt-5 space-y-3">
              <h4 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-lg font-bold text-foreground">
                <span>空间感知图景</span>
                <span className="font-mono text-sm font-normal text-muted-foreground">
                  Spatial Perception
                </span>
              </h4>
              <p className="text-base leading-relaxed text-foreground/85">
                {item.spatialEssence}
              </p>
            </section>

            {/* 认知跃迁：空间 -> 时间 */}
            <section className="border-t border-white/10 pt-5 space-y-3">
              <h4 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-lg font-bold text-foreground">
                <Compass className="size-5 shrink-0 text-primary" />
                <span>时间轴认知映射</span>
                <span className="font-mono text-sm font-normal text-muted-foreground">
                  Space ➔ Time Transfer
                </span>
              </h4>
              <p className="text-base leading-relaxed text-foreground/85">
                {item.spaceToTimeTransfer.ruleZh}
              </p>
              <p className="flex items-baseline gap-3 flex-wrap">
                <span className="font-mono text-lg sm:text-xl font-semibold text-foreground">
                  {item.spaceToTimeTransfer.example}
                </span>
                <span className="text-base text-muted-foreground">
                  {item.spaceToTimeTransfer.exampleZh}
                </span>
              </p>
            </section>

            {/* 认知跃迁：隐喻与固定搭配 */}
            <section className="border-t border-white/10 pt-5 space-y-3">
              <h4 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-lg font-bold text-foreground">
                <Sparkles className="size-5 shrink-0 text-primary" />
                <span>抽象逻辑隐喻</span>
                <span className="font-mono text-sm font-normal text-muted-foreground">
                  Metaphorical Extension
                </span>
              </h4>
              <p className="text-base leading-relaxed text-foreground/85">
                {item.metaphoricalTransfer.ruleZh}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {item.metaphoricalTransfer.collocations.map((c, cIdx) => (
                  <div key={cIdx} className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-base font-medium text-foreground">
                      {c.en}
                    </span>
                    <span className="text-sm text-muted-foreground">{c.zh}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 辨析陷阱 (Contrast Trap) */}
            {item.contrastTrap && (
              <aside className="mt-auto border-l-2 border-primary pl-4 flex items-start gap-3">
                <Lightbulb className="size-5 shrink-0 text-primary mt-1" />
                <div className="space-y-2">
                  <p className="text-lg font-bold text-foreground">
                    核心陷阱辨析：{item.word} vs {item.contrastTrap.rivalWord}
                  </p>
                  <p className="text-base leading-relaxed text-foreground/85">
                    {item.contrastTrap.coreDistinction}
                  </p>
                  <p className="font-mono text-base text-foreground">
                    {item.contrastTrap.contrastSentenceEn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.contrastTrap.contrastSentenceZh}
                  </p>
                </div>
              </aside>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
