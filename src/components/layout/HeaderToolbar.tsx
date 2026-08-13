'use client'

import React from 'react'
import Link from 'next/link'
import { Volume2, VolumeX, Eye, EyeOff, Settings, RotateCcw, Flame, X } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export function HeaderToolbar() {
  const {
    currentBook,
    currentUnitIndex,
    isErrorPracticeActive,
    currentLoadedWords,
    exitErrorPractice,
    mode,
    setMode,
    loopCountSetting,
    setLoopCountSetting,
    isTranslationVisible,
    toggleTranslation,
    phoneticPreference,
    setPhoneticPreference,
    isKeySoundEnabled,
    toggleKeySound,
    setSettingsModalOpen,
    replayAudio,
    restartUnit,
  } = useWorkspaceStore()

  return (
    <header className="w-full flex items-center justify-center p-4 sticky top-0 z-30 pointer-events-auto">
      <div className="glass-card rounded-2xl px-5 py-2.5 flex items-center gap-4 text-sm max-w-5xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10">
        {/* 1. 词书与章节快速入口 / 错词歼灭模式指示 */}
        {isErrorPracticeActive ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/15 border border-destructive/30 text-white font-medium">
            <Flame className="size-4 text-destructive animate-pulse" />
            <span className="text-destructive font-bold text-xs">错词歼灭战</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-gray-300 font-mono">共 {currentLoadedWords.length} 词</span>
            <button
              onClick={exitErrorPractice}
              className="ml-1 p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
              title="退出错词攻坚，返回常规章节"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/books"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium transition-all"
          >
            <span className="text-primary font-bold">{currentBook?.name || 'CET-4'}</span>
            <span className="text-muted-foreground">·</span>
            <span>第 {currentUnitIndex + 1} 章</span>
          </Link>
        )}

        {/* 2. 发音口音下拉切换 */}
        <div className="flex items-center gap-1.5">
          <select
            value={phoneticPreference}
            onChange={(e) => setPhoneticPreference(e.target.value as 'us' | 'uk')}
            className="bg-white/[0.06] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="us" className="bg-[#12141A] text-white">美音 (US)</option>
            <option value="uk" className="bg-[#12141A] text-white">英音 (UK)</option>
          </select>

          <button
            onClick={replayAudio}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-primary transition-all"
            title="发音 (Ctrl+J)"
          >
            <Volume2 className="size-4" />
          </button>
        </div>

        {/* 分隔线 */}
        <div className="h-4 w-px bg-white/10" />

        {/* 3. 跟学模式 vs 默写模式切换 */}
        <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setMode('learn')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              mode === 'learn'
                ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            跟学
          </button>
          <button
            onClick={() => setMode('dictation')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              mode === 'dictation'
                ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            默写
          </button>
        </div>

        {/* 4. 单个单词循环次数配置 */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <select
            value={loopCountSetting}
            onChange={(e) => setLoopCountSetting(Number(e.target.value) as 1 | 2 | 3 | 5)}
            className="bg-white/[0.06] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value={1} className="bg-[#12141A] text-white">循环 1次</option>
            <option value={2} className="bg-[#12141A] text-white">循环 2次</option>
            <option value={3} className="bg-[#12141A] text-white">循环 3次</option>
            <option value={5} className="bg-[#12141A] text-white">循环 5次</option>
          </select>
        </div>

        {/* 5. 译文显隐切换 */}
        <button
          onClick={toggleTranslation}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all border ${
            isTranslationVisible
              ? 'bg-accent/15 border-accent/40 text-accent font-medium'
              : 'bg-white/[0.04] border-white/10 text-muted-foreground hover:text-white'
          }`}
          title="切换中文释义显示/隐藏"
        >
          {isTranslationVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          <span>{isTranslationVisible ? '译文开' : '译文关'}</span>
        </button>

        {/* 分隔线 */}
        <div className="h-4 w-px bg-white/10" />

        {/* 6. 按键音效与设置快捷图标 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleKeySound()}
            className={`p-1.5 rounded-lg transition-all ${
              isKeySoundEnabled ? 'text-primary hover:bg-white/[0.08]' : 'text-muted-foreground/50 hover:bg-white/[0.04]'
            }`}
            title="机械键盘敲击音开关"
          >
            {isKeySoundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>

          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/[0.08] transition-all"
            title="偏好设置"
          >
            <Settings className="size-4" />
          </button>
        </div>

        {/* 7. Restart 按钮 */}
        <button
          onClick={restartUnit}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-[#0B0C0E] font-bold text-xs btn-neon-glow hover:bg-primary-hover transition-all cursor-pointer whitespace-nowrap"
          title="Restart (回到第一个单词)"
        >
          <RotateCcw className="size-3.5" />
          <span>Restart</span>
        </button>
      </div>
    </header>
  )
}
