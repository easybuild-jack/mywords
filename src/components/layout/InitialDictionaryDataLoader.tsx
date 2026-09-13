'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  isDictionaryCacheInitialized,
  initializeOfflineDictionaryCache,
  type InitProgressState,
} from '@/core/offlineDictionaryInitializer'
import { Sparkles, CheckCircle2, Flag, Flame } from 'lucide-react'

const GAME_TIPS = [
  '💡 离线优势：内置 10,289 个核心词汇完全保存在本地，查词背词毫秒响应，零网络依赖且不消耗 AI 额度。',
  '💡 构词奥秘：词根词缀是英语单词的“偏旁部首”，掌握常见核心词根可轻松触类旁通 3,000+ 词汇。',
  '💡 自然拼读：音节切分遵循国际音系规则，看着音节按键跟打，发音与手指肌肉记忆更加牢固。',
  '💡 学习推荐：四六级、考研与核心 4000 词已全量适配语义单元，可按主题和难度模块化推进。',
  '💡 智能导入：支持从外部一键导入自定义生词，系统自动在本地 10,000+ 离线库中毫秒匹配发音与释义。',
  '💡 机械键盘：内置 14 款精调机械键盘音效，配合沉浸式击键反馈，享受指尖上的打字节拍。',
]

export function InitialDictionaryDataLoader() {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [progressState, setProgressState] = useState<InitProgressState>({
    stage: 'checking',
    percentage: 0,
    message: '正在检测离线词库状态...',
  })
  const [tipIndex, setTipIndex] = useState(0)
  const hasStartedRef = useRef(false)

  // 轮播游戏加载小贴士
  useEffect(() => {
    if (!isVisible) return
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % GAME_TIPS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [isVisible])

  // 执行词库构建逻辑
  const runDictionaryInitialization = async () => {
    setIsVisible(true)
    setIsExiting(false)
    setProgressState({
      stage: 'checking',
      percentage: 5,
      message: '正在准备官方词典资源...',
    })

    try {
      await initializeOfflineDictionaryCache((state) => {
        setProgressState(state)
      })

      // 100% 冲线后展示欢庆仪式感，稍作停顿后平滑淡出
      setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => {
          setIsVisible(false)
          setIsExiting(false)
        }, 500)
      }, 700)
    } catch (err) {
      console.error('Failed to initialize offline dictionary cache:', err)
      setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => setIsVisible(false), 400)
      }, 1500)
    }
  }

  // 首屏挂载检测：如果未初始化则自动弹出全屏游戏加载
  useEffect(() => {
    let isMounted = true

    async function checkInit() {
      const alreadyDone = await isDictionaryCacheInitialized()
      if (alreadyDone || !isMounted) {
        return
      }
      if (hasStartedRef.current) return
      hasStartedRef.current = true

      runDictionaryInitialization()
    }

    checkInit()

    // 监听重新构建离线词库事件（可在设置中随时手动触发重跑）
    const handleRebuildEvent = () => {
      runDictionaryInitialization()
    }
    window.addEventListener('mywords_rebuild_dict_cache', handleRebuildEvent)

    return () => {
      isMounted = false
      window.removeEventListener('mywords_rebuild_dict_cache', handleRebuildEvent)
    }
  }, [])

  if (!isVisible) return null

  const isCompleted = progressState.percentage >= 100
  // 小象横向位移：从 4% 平滑跑到 94%
  const mascotLeft = Math.max(4, Math.min(94, progressState.percentage))

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-[#0B0F14] select-none transition-all duration-500 ease-out ${
        isExiting ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 嵌入条纹动画样式 */}
      <style>{`
        @keyframes gameBarStripes {
          0% { background-position: 0 0; }
          100% { background-position: 36px 0; }
        }
        .anim-stripes {
          background-image: repeating-linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.18) 0px,
            rgba(255, 255, 255, 0.18) 9px,
            transparent 9px,
            transparent 18px
          );
          background-size: 36px 18px;
          animation: gameBarStripes 0.9s linear infinite;
        }
      `}</style>

      {/* 主体容器：清晰高对比度，无任何发光模糊 */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        {/* 顶部清晰 HUD 标签 */}
        <div className="text-center mb-8 flex flex-col items-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
            <Flame className="size-3.5 text-emerald-400" />
            <span>MYWORDS ENGINE BOOT</span>
            <span className="size-1.5 rounded-full bg-emerald-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>正在载入离线大词库</span>
            <Sparkles className="size-5 text-emerald-400 inline-block" />
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            正在预装 10,289 个核心高频词汇，建立本地离线高速索引，开启毫秒级离线查词
          </p>
        </div>

        {/* ======================= 核心：跑道与小象平稳移动 ======================= */}
        <div className="w-full relative py-2">
          {/* 终点站标旗帜（尺寸与位置完全固定） */}
          <div className="absolute -top-1 right-0.5 z-20 flex flex-col items-center pointer-events-none">
            <div className={`p-1.5 rounded-full border transition-colors duration-300 ${
              isCompleted 
                ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Flag className="size-3.5 fill-current" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 mt-0.5">FINISH</span>
          </div>

          {/* 小象平稳移动层（高度锁定 h-16） */}
          <div className="relative w-full h-16 pointer-events-none">
            <div
              className="absolute bottom-1 -translate-x-1/2 transition-all duration-500 ease-out flex flex-col items-center"
              style={{ left: `${mascotLeft}%` }}
            >
              {/* 小象图形主体（尺寸固定，无跳跃抖动） */}
              <div className="size-13 flex items-center justify-center">
                <img
                  src="/logo111.png"
                  alt="MyWords Mascot"
                  className="size-full object-contain"
                />
              </div>

              {/* 随动平稳实体小微投影 */}
              <div className="w-7 h-1 rounded-full bg-slate-950/70 mt-0.5 scale-x-90" />
            </div>
          </div>

          {/* 进度条外壳（高度固定 h-4） */}
          <div className="relative w-full h-4 rounded-full bg-slate-900 border border-slate-700 p-0.5 overflow-hidden">
            {/* 动态进度填充条（宽度平滑过渡） */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out relative"
              style={{ width: `${progressState.percentage}%` }}
            >
              {/* 斑马流动纹理 */}
              <div className="absolute inset-0 anim-stripes opacity-60" />
              {/* 前端清晰高亮线 */}
              <div className="absolute right-0 top-0 bottom-0 w-1.5 rounded-r-full bg-white/90" />
            </div>
          </div>

          {/* 进度条下方清晰 HUD 行（高度固定 h-6，左侧图标外框固定 size-4，防推挤抖动） */}
          <div className="flex items-center justify-between mt-3 px-0.5 h-6">
            {/* 状态文案 */}
            <div className="flex items-center gap-2 truncate text-xs text-slate-200 font-medium">
              <div className="size-4 shrink-0 flex items-center justify-center">
                {isCompleted ? (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                ) : (
                  <div className="size-2 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className="truncate font-sans tracking-wide">
                {progressState.message}
              </span>
            </div>

            {/* 百分比清晰纯色 HUD */}
            <div className="flex items-baseline gap-0.5 shrink-0 font-mono text-lg font-bold text-emerald-400 tracking-tight">
              <span>{progressState.percentage}</span>
              <span className="text-xs text-emerald-400/80 font-normal">%</span>
            </div>
          </div>

          {/* 词数统计 HUD（结构永远常驻，高度锁定 h-4 mt-1.5，彻底解决快结束时突然多出一行导致的页面闪跳） */}
          <div className="flex items-center justify-between px-0.5 mt-1.5 h-4 text-[11px] font-mono text-slate-400">
            <span>LOCAL DICTIONARY CACHE</span>
            <span className="text-slate-300">
              {progressState.totalWords
                ? (progressState.processedWords
                    ? `${progressState.processedWords.toLocaleString()} / ${progressState.totalWords.toLocaleString()} 词`
                    : `${progressState.totalWords.toLocaleString()} 词待装载`)
                : '10,289 核心词待装载'}
            </span>
          </div>
        </div>

        {/* ======================= 清晰游戏小贴士卡片（高度固定 h-[62px]，多行切换不伸缩） ======================= */}
        <div className="mt-6 p-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 max-w-lg w-full h-[62px] flex items-center justify-center text-center">
          <p className="leading-relaxed line-clamp-2">
            {GAME_TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  )
}
