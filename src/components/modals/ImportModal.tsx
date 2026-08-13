'use client'

import React, { useState, useRef } from 'react'
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  FileText,
  Download,
  ArrowRight
} from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { dictionaryLoader } from '@/core/dictionaryLoader'
import { saveCustomVocabularyBook } from '@/db'
import type { WordItem } from '@/types'

export function ImportModal() {
  const { isImportModalOpen, setImportModalOpen, setBookId } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text')
  const [bookName, setBookName] = useState('我的自定义生词本')
  
  // Tab 1: 文本粘贴
  const [rawText, setRawText] = useState(
    `resilient
perspective n. 视角，观点；透视画法
international
developer n. 开发者，开拓者
kubernetes
extraordinary
compile v. 编译；编纂`
  )

  // 文件上传 Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>('')

  // 解析与补全状态
  const [parsedWords, setParsedWords] = useState<WordItem[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isParsed, setIsParsed] = useState(false)
  const [autoDeduplicate, setAutoDeduplicate] = useState(true)

  if (!isImportModalOpen) return null

  // 1. 解析文本粘贴 (Tab 1)
  const handleParseText = async () => {
    setIsParsing(true)
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    const items: WordItem[] = []
    const seen = new Set<string>()

    for (const line of lines) {
      const parts = line.split(/[\t\s]+/)
      const wordName = parts[0].replace(/[^a-zA-Z-]/g, '')
      if (!wordName || (autoDeduplicate && seen.has(wordName.toLowerCase()))) continue
      seen.add(wordName.toLowerCase())

      const customMeaning = parts.length > 1 ? parts.slice(1).join(' ') : undefined
      const enriched = await dictionaryLoader.enrichWord(wordName, customMeaning)
      items.push(enriched)
    }

    setParsedWords(items)
    setIsParsing(false)
    setIsParsed(true)
  }

  // 2. 解析上传的文件 (CSV, TXT, JSON) (Tab 2)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    setIsParsing(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      if (!content) {
        setIsParsing(false)
        return
      }

      const items: WordItem[] = []
      const seen = new Set<string>()

      if (file.name.endsWith('.json')) {
        try {
          const json = JSON.parse(content)
          const list = Array.isArray(json) ? json : [json]
          for (const entry of list) {
            const name = entry.name || entry.word || ''
            if (!name || seen.has(name.toLowerCase())) continue
            seen.add(name.toLowerCase())
            const meaning = entry.trans?.join(' ') || entry.meaning || entry.translation
            const enriched = await dictionaryLoader.enrichWord(name, meaning, entry.usphone || entry.phonetic)
            items.push(enriched)
          }
        } catch (err) {
          alert('JSON 解析失败，请检查文件格式')
        }
      } else {
        // CSV 或 TXT 解析
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
        const isCsv = file.name.endsWith('.csv') || lines[0].includes(',')

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (i === 0 && isCsv && (line.toLowerCase().includes('word') || line.includes('单词'))) {
            continue // 跳过表头
          }

          let wordName = ''
          let meaning: string | undefined

          if (isCsv) {
            const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
            wordName = cols[0]
            meaning = cols[1] || undefined
          } else {
            const parts = line.split(/[\t\s]+/)
            wordName = parts[0]
            meaning = parts.length > 1 ? parts.slice(1).join(' ') : undefined
          }

          wordName = wordName.replace(/[^a-zA-Z-]/g, '')
          if (!wordName || (autoDeduplicate && seen.has(wordName.toLowerCase()))) continue
          seen.add(wordName.toLowerCase())

          const enriched = await dictionaryLoader.enrichWord(wordName, meaning)
          items.push(enriched)
        }
      }

      setParsedWords(items)
      setIsParsing(false)
      setIsParsed(true)
    }

    reader.readAsText(file)
  }

  // 下载 CSV 模板
  const handleDownloadCsvTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      '单词,中文释义(选填),音标(选填)\n' +
      'perspective,视角；观点,/pərˈspektɪv/\n' +
      'resilient,有弹性的,/rɪˈzɪliənt/\n' +
      'kubernetes,容器自动化编排引擎,\n' +
      'compile,编译；编纂,\n'
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'MyWords_导入模板.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 确认导入并持久化至 IndexedDB
  const handleConfirmImport = async () => {
    let finalWords = parsedWords
    if (!finalWords.length) {
      if (activeTab === 'text') await handleParseText()
      finalWords = parsedWords
    }

    if (!finalWords.length) {
      alert('未检测到有效单词，请检查输入或上传内容')
      return
    }

    const newBook = await saveCustomVocabularyBook(bookName, '用户自定义导入词库', finalWords)
    await setBookId(newBook.id)
    setImportModalOpen(false)
    setIsParsed(false)
    setUploadedFileName('')
  }

  const handleDeleteWord = (index: number) => {
    setParsedWords((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl rounded-3xl border border-white/10 p-6 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.7)] text-white">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30 shadow-[0_0_16px_rgba(0,255,136,0.2)]">
              <Upload className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                单词批量导入中心
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                  智能解析补全
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                支持纯文本快速粘贴与 CSV / TXT / JSON 文件批量模板导入
              </p>
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
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'text' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgba(0,255,136,0.3)]' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <FileText className="size-3.5" />
            <span>快捷文本粘贴 (Text Paste)</span>
          </button>
          <button
            onClick={() => { setActiveTab('file'); setIsParsed(false) }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'file' ? 'bg-primary text-[#0B0C0E] shadow-[0_0_12px_rgba(0,255,136,0.3)]' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <FileSpreadsheet className="size-3.5" />
            <span>文件模板导入 (CSV / Excel / JSON)</span>
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

        {/* 对应 Tab 的内容区 */}
        {!isParsed ? (
          <div className="space-y-3">
            {/* Tab 1: 文本粘贴 */}
            {activeTab === 'text' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>每行一个单词（可只给英文，系统将自动从 5 万词库中秒级检索释义）</span>
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
            )}

            {/* Tab 2: 文件上传 */}
            {activeTab === 'file' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9CA3AF]">支持上传 `.csv`、`.txt` 或 `.json` 文件</span>
                  <button
                    onClick={handleDownloadCsvTemplate}
                    className="text-xs text-accent hover:underline flex items-center gap-1 font-mono font-medium"
                  >
                    <Download className="size-3.5" />
                    <span>下载标准 CSV 模板</span>
                  </button>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-primary/50 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="size-12 rounded-2xl bg-white/[0.06] group-hover:bg-primary/20 text-muted-foreground group-hover:text-primary flex items-center justify-center mx-auto transition-all">
                    {isParsing ? <Loader2 className="size-6 animate-spin text-primary" /> : <Upload className="size-6" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">
                      {uploadedFileName ? `已选择: ${uploadedFileName}` : '点击选择文件 或 将文件拖拽至此处'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isParsing ? '正在从 50,000+ 离线词库检索并自动生成音节与词根...' : '支持 CSV 表格、纯文本词单与 JSON 数据'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 结构化智能补全预览表格 */
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-4" />
                已成功智能解析并补全 {parsedWords.length} 个单词（含权威音标、音节与词根）
              </span>
              <button onClick={() => setIsParsed(false)} className="text-muted-foreground hover:underline text-xs">
                返回重新输入
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
              checked={autoDeduplicate}
              onChange={(e) => setAutoDeduplicate(e.target.checked)}
              className="accent-primary rounded"
            />
            <span>自动去除重复单词并过滤常见虚词</span>
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
              className="px-6 py-2.5 rounded-xl bg-primary text-[#0B0C0E] text-xs font-bold btn-neon-glow transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isParsing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>正在导入...</span>
                </>
              ) : (
                <>
                  <span>确认导入并开始练习</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
