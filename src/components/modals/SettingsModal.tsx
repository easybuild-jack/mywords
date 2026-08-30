'use client'

import React, { useState, useEffect } from 'react'
import { X, Volume2, Mic, Sliders, Database, Keyboard, RotateCcw, Palette, Check } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { MECHANICAL_SWITCHES, audioEngine } from '@/core/audioEngine'
import { SHORTCUT_DEFINITIONS, eventToShortcutString, formatShortcutDisplay } from '@/lib/shortcuts'
import { SKINS } from '@/lib/skins'
import type { ShortcutConfig } from '@/types'

type SettingsTab = 'audio' | 'voice' | 'appearance' | 'shortcuts' | 'learn' | 'backup'

export function SettingsModal() {
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    keySoundPack,
    setKeySoundPack,
    keySoundVolume,
    setKeySoundVolume,
    isKeySoundEnabled,
    toggleKeySound,
    phoneticPreference,
    setPhoneticPreference,
    shortcuts,
    setShortcut,
    resetShortcuts,
    skinId,
    setSkinId,
  } = useWorkspaceStore()

  const [activeTab, setActiveTab] = useState<SettingsTab>('audio')
  const [recordingAction, setRecordingAction] = useState<keyof ShortcutConfig | null>(null)

  // 监听录制新快捷键
  useEffect(() => {
    if (!recordingAction) return

    const handleKeyCapture = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // 按 ESC 取消录制
      if (e.key === 'Escape') {
        setRecordingAction(null)
        return
      }

      const keyStr = eventToShortcutString(e)
      if (keyStr) {
        setShortcut(recordingAction, keyStr)
        setRecordingAction(null)
      }
    }

    window.addEventListener('keydown', handleKeyCapture, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyCapture, { capture: true })
    }
  }, [recordingAction, setShortcut])

  if (!isSettingsModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl rounded-3xl border border-white/10 p-6 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.7)] text-white">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Sliders className="size-4.5" />
            </div>
            <h2 className="text-lg font-bold text-white">偏好设置 (Preferences & Sound Studio)</h2>
          </div>
          <button
            onClick={() => {
              setRecordingAction(null)
              setSettingsModalOpen(false)
            }}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#9CA3AF] hover:text-white transition-all cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 主体两栏布局 */}
        <div className="grid grid-cols-12 gap-6 min-h-[380px]">
          {/* 左侧竖向导航 */}
          <div className="col-span-4 space-y-1.5 border-r border-white/10 pr-4">
            <button
              onClick={() => { setRecordingAction(null); setActiveTab('audio') }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'audio' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Volume2 className="size-4" />
              <span>音效与机械键盘</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('voice') }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'voice' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Mic className="size-4" />
              <span>音标与真人发音</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('appearance') }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'appearance' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Palette className="size-4" />
              <span>外观皮肤</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('shortcuts') }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'shortcuts' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Keyboard className="size-4" />
              <span>快捷键设置</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('learn') }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'learn' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-base">📚</span>
              <span>学习参数</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('backup') }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'backup' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Database className="size-4" />
              <span>数据导出</span>
            </button>
          </div>

          {/* 右侧内容区域 */}
          <div className="col-span-8 space-y-5 max-h-[380px] overflow-y-auto pr-2">
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider text-muted-foreground">
                    14 款经典机械键盘轴体选择
                  </h3>
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-primary">
                    <input
                      type="checkbox"
                      checked={isKeySoundEnabled}
                      onChange={(e) => toggleKeySound(e.target.checked)}
                      className="accent-primary rounded"
                    />
                    <span>启用击键音</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {MECHANICAL_SWITCHES.map((sw) => {
                    const isSelected = keySoundPack === sw.id

                    return (
                      <div
                        key={sw.id}
                        onClick={() => {
                          setKeySoundPack(sw.id)
                          audioEngine.playKeySound(sw.id, keySoundVolume)
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-[0_0_16px_rgb(var(--primary-rgb)/0.2)]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[120px]">{sw.name}</span>
                          {isSelected && <div className="size-3.5 rounded-full bg-primary/20 flex items-center justify-center"><div className="size-2 rounded-full bg-primary"></div></div>}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] text-muted-foreground">
                          <span>{sw.switchType}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              audioEngine.playKeySound(sw.id, keySoundVolume)
                            }}
                            className="text-primary hover:underline flex items-center gap-0.5 text-[10px]"
                          >
                            试听
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#9CA3AF]">
                      <span>按键音量 (Key Sound Volume)</span>
                      <span className="font-mono text-primary">{Math.round(keySoundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={keySoundVolume}
                      onChange={(e) => setKeySoundVolume(parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-muted-foreground uppercase tracking-wider">音标口音偏好</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer ${
                    phoneticPreference === 'us' ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.03]'
                  }`}>
                    <input
                      type="radio"
                      name="accent"
                      value="us"
                      checked={phoneticPreference === 'us'}
                      onChange={() => setPhoneticPreference('us')}
                      className="accent-primary"
                    />
                    <div>
                      <div className="font-bold text-white">美式发音 (US - K.K. 音标)</div>
                      <div className="text-muted-foreground text-[11px]">美式常用自然拼读规则</div>
                    </div>
                  </label>

                  <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer ${
                    phoneticPreference === 'uk' ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.03]'
                  }`}>
                    <input
                      type="radio"
                      name="accent"
                      value="uk"
                      checked={phoneticPreference === 'uk'}
                      onChange={() => setPhoneticPreference('uk')}
                      className="accent-primary"
                    />
                    <div>
                      <div className="font-bold text-white">英式发音 (UK - DJ 音标)</div>
                      <div className="text-muted-foreground text-[11px]">标准牛津剑桥英式发音</div>
                    </div>
                  </label>
                </div>
              </div>
            )}



            {activeTab === 'appearance' && (
              <div className="space-y-5 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-muted-foreground uppercase tracking-wider">外观皮肤</h3>
                  <span className="text-[11px] text-muted-foreground/70">选择后立即生效，自动持久化</span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed -mt-2">
                  只换配色，布局/字号/间距不动。当前选中：
                  <span className="text-primary font-semibold">{SKINS.find((s) => s.id === skinId)?.name ?? '—'}</span>
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {SKINS.map((skin) => {
                    const isActive = skin.id === skinId
                    return (
                      <button
                        key={skin.id}
                        type="button"
                        onClick={() => setSkinId(skin.id)}
                        className={`group relative flex flex-col gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary/10 border-2 border-primary shadow-[0_0_18px_rgb(var(--primary-rgb)/0.25)]'
                            : 'bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-white/25'
                        }`}
                      >
                        {/* 配色预览：迷你版应用界面 */}
                        <div
                          className="relative h-20 rounded-xl overflow-hidden border border-white/10"
                          style={{ background: skin.tokens.background }}
                        >
                          {/* 模拟侧栏 */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-3"
                            style={{ background: skin.tokens.sidebarBg }}
                          />
                          {/* 模拟输入框聚焦光晕 */}
                          <div
                            className="absolute left-7 right-4 bottom-3 h-3 rounded-md"
                            style={{
                              background: skin.tokens.primary,
                              opacity: 0.18,
                              boxShadow: `0 0 14px ${skin.tokens.primary}`,
                            }}
                          />
                          <div
                            className="absolute left-7 right-4 bottom-4 h-2 rounded-md"
                            style={{ background: skin.tokens.primary, opacity: 0.85 }}
                          />
                          {/* 模拟主按钮 */}
                          <div
                            className="absolute right-3 top-3 h-2 w-6 rounded"
                            style={{ background: skin.tokens.primary }}
                          />
                        </div>

                        {/* 色块预览行 */}
                        <div className="flex items-center gap-2">
                          <span
                            className="size-4 rounded-md border border-white/15"
                            style={{ background: skin.tokens.background }}
                            aria-hidden
                          />
                          <span
                            className="size-4 rounded-md border border-white/15"
                            style={{ background: skin.tokens.sidebarBg }}
                            aria-hidden
                          />
                          <span
                            className="size-4 rounded-md border border-white/15"
                            style={{ background: skin.tokens.primary }}
                            aria-hidden
                          />
                          <span
                            className="size-4 rounded-md border border-white/15"
                            style={{ background: skin.tokens.primaryHover }}
                            aria-hidden
                          />
                        </div>

                        {/* 文案 */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-white'}`}>
                              {skin.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground line-clamp-2 leading-snug mt-0.5">
                              {skin.tagline}
                            </div>
                          </div>
                          {isActive && (
                            <div className="shrink-0 size-5 rounded-full bg-primary text-[#0B0C0E] flex items-center justify-center">
                              <Check className="size-3" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] text-muted-foreground leading-relaxed">
                  💡 皮肤会持久化到本地（<code className="px-1 py-0.5 rounded bg-white/10 text-white font-mono">mywords-workspace-storage</code>），
                  下次打开仍然生效。头部工具栏的调色板按钮可作为快捷切换入口。
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-muted-foreground uppercase tracking-wider">快捷键</h3>
                  <button
                    onClick={resetShortcuts}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white transition-all cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>恢复默认</span>
                  </button>
                </div>

                <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
                  {SHORTCUT_DEFINITIONS.map((def) => {
                    const currentKey = shortcuts[def.key] || def.defaultKey
                    const isRecording = recordingAction === def.key

                    return (
                      <div key={def.key} className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{def.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono font-normal">
                              (默认: {formatShortcutDisplay(def.defaultKey)})
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{def.desc}</div>
                        </div>
                        <button
                          onClick={() => setRecordingAction(def.key)}
                          className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                            isRecording
                              ? 'bg-primary text-[#0B0C0E] shadow-[0_0_15px_rgb(var(--primary-rgb)/0.5)] animate-pulse'
                              : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 hover:border-primary/50'
                          }`}
                          title="点击录制新快捷键"
                        >
                          {isRecording ? '录制中... (ESC取消)' : formatShortcutDisplay(currentKey)}
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-[#9CA3AF] leading-relaxed">
                  💡 支持单键（如 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Tab</kbd>、<kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Space</kbd>、方向键）及组合键（如 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Ctrl+J</kbd>、<kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Alt+K</kbd>），修改后即刻生效并持久化保存。
                </div>
              </div>
            )}

            {activeTab === 'learn' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-muted-foreground uppercase tracking-wider">单元与学习设置</h3>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span>每单元单词容量 (Unit Size)</span>
                    <span className="font-bold text-primary">默认 20 词 / 单元</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    经过科学验证的黄金单次记忆容量，配合本章错词闭环重考，保证最佳记忆吸收率。
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-muted-foreground uppercase tracking-wider">数据导出与多端迁移</h3>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <p className="text-[11px] text-muted-foreground">
                    所有做题进度与错词本数据均离线安全保存在你的本地 IndexedDB 中。
                  </p>
                  <button className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white font-medium transition-all cursor-pointer">
                    导出全部数据 (JSON 备份)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部完成按钮 */}
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            onClick={() => {
              setRecordingAction(null)
              setSettingsModalOpen(false)
            }}
            className="px-6 py-2 rounded-xl bg-primary text-[#0B0C0E] text-xs font-bold btn-neon-glow transition-all cursor-pointer"
          >
            完成并保存
          </button>
        </div>
      </div>
    </div>
  )
}
