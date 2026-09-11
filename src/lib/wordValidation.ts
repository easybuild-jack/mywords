const ENGLISH_WORD_PATTERN = /^[a-z]+(?:['’-][a-z]+)*$/i
const OBVIOUS_REPETITION_PATTERN = /([a-z])\1{3,}/i

/** 只判断是否像一个可查询的英文单词，不承担词典存在性判断。 */
export function isLikelyEnglishWord(value: string): boolean {
  const word = value.trim()
  return (
    word.length > 0 &&
    word.length <= 64 &&
    ENGLISH_WORD_PATTERN.test(word) &&
    !OBVIOUS_REPETITION_PATTERN.test(word)
  )
}

export function getWordValidationError(value: string): string | null {
  const word = value.trim()
  if (!word) return '请输入要查询的英文单词'
  if (word.length > 64) return '输入内容过长，请输入单个英文单词'
  if (!ENGLISH_WORD_PATTERN.test(word)) {
    return '只支持单个英文单词，可包含连字符或撇号'
  }
  if (OBVIOUS_REPETITION_PATTERN.test(word)) {
    return '输入包含明显重复字符，请检查单词拼写'
  }
  return null
}
