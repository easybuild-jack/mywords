export type RadioCategory = 'phrases' | 'dialogue' | 'radio'

export const RADIO_CATEGORY_LABELS: Record<RadioCategory, string> = {
  phrases: '常用短语',
  dialogue: '场景对话',
  radio: '英语电台',
}

export type RadioScenario =
  | '日常生活'
  | '职场商务'
  | '旅游出行'
  | '餐饮美食'
  | '购物消费'
  | string

export const DEFAULT_RADIO_SCENARIOS: RadioScenario[] = [
  '日常生活',
  '职场商务',
  '旅游出行',
  '餐饮美食',
  '购物消费',
]

export type RadioMediaType = 'video' | 'audio'

export type PlayMode = 'list-loop' | 'single-loop' | 'sequential' | 'shuffle'

export interface RadioItem {
  id: string
  category: RadioCategory
  title: string
  type: RadioMediaType
  src: string
  poster?: string
  duration: number // 秒数
  scenario: RadioScenario
  description?: string
  transcript?: string
  translation?: string
  createdAt: number
  playCount: number
}

export const SCENARIO_ICONS: Record<string, string> = {
  全部: '✨',
  日常生活: '☕',
  职场商务: '💼',
  旅游出行: '✈️',
  餐饮美食: '🍽️',
  购物消费: '🛍️',
}

export const DEFAULT_SAMPLE_RADIO_ITEMS: RadioItem[] = [
  {
    id: 'sample-phrases-1',
    category: 'phrases',
    title: 'Everyday Essential Phrases · 高频常用短语 (示例视频)',
    type: 'video',
    src: '/samples/test-video.mp4',
    duration: 15,
    scenario: '日常生活',
    description: '常用短语视频示例，可点击右上角「上传视频」添加自定义短语视频。',
    createdAt: Date.now() - 1000 * 60 * 10,
    playCount: 12,
  },
  {
    id: 'sample-dialogue-1',
    category: 'dialogue',
    title: 'Nature Blossom & Daily Conversation · 日常场景实景对话 (示例视频)',
    type: 'video',
    src: '/samples/test-video.mp4',
    duration: 15,
    scenario: '日常生活',
    description: '场景对话视频示例，支持按场景分类筛选与自定义上传。',
    createdAt: Date.now() - 1000 * 60 * 20,
    playCount: 28,
  },
  {
    id: 'sample-radio-1',
    category: 'radio',
    title: 'Morning English Broadcast · 晨间英语电台视听 (示例视频)',
    type: 'video',
    src: '/samples/test-video.mp4',
    duration: 15,
    scenario: '日常生活',
    description: '英语电台视频示例，可点击右上角「上传视频」添加自定义电台视频。',
    createdAt: Date.now() - 1000 * 60 * 30,
    playCount: 36,
  },
]
