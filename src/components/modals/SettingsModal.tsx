'use client'

import React, { useState, useEffect } from 'react'
import { X, Volume2, Mic, Sliders, Keyboard, RotateCcw, Palette, Check } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { MECHANICAL_SWITCHES, audioEngine } from '@/core/audioEngine'
import { SHORTCUT_DEFINITIONS, eventToShortcutString, formatShortcutDisplay } from '@/lib/shortcuts'
import { SKINS } from '@/lib/skins'
import type { ShortcutConfig } from '@/types'

type SettingsTab = 'audio' | 'voice' | 'appearance' | 'shortcuts' | 'learn'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl h-[600px] xl:h-[660px] 2xl:h-[720px] max-h-[88vh] min-h-[520px] rounded-3xl bg-sidebar border border-white/10 p-6 sm:p-7 shadow-2xl text-white flex flex-col overflow-hidden">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Sliders className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">偏好设置 (Preferences & Sound Studio)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">个性化定制击键音效、外观皮肤、发音与快捷键</p>
            </div>
          </div>
          <button
            onClick={() => {
              setRecordingAction(null)
              setSettingsModalOpen(false)
            }}
            className="p-2 rounded-xl hover:bg-white/[0.08] text-muted-foreground hover:text-white transition-all cursor-pointer"
            aria-label="关闭设置"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 主体两栏布局：高度自适应且固定填满中段空间，内容切换高度恒定 */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 pt-5 pb-2 overflow-hidden">
          {/* 左侧竖向导航 */}
          <div className="col-span-4 space-y-2 border-r border-white/10 pr-5 h-full overflow-y-auto custom-scrollbar">
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
          </div>

          {/* 右侧内容区域 */}
          <div className="col-span-8 h-full overflow-y-auto custom-scrollbar pr-3">
            {activeTab === 'audio' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-muted-foreground">
                    14 款经典机械键盘轴体选择
                  </h3>
                  <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer text-primary">
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
                          <span className="text-sm font-bold text-white truncate max-w-[130px]">{sw.name}</span>
                          {isSelected && <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="size-2.5 rounded-full bg-primary"></div></div>}
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-xs text-muted-foreground">
                          <span>{sw.switchType}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              audioEngine.playKeySound(sw.id, keySoundVolume)
                            }}
                            className="text-primary hover:underline flex items-center gap-1 text-xs font-medium cursor-pointer"
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
                    <div className="flex justify-between text-sm text-muted-foreground">
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
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">音标口音偏好</h3>
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
                        className="size-4.5 mt-0.5 accent-primary cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white">美式发音 (US - K.K. 音标)</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">美式常用自然拼读规则与当代流行口音</div>
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
                        className="size-4.5 mt-0.5 accent-primary cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white">英式发音 (UK - DJ 音标)</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">标准牛津剑桥英式发音与国际音标呈现</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        音标键盘真人单音素发音
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        在默写音标页面点选音标符号时，实时播放该音标的标准真人发音
                      </p>
                    </div>
                    <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer text-primary">
                      <input
                        type="checkbox"
                        checked={isPhoneticSoundEnabled}
                        onChange={(e) => togglePhoneticSound(e.target.checked)}
                        className="size-4 accent-primary rounded cursor-pointer"
                      />
                      <span>启用音标朗读</span>
                    </label>
                  </div>

                  <div className="space-y-2.5 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>音标发音音量 (Phonetic Sound Volume)</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-primary">{Math.round(phoneticSoundVolume * 100)}%</span>
                        <button
                          type="button"
                          onClick={() => audioEngine.playPhoneticSound('iː', phoneticSoundVolume)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-primary/20 text-xs font-semibold text-primary hover:text-white border border-white/10 transition-all cursor-pointer"
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
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">外观皮肤</h3>
                  <span className="text-xs text-muted-foreground/70">选择后立即生效，自动持久化</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                  仅切换色彩体系，布局与字体比例保持一致。当前选中：
                  <span className="text-primary font-bold text-sm ml-1">{SKINS.find((s) => s.id === skinId)?.name ?? '—'}</span>
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

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-muted-foreground leading-relaxed">
                  💡 皮肤会持久化到本地（<code className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">mywords-workspace-storage</code>），
                  下次打开仍然生效。头部工具栏的调色板按钮可作为快捷切换入口。
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">快捷键设置</h3>
                  <button
                    onClick={resetShortcuts}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white transition-all cursor-pointer"
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
                      <div key={def.key} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                        <div className="space-y-1">
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{def.label}</span>
                            <span className="text-xs text-muted-foreground font-mono font-normal">
                              (默认: {formatShortcutDisplay(def.defaultKey)})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{def.desc}</div>
                        </div>
                        <button
                          onClick={() => setRecordingAction(def.key)}
                          className={`px-3.5 py-2 rounded-xl font-mono font-bold text-xs transition-all cursor-pointer ${
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

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed">
                  💡 支持单键（如 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Tab</kbd>、<kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Space</kbd>、方向键）及组合键（如 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Ctrl+J</kbd>、<kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Alt+K</kbd>），修改后即刻生效并持久化保存。
                </div>
              </div>
            )}

            {activeTab === 'learn' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">单元与学习设置</h3>
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium">每单元单词容量 (Unit Size)</span>
                    <span className="font-bold text-sm text-primary">默认 20 词 / 单元</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    经过科学验证的黄金单次记忆容量，配合本章错词闭环重考，保证最佳记忆吸收率。
                  </p>
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
            className="px-7 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-sm font-bold transition-all cursor-pointer hover:bg-primary-hover active:scale-95"
          >
            完成并保存
          </button>
        </div>
      </div>
    </div>
  )
}
