'use client'

import { useEffect } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { applySkinTokens, getSkin } from '@/lib/skins'

/**
 * 皮肤应用器：不渲染任何 DOM，只负责在挂载 / skinId 变化时
 * 把对应 token 写到 documentElement 上，让全局 CSS 变量即时切换。
 * globals.css 里的 [data-skin=...] 兜底块保证首屏不闪色。
 */
export function SkinApplier() {
  const skinId = useWorkspaceStore((s) => s.skinId)

  useEffect(() => {
    const skin = getSkin(skinId)
    applySkinTokens(skin.tokens)
    document.documentElement.setAttribute('data-skin', skin.id)
  }, [skinId])

  return null
}
