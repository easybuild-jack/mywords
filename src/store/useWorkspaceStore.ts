import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DictUnit, DictationCueMode, PracticeMode, WordItem, VocabularyBook, ShortcutConfig, WordEtymology } from '@/types'
import { isAutoAudioMuted, isMeaningStepActive } from '@/lib/dictationCue'
import { BUILTIN_BOOKS, INITIAL_SAMPLE_WORDS } from '@/resources/books'
import { BUILTIN_ROOTS, ROOT_DATA_MAP, type RootTabType } from '@/resources/roots'
import { db, recordWordAttempt, toggleStarWord, eliminateErrorWord, saveWordOverride, deleteCustomVocabularyBook, reconcileUnitProgressRecord, markUnitWordCompleted, markUnitWordForRetry, clearUnitProgress } from '@/db'
import { audioEngine } from '@/core/audioEngine'
import { buildFixedUnitId, dictionaryLoader } from '@/core/dictionaryLoader'
import { DEFAULT_SHORTCUTS } from '@/lib/shortcuts'
import { validatePhonetic, validateMeaning } from '@/lib/dictationValidator'
import { isCurrentAuthor, getSyncToken } from '@/lib/permissions'

/**
 * 学习页与默写页各自维护一份练习进度，错词攻坚再单独占一份。
 * activeWordIndex / isUnitFinished 始终代表「当前页面」的实时进度，
 * cursors 只是另外两个页面的存档位，在切页的瞬间做一次存取。
 */
export type PracticeCursorKey = 'learn' | 'dictation' | 'phonetic' | 'error'

export interface BookModeUnitRecord {
  learn: number
  dictation: number
  phonetic: number
}

interface PracticeCursor {
  unitIndex: number
  activeWordIndex: number
  isUnitFinished: boolean
  hasLiveState: boolean
  retryWordIds: string[]
  isUnitRetrying: boolean
}

const EMPTY_CURSOR: PracticeCursor = {
  unitIndex: 0,
  activeWordIndex: 0,
  isUnitFinished: false,
  hasLiveState: false,
  retryWordIds: [],
  isUnitRetrying: false,
}

function createFreshCursors(initialUnits?: Partial<Record<PracticeMode, number>>): Record<PracticeCursorKey, PracticeCursor> {
  return {
    learn: { ...EMPTY_CURSOR, unitIndex: initialUnits?.learn ?? 0 },
    dictation: { ...EMPTY_CURSOR, unitIndex: initialUnits?.dictation ?? 0 },
    phonetic: { ...EMPTY_CURSOR, unitIndex: initialUnits?.phonetic ?? 0 },
    error: { ...EMPTY_CURSOR },
  }
}

/** 把单元序号夹到 [0, count-1]：旧进度是按「每 20 词一章」存的，在语义单元目录下可能越界 */
function clampUnitIndex(unitIndex: number, count: number): number {
  if (count <= 0) return 0
  return Math.min(Math.max(0, unitIndex), count - 1)
}

/**
 * 算出进入单元后该落到第几个词。
 *
 * unitProgress 只记录「逐字敲完」的词，所以第一个未完成的词就是真正的断点 ——
 * 浏览时用切换键翻过去的词不在存档里，刷新后不会被当成学习进度。
 *
 * 返回 null 表示这次加载不需要动位置（没有语义单元的词库没有断点可恢复，
 * 同一个单元重复加载也保留页面内现场）。
 */
async function resolveUnitResumeState(params: {
  bookId: string
  mode: PracticeMode
  unitMeta: DictUnit | null
  words: WordItem[]
  liveIndex: number
  liveFinished: boolean
  liveRetryWords: WordItem[]
  liveIsRetrying: boolean
  loadedUnitKey: string | null
}): Promise<{
  activeWordIndex: number
  isUnitFinished: boolean
  retryWordQueue: WordItem[]
  isUnitRetrying: boolean
  loadedUnitKey: string | null
} | null> {
  const { bookId, mode, unitMeta, words } = params
  if (!unitMeta || words.length === 0) return null

  const unitKey = `${bookId}|${unitMeta.id}|${mode}`
  const clampIndex = (index: number) => Math.min(Math.max(0, index), words.length - 1)

  // 同一个单元+模式还在练：保留现场（页面内翻词的位置也是现场的一部分）
  if (params.loadedUnitKey === unitKey) {
    return {
      activeWordIndex: clampIndex(params.liveIndex),
      isUnitFinished: params.liveFinished,
      retryWordQueue: params.liveRetryWords,
      isUnitRetrying: params.liveIsRetrying,
      loadedUnitKey: unitKey,
    }
  }

  const record = await reconcileUnitProgressRecord({
    bookId,
    unitId: unitMeta.id,
    mode,
    unitWordIds: words.map((word) => word.id),
  })
  if (!record) {
    return {
      activeWordIndex: 0,
      isUnitFinished: false,
      retryWordQueue: [],
      isUnitRetrying: false,
      loadedUnitKey: unitKey,
    }
  }

  const completedIds = new Set(record.completedWordIds)
  const retryIds = new Set(record.retryWordIds)
  const retryWordQueue = words.filter((word) => retryIds.has(word.id))
  const firstPending = words.findIndex((word) => !completedIds.has(word.id))
  // 单元里的词确实全被敲完过：直接落在结算卡上，想再练一遍要点「重做本单元」
  if (firstPending === -1) {
    return {
      activeWordIndex: words.length - 1,
      isUnitFinished: true,
      retryWordQueue: [],
      isUnitRetrying: false,
      loadedUnitKey: unitKey,
    }
  }

  const savedIndex = clampIndex(record.currentWordIndex)
  const isUnitRetrying = record.isRetrying === true && retryWordQueue.length > 0
  const activeWordIndex = isUnitRetrying
    ? words.findIndex((word) => retryIds.has(word.id))
    : retryWordQueue.length > 0
      ? savedIndex
      : firstPending

  return {
    activeWordIndex: activeWordIndex >= 0 ? activeWordIndex : firstPending,
    isUnitFinished: false,
    retryWordQueue,
    isUnitRetrying,
    loadedUnitKey: unitKey,
  }
}

/**
 * 把「敲完一个词」记进单元断点存档。
 *
 * 错词攻坚不属于常规单元，直接跳过；其他词库都有语义或固定切片单元 ID。
 */
async function persistCompletedWord(get: () => WorkspaceState, wordId: string, wordIndex: number) {
  const state = get()
  const { isErrorPracticeActive, currentBookId, currentUnitMeta, mode, currentLoadedWords } = state
  if (isErrorPracticeActive || !currentUnitMeta) return null

  const deferForRetry =
    mode === 'dictation' &&
    !state.isUnitRetrying &&
    state.retryWordQueue.some((word) => word.id === wordId)
  const record = await markUnitWordCompleted({
    bookId: currentBookId,
    unitId: currentUnitMeta.id,
    mode,
    wordId,
    wordIndex,
    unitWordIds: currentLoadedWords.map((word) => word.id),
    deferForRetry,
  })
  // 即使 IndexedDB 写入失败，也保留本次本地推进所需的重考语义。
  return { record, deferForRetry }
}

function persistRetryWord(get: () => WorkspaceState, wordId: string, wordIndex: number) {
  const { isErrorPracticeActive, currentBookId, currentUnitMeta, mode } = get()
  if (isErrorPracticeActive || !currentUnitMeta || mode !== 'dictation') return
  void markUnitWordForRetry({
    bookId: currentBookId,
    unitId: currentUnitMeta.id,
    mode,
    wordId,
    wordIndex,
  })
}

/** 跟学时单词就在眼前，抄一遍即可；默写要靠三连对建立肌肉记忆 */
const DEFAULT_LOOP_COUNTS: Record<PracticeMode, 1 | 2 | 3 | 5> = {
  learn: 1,
  dictation: 3,
  phonetic: 1,
}

/** 校验失败的抖动提示持续时长 */
const VALIDATION_ERROR_FLASH_MS = 900
let latestUnitLoadSequence = 0
let latestPracticeActionSequence = 0

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
  /** 当前单元定义；无语义目录的词库会生成稳定的固定切片单元 ID */
  currentUnitMeta: DictUnit | null
  /**
   * 当前已载入的单元标识 `${bookId}|${unitId}|${mode}`。
   * 同一个单元被重复加载（路由来回切、开发环境重复挂载）时据此跳过断点恢复，
   * 免得把页面内已经翻到的位置顶掉；换了单元/词库/模式才按 unitProgress 重新定位。
   */
  loadedUnitKey: string | null
  cursors: Record<PracticeCursorKey, PracticeCursor>
  /** 各词库在各做题模式下最后访问的单元序号 */
  bookModeProgress: Record<string, BookModeUnitRecord>
  getBookModeUnit: (bookId: string, mode: PracticeMode) => number
  commitBookAndUnit: (bookId: string, unitIndex: number, targetMode: PracticeMode) => Promise<void>
  
  // 单元与词库加载过渡控制
  isUnitLoading: boolean
  unitLoadingTarget: { bookName: string; unitIndex: number; mode: PracticeMode } | null
  setIsUnitLoading: (loading: boolean, target?: { bookName: string; unitIndex: number; mode: PracticeMode } | null) => void
  
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
  isUnitRetrying: boolean
  
  // 音效与多媒体配置
  isAutoPlayAudio: boolean
  audioRate: number
  keySoundPack: string
  keySoundVolume: number
  isKeySoundEnabled: boolean
  isWrongBeepEnabled: boolean
  isCorrectSoundEnabled: boolean
  feedbackVolume: number
  isPhoneticSoundEnabled: boolean
  phoneticSoundVolume: number

  // 错词攻坚专项模式
  isErrorPracticeActive: boolean
  conqueredErrorWordIds: string[]
  // 攻坚强制 3 连对，退出后要还原用户自己的循环次数
  loopCountBeforeErrorPractice: 1 | 2 | 3 | 5 | null

  // 弹窗状态
  isImportModalOpen: boolean
  isSettingsModalOpen: boolean
  settingsInitialTab: 'audio' | 'voice' | 'appearance' | 'shortcuts' | 'learn' | 'ai' | 'sync' | null

  // 当前皮肤（仅配色，皮肤选择会被持久化）
  skinId: string
  setSkinId: (skinId: string) => void

  // 方法定义
  setBookId: (bookId: string) => Promise<void>
  deleteCustomBook: (bookId: string) => Promise<boolean>
  setUnitIndex: (unitIndex: number) => Promise<void>
  /** 返回本次实际应用的加载序号；null 表示请求已过期或处于错词练习 */
  loadCurrentUnitWords: () => Promise<number | null>
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
  appendPhoneticSymbol: (sym: string) => void
  backspacePhonetic: () => void
  clearPhonetic: () => void
  submitPhoneticDictation: () => boolean
  submitMeaning: () => boolean
  resetDictationStepStates: () => void
  setInput: (input: string) => void
  setTypo: (typo: boolean) => void
  setShortcut: (action: keyof ShortcutConfig, keyStr: string) => void
  resetShortcuts: () => void
  setImportModalOpen: (open: boolean) => void
  setSettingsModalOpen: (open: boolean, tab?: 'audio' | 'voice' | 'appearance' | 'shortcuts' | 'learn' | 'ai' | 'sync') => void
  setKeySoundPack: (pack: string) => void
  setKeySoundVolume: (vol: number) => void
  toggleKeySound: (enabled?: boolean) => void
  togglePhoneticSound: (enabled?: boolean) => void
  setPhoneticSoundVolume: (vol: number) => void
  setAudioRate: (rate: number) => void
  
  // 练习与按键核心业务
  handleCharacterInput: (char: string) => void
  handleBackspace: () => void
  peekHint: (show: boolean) => void
  replayAudio: () => void
  starCurrentWord: () => Promise<boolean>
  starredWordIds: string[]
  syncStarredWordIds: () => Promise<void>
  nextWord: (result?: {
    completedCurrentWord?: boolean
    unitCompleted?: boolean
    completedWordIds?: string[]
  }) => void
  prevWord: () => void
  restartUnit: () => Promise<void>

  // 词根学习状态 (Roots Module)
  rootTab: RootTabType
  activeRootIndex: number
  learnedRootIds: string[]
  rootSearchQuery: string
  isRootSearchModalOpen: boolean
  
  // 词根方法
  setRootTab: (tab: RootTabType) => void
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

function practiceContextKey(state: WorkspaceState): string {
  const unitKey = state.currentUnitMeta?.id ?? String(state.currentUnitIndex)
  return `${state.currentBookId}|${unitKey}|${state.mode}|${state.isErrorPracticeActive ? 'error' : 'regular'}`
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
    phonetic: mode === 'phonetic' ? count : counts.phonetic,
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
      unitIndex: get().currentUnitIndex,
      activeWordIndex: get().activeWordIndex,
      isUnitFinished: get().isUnitFinished,
      hasLiveState: true,
      retryWordIds: get().retryWordQueue.map((word) => word.id),
      isUnitRetrying: get().isUnitRetrying,
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
      currentUnitMeta: null,
      loadedUnitKey: null,
      cursors: createFreshCursors(),
      bookModeProgress: {},
      
      mode: 'learn',
      loopCountSetting: DEFAULT_LOOP_COUNTS.learn,
      loopCounts: { ...DEFAULT_LOOP_COUNTS },
      currentWordRemainingLoops: DEFAULT_LOOP_COUNTS.learn,
      dictationCueMode: 'meaning',
      phoneticPreference: 'us',
      
      shortcuts: DEFAULT_SHORTCUTS,
      
      currentInput: '',
      hasTypo: false,
      isPeeking: false,
      isUnitFinished: false,
      retryWordQueue: [],
      isUnitRetrying: false,
      
      isAutoPlayAudio: true,
      audioRate: 1.0,
      keySoundPack: 'Cherry MX Blues',
      keySoundVolume: 0.8,
      isKeySoundEnabled: true,
      isWrongBeepEnabled: true,
      isCorrectSoundEnabled: true,
      feedbackVolume: 0.8,
      isPhoneticSoundEnabled: true,
      phoneticSoundVolume: 0.85,

      isImportModalOpen: false,
      isSettingsModalOpen: false,
      settingsInitialTab: null,
      skinId: 'slate-mint',
      isErrorPracticeActive: false,
      conqueredErrorWordIds: [],
      starredWordIds: [],
      loopCountBeforeErrorPractice: null,

      // 音节切分与编辑弹窗（仅作用于当前单词）
      isCurrentWordSplit: false,
      isEditWordSplitModalOpen: false,

      // 词根词缀学习状态初始值 (默认首项：前缀)
      rootTab: 'prefix',
      activeRootIndex: 0,
      learnedRootIds: [],
      rootSearchQuery: '',
      isRootSearchModalOpen: false,

      isDictationPhoneticEnabled: false,
      isDictationMeaningEnabled: true,
      isUnitLoading: false,
      unitLoadingTarget: null,
      setIsUnitLoading: (loading: boolean, target = null) =>
        set({ isUnitLoading: loading, unitLoadingTarget: target }),
      ...DICTATION_STEP_RESET,

      loadCurrentUnitWords: async () => {
        get().syncStarredWordIds()
        const { isErrorPracticeActive, currentBookId, currentBook, currentUnitIndex, unitSize, loopCountSetting, mode } = get()
        // 错词攻坚模式下不被常规章节覆盖
        if (isErrorPracticeActive) return null
        const loadSequence = ++latestUnitLoadSequence

        if (currentBook?.isCustom && currentBook.words?.length) {
          const unitCount = Math.max(1, Math.ceil(currentBook.words.length / unitSize))
          const safeUnitIndex = clampUnitIndex(currentUnitIndex, unitCount)
          const start = safeUnitIndex * unitSize
          const nextWords = currentBook.words.slice(start, start + unitSize)
          const unitMeta: DictUnit = {
            id: buildFixedUnitId(currentBookId, safeUnitIndex),
            name: `单元 ${safeUnitIndex + 1}`,
            order: safeUnitIndex,
            wordCount: nextWords.length,
          }
          const bookModeProgress = { ...get().bookModeProgress }
          if (safeUnitIndex !== currentUnitIndex) {
            bookModeProgress[currentBookId] = {
              ...(bookModeProgress[currentBookId] ?? { learn: 0, dictation: 0, phonetic: 0 }),
              [mode]: safeUnitIndex,
            }
          }
          const resume = await resolveUnitResumeState({
            bookId: currentBookId,
            mode,
            unitMeta,
            words: nextWords,
            liveIndex: get().activeWordIndex,
            liveFinished: get().isUnitFinished,
            liveRetryWords: get().retryWordQueue,
            liveIsRetrying: get().isUnitRetrying,
            loadedUnitKey: get().loadedUnitKey,
          })
          if (loadSequence !== latestUnitLoadSequence) return null
          set({
            currentUnitIndex: safeUnitIndex,
            currentLoadedWords: nextWords,
            currentWordRemainingLoops: loopCountSetting,
            currentUnitMeta: unitMeta,
            bookModeProgress,
            isUnitLoading: false,
            unitLoadingTarget: null,
            ...(resume ?? {}),
          })
          return loadSequence
        }

        // 官方大词库动态加载
        const units = await dictionaryLoader.loadBookUnits(currentBookId)
        const hasCatalog = units.length > 0
        // 带单元目录的词库里序号必须落在目录范围内：
        // 旧版本按「每 20 词一章」存下的进度在新目录下会越界，越界就读出空单元
        const safeUnitIndex = hasCatalog ? clampUnitIndex(currentUnitIndex, units.length) : currentUnitIndex
        const loaded = await dictionaryLoader.loadBookUnitWords(currentBookId, safeUnitIndex, unitSize)
        const unitMeta: DictUnit = hasCatalog
          ? units[safeUnitIndex]
          : {
              id: buildFixedUnitId(currentBookId, safeUnitIndex),
              name: `单元 ${safeUnitIndex + 1}`,
              order: safeUnitIndex,
              wordCount: loaded.length,
            }
        const dynamicTotal = await dictionaryLoader.getBookTotalWords(currentBookId)
        const builtin = BUILTIN_BOOKS.find((b) => b.id === currentBookId)

        // 序号被夹回来过一次就顺手纠正存档，否则词库页的「当前单元」高亮会和实际加载的对不上
        const bookModeProgress = { ...get().bookModeProgress }
        if (hasCatalog && safeUnitIndex !== currentUnitIndex) {
          if (!bookModeProgress[currentBookId]) {
            bookModeProgress[currentBookId] = { learn: 0, dictation: 0, phonetic: 0 }
          }
          bookModeProgress[currentBookId] = {
            ...bookModeProgress[currentBookId],
            [mode]: safeUnitIndex,
          }
        }

        const nextWords = loaded

        // 加载失败或固定切片越界时绝不能拿示例词校准真实进度。
        if (loaded.length === 0) {
          if (loadSequence !== latestUnitLoadSequence) return null
          set({
            currentUnitIndex: safeUnitIndex,
            currentUnitMeta: unitMeta,
            bookModeProgress,
            currentLoadedWords: [],
            activeWordIndex: 0,
            isUnitFinished: false,
            retryWordQueue: [],
            isUnitRetrying: false,
            loadedUnitKey: null,
            isUnitLoading: false,
            unitLoadingTarget: null,
          })
          return loadSequence
        }

        // 断点续学：只有逐字敲完的词才进 unitProgress，所以第一处未完成的词
        // 就是上次真正练到的地方，浏览翻过去的词不会被算成进度
        const resume = await resolveUnitResumeState({
          bookId: currentBookId,
          mode,
          unitMeta,
          words: nextWords,
          liveIndex: get().activeWordIndex,
          liveFinished: get().isUnitFinished,
          liveRetryWords: get().retryWordQueue,
          liveIsRetrying: get().isUnitRetrying,
          loadedUnitKey: get().loadedUnitKey,
        })

        if (loadSequence !== latestUnitLoadSequence) return null
        set({
          currentUnitIndex: safeUnitIndex,
          currentUnitMeta: unitMeta,
          bookModeProgress,
          ...(currentBook
            ? {
                currentBook: {
                  ...currentBook,
                  name: builtin ? builtin.name : currentBook.name,
                  description: builtin ? builtin.description : currentBook.description,
                  totalWords: dynamicTotal > 0 ? dynamicTotal : currentBook.totalWords,
                },
              }
            : {}),
          currentLoadedWords: nextWords,
          currentWordRemainingLoops: loopCountSetting,
          isUnitLoading: false,
          unitLoadingTarget: null,
          ...(resume ?? {}),
        })
        return loadSequence
      },

      startErrorPractice: (words: WordItem[], startIndex: number = 0) => {
        if (!words.length) return
        latestUnitLoadSequence += 1
        latestPracticeActionSequence += 1
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
            error: { ...EMPTY_CURSOR, activeWordIndex: entryIndex, hasLiveState: true },
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
          isUnitRetrying: false,
          currentWordRemainingLoops: 3,
          ...DICTATION_STEP_RESET,
        })
      },

      startErrorLearnPractice: (words: WordItem[], startIndex: number = 0) => {
        if (!words.length) return
        latestUnitLoadSequence += 1
        latestPracticeActionSequence += 1
        const entryIndex = Math.min(Math.max(startIndex, 0), words.length - 1)

        const wasActive = get().isErrorPracticeActive
        const loopCounts = wasActive
          ? get().loopCounts
          : withLoopCount(get().loopCounts, get().mode, get().loopCountSetting)

        const learnLoop = loopCounts.learn

        set({
          cursors: {
            ...saveActiveCursor(get),
            error: { ...EMPTY_CURSOR, activeWordIndex: entryIndex, hasLiveState: true },
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
          isUnitRetrying: false,
          currentWordRemainingLoops: learnLoop,
          ...DICTATION_STEP_RESET,
        })
      },

      exitErrorPractice: async () => {
        latestPracticeActionSequence += 1
        const actionSequence = latestPracticeActionSequence
        // 攻坚或错词练习结束回到对应模式原来的位置与循环次数，攻坚存档位清空
        const currentMode = get().mode
        const targetKey: PracticeCursorKey = currentMode === 'dictation' ? 'dictation' : (currentMode === 'phonetic' ? 'phonetic' : 'learn')
        const restored = get().cursors[targetKey]

        set({
          isErrorPracticeActive: false,
          conqueredErrorWordIds: [],
          cursors: { ...get().cursors, error: { ...EMPTY_CURSOR } },
          currentInput: '',
          hasTypo: false,
          retryWordQueue: [],
          isUnitRetrying: false,
          loadedUnitKey: null,
          ...restoreLoopCount(get),
          ...DICTATION_STEP_RESET,
        })

        const loadSequence = await get().loadCurrentUnitWords()
        if (
          loadSequence === null ||
          loadSequence !== latestUnitLoadSequence ||
          actionSequence !== latestPracticeActionSequence
        ) return

        // 语义/固定单元以 IndexedDB 断点为准；没有单元元数据的旧词库才退回内存游标。
        if (!get().currentUnitMeta) {
          const total = get().currentLoadedWords.length
          set({
            activeWordIndex: Math.min(Math.max(0, restored.activeWordIndex), Math.max(0, total - 1)),
            isUnitFinished: restored.isUnitFinished,
          })
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
        latestPracticeActionSequence += 1
        const actionSequence = latestPracticeActionSequence
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
        if (actionSequence !== latestPracticeActionSequence) return

        const bookModeProgress = { ...get().bookModeProgress }
        if (!bookModeProgress[book.id]) {
          bookModeProgress[book.id] = { learn: 0, dictation: 0, phonetic: 0 }
        }
        const activeMode = get().isErrorPracticeActive ? 'dictation' : get().mode
        const restoredUnitIndex = bookModeProgress[book.id][activeMode] ?? 0

        set({
          currentBookId: book.id,
          currentBook: book,
          currentUnitIndex: restoredUnitIndex,
          activeWordIndex: 0,
          // 换书等于重新进入一个单元，让下面的加载按新单元的断点重新定位
          loadedUnitKey: null,
          cursors: createFreshCursors(bookModeProgress[book.id]),
          bookModeProgress,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          isCurrentWordSplit: false,
          isEditWordSplitModalOpen: false,
          // 换书直接中断攻坚，循环次数一并还原
          isErrorPracticeActive: false,
          retryWordQueue: [],
          isUnitRetrying: false,
          ...restoreLoopCount(get),
          ...DICTATION_STEP_RESET,
        })
        const loadSequence = await get().loadCurrentUnitWords()
        if (
          loadSequence === null ||
          loadSequence !== latestUnitLoadSequence ||
          actionSequence !== latestPracticeActionSequence
        ) return

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

      deleteCustomBook: async (bookId: string) => {
        const { currentBookId, setBookId } = get()
        const success = await deleteCustomVocabularyBook(bookId)
        if (!success) return false

        // 若删除的恰好是当前正在学习的词库，平滑回退切到官方第一本默认词库
        if (currentBookId === bookId) {
          await setBookId(BUILTIN_BOOKS[0].id)
        }
        return true
      },

      getBookModeUnit: (bookId: string, mode: PracticeMode) => {
        const { bookModeProgress, currentBookId, currentUnitIndex, mode: currentMode, cursors } = get()
        const recorded = bookModeProgress[bookId]?.[mode]
        if (typeof recorded === 'number') return recorded
        if (bookId === currentBookId) {
          if (currentMode === mode) {
            return currentUnitIndex
          }
          if (typeof cursors?.[mode]?.unitIndex === 'number') {
            return cursors[mode].unitIndex
          }
          if (mode === 'learn') {
            return currentUnitIndex
          }
        }
        return 0
      },

      commitBookAndUnit: async (bookId: string, unitIndex: number, targetMode: PracticeMode) => {
        latestPracticeActionSequence += 1
        const actionSequence = latestPracticeActionSequence
        const builtin = BUILTIN_BOOKS.find((b) => b.id === bookId)
        let book: VocabularyBook
        if (builtin) {
          const dynamicTotal = await dictionaryLoader.getBookTotalWords(builtin.id)
          book = { ...builtin, totalWords: dynamicTotal > 0 ? dynamicTotal : builtin.totalWords }
        } else {
          const custom = await db.books.get(bookId)
          book = custom || BUILTIN_BOOKS[0]
        }
        if (actionSequence !== latestPracticeActionSequence) return

        set({
          isUnitLoading: true,
          unitLoadingTarget: {
            bookName: book.name,
            unitIndex,
            mode: targetMode,
          },
        })

        try {
          const bookModeProgress = { ...get().bookModeProgress }
          if (!bookModeProgress[book.id]) {
            bookModeProgress[book.id] = { learn: 0, dictation: 0, phonetic: 0 }
          }
          bookModeProgress[book.id] = {
            ...bookModeProgress[book.id],
            [targetMode]: unitIndex,
          }

          const cursors = { ...get().cursors }
          cursors[targetMode] = {
            ...EMPTY_CURSOR,
            unitIndex,
          }

          set({
            currentBookId: book.id,
            currentBook: book,
            mode: targetMode,
            currentUnitIndex: unitIndex,
            activeWordIndex: 0,
            // 从词库页点进来就是「进入这个单元」，按它的断点重新定位
            loadedUnitKey: null,
            cursors,
            bookModeProgress,
            currentInput: '',
            hasTypo: false,
            isUnitFinished: false,
            isCurrentWordSplit: false,
            isEditWordSplitModalOpen: false,
            isErrorPracticeActive: false,
            retryWordQueue: [],
            isUnitRetrying: false,
            ...restoreLoopCount(get),
            ...DICTATION_STEP_RESET,
          })

          const loadSequence = await get().loadCurrentUnitWords()
          if (loadSequence === null || loadSequence !== latestUnitLoadSequence) return
          if (actionSequence !== latestPracticeActionSequence) return

          const { isAutoPlayAudio, dictationCueMode, phoneticPreference, audioRate } = get()
          const canPlayAudio = isAutoPlayAudio && !isAutoAudioMuted(targetMode, dictationCueMode)
          const firstWord = get().getCurrentWord()
          if (firstWord && canPlayAudio) {
            audioEngine.playPronunciation(firstWord.name, phoneticPreference, audioRate)
          }
          const nextWord = get().currentLoadedWords[1]
          if (nextWord) {
            audioEngine.prefetchWordAudio(nextWord.name, phoneticPreference)
          }
        } finally {
          if (actionSequence === latestPracticeActionSequence) {
            set({ isUnitLoading: false, unitLoadingTarget: null })
          }
        }
      },

      setUnitIndex: async (unitIndex: number) => {
        latestPracticeActionSequence += 1
        const actionSequence = latestPracticeActionSequence
        const { currentBookId, mode, isErrorPracticeActive, bookModeProgress } = get()
        const targetMode = isErrorPracticeActive ? 'dictation' : mode
        const updatedProgress = { ...bookModeProgress }
        if (!updatedProgress[currentBookId]) {
          updatedProgress[currentBookId] = { learn: 0, dictation: 0, phonetic: 0 }
        }
        updatedProgress[currentBookId] = {
          ...updatedProgress[currentBookId],
          [targetMode]: unitIndex,
        }

        const cursors = { ...get().cursors }
        cursors[targetMode] = {
          ...EMPTY_CURSOR,
          unitIndex,
        }

        set({
          isUnitLoading: true,
          currentUnitIndex: unitIndex,
          activeWordIndex: 0,
          // 显式切单元也算重新进入，点了当前单元同样回到断点而不是停在原地
          loadedUnitKey: null,
          cursors,
          bookModeProgress: updatedProgress,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          isCurrentWordSplit: false,
          isEditWordSplitModalOpen: false,
          isErrorPracticeActive: false,
          retryWordQueue: [],
          isUnitRetrying: false,
          ...restoreLoopCount(get),
          ...DICTATION_STEP_RESET,
        })

        try {
          const loadSequence = await get().loadCurrentUnitWords()
          if (loadSequence === null || loadSequence !== latestUnitLoadSequence) return
          if (actionSequence !== latestPracticeActionSequence) return

          const { isAutoPlayAudio, dictationCueMode, phoneticPreference, audioRate } = get()
          const canPlayAudio = isAutoPlayAudio && !isAutoAudioMuted(mode, dictationCueMode)
          const firstWord = get().getCurrentWord()
          if (firstWord && canPlayAudio) {
            audioEngine.playPronunciation(firstWord.name, phoneticPreference, audioRate)
          }
          const nextWord = get().currentLoadedWords[1]
          if (nextWord) {
            audioEngine.prefetchWordAudio(nextWord.name, phoneticPreference)
          }
        } finally {
          if (actionSequence === latestPracticeActionSequence) {
            set({ isUnitLoading: false, unitLoadingTarget: null })
          }
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

        latestPracticeActionSequence += 1
        const actionSequence = latestPracticeActionSequence
        set({ isUnitLoading: true })

        try {
          const cursors = saveActiveCursor(get)
          const currentBookId = get().currentBookId
          const prevMode = get().mode
          const bookModeProgress = { ...get().bookModeProgress }
          if (!bookModeProgress[currentBookId]) {
            bookModeProgress[currentBookId] = { learn: 0, dictation: 0, phonetic: 0 }
          }
          if (!get().isErrorPracticeActive) {
            bookModeProgress[currentBookId] = {
              ...bookModeProgress[currentBookId],
              [prevMode]: get().currentUnitIndex,
            }
          }

          const targetCursor = cursors[nextMode]
          const targetUnitIndex = bookModeProgress[currentBookId]?.[nextMode] ?? targetCursor?.unitIndex ?? 0
          const isUnitDifferent = targetUnitIndex !== get().currentUnitIndex

          // 循环次数与游标一样按页面存档：默写页的三连对不该跟着跑到学习页
          const loopCounts = withLoopCount(get().loopCounts, get().mode, get().loopCountSetting)
          const nextLoopCount = loopCounts[nextMode]

          set({
            mode: nextMode,
            currentUnitIndex: targetUnitIndex,
            cursors,
            bookModeProgress,
            loopCounts,
            loopCountSetting: nextLoopCount,
            activeWordIndex: isUnitDifferent ? 0 : (targetCursor?.activeWordIndex ?? 0),
            isUnitFinished: isUnitDifferent ? false : (targetCursor?.isUnitFinished ?? false),
            currentInput: '',
            hasTypo: false,
            isPeeking: false,
            retryWordQueue: [],
            isUnitRetrying: false,
            loadedUnitKey: null,
            currentWordRemainingLoops: nextLoopCount,
            ...DICTATION_STEP_RESET,
          })

          let loadSequence: number | null = latestUnitLoadSequence
          if (isUnitDifferent || get().currentLoadedWords.length === 0) {
            loadSequence = await get().loadCurrentUnitWords()
          }
          if (loadSequence === null || loadSequence !== latestUnitLoadSequence) return
          if (actionSequence !== latestPracticeActionSequence) return

          const total = get().currentLoadedWords.length
          if (targetCursor?.hasLiveState && get().mode === nextMode && get().currentUnitIndex === targetUnitIndex) {
            const retryIds = new Set(targetCursor.retryWordIds)
            const unitMeta = get().currentUnitMeta
            set({
              activeWordIndex: Math.min(Math.max(0, targetCursor.activeWordIndex), Math.max(0, total - 1)),
              isUnitFinished: targetCursor.isUnitFinished,
              retryWordQueue: get().currentLoadedWords.filter((word) => retryIds.has(word.id)),
              isUnitRetrying: targetCursor.isUnitRetrying,
              loadedUnitKey: unitMeta ? `${currentBookId}|${unitMeta.id}|${nextMode}` : null,
            })
          } else if (get().activeWordIndex > total - 1) {
            set({ activeWordIndex: Math.max(0, total - 1) })
          }
        } finally {
          if (actionSequence === latestPracticeActionSequence) {
            set({ isUnitLoading: false, unitLoadingTarget: null })
          }
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

      setAudioRate: (rate: number) => {
        set({ audioRate: rate })
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

      appendPhoneticSymbol: (sym: string) => {
        set((s) => ({ dictationPhoneticInput: s.dictationPhoneticInput + sym }))
      },

      backspacePhonetic: () => {
        set((s) => ({ dictationPhoneticInput: s.dictationPhoneticInput.slice(0, -1) }))
      },

      clearPhonetic: () => {
        set({ dictationPhoneticInput: '', isPhoneticError: false })
      },

      submitPhoneticDictation: () => {
        const currentWord = get().getCurrentWord()
        const {
          dictationPhoneticInput,
          currentBookId,
          isCorrectSoundEnabled,
          isWrongBeepEnabled,
          feedbackVolume,
          currentWordRemainingLoops,
          phoneticPreference,
          audioRate,
        } = get()
        if (
          !currentWord ||
          (!currentWord.phoneticUs?.trim() && !currentWord.phoneticUk?.trim())
        ) return false
        const isValid = validatePhonetic(dictationPhoneticInput, currentWord.phoneticUs, currentWord.phoneticUk)
        if (isValid) {
          if (isCorrectSoundEnabled) {
            audioEngine.playKeySound('beep')
          }
          audioEngine.playPronunciationOnce(currentWord.name, phoneticPreference, audioRate)
          set({ isPhoneticPassed: true, isPhoneticError: false })

          if (currentWordRemainingLoops > 1) {
            setTimeout(() => {
              set((s) => ({
                currentWordRemainingLoops: s.currentWordRemainingLoops - 1,
                dictationPhoneticInput: '',
                isPhoneticPassed: false,
              }))
            }, 300)
          } else {
            recordWordAttempt(currentWord.id, currentBookId, true, 'phonetic', currentWord)
            const completedIndex = get().activeWordIndex
            const completedId = currentWord.id
            const completionContext = practiceContextKey(get())
            const completionActionSequence = latestPracticeActionSequence
            const progressPromise = persistCompletedWord(get, completedId, completedIndex)
            setTimeout(async () => {
              const saved = await progressPromise
              const latest = get()
              if (
                completionActionSequence === latestPracticeActionSequence &&
                practiceContextKey(latest) === completionContext &&
                latest.activeWordIndex === completedIndex &&
                latest.getCurrentWord()?.id === completedId
              ) {
                latest.nextWord({
                  completedCurrentWord: true,
                  unitCompleted: saved?.record?.status === 'completed',
                  completedWordIds: saved?.record?.completedWordIds,
                })
              }
            }, 350)
          }
          return true
        } else {
          if (isWrongBeepEnabled) {
            audioEngine.playBeepSound(feedbackVolume)
          }
          set({ isPhoneticError: true })
          recordWordAttempt(currentWord.id, currentBookId, false, 'phonetic', currentWord)
          setTimeout(() => set({ isPhoneticError: false }), VALIDATION_ERROR_FLASH_MS)
          return false
        }
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
      setSettingsModalOpen: (open: boolean, tab?: 'audio' | 'voice' | 'appearance' | 'shortcuts' | 'learn' | 'ai' | 'sync') =>
        set({ isSettingsModalOpen: open, settingsInitialTab: tab ?? null }),
      setSkinId: (skinId: string) => set({ skinId }),
      setKeySoundPack: (pack: string) => set({ keySoundPack: pack }),
      setKeySoundVolume: (vol: number) => set({ keySoundVolume: vol }),
      toggleKeySound: (enabled?: boolean) => set((s) => ({ isKeySoundEnabled: enabled !== undefined ? enabled : !s.isKeySoundEnabled })),
      togglePhoneticSound: (enabled?: boolean) => set((s) => ({ isPhoneticSoundEnabled: enabled !== undefined ? enabled : !s.isPhoneticSoundEnabled })),
      setPhoneticSoundVolume: (vol: number) => set({ phoneticSoundVolume: vol }),

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
          isDictationMeaningEnabled,
          isMeaningPassed,
          dictationCueMode,
        } = get()

        if (hasTypo) {
          // 错误时不能继续往下输入，播放提示音提示先退格修正
          if (isWrongBeepEnabled) {
            audioEngine.playBeepSound(feedbackVolume)
          }
          return
        }

        // 默写模式下前置校验拦截：若开启了译文输入环节，必须先通过译文校验后开启拼写
        if (mode === 'dictation') {
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
          set({ currentInput: nextInput, hasTypo: false })

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
              const completionContext = practiceContextKey(get())
              const completionActionSequence = latestPracticeActionSequence
              const progressPromise = persistCompletedWord(get, completedId, completedIndex)

              // 单元进度唯一的写入点：只有逐字敲完整词、打满循环次数才算完成。
              // 浏览、按切换键翻词、加星、重放发音都不产生学习进度。
              setTimeout(async () => {
                const saved = await progressPromise
                let latest = get()
                if (
                  completionActionSequence !== latestPracticeActionSequence ||
                  practiceContextKey(latest) !== completionContext ||
                  latest.activeWordIndex !== completedIndex ||
                  latest.getCurrentWord()?.id !== completedId
                ) {
                  return
                }
                if (saved && !saved.deferForRetry) {
                  set((state) => ({
                    retryWordQueue: state.retryWordQueue.filter((word) => word.id !== completedId),
                  }))
                }
                if (needsConfirmAudio) {
                  await audioEngine.playPronunciationOnce(currentWord.name, get().phoneticPreference, get().audioRate)
                }
                // 正音期间用户可能已经手动切词，此时不能再多跳一个
                latest = get()
                if (
                  completionActionSequence === latestPracticeActionSequence &&
                  practiceContextKey(latest) === completionContext &&
                  latest.activeWordIndex === completedIndex &&
                  latest.getCurrentWord()?.id === completedId
                ) {
                  latest.nextWord({
                    completedCurrentWord: true,
                    unitCompleted: saved?.record?.status === 'completed',
                    completedWordIds: saved?.record?.completedWordIds,
                  })
                }
              }, 200)
            }
          }
        } else {
          // 输错：保留用户输入并在错误处报红，不自动清空，阻止继续输入
          if (isWrongBeepEnabled) {
            audioEngine.playBeepSound(feedbackVolume)
          }

          set({
            currentInput: nextInput,
            hasTypo: true,
          })

          if (mode === 'dictation') {
            recordWordAttempt(currentWord.id, currentBookId, false, mode, currentWord)
            persistRetryWord(get, currentWord.id, get().activeWordIndex)
            set((state) => {
              const inQueue = state.retryWordQueue.some((w) => w.id === currentWord.id)
              return inQueue ? {} : { retryWordQueue: [...state.retryWordQueue, currentWord] }
            })

            const { isErrorPracticeActive, conqueredErrorWordIds } = get()
            if (isErrorPracticeActive && currentWord) {
              set({
                currentWordRemainingLoops: 3,
                conqueredErrorWordIds: conqueredErrorWordIds.filter((id) => id !== currentWord.id),
              })
            }
          }
        }
      },

      handleBackspace: () => {
        const { currentInput } = get()
        if (currentInput.length === 0) return

        const nextInput = currentInput.slice(0, -1)
        const currentWord = get().getCurrentWord()
        const targetWord = currentWord?.name || ''

        // 检查退格后的前缀是否符合目标词前缀
        const isNowCorrect = targetWord.toLowerCase().startsWith(nextInput.toLowerCase())

        set({
          currentInput: nextInput,
          hasTypo: !isNowCorrect,
        })
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
            persistRetryWord(get, currentWord.id, get().activeWordIndex)
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
        const { currentBookId, starredWordIds } = get()
        if (!currentWord) return false
        const nextStarred = await toggleStarWord(currentWord.id, currentBookId, currentWord)
        const nextList = nextStarred
          ? Array.from(new Set([...(starredWordIds || []), currentWord.id]))
          : (starredWordIds || []).filter((id) => id !== currentWord.id)
        set({ starredWordIds: nextList })
        return nextStarred
      },

      syncStarredWordIds: async () => {
        try {
          const records = await db.wordRecords.toArray()
          const starredIds = records.filter((r) => r.isStarred).map((r) => r.wordId)
          set({ starredWordIds: starredIds })
        } catch (err) {
          console.error('Failed to sync starred words:', err)
        }
      },

      /**
       * 翻到下一个词：纯浏览行为，不写单元进度。
       * 只有 handleCharacterInput 里逐字敲完整词那一次才计入 unitProgress。
       */
      nextWord: (result = {}) => {
        if (result.completedCurrentWord !== true) {
          latestPracticeActionSequence += 1
        }
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
          retryWordQueue,
          isUnitRetrying,
        } = get()
        const completedCurrentWord = result.completedCurrentWord === true
        const unitCompleted = result.unitCompleted === true

        if (!unitWords.length) {
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
        if (isUnitRetrying) {
          const retryIds = new Set(retryWordQueue.map((word) => word.id))
          const retryIndexes = unitWords
            .map((word, index) => (retryIds.has(word.id) ? index : -1))
            .filter((index) => index >= 0)
          const nextRetryIndex =
            retryIndexes.find((index) => index > activeWordIndex) ?? retryIndexes[0] ?? -1

          if (nextRetryIndex >= 0) {
            set({
              activeWordIndex: nextRetryIndex,
              currentInput: '',
              hasTypo: false,
              isPeeking: false,
              currentWordRemainingLoops: loopCountSetting,
              ...DICTATION_STEP_RESET,
            })
            const nextRetryWord = unitWords[nextRetryIndex]
            if (nextRetryWord && canPlayAudio) {
              audioEngine.playPronunciation(nextRetryWord.name, phoneticPreference)
            }
          } else if (
            completedCurrentWord &&
            (unitCompleted || result.completedWordIds === undefined)
          ) {
            set({ isUnitFinished: true, isUnitRetrying: false })
          } else if (completedCurrentWord) {
            const completedIds = new Set(result.completedWordIds ?? [])
            const firstPendingIndex = unitWords.findIndex((word) => !completedIds.has(word.id))
            if (firstPendingIndex >= 0) {
              set({
                activeWordIndex: firstPendingIndex,
                currentInput: '',
                hasTypo: false,
                isUnitRetrying: false,
                currentWordRemainingLoops: loopCountSetting,
                ...DICTATION_STEP_RESET,
              })
            }
          }
          return
        }

        if (activeWordIndex < unitWords.length - 1) {
          const nextIndex = activeWordIndex + 1
          set({
            activeWordIndex: nextIndex,
            currentInput: '',
            hasTypo: false,
            isPeeking: false,
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
        } else if (completedCurrentWord) {
          if (retryWordQueue.length > 0) {
            const retryIds = new Set(retryWordQueue.map((word) => word.id))
            const firstRetryIndex = unitWords.findIndex((word) => retryIds.has(word.id))
            if (firstRetryIndex >= 0) {
              set({
                activeWordIndex: firstRetryIndex,
                currentInput: '',
                hasTypo: false,
                isPeeking: false,
                isUnitRetrying: true,
                currentWordRemainingLoops: loopCountSetting,
                ...DICTATION_STEP_RESET,
              })
            }
          } else if (unitCompleted || result.completedWordIds === undefined) {
            set({ isUnitFinished: true })
          } else {
            const completedIds = new Set(result.completedWordIds ?? [])
            const firstPendingIndex = unitWords.findIndex((word) => !completedIds.has(word.id))
            if (firstPendingIndex >= 0) {
              set({
                activeWordIndex: firstPendingIndex,
                currentInput: '',
                hasTypo: false,
                currentWordRemainingLoops: loopCountSetting,
                ...DICTATION_STEP_RESET,
              })
            }
          }
        }
      },

      /** 翻到上一个词：同样是纯浏览，不写单元进度 */
      prevWord: () => {
        latestPracticeActionSequence += 1
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
            isPeeking: false,
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

      restartUnit: async () => {
        latestPracticeActionSequence += 1
        const { isErrorPracticeActive, mode: currentMode, currentUnitMeta } = get()
        const isDictationError = isErrorPracticeActive && currentMode === 'dictation'

        // 先提交清理，再立即重置当前 UI；清理完成后不再回写状态，避免覆盖期间切换到的新单元。
        const clearPromise =
          !isDictationError && currentUnitMeta
            ? clearUnitProgress(currentUnitMeta.id, currentMode)
            : Promise.resolve()

        set({
          activeWordIndex: 0,
          currentInput: '',
          hasTypo: false,
          isUnitFinished: false,
          isCurrentWordSplit: false,
          isEditWordSplitModalOpen: false,
          retryWordQueue: [],
          isUnitRetrying: false,
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
        await clearPromise
      },

      // 词根模块专属操作
      setRootTab: (tab: RootTabType) => {
        set({ rootTab: tab, activeRootIndex: 0, rootSearchQuery: '' })
      },

      setRootIndex: (index: number) => {
        const { rootTab } = get()
        const items = ROOT_DATA_MAP[rootTab] || BUILTIN_ROOTS
        const total = items.length
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
        const { activeRootIndex, rootTab } = get()
        const items = ROOT_DATA_MAP[rootTab] || BUILTIN_ROOTS
        if (activeRootIndex < items.length - 1) {
          set({ activeRootIndex: activeRootIndex + 1 })
        }
      },

      toggleRootLearned: (rootId?: string) => {
        const { activeRootIndex, rootTab } = get()
        const items = ROOT_DATA_MAP[rootTab] || BUILTIN_ROOTS
        const currentRoot = items[activeRootIndex]
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
          // 自带官方词库：仅允许作者本人（token === 'myword_jack'）通过 API 更新并写回 public/dicts/*.json 文件！
          if (!isCurrentAuthor()) {
            console.warn('仅作者本人（token: myword_jack）可修改官方词库单词切分')
            return
          }
          const syncToken = getSyncToken()
          try {
            await fetch('/api/dict/update-word', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-sync-token': syncToken,
              },
              body: JSON.stringify({
                token: syncToken,
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
        // 默写线索默认看译文；旧缓存若未标记迁移过则升级为新的默认值 'meaning'
        const dictationCueMode = (persisted as any)?.dictationCueModeMigratedToMeaning
          ? (persisted.dictationCueMode ?? 'meaning')
          : 'meaning'

        // 确保持久化的独立进度字典包含当前选中的词库
        const currentBookId = persisted.currentBookId || currentState.currentBookId
        const bookModeProgress = { ...(persisted.bookModeProgress || {}) }
        if (!bookModeProgress[currentBookId]) {
          const initialUnit = persisted.currentUnitIndex ?? currentState.currentUnitIndex ?? 0
          bookModeProgress[currentBookId] = {
            learn: initialUnit,
            dictation: 0,
            phonetic: 0,
          }
        } else if (typeof bookModeProgress[currentBookId].learn !== 'number') {
          bookModeProgress[currentBookId].learn = persisted.currentUnitIndex ?? currentState.currentUnitIndex ?? 0
        }

        return {
          ...currentState,
          ...persisted,
          bookModeProgress,
          shortcuts,
          loopCounts,
          loopCountSetting: loopCount,
          currentWordRemainingLoops: loopCount,
          dictationCueMode,
          currentInput: '',
          hasTypo: false,
          // 模式由路由决定，不接受任何持久化值（含旧版本残留的 mode）
          mode: currentState.mode,
          cursors: createFreshCursors(bookModeProgress[currentBookId]),
          ...DICTATION_STEP_RESET,
        }
      },
      partialize: (state) => ({
        skinId: state.skinId,
        currentBookId: state.currentBookId,
        currentUnitIndex: state.currentUnitIndex,
        bookModeProgress: state.bookModeProgress,
        loopCounts: state.loopCounts,
        dictationCueMode: state.dictationCueMode,
        dictationCueModeMigratedToMeaning: true,
        phoneticPreference: state.phoneticPreference,
        isAutoPlayAudio: state.isAutoPlayAudio,
        keySoundPack: state.keySoundPack,
        keySoundVolume: state.keySoundVolume,
        isKeySoundEnabled: state.isKeySoundEnabled,
        isWrongBeepEnabled: state.isWrongBeepEnabled,
        isCorrectSoundEnabled: state.isCorrectSoundEnabled,
        feedbackVolume: state.feedbackVolume,
        isPhoneticSoundEnabled: state.isPhoneticSoundEnabled,
        phoneticSoundVolume: state.phoneticSoundVolume,
        shortcuts: state.shortcuts,
        isDictationPhoneticEnabled: state.isDictationPhoneticEnabled,
        isDictationMeaningEnabled: state.isDictationMeaningEnabled,
        rootTab: state.rootTab,
        activeRootIndex: state.activeRootIndex,
        learnedRootIds: state.learnedRootIds,
      }),
    }
  )
)
