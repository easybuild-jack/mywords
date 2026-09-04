/**
 * 按 word-data-builder skill 的音节规则（.cursor/skills/word-data-builder/RULES.md §3）
 * 为官方词库重算 syllables：
 *   - 美音元音音位数为硬约束（ir/yr/our 的 aɪə/aʊə 三合元音算 1 个，成音节辅音 +1）
 *   - 复合词 / 词根+屈折后缀（-ing、发音的 -ed/-es）/ trans-·sub- 前缀先切边界
 *   - 一元一辅从后往前切；辅音簇只把能作词首的尾段归后；x 归前；gh/ng 归前
 *   - 词中哑 e（-ment/-ly/-ness 前、软音 c/g + able）不成核且归前
 *   - -tion/-sion/-cial/-tial 整体保留；S>V 把脱落元音段并入后一段；S<V 拆连续元音核
 *
 * 用法：
 *   node scripts/rebuild-dict-syllables.mjs it-words --dry-run --log out.txt
 *   node scripts/rebuild-dict-syllables.mjs it-words              # 写回
 *   node scripts/rebuild-dict-syllables.mjs                       # 全部词库
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const logIdx = args.indexOf('--log')
const LOG_PATH = logIdx >= 0 ? args[logIdx + 1] : null
const TARGETS = args.filter((a, i) => !a.startsWith('--') && !(logIdx >= 0 && i === logIdx + 1))

const DICT_FILES = {
  'CET4_T': 'CET4_T.json',
  'it-words': 'it-words.json',
  '2025KaoYanHongBaoShu': '2025KaoYanHongBaoShu.json',
  '4000_Essential_English_Words-meaning': '4000_Essential_English_Words-meaning.json',
}

// ---------- 音标 ----------
const MULTI_SYMBOLS = ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'oʊ', 'ɪə', 'eə', 'ʊə', 'iː', 'uː', 'ɜː', 'ɔː', 'ɑː']
const SINGLE_SYMBOLS = ['ɪ', 'ə', 'e', 'æ', 'ʌ', 'ʊ', 'ɒ', 'ɔ', 'ɑ', 'ɜ', 'i', 'u', 'a', 'o']
const isVowelSym = (c) => SINGLE_SYMBOLS.includes(c) || c === 'ː' || MULTI_SYMBOLS.some((s) => s.includes(c))

function normalizePhone(phone) {
  if (!phone) return ''
  let s = String(phone).split(/[；;|]/)[0]
  s = s.split(/\s+/).filter((t) => !/^[a-z]+\.$/i.test(t) && !['for', 'etc'].includes(t.toLowerCase())).join('')
  s = s.replace(/[-()\/]/g, '')
  s = s.replace(/əu/g, 'əʊ').replace(/ou/g, 'oʊ').replace(/au/g, 'aʊ')
  s = s.replace(/ɛ/g, 'e').replace(/ɚ/g, 'ər').replace(/ɝ/g, 'ɜːr').replace(/ɡ/g, 'g')
  return s.replace(/[ˈˌ'’]/g, '')
}

function countPhoneticVowels(phoneNorm, lowerName) {
  const s = phoneNorm
  const tri = /(ir|yr|our)/.test(lowerName)
  let count = 0
  let i = 0
  while (i < s.length) {
    const three = s.slice(i, i + 3)
    if (tri && (three === 'aɪə' || three === 'aʊə')) { count++; i += 3; continue }
    const two = s.slice(i, i + 2)
    if (MULTI_SYMBOLS.includes(two)) { count++; i += 2; continue }
    if (SINGLE_SYMBOLS.includes(s[i])) { count++; i++; continue }
    i++
  }
  // -tion/-sion 后再接后缀时美音常把 /ən/ 缩成 /n/（ˈnæʃnəl、əˈkeɪʒnəli），字母层仍是一个音节
  count += (s.match(/[ʃʒ]n(?=.)/g) || []).length
  return count
}

function countSyllabicConsonant(phoneNorm) {
  const s = phoneNorm.trim()
  for (let k = s.length - 1; k >= 0; k--) {
    if (!'lnm'.includes(s[k])) continue
    const prev = s[k - 1]
    if (!prev || isVowelSym(prev) || 'lr'.includes(prev)) return 0
    if ([...s.slice(k + 1)].some(isVowelSym)) return 0
    return 1
  }
  return 0
}

const vowelCount = (phoneNorm, lower) => countPhoneticVowels(phoneNorm, lower) + countSyllabicConsonant(phoneNorm)

// ---------- 词表 ----------
function loadLexicon() {
  const lex = new Set()
  const phones = new Map()
  for (const file of [...Object.values(DICT_FILES), 'basewords.json']) {
    const p = path.join(ROOT, 'public', 'dicts', file)
    if (!fs.existsSync(p)) continue
    for (const w of JSON.parse(fs.readFileSync(p, 'utf8'))) {
      const n = String(w.name || '').trim().toLowerCase()
      if (!/^[a-z]+$/.test(n)) continue
      lex.add(n)
      const ph = normalizePhone(w.usphone || w.ukphone)
      if (ph && !phones.has(n)) phones.set(n, ph)
    }
  }
  return { lex, phones }
}
let LEXICON = new Set()
let PHONES = new Map()

// ---------- 字母层 ----------
const VOWEL_LETTERS = 'aeiou'
const isVowelLetter = (c) => VOWEL_LETTERS.includes(c)
const hasVowelLetter = (seg) => [...seg].some((c) => 'aeiouy'.includes(c))

/**
 * 字母上下文：phone 为归一化美音；silent 为词中哑 e 的下标集合。
 * isV(i)：该位是否为元音核的一部分（含 ow/aw/ew 中的 w，排除 j 音的 y 和哑 e）。
 */
/** base 是否为词表中的词（允许剥掉一层常见前缀） */
function isKnownBase(base) {
  if (base.length >= 3 && LEXICON.has(base)) return true
  for (const p of STRIP_PREFIXES) {
    if (base.startsWith(p) && base.length - p.length >= 3 && LEXICON.has(base.slice(p.length))) return true
  }
  return false
}

/** 词中哑 e 的下标：辅音 + e + 辅音开头后缀（re-place-ment），软音 c/g 后的 e + able/ous（re-place-a-ble） */
function findInnerSilentE(w) {
  const silent = new Set()
  const m1 = w.match(/^(.*[^aeiou]e)(ment|ly|ness|less|ful|some|wise)$/)
  if (m1 && isKnownBase(m1[1])) silent.add(m1[1].length - 1)
  const m2 = w.match(/^(.*[cg]e)(able|ably|ous|ously)$/)
  if (m2 && isKnownBase(m2[1])) silent.add(m2[1].length - 1)
  return silent
}

function makeCtx(w, phone, silent = findInnerSilentE(w)) {
  const hasW = phone.includes('w')
  const hasJ = phone.includes('j')
  const isV = (i) => {
    const c = w[i]
    if (c === undefined || silent.has(i)) return false
    if (c === 'u' && i > 0 && w[i - 1] === 'q') return false
    if (isVowelLetter(c)) return true
    if (c === 'w') return i > 0 && 'aeo'.includes(w[i - 1]) && w[i + 1] !== 'r' && !hasW
    if (c !== 'y') return false
    if (i === 0) return !(w[1] !== undefined && isVowelLetter(w[1]))
    if (hasJ && i < w.length - 1 && isVowelLetter(w[i - 1]) && isVowelLetter(w[i + 1])) return false
    return true
  }
  return { w, phone, silent, isV }
}

const ONSET2 = new Set(['bl', 'br', 'cl', 'cr', 'dr', 'dw', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'th', 'sh', 'ch', 'ph', 'wh', 'qu', 'ck'])
const ONSET3 = new Set(['scr', 'shr', 'spl', 'spr', 'squ', 'str', 'thr', 'chr', 'phr', 'sch'])

const SUFFIX_LIKE = new Set(['age', 'ice', 'ion', 'ant', 'ent', 'ate', 'ing', 'able', 'ible', 'ish', 'ist', 'ism', 'ity', 'ive', 'ure', 'ise', 'ize', 'ment', 'ness', 'less', 'ful', 'ly', 'er', 'or', 'al', 'ic', 'ed', 'en', 'ry', 'ty', 'cy', 'fy', 'ence', 'ance', 'ous', 'ute', 'ite', 'ine', 'ary', 'ory', 'ery', 'ard', 'ern', 'ten', 'ter', 'tor', 'ile', 'ade', 'ide', 'ode', 'ude', 'ose', 'ase', 'ese', 'let', 'ling', 'ess', 'ette', 'ee', 'eer', 'ward', 'wise', 'ways', 'fold', 'some', 'most', 'like', 'hood', 'ship', 'dom', 'th', 'ing', 'ings', 'ings', 'ers', 'ies', 'ally', 'ical'])
const PREFIX_LIKE = new Set(['un', 'in', 'im', 'il', 'ir', 're', 'de', 'dis', 'mis', 'ex', 'pre', 'pro', 'sub', 'con', 'com', 'col', 'cor', 'per', 'en', 'em', 'be', 'a', 'ad', 'ab', 'ob', 'sup', 'sur', 'non', 'co', 'e', 'i', 'o', 'u', 'an', 'al', 'ar', 'as', 'at', 'ac', 'af', 'ag', 'ap', 'ec', 'ef', 'uni', 'bi', 'tri'])
const SHORT_WHITELIST = new Set(['up', 'in', 'on', 'by', 'to', 'at', 'of', 'as'])
const STRIP_PREFIXES = ['multi', 'super', 'inter', 'under', 'over', 'micro', 'macro', 'auto', 'trans', 'sub', 'pre', 're', 'de', 'en', 'dis', 'mis', 'un', 'non', 'out', 'up', 'in', 'co']

/** 音标骨架：抹掉长音符、把元音归成大类，容忍各词库间 bɔrd/bɔːrd、ɪmpoz/ɪmpoʊz、əz/æz 之类的写法差异 */
function phoneSkeleton(p) {
  return p
    .replace(/ː/g, '')
    .replace(/eɪ/g, '1').replace(/aɪ/g, '2').replace(/ɔɪ/g, '3').replace(/aʊ/g, '4')
    .replace(/oʊ|əʊ|[oɔɒɑ]/g, 'O')
    .replace(/[əʌæeɜ]/g, 'A')
    .replace(/[ɪi]/g, 'I')
    .replace(/[ʊu]/g, 'U')
}

const BOUND_PREFIXES = ['re', 'un', 'dis', 'mis', 'pre', 'non', 'de', 'en', 'em', 'im', 'in', 'anti', 'semi', 'multi', 'inter', 'hyper', 'sub', 'trans', 'co']

/**
 * 复合词切点：两半都成词、都不是词缀形；有音标的一半其读音须与整词读音的开头/结尾吻合
 * （head-ache：hed + eɪk；gene+rate 的 dʒiːn 与 ˈdʒenəreɪt 不吻合 → 不是复合词）。
 * 粘着前缀 + 完整单词（re+format、re+start）不算复合词，交给普通规则。
 */
function findCompoundCut(lower, phone) {
  if (BOUND_PREFIXES.some((p) => lower.startsWith(p) && lower.length - p.length >= 4 && LEXICON.has(lower.slice(p.length)))) return -1
  const sk = phoneSkeleton(phone)
  let best = null
  for (let i = 2; i <= lower.length - 2; i++) {
    const left = lower.slice(0, i)
    const right = lower.slice(i)
    if (!LEXICON.has(left) || !LEXICON.has(right)) continue
    if (PREFIX_LIKE.has(left) || SUFFIX_LIKE.has(right)) continue
    if (left.length < 3 && !SHORT_WHITELIST.has(left)) continue
    if (right.length < 3 && !SHORT_WHITELIST.has(right)) continue
    if (phone) {
      // 有音标且明确不吻合的一半 → 否决（beg+in、gene+rate、less+on）；没音标的一半不算反证
      const lp = PHONES.get(left), rp = PHONES.get(right)
      if (lp && !sk.startsWith(phoneSkeleton(lp))) continue
      if (rp && !sk.endsWith(phoneSkeleton(rp))) continue
    }
    const score = Math.min(left.length, right.length) * 10 + right.length
    if (!best || score > best.score) best = { i, score }
  }
  return best ? best.i : -1
}

/**
 * 词根边界：
 * - 屈折后缀 -ing / 发音的 -ed / 发音的 -es：词根须拼写完整、≥3 字母、成词且不是丢 e 形（lock-ing、want-ed、match-es）
 * - 辅音开头的后缀 -ly/-ness/-less/-ful/-ment：词根成词即切（pre-vi-ous-ly、close-ly），避免 sl 等被当 onset 带走
 */
function findSuffixCut(w) {
  for (const suf of ['ing', 'ed', 'es']) {
    if (!w.endsWith(suf)) continue
    const base = w.slice(0, -suf.length)
    if (base.length < 3 || !hasVowelLetter(base)) continue
    if (suf === 'ed' && !/[td]$/.test(base)) continue
    if (suf === 'es' && !/(s|x|z|ch|sh)$/.test(base)) continue
    if (LEXICON.has(base + 'e')) continue
    if (LEXICON.has(base)) return base.length
    for (const p of STRIP_PREFIXES) {
      if (base.startsWith(p) && base.length - p.length >= 3) {
        const core = base.slice(p.length)
        if (LEXICON.has(core) && !LEXICON.has(core + 'e')) return base.length
      }
    }
  }
  for (const suf of ['ment', 'ness', 'less', 'ful', 'ly']) {
    if (!w.endsWith(suf)) continue
    const base = w.slice(0, -suf.length)
    if (base.length < 3 || !hasVowelLetter(base)) continue
    if (isKnownBase(base)) return base.length
  }
  return -1
}

/** 元音核；ow/ay 里的 w/y 收尾一个核，后面再来的元音字母另起一核（low-er、lay-er、em-ploy-ee） */
function findNuclei(ctx, w) {
  const nuclei = []
  let i = 0
  while (i < w.length) {
    if (!ctx.isV(i)) { i++; continue }
    const start = i
    while (i + 1 < w.length && ctx.isV(i + 1) && !'wy'.includes(w[i])) i++
    nuclei.push({ start, end: i })
    i++
  }
  return nuclei
}

/** 词尾哑 e / 不发音的 -ed、-es：不成核 */
function dropSilentFinal(w, nuclei, dropEdEs) {
  if (nuclei.length < 2) return nuclei
  const last = nuclei[nuclei.length - 1]
  const single = last.start === last.end
  if (single && last.end === w.length - 1 && w.endsWith('e')) return nuclei.slice(0, -1)
  if (!dropEdEs) return nuclei
  if (single && last.end === w.length - 2 && w.endsWith('ed') && !'td'.includes(w[w.length - 3])) return nuclei.slice(0, -1)
  if (single && last.end === w.length - 2 && w.endsWith('es') && !'sxzcgh'.includes(w[w.length - 3])) return nuclei.slice(0, -1)
  return nuclei
}

/** 两核之间的簇：返回归前一个音节的字母数 */
function consonantsBefore(ctx, clusterStart, clusterEnd) {
  const { w, phone, silent } = ctx
  const cluster = w.slice(clusterStart, clusterEnd)
  if (cluster.length === 0) return 0

  let pre = 0
  for (let k = cluster.length - 1; k >= 0; k--) {
    if (silent.has(clusterStart + k)) { pre = k + 1; break }
  }
  let rest = cluster.slice(pre)
  if (rest.length === 1) return rest === 'x' ? pre + 1 : pre
  if (rest.length === 0) return pre

  if (rest[0] === 'r' && ctx.isV(clusterStart + pre - 1)) pre += 1
  else if (rest.startsWith('gh')) pre += 2
  else if (rest.startsWith('ng') && /ŋ|ndʒ/.test(phone)) pre += /ŋg|ndʒ/.test(phone) ? 1 : 2
  rest = cluster.slice(pre)
  if (rest.length === 1) return rest === 'x' ? pre + 1 : pre
  if (rest.length === 0) return pre

  // 词首专属簇 kn/wr/gn 只在首字母不发音时才算 onset（un-known、re-write；weak-ness、sig-nal 不算）
  const dyn = new Set()
  if (!phone.includes('k')) dyn.add('kn')
  if (!phone.includes('w')) dyn.add('wr')
  if (!phone.includes('g')) dyn.add('gn')
  const two = rest.slice(-2)
  let tail = 1
  if (rest.length >= 3 && ONSET3.has(rest.slice(-3))) tail = 3
  else if ((ONSET2.has(two) || dyn.has(two)) && two[0] !== two[1]) tail = 2
  return pre + rest.length - tail
}

/** -tion/-sion/-cial/-tial/-cient：[tcsx] + i 开头的核，后接 n/l，且音标含 ʃ → 该核与后面的 n/l 是一个拼读单位 */
function isProtectedNucleus(word, absStart, absEnd, phone) {
  const prev = word[absStart - 1]
  const next = word[absEnd + 1]
  return absEnd > absStart && !!prev && 'tcsx'.includes(prev) && word[absStart] === 'i' && !!next && 'nl'.includes(next) && /[ʃʒ]/.test(phone)
}

/** 单纯词切分（不含边界识别、不校 V） */
function splitSimple(w, phone, dropEdEs = true, silent = findInnerSilentE(w)) {
  if (w.length <= 1) return [w]
  // 辅音 + le(s|d) 自成音节（-lled 是 ll + ed，不算）
  const m = w.match(/^(.+?[^aeiou])(le[sd]?)$/)
  if (m && w.length >= 4 && !/lle[sd]?$/.test(w)) {
    const cIdx = m[1].length - 1
    const ctx0 = makeCtx(w, phone, silent)
    if (!ctx0.isV(cIdx)) {
      const head = w.slice(0, cIdx)
      if (head && hasVowelLetter(head)) return [...splitSimple(head, phone, dropEdEs, silent), w.slice(cIdx)]
    }
  }
  const ctx = makeCtx(w, phone, silent)
  const nuclei = dropSilentFinal(w, findNuclei(ctx, w), dropEdEs)
  if (nuclei.length < 2) return [w]
  const cuts = []
  for (let n = 0; n < nuclei.length - 1; n++) {
    const cs = nuclei[n].end + 1
    let before = consonantsBefore(ctx, cs, nuclei[n + 1].start)
    if (isProtectedNucleus(w, nuclei[n].start, nuclei[n].end, phone)) before = Math.max(before, 1)
    cuts.push(cs + before)
  }
  const bounds = [0, ...cuts, w.length]
  const segs = []
  for (let b = 0; b < bounds.length - 1; b++) segs.push(w.slice(bounds[b], bounds[b + 1]))
  return segs.filter(Boolean)
}

/**
 * 完整切分：复合词 → 词根+屈折后缀 → trans-/sub- 前缀 → 单纯词。
 * 返回 { segs, hard }，hard 为不可跨越的边界（相对 w 的绝对下标）。
 */
function splitWord(w, phone, dropEdEs, depth = 0) {
  const shift = (r, off) => ({ segs: r.segs, hard: new Set([...r.hard].map((b) => b + off)) })
  if (depth < 3) {
    // 子词没有自己的音标时不再做复合词判定，避免仅凭词表误切
    const myPhone = depth === 0 ? phone : PHONES.get(w)
    const cut = myPhone ? findCompoundCut(w, myPhone) : -1
    if (cut > 0) {
      const L = splitWord(w.slice(0, cut), phone, dropEdEs, depth + 1)
      const R = shift(splitWord(w.slice(cut), phone, dropEdEs, depth + 1), cut)
      return { segs: [...L.segs, ...R.segs], hard: new Set([...L.hard, cut, ...R.hard]) }
    }
    const scut = findSuffixCut(w)
    if (scut > 0) {
      const L = splitWord(w.slice(0, scut), phone, dropEdEs, depth + 1)
      return { segs: [...L.segs, w.slice(scut)], hard: new Set([...L.hard, scut]) }
    }
    const pm = w.match(/^(trans|sub)([^aeiouy].*)$/)
    if (pm && hasVowelLetter(pm[2])) {
      const R = shift(splitWord(pm[2], phone, dropEdEs, depth + 1), pm[1].length)
      return { segs: [pm[1], ...R.segs], hard: new Set([pm[1].length, ...R.hard]) }
    }
  }
  return { segs: splitSimple(w, phone, dropEdEs), hard: new Set() }
}

// ---------- S ≠ V 修正 ----------
const DIGRAPH_V = new Set(['ee', 'oo', 'ea', 'ai', 'ay', 'ou', 'ow', 'oa', 'ei', 'ey', 'oy', 'au', 'aw', 'ie', 'ue', 'ui', 'eu', 'ew'])
const TWO_SOUND = ['io', 'ia', 'iu', 'ua', 'eo', 'uo', 'ao', 'eu', 'ie', 'ea', 'oi', 'ue', 'oe', 'ei', 'ii', 'aa', 'ee', 'oo', 'ai', 'au', 'ou', 'ow', 'ay', 'ey', 'oy', 'oa', 'ui', 'uy']

function splitNucleusText(text) {
  if (text.length >= 3 && DIGRAPH_V.has(text.slice(0, 2))) return [text.slice(0, 2), text.slice(2)]
  return [text[0], text.slice(1)]
}

function expandToV(word, segs, V, phone) {
  const work = [...segs]
  while (work.length < V) {
    let best = null
    let bestRank = Infinity
    let offset = 0
    work.forEach((seg, si) => {
      const ctx = makeCtx(word, phone)
      for (let j = 0; j < seg.length - 1; j++) {
        const a = offset + j
        if (ctx.isV(a) && ctx.isV(a + 1) && isVowelLetter(word[a]) && isVowelLetter(word[a + 1])) {
          let k = j
          while (k + 1 < seg.length && ctx.isV(offset + k + 1) && isVowelLetter(word[offset + k + 1])) k++
          const text = seg.slice(j, k + 1)
          if (!isProtectedNucleus(word, offset + j, offset + k, phone)) {
            const [head] = splitNucleusText(text)
            const pair = text.slice(head.length - 1, head.length + 1)
            const rank = TWO_SOUND.indexOf(pair) === -1 ? 99 : TWO_SOUND.indexOf(pair)
            if (rank < bestRank) { bestRank = rank; best = [si, j + head.length] }
          }
          j = k
        }
      }
      offset += seg.length
    })
    if (!best) return null
    const [si, pos] = best
    work.splice(si, 1, work[si].slice(0, pos), work[si].slice(pos))
  }
  return work
}

/** S > V：优先把脱落元音所在段并入后一段，不跨硬边界 */
function mergeTo(word, segs, V, hard) {
  const work = [...segs]
  while (work.length > V) {
    let bestIdx = -1
    let bestScore = -Infinity
    let pos = 0
    for (let i = 0; i < work.length - 1; i++) {
      pos += work[i].length
      const left = work[i], right = work[i + 1]
      let score = hard.has(pos) ? -1000 : 0
      const lv = left.match(/^[^aeiouy]*[aeiouy]$/)
      if (lv && 'rnlm'.includes(right[0])) score += 100
      if (/[aeiou][nlrm]$/.test(left) && !isVowelLetter(right[0])) score += 60
      score -= (left + right).length
      if (score > bestScore) { bestScore = score; bestIdx = i }
    }
    if (bestIdx === -1) break
    work.splice(bestIdx, 2, work[bestIdx] + work[bestIdx + 1])
  }
  return work
}

// ---------- 特例（RULES.md §3.8） ----------
const OVERRIDES = {
  vegetable: ['vege', 'ta', 'ble'],
  chocolate: ['choco', 'late'],
  expensive: ['ex', 'pen', 'sive'],
  twenty: ['twen', 'ty'],
  grandparent: ['grand', 'pa', 'rent'],
  grandfather: ['grand', 'fa', 'ther'],
  grandmother: ['grand', 'mo', 'ther'],
  grandpa: ['grand', 'pa'],
  grandma: ['grand', 'ma'],
  iron: ['i', 'ron'],
  'etc.': ['etc.'],
}

function restoreCase(name, segsLower) {
  const out = []
  let pos = 0
  for (const s of segsLower) { out.push(name.slice(pos, pos + s.length)); pos += s.length }
  return out
}

function processWord(w) {
  const name = w.name.trim()
  const lower = name.toLowerCase()
  if (/\s|-/.test(name) || (name === name.toUpperCase() && name.length > 1) || !/^[a-z.]+$/i.test(name)) {
    return { syllables: w.syllables, status: 'skip' }
  }
  if (OVERRIDES[lower]) return { syllables: restoreCase(name, OVERRIDES[lower]), status: 'override' }

  const phone = normalizePhone(w.usphone || w.ukphone)
  const V = vowelCount(phone, lower)

  let { segs, hard } = splitWord(lower, phone, true)
  const S = segs.length
  let status = 'rule'
  if (S > V) { segs = mergeTo(lower, segs, V, hard); status = 'merged' }
  else if (S < V) {
    const ex = expandToV(lower, segs, V, phone)
    if (ex) { segs = ex; status = 'expanded' }
    else {
      // -ed/-es 被当成哑音但实际发音（hun-dred、her-cu-les）：不去哑音重切
      const alt = splitWord(lower, phone, false)
      if (alt.segs.length === V) { segs = alt.segs; status = 'rule' } else status = 'tooFew'
    }
  }
  return { syllables: restoreCase(name, segs), status, V, S }
}

// ---------- 主流程 ----------
;({ lex: LEXICON, phones: PHONES } = loadLexicon())
const targets = TARGETS.length ? TARGETS : Object.keys(DICT_FILES)
const logLines = []

for (const key of targets) {
  const file = DICT_FILES[key]
  if (!file) { console.error(`未知词库: ${key}`); continue }
  const jsonPath = path.join(ROOT, 'public', 'dicts', file)
  const raw = fs.readFileSync(jsonPath, 'utf8')
  const dict = JSON.parse(raw)
  const indentMatch = raw.match(/\n(\s+)\{/m)
  const indent = indentMatch ? indentMatch[1].length : 2

  const stats = { rule: 0, merged: 0, expanded: 0, override: 0, skip: 0, tooFew: 0, changed: 0, silentAdded: 0, bad: 0 }
  const out = dict.map((w) => {
    const r = processWord(w)
    stats[r.status] = (stats[r.status] || 0) + 1
    const next = { ...w }
    const from = (w.syllables || []).join('-')
    const to = r.syllables.join('-')
    if (r.status !== 'skip' && r.syllables.join('') !== w.name.trim()) {
      stats.bad++
      logLines.push(`BAD ${w.name} [${from}] -> [${to}]`)
      return w
    }
    if (from !== to) {
      stats.changed++
      next.syllables = r.syllables
      logLines.push(`${r.status.padEnd(8)} ${w.name.padEnd(20)} ${from.padEnd(28)} -> ${to}${r.status === 'tooFew' ? ` (S=${r.S} V=${r.V})` : ''}`)
    }
    // 哑音补记（只增不删）：词尾哑 e、词中哑 e、不发音的 -ed/-es 的 e、双写辅音第一个字母
    const lower = w.name.toLowerCase()
    if (r.status !== 'skip' && next.syllables?.join('') === w.name.trim()) {
      const sil = new Set(next.silentIndices || [])
      const before = sil.size
      const segs = next.syllables
      const last = segs[segs.length - 1].toLowerCase()
      const phone = normalizePhone(w.usphone || w.ukphone)
      const ctx = makeCtx(lower, phone)
      const lastNuclei = findNuclei(makeCtx(last, phone), last)
      if (lower.endsWith('e') && lower.length >= 3 && !isVowelLetter(lower[lower.length - 2])) {
        if (lastNuclei.length >= 2 || /[^aeiou]le$/.test(last)) sil.add(lower.length - 1)
      }
      if (/[^aeioutd]ed$/.test(lower) && lastNuclei.length >= 2) sil.add(lower.length - 2)
      if (/[^aeiousxzcgh]es$/.test(lower) && lastNuclei.length >= 2) sil.add(lower.length - 2)
      for (const i of ctx.silent) sil.add(i)
      let pos = 0
      for (let i = 0; i < segs.length - 1; i++) {
        pos += segs[i].length
        const a = lower[pos - 1], b = lower[pos]
        // cc + e/i/y 是 /ks/ 两个音（suc-cess），不算哑音
        if (a === b && !isVowelLetter(a) && !(a === 'c' && 'eiy'.includes(lower[pos + 1] || ''))) sil.add(pos - 1)
      }
      if (sil.size !== before) {
        stats.silentAdded++
        next.silentIndices = [...sil].sort((x, y) => x - y)
      }
    }
    return next
  })

  console.log(`\n===== ${key}（${dict.length} 词）=====`)
  console.log(JSON.stringify(stats))
  if (!DRY_RUN && stats.bad === 0) {
    fs.writeFileSync(jsonPath, `${JSON.stringify(out, null, indent)}\n`)
    console.log(`已写入 ${file}`)
  } else {
    console.log(DRY_RUN ? '（--dry-run 未写入）' : '（存在拼接失败，未写入）')
  }
}

if (LOG_PATH) {
  fs.writeFileSync(LOG_PATH, logLines.join('\n') + '\n', 'utf8')
  console.log(`变更清单 ${logLines.length} 行 -> ${LOG_PATH}`)
} else {
  for (const l of logLines) console.log(l)
}
