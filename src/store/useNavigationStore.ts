import { create } from 'zustand'

interface NavigationStore {
  isLoading: boolean       // 页面加载遮罩是否显示（遮盖底层页面，防止切页抖动与闪烁）
  progress: number         // 顶部流光进度条当前百分比（0 - 100）
  isBarVisible: boolean    // 顶部流光进度条容器是否可见（控制整体淡入淡出）
  startNavigation: () => void
  onRouteChanged: () => void
  finishNavigation: () => void
}

let activeSessionId = 0
let navTimer1: NodeJS.Timeout | null = null
let navTimer2: NodeJS.Timeout | null = null
let navTimer3: NodeJS.Timeout | null = null
let finishTimer: NodeJS.Timeout | null = null
let settleTimer: NodeJS.Timeout | null = null
let cleanupTimer: NodeJS.Timeout | null = null
let safetyTimer: NodeJS.Timeout | null = null

function clearAllTimers() {
  if (navTimer1) clearTimeout(navTimer1)
  if (navTimer2) clearTimeout(navTimer2)
  if (navTimer3) clearTimeout(navTimer3)
  if (finishTimer) clearTimeout(finishTimer)
  if (settleTimer) clearTimeout(settleTimer)
  if (cleanupTimer) clearTimeout(cleanupTimer)
  if (safetyTimer) clearTimeout(safetyTimer)
}

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  isLoading: false,
  progress: 0,
  isBarVisible: false,

  startNavigation: () => {
    clearAllTimers()
    const sessionId = ++activeSessionId

    // 1. 瞬间拉起全景遮罩，以实底深黑完全遮盖底层 DOM，杜绝任何页面删刷与抖动
    // 进度条以 18% 优雅起步
    set({
      isLoading: true,
      isBarVisible: true,
      progress: 18,
    })

    // 2. 进度条更沉稳、更平缓地向前推进（拒绝匆忙跳闪）
    // 180ms 时推进到 42%
    navTimer1 = setTimeout(() => {
      if (activeSessionId !== sessionId) return
      set({ progress: 42 })
    }, 180)

    // 380ms 时推进到 68%
    navTimer2 = setTimeout(() => {
      if (activeSessionId !== sessionId) return
      set({ progress: 68 })
    }, 380)

    // 580ms 时推进到 85%
    navTimer3 = setTimeout(() => {
      if (activeSessionId !== sessionId) return
      set({ progress: 85 })
    }, 580)

    // 兜底保护：若 5 秒内因极端异常未完成，强制优雅收尾
    safetyTimer = setTimeout(() => {
      if (activeSessionId !== sessionId) return
      get().finishNavigation()
    }, 5000)
  },

  onRouteChanged: () => {
    if (!get().isLoading) return
    const sessionId = activeSessionId

    // 无论路由何时到达，确保进度条经历优雅完整的进程：
    // 顺畅推进到 92%，再冲刺到 100%
    // 保证从点击到 100% 走完有充足的、舒缓的节奏感（总耗时约 750ms - 850ms）
    const currentProgress = get().progress
    const delayTo92 = currentProgress < 50 ? 240 : 100

    finishTimer = setTimeout(() => {
      if (activeSessionId !== sessionId) return
      set({ progress: 92 })

      // 稳步冲刺到 100%
      settleTimer = setTimeout(() => {
        if (activeSessionId !== sessionId) return
        set({ progress: 100 })

        // 【核心保障】
        // 头部进度条到达 100% 后，CSS 宽度过渡需要约 320ms 走满全屏。
        // 我们等待 320ms（进度条物理走完 100%）+ 180ms（稳态停顿让用户清晰看到 100% 完成），共 500ms！
        // 严格遵循：等头部的进度走完，再关闭遮罩与 loading！
        cleanupTimer = setTimeout(() => {
          if (activeSessionId !== sessionId) return

          // 1. 关闭加载遮罩（底层页面已彻底就绪，无任何闪烁刷屏）
          set({ isLoading: false })

          // 2. 遮罩淡出（300ms）后，顶部进度条整体淡出隐藏
          setTimeout(() => {
            if (activeSessionId !== sessionId) return
            set({ isBarVisible: false })

            // 3. 进度条完全隐藏后，静默重置 progress 为 0（无逆向动画）
            setTimeout(() => {
              if (activeSessionId !== sessionId) return
              set({ progress: 0 })
            }, 200)
          }, 320)
        }, 500)
      }, 260)
    }, delayTo92)
  },

  finishNavigation: () => {
    const sessionId = activeSessionId
    clearAllTimers()

    set({ progress: 100 })
    cleanupTimer = setTimeout(() => {
      if (activeSessionId !== sessionId) return
      set({ isLoading: false })

      setTimeout(() => {
        if (activeSessionId !== sessionId) return
        set({ isBarVisible: false })

        setTimeout(() => {
          if (activeSessionId !== sessionId) return
          set({ progress: 0 })
        }, 200)
      }, 300)
    }, 480)
  },
}))
