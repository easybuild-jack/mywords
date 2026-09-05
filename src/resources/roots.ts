import type { RootItem } from '@/types'
import prefixesData from '../../public/dicts/roots/prefixes.json'
import suffixesData from '../../public/dicts/roots/suffixes.json'
import rootsData from '../../public/dicts/roots/roots.json'

export type RootTabType = 'prefix' | 'suffix' | 'root'

/**
 * 核心词缀与词根数据源（按顺序：前缀 -> 后缀 -> 词根）
 * 数据已分别抽取并持久化到 public/dicts/roots/{prefixes,suffixes,roots}.json
 * 字段结构完全一致，支持在同一个页面展示与学习
 */
export const BUILTIN_PREFIXES: RootItem[] = prefixesData as RootItem[]
export const BUILTIN_SUFFIXES: RootItem[] = suffixesData as RootItem[]
export const BUILTIN_ROOTS: RootItem[] = rootsData as RootItem[]

export const ROOT_DATA_MAP: Record<RootTabType, RootItem[]> = {
  prefix: BUILTIN_PREFIXES,
  suffix: BUILTIN_SUFFIXES,
  root: BUILTIN_ROOTS,
}

export const ROOT_TAB_LABELS: Record<RootTabType, string> = {
  prefix: '前缀',
  suffix: '后缀',
  root: '词根',
}
