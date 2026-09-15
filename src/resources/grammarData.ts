// ============================================================================
// Grammar Data Engine: Complete dataset for Parts of Speech, Sentence Syntax,
// Tenses Matrix, and Cognitive Prepositions.
// ============================================================================

export type GrammarTabType = 'partsOfSpeech' | 'sentenceSyntax' | 'tenses' | 'prepositions'

// ---------------------------------------------------------------------------
// 1. Ten Parts of Speech (十大词类)
// ---------------------------------------------------------------------------
/** 词性的功能例句：一个句法功能对应一句，便于直接对照 functions */
export interface PartOfSpeechExample {
  /** 对应的句法功能（与 functions 顺序一致） */
  role: string
  en: string
  zh: string
  /** 句中需要高亮的、属于当前词性的词 */
  highlightWords: string[]
}

export interface PartOfSpeechItem {
  id: string
  name: string
  nameZh: string
  abbr: string
  iconName: string
  color: string // Tailwind color accent
  badgeBg: string
  borderColor: string
  plainDescription: string
  origin: {
    etymology: string // 拉丁/希腊语源
    meaning: string // 词根原义
  }
  evolution: string // 历史演变过程
  functions: string[] // 核心句法功能
  positionRules: string // 位置规则
  commonWords: { word: string; meaning: string; phonetic?: string }[]
  /** 每个句法功能各配一句例句，数量与 functions 一致 */
  examples: PartOfSpeechExample[]
  proTips: string // 避坑/进阶提示
}

export const PARTS_OF_SPEECH_DATA: PartOfSpeechItem[] = [
  {
    id: 'noun',
    name: 'Noun',
    nameZh: '名词',
    abbr: 'n.',
    iconName: 'Box',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderColor: 'hover:border-emerald-500/40',
    plainDescription: '名词就是给人、事物、地点或想法起的名字。我们需要名词，是因为说话时必须先说明“正在谈谁或什么”，例如人叫 Tom，动物叫 cat，地方叫 school。',
    origin: {
      etymology: '源自拉丁语 nomen',
      meaning: '原义为“名字、名称（name）”，古希腊哲学家亚里士多德称之为 onoma（指代万物的代号）。',
    },
    evolution:
      '在古英语时期（Old English），名词拥有极其繁复的格（主、宾、与、属四格）、性（阴、阳、中性）及数的变化，如同现代德语或俄语。11世纪诺曼征服后，古英语向中古英语演变，格位屈折词尾大量脱落，现代英语名词变为高度依赖“语序”与“介词”来表达关系的分析语。仅残留表示所属的 -s 属格与规则复数后缀。',
    functions: [
      '主语 (Subject)：充当动作的发起者或事件的陈述核心。',
      '宾语 (Object)：充当动词或介词的受体或承受者。',
      '表语 (Predicative)：位于系动词后，说明主语的身份、性质或特征。',
      '同位语 (Appositive)：直接置于另一名词旁，进行补充说明。',
    ],
    positionRules: '常出现在冠词 (a, the)、形容词、指示代词或介词之后；在句子中通常占据句首（主语）或及物动词/介词之后（宾语）。',
    commonWords: [
      { word: 'Curiosity', meaning: '好奇心', phonetic: '/ˌkjʊəriˈɒsəti/' },
      { word: 'Discovery', meaning: '发现', phonetic: '/dɪˈskʌvəri/' },
      { word: 'Resilience', meaning: '韧性/复原力', phonetic: '/rɪˈzɪliəns/' },
      { word: 'Architecture', meaning: '架构/建筑学', phonetic: '/ˈɑːkɪtektʃə/' },
      { word: 'Horizon', meaning: '地平线/视野', phonetic: '/həˈraɪzn/' },
    ],
    examples: [
      {
        role: '主语 (Subject)',
        en: 'The cat is sleeping.',
        zh: '那只猫在睡觉。',
        highlightWords: ['cat'],
      },
      {
        role: '宾语 (Object)',
        en: 'I have two books.',
        zh: '我有两本书。',
        highlightWords: ['books'],
      },
      {
        role: '表语 (Predicative)',
        en: 'She is a teacher.',
        zh: '她是一名老师。',
        highlightWords: ['teacher'],
      },
      {
        role: '同位语 (Appositive)',
        en: 'My friend Tom is here.',
        zh: '我的朋友汤姆在这里。',
        highlightWords: ['Tom'],
      },
    ],
    proTips: '区分“可数与不可数”是名词核心坑点。许多抽象名词（information, equipment, advice）在英语中绝对不可加 -s，需用 a piece of 修饰。',
  },
  {
    id: 'pronoun',
    name: 'Pronoun',
    nameZh: '代词',
    abbr: 'pron.',
    iconName: 'UserCheck',
    color: 'text-teal-400',
    badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    borderColor: 'hover:border-teal-500/40',
    plainDescription: '代词是用来代替名字的词。如果一句话反复说 Tom、Tom、Tom，会很啰嗦，所以可以用 he 来代替 Tom，用 it 来代替某个事物。',
    origin: {
      etymology: '源自拉丁语 pronomen',
      meaning: '前缀 pro- (代替) + nomen (名字/名词)，字面含义即“取代名词之词”。',
    },
    evolution:
      '尽管现代英语名词的“格位系统”几乎全部丢失，但人称代词（Personal Pronouns）却顽强保留了古英语四格屈折的古老遗迹：主格（I, he, they）、宾格（me, him, them）与属格（my/mine, his, their）。代词是窥视古英语屈折语原貌的“活化石”。',
    functions: [
      '指代名词：代替上下文已提及的人或物，避免单调重复。',
      '指引指示：通过指示代词 (this, that, these, those) 明确空间与心理距离。',
      '关系连接：关系代词 (who, which, that) 充当定语从句的主导纽带。',
      '虚指功能：it 作为形式主语/宾语，平衡句子结构重心。',
    ],
    positionRules: '主格代词用于主语位置（谓语前）；宾格用于动词或介词之后；物主代词置于名词前（my book）或单独使用（mine）。',
    commonWords: [
      { word: 'It', meaning: '它 (亦作形式主语)', phonetic: '/ɪt/' },
      { word: 'Whoever', meaning: '无论何人', phonetic: '/huːˈevə/' },
      { word: 'Themselves', meaning: '他们自己 (反身代词)', phonetic: '/ðəmˈselvz/' },
      { word: 'Which', meaning: '哪个/关系代词', phonetic: '/wɪtʃ/' },
      { word: 'None', meaning: '全无/没有一个', phonetic: '/nʌn/' },
    ],
    examples: [
      {
        role: '指代名词',
        en: 'She likes him.',
        zh: '她喜欢他。',
        highlightWords: ['She', 'him'],
      },
      {
        role: '指引指示',
        en: 'That is my house.',
        zh: '那是我的房子。',
        highlightWords: ['That'],
      },
      {
        role: '关系连接',
        en: 'The boy who won is my friend.',
        zh: '赢了的那个男孩是我的朋友。',
        highlightWords: ['who'],
      },
      {
        role: '虚指功能',
        en: 'It is raining.',
        zh: '下雨了。',
        highlightWords: ['It'],
      },
    ],
    proTips: '在比较级后注意格的用法：正式文体中用 “He is taller than I (am)”，非正式口语中常说 “than me”。但在学术写作中请尽量使用主格对应。',
  },
  {
    id: 'verb',
    name: 'Verb',
    nameZh: '动词',
    abbr: 'v.',
    iconName: 'Zap',
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    borderColor: 'hover:border-sky-500/40',
    plainDescription: '动词用来说明“做了什么”或“是什么状态”。只有名字还说不成一句完整的话，加上 run、eat、is 这样的动词，别人才能知道发生了什么。',
    origin: {
      etymology: '源自拉丁语 verbum',
      meaning: '原义为“话语、词汇（the word）”。古罗马语法学家认为，动词是句子中绝对无可替代的核心，是整句话的“词中之词”。',
    },
    evolution:
      '动词继承了日耳曼语系著名的“强动词（通过词干元音交替变过去式，如 sing-sang-sung）”和“弱动词（添加 -ed，如 walk-walked）”。现代英语弱动词规则化成为主流，而最高频的日常动词大多仍是古老的强动词。同时，现代英语发展出了高度复杂的由“助动词 (be, have, do) + 主动词”组合的时态与语态大厦。',
    functions: [
      '谓语核心 (Predicate)：传达主语执行的动作、发生的事件或心理认知。',
      '状态连接 (Linking Verb)：系动词 (be, look, become, feel) 连接主语与表语，描摹状态。',
      '非谓语拓展 (Non-finite Verbs)：不定式、动名词、分词摆脱谓语束缚，担当名、形、副职能。',
    ],
    positionRules: '通常紧随主语之后。在倒装句、疑问句或强调句中，助动词或系动词会前置到主语之前。',
    commonWords: [
      { word: 'Illuminate', meaning: '照亮/阐明', phonetic: '/ɪˈluːmɪneɪt/' },
      { word: 'Transform', meaning: '使转变/变革', phonetic: '/trænsˈfɔːm/' },
      { word: 'Persevere', meaning: '坚持不懈', phonetic: '/ˌpɜːsɪˈvɪə/' },
      { word: 'Generate', meaning: '产生/引起', phonetic: '/ˈdʒenəreɪt/' },
      { word: 'Comprehend', meaning: '充分理解', phonetic: '/ˌkɒmprɪˈhend/' },
    ],
    examples: [
      {
        role: '谓语核心 (Predicate)',
        en: 'She reads a book.',
        zh: '她读一本书。',
        highlightWords: ['reads'],
      },
      {
        role: '状态连接 (Linking Verb)',
        en: 'He looks tired.',
        zh: '他看起来很累。',
        highlightWords: ['looks'],
      },
      {
        role: '非谓语拓展 (Non-finite Verbs)',
        en: 'I want to go home.',
        zh: '我想回家。',
        highlightWords: ['to go'],
      },
    ],
    proTips: '动词决定句型！及物动词 (Vt) 必须接宾语，不及物动词 (Vi) 不能直接接宾语（除非加介词），系动词必须接表语。抓住动词属性就抓住了句子的骨架。',
  },
  {
    id: 'adjective',
    name: 'Adjective',
    nameZh: '形容词',
    abbr: 'adj.',
    iconName: 'Palette',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderColor: 'hover:border-amber-500/40',
    plainDescription: '形容词用来说明一个人或事物“是什么样的”。只说 apple 不够具体，加上 red、big、sweet，就能让别人更清楚地想象这个苹果。',
    origin: {
      etymology: '源自拉丁语 adjectivus',
      meaning: '由 ad- (向着/加上) + jacere (投掷/放置) 组合而成，字面意思为“追加附着之物”。',
    },
    evolution:
      '古英语时期的形容词必须根据所修饰名词的性、数、格保持严密一致（例如强变化与弱变化屈折）。14世纪后，这种复杂的尾缀彻底被清洗，现代英语形容词完全无需根据名词性数改变形式（除 this/these, that/those 等指示代词），词形变得极其清爽，仅保留了 -er/-est 或 more/most 的级差变化。',
    functions: [
      '前置定语 (Attributive)：置于名词前，对事物进行属性、颜色、材质、起源等界定。',
      '后置表语 (Predicative)：置于系动词后，说明主语的性质状态。',
      '宾语补足语 (Object Complement)：补充说明宾语被动词作用后的状态（如 make it clear）。',
    ],
    positionRules: '修饰名词时常置于名词前（a quiet night）；修饰复合不定代词 (something, anything) 时必须后置（something special）；也可作为表语置于系动词之后。',
    commonWords: [
      { word: 'Profound', meaning: '深刻的/深奥的', phonetic: '/prəˈfaʊnd/' },
      { word: 'Authentic', meaning: '真正的/纯正的', phonetic: '/ɔːˈθentɪk/' },
      { word: 'Resilient', meaning: '坚韧的', phonetic: '/rɪˈzɪliənt/' },
      { word: 'Innovative', meaning: '创新的', phonetic: '/ˈɪnəvətɪv/' },
      { word: 'Peculiar', meaning: '独特的/罕见的', phonetic: '/pɪˈkjuːliə/' },
    ],
    examples: [
      {
        role: '前置定语 (Attributive)',
        en: 'She has a red car.',
        zh: '她有一辆红色的车。',
        highlightWords: ['red'],
      },
      {
        role: '后置表语 (Predicative)',
        en: 'The soup is hot.',
        zh: '汤是热的。',
        highlightWords: ['hot'],
      },
      {
        role: '宾语补足语 (Object Complement)',
        en: 'The news made him happy.',
        zh: '这个消息让他很开心。',
        highlightWords: ['happy'],
      },
    ],
    proTips: '多重形容词修饰同一名词时有固定的语序口诀：“美小圆清新国材”（观美、大小、形状、年龄/新旧、颜色、国籍/出处、材料）。',
  },
  {
    id: 'adverb',
    name: 'Adverb',
    nameZh: '副词',
    abbr: 'adv.',
    iconName: 'Compass',
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    borderColor: 'hover:border-indigo-500/40',
    plainDescription: '副词用来补充动作或状态的细节，比如做得快不快、什么时候做、在哪里做。run 只表示跑，run quickly 才告诉我们“跑得很快”。',
    origin: {
      etymology: '源自拉丁语 adverbium',
      meaning: '前缀 ad- (靠近) + verbum (动词)，原意为“紧随动词之侧以补充细节”。',
    },
    evolution:
      '古英语常在形容词后添加后缀 -e 或 -līce（原意为具有某种身体外貌或外观，与 like 同源）构成副词。随着千百年语音弱化，-līce 蜕变为了今天英语中最具辨识度的副词派生后缀 `-ly`。如今副词不仅能修饰动词，还扩张至修饰形容词、其他副词乃至整句。',
    functions: [
      '修饰动词 (Modify Verbs)：描绘动作发生的频度、方式、程度或地点（run quickly）。',
      '修饰形容词或副词 (Intensify)：增强或减弱语义分量（extremely fast, quite often）。',
      '修饰整个句子 (Sentence Adverb)：表达说话者的态度、评价或语篇转折（Fortunately, he survived.）。',
    ],
    positionRules: '频度副词 (always, never) 通常置于行为动词前、be动词或助动词之后；方式副词多置于句末；全句评价副词通常置于句首并用逗号隔开。',
    commonWords: [
      { word: 'Consistently', meaning: '持续地/一贯地', phonetic: '/kənˈsɪstəntli/' },
      { word: 'Subtly', meaning: '微妙地/不易察觉地', phonetic: '/ˈsʌtli/' },
      { word: 'Inevitable', meaning: '不可避免地', phonetic: '/ɪnˈevɪtəbli/' },
      { word: 'Thoroughly', meaning: '彻底地/完全地', phonetic: '/ˈθʌrəli/' },
      { word: 'Spontaneously', meaning: '自发地/自然而然地', phonetic: '/spɒnˈteɪniəsli/' },
    ],
    examples: [
      {
        role: '修饰动词 (Modify Verbs)',
        en: 'Tom runs quickly.',
        zh: '汤姆跑得很快。',
        highlightWords: ['quickly'],
      },
      {
        role: '修饰形容词或副词 (Intensify)',
        en: 'This box is very heavy.',
        zh: '这个箱子非常重。',
        highlightWords: ['very'],
      },
      {
        role: '修饰整个句子 (Sentence Adverb)',
        en: 'Fortunately, he passed.',
        zh: '幸运的是，他通过了。',
        highlightWords: ['Fortunately'],
      },
    ],
    proTips: '警惕形似副词的形容词！比如 friendly, lovely, lonely, deadly 都是形容词。要表达“友好地”，需用介词短语 in a friendly manner。',
  },
  {
    id: 'preposition',
    name: 'Preposition',
    nameZh: '介词',
    abbr: 'prep.',
    iconName: 'MapPin',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    borderColor: 'hover:border-purple-500/40',
    plainDescription: '介词用来说明事物之间的关系，最常见的是位置、方向和时间。比如 book 和 table 是两个名词，加入 on 后，on the table 才说清楚书和桌子的位置关系。',
    origin: {
      etymology: '源自拉丁语 praepositio',
      meaning: '前缀 prae- (在…之前) + positio (放置)，字面含义即“前置之词（置于名词/代词前）”。',
    },
    evolution:
      '古英语依靠名词的变格词尾（如与格表伴随、离格表来源）表达空间与逻辑。中古英语时期变格词尾瓦解，介词体系全面崛起接管，从最初具体的物理空间坐标（在箱子内、穿过河流），抽象升华到时间坐标（在某时刻、经历某过程），再隐喻扩展至心理与因果逻辑（在压力下、陷入爱河）。',
    functions: [
      '建立空间与时间坐标：精准定位实体的位置 (at, on, in) 或动态轨迹 (through, into)。',
      '介词短语作定语：紧贴名词后，提供所属、特征或来源（the key to success）。',
      '介词短语作状语：修饰谓语动词，阐释方式、原因、条件或目的（with confidence）。',
    ],
    positionRules: '必须与后续的名词、代词或动名词（-ing）构成“介宾短语”，绝不可孤立作为句子成分。在从句中介词偶尔会滞留在句末（preposition stranding）。',
    commonWords: [
      { word: 'Beneath', meaning: '在…下方', phonetic: '/bɪˈniːθ/' },
      { word: 'Throughout', meaning: '贯穿/遍及', phonetic: '/θruːˈaʊt/' },
      { word: 'Beyond', meaning: '超越/在…那一边', phonetic: '/bɪˈjɒnd/' },
      { word: 'Despite', meaning: '尽管/不管', phonetic: '/dɪˈspaɪt/' },
      { word: 'Alongside', meaning: '在…旁边/并肩', phonetic: '/əˌlɒŋˈsaɪd/' },
    ],
    examples: [
      {
        role: '建立空间与时间坐标',
        en: 'The book is on the table.',
        zh: '书在桌子上。',
        highlightWords: ['on'],
      },
      {
        role: '介词短语作定语',
        en: 'The key to success is hard work.',
        zh: '成功的秘诀是努力。',
        highlightWords: ['to'],
      },
      {
        role: '介词短语作状语',
        en: 'She spoke with confidence.',
        zh: '她充满自信地说话。',
        highlightWords: ['with'],
      },
    ],
    proTips: '介词不是死板的翻译对译，而是“空间心智图”！牢记核心空间几何感：at 是一个无维度的零维点，on 是一维线/二维面接触，in 是三维容器包围。',
  },
  {
    id: 'conjunction',
    name: 'Conjunction',
    nameZh: '连词',
    abbr: 'conj.',
    iconName: 'GitMerge',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    borderColor: 'hover:border-rose-500/40',
    plainDescription: '连词像连接线，用来把词、短语或句子连在一起。比如 Tom likes tea 和 Tom likes coffee，可以用 and 连成一句，表达起来更顺畅。',
    origin: {
      etymology: '源自拉丁语 conjunctio',
      meaning: '前缀 con- (共同) + jungere (连接)，字面意思是“并肩捆绑联结在一起”。',
    },
    evolution:
      '原始印欧语与早期英语倾向于用短句并列（Parataxis：如“我来，我见，我征服”）。随着文艺复兴及近代哲学逻辑思辨的发展，英语大规模汲取拉丁语严密的从属逻辑连接词（Hypotaxis），形成了由并列连词（FANBOYS: for, and, nor, but, or, yet, so）与从属连词（although, because, whereas 等）构成的精密逻辑骨架。',
    functions: [
      '并列连接 (Coordinating)：联结语法地位对等的单词、短语或独立分句。',
      '从属连接 (Subordinating)：引导名词性从句、状语从句，明确主从逻辑层次。',
      '关联搭配 (Correlative)：成对出现构建强平衡关系（neither...nor, not only...but also）。',
    ],
    positionRules: '并列连词位于两个同等元素之间；从属连词位于从属从句句首，整个状语从句置于句首时后面通常加逗号。',
    commonWords: [
      { word: 'Whereas', meaning: '鉴于/而/反之', phonetic: '/ˌweərˈæz/' },
      { word: 'Although', meaning: '尽管/虽然', phonetic: '/ɔːlˈðəʊ/' },
      { word: 'Unless', meaning: '除非', phonetic: '/ənˈles/' },
      { word: 'Nevertheless', meaning: '然而/尽管如此', phonetic: '/ˌnevəðəˈles/' },
      { word: 'Since', meaning: '既然/自从', phonetic: '/sɪns/' },
    ],
    examples: [
      {
        role: '并列连接 (Coordinating)',
        en: 'Tom is tired, but he works.',
        zh: '汤姆很累，但他仍然工作。',
        highlightWords: ['but'],
      },
      {
        role: '从属连接 (Subordinating)',
        en: 'I stayed home because it rained.',
        zh: '因为下雨，我待在家里。',
        highlightWords: ['because'],
      },
      {
        role: '关联搭配 (Correlative)',
        en: 'He is not only smart but also kind.',
        zh: '他不仅聪明，而且善良。',
        highlightWords: ['not only', 'but also'],
      },
    ],
    proTips: '中文里的“因为…所以…”、“虽然…但是…”在英语中是严苛的语法大忌！英语一个主从复合句中，连词 because 与 so、although 与 but 绝对不可成对同时出现。',
  },
  {
    id: 'interjection',
    name: 'Interjection',
    nameZh: '感叹词',
    abbr: 'interj.',
    iconName: 'Flame',
    color: 'text-orange-400',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    borderColor: 'hover:border-orange-500/40',
    plainDescription: '感叹词是人脱口而出的声音，用来直接表达惊讶、高兴、疼痛等情绪。比如看到惊喜时说 Wow，碰疼时说 Ouch。',
    origin: {
      etymology: '源自拉丁语 interjectio',
      meaning: '由 inter- (在…之间) + jacere (投掷/抛出) 组成，原义为“突然插进话语中间的惊叹声”。',
    },
    evolution:
      '感叹词是人类语言最古老的情绪本能残留，早在精密语法体系建立之前就已经存在。它们通常是拟声发音或生理反应（如疼痛叫唤 Ouch、惊讶 Oh、喜悦 Wow、犹豫 Well）。感叹词在句法上几乎完全孤立，不与句中其他词汇产生支配或修饰依赖。',
    functions: [
      '宣泄突发情绪：表达震惊、欣喜、厌恶、释然或同情。',
      '语篇标记 (Discourse Marker)：在会话中用于吸引注意力、争取停顿思考时间或转换话题（Well, Hmm）。',
    ],
    positionRules: '多位于句首，其后通常紧跟叹号（!）或逗号（,），独立于句子核心主干之外。',
    commonWords: [
      { word: 'Alas', meaning: '哎呀/可叹 (表哀伤)', phonetic: '/əˈlæs/' },
      { word: 'Bravo', meaning: '好极了/棒极了', phonetic: '/ˈbrɑːvəʊ/' },
      { word: 'Eureka', meaning: '我找到了！/发现真相', phonetic: '/juəˈriːkə/' },
      { word: 'Ouch', meaning: '哎哟 (突然感到疼痛)', phonetic: '/aʊtʃ/' },
      { word: 'Aha', meaning: '啊哈 (恍然大悟)', phonetic: '/ɑːˈhɑː/' },
    ],
    examples: [
      {
        role: '宣泄突发情绪',
        en: 'Wow! This is fun.',
        zh: '哇！这很有趣。',
        highlightWords: ['Wow!'],
      },
      {
        role: '语篇标记 (Discourse Marker)',
        en: 'Well, let me think.',
        zh: '嗯，让我想想。',
        highlightWords: ['Well'],
      },
    ],
    proTips: '在正式的学术论文或商业分析报告中，应尽量避免使用情绪化的感叹词，但在小说、演讲、日常对话及剧本中，它们是语言灵魂与鲜活性格的催化剂。',
  },
  {
    id: 'numeral',
    name: 'Numeral',
    nameZh: '数词',
    abbr: 'num.',
    iconName: 'Hash',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    borderColor: 'hover:border-cyan-500/40',
    plainDescription: '数词用来说明“有多少”或“排第几”。没有数词，我们只能说有苹果；用了 three，才能准确说出有三个苹果。',
    origin: {
      etymology: '源自拉丁语 numeralis',
      meaning: '源于 numerus (数字、数量、节奏)，是人类建立科学度量衡与秩序计算的基石词类。',
    },
    evolution:
      '英语数词源自原始印欧语（Proto-Indo-European）的古老计数系统，分为基数词（Cardinal: one, two, three 表数量）与序数词（Ordinal: first, second, third 表顺序）。古英语中序数词必须根据格进行形态变格，现代英语则将序数词规则化为在基数词后加 -th（如 fourth, fifth），仅第一、第二、第三保留古老异形。',
    functions: [
      '充当定语：置于名词前修饰数量或次序（three apples, the second step）。',
      '充当主语或宾语：直接代指确定的数量群体（Two of them survived）。',
      '与代词及限定词融合：作为精密量化工具规范论据。',
    ],
    positionRules: '基数词位于名词前；序数词前面通常必须加上定冠词 the（the third time），若与形容词连用，通常置于形容词之前。',
    commonWords: [
      { word: 'First', meaning: '第一 (序数词)', phonetic: '/fɜːst/' },
      { word: 'Dozen', meaning: '一打/十二个', phonetic: '/ˈdʌzn/' },
      { word: 'Billion', meaning: '十亿', phonetic: '/ˈbɪljən/' },
      { word: 'Twentieth', meaning: '第二十', phonetic: '/ˈtwentiəθ/' },
      { word: 'Fold', meaning: '倍数后缀(threefold)', phonetic: '/fəʊld/' },
    ],
    examples: [
      {
        role: '充当定语',
        en: 'I have three apples.',
        zh: '我有三个苹果。',
        highlightWords: ['three'],
      },
      {
        role: '充当主语或宾语',
        en: 'Two of them survived.',
        zh: '他们中有两人幸存下来。',
        highlightWords: ['Two'],
      },
      {
        role: '与代词及限定词融合',
        en: 'Give me the first one.',
        zh: '把第一个给我。',
        highlightWords: ['first'],
      },
    ],
    proTips: '百、千、百万（hundred, thousand, million）前有具体数字时，绝对不能加 -s（three hundred people）；只有表示不确定泛指时，才加 -s 并加 of（hundreds of people）。',
  },
  {
    id: 'article',
    name: 'Article / Determiner',
    nameZh: '冠词 / 限定词',
    abbr: 'art./det.',
    iconName: 'Bookmark',
    color: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    borderColor: 'hover:border-yellow-500/40',
    plainDescription: '冠词和限定词放在名词前，帮助别人判断你说的是“一个”、“这个”，还是“某一类”。a cat 是任意一只猫，the cat 是双方都知道的那只猫。',
    origin: {
      etymology: '源自拉丁语 articulus',
      meaning: '原意为“指关节、小接缝（small joint）”，意指在名词前充当枢纽与界定边界的小部件。',
    },
    evolution:
      '原始印欧语根本没有冠词（如同现代俄语和拉丁语至今没有冠词）。在古英语向中古英语演变期间，古英语指示代词 se/þæt 逐渐虚化并弱化为定冠词 `the`；而数词 ān (即 one) 弱化为不定冠词 `a / an`。冠词的诞生标志着英语语法从依靠屈折后缀向依靠前置限定词分析语的伟大飞跃。',
    functions: [
      '界定特指与泛指：不定冠词 a/an 表示泛指同类中任意个体；定冠词 the 表示双方心领神会的特指。',
      '界定独一无二性：用于世界上独一无二的事物前（the sun, the universe）。',
      '名词化功能：the + 形容词可以泛指一类群体（the rich, the injured）。',
    ],
    positionRules: '置于所有修饰名词的形容词的最前端（the clever young student）；在 half, both, all 之后。',
    commonWords: [
      { word: 'The', meaning: '这/那 (定冠词特指)', phonetic: '/ðə, ðiː/' },
      { word: 'A / An', meaning: '一个 (不定冠词泛指)', phonetic: '/ə, æn/' },
      { word: 'Every', meaning: '每一个 (限定词)', phonetic: '/ˈevri/' },
      { word: 'Neither', meaning: '两者都不', phonetic: '/ˈnaɪðə/' },
      { word: 'Any', meaning: '任何一个/些', phonetic: '/ˈeni/' },
    ],
    examples: [
      {
        role: '界定特指与泛指',
        en: 'A cat is on the chair.',
        zh: '一只猫在椅子上。',
        highlightWords: ['A', 'the'],
      },
      {
        role: '界定独一无二性',
        en: 'The sun is bright today.',
        zh: '今天太阳很亮。',
        highlightWords: ['The'],
      },
      {
        role: '名词化功能',
        en: 'The rich should help the poor.',
        zh: '富人应该帮助穷人。',
        highlightWords: ['The rich', 'the poor'],
      },
    ],
    proTips: '判断用 a 还是 an 不看字母本身是辅音还是元音，而是取决于“首个发音音标”是否是元音音素！例如 an hour（/aʊə/ 元音发音用 an），a university（/juː/ 辅音发音用 a）。',
  },
]

// ---------------------------------------------------------------------------
// 2. Sentence Elements & Progressive Growth (句子核心主干与渐进生长)
// ---------------------------------------------------------------------------

export interface SentenceCoreConcept {
  id: string
  titleZh: string
  subtitleEn: string
  coreQuestion: string
  plainExplanation: string
  formula: string
  exampleEn: string
  exampleZh: string
  components: { code: string; nameZh: string; role: string; exampleWord: string }[]
}

export const SENTENCE_CORE_CONCEPTS: SentenceCoreConcept[] = [
  {
    id: 'action_backbone',
    titleZh: '动作主干：谁在干什么？',
    subtitleEn: 'Action Backbone (Subject + Verb + Object)',
    coreQuestion: '核心回答：是谁发出了动作？做了什么动作？动作作用在谁身上？',
    plainExplanation:
      '这是英语中最常见的主干。比如“我吃苹果”、“汤姆看书”。只要说明了“谁 (主语)”、“做了什么动作 (谓语)”、“吃了或看了什么 (宾语)”，哪怕没有任何其他修饰词，这句话的意思就已经独立完整。',
    formula: '主语 (Who) + 谓语动词 (Do) + 宾语 (What)',
    exampleEn: 'I eat apples.',
    exampleZh: '我吃苹果。',
    components: [
      { code: 'S', nameZh: '主语', role: '动作的发起者，说明“谁”', exampleWord: 'I (我)' },
      { code: 'V', nameZh: '谓语动词', role: '发出的动作，说明“在干什么”', exampleWord: 'eat (吃)' },
      { code: 'O', nameZh: '宾语', role: '动作承受的对象，说明“吃了什么”', exampleWord: 'apples (苹果)' },
    ],
  },
  {
    id: 'state_backbone',
    titleZh: '状态主干：谁是什么状态 / 谁是谁？',
    subtitleEn: 'State Backbone (Subject + Link Verb + Predicative)',
    coreQuestion: '核心回答：某人或某物处于什么状态？是什么身份？',
    plainExplanation:
      '很多时候并没有具体“动作”，只是在描述一种状态。比如“苹果很甜”、“他是学生”。系动词（is / are / look）就像数学里的等号（=），把主语和它后面的状态或身份（表语）连接起来。',
    formula: '主语 (Who) + 系动词 (=) + 表语 (State / Identity)',
    exampleEn: 'The apple is sweet.',
    exampleZh: '这个苹果很甜。',
    components: [
      { code: 'S', nameZh: '主语', role: '被描写的对象，说明“谁/什么”', exampleWord: 'The apple (苹果)' },
      { code: 'V-link', nameZh: '系动词', role: '连接等号，本身没有动作，连接主语和状态', exampleWord: 'is (是)' },
      { code: 'P', nameZh: '表语', role: '具体的属性、特征或身份，说明“怎么样”', exampleWord: 'sweet (甜的)' },
    ],
  },
]

export interface SentenceModifierConcept {
  id: string
  nameZh: string
  nameEn: string
  questionZh: string
  plainExplanation: string
  exampleEn: string
  exampleZh: string
  highlightWord: string
}

export const SENTENCE_MODIFIERS_DATA: SentenceModifierConcept[] = [
  {
    id: 'attributive',
    nameZh: '定语 (修饰人或物)',
    nameEn: 'Attributive',
    questionZh: '回答：“什么样的？”',
    plainExplanation:
      '定语就像给名词穿衣服。只说 apple（苹果）太单调，加上 red（红色的），就成了 red apple（红苹果）。它专门用来修饰、描摹名词的特征。',
    exampleEn: 'I eat red apples.',
    exampleZh: '我吃红色的苹果。',
    highlightWord: 'red',
  },
  {
    id: 'adverbial',
    nameZh: '状语 (修饰动作或全句)',
    nameEn: 'Adverbial',
    questionZh: '回答：“何时？何地？怎么做？”',
    plainExplanation:
      '状语用来交代动作发生的背景细节。比如“在哪里吃”（at home 在家里）、“什么时候吃”（on weekends 在周末）、“怎么吃”（happily 开心地）。',
    exampleEn: 'I eat apples at home on weekends.',
    exampleZh: '我周末在家里吃苹果。',
    highlightWord: 'at home / on weekends',
  },
  {
    id: 'complement',
    nameZh: '补语 (补充说明结果状态)',
    nameEn: 'Complement',
    questionZh: '回答：“让其变成什么样了？接着做什么？”',
    plainExplanation:
      '有些动词只带宾语意思不完整，比如“香甜的苹果让我……”，必须加上“开心”才完整。这个补充说明宾语变成什么状态的词就叫补语（make me happy）。',
    exampleEn: 'Sweet apples make me happy.',
    exampleZh: '香甜的苹果让我感到开心。',
    highlightWord: 'happy',
  },
]

export interface SentenceGrowthStep {
  step: number
  titleZh: string
  tagZh: string
  pattern: string
  addedElementDesc: string
  whyAddIt: string
  sentenceEn: string
  sentenceZh: string
  highlightWords: string[]
  breakdown: { text: string; role: string; isNew?: boolean }[]
  takeaway: string
}

export const APPLE_SENTENCE_GROWTH_STEPS: SentenceGrowthStep[] = [
  {
    step: 1,
    titleZh: '第 01 步 · 极简动作主干（谁在干什么）',
    tagZh: '核心主干 S + V + O',
    pattern: 'Subject + Verb + Object',
    addedElementDesc: '确立最基础的主谓宾骨架：谁 (I) + 干什么 (eat) + 对象 (apples)',
    whyAddIt:
      '任何长句子的生命起点。没有这个主干，后面的所有修饰都无处附着。一句话只要有主谓宾，即使只有3个词，意思也完全成立。',
    sentenceEn: 'I eat apples.',
    sentenceZh: '我吃苹果。',
    highlightWords: ['eat'],
    breakdown: [
      { text: 'I', role: '主语（代词，表示动作的执行者“我”）' },
      { text: 'eat', role: '谓语动词（表示动作“吃”，是句子的核心引擎）', isNew: true },
      { text: 'apples', role: '宾语（名词，表示动作作用的对象“苹果”）' },
    ],
    takeaway: '句子第一原则：先找出“谁在干什么”，这就是整句话牢不可破的地基。',
  },
  {
    step: 2,
    titleZh: '第 02 步 · 加上定语（吃“什么样的”苹果）',
    tagZh: '增加定语修饰宾语',
    pattern: 'Subject + Verb + [Attributive] + Object',
    addedElementDesc: '新增定语：red（红色的）',
    whyAddIt:
      '只说吃苹果太抽象。在名词 apples 前面加上形容词 red，回答了“吃什么样的苹果”，把事物的样子具体化。',
    sentenceEn: 'I eat red apples.',
    sentenceZh: '我吃红色的苹果。',
    highlightWords: ['red'],
    breakdown: [
      { text: 'I', role: '主语（“我”）' },
      { text: 'eat', role: '谓语动词（“吃”）' },
      { text: 'red', role: '定语（形容词，修饰后面的名词 apples，说明是“红色的”）', isNew: true },
      { text: 'apples', role: '宾语（“苹果”）' },
    ],
    takeaway: '定语就像给名词穿衣服，放在名词前面，专门回答“什么样的”。',
  },
  {
    step: 3,
    titleZh: '第 03 步 · 表达意图想法（不仅吃，而且“想吃”）',
    tagZh: '增加动词意图与情态',
    pattern: 'Subject + [Verb-Intent] + [Attributive] + Object',
    addedElementDesc: '谓语动词升级：want to eat（想要吃）',
    whyAddIt:
      '从客观陈述“我吃苹果”，演进为表达说话人的主观愿望“我想吃苹果”。通过叠加动词短语，让句子的情感表达更细腻。',
    sentenceEn: 'I want to eat red apples.',
    sentenceZh: '我想吃红色的苹果。',
    highlightWords: ['want to eat'],
    breakdown: [
      { text: 'I', role: '主语（“我”）' },
      { text: 'want to eat', role: '复合谓语（want to 表达主观想法“想要”，eat 是核心动作）', isNew: true },
      { text: 'red', role: '定语（“红色的”）' },
      { text: 'apples', role: '宾语（“苹果”）' },
    ],
    takeaway: '动词可以扩展表达想法、打算或能力（如 want to eat, can eat），让动作有了思想。',
  },
  {
    step: 4,
    titleZh: '第 04 步 · 加上状语（“什么时候”、“在哪里”吃）',
    tagZh: '增加时间状语与地点状语',
    pattern: 'Subject + Verb + [Attributive] + Object + [Place Adverbial] + [Time Adverbial]',
    addedElementDesc: '新增状语：at home（在家里·地点）与 on weekends（在周末·时间）',
    whyAddIt:
      '动作不能孤立存在于虚空中。加上时间和地点，交代了事情发生的具体场景与背景，信息量大幅增加。',
    sentenceEn: 'I eat red apples at home on weekends.',
    sentenceZh: '我周末在家里吃红苹果。',
    highlightWords: ['at home', 'on weekends'],
    breakdown: [
      { text: 'I', role: '主语（“我”）' },
      { text: 'eat', role: '谓语动词（“吃”）' },
      { text: 'red', role: '定语（“红色的”，修饰 apples）' },
      { text: 'apples', role: '宾语（“苹果”）' },
      { text: 'at home', role: '地点状语（介词短语，放在句末，交代“在家里”）', isNew: true },
      { text: 'on weekends', role: '时间状语（交代“在周末”，一般放在句末）', isNew: true },
    ],
    takeaway: '英语通常按“地点在前、时间在后”排列状语。时间状语一般放在句末；如果想特别强调时间，可以把它提前到句首。',
  },
  {
    step: 5,
    titleZh: '第 05 步 · 丰满长句（和谁一起、怎样地吃 —— 参天长句）',
    tagZh: '主语并列 + 方式状语 + 多重定语',
    pattern: '[Compound Subject] + [Manner Adv] + Verb + [Multiple Att] + Object + [Place Adv] + [Time Adv]',
    addedElementDesc: '新增并列主语 my friends and I、方式状语 happily、多重定语 sweet',
    whyAddIt:
      '这是日常生活和文章中经常遇到的完整长句。虽然句子拉长到13个词，但只要剥掉定语和状语，它的核心依然是第1步的 I eat apples！',
    sentenceEn: 'My friends and I happily eat sweet red apples at home on weekends.',
    sentenceZh: '周末，我和我的朋友们在家里开心地吃着香甜的红苹果。',
    highlightWords: ['my friends and I', 'sweet', 'happily'],
    breakdown: [
      { text: 'my friends and I', role: '并列主语（动作的共同发出者：我的朋友们和我）', isNew: true },
      { text: 'happily', role: '方式状语（副词，说明吃苹果时的愉悦心情）', isNew: true },
      { text: 'eat', role: '谓语动词（整个长句唯一的动作枢纽：“吃”）' },
      { text: 'sweet red', role: '多重定语（形容词叠加，形容苹果“又甜又红”）', isNew: true },
      { text: 'apples', role: '宾语（所有动作的最终落脚点：“苹果”）' },
      { text: 'at home', role: '地点状语（交代地点：在家里）' },
      { text: 'on weekends', role: '时间状语（交代时间，一般放在句末）' },
    ],
    takeaway: '时间状语一般放在句末，地点通常放在时间前面。如果想特别强调时间，可以写成 On weekends, my friends and I...，把时间提前到句首。',
  },
]

export const LINKING_SENTENCE_GROWTH_STEPS: SentenceGrowthStep[] = [
  {
    step: 1,
    titleZh: '第 01 步 · 最简单的主系表',
    tagZh: '主语 + 系动词 + 表语',
    pattern: 'Subject + Linking Verb + Predicative',
    addedElementDesc: '先说清楚“谁是什么样的”：The apple（苹果）+ is（是）+ red（红的）',
    whyAddIt: '主系表不表示一个动作，而是用来说明人或事物的身份、状态或特点。',
    sentenceEn: 'The apple is red.',
    sentenceZh: '这个苹果是红色的。',
    highlightWords: ['is', 'red'],
    breakdown: [
      { text: 'The apple', role: '主语（我们正在说的事物：“这个苹果”）' },
      { text: 'is', role: '系动词（把主语和它的特点连接起来）', isNew: true },
      { text: 'red', role: '表语（说明苹果是什么样的：“红色的”）', isNew: true },
    ],
    takeaway: '看到 be 动词后先别找动作，它常常只是一座桥，后面的词才是在说明主语。',
  },
  {
    step: 2,
    titleZh: '第 02 步 · 加上程度',
    tagZh: '程度副词 + 表语',
    pattern: 'Subject + Linking Verb + Degree Adverb + Predicative',
    addedElementDesc: '在 red 前加 very，说明苹果不是一般的红，而是“很红”',
    whyAddIt: 'very 用来加强程度，让我们更准确地说明苹果红到什么程度。',
    sentenceEn: 'The apple is very red.',
    sentenceZh: '这个苹果很红。',
    highlightWords: ['very'],
    breakdown: [
      { text: 'The apple', role: '主语（这个苹果）' },
      { text: 'is', role: '系动词（连接主语和表语）' },
      { text: 'very', role: '程度副词（说明“红”的程度）', isNew: true },
      { text: 'red', role: '表语（说明苹果的颜色）' },
    ],
    takeaway: 'very 通常放在形容词前面：very red、very big、very happy。',
  },
  {
    step: 3,
    titleZh: '第 03 步 · 说清是哪种苹果',
    tagZh: '定语 + 主语',
    pattern: 'Attributive + Subject + Linking Verb + Degree Adverb + Predicative',
    addedElementDesc: '在 apple 前加 big，把主语说得更具体',
    whyAddIt: '当只有 apple 还不够具体时，可以用形容词放在名词前，说明它是大苹果还是小苹果。',
    sentenceEn: 'The big apple is very red.',
    sentenceZh: '这个大苹果很红。',
    highlightWords: ['big'],
    breakdown: [
      { text: 'The', role: '冠词（表示特指这个苹果）' },
      { text: 'big', role: '定语（放在名词前，说明苹果很大）', isNew: true },
      { text: 'apple', role: '主语的中心词（苹果）' },
      { text: 'is', role: '系动词（连接主语和表语）' },
      { text: 'very red', role: '表语部分（说明苹果很红）' },
    ],
    takeaway: '名词前的形容词是在介绍“哪个、什么样的事物”；系动词后的形容词是在说明主语的状态。',
  },
  {
    step: 4,
    titleZh: '第 04 步 · 加上地点',
    tagZh: '地点状语',
    pattern: 'Subject + Linking Verb + Predicative + Place Adverbial',
    addedElementDesc: '在句末加 on the table，交代苹果在哪里',
    whyAddIt: '地点状语补充事情发生的位置，通常放在句子的后面。',
    sentenceEn: 'The big apple is very red on the table.',
    sentenceZh: '桌上的这个大苹果很红。',
    highlightWords: ['on the table'],
    breakdown: [
      { text: 'The big apple', role: '主语（这个大苹果）' },
      { text: 'is', role: '系动词（连接主语和表语）' },
      { text: 'very red', role: '表语部分（说明苹果很红）' },
      { text: 'on the table', role: '地点状语（说明苹果在桌子上）', isNew: true },
    ],
    takeaway: '地点通常放在核心句子之后：The apple is red + on the table。',
  },
  {
    step: 5,
    titleZh: '第 05 步 · 最后交代时间',
    tagZh: '地点在前 + 时间在后',
    pattern: 'Subject + Linking Verb + Predicative + Place Adverbial + Time Adverbial',
    addedElementDesc: '在地点后加 today，说明我们说的是今天的情况',
    whyAddIt: '需要同时交代地点和时间时，英语一般先说地点，再说时间。',
    sentenceEn: 'The big apple is very red on the table today.',
    sentenceZh: '桌上的这个大苹果今天很红。',
    highlightWords: ['today'],
    breakdown: [
      { text: 'The big apple', role: '主语（这个大苹果）' },
      { text: 'is', role: '系动词（连接主语和表语）' },
      { text: 'very red', role: '表语部分（说明苹果很红）' },
      { text: 'on the table', role: '地点状语（在桌子上）' },
      { text: 'today', role: '时间状语（今天，一般放在句末）', isNew: true },
    ],
    takeaway: '常见顺序是“核心句子 + 地点 + 时间”。如果想强调时间，也可以写成 Today, the big apple is very red on the table.',
  },
]

export const SV_SENTENCE_GROWTH_STEPS: SentenceGrowthStep[] = [
  {
    step: 1,
    titleZh: '第 01 步 · 最简单的主谓句',
    tagZh: '主语 + 谓语',
    pattern: 'Subject + Verb',
    addedElementDesc: '先说清楚“谁做什么”：Birds（鸟）+ fly（飞）',
    whyAddIt: '有些动作不需要作用到其他事物上，只用主语和动词就能表达完整意思。',
    sentenceEn: 'Birds fly.',
    sentenceZh: '鸟会飞。',
    highlightWords: ['Birds', 'fly'],
    breakdown: [
      { text: 'Birds', role: '主语（动作的发出者：“鸟”）', isNew: true },
      { text: 'fly', role: '谓语动词（说明鸟做什么：“飞”）', isNew: true },
    ],
    takeaway: '如果动词后不需要回答“什么”或“谁”，主语加谓语就可以成为完整句子。',
  },
  {
    step: 2,
    titleZh: '第 02 步 · 说清是什么鸟',
    tagZh: '定语 + 主语 + 谓语',
    pattern: 'Attributive + Subject + Verb',
    addedElementDesc: '在 birds 前加 small，说明是“小鸟”',
    whyAddIt: '形容词放在名词前，可以让主语更具体。',
    sentenceEn: 'Small birds fly.',
    sentenceZh: '小鸟会飞。',
    highlightWords: ['Small'],
    breakdown: [
      { text: 'Small', role: '定语（说明鸟很小）', isNew: true },
      { text: 'birds', role: '主语（鸟）' },
      { text: 'fly', role: '谓语动词（飞）' },
    ],
    takeaway: '定语只是补充主语的信息，去掉 small，Birds fly. 仍然成立。',
  },
  {
    step: 3,
    titleZh: '第 03 步 · 说明飞得怎样',
    tagZh: '方式状语',
    pattern: 'Subject + Verb + Manner Adverbial',
    addedElementDesc: '在 fly 后加 high，说明鸟飞得很高',
    whyAddIt: '方式状语补充动作发生的方式或程度。',
    sentenceEn: 'Small birds fly high.',
    sentenceZh: '小鸟飞得很高。',
    highlightWords: ['high'],
    breakdown: [
      { text: 'Small birds', role: '主语（小鸟）' },
      { text: 'fly', role: '谓语动词（飞）' },
      { text: 'high', role: '状语（说明飞得多高）', isNew: true },
    ],
    takeaway: '主干仍然是 Birds fly.，high 只是给动作增加细节。',
  },
  {
    step: 4,
    titleZh: '第 04 步 · 加上地点和时间',
    tagZh: '地点在前 + 时间在后',
    pattern: 'Subject + Verb + Manner + Place + Time',
    addedElementDesc: '句末加入 in the sky 和 every day',
    whyAddIt: '地点和时间让别人知道动作在哪里、什么时候发生。',
    sentenceEn: 'Small birds fly high in the sky every day.',
    sentenceZh: '小鸟每天都在天空中高飞。',
    highlightWords: ['in the sky', 'every day'],
    breakdown: [
      { text: 'Small birds', role: '主语（小鸟）' },
      { text: 'fly', role: '谓语动词（飞）' },
      { text: 'high', role: '方式状语（飞得高）' },
      { text: 'in the sky', role: '地点状语（在天空中）', isNew: true },
      { text: 'every day', role: '时间状语（每天，一般放在句末）', isNew: true },
    ],
    takeaway: '常见顺序是“主谓 + 方式 + 地点 + 时间”。强调时间时也可以写成 Every day, small birds fly...',
  },
]

export const SVOO_SENTENCE_GROWTH_STEPS: SentenceGrowthStep[] = [
  {
    step: 1,
    titleZh: '第 01 步 · 一个动作带两个对象',
    tagZh: '主语 + 谓语 + 间宾 + 直宾',
    pattern: 'Subject + Verb + Indirect Object + Direct Object',
    addedElementDesc: '说明“谁给谁什么”：Mom + gives + me + a book',
    whyAddIt: 'give 这类动词常同时涉及接收者和被给予的东西，所以后面会出现两个宾语。',
    sentenceEn: 'Mom gives me a book.',
    sentenceZh: '妈妈给我一本书。',
    highlightWords: ['me', 'a book'],
    breakdown: [
      { text: 'Mom', role: '主语（给东西的人：“妈妈”）' },
      { text: 'gives', role: '谓语动词（给）' },
      { text: 'me', role: '间接宾语（收到东西的人：“我”）', isNew: true },
      { text: 'a book', role: '直接宾语（被给予的东西：“一本书”）', isNew: true },
    ],
    takeaway: '简单记忆：先说“给谁”，再说“给什么”。me 是人，a book 是东西。',
  },
  {
    step: 2,
    titleZh: '第 02 步 · 说清是什么书',
    tagZh: '定语 + 直接宾语',
    pattern: 'Subject + Verb + Indirect Object + Attributive + Direct Object',
    addedElementDesc: '在 book 前加 new，说明是一本新书',
    whyAddIt: '形容词放在名词前，可以补充物品的特点。',
    sentenceEn: 'Mom gives me a new book.',
    sentenceZh: '妈妈给我一本新书。',
    highlightWords: ['new'],
    breakdown: [
      { text: 'Mom', role: '主语（妈妈）' },
      { text: 'gives', role: '谓语动词（给）' },
      { text: 'me', role: '间接宾语（我）' },
      { text: 'a new book', role: '直接宾语（一本新书）', isNew: true },
    ],
    takeaway: 'new 只是在说明 book，句子的核心仍然是 Mom gives me a book.',
  },
  {
    step: 3,
    titleZh: '第 03 步 · 加上地点',
    tagZh: '地点状语',
    pattern: 'Subject + Verb + Indirect Object + Direct Object + Place',
    addedElementDesc: '句末加入 at home，说明给书的地点',
    whyAddIt: '地点状语告诉别人事情在哪里发生。',
    sentenceEn: 'Mom gives me a new book at home.',
    sentenceZh: '妈妈在家里给我一本新书。',
    highlightWords: ['at home'],
    breakdown: [
      { text: 'Mom', role: '主语（妈妈）' },
      { text: 'gives', role: '谓语动词（给）' },
      { text: 'me', role: '间接宾语（我）' },
      { text: 'a new book', role: '直接宾语（一本新书）' },
      { text: 'at home', role: '地点状语（在家里）', isNew: true },
    ],
    takeaway: '两个宾语要紧跟在动词后面，地点放在核心句子之后。',
  },
  {
    step: 4,
    titleZh: '第 04 步 · 最后交代时间',
    tagZh: '地点在前 + 时间在后',
    pattern: 'Subject + Verb + Indirect Object + Direct Object + Place + Time',
    addedElementDesc: '在地点后加 today，说明事情发生在今天',
    whyAddIt: '同时出现地点和时间时，英语通常先说地点，再说时间。',
    sentenceEn: 'Mom gives me a new book at home today.',
    sentenceZh: '妈妈今天在家里给我一本新书。',
    highlightWords: ['today'],
    breakdown: [
      { text: 'Mom', role: '主语（妈妈）' },
      { text: 'gives', role: '谓语动词（给）' },
      { text: 'me', role: '间接宾语（收到书的人）' },
      { text: 'a new book', role: '直接宾语（被给予的书）' },
      { text: 'at home', role: '地点状语（在家里）' },
      { text: 'today', role: '时间状语（今天，一般放在句末）', isNew: true },
    ],
    takeaway: '主谓双宾的骨架是“谁 + 给 + 谁 + 什么”，其他信息通常放在后面。',
  },
]

export const SVOC_SENTENCE_GROWTH_STEPS: SentenceGrowthStep[] = [
  {
    step: 1,
    titleZh: '第 01 步 · 宾语后再补一句',
    tagZh: '主语 + 谓语 + 宾语 + 宾补',
    pattern: 'Subject + Verb + Object + Object Complement',
    addedElementDesc: '说明“什么让谁怎么样”：The news + makes + me + happy',
    whyAddIt: '只说 The news makes me 意思没有说完，还需要 happy 补充说明 me 变成什么状态。',
    sentenceEn: 'The news makes me happy.',
    sentenceZh: '这个消息让我开心。',
    highlightWords: ['me', 'happy'],
    breakdown: [
      { text: 'The news', role: '主语（带来影响的事物：“这个消息”）' },
      { text: 'makes', role: '谓语动词（使、让）' },
      { text: 'me', role: '宾语（受到影响的人：“我”）', isNew: true },
      { text: 'happy', role: '宾语补足语（说明我变得开心）', isNew: true },
    ],
    takeaway: '判断宾补的简单方法：宾语和宾补之间能组成“me am happy”这样的意思关系。',
  },
  {
    step: 2,
    titleZh: '第 02 步 · 说清是什么消息',
    tagZh: '定语 + 主语',
    pattern: 'Attributive + Subject + Verb + Object + Object Complement',
    addedElementDesc: '在 news 前加 good，说明是好消息',
    whyAddIt: '形容词放在名词前，让主语表达得更具体。',
    sentenceEn: 'The good news makes me happy.',
    sentenceZh: '这个好消息让我开心。',
    highlightWords: ['good'],
    breakdown: [
      { text: 'The good news', role: '主语（这个好消息）', isNew: true },
      { text: 'makes', role: '谓语动词（让）' },
      { text: 'me', role: '宾语（我）' },
      { text: 'happy', role: '宾语补足语（开心）' },
    ],
    takeaway: 'good 修饰 news，不改变“news makes me happy”这个核心结构。',
  },
  {
    step: 3,
    titleZh: '第 03 步 · 加强开心的程度',
    tagZh: '程度副词 + 宾补',
    pattern: 'Subject + Verb + Object + Degree Adverb + Object Complement',
    addedElementDesc: '在 happy 前加 very，表示“非常开心”',
    whyAddIt: 'very 补充说明 happy 的程度。',
    sentenceEn: 'The good news makes me very happy.',
    sentenceZh: '这个好消息让我非常开心。',
    highlightWords: ['very'],
    breakdown: [
      { text: 'The good news', role: '主语（这个好消息）' },
      { text: 'makes', role: '谓语动词（让）' },
      { text: 'me', role: '宾语（我）' },
      { text: 'very happy', role: '宾语补足语（说明我非常开心）', isNew: true },
    ],
    takeaway: '宾补可以是形容词短语，例如 happy、very happy、very tired。',
  },
  {
    step: 4,
    titleZh: '第 04 步 · 加上地点和时间',
    tagZh: '地点在前 + 时间在后',
    pattern: 'Subject + Verb + Object + Complement + Place + Time',
    addedElementDesc: '句末加入 at school 和 today',
    whyAddIt: '地点和时间补充消息带来影响的场景。',
    sentenceEn: 'The good news makes me very happy at school today.',
    sentenceZh: '这个好消息让我今天在学校里非常开心。',
    highlightWords: ['at school', 'today'],
    breakdown: [
      { text: 'The good news', role: '主语（这个好消息）' },
      { text: 'makes', role: '谓语动词（让）' },
      { text: 'me', role: '宾语（我）' },
      { text: 'very happy', role: '宾语补足语（非常开心）' },
      { text: 'at school', role: '地点状语（在学校）', isNew: true },
      { text: 'today', role: '时间状语（今天）', isNew: true },
    ],
    takeaway: '先抓住 makes me happy，再看地点和时间，就不会被较长的句子迷惑。',
  },
]

export const THERE_BE_SENTENCE_GROWTH_STEPS: SentenceGrowthStep[] = [
  {
    step: 1,
    titleZh: '第 01 步 · 表示“有某物”',
    tagZh: 'There + be + 名词',
    pattern: 'There + Be + Noun',
    addedElementDesc: '用 There is a book 表示“有一本书”',
    whyAddIt: '当我们想介绍某处存在一个人或事物时，可以用 There be 开头。',
    sentenceEn: 'There is a book.',
    sentenceZh: '有一本书。',
    highlightWords: ['There is'],
    breakdown: [
      { text: 'There', role: '引导词（帮助我们开始表达“有……”）', isNew: true },
      { text: 'is', role: 'be 动词（后面是一件事物，所以用 is）', isNew: true },
      { text: 'a book', role: '真正被介绍的事物（一本书）' },
    ],
    takeaway: 'There is 后接一个人或一件事物；这里的 there 不表示“那里”。',
  },
  {
    step: 2,
    titleZh: '第 02 步 · 说清是什么书',
    tagZh: '定语 + 名词',
    pattern: 'There + Be + Attributive + Noun',
    addedElementDesc: '在 book 前加 red，说明是一本红色的书',
    whyAddIt: '形容词放在名词前，补充事物的特点。',
    sentenceEn: 'There is a red book.',
    sentenceZh: '有一本红色的书。',
    highlightWords: ['red'],
    breakdown: [
      { text: 'There is', role: '表示“有一件事物”' },
      { text: 'a red book', role: '被介绍的事物（一本红色的书）', isNew: true },
    ],
    takeaway: 'There be 后面的名词才是句子真正要介绍的新事物。',
  },
  {
    step: 3,
    titleZh: '第 03 步 · 交代在哪里',
    tagZh: '地点状语',
    pattern: 'There + Be + Noun + Place',
    addedElementDesc: '句末加入 on the table，说明书的位置',
    whyAddIt: 'There be 经常与地点一起使用，告诉别人哪里有什么。',
    sentenceEn: 'There is a red book on the table.',
    sentenceZh: '桌上有一本红色的书。',
    highlightWords: ['on the table'],
    breakdown: [
      { text: 'There is', role: '表示“有一件事物”' },
      { text: 'a red book', role: '被介绍的事物（一本红色的书）' },
      { text: 'on the table', role: '地点状语（在桌子上）', isNew: true },
    ],
    takeaway: '最常见结构是 There be + 某人或某物 + 地点。',
  },
  {
    step: 4,
    titleZh: '第 04 步 · 从一本变成两本',
    tagZh: '复数使用 are',
    pattern: 'There + Are + Plural Noun + Place + Time',
    addedElementDesc: '把一本书变成两本书，并在句末加入 now',
    whyAddIt: '后面是复数 books 时，is 要变成 are；时间仍然放在句末。',
    sentenceEn: 'There are two red books on the table now.',
    sentenceZh: '现在桌上有两本红色的书。',
    highlightWords: ['are', 'two', 'now'],
    breakdown: [
      { text: 'There are', role: '表示“有多个事物”，复数使用 are', isNew: true },
      { text: 'two red books', role: '被介绍的事物（两本红色的书）', isNew: true },
      { text: 'on the table', role: '地点状语（在桌子上）' },
      { text: 'now', role: '时间状语（现在，放在句末）', isNew: true },
    ],
    takeaway: '单数用 There is，复数用 There are。先看后面的名词是一个还是多个。',
  },
]

export interface SentenceElementMeta {
  id: string
  code: string
  nameEn: string
  nameZh: string
  color: string
  badgeClass: string
  definition: string
  typicalFillers: string
}

export const SENTENCE_ELEMENTS_DATA: SentenceElementMeta[] = [
  {
    id: 'subject',
    code: 'S',
    nameEn: 'Subject',
    nameZh: '主语',
    color: '#34D399',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    definition: '动作的执行者、事件的主体或全句陈述的核心聚焦对象。',
    typicalFillers: '名词、代词、动名词(-ing)、不定式(to do)、名词性从句。',
  },
  {
    id: 'predicate',
    code: 'V',
    nameEn: 'Verb / Predicate',
    nameZh: '谓语动词',
    color: '#38BDF8',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    definition: '句子的动力引擎，阐明主语做了什么、处于何种状态或受到何种作用。',
    typicalFillers: '及物动词、不及物动词、连系动词、助动词+实义动词。',
  },
  {
    id: 'object',
    code: 'O',
    nameEn: 'Object',
    nameZh: '宾语',
    color: '#F472B6',
    badgeClass: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    definition: '动作的直接或间接受动体、靶目标或介词的归宿。',
    typicalFillers: '名词、代词宾格、名词性短语、动名词、宾语从句。',
  },
  {
    id: 'predicative',
    code: 'P',
    nameEn: 'Predicative',
    nameZh: '表语',
    color: '#FBBF24',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    definition: '紧随系动词之后，说明主语的身份、属性、内在特质或情感状态。',
    typicalFillers: '形容词、名词、介词短语、分词、表语从句。',
  },
  {
    id: 'indirect_object',
    code: 'Oi',
    nameEn: 'Indirect Object',
    nameZh: '间接宾语',
    color: '#C084FC',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    definition: '双宾动词中动作的受益者或接受者（通常为人），如 give sb sth 中的 sb。',
    typicalFillers: '人称代词宾格、指人名词短语。',
  },
  {
    id: 'direct_object',
    code: 'Od',
    nameEn: 'Direct Object',
    nameZh: '直接宾语',
    color: '#EC4899',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    definition: '双宾动词中动作直接触碰、传递的实质客体（通常为物），如 give sb sth 中的 sth。',
    typicalFillers: '指物名词、代词、代词短语。',
  },
  {
    id: 'complement',
    code: 'Oc',
    nameEn: 'Object Complement',
    nameZh: '宾语补足语',
    color: '#2DD4BF',
    badgeClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    definition: '紧随宾语之后补充说明宾语的状态、动作或身份；缺其则宾语语义残缺。',
    typicalFillers: '形容词、不带/带 to 的不定式、分词、名词。',
  },
  {
    id: 'attributive',
    code: 'Att',
    nameEn: 'Attributive',
    nameZh: '定语',
    color: '#818CF8',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    definition: '修饰、限制、描摹名词或代词的品质特征（句子的华美服饰）。',
    typicalFillers: '形容词、名词属格、介词短语、现在/过去分词、定语从句。',
  },
  {
    id: 'adverbial',
    code: 'Adv',
    nameEn: 'Adverbial',
    nameZh: '状语',
    color: '#A3E635',
    badgeClass: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
    definition: '修饰动词、形容词、副词或整句，阐明时间、地点、原因、条件、方式或程度。',
    typicalFillers: '副词、介词短语、分词短语、不定式短语、状语从句。',
  },
]

export interface DerivationStep {
  level: number
  titleZh: string
  pattern: string
  description: string
  conceptLogic: string
  minimalExample: {
    en: string
    zh: string
    tokens: { word: string; role: string; color: string }[]
  }
  derivationStory: string // 为什么从上一层进化到这一层
  enrichedSentence: {
    en: string
    zh: string
    tokens: { word: string; role: string; color: string; isModifier?: boolean }[]
  }
}

export const SENTENCE_DERIVATION_STEPS: DerivationStep[] = [
  {
    level: 1,
    titleZh: '极简原核：主语 + 不及物动词 (S + Vi)',
    pattern: 'Subject + Intransitive Verb',
    description: '表达独立自主、闭环自足的动作，动词本身意义完整，不需要外来受体承接。',
    conceptLogic: '万物皆有其动。雨会落下，鸟会飞翔，火会燃烧。这是人类表达动作最纯粹的起点。',
    minimalExample: {
      en: 'Rain falls.',
      zh: '雨落下。',
      tokens: [
        { word: 'Rain', role: 'S (主语)', color: 'text-emerald-400' },
        { word: 'falls.', role: 'Vi (不及物谓语)', color: 'text-sky-400' },
      ],
    },
    derivationStory: '最基础的生命体。但如果动词并不是自足动作，而是需要连接一个形容词来描述状态呢？这促使人类发明了系动词。',
    enrichedSentence: {
      en: 'Gentle spring rain falls quietly across the silent mountain valley.',
      zh: '温柔的春雨静悄悄地洒落在静谧的山谷各处。',
      tokens: [
        { word: 'Gentle spring', role: 'Att (定语修饰rain)', color: 'text-indigo-400', isModifier: true },
        { word: 'rain', role: 'S (主干主语)', color: 'text-emerald-400' },
        { word: 'falls', role: 'Vi (主干谓语)', color: 'text-sky-400' },
        { word: 'quietly', role: 'Adv (方式状语)', color: 'text-lime-400', isModifier: true },
        { word: 'across the silent mountain valley.', role: 'Adv (地点状语)', color: 'text-lime-400', isModifier: true },
      ],
    },
  },
  {
    level: 2,
    titleZh: '静止写意：主语 + 系动词 + 表语 (S + V-link + P)',
    pattern: 'Subject + Linking Verb + Predicative',
    description: '系动词如同数学等号（=），本身无强动态动作，仅作为逻辑桥梁，将主语引向其属性、状态或身份（表语）。',
    conceptLogic: '由动态动作向静态认知的跃升：不再描述“做什么”，而是定义“是什么/怎么样”。',
    minimalExample: {
      en: 'Knowledge is power.',
      zh: '知识就是力量。',
      tokens: [
        { word: 'Knowledge', role: 'S (主语)', color: 'text-emerald-400' },
        { word: 'is', role: 'V-link (连系动词)', color: 'text-sky-400' },
        { word: 'power.', role: 'P (表语/身份)', color: 'text-amber-400' },
      ],
    },
    derivationStory: '不仅能定义“是什么”，很多感官动词（look, smell, sound, become）也可作系动词。但当我们需要施加动作于外部世界实体时，必须引入受体（宾语）。',
    enrichedSentence: {
      en: 'Deep scientific knowledge remains truly powerful in an unpredictable world.',
      zh: '深厚严谨的科学知识，在不可预测的世界中始终蕴含着真正强大的力量。',
      tokens: [
        { word: 'Deep scientific', role: 'Att (定语)', color: 'text-indigo-400', isModifier: true },
        { word: 'knowledge', role: 'S (主语)', color: 'text-emerald-400' },
        { word: 'remains', role: 'V-link (系动词)', color: 'text-sky-400' },
        { word: 'truly', role: 'Adv (程度状语)', color: 'text-lime-400', isModifier: true },
        { word: 'powerful', role: 'P (表语形容词)', color: 'text-amber-400' },
        { word: 'in an unpredictable world.', role: 'Adv (环境状语)', color: 'text-lime-400', isModifier: true },
      ],
    },
  },
  {
    level: 3,
    titleZh: '力量投射：主语 + 及物动词 + 宾语 (S + Vt + O)',
    pattern: 'Subject + Transitive Verb + Object',
    description: '施力者发出动作，越过边界直接作用于客体受动者（宾语）。构成了人类叙事与交互的最广泛骨架。',
    conceptLogic: '能量从主体流向客体，明确“谁对谁做了什么”。这是物理世界因果链条的语言投射。',
    minimalExample: {
      en: 'She reads books.',
      zh: '她阅读书籍。',
      tokens: [
        { word: 'She', role: 'S (施事者主语)', color: 'text-emerald-400' },
        { word: 'reads', role: 'Vt (及物谓语)', color: 'text-sky-400' },
        { word: 'books.', role: 'O (承受客体宾语)', color: 'text-pink-400' },
      ],
    },
    derivationStory: '单向宾语足够传达直接作用。然而在人类社会协作中，“给予、馈赠、传达”等动作往往同时牵扯“给谁”和“给了什么”，由此催生了双宾语结构。',
    enrichedSentence: {
      en: 'Every evening, the curious girl avidly reads inspiring historical books.',
      zh: '每到傍晚，那个满怀好奇的女孩都会如饥似渴地阅读启发人心的历史典籍。',
      tokens: [
        { word: 'Every evening,', role: 'Adv (时间状语)', color: 'text-lime-400', isModifier: true },
        { word: 'the curious', role: 'Att (定语)', color: 'text-indigo-400', isModifier: true },
        { word: 'girl', role: 'S (主语)', color: 'text-emerald-400' },
        { word: 'avidly', role: 'Adv (方式状语)', color: 'text-lime-400', isModifier: true },
        { word: 'reads', role: 'Vt (谓语动词)', color: 'text-sky-400' },
        { word: 'inspiring historical', role: 'Att (定语修饰books)', color: 'text-indigo-400', isModifier: true },
        { word: 'books.', role: 'O (宾语客体)', color: 'text-pink-400' },
      ],
    },
  },
  {
    level: 4,
    titleZh: '受体分化：主语 + 及物动词 + 间宾 + 直宾 (S + Vt + Oi + Od)',
    pattern: 'Subject + Transitive Verb + Indirect Object + Direct Object',
    description: '动作同时辐射到两个客体：间接宾语（通常为人，受益或受损方）与直接宾语（具体的物或信息载体）。',
    conceptLogic: '等价转换密码：S + Vt + Oi + Od = S + Vt + Od + to/for Oi（例如 gave me a book = gave a book to me）。',
    minimalExample: {
      en: 'He gave me a gift.',
      zh: '他给了我一件礼物。',
      tokens: [
        { word: 'He', role: 'S (主语)', color: 'text-emerald-400' },
        { word: 'gave', role: 'Vt (双宾谓语)', color: 'text-sky-400' },
        { word: 'me', role: 'Oi (间宾/接收人)', color: 'text-purple-400' },
        { word: 'a gift.', role: 'Od (直宾/实质物)', color: 'text-pink-400' },
      ],
    },
    derivationStory: '双宾语解决了“物转移给谁”的问题。但如果一个动词虽然有了宾语，但动作结束后宾语变成什么状态仍未说清呢？例如“我们选他（…作为什么？）”，这就迫切需要宾语补足语。',
    enrichedSentence: {
      en: 'Without hesitation, the retired professor generously gave his favorite student a rare manuscript.',
      zh: '那位退休教授毫不犹豫地将一份极其珍罕的手稿，慷慨赠予了他最喜爱的学生。',
      tokens: [
        { word: 'Without hesitation,', role: 'Adv (状语)', color: 'text-lime-400', isModifier: true },
        { word: 'the retired', role: 'Att (定语)', color: 'text-indigo-400', isModifier: true },
        { word: 'professor', role: 'S (主语)', color: 'text-emerald-400' },
        { word: 'generously', role: 'Adv (状语)', color: 'text-lime-400', isModifier: true },
        { word: 'gave', role: 'Vt (谓语)', color: 'text-sky-400' },
        { word: 'his favorite student', role: 'Oi (间接宾语)', color: 'text-purple-400' },
        { word: 'a rare manuscript.', role: 'Od (直接宾语)', color: 'text-pink-400' },
      ],
    },
  },
  {
    level: 5,
    titleZh: '完形闭环：主语 + 及物动词 + 宾语 + 宾补 (S + Vt + O + Oc)',
    pattern: 'Subject + Transitive Verb + Object + Object Complement',
    description: '谓语动词直接作用于宾语，使宾语发生了某种状态、动作或身份的转变。补语与宾语在逻辑上构成“主谓关系”或“主系表关系”。',
    conceptLogic: '验证神器：在宾语与宾补之间插入 be 动词，若逻辑成立即为宾补！（如 made him happy -> him is happy -> he is happy 逻辑成立）。',
    minimalExample: {
      en: 'Music makes him calm.',
      zh: '音乐使他沉静。',
      tokens: [
        { word: 'Music', role: 'S (主语)', color: 'text-emerald-400' },
        { word: 'makes', role: 'Vt (致使谓语)', color: 'text-sky-400' },
        { word: 'him', role: 'O (宾语)', color: 'text-pink-400' },
        { word: 'calm.', role: 'Oc (宾补/状态)', color: 'text-teal-400' },
      ],
    },
    derivationStory: '至此，简单句五大核心骨架（S+Vi, S+V+P, S+V+O, S+V+Oi+Od, S+V+O+Oc）全部诞生！下一步，人类语言开始通过“定语从句”和“状语从句”向高阶复句跃迁。',
    enrichedSentence: {
      en: 'Unexpectedly, this profound realization made the exhausted traveler completely fearless.',
      zh: '出乎意料的是，这番深刻的领悟让疲惫不堪的旅人变得彻底无所畏惧。',
      tokens: [
        { word: 'Unexpectedly,', role: 'Adv (评注状语)', color: 'text-lime-400', isModifier: true },
        { word: 'this profound', role: 'Att (定语)', color: 'text-indigo-400', isModifier: true },
        { word: 'realization', role: 'S (主语)', color: 'text-emerald-400' },
        { word: 'made', role: 'Vt (谓语动词)', color: 'text-sky-400' },
        { word: 'the exhausted traveler', role: 'O (宾语短语)', color: 'text-pink-400' },
        { word: 'completely', role: 'Adv (修饰补语)', color: 'text-lime-400', isModifier: true },
        { word: 'fearless.', role: 'Oc (形容词作宾补)', color: 'text-teal-400' },
      ],
    },
  },
  {
    level: 6,
    titleZh: '有机参天：定状全景枝叶包裹',
    pattern: '(Adverbial) + [Attributive] Subject + Verb + [Attributive] Object + (Adverbial)',
    description: '在5大核心骨干的基础上，自由嫁接多重前置定语、后置介词短语、分词定语以及多层时间/地点/方式状语，句子获得血肉与张力。',
    conceptLogic: '脱衣穿衣法则：剥离所有定语（括号[]）与状语（小括号()），句子瞬间还原为三五个词的裸露主干！',
    minimalExample: {
      en: 'Diligent students read books in the library.',
      zh: '勤奋的学生在图书馆读书。',
      tokens: [
        { word: '[Diligent]', role: 'Att (定语)', color: 'text-indigo-400' },
        { word: 'students', role: 'S (主语)', color: 'text-emerald-400' },
        { word: 'read', role: 'V (谓语)', color: 'text-sky-400' },
        { word: 'books', role: 'O (宾语)', color: 'text-pink-400' },
        { word: '(in the library).', role: 'Adv (地点状语)', color: 'text-lime-400' },
      ],
    },
    derivationStory: '当简单句的信息容量达到上限，人类开始用连词与引导词将多个简单句编织嵌套，形成了表达高阶思辨的复合句与复杂从句。',
    enrichedSentence: {
      en: 'Under the flickering glow of midnight lamps, those exceptionally dedicated scholars passionately analyzed ancient manuscripts with forensic precision.',
      zh: '在午夜孤灯闪烁的微光下，那些极其专注的学者们以严丝合缝的精准度，满怀激情地解构着古老的手稿。',
      tokens: [
        { word: 'Under the flickering glow of midnight lamps,', role: 'Adv (空间环境状语)', color: 'text-lime-400', isModifier: true },
        { word: 'those exceptionally dedicated', role: 'Att (多层修饰定语)', color: 'text-indigo-400', isModifier: true },
        { word: 'scholars', role: 'S (核心主干主语)', color: 'text-emerald-400' },
        { word: 'passionately', role: 'Adv (情态状语)', color: 'text-lime-400', isModifier: true },
        { word: 'analyzed', role: 'V (及物谓语)', color: 'text-sky-400' },
        { word: 'ancient', role: 'Att (定语)', color: 'text-indigo-400', isModifier: true },
        { word: 'manuscripts', role: 'O (核心主干宾语)', color: 'text-pink-400' },
        { word: 'with forensic precision.', role: 'Adv (方式状语)', color: 'text-lime-400', isModifier: true },
      ],
    },
  },
  {
    level: 7,
    titleZh: '思想穹顶：复合句与从属复句 (Hypotaxis & Matrix Clauses)',
    pattern: 'Complex Sentence with Noun, Adverbial & Relative Clauses',
    description: '借助三大从句（定语从句、状语从句、名词性从句），多层逻辑在同一主句中精密嵌套，是学术论文与逻辑论述的巅峰形态。',
    conceptLogic: '从句本质上就是简单句的升维：整个句子充当名词（名词性从句）、充当形容词（定语从句）或充当副词（状语从句）。',
    minimalExample: {
      en: 'The scientist whom we met yesterday proved that clean energy is viable.',
      zh: '我们昨天遇见的那位科学家证明了清洁能源是切实可行的。',
      tokens: [
        { word: 'The scientist', role: '主句主语', color: 'text-emerald-400' },
        { word: '[whom we met yesterday]', role: '定语从句修饰scientist', color: 'text-indigo-400' },
        { word: 'proved', role: '主句谓语', color: 'text-sky-400' },
        { word: '[that clean energy is viable].', role: 'that引导宾语从句', color: 'text-amber-400' },
      ],
    },
    derivationStory: '至此完成从“2个词的极简原核”到“承载复杂思想的语言巨塔”的完整推导历程。抓住结构，再长难的句子也一目了然！',
    enrichedSentence: {
      en: 'Although the storm raged outside, the researcher who discovered the anomaly remained convinced that their hypothesis would ultimately revolutionize medicine.',
      zh: '尽管屋外风暴狂暴肆虐，那位发现数据异常的研究员仍然坚信，他们的科学假说终将为现代医学带来革命性的突破。',
      tokens: [
        { word: 'Although the storm raged outside,', role: '让步状语从句', color: 'text-lime-400', isModifier: true },
        { word: 'the researcher', role: '主句主语', color: 'text-emerald-400' },
        { word: 'who discovered the anomaly', role: '定语从句修饰researcher', color: 'text-indigo-400', isModifier: true },
        { word: 'remained', role: '主句系动词谓语', color: 'text-sky-400' },
        { word: 'convinced', role: '主句表语', color: 'text-amber-400' },
        { word: 'that their hypothesis would ultimately revolutionize medicine.', role: 'that引导宾语/同位从句', color: 'text-purple-400', isModifier: true },
      ],
    },
  },
]

// ---------------------------------------------------------------------------
// 3. Tenses Matrix (16 时态时空全景矩阵与时间轴)
// ---------------------------------------------------------------------------
export type TimeDimension = 'past' | 'present' | 'future' | 'past_future'
export type AspectDimension = 'simple' | 'continuous' | 'perfect' | 'perfect_continuous'

/** 单个时态的例句（面向初学者，动词部分单独标出以便高亮） */
export interface TenseExample {
  en: string
  zh: string
  /** 句中需要高亮的动词形式 */
  verbPart: string
}

export interface TenseItem {
  id: string
  nameEn: string
  nameZh: string
  time: TimeDimension
  timeZh: string
  aspect: AspectDimension
  aspectZh: string
  formula: string
  isHighFrequency: boolean // 是否属于日常最高频8大时态
  timelineVisual: {
    pointOrRange: 'point' | 'range' | 'bridge' | 'future_point'
    description: string
    coordinateHint: string // 坐标图解提示文字
  }
  coreConcept: string
  signalWords: string[]
  /** 该时态的两条简单例句 */
  examples: TenseExample[]
  contrastTrap?: {
    vsTenseName: string
    differenceZh: string
    examplePair: { tenseA: string; sentenceA: string; tenseB: string; sentenceB: string }
  }
}

export const TENSES_DATA: TenseItem[] = [
  // --- 现在时 (Present) ---
  {
    id: 'simple_present',
    nameEn: 'Simple Present',
    nameZh: '一般现在时',
    time: 'present',
    timeZh: '现在',
    aspect: 'simple',
    aspectZh: '一般',
    formula: 'do / does (动词原形/第三人称单数-s)',
    isHighFrequency: true,
    timelineVisual: {
      pointOrRange: 'range',
      description: '贯穿过去、现在与未来的长效真理或周期性复发点。',
      coordinateHint: '永恒常态轴 (Past <--- Now ---> Future)',
    },
    coreConcept: '不表达此刻正在发生！而是表达“客观真理、常态习惯、普遍规律或既定性格”。',
    signalWords: ['always', 'usually', 'often', 'every day', 'seldom', 'never'],
    examples: [
      {
        en: 'I get up at seven every morning.',
        zh: '我每天早上七点起床。',
        verbPart: 'get up',
      },
      {
        en: 'Water boils at 100°C.',
        zh: '水在一百度时沸腾。',
        verbPart: 'boils',
      },
    ],
    contrastTrap: {
      vsTenseName: 'Present Continuous (现在进行时)',
      differenceZh: '一般现在时表“恒常规律/习惯”，现在进行时表“此刻暂时状态/暂发偏离常轨”。',
      examplePair: {
        tenseA: 'Simple Present (常态)',
        sentenceA: 'I live in Shanghai. (我是常住居民)',
        tenseB: 'Present Continuous (暂态)',
        sentenceB: 'I am living in a hotel. (出差或临时借住)',
      },
    },
  },
  {
    id: 'present_continuous',
    nameEn: 'Present Continuous',
    nameZh: '现在进行时',
    time: 'present',
    timeZh: '现在',
    aspect: 'continuous',
    aspectZh: '进行',
    formula: 'am / is / are + doing',
    isHighFrequency: true,
    timelineVisual: {
      pointOrRange: 'range',
      description: '以当前时刻为中心、正在展开且尚未闭合的时间波形。',
      coordinateHint: '当前动态波动 [~~~ NOW ~~~]',
    },
    coreConcept: '动作在说话当下正在展开；或表示阶段性的临时动作、亦可加 always 表达说话人的赞叹或抱怨情绪。',
    signalWords: ['now', 'at this moment', 'currently', 'look!', 'listen!'],
    examples: [
      {
        en: 'I am reading a book now.',
        zh: '我现在正在看书。',
        verbPart: 'am reading',
      },
      {
        en: 'Look! The baby is sleeping.',
        zh: '看！宝宝正在睡觉。',
        verbPart: 'is sleeping',
      },
    ],
  },
  {
    id: 'present_perfect',
    nameEn: 'Present Perfect',
    nameZh: '现在完成时',
    time: 'present',
    timeZh: '现在',
    aspect: 'perfect',
    aspectZh: '完成',
    formula: 'have / has + done (过去分词)',
    isHighFrequency: true,
    timelineVisual: {
      pointOrRange: 'bridge',
      description: '一道连接过去动作与现在现实状态的光之桥梁。',
      coordinateHint: '过去产生 ➔ 羁绊影响至现在 [Past =====> NOW]',
    },
    coreConcept: '立足现在看过去！动作发生于过去，但说话人关心的绝对不是“发生于何时”，而是“该动作对现在的后果、影响或人生资历”。',
    signalWords: ['already', 'yet', 'just', 'ever', 'never', 'so far', 'since 2020', 'for 3 years'],
    examples: [
      {
        en: 'I have finished my homework.',
        zh: '我已经写完作业了。',
        verbPart: 'have finished',
      },
      {
        en: 'I have lived here for ten years.',
        zh: '我在这里住了十年了。',
        verbPart: 'have lived',
      },
    ],
    contrastTrap: {
      vsTenseName: 'Simple Past (一般过去时)',
      differenceZh: '一般过去时只关心“过去的既成事实”，对现在毫无羁绊；现在完成时核心在“现在的后果”。',
      examplePair: {
        tenseA: 'Simple Past (钥匙可能早找到了)',
        sentenceA: 'I lost my keys yesterday. (昨天丢的，现在找没找到未知)',
        tenseB: 'Present Perfect (现在进不去家门!)',
        sentenceB: 'I have lost my keys! (后果是：我现在正被锁在门外！)',
      },
    },
  },
  {
    id: 'present_perfect_continuous',
    nameEn: 'Present Perfect Continuous',
    nameZh: '现在完成进行时',
    time: 'present',
    timeZh: '现在',
    aspect: 'perfect_continuous',
    aspectZh: '完成进行',
    formula: 'have / has been + doing',
    isHighFrequency: true,
    timelineVisual: {
      pointOrRange: 'bridge',
      description: '从过去一直持续至此刻，并且大概率还要继续延续下去的波浪。',
      coordinateHint: '跨越时间弧线 [Past ~~~~~~~> NOW ~~~>]',
    },
    coreConcept: '动作从过去某时起始，一刻未停地持续至今，且此刻动作依然在火热进行中，极具过程沉浸感。',
    signalWords: ['all morning', 'for hours', 'how long', 'these past few days'],
    examples: [
      {
        en: 'I have been waiting for an hour.',
        zh: '我已经等了一个小时了。',
        verbPart: 'have been waiting',
      },
      {
        en: 'It has been raining all morning.',
        zh: '一上午都在下雨。',
        verbPart: 'has been raining',
      },
    ],
  },

  // --- 过去时 (Past) ---
  {
    id: 'simple_past',
    nameEn: 'Simple Past',
    nameZh: '一般过去时',
    time: 'past',
    timeZh: '过去',
    aspect: 'simple',
    aspectZh: '一般',
    formula: 'did (动词过去式 -ed 或不规则变形)',
    isHighFrequency: true,
    timelineVisual: {
      pointOrRange: 'point',
      description: '过去时间轴上已经彻底闭合、尘埃落定的孤立历史点。',
      coordinateHint: '封存的历史孤岛 [ * Point in Past ] ---- Now',
    },
    coreConcept: '动作在过去发生并彻底结束，与此时此刻没有任何直接因果羁绊，常伴随明确的过去时间状语。',
    signalWords: ['yesterday', 'ago', 'in 1999', 'last night', 'just now'],
    examples: [
      {
        en: 'I watched a movie yesterday.',
        zh: '我昨天看了一部电影。',
        verbPart: 'watched',
      },
      {
        en: 'He was tired last night.',
        zh: '他昨晚很累。',
        verbPart: 'was',
      },
    ],
  },
  {
    id: 'past_continuous',
    nameEn: 'Past Continuous',
    nameZh: '过去进行时',
    time: 'past',
    timeZh: '过去',
    aspect: 'continuous',
    aspectZh: '进行',
    formula: 'was / were + doing',
    isHighFrequency: true,
    timelineVisual: {
      pointOrRange: 'range',
      description: '过去某个特定聚光灯瞬间正在展开的电影特写画面。',
      coordinateHint: '过去特定片段 [~~~ Then ~~~] ---- Now',
    },
    coreConcept: '在过去某一特定时刻（如昨晚八点）或某一动作发生时，另一个动作正在如火如荼地进行。',
    signalWords: ['at that time', 'at 8:00 yesterday', 'while', 'when sb knocked'],
    examples: [
      {
        en: 'I was sleeping at ten last night.',
        zh: '昨晚十点我正在睡觉。',
        verbPart: 'was sleeping',
      },
      {
        en: 'They were talking when I came in.',
        zh: '我进来的时候他们正在聊天。',
        verbPart: 'were talking',
      },
    ],
  },
  {
    id: 'past_perfect',
    nameEn: 'Past Perfect',
    nameZh: '过去完成时',
    time: 'past',
    timeZh: '过去',
    aspect: 'perfect',
    aspectZh: '完成',
    formula: 'had + done (过去分词)',
    isHighFrequency: true,
    timelineVisual: {
      pointOrRange: 'bridge',
      description: '“过去的过去”：发生时间严格早于某个过去基准点。',
      coordinateHint: '[Past of Past (had done)] ===> [Past baseline (did)] ---> Now',
    },
    coreConcept: '时间的相对论！只有在句子中存在一个“一般过去时作为参照基准”时，早于该基准的动作才使用过去完成时。',
    signalWords: ['by the time', 'before', 'hardly...when', 'no sooner...than'],
    examples: [
      {
        en: 'The bus had left before I arrived.',
        zh: '我到之前公交车已经开走了。',
        verbPart: 'had left',
      },
      {
        en: 'I had never seen the sea before that trip.',
        zh: '那次旅行之前我从没见过大海。',
        verbPart: 'had seen',
      },
    ],
  },
  {
    id: 'past_perfect_continuous',
    nameEn: 'Past Perfect Continuous',
    nameZh: '过去完成进行时',
    time: 'past',
    timeZh: '过去',
    aspect: 'perfect_continuous',
    aspectZh: '完成进行',
    formula: 'had been + doing',
    isHighFrequency: false,
    timelineVisual: {
      pointOrRange: 'bridge',
      description: '在过去的过去一直持续，直到另一个过去事件发生才告一段落。',
      coordinateHint: '[~持续过程~ had been doing] ===> [Past baseline did]',
    },
    coreConcept: '强调在过去某一节点之前，动作经历了极其漫长而连续的过程，且对当时的过去产生了明显痕迹。',
    signalWords: ['for weeks before', 'had been doing when'],
    examples: [
      {
        en: 'I had been waiting for two hours when the bus came.',
        zh: '公交车来时我已经等了两个小时了。',
        verbPart: 'had been waiting',
      },
      {
        en: 'They had been playing for an hour before it got dark.',
        zh: '天黑之前他们已经玩了一个小时了。',
        verbPart: 'had been playing',
      },
    ],
  },

  // --- 将来时 (Future) ---
  {
    id: 'simple_future',
    nameEn: 'Simple Future',
    nameZh: '一般将来时',
    time: 'future',
    timeZh: '将来',
    aspect: 'simple',
    aspectZh: '一般',
    formula: 'will + do / be going to + do',
    isHighFrequency: true,
    timelineVisual: {
      pointOrRange: 'future_point',
      description: '未来时间轴上的预期事件或决心意图。',
      coordinateHint: 'Now ---> [ * Future Point (will do) ]',
    },
    coreConcept: '表达说话时刻之后将要发生的动作或未来意愿。will 多表临时起意或客观预测；be going to 多表既定计划或有眼见迹象的发生。',
    signalWords: ['tomorrow', 'next week', 'soon', 'in the future', 'someday'],
    examples: [
      {
        en: 'I will call you tomorrow.',
        zh: '我明天给你打电话。',
        verbPart: 'will call',
      },
      {
        en: 'We are going to visit Grandma this weekend.',
        zh: '这个周末我们打算去看奶奶。',
        verbPart: 'are going to visit',
      },
    ],
  },
  {
    id: 'future_continuous',
    nameEn: 'Future Continuous',
    nameZh: '将来进行时',
    time: 'future',
    timeZh: '将来',
    aspect: 'continuous',
    aspectZh: '进行',
    formula: 'will be + doing',
    isHighFrequency: false,
    timelineVisual: {
      pointOrRange: 'future_point',
      description: '未来某个特定时间点，你正在置身于其中的动态场景。',
      coordinateHint: 'Now ---> [~~~ Future Time ~~~]',
    },
    coreConcept: '在未来某个具体时间点或时间段，动作预计正在展开中，常用于礼貌委婉询问或畅想未来情境。',
    signalWords: ['at this time tomorrow', 'this time next year'],
    examples: [
      {
        en: 'This time tomorrow, I will be flying to Beijing.',
        zh: '明天的这个时候，我会正在飞往北京。',
        verbPart: 'will be flying',
      },
      {
        en: 'Do not call at eight — we will be having dinner.',
        zh: '八点别打电话，那时我们正在吃晚饭。',
        verbPart: 'will be having',
      },
    ],
  },
  {
    id: 'future_perfect',
    nameEn: 'Future Perfect',
    nameZh: '将来完成时',
    time: 'future',
    timeZh: '将来',
    aspect: 'perfect',
    aspectZh: '完成',
    formula: 'will have + done',
    isHighFrequency: false,
    timelineVisual: {
      pointOrRange: 'future_point',
      description: '站在未来某点回望：在那个未来界限之前已全部圆满达成。',
      coordinateHint: 'Now =====> [By Future Deadline (will have done)]',
    },
    coreConcept: '“到了将来的某个时间截止线时，某件事就已经完成闭环了”。',
    signalWords: ['by tomorrow', 'by the end of this year', 'by 2030'],
    examples: [
      {
        en: 'I will have finished the book by Friday.',
        zh: '到周五我会把这本书看完。',
        verbPart: 'will have finished',
      },
      {
        en: 'We will have learned 500 words by the end of the month.',
        zh: '到月底我们将学完 500 个单词。',
        verbPart: 'will have learned',
      },
    ],
  },
  {
    id: 'future_perfect_continuous',
    nameEn: 'Future Perfect Continuous',
    nameZh: '将来完成进行时',
    time: 'future',
    timeZh: '将来',
    aspect: 'perfect_continuous',
    aspectZh: '完成进行',
    formula: 'will have been + doing',
    isHighFrequency: false,
    timelineVisual: {
      pointOrRange: 'future_point',
      description: '直到未来某个节点，动作已经持续了多长时间并且还在继续。',
      coordinateHint: 'Now ~~~~~~~~~~~~~~~~~> [By 2030 (will have been doing for...)]',
    },
    coreConcept: '表达某动作从现在（甚至过去）开始，持续不断直到未来的某个节点，届时将达成一个跨度里程碑。',
    signalWords: ['by next month, for ... years'],
    examples: [
      {
        en: 'By June, I will have been studying here for two years.',
        zh: '到六月，我就在这里学习满两年了。',
        verbPart: 'will have been studying',
      },
      {
        en: 'Next month, he will have been working here for a year.',
        zh: '下个月他就在这里工作满一年了。',
        verbPart: 'will have been working',
      },
    ],
  },

  // --- 过去将来时 (Past Future) ---
  {
    id: 'past_future_simple',
    nameEn: 'Past Future Simple',
    nameZh: '过去将来时',
    time: 'past_future',
    timeZh: '过去将来',
    aspect: 'simple',
    aspectZh: '一般',
    formula: 'would + do / was going to + do',
    isHighFrequency: false,
    timelineVisual: {
      pointOrRange: 'range',
      description: '立足于过去的视角，去窥探那时的“未来”。',
      coordinateHint: '[Past Standpoint] ----> [Then Future] ----> (Today)',
    },
    coreConcept: '常见于宾语从句或间接引语中，主句是过去时，从句表达在当时看来将要发生的事情。',
    signalWords: ['he promised that', 'they knew that'],
    examples: [
      {
        en: 'He said he would come.',
        zh: '他说他会来。',
        verbPart: 'would come',
      },
      {
        en: 'She promised she would help me.',
        zh: '她答应过会帮我。',
        verbPart: 'would help',
      },
    ],
  },
  {
    id: 'past_future_continuous',
    nameEn: 'Past Future Continuous',
    nameZh: '过去将来进行时',
    time: 'past_future',
    timeZh: '过去将来',
    aspect: 'continuous',
    aspectZh: '进行',
    formula: 'would be + doing',
    isHighFrequency: false,
    timelineVisual: {
      pointOrRange: 'range',
      description: '站在过去时间点上，设想过去之后的某刻正在展开的动作。',
      coordinateHint: '[Past Standpoint] ----> [~Then Future Continuous~]',
    },
    coreConcept: '叙述在过去某时看来，未来特定时刻应当正在发生的动作。',
    signalWords: ['he imagined that', 'at that coming hour'],
    examples: [
      {
        en: 'He said he would be waiting at the gate.',
        zh: '他说他会在门口等着。',
        verbPart: 'would be waiting',
      },
      {
        en: 'I thought she would be sleeping when I called.',
        zh: '我以为我打电话时她会在睡觉。',
        verbPart: 'would be sleeping',
      },
    ],
  },
  {
    id: 'past_future_perfect',
    nameEn: 'Past Future Perfect',
    nameZh: '过去将来完成时',
    time: 'past_future',
    timeZh: '过去将来',
    aspect: 'perfect',
    aspectZh: '完成',
    formula: 'would have + done',
    isHighFrequency: false,
    timelineVisual: {
      pointOrRange: 'range',
      description: '过去视角的未来完成态，亦是虚拟语气中针对过去假设的核心配置。',
      coordinateHint: '[Past Standpoint] ====> [By that past-future deadline (would have done)]',
    },
    coreConcept: '常用于虚拟语气中，表达对过去的假想（“要是当年怎样，本就已经达成了”）。',
    signalWords: ['if we had known, we would have done'],
    examples: [
      {
        en: 'I would have called you if I had known.',
        zh: '要是我早知道，我就给你打电话了。',
        verbPart: 'would have called',
      },
      {
        en: 'We would have arrived earlier without the traffic.',
        zh: '要不是堵车我们就早到了。',
        verbPart: 'would have arrived',
      },
    ],
  },
  {
    id: 'past_future_perfect_continuous',
    nameEn: 'Past Future Perfect Continuous',
    nameZh: '过去将来完成进行时',
    time: 'past_future',
    timeZh: '过去将来',
    aspect: 'perfect_continuous',
    aspectZh: '完成进行',
    formula: 'would have been + doing',
    isHighFrequency: false,
    timelineVisual: {
      pointOrRange: 'range',
      description: '从过去某一时刻开始，持续到过去另一个未来节点、且仍在进行的高阶推演。',
      coordinateHint: '[Past Standpoint] ~~~~~~~~~> [By then (would have been doing)]',
    },
    coreConcept: '极少在日常出现，但极其严密地用于精密文学或学术推演，表示到过去某一未来点时，动作将已持续展开多久。',
    signalWords: ['by then, he would have been doing for...'],
    examples: [
      {
        en: 'He said he would have been teaching for 20 years by then.',
        zh: '他说到那时他教书就满二十年了。',
        verbPart: 'would have been teaching',
      },
      {
        en: 'She thought she would have been living there for a decade.',
        zh: '她以为到那时自己在那里已经住了十年。',
        verbPart: 'would have been living',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// 4. Prepositions & Cognitive Maps (介词认知空间网络与隐喻)
// ---------------------------------------------------------------------------
export type SpatialDimension = '0D_point' | '1D_2D_surface' | '3D_container' | 'vector_movement'

export interface PrepositionItem {
  id: string
  word: string
  phonetic: string
  dimension: SpatialDimension
  dimensionLabelZh: string
  geometricModel: string // 几何模型描述
  visualIcon: string
  accentColor: string
  spatialEssence: string // 核心空间感知
  spaceToTimeTransfer: {
    ruleZh: string
    example: string
    exampleZh: string
  }
  metaphoricalTransfer: {
    ruleZh: string
    collocations: { en: string; zh: string }[]
  }
  contrastTrap?: {
    rivalWord: string
    coreDistinction: string
    contrastSentenceEn: string
    contrastSentenceZh: string
  }
}

export const PREPOSITIONS_DATA: PrepositionItem[] = [
  {
    id: 'prep_at',
    word: 'at',
    phonetic: '/æt/',
    dimension: '0D_point',
    dimensionLabelZh: '0D 空间无维孤立点',
    geometricModel: '一个在地图或坐标系中完全收缩为零的精确定位点（Point coordinate）。',
    visualIcon: 'Dot',
    accentColor: 'text-rose-400',
    spatialEssence:
      '将目标视为空间中“不计算长宽高的点状坐标”。无论建筑实际有多大，只要将其视作旅程中的站点、门牌、目标靶心，就用 at（如 at the airport, at the door, at the traffic light）。',
    spaceToTimeTransfer: {
      ruleZh: '映射到时间轴上：代表毫无长度的“时间刀刻点”（瞬间刻度）。',
      example: 'at 5:30 PM / at dawn / at midnight',
      exampleZh: '在下午5:30 / 在黎明破晓瞬间 / 在午夜零点',
    },
    metaphoricalTransfer: {
      ruleZh: '隐喻扩展：目标锁定与专注峰值。射击、注视、速度或价格的精确极值。',
      collocations: [
        { en: 'aim at excellence', zh: '瞄准卓越(目标聚焦)' },
        { en: 'at full speed', zh: '全速运转(速率刻度)' },
        { en: 'at all costs', zh: '不惜一切代价(代价极值)' },
        { en: 'at ease', zh: '安然自在(处于特定心理状态点)' },
      ],
    },
    contrastTrap: {
      rivalWord: 'in',
      coreDistinction: 'at 侧重“地点坐标/功能站点”（去机场坐飞机用 at the airport）；in 侧重“三维建筑物内部封闭空间”（在航站楼大厅里面躲雨用 in the airport）。',
      contrastSentenceEn: 'I met him at the station, while waiting in the lobby.',
      contrastSentenceZh: '我在车站（坐标点）接他，期间一直坐在大厅（室内空间）里面等候。',
    },
  },
  {
    id: 'prep_on',
    word: 'on',
    phonetic: '/ɒn/',
    dimension: '1D_2D_surface',
    dimensionLabelZh: '1D/2D 接触支撑面',
    geometricModel: '附着于线段（沿线）或紧贴二维表面，具备“物理支撑（Support）与接触（Contact）”。',
    visualIcon: 'Square',
    accentColor: 'text-amber-400',
    spatialEssence:
      '必须发生“表面接触并获得承载支撑”。放在桌面上是 on the desk；挂在墙壁表面是 on the wall；站在天花板表面也是 on the ceiling。亦可沿线延伸：on the street, on the border。',
    spaceToTimeTransfer: {
      ruleZh: '映射到时间日历：代表日历表上一个个具体的“二维日历方格”（具体的某一天）。',
      example: 'on Monday / on July 4th / on a rainy morning',
      exampleZh: '在周一 / 在7月4日当天 / 在一个细雨绵绵的清晨',
    },
    metaphoricalTransfer: {
      ruleZh: '隐喻扩展：基于承载与依托。依赖某种基础、根据某种准则、或处于运行平台上。',
      collocations: [
        { en: 'depend on facts', zh: '依赖事实依据(依托支撑)' },
        { en: 'on schedule', zh: '按预定时间表(踩在时间线上)' },
        { en: 'on purpose', zh: '故意地/蓄意(基于特定目的)' },
        { en: 'on strike', zh: '处于罢工状态(处于特定平台状态)' },
      ],
    },
    contrastTrap: {
      rivalWord: 'in',
      coreDistinction: '交通工具：能站立走动、有宽敞承载甲板的公共交通用 on（on the train / bus / plane / ship）；狭窄蜷缩只能坐进内部的私家车/出租车用 in（in a car / taxi）。',
      contrastSentenceEn: 'She was working on the train while he drove in his car.',
      contrastSentenceZh: '她在高铁上（大型载客甲板）办公，而他正坐在自己的私家车里（封闭狭小轿厢）驾驶。',
    },
  },
  {
    id: 'prep_in',
    word: 'in',
    phonetic: '/ɪn/',
    dimension: '3D_container',
    dimensionLabelZh: '3D 三维包围容器',
    geometricModel: '具有周界包围、内部纵深与边界容积的三维封闭容器（Enclosure & Container）。',
    visualIcon: 'Box',
    accentColor: 'text-emerald-400',
    spatialEssence:
      '核心是“容纳与包围感”。被四壁包围是在房间内（in the room）；被城市行政边界包围是在城市中（in London）；被森林树木包围是在林中（in the woods）。',
    spaceToTimeTransfer: {
      ruleZh: '映射到时间长河：代表一个具备容量和长度的“时间容器区间”（在周、月、季节、世纪内）。',
      example: 'in July / in winter / in 2026 / in the 21st century',
      exampleZh: '在七月 / 在冬季 / 在2026年这一整年内 / 在21世纪',
    },
    metaphoricalTransfer: {
      ruleZh: '隐喻扩展：人被某种情绪、困境、社会关系或行业环境像容器一样全方位包裹淹没。',
      collocations: [
        { en: 'in love', zh: '陷入爱河(全身心被爱意包裹)' },
        { en: 'in trouble / in debt', zh: '深陷困境/负债(被牢笼围困)' },
        { en: 'in high spirits', zh: '兴高采烈(处于昂扬情绪场中)' },
        { en: 'in summary', zh: '总而言之(将万语囊括进一个概括中)' },
      ],
    },
    contrastTrap: {
      rivalWord: 'on time vs in time',
      coreDistinction: 'on time 强调“不早不晚、严丝合缝压中预定时间刻度线”；in time 强调“在截止时限的容器余量内、赶上了、来得及”。',
      contrastSentenceEn: 'The train departed on time, and we arrived just in time to catch it.',
      contrastSentenceZh: '列车分秒不差地准时发车（on time），我们正好赶在发车前的有限时间内跑进了站台（in time）。',
    },
  },
  {
    id: 'prep_through_across',
    word: 'through vs across',
    phonetic: '/θruː/ vs /əˈkrɒs/',
    dimension: 'vector_movement',
    dimensionLabelZh: '空间穿越轨迹 (3D 体穿 vs 2D 面跨)',
    geometricModel: 'through 为由内而外穿透 3D 实体内部；across 为在 2D 表面从一侧横跨到对侧。',
    visualIcon: 'Maximize2',
    accentColor: 'text-sky-400',
    spatialEssence:
      'through 强调四周都有物质包围阻隔，身处其中破障而过（如穿过隧道 through the tunnel, 穿过森林 through the forest, 穿过暴风雨 through the storm）。across 强调在一个开阔的平面上，从这一边横渡至对岸（如过马路 across the street, 游过河流 across the river）。',
    spaceToTimeTransfer: {
      ruleZh: 'through 表示历经漫长岁月的艰辛考验；across 极少直接作时间介词。',
      example: 'through the hard times / throughout the night',
      exampleZh: '历经艰难岁月 / 彻夜不眠贯穿整夜',
    },
    metaphoricalTransfer: {
      ruleZh: 'through 隐喻“通过媒介、途径或忍受磨难蜕变”；across 隐喻“横跨分歧、跨领域合作”。',
      collocations: [
        { en: 'learn through trial and error', zh: '通过试错学习(穿越困惑)' },
        { en: 'get across the idea', zh: '把思想传达给对方(横跨理解鸿沟)' },
        { en: 'breakthrough', zh: '重大突破(破体而出)' },
      ],
    },
  },
  {
    id: 'prep_over_above',
    word: 'over vs above',
    phonetic: '/ˈəʊvə/ vs /əˈbʌv/',
    dimension: 'vector_movement',
    dimensionLabelZh: '垂直高空层级 (正上方覆盖 vs 相对标尺高位)',
    geometricModel: 'over 为正上方笼罩或弧线翻越；above 仅为基准面以上的相对高度标尺。',
    visualIcon: 'ArrowUpCircle',
    accentColor: 'text-purple-400',
    spatialEssence:
      'above 强调“高度基准线高于某物”，二者不需要处于正垂直对齐位置，也不带有接触或覆盖感（temperature above zero, fly above the clouds）。over 强调“正上方正投影”或“跨越式弧线运动”，甚至含有全覆盖遮蔽之意（a blanket over the bed, fly over the city）。',
    spaceToTimeTransfer: {
      ruleZh: 'over 表示跨越一段连续时间（over the weekend, over the past decade）。',
      example: 'over three decades / above average',
      exampleZh: '历经三十余载 / 高于平均线',
    },
    metaphoricalTransfer: {
      ruleZh: 'over 表压倒、超越支配（power over someone）；above 表品行超脱不受污染（above suspicion 无可置疑）。',
      collocations: [
        { en: 'triumph over adversity', zh: '战胜逆境(压倒踩过)' },
        { en: 'above all', zh: '最重要的是/首要者(在所有考量之上)' },
        { en: 'get over the sorrow', zh: '翻越悲伤/走出阴霾' },
      ],
    },
  },
  {
    id: 'prep_between_among',
    word: 'between vs among',
    phonetic: '/bɪˈtwiːn/ vs /əˈmʌŋ/',
    dimension: '1D_2D_surface',
    dimensionLabelZh: '群体间隙定位 (明确两两对偶 vs 朦胧群体簇集)',
    geometricModel: 'between 强调独立个体之间的明确缝隙；among 强调融入群体丛林之内部。',
    visualIcon: 'Users',
    accentColor: 'text-teal-400',
    spatialEssence:
      '传统规则常讲 between 两个、among 三个以上，但认知语言学的精髓在于“独立个体界线”：即使是三个国家签署条约，若强调彼此两两之间的清晰边界，依然用 between the three countries！而 among 强调融于无差别的集群丛林之中（a house among the trees, lost among the crowd）。',
    spaceToTimeTransfer: {
      ruleZh: 'between 用于两点明确时间之间；among 不用于纯时间点。',
      example: 'between 2 PM and 4 PM',
      exampleZh: '在下午两点至四点之间',
    },
    metaphoricalTransfer: {
      ruleZh: 'between 用于两方权衡选择或私密分享；among 用于在群体中被共同推崇或分担。',
      collocations: [
        { en: 'choose between truth and comfort', zh: '在真相与安逸之间抉择' },
        { en: 'keep it between us', zh: '这是你我二人的私密' },
        { en: 'popular among youngsters', zh: '在年轻人群体中广受欢迎' },
      ],
    },
  },
]
