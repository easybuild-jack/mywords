/**
 * 按音标校验 basewords.json 的音节切分（用户规则：一个元音音位 = 一个音节）。
 *
 * L1 硬校验：syllables 的音节数必须等于音标（uk/us）中的元音音位数。
 *   - 双元音（eɪ aɪ ɔɪ aʊ əʊ oʊ ɪə eə ʊə）与长元音（iː uː ɜː ɔː ɑː）只算 1 个元音；
 *   - 词尾成音节辅音（bottle、lesson、curtain）额外算 1 个音节，但 film 这类
 *     -lm/-rm 流音结尾不算——按「有无成音节」两种口径取区间判定，避免误报；
 *   - 不含 syllables 字段的词、含空格/连字符的复合词单独分类，不算切错。
 *
 * L2 位置校验：按「一元一辅」规则（相邻元音核之间的辅音簇整体归后一个音节，
 *   元音字母组合整体保留、哑 e 摘除、词首 y 作辅音）在字母层面重切，与数据对比。
 *   注意这是字母层近似，真正的按音标切分需要音标-字母对齐（expensive 等词
 *   字母规则会给出怪异建议，报告会如实列出供人工复核）。
 *
 * 用法：node scripts/check-syllables-by-phonetics.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { splitIntoSyllables, isVowelAt, isUsableSyllableSplit } from '../src/lib/syllables.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const JSON_PATH = path.join(ROOT, 'public', 'dicts', 'basewords.json')

// 双元音 + 长元音：最长优先，整体算 1 个元音音位
const MULTI_SYMBOLS = ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'oʊ', 'ɪə', 'eə', 'ʊə', 'iː', 'uː', 'ɜː', 'ɔː', 'ɑː']
const SINGLE_SYMBOLS = ['ɪ', 'ə', 'e', 'æ', 'ʌ', 'ʊ', 'ɒ', 'ɔ', 'ɑ', 'ɜ', 'i', 'u', 'a', 'o']

/**
 * 复合词尾白名单（与 rebuild-basewords-syllables.mjs 一致）：
 * Sunday → sun-day，词尾整体保留为一段。
 */
const COMPOUND_TAILS = [
  'day', 'work', 'book', 'man', 'ball', 'room', 'shop', 'store', 'town', 'side',
  'thing', 'self', 'noon', 'night', 'walk', 'port', 'cake', 'mate', 'board',
  'ground', 'time', 'where', 'way', 'stand',
]
const COMPOUND_TAIL_EXCLUDES = new Set(['mushroom'])

/** 双字母一音 + 可作词首的辅音簇（与 rebuild 脚本一致） */
const DIGRAPHS = new Set(['th', 'sh', 'ch', 'ph', 'wh', 'ck', 'ng', 'gh', 'qu'])
const ONSET_CLUSTERS = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'dw', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr',
  'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw',
  'scr', 'shr', 'spl', 'spr', 'squ', 'str', 'thr',
])

/** 统计一段音标里的元音音位数（跳过重音符号） */
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

/** 词尾/倒数第二位的成音节辅音（-l -n -m 前是塞音/擦音等真辅音；流音 l/r 前的 -m 不算，如 film） */
function countSyllabicConsonant(phone) {
  const clean = (phone || '').replace(/[ˈˌ'’]/g, '').trim()
  const isVowelChar = (c) => SINGLE_SYMBOLS.includes(c) || c === 'ː' || MULTI_SYMBOLS.some((s) => s.includes(c))
  // 检查最后两个位置：present /preznt/、student /stjuːdnt/ 的成音节 n 在倒数第二位
  for (let k = clean.length - 1; k >= Math.max(0, clean.length - 2); k--) {
    if (!['l', 'n', 'm'].includes(clean[k])) continue
    const prev = clean[k - 1]
    if (prev && !isVowelChar(prev) && !['l', 'r'].includes(prev)) return 1
  }
  return 0
}

/** 按「一元一辅」规则在字母层面切分（用户规则，字母层近似） */
function splitByUserRule(word) {
  const cleanWord = word.trim().toLowerCase()
  if (!cleanWord) return []
  if (cleanWord.length <= 3) return [cleanWord]

  // 复合词尾优先：Sunday → sun-day（与重建脚本一致）
  if (!COMPOUND_TAIL_EXCLUDES.has(cleanWord)) {
    for (const tail of COMPOUND_TAILS) {
      if (cleanWord.length > tail.length + 1 && cleanWord.endsWith(tail)) {
        const head = cleanWord.slice(0, cleanWord.length - tail.length)
        return [...splitByUserRule(head), tail]
      }
    }
  }

  if (cleanWord.endsWith('le') && cleanWord.length >= 4 && !isVowelAt(cleanWord, cleanWord.length - 3)) {
    const head = cleanWord.slice(0, cleanWord.length - 3)
    return [...splitByUserRule(head), cleanWord.slice(cleanWord.length - 3)]
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
  } else if (last.start === last.end && last.end === cleanWord.length - 2 && cleanWord.endsWith('ed')) {
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

    // 簇首 r 控制（cur-ly、car-rot、thir-teen）：r 归属前一个音节
    if (cleanWord[clusterStart] === 'r' && isVowelAt(cleanWord, clusterStart - 1)) {
      const afterR = cleanWord[clusterStart + 1]
      if (afterR === undefined || !isVowelAt(cleanWord, clusterStart + 1)) {
        cuts.push(clusterStart + 1)
        continue
      }
    }

    // 不发音 gh 组合（eigh-teen、daugh-ter、naught-y）：gh 归属前一个音节
    if (cleanWord.slice(clusterStart, clusterStart + 2) === 'gh' && isVowelAt(cleanWord, clusterStart - 1)) {
      cuts.push(clusterStart + 2)
      continue
    }

    // 双写辅音（ye-llow）或双字母一音（tea-cher）：整簇归后
    const firstPair = cleanWord.slice(clusterStart, clusterStart + 2)
    if (firstPair[0] === firstPair[1] || DIGRAPHS.has(firstPair)) {
      cuts.push(clusterStart)
      continue
    }

    // 可作词首的辅音簇（li-bra-ry、ki-lo-gram）：整体归后
    const upToThree = cleanWord.slice(clusterStart, clusterStart + 3)
    if (ONSET_CLUSTERS.has(upToThree) || ONSET_CLUSTERS.has(firstPair)) {
      cuts.push(clusterStart)
      continue
    }

    // 其他多辅音簇：第一个辅音归前、其余归后（sep-tem-ber、oc-to-ber）
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

const dict = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
const noData = [] // 无 syllables 字段
const compound = [] // 含空格/连字符，需按成分分别切
const l1Mismatch = [] // 有数据且数量与音标元音数不符
const l2Mismatch = [] // 有数据、数量对，但位置与规则不符
const noPhone = []

for (const w of dict) {
  const name = w.name.trim()
  if (!w.ukphone && !w.usphone) { noPhone.push(name); continue }

  const phones = [w.ukphone, w.usphone].filter(Boolean)
  // 每种音标给出「无成音节/有成音节」两种口径，取并集区间
  const ranges = phones.map((p) => {
    const v = countPhoneticVowels(p)
    return [v, v + countSyllabicConsonant(p)]
  })
  const minVowels = Math.min(...ranges.map((r) => r[0]))
  const maxVowels = Math.max(...ranges.map((r) => r[1]))

  const hasCompound = /[\s\-]/.test(name)
  if (!w.syllables || !w.syllables.length) {
    if (hasCompound) compound.push({ name, note: '无 syllables 数据' })
    else noData.push({ name, phones, vowels: [minVowels, maxVowels], algo: splitIntoSyllables(name) })
    continue
  }

  if (hasCompound) { compound.push({ name, cur: w.syllables, note: `现有 [${w.syllables.join('-')}]` }); continue }

  const curCount = w.syllables.length
  if (curCount < minVowels || curCount > maxVowels) {
    l1Mismatch.push({ name, cur: w.syllables, count: curCount, vowels: [minVowels, maxVowels], phones })
    continue
  }

  const ruleSplit = splitByUserRule(name)
  if (ruleSplit.join('') === name.toLowerCase() && ruleSplit.join('|') !== w.syllables.join('|')) {
    l2Mismatch.push({ name, cur: w.syllables, rule: ruleSplit })
  }
}

console.log(`总词数：${dict.length}，无音标：${noPhone.length}`)

console.log(`\n== A. 没有 syllables 字段（运行时用算法切，共 ${noData.length} 个） ==`)
console.log(`   示例（前 12）：${noData.slice(0, 12).map((m) => `${m.name}[算法→${m.algo.join('-')}]`).join('、')}`)

console.log(`\n== B. 复合词/缩写（含空格或连字符，应按成分分别切，共 ${compound.length} 个） ==`)
console.log(`   示例（前 12）：${compound.slice(0, 12).map((m) => `${m.name}${m.note ? '（' + m.note + '）' : `[现有 ${m.cur.join('-')}]`}`).join('、')}`)

console.log(`\n== C. L1 硬校验：有数据但音节数 ≠ 音标元音数（${l1Mismatch.length} 个） ==`)
for (const m of l1Mismatch) {
  console.log(`  ${m.name.padEnd(14)} 现有 ${m.count} 段 [${m.cur.join('-')}]  → 音标元音 ${m.vowels.join('~')}  ${m.phones.map((p) => `/${p}/`).join(' ')}`)
}

console.log(`\n== D. L2 位置校验：段数对但位置与「一元一辅」不符（${l2Mismatch.length} 个，前 80 条） ==`)
for (const m of l2Mismatch.slice(0, 80)) {
  console.log(`  ${m.name.padEnd(14)} 现有 [${m.cur.join('-')}]  → 按规则 [${m.rule.join('-')}]`)
}
if (l2Mismatch.length > 80) console.log(`  …共 ${l2Mismatch.length} 条，其余略（完整清单见脚本可加 --all 参数）`)
