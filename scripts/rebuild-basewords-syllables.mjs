/**
 * 音标驱动的 basewords.json 音节切分重建。
 *
 * 规则（用户定义）：
 * - 一个元音音位（含双元音 eɪ/aɪ/ɔɪ/aʊ/əʊ/oʊ/ɪə/eə/ʊə 与长元音 iː/uː/ɜː/ɔː/ɑː）= 一个音节；
 * - 切分遵循「一元一辅」：相邻元音核之间的辅音（含双写、组合）整体归后一个音节；
 * - 元音字母组合整体保留、词首 y 作辅音、词尾哑 e 摘除（-ed 用变体 + 音标回验）。
 *
 * 策略：
 * 1. 音标元音数 V（uk 优先；uk/us 不一致时取与字母段数更接近的）；
 * 2. 字母层规则切分（-ed 摘除/不摘两种变体，选段数接近 V 的）；
 * 3. S > V → 相邻合并到 V（优先合并最短对，保证每段仍含元音字母）；
 * 4. S < V → 查特例表（字母层无解：-our/-ie/-ia/-io 等一个组合两个元音，或缩写）；
 * 5. 缩写（全大写）与复合词（含空格/连字符）保持原样。
 *
 * 用法：node scripts/rebuild-basewords-syllables.mjs          # 实际写入
 *       node scripts/rebuild-basewords-syllables.mjs --dry-run # 只输出不写
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isVowelAt, isUsableSyllableSplit } from '../src/lib/syllables.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const JSON_PATH = path.join(ROOT, 'public', 'dicts', 'basewords.json')
const DRY_RUN = process.argv.includes('--dry-run')

const MULTI_SYMBOLS = ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'oʊ', 'ɪə', 'eə', 'ʊə', 'iː', 'uː', 'ɜː', 'ɔː', 'ɑː']
const SINGLE_SYMBOLS = ['ɪ', 'ə', 'e', 'æ', 'ʌ', 'ʊ', 'ɒ', 'ɔ', 'ɑ', 'ɜ', 'i', 'u', 'a', 'o']
const isVowelChar = (c) => SINGLE_SYMBOLS.includes(c) || c === 'ː' || MULTI_SYMBOLS.some((s) => s.includes(c))

/**
 * 复合词尾白名单：以这些单音节独立词结尾的单词，词尾整体保留为一段
 * （Sunday → sun-day，而不是 su-nday）。
 * 只收录「作为词尾时几乎总是复合词素」且不易误伤的词；
 * end/one/body/melon/berry 等易误伤（spend、stone、everybody）不走此规则，由特例表处理。
 */
const COMPOUND_TAILS = [
  'ache', 'day', 'work', 'book', 'man', 'ball', 'room', 'shop', 'store', 'town', 'side',
  'thing', 'self', 'noon', 'night', 'walk', 'port', 'cake', 'mate', 'board',
  'ground', 'time', 'where', 'way', 'stand',
]
/** 词尾看起来命中但实际是整体词（不是复合词）的豁免 */
const COMPOUND_TAIL_EXCLUDES = new Set(['mushroom'])

/** 字母层无解的词：一个元音字母组合对应两个音标元音（-our/-ie/-ia/-io…），或缩写 */
const OVERRIDES = {
  diet: ['di', 'et'],
  'january': ['jan', 'u', 'a', 'ry'],
  'february': ['fe', 'bru', 'a', 'ry'],
  'twentieth': ['twen', 'ti', 'eth'],
  'twenty': ['twen', 'ty'],
  // end 词尾易误伤（spend/friend），weekend 走特例
  'weekend': ['week', 'end'],
  // grand- 词头复合（ndp/ndf 簇规则切不出 grand- 边界）
  'grandparent': ['grand', 'pa', 'rent'],
  'grandfather': ['grand', 'fa', 'ther'],
  'grandmother': ['grand', 'mo', 'ther'],
  'grandpa': ['grand', 'pa'],
  'grandma': ['grand', 'ma'],
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
  // 合并结果不理想的（不发音元音位置特殊）
  'vegetable': ['vege', 'ta', 'ble'],
  'chocolate': ['choco', 'late'],
  'several': ['seve', 'ral'],
  // 规则会把词首元音后接辅音簇的词切坏（e-xpe-nsive 违反一元一辅本身），保留传统切分
  'expensive': ['ex', 'pen', 'sive'],
}

/** 统计一段音标里的元音音位数 */
function countPhoneticVowels(phone) {
  const clean = (phone || '').replace(/[ˈˌ'’]/g, '')
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

/**
 * 成音节辅音（-l -n -m）：该辅音前面是辅音、且它之后到词尾没有元音。
 * bottle /bɒtl/、lesson /lesn/、present /preznt/ 算；only /əʊnli/、film /fɪlm/ 不算。
 */
function countSyllabicConsonant(phone) {
  const clean = (phone || '').replace(/[ˈˌ'’]/g, '').trim()
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

/** 双字母一音（整体归后一个音节） */
const DIGRAPHS = new Set(['th', 'sh', 'ch', 'ph', 'wh', 'ck', 'ng', 'gh', 'qu'])

/**
 * 英语可作词首的辅音簇（onset）：br、gr、pr、sk 等整体归后一个音节
 * （li-bra-ry、ki-lo-gram、a-pril），除非前一个音节需要闭（由 r 控制/双写规则先处理）。
 */
const ONSET_CLUSTERS = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'dw', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr',
  'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw',
  'scr', 'shr', 'spl', 'spr', 'squ', 'str', 'thr',
])

/**
 * 字母层规则切分；dropEd=false 时不摘 -ed 的 e。
 *
 * 辅音簇处理（两个元音核之间，从后往前切）：
 * - 簇长 1：归后一个音节（co-lour）；
 * - 簇首 r 控制（r 前是元音、r 后是辅音/词尾）：r 归前（cur-ly、car-rot、thir-teen）；
 * - 双写辅音（ll、mm）：第一个归前、第二个归后（com-mand、yel-low）；
 * - 其他多辅音簇：第一个辅音归前、其余归后（sep-tem-ber、oc-to-ber、no-vem-ber）。
 */
function splitByUserRule(word, { dropEd = true } = {}) {
  const cleanWord = word.trim().toLowerCase()
  if (!cleanWord) return []
  if (cleanWord.length <= 3) return [cleanWord]

  // 复合词尾优先：Sunday → sun-day（day 是独立词，整体保留，前缀递归切分）
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

    // 单辅音：归后一个音节（co-lour、o-range）
    if (clusterSize === 1) {
      cuts.push(clusterStart)
      continue
    }

    // 簇首 r 控制：r 前是元音、r 后是辅音或词尾 → r 归属前一个音节（cur-ly、car-rot、thir-teen）
    if (cleanWord[clusterStart] === 'r' && isVowelAt(cleanWord, clusterStart - 1)) {
      const afterR = cleanWord[clusterStart + 1]
      if (afterR === undefined || !isVowelAt(cleanWord, clusterStart + 1)) {
        cuts.push(clusterStart + 1)
        continue
      }
    }

    // 不发音 gh 组合（eigh/igh/augh/ough，如 eigh-teen、daugh-ter、naught-y）：
    // 元音后的 gh 归属前一个音节，组合整体保留
    if (cleanWord.slice(clusterStart, clusterStart + 2) === 'gh' && isVowelAt(cleanWord, clusterStart - 1)) {
      cuts.push(clusterStart + 2)
      continue
    }

    // 双字母一音（teacher 的 ch、father 的 th）：整簇归后
    const firstPair = cleanWord.slice(clusterStart, clusterStart + 2)
    if (DIGRAPHS.has(firstPair)) {
      cuts.push(clusterStart)
      continue
    }

    // 可作词首的辅音簇（li-bra-ry 的 br、ki-lo-gram 的 gr）：整体归后
    const upToThree = cleanWord.slice(clusterStart, clusterStart + 3)
    if (ONSET_CLUSTERS.has(upToThree) || ONSET_CLUSTERS.has(firstPair)) {
      cuts.push(clusterStart)
      continue
    }

    // 双写辅音（command 的 mm、yellow 的 ll）及其他多辅音簇：
    // 第一个辅音归前、其余归后（VC-CV：com-mand、yel-low、sep-tem-ber、oc-to-ber）
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

/** 相邻合并到目标段数：优先合并最短相邻对，保证每段仍含元音字母 */
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

/** 计算一个词的音标元音数（uk 优先；不一致时取与字母段接近的） */
function resolveVowelCount(w, letterCount) {
  const ukV = countPhoneticVowels(w.ukphone) + countSyllabicConsonant(w.ukphone)
  const usV = countPhoneticVowels(w.usphone) + countSyllabicConsonant(w.usphone)
  if (ukV === usV) return ukV
  return Math.abs(ukV - letterCount) <= Math.abs(usV - letterCount) ? ukV : usV
}

const dict = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
const log = []
const stats = { ok: 0, merged: 0, override: 0, unchanged: 0, compound: 0 }

const out = dict.map((w) => {
  const name = w.name.trim()
  const lower = name.toLowerCase()

  // 复合词（空格/连字符）与缩写（全大写）：保持原样，避免破坏校验
  if (/\s|-/.test(name) || (name === name.toUpperCase() && name.length > 1)) {
    stats.compound++
    return w
  }

  const override = OVERRIDES[lower]
  if (override) {
    if (override.join('') !== lower) throw new Error(`OVERRIDE 拼接不回原词: ${name}`)
    if (!isUsableSyllableSplit(lower, override)) throw new Error(`OVERRIDE 未过校验: ${name} ${override.join('-')}`)
    if ((w.syllables || []).join('|') !== override.join('|')) {
      stats.override++
      log.push({ name, from: w.syllables || [], to: override, why: '特例表' })
    } else {
      stats.ok++
    }
    return { ...w, syllables: override }
  }

  const letterCount = splitByUserRule(name).length
  const V = resolveVowelCount(w, letterCount)

  const candA = splitByUserRule(name)
  const candB = splitByUserRule(name, { dropEd: false })
  let best = Math.abs(candA.length - V) <= Math.abs(candB.length - V) ? candA : candB

  if (best.length === V) {
    if ((w.syllables || []).join('|') !== best.join('|')) {
      stats.ok++
      log.push({ name, from: w.syllables || [], to: best, why: '规则' })
    } else {
      stats.unchanged++
    }
    return { ...w, syllables: best }
  }

  if (best.length > V) {
    const merged = mergeTo(name, [...best], V)
    if ((w.syllables || []).join('|') !== merged.join('|')) {
      stats.merged++
      log.push({ name, from: w.syllables || [], to: merged, why: '合并' })
    } else {
      stats.unchanged++
    }
    return { ...w, syllables: merged }
  }

  // S < V 且不在特例表：字母层无解，保留原样并记录
  stats.unchanged++
  log.push({ name, from: w.syllables || [], to: w.syllables || [], why: `S<V 未覆盖（V=${V} 规则=${best.join('-')}）` })
  return w
})

// 汇总 + 校验（整词无元音字母的缩写词 pm/TV/Ms 等豁免——字母层无法表达其音节）
let bad = 0
for (const w of out) {
  if (!w.syllables?.length) continue
  const lower = w.name.trim().toLowerCase()
  if (![...lower].some((c) => 'aeiouy'.includes(c))) continue
  if (!isUsableSyllableSplit(lower, w.syllables)) {
    bad++
    console.error(`校验失败: ${w.name} [${w.syllables.join('-')}]`)
  }
}

console.log(`总词数：${dict.length} | 规则重切：${stats.ok} | 合并：${stats.merged} | 特例表：${stats.override} | 保持不变：${stats.unchanged} | 复合词/缩写：${stats.compound}`)
console.log(`拼接/元音校验失败：${bad}`)

console.log(`\n== 改动明细（${log.length} 条，前 80 条） ==`)
for (const l of log.slice(0, 80)) {
  const mark = l.why === 'S<V 未覆盖' ? '⚠' : '→'
  console.log(`  ${l.name.padEnd(14)} [${(l.from || []).join('-')}] ${mark} [${(l.to || []).join('-')}] (${l.why})`)
}
if (log.length > 80) console.log(`  …共 ${log.length} 条，其余略`)

if (!DRY_RUN) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(out, null, 4))
  console.log('\n已写入 basewords.json')
} else {
  console.log('\n（--dry-run 未写入）')
}
