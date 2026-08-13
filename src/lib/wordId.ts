/**
 * 单词的 id 同时是 IndexedDB 里 wordRecords 表的主键，因此只能由拼写决定。
 * 一旦掺入随机数或时间戳，重新加载章节后同一个单词会变成一条全新记录，
 * 掌握度、错词本去重与「连续 3 次默写正确」的计数都无法跨会话累积。
 */
export function buildWordId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return `word_${slug || 'unknown'}`
}
