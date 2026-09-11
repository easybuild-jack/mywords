import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { callAiChatCompletion, type AiChatMessage } from '@/lib/aiClient'

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
    hidden: true, // 暂时隐藏，待本地/私有测试环境就绪后再开放
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
  systemPrompt: `你是一位专业、渊博且耐心的英语语言学导师与学习伙伴，属于 MyWords 英语单词学习软件的专属智能副驾（MyWords Copilot）。
你的职责：
1. 解答用户关于英语单词、词根词缀、搭配惯用法、语法疑难、长难句结构拆解、学术写作润色等问题；
2. 回复力求准确、条理清晰、深入浅出，适度结合词源演变和肌肉记忆技巧；
3. 支持并在合适的时候使用 Markdown 标题、列表、表格和代码块，使内容易于阅读与理解；
4. 语言亲切专业、鼓励启发。`,
}

interface AiAssistantState {
  isOpen: boolean
  isThinking: boolean
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
      '你好！我是你的 **MyWords Copilot** ✨\n你可以随时向我提问关于英语语法疑难、长难句结构拆解、学术写作润色，或是任何复杂问题的深入探讨。',
    timestamp: Date.now(),
  },
]

const INITIAL_SESSIONS: AiSession[] = [
  {
    id: DEFAULT_SESSION_ID,
    title: '英语深度探讨与答疑',
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
                '你好！我是你的 **MyWords Copilot** ✨\n新对话已开启，请问有什么可以协助你的？',
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
        const target = get().sessions.find((s) => s.id === sessionId)
        if (target) {
          set({
            currentSessionId: sessionId,
            messages: target.messages,
            activeTab: 'chat',
          })
        }
      },

      deleteSession: (sessionId: string) => {
        const state = get()
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
            activeTab: 'chat',
          })
          return
        }

        const isCurrentDeleted = sessionId === state.currentSessionId
        const nextSession = isCurrentDeleted ? remaining[0] : null

        set({
          sessions: remaining,
          ...(nextSession
            ? {
                currentSessionId: nextSession.id,
                messages: nextSession.messages,
              }
            : {}),
        })
      },

      clearMessages: () => {
        const state = get()
        const welcomeMsg: AiMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: '当前会话已重置，您可以继续开启新的讨论。',
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
        })
      },

      clearAllSessions: () => {
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
          activeTab: 'chat',
        })
      },

      sendMessage: async (customText?: string) => {
        const state = get()
        const textToSend = (customText ?? state.inputPrompt).trim()
        if (!textToSend) return

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

        const updatedTitle =
          currentSess.title === '新对话' || currentSess.title === '英语深度探讨与答疑'
            ? textToSend.slice(0, 20)
            : currentSess.title

        const updatedMessages = [...currentSess.messages, newUserMessage]
        const updatedSessions = state.sessions.map((s) =>
          s.id === currentSess!.id
            ? { ...s, title: updatedTitle, messages: updatedMessages, updatedAt: Date.now() }
            : s
        )

        set({
          sessions: updatedSessions,
          messages: updatedMessages,
          inputPrompt: '',
          isThinking: true,
          isOpen: true,
          activeTab: 'chat',
        })

        // 判断是否已配置真实 API Key
        const hasApiKey = Boolean(state.aiConfig?.apiKey?.trim())

        if (hasApiKey) {
          try {
            // 组装前置 System Prompt 与近期历史记录（最近 10 条）
            const chatPayload: AiChatMessage[] = [
              { role: 'system', content: state.aiConfig.systemPrompt || DEFAULT_AI_CONFIG.systemPrompt },
              ...updatedMessages.slice(-10).map((m) => ({
                role: m.role as 'system' | 'user' | 'assistant',
                content: m.content,
              })),
            ]

            const replyContent = await callAiChatCompletion(state.aiConfig, chatPayload)

            const aiResponse: AiMessage = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: replyContent,
              timestamp: Date.now(),
            }

            const finalMessages = [...get().messages, aiResponse]
            const finalSessions = get().sessions.map((s) =>
              s.id === get().currentSessionId
                ? { ...s, messages: finalMessages, updatedAt: Date.now() }
                : s
            )

            set({
              messages: finalMessages,
              sessions: finalSessions,
              isThinking: false,
            })
            return
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : '大模型请求异常'
            const aiResponse: AiMessage = {
              id: `ai-err-${Date.now()}`,
              role: 'assistant',
              content: `⚠️ **模型调用失败**：${errorMsg}\n\n💡 建议：请点击左下角「偏好设置 -> AI 模型配置」，检查 API Key、接口地址 (Endpoint) 或使用「测试连接」排查。`,
              timestamp: Date.now(),
            }

            const finalMessages = [...get().messages, aiResponse]
            const finalSessions = get().sessions.map((s) =>
              s.id === get().currentSessionId
                ? { ...s, messages: finalMessages, updatedAt: Date.now() }
                : s
            )

            set({
              messages: finalMessages,
              sessions: finalSessions,
              isThinking: false,
            })
            return
          }
        }

        // 未配置 Key 时的智能模拟演示模式
        setTimeout(() => {
          const aiResponse = generateSimulatedAiResponse(textToSend)
          const finalMessages = [...get().messages, aiResponse]
          const finalSessions = get().sessions.map((s) =>
            s.id === get().currentSessionId
              ? { ...s, messages: finalMessages, updatedAt: Date.now() }
              : s
          )

          set({
            messages: finalMessages,
            sessions: finalSessions,
            isThinking: false,
          })
        }, 600)
      },
    }),
    {
      name: 'mywords_ai_assistant_v5',
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
        }
      },
    }
  )
)

/** 针对复杂问题与通用探讨的高质量响应生成器（未绑 Key 时的本地演示） */
function generateSimulatedAiResponse(prompt: string): AiMessage {
  const timestamp = Date.now()
  const trimmed = prompt.trim()

  // 1. 若用户询问 JSON 格式
  if (/(json|结构化数据|数据格式)/i.test(trimmed)) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content: JSON.stringify(
        {
          module: 'vocabulary_analysis',
          target: 'complex_word_inquiry',
          status: 'success',
          data: {
            phonetic: '/kəmˈplɛks/',
            level: 'IELTS / TOEFL',
            definitions: [
              { pos: 'adj', meaning: '复杂的；难懂的' },
              { pos: 'n', meaning: '复合体；综合设施；情结' },
            ],
            synonyms: ['intricate', 'complicated', 'sophisticated'],
            roots: {
              prefix: 'com- (共同/完全)',
              base: 'plectere (编织/折叠)',
              literalMeaning: '编织交错在一起的',
            },
          },
        },
        null,
        2
      ),
      timestamp,
    }
  }

  // 2. 若用户询问 HTML 格式
  if (/(html|网页|页面|样式模板)/i.test(trimmed)) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Word Flashcard</title>
  <style>
    .card { padding: 20px; border-radius: 12px; background: #161b22; color: #5eead4; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Serendipity /ˌser.ənˈdɪp.ə.ti/</h2>
    <p>The occurrence of events by chance in a happy or beneficial way.</p>
  </div>
</body>
</html>`,
      timestamp,
    }
  }

  // 3. 若用户询问 Shell / 终端命令
  if (/(shell|bash|脚本|命令行|终端|npm|git)/i.test(trimmed)) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content: `#!/bin/bash
# 词库本地同步与备份脚本
echo "正在备份 MyWords 学习进度..."
mkdir -p ./backups
curl -s -X POST https://api.mywords.local/sync \\
  -H "Authorization: Bearer MYWORDS_TOKEN" \\
  -o ./backups/words_$(date +%Y%m%d).json

echo "备份完成！"`,
      timestamp,
    }
  }

  // 4. 纯文本回复
  if (/^(hi|hello|hey|你好|哈喽|嗨)[!！\s]*$/i.test(trimmed)) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content:
        '你好！我是你的 MyWords Copilot。你可以向我咨询任何问题，包括获取 HTML 模板、JSON 数据结构、Shell 命令行脚本、Markdown 笔记，或者讨论复杂的语法疑难。\n\n💡 提示：您也可以在「偏好设置 -> AI 模型配置」中配置 DeepSeek、豆包或 ChatGPT 的 API Key，开启真实大模型联网深度对话！',
      timestamp,
    }
  }

  // 通用 Markdown 回答
  return {
    id: `ai-${timestamp}`,
    role: 'assistant',
    content: `收到你的提问: **${trimmed}**

对于这个问题，我们可以从核心逻辑、语法拆解与应用实践三个维度来深入探讨：

### 1. 核心概念与词义脉络
词汇在实际学术或职场语境中具有丰富的层次，建议结合**构词法拆解**（词根词缀）加深长期肌肉记忆。

### 2. 经典语境搭配与辨析
* **学术写作**: 常用于阐明因果、论据支撑或对比对照关系；
* **口语表达**: 吐字节奏需配合重音与弱读音节；

\`\`\`markdown
# 学习要点速记
- 音节划分: 注意主重音位置
- 常用搭配: be associated with / contribute to
\`\`\`

> 💡 提示：您尚未绑定大模型 API Key，当前为本地演示应答。前往「偏好设置 -> AI 模型配置」绑定 DeepSeek、豆包或 ChatGPT 的 Key 即可解锁全量大模型智能问答！`,
    timestamp,
  }
}
