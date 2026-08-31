import type { WordItem, WordExample } from '@/types'

/** 预置常见词的高质量示范双语例句 */
const SAMPLE_WORD_EXAMPLES: Record<string, WordExample[]> = {
  cabbage: [
    {
      en: 'Fresh cabbage is packed with vitamin C, antioxidants, and dietary fiber.',
      cn: '新鲜的卷心菜富含维生素 C、抗氧化剂和膳食纤维。',
    },
    {
      en: 'She tossed shredded purple cabbage and carrots into the salad bowl.',
      cn: '她把切碎的紫甘蓝和胡萝卜丝拌入沙拉碗中。',
    },
    {
      en: 'Local farmers grow organic cabbages that taste exceptionally sweet in winter.',
      cn: '当地农夫种植的有机包菜在冬天的口感格外清甜。',
    },
  ],
  discover: [
    {
      en: 'Scientists continue to discover new species in deep ocean trenches.',
      cn: '科学家们不断在深海海沟中发现未知的新物种。',
    },
    {
      en: 'She discovered a natural talent for coding during her college years.',
      cn: '她在大学期间发现了自己在编程方面的天然天赋。',
    },
    {
      en: 'Exploring new cultures helps you discover different perspectives on life.',
      cn: '探索不同的文化能帮助你发现看待生活的全新视角。',
    },
  ],
  perspective: [
    {
      en: 'Traveling abroad gives you a completely fresh perspective on the world.',
      cn: '出国旅行能让你对整个世界产生全新的视角与见解。',
    },
    {
      en: 'We need to analyze this complex challenge from a broader perspective.',
      cn: '我们需要站在更宏观的视角来分析这一复杂挑战。',
    },
    {
      en: 'His calm perspective helped the team resolve the crisis efficiently.',
      cn: '他冷静的视角帮助团队高效化解了这场危机。',
    },
  ],
  international: [
    {
      en: 'The city hosted a major international conference on climate change.',
      cn: '该城市举办了一场关于气候变化的大型国际会议。',
    },
    {
      en: 'English serves as the universal language for international business and trade.',
      cn: '英语是国际商业与贸易往来中通用的全球语言。',
    },
    {
      en: 'Students from over fifty countries enrolled in the international program.',
      cn: '来自五十多个国家的学生报名参加了该国际交流项目。',
    },
  ],
  developer: [
    {
      en: 'The software developer optimized the algorithms to boost app performance.',
      cn: '软件开发人员优化了算法以大幅提升应用性能。',
    },
    {
      en: 'A full-stack developer builds both user interfaces and backend services.',
      cn: '全栈开发工程师既负责构建用户界面也维护后端服务。',
    },
    {
      en: 'Open source projects empower developers worldwide to collaborate freely.',
      cn: '开源项目赋能全球开发者自由协作并共同成长。',
    },
  ],
  algorithm: [
    {
      en: 'The recommendation algorithm delivers personalized content to every user.',
      cn: '推荐算法能够为每位用户精准分发个性化的内容。',
    },
    {
      en: 'Researchers developed an efficient search algorithm for large databases.',
      cn: '研究人员为海量数据库开发了一种极其高效的检索算法。',
    },
    {
      en: 'Understanding data structures and algorithms is essential for programmers.',
      cn: '掌握数据结构与算法是程序员不可或缺的基本功。',
    },
  ],
}

/** 预置常见词的词源与构词助记示范 */
const SAMPLE_ETYMOLOGY_EXTRAS: Record<string, { origin?: string; memoryHook?: string }> = {
  cabbage: {
    origin: '源自古法语 caboche（大头、圆颅），因其饱满圆硕的外形酷似人头而得名。',
    memoryHook: 'cab（出租车）+ bag（手提袋）+ e → 打出租车买了一大袋圆滚滚的卷心菜。',
  },
  discover: {
    origin: '源自古法语 descovrir，由 dis-（去除）+ covrir（遮盖）复合而成。',
    memoryHook: 'dis（去除）+ cover（覆盖、遮盖）→ 揭开覆盖物，也就是“发现、查明”。',
  },
  perspective: {
    origin: '源自拉丁语 perspectivus（透视的），来自 per-（穿过）+ specere（看）。',
    memoryHook: 'per（彻底穿透）+ spect（看）+ ive → 穿透迷雾看本质 → “视角、洞察力”。',
  },
  international: {
    origin: '由英国哲学家边沁于 1780 年创造，inter-（之间）+ nation（国家）+ -al。',
    memoryHook: 'inter（在...之间）+ national（国家的）→ 跨越国家之间的 → “国际的”。',
  },
  developer: {
    origin: '源自古法语 desveloper（展开、拆包），与 envelopper（包裹）相对。',
    memoryHook: 'de（解开）+ velop（包袱/面纱）+ er（人）→ 拨开迷雾开拓产品的人 → “开发者”。',
  },
}

/** 获取单词的 2 条精选双语例句（优先读取 JSON，缺省时智能回退） */
export function getWordExamples(word: WordItem): WordExample[] {
  if (word.examples && word.examples.length > 0) {
    return word.examples.slice(0, 2)
  }

  const key = word.name.toLowerCase().trim()
  if (SAMPLE_WORD_EXAMPLES[key]) {
    return SAMPLE_WORD_EXAMPLES[key].slice(0, 2)
  }

  // 通用兜底例句（保证任何新单词在对接完整 JSON 前排版依然充实好看）
  return [
    {
      en: `You can easily master the usage of "${word.name}" with regular daily practice.`,
      cn: `通过持续的日常跟打练习，你可以轻松掌握 "${word.name}" 的地道用法。`,
    },
    {
      en: `Paying attention to the context of "${word.name}" strengthens your long-term memory.`,
      cn: `关注 "${word.name}" 在真实语境中的搭配，能显著加深长久肌肉记忆。`,
    },
  ]
}

import { analyzeEtymology } from '@/lib/syllables'

/** 获取单词的词根词源补充信息（自动推导兜底，避免出现空白卡片） */
export function getWordEtymologyExtras(word: WordItem) {
  const key = word.name.toLowerCase().trim()
  const preset = SAMPLE_ETYMOLOGY_EXTRAS[key]

  let origin = word.etymology?.origin || preset?.origin
  let memoryHook = word.etymology?.memoryHook || preset?.memoryHook
  let derivation = word.etymology?.derivation

  // 如果没有显式词源，通过 analyzeEtymology 动态分析
  if (!origin && !memoryHook && !derivation) {
    const analyzed = analyzeEtymology(word.name)
    if (analyzed.derivation && !analyzed.derivation.endsWith('基础词汇')) {
      derivation = analyzed.derivation
    } else {
      origin = `核心词汇 · 音节分解：[ ${word.syllables && word.syllables.length > 0 ? word.syllables.join(' · ') : word.name} ]`
      memoryHook = `拼读规律：按音节节奏自然跟打，结合右侧语境强化记忆。`
    }
  }

  return { origin, memoryHook, derivation }
}
