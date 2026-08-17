/**
 * 按「音节切分规则规范」（design/SYLLABLE_RULES.md）为 basewords 之外的官方词库
 * 生成 syllables 字段（音标驱动 + 一元一辅从后往前 + 组合整体保留 + 复合词尾 + 特例表）。
 *
 * 用法：
 *   node scripts/rebuild-dict-syllables.mjs            # 全部 4 个词库，写入
 *   node scripts/rebuild-dict-syllables.mjs --dry-run  # 只输出不写
 *   node scripts/rebuild-dict-syllables.mjs CET4_T     # 指定词库（不带 .json）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isVowelAt, isUsableSyllableSplit } from '../src/lib/syllables.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DRY_RUN = process.argv.includes('--dry-run')
const TARGETS = process.argv.slice(2).filter((a) => a !== '--dry-run')

const DICT_FILES = {
  'CET4_T': 'CET4_T.json',
  'it-words': 'it-words.json',
  '2025KaoYanHongBaoShu': '2025KaoYanHongBaoShu.json',
  '4000_Essential_English_Words-meaning': '4000_Essential_English_Words-meaning.json',
}

const MULTI_SYMBOLS = ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'oʊ', 'ɪə', 'eə', 'ʊə', 'iː', 'uː', 'ɜː', 'ɔː', 'ɑː']
const SINGLE_SYMBOLS = ['ɪ', 'ə', 'e', 'æ', 'ʌ', 'ʊ', 'ɒ', 'ɔ', 'ɑ', 'ɜ', 'i', 'u', 'a', 'o']
const isVowelChar = (c) => SINGLE_SYMBOLS.includes(c) || c === 'ː' || MULTI_SYMBOLS.some((s) => s.includes(c))

/**
 * 音标归一化：这些词库的音标含多种非标准写法——
 * - `；`/`|` 分隔多个发音变体（ˈekspɔːt；ɪkˈ-）→ 只取第一个
 * - 老式双元音写法 əu / au / ou → 标准符号 əʊ / aʊ / oʊ
 * - 非标准字符 ɛ、ɚ、ɝ → 标准 e、ər、ɜːr
 * - 省略号 `-`、括号 `()` 丢弃
 */
function normalizePhone(phone) {
  if (!phone) return ''
  let s = String(phone)
  // 只取第一个发音变体（ˈekspɔːt；ɪkˈ- → ˈekspɔːt）
  s = s.split(/[；;|]/)[0]
  // 去掉混入的英文注释（for v. / for n. / v. / n. 等）：这些词库音标带词性说明
  s = s
    .split(/\s+/)
    .filter((t) => !/^[a-z]+\.$/i.test(t) && t.toLowerCase() !== 'for' && t.toLowerCase() !== 'etc')
    .join('')
  s = s.replace(/[-()]/g, '')
  s = s.replace(/əu/g, 'əʊ')
  s = s.replace(/ou/g, 'oʊ') // 老式写法：ˈnoutɪfaɪ → ˈnoʊtɪfaɪ
  s = s.replace(/au/g, 'aʊ')
  s = s.replace(/ɛ/g, 'e')
  s = s.replace(/ɚ/g, 'ər')
  s = s.replace(/ɝ/g, 'ɜːr')
  return s
}

/** 复合词尾白名单（与 rebuild-basewords-syllables.mjs 一致） */
const COMPOUND_TAILS = [
  'day', 'work', 'book', 'man', 'ball', 'room', 'shop', 'store', 'town', 'side',
  'thing', 'self', 'noon', 'night', 'walk', 'port', 'cake', 'mate', 'board',
  'ground', 'time', 'where', 'way', 'stand',
]
const COMPOUND_TAIL_EXCLUDES = new Set(['mushroom'])

/** 双字母一音 + 可作词首的辅音簇 */
const DIGRAPHS = new Set(['th', 'sh', 'ch', 'ph', 'wh', 'ck', 'ng', 'gh', 'qu'])
const ONSET_CLUSTERS = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'dw', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr',
  'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw',
  'scr', 'shr', 'spl', 'spr', 'squ', 'str', 'thr',
])

/** 特例表：字母层无解的词（hour、expensive 等），与 basewords 共享 + 各词库补充 */
const OVERRIDES = {
  diet: ['di', 'et'],
  'january': ['jan', 'u', 'a', 'ry'],
  'february': ['fe', 'bru', 'a', 'ry'],
  'twentieth': ['twen', 'ti', 'eth'],
  'usually': ['u', 'su', 'al', 'ly'],
  'ago': ['a', 'go'],
  'hour': ['ho', 'ur'],
  'metre': ['me', 'tre'],
  'kilometre': ['ki', 'lo', 'me', 'tre'],
  'radio': ['ra', 'di', 'o'],
  'piano': ['pi', 'a', 'no'],
  'video': ['vi', 'de', 'o'],
  'poem': ['po', 'em'],
  'poet': ['po', 'et'],
  'player': ['play', 'er'],
  'scientist': ['sci', 'en', 'tist'],
  'geography': ['ge', 'o', 'gra', 'phy'],
  'crayon': ['cray', 'on'],
  'diary': ['di', 'a', 'ry'],
  'fire': ['fi', 're'],
  'lion': ['li', 'on'],
  'koala': ['ko', 'a', 'la'],
  'museum': ['mu', 'se', 'um'],
  'theatre': ['thea', 'tre'],
  'australia': ['au', 'stra', 'li', 'a'],
  'science': ['sci', 'ence'],
  'our': ['o', 'ur'],
  'any': ['an', 'y'],
  'quiet': ['qui', 'et'],
  'really': ['re', 'al', 'ly'],
  'maybe': ['may', 'be'],
  'reuse': ['re', 'use'],
  'sour': ['so', 'ur'],
  'vegetable': ['vege', 'ta', 'ble'],
  'chocolate': ['choco', 'late'],
  'several': ['seve', 'ral'],
  'expensive': ['ex', 'pen', 'sive'],
  'weekend': ['week', 'end'],
  'grandparent': ['grand', 'pa', 'rent'],
  'grandfather': ['grand', 'fa', 'ther'],
  'grandmother': ['grand', 'mo', 'ther'],
  'grandpa': ['grand', 'pa'],
  'grandma': ['grand', 'ma'],
  // 词库补充特例（字母层无解的模式）
  'warm': ['warm'],
  'iron': ['i', 'ron'],
  'idea': ['i', 'de', 'a'],
  'area': ['a', 're', 'a'],
  'real': ['re', 'al'],
  'create': ['cre', 'ate'],
  'quietly': ['qui', 'et', 'ly'],
  'society': ['so', 'ci', 'e', 'ty'],
  'variety': ['va', 'ri', 'e', 'ty'],
  'audience': ['au', 'di', 'ence'],
  'previous': ['pre', 'vi', 'ous'],
  'various': ['va', 'ri', 'ous'],
  'serious': ['se', 'ri', 'ous'],
  'obvious': ['ob', 'vi', 'ous'],
  'curious': ['cu', 'ri', 'ous'],
  'furious': ['fu', 'ri', 'ous'],
  'mysterious': ['mys', 'te', 'ri', 'ous'],
  'delicious': ['de', 'li', 'cious'],
  'precious': ['pre', 'cious'],
  'special': ['spe', 'cial'],
  'social': ['so', 'cial'],
  'official': ['of', 'fi', 'cial'],
  'artificial': ['ar', 'ti', 'fi', 'cial'],
  'beneficial': ['be', 'ne', 'fi', 'cial'],
  'crucial': ['cru', 'cial'],
  'ancient': ['an', 'cient'],
  'patient': ['pa', 'tient'],
  'nation': ['na', 'tion'],
  'station': ['sta', 'tion'],
  'question': ['ques', 'tion'],
  'suggestion': ['sug', 'ges', 'tion'],
  'direction': ['di', 'rec', 'tion'],
  'action': ['ac', 'tion'],
  'education': ['e', 'du', 'ca', 'tion'],
  'population': ['po', 'pu', 'la', 'tion'],
  'communication': ['com', 'mu', 'ni', 'ca', 'tion'],
  'information': ['in', 'for', 'ma', 'tion'],
  'international': ['in', 'ter', 'na', 'tion', 'al'],
  'situation': ['si', 'tu', 'a', 'tion'],
  'attention': ['at', 'ten', 'tion'],
  'decision': ['de', 'ci', 'sion'],
  'television': ['te', 'le', 'vi', 'sion'],
  'revision': ['re', 'vi', 'sion'],
  'vision': ['vi', 'sion'],
  'occasion': ['oc', 'ca', 'sion'],
  'picture': ['pic', 'ture'],
  'culture': ['cul', 'ture'],
  'nature': ['na', 'ture'],
  'future': ['fu', 'ture'],
  'mixture': ['mix', 'ture'],
  'temperature': ['tem', 'pe', 'ra', 'ture'],
  'architecture': ['ar', 'chi', 'tec', 'ture'],
  'feature': ['fea', 'ture'],
  'creature': ['crea', 'ture'],
  'furniture': ['fur', 'ni', 'ture'],
  'adventure': ['ad', 'ven', 'ture'],
  'capture': ['cap', 'ture'],
  'lecture': ['lec', 'ture'],
  'structure': ['struc', 'ture'],
  'gesture': ['ges', 'ture'],
  'pressure': ['pres', 'sure'],
  'pleasure': ['plea', 'sure'],
  'treasure': ['trea', 'sure'],
  'measure': ['mea', 'sure'],
  'leisure': ['lei', 'sure'],
  'seizure': ['sei', 'zure'],
  'please': ['please'],
  'ear': ['ear'],
  'hear': ['hear'],
  'clear': ['clear'],
  'near': ['near'],
  'year': ['year'],
  'tear': ['tear'],
  'appear': ['ap', 'pear'],
  'disappear': ['dis', 'ap', 'pear'],
  'theatre': ['thea', 'tre'],
  'theater': ['thea', 'ter'],
  'center': ['cen', 'ter'],
  'meter': ['me', 'ter'],
  'computer': ['com', 'pu', 'ter'],
  'customer': ['cus', 'to', 'mer'],
  'manager': ['ma', 'na', 'ger'],
  'teacher': ['tea', 'cher'],
  'father': ['fa', 'ther'],
  'mother': ['mo', 'ther'],
  'brother': ['bro', 'ther'],
  'together': ['to', 'ge', 'ther'],
  'whether': ['whe', 'ther'],
  'weather': ['wea', 'ther'],
  'rather': ['ra', 'ther'],
  'either': ['ei', 'ther'],
  'neither': ['nei', 'ther'],
  'other': ['o', 'ther'],
  'another': ['a', 'no', 'ther'],
  'water': ['wa', 'ter'],
  'daughter': ['daugh', 'ter'],
  'laughter': ['laugh', 'ter'],
  'slaughter': ['slaugh', 'ter'],
  'after': ['af', 'ter'],
  'later': ['la', 'ter'],
  'letter': ['let', 'ter'],
  'better': ['bet', 'ter'],
  'matter': ['mat', 'ter'],
  'bitter': ['bit', 'ter'],
  'butter': ['but', 'ter'],
  'utter': ['ut', 'ter'],
  'enter': ['en', 'ter'],
  'chapter': ['chap', 'ter'],
  'sister': ['sis', 'ter'],
  'master': ['mas', 'ter'],
  'disaster': ['dis', 'as', 'ter'],
  'monster': ['mon', 'ster'],
  'register': ['re', 'gis', 'ter'],
  'character': ['cha', 'rac', 'ter'],
  // -ual / -u-al：音标 ˈʊəl 中 ʊ 与 ə 是两个音位（-u-al 拆开，同 February 的 fe-bru-a-ry）
  'actual': ['ac', 'tu', 'al'],
  'annual': ['an', 'nu', 'al'],
  'gradual': ['gra', 'du', 'al'],
  'mutual': ['mu', 'tu', 'al'],
  'casual': ['ca', 'su', 'al'],
  'visual': ['vi', 'su', 'al'],
  'manual': ['ma', 'nu', 'al'],
  'usual': ['u', 'su', 'al'],
  'unusual': ['un', 'u', 'su', 'al'],
  'individual': ['in', 'di', 'vi', 'du', 'al'],
  'intellectual': ['in', 'te', 'llec', 'tu', 'al'],
  'habitual': ['ha', 'bi', 'tu', 'al'],
  'eventual': ['e', 'ven', 'tu', 'al'],
  'spiritual': ['spi', 'ri', 'tu', 'al'],
  'virtual': ['vir', 'tu', 'al'],
  'ritual': ['ri', 'tu', 'al'],
  // -ism / -rithm / -able：'sm'/'thm'/'ble' 无足够元音字母，字母层极限段数
  'sexism': ['se', 'xism'],
  'pluralism': ['plu', 'ra', 'lism'],
  'criticism': ['cri', 'ti', 'cism'],
  'mechanism': ['me', 'cha', 'nism'],
  'organism': ['or', 'ga', 'nism'],
  'communism': ['co', 'mmu', 'nism'],
  'optimism': ['op', 'ti', 'mism'],
  'skepticism': ['skep', 'ti', 'cism'],
  'capitalism': ['ca', 'pi', 'ta', 'lism'],
  'metabolism': ['me', 'ta', 'bo', 'lism'],
  'materialism': ['ma', 'te', 'ria', 'lism'],
  'intellectualism': ['in', 'te', 'llec', 'tua', 'lism'],
  'unionism': ['u', 'nio', 'nism'],
  'enthusiasm': ['en', 'thu', 'si', 'asm'],
  'schism': ['schism'],
  'rhythm': ['rhythm'],
  'algorithm': ['al', 'go', 'rithm'],
  'logarithm': ['lo', 'ga', 'rithm'],
  'desirable': ['de', 'si', 'ra', 'ble'],
  'undesirable': ['un', 'de', 'si', 'ra', 'ble'],
  'etc.': ['etc.'],
}

/** 统计一段音标里的元音音位数（先归一化非标准写法） */
function countPhoneticVowels(phone) {
  const clean = normalizePhone(phone).replace(/[ˈˌ'’]/g, '')
  let count = 0
  let i = 0
  while (i < clean.length) {
    const two = clean.slice(i, i + 2)
    if (MULTI_SYMBOLS.includes(two)) { count++; i += 2; continue }
    if (SINGLE_SYMBOLS.includes(clean[i])) { count++; i++; continue }
    i++
  }
  return count
}

/** 成音节辅音（-l -n -m 前是辅音且之后无元音） */
function countSyllabicConsonant(phone) {
  const clean = normalizePhone(phone).replace(/[ˈˌ'’]/g, '').trim()
  for (let k = clean.length - 1; k >= 0; k--) {
    if (!['l', 'n', 'm'].includes(clean[k])) continue
    const prev = clean[k - 1]
    if (!prev || isVowelChar(prev) || ['l', 'r'].includes(prev)) return 0
    const tail = clean.slice(k + 1)
    if ([...tail].some(isVowelChar)) return 0
    return 1
  }
  return 0
}

/** 字母层规则切分（一元一辅从后往前 + 组合整体保留） */
function splitByUserRule(word, { dropEd = true } = {}) {
  const cleanWord = word.trim().toLowerCase()
  if (!cleanWord) return []

  if (!COMPOUND_TAIL_EXCLUDES.has(cleanWord)) {
    for (const tail of COMPOUND_TAILS) {
      if (cleanWord.length > tail.length + 1 && cleanWord.endsWith(tail)) {
        const head = cleanWord.slice(0, cleanWord.length - tail.length)
        return [...splitByUserRule(head, { dropEd }), tail]
      }
    }
  }

  if (cleanWord.endsWith('le') && cleanWord.length >= 4 && !isVowelAt(cleanWord, cleanWord.length - 3)) {
    const head = cleanWord.slice(0, cleanWord.length - 3)
    return [...splitByUserRule(head, { dropEd }), cleanWord.slice(cleanWord.length - 3)]
  }

  const nuclei = []
  let i = 0
  while (i < cleanWord.length) {
    if (!isVowelAt(cleanWord, i)) { i++; continue }
    const start = i
    while (i + 1 < cleanWord.length && isVowelAt(cleanWord, i + 1)) i++
    nuclei.push({ start, end: i })
    i++
  }
  if (nuclei.length < 2) return [cleanWord]

  const last = nuclei[nuclei.length - 1]
  if (last.start === last.end && last.end === cleanWord.length - 1 && cleanWord.endsWith('e')) {
    nuclei.pop()
  } else if (dropEd && last.start === last.end && last.end === cleanWord.length - 2 && cleanWord.endsWith('ed')) {
    const before = cleanWord[cleanWord.length - 3]
    if (before && !'td'.includes(before)) nuclei.pop()
  }
  if (nuclei.length < 2) return [cleanWord]

  const cuts = []
  for (let n = 0; n < nuclei.length - 1; n++) {
    const clusterStart = nuclei[n].end + 1
    const clusterSize = nuclei[n + 1].start - clusterStart

    if (clusterSize === 1) {
      cuts.push(clusterStart)
      continue
    }

    if (cleanWord[clusterStart] === 'r' && isVowelAt(cleanWord, clusterStart - 1)) {
      const afterR = cleanWord[clusterStart + 1]
      if (afterR === undefined || !isVowelAt(cleanWord, clusterStart + 1)) {
        cuts.push(clusterStart + 1)
        continue
      }
    }

    if (cleanWord.slice(clusterStart, clusterStart + 2) === 'gh' && isVowelAt(cleanWord, clusterStart - 1)) {
      cuts.push(clusterStart + 2)
      continue
    }

    const firstPair = cleanWord.slice(clusterStart, clusterStart + 2)
    if (firstPair[0] === firstPair[1] || DIGRAPHS.has(firstPair)) {
      cuts.push(clusterStart)
      continue
    }

    const upToThree = cleanWord.slice(clusterStart, clusterStart + 3)
    if (ONSET_CLUSTERS.has(upToThree) || ONSET_CLUSTERS.has(firstPair)) {
      cuts.push(clusterStart)
      continue
    }

    cuts.push(clusterStart + 1)
  }

  const bounds = [0, ...cuts, cleanWord.length]
  const syllables = []
  for (let b = 0; b < bounds.length - 1; b++) {
    syllables.push(cleanWord.slice(bounds[b], bounds[b + 1]))
  }
  if (syllables.join('') !== cleanWord) return [cleanWord]
  return syllables.filter(Boolean)
}

/** 相邻合并到目标段数 */
function mergeTo(word, parts, target) {
  while (parts.length > target) {
    let best = -1
    let bestLen = Infinity
    for (let i = 0; i < parts.length - 1; i++) {
      const merged = parts[i] + parts[i + 1]
      if (![...merged].some((c) => 'aeiouy'.includes(c))) continue
      const len = merged.length
      if (len < bestLen) { bestLen = len; best = i }
    }
    if (best === -1) break
    parts.splice(best, 2, parts[best] + parts[best + 1])
  }
  if (parts.join('') !== word.trim().toLowerCase()) return [word.trim().toLowerCase()]
  return parts
}

function resolveVowelCount(w, letterCount) {
  const ukV = countPhoneticVowels(w.ukphone) + countSyllabicConsonant(w.ukphone)
  const usV = countPhoneticVowels(w.usphone) + countSyllabicConsonant(w.usphone)
  if (ukV === usV) return ukV
  return Math.abs(ukV - letterCount) <= Math.abs(usV - letterCount) ? ukV : usV
}

/**
 * S < V 时的拆段补足：字母层规则切出的段数少于音标元音数，说明
 * 存在"一个字母组合发两个元音音位"（sure → su-re、media → me-di-a、fuel → fu-el）。
 * 从后往前依次尝试：
 * 1. 词尾 re 拆：sure → su | re（fire → fi-re、exposure → ex-po-su-re）
 * 2. 连续元音核拆：ia/ie/ua/io/ou → i|a / i|e / u|a / i|o / o|u（media → me-di-a、diet → di-et）
 * 直到段数 == V；拆不出则返回 null（保持原样，由调用方标记未覆盖）。
 */
function expandToV(word, parts, V) {
  const lower = word.trim().toLowerCase()
  const work = [...parts]

  while (work.length < V) {
    let changed = false

    // 1. 词尾 re 拆（sure → su-re），从后往前
    for (let i = work.length - 1; i >= 0; i--) {
      const seg = work[i]
      if (seg.length >= 3 && seg.endsWith('re') && isVowelAt(seg, seg.length - 3)) {
        work.splice(i, 1, seg.slice(0, -2), 're')
        changed = true
        break
      }
    }
    if (changed) continue

    // 2. 连续元音核拆（ia → i-a），从前往后
    for (let i = 0; i < work.length; i++) {
      const seg = work[i]
      let splitAt = -1
      for (let j = 0; j < seg.length - 1; j++) {
        if (isVowelAt(seg, j) && isVowelAt(seg, j + 1)) {
          splitAt = j + 1
          break
        }
      }
      if (splitAt > 0) {
        work.splice(i, 1, seg.slice(0, splitAt), seg.slice(splitAt))
        changed = true
        break
      }
    }
    if (changed) continue

    // 3. 段内含 ≥2 个不连续元音核（ena → e-na、una → u-na）：在第一个核后拆
    for (let i = 0; i < work.length; i++) {
      const seg = work[i]
      const nuclei = []
      for (let j = 0; j < seg.length; j++) {
        if (isVowelAt(seg, j) && (j === 0 || !isVowelAt(seg, j - 1))) nuclei.push(j)
      }
      if (nuclei.length >= 2) {
        const cut = nuclei[0] + 1
        work.splice(i, 1, seg.slice(0, cut), seg.slice(cut))
        changed = true
        break
      }
    }
    if (changed) continue

    break
  }

  if (work.length !== V) return null
  if (work.join('') !== lower) return null
  if (!work.every((seg) => [...seg].some((c) => 'aeiouy'.includes(c)))) return null
  return work
}

/** 处理单个词，返回 [新 syllables 或 null(未覆盖), 状态, 说明] */
function processWord(w) {
  const name = w.name.trim()
  const lower = name.toLowerCase()

  if (/\s|-/.test(name) || (name === name.toUpperCase() && name.length > 1)) {
    return [w.syllables || null, 'compound', '复合词/缩写']
  }

  const override = OVERRIDES[lower]
  if (override) {
    if (override.join('') !== lower) throw new Error(`OVERRIDE 拼接不回原词: ${name}`)
    if (!isUsableSyllableSplit(lower, override)) throw new Error(`OVERRIDE 未过校验: ${name} ${override.join('-')}`)
    return [override, 'override', '特例表']
  }

  const letterCount = splitByUserRule(name).length
  const V = resolveVowelCount(w, letterCount)

  const candA = splitByUserRule(name)
  const candB = splitByUserRule(name, { dropEd: false })
  let best = Math.abs(candA.length - V) <= Math.abs(candB.length - V) ? candA : candB

  if (best.length === V) {
    return [best, 'rule', '规则']
  }
  if (best.length > V) {
    return [mergeTo(name, [...best], V), 'merged', '合并']
  }
  // S < V：尝试拆段补足到音标元音数
  const expanded = expandToV(name, [...best], V)
  if (expanded) {
    return [expanded, 'expanded', `拆段（V=${V}）`]
  }
  return [null, 'tooFew', `S<V（V=${V} 规则=${best.join('-')}）`]
}

// ============ 主流程 ============
const targets = TARGETS.length ? TARGETS : Object.keys(DICT_FILES)

for (const key of targets) {
  const file = DICT_FILES[key]
  if (!file) { console.error(`未知词库: ${key}`); continue }
  const jsonPath = path.join(ROOT, 'public', 'dicts', file)
  const raw = fs.readFileSync(jsonPath, 'utf8')
  const dict = JSON.parse(raw)
  // 各词库原始缩进不同（CET4/4000 为 8 空格，it-words/KaoYan 为 4 空格），
  // 保持各自格式写回，避免全文件格式漂移
  const indentMatch = raw.match(/\n(\s+)\{/m)
  const indent = indentMatch ? indentMatch[1].length : 2

  const stats = { rule: 0, merged: 0, override: 0, expanded: 0, unchanged: 0, compound: 0, tooFew: [] }
  const log = []
  const out = dict.map((w) => {
    const [result, status, why] = processWord(w)
    if (status === 'compound') { stats.compound++; return w }
    if (status === 'tooFew') {
      stats.tooFew.push({ name: w.name, why })
      stats.unchanged++
      return w
    }
    if ((w.syllables || []).join('|') !== result.join('|')) {
      stats[status]++
      log.push({ name: w.name, from: w.syllables || [], to: result, why })
    } else {
      stats.unchanged++
    }
    return { ...w, syllables: result }
  })

  // 校验
  let bad = 0
  for (const w of out) {
    if (!w.syllables?.length) continue
    const lower = w.name.trim().toLowerCase()
    if (![...lower].some((c) => 'aeiouy'.includes(c))) continue
    if (!isUsableSyllableSplit(lower, w.syllables)) { bad++; console.error(`  校验失败: ${w.name} [${w.syllables.join('-')}]`) }
  }

  console.log(`\n===== ${key}（${dict.length} 词）=====`)
  console.log(`规则: ${stats.rule} | 合并: ${stats.merged} | 特例: ${stats.override} | 拆段: ${stats.expanded} | 不变: ${stats.unchanged} | 复合/缩写: ${stats.compound} | 校验失败: ${bad}`)
  console.log(`S<V 未覆盖: ${stats.tooFew.length} 个`)
  for (const t of stats.tooFew.slice(0, 40)) console.log(`    ${t.name.padEnd(18)} ${t.why}`)
  if (stats.tooFew.length > 40) console.log(`    …共 ${stats.tooFew.length} 个，其余略`)

  if (!DRY_RUN && bad === 0) {
    fs.writeFileSync(jsonPath, JSON.stringify(out, null, indent))
    console.log(`  已写入 ${file}（缩进 ${indent}）`)
  } else {
    console.log(`  ${DRY_RUN ? '（--dry-run 未写入）' : '（存在校验失败，未写入）'}`)
  }
}
