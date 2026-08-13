'use client'

import React, { useState } from 'react'
import { X, Upload, Sparkles, Loader2, CheckCircle2, Trash2, Edit3 } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { dictionaryLoader } from '@/core/dictionaryLoader'
import { saveCustomVocabularyBook } from '@/db'
import type { WordItem } from '@/types'

export function ImportModal() {
  const { isImportModalOpen, setImportModalOpen, setBookId } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'article'>('text')
  const [bookName, setBookName] = useState('我的自定义生词本')
  const [rawText, setRawText] = useState(
    `resilient
perspective n. 视角，观点；透视画法
international
developer n. 开发者，开拓者
kubernetes
extraordinary
compile v. 编译；编纂`
  )
  const [parsedWords, setParsedWords] = useState<WordItem[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isParsed, setIsParsed] = useState(false)
  const [autoEnrichWithAi, setAutoEnrichWithAi] = useState(true)

  if (!isImportModalOpen) return null

  // 批量调用智能补全流水线解析文本
  const handleParseText = async () => {
    setIsParsing(true)
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    const items: WordItem[] = []

    for (const line of lines) {
      const parts = line.split(/[\t\s]+/)
      const wordName = parts[0]
      const customMeaning = parts.length > 1 ? parts.slice(1).join(' ') : undefined
      
      const enriched = await dictionaryLoader.enrichWord(wordName, customMeaning)
      items.push(enriched)
    }

    setParsedWords(items)
    setIsParsing(false)
    setIsParsed(true)
  }

  // 确认导入并持久化至 IndexedDB
  const handleConfirmImport = async () => {
    let finalWords = parsedWords
    if (!finalWords.length) {
      setIsParsing(true)
      const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
      const items: WordItem[] = []
      for (const line of lines) {
        const parts = line.split(/[\t\s]+/)
        const wordName = parts[0]
        const customMeaning = parts.length > 1 ? parts.slice(1).join(' ') : undefined
        const enriched = await dictionaryLoader.enrichWord(wordName, customMeaning)
        items.push(enriched)
      }
      finalWords = items
      setIsParsing(false)
    }

    const newBook = await saveCustomVocabularyBook(bookName, '用户自定义生词本', finalWords)
    await setBookId(newBook.id)
    setImportModalOpen(false)
    setIsParsed(false)
  }

  const handleDeleteWord = (index: number) => {
    setParsedWords((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl rounded-3xl border border-white/10 p-6 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.7)] text-white">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30 shadow-[0_0_16px_rgba(0,255,136,0.2)]">
              <Upload className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                单词批量导入与智能自动补全
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                  50,000+ 离线词库直连
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">只输单词也可 100% 自动匹配英美音标、权威词性、中文释义与音节拆解</p>
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
              activeTab === 'text' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgba(0,255,136,0.3)]' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            快捷文本粘贴 (Text Paste)
          </button>
          <button
            onClick={() => { setActiveTab('file'); setIsParsed(false) }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'file' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgba(0,255,136,0.3)]' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            表格模板导入 (CSV / Excel)
          </button>
          <button
            onClick={() => { setActiveTab('article'); setIsParsed(false) }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'article' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgba(0,255,136,0.3)]' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            文章生词提取 (Article)
          </button>
        </div>

        {/* 词库名称输入 */}
        <div className="space-y-1.5">
          <label className="text-xs text-[#9CA3AF] font-medium">自定义词库名称</label>
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
              <span>支持仅粘贴纯英文单词（每行一个），系统将自动从 5 万词库中秒级检索释义</span>
              <button
                onClick={handleParseText}
                disabled={isParsing}
                className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>正在检索与自动补齐中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>一键智能补全并预览结构 →</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-primary/50"
              placeholder={`resilient\nperspective n. 视角，观点\nkubernetes\ncompile`}
            />
          </div>
        ) : (
          /* 结构化智能补全预览表格 */
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-4" />
                已成功智能补全 {parsedWords.length} 个单词（含音标、音节与词根）
              </span>
              <button onClick={() => setIsParsed(false)} className="text-muted-foreground hover:underline text-xs">
                返回修改文本
              </button>
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-muted-foreground font-mono">
                  <th className="py-2.5 px-3">单词</th>
                  <th className="py-2.5 px-3">自然拼读音节</th>
                  <th className="py-2.5 px-3">音标 (US)</th>
                  <th className="py-2.5 px-3">智能匹配释义</th>
                  <th className="py-2.5 px-3">构词法推导</th>
                  <th className="py-2.5 px-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {parsedWords.map((w, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white text-sm">{w.name}</td>
                    <td className="py-2.5 px-3 text-primary font-semibold">{w.syllables.join(' · ')}</td>
                    <td className="py-2.5 px-3 text-gray-300">{w.phoneticUs}</td>
                    <td className="py-2.5 px-3 text-gray-200 font-sans">
                      <span className="text-accent mr-1 font-mono font-bold">{w.posList[0]?.pos}</span>
                      {w.posList[0]?.means.join('； ')}
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 font-sans truncate max-w-[170px]" title={w.etymology?.derivation}>
                      {w.etymology?.derivation}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => handleDeleteWord(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="删除该词"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
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
            <span>自动优先命中本地 50,000+ 权威词库并提取词根公式</span>
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
              disabled={isParsing}
              className="px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-xs font-bold btn-neon-glow transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isParsing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>正在导入...</span>
                </>
              ) : (
                <span>确认导入并开始练习</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
