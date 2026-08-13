import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PracticeMode, WordItem, VocabularyBook, ShortcutConfig } from '@/types'
import { BUILTIN_BOOKS, INITIAL_SAMPLE_WORDS } from '@/resources/books'
import { db, recordWordAttempt, toggleStarWord, eliminateErrorWord } from '@/db'
import { audioEngine } from '@/core/audioEngine'
import { dictionaryLoader } from '@/core/dictionaryLoader'
import { DEFAULT_SHORTCUTS } from '@/lib/shortcuts'
import { validatePhonetic, validateMeaning } from '@/lib/dictationValidator'

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

  // 默写模式音标与译文输入增强
  isDictationPhoneticEnabled: boolean
  isDictationMeaningEnabled: boolean
  dictationPhoneticInput: string
  dictationMeaningInput: string
  isPhoneticPassed: boolean
  isMeaningPassed: boolean
  isPhoneticFocused: boolean
  
  // 自定义快捷键配置
  shortcuts: ShortcutConfig
  
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
  conqueredErrorWordIds: string[]

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
  toggleDictationPhonetic: (enabled?: boolean) => void
  toggleDictationMeaning: (enabled?: boolean) => void
  setDictationPhoneticInput: (input: string) => void
  setDictationMeaningInput: (input: string) => void
  setIsPhoneticFocused: (focused: boolean) => void
  submitPhonetic: () => boolean
  submitMeaning: () => boolean
  resetDictationStepStates: () => void
  setInput: (input: string) => void
  setTypo: (typo: boolean) => void
  setShortcut: (action: keyof ShortcutConfig, keyStr: string) => void
  resetShortcuts: () => void
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
      
      shortcuts: DEFAULT_SHORTCUTS,
      
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
      conqueredErrorWordIds: [],

      isDictationPhoneticEnabled: true,
      isDictationMeaningEnabled: true,
      dictationPhoneticInput: '',
      dictationMeaningInput: '',
      isPhoneticPassed: false,
      isMeaningPassed: false,
      isPhoneticFocused: false,

      loadCurrentUnitWords: async () => {
        const { isErrorPracticeActive, currentBookId, currentBook, currentUnitIndex, unitSize, loopCountSetting } = get()
        // 错词攻坚模式下不被常规章节覆盖
        if (isErrorPracticeActive) return

        if (currentBook?.isCustom && currentBook.words?.length) {
          const start = currentUnitIndex * unitSize
          const slice = currentBook.words.slice(start, start + unitSize)
          set({
            currentLoadedWords: slice.length ? slice : currentBook.words,
            currentWordRemainingLoops: loopCountSetting,
          })
        } else {
          // 官方大词库动态加载
          const loaded = await dictionaryLoader.loadBookUnitWords(currentBookId, currentUnitIndex, unitSize)
          const dynamicTotal = await dictionaryLoader.getBookTotalWords(currentBookId)
          const builtin = BUILTIN_BOOKS.find((b) => b.id === currentBookId)
          if (currentBook) {
            set({
              currentBook: {
                ...currentBook,
                name: builtin ? builtin.name : currentBook.name,
                description: builtin ? builtin.description : currentBook.description,
                totalWords: dynamicTotal > 0 ? dynamicTotal : currentBook.totalWords,
              },
            })
          }
          if (loaded.length > 0) {
            set({
              currentLoadedWords: loaded,
              currentWordRemainingLoops: loopCountSetting,
            })
          } else {
            set({
              currentLoadedWords: INITIAL_SAMPLE_WORDS,
              currentWordRemainingLoops: loopCountSetting,
            })
          }
        }
      },

      startErrorPractice: (words: WordItem[], startIndex: number = 0) => {
        if (!words.length) return
        set({
          isErrorPracticeActive: true,
          mode: 'dictation',
          loopCountSetting: 3,
          currentLoadedWords: words,
          conqueredErrorWordIds: [],
          activeWordIndex: Math.min(startIndex, words.length - 1),
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          retryWordQueue: [],
          currentWordRemainingLoops: 3,
        })
      },

      exitErrorPractice: async () => {
        set({
          isErrorPracticeActive: false,
          conqueredErrorWordIds: [],
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          retryWordQueue: [],
          currentWordRemainingLoops: get().loopCountSetting,
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
        const builtin = BUILTIN_BOOKS.find((b) => b.id === bookId)
        let book: VocabularyBook
        if (builtin) {
          const dynamicTotal = await dictionaryLoader.getBookTotalWords(builtin.id)
          book = { ...builtin, totalWords: dynamicTotal > 0 ? dynamicTotal : builtin.totalWords }
          try {
            await db.books.delete(bookId)
          } catch {}
        } else {
          const custom = await db.books.get(bookId)
          book = custom || BUILTIN_BOOKS[0]
        }

        set({
          currentBookId: book.id,
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
        // 错词攻坚模式下强制锁定为默写模式，不允许切换为跟学
        if (get().isErrorPracticeActive) return
        set({ mode, currentInput: '', hasTypo: false, currentWordRemainingLoops: get().loopCountSetting })
      },

      setLoopCountSetting: (count: 1 | 2 | 3 | 5) => {
        // 错词攻坚模式下锁定为 3 次
        if (get().isErrorPracticeActive) return
        set({ loopCountSetting: count, currentWordRemainingLoops: count })
      },

      toggleTranslation: () => {
        set((state) => ({ isTranslationVisible: !state.isTranslationVisible }))
      },

      setPhoneticPreference: (pref: 'us' | 'uk') => {
        set({ phoneticPreference: pref })
      },

      toggleDictationPhonetic: (enabled?: boolean) => {
        set((s) => {
          const nextVal = enabled !== undefined ? enabled : !s.isDictationPhoneticEnabled
          return { isDictationPhoneticEnabled: nextVal, isPhoneticFocused: false }
        })
      },

      toggleDictationMeaning: (enabled?: boolean) => {
        set((s) => ({
          isDictationMeaningEnabled: enabled !== undefined ? enabled : !s.isDictationMeaningEnabled,
        }))
      },

      setDictationPhoneticInput: (input: string) => set({ dictationPhoneticInput: input }),
      setDictationMeaningInput: (input: string) => set({ dictationMeaningInput: input }),
      setIsPhoneticFocused: (focused: boolean) => set({ isPhoneticFocused: focused }),

      submitPhonetic: () => {
        const currentWord = get().getCurrentWord()
        const { dictationPhoneticInput } = get()
        if (!currentWord) return false
        const isValid = validatePhonetic(dictationPhoneticInput, currentWord.phoneticUs, currentWord.phoneticUk)
        if (isValid) {
          set({ isPhoneticPassed: true, isPhoneticFocused: false })
          return true
        }
        return false
      },

      submitMeaning: () => {
        const currentWord = get().getCurrentWord()
        const { dictationMeaningInput } = get()
        if (!currentWord) return false
        const isValid = validateMeaning(dictationMeaningInput, currentWord)
        if (isValid) {
          set({ isMeaningPassed: true })
          return true
        }
        return false
      },

      resetDictationStepStates: () => {
        set({
          dictationPhoneticInput: '',
          dictationMeaningInput: '',
          isPhoneticPassed: false,
          isMeaningPassed: false,
          isPhoneticFocused: false,
        })
      },

      setInput: (input: string) => set({ currentInput: input }),
      setTypo: (typo: boolean) => set({ hasTypo: typo }),
      setShortcut: (action: keyof ShortcutConfig, keyStr: string) => {
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [action]: keyStr,
          },
        }))
      },
      resetShortcuts: () => set({ shortcuts: DEFAULT_SHORTCUTS }),
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
          isErrorPracticeActive,
          isDictationPhoneticEnabled,
          isPhoneticPassed,
          isDictationMeaningEnabled,
          isMeaningPassed,
        } = get()

        if (hasTypo) return

        // 默写模式下前置校验拦截
        if (mode === 'dictation') {
          if (isDictationPhoneticEnabled && !isPhoneticPassed) return
          if (isDictationMeaningEnabled && !isMeaningPassed) return
        }

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
              // 达到消灭标准 (连续 3 次默写正确)
              if (isCorrectSoundEnabled) {
                audioEngine.playCorrectSound(feedbackVolume)
              }
              if (isErrorPracticeActive) {
                eliminateErrorWord(currentWord.id)
                const updatedConquered = Array.from(new Set([...get().conqueredErrorWordIds, currentWord.id]))
                set({ conqueredErrorWordIds: updatedConquered })
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
            const { isErrorPracticeActive, conqueredErrorWordIds } = get()
            set({
              currentInput: '',
              hasTypo: false,
              // 错词攻坚模式下，一旦输错立刻重置回 3 次连对循环
              currentWordRemainingLoops: isErrorPracticeActive ? 3 : get().loopCountSetting,
              conqueredErrorWordIds: isErrorPracticeActive && currentWord
                ? conqueredErrorWordIds.filter((id) => id !== currentWord.id)
                : conqueredErrorWordIds,
            })
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
        const { mode, currentBookId, isErrorPracticeActive, conqueredErrorWordIds } = get()
        const currentWord = get().getCurrentWord()
        set({ isPeeking: show })
        if (show && currentWord) {
          if (isErrorPracticeActive) {
            // 偷看提示同样重置 3 次连对循环，并取消消灭标记
            set({
              currentWordRemainingLoops: 3,
              conqueredErrorWordIds: conqueredErrorWordIds.filter((id) => id !== currentWord.id),
            })
          }
          if (mode === 'dictation') {
            recordWordAttempt(currentWord.id, currentBookId, false, mode, currentWord)
            set((state) => {
              const inQueue = state.retryWordQueue.some((w) => w.id === currentWord.id)
              return inQueue ? {} : { retryWordQueue: [...state.retryWordQueue, currentWord] }
            })
          }
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
        const {
          activeWordIndex,
          loopCountSetting,
          isAutoPlayAudio,
          phoneticPreference,
          isErrorPracticeActive,
          conqueredErrorWordIds,
        } = get()

        if (!unitWords.length) {
          set({ isUnitFinished: true })
          return
        }

        // ==========================================
        // 错词攻坚专项模式逻辑
        // ==========================================
        if (isErrorPracticeActive) {
          // 检查是否所有错词均已攻克消灭
          const allConquered = unitWords.every((w) => conqueredErrorWordIds.includes(w.id))
          if (allConquered) {
            set({ isUnitFinished: true })
            return
          }

          // 优先向后查找下一个未消灭的错词
          let nextIndex = -1
          for (let i = activeWordIndex + 1; i < unitWords.length; i++) {
            if (!conqueredErrorWordIds.includes(unitWords[i].id)) {
              nextIndex = i
              break
            }
          }

          // 若向后未找到（如刚刚攻克最后一个词），则从第 0 个循环向前找未消灭的词
          if (nextIndex === -1) {
            for (let i = 0; i <= activeWordIndex; i++) {
              if (!conqueredErrorWordIds.includes(unitWords[i].id)) {
                nextIndex = i
                break
              }
            }
          }

          if (nextIndex !== -1) {
            set({
              activeWordIndex: nextIndex,
              currentInput: '',
              hasTypo: false,
              currentWordRemainingLoops: 3,
              dictationPhoneticInput: '',
              dictationMeaningInput: '',
              isPhoneticPassed: false,
              isMeaningPassed: false,
              isPhoneticFocused: false,
            })

            const nextWord = unitWords[nextIndex]
            if (nextWord && isAutoPlayAudio) {
              audioEngine.playPronunciation(nextWord.name, phoneticPreference)
            }
          } else {
            set({ isUnitFinished: true })
          }
          return
        }

        // ==========================================
        // 常规章节学习逻辑
        // ==========================================
        if (activeWordIndex < unitWords.length - 1) {
          const nextIndex = activeWordIndex + 1
          set({
            activeWordIndex: nextIndex,
            currentInput: '',
            hasTypo: false,
            currentWordRemainingLoops: loopCountSetting,
            dictationPhoneticInput: '',
            dictationMeaningInput: '',
            isPhoneticPassed: false,
            isMeaningPassed: false,
            isPhoneticFocused: false,
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
        const unitWords = get().getUnitWords()
        const { activeWordIndex, loopCountSetting, isErrorPracticeActive } = get()
        if (activeWordIndex > 0) {
          set({
            activeWordIndex: activeWordIndex - 1,
            currentInput: '',
            hasTypo: false,
            currentWordRemainingLoops: isErrorPracticeActive ? 3 : loopCountSetting,
            dictationPhoneticInput: '',
            dictationMeaningInput: '',
            isPhoneticPassed: false,
            isMeaningPassed: false,
            isPhoneticFocused: false,
          })
        } else if (isErrorPracticeActive && unitWords.length > 1) {
          // 错词模式下在第 0 个往前按，循环回到最后一个
          set({
            activeWordIndex: unitWords.length - 1,
            currentInput: '',
            hasTypo: false,
            currentWordRemainingLoops: 3,
            dictationPhoneticInput: '',
            dictationMeaningInput: '',
            isPhoneticPassed: false,
            isMeaningPassed: false,
            isPhoneticFocused: false,
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
          currentWordRemainingLoops: get().isErrorPracticeActive ? 3 : get().loopCountSetting,
          conqueredErrorWordIds: [],
          dictationPhoneticInput: '',
          dictationMeaningInput: '',
          isPhoneticPassed: false,
          isMeaningPassed: false,
          isPhoneticFocused: false,
        })
      },
    }),
    {
      name: 'mywords-workspace-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<WorkspaceState>) || {}
        const loopCount = persisted.isErrorPracticeActive
          ? 3
          : (persisted.loopCountSetting ?? currentState.loopCountSetting ?? 1)
        return {
          ...currentState,
          ...persisted,
          currentWordRemainingLoops: loopCount,
          currentInput: '',
          hasTypo: false,
          dictationPhoneticInput: '',
          dictationMeaningInput: '',
          isPhoneticPassed: false,
          isMeaningPassed: false,
          isPhoneticFocused: false,
        }
      },
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
        shortcuts: state.shortcuts,
        isDictationPhoneticEnabled: state.isDictationPhoneticEnabled,
        isDictationMeaningEnabled: state.isDictationMeaningEnabled,
      }),
    }
  )
)
