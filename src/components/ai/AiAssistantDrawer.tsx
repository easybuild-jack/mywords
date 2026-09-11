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
  Clock,
  ChevronRight,
  MessageCircle,
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
    clearMessages,
    clearAllSessions,
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
  const isDraggingRef = useRef(false)
  const isCustomWidthRef = useRef(false)

  const [isResizing, setIsResizing] = useState(false)
  // 默认宽度为浏览器宽度的 1/3 (宽屏 1920px 时约为 640px)
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(340, Math.round(window.innerWidth / 3))
    }
    return 440
  })

  // 打开抽屉或窗口缩放时（若未手动拖拽过），自适应维持 1/3 屏宽
  useEffect(() => {
    const updateDefaultWidth = () => {
      if (!isCustomWidthRef.current && typeof window !== 'undefined') {
        setDrawerWidth(Math.max(340, Math.round(window.innerWidth / 3)))
      }
    }

    if (isOpen) {
      updateDefaultWidth()
    }

    window.addEventListener('resize', updateDefaultWidth)
    return () => window.removeEventListener('resize', updateDefaultWidth)
  }, [isOpen])

  // 监听全局快捷键 Ctrl + / 切换抽屉，Escape 关闭
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

  // 展开抽屉且位于当前对话时自动聚焦输入框
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [isOpen, activeTab])

  // 左边缘鼠标拖拽拉伸逻辑
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = drawerWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return
      isCustomWidthRef.current = true
      const deltaX = startX - moveEvent.clientX
      const minW = Math.min(320, window.innerWidth * 0.9)
      const maxW = Math.round(window.innerWidth * 0.85)
      const newW = Math.min(Math.max(startWidth + deltaX, minW), maxW)
      setDrawerWidth(newW)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // 双击手柄快速重置为 1/3 屏宽
  const handleDoubleClickReset = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isCustomWidthRef.current = false
    if (typeof window !== 'undefined') {
      setDrawerWidth(Math.max(340, Math.round(window.innerWidth / 3)))
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩（点击可收起） */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-50 transition-opacity"
          />

          {/* 抽屉主面板：默认 1/3 屏幕宽，支持拖拽边缘手动拉伸 */}
          <motion.aside
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.3 }}
            transition={
              isResizing
                ? { duration: 0 }
                : { type: 'spring', damping: 28, stiffness: 280 }
            }
            style={{ width: `${drawerWidth}px` }}
            className="fixed right-0 top-0 h-screen z-50 flex flex-col max-w-[95vw] bg-sidebar/95 backdrop-blur-2xl border-l border-white/10 shadow-[-16px_0_40px_rgba(0,0,0,0.6)] text-white select-none"
          >
            {/* 左边缘手动拖拽手柄 */}
            <div
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClickReset}
              title="按住左右拖拽调节抽屉宽度，双击重置为 1/3 屏宽"
              className="absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize z-50 flex items-center justify-center group select-none"
            >
              {/* 可视化呼吸把手 */}
              <div
                className={`w-1 rounded-full transition-all duration-150 ${
                  isResizing
                    ? 'h-24 bg-primary shadow-[0_0_12px_rgba(94,234,212,0.9)]'
                    : 'h-12 bg-white/20 group-hover:h-20 group-hover:bg-primary/80 group-hover:shadow-[0_0_8px_rgba(94,234,212,0.6)]'
                }`}
              />
            </div>

            {/* ===================== 顶部标签栏（整合新对话与关闭按钮） ===================== */}
            <div className="shrink-0 h-13 px-3.5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-2">
              {/* 左侧：标签页切换（当前对话 / 历史记录） */}
              <div className="flex items-center p-0.5 rounded-xl bg-white/[0.04] border border-white/8">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-primary text-[#0B0C0E] font-bold shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="size-3.5" />
                  <span>当前对话</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-primary text-[#0B0C0E] font-bold shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <History className="size-3.5" />
                  <span>历史记录</span>
                  {sessions.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        activeTab === 'history'
                          ? 'bg-[#0B0C0E]/25 text-[#0B0C0E]'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {sessions.length}
                    </span>
                  )}
                </button>
              </div>

              {/* 右侧：新对话按钮 + 关闭按钮 */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={createNewSession}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-200 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/8 hover:border-primary/40 transition-all cursor-pointer shadow-sm"
                  title="开启新对话"
                >
                  <Plus className="size-3.5 text-primary" />
                  <span>新对话</span>
                </button>

                <Tooltip content="收起抽屉 (Esc)" side="bottom">
                  <button
                    onClick={closeDrawer}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer ml-0.5"
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
                      <div className="size-14 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center justify-center p-2 mb-3 shadow-inner">
                        <img src="/logo.svg" alt="MyWords 顾问" className="size-full object-contain" />
                      </div>
                      <p className="text-sm font-medium text-white mb-1">
                        有什么我可以帮你的？
                      </p>
                      <p className="text-xs text-gray-400 max-w-[260px] leading-relaxed">
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
                    <div className="flex items-center gap-2.5 p-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/6 text-xs text-muted-foreground animate-pulse my-3 w-fit">
                      <img src="/logo.svg" alt="思考中" className="size-3.5 object-contain animate-spin" />
                      <span>MyWords 顾问正在思考并组织回复...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} className="h-2" />
                </div>
              ) : (
                /* 历史记录模式 */
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-xs font-semibold text-gray-300">
                      对话会话列表 ({sessions.length})
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      点击卡片切换查看
                    </span>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                      <div className="size-12 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center justify-center text-gray-500 mb-3">
                        <History className="size-5" />
                      </div>
                      <p className="text-sm font-medium text-gray-300 mb-1">暂无历史记录</p>
                      <p className="text-xs text-gray-500 mb-4">开启对话后会自动保存于此</p>
                      <button
                        onClick={createNewSession}
                        className="px-3 py-1.5 rounded-xl bg-primary text-[#0B0C0E] font-bold text-xs hover:bg-primary-hover transition-colors cursor-pointer"
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

            {/* ===================== 底部区域 ===================== */}
            {activeTab === 'chat' ? (
              /* 当前对话输入框 */
              <div className="p-3.5 shrink-0 border-t border-white/10 bg-sidebar/95 backdrop-blur-xl">
                <div className="relative rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="向 MyWords 顾问提问，按 Enter 发送..."
                    rows={2}
                    className="w-full bg-transparent px-3.5 pt-2.5 pb-9 text-xs sm:text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none resize-none"
                  />

                  <div className="absolute left-3 bottom-2 right-2 flex items-center justify-between pointer-events-auto">
                    <span className="text-[10px] text-gray-500 font-mono">
                      Enter 发送 · Shift+Enter 换行
                    </span>

                    <button
                      disabled={!inputPrompt.trim()}
                      onClick={handleSend}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-[#0B0C0E] font-bold text-xs btn-neon-glow hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <span>发送</span>
                      <Send className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 历史记录底部快捷按钮 */
              <div className="p-3.5 shrink-0 border-t border-white/10 bg-sidebar/95 backdrop-blur-xl flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground font-mono">
                  共 {sessions.length} 个历史会话
                </span>
                <button
                  onClick={createNewSession}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-[#0B0C0E] font-bold text-xs btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>开启新对话</span>
                </button>
              </div>
            )}
          </motion.aside>
        </>
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
          ? 'bg-primary/10 border-primary/40 shadow-md'
          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/8 hover:border-white/20'
      }`}
    >
      {/* 头部：标题与时间 */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className={`size-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
          <h4 className="text-xs font-semibold text-white truncate">
            {session.title || '新对话'}
          </h4>
          {isActive && (
            <span className="shrink-0 text-[9px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
              进行中
            </span>
          )}
        </div>

        <span className="shrink-0 text-[10px] text-gray-500 font-mono">
          {formatSessionTime(session.updatedAt)}
        </span>
      </div>

      {/* 消息预览 */}
      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mb-2 font-sans">
        {previewText}
      </p>

      {/* 底部信息与操作 */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-[10px] text-gray-500 font-mono">
          {session.messages.length} 条消息
        </span>

        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDelete}
            title="删除此会话"
            className="p-1 rounded-lg text-gray-400 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3" />
          </button>
          <ChevronRight className="size-3.5 text-gray-400 group-hover:text-primary transition-colors" />
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
