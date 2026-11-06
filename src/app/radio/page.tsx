'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  type RadioItem,
  type RadioCategory,
  type RadioScenario,
  type PlayMode,
  RADIO_CATEGORY_LABELS,
  DEFAULT_RADIO_SCENARIOS,
  DEFAULT_SAMPLE_RADIO_ITEMS,
} from '@/resources/radioData'
import { RadioHeader } from '@/components/radio/RadioHeader'
import { RadioFilters } from '@/components/radio/RadioFilters'
import { RadioMainPlayer } from '@/components/radio/RadioMainPlayer'
import { RadioCardList } from '@/components/radio/RadioCardList'
import { RadioUploadModal } from '@/components/radio/RadioUploadModal'
import { ArrowLeft } from 'lucide-react'

type ActiveTab = RadioCategory | 'player'

const CATEGORY_TABS: RadioCategory[] = ['phrases', 'dialogue', 'radio']

export default function RadioPage() {
  // 当前激活的 Tab：'phrases' (日常短语) | 'dialogue' (场景对话) | 'radio' (英语电台) | 'player' (共用播放页)
  const [activeTab, setActiveTab] = useState<ActiveTab>('phrases')
  // 记录最近一次浏览的列表分类 Tab，用于从共用播放页点击「返回列表」及上传默认分类
  const [lastCategoryTab, setLastCategoryTab] = useState<RadioCategory>('phrases')

  // 视频列表（三个模块初始各有 1 个示例视频）
  const [items, setItems] = useState<RadioItem[]>(() => DEFAULT_SAMPLE_RADIO_ITEMS)
  const [currentId, setCurrentId] = useState<string>(() => DEFAULT_SAMPLE_RADIO_ITEMS[0]?.id || '')

  // 播放器状态
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [playMode, setPlayMode] = useState<PlayMode>('list-loop')
  const [volume, setVolume] = useState(0.8)

  // 筛选与检索状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScenario, setSelectedScenario] = useState<RadioScenario | 'all'>('all')

  // 弹窗状态
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // HTML5 播放器 Ref 句柄
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 当前正在播放的条目
  const currentItem = useMemo(() => {
    return items.find((i) => i.id === currentId) || items[0] || null
  }, [items, currentId])

  // 当前处于的模块分类（如果在播放页，则以当前播放视频所属分类或最近浏览的分类为准）
  const activeCategory: RadioCategory =
    activeTab === 'player' ? currentItem?.category || lastCategoryTab : activeTab

  // 「场景对话」模块下的场景标签池（内置五大默认场景 + 用户自定义新增的场景）
  const availableScenarios = useMemo(() => {
    const set = new Set<string>(DEFAULT_RADIO_SCENARIOS)
    items.forEach((item) => {
      if (item.category === 'dialogue' && item.scenario) {
        set.add(item.scenario)
      }
    })
    return Array.from(set)
  }, [items])

  // 各模块下的视频数量统计
  const categoryCounts = useMemo(() => {
    const counts: Record<RadioCategory, number> = { phrases: 0, dialogue: 0, radio: 0 }
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1
    })
    return counts
  }, [items])

  // 当前分类筛选后的列表
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.category !== activeCategory) return false
      if (activeCategory === 'dialogue' && selectedScenario !== 'all' && item.scenario !== selectedScenario) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchScenario = activeCategory === 'dialogue' && item.scenario.toLowerCase().includes(q)
        if (!matchTitle && !matchScenario) return false
      }
      return true
    })
  }, [items, activeCategory, selectedScenario, searchQuery])

  // 切换分类 Tab
  const handleSelectCategoryTab = (cat: RadioCategory) => {
    setActiveTab(cat)
    setLastCategoryTab(cat)
  }

  // 同步媒体源切换
  useEffect(() => {
    if (!currentItem) return

    const isVid = currentItem.type === 'video'
    const media = isVid ? videoRef.current : audioRef.current

    if (isVid && audioRef.current) {
      audioRef.current.pause()
    }
    if (!isVid && videoRef.current) {
      videoRef.current.pause()
    }

    if (media) {
      if (media.src !== currentItem.src) {
        media.src = currentItem.src
        media.load()
      }
      media.playbackRate = playbackRate
      media.volume = volume

      setCurrentTime(0)

      if (isPlaying) {
        media.play().catch((err) => {
          console.debug('Auto play interrupted:', err)
          setIsPlaying(false)
        })
      }
    }
  }, [currentItem?.id, currentItem?.src, currentItem?.type])

  // 播放 / 暂停切换
  const handleTogglePlay = useCallback(() => {
    if (!currentItem) return
    const media = currentItem.type === 'video' ? videoRef.current : audioRef.current
    if (!media) return

    if (isPlaying) {
      media.pause()
      setIsPlaying(false)
    } else {
      media.playbackRate = playbackRate
      media.volume = volume
      media
        .play()
        .then(() => {
          setIsPlaying(true)
          setItems((prev) =>
            prev.map((it) => (it.id === currentItem.id ? { ...it, playCount: it.playCount + 1 } : it))
          )
        })
        .catch((err) => {
          console.debug('Playback trigger prevented:', err)
          setIsPlaying(false)
        })
    }
  }, [currentItem, isPlaying, playbackRate, volume])

  // 拖拽进度寻道 (Seek)
  const handleSeek = (time: number) => {
    if (!currentItem) return
    const media = currentItem.type === 'video' ? videoRef.current : audioRef.current
    if (!media) return

    media.currentTime = time
    setCurrentTime(time)
  }

  // 倍速控制
  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate)
    if (videoRef.current) videoRef.current.playbackRate = rate
    if (audioRef.current) audioRef.current.playbackRate = rate
  }

  // 音量控制
  const handleChangeVolume = (vol: number) => {
    setVolume(vol)
    if (videoRef.current) videoRef.current.volume = vol
    if (audioRef.current) audioRef.current.volume = vol
  }

  // 切换上一首
  const handlePrev = useCallback(() => {
    if (filteredItems.length === 0) return
    const currentIndex = filteredItems.findIndex((i) => i.id === currentId)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1
    const target = filteredItems[prevIndex]
    if (target) {
      setCurrentId(target.id)
      setIsPlaying(true)
    }
  }, [filteredItems, currentId])

  // 切换下一首
  const handleNext = useCallback(() => {
    if (filteredItems.length === 0) return
    const currentIndex = filteredItems.findIndex((i) => i.id === currentId)
    const nextIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0
    const target = filteredItems[nextIndex]
    if (target) {
      setCurrentId(target.id)
      setIsPlaying(true)
    }
  }, [filteredItems, currentId])

  // 自然播毕后的自动切歌策略 (单曲循环 / 列表循环 / 随机播放 / 顺序播放)
  const handleAutoPlayNext = useCallback(() => {
    const media = currentItem?.type === 'video' ? videoRef.current : audioRef.current

    if (playMode === 'single-loop') {
      if (media) {
        media.currentTime = 0
        media.play().catch(() => {})
      }
      return
    }

    if (playMode === 'shuffle') {
      if (filteredItems.length <= 1) {
        if (media) {
          media.currentTime = 0
          media.play().catch(() => {})
        }
        return
      }
      const otherItems = filteredItems.filter((i) => i.id !== currentId)
      const randomTarget = otherItems[Math.floor(Math.random() * otherItems.length)]
      if (randomTarget) {
        setCurrentId(randomTarget.id)
        setIsPlaying(true)
      }
      return
    }

    const currentIndex = filteredItems.findIndex((i) => i.id === currentId)
    if (currentIndex < filteredItems.length - 1) {
      setCurrentId(filteredItems[currentIndex + 1].id)
      setIsPlaying(true)
    } else if (playMode === 'list-loop' && filteredItems.length > 0) {
      if (filteredItems.length === 1) {
        if (media) {
          media.currentTime = 0
          media.play().catch(() => {})
        }
      } else {
        setCurrentId(filteredItems[0].id)
        setIsPlaying(true)
      }
    } else {
      setIsPlaying(false)
    }
  }, [currentItem, playMode, filteredItems, currentId])

  // 监听当前活跃媒体元素的时间更新与结束事件
  useEffect(() => {
    if (!currentItem) return

    const media = currentItem.type === 'video' ? videoRef.current : audioRef.current
    if (!media) return

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime)
    }

    const handleLoadedMetadata = () => {
      if (media.duration && !isNaN(media.duration)) {
        const realDuration = media.duration
        setDuration(realDuration)
        setItems((prev) =>
          prev.map((it) => (it.id === currentItem.id ? { ...it, duration: Math.round(realDuration) } : it))
        )
      } else if (currentItem.duration) {
        setDuration(currentItem.duration)
      }
    }

    const handleEnded = () => {
      handleAutoPlayNext()
    }

    media.addEventListener('timeupdate', handleTimeUpdate)
    media.addEventListener('loadedmetadata', handleLoadedMetadata)
    media.addEventListener('ended', handleEnded)

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate)
      media.removeEventListener('loadedmetadata', handleLoadedMetadata)
      media.removeEventListener('ended', handleEnded)
    }
  }, [currentItem, handleAutoPlayNext])

  // 键盘快捷键监听：空格暂停/播放，方向键快退/快进 5s，中括号切曲
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        handleTogglePlay()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handleSeek(Math.max(0, currentTime - 5))
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleSeek(Math.min(duration, currentTime + 5))
      } else if (e.key === '[') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === ']') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleTogglePlay, currentTime, duration, handlePrev, handleNext])

  // 添加用户自定义视频
  const handleAddItem = (newItem: RadioItem) => {
    setItems((prev) => [newItem, ...prev])
    setLastCategoryTab(newItem.category)
    setCurrentId(newItem.id)
    setIsPlaying(true)
    setActiveTab('player')
  }

  // 删除视频
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (currentId === id) {
      const remaining = items.filter((i) => i.id !== id)
      if (remaining.length > 0) {
        setCurrentId(remaining[0].id)
      } else {
        setCurrentId('')
        setIsPlaying(false)
      }
    }
  }

  return (
    <div className="radio-page flex-1 min-h-full w-full flex flex-col bg-background text-foreground animate-fadeIn pb-12">
      {/* 主工作舞台容器 */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-10 pt-6 space-y-5">
        {/* 顶部标题、搜索与上传入口 */}
        <RadioHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={items.length}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Tab 导航：常用短语 / 场景对话 / 英语电台 / 共用播放页 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border">
          <div className="flex items-center gap-6 select-none">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategoryTab(cat)}
                className={`-mb-px pb-2.5 text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === cat
                    ? 'text-foreground font-medium border-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                {RADIO_CATEGORY_LABELS[cat]}
                <span className="ml-1.5 text-xs font-mono text-muted-foreground">{categoryCounts[cat]}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setActiveTab('player')}
              className={`-mb-px pb-2.5 text-sm border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'player'
                  ? 'text-foreground font-medium border-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              播放页
              {isPlaying && <span className="size-1.5 rounded-full bg-primary animate-pulse" title="正在播放" />}
            </button>
          </div>

          {activeTab === 'player' ? (
            <button
              type="button"
              onClick={() => setActiveTab(currentItem?.category || lastCategoryTab)}
              className="mb-1.5 self-start sm:self-auto h-7 px-2 rounded-md inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              返回列表
            </button>
          ) : (
            currentItem && (
              <button
                type="button"
                onClick={() => setActiveTab('player')}
                className="mb-1.5 hidden sm:inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="前往播放页"
              >
                当前：
                <span className="text-foreground truncate max-w-[200px] md:max-w-[280px]">{currentItem.title}</span>
                <span className="text-primary">→</span>
              </button>
            )
          )}
        </div>

        {/* 列表 Tab 内容区：日常短语 / 场景对话 / 英语电台 */}
        <div className={activeTab !== 'player' ? 'space-y-6 animate-fadeIn' : 'hidden'}>
          {/* 仅「场景对话」显示场景分类筛选 */}
          {activeTab === 'dialogue' && (
            <RadioFilters
              selectedScenario={selectedScenario}
              onSelectScenario={setSelectedScenario}
              availableScenarios={availableScenarios}
            />
          )}

          {/* 视频列表：仅「场景对话」显示场景副标题，日常短语和英语电台只显示名称 */}
          <RadioCardList
            items={filteredItems}
            currentId={currentId}
            isPlaying={isPlaying}
            showMetadata={activeTab === 'dialogue'}
            onSelectItem={(item) => {
              setLastCategoryTab(item.category)
              setCurrentId(item.id)
              setIsPlaying(true)
              setActiveTab('player')
            }}
            onTogglePlay={handleTogglePlay}
            onDeleteItem={handleDeleteItem}
          />
        </div>

        {/* 共用播放页 (日常短语 / 场景对话 / 英语电台 共用) */}
        <div className={activeTab === 'player' ? 'space-y-6 animate-fadeIn' : 'hidden'}>
          <RadioMainPlayer
            item={currentItem}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onPrev={handlePrev}
            onNext={handleNext}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            playbackRate={playbackRate}
            onChangePlaybackRate={handleChangePlaybackRate}
            playMode={playMode}
            onChangePlayMode={setPlayMode}
            volume={volume}
            onChangeVolume={handleChangeVolume}
            videoRef={videoRef}
            audioRef={audioRef}
          />
        </div>
      </div>

      {/* 上传自定义视频弹窗 */}
      <RadioUploadModal
        isOpen={isUploadOpen}
        defaultCategory={activeCategory}
        onClose={() => setIsUploadOpen(false)}
        onAddItem={handleAddItem}
      />

      {/* 原生隐藏式音频播放节点 */}
      <audio ref={audioRef} preload="auto" className="hidden" />
    </div>
  )
}
