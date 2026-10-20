'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  AlertCircle,
  Settings,
  GraduationCap,
  PenLine,
  Sprout,
  Quote,
  SpellCheck,
  Languages,
  Keyboard,
  BookA,
  Mic,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export function Sidebar() {
  const pathname = usePathname()
  const setSettingsModalOpen = useWorkspaceStore((state) => state.setSettingsModalOpen)

  const navItems = [
    { label: '单词查询', icon: BookA, href: '/dictionary' },
    { label: '单词学习', icon: GraduationCap, href: '/learn' },
    { label: '单词默写', icon: PenLine, href: '/dictation' },
    { label: '音标学习', icon: Mic, href: '/phonetics/learn' },
    { label: '音标练习', icon: Keyboard, href: '/phonetics' },
    { label: '词库管理', icon: BookOpen, href: '/books' },
    { label: '生错词本', icon: AlertCircle, href: '/errors' },
    { label: '词根词缀', icon: Sprout, href: '/roots' },
    { label: '基础语法', icon: SpellCheck, href: '/grammar' },
    { label: '常用短语', icon: Quote, href: '/phrases', comingSoon: true },
    { label: '句子翻译', icon: Languages, href: '/translate', comingSoon: true },
  ]

  return (
    <aside
      data-sidebar="true"
      className="relative w-64 shrink-0 h-[calc(100vh-32px)] m-4 sticky top-4 flex flex-col p-4 rounded-[22px] border border-border/80 bg-sidebar/95 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_64px_rgba(0,0,0,0.65),0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.14)] z-40 overflow-hidden"
    >
      {/* 顶部微弱采光层，营造真实物理顶光照射的立体质感 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.04] to-transparent rounded-t-[22px]" />

      {/* 顶部 Logo 与品牌：常驻吸顶，立体卡片与层次底部分割 */}
      <div className="shrink-0 pb-3.5 mb-3 border-b border-border/60">
        <Link
          href="/learn"
          className="flex items-center gap-3 p-1.5 -m-1.5 rounded-xl hover:bg-card/50 transition-all duration-200 group"
        >
          <div className="size-10 shrink-0 rounded-xl bg-card border border-border shadow-xs flex items-center justify-center p-1.5 group-hover:scale-105 group-hover:border-primary/50 group-hover:shadow-[0_0_14px_rgba(var(--primary-rgb)/0.25)] transition-all">
            <img src="/logo111.png" alt="LinguaLoop" className="size-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
              LinguaLoop
            </h1>
            <p className="text-xs text-muted-foreground truncate mt-0.5">私人专属英语学习搭子</p>
          </div>
        </Link>
      </div>

      {/* 核心导航菜单：独立纵向滚动区，立体按键与交互层次 */}
      <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mr-4 pr-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (item.comingSoon) {
            return (
              <div
                key={item.href}
                aria-disabled
                title="功能开发中，敬请期待"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground/40 cursor-not-allowed select-none border border-transparent"
              >
                <div className="size-7 rounded-lg bg-muted/20 border border-border/20 flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-muted-foreground/30" />
                </div>
                <span className="truncate">{item.label}</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md border border-border/40 bg-muted/20 text-muted-foreground/40">
                  待开放
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-[0_4px_16px_rgba(var(--primary-rgb)/0.35),0_1px_3px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-white/20'
                  : 'text-muted-foreground hover:text-foreground bg-transparent hover:bg-card border border-transparent hover:border-border/80 hover:shadow-xs hover:translate-x-0.5'
              }`}
            >
              <div
                className={`size-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isActive
                    ? 'bg-primary-foreground/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] text-primary-foreground'
                    : 'bg-muted/50 border border-border/40 group-hover:bg-muted group-hover:border-border text-muted-foreground group-hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
              </div>
              <span className="truncate">{item.label}</span>

              {/* 激活状态右侧立体小微光胶囊 */}
              {isActive && (
                <div className="ml-auto size-1.5 rounded-full bg-primary-foreground/80 shadow-[0_0_6px_currentColor]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 底部功能按钮：常驻底部，立体工具卡片风格 */}
      <div className="shrink-0 pt-3.5 mt-2 border-t border-border/70">
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground bg-card/40 hover:bg-card border border-border/50 hover:border-border hover:shadow-xs transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-lg bg-muted/60 border border-border/50 group-hover:bg-muted group-hover:border-border flex items-center justify-center shrink-0 transition-all">
              <Settings className="size-4 text-muted-foreground group-hover:text-foreground transition-all duration-300 group-hover:rotate-45" />
            </div>
            <span className="truncate">偏好设置</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md border border-border/40 bg-muted/30 text-muted-foreground/60">
            设置
          </span>
        </button>
      </div>
    </aside>
  )
}
