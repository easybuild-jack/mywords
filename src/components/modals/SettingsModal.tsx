'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Volume2,
  Mic,
  Sliders,
  Keyboard,
  RotateCcw,
  Palette,
  Check,
  Link2,
  Bot,
  Eye,
  EyeOff,
  Activity,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import {
  useAiAssistantStore,
  AI_PROVIDER_PRESETS,
  DEFAULT_AI_CONFIG,
} from '@/store/useAiAssistantStore'
import { testAiConnection } from '@/lib/aiClient'
import { MECHANICAL_SWITCHES, audioEngine } from '@/core/audioEngine'
import { SHORTCUT_DEFINITIONS, eventToShortcutString, formatShortcutDisplay } from '@/lib/shortcuts'
import { SKINS } from '@/lib/skins'
import { isAuthorSyncToken } from '@/lib/permissions'
import type { ShortcutConfig } from '@/types'

type SettingsTab = 'audio' | 'voice' | 'appearance' | 'shortcuts' | 'learn' | 'ai' | 'sync'

const RECOMMENDED_MODELS: Record<string, string[]> = {
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  doubao: ['doubao-1-5-pro-32k', 'doubao-1-5-lite-32k'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
  qwen: ['qwen-plus', 'qwen-turbo'],
}

export function SettingsModal() {
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    settingsInitialTab,
    keySoundPack,
    setKeySoundPack,
    keySoundVolume,
    setKeySoundVolume,
    isKeySoundEnabled,
    toggleKeySound,
    phoneticPreference,
    setPhoneticPreference,
    isPhoneticSoundEnabled,
    togglePhoneticSound,
    phoneticSoundVolume,
    setPhoneticSoundVolume,
    shortcuts,
    setShortcut,
    resetShortcuts,
    skinId,
    setSkinId,
  } = useWorkspaceStore()

  const [activeTab, setActiveTab] = useState<SettingsTab>('audio')

  // 若通过外部快捷方式或引导指定了初始 Tab，自动切换至对应设置页
  useEffect(() => {
    if (isSettingsModalOpen && settingsInitialTab) {
      setActiveTab(settingsInitialTab)
    }
  }, [isSettingsModalOpen, settingsInitialTab])
  const [recordingAction, setRecordingAction] = useState<keyof ShortcutConfig | null>(null)

  // AI 大模型配置状态
  const { aiConfig, updateAiConfig, resetAiConfig, setAiProvider } = useAiAssistantStore()
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTestingAi, setIsTestingAi] = useState(false)
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null)

  const handleTestAi = async () => {
    if (isTestingAi) return
    setIsTestingAi(true)
    setAiTestResult(null)
    try {
      const res = await testAiConnection(aiConfig)
      setAiTestResult(res)
    } catch (err) {
      setAiTestResult({ success: false, error: (err as Error).message || '网络连接或请求失败' })
    } finally {
      setIsTestingAi(false)
    }
  }

  const currentPreset =
    (!AI_PROVIDER_PRESETS[aiConfig.provider]?.hidden && AI_PROVIDER_PRESETS[aiConfig.provider]) ||
    AI_PROVIDER_PRESETS.deepseek

  // 外部工具同步设置状态
  const [syncToken, setSyncToken] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSyncToken(localStorage.getItem('mywords_sync_token') || '')
    }
  }, [])

  const handleUpdateToken = (val: string) => {
    setSyncToken(val)
    if (typeof window !== 'undefined') {
      if (val.trim()) {
        localStorage.setItem('mywords_sync_token', val.trim())
      } else {
        localStorage.removeItem('mywords_sync_token')
      }
      window.dispatchEvent(new Event('mywords_sync_token_changed'))
    }
  }

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
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-5xl xl:max-w-6xl h-[680px] xl:h-[760px] 2xl:h-[820px] max-h-[92vh] min-h-[560px] rounded-3xl bg-sidebar border border-white/10 p-6 sm:p-8 shadow-2xl text-white flex flex-col overflow-hidden">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Sliders className="size-5.5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">偏好设置 (Preferences & Sound Studio)</h2>
              <p className="text-sm text-muted-foreground mt-1">个性化定制击键音效、外观皮肤、发音、快捷键与 AI 模型</p>
            </div>
          </div>
          <button
            onClick={() => {
              setRecordingAction(null)
              setSettingsModalOpen(false)
            }}
            className="p-2.5 rounded-xl hover:bg-white/[0.08] text-muted-foreground hover:text-white transition-all cursor-pointer"
            aria-label="关闭设置"
          >
            <X className="size-5.5" />
          </button>
        </div>

        {/* 主体两栏布局：左侧导航固定宽度，右侧内容区充分舒展 */}
        <div className="flex gap-7 flex-1 min-h-0 pt-6 pb-2 overflow-hidden">
          {/* 左侧竖向导航 */}
          <div className="w-56 xl:w-64 shrink-0 space-y-2 border-r border-white/10 pr-5 h-full overflow-y-auto custom-scrollbar">
            <button
              onClick={() => { setRecordingAction(null); setActiveTab('audio') }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'audio' ? 'bg-primary text-[#0B0C0E]' : 'text-muted-foreground hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Volume2 className="size-4.5 shrink-0" />
              <span>音效与机械键盘</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('voice') }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'voice' ? 'bg-primary text-[#0B0C0E]' : 'text-muted-foreground hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Mic className="size-4.5 shrink-0" />
              <span>音标与真人发音</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('appearance') }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'appearance' ? 'bg-primary text-[#0B0C0E]' : 'text-muted-foreground hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Palette className="size-4.5 shrink-0" />
              <span>外观皮肤</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('shortcuts') }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'shortcuts' ? 'bg-primary text-[#0B0C0E]' : 'text-muted-foreground hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Keyboard className="size-4.5 shrink-0" />
              <span>快捷键设置</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('learn') }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'learn' ? 'bg-primary text-[#0B0C0E]' : 'text-muted-foreground hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span className="text-lg shrink-0">📚</span>
              <span>学习参数</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('ai') }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'ai' ? 'bg-primary text-[#0B0C0E]' : 'text-muted-foreground hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Bot className="size-4.5 shrink-0" />
              <span>AI 模型配置</span>
            </button>

            <button
              onClick={() => { setRecordingAction(null); setActiveTab('sync') }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'sync' ? 'bg-primary text-[#0B0C0E]' : 'text-muted-foreground hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Link2 className="size-4.5 shrink-0" />
              <span>外部工具同步</span>
            </button>
          </div>

          {/* 右侧内容区域：加大字号与排版呼吸感 */}
          <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar pr-3 pl-1">
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider text-muted-foreground">
                    14 款经典机械键盘轴体选择
                  </h3>
                  <label className="flex items-center gap-2.5 text-base font-medium cursor-pointer text-primary">
                    <input
                      type="checkbox"
                      checked={isKeySoundEnabled}
                      onChange={(e) => toggleKeySound(e.target.checked)}
                      className="size-4 accent-primary rounded cursor-pointer"
                    />
                    <span>启用击键音</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {MECHANICAL_SWITCHES.map((sw) => {
                    const isSelected = keySoundPack === sw.id

                    return (
                      <div
                        key={sw.id}
                        onClick={() => {
                          setKeySoundPack(sw.id)
                          audioEngine.playKeySound(sw.id, keySoundVolume)
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-white truncate max-w-[160px]">{sw.name}</span>
                          {isSelected && <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="size-2.5 rounded-full bg-primary"></div></div>}
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-sm text-muted-foreground">
                          <span>{sw.switchType}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              audioEngine.playKeySound(sw.id, keySoundVolume)
                            }}
                            className="text-primary hover:underline flex items-center gap-1 text-sm font-medium cursor-pointer"
                          >
                            试听
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-base text-muted-foreground">
                      <span>按键音量 (Key Sound Volume)</span>
                      <span className="font-mono font-bold text-primary">{Math.round(keySoundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={keySoundVolume}
                      onChange={(e) => setKeySoundVolume(parseFloat(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-muted-foreground uppercase tracking-wider">音标口音偏好</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`p-5 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                      phoneticPreference === 'us' ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}>
                      <input
                        type="radio"
                        name="accent"
                        value="us"
                        checked={phoneticPreference === 'us'}
                        onChange={() => setPhoneticPreference('us')}
                        className="size-5 mt-0.5 accent-primary cursor-pointer"
                      />
                      <div className="space-y-1.5">
                        <div className="text-base font-bold text-white">美式发音 (US - K.K. 音标)</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">美式常用自然拼读规则与当代流行口音</div>
                      </div>
                    </label>

                    <label className={`p-5 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                      phoneticPreference === 'uk' ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}>
                      <input
                        type="radio"
                        name="accent"
                        value="uk"
                        checked={phoneticPreference === 'uk'}
                        onChange={() => setPhoneticPreference('uk')}
                        className="size-5 mt-0.5 accent-primary cursor-pointer"
                      />
                      <div className="space-y-1.5">
                        <div className="text-base font-bold text-white">英式发音 (UK - DJ 音标)</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">标准牛津剑桥英式发音与国际音标呈现</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">
                        音标键盘真人单音素发音
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        在默写音标页面点选音标符号时，实时播放该音标的标准真人发音
                      </p>
                    </div>
                    <label className="flex items-center gap-2.5 text-base font-medium cursor-pointer text-primary">
                      <input
                        type="checkbox"
                        checked={isPhoneticSoundEnabled}
                        onChange={(e) => togglePhoneticSound(e.target.checked)}
                        className="size-4.5 accent-primary rounded cursor-pointer"
                      />
                      <span>启用音标朗读</span>
                    </label>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                    <div className="flex justify-between items-center text-base text-muted-foreground">
                      <span>音标发音音量 (Phonetic Sound Volume)</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-primary text-base">{Math.round(phoneticSoundVolume * 100)}%</span>
                        <button
                          type="button"
                          onClick={() => audioEngine.playPhoneticSound('iː', phoneticSoundVolume)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-primary/20 text-sm font-semibold text-primary hover:text-white border border-white/10 transition-all cursor-pointer"
                        >
                          试听 /iː/
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={phoneticSoundVolume}
                      onChange={(e) => setPhoneticSoundVolume(parseFloat(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-muted-foreground uppercase tracking-wider">外观皮肤</h3>
                  <span className="text-sm text-muted-foreground/70">选择后立即生效，自动持久化</span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed -mt-2">
                  仅切换色彩体系，布局与字体比例保持一致。当前选中：
                  <span className="text-primary font-bold text-base ml-1.5">{SKINS.find((s) => s.id === skinId)?.name ?? '—'}</span>
                </p>

                <div className="grid grid-cols-2 gap-3.5">
                  {SKINS.map((skin) => {
                    const isActive = skin.id === skinId
                    return (
                      <button
                        key={skin.id}
                        type="button"
                        onClick={() => setSkinId(skin.id)}
                        className={`group relative flex flex-col gap-3 p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-white/25'
                        }`}
                      >
                        {/* 配色预览：迷你版应用界面 */}
                        <div
                          className="relative h-22 rounded-xl overflow-hidden border border-white/10"
                          style={{ background: skin.tokens.background }}
                        >
                          {/* 模拟侧栏 */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-3.5"
                            style={{ background: skin.tokens.sidebarBg }}
                          />
                          {/* 模拟输入框聚焦光晕 */}
                          <div
                            className="absolute left-7 right-4 bottom-3.5 h-3.5 rounded-md"
                            style={{
                              background: skin.tokens.primary,
                              opacity: 0.18,
                              boxShadow: `0 0 16px ${skin.tokens.primary}`,
                            }}
                          />
                          <div
                            className="absolute left-7 right-4 bottom-4.5 h-2 rounded-md"
                            style={{ background: skin.tokens.primary, opacity: 0.9 }}
                          />
                          {/* 模拟主按钮 */}
                          <div
                            className="absolute right-3 top-3 h-2.5 w-7 rounded"
                            style={{ background: skin.tokens.primary }}
                          />
                        </div>

                        {/* 色块预览行 */}
                        <div className="flex items-center gap-2">
                          <span
                            className="size-4.5 rounded-md border border-white/15"
                            style={{ background: skin.tokens.background }}
                            aria-hidden
                          />
                          <span
                            className="size-4.5 rounded-md border border-white/15"
                            style={{ background: skin.tokens.sidebarBg }}
                            aria-hidden
                          />
                          <span
                            className="size-4.5 rounded-md border border-white/15"
                            style={{ background: skin.tokens.primary }}
                            aria-hidden
                          />
                          <span
                            className="size-4.5 rounded-md border border-white/15"
                            style={{ background: skin.tokens.primaryHover }}
                            aria-hidden
                          />
                        </div>

                        {/* 文案 */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-white'}`}>
                              {skin.name}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2 leading-snug mt-0.5">
                              {skin.tagline}
                            </div>
                          </div>
                          {isActive && (
                            <div className="shrink-0 size-5.5 rounded-full bg-primary text-[#0B0C0E] flex items-center justify-center shadow-sm">
                              <Check className="size-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 text-sm text-muted-foreground leading-relaxed">
                  💡 皮肤会持久化到本地（<code className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">mywords-workspace-storage</code>），
                  下次打开仍然生效。头部工具栏的调色板按钮可作为快捷切换入口。
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-muted-foreground uppercase tracking-wider">快捷键设置</h3>
                  <button
                    onClick={resetShortcuts}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-sm font-medium text-white transition-all cursor-pointer"
                  >
                    <RotateCcw className="size-4" />
                    <span>恢复默认</span>
                  </button>
                </div>

                <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
                  {SHORTCUT_DEFINITIONS.map((def) => {
                    const currentKey = shortcuts[def.key] || def.defaultKey
                    const isRecording = recordingAction === def.key

                    return (
                      <div key={def.key} className="flex items-center justify-between p-4.5 hover:bg-white/[0.02] transition-colors">
                        <div className="space-y-1">
                          <div className="font-bold text-base text-white flex items-center gap-2">
                            <span>{def.label}</span>
                            <span className="text-sm text-muted-foreground font-mono font-normal">
                              (默认: {formatShortcutDisplay(def.defaultKey)})
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">{def.desc}</div>
                        </div>
                        <button
                          onClick={() => setRecordingAction(def.key)}
                          className={`px-4 py-2.5 rounded-xl font-mono font-bold text-sm transition-all cursor-pointer ${
                            isRecording
                              ? 'bg-primary text-[#0B0C0E] animate-pulse'
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

                <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground leading-relaxed">
                  💡 支持单键（如 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Tab</kbd>、<kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Space</kbd>、方向键）及组合键（如 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Ctrl+J</kbd>、<kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Alt+K</kbd>），修改后即刻生效并持久化保存。
                </div>
              </div>
            )}

            {activeTab === 'learn' && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-muted-foreground uppercase tracking-wider">单元与学习设置</h3>
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-white font-medium">每单元单词容量 (Unit Size)</span>
                    <span className="font-bold text-base text-primary">默认 20 词 / 单元</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    经过科学验证的黄金单次记忆容量，配合本章错词闭环重考，保证最佳记忆吸收率。
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                {/* 顶部标题与快速重置 */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
                      <Bot className="size-4.5 text-primary" />
                      <span>AI 大模型与智能副驾配置</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('确定要恢复 AI 模型的默认设置吗？')) {
                          resetAiConfig()
                          setAiTestResult(null)
                        }
                      }}
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="重置所有 AI 配置"
                    >
                      <RotateCcw className="size-4" />
                      <span>恢复默认配置</span>
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    支持火山引擎豆包 (Doubao)、DeepSeek、ChatGPT 与通义千问大模型。配置 API Key 后将直接调用对应大模型提供专业词汇深度精讲；未配置时将使用内置智能搭子离线回复。
                  </p>
                </div>

                {/* 供应商预设网格选择 */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                    选择模型提供商 (Provider Preset)
                  </label>
                  <div className="grid grid-cols-2 gap-3.5">
                    {Object.values(AI_PROVIDER_PRESETS)
                      .filter((p) => !p.hidden)
                      .map((p) => {
                        const isSelected = aiConfig.provider === p.id
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setAiProvider(p.id)
                              setAiTestResult(null)
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-primary bg-primary/10 shadow-sm'
                                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-base font-bold truncate ${isSelected ? 'text-primary' : 'text-white'}`}>
                                {p.name}
                              </span>
                              {isSelected && (
                                <div className="size-4.5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                  <div className="size-2.5 rounded-full bg-primary" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-snug">
                              {p.tagline}
                            </p>
                          </button>
                        )
                      })}
                  </div>
                </div>

                {/* API Key 与 端点设置卡片 */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
                  {/* API Key */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>API 密钥 (API Key)</span>
                        {currentPreset.helpUrl && (
                          <a
                            href={currentPreset.helpUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 font-normal"
                          >
                            <span>获取 Key</span>
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </label>
                      <span className="text-sm text-muted-foreground">本地存储，端到端直接调用</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={aiConfig.apiKey}
                        onChange={(e) => {
                          updateAiConfig({ apiKey: e.target.value.trim() })
                          setAiTestResult(null)
                        }}
                        placeholder={currentPreset.keyPlaceholder}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm font-mono text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-white transition-colors cursor-pointer"
                        aria-label={showApiKey ? '隐藏密钥' : '显示密钥'}
                      >
                        {showApiKey ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">
                      🔒 密钥仅加密保存在您本地浏览器的 LocalStorage 中，直接向配置的模型端点发起请求，绝不经过任何第三方服务器。
                    </p>
                  </div>

                  {/* Endpoint Base URL */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-white">API 端点地址 (Endpoint Base URL)</label>
                      {aiConfig.endpoint !== currentPreset.defaultEndpoint && (
                        <button
                          type="button"
                          onClick={() => {
                            updateAiConfig({ endpoint: currentPreset.defaultEndpoint })
                            setAiTestResult(null)
                          }}
                          className="text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>恢复默认端点</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={aiConfig.endpoint}
                      onChange={(e) => {
                        updateAiConfig({ endpoint: e.target.value.trim() })
                        setAiTestResult(null)
                      }}
                      placeholder={currentPreset.defaultEndpoint}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
                    />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      兼容标准 OpenAI /chat/completions 路由规范，末尾路由将由系统自动智能兼容补齐。
                    </p>
                  </div>

                  {/* Model Selection & Free Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>模型版本名称 (Model ID)</span>
                      </label>
                      {currentPreset.modelsDocUrl && (
                        <a
                          href={currentPreset.modelsDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          title="由于大模型版本迭代频繁，点击直达官网查阅最新支持的模型标识"
                        >
                          <span>查阅官网最新模型列表</span>
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                    <input
                      type="text"
                      value={aiConfig.model}
                      onChange={(e) => {
                        updateAiConfig({ model: e.target.value.trim() })
                        setAiTestResult(null)
                      }}
                      placeholder={currentPreset.modelPlaceholder || currentPreset.defaultModel}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60"
                    />
                    {/* 常用推荐模型快捷标签 */}
                    {RECOMMENDED_MODELS[aiConfig.provider] && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-xs text-muted-foreground">常用推荐：</span>
                        {RECOMMENDED_MODELS[aiConfig.provider].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              updateAiConfig({ model: m })
                              setAiTestResult(null)
                            }}
                            className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                              aiConfig.model === m
                                ? 'bg-primary/20 text-primary border border-primary/40 font-bold'
                                : 'bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-sm text-muted-foreground leading-relaxed">
                      <span>
                        {aiConfig.provider === 'doubao' ? (
                          <span className="text-amber-300/90">
                            💡 火山引擎豆包：可填官方模型名称或您的专属接入点 ID（如 <code className="font-mono text-amber-200">ep-2024xxxxxx-xxxx</code>）。
                          </span>
                        ) : (
                          <span>大模型版本更新迭代较快，建议点击右上角官方文档链接获取最新模型代号。</span>
                        )}
                      </span>
                      {currentPreset.officialUrl && (
                        <a
                          href={currentPreset.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline shrink-0 flex items-center gap-0.5"
                        >
                          <span>服务商官网</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Connection Test Action & Feedback */}
                  <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <button
                      type="button"
                      onClick={handleTestAi}
                      disabled={isTestingAi}
                      className="shrink-0 whitespace-nowrap px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTestingAi ? (
                        <>
                          <Loader2 className="size-4 animate-spin text-primary" />
                          <span>正在连接并测试 API...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="size-4 text-primary" />
                          <span>测试 API 连通性</span>
                        </>
                      )}
                    </button>

                    {aiTestResult && (
                      <div
                        className={`flex-1 min-w-0 px-4 py-2.5 rounded-xl border text-sm flex items-center gap-2.5 overflow-hidden ${
                          aiTestResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                        }`}
                      >
                        {aiTestResult.success ? (
                          <>
                            <Check className="size-4 shrink-0 text-emerald-400" />
                            <span className="truncate">
                              连通成功！模型响应正常 (耗时 {aiTestResult.latencyMs}ms)
                            </span>
                          </>
                        ) : (
                          <>
                            <X className="size-4 shrink-0 text-rose-400" />
                            <span className="truncate" title={aiTestResult.error}>
                              测试失败: {aiTestResult.error}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI 核心应用场景与提示词卡片 */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                        场景一：智能问答
                      </span>
                      <h4 className="text-sm font-semibold text-white">MyWords Copilot 系统提示词 (System Prompt)</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateAiConfig({ systemPrompt: DEFAULT_AI_CONFIG.systemPrompt })}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
                      title="恢复默认系统提示词"
                    >
                      <RotateCcw className="size-3" />
                      <span>恢复默认提示词</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    内置高水准英语教学辅导提示词，专注于辅导英语词汇构词、语法难点、长难句结构拆解与写作润色，并坚决拒绝任何与英语学习无关的外部话题。
                  </p>
                  <textarea
                    rows={5}
                    value={aiConfig.systemPrompt}
                    onChange={(e) => updateAiConfig({ systemPrompt: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono text-white/90 focus:outline-none focus:border-primary/60 leading-relaxed resize-none"
                    placeholder="输入 MyWords Copilot 系统提示词..."
                  />
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
                    <span className="text-primary font-bold text-sm">✨</span>
                    <div>
                      <strong className="text-white">场景二：AI 字典（结构化单词数据查询）</strong>
                      <p className="mt-0.5 text-muted-foreground/90">
                        在词典页面未收录或请求 AI 深度查词时，系统将以词库真实单词为参考示例，自动依照 word-data-builder skill 规则生成完整规范的单词 JSON 数据。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground uppercase tracking-wider">外部小工具生词收集 (External Sync)</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    在您的 AI 翻译小工具中点击收藏，即可通过 HTTP 接口实时将单词列表推送到 MyWords 生错词本。
                  </p>
                </div>

                {/* 专属同步密钥 */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div>
                    <label className="text-base font-semibold text-foreground block">
                      专属同步密钥 (Token / 选填)
                    </label>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      若服务端设置了 <code className="text-primary font-mono font-bold">COLLECT_TOKEN</code> 作为通信暗号（例如阿里云 ECS 或 Vercel 环境变量），请在此填入相同密钥以授权拉取；本地免密模式可留空。
                    </p>
                  </div>
                  <input
                    type="text"
                    value={syncToken}
                    onChange={(e) => handleUpdateToken(e.target.value)}
                    placeholder="留空则为免密模式，若服务端设置了 COLLECT_TOKEN 请在此填入"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                  />
                  {isAuthorSyncToken(syncToken) && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-sm text-primary font-medium">
                      <span className="text-base">👑</span>
                      <span>已识别为系统作者身份（享有官方词库音节切分与词根构词维护权限）</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部完成按钮 */}
        <div className="flex justify-end pt-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => {
              setRecordingAction(null)
              setSettingsModalOpen(false)
            }}
            className="px-8 py-3 rounded-xl bg-primary text-[#0B0C0E] text-base font-bold transition-all cursor-pointer hover:bg-primary-hover active:scale-95"
          >
            完成并保存
          </button>
        </div>
      </div>
    </div>
  )
}
