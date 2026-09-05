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

/** 49 个国际音标与本地离线高保真单音素音频映射表 */
export const IPA_AUDIO_MAP: Record<string, string> = {
  // 单元音 (12)
  'ɪ': 'i_short',
  'iː': 'i_long',
  'e': 'e',
  'æ': 'ae',
  'ɜː': 'er_long',
  'ə': 'schwa',
  'ʌ': 'wedge',
  'uː': 'u_long',
  'ʊ': 'u_short',
  'ɔː': 'o_long',
  'ɒ': 'o_short',
  'ɑː': 'a_long',

  // 双元音 (9)
  'eɪ': 'ei',
  'aɪ': 'ai',
  'ɔɪ': 'oi',
  'aʊ': 'au',
  'əʊ': 'ou_uk',
  'oʊ': 'ou_us',
  'ɪə': 'ia',
  'eə': 'ea',
  'ʊə': 'ua',

  // 爆破音 & 破擦音 (10)
  'p': 'p',
  'b': 'b',
  't': 't',
  'd': 'd',
  'k': 'k',
  'ɡ': 'g',
  'g': 'g',
  'tʃ': 'ch',
  'dʒ': 'dj',
  'tr': 'tr',
  'dr': 'dr',

  // 摩擦音 (11)
  'f': 'f',
  'v': 'v',
  'θ': 'th_voiceless',
  'ð': 'th_voiced',
  's': 's',
  'z': 'z',
  'ʃ': 'sh',
  'ʒ': 'zh',
  'h': 'h',
  'ts': 'ts',
  'dz': 'dz',

  // 鼻音 & 辅音 (7)
  'm': 'm',
  'n': 'n',
  'ŋ': 'ng',
  'l': 'l',
  'r': 'r',
  'w': 'w',
  'j': 'j',
}

/** 同一个词的发音节流窗口：首次立即出声，其后 3 秒内的重复触发直接丢弃 */
const PRONUNCIATION_THROTTLE_MS = 3000

/** 正音最长等待时间：网络异常或音频卡住时不能把切词流程永久卡死 */
const PRONUNCIATION_MAX_WAIT_MS = 2500

/** 被拦下的自动播放最多挂多久等用户手势：超时说明人早已翻到别的词，补播只会念错 */
const PENDING_PLAYBACK_TTL_MS = 15000

/**
 * 首次交互前的自动播放会被浏览器拒绝，这是策略限制而不是音源坏了。
 * 必须和网络/解码失败区分开：后者才值得退化到语音合成。
 */
function isAutoplayBlocked(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'NotAllowedError'
}

class AudioEngine {
  private keySoundCache: Map<string, Howl> = new Map()
  private beepSound: Howl | null = null
  private correctSound: Howl | null = null
  private prefetchedAudio: HTMLAudioElement | null = null
  private currentPronunciation: HTMLAudioElement | null = null
  private lastPronunciationKey = ''
  private lastPronunciationAt = 0
  private phoneticSoundCache: Map<string, HTMLAudioElement> = new Map()
  /** 被自动播放策略拦下的那次请求，挂在这里等第一次用户手势 */
  private pendingPlayback: { word: string; accent: 'us' | 'uk'; rate: number; at: number } | null = null
  private isWaitingForGesture = false

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

  /**
   * 播放英语国际音标单音素纯正真人发音。
   * 支持快速点选连续出声，基于本地离线音频资源库秒级响应。
   */
  public playPhoneticSound(symbol: string, volume: number = 0.85) {
    if (typeof window === 'undefined' || !symbol) return
    const filename = IPA_AUDIO_MAP[symbol]
    if (!filename) return

    try {
      let audio = this.phoneticSoundCache.get(filename)
      if (!audio) {
        audio = new Audio(`/sounds/phonetics/${filename}.mp3`)
        audio.preload = 'auto'
        this.phoneticSoundCache.set(filename, audio)
      } else {
        audio.currentTime = 0
      }
      audio.volume = Math.max(0, Math.min(1, volume))
      audio.play().catch((err) => {
        console.debug('Phonetic audio playback failed:', err)
      })
    } catch (e) {
      console.error('Failed to play phonetic sound', e)
    }
  }

  /** 生成单词发音音频 URL (有道在线高音质原声) */
  public getPronunciationUrl(word: string, accent: 'us' | 'uk' = 'us'): string {
    const clean = encodeURIComponent(word.trim().toLowerCase())
    const type = accent === 'uk' ? '1' : '2' // 1: 英音, 2: 美音
    return `https://dict.youdao.com/dictvoice?audio=${clean}&type=${type}`
  }

  /**
   * 播放单词真人发音。
   *
   * 节流按「单词 + 口音」计，而不是全局计时：狂点喇叭不会重复发起请求，
   * 但切到下一个词时自动发音仍要立刻响，短单词几秒内打完是常态。
   */
  public playPronunciation(word: string, accent: 'us' | 'uk' = 'us', rate: number = 1.0) {
    if (typeof window === 'undefined' || !word) return

    const key = `${word.trim().toLowerCase()}|${accent}`
    const now = Date.now()
    if (key === this.lastPronunciationKey && now - this.lastPronunciationAt < PRONUNCIATION_THROTTLE_MS) {
      return
    }
    this.lastPronunciationKey = key
    this.lastPronunciationAt = now

    // 快速切词时打断上一条，避免两个词的发音叠在一起
    if (this.currentPronunciation) {
      this.currentPronunciation.pause()
      this.currentPronunciation.src = ''
    }

    const audio = new Audio(this.getPronunciationUrl(word, accent))
    audio.playbackRate = rate
    this.currentPronunciation = audio
    audio.play().catch((err) => {
      if (isAutoplayBlocked(err)) {
        this.deferUntilUserGesture(word, accent, rate)
        return
      }
      console.warn('Online audio play failed, falling back to speech synthesis', err)
      this.playSpeechSynthesis(word, accent)
    })
  }

  /**
   * 播放例句朗读。
   *
   * 1. 采用 le=eng 强制英语长句语音模型，发音更标准自然。
   * 2. 支持 rate 参数微调节奏（默认 0.88x），吐字更舒缓清晰，避免过快发颤。
   * 3. 兼容 Web Speech Synthesis 兜底。
   */
  public playSentence(
    sentence: string,
    accent: 'us' | 'uk' = 'us',
    rateOrOnEnd?: number | (() => void),
    onEndCallback?: () => void
  ) {
    const rate = typeof rateOrOnEnd === 'number' ? rateOrOnEnd : 0.88
    const onEnd = typeof rateOrOnEnd === 'function' ? rateOrOnEnd : onEndCallback

    if (typeof window === 'undefined' || !sentence?.trim()) {
      onEnd?.()
      return
    }

    if (this.currentPronunciation) {
      this.currentPronunciation.pause()
      this.currentPronunciation.src = ''
    }

    const clean = encodeURIComponent(sentence.trim())
    const type = accent === 'uk' ? '1' : '2'
    // le=eng 让有道语音采用专门的英文长句神经网络模型，吐字更清晰自然
    const url = `https://dict.youdao.com/dictvoice?audio=${clean}&type=${type}&le=eng`

    const audio = new Audio(url)
    // 客户端调速：0.88x 语速清晰沉稳，符合语言学习者跟读要求
    audio.playbackRate = rate
    this.currentPronunciation = audio

    let settled = false
    const handleEnd = () => {
      if (!settled) {
        settled = true
        onEnd?.()
      }
    }

    audio.addEventListener('ended', handleEnd, { once: true })
    audio.addEventListener('error', () => {
      if (!settled) {
        settled = true
        this.playSpeechSynthesis(sentence, accent, rate, onEnd)
      }
    }, { once: true })

    audio.play().catch((err) => {
      if (!settled) {
        settled = true
        this.playSpeechSynthesis(sentence, accent, rate, onEnd)
      }
    })
  }

  /**
   * 把被拦下的自动播放挂起，等用户第一次敲键或点击时补上。
   *
   * 默写页「进页面就该响一声」的听音线索必然撞上这条策略：此时页面刚挂载，
   * 用户还没碰过任何东西。语音合成兜底在这里同样会被拦，所以只能等手势。
   * 期间若又请求了新的词，后者覆盖前者，补播的始终是最后要听的那个。
   */
  private deferUntilUserGesture(word: string, accent: 'us' | 'uk', rate: number) {
    this.pendingPlayback = { word, accent, rate, at: Date.now() }
    if (this.isWaitingForGesture) return
    this.isWaitingForGesture = true

    const onGesture = () => {
      this.isWaitingForGesture = false
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)

      const pending = this.pendingPlayback
      this.pendingPlayback = null
      if (!pending || Date.now() - pending.at > PENDING_PLAYBACK_TTL_MS) return
      // 补播不能被拦下那一刻自己写下的节流键挡掉
      this.lastPronunciationKey = ''
      this.playPronunciation(pending.word, pending.accent, pending.rate)
    }

    window.addEventListener('pointerdown', onGesture, { once: true })
    window.addEventListener('keydown', onGesture, { once: true })
  }

  /**
   * 播放一遍发音，并在播完（或失败）后 resolve，用于「正音后再切词」。
   *
   * 刻意绕开节流：刚默写完的词往往几秒前才作为听写线索响过，
   * 走 playPronunciation 会被节流直接丢弃，正音就永远听不到。
   */
  public playPronunciationOnce(word: string, accent: 'us' | 'uk' = 'us', rate: number = 1.0): Promise<void> {
    if (typeof window === 'undefined' || !word) return Promise.resolve()

    if (this.currentPronunciation) {
      this.currentPronunciation.pause()
      this.currentPronunciation.src = ''
    }

    const audio = new Audio(this.getPronunciationUrl(word, accent))
    audio.playbackRate = rate
    this.currentPronunciation = audio

    return new Promise<void>((resolve) => {
      let isSettled = false
      const settle = () => {
        if (isSettled) return
        isSettled = true
        clearTimeout(guardTimer)
        resolve()
      }
      const guardTimer = setTimeout(settle, PRONUNCIATION_MAX_WAIT_MS)

      audio.addEventListener('ended', settle, { once: true })
      audio.addEventListener('error', settle, { once: true })

      audio.play().catch((err) => {
        if (isAutoplayBlocked(err)) {
          this.deferUntilUserGesture(word, accent, rate)
        } else {
          this.playSpeechSynthesis(word, accent)
        }
        // 无论哪种失败都要立刻放行，正音不能把切词流程堵住
        settle()
      })
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
  private playSpeechSynthesis(text: string, accent: 'us' | 'uk', rate: number = 0.88, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.()
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US'
    utterance.rate = rate
    if (onEnd) {
      utterance.onend = () => onEnd()
      utterance.onerror = () => onEnd()
    }
    window.speechSynthesis.speak(utterance)
  }
}

export const audioEngine = new AudioEngine()
