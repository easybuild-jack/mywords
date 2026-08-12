import { Howl } from 'howler'
import type { KeySoundOption } from '@/types'

/** 内置 14 种经典机械键盘轴体清单 */
export const MECHANICAL_SWITCHES: KeySoundOption[] = [
  { id: 'Cherry MX Blues', name: 'Cherry MX Blue (青轴)', filename: 'Cherry MX Blues.mp3', switchType: '段落清脆' },
  { id: 'Cherry MX Reds', name: 'Cherry MX Red (红轴)', filename: 'Cherry MX Reds.mp3', switchType: '轻盈线性' },
  { id: 'Cherry MX Browns', name: 'Cherry MX Brown (茶轴)', filename: 'Cherry MX Browns.mp3', switchType: '微段落舒适' },
  { id: 'Cherry MX Blacks', name: 'Cherry MX Black (黑轴)', filename: 'Cherry MX Blacks.mp3', switchType: '直上直下' },
  { id: 'Holy Pandas', name: 'Holy Panda (圣熊猫)', filename: 'Holy Pandas.mp3', switchType: '复古木质段落' },
  { id: 'Alpacas', name: 'Alpacas (羊驼轴)', filename: 'Alpacas.mp3', switchType: '顺滑线性' },
  { id: 'Gateron Black Inks', name: 'Gateron Black Ink (黑曜石)', filename: 'Gateron Black Inks.mp3', switchType: '深沉顺滑' },
  { id: 'Gateron Red Inks', name: 'Gateron Red Ink (红晶)', filename: 'Gateron Red Inks.mp3', switchType: '轻柔线性' },
  { id: 'Kailh Box Navies', name: 'Kailh Box Navy (凯华海军蓝)', filename: 'Kailh Box Navies.mp3', switchType: '极响厚实段落' },
  { id: 'NovelKeys Creams', name: 'NovelKeys Cream (冰淇淋轴)', filename: 'NovelKeys Creams.mp3', switchType: '全POM清亮' },
  { id: 'SKCM Blue Alps', name: 'SKCM Blue Alps (蓝色阿尔卑斯)', filename: 'SKCM Blue Alps.mp3', switchType: '复古打字机' },
  { id: 'Topre', name: 'Topre (静电容)', filename: 'Topre.mp3', switchType: '雨滴般浑厚' },
  { id: 'Turquoise Tealios', name: 'Turquoise Tealios (蒂芙尼轴)', filename: 'Turquoise Tealios.mp3', switchType: '超顺滑静音' },
  { id: 'Buckling Spring', name: 'Buckling Spring (屈服弹簧)', filename: 'Buckling Spring.mp3', switchType: '经典IBM机械声' },
]

class AudioEngine {
  private keySoundCache: Map<string, Howl> = new Map()
  private beepSound: Howl | null = null
  private correctSound: Howl | null = null
  private prefetchedAudio: HTMLAudioElement | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initFeedbackSounds()
    }
  }

  private initFeedbackSounds() {
    this.beepSound = new Howl({
      src: ['/sounds/beep.wav'],
      volume: 0.8,
    })
    this.correctSound = new Howl({
      src: ['/sounds/correct.wav'],
      volume: 0.8,
    })
  }

  /** 获取指定轴体的 Howl 音频实例 (懒加载缓存) */
  private getKeySound(switchId: string): Howl {
    if (this.keySoundCache.has(switchId)) {
      return this.keySoundCache.get(switchId)!
    }

    const switchItem = MECHANICAL_SWITCHES.find((s) => s.id === switchId) || MECHANICAL_SWITCHES[0]
    const howl = new Howl({
      src: [`/sounds/key-sound/${switchItem.filename}`],
      volume: 1.0,
      preload: true,
    })

    this.keySoundCache.set(switchId, howl)
    return howl
  }

  /** 播放击键音效 */
  public playKeySound(switchId: string, volume: number = 0.8) {
    if (typeof window === 'undefined') return
    try {
      const sound = this.getKeySound(switchId)
      sound.volume(volume)
      sound.play()
    } catch (e) {
      console.error('Failed to play key sound', e)
    }
  }

  /** 播放错误蜂鸣音 */
  public playBeepSound(volume: number = 0.8) {
    if (typeof window === 'undefined') return
    try {
      if (!this.beepSound) this.initFeedbackSounds()
      if (this.beepSound) {
        this.beepSound.volume(volume)
        this.beepSound.play()
      }
    } catch (e) {
      console.error('Failed to play beep sound', e)
    }
  }

  /** 播放通关成功提示音 */
  public playCorrectSound(volume: number = 0.8) {
    if (typeof window === 'undefined') return
    try {
      if (!this.correctSound) this.initFeedbackSounds()
      if (this.correctSound) {
        this.correctSound.volume(volume)
        this.correctSound.play()
      }
    } catch (e) {
      console.error('Failed to play correct sound', e)
    }
  }

  /** 生成单词发音音频 URL (有道在线高音质原声) */
  public getPronunciationUrl(word: string, accent: 'us' | 'uk' = 'us'): string {
    const clean = encodeURIComponent(word.trim().toLowerCase())
    const type = accent === 'uk' ? '1' : '2' // 1: 英音, 2: 美音
    return `https://dict.youdao.com/dictvoice?audio=${clean}&type=${type}`
  }

  /** 播放单词真人发音 */
  public playPronunciation(word: string, accent: 'us' | 'uk' = 'us', rate: number = 1.0) {
    if (typeof window === 'undefined' || !word) return
    const url = this.getPronunciationUrl(word, accent)
    const audio = new Audio(url)
    audio.playbackRate = rate
    audio.play().catch((err) => {
      console.warn('Online audio play failed, falling back to speech synthesis', err)
      this.playSpeechSynthesis(word, accent)
    })
  }

  /** 0 延迟音频预加载 (Prefetch Next Word) */
  public prefetchWordAudio(nextWord: string | undefined, accent: 'us' | 'uk' = 'us') {
    if (typeof window === 'undefined' || !nextWord) return
    const url = this.getPronunciationUrl(nextWord, accent)
    if (this.prefetchedAudio) {
      this.prefetchedAudio.src = ''
    }
    this.prefetchedAudio = new Audio(url)
    this.prefetchedAudio.preload = 'auto'
    this.prefetchedAudio.load()
  }

  /** 原生 Web Speech Synthesis 发音兜底 */
  private playSpeechSynthesis(text: string, accent: 'us' | 'uk') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US'
    window.speechSynthesis.speak(utterance)
  }
}

export const audioEngine = new AudioEngine()
