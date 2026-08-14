import type { WordItem } from '@/types'

export interface PhoneticEntry {
  /** 只有两个口音确实不同时才带标签；相同时标上「美/英」等于告诉用户这词有区别，是假信息 */
  label?: '美' | '英'
  text: string
}

/**
 * 取要展示的音标：两个口音不同就并列给出并标注，相同或只有一个时只给一条。
 *
 * 词库里很多词两边是同一个串——基础词库的源表每个词只有一个音标（被同时写进了
 * usphone 和 ukphone），CET4 里也有 'kænsl 这种两边照抄的。
 * 无条件并排会得到两条一模一样的音标，既占地方又误导。
 */
export function listPhonetics(word: WordItem): PhoneticEntry[] {
  const us = word.phoneticUs?.trim()
  const uk = word.phoneticUk?.trim()

  if (us && uk && us !== uk) {
    return [
      { label: '美', text: us },
      { label: '英', text: uk },
    ]
  }

  const single = us || uk
  return single ? [{ text: single }] : []
}

/** 把词性与释义拼成一行展示文本，例如 "v. 发现； 发掘  n. 发现" */
export function formatMeaningText(word: WordItem): string {
  return word.posList?.map((p) => `${p.pos} ${p.means.join('； ')}`).join('  ') || ''
}
