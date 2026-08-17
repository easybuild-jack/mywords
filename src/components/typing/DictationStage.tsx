'use client'

import React, { useEffect, useRef } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useTypingKeyboard } from '@/hooks/useTypingKeyboard'
import { DictationCard } from '@/components/typing/DictationCard'
import { IpaKeyboard } from '@/components/typing/IpaKeyboard'
import { PracticeStageFrame } from '@/components/typing/PracticeStageFrame'
import { UnitCompleteCard } from '@/components/typing/UnitCompleteCard'

/** 默写舞台：英文遮蔽，音标 → 译文 → 拼写三级闯关，附浮动 IPA 键盘 */
export function DictationStage() {
  const stageRef = useRef<HTMLDivElement>(null)

  const currentWord = useWorkspaceStore((s) => s.currentLoadedWords[s.activeWordIndex])
  const currentInput = useWorkspaceStore((s) => s.currentInput)
  const hasTypo = useWorkspaceStore((s) => s.hasTypo)
  const isPeeking = useWorkspaceStore((s) => s.isPeeking)
  const dictationCueMode = useWorkspaceStore((s) => s.dictationCueMode)
  const phoneticPreference = useWorkspaceStore((s) => s.phoneticPreference)
  const currentWordRemainingLoops = useWorkspaceStore((s) => s.currentWordRemainingLoops)
  const isUnitFinished = useWorkspaceStore((s) => s.isUnitFinished)

  const isPhoneticFocused = useWorkspaceStore((s) => s.isPhoneticFocused)
  const setIsPhoneticFocused = useWorkspaceStore((s) => s.setIsPhoneticFocused)
  const dictationPhoneticInput = useWorkspaceStore((s) => s.dictationPhoneticInput)
  const setDictationPhoneticInput = useWorkspaceStore((s) => s.setDictationPhoneticInput)
  const submitPhonetic = useWorkspaceStore((s) => s.submitPhonetic)
  const isPhoneticError = useWorkspaceStore((s) => s.isPhoneticError)

  // 键盘内部的草稿状态：在未点击确认前不修改卡片上的实际输入框
  const [draftPhonetic, setDraftPhonetic] = React.useState(dictationPhoneticInput)

  // 当打开键盘时，将草稿重置为当前卡片上已有的音标值
  useEffect(() => {
    if (isPhoneticFocused) {
      setDraftPhonetic(dictationPhoneticInput)
    }
  }, [isPhoneticFocused, dictationPhoneticInput])

  useTypingKeyboard({ enablePeek: true })

  // 点击卡片外部收起音标键盘（不提交草稿）
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isPhoneticFocused && stageRef.current && !stageRef.current.contains(e.target as Node)) {
        setIsPhoneticFocused(false)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [isPhoneticFocused, setIsPhoneticFocused])

  return (
    <div ref={stageRef} className="relative w-full flex-1 min-h-0 flex items-center justify-center gap-6">
      {isUnitFinished ? (
        <UnitCompleteCard />
      ) : (
        <>
          <PracticeStageFrame>
            {currentWord && (
              <DictationCard
                word={currentWord}
                currentInput={currentInput}
                hasTypo={hasTypo}
                isPeeking={isPeeking}
                cueMode={dictationCueMode}
                phoneticPreference={phoneticPreference}
                remainingLoops={currentWordRemainingLoops}
              />
            )}
          </PracticeStageFrame>

          {/* 浮动 IPA 音标键盘：固定在工具栏正下方，与卡片水平对齐。
              top 值按 HeaderToolbar 的实际高度写死，工具栏改尺寸时这里要一起改 */}
          {isPhoneticFocused && (
            <div
              className="fixed top-[64px] z-50 pt-2"
              style={{ left: 'calc(50% + 128px)', transform: 'translateX(-50%)' }}
            >
              <IpaKeyboard
                value={draftPhonetic}
                hasError={isPhoneticError}
                onSelectSymbol={(sym) => setDraftPhonetic((prev) => prev + sym)}
                onBackspace={() => setDraftPhonetic((prev) => prev.slice(0, -1))}
                onClear={() => setDraftPhonetic('')}
                onSubmit={() => {
                  submitPhonetic(draftPhonetic)
                }}
                onClose={() => {
                  setIsPhoneticFocused(false)
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
