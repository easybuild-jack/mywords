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
        <span className="text-[10px] text-gray-500 font-mono">
          {formatTime(message.timestamp)}
        </span>
        <div className="max-w-[88%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 text-gray-100 text-sm leading-relaxed shadow-lg">
          <p className="whitespace-pre-wrap select-text">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 my-3 pr-2">
      {/* 顶部：顾问身份与操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center p-1 shadow-sm">
            <img src="/logo.svg" alt="MyWords 顾问" className="size-full object-contain" />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide">
            MyWords 顾问
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <button
          onClick={handleCopy}
          title="复制回复"
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>

      {/* 主回复卡片：支持 html, markdown, json, shell，无标记时默认纯文本展示 */}
      <div className="rounded-2xl rounded-tl-sm p-4 bg-white/[0.04] border border-white/10 text-gray-200 text-sm leading-relaxed shadow-xl backdrop-blur-md select-text">
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
