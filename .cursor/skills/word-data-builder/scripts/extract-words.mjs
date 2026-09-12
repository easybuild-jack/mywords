#!/usr/bin/env node
/**
 * 从文档里抽出单词列表，供 word-data-builder 逐词补全。
 * 零依赖（只用 Node 内置模块）：xlsx / docx 直接按 zip + xml 解析。
 *
 * 用法：
 *   node extract-words.mjs <文件...> [--out words.json] [--exclude 已有词库.json ...]
 *                                    [--batch 30] [--min-len 2] [--plain]
 *
 * 支持：.xlsx .csv .tsv .txt .md .docx（.pdf 请先另存为 txt/csv）
 * 输出：[{ "name": "abandon", "hint": "əˈbændən | v. 放弃" }, ...]
 *       hint 是同一行/同一段里的其他内容（原 App 的音标、释义），只作参考，不能直接照抄。
 *   --batch N   同时按 N 个一批拆成 <out>.batch-01.json …，方便分批喂给模型
 *   --plain     只输出单词，一行一个
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

// ---------- 参数 ----------
const args = process.argv.slice(2)
const opt = { out: 'words.json', exclude: [], batch: 0, minLen: 2, plain: false }
const inputs = []
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--out') opt.out = args[++i]
  else if (a === '--exclude') opt.exclude.push(args[++i])
  else if (a === '--batch') opt.batch = Number(args[++i]) || 0
  else if (a === '--min-len') opt.minLen = Number(args[++i]) || 1
  else if (a === '--plain') opt.plain = true
  else inputs.push(a)
}
if (!inputs.length) {
  console.error('用法: node extract-words.mjs <文件...> [--out words.json] [--exclude dict.json] [--batch 30]')
  process.exit(1)
}

// ---------- 通用 ----------
const WORD_RE = /^[A-Za-z](?:[A-Za-z'-]*[A-Za-z])?$/
const HEADER_WORDS = new Set(['word', 'words', 'name', 'term', 'vocabulary', 'spelling', 'english', 'headword', 'lemma'])
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const unxml = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  return ENTITIES[e.toLowerCase()] ?? m
})

/** 文本文件解码：优先 utf8，失败退到 gbk（国内 App 导出的 csv 常见） */
function decodeText(buf) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^\uFEFF/, '')
  } catch {
    try { return new TextDecoder('gbk').decode(buf) } catch { return buf.toString('latin1') }
  }
}

// ---------- 最小 zip 读取（xlsx / docx 都是 zip） ----------
function readZip(buf) {
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('不是有效的 zip 文件')
  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  const files = new Map()
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break
    const method = buf.readUInt16LE(p + 10)
    const csize = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const localOff = buf.readUInt32LE(p + 42)
    // Windows 上某些打包工具会用反斜杠写路径，统一成 /
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen).replace(/\\/g, '/')
    const ln = buf.readUInt16LE(localOff + 26)
    const le = buf.readUInt16LE(localOff + 28)
    const start = localOff + 30 + ln + le
    files.set(name, { method, start, csize })
    p += 46 + nameLen + extraLen + commentLen
  }
  return {
    names: () => [...files.keys()],
    text(name) {
      const f = files.get(name)
      if (!f) return null
      const raw = buf.subarray(f.start, f.start + f.csize)
      const data = f.method === 8 ? zlib.inflateRawSync(raw) : raw
      return data.toString('utf8')
    },
  }
}

// ---------- 各格式 → 行（每行是若干单元格） ----------
function rowsFromXlsx(buf) {
  const zip = readZip(buf)
  const shared = []
  const ss = zip.text('xl/sharedStrings.xml')
  if (ss) {
    for (const si of ss.match(/<si\b[\s\S]*?<\/si>/g) || []) {
      shared.push(unxml((si.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) || []).map((t) => t.replace(/<t\b[^>]*>|<\/t>/g, '')).join('')))
    }
  }
  const sheets = zip.names().filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
  const rows = []
  for (const sh of sheets) {
    const xml = zip.text(sh)
    for (const row of xml.match(/<row\b[\s\S]*?<\/row>/g) || []) {
      const cells = []
      for (const c of row.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []) {
        const ref = c.match(/\br="([A-Z]+)\d+"/)?.[1] || ''
        let col = 0
        for (const ch of ref) col = col * 26 + (ch.charCodeAt(0) - 64)
        const type = c.match(/\bt="(\w+)"/)?.[1]
        let val = ''
        if (type === 's') val = shared[Number(c.match(/<v>([\s\S]*?)<\/v>/)?.[1])] ?? ''
        else if (type === 'inlineStr') val = unxml((c.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) || []).map((t) => t.replace(/<t\b[^>]*>|<\/t>/g, '')).join(''))
        else val = unxml(c.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '')
        cells[Math.max(0, col - 1)] = val.trim()
      }
      rows.push(Array.from(cells, (v) => v ?? ''))
    }
  }
  return rows
}

function rowsFromDocx(buf) {
  const zip = readZip(buf)
  const xml = zip.text('word/document.xml') || ''
  const text = (frag) => unxml((frag.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || []).map((t) => t.replace(/<w:t\b[^>]*>|<\/w:t>/g, '')).join(''))
  // 按文档顺序：表格的每一行 → 单元格数组；正文段落 → 单格行
  const rows = []
  for (const block of xml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>|<w:p\b[\s\S]*?<\/w:p>/g) || []) {
    if (block.startsWith('<w:tbl')) {
      for (const tr of block.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || []) {
        rows.push((tr.match(/<w:tc\b[\s\S]*?<\/w:tc>/g) || []).map((tc) => text(tc).trim()))
      }
    } else {
      const t = text(block).trim()
      if (t) rows.push([t])
    }
  }
  return rows
}

function parseCsv(str, delim) {
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (q) {
      if (ch === '"') { if (str[i + 1] === '"') { cell += '"'; i++ } else q = false }
      else cell += ch
    } else if (ch === '"') q = true
    else if (ch === delim) { row.push(cell.trim()); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && str[i + 1] === '\n') i++
      row.push(cell.trim()); cell = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function rowsFromText(buf, ext) {
  const str = decodeText(buf)
  if (ext === '.csv' || ext === '.tsv') {
    const head = str.split(/\r?\n/).slice(0, 20).join('\n')
    const delim = ext === '.tsv' ? '\t' : [',', '\t', ';'].sort((a, b) => head.split(b).length - head.split(a).length)[0]
    return parseCsv(str, delim)
  }
  const lines = str.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const tabbed = lines.filter((l) => l.includes('\t')).length > lines.length / 2
  return lines.map((l) => (tabbed ? l.split('\t').map((c) => c.trim()) : [l]))
}

function loadRows(file) {
  const ext = path.extname(file).toLowerCase()
  const buf = fs.readFileSync(file)
  if (ext === '.xlsx' || ext === '.xlsm') return rowsFromXlsx(buf)
  if (ext === '.docx') return rowsFromDocx(buf)
  if (ext === '.xls') throw new Error(`${file}: 旧版 .xls 不支持，请在 Excel 里另存为 .xlsx 或 .csv`)
  if (ext === '.pdf') throw new Error(`${file}: pdf 不支持，请先复制文本另存为 .txt / .csv`)
  return rowsFromText(buf, ext)
}

// ---------- 行 → 单词 ----------
const cleanToken = (t) => t.replace(/^[\s\d]*[.)、:：]?\s*/, '').replace(/^[-*•·]+\s*/, '').replace(/[.,;:!?，。；：]+$/, '').trim()

/** 表格行：选“像单词”的单元格最多的那一列作为单词列 */
function pickWordColumn(rows) {
  const score = []
  for (const r of rows) r.forEach((c, i) => { if (WORD_RE.test(cleanToken(c || ''))) score[i] = (score[i] || 0) + 1 })
  let best = -1, bestN = 0
  score.forEach((n, i) => { if (n > bestN) { bestN = n; best = i } })
  return best
}

/** 一个单元格 / 一行文本：开头的英文词是单词，其余（音标、释义）是 hint */
function parseCell(raw) {
  const line = cleanToken(raw || '')
  const m = line.match(/^([A-Za-z][A-Za-z'-]*)(?=\s|[,\t\[\/／【(（|]|$)/)
  return { word: m ? m[1] : '', hint: m ? line.slice(m[1].length).replace(/^[\s,|]+/, '').trim() : '' }
}

function extract(rows) {
  const out = []
  let skipped = 0
  const tabular = rows.some((r) => r.length > 1)
  const col = tabular ? pickWordColumn(rows) : 0
  rows.forEach((r, ri) => {
    // 表格里夹着的单格段落（docx 正文）按整行文本处理
    const c = r.length > 1 ? col : 0
    let { word, hint } = parseCell(r[c])
    hint = [hint, ...r.filter((_, i) => i !== c)].filter(Boolean).join(' | ')
    if (ri === 0 && HEADER_WORDS.has(word.toLowerCase())) return
    if (!WORD_RE.test(word) || word.length < opt.minLen) { skipped++; return }
    out.push(hint ? { name: word, hint } : { name: word })
  })
  return { out, skipped }
}

// ---------- 主流程 ----------
const exclude = new Set()
for (const f of opt.exclude) {
  for (const w of JSON.parse(fs.readFileSync(f, 'utf8'))) exclude.add(String(w.name || w).toLowerCase())
}

const seen = new Map()
let rowsTotal = 0, skippedTotal = 0, excluded = 0
for (const file of inputs) {
  const rows = loadRows(file)
  rowsTotal += rows.length
  const { out, skipped } = extract(rows)
  skippedTotal += skipped
  for (const w of out) {
    const key = w.name.toLowerCase()
    if (exclude.has(key)) { excluded++; continue }
    if (!seen.has(key)) seen.set(key, w)
    else if (w.hint && !seen.get(key).hint) seen.get(key).hint = w.hint
  }
  console.error(`${file}: ${rows.length} 行 → ${out.length} 个候选`)
}

const words = [...seen.values()]
if (opt.plain) {
  fs.writeFileSync(opt.out, words.map((w) => w.name).join('\n') + '\n')
} else {
  fs.writeFileSync(opt.out, JSON.stringify(words, null, 2) + '\n')
  if (opt.batch > 0) {
    const base = opt.out.replace(/\.json$/i, '')
    const n = Math.ceil(words.length / opt.batch)
    for (let i = 0; i < n; i++) {
      const name = `${base}.batch-${String(i + 1).padStart(2, '0')}.json`
      fs.writeFileSync(name, JSON.stringify(words.slice(i * opt.batch, (i + 1) * opt.batch), null, 2) + '\n')
    }
    console.error(`分成 ${n} 批 → ${base}.batch-XX.json`)
  }
}
console.error(`共 ${rowsTotal} 行，无法识别 ${skippedTotal} 行，已在词库中跳过 ${excluded} 个，输出 ${words.length} 个单词 → ${opt.out}`)
