'use client'

import React from 'react'
import Link from 'next/link'
import {
  Volume2,
  Headphones,
  Keyboard,
  Search,
  X,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
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
  { id: 'all', label: '全部音标', count: 48 },
  { id: 'monophthong', label: '单元音', count: 12 },
  { id: 'diphthong', label: '双元音', count: 8 },
  { id: 'plosive', label: '爆破音', count: 6 },
  { id: 'fricative', label: '摩擦音', count: 10 },
  { id: 'affricate', label: '破擦音', count: 6 },
  { id: 'nasal_liquid', label: '鼻辅通音', count: 6 },
]

const PHONICS_FILTER_OPTIONS: { id: PhonicsFilterType; label: string; badgeColor: string }[] = [
  { id: 'all', label: '全部规律', badgeColor: 'bg-primary/20 text-primary' },
  { id: 'vowel-vowel', label: '🟣 元元组合', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'vowel-consonant', label: '🔵 元辅组合', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { id: 'consonant-consonant', label: '🟢 辅辅组合', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
]

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

  return (
    <div className="w-full space-y-3.5 shrink-0">
      {/* 顶部主标题栏与快捷操作（去除生硬割裂线，与词库管理页保持自然流式排版） */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary shadow-sm shadow-primary/10 shrink-0">
            <Volume2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-foreground">音标与拼读研习</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/25">
                48 IPA + 自然拼读
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              掌握标准国际音标发音要领，洞悉字母组合拼读奥秘，听声能拼，见词能读
            </p>
          </div>
        </div>

        {/* 右侧控制：美音/英音、语速调节、直达音标默写 */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* 口音倾向切换 */}
          <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/40 text-xs">
            <button
              type="button"
              onClick={() => setPhoneticPreference('us')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                phoneticPreference === 'us'
                  ? 'bg-primary text-[#0B0C0E] font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🇺🇸 美音
            </button>
            <button
              type="button"
              onClick={() => setPhoneticPreference('uk')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                phoneticPreference === 'uk'
                  ? 'bg-primary text-[#0B0C0E] font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🇬🇧 英音
            </button>
          </div>

          {/* 语速选择 */}
          <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/40 text-xs">
            {[0.8, 1.0, 1.2].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setAudioRate(rate)}
                className={`px-2 py-1 rounded-md font-mono transition-all ${
                  Math.abs(audioRate - rate) < 0.05
                    ? 'bg-primary/20 text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* 直达音标默写 */}
          <Link
            href="/phonetics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
          >
            <Keyboard className="size-3.5" />
            <span>音标默写练习</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* 中部选项卡切换 (48音标 vs 字母组合拼读) 与搜索 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center p-1 bg-muted/40 border border-border/40 rounded-xl max-w-fit">
          <button
            type="button"
            onClick={() => onTabChange('ipa')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'ipa'
                ? 'bg-primary text-[#0B0C0E] shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Headphones className="size-3.5 sm:size-4" />
            <span>48个国际音标图谱</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'ipa' ? 'bg-black/20 text-[#0B0C0E]' : 'bg-muted text-muted-foreground'
              }`}
            >
              {totalIpaCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('phonics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'phonics'
                ? 'bg-primary text-[#0B0C0E] shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="size-3.5 sm:size-4" />
            <span>字母组合自然拼读</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'phonics' ? 'bg-black/20 text-[#0B0C0E]' : 'bg-muted text-muted-foreground'
              }`}
            >
              {totalPhonicsCount}
            </span>
          </button>
        </div>

        {/* 快捷搜索框 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              activeTab === 'ipa'
                ? '搜索音标、分类或代表词 (如 /iː/、see、bird...)'
                : '搜索字母组合或例词 (如 ir、ou、tion、bridge...)'
            }
            className="w-full h-9 pl-9 pr-14 bg-muted/30 focus:bg-background border border-border/40 focus:border-primary/50 rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-all outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              title="清空搜索"
            >
              <X className="size-3" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-muted border border-border/50 text-muted-foreground pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* 次级细分标签过滤条 */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs">
        {activeTab === 'ipa' ? (
          IPA_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onIpaFilterChange(opt.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg border font-medium transition-all ${
                ipaFilter === opt.id
                  ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm'
                  : 'bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {opt.label}
              {opt.count ? (
                <span className="ml-1.5 text-[10px] font-mono opacity-70">({opt.count})</span>
              ) : null}
            </button>
          ))
        ) : (
          PHONICS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPhonicsFilterChange(opt.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg border font-medium transition-all ${
                phonicsFilter === opt.id
                  ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm'
                  : 'bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {opt.label}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
