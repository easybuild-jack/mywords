import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { RouteProgressBar } from '@/components/layout/RouteProgressBar'
import { PageTransitionWrapper } from '@/components/layout/PageTransitionWrapper'
import { SkinApplier } from '@/components/layout/SkinApplier'
import { ImportModal } from '@/components/modals/ImportModal'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { AiApiKeyPromptModal } from '@/components/modals/AiApiKeyPromptModal'
import { ExternalSyncManager } from '@/components/sync/ExternalSyncManager'
import { AiAssistantDrawer } from '@/components/ai/AiAssistantDrawer'
import { AiFloatingTrigger } from '@/components/ai/AiFloatingTrigger'

export const metadata: Metadata = {
  title: 'MyWords — 您的私人专属英语单词学习搭子',
  description: '打造属于您的专属英语单词库，结合音节拼读、构词法拆解与肌肉记忆的高效记忆系统。',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-background text-foreground flex antialiased overflow-hidden">
        {/* 全局顶部路由流光进度条 */}
        <RouteProgressBar />

        {/* 左侧全局常驻侧边栏 */}
        <Sidebar />

        {/* 右侧主内容区 */}
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden flex flex-col justify-between relative">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </main>

        {/* 全局 AI 助手抽屉与右侧常驻触发器 */}
        <AiFloatingTrigger />
        <AiAssistantDrawer />

        {/* 皮肤应用器（无 UI，挂载即生效） */}
        <SkinApplier />

        {/* 全局弹窗 */}
        <ImportModal />
        <SettingsModal />
        <AiApiKeyPromptModal />

        {/* 外部小工具实时同步监听器 */}
        <ExternalSyncManager />
      </body>
    </html>
  )
}
