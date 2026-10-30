'use client'

import React from 'react'
import Link from 'next/link'
import { Search, X, ArrowRight } from 'lucide-react'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

export type MainTabType = 'ipa' | 'phonics'
export type IpaFilterType = 'all' | 'monophthong' | 'diphthong' | 'plosive' | 'fricative' | 'affricate' | 'nasal_liquid'
export type PhonicsFilterType = 'all' | 'vowel-vowel' | 'vowel-consonant' | 'consonant-consonant'

interface PhoneticsLearnHeaderProps {
  activeTab: MainTabType
  onTabChange: (tab: MainTabType) => void
  ipaFilter: IpaFilterType
  onIpaFilterChange: (filter: IpaFilterType) => void
  phonicsFilter: PhonicsFilterType
  onPhonicsFilterChange: (filter: PhonicsFilterType) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  totalIpaCount: number
  totalPhonicsCount: number
}

const IPA_FILTER_OPTIONS: { id: IpaFilterType; label: string; count?: number }[] = [
  { id: 'all', label: '全部', count: 48 },
  { id: 'monophthong', label: '单元音', count: 12 },
  { id: 'diphthong', label: '双元音', count: 8 },
  { id: 'plosive', label: '爆破音', count: 6 },
  { id: 'fricative', label: '摩擦音', count: 10 },
  { id: 'affricate', label: '破擦音', count: 6 },
  { id: 'nasal_liquid', label: '鼻辅通音', count: 6 },
]

const PHONICS_FILTER_OPTIONS: { id: PhonicsFilterType; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'vowel-vowel', label: '元元组合' },
  { id: 'vowel-consonant', label: '元辅组合' },
  { id: 'consonant-consonant', label: '辅辅组合' },
]

const SEGMENT_BUTTON_CLASS = 'h-7 px-2.5 rounded-md text-xs transition-colors cursor-pointer'

function segmentClass(active: boolean) {
  return `${SEGMENT_BUTTON_CLASS} ${
    active ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
  }`
}

function filterClass(active: boolean) {
  return `shrink-0 h-7 px-2.5 rounded-md text-[13px] transition-colors cursor-pointer ${
    active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
  }`
}

export function PhoneticsLearnHeader({
  activeTab,
  onTabChange,
  ipaFilter,
  onIpaFilterChange,
  phonicsFilter,
  onPhonicsFilterChange,
  searchQuery,
  onSearchChange,
  totalIpaCount,
  totalPhonicsCount,
}: PhoneticsLearnHeaderProps) {
  const { phoneticPreference, setPhoneticPreference, audioRate, setAudioRate } = useWorkspaceStore()
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // 快捷键监听：/ 快速聚焦搜索框
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const tabs: { id: MainTabType; label: string; count: number }[] = [
    { id: 'ipa', label: '48 个国际音标', count: totalIpaCount },
    { id: 'phonics', label: '字母组合拼读', count: totalPhonicsCount },
  ]

  return (
    <div className="w-full shrink-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">音标与拼读</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            掌握国际音标的发音要领，理解字母组合的拼读规律，听声能拼，见词能读
          </p>
        </div>

        <div className="flex items-center gap-1 self-end md:self-auto flex-wrap text-xs">
          <button type="button" onClick={() => setPhoneticPreference('us')} className={segmentClass(phoneticPreference === 'us')}>
            美音
          </button>
          <button type="button" onClick={() => setPhoneticPreference('uk')} className={segmentClass(phoneticPreference === 'uk')}>
            英音
          </button>
          <span className="w-px h-4 bg-border mx-1.5" />
          {[0.8, 1.0, 1.2].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setAudioRate(rate)}
              className={`${segmentClass(Math.abs(audioRate - rate) < 0.05)} font-mono`}
            >
              {rate}x
            </button>
          ))}
          <span className="w-px h-4 bg-border mx-1.5" />
          <Link
            href="/phonetics"
            className="h-7 px-2.5 rounded-md inline-flex items-center gap-1 text-primary hover:bg-primary/10 transition-colors"
          >
            音标练习
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* 选项卡（下划线指示）与搜索 */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative -mb-px pb-2.5 text-sm transition-colors cursor-pointer border-b-2 ${
                  active
                    ? 'text-foreground font-medium border-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs font-mono text-muted-foreground">{tab.count}</span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:max-w-xs mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={activeTab === 'ipa' ? '搜索音标或例词，如 iː、see' : '搜索组合或例词，如 ou、tion'}
            className="w-full h-8 pl-8 pr-10 bg-white/[0.05] focus:bg-transparent border border-transparent focus:border-border rounded-md text-[13px] text-foreground placeholder:text-muted-foreground/70 transition-colors outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              title="清空搜索"
            >
              <X className="size-3" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 h-5 min-w-5 px-1 inline-flex items-center justify-center rounded border border-border border-b-2 font-mono text-[10px] text-muted-foreground pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* 次级分类过滤 */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pt-2.5 -ml-2.5">
        {activeTab === 'ipa'
          ? IPA_FILTER_OPTIONS.map((opt) => (
              <button key={opt.id} type="button" onClick={() => onIpaFilterChange(opt.id)} className={filterClass(ipaFilter === opt.id)}>
                {opt.label}
                {opt.count ? <span className="ml-1 text-[11px] font-mono opacity-60">{opt.count}</span> : null}
              </button>
            ))
          : PHONICS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onPhonicsFilterChange(opt.id)}
                className={filterClass(phonicsFilter === opt.id)}
              >
                {opt.label}
              </button>
            ))}
      </div>
    </div>
  )
}
