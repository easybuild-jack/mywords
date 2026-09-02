import type { ShortcutConfig } from '@/types'

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  peekHint: 'Tab',
  replayAudio: 'Ctrl+J',
  prevWord: 'ArrowLeft',
  nextWord: 'ArrowRight',
  restartUnit: 'Ctrl+R',
  toggleSplit: 'Alt+S',
}

export const SHORTCUT_DEFINITIONS: {
  key: keyof ShortcutConfig
  label: string
  desc: string
  defaultKey: string
}[] = [
  { key: 'peekHint', label: '偷看提示', desc: '按住快速窥看单词完整拼写与音节', defaultKey: 'Tab' },
  { key: 'replayAudio', label: '发音朗读', desc: '重播当前单词真人原声发音', defaultKey: 'Ctrl+J' },
  { key: 'prevWord', label: '上一个单词', desc: '切换至当前单元的上一个单词', defaultKey: 'ArrowLeft' },
  { key: 'nextWord', label: '下一个单词', desc: '切换至当前单元的下一个单词', defaultKey: 'ArrowRight' },
  { key: 'restartUnit', label: '重学本单元', desc: '重新开始当前单元从头练习', defaultKey: 'Ctrl+R' },
  { key: 'toggleSplit', label: '切换音节切分', desc: '切换当前单词的音节拆分显示', defaultKey: 'Alt+S' },
]

/**
 * 将按键事件解析为标准快捷键字符串 (例如 "Ctrl+J", "Tab", "Alt+ArrowRight")
 */
export function eventToShortcutString(e: KeyboardEvent): string | null {
  // 忽略单独按下的修饰键
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    return null
  }

  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  let keyName = e.key
  if (keyName === ' ') keyName = 'Space'
  else if (keyName.length === 1) keyName = keyName.toUpperCase()

  parts.push(keyName)
  return parts.join('+')
}

/**
 * 判断键盘事件是否匹配配置的快捷键字符串
 */
export function isShortcutMatch(e: KeyboardEvent, shortcutStr?: string): boolean {
  if (!shortcutStr) return false
  const parts = shortcutStr.split('+')
  const baseKey = parts[parts.length - 1]
  const hasCtrl = parts.includes('Ctrl') || parts.includes('Cmd')
  const hasAlt = parts.includes('Alt')
  const hasShift = parts.includes('Shift')

  const ctrlMatches = hasCtrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey)
  const altMatches = hasAlt ? e.altKey : !e.altKey
  const shiftMatches = hasShift ? e.shiftKey : !e.shiftKey

  let keyMatches = false
  const lowerBase = baseKey.toLowerCase()
  if (lowerBase === 'space') {
    keyMatches = e.key === ' ' || e.code === 'Space'
  } else if (lowerBase === 'arrowleft') {
    keyMatches = e.key === 'ArrowLeft' || e.code === 'ArrowLeft'
  } else if (lowerBase === 'arrowright') {
    keyMatches = e.key === 'ArrowRight' || e.code === 'ArrowRight'
  } else if (lowerBase === 'arrowup') {
    keyMatches = e.key === 'ArrowUp' || e.code === 'ArrowUp'
  } else if (lowerBase === 'arrowdown') {
    keyMatches = e.key === 'ArrowDown' || e.code === 'ArrowDown'
  } else if (lowerBase === 'tab') {
    keyMatches = e.key === 'Tab' || e.code === 'Tab'
  } else {
    keyMatches =
      e.key.toLowerCase() === lowerBase ||
      e.code.toLowerCase() === `key${lowerBase}` ||
      e.code.toLowerCase() === lowerBase
  }

  return ctrlMatches && altMatches && shiftMatches && keyMatches
}

/**
 * 格式化友好显示的快捷键文本 (例如 ArrowLeft -> ←)
 */
export function formatShortcutDisplay(shortcutStr: string): string {
  if (!shortcutStr) return ''
  return shortcutStr
    .replace(/ArrowLeft/gi, '←')
    .replace(/ArrowRight/gi, '→')
    .replace(/ArrowUp/gi, '↑')
    .replace(/ArrowDown/gi, '↓')
}
