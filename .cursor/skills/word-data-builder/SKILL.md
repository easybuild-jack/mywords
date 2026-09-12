---
name: word-data-builder
description: >-
  为英语学习类 App 生产单词的完整 JSON 数据：美/英 IPA 音标、音节切分（syllables）、
  哑音字母下标（silentIndices）、中文释义（trans）、词根词缀（etymology）、
  双语例句（examples）、常见短语（phrases）。当用户要求完善单词数据、生成单词 JSON、
  制作词库数据、音节切分、标注哑音字母、拆解词根词缀或补全例句短语时使用。
---

# Word Data Builder（单词数据生产）

给定一个或一批英文单词，产出符合规范的完整 JSON 数据条目。

**开始制作前，必须先阅读同目录下的 [RULES.md](RULES.md) 获取完整规则**（音节切分算法、哑音判定、词根词缀拆解、例句/短语编写标准）。本文件只包含工作流、硬性约束与产出格式。

用户给的是导出的词表文件（xlsx / csv / docx 等）时，按下方「批量流程」先用 `scripts/extract-words.mjs` 抽词、最后用 `scripts/validate-words.mjs` 校验。

## 产出格式

单个单词输出一个 JSON 对象，多个单词输出 JSON 数组。字段顺序固定：

```json
{
  "name": "discover",
  "trans": ["v. 发现；发掘；查明"],
  "usphone": "dɪˈskʌvər",
  "ukphone": "dɪˈskʌvə(r)",
  "syllables": ["dis", "cov", "er"],
  "etymology": {
    "prefix": { "form": "dis-", "meaning": "否定/相反/去除" },
    "root": { "form": "cover", "meaning": "覆盖/遮盖" },
    "derivation": "去除覆盖的东西 → 揭开、发现、发掘",
    "origin": "源自古法语 descovrir，由 dis-（去除）+ covrir（遮盖）复合而成。",
    "memoryHook": "dis（去除）+ cover（覆盖、遮盖）→ 揭开覆盖物，也就是「发现、查明」。"
  },
  "silentIndices": [],
  "examples": [
    { "en": "We must discover the cause of the problem.", "cn": "我们必须查明问题的原因。" },
    { "en": "Scientists hope to discover a cure for cancer.", "cn": "科学家们希望发现治愈癌症的方法。" },
    { "en": "Columbus discovered America in 1492.", "cn": "哥伦布于1492年发现了美洲大陆。" }
  ],
  "phrases": [
    { "en": "discover the truth", "cn": "查明真相" },
    { "en": "discover by chance", "cn": "偶然发现" },
    { "en": "discover new talents", "cn": "发掘新人" },
    { "en": "discover a secret", "cn": "发现秘密" }
  ]
}
```

| 字段 | 必填 | 要点 |
|---|---|---|
| `name` | ✅ | 拼写，保留正确大小写 |
| `trans` | ✅ | 每个词性一条字符串，`词性. 释义；释义` 格式 |
| `usphone` / `ukphone` | ✅ | 标准 IPA，**不带 `/` 包裹**，含重音符号 |
| `syllables` | ✅ | 拼接必须还原原词；音节数 = 音标元音音位数 |
| `etymology` | 推荐 | 拆不出可靠词根词缀就省略，**不编造** |
| `silentIndices` | 按需 | 哑音字母 0-based 下标，升序；无哑音省略 |
| `examples` | ✅ | 生成例句时覆盖单词的所有含义（不同类型/不同意思均给出示例；若仅一个意思至少给 2 个例句）；5–10 词简单句 |
| `phrases` | 推荐 | 短语至少 4 个，最多 10 个；尽量全面，包含最常用的短语组合；没有就省略，**不编造** |

## 工作流（按序执行）

```
1. usphone/ukphone  查证美/英 IPA 并按规则规范化（多音词取 trans 首条词性的读音）
2. trans            词性前缀 + 中文释义，义项用 ； 分隔，按使用频率排 2–4 个
3. syllables        复合词先拆词界 → 一元一辅从后往前切 → r 控制 / al·ol 组合 /
                    哑 e / -le / -tion 等特殊规则 → 用音标元音数校验 → 特例表兜底
4. silentIndices    词尾哑 e、双辅音第一个字母、al 组合的 l、
                    经典哑音（kn-/wr-/-mb/-mn/listen 的 t 等）；
                    igh/eigh/ough 是元音字母组合，其中的 g、h 不是哑音
5. etymology        前缀/词根/后缀（连字符定角色：dis- 前缀、-ive 后缀、cover 词根），
                    写 derivation 推导链 + origin 词源 + memoryHook 助记
6. examples         覆盖单词的所有含义（不同类型的含义、不同意思的含义都要给出示例；若仅有一个意思，至少给两个例句）；
                    5–10 词简单句，体现核心义项，场景错开
7. phrases          短语至少 4 个，最多 10 个；尽量全面收录最常用的短语组合（动词短语/介词搭配/习语优先）
8. 终检             逐词跑下方自检清单
```

## 批量流程：从导出的词表文件到 JSON

用户从其他 App / 词典导出的单词表（xlsx、csv、tsv、txt、md、docx）先用 `scripts/` 下的脚本抽词和校验，中间的补全由本 skill 逐词完成。脚本只依赖 Node ≥ 18，不依赖任何项目。

```
1. 抽词   node scripts/extract-words.mjs 导出文件... --out words.json --batch 30
          [--exclude 已有词库.json]（跳过已有的词）  [--min-len 2]  [--plain]（只要单词列表）
          → words.json：[{ "name": "abandon", "hint": "əˈbændən | v. 放弃" }, ...]
          → words.batch-01.json …（每批 30 词，按原文件顺序）
          xls / pdf 不支持：先另存为 xlsx / csv / txt
2. 补全   逐批读取 batch 文件，对每个 name 走上面的完整工作流，输出到 out/batch-01.json …
          hint 是原 App 里的音标/释义，只当线索，音标与释义仍要按 RULES.md 查证、规范化，
          不能原样照抄（原 App 常带 / 包裹、老式符号、缺词性前缀）
3. 校验   node scripts/validate-words.mjs out/*.json [--fix]
          ✗ 错误 = 废数据，改完重跑直到 0 错误；! 警告逐条人工确认
          --fix 只做无损整理：按规范重排字段顺序、silentIndices 升序去重、删空数组
4. 合并   校验通过后按需合并成一个数组文件；再跑一次 validate 确认没有重复词
```

校验器覆盖的硬性约束：`syllables.join('') === name`、音节数 = 美音元音音位数、双写辅音的哑音与切分位置、
igh/eigh/ough 里 g/h 不能标哑音、silentIndices 越界/顺序、trans 词性前缀、音标不带 `/` 与老式符号、
etymology 的 prefix/suffix 与拼写字面对齐、examples 覆盖全部含义且至少 2 条、phrases 4–10 条（尽量全面收录常用短语组合）、字段顺序、重复词。

## 硬性约束（违反任何一条即为废数据）

1. `syllables` 逐段拼接 `join('')` 必须**严格等于** `name`（大小写一致）；
2. 音节数必须等于**美音**音标中的元音音位数（双元音/长元音算 1 个；ir/yr/our 拼写的三合元音 aɪə(r)/aʊə(r) 算 1 个：fire、de-sire、hour 各 1 段，de-si-ra-ble 4 段；成音节辅音 -le/-n 额外 +1）；
3. 复合词必须先在子词边界切开（head-ache，不是 hea-dache）；拼写完整的独立单词 + 屈折后缀 -ing / 发音的 -ed / 发音的 -es 同样先在词根边界切开（lock-ing、test-ing、want-ed、match-es；丢 e 的 u-sing、ma-king 不算）；
4. r 控制组合（ar/er/ir/or/ur + 辅音）和 al/ol 组合（walk/talk/also/old）不能被切开，归前一个音节；元音 + r + 元音时 r 是普通单辅音，一律归后（o-range、cha-rac-ter、va-ri-a-ble），不设重读特例；
5. 双写辅音按 VC-CV 拆开（yel-low，不能整体归后），且**第一个字母记为哑音**，词尾/单音节的双写同样标（yellow → [2]，loss → [2]，small → [3]）；cc + e/i/y 读 /ks/ 两个音（suc-cess、ac-cept），不算哑音；
6. `silentIndices` 下标必须逐字符数过（0-based），多个哑音升序排列；
7. `etymology` 的 prefix.form 去掉连字符后必须是字面词首，suffix.form 必须是字面词尾；
8. 音标不带 `/` 斜杠、不并列多个变体、不混英文注释；老式符号 əu/ɛ/ɚ 须规范化为 əʊ/e/ər；
9. 拆不出可靠词根词缀、找不到高频固定搭配时，省略对应字段，禁止编造。

## 自检清单（每个单词逐条核对后才输出）

```
- [ ] syllables.join('') === name
- [ ] 音节数 == usphone 元音音位数（双元音算 1；成音节辅音 +1）
- [ ] 每个音节段至少含一个元音字母（缩写词豁免）
- [ ] silentIndices 每个下标对应的字母确实不发音，未越界
- [ ] trans 每条都带词性前缀，义项用 ； 分隔
- [ ] etymology 的 form 与拼写字面对齐（词首/词尾）
- [ ] examples 覆盖单词的所有含义（不同类型的含义、不同意思的含义都要给出示例；若仅一个意思至少给 2 个例句），中英对应准确；每条 5–10 词简单句
- [ ] phrases 短语至少 4 个、最多 10 个，尽量全面收录常用的短语组合（若有）
```

## 完整示例

**walk**（al+k 组合、l 哑音）：

```json
{
  "name": "walk",
  "trans": ["v. 走；步行；散步", "n. 步行；散步"],
  "usphone": "wɔːk",
  "ukphone": "wɔːk",
  "syllables": ["walk"],
  "silentIndices": [2],
  "examples": [
    { "en": "I walk to school every day.", "cn": "我每天走路上学。" },
    { "en": "Let's take a walk after dinner.", "cn": "晚饭后我们去散散步吧。" }
  ],
  "phrases": [
    { "en": "take a walk", "cn": "散步" },
    { "en": "walk away", "cn": "走开；离开" },
    { "en": "walk into", "cn": "走进；遭遇" },
    { "en": "walk out", "cn": "走出；罢工" }
  ]
}
```

要点：/wɔːk/ 只有 1 个元音音位 → 整词 1 音节；`al` 是组合不可拆，l 不发音 → 下标 2；两条例句分别覆盖 v. 和 n.，第二条顺带用上短语 take a walk。

**yellow**（双写辅音 VC-CV + 第一个哑音）：

```json
{
  "name": "yellow",
  "trans": ["adj. 黄色的", "n. 黄色"],
  "usphone": "ˈjeloʊ",
  "ukphone": "ˈjeləʊ",
  "syllables": ["yel", "low"],
  "silentIndices": [2],
  "examples": [
    { "en": "Her new dress is yellow.", "cn": "她的新裙子是黄色的。" },
    { "en": "Bananas turn yellow when they are ripe.", "cn": "香蕉熟了就会变黄。" }
  ]
}
```

要点：ll 双写辅音 → yel-low（VC-CV），第 1 个 l（下标 2）哑音；基础颜色词无可靠词根词缀 → 省略 etymology，不编造。

**grandfather**（复合词 + 词根词缀）：

```json
{
  "name": "grandfather",
  "trans": ["n. 祖父；外祖父"],
  "usphone": "ˈɡrænfɑːðər",
  "ukphone": "ˈɡrænfɑːðə(r)",
  "syllables": ["grand", "fa", "ther"],
  "silentIndices": [4],
  "etymology": {
    "prefix": { "form": "grand-", "meaning": "大" },
    "root": { "form": "father", "meaning": "父亲" },
    "derivation": "大父亲 → 祖父"
  },
  "examples": [
    { "en": "My grandfather is eighty years old.", "cn": "我爷爷八十岁了。" },
    { "en": "Her grandfather likes to tell stories.", "cn": "她爷爷喜欢讲故事。" }
  ]
}
```

要点：复合词先拆 grand + father 再递归切分；/ˈɡrænfɑːðər/ 中 d 不发音 → 下标 4。

## 交付要求

- 输出**纯 JSON**（单词条目或数组），不夹带解释性文字；用户要求说明时另附；
- 批量任务逐词走完整工作流，禁止偷懒复用切分模式；数量大时可分批交付，每批交付前先过 `validate-words.mjs`；
- 对音标没有把握的生僻词，明确标注「音标待人工核对」而不是猜测。
