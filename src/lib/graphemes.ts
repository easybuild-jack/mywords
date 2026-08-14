import { isVowelAt } from '@/lib/syllables'

/**
 * 字母组合的类别。目前四类组合在界面上是同一种配色，
 * 分开保留是因为它们的可靠性和教学含义不同，将来做拼读讲解时要按类分开说。
 */
export type GraphemeKind =
  | 'vowel-team' // 元音组合，如 ea、ow
  | 'r-controlled' // r 控制元音，如 ur、air
  | 'consonant-digraph' // 辅音双字母，如 sh、ck
  | 'suffix-chunk' // 固定后缀音块，如 tion、ture
  | 'vowel' // 未参与组合的单个元音字母
  | 'plain' // 其余辅音字母

export interface GraphemeSegment {
  /** 原始大小写的字母，拼接后可还原成单词 */
  text: string
  kind: GraphemeKind
}

/** 组合出现的位置约束，用来挡掉明显的假阳性 */
type PositionRule = 'end' | 'not-start'

interface GraphemePattern {
  letters: string
  kind: GraphemeKind
  at?: PositionRule
}

/**
 * 「整体发一个音」的字母组合表。
 *
 * 刻意不收 bl、str 这类辅音连缀：它们是两三个音顺次连读，
 * 混进来会稀释「这一组只发一个音」的含义。
 * qu 是唯一的例外，它读 /kw/ 两个音，但 q 从不单独出现、读法完全不变，
 * 作为固定单位比多数组合都可靠。
 */
const GRAPHEME_PATTERNS: GraphemePattern[] = [
  // 元音组合
  { letters: 'ai', kind: 'vowel-team' },
  { letters: 'ay', kind: 'vowel-team' },
  { letters: 'au', kind: 'vowel-team' },
  { letters: 'aw', kind: 'vowel-team' },
  { letters: 'ea', kind: 'vowel-team' },
  { letters: 'ee', kind: 'vowel-team' },
  { letters: 'ew', kind: 'vowel-team' },
  { letters: 'ey', kind: 'vowel-team' },
  { letters: 'ie', kind: 'vowel-team' },
  // igh/eigh/ough/augh 这几个要整组收进来。少了它们，thought 会被切成 ou + gh，
  // 把本该一起看的字母拆散，而且落单的 gh 在这些词里其实不发音。
  { letters: 'igh', kind: 'vowel-team' },
  { letters: 'eigh', kind: 'vowel-team' },
  { letters: 'ough', kind: 'vowel-team' },
  { letters: 'augh', kind: 'vowel-team' },
  { letters: 'oa', kind: 'vowel-team' },
  { letters: 'oe', kind: 'vowel-team' },
  { letters: 'oi', kind: 'vowel-team' },
  { letters: 'oo', kind: 'vowel-team' },
  { letters: 'ou', kind: 'vowel-team' },
  { letters: 'ow', kind: 'vowel-team' },
  { letters: 'oy', kind: 'vowel-team' },
  { letters: 'ue', kind: 'vowel-team' },
  { letters: 'ui', kind: 'vowel-team' },

  // r 控制元音。三字母的要排在 ar/er 之类前面命中，靠下面按长度排序保证
  { letters: 'air', kind: 'r-controlled' },
  { letters: 'ear', kind: 'r-controlled' },
  { letters: 'eer', kind: 'r-controlled' },
  { letters: 'oor', kind: 'r-controlled' },
  { letters: 'our', kind: 'r-controlled' },
  { letters: 'ar', kind: 'r-controlled' },
  { letters: 'er', kind: 'r-controlled' },
  { letters: 'ir', kind: 'r-controlled' },
  { letters: 'or', kind: 'r-controlled' },
  { letters: 'ur', kind: 'r-controlled' },

  // 辅音双字母
  { letters: 'ch', kind: 'consonant-digraph' },
  { letters: 'ck', kind: 'consonant-digraph', at: 'not-start' },
  { letters: 'gh', kind: 'consonant-digraph' },
  { letters: 'ng', kind: 'consonant-digraph', at: 'not-start' },
  { letters: 'ph', kind: 'consonant-digraph' },
  { letters: 'qu', kind: 'consonant-digraph' },
  { letters: 'sh', kind: 'consonant-digraph' },
  { letters: 'th', kind: 'consonant-digraph' },
  { letters: 'wh', kind: 'consonant-digraph' },

  // 固定后缀音块。
  // ous 必须限定词尾，否则会吃掉 mouse 里的 ou（那里读 /aʊ/ 而不是 /əs/）；
  // tion、sion 不限位置，因为 nationality 这类词里它们出现在词中读法照旧。
  { letters: 'tion', kind: 'suffix-chunk' },
  { letters: 'sion', kind: 'suffix-chunk' },
  { letters: 'ture', kind: 'suffix-chunk', at: 'end' },
  { letters: 'ous', kind: 'suffix-chunk', at: 'end' },
]

/** 最长优先：our 要盖过 ou，ear 要盖过 ea，否则三字母组合永远轮不到 */
const SORTED_PATTERNS = [...GRAPHEME_PATTERNS].sort((a, b) => b.letters.length - a.letters.length)

function matchPatternAt(lower: string, index: number): GraphemePattern | undefined {
  for (const pattern of SORTED_PATTERNS) {
    const end = index + pattern.letters.length
    if (end > lower.length) continue
    if (lower.slice(index, end) !== pattern.letters) continue
    if (pattern.at === 'end' && end !== lower.length) continue
    if (pattern.at === 'not-start' && index === 0) continue
    return pattern
  }
  return undefined
}

/**
 * 把单词切成「固定发音的字母组合 + 单个字母」的分段序列。
 *
 * 从左到右扫描、最长优先，一个字母只归属一个组合，所以组合天然优先于单个元音：
 * ow 整组算组合，里面的 o 不会再被单独标成元音。
 * 各段拼接后必然还原成原词——渲染要逐段套样式，对不上就会漏字母。
 *
 * 只做拼写层面的匹配，不声称每组读什么音，因此不需要音素词典。
 * 代价是存在假阳性：react（re-act）的 ea 跨了音节边界、hothouse 的 th 跨了词素边界，
 * 都会被误标成组合。想消掉这类需要额外的例外表。
 */
export function splitIntoGraphemes(word: string): GraphemeSegment[] {
  const lower = word.toLowerCase()
  const segments: GraphemeSegment[] = []
  let index = 0

  while (index < word.length) {
    const pattern = matchPatternAt(lower, index)

    if (pattern) {
      segments.push({
        text: word.slice(index, index + pattern.letters.length),
        kind: pattern.kind,
      })
      index += pattern.letters.length
      continue
    }

    segments.push({
      text: word[index],
      kind: isVowelAt(lower, index) ? 'vowel' : 'plain',
    })
    index++
  }

  return segments
}
