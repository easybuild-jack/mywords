'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, AlertCircle, Star, Settings, UploadCloud, Sparkles, Home } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export function Sidebar() {
  const pathname = usePathname()
  const { setImportModalOpen, setSettingsModalOpen } = useWorkspaceStore()

  const navItems = [
    { label: '主页', icon: Home, href: '/' },
    { label: '词库', icon: BookOpen, href: '/books' },
    { label: '错词本', icon: AlertCircle, href: '/errors' },
    { label: '生词本', icon: Star, href: '/starred' },
  ]

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col justify-between p-5 border-r border-white/10 bg-[#0B0C0E]/90 backdrop-blur-2xl z-40">
      {/* 顶部 Logo 与品牌 */}
      <div className="space-y-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,136,0.2)]">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              MyWords
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">3D 音节与肌肉记忆</p>
          </div>
        </Link>

        {/* 核心导航菜单 */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-[#0B0C0E] font-bold shadow-[0_0_20px_rgba(0,255,136,0.3)]'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`size-4.5 ${isActive ? 'text-[#0B0C0E]' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 底部功能按钮 */}
      <div className="space-y-2 pt-6 border-t border-white/10">
        <button
          onClick={() => setImportModalOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <UploadCloud className="size-4.5 text-accent" />
          <span>导入单词</span>
        </button>

        <button
          onClick={() => setSettingsModalOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <Settings className="size-4.5 text-muted-foreground" />
          <span>偏好设置</span>
        </button>
      </div>
    </aside>
  )
}
