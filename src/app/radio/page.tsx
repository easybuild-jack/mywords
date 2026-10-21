'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  type RadioItem,
  type RadioScenario,
  type RadioMediaType,
  type PlayMode,
  DEFAULT_SAMPLE_RADIO_ITEMS,
} from '@/resources/radioData'
import { RadioHeader } from '@/components/radio/RadioHeader'
import { RadioFilters } from '@/components/radio/RadioFilters'
import { RadioMainPlayer } from '@/components/radio/RadioMainPlayer'
import { RadioCardList } from '@/components/radio/RadioCardList'
import { RadioUploadModal } from '@/components/radio/RadioUploadModal'

export default function RadioPage() {
  // 电台媒体库列表（初始化为高质量内置原声范例）
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
  const [selectedMediaType, setSelectedMediaType] = useState<RadioMediaType | 'all'>('all')

  // 弹窗状态
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // HTML5 播放器 Ref 句柄
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 当前正在播放的条目
  const currentItem = useMemo(() => {
    return items.find((i) => i.id === currentId) || items[0] || null
  }, [items, currentId])

  // 所有出现过的场景标签池
  const availableScenarios = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => {
      if (item.scenario) set.add(item.scenario)
    })
    return Array.from(set)
  }, [items])

  // 筛选后的结果列表
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedScenario !== 'all' && item.scenario !== selectedScenario) return false
      if (selectedMediaType !== 'all' && item.type !== selectedMediaType) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchScenario = item.scenario.toLowerCase().includes(q)
        const matchDesc = item.description?.toLowerCase().includes(q)
        if (!matchTitle && !matchScenario && !matchDesc) return false
      }
      return true
    })
  }, [items, selectedScenario, selectedMediaType, searchQuery])

  // 初始化纯音频播放器实例
  useEffect(() => {
    if (typeof window === 'undefined') return
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

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

  // 监听当前活跃媒体元素的时间更新与结束事件
  useEffect(() => {
    if (!currentItem) return

    const media = currentItem.type === 'video' ? videoRef.current : audioRef.current
    if (!media) return

    const handleTimeUpdate = () => {
      const cur = media.currentTime
      setCurrentTime(cur)
    }

    const handleLoadedMetadata = () => {
      if (media.duration && !isNaN(media.duration)) {
        setDuration(media.duration)
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
  }, [currentItem, playMode, filteredItems])

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
          // 增加该片段播放热度计数
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
      // 还有下一首
      setCurrentId(filteredItems[currentIndex + 1].id)
      setIsPlaying(true)
    } else if (playMode === 'list-loop') {
      // 列表循环，回到第一首
      setCurrentId(filteredItems[0].id)
      setIsPlaying(true)
    } else {
      // 顺序播放到达末尾
      setIsPlaying(false)
    }
  }, [currentItem, playMode, filteredItems, currentId])

  // 键盘快捷键监听：空格暂停/播放，方向键快退/快进 5s，中括号切曲
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在输入框中打字，不拦截快捷键
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

  // 添加用户自定义片段
  const handleAddItem = (newItem: RadioItem) => {
    setItems((prev) => [newItem, ...prev])
    setCurrentId(newItem.id)
    setIsPlaying(true)
  }

  // 删除片段
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

  const videoCount = items.filter((i) => i.type === 'video').length
  const audioCount = items.filter((i) => i.type === 'audio').length

  return (
    <div className="radio-page flex-1 min-h-full w-full flex flex-col bg-background text-foreground animate-fadeIn pb-12">
      {/* 主工作舞台容器 */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-10 pt-6 space-y-6">
        {/* 顶部标题、搜索与上传入口 */}
        <RadioHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={items.length}
          videoCount={videoCount}
          audioCount={audioCount}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* 场景分类与媒体类型筛选 */}
        <RadioFilters
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
          selectedMediaType={selectedMediaType}
          onSelectMediaType={setSelectedMediaType}
          availableScenarios={availableScenarios}
        />

        {/* 视听大舞台 (Main Stage) */}
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
        />

        {/* 媒体片段曲库卡片列表 */}
        <RadioCardList
          items={filteredItems}
          currentId={currentId}
          isPlaying={isPlaying}
          onSelectItem={(item) => {
            setCurrentId(item.id)
            setIsPlaying(true)
          }}
          onTogglePlay={handleTogglePlay}
          onDeleteItem={handleDeleteItem}
        />
      </div>

      {/* 上传自定义音视频弹窗 */}
      <RadioUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddItem={handleAddItem}
      />
    </div>
  )
}
