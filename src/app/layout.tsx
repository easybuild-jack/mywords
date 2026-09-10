import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { SkinApplier } from '@/components/layout/SkinApplier'
import { ImportModal } from '@/components/modals/ImportModal'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { ExternalSyncManager } from '@/components/sync/ExternalSyncManager'

export const metadata: Metadata = {
  title: 'MyWords — 专属英语单词记忆 APP',
  description: '打造属于您的专属英语单词库，结合音节拼读、构词法拆解与肌肉记忆的高效记忆系统。',
  icons: {
    icon: '/logo.png',
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
        {/* 左侧全局常驻侧边栏 */}
        <Sidebar />

        {/* 右侧主内容区 */}
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden flex flex-col justify-between relative">
          {children}
        </main>

        {/* 皮肤应用器（无 UI，挂载即生效） */}
        <SkinApplier />

        {/* 全局弹窗 */}
        <ImportModal />
        <SettingsModal />

        {/* 外部小工具实时同步监听器 */}
        <ExternalSyncManager />
      </body>
    </html>
  )
}
