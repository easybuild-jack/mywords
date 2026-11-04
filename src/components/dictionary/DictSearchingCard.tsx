'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { WordLayoutSkeleton } from '@/components/word/WordDisplay'

const PARSING_STAGES = [
  '正在连接 AI 词典模型...',
  '正在严格校验单词拼写...',
  '正在生成美英 IPA 音标...',
  '正在整理词性与中文释义...',
  '正在校验基础数据格式...',
]

export function DictSearchingCard() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 依据耗时动态切换步骤提示
  const stageIndex = Math.min(Math.floor(elapsed / 3), PARSING_STAGES.length - 1)
  const currentStageText = PARSING_STAGES[stageIndex]

  return (
    <WordLayoutSkeleton
      status={
        <>
          <Loader2 className="size-3.5 animate-spin text-primary" />
          <span>{currentStageText}</span>
          <span className="tabular-nums text-muted-foreground/60">{elapsed}s</span>
        </>
      }
    />
  )
}
