const VOWEL_LETTERS = 'aeiou'
const DIGRAPHS = new Set(['th', 'sh', 'ch', 'ph', 'wh', 'ck', 'ng', 'gh', 'qu'])

function isVowelAt(word, index) {
  const char = word[index]
  if (char === 'u' && index > 0 && word[index - 1] === 'q') return false
  if (VOWEL_LETTERS.includes(char)) return true
  if (char !== 'y') return false
  return !(index === 0 && word[1] !== undefined && VOWEL_LETTERS.includes(word[1]))
}

function findVowelNuclei(word) {
  const nuclei = []
  let i = 0
  while (i < word.length) {
    if (!isVowelAt(word, i)) { i++; continue }
    const start = i
    while (i + 1 < word.length && isVowelAt(word, i + 1)) i++
    nuclei.push({ start, end: i })
    i++
  }
  return nuclei
}

function dropSilentNuclei(word, nuclei) {
  if (nuclei.length < 2) return nuclei
  const last = nuclei[nuclei.length - 1]
  const isSingleLetter = last.start === last.end
  if (isSingleLetter && last.end === word.length - 1 && word.endsWith('e')) return nuclei.slice(0, -1)
  if (isSingleLetter && last.end === word.length - 2 && word.endsWith('ed')) {
    const before = word[word.length - 3]
    if (before && !'td'.includes(before)) return nuclei.slice(0, -1)
  }
  return nuclei
}

function findCutPoints(word, nuclei) {
  const cuts = []
  for (let n = 0; n < nuclei.length - 1; n++) {
    const clusterStart = nuclei[n].end + 1
    const clusterSize = nuclei[n + 1].start - clusterStart
    if (clusterSize === 1) { cuts.push(clusterStart); continue }
    const firstPair = word.slice(clusterStart, clusterStart + 2)
    cuts.push(DIGRAPHS.has(firstPair) ? clusterStart : clusterStart + 1)
  }
  return cuts
}

const knownOverrides = {
  discover: ['dis', 'cov', 'er'], perspective: ['per', 'spec', 'tive'],
  international: ['in', 'ter', 'na', 'tion', 'al'], developer: ['de', 'vel', 'op', 'er'],
  education: ['ed', 'u', 'ca', 'tion'], computer: ['com', 'pu', 'ter'],
  algorithm: ['al', 'go', 'rithm'], vocabulary: ['vo', 'cab', 'u', 'lar', 'y'],
  application: ['ap', 'pli', 'ca', 'tion'], javascript: ['java', 'script'],
  kubernetes: ['ku', 'ber', 'ne', 'tes'], important: ['im', 'por', 'tant'],
  beautiful: ['beau', 'ti', 'ful'], understand: ['un', 'der', 'stand'],
  information: ['in', 'for', 'ma', 'tion'], experience: ['ex', 'pe', 'ri', 'ence'],
}

function splitIntoSyllables(word) {
  const cleanWord = word.trim().toLowerCase()
  if (!cleanWord) return []
  if (cleanWord.length <= 3) return [cleanWord]
  if (knownOverrides[cleanWord]) return knownOverrides[cleanWord]

  if (cleanWord.endsWith('le') && cleanWord.length >= 4 && !isVowelAt(cleanWord, cleanWord.length - 3)) {
    const head = cleanWord.slice(0, cleanWord.length - 3)
    return [...splitIntoSyllables(head), cleanWord.slice(cleanWord.length - 3)]
  }

  const nuclei = dropSilentNuclei(cleanWord, findVowelNuclei(cleanWord))
  const bounds = [0, ...findCutPoints(cleanWord, nuclei), cleanWord.length]
  const syllables = []
  for (let i = 0; i < bounds.length - 1; i++) syllables.push(cleanWord.slice(bounds[i], bounds[i + 1]))
  if (syllables.join('') !== cleanWord) return [cleanWord]
  return syllables.filter(Boolean)
}

// ===== 断言 =====
const VOWELISH = 'aeiouy'
const words = [
  'thought', 'thoughts', 'strength', 'rhythm', 'psst', 'my', 'the', 'yes', 'young',
  'cake', 'made', 'hoped', 'wanted', 'needed', 'style', 'whole', 'while',
  'table', 'little', 'apple', 'simple', 'people', 'uncle', 'able', 'cycle', 'possible',
  'letter', 'winter', 'monster', 'children', 'mother', 'teacher', 'washing', 'anchor',
  'about', 'open', 'baby', 'happy', 'day', 'player', 'quick', 'queen', 'quiet',
  'discover', 'perspective', 'important', 'beautiful', 'computer', 'algorithm',
  'embrace', 'dictation', 'knowledge', 'through', 'straight', 'business', 'squirrel',
  'science', 'create', 'idea', 'radio', 'area', 'eight', 'weight', 'daughter',
]

let failures = 0
for (const w of words) {
  const parts = splitIntoSyllables(w)
  const joined = parts.join('')
  const bad = []
  if (joined !== w) bad.push('拼接不还原')
  if (parts.some((p) => !p)) bad.push('空片段')
  const vowelless = parts.filter((p) => ![...p].some((c) => VOWELISH.includes(c)))
  if (vowelless.length) bad.push(`无元音碎片:${vowelless.join(',')}`)
  if (bad.length) { failures++; console.log(`FAIL ${w} -> ${parts.join('-')}  [${bad.join('; ')}]`) }
  else console.log(`ok   ${w} -> ${parts.join('-')}`)
}

// 全量词库抽查：确保没有任何词产出无元音碎片
import { readFileSync, readdirSync } from 'node:fs'
const dir = './public/dicts'
let total = 0, broken = 0
const samples = []
for (const file of readdirSync(dir)) {
  let raw
  try { raw = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')) } catch { continue }
  if (!Array.isArray(raw)) continue
  for (const entry of raw) {
    const name = entry?.name || entry?.headword || entry?.word
    if (typeof name !== 'string' || !/^[a-zA-Z]+$/.test(name)) continue
    total++
    const parts = splitIntoSyllables(name)
    const ok = parts.join('') === name.toLowerCase()
      && parts.every((p) => p && [...p].some((c) => VOWELISH.includes(c)))
    if (!ok) { broken++; if (samples.length < 25) samples.push(`${name} -> ${parts.join('-')}`) }
  }
}
console.log(`\n手工用例失败 ${failures} / ${words.length}`)
console.log(`全量词库：检查 ${total} 词，异常 ${broken} 词`)
if (samples.length) console.log('异常样例:\n' + samples.join('\n'))
