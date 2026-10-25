export type RadioScenario =
  | '日常生活'
  | '职场商务'
  | '旅游出行'
  | '餐饮美食'
  | '购物消费'
  | string

export type RadioMediaType = 'video' | 'audio'

export type PlayMode = 'list-loop' | 'single-loop' | 'sequential' | 'shuffle'

export interface RadioItem {
  id: string
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
    id: 'sample-video-1',
    title: 'Nature Blossom & Spring Light · 春日自然绽放 (测试视频)',
    type: 'video',
    src: '/samples/test-video.mp4',
    duration: 15,
    scenario: '日常生活',
    description: '高清视频视听测试样本，支持全屏大幕、画面暂停/播放与音画联动。',
    transcript:
      'Look at how the delicate flowers bloom under the gentle sunlight.\nNature always brings a sense of calm and clarity to our daily life.',
    translation:
      '看那娇嫩的花朵在温柔的阳光下静静绽放。\n大自然总能给我们的日常生活带来一份宁静与澄澈。',
    createdAt: Date.now() - 1000 * 60 * 10,
    playCount: 48,
  },
  {
    id: 'sample-audio-1',
    title: 'Acoustic Harmony & Focus Flow · 高保真沉浸律动 (测试音频)',
    type: 'audio',
    src: '/samples/test-audio.mp3',
    duration: 348,
    scenario: '日常生活',
    description: '高保真立体声纯音频测试样本，黑胶唱盘旋转与动态声波频谱律动，支持自由拖动寻道。',
    transcript:
      'Welcome to the English audio radio station.\nTaking a deep breath and immersing yourself in a genuine English atmosphere is the best way to develop an intuitive feel for the language.',
    translation:
      '欢迎来到英语听力电台。\n在清晨深吸一口气，让自己完全沉浸在纯正的英语语境中，是培养语感最自然的方式。',
    createdAt: Date.now() - 1000 * 60 * 20,
    playCount: 56,
  },
  {
    id: 'sample-1',
    title: 'Starbucks Coffee Ordering · 星巴克地道点单日常',
    type: 'audio',
    src: 'https://dict.youdao.com/dictvoice?audio=Could+I+get+a+medium+iced+caramel+macchiato+with+oat+milk+and+less+ice%2C+please%3F+For+here+or+to+go%3F&type=2',
    duration: 65,
    scenario: '日常生活',
    description: '咖啡店真实日常交谈，涵盖冷热中大杯、奶类定制与堂食打包表达。',
    transcript:
      'Barista: Hi there, welcome to Starbucks! What can I get started for you today?\nCustomer: Hi! Could I get a medium iced caramel macchiato with oat milk and less ice, please?\nBarista: Sure thing! Would you like any extra espresso shots or whipped cream on top?\nCustomer: No thanks, just like that. How much will that be?\nBarista: That comes to $5.45. For here or to go?\nCustomer: To go, please. Keep the change!',
    translation:
      '咖啡师：你好，欢迎光临星巴克！今天想喝点什么？\n顾客：嗨！能给我来一杯中杯焦糖玛奇朵吗？加燕麦奶，少冰。\n咖啡师：没问题！上面需要加浓缩浓缩浓缩或者鲜奶油吗？\n顾客：不用了，就这样。一共多少钱？\n咖啡师：一共 5.45 美元。在这喝还是打包？\n顾客：打包带走，不用找零啦！',
    createdAt: Date.now() - 86400000 * 2,
    playCount: 18,
  },
  {
    id: 'sample-2',
    title: 'Tech Daily Standup Meeting · 硅谷远程站会汇报',
    type: 'audio',
    src: 'https://dict.youdao.com/dictvoice?audio=Yesterday+I+wrapped+up+the+authentication+refactoring.+Today+I+will+be+focusing+on+the+database+migration.+No+blockers+on+my+end.&type=2',
    duration: 88,
    scenario: '职场商务',
    description: '科技团队每日 15 分钟站会标准范式，汇报昨日已成、今日计划与是否有阻碍 (Blockers)。',
    transcript:
      'Scrum Master: Alright team, let’s kick off our daily standup. Alex, want to go first?\nAlex: Sure. Yesterday I wrapped up the authentication refactoring and pushed the PR. Today I’ll be tackling the database migration script. No major blockers on my end, but I might need a quick code review from Sarah later.\nScrum Master: Sounds great! Sarah, how does that align with your schedule?',
    translation:
      '敏捷主管：好的团队，开始今天的每日站会。Alex，你先来？\nAlex：好。昨天我完成了认证模块重构并提交了 PR。今天我将全力处理数据库迁移脚本。我目前没有任何阻碍，但晚点可能需要 Sarah 帮我快速走一下代码审查。\n敏捷主管：听起来很棒！Sarah，这和你今天的日程对得上吗？',
    createdAt: Date.now() - 86400000 * 3,
    playCount: 24,
  },
  {
    id: 'sample-3',
    title: 'Airport Check-in & Security Check · 国际机场值机与安检',
    type: 'audio',
    src: 'https://dict.youdao.com/dictvoice?audio=May+I+see+your+passport+and+boarding+pass%2C+please%3F+Do+you+have+any+luggage+to+check+in%3F&type=1',
    duration: 110,
    scenario: '旅游出行',
    description: '国际航班值机、托运行李重量确认、过道/靠窗选座及登机口引导全流程。',
    transcript:
      'Agent: Good morning! Where are you flying today?\nPassenger: Good morning, I’m flying to London Heathrow on flight BA168.\nAgent: May I see your passport and flight itinerary, please?\nPassenger: Here you go.\nAgent: Thank you. Are you checking any luggage today or just carry-on?\nPassenger: Just this one suitcase to check, and I have a small backpack with me.',
    translation:
      '地勤：早上好！您今天飞往哪里？\n乘客：早上好，我乘坐英国航空 BA168 飞往伦敦希思罗。\n地勤：可以看一下您的护照和行程单吗？\n乘客：给您。\n地勤：谢谢。您今天有托运行李还是只有随身行李？\n乘客：就托运这一个行李箱，另外随身背了一个小背包。',
    createdAt: Date.now() - 86400000 * 4,
    playCount: 31,
  },
  {
    id: 'sample-4',
    title: 'Restaurant Bill Splitting · 西餐厅结账与分账技巧',
    type: 'audio',
    src: 'https://dict.youdao.com/dictvoice?audio=Could+we+get+the+bill%2C+please%3F+Can+we+split+it+evenly+between+the+two+cards%3F&type=2',
    duration: 72,
    scenario: '餐饮美食',
    description: '地道西餐用餐完毕买单、询问是否含服务费、AA 制平摊刷卡等实战对话。',
    transcript:
      'Customer: Excuse me, whenever you have a moment, could we get the check, please?\nWaiter: Absolutely! Did you save room for any dessert or coffee?\nCustomer: We’re completely full, everything was delicious, thank you.\nWaiter: My pleasure. Here is the check whenever you’re ready.\nCustomer: Thank you! Could we split this down the middle on two cards?',
    translation:
      '顾客：打扰一下，您方便的时候能帮我们买单吗？\n服务员：当然！您有胃口来点甜点或咖啡吗？\n顾客：我们实在太饱啦，今晚每道菜都很棒，谢谢。\n服务员：我的荣幸。账单放在这，准备好叫我即可。\n顾客：谢谢！我们可以两张卡对半平摊刷卡吗？',
    createdAt: Date.now() - 86400000 * 5,
    playCount: 15,
  },
  {
    id: 'sample-5',
    title: 'Silicon Valley Founder Interview · 硅谷创业者访谈片段',
    type: 'audio',
    src: 'https://dict.youdao.com/dictvoice?audio=The+hardest+part+about+building+a+startup+isn+t+the+technology%2C+it+s+staying+focused+when+everything+seems+chaotic.&type=2',
    duration: 145,
    scenario: '职场商务',
    description: '深度访谈语流，探讨人工智能创业、敏捷迭代与心智模型，带有地道母语连音与短语表达。',
    transcript:
      'Host: What would you say was the biggest misconception you had when founding your first company?\nGuest: Honestly, I used to think the product was 90% of the game. But down the road, you realize distribution and staying power are what make or break you. If you can’t iterate at lightning speed while keeping team morale high, the market will simply pass you by.',
    translation:
      '主持人：在创立第一家公司时，你觉得最大的认知误区是什么？\n嘉宾：坦白讲，我过去以为产品胜决一切。但一路走来，你会发现获客分发能力和韧性耐力才是生死关键。如果你无法在保持团队高昂士气的同时光速迭代，市场很快就会把你甩在身后。',
    createdAt: Date.now() - 86400000 * 6,
    playCount: 42,
  },
  {
    id: 'sample-6',
    title: 'Shopping Returns & Exchange · 商场服装退换货实录',
    type: 'audio',
    src: 'https://dict.youdao.com/dictvoice?audio=I+bought+this+jacket+last+weekend%2C+but+it+turns+out+to+be+a+bit+too+tight+around+the+shoulders.+Can+I+exchange+it+for+a+larger+size%3F&type=2',
    duration: 80,
    scenario: '购物消费',
    description: '尺码不合、收据出示、退款至原支付方式或调换更大码数的日常商场交流。',
    transcript:
      'Clerk: Hi! How can I help you today?\nCustomer: Hi, I bought this jacket last weekend, but it turns out to be a bit too snug around the shoulders. I was hoping to exchange it for a large.\nClerk: Sure thing! Do you happen to have the original receipt and the price tag still attached?\nCustomer: Yes, right here in the bag.',
    translation:
      '店员：您好！今天有什么可以帮您的？\n顾客：您好，我上周末买了这件夹克，但肩膀这块稍微有点紧。我想换一件大号的。\n店员：没问题！请问您带着原始收据而且吊牌还挂在衣服上吗？\n顾客：有的，都在袋子里呢。',
    createdAt: Date.now() - 86400000 * 7,
    playCount: 19,
  },
]
