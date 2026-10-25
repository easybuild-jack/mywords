'use client'

import React from 'react'
import {
  type RadioItem,
  SCENARIO_ICONS,
} from '@/resources/radioData'
import {
  Play,
  Pause,
  Headphones,
  Video,
  ListMusic,
  Clock,
  Trash2,
  Volume2,
} from 'lucide-react'

interface RadioCardListProps {
  items: RadioItem[]
  currentId: string | null
  isPlaying: boolean
  onSelectItem: (item: RadioItem) => void
  onTogglePlay: () => void
  onDeleteItem: (id: string) => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function RadioCardList({
  items,
  currentId,
  isPlaying,
  onSelectItem,
  onTogglePlay,
  onDeleteItem,
}: RadioCardListProps) {
  if (items.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl bg-card/30 border border-border/60 text-muted-foreground space-y-2">
        <ListMusic className="size-10 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-foreground">没有找到符合条件的听力片段</p>
        <p className="text-xs text-muted-foreground">尝试切换场景分类，或点击右上角上传新的音频/视频</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ListMusic className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            场景媒体库 ({items.length})
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">
          点击卡片即刻切换播放
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => {
          const isCurrent = item.id === currentId
          const scenarioIcon = SCENARIO_ICONS[item.scenario] || '🏷️'
          const isVideo = item.type === 'video'

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isCurrent) {
                  onTogglePlay()
                } else {
                  onSelectItem(item)
                }
              }}
              className={`group relative rounded-2xl p-3.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                isCurrent
                  ? 'bg-card border-primary/60 shadow-[0_4px_20px_rgba(var(--primary-rgb)/0.15)] ring-1 ring-primary/40'
                  : 'bg-card/50 hover:bg-card border-border/70 hover:border-border hover:shadow-sm hover:-translate-y-0.5'
              }`}
            >
              {/* 卡片头部：封面/类型与徽标 */}
              <div className="flex items-start gap-3">
                {/* 封面缩略图或音频胶囊 */}
                <div className="relative size-14 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-center shrink-0 overflow-hidden shadow-xs group-hover:border-primary/40 transition-colors">
                  {isVideo ? (
                    item.poster ? (
                      <img src={item.poster} alt={item.title} className="size-full object-cover" />
                    ) : (
                      <Video className="size-6 text-primary/80" />
                    )
                  ) : (
                    <Headphones className="size-6 text-primary/80" />
                  )}

                  {/* 悬停播放遮罩 */}
                  <div
                    className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                      isCurrent ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Volume2 className="size-5 text-primary animate-pulse" />
                    ) : (
                      <Play className="size-5 text-primary fill-primary ml-0.5" />
                    )}
                  </div>

                  {/* 时长微标 */}
                  <div className="absolute right-1 bottom-1 px-1 rounded bg-black/70 text-[9px] font-mono text-white/90">
                    {formatDuration(item.duration)}
                  </div>
                </div>

                {/* 标题与场景标签（已移除等级） */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-medium flex items-center gap-1">
                      <span>{scenarioIcon}</span>
                      <span>{item.scenario}</span>
                    </span>
                  </div>

                  <h4
                    className={`text-xs sm:text-sm font-semibold line-clamp-2 leading-snug transition-colors ${
                      isCurrent ? 'text-primary' : 'text-foreground group-hover:text-primary'
                    }`}
                  >
                    {item.title}
                  </h4>
                </div>
              </div>

              {/* 卡片底栏：播放频次与操作 */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground/60" />
                  <span>已磨耳 {item.playCount} 次</span>
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="移除该片段"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
