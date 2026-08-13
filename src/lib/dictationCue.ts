import type { DictationCueMode, PracticeMode } from '@/types'

/**
 * 看译文模式全程静音：中文释义已经摆在眼前，再给发音就失去了「由中文写出英文」的意义。
 * 静音是彻底的——自动发音、手动重播、完成后的正音一律不响。
 */
export function isAudioMuted(mode: PracticeMode, cueMode: DictationCueMode): boolean {
  return mode === 'dictation' && cueMode === 'meaning'
}

/**
 * 译文输入环节是否参与闯关。
 * 看译文模式下释义可见，输入它等于照抄，因此强制关闭，用户开关不生效。
 */
export function isMeaningStepActive(cueMode: DictationCueMode, userEnabled: boolean): boolean {
  return cueMode === 'listen' && userEnabled
}
