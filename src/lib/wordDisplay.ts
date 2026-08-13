import type { WordItem } from '@/types'

/** 按口音偏好取音标，缺失时回退到另一个口音 */
export function pickPhonetic(word: WordItem, preference: 'us' | 'uk'): string {
  const primary = preference === 'uk' ? word.phoneticUk : word.phoneticUs
  const fallback = preference === 'uk' ? word.phoneticUs : word.phoneticUk
  return primary || fallback || ''
}

/** 把词性与释义拼成一行展示文本，例如 "v. 发现； 发掘  n. 发现" */
export function formatMeaningText(word: WordItem): string {
  return word.posList?.map((p) => `${p.pos} ${p.means.join('； ')}`).join('  ') || ''
}
