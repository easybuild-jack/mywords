'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  AlertCircle,
  FastForward,
  ArrowRight,
} from 'lucide-react'
import type { TranslationSentenceItem } from '@/types'
import { parseSentenceIntoWords, extractAutoKeywords } from '@/lib/sentenceParser'
import { SentenceUnderlineSlots } from '@/components/translate/SentenceUnderlineSlots'
import { audioEngine } from '@/core/audioEngine'
import { isShortcutMatch } from '@/lib/shortcuts'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { useTranslateStore } from '@/store/useTranslateStore'

interface TranslateCardProps {
  sentence: TranslationSentenceItem
  sentenceIndex: number
  totalSentences: number
  onNext: () => void
  onPrev: () => void
  isActive?: boolean
}

export function TranslateCard({
  sentence,
  sentenceIndex,
  totalSentences,
  onNext,
  onPrev,
  isActive = true,
}: TranslateCardProps) {
  // 提取本句的核心词汇列表 (支持预置配置与智能提取)
  const keywords = useMemo(() => {
    if (sentence.keywords && sentence.keywords.length > 0) {
      return sentence.keywords
    }
    return extractAutoKeywords(
      sentence.sentenceEn,
      sentence.grammar?.tokens,
      sentence.sentenceZh
    )
  }, [sentence])

  // 阶段管理：先核心词热身 ('keyword') -> 再整句翻译 ('sentence')
  const [stage, setStage] = useState<'keyword' | 'sentence'>(() =>
    keywords.length > 0 ? 'keyword' : 'sentence'
  )
  const [currentKeywordIndex, setCurrentKeywordIndex] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keywordError, setKeywordError] = useState(false)
  const [isKeywordSuccess, setIsKeywordSuccess] = useState(false)

  // 解析当前句子的整句单词槽位与标点
  const tokens = useMemo(() => {
    return parseSentenceIntoWords(
      sentence.sentenceEn,
      sentence.grammar?.tokens
    )
  }, [sentence.sentenceEn, sentence.grammar?.tokens])

  // 整句阶段打字状态管理：整句连续输入，支持各个单词独立录入与整句批量校验
  const [typedWords, setTypedWords] = useState<string[]>(() =>
    tokens.map(() => '')
  )
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [errorIndices, setErrorIndices] = useState<number[]>([])
  const [isCompleted, setIsCompleted] = useState(false)

  // 全局偏好与设置
  const keySoundPack = useWorkspaceStore((s) => s.keySoundPack)
  const isKeySoundEnabled = useWorkspaceStore((s) => s.isKeySoundEnabled)
  const keySoundVolume = useWorkspaceStore((s) => s.keySoundVolume)
  const isWrongBeepEnabled = useWorkspaceStore((s) => s.isWrongBeepEnabled)
  const isCorrectSoundEnabled = useWorkspaceStore((s) => s.isCorrectSoundEnabled)
  const feedbackVolume = useWorkspaceStore((s) => s.feedbackVolume)
  const shortcuts = useWorkspaceStore((s) => s.shortcuts)

  // 翻译 Store
  const {
    isPeeking,
    setPeeking,
    isSpeaking,
    isAutoPlayAudio,
    toggleAutoPlayAudio,
    playWordAudio,
    playSentenceAudio,
    setSentenceCompleted,
    setGrammarModalOpen,
    repeatSentenceKey,
    repeatCurrentSentence,
  } = useTranslateStore()

  // 切题或重复练习时重置状态：重新从核心词开始热身
  useEffect(() => {
    setStage(keywords.length > 0 ? 'keyword' : 'sentence')
    setCurrentKeywordIndex(0)
    setKeywordInput('')
    setKeywordError(false)
    setIsKeywordSuccess(false)
    setTypedWords(tokens.map(() => ''))
    setActiveWordIndex(0)
    setErrorIndices([])
    setIsCompleted(false)
    setSentenceCompleted(false)
    audioEngine.cancelPendingPlayback()
  }, [sentence.id, repeatSentenceKey, tokens, keywords.length, setSentenceCompleted])

  // 当前进行中的核心词
  const currentKeyword = keywords[currentKeywordIndex]
  const cleanTargetWord = currentKeyword ? currentKeyword.word.trim().toLowerCase() : ''

  // 当离开练习页 tab 时，立即终止正在播放或计划播放的语音
  useEffect(() => {
    if (!isActive) {
      audioEngine.cancelPendingPlayback()
    }
  }, [isActive])

  // 核心词阶段：自动播报当前核心词读音 (仅在激活练习 tab 时)
  useEffect(() => {
    if (!isActive) return
    if (stage === 'keyword' && currentKeyword?.word && isAutoPlayAudio) {
      const timer = setTimeout(() => {
        playWordAudio(currentKeyword.word)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [
    isActive,
    stage,
    currentKeywordIndex,
    sentence.id,
    repeatSentenceKey,
    isAutoPlayAudio,
    currentKeyword?.word,
    playWordAudio,
  ])

  // 整句翻译阶段：进入整句时自动播报整句读音 (仅在激活练习 tab 时)
  useEffect(() => {
    if (!isActive) return
    if (
      stage === 'sentence' &&
      sentence?.sentenceEn &&
      isAutoPlayAudio &&
      !isCompleted
    ) {
      const timer = setTimeout(() => {
        playSentenceAudio()
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [
    isActive,
    stage,
    sentence.id,
    sentence.sentenceEn,
    repeatSentenceKey,
    isAutoPlayAudio,
    isCompleted,
    playSentenceAudio,
  ])

  // 播放按键音
  const triggerKeySound = useCallback(() => {
    if (isKeySoundEnabled) {
      audioEngine.playKeySound(keySoundPack, keySoundVolume)
    }
  }, [isKeySoundEnabled, keySoundPack, keySoundVolume])

  // 核心词拼写正确推进机制
  const handleKeywordComplete = useCallback(() => {
    setIsKeywordSuccess(true)
    if (isCorrectSoundEnabled) {
      audioEngine.playCorrectSound(feedbackVolume)
    }

    if (currentKeywordIndex < keywords.length - 1) {
      // 还有下一个核心词，短促停留 200ms 后秒切下一个
      setTimeout(() => {
        setCurrentKeywordIndex((prev) => prev + 1)
        setKeywordInput('')
        setIsKeywordSuccess(false)
        setKeywordError(false)
      }, 200)
    } else {
      // 所有核心词热身完毕，进入整句合龙翻译阶段！
      setTimeout(() => {
        setIsKeywordSuccess(false)
        setKeywordInput('')
        setKeywordError(false)
        setStage('sentence')
      }, 280)
    }
  }, [
    currentKeywordIndex,
    keywords.length,
    isCorrectSoundEnabled,
    feedbackVolume,
  ])

  // 整句核心校验：整句翻译完毕后统一校验，不阻塞单词连续输入
  const validateFullSentence = useCallback(() => {
    const wrong: number[] = []

    tokens.forEach((token, idx) => {
      const userWord = (typedWords[idx] || '').trim().toLowerCase()
      const targetWord = token.cleanWord.toLowerCase()
      if (userWord !== targetWord) {
        wrong.push(idx)
      }
    })

    if (wrong.length === 0) {
      // 整句校验全部通过！
      setErrorIndices([])
      setIsCompleted(true)
      setSentenceCompleted(true)
      setGrammarModalOpen(true)

      if (isCorrectSoundEnabled) {
        audioEngine.playCorrectSound(feedbackVolume)
      }

      // 整句翻译成功后，立即自动朗读整句纯正原声！
      playSentenceAudio()
    } else {
      // 存在错误单词：整句联合标红高亮所有错误单词，不卡住后续输入
      setErrorIndices(wrong)
      if (isWrongBeepEnabled) {
        audioEngine.playBeepSound(feedbackVolume)
      }
      // 光标智能聚焦至第一个拼错的单词，方便直接修改
      setActiveWordIndex(wrong[0])
    }
  }, [
    tokens,
    typedWords,
    isCorrectSoundEnabled,
    isWrongBeepEnabled,
    feedbackVolume,
    playSentenceAudio,
    setSentenceCompleted,
    setGrammarModalOpen,
  ])

  // 重复练习当前翻译的句子 (清空当前句，就地再练一次)
  const handleRepeatSentence = useCallback(() => {
    repeatCurrentSentence()
  }, [repeatCurrentSentence])

  // 核心键盘打字与流转逻辑
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 仅在练习页激活时响应键盘打字
      if (!isActive) return

      // 忽略模态框与输入框中的敲击
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        Boolean(document.querySelector('[role="dialog"]'))
      ) {
        return
      }

      // 1. 提示原文快捷键 (Tab 键：按住偷看当前词或整句)
      if (e.key === 'Tab') {
        e.preventDefault()
        setPeeking(true)
        return
      }

      // 2. 播报/重播读音快捷键 (默认 Ctrl+J)
      if (isShortcutMatch(e, shortcuts.replayAudio || 'Ctrl+J')) {
        e.preventDefault()
        triggerKeySound()
        if (stage === 'keyword' && currentKeyword?.word) {
          playWordAudio(currentKeyword.word)
        } else {
          playSentenceAudio()
        }
        return
      }

      // 阶段一：核心词热身输入模式
      if (stage === 'keyword') {
        // 退格删除
        if (e.key === 'Backspace') {
          e.preventDefault()
          triggerKeySound()
          setKeywordInput((prev) => prev.slice(0, -1))
          setKeywordError(false)
          return
        }

        // 回车或空格：快速核对
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault()
          triggerKeySound()
          if (keywordInput.trim().toLowerCase() === cleanTargetWord) {
            handleKeywordComplete()
          } else if (keywordInput.trim().length > 0) {
            setKeywordError(true)
            if (isWrongBeepEnabled) {
              audioEngine.playBeepSound(feedbackVolume)
            }
          }
          return
        }

        // 字符录入 (支持字母、数字、撇号、连字符)
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          triggerKeySound()
          const nextVal = keywordInput + e.key
          setKeywordInput(nextVal)
          setKeywordError(false)

          // 核心特性：正确后直接下一个单词（无需额外按键）
          if (nextVal.trim().toLowerCase() === cleanTargetWord) {
            handleKeywordComplete()
          }
        }
        return
      }

      // 阶段二：整句合龙翻译模式
      // 1. 整句通关后敲击 Enter 进入下一句
      if (isCompleted) {
        if (e.key === 'Enter') {
          e.preventDefault()
          onNext()
        }
        return
      }

      // 2. 回车键 (Enter)：随时触发整句统一校验
      if (e.key === 'Enter') {
        e.preventDefault()
        triggerKeySound()
        validateFullSentence()
        return
      }

      // 3. 退格删除键 (Backspace)
      if (e.key === 'Backspace') {
        e.preventDefault()
        triggerKeySound()

        const currentWord = typedWords[activeWordIndex] || ''
        if (currentWord.length > 0) {
          const updated = [...typedWords]
          updated[activeWordIndex] = currentWord.slice(0, -1)
          setTypedWords(updated)
          if (errorIndices.includes(activeWordIndex)) {
            setErrorIndices((prev) => prev.filter((i) => i !== activeWordIndex))
          }
        } else if (activeWordIndex > 0) {
          setActiveWordIndex((prev) => prev - 1)
        }
        return
      }

      // 4. 空格键 (Space)：丝滑推进到下一个单词，不卡死，在末尾时触发整句校验
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        triggerKeySound()

        if (activeWordIndex < tokens.length - 1) {
          setActiveWordIndex((prev) => prev + 1)
        } else {
          validateFullSentence()
        }
        return
      }

      // 5. 字符输入 (a-zA-Z0-9'-)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        triggerKeySound()

        const currentWord = typedWords[activeWordIndex] || ''
        const updated = [...typedWords]
        updated[activeWordIndex] = currentWord + e.key
        setTypedWords(updated)

        if (errorIndices.includes(activeWordIndex)) {
          setErrorIndices((prev) => prev.filter((i) => i !== activeWordIndex))
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isActive) return
      if (e.key === 'Tab') {
        e.preventDefault()
        setPeeking(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    isActive,
    stage,
    cleanTargetWord,
    keywordInput,
    handleKeywordComplete,
    tokens,
    typedWords,
    activeWordIndex,
    errorIndices,
    isCompleted,
    isWrongBeepEnabled,
    feedbackVolume,
    triggerKeySound,
    validateFullSentence,
    onNext,
    setPeeking,
    shortcuts.replayAudio,
    currentKeyword,
    playWordAudio,
    playSentenceAudio,
  ])

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 sm:p-8 xl:p-10 select-none relative">
      {/* 顶部工具行 */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-muted-foreground">
            {sentenceIndex + 1} / {totalSentences}
          </span>

          {/* 阶段清晰指示器 */}
          {stage === 'keyword' && keywords.length > 0 ? (
            <span className="text-xs text-foreground flex items-center gap-1.5 animate-fadeIn">
              <span className="size-1.5 rounded-full bg-amber-500" />
              <span>核心词热身 · {currentKeywordIndex + 1}/{keywords.length}</span>
            </span>
          ) : (
            <span className="text-xs text-foreground flex items-center gap-1.5 animate-fadeIn">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>整句翻译实战</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* 发音播报按钮 (手动点击重复播放当前单词或整句读音) */}
          <button
            type="button"
            onClick={() => {
              if (stage === 'keyword' && currentKeyword?.word) {
                playWordAudio(currentKeyword.word)
              } else {
                playSentenceAudio()
              }
            }}
            title={stage === 'keyword' ? '播放当前单词读音 (Ctrl+J)' : '播放当前句子读音 (Ctrl+J)'}
            className={`size-8 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer ${
              isSpeaking ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Volume2 className={`size-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
          </button>

          {/* 自动播报开关 */}
          <button
            type="button"
            onClick={toggleAutoPlayAudio}
            title={isAutoPlayAudio ? '自动播报已开启 (点击切换为手动)' : '自动播报已关闭 (点击开启切换词句时自动朗读)'}
            className={`h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors select-none cursor-pointer ${
              isAutoPlayAudio ? 'text-primary hover:bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {isAutoPlayAudio ? (
              <Volume2 className="size-3.5" />
            ) : (
              <VolumeX className="size-3.5" />
            )}
            <span className="hidden sm:inline">自动播报</span>
            <span className="font-medium">{isAutoPlayAudio ? '开' : '关'}</span>
          </button>

          {/* 提示原文按钮 (支持点击切换显隐，或长按 Tab 键偷看) */}
          <button
            type="button"
            onClick={() => setPeeking(!isPeeking)}
            title="点击切换显示或长按键盘 Tab 键偷看英文提示"
            className={`h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors select-none cursor-pointer ${
              isPeeking ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {isPeeking ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            <span>{isPeeking ? '隐藏提示' : '提示原文'}</span>
            <kbd className="hidden sm:inline text-[10px] font-mono px-1 rounded border border-border text-muted-foreground">
              Tab
            </kbd>
          </button>

          {/* 阶段性动作切换 */}
          {stage === 'keyword' ? (
            <button
              type="button"
              onClick={() => setStage('sentence')}
              title="跳过单词热身，直接进入整句翻译"
              className="h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors select-none cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <FastForward className="size-3.5" />
              <span>跳过热身</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRepeatSentence}
              title="清空当前句子并重新从热身开始练习"
              className="h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors select-none cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <RotateCcw className="size-3.5" />
              <span>重练本句</span>
            </button>
          )}
        </div>
      </div>

      {/* 最上方独立提示展示区：位于工具栏正下方，固定高度且无边框，完全不越界且绝不产生任何布局抖动 */}
      <div className="w-full h-12 sm:h-14 flex items-center justify-center shrink-0 px-6">
        <div
          className={`max-w-3xl text-center text-muted-foreground font-serif italic text-lg sm:text-xl xl:text-2xl transition-opacity duration-150 ${
            isPeeking ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'
          }`}
        >
          {stage === 'keyword' ? currentKeyword?.word : sentence.sentenceEn}
        </div>
      </div>

      {/* 核心展示区 */}
      {stage === 'keyword' && currentKeyword ? (
        /* 阶段一：核心词单独拆分翻译 (正确后秒切下一词，无语法打扰) */
        <div className="flex-1 flex flex-col justify-start items-center pt-6 sm:pt-8 xl:pt-10 space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            {/* 译文字体增大 1 号，纯白且不粗 */}
            <div className="text-lg sm:text-xl xl:text-2xl font-normal text-white max-w-2xl mx-auto">
              {currentKeyword.meaningZh}
            </div>
            <p className="text-xs text-muted-foreground">
              请拼写对应的核心英语单词（拼对后自动推进）
            </p>
          </div>

          {/* 纯净平直单词横杠输入槽：英文字体字号放大，与译文字号对调 */}
          <div className="flex items-center justify-center py-4">
            <div
              style={{
                width: `${Math.max(currentKeyword.word.length, keywordInput.length, 1)}ch`,
              }}
              className={`relative h-14 sm:h-16 xl:h-20 flex items-end justify-start px-1 pb-1.5 bg-transparent border-b-2 font-serif text-3xl sm:text-4xl xl:text-5xl transition-colors ${
                keywordError
                  ? 'text-destructive border-destructive animate-shake'
                  : isKeywordSuccess
                  ? 'text-emerald-500 border-emerald-500'
                  : 'text-foreground border-primary'
              }`}
            >
              {/* 用户输入 */}
              {keywordInput && (
                <span
                  className={`leading-none ${
                    keywordError
                      ? 'text-destructive'
                      : isKeywordSuccess
                      ? 'text-emerald-500'
                      : 'text-foreground'
                  }`}
                >
                  {keywordInput}
                </span>
              )}

              {/* 闪烁光标 */}
              <span
                className={`inline-block w-0.5 h-[1.15em] mb-0.5 animate-pulse shrink-0 ${
                  keywordError
                    ? 'bg-destructive'
                    : isKeywordSuccess
                    ? 'bg-emerald-500'
                    : 'bg-primary'
                }`}
              />
            </div>
          </div>
        </div>
      ) : (
        /* 阶段二：整句合龙翻译实战 */
        <div className="flex-1 flex flex-col justify-start items-center pt-6 sm:pt-8 xl:pt-10 space-y-6 animate-fadeIn">
          <div className="text-center space-y-1.5">
            <p className="text-xs text-muted-foreground">
              请根据译文输入对应的英文整句
            </p>
            {/* 译文字体增大 1 号，纯白且不粗 */}
            <div className="text-lg sm:text-xl xl:text-2xl font-normal text-white leading-relaxed max-w-2xl mx-auto">
              {sentence.sentenceZh}
            </div>
          </div>

          {/* 单词下划横杠对齐流式输入槽：英文字号放大 */}
          <div className="w-full">
            <SentenceUnderlineSlots
              tokens={tokens}
              activeWordIndex={activeWordIndex}
              typedWords={typedWords}
              errorIndices={errorIndices}
              isPeeking={isPeeking}
              isCompleted={isCompleted}
              onWordClick={(idx) => {
                if (!isCompleted) {
                  setActiveWordIndex(idx)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* 底部打字辅助提示与操作栏 */}
      <div className="shrink-0 pt-4 border-t border-border">
        {stage === 'keyword' ? (
          <div className="flex items-center justify-between min-h-[36px] text-xs text-muted-foreground">
            <div className="hidden md:flex items-center gap-4">
              <span>核心词输入正确即切到下一词</span>
              <span>Ctrl+J 重播读音</span>
              <span>长按 Tab 偷看原词</span>
            </div>
            <button
              type="button"
              onClick={() => setStage('sentence')}
              className="h-8 px-2.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors select-none cursor-pointer ml-auto text-foreground hover:bg-muted"
            >
              <span>直接翻译整句</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        ) : !isCompleted ? (
          <div className="flex items-center justify-center min-h-[36px]">
            {errorIndices.length > 0 ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-destructive animate-fadeIn">
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  有 {errorIndices.length} 个单词拼写有误（已标红），修改后按 Enter 回车重新校验
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>空格推进下一词</span>
                <span>Ctrl+J 重听整句</span>
                <span>敲完后 Enter 校验</span>
                <span>点击单词可跳转修改</span>
              </div>
            )}
          </div>
        ) : (
          /* 翻译成功后的卡片快捷操作条 */
          <div className="flex flex-wrap items-center justify-between gap-3 animate-fadeIn min-h-[36px]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setGrammarModalOpen(true)}
                className="h-8 px-3 rounded-md inline-flex items-center gap-1.5 text-[13px] text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>查看句法分析</span>
              </button>

              <button
                type="button"
                onClick={() => playSentenceAudio()}
                className={`h-8 px-3 rounded-md inline-flex items-center gap-1.5 text-[13px] transition-colors cursor-pointer ${
                  isSpeaking ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Volume2 className={`size-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                <span>{isSpeaking ? '正在朗读...' : '重听原声'}</span>
              </button>

              {/* 重练本句 */}
              <button
                type="button"
                onClick={handleRepeatSentence}
                className="h-8 px-3 rounded-md inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>再练一次本句</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onNext}
              className="h-8 px-3 rounded-md inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-medium transition-colors cursor-pointer ml-auto"
            >
              <span>进入下一句</span>
              <span className="text-[10px] opacity-70 font-mono">
                Enter ↵
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
