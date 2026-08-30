/**
 * 应用皮肤（仅配色，不改布局/字号/间距）。
 * 任何与色彩相关的 token 都在这里集中维护，SkinApplier 会按当前选中
 * 的皮肤把这些值写进 documentElement 的 inline style 上；globals.css
 * 里的 [data-skin] 兜底规则负责首屏渲染，避免闪色。
 */

export interface SkinTokens {
  /** 主背景（body / 主内容区） */
  background: string
  /** 侧栏背景（与主背景区分，营造层次） */
  sidebarBg: string
  /** 品牌主色 —— Tailwind 的 text-primary / bg-primary / border-primary */
  primary: string
  /** 拆成 r g b 的数字串，配合 rgb(var(--primary-rgb) / 0.x) 拼光晕 */
  primaryRgb: string
  /** 主色的 hover 态 */
  primaryHover: string
  /** focus 环颜色 */
  ring: string
  /** glass-card / 工具栏玻璃面板背景 */
  card: string
  /** 玻璃面板描边 */
  border: string
  /** 弱化背景块（按钮、徽标） */
  muted: string
  /** 弱化文字色 */
  mutedForeground: string
}

export interface Skin {
  id: string
  /** 工具栏里显示的名字 */
  name: string
  /** 选项卡片副标题 */
  tagline: string
  tokens: SkinTokens
}

export const SKINS: Skin[] = [
  {
    id: 'slate-mint',
    name: '沉静薄荷',
    tagline: '冷色石板 + 柔薄荷（推荐）',
    tokens: {
      background: '#0E1216',
      sidebarBg: '#161B22',
      primary: '#5EEAD4',
      primaryRgb: '94 234 212',
      primaryHover: '#99F6E4',
      ring: '#5EEAD4',
      card: 'rgba(255, 255, 255, 0.045)',
      border: 'rgba(255, 255, 255, 0.07)',
      muted: 'rgba(255, 255, 255, 0.06)',
      mutedForeground: '#94A3B8',
    },
  },
  {
    id: 'classic-emerald',
    name: '经典翠绿',
    tagline: '保留原配色 —— 黑底霓虹绿',
    tokens: {
      background: '#0B0C0E',
      sidebarBg: '#0B0C0E',
      primary: '#34D399',
      primaryRgb: '52 211 153',
      primaryHover: '#6EE7B7',
      ring: '#34D399',
      card: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      muted: 'rgba(255, 255, 255, 0.08)',
      mutedForeground: '#9CA3AF',
    },
  },
  {
    id: 'midnight-cyan',
    name: '冷月青',
    tagline: '深靛蓝 + 天青',
    tokens: {
      background: '#0A0E1A',
      sidebarBg: '#11172A',
      primary: '#7DD3FC',
      primaryRgb: '125 211 252',
      primaryHover: '#BAE6FD',
      ring: '#7DD3FC',
      card: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(125, 211, 252, 0.10)',
      muted: 'rgba(255, 255, 255, 0.06)',
      mutedForeground: '#94A3B8',
    },
  },
  {
    id: 'warm-amber',
    name: '暖石琥珀',
    tagline: '暖炭灰 + 琥珀金',
    tokens: {
      background: '#0F0E0E',
      sidebarBg: '#1A1717',
      primary: '#FEBC2E',
      primaryRgb: '254 188 46',
      primaryHover: '#FCD34D',
      ring: '#FEBC2E',
      card: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(254, 188, 46, 0.10)',
      muted: 'rgba(255, 255, 255, 0.06)',
      mutedForeground: '#94A3B8',
    },
  },
]

export const DEFAULT_SKIN_ID = 'slate-mint'

export function getSkin(id: string | undefined | null): Skin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]
}

/** 把一份 token 写进 documentElement 的 inline style 上，立即生效 */
export function applySkinTokens(tokens: SkinTokens) {
  const root = document.documentElement
  root.style.setProperty('--background', tokens.background)
  root.style.setProperty('--sidebar-bg', tokens.sidebarBg)
  root.style.setProperty('--primary', tokens.primary)
  root.style.setProperty('--primary-rgb', tokens.primaryRgb)
  root.style.setProperty('--primary-hover', tokens.primaryHover)
  root.style.setProperty('--ring', tokens.ring)
  root.style.setProperty('--card', tokens.card)
  root.style.setProperty('--border', tokens.border)
  root.style.setProperty('--muted', tokens.muted)
  root.style.setProperty('--muted-foreground', tokens.mutedForeground)
}
