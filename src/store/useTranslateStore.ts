import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { TranslationBook, TranslationSentenceItem } from '@/types'
import { DEFAULT_TRANSLATION_BOOKS } from '@/resources/translateData'
import { audioEngine } from '@/core/audioEngine'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

interface TranslateState {
  books: TranslationBook[]
  currentBookId: string
  currentSentenceIndex: number
  isPeeking: boolean
  isSentenceCompleted: boolean
  audioRate: number
  isSpeaking: boolean
  isAutoPlayAudio: boolean
  completedSentenceIds: Record<string, boolean>
  isImportModalOpen: boolean
  isGrammarModalOpen: boolean
  repeatSentenceKey: number

  // Actions
  selectBook: (bookId: string) => void
  setCurrentSentenceIndex: (index: number) => void
  nextSentence: () => void
  prevSentence: () => void
  restartBook: () => void
  setPeeking: (peeking: boolean) => void
  setAudioRate: (rate: number) => void
  toggleAudioRate: () => void
  setAutoPlayAudio: (enabled: boolean) => void
  toggleAutoPlayAudio: () => void
  setSentenceCompleted: (completed: boolean) => void
  setGrammarModalOpen: (open: boolean) => void
  repeatCurrentSentence: () => void
  playSentenceAudio: (textOrRate?: string | number, customRate?: number) => void
  playWordAudio: (word?: string, customRate?: number) => void
  stopSentenceAudio: () => void
  addCustomBook: (book: TranslationBook) => void
  deleteCustomBook: (bookId: string) => void
  setImportModalOpen: (open: boolean) => void
}

export const useTranslateStore = create<TranslateState>()(
  persist(
    (set, get) => ({
      books: DEFAULT_TRANSLATION_BOOKS,
      currentBookId: DEFAULT_TRANSLATION_BOOKS[0].id,
      currentSentenceIndex: 0,
      isPeeking: false,
      isSentenceCompleted: false,
      audioRate: 0.88,
      isSpeaking: false,
      isAutoPlayAudio: true,
      completedSentenceIds: {},
      isImportModalOpen: false,
      isGrammarModalOpen: false,
      repeatSentenceKey: 0,

      selectBook: (bookId: string) => {
        audioEngine.cancelPendingPlayback()
        set({
          currentBookId: bookId,
          currentSentenceIndex: 0,
          isSentenceCompleted: false,
          isGrammarModalOpen: false,
          isPeeking: false,
          isSpeaking: false,
        })
      },

      setCurrentSentenceIndex: (index: number) => {
        audioEngine.cancelPendingPlayback()
        const { books, currentBookId } = get()
        const currentBook = books.find((b) => b.id === currentBookId) || books[0]
        const clampedIndex = Math.max(0, Math.min(index, currentBook.sentences.length - 1))
        set({
          currentSentenceIndex: clampedIndex,
          isSentenceCompleted: false,
          isGrammarModalOpen: false,
          isPeeking: false,
          isSpeaking: false,
        })
      },

      nextSentence: () => {
        audioEngine.cancelPendingPlayback()
        const { books, currentBookId, currentSentenceIndex } = get()
        const currentBook = books.find((b) => b.id === currentBookId) || books[0]
        if (currentSentenceIndex < currentBook.sentences.length - 1) {
          set({
            currentSentenceIndex: currentSentenceIndex + 1,
            isSentenceCompleted: false,
            isGrammarModalOpen: false,
            isPeeking: false,
            isSpeaking: false,
          })
        }
      },

      prevSentence: () => {
        audioEngine.cancelPendingPlayback()
        const { currentSentenceIndex } = get()
        if (currentSentenceIndex > 0) {
          set({
            currentSentenceIndex: currentSentenceIndex - 1,
            isSentenceCompleted: false,
            isGrammarModalOpen: false,
            isPeeking: false,
            isSpeaking: false,
          })
        }
      },

      restartBook: () => {
        audioEngine.cancelPendingPlayback()
        set({
          currentSentenceIndex: 0,
          isSentenceCompleted: false,
          isGrammarModalOpen: false,
          isPeeking: false,
          isSpeaking: false,
        })
      },

      setGrammarModalOpen: (open: boolean) => {
        set({ isGrammarModalOpen: open })
      },

      repeatCurrentSentence: () => {
        audioEngine.cancelPendingPlayback()
        set((state) => ({
          isSentenceCompleted: false,
          isGrammarModalOpen: false,
          isSpeaking: false,
          repeatSentenceKey: state.repeatSentenceKey + 1,
        }))
      },

      setPeeking: (peeking: boolean) => {
        set({ isPeeking: peeking })
      },

      setAudioRate: (rate: number) => {
        set({ audioRate: rate })
      },

      toggleAudioRate: () => {
        const currentRate = get().audioRate
        const nextRate = currentRate <= 0.78 ? 1.0 : currentRate >= 1.0 ? 0.75 : 1.0
        set({ audioRate: nextRate })
      },

      setAutoPlayAudio: (enabled: boolean) => {
        set({ isAutoPlayAudio: enabled })
      },

      toggleAutoPlayAudio: () => {
        set((state) => ({ isAutoPlayAudio: !state.isAutoPlayAudio }))
      },

      setSentenceCompleted: (completed: boolean) => {
        const { books, currentBookId, currentSentenceIndex, completedSentenceIds } = get()
        const currentBook = books.find((b) => b.id === currentBookId) || books[0]
        const currentSentence = currentBook.sentences[currentSentenceIndex]

        set({
          isSentenceCompleted: completed,
          completedSentenceIds: currentSentence
            ? { ...completedSentenceIds, [currentSentence.id]: true }
            : completedSentenceIds,
        })
      },

      playWordAudio: (word?: string, customRate?: number) => {
        const { books, currentBookId, currentSentenceIndex } = get()
        const currentBook = books.find((b) => b.id === currentBookId) || books[0]
        const currentSentence = currentBook.sentences[currentSentenceIndex]

        let targetWord = word?.trim()
        if (!targetWord && currentSentence?.keywords?.length) {
          targetWord = currentSentence.keywords[0]?.word
        }
        if (!targetWord) return

        const phoneticPreference =
          useWorkspaceStore.getState().phoneticPreference || 'us'
        const rateToUse = customRate ?? 1.0

        audioEngine.cancelPendingPlayback()
        set({ isSpeaking: true })
        audioEngine
          .playPronunciationOnce(targetWord, phoneticPreference, rateToUse)
          .finally(() => {
            set({ isSpeaking: false })
          })
      },

      playSentenceAudio: (textOrRate?: string | number, customRate?: number) => {
        const { books, currentBookId, currentSentenceIndex, audioRate } = get()
        const currentBook = books.find((b) => b.id === currentBookId) || books[0]
        const currentSentence = currentBook.sentences[currentSentenceIndex]

        let sentenceText = currentSentence?.sentenceEn
        let rateToUse = audioRate

        if (typeof textOrRate === 'string') {
          sentenceText = textOrRate
          if (typeof customRate === 'number') rateToUse = customRate
        } else if (typeof textOrRate === 'number') {
          rateToUse = textOrRate
        }

        if (!sentenceText?.trim()) return

        const phoneticPreference =
          useWorkspaceStore.getState().phoneticPreference || 'us'

        audioEngine.cancelPendingPlayback()
        set({ isSpeaking: true })
        audioEngine.playSentence(
          sentenceText,
          phoneticPreference,
          rateToUse,
          () => {
            set({ isSpeaking: false })
          }
        )
      },

      stopSentenceAudio: () => {
        audioEngine.cancelPendingPlayback()
        set({ isSpeaking: false })
      },

      addCustomBook: (book: TranslationBook) => {
        set((state) => {
          const filtered = state.books.filter((b) => b.id !== book.id)
          return {
            books: [...filtered, book],
            currentBookId: book.id,
            currentSentenceIndex: 0,
            isSentenceCompleted: false,
            isPeeking: false,
            isSpeaking: false,
          }
        })
      },

      deleteCustomBook: (bookId: string) => {
        set((state) => {
          const filtered = state.books.filter((b) => b.id !== bookId)
          const nextBooks = filtered.length > 0 ? filtered : DEFAULT_TRANSLATION_BOOKS
          return {
            books: nextBooks,
            currentBookId: nextBooks[0].id,
            currentSentenceIndex: 0,
            isSentenceCompleted: false,
            isPeeking: false,
            isSpeaking: false,
          }
        })
      },

      setImportModalOpen: (open: boolean) => {
        set({ isImportModalOpen: open })
      },
    }),
    {
      name: 'mywords-translate-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentBookId: state.currentBookId,
        audioRate: state.audioRate,
        isAutoPlayAudio: state.isAutoPlayAudio,
        completedSentenceIds: state.completedSentenceIds,
        books: state.books.filter((b) => b.isCustom),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // 保证默认预置题库始终合并存在
        const customBooks = (state.books || []).filter((b) => b.isCustom)
        state.books = [...DEFAULT_TRANSLATION_BOOKS, ...customBooks]
        if (!state.books.some((b) => b.id === state.currentBookId)) {
          state.currentBookId = DEFAULT_TRANSLATION_BOOKS[0].id
        }
      },
    }
  )
)
