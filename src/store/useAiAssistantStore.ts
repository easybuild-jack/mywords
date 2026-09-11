import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WordItem } from '@/types'

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

interface AiAssistantState {
  isOpen: boolean
  isThinking: boolean
  inputPrompt: string
  activeTab: 'chat' | 'history'
  currentSessionId: string
  sessions: AiSession[]
  messages: AiMessage[]

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
  sendMessage: (customText?: string) => void
}

const DEFAULT_SESSION_ID = 'session-default'

const INITIAL_MESSAGES: AiMessage[] = [
  {
    id: 'welcome-msg',
    role: 'assistant',
    content:
      '你好！我是你的 **MyWords 顾问** ✨\n你可以随时向我提问关于英语语法疑难、长难句结构拆解、学术写作润色，或是任何复杂问题的深入探讨。',
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
      activeTab: 'chat', // 默认展示“当前对话”
      currentSessionId: DEFAULT_SESSION_ID,
      sessions: INITIAL_SESSIONS,
      messages: INITIAL_MESSAGES,

      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
      setInputPrompt: (val: string) => set({ inputPrompt: val }),
      setActiveTab: (tab: 'chat' | 'history') => set({ activeTab: tab }),

      // 开启新对话
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
                '你好！我是你的 **MyWords 顾问** ✨\n新对话已开启，请问有什么可以协助你的？',
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

      // 切换至指定历史会话
      switchSession: (sessionId: string) => {
        const state = get()
        const target = state.sessions.find((s) => s.id === sessionId)
        if (target) {
          set({
            currentSessionId: sessionId,
            messages: target.messages,
            activeTab: 'chat',
          })
        }
      },

      // 删除单条历史会话
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

      // 清空当前会话内容
      clearMessages: () => {
        const state = get()
        const welcomeMsg: AiMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: '当前对话已清空 ✨ 随时输入你想探讨的任何问题。',
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

      // 清空全部历史记录
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

      sendMessage: (customText?: string) => {
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

        // 查找或创建当前会话
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

        // 若会话标题为默认，自动提炼首个问题作为会话标题
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

        // 模拟 AI 思考并生成纯净回复
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
      name: 'mywords_ai_assistant_v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        sessions: state.sessions.slice(0, 40),
        messages: state.messages.slice(-30),
      }),
    }
  )
)

/** 针对复杂问题与通用探讨的高质量响应生成器 */
function generateSimulatedAiResponse(prompt: string): AiMessage {
  const timestamp = Date.now()
  const trimmed = prompt.trim()

  // JSON 代码或数据结构请求
  if (trimmed.toLowerCase().includes('json')) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content: `为你生成对应的 JSON 格式数据结构：\n\n\`\`\`json\n{\n  "status": "success",\n  "query": "${trimmed.replace(/"/g, '\\"')}",\n  "result": {\n    "language": "English",\n    "domain": "Linguistics & Lexicon",\n    "tags": ["grammar", "vocabulary", "syntax"],\n    "totalCount": 42,\n    "isActive": true\n  }\n}\n\`\`\`\n\n以上 JSON 符合标准 RFC 8259 规范，可直接复制或集成至项目配置中。`,
      timestamp,
    }
  }

  // Shell 命令或脚本请求
  if (
    trimmed.toLowerCase().includes('shell') ||
    trimmed.toLowerCase().includes('bash') ||
    trimmed.includes('脚本') ||
    trimmed.includes('终端') ||
    trimmed.includes('命令行')
  ) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content: `以下是常用的 Shell 命令行操作与配置脚本：\n\n\`\`\`shell\n#!/bin/bash\n# 初始化英语词汇分析任务\nset -euo pipefail\n\necho "Starting text analysis..."\ncurl -s https://api.dictionaryapi.dev/api/v2/entries/en/ephemeral | jq '.[0].meanings'\n\n# 检查工作目录状态\ngit status --short\n\`\`\`\n\n你可以直接点击右上角「复制」按钮在终端中执行。`,
      timestamp,
    }
  }

  // HTML 模板或片段请求
  if (trimmed.toLowerCase().includes('html') || trimmed.includes('网页') || trimmed.includes('前端标签')) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content: `以下是对应的语义化 HTML 结构代码：\n\n\`\`\`html\n<article class="word-card">\n  <header class="word-header">\n    <h1 class="word-title">ephemeral</h1>\n    <span class="badge">GRE Core</span>\n  </header>\n  <section class="word-content">\n    <p>Lasting for a very short time; transitory.</p>\n  </section>\n</article>\n\`\`\`\n\n该结构遵循 W3C 语义化标签规范。`,
      timestamp,
    }
  }

  // 显式 Markdown 格式请求
  if (trimmed.toLowerCase().includes('markdown') || trimmed.toLowerCase().includes('md格式')) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content: `# 英语学习知识库指南\n\n> 语言学习的核心在于持续的真实语境输入与精准输出。\n\n## 推荐核心策略\n\n- **刻意练习**：针对易混淆近义词建立辨析卡片\n- **高频语料**：阅读经济学人或学术真题长句\n- **知识沉淀**：定期复盘生词本\n\n\`\`\`markdown\n# 笔记标题示例\n- 关键要点 A\n- 关键要点 B\n\`\`\`\n\n祝你学习高效！`,
      timestamp,
    }
  }

  // 语法或长难句分析
  if (
    trimmed.includes('语法') ||
    trimmed.includes('长难句') ||
    trimmed.includes('句式') ||
    trimmed.includes('成分') ||
    trimmed.includes('分析句子')
  ) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content:
        `针对你的句子与语法分析提问：\n\n“${trimmed}”\n\n**核心语法要点解析**：\n• **主谓核心**：建议先找句子的主谓核心，剥离从句与修饰成分。\n• **结构逻辑**：复合长句中常通过并列连词或从属连词实现多层递进。\n• **修改建议**：可通过非谓语分词短语或名词化来提升紧凑度与正式学术风格。`,
      timestamp,
    }
  }

  // 词义辨析或区别
  if (
    trimmed.includes('区别') ||
    trimmed.includes('辨析') ||
    trimmed.includes('不同') ||
    trimmed.includes('近义')
  ) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content:
        `关于你提到的语义与用法辨析：\n\n“${trimmed}”\n\n**语感与适用场景差异**：\n1. **语域与正式度**：学术论文与正式报告偏好拉丁词源书面词，日常对话常用动词短语。\n2. **搭配习惯**：注意动宾搭配与介词固定搭配的排他性。\n3. **感情色彩**：有些词带有潜在的怀疑色彩，而相近词可能保持中性或褒义。`,
      timestamp,
    }
  }

  // 纯文本回复（当用户只是打招呼或简短询问时，不加任何 Markdown 符号、无粗体、无标题、无代码块，测试纯文本兜底）
  if (/^(hi|hello|hey|你好|哈喽|嗨)[!！\s]*$/i.test(trimmed)) {
    return {
      id: `ai-${timestamp}`,
      role: 'assistant',
      content:
        '你好！我是你的 MyWords 顾问。你可以向我咨询任何问题，包括获取 HTML 模板、JSON 数据结构、Shell 命令行脚本、Markdown 笔记，或者讨论复杂的语法疑难。',
      timestamp,
    }
  }

  // 通用回答
  return {
    id: `ai-${timestamp}`,
    role: 'assistant',
    content:
      `收到你的提问：${trimmed}\n\n对于这个复杂问题，我们可以从核心逻辑、应用语境与实践建议三个维度来深入探讨。如有更具体的要求，欢迎随时输入！`,
    timestamp,
  }
}
