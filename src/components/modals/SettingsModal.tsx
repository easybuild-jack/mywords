'use client'

import React, { useState } from 'react'
import { X, Volume2, Mic, Sliders, Database, Play, Check } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { MECHANICAL_SWITCHES, audioEngine } from '@/core/audioEngine'

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
    isAutoPlayAudio,
    feedbackVolume,
  } = useWorkspaceStore()

  const [activeTab, setActiveTab] = useState<'audio' | 'voice' | 'learn' | 'backup'>('audio')

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
            onClick={() => setSettingsModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#9CA3AF] hover:text-white transition-all"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 主体两栏布局 */}
        <div className="grid grid-cols-12 gap-6 min-h-[380px]">
          {/* 左侧竖向导航 */}
          <div className="col-span-4 space-y-1.5 border-r border-white/10 pr-4">
            <button
              onClick={() => setActiveTab('audio')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'audio' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Volume2 className="size-4" />
              <span>音效与机械键盘</span>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'voice' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Mic className="size-4" />
              <span>音标与真人发音</span>
            </button>

            <button
              onClick={() => setActiveTab('learn')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'learn' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sliders className="size-4" />
              <span>学习偏好</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'backup' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Database className="size-4" />
              <span>数据备份与导出</span>
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

                {/* 轴体卡片选择网格 */}
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
                          {isSelected && <Check className="size-3.5 text-primary" />}
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
                            <Play className="size-2.5 fill-current" /> 试听
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 音量调节滑块 */}
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
                  <button className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white font-medium transition-all">
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
            onClick={() => setSettingsModalOpen(false)}
            className="px-6 py-2 rounded-xl bg-primary text-[#0B0C0E] text-xs font-bold btn-neon-glow transition-all"
          >
            完成并保存
          </button>
        </div>
      </div>
    </div>
  )
}
