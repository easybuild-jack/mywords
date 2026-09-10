import { useState, useEffect } from 'react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/** 作者本人的专属同步密钥标识（硬编码判定） */
export const AUTHOR_SYNC_TOKEN = 'myword_jack'

/**
 * 判断指定 Token 是否为作者本人
 */
export function isAuthorSyncToken(token?: string | null): boolean {
  return (token || '').trim() === AUTHOR_SYNC_TOKEN
}

/**
 * 获取当前客户端配置的同步 Token
 */
export function getSyncToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem('mywords_sync_token') || ''
  } catch {
    return ''
  }
}

/**
 * 判断当前环境是否为作者本人
 */
export function isCurrentAuthor(): boolean {
  return isAuthorSyncToken(getSyncToken())
}

/**
 * 判断是否具备修改单词切分与构词的权限
 * - 作者本人（Token === 'myword_jack'）：拥有所有词库（官方 + 自定义）的修改权限
 * - 其他用户：仅能修改自己定义的词库（isCustom === true）里面的单词
 */
export function canModifyWordSplit(isCustomBook?: boolean): boolean {
  return isCurrentAuthor() || Boolean(isCustomBook)
}

/**
 * 响应式监听当前用户是否为作者本人的 Hook
 */
export function useIsAuthor(): boolean {
  const [isAuthor, setIsAuthor] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsAuthor(isCurrentAuthor())
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
