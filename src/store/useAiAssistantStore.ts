import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { callAiChatCompletion, streamAiChatCompletion, type AiChatMessage } from '@/lib/aiClient'
import { AI_ENGLISH_TEACHER_SYSTEM_PROMPT } from '@/lib/aiPrompts'

// 模块级保存当前活跃的流式请求控制器，支持随时终止流水输出
let activeChatAbortController: AbortController | null = null

export interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AiSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: AiMessage[]
}

export type AiProviderId = 'deepseek' | 'doubao' | 'openai' | 'qwen' | 'custom'

export interface AiProviderPreset {
  id: AiProviderId
  name: string
  tagline: string
  defaultEndpoint: string
  defaultModel: string
  keyPlaceholder: string
  officialUrl: string
  modelsDocUrl: string
  modelPlaceholder: string
  helpUrl?: string
  hidden?: boolean
}

export const AI_PROVIDER_PRESETS: Record<AiProviderId, AiProviderPreset> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    tagline: '国内高性价比卓越模型，官方直连 api.deepseek.com',
    defaultEndpoint: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    officialUrl: 'https://www.deepseek.com/',
    modelsDocUrl: 'https://api-docs.deepseek.com/zh-cn/',
    modelPlaceholder: '例如: deepseek-chat 或最新模型代号',
    helpUrl: 'https://platform.deepseek.com/',
  },
  doubao: {
    id: 'doubao',
    name: '豆包 Doubao (火山引擎)',
    tagline: '字节跳动火山引擎官方大模型，高响应速度',
    defaultEndpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-1-5-pro-32k',
    keyPlaceholder: '输入火山引擎 API Key 或接入点密钥',
    officialUrl: 'https://www.volcengine.com/product/ark',
    modelsDocUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/model',
    modelPlaceholder: '例如: doubao-1-5-pro-32k 或专属接入点 ID (ep-xxxx)',
    helpUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
  },
  openai: {
    id: 'openai',
    name: 'ChatGPT (OpenAI)',
    tagline: '国际知名顶级大模型，支持官方或第三方镜像中转',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    keyPlaceholder: 'sk-...',
    officialUrl: 'https://openai.com/',
    modelsDocUrl: 'https://platform.openai.com/docs/models',
    modelPlaceholder: '例如: gpt-4o、gpt-4o-mini 或最新模型代号',
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  qwen: {
    id: 'qwen',
    name: '通义千问 (Qwen)',
    tagline: '阿里云百炼官方大模型，中文与多语言能力均衡',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    keyPlaceholder: 'sk-...',
    officialUrl: 'https://tongyi.aliyun.com/',
    modelsDocUrl: 'https://help.aliyun.com/zh/model-studio/getting-started/models',
    modelPlaceholder: '例如: qwen-plus、qwen-turbo 或百炼最新模型',
    helpUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
  },
  custom: {
    id: 'custom',
    name: '自定义 (OpenAI 兼容)',
    tagline: '连接 Ollama、OneAPI、vLLM、LM Studio 或私有服务',
    defaultEndpoint: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    keyPlaceholder: 'API Key (无鉴权或本地端点可任意填写)',
    officialUrl: 'https://ollama.com/',
    modelsDocUrl: 'https://ollama.com/library',
    modelPlaceholder: '输入服务端支持的模型标识，如 llama3、qwen2.5',
    hidden: true,
  },
}

export interface AiModelConfig {
  provider: AiProviderId
  apiKey: string
  endpoint: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
}

export const DEFAULT_AI_CONFIG: AiModelConfig = {
  provider: 'deepseek',
  apiKey: '',
  endpoint: AI_PROVIDER_PRESETS.deepseek.defaultEndpoint,
  model: AI_PROVIDER_PRESETS.deepseek.defaultModel,
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: AI_ENGLISH_TEACHER_SYSTEM_PROMPT,
}

interface AiAssistantState {
  isOpen: boolean
  isThinking: boolean
  isStreaming: boolean
  inputPrompt: string
  activeTab: 'chat' | 'history'
  currentSessionId: string
  sessions: AiSession[]
  messages: AiMessage[]
  aiConfig: AiModelConfig

  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  setInputPrompt: (val: string) => void
  setActiveTab: (tab: 'chat' | 'history') => void
  createNewSession: () => void
  switchSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  clearMessages: () => void
  clearAllSessions: () => void
  sendMessage: (customText?: string) => Promise<void>
  stopGeneration: () => void

  isApiKeyPromptOpen: boolean
  setApiKeyPromptOpen: (open: boolean) => void

  updateAiConfig: (partial: Partial<AiModelConfig>) => void
  resetAiConfig: () => void
  setAiProvider: (provider: AiProviderId) => void
}

const DEFAULT_SESSION_ID = 'session-default'

const INITIAL_MESSAGES: AiMessage[] = [
  {
    id: 'welcome-msg',
    role: 'assistant',
    content:
      '你好！我是你的专属 **MyWords Copilot** ✨\n\n你可以随时向我提问关于英语单词记忆、构词法拆解、语法疑难、长难句结构剖析或学术写作润色。\n\n> ⚠️ **温馨提示**：作为您的专属智能导师，我专注于英语学习与语言能力提升，会礼貌拒绝一切与英语学习无关的外部话题哦。',
    timestamp: Date.now(),
  },
]

const INITIAL_SESSIONS: AiSession[] = [
  {
    id: DEFAULT_SESSION_ID,
    title: '英语深度辅导与答疑',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
    messages: INITIAL_MESSAGES,
  },
]

export const useAiAssistantStore = create<AiAssistantState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isThinking: false,
      isStreaming: false,
      isApiKeyPromptOpen: false,
      inputPrompt: '',
      activeTab: 'chat',
      currentSessionId: DEFAULT_SESSION_ID,
      sessions: INITIAL_SESSIONS,
      messages: INITIAL_MESSAGES,
      aiConfig: DEFAULT_AI_CONFIG,

      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
      setInputPrompt: (val: string) => set({ inputPrompt: val }),
      setActiveTab: (tab: 'chat' | 'history') => set({ activeTab: tab }),
      setApiKeyPromptOpen: (open: boolean) => set({ isApiKeyPromptOpen: open }),

      updateAiConfig: (partial: Partial<AiModelConfig>) =>
        set((state) => ({
          aiConfig: { ...state.aiConfig, ...partial },
        })),

      resetAiConfig: () =>
        set({
          aiConfig: DEFAULT_AI_CONFIG,
        }),

      setAiProvider: (provider: AiProviderId) => {
        const preset = AI_PROVIDER_PRESETS[provider] || AI_PROVIDER_PRESETS.deepseek
        set((state) => ({
          aiConfig: {
            ...state.aiConfig,
            provider,
            endpoint: preset.defaultEndpoint,
            model: preset.defaultModel,
          },
        }))
      },

      createNewSession: () => {
        const newId = `session-${Date.now()}`
        const newSession: AiSession = {
          id: newId,
          title: '新对话',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [
            {
              id: `welcome-${Date.now()}`,
              role: 'assistant',
              content:
                '你好！我是你的专属 **MyWords Copilot** ✨\n新对话已开启，请问在英语学习、语法词汇或长难句方面有什么可以协助你？',
              timestamp: Date.now(),
            },
          ],
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newId,
          messages: newSession.messages,
          activeTab: 'chat',
          inputPrompt: '',
        }))
      },

      switchSession: (sessionId: string) => {
        if (sessionId === get().currentSessionId) return

        if (activeChatAbortController) {
          activeChatAbortController.abort()
          activeChatAbortController = null
        }

        const target = get().sessions.find((s) => s.id === sessionId)
        if (target) {
          set({
            currentSessionId: sessionId,
            messages: target.messages,
            isThinking: false,
            isStreaming: false,
            activeTab: 'chat',
          })
        }
      },

      deleteSession: (sessionId: string) => {
        const state = get()
        const isCurrentDeleted = sessionId === state.currentSessionId

        if (isCurrentDeleted) {
          if (activeChatAbortController) {
            activeChatAbortController.abort()
            activeChatAbortController = null
          }
        }

        const remaining = state.sessions.filter((s) => s.id !== sessionId)

        if (remaining.length === 0) {
          const freshId = `session-${Date.now()}`
          const freshSession: AiSession = {
            id: freshId,
            title: '新对话',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: INITIAL_MESSAGES,
          }
          set({
            sessions: [freshSession],
            currentSessionId: freshId,
            messages: freshSession.messages,
            isThinking: false,
            isStreaming: false,
            activeTab: 'chat',
          })
          return
        }

        const nextSession = isCurrentDeleted ? remaining[0] : null

        set({
          sessions: remaining,
          isThinking: isCurrentDeleted ? false : state.isThinking,
          isStreaming: isCurrentDeleted ? false : state.isStreaming,
          ...(nextSession
            ? {
                currentSessionId: nextSession.id,
                messages: nextSession.messages,
              }
            : {}),
        })
      },

      stopGeneration: () => {
        if (activeChatAbortController) {
          activeChatAbortController.abort()
          activeChatAbortController = null
        }
        set({ isThinking: false, isStreaming: false })
      },

      clearMessages: () => {
        if (activeChatAbortController) {
          activeChatAbortController.abort()
          activeChatAbortController = null
        }

        const state = get()
        const welcomeMsg: AiMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: '当前会话已重置，您可以继续提出英语学习相关的问题。',
          timestamp: Date.now(),
        }

        const updatedSessions = state.sessions.map((s) =>
          s.id === state.currentSessionId
            ? { ...s, messages: [welcomeMsg], updatedAt: Date.now() }
            : s
        )

        set({
          messages: [welcomeMsg],
          sessions: updatedSessions,
          isThinking: false,
          isStreaming: false,
        })
      },

      clearAllSessions: () => {
        if (activeChatAbortController) {
          activeChatAbortController.abort()
          activeChatAbortController = null
        }

        const freshId = `session-${Date.now()}`
        const freshSession: AiSession = {
          id: freshId,
          title: '新对话',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: INITIAL_MESSAGES,
        }
        set({
          sessions: [freshSession],
          currentSessionId: freshId,
          messages: freshSession.messages,
          isThinking: false,
          isStreaming: false,
          activeTab: 'chat',
        })
      },

      sendMessage: async (customText?: string) => {
        const state = get()
        const textToSend = (customText ?? state.inputPrompt).trim()
        if (!textToSend) return

        // 场景一：智能问答场景，若未配置 API Key 直接弹框提示，静默不执行模拟生成
        const hasApiKey = Boolean(state.aiConfig?.apiKey?.trim())
        if (!hasApiKey) {
          set({ isApiKeyPromptOpen: true, isThinking: false, isStreaming: false })
          return
        }

        // 如果之前有正在进行的流式输出，先中止
        if (activeChatAbortController) {
          activeChatAbortController.abort()
          activeChatAbortController = null
        }

        const userMsgId = `user-${Date.now()}`
        const newUserMessage: AiMessage = {
          id: userMsgId,
          role: 'user',
          content: textToSend,
          timestamp: Date.now(),
        }

        let currentSess = state.sessions.find((s) => s.id === state.currentSessionId)
        if (!currentSess) {
          currentSess = {
            id: state.currentSessionId || `session-${Date.now()}`,
            title: textToSend.slice(0, 24),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: state.messages,
          }
        }

        // 会话标题：若当前是初始默认标题或空标题，自动采用用户的问题作为永久标题，绝不丢失
        const updatedTitle =
          currentSess.title === '新对话' ||
          currentSess.title === '英语深度辅导与答疑' ||
          currentSess.title === '英语深度探讨与答疑' ||
          !currentSess.title?.trim()
            ? textToSend.slice(0, 24)
            : currentSess.title

        const updatedMessages = [...currentSess.messages, newUserMessage]
        const hasCurrentSession = state.sessions.some((s) => s.id === currentSess!.id)
        const updatedSessions = hasCurrentSession
          ? state.sessions.map((s) =>
              s.id === currentSess!.id
                ? { ...s, title: updatedTitle, messages: updatedMessages, updatedAt: Date.now() }
                : s
            )
          : [
              { ...currentSess, title: updatedTitle, messages: updatedMessages, updatedAt: Date.now() },
              ...state.sessions,
            ]

        set({
          sessions: updatedSessions,
          messages: updatedMessages,
          inputPrompt: '',
          isThinking: true,
          isStreaming: false,
          isOpen: true,
          activeTab: 'chat',
        })

        // 流水更新辅助：逐 chunk 实时渲染至 Assistant 消息
        const assistantMsgId = `ai-${Date.now()}`
        let accumulatedContent = ''
        let hasAppendedAssistantMsg = false

        const handleIncomingChunk = (chunk: string) => {
          accumulatedContent += chunk
          const curMsgs = get().messages
          const curSessions = get().sessions

          if (!hasAppendedAssistantMsg) {
            hasAppendedAssistantMsg = true
            const newAssistantMsg: AiMessage = {
              id: assistantMsgId,
              role: 'assistant',
              content: accumulatedContent,
              timestamp: Date.now(),
            }
            const nextMsgs = [...curMsgs, newAssistantMsg]
            const nextSessions = curSessions.map((s) =>
              s.id === get().currentSessionId
                ? { ...s, title: updatedTitle, messages: nextMsgs, updatedAt: Date.now() }
                : s
            )
            set({
              isThinking: false,
              isStreaming: true,
              messages: nextMsgs,
              sessions: nextSessions,
            })
          } else {
            const nextMsgs = curMsgs.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
            )
            const nextSessions = curSessions.map((s) =>
              s.id === get().currentSessionId
                ? { ...s, title: updatedTitle, messages: nextMsgs, updatedAt: Date.now() }
                : s
            )
            set({
              messages: nextMsgs,
              sessions: nextSessions,
            })
          }
        }

        // 开始真实大模型流式调用，并施加 60 秒心跳超时检测
        const controller = new AbortController()
        activeChatAbortController = controller
        let isTimedOut = false

        // 60 秒无响应心跳检测
        let timeoutTimer: NodeJS.Timeout | null = null
        const resetTimeout = () => {
          if (timeoutTimer) clearTimeout(timeoutTimer)
          timeoutTimer = setTimeout(() => {
            isTimedOut = true
            controller.abort()
          }, 60000)
        }
        resetTimeout()

        try {
          // 组装系统提示词（高级英语老师）与近期历史记录（最近 10 条）
          const chatPayload: AiChatMessage[] = [
            { role: 'system', content: state.aiConfig.systemPrompt || DEFAULT_AI_CONFIG.systemPrompt },
            ...updatedMessages.slice(-10).map((m) => ({
              role: m.role as 'system' | 'user' | 'assistant',
              content: m.content,
            })),
          ]

          // 对话场景：采用流式输出 (stream: true)
          await streamAiChatCompletion(
            state.aiConfig,
            chatPayload,
            (chunk) => {
              resetTimeout()
              handleIncomingChunk(chunk)
            },
            controller.signal
          )

          if (timeoutTimer) clearTimeout(timeoutTimer)
          activeChatAbortController = null

          // 如果连接已结束但大模型未输出任何有效文本（没有结果）
          if (!accumulatedContent.trim()) {
            const noResultMsg: AiMessage = {
              id: assistantMsgId,
              role: 'assistant',
              content: '网络超时，请重试',
              timestamp: Date.now(),
            }
            const finalMessages = hasAppendedAssistantMsg
              ? get().messages.map((m) => (m.id === assistantMsgId ? noResultMsg : m))
              : [...get().messages, noResultMsg]

            const finalSessions = get().sessions.map((s) =>
              s.id === get().currentSessionId
                ? { ...s, title: updatedTitle, messages: finalMessages, updatedAt: Date.now() }
                : s
            )

            set({
              messages: finalMessages,
              sessions: finalSessions,
              isThinking: false,
              isStreaming: false,
              inputPrompt: textToSend, // 自动把问题再次填到输入框
            })
            return
          }

          set({
            isThinking: false,
            isStreaming: false,
          })
          return
        } catch (err: unknown) {
          if (timeoutTimer) clearTimeout(timeoutTimer)
          activeChatAbortController = null

          // 如果没有结果（无论是超时、网络中断还是未输出）
          if (!accumulatedContent.trim()) {
            const noResultMsg: AiMessage = {
              id: assistantMsgId,
              role: 'assistant',
              content: '网络超时，请重试',
              timestamp: Date.now(),
            }

            const curMsgs = get().messages
            const finalMessages = hasAppendedAssistantMsg
              ? curMsgs.map((m) => (m.id === assistantMsgId ? noResultMsg : m))
              : [...curMsgs, noResultMsg]

            const finalSessions = get().sessions.map((s) =>
              s.id === get().currentSessionId
                ? { ...s, title: updatedTitle, messages: finalMessages, updatedAt: Date.now() }
                : s
            )

            set({
              messages: finalMessages,
              sessions: finalSessions,
              isThinking: false,
              isStreaming: false,
              inputPrompt: textToSend, // 自动把问题再次填到输入框，方便用户重试
            })
            return
          }

          // 如果已经流式输出了部分内容后连接中断
          handleIncomingChunk('\n\n*(网络超时，请重试)*')
          set({
            isThinking: false,
            isStreaming: false,
            inputPrompt: textToSend, // 自动把问题再次填到输入框
          })
        }
      },
    }),
    {
      name: 'mywords_ai_assistant_v6',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        sessions: state.sessions.slice(0, 40),
        messages: state.messages.slice(-30),
        aiConfig: state.aiConfig,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.aiConfig) {
          if (
            state.aiConfig.provider === 'deepseek' &&
            (!state.aiConfig.endpoint || state.aiConfig.endpoint === 'https://api.deepseek.com/v1')
          ) {
            state.aiConfig.endpoint = 'https://api.deepseek.com'
          }
          if (state.aiConfig.provider === 'custom') {
            state.aiConfig.provider = 'deepseek'
            state.aiConfig.endpoint = AI_PROVIDER_PRESETS.deepseek.defaultEndpoint
            state.aiConfig.model = AI_PROVIDER_PRESETS.deepseek.defaultModel
          }
          // 同步确保系统提示词更新为最新的高级英语名师人设
          if (!state.aiConfig.systemPrompt || state.aiConfig.systemPrompt.includes('专业、渊博且耐心的英语语言学导师')) {
            state.aiConfig.systemPrompt = AI_ENGLISH_TEACHER_SYSTEM_PROMPT
          }
        }
      },
    }
  )
)


