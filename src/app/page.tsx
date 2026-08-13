import { redirect } from 'next/navigation'

/**
 * 主工作台已按学习/默写拆成两个独立页面，根路径直接落到学习页。
 * 将来若要在这里做首页仪表盘，替换掉这次重定向即可。
 */
export default function RootPage() {
  redirect('/learn')
}
