'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  type RadioItem,
  type RadioCategory,
  type RadioScenario,
  RADIO_CATEGORY_LABELS,
} from '@/resources/radioData'
import {
  X,
  Upload,
  Video,
  Check,
  AlertCircle,
} from 'lucide-react'

interface RadioUploadModalProps {
  isOpen: boolean
  defaultCategory: RadioCategory
  onClose: () => void
  onAddItem: (item: RadioItem) => void
}

const CATEGORIES: RadioCategory[] = ['phrases', 'dialogue', 'radio']

const COMMON_SCENARIOS = [
  '日常生活',
  '职场商务',
  '旅游出行',
  '餐饮美食',
  '购物消费',
]

export function RadioUploadModal({
  isOpen,
  defaultCategory,
  onClose,
  onAddItem,
}: RadioUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<RadioCategory>(defaultCategory)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string>('')
  const [title, setTitle] = useState('')
  const [scenario, setScenario] = useState<RadioScenario>('日常生活')
  const [customScenario, setCustomScenario] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory)
      setSelectedFile(null)
      setFileUrl('')
      setTitle('')
      setScenario('日常生活')
      setCustomScenario('')
      setError('')
    }
  }, [isOpen, defaultCategory])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const processFile = (file: File) => {
    setError('')
    setSelectedFile(file)

    // 默认标题使用文件名（去掉后缀）
    const defaultName = file.name.replace(/\.[^/.]+$/, '')
    setTitle(defaultName)

    // 创建本地 Blob URL 供即时播放预览
    const url = URL.createObjectURL(file)
    setFileUrl(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile && !fileUrl) {
      setError('请先选择或拖拽一个视频文件')
      return
    }

    if (!title.trim()) {
      setError('请输入视频名称')
      return
    }

    const finalScenario = category === 'dialogue' ? (customScenario.trim() || scenario) : ''

    const newItem: RadioItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category,
      title: title.trim(),
      type: 'video',
      src: fileUrl,
      duration: 60, // 初始估算，实际播放时会自动根据 duration 动态纠正
      scenario: finalScenario,
      createdAt: Date.now(),
      playCount: 0,
    }

    onAddItem(newItem)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-xl h-[600px] max-h-[90vh] flex flex-col rounded-xl bg-sidebar border border-border shadow-xl overflow-hidden">
        {/* 顶部标题栏 */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Upload className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">上传自定义视频</h3>
              <p className="text-xs text-muted-foreground">上传视频至对应模块，即传即播</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 表单内容区 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 所属模块选择 */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              所属模块
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`h-9 rounded-lg text-xs font-medium transition-all cursor-pointer border ${category === cat
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {RADIO_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* 文件拖拽/选择区 */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              视频文件 (MP4, WebM, MOV)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${selectedFile
                ? 'border-primary/60 bg-primary/5'
                : 'border-border/80 hover:border-primary/40 bg-card/40 hover:bg-card/80'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mp4,.webm,.mov"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3 text-xs text-foreground">
                  <Video className="size-6 text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-semibold truncate max-w-xs">{selectedFile.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · 视频文件
                    </p>
                  </div>
                  <span className="text-xs text-primary font-mono ml-auto shrink-0">点击重选</span>
                </div>
              ) : (
                <div className="space-y-1.5 text-muted-foreground">
                  <Upload className="size-7 mx-auto text-muted-foreground/60" />
                  <p className="text-xs font-medium text-foreground">点击浏览或将视频文件拖至此处</p>
                  <p className="text-[11px] text-muted-foreground">支持 MP4, WebM, MOV 等常见视频格式</p>
                </div>
              )}
            </div>
          </div>

          {/* 视频名称 */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              视频名称 <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：机场值机与安检实录"
              className="w-full h-9 px-3 rounded-xl bg-card border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* 仅「场景对话」展示场景分类选择 */}
          {category === 'dialogue' && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                所属场景分类
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_SCENARIOS.map((sc) => (
                  <button
                    type="button"
                    key={sc}
                    onClick={() => {
                      setScenario(sc)
                      setCustomScenario('')
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer border ${scenario === sc && !customScenario
                      ? 'bg-primary/20 border-primary text-primary font-semibold'
                      : 'bg-card/60 border-border/60 text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="或者输入自定义场景名称..."
                className="w-full h-8 px-3 rounded-xl bg-card border border-border/80 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
              />
            </div>
          )}
        </form>

        {/* 底部按钮区 */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-3.5 border-t border-border/60 bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Check className="size-3.5" />
            <span>保存并播放</span>
          </button>
        </div>
      </div>
    </div>
  )
}
