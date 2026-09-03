# 📖 MyWords 单词数据设定规则 (Word Data Specification)

> 版本：v1.2 ｜ 用途：**给定一个单词，按本规则产出一条完整、正确的单词 JSON 数据**。
> 本文档是数据生产规范（可直接用于生成 skill / 批量制作词库数据），不涉及前端展示逻辑。
> 关联：`src/types/index.ts`（类型定义）、`design/SYLLABLE_RULES.md`（音节切分规范全文）。

---

## 1. 一个单词最完整的 JSON 数据结构

### 1.1 目标产物（以 `discover` 为例）

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
    "memoryHook": "dis（去除）+ cover（覆盖、遮盖）→ 揭开覆盖物，也就是\"发现、查明\"。"
  },
  "silentIndices": [],
  "examples": [
    {
      "en": "Scientists continue to discover new species in deep ocean trenches.",
      "cn": "科学家们不断在深海海沟中发现未知的新物种。"
    },
    {
      "en": "She discovered a natural talent for coding during her college years.",
      "cn": "她在大学期间发现了自己在编程方面的天然天赋。"
    }
  ],
  "phrases": [
    { "en": "discover the truth", "cn": "查明真相" },
    { "en": "discover by accident", "cn": "偶然发现" }
  ]
}
```

### 1.2 字段总表

| 字段 | 类型 | 必填 | 数据规则 |
|---|---|---|---|
| `name` | `string` | ✅ | 单词拼写，保留原始大小写（专有名词首字母大写） |
| `trans` | `string[]` | ✅ | 中文释义，带词性前缀（见 §4） |
| `usphone` | `string` | ✅ | 美音 IPA，不带 `/` 包裹（见 §2） |
| `ukphone` | `string` | ✅ | 英音 IPA，不带 `/` 包裹（见 §2） |
| `syllables` | `string[]` | ✅ | 音节切分，各段拼接必须还原原词（见 §3） |
| `etymology` | `object` | 推荐 | 词根词缀结构化拆解（见 §5），基础独体词可省略 |
| `silentIndices` | `number[]` | 按需 | 不发音字母的 0-based 下标（见 §3.6），无哑音则省略 |
| `examples` | `{en, cn}[]` | ✅ | **每词 2 条**双语例句（见 §6） |
| `phrases` | `{en, cn}[]` | 推荐 | **每词 2–3 条**常见短语/搭配（见 §7），无固定搭配的词可省略 |

> 说明：运行时类型 `WordItem`（`src/types/index.ts`）中的 `phoneticUs/phoneticUk/posList` 等字段由上述词库字段自动映射生成（音标补 `/.../` 包裹、`trans` 解析为结构化 `posList`），数据制作层只需按本表填写词库字段。

---

## 2. 音标数据规则（美 / 英）

1. **两个字段都要填**：`usphone`（美音）、`ukphone`（英音），使用标准 IPA 符号；
2. **不带斜杠**：词库中写 `dɪˈskʌvər`，不写 `/dɪˈskʌvər/`（加载时会统一补包裹）；
3. **重音符号**：主重音 `ˈ`、次重音 `ˌ` 写在重读音节之前；
4. **美英确实相同**时两个字段填同一值；英音的连读 r 可写作 `(r)`，如 `dɪˈskʌvə(r)`；
5. **多音词（词性变音）**：record、present、object 等因词性不同而重音/读音不同的词，**只填一个读音，以 `trans` 第一条词性对应的读音为准**（如 record 的 trans 首条是 `n. 记录` 则填 /ˈrekɔːd/），不要并列多个音标；
6. **符号规范化**（禁止使用老式/非标准写法）：
   - 多个发音变体只保留第一个（不要用 `；` 或 `|` 并列多个音标）；
   - 不混入英文注释（如 `for v.` / `for n.`）；
   - 老式 `əu / ou / au` → 统一为 `əʊ / oʊ / aʊ`；
   - 非标准字符 `ɛ / ɚ / ɝ` → 统一为 `e / ər / ɜːr`；
7. **音标是音节切分的硬约束来源**：音标中的元音音位数量 = 音节数（见 §3.1），因此音标必须先于 `syllables` 确定，且两者必须互相印证。

---

## 3. 音节切分规则（重点 ⭐）

> 完整规范见 **`design/SYLLABLE_RULES.md`**，本节为数据制作时必须遵守的核心规则。

### 3.1 总则：一个元音音位 = 一个音节

音节是**发音**的单位，不是字母的单位。切分必须以**音标中的元音音位数量**为准，而不是数元音字母：

- 双元音（/eɪ/、/aɪ/ 等）算 **1 个**元音；长元音（/iː/、/uː/ 等）算 **1 个**；
- 词尾哑 e、不发音字母**不产生音节**；
- 成音节辅音（词尾 -le 等）**额外算 1 个音节**。

**判定优先级**：① 音标元音数（硬约束 `音节数 == 音标元音数`）→ ② 字母层切分规则 → ③ 拼接/元音/音标三重回验（§3.7）。

### 3.2 复合词黄金规则（最高优先级 ⚠️）

**"Divide between compound words"——复合词必须先在子词边界切开，再对子词递归切分**，严禁用普通辅音规则跨词界切分：

| 复合词 | 正确切分 | 错误切分 | 说明 |
|---|---|---|---|
| headache | **head-ache** | hea-dache | 保护 head + ache 词界 |
| grandfather | **grand-fa-ther** | gran-dfa-ther | 先拆 grand + father 再递归 |
| sunflower | **sun-flow-er** | su-nflow-er | sun 词界 + flower 递归切分 |
| password | **pass-word** | pa-ssword | 保护 pass + word |
| Sunday | **sun-day** | su-nday | day 整体保留 |

判定方法：先检查单词是否由两个独立成词的部分拼合（常见词头：head、tooth、grand、sun、key、pass、play、water、black、butter、bed、class、some、every、with…；常见词尾：ache、father、mother、cake、flower、board、word、ground、room、side、time、one…），命中则先在词界切开，再对左右两半分别按 §3.3 递归切分。

### 3.3 一元一辅，从后往前切（核心算法）

**从单词末尾往前扫描：找到一个元音后，再找到一个辅音，就在该辅音前切开。** 每个音节从词尾方向拿「一个元音 + 一个辅音」，剩余辅音留归前一个音节。

以 `command` 为例：从后往前 → `d`、`n` 辅音跳过 → `a` 元音找到 → `m` 辅音找到，切！得到 `mand`；继续 → `m` 跳过 → `o` 元音 → 词首，得到 `com`。结果 **com-mand**。

相邻两元音核之间的辅音簇按以下优先级处理：

| 辅音簇类型 | 处理 | 例词 |
|---|---|---|
| 单辅音 | 归后（V-CV） | co-lour、o-range、ba-na-na |
| 簇首 r 控制（r 前元音、r 后辅音/词尾） | r 归前 | cur-ly、car-rot、thir-teen |
| 双字母一音（th/sh/ch/ph/wh/ck/ng/gh/qu） | 整簇归后（只发一个音，不能拆） | tea-cher、fa-ther |
| 可作词首的辅音簇（onset：br/gr/pr/st…） | 整簇归后 | li-bra-ry、a-pril |
| 双写辅音（ll/mm/tt/ss/pp/ff…） | 第一个归前、第二个归后（VC-CV） | yel-low、hap-py、cof-fee |
| 其他多辅音簇 | 第一个归前、其余归后（VC-CV） | sep-tem-ber、oc-to-ber |

> onset 表：`bl br cl cr dr dw fl fr gl gr pl pr sc sk sl sm sn sp st sw tr tw` + `scr shr spl spr squ str thr`。

元音核判定要点：

- 元音字母 `a e i o u`；**y** 在词首且后接元音时是辅音（yes），其余位置算元音（happy、day）；
- **qu** 中的 `u` 不独立成核（quick）；
- 连续元音字母合并为一个核（ou、ea、ow 等整体一个核）。

### 3.4 r 控制元音与 l 组合（发音整体，不可拆开）

**（1）r 控制元音**：ar / er / ir / or / ur 发音上是一个整体，`元音` 和 `r` 不能拆进两个音节：

| 位置 | 判定 | 例词 |
|---|---|---|
| 元音 + r + **辅音/词尾** | r 归前一个音节 | **cur**-ly、**thir**-teen、**mor**-ning、**gar**-den |
| 元音 + r + **元音** | r 归后一个音节 | **o**-range、**sto**-ry、**pa**-rent |

两条规则自洽：`curly` 切 `cu-rly` 是错的（r 后是辅音 l）；`orange` 切 `o-range` 是对的（r 后是元音 a）。

**（2）`al` / `ol` 类 l 组合**：`元音 + l` 后接辅音时，字母组合整体对应**一个元音音位**，是一个组合，不可拆开，l 归属前一个音节：

| 组合 | 发音 | 例词 | 切分 | 说明 |
|---|---|---|---|---|
| al + k | /ɔː/（l 不发音） | walk /wɔːk/ | **walk**（1 音节） | `al` 是组合，l 哑音（§3.6） |
| | | talk /tɔːk/ | **talk**（1 音节） | 同上 |
| | | chalk /tʃɔːk/ | **chalk**（1 音节） | 同上 |
| al + m | /ɑː/（l 不发音） | calm /kɑːm/、palm /pɑːm/ | **calm** / **palm**（1 音节） | 同上 |
| al + f/v | /ɑː/（l 不发音） | half /hɑːf/、calves | **half**（1 音节） | 同上 |
| al + 其他辅音 | /ɔːl/（l 发音） | also /ˈɔːlsəʊ/ | **al**-so | `al` 整体归前音节 |
| | | always /ˈɔːlweɪz/ | **al**-ways | 同上 |
| ol + d | /əʊl/（l 发音） | old、cold /kəʊld/ | **old** / **cold**（1 音节） | `ol` 整体保留 |

> 关键：无论 l 是否发音，`al/ol` 与后续辅音构成的组合都属于**前一个音节**，切分点不能落在 `a` 和 `l` 之间（不能切成 wa-lk、a-lso）。

### 3.5 特殊拼写规则

1. **词尾哑 e**：不发音、不产生音节（cake 为 1 音节，不切 ca-ke）；`-ed` 结尾时 e 前非 t/d 则 e 不发音（hoped 1 音节），是 t/d 则发音（wanted → want-ed，2 音节）；注意 `hundred` 这类非过去式，e 发音（hun-dred）；
2. **辅音 + le 自成音节**：词尾 `辅音 + le` 是一个独立音节：ta-ble、bot-tle、ap-ple、peo-ple、pur-ple、rid-dle；
3. **成音节辅音**（音标层）：词尾 `-l/-n/-m` 前是辅音且后无元音时额外算 1 个音节（bottle /ˈbɒtl/ 2 音节、lesson /ˈlesn/ 2 音节、curtain /ˈkɜːtn/ 2 音节）；流音结尾不算（film 1 音节）；
4. **元音字母组合整体保留**：ou/ow/ea/ai/ie 等作为一个发音单位，切分点不能落在组合内部（co-**lour**、**four**-teen、**ear**-ly）；
5. **元音 + 不发音 gh 组合**（eigh/igh/augh/ough）整体保留：**eigh**-teen、**eigh**-ty、**daugh**-ter、**naugh**-ty、**neigh**-bour。

### 3.6 哑音字母规则（`silentIndices`）⭐

单词中不发音的字母用 `silentIndices: number[]` 记录其在整词中的 **0-based 下标**。判定规则按优先级：

**（1）词尾哑 e**：不发音的词尾 e（cake 的 e、hoped 的 e）。

**（2）双辅音字母：第一个不发音**（最常见的哑音来源）。双写辅音只发一个音，按 VC-CV 切开后，**归属前一音节的第一个辅音字母是哑音**：

| 单词 | 切分 | 哑音字母 | `silentIndices` |
|---|---|---|---|
| yellow | yel-low | 第 1 个 l（下标 2） | `[2]` |
| apple | ap-ple | 第 1 个 p（下标 1） | `[1]` |
| bottle | bot-tle | 第 1 个 t（下标 2） | `[2]` |
| happy | hap-py | 第 1 个 p（下标 2） | `[2]` |
| coffee | cof-fee | 第 1 个 f（下标 2） | `[2]` |
| classroom | class-room | 第 1 个 s（下标 3） | `[3]` |

**（3）组合中的不发音字母**：

| 类型 | 例词 | 哑音字母 | `silentIndices` |
|---|---|---|---|
| al+k/m/f 中的 l（§3.4） | walk | l（下标 2） | `[2]` |
| | half | l（下标 2） | `[2]` |
| gh 组合（§3.5） | eight | g、h（下标 2、3） | `[2, 3]` |
| | daughter | g、h（下标 3、4） | `[3, 4]` |

**（4）经典不规则哑音字母**（逐词判定）：

| 类型 | 例词 | 哑音 | `silentIndices` |
|---|---|---|---|
| 词中哑 t | listen | t（下标 3） | `[3]` |
| 词中哑 b | doubt、debt | b | doubt→`[3]` |
| 词尾哑 b | comb、climb、thumb | b | comb→`[3]` |
| 词尾哑 n | autumn、column | n | autumn→`[5]` |
| 词首哑 k | know、knife、knee | k | know→`[0]` |
| 词首哑 w | write、wrong、wrap | w | write→`[0]` |
| 词首哑 h | hour、honest | h | hour→`[0]` |
| wh 中哑 h | what、when | h | what→`[1]` |

**填写要求**：下标必须精确对应整词字符位置（从 0 数起）；一个词有多个哑音字母时全部列出、升序排列；没有哑音字母时省略该字段。

### 3.7 校验标准（每条必须满足）

1. **拼接回验**：`syllables.join('') === name`；
2. **元音回验**：每段至少含一个元音字母（a/e/i/o/u/y）；缩写词（pm、TV、Ms）豁免；
3. **音标回验**：音节数 = 音标元音音位数（含成音节辅音）；
4. 双元音 / 长元音 / r 控制组合 / al·ol 组合不能被切开；
5. `silentIndices` 中每个下标对应的字母确实不发音，且下标未越界。

### 3.8 特例与豁免

- **特例表**（字母组合对应两个音位，字母层无解，手工指定）：hour→ho-ur、fire→fi-re、quiet→qui-et、science→sci-ence、radio→ra-di-o、chocolate→choco-late、February→fe-bru-a-ry、grandparent→grand-pa-rent 等（完整表见 `SYLLABLE_RULES.md` §7.1）；
- **缩写词**：pm、TV、PE、Mr、OK 等保持整词 1 段，豁免元音回验；
- **含空格/连字符的复合词短语**：ice cream、T-shirt、ping-pong 等按成分分别切分，不参与常规校验。

### 3.9 制作流程（从音标到音节）

```
单词 + 音标(uk/us)
  ├─ 0. 音标按 §2 规范化
  ├─ 1. 计算音标元音数 V（双元音/长元音算 1；成音节辅音 +1）
  ├─ 2. 复合词检测（§3.2）→ 命中则先拆词界，子词分别走下一步
  ├─ 3. 字母层规则切分（§3.3–§3.5）→ 段数 S
  │      S == V 采用；S > V 相邻合并到 V；S < V 拆段补足（词尾 re / 连续元音核 / 多核段）；
  │      仍不符 → 特例表（§3.8）
  ├─ 4. 标记哑音字母 silentIndices（§3.6）
  └─ 5. 三重校验（§3.7）通过后写入数据
```

---

## 4. 中文译文数据规则

### 4.1 格式

`trans` 为字符串数组，**每个词性一条字符串**，格式为「词性前缀 + 空格 + 释义序列」：

```json
{ "trans": ["v. 发现；发掘；查明", "n. 发现物"] }
```

### 4.2 填写规则

1. **词性前缀**使用标准缩写：`n.` `v.` `vt.` `vi.` `adj.` `adv.` `prep.` `conj.` `art.` `pron.`（解析时 `vt.`/`vi.` 会归一化为 `v.`）；
2. **多条释义**之间用中文分号 `；` 分隔（`;` `,` `，` 也可被解析，推荐统一用 `；`）；
3. **一词多性**：不同词性拆成数组中的多条字符串，各自带词性前缀；也兼容写在一条内（如 `"vt.给......着色 n.色彩,颜色"`），但推荐拆开；
4. **释义质量**：给出最常用的 2–4 个核心义项，按使用频率排序，不堆砌生僻义；
5. 无法确定词性时可省略前缀（解析为 `other`），但**精编数据必须带词性**。

---

## 5. 词根词缀数据规则

### 5.1 结构（`etymology` 字段）

```json
{
  "prefix":     { "form": "dis-",  "meaning": "否定/相反/去除" },
  "root":       { "form": "cover", "meaning": "覆盖/遮盖" },
  "suffix":     { "form": "-ive",  "meaning": "有...倾向的 (adj./n.)" },
  "derivation": "去除覆盖的东西 → 揭开、发现、发掘",
  "origin":     "源自古法语 descovrir，由 dis-（去除）+ covrir（遮盖）复合而成。",
  "memoryHook": "dis（去除）+ cover（覆盖）→ 揭开覆盖物 → 发现、查明。"
}
```

六个字段全部可选：`prefix/root/suffix` 是结构化词素（形式 + 含义），`derivation` 是语义推导链，`origin` 是词源故事，`memoryHook` 是联想助记口诀。

### 5.2 form 的书写规范（连字符位置决定角色）

与语言学惯用写法一致：

| 写法 | 角色 | 示例 |
|---|---|---|
| 结尾带连字符 | **前缀** | `dis-`、`inter-`、`re-` |
| 开头带连字符 | **后缀** | `-ive`、`-tion`、`-ly` |
| 不带连字符 | **词根** | `cover`、`spect`、`dict` |

补充约束：

- `prefix.form`（去掉连字符后）必须是单词拼写的**字面词首**，`suffix.form` 必须是**字面词尾**，否则词素着色无法对齐拼写；
- `root` 可以是拉丁/希腊词根（spect、dict），也可以是完整成词的词基（cover、nation）；
- 词素含义用简短中文，多义项用 `/` 分隔（如 `否定/相反/去除`）；后缀含义建议附词性提示（如 `动作/过程/结果 (n.)`）；
- **多层后缀**（如 internationally 的 -al + -ly）：`suffix.form` 填**字面词尾整段**（`-ally`），含义写合成结果（`...地 (adv.)`），每层的推导在 `derivation` 中展开（`inter- + nation + -al + -ly → 在国家之间地 → 国际性地`）；多层前缀同理。

### 5.3 拆解规则（如何分析一个单词）

1. **前缀匹配**：按长度降序尝试常用前缀（避免 `in-` 抢走 `inter-`），且剥离后剩余部分至少 3 个字母。常用前缀（约 60 个）：anti-（反对/抗）、auto-（自己/自动）、co-/com-/con-（共同）、de-（向下/去除）、dis-（否定/相反/去除）、ex-（出/向外）、fore-（在前/预先）、il-/im-/in-/ir-（不/非/向内）、inter-（在...之间/相互）、mis-（错误）、multi-（多）、non-（非）、over-（过度）、post-（在...之后）、pre-（在...之前）、pro-（向前）、re-（再次/返回）、semi-（半）、sub-（在...之下）、trans-（横跨/转变）、un-（不/相反）…
2. **后缀匹配**：按长度降序尝试常用后缀，同样保留最小词基长度。常用后缀（约 40 个，含词性）：-able/-ible（能...的 adj.）、-al（...的 adj.）、-ance/-ence（性质/状态 n.）、-ation/-tion/-sion（动作/过程/结果 n.）、-er/-or（从事...的人/物 n.）、-ful（充满...的 adj.）、-fy（使化 v.）、-ic/-ical（...的 adj.）、-ism（主义 n.）、-ist（专家 n.）、-ity/-ty（性质 n.）、-ive（有...倾向的 adj.）、-ize/-ise（使...化 v.）、-less（无...的 adj.）、-ly（...地 adv.）、-ment（行为/结果 n.）、-ness（状态 n.）、-ous（充满...的 adj.）、-ship（身份/关系 n.）…
3. **词根识别**：在剩余部分中识别拉丁/希腊词根（按长度降序优先）。核心词根举例：spect/spic（看/观察）、vis/vid（看/见）、aud（听）、dict（说话/断言）、voc/vok（声音/呼喊）、log（言语/逻辑）、rupt（破裂/爆发）、tract（拉/吸引）、press（压/按）、pel/puls（推/驱动）、pend/pens（悬挂/称量）、tend/tens（伸展）、flect/flex（弯曲）、port（搬运）、mit/miss（送/放出）、duc/duct（引导）、scrib/script（写）、graph/gram（写/画）、struct（建造）、fer（带来）…
4. **组装 `derivation`**：写成推导链 `前缀含义 + 词根含义 (+ 后缀含义) → 单词义`，如「在国家与国家之间的 → 国际的」；
5. **`origin` 与 `memoryHook`**：`origin` 写词源事实（源语言、原词、演变），`memoryHook` 写联想口诀（可用拆词联想，如 `cab（出租车）+ bag（袋）→ 打车买了一袋卷心菜`）；
6. **不强行拆解**：基础独体词（dog、run、blue）没有可靠的词根词缀时省略 `etymology`，或只填 `origin`/`memoryHook`，不要编造前后缀。

### 5.4 复合词的拆解写法

复合词用 `prefix`/`root` 表达两个成分（与音节切分的复合词规则 §3.2 呼应），例如 `grandparent`：

```json
{
  "prefix": { "form": "grand-", "meaning": "大" },
  "root": { "form": "parent", "meaning": "父母" },
  "derivation": "大父母 → 祖父母"
}
```

---

## 6. 例句数据规则（每词 2 条）

### 6.1 格式

```json
"examples": [
  { "en": "英文例句", "cn": "中文翻译" },
  { "en": "英文例句", "cn": "中文翻译" }
]
```

### 6.2 编写要求

1. **每词固定 2 条**双语例句；
2. `en` 为地道、完整、语法正确的英文句子；`cn` 为自然流畅的中文翻译（意译优先，不逐词硬译）；
3. 例句必须体现单词的**核心义项与典型搭配**（与 `trans` 第一义项对应）；一词多性时两条例句尽量覆盖不同词性/义项；
4. 两条例句语境错开：如一条客观陈述（科技/社会），一条生活化场景（日常/个人）；
5. 长度适中：英文约 8–14 词，避免生僻词干扰学习焦点；
6. 单词在例句中可使用屈折变化形式（时态、单复数），但应保持原词可辨识。

### 6.3 示例

**discover**（v. 发现；发掘）

```json
[
  {
    "en": "Scientists continue to discover new species in deep ocean trenches.",
    "cn": "科学家们不断在深海海沟中发现未知的新物种。"
  },
  {
    "en": "She discovered a natural talent for coding during her college years.",
    "cn": "她在大学期间发现了自己在编程方面的天然天赋。"
  }
]
```

**algorithm**（n. 算法）

```json
[
  {
    "en": "The recommendation algorithm delivers personalized content to every user.",
    "cn": "推荐算法能够为每位用户精准分发个性化的内容。"
  },
  {
    "en": "Researchers developed an efficient search algorithm for large databases.",
    "cn": "研究人员为海量数据库开发了一种极其高效的检索算法。"
  }
]
```

---

## 7. 常见短语数据规则（每词 2–3 条）

### 7.1 格式

```json
"phrases": [
  { "en": "discover the truth", "cn": "查明真相" },
  { "en": "discover by accident", "cn": "偶然发现" }
]
```

### 7.2 编写要求

1. **每词 2–3 条**，选取该词**最高频、最典型**的搭配；
2. 优先级：固定搭配/习语 > 动词短语（动词 + 介词/副词） > 高频名词/形容词搭配；例如 look 应给 `look forward to`、`look after`，而不是随意组合的 `look at the sky`；
3. `en` 为短语原形（动词用原形，不带主语和完整句子）；`cn` 为简洁的对应中文（2–6 字为宜），不加解释性文字；
4. 短语应与 `trans` 中的核心义项相关，能帮助区分近义词或展示介词搭配（如 `depend on`、`be famous for`）；
5. 基础独体词确实没有固定搭配时（如 zebra、seven），省略该字段，**不要编造生硬搭配**。

### 7.3 示例

**look**（v. 看；寻找）

```json
[
  { "en": "look forward to", "cn": "期待；盼望" },
  { "en": "look after", "cn": "照顾；照看" },
  { "en": "look up", "cn": "查阅；查找" }
]
```

**famous**（adj. 著名的）

```json
[
  { "en": "be famous for", "cn": "因......而闻名" },
  { "en": "world-famous", "cn": "世界闻名的" }
]
```

---

## 8. 单词数据制作总流程（Checklist）

给定一个单词，按以下顺序产出完整 JSON：

```
1. name        确定拼写（保留正确大小写）
2. usphone     查证美音 IPA，按 §2 规范化
   ukphone     查证英音 IPA，按 §2 规范化
3. trans       按 §4 写词性 + 中文释义（每词性一条，义项用 ； 分隔）
4. syllables   按 §3 切分：
               复合词先拆词界 → 一元一辅从后往前切 → r 控制 / al·ol 组合 /
               哑 e / -le / gh 组合等特殊规则 → 音标元音数校验 → 特例表兜底
5. silentIndices 按 §3.6 标记哑音：词尾哑 e、双辅音第一个字母、
               al 组合中的 l、gh 组合、经典哑音（kn-/wr-/-mb/-mn/listen t 等）
6. etymology   按 §5 拆解前缀/词根/后缀（连字符定角色），写 derivation 推导链，
               补 origin 词源与 memoryHook 助记；拆不出则省略，不编造
7. examples    按 §6 写 2 条双语例句（覆盖核心义项、语境错开）
8. phrases     按 §7 写 2–3 条高频短语搭配（无固定搭配则省略，不编造）
9. 终检        §3.7 五项校验全部通过；trans/音标/音节/哑音互相印证
```
