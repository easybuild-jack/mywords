/**
 * 不显示全局侧边栏、AI 悬浮入口等应用外壳的独立页面（如登录页）。
 * 统一在这里维护，避免各个外壳组件各自硬编码路径。
 */
const CHROMELESS_ROUTES = ['/login']

export function isChromelessRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return CHROMELESS_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

