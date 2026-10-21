'use client'

import React from 'react'
import {
  type RadioItem,
  type PlayMode,
} from '@/resources/radioData'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  ArrowRight,
  Volume2,
  VolumeX,
  Maximize2,
  Disc3,
} from 'lucide-react'

interface RadioMainPlayerProps {
  item: RadioItem | null
  isPlaying: boolean
  onTogglePlay: () => void
  onPrev: () => void
  onNext: () => void
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  playbackRate: number
  onChangePlaybackRate: (rate: number) => void
  playMode: PlayMode
  onChangePlayMode: (mode: PlayMode) => void
  volume: number
  onChangeVolume: (vol: number) => void
  videoRef: React.RefObject<HTMLVideoElement | null>
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function RadioMainPlayer({
  item,
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  currentTime,
  duration,
  onSeek,
  playbackRate,
  onChangePlaybackRate,
  playMode,
  onChangePlayMode,
  volume,
  onChangeVolume,
  videoRef,
}: RadioMainPlayerProps) {
  if (!item) {
    return (
      <div className="h-96 rounded-[22px] bg-card/40 border border-border/80 flex flex-col items-center justify-center p-8 text-center text-muted-foreground shadow-sm">
        <Disc3 className="size-14 text-muted-foreground/30 mb-3 animate-spin duration-3000" />
        <p className="text-sm font-medium text-foreground">暂无选中的电台片段</p>
        <p className="text-xs text-muted-foreground mt-1">请从右侧或下方列表选择一个片段开始磨耳朵</p>
      </div>
    )
  }

  const isVideo = item.type === 'video'
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercent = parseFloat(e.target.value)
    onSeek((newPercent / 100) * duration)
  }

  // 循环模式切换：列表循环 -> 单曲循环 -> 随机播放 -> 顺序播放
  const cyclePlayMode = () => {
    if (playMode === 'list-loop') onChangePlayMode('single-loop')
    else if (playMode === 'single-loop') onChangePlayMode('shuffle')
    else if (playMode === 'shuffle') onChangePlayMode('sequential')
    else onChangePlayMode('list-loop')
  }

  const getModeInfo = () => {
    switch (playMode) {
      case 'single-loop':
        return { icon: Repeat1, label: '单曲循环' }
      case 'list-loop':
        return { icon: Repeat, label: '列表循环' }
      case 'shuffle':
        return { icon: Shuffle, label: '随机播放' }
      case 'sequential':
        return { icon: ArrowRight, label: '顺序播放' }
    }
  }

  const modeInfo = getModeInfo()
  const ModeIcon = modeInfo.icon

  const handleToggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen?.()
      }
    }
  }

  return (
    <div className="relative rounded-[22px] bg-sidebar border border-border/80 shadow-lg p-5 space-y-4">
      {/* 标题 */}
      <div className="min-w-0 relative z-10">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug">
          {item.title}
        </h2>
      </div>

      {/* 超大影音主视听视窗 (Enlarged Player Screen) */}
      <div className="relative w-full aspect-video min-h-[360px] md:min-h-[460px] lg:min-h-[540px] max-h-[640px] rounded-2xl bg-black border border-border/80 overflow-hidden shadow-lg flex items-center justify-center group">
        {isVideo ? (
          /* 大屏视频播放器视图 */
          <div className="relative size-full flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              src={item.src}
              poster={item.poster}
              playsInline
              onClick={onTogglePlay}
              className="size-full object-contain cursor-pointer"
            />

            {/* 视频中心播放/暂停大悬浮遮罩 */}
            <button
              onClick={onTogglePlay}
              className={`absolute size-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-black/80 cursor-pointer shadow-2xl ${
                isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100 scale-100'
              }`}
            >
              {isPlaying ? <Pause className="size-8" /> : <Play className="size-8 ml-1 text-primary" />}
            </button>

            {/* 全屏按钮 */}
            <button
              onClick={handleToggleFullscreen}
              className="absolute right-4 bottom-4 p-2.5 rounded-xl bg-black/60 hover:bg-black/90 text-white/90 hover:text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
              title="全屏播放"
            >
              <Maximize2 className="size-5" />
            </button>
          </div>
        ) : (
          /* 纯音频模式：宽幕黑胶唱机与律动频谱 (纯净黑色无光晕底色) */
          <div className="relative size-full flex items-center justify-center overflow-hidden bg-black">
            <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12 z-10 p-8">
              {/* 大尺寸黑胶转盘 */}
              <div
                onClick={onTogglePlay}
                className={`relative size-36 sm:size-48 md:size-56 rounded-full bg-zinc-900 border-4 sm:border-[6px] border-zinc-950 shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-700 shrink-0 ${
                  isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
                }`}
                title="点击播放 / 暂停"
              >
                {/* 唱片黑胶同心圆环 */}
                <div className="absolute inset-2 sm:inset-3 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-5 sm:inset-8 rounded-full border border-white/[0.05]" />
                <div className="absolute inset-9 sm:inset-14 rounded-full border border-white/[0.04]" />

                {/* 唱片中心彩胶标签 */}
                <div className="size-16 sm:size-20 md:size-24 rounded-full bg-primary border-2 border-black/40 flex items-center justify-center shadow-md">
                  {isPlaying ? (
                    <Pause className="size-7 sm:size-8 text-primary-foreground" />
                  ) : (
                    <Play className="size-7 sm:size-8 ml-1 text-primary-foreground fill-current" />
                  )}
                </div>
              </div>

              {/* 动态律动声波频谱柱与时间 */}
              <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
                <div className="flex items-center gap-2 h-12">
                  {[40, 75, 55, 90, 30, 85, 60, 100, 45, 70, 95, 35, 80, 50, 65, 90].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        height: isPlaying ? `${Math.max(15, (h * Math.sin((currentTime + i) * 1.5) + 100) / 2)}%` : '20%',
                        transition: 'height 0.15s ease',
                      }}
                      className="w-1.5 rounded-full bg-primary/70"
                    />
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="font-mono text-primary font-bold text-base">
                      {formatTime(currentTime)}
                    </span>
                    <span>/</span>
                    <span className="font-mono text-muted-foreground">{formatTime(duration)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isPlaying ? '🎧 正在高保真磨耳朵中...' : '⏸️ 暂停中 · 按空格键随时继续'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部控制中枢 (Integrated Bottom Control Deck) */}
      <div className="rounded-2xl bg-card border border-border/70 p-3 sm:p-4 space-y-3.5 select-none shadow-sm">
        {/* 1. 进度拖拽寻道条 */}
        <div className="flex items-center gap-3">
          <span className="w-11 text-right text-xs font-mono text-muted-foreground tabular-nums shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center group cursor-pointer py-1">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={handleProgressChange}
              className="w-full h-1.5 bg-muted/80 rounded-lg appearance-none cursor-pointer accent-primary group-hover:h-2 transition-all"
            />
          </div>
          <span className="w-11 text-xs font-mono text-muted-foreground tabular-nums shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* 2. 核心控制按钮群落 (3列等宽网格，保证主播放大按键严格水平绝对居中) */}
        <div className="grid grid-cols-3 items-center w-full gap-2 sm:gap-4">
          {/* 左侧：播放模式与语速 */}
          <div className="flex items-center justify-start gap-2 sm:gap-2.5 min-w-0">
            <button
              onClick={cyclePlayMode}
              title={`当前模式: ${modeInfo.label}（点击切换）`}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border shrink-0 ${
                playMode === 'single-loop'
                  ? 'text-primary bg-primary/15 border-primary/30'
                  : 'text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <ModeIcon className="size-4" />
              <span className="font-medium text-xs hidden sm:inline">{modeInfo.label}</span>
            </button>

            {/* 语速微调选择 */}
            <div className="hidden md:flex items-center gap-1 text-xs font-mono ml-1 pl-2.5 border-l border-border/70">
              {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onChangePlaybackRate(rate)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    playbackRate === rate
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* 中间：主播放与切曲控制器群 (严格居中于播放器卡片正中 50% 轴线) */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 shrink-0">
            {/* 上一首 */}
            <button
              onClick={onPrev}
              title="上一片段 ([ 键)"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer shrink-0"
            >
              <SkipBack className="size-5" />
            </button>

            {/* 播放 / 暂停 大按钮 */}
            <button
              onClick={onTogglePlay}
              title={isPlaying ? '暂停 (空格键)' : '播放 (空格键)'}
              className="size-11 sm:size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              {isPlaying ? (
                <Pause className="size-5 sm:size-6" />
              ) : (
                <Play className="size-5 sm:size-6 ml-0.5 fill-current" />
              )}
            </button>

            {/* 下一首 */}
            <button
              onClick={onNext}
              title="下一片段 (] 键)"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer shrink-0"
            >
              <SkipForward className="size-5" />
            </button>
          </div>

          {/* 右侧：音量调节与移动端语速 */}
          <div className="flex items-center justify-end gap-2 min-w-0">
            <button
              onClick={() => onChangeVolume(volume > 0 ? 0 : 0.8)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              title={volume === 0 ? '静音中，点击恢复' : '点击静音'}
            >
              {volume === 0 ? <VolumeX className="size-4 text-muted-foreground/60" /> : <Volume2 className="size-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="w-14 sm:w-20 lg:w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              title={`音量: ${Math.round(volume * 100)}%`}
            />
            {/* 移动端语速快速切换按钮 */}
            <button
              onClick={() => {
                const nextRate = playbackRate === 1.0 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 0.75 : 1.0
                onChangePlaybackRate(nextRate)
              }}
              className="md:hidden px-2 py-0.5 rounded bg-muted/60 text-xs font-mono text-muted-foreground hover:text-foreground shrink-0"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
