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
  const [selectedScenario, setSelectedScenario] = useState('日常生活')
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
      scenario: selectedScenario,
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
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn overflow-y-auto custom-scrollbar"
    >
      <div className="relative w-full max-w-2xl rounded-xl bg-sidebar border border-border shadow-xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <BookPlus className="size-4 text-muted-foreground" />
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">导入自定义练习语句</h2>
              <p className="text-xs text-muted-foreground">
                支持纯文本粘贴或上传文件，一键打造专属翻译题库
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setImportModalOpen(false)}
            className="size-8 rounded-md inline-flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* 句库名称与场景归属 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                题库名称 (可选)
              </label>
              <input
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="例如：新概念英语第三册、考研长难句..."
                className="w-full h-9 px-3 rounded-md bg-transparent border border-border focus:border-primary focus:outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                所属场景分类
              </label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-sidebar border border-border focus:border-primary focus:outline-none text-sm text-foreground cursor-pointer"
              >
                <option value="日常生活">日常生活</option>
                <option value="职场商务">职场商务</option>
                <option value="旅游出行">旅游出行</option>
                <option value="餐饮美食">餐饮美食</option>
                <option value="购物消费">购物消费</option>
              </select>
            </div>
          </div>

          {/* 文本内容输入与文件上传 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground">
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
              className="w-full p-3 rounded-md bg-transparent border border-border focus:border-primary focus:outline-none text-xs sm:text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground/50 resize-none custom-scrollbar"
            />
          </div>

          {/* 解析统计与预览 */}
          {parsedSentences.length > 0 && (
            <div className="text-xs text-primary space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="size-3.5" />
                <span>成功识别 {parsedSentences.length} 条练习语句</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                首句预览：{parsedSentences[0].sentenceEn} ({parsedSentences[0].sentenceZh})
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 说明贴士 */}
          <div className="text-[11px] text-muted-foreground pt-3 border-t border-dashed border-border space-y-1">
            <p className="font-medium text-foreground flex items-center gap-1">
              <HelpCircle className="size-3" />
              <span>支持的格式</span>
            </p>
            <p>1. 竖线分隔：<code>英文句子 | 中文翻译</code> (推荐)</p>
            <p>2. 制表符/破折号：<code>英文句子 ---- 中文翻译</code> 或 Excel 复制的 Tab 文本</p>
            <p>3. CSV 逗号分隔：<code>英文原句, 中文翻译</code></p>
          </div>
        </form>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border">
          <button
            type="button"
            onClick={() => setImportModalOpen(false)}
            className="h-8 px-3 rounded-md text-[13px] hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!parsedSentences.length}
            className={`h-8 px-3 rounded-md text-[13px] font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
              parsedSentences.length
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            <span>保存并立即练习</span>
            {parsedSentences.length > 0 && (
              <span className="text-[11px] font-mono opacity-70">
                {parsedSentences.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
