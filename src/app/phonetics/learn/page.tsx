'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Keyboard,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import {
  PhoneticsLearnHeader,
  MainTabType,
  IpaFilterType,
  PhonicsFilterType,
} from '@/components/phonetics-learn/PhoneticsLearnHeader'
import { IpaMatrixView } from '@/components/phonetics-learn/IpaMatrixView'
import { PhonicsComboView } from '@/components/phonetics-learn/PhonicsComboView'
import { IpaDetailModal } from '@/components/phonetics-learn/IpaDetailModal'
import { IPA_SYMBOLS_DATA, IpaSymbolItem } from '@/resources/phoneticsData'
import { PHONICS_COMBOS_DATA } from '@/resources/phonicsComboData'

export default function PhoneticsLearnPage() {
  const [activeTab, setActiveTab] = useState<MainTabType>('ipa')
  const [ipaFilter, setIpaFilter] = useState<IpaFilterType>('all')
  const [phonicsFilter, setPhonicsFilter] = useState<PhonicsFilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 沉浸精读弹窗状态
  const [modalSymbolIndex, setModalSymbolIndex] = useState<number | null>(null)

  // 1. 过滤 48 国际音标
  const filteredIpaSymbols = useMemo(() => {
    return IPA_SYMBOLS_DATA.filter((item) => {
      // 分类筛选
      if (ipaFilter !== 'all') {
        if (ipaFilter === 'monophthong' && item.category !== 'monophthong') return false
        if (ipaFilter === 'diphthong' && item.category !== 'diphthong') return false
        if (ipaFilter === 'plosive' && item.category !== 'plosive') return false
        if (ipaFilter === 'fricative' && item.category !== 'fricative') return false
        if (ipaFilter === 'affricate' && item.category !== 'affricate') return false
        if (ipaFilter === 'nasal_liquid' && item.category !== 'nasal_liquid') return false
      }

      // 关键词搜索
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true

      const matchSym = item.symbol.toLowerCase().includes(q) || `/${item.symbol}/`.includes(q)
      const matchName = item.name.toLowerCase().includes(q)
      const matchTip = item.articulationTip.toLowerCase().includes(q)
      const matchSpell = item.commonSpellings.some((s) => s.toLowerCase().includes(q))
      const matchWord = item.words.some(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q) ||
          w.phonetic.toLowerCase().includes(q)
      )

      return matchSym || matchName || matchTip || matchSpell || matchWord
    })
  }, [ipaFilter, searchQuery])

  // 2. 过滤 字母组合自然拼读
  const filteredPhonicsCombos = useMemo(() => {
    return PHONICS_COMBOS_DATA.filter((item) => {
      // 分类筛选
      if (phonicsFilter !== 'all' && item.category !== phonicsFilter) {
        return false
      }

      // 关键词搜索
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true

      const matchPattern = item.pattern.toLowerCase().includes(q)
      const matchCategory = item.categoryLabel.toLowerCase().includes(q)
      const matchRule = item.ruleDescription.toLowerCase().includes(q)
      const matchIpa = item.phonetics.some((p) => p.toLowerCase().includes(q))
      const matchEx = item.examples.some(
        (ex) =>
          ex.word.toLowerCase().includes(q) ||
          ex.meaning.toLowerCase().includes(q) ||
          ex.phonetic.toLowerCase().includes(q)
      )

      return matchPattern || matchCategory || matchRule || matchIpa || matchEx
    })
  }, [phonicsFilter, searchQuery])

  // 点击音标卡片打开精读弹窗
  const handleSelectSymbol = (item: IpaSymbolItem) => {
    const idx = IPA_SYMBOLS_DATA.findIndex((s) => s.id === item.id)
    if (idx !== -1) {
      setModalSymbolIndex(idx)
    }
  }

  // 互相穿梭：从音标常见拼写跳转到字母组合规则
  const handleJumpToCombo = (combo: string) => {
    setActiveTab('phonics')
    setPhonicsFilter('all')
    setSearchQuery(combo)
  }

  // 互相穿梭：从字母组合音标跳转回 48 音标
  const handleJumpToIpa = (sym: string) => {
    setActiveTab('ipa')
    setIpaFilter('all')
    setSearchQuery(sym)
  }

  return (
    <div className="w-full text-foreground">
      {/* 顶部吸顶区域始终使用实色背景，避免滚动内容穿透和模糊层重绘 */}
      <div className="sticky top-0 isolate z-30 w-full bg-background border-b border-border/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10 pt-5 pb-4 space-y-3.5">
          <PhoneticsLearnHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            ipaFilter={ipaFilter}
            onIpaFilterChange={setIpaFilter}
            phonicsFilter={phonicsFilter}
            onPhonicsFilterChange={setPhonicsFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalIpaCount={IPA_SYMBOLS_DATA.length}
            totalPhonicsCount={PHONICS_COMBOS_DATA.length}
          />
        </div>
      </div>

      {/* 主体滚动内容区：严格对齐词库管理页规范，自然流式延展，不限制高度 */}
      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-8 lg:px-10 pt-4 pb-16 space-y-8">
        <div className="w-full">
          {activeTab === 'ipa' ? (
            <IpaMatrixView
              items={filteredIpaSymbols}
              onSelectSymbol={handleSelectSymbol}
              onJumpToCombo={handleJumpToCombo}
            />
          ) : (
            <PhonicsComboView
              items={filteredPhonicsCombos}
              onJumpToIpa={handleJumpToIpa}
            />
          )}
        </div>

        {/* 底部状态与强化跳转栏 */}
        <footer className="w-full border-t border-white/10 pt-6 pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 className="size-4 text-primary" />
              <span className="font-medium">
                48个国际音标 · 288个代表单词 · 35+组高频拼读组合
              </span>
            </div>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="text-gray-400">
              💡 提示：点击卡片可查看详情，按 <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-[10px] text-gray-200">/</kbd> 快速搜索
            </span>
          </div>

          <Link
            href="/phonetics"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold transition-all hover:scale-[1.02] active:scale-95"
          >
            <Keyboard className="size-4" />
            <span>前往音标默写强化练习</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </footer>
      </div>

      {/* 沉浸精读弹窗：absolute定位挂载在相对定位父容器下，仅覆盖右侧内容区，绝不遮挡左侧侧边栏 */}
      <IpaDetailModal
        isOpen={modalSymbolIndex !== null}
        onClose={() => setModalSymbolIndex(null)}
        currentIndex={modalSymbolIndex ?? 0}
        allSymbols={IPA_SYMBOLS_DATA}
        onNavigate={(newIdx) => setModalSymbolIndex(newIdx)}
        onJumpToCombo={handleJumpToCombo}
      />
    </div>
  )
}
