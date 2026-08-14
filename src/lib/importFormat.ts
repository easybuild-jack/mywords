import type { WordEtymology } from '@/types'

/** 词根词缀单元格里各词素之间的分隔符 */
const MORPHEME_SEPARATOR = '+'
/** 词素「形式|含义」之间的分隔符，选它是因为中文文本与 CSV 都不会用到竖线 */
const FORM_MEANING_SEPARATOR = '|'
/** 音节之间可用的分隔符，· 与 / 是为了让用户能把界面上看到的写法直接抄回来 */
const SYLLABLE_SEPARATORS = /[-·/]/

/**
 * 按 CSV 规则切分一行：引号内的逗号属于单元格内容。
 *
 * 原实现是 line.split(',') 却又逐格剥掉首尾引号，等于假装支持引号包裹——
 * 释义或语义推导里只要出现一个半角逗号，整行的列就会错位。
 */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }

  cells.push(cell.trim())
  return cells
}

/**
 * 解析「词根词缀」单元格，例如 `dis-|否定/相反 + cover|覆盖 + -y|名词后缀`。
 *
 * 角色由连字符位置决定，与 WordEtymology 里 form 的既有写法保持一致：
 * 结尾带连字符是前缀（dis-），开头带连字符是后缀（-y），都不带则是词根（cover）。
 * 这样用户按语言学惯用写法填表即可，不必额外声明每段是什么角色。
 */
export function parseEtymologyCell(cell?: string, derivation?: string): WordEtymology | undefined {
  const morphemes = (cell || '')
    .split(MORPHEME_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)

  const etymology: WordEtymology = { derivation: (derivation || '').trim() }

  for (const morpheme of morphemes) {
    const [rawForm, ...meaningPieces] = morpheme.split(FORM_MEANING_SEPARATOR)
    const form = rawForm.trim()
    if (!form) continue
    const meaning = meaningPieces.join(FORM_MEANING_SEPARATOR).trim()

    if (form.startsWith('-')) {
      etymology.suffix = { form, meaning }
    } else if (form.endsWith('-')) {
      etymology.prefix = { form, meaning }
    } else {
      etymology.root = { form, meaning }
    }
  }

  const hasContent = etymology.prefix || etymology.root || etymology.suffix || etymology.derivation
  return hasContent ? etymology : undefined
}

/**
 * 解析「音节拆分」单元格，例如 `dis-cov-er`。
 *
 * 拼接后必须还原成单词本身：学习卡按段高亮跟打进度，对不上会让高亮错位。
 * 校验不过就返回 undefined 退回自动切分，宁可不用也不能给出错的分段。
 */
export function parseSyllablesCell(cell: string | undefined, name: string): string[] | undefined {
  const parts = (cell || '')
    .split(SYLLABLE_SEPARATORS)
    .map((part) => part.trim())
    .filter(Boolean)

  if (!parts.length) return undefined
  if (parts.join('').toLowerCase() !== name.trim().toLowerCase()) return undefined
  return parts
}

/** 导入模板的列顺序，模板文件与 CSV 解析共用，避免两边各写一份而错位 */
export const CSV_COLUMNS = [
  '单词',
  '中文释义(选填)',
  '音标(选填)',
  '音节拆分(选填)',
  '词根词缀(选填)',
  '语义推导(选填)',
] as const

/**
 * 标准 CSV 模板内容。
 * 示例刻意覆盖了「前缀+词根+后缀」「只有前缀+词根」「完全不填拆解」三种情况，
 * 让用户一眼看出后四列都是可留空的。
 */
export const CSV_TEMPLATE_ROWS: string[][] = [
  [...CSV_COLUMNS],
  [
    'discover',
    '发现；发觉',
    '/dɪˈskʌvər/',
    'dis-cov-er',
    'dis-|否定/相反 + cover|覆盖',
    '去除覆盖 → 发现',
  ],
  [
    'perspective',
    '视角；观点',
    '/pərˈspektɪv/',
    'per-spec-tive',
    'per-|完全/透过 + spect|看 + -ive|形容词后缀',
    '透过现象看本质 → 视角',
  ],
  [
    'compile',
    '编译；编纂',
    '',
    'com-pile',
    'com-|完全/共同 + pile|堆积',
    '把零散代码堆成整体 → 编译',
  ],
  ['kubernetes', '容器自动化编排引擎', '', 'ku-ber-ne-tes', '', ''],
  ['resilient', '', '', '', '', ''],
]

/** 单元格里出现逗号、引号或换行时按 CSV 规则转义，否则读回来会错列 */
function escapeCsvCell(cell: string): string {
  if (!/[",\n]/.test(cell)) return cell
  return `"${cell.replace(/"/g, '""')}"`
}

export function buildCsvTemplate(): string {
  return CSV_TEMPLATE_ROWS.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
}
