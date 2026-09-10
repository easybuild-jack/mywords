'use client'

import { useState, useEffect } from 'react'
import { isAuthorSyncToken, getSyncToken } from '@/lib/permissions'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/**
 * 响应式监听当前用户是否为作者本人的 Hook
 */
export function useIsAuthor(): boolean {
  const [isAuthor, setIsAuthor] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsAuthor(isAuthorSyncToken(getSyncToken()))
    }
    check()

    // 监听其他标签页的 storage 变更以及同窗口的自定义事件
    window.addEventListener('storage', check)
    window.addEventListener('mywords_sync_token_changed', check)

    return () => {
      window.removeEventListener('storage', check)
      window.removeEventListener('mywords_sync_token_changed', check)
    }
  }, [])

  return isAuthor
}

/**
 * 响应式判断当前是否允许修改单词切分与构词的 Hook
 */
export function useCanEditWordSplit(): boolean {
  const isAuthor = useIsAuthor()
  const currentBook = useWorkspaceStore((s) => s.currentBook)
  return isAuthor || Boolean(currentBook?.isCustom)
}
