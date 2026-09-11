'use client'

import React, { useState, useMemo } from 'react'
import { Copy, Check, Terminal, FileCode, Braces, FileText, Code2 } from 'lucide-react'

interface AiContentRendererProps {
  content: string
}

export type SupportedFormat = 'html' | 'markdown' | 'json' | 'shell' | 'plain'

/**
 * 检测内容是否包含支持的格式标记 (html, markdown, json, shell)
 * 若无任何标记，则判定为纯文本 (plain)
 */
export function analyzeContentFormat(rawText: string): {
  format: SupportedFormat
  isPureJson: boolean
  isPureHtml: boolean
  isPureShell: boolean
  hasMarkdown: boolean
} {
  const text = rawText || ''
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      format: 'plain',
      isPureJson: false,
      isPureHtml: false,
      isPureShell: false,
      hasMarkdown: false,
    }
  }

  // 1. 检测纯 JSON（以 { 或 [ 开头结尾，且合法 JSON）
  let isPureJson = false
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed)
      isPureJson = true
    } catch {
      isPureJson = false
    }
  }

  // 2. 检测纯 HTML（以 <!DOCTYPE 或 <html> 开头，或包含多行成对标签）
  const isPureHtml =
    !isPureJson &&
    (/^<!DOCTYPE\s+html/i.test(trimmed) ||
      /^<html[\s>]/i.test(trimmed) ||
      (/^<([a-z0-9-]+)(\s+[^>]*)?>[\s\S]*<\/\1>$/i.test(trimmed) && trimmed.includes('\n')))

  // 3. 检测纯 Shell 脚本或多行命令
  const isPureShell =
    !isPureJson &&
    !isPureHtml &&
    (/^#!\/bin\/(bash|sh|zsh)/.test(trimmed) ||
      (/^\s*(\$|>|npm|pnpm|yarn|npx|git|curl|docker|cd|ls|export|cat|chmod)\s+/m.test(trimmed) &&
        trimmed.split('\n').filter(l => l.trim()).every(line =>
          /^\s*(#|\$|>|npm|pnpm|yarn|npx|git|curl|docker|cd|ls|mkdir|echo|export|cat|chmod|source|apt|brew|pip|node|python)/.test(
            line
          )
        )))

  // 4. 检测 Markdown 格式标记
  const hasCodeBlock = /```|~~~/.test(text)
  const hasHeading = /(^|\n)#{1,6}\s+\S+/.test(text)
  const hasBold = /\*\*[^\*\n]+\*\*/.test(text) || /__[^_\n]+__/.test(text)
  const hasItalic = /(^|[^\*])\*[^\*\s\n][^\*\n]*\*(?=[^\*]|$)/.test(text)
  const hasBlockquote = /(^|\n)>\s+\S+/.test(text)
  const hasList = /(^|\n)\s*([-*•]|\d+\.)\s+\S+/.test(text)
  const hasTable =
    /(^|\n)\|.*?\|.*?\|\s*(\n|$)/.test(text) ||
    /\|.*?\|.*?\-{3,}.*?\|/.test(text) ||
    /\|\s*\|(?=[^|\n])/.test(text)
  const hasInlineCode = /`[^`\n]+`/.test(text)
  const hasLink = /\[[^\]\n]+\]\([^\)\n]+\)/.test(text)
  const hasHr = /(^|\n)(---|---|\*\*\*|___)\s*($|\n)/.test(text)

  const hasMarkdown =
    hasCodeBlock ||
    hasHeading ||
    hasBold ||
    hasItalic ||
    hasBlockquote ||
    hasList ||
    hasTable ||
    hasInlineCode ||
    hasLink ||
    hasHr

  let format: SupportedFormat = 'plain'
  if (isPureJson) {
    format = 'json'
  } else if (isPureHtml) {
    format = 'html'
  } else if (isPureShell) {
    format = 'shell'
  } else if (hasMarkdown) {
    format = 'markdown'
  }

  return {
    format,
    isPureJson,
    isPureHtml,
    isPureShell,
    hasMarkdown,
  }
}

export function AiContentRenderer({ content }: AiContentRendererProps) {
  const analysis = useMemo(() => analyzeContentFormat(content), [content])

  // 没有任何标记时，默认展示为纯文本
  if (analysis.format === 'plain') {
    return (
      <div className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap select-text font-sans">
        {content}
      </div>
    )
  }

  // 纯 JSON 代码块
  if (analysis.isPureJson) {
    let formattedJson = content
    try {
      formattedJson = JSON.stringify(JSON.parse(content), null, 2)
    } catch {
      formattedJson = content
    }
    return <CodeBlock code={formattedJson} language="json" />
  }

  // 纯 HTML 代码块
  if (analysis.isPureHtml) {
    return <CodeBlock code={content} language="html" />
  }

  // 纯 Shell 代码块
  if (analysis.isPureShell) {
    return <CodeBlock code={content} language="shell" />
  }

  // Markdown 渲染（内含 html/markdown/json/shell 等代码块与排版标记）
  return <MarkdownRenderer content={content} />
}

/** 专门的代码块渲染组件，支持一键复制代码与多语言语法高亮 */
export function CodeBlock({
  code,
  language = 'text',
}: {
  code: string
  language?: string
}) {
  const [copied, setCopied] = useState(false)
  const langKey = language.toLowerCase().trim()

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const { label, icon: Icon, badgeColor } = getLanguageMeta(langKey)

  return (
    <div className="my-2.5 rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-lg group">
      {/* 顶部工具栏：语言类型与复制按钮 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/10 select-none">
        <div className="flex items-center gap-1.5">
          <Icon className={`size-3.5 ${badgeColor}`} />
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-gray-300">
            {label}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="复制代码"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-emerald-400">已复制</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* 代码内容高亮区 */}
      <div className="p-3 overflow-x-auto text-xs font-mono leading-relaxed select-text no-scrollbar">
        {renderHighlightedCode(code, langKey)}
      </div>
    </div>
  )
}

function getLanguageMeta(lang: string) {
  switch (lang) {
    case 'html':
    case 'xml':
      return { label: 'HTML', icon: Code2, badgeColor: 'text-orange-400' }
    case 'json':
      return { label: 'JSON', icon: Braces, badgeColor: 'text-amber-400' }
    case 'shell':
    case 'bash':
    case 'sh':
    case 'zsh':
      return { label: 'SHELL', icon: Terminal, badgeColor: 'text-emerald-400' }
    case 'markdown':
    case 'md':
      return { label: 'MARKDOWN', icon: FileText, badgeColor: 'text-sky-400' }
    default:
      return { label: lang ? lang.toUpperCase() : 'CODE', icon: FileCode, badgeColor: 'text-primary' }
  }
}

/** 针对 HTML, JSON, SHELL, MARKDOWN 的轻量无损语法高亮渲染器 */
function renderHighlightedCode(code: string, lang: string) {
  const lines = code.split('\n')

  if (lang === 'json') {
    return (
      <pre className="text-gray-300">
        {lines.map((line, idx) => (
          <div key={idx} className="hover:bg-white/[0.02]">
            <span dangerouslySetInnerHTML={{ __html: highlightJsonLine(line) }} />
          </div>
        ))}
      </pre>
    )
  }

  if (lang === 'html' || lang === 'xml') {
    return (
      <pre className="text-gray-300">
        {lines.map((line, idx) => (
          <div key={idx} className="hover:bg-white/[0.02]">
            <span dangerouslySetInnerHTML={{ __html: highlightHtmlLine(line) }} />
          </div>
        ))}
      </pre>
    )
  }

  if (lang === 'shell' || lang === 'bash' || lang === 'sh' || lang === 'zsh') {
    return (
      <pre className="text-gray-300">
        {lines.map((line, idx) => (
          <div key={idx} className="hover:bg-white/[0.02]">
            <span dangerouslySetInnerHTML={{ __html: highlightShellLine(line) }} />
          </div>
        ))}
      </pre>
    )
  }

  if (lang === 'markdown' || lang === 'md') {
    return (
      <pre className="text-gray-300">
        {lines.map((line, idx) => (
          <div key={idx} className="hover:bg-white/[0.02]">
            <span dangerouslySetInnerHTML={{ __html: highlightMarkdownLine(line) }} />
          </div>
        ))}
      </pre>
    )
  }

  // 通用兜底代码高亮
  return (
    <pre className="text-gray-300">
      {code}
    </pre>
  )
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** JSON 单行高亮 */
function highlightJsonLine(line: string): string {
  const escaped = escapeHtml(line)
  return escaped
    // 键名 "key":
    .replace(
      /(&quot;.*?&quot;)(\s*:)/g,
      '<span class="text-sky-300 font-medium">$1</span>$2'
    )
    // 字符串值: "value"
    .replace(
      /(:\s*)(&quot;.*?&quot;)/g,
      '$1<span class="text-emerald-300">$2</span>'
    )
    // 数值
    .replace(
      /(:\s*)(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      '$1<span class="text-amber-300 font-mono">$2</span>'
    )
    // 布尔/空值
    .replace(
      /(:\s*)(true|false|null)/g,
      '$1<span class="text-purple-300 font-semibold">$2</span>'
    )
}

/** HTML 单行高亮 */
function highlightHtmlLine(line: string): string {
  const escaped = escapeHtml(line)
  return escaped
    // 注释 <!-- ... -->
    .replace(
      /(&lt;!--.*?--&gt;)/g,
      '<span class="text-gray-500 italic">$1</span>'
    )
    // 标签名 &lt;tag 或 &lt;/tag&gt;
    .replace(
      /(&lt;\/?[a-zA-Z0-9-]+)/g,
      '<span class="text-rose-400 font-medium">$1</span>'
    )
    // 标签结束 &gt; 或 /&gt;
    .replace(
      /(\/?&gt;)/g,
      '<span class="text-rose-400 font-medium">$1</span>'
    )
    // 属性名
    .replace(
      /\s+([a-zA-Z0-9-:]+)(?==)/g,
      ' <span class="text-amber-200">$1</span>'
    )
    // 属性值
    .replace(
      /(=)(&quot;.*?&quot;|&#039;.*?&#039;)/g,
      '$1<span class="text-emerald-300">$2</span>'
    )
}

/** Shell 单行高亮 */
function highlightShellLine(line: string): string {
  const escaped = escapeHtml(line)
  if (/^\s*#/.test(escaped)) {
    return `<span class="text-gray-500 italic">${escaped}</span>`
  }

  return escaped
    // 提示符 $ 或 >
    .replace(
      /^(\s*[$&gt;]\s*)/,
      '<span class="text-gray-500 select-none font-bold">$1</span>'
    )
    // 常见命令
    .replace(
      /\b(npm|pnpm|yarn|npx|node|git|docker|curl|wget|cd|ls|mkdir|rm|cp|mv|chmod|chown|cat|grep|find|sed|awk|export|echo|source|apt|brew|pip|python|sh|bash|clear|sudo)\b/g,
      '<span class="text-cyan-300 font-semibold">$1</span>'
    )
    // 选项与参数 --flag 或 -f
    .replace(
      /\s+(--?[a-zA-Z0-9_-]+)/g,
      ' <span class="text-amber-300">$1</span>'
    )
    // 环境变量
    .replace(
      /(\$[a-zA-Z0-9_]+|\$\{[^}]+\})/g,
      '<span class="text-purple-300 font-semibold">$1</span>'
    )
    // 字符串
    .replace(
      /(&quot;.*?&quot;|&#039;.*?&#039;)/g,
      '<span class="text-emerald-300">$1</span>'
    )
}

/** Markdown 单行代码高亮 */
function highlightMarkdownLine(line: string): string {
  const escaped = escapeHtml(line)
  if (/^#{1,6}\s+/.test(escaped)) {
    return `<span class="text-sky-300 font-bold">${escaped}</span>`
  }
  if (/^(&gt;|\&gt;)\s+/.test(escaped)) {
    return `<span class="text-gray-400 italic">${escaped}</span>`
  }
  if (/^\s*([-*•]|\d+\.)\s+/.test(escaped)) {
    return `<span class="text-amber-300 font-bold">${escaped}</span>`
  }
  return escaped
}

/** 结构化 Markdown 块解析与渲染 */
function MarkdownRenderer({ content }: { content: string }) {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content])

  return (
    <div className="space-y-2 select-text">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'code':
            return <CodeBlock key={idx} code={block.content} language={block.language || 'text'} />

          case 'heading': {
            const level = block.level || 1
            if (level === 1) {
              return (
                <h1 key={idx} className="text-base font-bold text-foreground pt-2 pb-1 border-b border-border">
                  <InlineTokens text={block.content} />
                </h1>
              )
            }
            if (level === 2) {
              return (
                <h2 key={idx} className="text-sm font-bold text-foreground pt-1.5 pb-0.5">
                  <InlineTokens text={block.content} />
                </h2>
              )
            }
            return (
              <h3 key={idx} className="text-xs font-bold text-foreground pt-1">
                <InlineTokens text={block.content} />
              </h3>
            )
          }

          case 'blockquote':
            return (
              <blockquote
                key={idx}
                className="pl-3 py-1 my-1 border-l-2 border-primary/50 text-muted-foreground italic text-xs sm:text-sm bg-muted/40 rounded-r-lg"
              >
                <InlineTokens text={block.content} />
              </blockquote>
            )

          case 'list':
            return (
              <div key={idx} className="space-y-1 my-1">
                {block.items?.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                    <span className="text-primary font-bold select-none">•</span>
                    <span className="flex-1 leading-relaxed">
                      <InlineTokens text={item} />
                    </span>
                  </div>
                ))}
              </div>
            )

          case 'ordered-list':
            return (
              <div key={idx} className="space-y-1 my-1">
                {block.items?.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                    <span className="text-amber-500 dark:text-amber-300 font-mono text-xs font-semibold select-none">
                      {itemIdx + 1}.
                    </span>
                    <span className="flex-1 leading-relaxed">
                      <InlineTokens text={item} />
                    </span>
                  </div>
                ))}
              </div>
            )

          case 'hr':
            return <hr key={idx} className="border-border my-3" />

          case 'table':
            return (
              <div
                key={idx}
                className="my-3 max-w-full overflow-x-auto rounded-xl border border-border/80 bg-card/50 shadow-sm backdrop-blur-sm"
              >
                <table className="w-full min-w-[380px] border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-foreground">
                      {block.headers?.map((header, hIdx) => {
                        const align = block.alignments?.[hIdx] || 'left'
                        return (
                          <th
                            key={hIdx}
                            className="px-3.5 py-2.5 font-bold tracking-tight text-primary/95"
                            style={{ textAlign: align }}
                          >
                            <InlineTokens text={header} />
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {block.tableRows?.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="transition-colors hover:bg-primary/[0.04] even:bg-white/[0.02] dark:even:bg-white/[0.01]"
                      >
                        {row.map((cell, cIdx) => {
                          const align = block.alignments?.[cIdx] || 'left'
                          return (
                            <td
                              key={cIdx}
                              className="px-3.5 py-2.5 text-foreground/90 leading-relaxed align-top"
                              style={{ textAlign: align }}
                            >
                              <InlineTokens text={cell} />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          case 'paragraph':
          default:
            return (
              <p key={idx} className="text-xs sm:text-sm text-foreground leading-relaxed">
                <InlineTokens text={block.content} />
              </p>
            )
        }
      })}
    </div>
  )
}

interface MarkdownBlock {
  type: 'paragraph' | 'heading' | 'code' | 'blockquote' | 'list' | 'ordered-list' | 'hr' | 'table'
  content: string
  level?: number
  language?: string
  items?: string[]
  headers?: string[]
  alignments?: ('left' | 'center' | 'right')[]
  tableRows?: string[][]
}

/** 规范化单行或被紧凑压缩的 Markdown 表格文本 */
function normalizeMarkdownTables(text: string): string {
  // 将以 || 紧挨连接的被压缩在单行的表格行（两行合并处的 ||）拆开为换行
  return text.replace(/\|\|+/g, '|\n|')
}

function isTableRow(line: string): boolean {
  const t = line.trim()
  return t.startsWith('|') && t.endsWith('|') && t.split('|').length >= 3
}

function isSeparatorRow(line: string): boolean {
  const t = line.trim()
  return /^\|(\s*:?-+:?\s*\|)+$/.test(t)
}

function parseTableRowCells(rowStr: string): string[] {
  const inner = rowStr.trim().replace(/^\|/, '').replace(/\|$/, '')
  return inner.split('|').map((c) => c.trim())
}

/** 将 Markdown 文本切分为独立区块 */
function parseMarkdownBlocks(rawText: string): MarkdownBlock[] {
  const normalized = normalizeMarkdownTables(rawText)
  const lines = normalized.split('\n')
  const blocks: MarkdownBlock[] = []
  let currentParagraph: string[] = []
  let inCodeBlock = false
  let codeLanguage = ''
  let codeLines: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const pText = currentParagraph.join('\n').trim()
      if (pText) {
        blocks.push({ type: 'paragraph', content: pText })
      }
      currentParagraph = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 1. 代码块围栏判定 ```
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      if (inCodeBlock) {
        // 代码块结束
        blocks.push({
          type: 'code',
          content: codeLines.join('\n'),
          language: codeLanguage,
        })
        inCodeBlock = false
        codeLanguage = ''
        codeLines = []
      } else {
        // 代码块开始
        flushParagraph()
        inCodeBlock = true
        codeLanguage = trimmed.slice(3).trim()
        codeLines = []
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    // 空行拆分段落
    if (!trimmed) {
      flushParagraph()
      continue
    }

    // 2. 表格判定：当前行是表格行，且下一行是分隔线行
    if (isTableRow(trimmed) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      flushParagraph()
      const headerLine = trimmed
      const sepLine = lines[i + 1].trim()
      const headers = parseTableRowCells(headerLine)
      const sepCells = parseTableRowCells(sepLine)

      const alignments: ('left' | 'center' | 'right')[] = sepCells.map((sep) => {
        const s = sep.trim()
        if (s.startsWith(':') && s.endsWith(':')) return 'center'
        if (s.endsWith(':')) return 'right'
        return 'left'
      })

      const tableRows: string[][] = []
      let j = i + 2
      while (j < lines.length && isTableRow(lines[j]) && !isSeparatorRow(lines[j])) {
        tableRows.push(parseTableRowCells(lines[j]))
        j++
      }

      blocks.push({
        type: 'table',
        content: '',
        headers,
        alignments,
        tableRows,
      })

      i = j - 1
      continue
    }

    // 分隔线 ---
    if (/^(---|---|\*\*\*|___)$/.test(trimmed)) {
      flushParagraph()
      blocks.push({ type: 'hr', content: '' })
      continue
    }

    // 标题 #
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      })
      continue
    }

    // 引用 >
    if (line.startsWith('>')) {
      flushParagraph()
      const quoteText = line.replace(/^>\s*/, '')
      blocks.push({
        type: 'blockquote',
        content: quoteText,
      })
      continue
    }

    // 无序列表 - 或 * 或 •
    if (/^[-*•]\s+/.test(trimmed)) {
      flushParagraph()
      const listItems: string[] = [trimmed.replace(/^[-*•]\s+/, '')]
      while (i + 1 < lines.length && /^[-*•]\s+/.test(lines[i + 1].trim())) {
        i++
        listItems.push(lines[i].trim().replace(/^[-*•]\s+/, ''))
      }
      blocks.push({
        type: 'list',
        content: '',
        items: listItems,
      })
      continue
    }

    // 有序列表 1.
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph()
      const listItems: string[] = [trimmed.replace(/^\d+\.\s+/, '')]
      while (i + 1 < lines.length && /^\d+\.\s+/.test(lines[i + 1].trim())) {
        i++
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
      }
      blocks.push({
        type: 'ordered-list',
        content: '',
        items: listItems,
      })
      continue
    }

    // 常规段落行
    currentParagraph.push(line)
  }

  flushParagraph()

  // 若代码块未闭合，保底压入
  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({
      type: 'code',
      content: codeLines.join('\n'),
      language: codeLanguage,
    })
  }

  return blocks
}

/** 内联 Markdown 格式化（粗体、斜体、行内代码、链接） */
function InlineTokens({ text }: { text: string }) {
  // 正则拆分 **粗体**、`代码`、*斜体*
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*[^\*\s].*?\*)/g)

  return (
    <>
      {tokens.map((token, idx) => {
        if (token.startsWith('**') && token.endsWith('**')) {
          return (
            <strong key={idx} className="font-bold text-foreground tracking-wide">
              {token.slice(2, -2)}
            </strong>
          )
        }
        if (token.startsWith('`') && token.endsWith('`')) {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-muted text-primary font-mono text-[11px] border border-border"
            >
              {token.slice(1, -1)}
            </code>
          )
        }
        if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
          return (
            <em key={idx} className="italic text-amber-600 dark:text-amber-200">
              {token.slice(1, -1)}
            </em>
          )
        }
        return <span key={idx}>{token}</span>
      })}
    </>
  )
}
