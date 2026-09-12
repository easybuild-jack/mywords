#!/usr/bin/env node
/**
 * 校验 word-data-builder 产出的单词 JSON 是否满足 SKILL.md 的硬性约束与自检清单。
 * 零依赖。错误（error）= 废数据必须修；警告（warn）= 需要人工看一眼。
 *
 * 用法：
 *   node validate-words.mjs <data.json...> [--fix] [--quiet]
 *   --fix    按规范重排字段顺序、silentIndices 排序去重后写回文件（不改动内容本身）
 *   --quiet  只输出汇总
 *
 * 退出码：有 error 时为 1。
 */
import fs from 'node:fs'

const args = process.argv.slice(2)
const files = args.filter((a) => !a.startsWith('--'))
const FIX = args.includes('--fix')
const QUIET = args.includes('--quiet')
if (!files.length) {
  console.error('用法: node validate-words.mjs <data.json...> [--fix] [--quiet]')
  process.exit(1)
}

// ---------- 音标（与 RULES.md §2 / §3.1 一致） ----------
const MULTI = ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'oʊ', 'ɪə', 'eə', 'ʊə', 'iː', 'uː', 'ɜː', 'ɔː', 'ɑː']
const SINGLE = ['ɪ', 'ə', 'e', 'æ', 'ʌ', 'ʊ', 'ɒ', 'ɔ', 'ɑ', 'ɜ', 'i', 'u', 'a', 'o']
const isVowelSym = (c) => SINGLE.includes(c) || c === 'ː' || MULTI.some((s) => s.includes(c))

function normalizePhone(phone) {
  if (!phone) return ''
  let s = String(phone).split(/[；;|]/)[0]
  s = s.split(/\s+/).filter((t) => !/^[a-z]+\.$/i.test(t)).join('')
  s = s.replace(/[-()\/]/g, '').replace(/əu/g, 'əʊ').replace(/ou/g, 'oʊ').replace(/au/g, 'aʊ')
  s = s.replace(/ɛ/g, 'e').replace(/ɚ/g, 'ər').replace(/ɝ/g, 'ɜːr').replace(/ɡ/g, 'g')
  return s.replace(/[ˈˌ'’]/g, '')
}

/** 元音音位数：双元音/长元音算 1；ir/yr/our 拼写的 aɪə/aʊə 算 1；ʃn/ʒn 后接音时 +1；成音节 l/n/m +1 */
function vowelCount(phoneNorm, lowerName) {
  const s = phoneNorm
  const tri = /(ir|yr|our)/.test(lowerName)
  let count = 0
  for (let i = 0; i < s.length;) {
    const three = s.slice(i, i + 3)
    if (tri && (three === 'aɪə' || three === 'aʊə')) { count++; i += 3; continue }
    if (MULTI.includes(s.slice(i, i + 2))) { count++; i += 2; continue }
    if (SINGLE.includes(s[i])) { count++; i++; continue }
    i++
  }
  count += (s.match(/[ʃʒ]n(?=.)/g) || []).length
  for (let k = 1; k < s.length; k++) {
    if (!'lnm'.includes(s[k])) continue
    const prev = s[k - 1], next = s[k + 1]
    if (isVowelSym(prev) || 'lr'.includes(prev)) continue
    if (next !== undefined && isVowelSym(next)) continue
    count++
  }
  return count
}

// ---------- 校验 ----------
const FIELD_ORDER = ['name', 'trans', 'usphone', 'ukphone', 'syllables', 'etymology', 'silentIndices', 'examples', 'phrases']
const POS_RE = /^(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|interj|art|aux|det|abbr|phr|modal|prefix|suffix|inf|pl)\.\s*\S/
const isPair = (x) => x && typeof x.en === 'string' && x.en.trim() && typeof x.cn === 'string' && x.cn.trim()

function check(w, idx) {
  const errors = [], warns = []
  const err = (m) => errors.push(m), warn = (m) => warns.push(m)
  const name = typeof w.name === 'string' ? w.name : ''
  if (!name) { err('缺少 name'); return { errors, warns } }
  const lower = name.toLowerCase()

  // trans
  if (!Array.isArray(w.trans) || !w.trans.length) err('trans 必须是非空数组')
  else w.trans.forEach((t, i) => {
    if (typeof t !== 'string' || !POS_RE.test(t)) err(`trans[${i}] 需要“词性. 释义”格式：${JSON.stringify(t)}`)
    else if (/[,;，]/.test(t.replace(/^[a-z]+\.\s*/, '').replace(/（[^）]*）|\([^)]*\)/g, '')) && !t.includes('；')) warn(`trans[${i}] 义项应用全角 ； 分隔`)
  })

  // 音标
  for (const k of ['usphone', 'ukphone']) {
    const p = w[k]
    if (typeof p !== 'string' || !p.trim()) { err(`缺少 ${k}`); continue }
    if (/[\/\[\]]/.test(p)) err(`${k} 不能带 / 或 [] 包裹：${p}`)
    if (/[;；|]|\bor\b/.test(p)) err(`${k} 不能并列多个变体：${p}`)
    if (/əu|ɛ|ɚ|ɝ/.test(p)) warn(`${k} 含老式符号（əu/ɛ/ɚ/ɝ），应规范为 əʊ/e/ər/ɜːr：${p}`)
    if (/[A-Z]/.test(p) || /[a-z]{2,}\./.test(p)) warn(`${k} 疑似混入英文注释：${p}`)
  }

  // syllables（缩写词 TV/Mr、带空格或连字符的词组 ice cream/T-shirt 按字母读或多词连读，只给警告）
  const V = vowelCount(normalizePhone(w.usphone), lower)
  const irregular = !/^[a-z]+$/i.test(name) || !/[aeiouy]/i.test(name) || /\s/.test(String(w.usphone || '').trim())
  if (!Array.isArray(w.syllables) || !w.syllables.length) err('syllables 必须是非空数组')
  else {
    const joined = w.syllables.join('')
    if (joined !== name) (irregular && joined === name.replace(/\s/g, '') ? warn : err)(`syllables 拼接 "${joined}" ≠ name "${name}"`)
    if (w.syllables.some((s) => typeof s !== 'string' || !s)) err('syllables 含空段')
    if (V > 0 && w.syllables.length !== V) {
      ;(irregular ? warn : err)(`音节数 ${w.syllables.length} ≠ 美音元音音位数 ${V}（${w.usphone} → ${w.syllables.join('-')}）`)
    }
    if (V === 0) warn(`usphone 里数不出元音，无法校验音节数：${w.usphone}`)
    if (!/^[A-Z0-9]+$/.test(name)) {
      w.syllables.forEach((s, i) => { if (!/[aeiouy]/i.test(s)) warn(`syllables[${i}] "${s}" 不含元音字母`) })
    }
  }

  // silentIndices
  if (w.silentIndices !== undefined) {
    const si = w.silentIndices
    if (!Array.isArray(si)) err('silentIndices 必须是数组')
    else {
      si.forEach((n) => { if (!Number.isInteger(n) || n < 0 || n >= name.length) err(`silentIndices 下标越界：${n}（长度 ${name.length}）`) })
      const sorted = [...new Set(si)].sort((a, b) => a - b)
      if (JSON.stringify(sorted) !== JSON.stringify(si)) (FIX ? warn : err)(`silentIndices 需升序且不重复：${JSON.stringify(si)}`)
      if (!si.length) warn('silentIndices 为空数组，无哑音时应省略该字段')
      for (const n of si) {
        if (/^[aiou]$/.test(lower[n] || '')) warn(`silentIndices 标了元音字母 ${name[n]}（下标 ${n}），请确认`)
      }
      // igh/eigh/augh/ough 里的 g、h 是元音组合的一部分，不是哑音
      for (const m of lower.matchAll(/(?:ei|ai|au|ou|i)gh/g)) {
        const g = m.index + m[0].length - 2
        if (si.includes(g) || si.includes(g + 1)) err(`"${m[0]}" 是元音字母组合，其中 g/h 不是哑音（下标 ${g}/${g + 1}）`)
      }
    }
  }
  // 双写辅音：第一个字母记为哑音（cc + e/i/y 读 /ks/ 两个音，例外）；
  // 边界不能落在双写辅音之前（ye-llow ✗；yel-low ✓；词根边界在其后的 pass-word、call-ing ✓）
  const bounds = new Set()
  if (Array.isArray(w.syllables)) { let pos = 0; for (const s of w.syllables.slice(0, -1)) { pos += String(s).length; bounds.add(pos) } }
  for (const m of lower.matchAll(/([b-df-hj-np-tv-z])\1/g)) {
    if (m[1] === 'c' && 'eiy'.includes(lower[m.index + 2] || '')) continue
    if (!(w.silentIndices || []).includes(m.index)) err(`双写辅音 "${m[0]}" 的第一个字母（下标 ${m.index}）应记为哑音`)
    if (bounds.has(m.index)) err(`双写辅音 "${m[0]}" 应按 VC-CV 从中间切开，不能整体归后（${w.syllables.join('-')}）`)
  }

  // etymology
  if (w.etymology !== undefined) {
    const e = w.etymology
    if (typeof e !== 'object' || e === null) err('etymology 必须是对象')
    else {
      const form = (x) => (x && typeof x.form === 'string' ? x.form.replace(/-/g, '').toLowerCase() : '')
      if (e.prefix && !lower.startsWith(form(e.prefix))) err(`etymology.prefix "${e.prefix.form}" 不是字面词首`)
      if (e.suffix && !lower.endsWith(form(e.suffix))) err(`etymology.suffix "${e.suffix.form}" 不是字面词尾`)
      if (e.root && form(e.root) && !lower.includes(form(e.root))) warn(`etymology.root "${e.root.form}" 未出现在拼写中（词根变体请确认）`)
      for (const k of ['prefix', 'root', 'suffix']) {
        if (e[k] && (!e[k].form || !e[k].meaning)) err(`etymology.${k} 需同时有 form 与 meaning`)
      }
    }
  }

  // examples / phrases
  if (!Array.isArray(w.examples) || w.examples.length < 2) err(`examples 必须覆盖所有含义且至少 2 条（当前 ${Array.isArray(w.examples) ? w.examples.length : '无'}）`)
  else w.examples.forEach((x, i) => {
    if (!isPair(x)) err(`examples[${i}] 需要 {en, cn}`)
    else {
      if (!new RegExp(`\\b${lower.replace(/[-']/g, '.')}`, 'i').test(x.en)) warn(`examples[${i}] 未出现单词 "${name}"（可能是变形，请确认）`)
      const n = x.en.trim().split(/\s+/).length
      if (n < 4 || n > 12) warn(`examples[${i}] 长度 ${n} 词，建议 5–10 词的简单句`)
      if (/[,;:]\s+(?:which|who|whom|whose|that|while|although|though|whereas|unless)\b/i.test(x.en)) warn(`examples[${i}] 带从句，建议改成一个简单句`)
    }
  })
  if (w.phrases !== undefined) {
    if (!Array.isArray(w.phrases) || !w.phrases.length) err('phrases 存在时必须是非空数组（没有就省略）')
    else {
      w.phrases.forEach((x, i) => { if (!isPair(x)) err(`phrases[${i}] 需要 {en, cn}`) })
      if (w.phrases.length < 4 || w.phrases.length > 10) warn(`phrases 必须至少 4 个、最多 10 个，尽量全面收录常用短语组合（当前 ${w.phrases.length} 条）`)
    }
  }

  // 字段顺序 / 未知字段
  const keys = Object.keys(w)
  const known = keys.filter((k) => FIELD_ORDER.includes(k))
  const expected = FIELD_ORDER.filter((k) => keys.includes(k))
  if (JSON.stringify(known) !== JSON.stringify(expected)) warn(`字段顺序应为 ${expected.join(', ')}（可用 --fix 自动重排）`)
  for (const k of keys) if (!FIELD_ORDER.includes(k)) warn(`未知字段 "${k}"`)

  return { errors, warns }
}

function fixEntry(w) {
  const out = {}
  for (const k of FIELD_ORDER) if (w[k] !== undefined) out[k] = w[k]
  for (const k of Object.keys(w)) if (!(k in out)) out[k] = w[k]
  if (Array.isArray(out.silentIndices)) {
    out.silentIndices = [...new Set(out.silentIndices)].sort((a, b) => a - b)
    if (!out.silentIndices.length) delete out.silentIndices
  }
  return out
}

// ---------- 主流程 ----------
let totalErr = 0, totalWarn = 0
for (const file of files) {
  let data
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (e) { console.error(`${file}: JSON 解析失败 ${e.message}`); totalErr++; continue }
  const list = Array.isArray(data) ? data : [data]
  const seen = new Map()
  let fileErr = 0, fileWarn = 0, badEntries = 0
  list.forEach((w, i) => {
    const { errors, warns } = check(w, i)
    const key = String(w?.name || '').toLowerCase()
    if (key && seen.has(key)) errors.push(`与第 ${seen.get(key) + 1} 条重复`)
    else if (key) seen.set(key, i)
    fileErr += errors.length
    fileWarn += warns.length
    if (errors.length) badEntries++
    if (!QUIET && (errors.length || warns.length)) {
      console.log(`#${i + 1} ${w?.name ?? '(无 name)'}`)
      errors.forEach((m) => console.log(`  ✗ ${m}`))
      warns.forEach((m) => console.log(`  ! ${m}`))
    }
  })
  if (FIX) {
    const fixed = list.map(fixEntry)
    fs.writeFileSync(file, JSON.stringify(Array.isArray(data) ? fixed : fixed[0], null, 2) + '\n')
  }
  console.log(`${file}: ${list.length} 条，${badEntries} 条有错误（共 ${fileErr} 个错误、${fileWarn} 个警告）${FIX ? '，已按规范重排写回' : ''}`)
  totalErr += fileErr
  totalWarn += fileWarn
}
process.exit(totalErr ? 1 : 0)
