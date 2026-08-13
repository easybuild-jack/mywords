import type { DictationCueMode, PracticeMode } from '@/types'

/**
 * 看译文模式下自动发音一律关闭：中文释义已经摆在眼前，不请自来的读音会顺手把拼写也送出去。
 * 压制范围只限自动触发——切词自动播、进页面补线索、通关正音。
 * 手动发音（点卡片喇叭、工具栏按钮、快捷键）始终可用，什么时候听由用户自己决定。
 */
export function isAutoAudioMuted(mode: PracticeMode, cueMode: DictationCueMode): boolean {
  return mode === 'dictation' && cueMode === 'meaning'
}

/**
 * 译文输入环节是否参与闯关。
 * 看译文模式下释义可见，输入它等于照抄，因此强制关闭，用户开关不生效。
 */
export function isMeaningStepActive(cueMode: DictationCueMode, userEnabled: boolean): boolean {
  return cueMode === 'listen' && userEnabled
}
