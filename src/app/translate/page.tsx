'use client'

import React from 'react'
import { TranslateHeader } from '@/components/translate/TranslateHeader'
import { TranslateCard } from '@/components/translate/TranslateCard'
import { SentenceGrammarModal } from '@/components/translate/SentenceGrammarModal'
import { TranslateImportModal } from '@/components/translate/TranslateImportModal'
import { useTranslateStore } from '@/store/useTranslateStore'
import { BookOpen, Plus, ArrowLeft, ArrowRight } from 'lucide-react'

export default function TranslatePage() {
  const {
    books,
    currentBookId,
    currentSentenceIndex,
    nextSentence,
    prevSentence,
    setImportModalOpen,
    isGrammarModalOpen,
    setGrammarModalOpen,
    repeatCurrentSentence,
    isSpeaking,
    audioRate,
    playSentenceAudio,
    toggleAudioRate,
  } = useTranslateStore()

  const currentBook = books.find((b) => b.id === currentBookId) || books[0]
  const sentences = currentBook?.sentences || []
  const currentSentence = sentences[currentSentenceIndex]
  const totalSentences = sentences.length

  // 支持键盘 ← / → 左右方向键翻页切换上一句 / 下一句
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        Boolean(document.querySelector('[role="dialog"]'))
      ) {
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevSentence()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextSentence()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevSentence, nextSentence])

  return (
    <div className="flex-1 min-h-full h-full flex flex-col justify-between bg-background text-foreground relative selection:bg-primary/20 pb-2 overflow-hidden">
      {/* 顶部菜单栏 */}
      <TranslateHeader />

      {/* 主练习舞台：参考单词页统一尺寸与玻璃质感框架 */}
      <div className="flex-1 flex items-center justify-center relative w-full px-4 py-2 my-auto shrink-0">
        <div className="relative w-full flex items-center justify-center gap-4 xl:gap-6 shrink-0">
          {/* 左侧上一句按钮 */}
          <button
            onClick={prevSentence}
            disabled={currentSentenceIndex <= 0}
            className={`shrink-0 size-10 xl:size-12 rounded-full glass-card flex items-center justify-center transition-all cursor-pointer ${
              currentSentenceIndex > 0
                ? 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95'
                : 'opacity-30 cursor-not-allowed text-[#9CA3AF]'
            }`}
            title="上一句 (←)"
          >
            <ArrowLeft className="size-5 xl:size-6" />
          </button>

          {/* 居中固定尺寸卡片：与单词学习/默写卡片完全一致的尺寸与 glass-card 视觉 */}
          <div className="relative flex flex-col items-center shrink-0">
            <div className="relative w-[800px] h-[540px] xl:w-[940px] xl:h-[590px] 2xl:w-[1060px] 2xl:h-[640px] max-w-[94vw] rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl transition-all duration-300 shrink-0 flex flex-col">
              {currentSentence ? (
                <TranslateCard
                  key={currentSentence.id}
                  sentence={currentSentence}
                  sentenceIndex={currentSentenceIndex}
                  totalSentences={totalSentences}
                  onNext={nextSentence}
                  onPrev={prevSentence}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center select-none space-y-4">
                  <div className="size-16 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground">
                    <BookOpen className="size-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">该句库暂无练习语句</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                    您可以直接点击下方按钮，导入自定义的英文句子与中文译文开始练习。
                  </p>
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>导入练习语句</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 右侧下一句按钮 */}
          <button
            onClick={nextSentence}
            disabled={currentSentenceIndex >= totalSentences - 1}
            className={`shrink-0 size-10 xl:size-12 rounded-full glass-card flex items-center justify-center transition-all cursor-pointer ${
              currentSentenceIndex < totalSentences - 1
                ? 'text-[#9CA3AF] hover:text-white hover:border-primary/50 hover:scale-110 active:scale-95'
                : 'opacity-30 cursor-not-allowed text-[#9CA3AF]'
            }`}
            title="下一句 (→)"
          >
            <ArrowRight className="size-5 xl:size-6" />
          </button>
        </div>
      </div>

      {/* 句法分析弹窗：以绝对定位挂载在右侧主显示区，完全不遮挡左侧全局导航栏 */}
      {currentSentence && (
        <SentenceGrammarModal
          isOpen={isGrammarModalOpen}
          onClose={() => setGrammarModalOpen(false)}
          sentence={currentSentence}
          isSpeaking={isSpeaking}
          audioRate={audioRate}
          onPlayAudio={playSentenceAudio}
          onToggleAudioRate={toggleAudioRate}
          onNext={() => {
            setGrammarModalOpen(false)
            nextSentence()
          }}
          onRepeat={repeatCurrentSentence}
        />
      )}

      {/* 自定义上传练习语句弹窗 */}
      <TranslateImportModal />
    </div>
  )
}
