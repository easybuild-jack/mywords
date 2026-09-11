'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Trash2,
  Send,
  MessageSquare,
  History,
  Plus,
  ChevronRight,
  MessageCircle,
  GripHorizontal,
} from 'lucide-react'
import { useAiAssistantStore, type AiSession } from '@/store/useAiAssistantStore'
import { AiMessageItem } from './AiMessageItem'
import { Tooltip } from '@/components/ui/Tooltip'

export function AiAssistantDrawer() {
  const {
    isOpen,
    closeDrawer,
    toggleDrawer,
    messages,
    inputPrompt,
    setInputPrompt,
    sendMessage,
    isThinking,
    activeTab,
    setActiveTab,
    sessions,
    currentSessionId,
    createNewSession,
    switchSession,
    deleteSession,
  } = useAiAssistantStore()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isCustomWidthRef = useRef(false)

  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // 默认宽度为浏览器宽度的 1/3 (min 360px)
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(360, Math.round(window.innerWidth / 3))
    }
    return 480
  })

  // 默认高度适应屏幕
  const [drawerHeight, setDrawerHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight
    }
    return 800
  })

  // 窗口自由定位 (x, y) 坐标，null 表示默认靠在屏幕最右侧贴边
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)

  // 每次关闭抽屉后，重置定位状态，确保下次默认打开时始终靠在最右侧
  useEffect(() => {
    if (!isOpen) {
      setPosition(null)
    }
  }, [isOpen])

  // 打开或窗口大小变化时，若未自定义拉伸过宽度，维持 1/3 屏宽
  useEffect(() => {
    if (!isOpen) return

    const handleWindowResize = () => {
      if (typeof window === 'undefined') return

      if (!isCustomWidthRef.current) {
        setDrawerWidth(Math.max(360, Math.round(window.innerWidth / 3)))
      }

      // 如果未拖拽，高度随窗口满屏自适应
      if (position === null) {
        setDrawerHeight(window.innerHeight)
      } else {
        // 若已拖拽，校准位置与最大高度，防止窗口跑到屏幕外
        setPosition((prev) => {
          if (!prev) return null
          return {
            x: Math.max(10, Math.min(prev.x, window.innerWidth - 120)),
            y: Math.max(0, Math.min(prev.y, window.innerHeight - 60)),
          }
        })
      }
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [isOpen, position])

  // 快捷键 Ctrl + / 切换，Escape 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        toggleDrawer()
      } else if (e.key === 'Escape' && isOpen) {
        closeDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, toggleDrawer, closeDrawer])

  // 新消息或思考时滚动到底部
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isThinking, isOpen, activeTab])

  // 展开且位于当前对话时自动聚焦输入框
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, activeTab])

  // ===================== 顶部栏拖拽逻辑 =====================
  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 点击按钮、输入框、链接等交互元素时不触发拖动
    if ((e.target as HTMLElement).closest('button, input, textarea, a, [data-no-drag]')) {
      return
    }

    e.preventDefault()
    setIsDragging(true)

    const startPointerX = e.clientX
    const startPointerY = e.clientY
    // 初始如果靠右（position 为 null），记录当前的实际贴右位置
    const startX = position?.x ?? (window.innerWidth - drawerWidth)
    const startY = position?.y ?? 0

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startPointerX
      const deltaY = moveEvent.clientY - startPointerY

      const nextX = startX + deltaX
      const nextY = startY + deltaY

      // 限制在屏幕内，保留顶部标题栏始终可见以便拖回
      const clampedX = Math.max(-drawerWidth + 120, Math.min(nextX, window.innerWidth - 80))
      const clampedY = Math.max(0, Math.min(nextY, window.innerHeight - 50))

      setPosition({ x: clampedX, y: clampedY })
      // 脱离贴边时，赋予合理的独立浮动高度
      setDrawerHeight((prev) => (prev >= window.innerHeight ? Math.max(480, window.innerHeight - 32) : prev))
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      document.body.style.userSelect = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    document.body.style.userSelect = 'none'
  }

  // ===================== 左边缘拉伸宽度逻辑 =====================
  const handleLeftResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    isCustomWidthRef.current = true

    const startPointerX = e.clientX
    const startWidth = drawerWidth
    const startX = position?.x ?? (window.innerWidth - drawerWidth)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = startPointerX - moveEvent.clientX
      const minW = 340
      const maxW = Math.round(window.innerWidth * 0.9)
      const newW = Math.min(Math.max(startWidth + deltaX, minW), maxW)
      const actualDelta = newW - startWidth
      const newX = startX - actualDelta

      setDrawerWidth(newW)
      // 如果之前是贴右态，调整宽度时继续贴右或者保持对应位置
      if (position !== null) {
        setPosition((prev) => ({
          x: newX,
          y: prev?.y ?? 0,
        }))
      }
    }

    const handlePointerUp = () => {
      setIsResizing(false)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  // ===================== 右边缘拉伸宽度逻辑 =====================
  const handleRightResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    isCustomWidthRef.current = true

    const startPointerX = e.clientX
    const startWidth = drawerWidth

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startPointerX
      const minW = 340
      const maxW = Math.round(window.innerWidth * 0.9)
      const newW = Math.min(Math.max(startWidth + deltaX, minW), maxW)
      setDrawerWidth(newW)
    }

    const handlePointerUp = () => {
      setIsResizing(false)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  // ===================== 底部边缘调节高度逻辑 =====================
  const handleBottomResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startPointerY = e.clientY
    const startHeight = drawerHeight

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startPointerY
      const minH = 380
      const currentY = position?.y ?? 0
      const maxH = Math.round(window.innerHeight - currentY)
      const newH = Math.min(Math.max(startHeight + deltaY, minH), maxH)
      setDrawerHeight(newH)
    }

    const handlePointerUp = () => {
      setIsResizing(false)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'row-resize'
  }

  // ===================== 右下角对角线自由调节逻辑 =====================
  const handleCornerResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    isCustomWidthRef.current = true

    const startPointerX = e.clientX
    const startPointerY = e.clientY
    const startWidth = drawerWidth
    const startHeight = drawerHeight
    const currentY = position?.y ?? 0

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startPointerX
      const deltaY = moveEvent.clientY - startPointerY
      const minW = 340
      const maxW = Math.round(window.innerWidth * 0.9)
      const minH = 380
      const maxH = Math.round(window.innerHeight - currentY)

      setDrawerWidth(Math.min(Math.max(startWidth + deltaX, minW), maxW))
      setDrawerHeight(Math.min(Math.max(startHeight + deltaY, minH), maxH))
    }

    const handlePointerUp = () => {
      setIsResizing(false)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'nwse-resize'
  }

  // 双击手柄快速复位：恢复 1/3 屏宽并重新紧贴在屏幕最右侧
  const handleDoubleClickReset = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isCustomWidthRef.current = false
    if (typeof window !== 'undefined') {
      const defaultW = Math.max(360, Math.round(window.innerWidth / 3))
      setDrawerWidth(defaultW)
      setDrawerHeight(window.innerHeight)
      setPosition(null) // 恢复贴最右侧状态
    }
  }

  const handleSend = () => {
    if (!inputPrompt.trim()) return
    sendMessage(inputPrompt)
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 计算当前坐标：若 position 为 null，则紧密贴在最右侧 (x = innerWidth - width, y = 0)
  const isDockedRight = position === null
  const currentPos = position ?? {
    x: typeof window !== 'undefined' ? window.innerWidth - drawerWidth : 0,
    y: 0,
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, x: isDockedRight ? 60 : 0 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.98, x: isDockedRight ? 60 : 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{
            width: `${drawerWidth}px`,
            height: isDockedRight ? '100vh' : `${drawerHeight}px`,
            left: `${currentPos.x}px`,
            top: `${currentPos.y}px`,
            backgroundColor: 'var(--background)',
            opacity: 1,
          }}
          className={`fixed z-[150] flex flex-col text-foreground select-none overflow-hidden transition-[border-radius] ${
            isDockedRight
              ? 'border-l border-border rounded-l-2xl rounded-r-none shadow-[-16px_0_40px_rgba(0,0,0,0.15)] dark:shadow-[-16px_0_40px_rgba(0,0,0,0.6)]'
              : 'border border-border rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.7)] ring-1 ring-border/50'
          }`}
        >
          {/* 左边缘手动拖拽宽度手柄 */}
          <div
            onPointerDown={handleLeftResizePointerDown}
            onDoubleClick={handleDoubleClickReset}
            title="按住左右拖拽调节宽度，双击快速贴右并恢复 1/3 屏宽"
            className="absolute -left-1.5 top-3 bottom-3 w-3.5 cursor-col-resize z-50 flex items-center justify-center group select-none"
          >
            <div
              className={`w-1 rounded-full transition-all duration-150 ${
                isResizing
                  ? 'h-24 bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb)/0.9)]'
                  : 'h-12 bg-border group-hover:h-20 group-hover:bg-primary/80 group-hover:shadow-[0_0_8px_rgba(var(--primary-rgb)/0.6)]'
              }`}
            />
          </div>

          {/* 自由悬浮态下的辅助拉伸手柄 */}
          {!isDockedRight && (
            <>
              {/* 右边缘调节宽度手柄 */}
              <div
                onPointerDown={handleRightResizePointerDown}
                title="按住左右拖拽调节宽度"
                className="absolute -right-1.5 top-3 bottom-3 w-3.5 cursor-col-resize z-50 flex items-center justify-center group select-none"
              >
                <div className="w-1 h-12 bg-border group-hover:h-20 group-hover:bg-primary/80 rounded-full transition-all" />
              </div>

              {/* 底部边缘调节高度手柄 */}
              <div
                onPointerDown={handleBottomResizePointerDown}
                title="按住上下拖拽调节高度"
                className="absolute left-6 right-6 -bottom-1.5 h-3 cursor-row-resize z-50 flex items-center justify-center group select-none"
              >
                <div className="h-1 w-20 bg-border group-hover:w-32 group-hover:bg-primary/80 rounded-full transition-all" />
              </div>

              {/* 右下角对角线自由调节手柄 */}
              <div
                onPointerDown={handleCornerResizePointerDown}
                title="按住自由调节宽高"
                className="absolute right-0 bottom-0 size-4.5 cursor-nwse-resize z-50 flex items-end justify-end p-1 group select-none"
              >
                <div className="size-2 border-r-2 border-b-2 border-border group-hover:border-primary transition-colors" />
              </div>
            </>
          )}

          {/* ===================== 顶部栏（支持整栏拖动位置） ===================== */}
          <div
            onPointerDown={handleHeaderPointerDown}
            onDoubleClick={handleDoubleClickReset}
            title="按住可拖动窗口，双击快速贴回最右侧"
            className={`shrink-0 h-13 px-3.5 border-b border-border bg-muted/40 flex items-center justify-between gap-2 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* 左侧：标签页切换（当前对话 / 历史记录） */}
            <div className="flex items-center p-0.5 rounded-xl bg-muted border border-border shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="size-3.5" />
                <span>当前对话</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="size-3.5" />
                <span>历史记录</span>
                {sessions.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeTab === 'history'
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted-foreground/15 text-muted-foreground'
                    }`}
                  >
                    {sessions.length}
                  </span>
                )}
              </button>
            </div>

            {/* 中间：拖拽手柄视觉提示 */}
            <div
              className="flex-1 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors pointer-events-none"
              title="按住顶部栏可随意拖拽窗口"
            >
              <GripHorizontal className="size-4.5" />
            </div>

            {/* 右侧：新对话按钮 + 关闭按钮 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={createNewSession}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-foreground bg-muted hover:bg-muted/80 border border-border hover:border-primary/50 transition-all cursor-pointer shadow-sm"
                title="开启新对话"
              >
                <Plus className="size-3.5 text-primary" />
                <span>新对话</span>
              </button>

              <Tooltip content="收起 Copilot (Esc)" side="bottom">
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer ml-0.5"
                >
                  <X className="size-4" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* ===================== 主体内容展示区 ===================== */}
          <div className="flex-1 min-h-0 flex flex-col">
            {activeTab === 'chat' ? (
              /* 当前对话模式 */
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <div className="size-14 rounded-2xl bg-card border border-border flex items-center justify-center p-2 mb-3 shadow-sm">
                      <img src="/logo.svg" alt="MyWords Copilot" className="size-full object-contain" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      有什么我可以帮你的？
                    </p>
                    <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                      随时输入你想探讨的任何语法结构、长难句拆解、学术写作润色或复杂问题。
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <AiMessageItem key={msg.id} message={msg} />
                  ))
                )}

                {/* 思考等待状态 */}
                {isThinking && (
                  <div className="flex items-center gap-2.5 p-2.5 px-3 rounded-xl bg-card border border-border text-xs text-muted-foreground animate-pulse my-3 w-fit shadow-sm">
                    <img src="/logo.svg" alt="思考中" className="size-3.5 object-contain animate-spin" />
                    <span>MyWords Copilot 正在思考并组织回复...</span>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-2" />
              </div>
            ) : (
              /* 历史记录模式 */
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-xs font-semibold text-foreground">
                    对话会话列表 ({sessions.length})
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    点击卡片切换查看
                  </span>
                </div>

                {sessions.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <div className="size-12 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground mb-3">
                      <History className="size-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">暂无历史记录</p>
                    <p className="text-xs text-muted-foreground mb-4">开启对话后会自动保存于此</p>
                    <button
                      onClick={createNewSession}
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors cursor-pointer shadow-sm"
                    >
                      立即开始对话
                    </button>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onSelect={() => switchSession(session.id)}
                      onDelete={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* ===================== 底部输入与操作区域 ===================== */}
          {activeTab === 'chat' ? (
            /* 当前对话输入框 */
            <div
              style={{ backgroundColor: 'var(--background)' }}
              className="p-3.5 shrink-0 border-t border-border"
            >
              <div className="relative rounded-2xl bg-card border border-border focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="向 MyWords Copilot 提问，按 Enter 发送..."
                  rows={2}
                  className="w-full bg-transparent px-3.5 pt-2.5 pb-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none caret-primary leading-relaxed"
                />

                <div className="absolute left-3 bottom-2 right-2 flex items-center justify-between pointer-events-auto">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Enter 发送 · Shift+Enter 换行
                  </span>

                  <button
                    disabled={!inputPrompt.trim()}
                    onClick={handleSend}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs btn-neon-glow hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                  >
                    <span>发送</span>
                    <Send className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 历史记录底部快捷按钮 */
            <div
              style={{ backgroundColor: 'var(--background)' }}
              className="p-3.5 shrink-0 border-t border-border flex items-center justify-between gap-3"
            >
              <span className="text-xs text-muted-foreground font-mono">
                共 {sessions.length} 个历史会话
              </span>
              <button
                onClick={createNewSession}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer shadow-sm"
              >
                <Plus className="size-3.5" />
                <span>开启新对话</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** 历史记录会话卡片 */
function SessionCard({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: AiSession
  isActive: boolean
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const lastMessage = session.messages[session.messages.length - 1]
  const previewText = lastMessage
    ? lastMessage.content.slice(0, 60).replace(/\n/g, ' ')
    : '暂无消息'

  return (
    <div
      onClick={onSelect}
      className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
        isActive
          ? 'bg-primary/10 border-primary/40 shadow-sm'
          : 'bg-card hover:bg-muted/50 border-border hover:border-primary/30'
      }`}
    >
      {/* 头部：标题与时间 */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className={`size-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <h4 className="text-xs font-semibold text-foreground truncate">
            {session.title || '新对话'}
          </h4>
          {isActive && (
            <span className="shrink-0 text-[9px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
              进行中
            </span>
          )}
        </div>

        <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
          {formatSessionTime(session.updatedAt)}
        </span>
      </div>

      {/* 消息预览 */}
      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2 font-sans">
        {previewText}
      </p>

      {/* 底部信息与操作 */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-[10px] text-muted-foreground font-mono">
          {session.messages.length} 条消息
        </span>

        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDelete}
            title="删除此会话"
            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3" />
          </button>
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  )
}

function formatSessionTime(timestamp: number) {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  const d = new Date(timestamp)
  const isToday = new Date().toDateString() === d.toDateString()
  if (isToday) {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}
