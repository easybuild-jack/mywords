'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  AlertCircle,
  Settings,
  Sparkles,
  GraduationCap,
  PenLine,
  Sprout,
  Quote,
  SpellCheck,
  Languages,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export function Sidebar() {
  const pathname = usePathname()
  const { setSettingsModalOpen } = useWorkspaceStore()

  const navItems = [
    { label: '单词', icon: GraduationCap, href: '/learn' },
    { label: '默写', icon: PenLine, href: '/dictation' },
    { label: '词库', icon: BookOpen, href: '/books' },
    { label: '错词本', icon: AlertCircle, href: '/errors' },
    { label: '词根', icon: Sprout, href: '/roots', comingSoon: true },
    { label: '短语', icon: Quote, href: '/phrases', comingSoon: true },
    { label: '语法', icon: SpellCheck, href: '/grammar', comingSoon: true },
    { label: '翻译', icon: Languages, href: '/translate', comingSoon: true },
  ]

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col justify-between p-5 border-r border-white/10 bg-[#0B0C0E]/90 backdrop-blur-2xl z-40">
      {/* 顶部 Logo 与品牌 */}
      <div className="space-y-8">
        <Link href="/learn" className="flex items-center gap-3 group">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-105 transition-all shadow-[0_0_20px_rgb(var(--primary-rgb)/0.2)]">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">MyWords</h1>
            <p className="text-xs text-muted-foreground">音节拼读与肌肉记忆</p>
          </div>
        </Link>

        {/* 核心导航菜单 */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  aria-disabled
                  title="功能开发中，敬请期待"
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-base font-medium text-[#9CA3AF]/40 cursor-not-allowed"
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[11px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-gray-600">
                    待开放
                  </span>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive
                  ? 'bg-primary text-[#0B0C0E] font-bold shadow-[0_0_20px_rgb(var(--primary-rgb)/0.3)]'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.06]'
                  }`}
              >
                <Icon className={`size-5 ${isActive ? 'text-[#0B0C0E]' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 底部功能按钮（单词导入入口在词库页，此处不再重复） */}
      <div className="space-y-2 pt-6 border-t border-white/10">
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-base text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <Settings className="size-5 text-muted-foreground" />
          <span>偏好设置</span>
        </button>
      </div>
    </aside>
  )
}
