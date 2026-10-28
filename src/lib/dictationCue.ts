import type { DictationCueMode, PracticeMode } from '@/types'

/**
 * 听音与看译文默写已合二为一，默写模式下默认自动播放发音，不静音。
 */
export function isAutoAudioMuted(_mode?: PracticeMode, _cueMode?: DictationCueMode): boolean {
  return false
}

/**
 * 不再要求默写/输入中文译文，直接进入英文拼写盲打。
 */
export function isMeaningStepActive(_cueMode?: DictationCueMode, _userEnabled?: boolean): boolean {
  return false
}
