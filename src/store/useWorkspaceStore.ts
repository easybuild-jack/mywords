import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DictationCueMode, PracticeMode, WordItem, VocabularyBook, ShortcutConfig, WordEtymology } from '@/types'
import { isAutoAudioMuted, isMeaningStepActive } from '@/lib/dictationCue'
import { BUILTIN_BOOKS, INITIAL_SAMPLE_WORDS } from '@/resources/books'
import { BUILTIN_ROOTS } from '@/resources/roots'
import { db, recordWordAttempt, toggleStarWord, eliminateErrorWord, saveWordOverride } from '@/db'
import { audioEngine } from '@/core/audioEngine'
import { dictionaryLoader } from '@/core/dictionaryLoader'
import { DEFAULT_SHORTCUTS } from '@/lib/shortcuts'
import { validatePhonetic, validateMeaning } from '@/lib/dictationValidator'

/**
 * 学习页与默写页各自维护一份练习进度，错词攻坚再单独占一份。
 * activeWordIndex / isUnitFinished 始终代表「当前页面」的实时进度，
 * cursors 只是另外两个页面的存档位，在切页的瞬间做一次存取。
 */
export type PracticeCursorKey = 'learn' | 'dictation' | 'error'

interface PracticeCursor {
  activeWordIndex: number
  isUnitFinished: boolean
}

const EMPTY_CURSOR: PracticeCursor = { activeWordIndex: 0, isUnitFinished: false }

function createFreshCursors(): Record<PracticeCursorKey, PracticeCursor> {
  return {
    learn: { ...EMPTY_CURSOR },
    dictation: { ...EMPTY_CURSOR },
    error: { ...EMPTY_CURSOR },
  }
}

/** 跟学时单词就在眼前，抄一遍即可；默写要靠三连对建立肌肉记忆 */
const DEFAULT_LOOP_COUNTS: Record<PracticeMode, 1 | 2 | 3 | 5> = {
  learn: 1,
  dictation: 3,
}

/** 校验失败的抖动提示持续时长 */
const VALIDATION_ERROR_FLASH_MS = 900

/** 切词与切页时都要清掉的默写闯关中间态 */
const DICTATION_STEP_RESET = {
  dictationPhoneticInput: '',
  dictationMeaningInput: '',
  isPhoneticPassed: false,
  isMeaningPassed: false,
  isPhoneticFocused: false,
  isPhoneticError: false,
  isMeaningError: false,
}

interface WorkspaceState {
  // 核心书籍与单元选择
  currentBookId: string
  currentBook: VocabularyBook
  currentUnitIndex: number
  unitSize: number
  activeWordIndex: number
  currentLoadedWords: WordItem[]
  cursors: Record<PracticeCursorKey, PracticeCursor>
  
  // 模式与做题控制
  mode: PracticeMode
  /** 当前页面生效的循环次数，切页时与 loopCounts 互相存取 */
  loopCountSetting: 1 | 2 | 3 | 5
  /** 学习页与默写页各自记住自己的循环次数：跟学一遍即可，默写默认三连对 */
  loopCounts: Record<PracticeMode, 1 | 2 | 3 | 5>
  currentWordRemainingLoops: number
  dictationCueMode: DictationCueMode
  phoneticPreference: 'us' | 'uk'

  // 默写模式音标与译文输入增强
  isDictationPhoneticEnabled: boolean
  isDictationMeaningEnabled: boolean
  dictationPhoneticInput: string
  dictationMeaningInput: string
  isPhoneticPassed: boolean
  isMeaningPassed: boolean
  isPhoneticFocused: boolean
  /**
   * 校验失败的抖动提示。放在 store 而不是卡片局部 state，
   * 因为浮动 IPA 键盘上的「校验」按钮在卡片之外，否则那条路径永远没有失败反馈。
   */
  isPhoneticError: boolean
  isMeaningError: boolean
  
  // 自定义快捷键配置
  shortcuts: ShortcutConfig
  
  // 击键输入状态
  currentInput: string
  hasTypo: boolean
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
  // 攻坚强制 3 连对，退出后要还原用户自己的循环次数
  loopCountBeforeErrorPractice: 1 | 2 | 3 | 5 | null

  // 弹窗状态
  isImportModalOpen: boolean
  isSettingsModalOpen: boolean

  // 当前皮肤（仅配色，皮肤选择会被持久化）
  skinId: string
  setSkinId: (skinId: string) => void

  // 方法定义
  setBookId: (bookId: string) => Promise<void>
  setUnitIndex: (unitIndex: number) => Promise<void>
  loadCurrentUnitWords: () => Promise<void>
  startErrorPractice: (words: WordItem[], startIndex?: number) => void
  startErrorLearnPractice: (words: WordItem[], startIndex?: number) => void
  exitErrorPractice: () => Promise<void>
  enterMode: (mode: PracticeMode) => Promise<void>
  setLoopCountSetting: (count: 1 | 2 | 3 | 5) => void
  setDictationCueMode: (cueMode: DictationCueMode) => void
  /** 听音模式下主动播一遍当前词，用于进入默写页与切换线索模式时补线索 */
  playDictationCue: () => void
  /** 主动播放当前词读音（遵循自动播放与静音规则） */
  playCurrentWordAudio: () => void
  setPhoneticPreference: (pref: 'us' | 'uk') => void
  toggleDictationPhonetic: (enabled?: boolean) => void
  toggleDictationMeaning: (enabled?: boolean) => void
  setDictationPhoneticInput: (input: string) => void
  setDictationMeaningInput: (input: string) => void
  setIsPhoneticFocused: (focused: boolean) => void
  submitPhonetic: (overrideInput?: string) => boolean
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

  // 词根学习状态 (Roots Module)
  activeRootIndex: number
  learnedRootIds: string[]
  rootSearchQuery: string
  isRootSearchModalOpen: boolean
  
  // 词根方法
  setRootIndex: (index: number) => void
  prevRoot: () => void
  nextRoot: () => void
  toggleRootLearned: (rootId?: string) => void
  setRootSearchQuery: (query: string) => void
  setRootSearchModalOpen: (open: boolean) => void
  restartRoots: () => void

  // 音节切分展示与弹窗控制 (仅当前单词有效，切词自动重置)
  isCurrentWordSplit: boolean
  isEditWordSplitModalOpen: boolean
  toggleCurrentWordSplit: () => void
  setEditWordSplitModalOpen: (open: boolean) => void

  updateWordSplit: (wordId: string, updates: { syllables: string[]; etymology?: WordEtymology; silentIndices?: number[] }) => Promise<void>

  getUnitWords: () => WordItem[]
  getCurrentWord: () => WordItem | undefined
}

/** 错词攻坚借用默写页的全部逻辑，但进度单独存档，退出后默写页回到原来的位置 */
function activeCursorKey(get: () => WorkspaceState): PracticeCursorKey {
  return get().isErrorPracticeActive ? 'error' : get().mode
}

/** 把某一页的循环次数写回存档位 */
function withLoopCount(
  counts: Record<PracticeMode, 1 | 2 | 3 | 5>,
  mode: PracticeMode,
  count: 1 | 2 | 3 | 5
): Record<PracticeMode, 1 | 2 | 3 | 5> {
  return {
    learn: mode === 'learn' ? count : counts.learn,
    dictation: mode === 'dictation' ? count : counts.dictation,
  }
}

/** 退出攻坚时把被强制改成 3 的循环次数还原成用户自己的设置 */
function restoreLoopCount(get: () => WorkspaceState) {
  const restored = get().loopCountBeforeErrorPractice ?? get().loopCountSetting
  return {
    loopCountSetting: restored,
    loopCounts: withLoopCount(get().loopCounts, get().mode, restored),
    loopCountBeforeErrorPractice: null,
    currentWordRemainingLoops: restored,
  }
}

/** 把当前页面的实时进度写回存档位，供离开前调用 */
function saveActiveCursor(get: () => WorkspaceState): Record<PracticeCursorKey, PracticeCursor> {
  return {
    ...get().cursors,
    [activeCursorKey(get)]: {
      activeWordIndex: get().activeWordIndex,
      isUnitFinished: get().isUnitFinished,
    },
  }
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // 新用户默认落在列表第一本「基础词汇」上，id 与对象必须取自同一本，否则加载的词和显示的词库名会对不上
      currentBookId: BUILTIN_BOOKS[0].id,
      currentBook: BUILTIN_BOOKS[0],
      currentUnitIndex: 0,
      unitSize: 20,
      activeWordIndex: 0,
      currentLoadedWords: INITIAL_SAMPLE_WORDS,
      cursors: createFreshCursors(),
      
      mode: 'learn',
      loopCountSetting: DEFAULT_LOOP_COUNTS.learn,
      loopCounts: { ...DEFAULT_LOOP_COUNTS },
      currentWordRemainingLoops: DEFAULT_LOOP_COUNTS.learn,
      dictationCueMode: 'listen',
      phoneticPreference: 'us',
      
      shortcuts: DEFAULT_SHORTCUTS,
      
      currentInput: '',
      hasTypo: false,
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
      skinId: 'slate-mint',
      isErrorPracticeActive: false,
      conqueredErrorWordIds: [],
      loopCountBeforeErrorPractice: null,

      // 音节切分与编辑弹窗（仅作用于当前单词）
      isCurrentWordSplit: false,
      isEditWordSplitModalOpen: false,

      // 词根学习状态初始值
      activeRootIndex: 0,
      learnedRootIds: [],
      rootSearchQuery: '',
      isRootSearchModalOpen: false,

      isDictationPhoneticEnabled: true,
      isDictationMeaningEnabled: true,
      ...DICTATION_STEP_RESET,

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
        const entryIndex = Math.min(Math.max(startIndex, 0), words.length - 1)

        const wasActive = get().isErrorPracticeActive
        // 攻坚一律以默写形式进行：先把离开页面的循环次数存档，再从默写页那一档取用户设置。
        // 重复发起攻坚时当前的 3 是被强制的值，不能当成用户设置存回去。
        const loopCounts = wasActive
          ? get().loopCounts
          : withLoopCount(get().loopCounts, get().mode, get().loopCountSetting)

        set({
          cursors: {
            ...saveActiveCursor(get),
            error: { activeWordIndex: entryIndex, isUnitFinished: false },
          },
          isErrorPracticeActive: true,
          mode: 'dictation',
          loopCounts,
          loopCountSetting: 3,
          // 从「从学习页直接发起攻坚」的场景也能还原出默写页自己的设置
          loopCountBeforeErrorPractice: wasActive
            ? get().loopCountBeforeErrorPractice
            : loopCounts.dictation,
          currentLoadedWords: words,
          conqueredErrorWordIds: [],
          activeWordIndex: entryIndex,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          retryWordQueue: [],
          currentWordRemainingLoops: 3,
          ...DICTATION_STEP_RESET,
        })
      },

      startErrorLearnPractice: (words: WordItem[], startIndex: number = 0) => {
        if (!words.length) return
        const entryIndex = Math.min(Math.max(startIndex, 0), words.length - 1)

        const wasActive = get().isErrorPracticeActive
        const loopCounts = wasActive
          ? get().loopCounts
          : withLoopCount(get().loopCounts, get().mode, get().loopCountSetting)

        const learnLoop = loopCounts.learn

        set({
          cursors: {
            ...saveActiveCursor(get),
            error: { activeWordIndex: entryIndex, isUnitFinished: false },
          },
          isErrorPracticeActive: true,
          mode: 'learn',
          loopCounts,
          loopCountSetting: learnLoop,
          loopCountBeforeErrorPractice: null,
          currentLoadedWords: words,
          conqueredErrorWordIds: [],
          activeWordIndex: entryIndex,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          retryWordQueue: [],
          currentWordRemainingLoops: learnLoop,
          ...DICTATION_STEP_RESET,
        })
      },

      exitErrorPractice: async () => {
        // 攻坚或错词练习结束回到对应模式原来的位置与循环次数，攻坚存档位清空
        const isDictation = get().mode === 'dictation'
        const restored = isDictation ? get().cursors.dictation : get().cursors.learn

        set({
          isErrorPracticeActive: false,
          conqueredErrorWordIds: [],
          cursors: { ...get().cursors, error: { ...EMPTY_CURSOR } },
          activeWordIndex: restored.activeWordIndex,
          isUnitFinished: restored.isUnitFinished,
          currentInput: '',
          hasTypo: false,
          retryWordQueue: [],
          ...restoreLoopCount(get),
          ...DICTATION_STEP_RESET,
        })

        await get().loadCurrentUnitWords()

        // 章节词数可能少于存档下来的位置，越界就退回最后一个词
        const total = get().currentLoadedWords.length
        if (get().activeWordIndex > total - 1) {
          set({ activeWordIndex: Math.max(0, total - 1) })
        }
      },

      getUnitWords: () => {
        return get().currentLoadedWords
      },

      getCurrentWord: () => {
        const { currentLoadedWords, activeWordIndex } = get()
        return currentLoadedWords[activeWordIndex]
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
          // 换书意味着两个页面的进度都失效
          cursors: createFreshCursors(),
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          isCurrentWordSplit: false,
          isEditWordSplitModalOpen: false,
          // 换书直接中断攻坚，循环次数一并还原
          isErrorPracticeActive: false,
          retryWordQueue: [],
          ...restoreLoopCount(get),
          ...DICTATION_STEP_RESET,
        })
        await get().loadCurrentUnitWords()

        const { isAutoPlayAudio, mode, dictationCueMode, phoneticPreference, audioRate } = get()
        const canPlayAudio = isAutoPlayAudio && !isAutoAudioMuted(mode, dictationCueMode)
        const firstWord = get().getCurrentWord()
        if (firstWord && canPlayAudio) {
          audioEngine.playPronunciation(firstWord.name, phoneticPreference, audioRate)
        }
        const nextWord = get().currentLoadedWords[1]
        if (nextWord) {
          audioEngine.prefetchWordAudio(nextWord.name, phoneticPreference)
        }
      },

      setUnitIndex: async (unitIndex: number) => {
        set({
          currentUnitIndex: unitIndex,
          activeWordIndex: 0,
          cursors: createFreshCursors(),
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          isCurrentWordSplit: false,
          isEditWordSplitModalOpen: false,
          isErrorPracticeActive: false,
          retryWordQueue: [],
          ...restoreLoopCount(get),
          ...DICTATION_STEP_RESET,
        })
        await get().loadCurrentUnitWords()

        const { isAutoPlayAudio, mode, dictationCueMode, phoneticPreference, audioRate } = get()
        const canPlayAudio = isAutoPlayAudio && !isAutoAudioMuted(mode, dictationCueMode)
        const firstWord = get().getCurrentWord()
        if (firstWord && canPlayAudio) {
          audioEngine.playPronunciation(firstWord.name, phoneticPreference, audioRate)
        }
        const nextWord = get().currentLoadedWords[1]
        if (nextWord) {
          audioEngine.prefetchWordAudio(nextWord.name, phoneticPreference)
        }
      },

      /**
       * 由路由驱动的模式切换：学习页与默写页各自在挂载时声明自己的模式。
       * 两个页面的练习进度互相独立，切页时存档并载入对应的游标。
       */
      enterMode: async (nextMode: PracticeMode) => {
        if (get().isErrorPracticeActive) {
          // 同模式下保留错词练习现场；跨模式切换则视为离开错词练习
          if (get().mode === nextMode) return
          await get().exitErrorPractice()
        }

        if (get().mode === nextMode) return

        const cursors = saveActiveCursor(get)
        const target = cursors[nextMode]
        // 循环次数与游标一样按页面存档：默写页的三连对不该跟着跑到学习页
        const loopCounts = withLoopCount(get().loopCounts, get().mode, get().loopCountSetting)
        const nextLoopCount = loopCounts[nextMode]

        set({
          mode: nextMode,
          cursors,
          loopCounts,
          loopCountSetting: nextLoopCount,
          activeWordIndex: target.activeWordIndex,
          isUnitFinished: target.isUnitFinished,
          currentInput: '',
          hasTypo: false,
          isPeeking: false,
          retryWordQueue: [],
          currentWordRemainingLoops: nextLoopCount,
          ...DICTATION_STEP_RESET,
        })

        const total = get().currentLoadedWords.length
        if (get().activeWordIndex > total - 1) {
          set({ activeWordIndex: Math.max(0, total - 1) })
        }
      },

      setLoopCountSetting: (count: 1 | 2 | 3 | 5) => {
        // 错词攻坚在默写模式下锁定为 3 次
        if (get().isErrorPracticeActive && get().mode === 'dictation') return
        set({
          loopCountSetting: count,
          loopCounts: withLoopCount(get().loopCounts, get().mode, count),
          currentWordRemainingLoops: count,
        })
      },

      setDictationCueMode: (cueMode: DictationCueMode) => {
        if (get().dictationCueMode === cueMode) return
        // 两个模式的译文环节要求不同，切换时把当前词的闯关进度归零重来
        set({ dictationCueMode: cueMode, currentInput: '', hasTypo: false, ...DICTATION_STEP_RESET })
        // 译文刚被藏起来、发音又还没响的话，屏幕上会无从下手
        get().playDictationCue()
      },

      playDictationCue: () => {
        const { mode, dictationCueMode, isAutoPlayAudio, phoneticPreference, audioRate } = get()
        const currentWord = get().getCurrentWord()
        if (!currentWord || !isAutoPlayAudio) return
        if (mode !== 'dictation' || dictationCueMode !== 'listen') return
        audioEngine.playPronunciation(currentWord.name, phoneticPreference, audioRate)
      },

      playCurrentWordAudio: () => {
        const { mode, dictationCueMode, isAutoPlayAudio, phoneticPreference, audioRate } = get()
        const canPlayAudio = isAutoPlayAudio && !isAutoAudioMuted(mode, dictationCueMode)
        const currentWord = get().getCurrentWord()
        if (!currentWord || !canPlayAudio) return
        audioEngine.playPronunciation(currentWord.name, phoneticPreference, audioRate)
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
        // 看译文模式下该环节已被强制关闭，开关不接受操作
        if (get().dictationCueMode === 'meaning') return
        set((s) => ({
          isDictationMeaningEnabled: enabled !== undefined ? enabled : !s.isDictationMeaningEnabled,
        }))
      },

      setDictationPhoneticInput: (input: string) => set({ dictationPhoneticInput: input }),
      setDictationMeaningInput: (input: string) => set({ dictationMeaningInput: input }),
      setIsPhoneticFocused: (focused: boolean) => set({ isPhoneticFocused: focused }),

      submitPhonetic: (overrideInput?: string) => {
        const currentWord = get().getCurrentWord()
        const inputToValidate = overrideInput !== undefined ? overrideInput : get().dictationPhoneticInput
        if (!currentWord) return false
        const isValid = validatePhonetic(inputToValidate, currentWord.phoneticUs, currentWord.phoneticUk)
        if (isValid) {
          set({
            dictationPhoneticInput: inputToValidate,
            isPhoneticPassed: true,
            isPhoneticFocused: false,
            isPhoneticError: false,
          })
          // 音标能写对，说明读音已经掌握，这一遍不算送答案，当作过关奖励直接念出来。
          audioEngine.playPronunciationOnce(currentWord.name, get().phoneticPreference, get().audioRate)
          return true
        }
        set({ isPhoneticError: true })
        setTimeout(() => set({ isPhoneticError: false }), VALIDATION_ERROR_FLASH_MS)
        return false
      },

      submitMeaning: () => {
        const currentWord = get().getCurrentWord()
        const { dictationMeaningInput } = get()
        if (!currentWord) return false
        const isValid = validateMeaning(dictationMeaningInput, currentWord)
        if (isValid) {
          set({ isMeaningPassed: true, isMeaningError: false })
          return true
        }
        set({ isMeaningError: true })
        setTimeout(() => set({ isMeaningError: false }), VALIDATION_ERROR_FLASH_MS)
        return false
      },

      resetDictationStepStates: () => {
        set({ ...DICTATION_STEP_RESET })
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
      setSkinId: (skinId: string) => set({ skinId }),
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
          dictationCueMode,
        } = get()

        if (hasTypo) return

        // 默写模式下前置校验拦截
        if (mode === 'dictation') {
          if (isDictationPhoneticEnabled && !isPhoneticPassed) return
          if (isMeaningStepActive(dictationCueMode, isDictationMeaningEnabled) && !isMeaningPassed) return
        }

        const currentWord = get().getCurrentWord()
        if (!currentWord) return

        const targetWord = currentWord.name

        // 打满的词正在等待正音与切词，这段空窗期的多余击键要直接吞掉。
        // 否则会被当成拼错，白扣一次记录并重置循环次数。
        if (currentInput.length >= targetWord.length) return

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
              // 达到消灭标准（打满当前循环次数）
              if (isCorrectSoundEnabled) {
                audioEngine.playCorrectSound(feedbackVolume)
              }
              if (isErrorPracticeActive && mode === 'dictation') {
                eliminateErrorWord(currentWord.id)
                const updatedConquered = Array.from(new Set([...get().conqueredErrorWordIds, currentWord.id]))
                set({ conqueredErrorWordIds: updatedConquered })
              }

              // 默写通关后先把刚写对的词念一遍做正音，念完才切下一个词。
              // 看译文模式不自动出声，直接沿用原来的短延迟。
              const needsConfirmAudio = mode === 'dictation' && !isAutoAudioMuted(mode, dictationCueMode)
              const completedIndex = get().activeWordIndex
              const completedId = currentWord.id

              setTimeout(async () => {
                if (needsConfirmAudio) {
                  await audioEngine.playPronunciationOnce(currentWord.name, get().phoneticPreference, get().audioRate)
                }
                // 正音期间用户可能已经手动切词，此时不能再多跳一个
                const latest = get()
                if (latest.activeWordIndex === completedIndex && latest.getCurrentWord()?.id === completedId) {
                  latest.nextWord()
                }
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
            const { isErrorPracticeActive, conqueredErrorWordIds, mode: currentMode } = get()
            const isDictationError = isErrorPracticeActive && currentMode === 'dictation'
            set({
              currentInput: '',
              hasTypo: false,
              // 错词攻坚默写模式下，一旦输错立刻重置回 3 次连对循环
              currentWordRemainingLoops: isDictationError ? 3 : get().loopCountSetting,
              conqueredErrorWordIds: isDictationError && currentWord
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
        // 手动发音不分模式：看译文模式也允许随时听，只是不会自动响
        if (!currentWord) return
        audioEngine.playPronunciation(currentWord.name, phoneticPreference, audioRate)
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
          mode,
          dictationCueMode,
        } = get()

        if (!unitWords.length) {
          set({ isUnitFinished: true })
          return
        }

        // 听音模式靠这一声作为听写线索；看译文模式要听得由用户自己点，不自动送
        const canPlayAudio = isAutoPlayAudio && !isAutoAudioMuted(mode, dictationCueMode)

        // ==========================================
        // 错词攻坚专项模式逻辑 (仅默写模式下按 3-streak 消灭查找)
        // ==========================================
        if (isErrorPracticeActive && mode === 'dictation') {
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
              ...DICTATION_STEP_RESET,
            })

            const nextWord = unitWords[nextIndex]
            if (nextWord && canPlayAudio) {
              audioEngine.playPronunciation(nextWord.name, phoneticPreference)
            }
          } else {
            set({ isUnitFinished: true })
          }
          return
        }

        // ==========================================
        // 常规章节学习逻辑 (以及错词跟学练习模式)
        // ==========================================
        if (activeWordIndex < unitWords.length - 1) {
          const nextIndex = activeWordIndex + 1
          set({
            activeWordIndex: nextIndex,
            currentInput: '',
            hasTypo: false,
            isCurrentWordSplit: false,
            isEditWordSplitModalOpen: false,
            currentWordRemainingLoops: loopCountSetting,
            ...DICTATION_STEP_RESET,
          })

          const nextWord = unitWords[nextIndex]
          if (nextWord && canPlayAudio) {
            audioEngine.playPronunciation(nextWord.name, phoneticPreference)
          }

          // 任何模式都可能手动点发音，音频提前备好，不再按模式挑
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
        const {
          activeWordIndex,
          loopCountSetting,
          isErrorPracticeActive,
          isAutoPlayAudio,
          mode,
          dictationCueMode,
          phoneticPreference,
        } = get()

        const canPlayAudio = isAutoPlayAudio && !isAutoAudioMuted(mode, dictationCueMode)

        let targetIndex = -1

        if (activeWordIndex > 0) {
          targetIndex = activeWordIndex - 1
        } else if (isErrorPracticeActive && mode === 'dictation' && unitWords.length > 1) {
          // 错词默写模式下在第 0 个往前按，循环回到最后一个
          targetIndex = unitWords.length - 1
        }

        if (targetIndex !== -1) {
          set({
            activeWordIndex: targetIndex,
            currentInput: '',
            hasTypo: false,
            isCurrentWordSplit: false,
            isEditWordSplitModalOpen: false,
            currentWordRemainingLoops: isErrorPracticeActive && mode === 'dictation' ? 3 : loopCountSetting,
            ...DICTATION_STEP_RESET,
          })

          const targetWord = unitWords[targetIndex]
          if (targetWord && canPlayAudio) {
            audioEngine.playPronunciation(targetWord.name, phoneticPreference)
          }

          const prefetchTarget = unitWords[targetIndex - 1]
          if (prefetchTarget) {
            audioEngine.prefetchWordAudio(prefetchTarget.name, phoneticPreference)
          }
        }
      },

      restartUnit: () => {
        const isDictationError = get().isErrorPracticeActive && get().mode === 'dictation'
        set({
          activeWordIndex: 0,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          isCurrentWordSplit: false,
          isEditWordSplitModalOpen: false,
          retryWordQueue: [],
          currentWordRemainingLoops: isDictationError ? 3 : get().loopCountSetting,
          conqueredErrorWordIds: [],
          ...DICTATION_STEP_RESET,
        })

        const { isAutoPlayAudio, mode, dictationCueMode, phoneticPreference, audioRate } = get()
        const canPlayAudio = isAutoPlayAudio && !isAutoAudioMuted(mode, dictationCueMode)
        const firstWord = get().getCurrentWord()
        if (firstWord && canPlayAudio) {
          audioEngine.playPronunciation(firstWord.name, phoneticPreference, audioRate)
        }
        const nextWord = get().currentLoadedWords[1]
        if (nextWord) {
          audioEngine.prefetchWordAudio(nextWord.name, phoneticPreference)
        }
      },

      // 词根模块专属操作
      setRootIndex: (index: number) => {
        const total = BUILTIN_ROOTS.length
        if (total === 0) return
        const safeIndex = Math.max(0, Math.min(index, total - 1))
        set({ activeRootIndex: safeIndex })
      },

      prevRoot: () => {
        const { activeRootIndex } = get()
        if (activeRootIndex > 0) {
          set({ activeRootIndex: activeRootIndex - 1 })
        }
      },

      nextRoot: () => {
        const { activeRootIndex } = get()
        if (activeRootIndex < BUILTIN_ROOTS.length - 1) {
          set({ activeRootIndex: activeRootIndex + 1 })
        }
      },

      toggleRootLearned: (rootId?: string) => {
        const currentRoot = BUILTIN_ROOTS[get().activeRootIndex]
        const targetId = rootId || currentRoot?.id
        if (!targetId) return
        const { learnedRootIds } = get()
        const isLearned = learnedRootIds.includes(targetId)
        const updated = isLearned
          ? learnedRootIds.filter((id) => id !== targetId)
          : [...learnedRootIds, targetId]
        set({ learnedRootIds: updated })
      },

      setRootSearchQuery: (query: string) => set({ rootSearchQuery: query }),
      setRootSearchModalOpen: (open: boolean) => set({ isRootSearchModalOpen: open }),
      restartRoots: () => set({ activeRootIndex: 0 }),

      toggleCurrentWordSplit: () => set((s) => ({ isCurrentWordSplit: !s.isCurrentWordSplit })),
      setEditWordSplitModalOpen: (open: boolean) => set({ isEditWordSplitModalOpen: open }),

      updateWordSplit: async (wordId: string, updates: { syllables: string[]; etymology?: WordEtymology; silentIndices?: number[] }) => {
        const { currentLoadedWords, currentBook, currentBookId } = get()
        const targetWord = currentLoadedWords.find((w) => w.id === wordId)
        if (!targetWord) return

        const updatedWords = currentLoadedWords.map((w) => {
          if (w.id === wordId) {
            return {
              ...w,
              syllables: updates.syllables,
              etymology: updates.etymology !== undefined ? updates.etymology : w.etymology,
              silentIndices: updates.silentIndices !== undefined ? updates.silentIndices : w.silentIndices,
            }
          }
          return w
        })

        let updatedBook = currentBook
        const isCustomBook = Boolean(currentBook?.isCustom)

        if (isCustomBook && currentBook?.words) {
          const updatedBookWords = currentBook.words.map((w) => {
            if (w.id === wordId) {
              return {
                ...w,
                syllables: updates.syllables,
                etymology: updates.etymology !== undefined ? updates.etymology : w.etymology,
                silentIndices: updates.silentIndices !== undefined ? updates.silentIndices : w.silentIndices,
              }
            }
            return w
          })
          updatedBook = { ...currentBook, words: updatedBookWords }
        }

        set({
          currentLoadedWords: updatedWords,
          currentBook: updatedBook,
        })

        if (isCustomBook) {
          // 自定义词库：持久化保存到本地 IndexedDB
          await saveWordOverride(wordId, targetWord.name, updates)
        } else {
          // 自带官方词库：直接通过 API 更新并写回 public/dicts/*.json 文件！
          try {
            await fetch('/api/dict/update-word', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookId: currentBookId,
                wordName: targetWord.name,
                syllables: updates.syllables,
                silentIndices: updates.silentIndices,
                etymology: updates.etymology,
              }),
            })
            dictionaryLoader.clearCache()
          } catch (err) {
            console.warn('Failed to update dict JSON via API, fallback to local override:', err)
            await saveWordOverride(wordId, targetWord.name, updates)
          }
        }
      },
    }),
    {
      name: 'mywords-workspace-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<WorkspaceState>) || {}
        // 旧版本只有一个全局 loopCountSetting，把它接到学习页那一档，
        // 默写页则直接采用新的三连对默认值
        const loopCounts = {
          ...DEFAULT_LOOP_COUNTS,
          ...(persisted.loopCountSetting ? { learn: persisted.loopCountSetting } : {}),
          ...(persisted.loopCounts ?? {}),
        }
        const shortcuts = {
          ...DEFAULT_SHORTCUTS,
          ...(persisted.shortcuts ?? {}),
        }
        // 刷新后一律从学习页起步，生效的循环次数取学习页那一档
        const loopCount = loopCounts.learn
        return {
          ...currentState,
          ...persisted,
          shortcuts,
          loopCounts,
          loopCountSetting: loopCount,
          currentWordRemainingLoops: loopCount,
          currentInput: '',
          hasTypo: false,
          // 模式由路由决定，不接受任何持久化值（含旧版本残留的 mode）
          mode: currentState.mode,
          cursors: createFreshCursors(),
          ...DICTATION_STEP_RESET,
        }
      },
      partialize: (state) => ({
        skinId: state.skinId,
        currentBookId: state.currentBookId,
        currentUnitIndex: state.currentUnitIndex,
        loopCounts: state.loopCounts,
        dictationCueMode: state.dictationCueMode,
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
        activeRootIndex: state.activeRootIndex,
        learnedRootIds: state.learnedRootIds,
      }),
    }
  )
)
