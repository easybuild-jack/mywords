'use client'

import React, { useState, useId } from 'react'
import {
  X,
  Upload,
  FileText,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookPlus,
} from 'lucide-react'
import { parseCustomSentenceText } from '@/lib/sentenceParser'
import { useTranslateStore } from '@/store/useTranslateStore'
import type { TranslationBook } from '@/types'

const SAMPLE_TEXT = `The sun rises in the east. | 太阳从东方升起。
Practice makes perfect. | 熟能生巧。
Actions speak louder than words. | 行动胜于言辞。
She loves reading novels on rainy afternoons. | 她喜欢在下雨的午后阅读小说。
Where there is a will, there is a way. | 有志者事竟成。`

export function TranslateImportModal() {
  const { isImportModalOpen, setImportModalOpen, addCustomBook } = useTranslateStore()
  const [bookName, setBookName] = useState('')
  const [rawText, setRawText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputId = useId()

  if (!isImportModalOpen) return null

  // 实时解析统计
  const parsedSentences = rawText.trim() ? parseCustomSentenceText(rawText) : []

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setRawText(content)
        if (!bookName) {
          const autoName = file.name.replace(/\.[^/.]+$/, '')
          setBookName(autoName)
        }
      }
    }
    reader.readAsText(file)
  }

  const handleFillSample = () => {
    setRawText(SAMPLE_TEXT)
    if (!bookName) {
      setBookName('经典英文谚语与日常表达')
    }
    setErrorMsg('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsedSentences.length) {
      setErrorMsg('未检测到有效的句子，请检查格式后重试')
      return
    }

    const finalName = bookName.trim() || `自定义练习句集 (${new Date().toLocaleDateString()})`

    const newBook: TranslationBook = {
      id: `custom_book_${Date.now()}`,
      name: finalName,
      description: `用户自主导入的练习题库，共 ${parsedSentences.length} 句`,
      category: 'custom',
      isCustom: true,
      totalSentences: parsedSentences.length,
      sentences: parsedSentences,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    addCustomBook(newBook)
    setImportModalOpen(false)
    setRawText('')
    setBookName('')
    setErrorMsg('')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn overflow-y-auto custom-scrollbar"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-sidebar border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BookPlus className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">导入自定义练习语句</h2>
              <p className="text-xs text-muted-foreground">
                支持纯文本粘贴或上传文件，一键打造专属翻译题库
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setImportModalOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* 句库名称 */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              题库名称 (可选)
            </label>
            <input
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="例如：新概念英语第三册、考研真题长难句..."
              className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border focus:border-primary focus:outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          {/* 文本内容输入与文件上传 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                粘贴句子文本 (一行一句，英文与中文以竖线 | 分隔)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="size-3" />
                  <span>填入示例</span>
                </button>
                <span className="text-muted-foreground/40 text-xs">|</span>
                <label
                  htmlFor={fileInputId}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="size-3" />
                  <span>选择文件 (.txt/.csv)</span>
                </label>
                <input
                  id={fileInputId}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value)
                setErrorMsg('')
              }}
              placeholder={`格式示例：\nThe quick brown fox jumps over the lazy dog. | 敏捷的棕色狐狸跃过了懒狗。\nKnowledge is power. | 知识就是力量。`}
              className="w-full p-4 rounded-2xl bg-muted/20 border border-border/80 focus:border-primary focus:outline-none text-xs sm:text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground/50 resize-none custom-scrollbar"
            />
          </div>

          {/* 解析统计与预览 */}
          {parsedSentences.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Check className="size-4" />
                <span>成功识别 {parsedSentences.length} 条练习语句</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                首句预览：{parsedSentences[0].sentenceEn} ({parsedSentences[0].sentenceZh})
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 说明贴士 */}
          <div className="text-[11px] text-muted-foreground/70 bg-muted/10 p-3 rounded-xl border border-border/40 space-y-1">
            <p className="font-semibold text-muted-foreground flex items-center gap-1">
              <HelpCircle className="size-3" />
              <span>支持的格式说明:</span>
            </p>
            <p>1. 竖线分隔：<code>英文句子 | 中文翻译</code> (推荐)</p>
            <p>2. 制表符/破折号：<code>英文句子 ---- 中文翻译</code> 或 Excel 复制的 Tab 文本</p>
            <p>3. CSV 逗号分隔：<code>英文原句, 中文翻译</code></p>
          </div>
        </form>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-black/20">
          <button
            type="button"
            onClick={() => setImportModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-border text-xs sm:text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!parsedSentences.length}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              parsedSentences.length
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_16px_rgba(var(--primary-rgb),0.3)]'
                : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
            }`}
          >
            <span>保存并立即练习</span>
            {parsedSentences.length > 0 && (
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-black/20">
                {parsedSentences.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
