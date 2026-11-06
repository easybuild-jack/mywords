'use client'

import React from 'react'
import { type RadioItem } from '@/resources/radioData'
import { Play, Video, Trash2, Volume2 } from 'lucide-react'

interface RadioCardListProps {
  items: RadioItem[]
  currentId: string | null
  isPlaying: boolean
  /** 是否显示场景分类等副标题信息（仅「场景对话」Tab 开启，日常短语与英语电台只显示名称） */
  showMetadata?: boolean
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
  showMetadata = false,
  onSelectItem,
  onTogglePlay,
  onDeleteItem,
}: RadioCardListProps) {
  if (items.length === 0) {
    return (
      <div className="py-16 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-foreground">暂无视频内容</p>
        <p className="mt-1.5 text-xs text-muted-foreground">点击右上角「上传视频」添加自定义视频</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border">
        <span>
          共 <span className="font-mono text-foreground">{items.length}</span> 个视频
        </span>
        <span>点击即可播放</span>
      </div>

      <ol className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
        {items.map((item, idx) => {
          const isCurrent = item.id === currentId

          return (
            <li
              key={item.id}
              onClick={() => {
                if (isCurrent) {
                  onTogglePlay()
                } else {
                  onSelectItem(item)
                }
              }}
              className="group flex items-center gap-4 py-3 border-b border-border cursor-pointer"
            >
              <span className="w-6 text-right font-mono text-xs tabular-nums text-muted-foreground/70 shrink-0">
                {isCurrent && isPlaying ? (
                  <Volume2 className="size-3.5 text-primary animate-pulse ml-auto" />
                ) : (
                  <>
                    <span className="group-hover:hidden">{String(idx + 1).padStart(2, '0')}</span>
                    <Play className="size-3.5 text-foreground fill-current ml-auto hidden group-hover:block" />
                  </>
                )}
              </span>

              <div className="relative size-11 rounded-md bg-muted/60 flex items-center justify-center shrink-0 overflow-hidden">
                {item.poster ? (
                  <img src={item.poster} alt={item.title} className="size-full object-cover" />
                ) : (
                  <Video className="size-4.5 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4
                  className={`text-sm line-clamp-1 transition-colors ${
                    isCurrent ? 'text-primary font-medium' : 'text-foreground group-hover:text-primary'
                  }`}
                  title={item.title}
                >
                  {item.title}
                </h4>
                {showMetadata && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.scenario} · 已看 <span className="font-mono">{item.playCount}</span> 次
                  </p>
                )}
              </div>

              <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">
                {formatDuration(item.duration)}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteItem(item.id)
                }}
                className="size-7 rounded-md flex items-center justify-center text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer shrink-0"
                title="移除该视频"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
