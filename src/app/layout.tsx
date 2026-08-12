import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { ImportModal } from '@/components/modals/ImportModal'
import { SettingsModal } from '@/components/modals/SettingsModal'

export const metadata: Metadata = {
  title: 'MyWords — 3D 音节拼读与肌肉记忆背单词',
  description: '专为深度英语学习者打造的音节拼读、构词法拆解与肌肉记忆闭环默写系统。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-easybuild-radial text-foreground flex antialiased overflow-hidden">
        {/* 左侧全局常驻侧边栏 */}
        <Sidebar />

        {/* 右侧主内容区 */}
        <main className="flex-1 h-screen overflow-y-auto flex flex-col justify-between relative">
          {children}
        </main>

        {/* 全局弹窗 */}
        <ImportModal />
        <SettingsModal />
      </body>
    </html>
  )
}
