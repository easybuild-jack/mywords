'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { AiMessage } from '@/store/useAiAssistantStore'
import { AiContentRenderer } from './AiContentRenderer'

interface AiMessageItemProps {
  message: AiMessage
}

export function AiMessageItem({ message }: AiMessageItemProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1.5 my-3 pl-8">
        <span className="text-[10px] text-muted-foreground font-mono">
          {formatTime(message.timestamp)}
        </span>
        <div className="max-w-[88%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary/15 border border-primary/30 text-foreground text-sm leading-relaxed shadow-sm">
          <p className="whitespace-pre-wrap select-text">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 my-3 pr-2">
      {/* 顶部：Copilot 身份与操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-muted border border-border flex items-center justify-center p-1 shadow-sm">
            <img src="/logo.svg" alt="MyWords Copilot" className="size-full object-contain" />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-wide">
            MyWords Copilot
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <button
          onClick={handleCopy}
          title="复制回复"
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>

      {/* 主回复卡片：支持 html, markdown, json, shell，无标记时默认纯文本展示 */}
      <div className="rounded-2xl rounded-tl-sm p-4 bg-card border border-border text-foreground text-sm leading-relaxed shadow-sm select-text">
        <AiContentRenderer content={message.content} />
      </div>
    </div>
  )
}

function formatTime(timestamp: number) {
  const d = new Date(timestamp)
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}
