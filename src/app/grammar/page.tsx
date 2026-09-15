'use client'

import React, { useState } from 'react'
import { GrammarHeader } from '@/components/grammar/GrammarHeader'
import { PartsOfSpeechView } from '@/components/grammar/PartsOfSpeechView'
import { SentenceDerivationView } from '@/components/grammar/SentenceDerivationView'
import { TenseMatrixView } from '@/components/grammar/TenseMatrixView'
import { PrepositionView } from '@/components/grammar/PrepositionView'
import { GrammarTabType } from '@/resources/grammarData'

export default function GrammarPage() {
  const [activeTab, setActiveTab] = useState<GrammarTabType>('partsOfSpeech')

  return (
    <div className="grammar-page flex-1 min-h-full w-full flex flex-col bg-background text-foreground">
      {/* 顶部全局吸顶工具与导航栏 */}
      <GrammarHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 主研习舞台 */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-6 md:px-8 lg:px-10 pt-4 pb-16 space-y-8 animate-fadeIn">
        {activeTab === 'partsOfSpeech' && <PartsOfSpeechView />}

        {activeTab === 'sentenceSyntax' && <SentenceDerivationView />}

        {activeTab === 'tenses' && <TenseMatrixView />}

        {activeTab === 'prepositions' && <PrepositionView />}
      </div>
    </div>
  )
}
