import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PracticeMode, WordItem, VocabularyBook } from '@/types'
import { BUILTIN_BOOKS, INITIAL_SAMPLE_WORDS } from '@/resources/books'
import { db, recordWordAttempt, toggleStarWord } from '@/db'
import { audioEngine } from '@/core/audioEngine'
import { dictionaryLoader } from '@/core/dictionaryLoader'

interface WorkspaceState {
  // 核心书籍与单元选择
  currentBookId: string
  currentBook: VocabularyBook
  currentUnitIndex: number
  unitSize: number
  activeWordIndex: number
  currentLoadedWords: WordItem[]
  
  // 模式与做题控制
  mode: PracticeMode
  loopCountSetting: 1 | 2 | 3 | 5
  currentWordRemainingLoops: number
  isTranslationVisible: boolean
  phoneticPreference: 'us' | 'uk'
  
  // 击键输入状态
  currentInput: string
  hasTypo: boolean
  isTypingActive: boolean
  isPeeking: boolean
  isUnitFinished: boolean
  
  // 本章错词闭环重考队列 (In-Chapter Retry Queue)
  retryWordQueue: WordItem[]
  
  // 音效与多媒体配置
  isAutoPlayAudio: boolean
  audioRate: number
  keySoundPack: string
  keySoundVolume: number
  isKeySoundEnabled: boolean
  isWrongBeepEnabled: boolean
  isCorrectSoundEnabled: boolean
  feedbackVolume: number

  // 错词攻坚专项模式
  isErrorPracticeActive: boolean

  // 弹窗状态
  isImportModalOpen: boolean
  isSettingsModalOpen: boolean

  // 方法定义
  setBookId: (bookId: string) => Promise<void>
  setUnitIndex: (unitIndex: number) => Promise<void>
  loadCurrentUnitWords: () => Promise<void>
  startErrorPractice: (words: WordItem[], startIndex?: number) => void
  exitErrorPractice: () => Promise<void>
  setMode: (mode: PracticeMode) => void
  setLoopCountSetting: (count: 1 | 2 | 3 | 5) => void
  toggleTranslation: () => void
  setPhoneticPreference: (pref: 'us' | 'uk') => void
  setInput: (input: string) => void
  setTypo: (typo: boolean) => void
  setImportModalOpen: (open: boolean) => void
  setSettingsModalOpen: (open: boolean) => void
  setKeySoundPack: (pack: string) => void
  setKeySoundVolume: (vol: number) => void
  toggleKeySound: (enabled?: boolean) => void
  
  // 练习与按键核心业务
  handleCharacterInput: (char: string) => void
  handleBackspace: () => void
  peekHint: (show: boolean) => void
  replayAudio: () => void
  starCurrentWord: () => Promise<boolean>
  nextWord: () => void
  prevWord: () => void
  restartUnit: () => void
  
  // 3D 轮播卡片数据计算
  getUnitWords: () => WordItem[]
  getCurrentWord: () => WordItem | undefined
  getSurrounding5Words: () => (WordItem | null)[]
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      currentBookId: 'book_cet4',
      currentBook: BUILTIN_BOOKS[0],
      currentUnitIndex: 0,
      unitSize: 20,
      activeWordIndex: 0,
      currentLoadedWords: INITIAL_SAMPLE_WORDS,
      
      mode: 'learn',
      loopCountSetting: 1,
      currentWordRemainingLoops: 1,
      isTranslationVisible: true,
      phoneticPreference: 'us',
      
      currentInput: '',
      hasTypo: false,
      isTypingActive: false,
      isPeeking: false,
      isUnitFinished: false,
      retryWordQueue: [],
      
      isAutoPlayAudio: true,
      audioRate: 1.0,
      keySoundPack: 'Cherry MX Blues',
      keySoundVolume: 0.8,
      isKeySoundEnabled: true,
      isWrongBeepEnabled: true,
      isCorrectSoundEnabled: true,
      feedbackVolume: 0.8,

      isImportModalOpen: false,
      isSettingsModalOpen: false,
      isErrorPracticeActive: false,

      loadCurrentUnitWords: async () => {
        const { isErrorPracticeActive, currentBookId, currentBook, currentUnitIndex, unitSize } = get()
        // 错词攻坚模式下不被常规章节覆盖
        if (isErrorPracticeActive) return

        if (currentBook?.isCustom && currentBook.words?.length) {
          const start = currentUnitIndex * unitSize
          const slice = currentBook.words.slice(start, start + unitSize)
          set({ currentLoadedWords: slice.length ? slice : currentBook.words })
        } else {
          // 官方大词库动态加载
          const loaded = await dictionaryLoader.loadBookUnitWords(currentBookId, currentUnitIndex, unitSize)
          const dynamicTotal = await dictionaryLoader.getBookTotalWords(currentBookId)
          if (currentBook && currentBook.totalWords !== dynamicTotal && dynamicTotal > 0) {
            set({ currentBook: { ...currentBook, totalWords: dynamicTotal } })
          }
          if (loaded.length > 0) {
            set({ currentLoadedWords: loaded })
          } else {
            set({ currentLoadedWords: INITIAL_SAMPLE_WORDS })
          }
        }
      },

      startErrorPractice: (words: WordItem[], startIndex: number = 0) => {
        if (!words.length) return
        set({
          isErrorPracticeActive: true,
          mode: 'dictation',
          currentLoadedWords: words,
          activeWordIndex: Math.min(startIndex, words.length - 1),
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          retryWordQueue: [],
          currentWordRemainingLoops: get().loopCountSetting,
        })
      },

      exitErrorPractice: async () => {
        set({
          isErrorPracticeActive: false,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          retryWordQueue: [],
        })
        await get().loadCurrentUnitWords()
      },

      getUnitWords: () => {
        return get().currentLoadedWords
      },

      getCurrentWord: () => {
        const { currentLoadedWords, activeWordIndex } = get()
        return currentLoadedWords[activeWordIndex]
      },

      getSurrounding5Words: () => {
        const { currentLoadedWords, activeWordIndex } = get()
        const unitWords = currentLoadedWords
        if (!unitWords.length) return [null, null, null, null, null]

        const left2 = activeWordIndex - 2 >= 0 ? unitWords[activeWordIndex - 2] : null
        const left1 = activeWordIndex - 1 >= 0 ? unitWords[activeWordIndex - 1] : null
        const center = unitWords[activeWordIndex] || unitWords[0]
        const right1 = activeWordIndex + 1 < unitWords.length ? unitWords[activeWordIndex + 1] : null
        const right2 = activeWordIndex + 2 < unitWords.length ? unitWords[activeWordIndex + 2] : null

        return [left2, left1, center, right1, right2]
      },

      setBookId: async (bookId: string) => {
        let book = await db.books.get(bookId)
        if (!book) {
          const builtin = BUILTIN_BOOKS.find((b) => b.id === bookId) || BUILTIN_BOOKS[0]
          const dynamicTotal = await dictionaryLoader.getBookTotalWords(builtin.id)
          book = { ...builtin, totalWords: dynamicTotal }
        }
        set({
          currentBookId: bookId,
          currentBook: book,
          currentUnitIndex: 0,
          activeWordIndex: 0,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          isErrorPracticeActive: false,
          retryWordQueue: [],
          currentWordRemainingLoops: get().loopCountSetting,
        })
        await get().loadCurrentUnitWords()
      },

      setUnitIndex: async (unitIndex: number) => {
        set({
          currentUnitIndex: unitIndex,
          activeWordIndex: 0,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          isErrorPracticeActive: false,
          retryWordQueue: [],
          currentWordRemainingLoops: get().loopCountSetting,
        })
        await get().loadCurrentUnitWords()
      },

      setMode: (mode: PracticeMode) => {
        set({ mode, currentInput: '', hasTypo: false })
      },

      setLoopCountSetting: (count: 1 | 2 | 3 | 5) => {
        set({ loopCountSetting: count, currentWordRemainingLoops: count })
      },

      toggleTranslation: () => {
        set((state) => ({ isTranslationVisible: !state.isTranslationVisible }))
      },

      setPhoneticPreference: (pref: 'us' | 'uk') => {
        set({ phoneticPreference: pref })
      },

      setInput: (input: string) => set({ currentInput: input }),
      setTypo: (typo: boolean) => set({ hasTypo: typo }),
      setImportModalOpen: (open: boolean) => set({ isImportModalOpen: open }),
      setSettingsModalOpen: (open: boolean) => set({ isSettingsModalOpen: open }),
      setKeySoundPack: (pack: string) => set({ keySoundPack: pack }),
      setKeySoundVolume: (vol: number) => set({ keySoundVolume: vol }),
      toggleKeySound: (enabled?: boolean) => set((s) => ({ isKeySoundEnabled: enabled !== undefined ? enabled : !s.isKeySoundEnabled })),

      handleCharacterInput: (char: string) => {
        const {
          currentInput,
          hasTypo,
          isKeySoundEnabled,
          keySoundPack,
          keySoundVolume,
          isWrongBeepEnabled,
          feedbackVolume,
          mode,
          currentBookId,
          currentWordRemainingLoops,
          isCorrectSoundEnabled,
        } = get()

        if (hasTypo) return

        const currentWord = get().getCurrentWord()
        if (!currentWord) return

        const targetWord = currentWord.name
        const nextInput = currentInput + char

        // 播放机械键盘敲击音
        if (isKeySoundEnabled) {
          audioEngine.playKeySound(keySoundPack, keySoundVolume)
        }

        // 校验输入前缀是否正确
        if (targetWord.toLowerCase().startsWith(nextInput.toLowerCase())) {
          set({ currentInput: nextInput })

          // 如果打完整个单词
          if (nextInput.length === targetWord.length) {
            recordWordAttempt(currentWord.id, currentBookId, true, mode, currentWord)

            if (currentWordRemainingLoops > 1) {
              if (isCorrectSoundEnabled) {
                audioEngine.playCorrectSound(feedbackVolume)
              }
              setTimeout(() => {
                set({
                  currentInput: '',
                  currentWordRemainingLoops: currentWordRemainingLoops - 1,
                })
              }, 150)
            } else {
              if (isCorrectSoundEnabled) {
                audioEngine.playCorrectSound(feedbackVolume)
              }
              setTimeout(() => {
                get().nextWord()
              }, 200)
            }
          }
        } else {
          // 输错：触发蜂鸣音 + 震动 + 200ms 清空重打
          if (isWrongBeepEnabled) {
            audioEngine.playBeepSound(feedbackVolume)
          }

          set({ hasTypo: true })

          if (mode === 'dictation') {
            recordWordAttempt(currentWord.id, currentBookId, false, mode, currentWord)
            set((state) => {
              const inQueue = state.retryWordQueue.some((w) => w.id === currentWord.id)
              return inQueue ? {} : { retryWordQueue: [...state.retryWordQueue, currentWord] }
            })
          }

          setTimeout(() => {
            set({ currentInput: '', hasTypo: false })
          }, 220)
        }
      },

      handleBackspace: () => {
        const { currentInput, hasTypo } = get()
        if (!hasTypo && currentInput.length > 0) {
          set({ currentInput: currentInput.slice(0, -1) })
        }
      },

      peekHint: (show: boolean) => {
        const { mode, currentBookId } = get()
        const currentWord = get().getCurrentWord()
        set({ isPeeking: show })
        if (show && mode === 'dictation' && currentWord) {
          recordWordAttempt(currentWord.id, currentBookId, false, mode, currentWord)
          set((state) => {
            const inQueue = state.retryWordQueue.some((w) => w.id === currentWord.id)
            return inQueue ? {} : { retryWordQueue: [...state.retryWordQueue, currentWord] }
          })
        }
      },

      replayAudio: () => {
        const currentWord = get().getCurrentWord()
        const { phoneticPreference, audioRate } = get()
        if (currentWord) {
          audioEngine.playPronunciation(currentWord.name, phoneticPreference, audioRate)
        }
      },

      starCurrentWord: async () => {
        const currentWord = get().getCurrentWord()
        const { currentBookId } = get()
        if (!currentWord) return false
        return await toggleStarWord(currentWord.id, currentBookId)
      },

      nextWord: () => {
        const unitWords = get().getUnitWords()
        const { activeWordIndex, loopCountSetting, isAutoPlayAudio, phoneticPreference } = get()

        if (activeWordIndex < unitWords.length - 1) {
          const nextIndex = activeWordIndex + 1
          set({
            activeWordIndex: nextIndex,
            currentInput: '',
            hasTypo: false,
            currentWordRemainingLoops: loopCountSetting,
          })

          const nextWord = unitWords[nextIndex]
          if (nextWord && isAutoPlayAudio) {
            audioEngine.playPronunciation(nextWord.name, phoneticPreference)
          }

          const prefetchTarget = unitWords[nextIndex + 1]
          if (prefetchTarget) {
            audioEngine.prefetchWordAudio(prefetchTarget.name, phoneticPreference)
          }
        } else {
          set({ isUnitFinished: true })
        }
      },

      prevWord: () => {
        const { activeWordIndex, loopCountSetting } = get()
        if (activeWordIndex > 0) {
          set({
            activeWordIndex: activeWordIndex - 1,
            currentInput: '',
            hasTypo: false,
            currentWordRemainingLoops: loopCountSetting,
          })
        }
      },

      restartUnit: () => {
        set({
          activeWordIndex: 0,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          retryWordQueue: [],
          currentWordRemainingLoops: get().loopCountSetting,
        })
      },
    }),
    {
      name: 'mywords-workspace-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentBookId: state.currentBookId,
        currentUnitIndex: state.currentUnitIndex,
        mode: state.mode,
        loopCountSetting: state.loopCountSetting,
        isTranslationVisible: state.isTranslationVisible,
        phoneticPreference: state.phoneticPreference,
        isAutoPlayAudio: state.isAutoPlayAudio,
        keySoundPack: state.keySoundPack,
        keySoundVolume: state.keySoundVolume,
        isKeySoundEnabled: state.isKeySoundEnabled,
        isWrongBeepEnabled: state.isWrongBeepEnabled,
        isCorrectSoundEnabled: state.isCorrectSoundEnabled,
        feedbackVolume: state.feedbackVolume,
      }),
    }
  )
)
