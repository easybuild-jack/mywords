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
  Check,
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
}

export function TranslateCard({
  sentence,
  sentenceIndex,
  totalSentences,
  onNext,
  onPrev,
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

  // 核心词阶段：自动播报当前核心词读音
  useEffect(() => {
    if (stage === 'keyword' && currentKeyword?.word && isAutoPlayAudio) {
      const timer = setTimeout(() => {
        playWordAudio(currentKeyword.word)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [
    stage,
    currentKeywordIndex,
    sentence.id,
    repeatSentenceKey,
    isAutoPlayAudio,
    currentKeyword?.word,
    playWordAudio,
  ])

  // 整句翻译阶段：进入整句时自动播报整句读音
  useEffect(() => {
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
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold text-muted-foreground bg-white/[0.04] px-3 py-1 rounded-lg border border-white/10">
            {sentenceIndex + 1} / {totalSentences}
          </span>

          {/* 阶段清晰指示器 */}
          {stage === 'keyword' && keywords.length > 0 ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <Sparkles className="size-3" />
              <span>核心词热身 · {currentKeywordIndex + 1}/{keywords.length}</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <Check className="size-3" />
              <span>整句翻译实战</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
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
            className={`flex items-center justify-center size-8 sm:size-8.5 rounded-xl border transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)] scale-105'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-primary hover:border-primary/40 border-white/10 active:scale-95'
            }`}
          >
            <Volume2 className={`size-4 ${isSpeaking ? 'animate-bounce text-primary-foreground' : 'text-primary'}`} />
          </button>

          {/* 自动播报开关 */}
          <button
            type="button"
            onClick={toggleAutoPlayAudio}
            title={isAutoPlayAudio ? '自动播报已开启 (点击切换为手动)' : '自动播报已关闭 (点击开启切换词句时自动朗读)'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all select-none cursor-pointer ${
              isAutoPlayAudio
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground border-white/10'
            }`}
          >
            {isAutoPlayAudio ? (
              <Volume2 className="size-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="size-3.5 text-muted-foreground" />
            )}
            <span className="hidden sm:inline">自动播报:</span>
            <span className="font-semibold">{isAutoPlayAudio ? '开' : '关'}</span>
          </button>

          {/* 提示原文按钮 (支持点击切换显隐，或长按 Tab 键偷看) */}
          <button
            type="button"
            onClick={() => setPeeking(!isPeeking)}
            title="点击切换显示或长按键盘 Tab 键偷看英文提示"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all select-none cursor-pointer ${
              isPeeking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground border-white/10'
            }`}
          >
            {isPeeking ? (
              <EyeOff className="size-3.5 text-amber-400" />
            ) : (
              <Eye className="size-3.5 text-muted-foreground" />
            )}
            <span>{isPeeking ? '隐藏提示' : '提示原文'}</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/30 border border-white/10 opacity-70">
              Tab
            </span>
          </button>

          {/* 阶段性动作切换 */}
          {stage === 'keyword' ? (
            <button
              type="button"
              onClick={() => setStage('sentence')}
              title="跳过单词热身，直接进入整句翻译"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer"
            >
              <FastForward className="size-3.5" />
              <span>跳过热身</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRepeatSentence}
              title="清空当前句子并重新从热身开始练习"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer"
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
          className={`max-w-3xl text-center text-amber-400 font-mono text-lg sm:text-xl xl:text-2xl font-bold tracking-wide transition-opacity duration-150 ${
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
            <div className="text-lg sm:text-xl xl:text-2xl font-normal text-white tracking-wide max-w-2xl mx-auto">
              {currentKeyword.meaningZh}
            </div>
            <p className="text-xs text-muted-foreground/50 font-mono">
              请拼写对应的核心英语单词（拼对后自动推进）
            </p>
          </div>

          {/* 纯净平直单词横杠输入槽：英文字体字号放大，与译文字号对调 */}
          <div className="flex items-center justify-center py-4">
            <div
              style={{
                width: `${Math.max(currentKeyword.word.length, keywordInput.length, 1)}ch`,
              }}
              className={`relative h-14 sm:h-16 xl:h-20 flex items-end justify-start px-1 pb-1.5 bg-transparent border-b-2 font-mono text-3xl sm:text-4xl xl:text-5xl transition-colors ${
                keywordError
                  ? 'text-destructive font-black border-destructive animate-shake'
                  : isKeywordSuccess
                  ? 'text-emerald-400 font-bold border-emerald-400'
                  : 'text-primary font-bold border-primary'
              }`}
            >
              {/* 用户输入 */}
              {keywordInput && (
                <span
                  className={`leading-none ${
                    keywordError
                      ? 'text-destructive font-black'
                      : isKeywordSuccess
                      ? 'text-emerald-400 font-bold'
                      : 'text-primary font-bold'
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
                    ? 'bg-emerald-400'
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
            <p className="text-xs font-medium text-muted-foreground/50 tracking-wider">
              请根据译文输入对应的英文整句
            </p>
            {/* 译文字体增大 1 号，纯白且不粗 */}
            <div className="text-lg sm:text-xl xl:text-2xl font-normal text-white tracking-wide leading-relaxed max-w-2xl mx-auto">
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
      <div className="shrink-0 pt-4 border-t border-white/10">
        {stage === 'keyword' ? (
          <div className="flex items-center justify-between min-h-[36px] text-xs text-muted-foreground/60 font-mono">
            <div className="flex items-center gap-4">
              <span>• 核心词输入正确即秒切下一词</span>
              <span>• Ctrl+J 或点击喇叭可重复播放单词读音</span>
              <span>• 长按 Tab 可透视原词</span>
            </div>
            <button
              type="button"
              onClick={() => setStage('sentence')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-foreground hover:border-primary/40 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>直接翻译整句</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        ) : !isCompleted ? (
          <div className="flex items-center justify-center min-h-[36px]">
            {errorIndices.length > 0 ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-destructive font-mono font-bold animate-fadeIn">
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  有 {errorIndices.length} 个单词拼写有误（已标红），修改后按 Enter 回车重新校验
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/60 font-mono">
                <span>• 空格推进下一词（连续输入不卡死）</span>
                <span>• Ctrl+J 或点击喇叭可重复朗读整句</span>
                <span>• 整句敲完后敲 Enter 或空格统一校验</span>
                <span>• 点击任意单词可随时跳转修改</span>
              </div>
            )}
          </div>
        ) : (
          /* 翻译成功后的卡片快捷操作条 */
          <div className="flex flex-wrap items-center justify-between gap-3 animate-fadeIn min-h-[36px]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGrammarModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="size-4" />
                <span>查看句法分析</span>
              </button>

              <button
                type="button"
                onClick={() => playSentenceAudio()}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-foreground border-white/10'
                }`}
              >
                <Volume2 className={`size-3.5 ${isSpeaking ? 'animate-bounce' : 'text-primary'}`} />
                <span>{isSpeaking ? '正在朗读...' : '重听原声'}</span>
              </button>

              {/* 重练本句 */}
              <button
                type="button"
                onClick={handleRepeatSentence}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-foreground text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="size-3.5 text-primary" />
                <span>再练一次本句</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer ml-auto"
            >
              <span>进入下一句</span>
              <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.5 rounded bg-black/20">
                Enter ↵
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
