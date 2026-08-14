import type { VocabularyBook, WordItem } from '@/types'
import { splitIntoSyllables, analyzeEtymology } from '@/lib/syllables'
import { buildWordId } from '@/lib/wordId'

export const INITIAL_SAMPLE_WORDS: WordItem[] = [
  {
    id: 'word_discover',
    name: 'discover',
    syllables: ['dis', 'cov', 'er'],
    phoneticUk: '/dɪˈskʌvə(r)/',
    phoneticUs: '/dɪˈskʌvər/',
    posList: [
      { pos: 'v.', means: ['发现', '发掘', '查明'] }
    ],
    etymology: {
      prefix: { form: 'dis-', meaning: '否定/相反/去除' },
      root: { form: 'cover', meaning: '覆盖/遮盖' },
      derivation: '去除覆盖的东西 → 揭开、发现、发掘'
    }
  },
  {
    id: 'word_perspective',
    name: 'perspective',
    syllables: ['per', 'spec', 'tive'],
    phoneticUk: '/pəˈspektɪv/',
    phoneticUs: '/pərˈspektɪv/',
    posList: [
      { pos: 'n.', means: ['视角', '观点', '透视画法'] },
      { pos: 'adj.', means: ['透视的'] }
    ],
    etymology: {
      prefix: { form: 'per-', meaning: '完全/透过' },
      root: { form: 'spect', meaning: '看/观察' },
      suffix: { form: '-ive', meaning: '形容词/名词后缀' },
      derivation: '透过现象看本质 → 视角、观点、透视画法'
    }
  },
  {
    id: 'word_international',
    name: 'international',
    syllables: ['in', 'ter', 'na', 'tion', 'al'],
    phoneticUk: '/ˌɪntəˈnæʃnəl/',
    phoneticUs: '/ˌɪntərˈnæʃnəl/',
    posList: [
      { pos: 'adj.', means: ['国际的', '世界性的'] },
      { pos: 'n.', means: ['国际比赛'] }
    ],
    etymology: {
      prefix: { form: 'inter-', meaning: '在...之间/相互' },
      root: { form: 'nation', meaning: '国家/民族' },
      suffix: { form: '-al', meaning: '形容词后缀 (...的)' },
      derivation: '在国家与国家之间的 → 国际的、世界性的'
    }
  },
  {
    id: 'word_developer',
    name: 'developer',
    syllables: ['de', 'vel', 'op', 'er'],
    phoneticUk: '/dɪˈveləpə(r)/',
    phoneticUs: '/dɪˈveləpər/',
    posList: [
      { pos: 'n.', means: ['开发者', '显影剂', '房地产开发商'] }
    ],
    etymology: {
      prefix: { form: 'de-', meaning: '除去/展开' },
      root: { form: 'velop', meaning: '包裹' },
      suffix: { form: '-er', meaning: '从事...的人' },
      derivation: '将包裹展开的人 → 开发者、开拓者'
    }
  },
  {
    id: 'word_application',
    name: 'application',
    syllables: ['ap', 'pli', 'ca', 'tion'],
    phoneticUk: '/ˌæplɪˈkeɪʃn/',
    phoneticUs: '/ˌæplɪˈkeɪʃn/',
    posList: [
      { pos: 'n.', means: ['应用程序', '申请', '应用', '专心'] }
    ],
    etymology: {
      prefix: { form: 'ap-', meaning: '向/朝' },
      root: { form: 'plic', meaning: '重叠/折叠' },
      suffix: { form: '-ation', meaning: '名词后缀' },
      derivation: '折叠贴近于特定场景 → 应用、申请'
    }
  },
  {
    id: 'word_education',
    name: 'education',
    syllables: ['ed', 'u', 'ca', 'tion'],
    phoneticUk: '/ˌedʒuˈkeɪʃn/',
    phoneticUs: '/ˌedʒuˈkeɪʃn/',
    posList: [
      { pos: 'n.', means: ['教育', '培养', '修养'] }
    ],
    etymology: {
      prefix: { form: 'e-', meaning: '出/引出' },
      root: { form: 'duc', meaning: '引导' },
      suffix: { form: '-ation', meaning: '名词后缀' },
      derivation: '引导出人的潜能 → 教育、培养'
    }
  },
  {
    id: 'word_algorithm',
    name: 'algorithm',
    syllables: ['al', 'go', 'rithm'],
    phoneticUk: '/ˈælɡərɪðəm/',
    phoneticUs: '/ˈælɡərɪðəm/',
    posList: [
      { pos: 'n.', means: ['算法', '运算法则'] }
    ],
    etymology: {
      root: { form: 'algorithm', meaning: '源自波斯数学家花拉子米' },
      derivation: '解决问题的清晰计算步骤 → 算法'
    }
  },
  {
    id: 'word_experience',
    name: 'experience',
    syllables: ['ex', 'pe', 'ri', 'ence'],
    phoneticUk: '/ɪkˈspɪəriəns/',
    phoneticUs: '/ɪkˈspɪriəns/',
    posList: [
      { pos: 'n.', means: ['经验', '经历', '体验'] },
      { pos: 'v.', means: ['经历', '感受'] }
    ],
    etymology: {
      prefix: { form: 'ex-', meaning: '出/完全' },
      root: { form: 'peri', meaning: '尝试/冒险' },
      suffix: { form: '-ence', meaning: '名词后缀' },
      derivation: '亲身经历尝试出来的 → 经验、体验'
    }
  },
  {
    id: 'word_understand',
    name: 'understand',
    syllables: ['un', 'der', 'stand'],
    phoneticUk: '/ˌʌndəˈstænd/',
    phoneticUs: '/ˌʌndərˈstænd/',
    posList: [
      { pos: 'v.', means: ['理解', '懂', '获悉'] }
    ],
    etymology: {
      prefix: { form: 'under-', meaning: '在...之中' },
      root: { form: 'stand', meaning: '站立' },
      derivation: '站在事物内部去观察 → 理解、领会'
    }
  },
  {
    id: 'word_inspect',
    name: 'inspect',
    syllables: ['in', 'spect'],
    phoneticUk: '/ɪnˈspekt/',
    phoneticUs: '/ɪnˈspekt/',
    posList: [
      { pos: 'v.', means: ['检查', '视察', '检阅'] }
    ],
    etymology: {
      prefix: { form: 'in-', meaning: '向内/深入' },
      root: { form: 'spect', meaning: '看/观察' },
      derivation: '往里面仔细看 → 检查、视察'
    }
  },
  {
    id: 'word_export',
    name: 'export',
    syllables: ['ex', 'port'],
    phoneticUk: '/ˈekspɔːt/',
    phoneticUs: '/ˈekspɔːrt/',
    posList: [
      { pos: 'v.', means: ['出口', '输出'] },
      { pos: 'n.', means: ['出口产品'] }
    ],
    etymology: {
      prefix: { form: 'ex-', meaning: '向外/出' },
      root: { form: 'port', meaning: '搬运/港口' },
      derivation: '向外搬运输出 → 出口'
    }
  },
  {
    id: 'word_import',
    name: 'import',
    syllables: ['im', 'port'],
    phoneticUk: '/ˈɪmpɔːt/',
    phoneticUs: '/ˈɪmpɔːrt/',
    posList: [
      { pos: 'v.', means: ['进口', '输入', '引入'] },
      { pos: 'n.', means: ['进口商品', '意义'] }
    ],
    etymology: {
      prefix: { form: 'im-', meaning: '向内/入' },
      root: { form: 'port', meaning: '搬运/港口' },
      derivation: '向内搬运输入 → 进口、引入'
    }
  },
  {
    id: 'word_important',
    name: 'important',
    syllables: ['im', 'por', 'tant'],
    phoneticUk: '/ɪmˈpɔːtnt/',
    phoneticUs: '/ɪmˈpɔːrtnt/',
    posList: [
      { pos: 'adj.', means: ['重要的', '重大的', '有势力的'] }
    ],
    etymology: {
      prefix: { form: 'im-', meaning: '入/内' },
      root: { form: 'port', meaning: '带来/搬运' },
      suffix: { form: '-ant', meaning: '形容词后缀' },
      derivation: '带入重大分量的 → 重要的'
    }
  },
  {
    id: 'word_beautiful',
    name: 'beautiful',
    syllables: ['beau', 'ti', 'ful'],
    phoneticUk: '/ˈbjuːtɪfl/',
    phoneticUs: '/ˈbjuːtɪfl/',
    posList: [
      { pos: 'adj.', means: ['美丽的', '极好的', '优美的'] }
    ],
    etymology: {
      root: { form: 'beauty', meaning: '美丽' },
      suffix: { form: '-ful', meaning: '充满...的' },
      derivation: '充满美丽的 → 美丽的、极好的'
    }
  },
  {
    id: 'word_vocabulary',
    name: 'vocabulary',
    syllables: ['vo', 'cab', 'u', 'lar', 'y'],
    phoneticUk: '/vəˈkæbjələri/',
    phoneticUs: '/vəˈkæbjəleri/',
    posList: [
      { pos: 'n.', means: ['词汇', '词汇量', '词表'] }
    ],
    etymology: {
      root: { form: 'voc', meaning: '声音/呼叫' },
      suffix: { form: '-ary', meaning: '与...有关的集合' },
      derivation: '用声音表达出来的语言集合 → 词汇量、词表'
    }
  },
  {
    id: 'word_kubernetes',
    name: 'kubernetes',
    syllables: ['ku', 'ber', 'ne', 'tes'],
    phoneticUk: '/ˌk(j)uːbərˈneɪtiːz/',
    phoneticUs: '/ˌk(j)uːbərˈneɪtiːz/',
    posList: [
      { pos: 'n.', means: ['容器编排引擎', 'K8s 自动化部署平台'] }
    ],
    etymology: {
      root: { form: 'kybernetes', meaning: '希腊语: 舵手 / 领航员' },
      derivation: '为容器化云原生航船领航 → Kubernetes'
    }
  },
  {
    id: 'word_information',
    name: 'information',
    syllables: ['in', 'for', 'ma', 'tion'],
    phoneticUk: '/ˌɪnfəˈmeɪʃn/',
    phoneticUs: '/ˌɪnfərˈmeɪʃn/',
    posList: [
      { pos: 'n.', means: ['信息', '资料', '情报', '通告'] }
    ],
    etymology: {
      prefix: { form: 'in-', meaning: '入/给予' },
      root: { form: 'form', meaning: '形状/形式' },
      suffix: { form: '-ation', meaning: '名词后缀' },
      derivation: '给事物赋予形式与内涵 → 信息、资料'
    }
  },
  {
    id: 'word_computer',
    name: 'computer',
    syllables: ['com', 'pu', 'ter'],
    phoneticUk: '/kəmˈpjuːtə(r)/',
    phoneticUs: '/kəmˈpjuːtər/',
    posList: [
      { pos: 'n.', means: ['计算机', '电脑'] }
    ],
    etymology: {
      prefix: { form: 'com-', meaning: '一起/共同' },
      root: { form: 'put', meaning: '思考/计算' },
      suffix: { form: '-er', meaning: '机器/工具' },
      derivation: '共同汇集计算的设备 → 计算机'
    }
  },
  {
    id: 'word_structure',
    name: 'structure',
    syllables: ['struc', 'ture'],
    phoneticUk: '/ˈstrʌktʃə(r)/',
    phoneticUs: '/ˈstrʌktʃər/',
    posList: [
      { pos: 'n.', means: ['结构', '建筑物', '体系'] },
      { pos: 'v.', means: ['构成', '组织'] }
    ],
    etymology: {
      root: { form: 'struct', meaning: '建造/构建' },
      suffix: { form: '-ure', meaning: '名词后缀 (状态/结果)' },
      derivation: '建造构成的框架体系 → 结构'
    }
  },
  {
    id: 'word_function',
    name: 'function',
    syllables: ['func', 'tion'],
    phoneticUk: '/ˈfʌŋkʃn/',
    phoneticUs: '/ˈfʌŋkʃn/',
    posList: [
      { pos: 'n.', means: ['功能', '函数', '职责'] },
      { pos: 'v.', means: ['运行', '发挥功能'] }
    ],
    etymology: {
      root: { form: 'funct', meaning: '执行/履行' },
      suffix: { form: '-ion', meaning: '名词后缀' },
      derivation: '履行特定的职责或运转 → 功能、函数'
    }
  }
]

export const BUILTIN_BOOKS: VocabularyBook[] = [
  {
    id: 'book_basewords',
    name: '基础词汇',
    description: '中小学阶段基础词汇 1195 词，按主题成组编排，音节拆分与词根词缀为人工校订',
    category: 'daily',
    isCustom: false,
    unitSize: 20,
    totalWords: 1195,
    words: INITIAL_SAMPLE_WORDS,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'book_cet4',
    name: 'CET-4 核心词库',
    description: '全国大学英语四级核心高频词汇精选，覆盖核心词根词缀与经典考题',
    category: 'exam',
    isCustom: false,
    unitSize: 20,
    totalWords: 2600,
    words: INITIAL_SAMPLE_WORDS,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'book_kaoyan',
    name: '考研英语2025',
    description: '研究生入学考试英语（一/二）历年真题高频核心考点词单',
    category: 'exam',
    isCustom: false,
    unitSize: 20,
    totalWords: 3700,
    words: INITIAL_SAMPLE_WORDS,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'book_coder',
    name: 'Coder Dict',
    description: '程序员常见高频英语词汇、计算机基础术语、开发与系统运维核心词库 (来自 Qwerty Learner Coder Dict 通用)',
    category: 'developer',
    isCustom: false,
    unitSize: 20,
    totalWords: 1700,
    words: INITIAL_SAMPLE_WORDS,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'book_ielts',
    name: '雅思词汇',
    description: '剑桥雅思官方听说读写核心必考词库',
    category: 'exam',
    isCustom: false,
    unitSize: 20,
    totalWords: 4500,
    words: INITIAL_SAMPLE_WORDS,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
]

/**
 * 转换纯文本或外部 JSON 格式为标准 WordItem
 */
export function buildWordItem(name: string, meaning: string = '', phonetic?: string): WordItem {
  const syllables = splitIntoSyllables(name)
  const etymology = analyzeEtymology(name)

  return {
    id: buildWordId(name),
    name: name.trim(),
    syllables,
    phoneticUs: phonetic || `/ ${name.toLowerCase()} /`,
    phoneticUk: phonetic || `/ ${name.toLowerCase()} /`,
    posList: [
      { pos: 'n.', means: meaning ? [meaning] : ['核心词义'] }
    ],
    etymology
  }
}
