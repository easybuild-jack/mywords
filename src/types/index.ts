// ==========================================
// 1. 单词与词根结构化模型
// ==========================================

export interface WordExample {
  en: string;                                   // 英文例句 (如 "Fresh cabbage is rich in vitamin C.")
  cn: string;                                   // 中文翻译 (如 "新鲜的卷心菜富含维生素C。")
}

export interface WordEtymology {
  prefix?: { form: string; meaning: string };   // 前缀 (如 { form: "dis-", meaning: "否定/相反" })
  root?: { form: string; meaning: string };     // 词根 (如 { form: "cover", meaning: "遮盖" })
  suffix?: { form: string; meaning: string };   // 后缀 (如 { form: "-y", meaning: "名词/形容词后缀" })
  derivation?: string;                          // 语义推导 (如 "揭开覆盖 = 发现")
  origin?: string;                              // 词源溯源 (如 "源自古法语 caboche (头)")
  memoryHook?: string;                          // 联想助记口诀
}

export interface WordItem {
  id: string;                                   // 唯一ID
  name: string;                                 // 拼写 (如 "discover")
  syllables: string[];                          // 音节切分 (如 ["dis", "cov", "er"])
  phoneticUk?: string;                          // 英音 (如 "/dɪˈskʌvə(r)/")
  phoneticUs?: string;                          // 美音 (如 "/dɪˈskʌvər/")
  posList: {                                    // 词性与释义
    pos: 'n.' | 'v.' | 'adj.' | 'adv.' | 'prep.' | 'conj.' | 'other';
    means: string[];                            // 如 ["发现", "发掘"]
  }[];
  etymology?: WordEtymology;                    // 前缀/词根/后缀结构化拆解
  examples?: WordExample[];                     // 3条左右经典例句
  phrases?: { en: string; cn: string }[];       // (二期预留) 常用短语搭配
}

export interface RootWordItem {
  name: string;                                 // 派生单词拼写 (如 "inspect")
  phonetic?: string;                            // 音标 (如 "/ɪnˈspekt/")
  breakdown: string;                            // 词缀拆解公式 (如 "in- (向内) + spect (看)")
  meaning: string;                              // 中文释义 (如 "v. 检查；视察；审阅")
  example?: { en: string; cn: string };         // 语境示例
}

export interface RootItem {
  id: string;                                   // 唯一ID (如 "root_spect")
  form: string;                                 // 词根形态 (如 "spect / spic")
  phonetic?: string;                            // 词根读音/音标 (如 "/spekt/")
  meaning: string;                              // 核心释义 (如 "看 / 观察 / 视角")
  category: 'latin' | 'greek' | 'core';         // 词根源流类别
  categoryLabel: string;                        // 分类标签 (如 "拉丁核心词根")
  origin: string;                               // 词源追溯与演变故事
  derivationNote?: string;                      // 构词衍生要领
  words: RootWordItem[];                        // 派生核心词族列表
}

// ==========================================
// 2. 词库与单元模型
// ==========================================

export interface VocabularyBook {
  id: string;
  name: string;                                 // 词库名 (如 "CET-4 核心词库")
  description: string;                          // 词库描述
  category: 'exam' | 'developer' | 'custom' | 'daily';
  isCustom: boolean;                            // 是否为用户自定义创建
  unitSize: number;                             // 每单元词数 (默认 20)
  totalWords: number;                           // 总单词量
  words: WordItem[];                            // 单词列表
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// 3. 用户做题掌握度与持久化模型 (IndexedDB)
// ==========================================

export type PracticeMode = 'learn' | 'dictation';

/**
 * 默写页的线索来源：
 * - listen  听音模式：只给发音，不显示中文释义，需要写出释义与拼写
 * - meaning 看译文模式：只给中文释义，不自动发音（可手动触发），需要写出拼写
 */
export type DictationCueMode = 'listen' | 'meaning';

export interface WordMasteryRecord {
  wordId: string;
  bookId: string;
  wordName?: string;
  wordItem?: WordItem;                          // 完整单词结构体 (便于错词本离线与跨书直接渲染)
  isMastered: boolean;                          // 是否已彻底掌握
  isStarred: boolean;                           // 是否在生词本
  isError: boolean;                             // 是否在错词本中 (活跃状态)
  totalPracticeCount: number;                   // 累计练习次数
  dictationErrorCount: number;                  // 默写错误次数
  consecutiveCorrectCount: number;              // 连续正确次数 (满2次移出错词本)
  lastPracticedAt: number;                      // 最后练习时间戳
}

export interface UnitProgressRecord {
  bookId: string;
  unitIndex: number;
  isFinished: boolean;                          // 单元是否已 100% 通关
  completedWordIds: string[];                   // 已掌握单词 ID
  activeRetryWordIds: string[];                 // 本单元当前仍待重考的错词 ID 队列
}

// ==========================================
// 4. 用户偏好与设置模型 (Zustand 持久化)
// ==========================================

export interface KeySoundOption {
  id: string;
  name: string;
  filename: string;
  switchType: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  phoneticPreference: 'us' | 'uk';              // 默认优先展示英音还是美音
  autoPlayAudio: boolean;                       // 切词时是否自动播放发音
  audioRate: number;                            // 播放倍速 (0.75, 1.0, 1.25)
  keySoundPack: string;                         // 轴体名称 (如 'Cherry MX Blues', 'Holy Pandas')
  keySoundVolume: number;                       // 按键音量 (0.0 ~ 1.0)
  isKeySoundEnabled: boolean;                   // 按键音开关
  isWrongBeepEnabled: boolean;                  // 错误蜂鸣音开关
  isCorrectSoundEnabled: boolean;               // 完成提示音开关
  feedbackVolume: number;                       // 提示音量
  defaultUnitSize: number;                      // 默认单元容量
}

export interface ShortcutConfig {
  peekHint: string;            // 偷看提示 (默认 Tab)
  replayAudio: string;         // 发音朗读 (默认 Ctrl+J)
  prevWord: string;            // 上一个词 (默认 ArrowLeft)
  nextWord: string;            // 下一个词 (默认 ArrowRight)
  restartUnit: string;         // 重做本单元 (默认 Ctrl+R)
}

