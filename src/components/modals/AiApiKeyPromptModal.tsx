'use client'

import React, { useEffect } from 'react'
import { KeyRound, Sparkles, ArrowRight, X, Bot } from 'lucide-react'
import { useAiAssistantStore } from '@/store/useAiAssistantStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/**
 * AI 功能问答场景未配置 API Key 提示弹窗
 * 当用户尝试在无 API Key 状态下使用智能问答功能时弹出，引导用户前往「偏好设置 -> AI 模型配置」
 */
export function AiApiKeyPromptModal() {
  const { isApiKeyPromptOpen, setApiKeyPromptOpen } = useAiAssistantStore()
  const { setSettingsModalOpen } = useWorkspaceStore()

  // 监听 ESC 键关闭
  useEffect(() => {
    if (!isApiKeyPromptOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setApiKeyPromptOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isApiKeyPromptOpen, setApiKeyPromptOpen])

  if (!isApiKeyPromptOpen) return null

  const handleGoToSettings = () => {
    setApiKeyPromptOpen(false)
    setSettingsModalOpen(true, 'ai')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-key-modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in-50 duration-200"
      onClick={() => setApiKeyPromptOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-sidebar border border-white/10 p-6 sm:p-7 shadow-2xl text-foreground flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景光晕装饰 */}
        <div className="absolute -top-16 -right-16 size-44 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* 顶部关闭按钮 */}
        <button
          type="button"
          onClick={() => setApiKeyPromptOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
          title="关闭提示"
        >
          <X className="size-4" />
        </button>

        {/* 图标与标题 */}
        <div className="flex items-start gap-4 mb-4">
          <div className="size-12 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(var(--primary-rgb)/0.3)]">
            <KeyRound className="size-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                MyWords Copilot
              </span>
            </div>
            <h3 id="ai-key-modal-title" className="text-lg font-bold text-white tracking-tight">
              尚未配置 API Key
            </h3>
          </div>
        </div>

        {/* 描述内容 */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
          使用 <strong className="text-foreground">MyWords Copilot</strong> 智能问答与深度英语辅导功能，需要先配置大模型服务商密钥。
        </p>

        {/* 支持的服务商徽标提示 */}
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3.5 mb-6 text-xs text-muted-foreground flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <Sparkles className="size-3.5 text-primary" />
            <span>支持各大主流大模型平台直连：</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-foreground/90 border border-white/10 font-mono">
              DeepSeek
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-foreground/90 border border-white/10 font-mono">
              豆包 (火山引擎)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-foreground/90 border border-white/10 font-mono">
              ChatGPT (OpenAI)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-foreground/90 border border-white/10 font-mono">
              通义千问 (百炼)
            </span>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => setApiKeyPromptOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
          >
            暂不配置
          </button>

          <button
            type="button"
            onClick={handleGoToSettings}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-hover transition-all cursor-pointer shadow-sm btn-neon-glow"
          >
            <span>前往配置</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
