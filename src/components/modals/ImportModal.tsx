'use client'

import React, { useState } from 'react'
import { X, Upload, Sparkles, FileText, CheckCircle, HelpCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { buildWordItem } from '@/resources/books'
import { saveCustomVocabularyBook } from '@/db'
import type { WordItem } from '@/types'

export function ImportModal() {
  const { isImportModalOpen, setImportModalOpen, setBookId } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'article'>('text')
  const [bookName, setBookName] = useState('我的自定义生词本')
  const [rawText, setRawText] = useState(
    `perspective n. 视角，观点；透视画法
international adj. 国际的，世界性的
developer n. 开发者，开拓者
education n. 教育，培养
understand v. 理解，领会`
  )
  const [parsedWords, setParsedWords] = useState<WordItem[]>([])
  const [isParsed, setIsParsed] = useState(false)
  const [autoEnrichWithAi, setAutoEnrichWithAi] = useState(true)

  if (!isImportModalOpen) return null

  // 解析输入的文本
  const handleParseText = () => {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0)
    const items: WordItem[] = lines.map((line) => {
      const parts = line.trim().split(/[\t\s]+/)
      const wordName = parts[0]
      const meaning = parts.slice(1).join(' ') || '用户导入释义'
      return buildWordItem(wordName, meaning)
    })
    setParsedWords(items)
    setIsParsed(true)
  }

  // 确认导入并持久化至 IndexedDB
  const handleConfirmImport = async () => {
    if (!parsedWords.length) {
      handleParseText()
    }
    const finalWords = parsedWords.length ? parsedWords : rawText.split('\n').map((w) => buildWordItem(w))
    const newBook = await saveCustomVocabularyBook(bookName, '用户自定义生词本', finalWords)
    await setBookId(newBook.id)
    setImportModalOpen(false)
    setIsParsed(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl rounded-3xl border border-white/10 p-6 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.7)] text-white">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Upload className="size-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                单词批量导入与 AI 智能解析
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                  AI Auto-Enrich
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={() => setImportModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#9CA3AF] hover:text-white transition-all"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 导入模式选项卡 */}
        <div className="flex gap-2 p-1 bg-white/[0.04] rounded-xl border border-white/10">
          <button
            onClick={() => { setActiveTab('text'); setIsParsed(false) }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'text' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            快捷文本粘贴 (Text Paste)
          </button>
          <button
            onClick={() => { setActiveTab('file'); setIsParsed(false) }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'file' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            表格模板导入 (CSV / Excel)
          </button>
          <button
            onClick={() => { setActiveTab('article'); setIsParsed(false) }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'article' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgb(var(--primary-rgb)/0.3)]' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            文章生词提取 (Article)
          </button>
        </div>

        {/* 词库名称输入 */}
        <div className="space-y-1.5">
          <label className="text-xs text-[#9CA3AF] font-medium">新词库名称</label>
          <input
            type="text"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
            placeholder="例如: 我的考研阅读高频难词"
          />
        </div>

        {/* 文本输入或解析表格预览 */}
        {!isParsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <span>每行一个单词，可直接附带中文释义（以空格分隔）</span>
              <button onClick={handleParseText} className="text-primary hover:underline font-semibold">
                预览解析结构 →
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-primary/50"
              placeholder={`discover v. 发现\nperspective n. 视角\ninternational adj. 国际的`}
            />
          </div>
        ) : (
          /* 结构化解析预览表格 */
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-primary font-semibold">
              <span>已解析 {parsedWords.length} 个单词（自动补充音节与词根）：</span>
              <button onClick={() => setIsParsed(false)} className="text-muted-foreground hover:underline text-xs">
                返回修改文本
              </button>
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground">
                  <th className="py-2 px-3">单词</th>
                  <th className="py-2 px-3">音节拆分</th>
                  <th className="py-2 px-3">音标</th>
                  <th className="py-2 px-3">释义</th>
                  <th className="py-2 px-3">构词法拆解</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {parsedWords.map((w, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-bold text-white">{w.name}</td>
                    <td className="py-2 px-3 text-primary">{w.syllables.join(' · ')}</td>
                    <td className="py-2 px-3 text-gray-400">{w.phoneticUs}</td>
                    <td className="py-2 px-3 text-gray-300 font-sans">{w.posList[0]?.means.join(', ')}</td>
                    <td className="py-2 px-3 text-accent font-sans truncate max-w-[150px]">
                      {w.etymology?.derivation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 底部功能开关与提交 */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <label className="flex items-center gap-2 text-xs text-[#9CA3AF] cursor-pointer">
            <input
              type="checkbox"
              checked={autoEnrichWithAi}
              onChange={(e) => setAutoEnrichWithAi(e.target.checked)}
              className="accent-primary rounded"
            />
            <span>自动通过 AI 补齐缺失的音标、音节与词根推导</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-[#9CA3AF] hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-xs font-bold btn-neon-glow transition-all"
            >
              确认导入并开始练习
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
