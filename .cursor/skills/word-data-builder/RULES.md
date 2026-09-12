# 单词数据完整规则 (Word Data Rules)

> 本文件是 word-data-builder skill 的完整规则库，自包含、不依赖外部文档。
> 用途：给定一个单词，按本规则产出一条完整、正确的单词 JSON 数据。

---

## 1. 数据结构与字段总表

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
    { "en": "Scientists are working hard to discover a cure.", "cn": "科学家们正努力寻找治愈方法。" },
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

| 字段 | 类型 | 必填 | 数据规则 |
|---|---|---|---|
| `name` | `string` | ✅ | 单词拼写，保留原始大小写（专有名词首字母大写） |
| `trans` | `string[]` | ✅ | 中文释义，带词性前缀（§4） |
| `usphone` | `string` | ✅ | 美音 IPA，不带 `/` 包裹（§2） |
| `ukphone` | `string` | ✅ | 英音 IPA，不带 `/` 包裹（§2） |
| `syllables` | `string[]` | ✅ | 音节切分，各段拼接必须还原原词（§3） |
| `etymology` | `object` | 推荐 | 词根词缀结构化拆解（§5），基础独体词可省略 |
| `silentIndices` | `number[]` | 按需 | 不发音字母的 0-based 下标（§3.6），无哑音则省略 |
| `examples` | `{en, cn}[]` | ✅ | 生成例句时覆盖单词的所有含义（不同类型/不同意思均给出示例；若仅一个意思至少给 2 个例句，§6） |
| `phrases` | `{en, cn}[]` | 推荐 | 短语至少 4 个，最多 10 个，尽量全面收录常用的短语组合（§7），无固定搭配可省略 |

---

## 2. 音标数据规则（美 / 英）

1. **两个字段都要填**：`usphone`（美音）、`ukphone`（英音），使用标准 IPA 符号；
2. **不带斜杠**：写 `dɪˈskʌvər`，不写 `/dɪˈskʌvər/`；
3. **重音符号**：主重音 `ˈ`、次重音 `ˌ` 写在重读音节之前；
4. **美英确实相同**时两个字段填同一值；英音的连读 r 可写作 `(r)`，如 `dɪˈskʌvə(r)`；
5. **多音词（词性变音）**：record、present、object 等因词性不同而重音/读音不同的词，**只填一个读音，以 `trans` 第一条词性对应的读音为准**（如 record 的 trans 首条是 `n. 记录` 则填 ˈrekɔːd），不要并列多个音标；
6. **符号规范化**（禁止老式/非标准写法）：
   - 多个发音变体只保留第一个（不用 `；` 或 `|` 并列）；
   - 不混入英文注释（如 `for v.` / `for n.`）；
   - 老式 `əu / ou / au` → 统一为 `əʊ / oʊ / aʊ`；
   - 非标准字符 `ɛ / ɚ / ɝ` → 统一为 `e / ər / ɜːr`；
7. **音标是音节切分的硬约束来源**：音标中的元音音位数量 = 音节数（§3.1），音标必须先于 `syllables` 确定，两者互相印证。

### 元音音位表（IPA）

单元音（12 个）：/iː/ /ɪ/ /e/ /æ/（前）；/ɜː/ /ə/ /ʌ/（中）；/uː/ /ʊ/ /ɔː/ /ɒ/ /ɑː/（后）。
双元音（8 个，**整体算 1 个元音**）：/eɪ/ /aɪ/ /ɔɪ/ /aʊ/ /əʊ/(英)/oʊ/(美) /ɪə/ /eə/ /ʊə/。
三合元音（**整体算 1 个元音**）：/aɪə(r)/、/aʊə(r)/。判定条件是拼写：schwa 没有独立的元音字母承载、只由 `ir / yr / our`（含 -ire/-yre 的词尾哑 e，以及 ir 直接接辅音或后缀的情形）表达时算三合元音，1 音节：fire /faɪər/、tire、desire /dɪˈzaɪər/、hour /aʊər/、sour、flour；de-si-ra-ble /dɪˈzaɪərəbl/ 的 aɪə 同样算 1 个（4 音节，不是 5）。若 schwa 由**独立元音字母**承载（io、ie、ia、-ower、-ier、-yer），仍是两个元音音位、2 音节：li-on、di-et、qui-et、pow-er、flow-er、high-er、buy-er。
重音符号 `ˈ ˌ` 不计入元音。数元音时双字符符号最长优先匹配（eɪ aɪ ɔɪ aʊ əʊ oʊ ɪə eə ʊə iː uː ɜː ɔː ɑː 优先于单字符 ɪ ə e æ ʌ ʊ ɒ...）。

---

## 3. 音节切分规则（重点 ⭐）

### 3.1 总则：一个元音音位 = 一个音节

音节是**发音**的单位，不是字母的单位。切分以**音标中的元音音位数量**为准，不是数元音字母：

- 双元音（/eɪ/、/aɪ/ 等）算 **1 个**元音；长元音（/iː/、/uː/ 等）算 **1 个**；
- 词尾哑 e、不发音字母**不产生音节**；
- 成音节辅音（词尾 -le 等）**额外算 1 个音节**。

**判定优先级**：① 音标元音数（硬约束 `音节数 == 音标元音数`）→ ② 字母层切分规则 → ③ 三重回验（§3.7）。

### 3.2 复合词黄金规则（最高优先级 ⚠️）

**复合词必须先在子词边界切开，再对子词递归切分**，严禁用普通辅音规则跨词界切分：

| 复合词 | 正确切分 | 错误切分 |
|---|---|---|
| headache | **head-ache** | hea-dache |
| grandfather | **grand-fa-ther** | gran-dfa-ther |
| sunflower | **sun-flow-er** | su-nflow-er |
| password | **pass-word** | pa-ssword |
| Sunday | **sun-day** | su-nday |

判定方法：检查单词是否由两个独立成词的部分拼合（常见词头：head、tooth、grand、sun、key、pass、play、water、black、butter、bed、class、some、every、with…；常见词尾：ache、father、mother、cake、flower、board、word、ground、room、side、time、one…），命中则先在词界切开，左右两半分别按 §3.3 递归切分。

**词根 + 屈折后缀同理**：`-ing`、发音的 `-ed`（词根以 t/d 结尾）、发音的 `-es`（词根以 s/x/z/ch/sh 结尾）接在**拼写完整、≥ 3 个字母的独立单词**之后时，先在词根边界切开，再切词根：lock-ing、hang-ing、test-ing、list-ing、open-ing、want-ed、limit-ed、match-es、box-es。三个限定：

- 词根丢了词尾 e 的（use/make/rate/code/state/paste）不算拼写完整，按 §3.3 普通规则：u-sing、ma-king、ra-ting、co-ding、sta-ted、pa-sting；
- 词根本身以双写辅音结尾的（call、press、add、fill），双写整体归前：call-ing、press-ing、add-ing（不再按 VC-CV 切成 cal-ling）；词根末辅音因加后缀而双写的（set → setting）仍是 set-ting；
- `-er / -or / -age / -ic / -al / -able` 等派生后缀**不**走这条（u-ser、ti-mer、prin-ter、pa-ckage、to-pic、rea-da-ble 按普通规则），否则 master / corner / number 会被切成 mast-er、corn-er、numb-er。

### 3.3 一元一辅，从后往前切（核心算法）

**从单词末尾往前扫描：找到一个元音后，再找到一个辅音，就在该辅音前切开。** 每个音节从词尾方向拿「一个元音 + 一个辅音」，剩余辅音留归前一个音节。

以 `command` 为例：从后往前 → `d`、`n` 辅音跳过 → `a` 元音找到 → `m` 辅音找到，切！得到 `mand`；继续 → `m` 跳过 → `o` 元音 → 词首，得到 `com`。结果 **com-mand**。

相邻两元音核之间的辅音簇按以下优先级处理：

| 辅音簇类型 | 处理 | 例词 |
|---|---|---|
| 单辅音（含 r，不论前面元音是否重读） | 归后（V-CV） | co-lour、ba-na-na、o-range、cha-rac-ter、va-ri-a-ble、pa-ra-me-ter |
| 簇首 r 控制（r 前元音、r 后辅音/词尾） | r 归前 | cur-ly、car-rot、thir-teen |
| 双字母一音（th/sh/ch/ph/wh/qu/ck） | 整簇归后（只发一个音，不能拆） | tea-cher、fa-ther、re-quire、so-cket、pa-ckage、bra-cket（lock-ing 是 §3.2 词根边界优先） |
| gh / ng | 归前。gh 是 igh/eigh/ough 元音组合的一部分（§3.5 第 5 条：high-er、bright-ness、daugh-ter）；ng 看音标：只发 /ŋ/ 一个音时 ng 整体归前，发 /ŋg/ 或 /ndʒ/ 两个音时 n 归前、g 归后 | hang-ing、sing-er；fin-ger、lan-guage、chan-ging、ran-ging |
| 元音 + **s + 单辅音** + 元音 | **看音标重音符号的位置**。s 后面的音节重读、且 ˈ/ˌ 紧贴在 s 前（/mɪˈsteɪk/ /rɪˈstɔːr/ /dɪˈskʌs/ /səˈspend/ /əˈsliːp/）→ s 是重读音节的起音，归后；其余情况——前一音节重读（/ˈmæstər/ /fænˈtæstɪk/ /ˈredʒɪstər/）或两边都不重读——s 作前一音节的韵尾，归前 | 归前：mas-ter、sis-ter、sys-tem、his-to-ry、re-gis-ter、ques-tion、fan-tas-tic、plas-tic、bas-ket、fes-ti-val、cus-tom、as-te-risk、des-ti-na-tion；归后：mi-stake、e-scape、re-store、re-spect、re-spond、di-scuss、su-spend、a-sleep、cor-re-spond |
| 可作词首的辅音簇（onset），含 s + 两辅音的 str/spr/scr/spl/squ | 整簇归后（不看重音） | li-bra-ry、a-pril、de-stroy、di-strict、di-splay、au-stra-li-a、in-stru-ment |
| 双写辅音（ll/mm/tt/ss/pp/ff…） | 第一个归前、第二个归后（VC-CV） | yel-low、hap-py、cof-fee |
| 元音 + **x** + 元音 | x 归前（一个字母表达辅音簇 /ks/ /gz/，按簇的 VC-CV 处理，字母不可拆只能整体留前） | ex-am-ple、ex-it、ex-ist、max-i-mum、lex-i-cal、hex-a-de-ci-mal、in-dex-ing |
| 其他多辅音簇 | 只把**能作词首的最长尾段**归后（单个辅音，或 onset 表中的簇），其余全部归前 | sep-tem-ber、oc-to-ber（两辅音：后一个归后）；func-tion（nct → 只有 t 归后）、ex-tra（xtr → tr 归后）、in-stru-ment（nstr → str 归后）、in-stance（nst → st 归后：s 前是辅音 n 而不是元音，不触发 s 归前；test-ing 则由 §3.2 词根边界决定） |

> onset 表：`bl br cl cr dr dw fl fr gl gr pl pr sc sk sl sm sn sp st sw tr tw` + `scr shr spl spr squ str thr`。

元音核判定要点：

- 元音字母 `a e i o u`；**y** 在词首且后接元音时是辅音（yes），夹在两元音字母之间且音标有 /j/ 时也是辅音（be-yond、law-yer）；其余位置算元音（happy、day）；
- **w** 紧跟在 a/e/o 之后且音标里没有 /w/ 时，是元音字母组合 ow/aw/ew 的一部分，属于前一个核（low-er、pow-er、fol-low-ing、show-ing、draw-ing）；音标有 /w/ 时是辅音（to-ward、a-way、al-ways）；
- **qu** 中的 `u` 不独立成核（quick）；
- 连续元音字母合并为一个核（ou、ea、ow 等整体一个核）；
- **词中哑 e 不成核**，且始终归前一个音节：辅音 + e + 辅音开头的后缀（-ment/-ly/-ness/-less/-ful）→ re-place-ment、en-tire-ly、close-ly、man-age-ment；软音 c/g 后的 e + able/ous → re-place-a-ble、man-age-a-ble、cou-ra-geous。

### 3.4 r 控制元音与 l 组合（发音整体，不可拆开）

**（1）r 控制元音**：`元音 + r` 后接**辅音或词尾**时（ar/er/ir/or/ur + 辅音），字母组合对应一个 r 化元音音位，`元音` 和 `r` 不能拆进两个音节，r 归前一个音节。`元音 + r` 后接**元音**时，r 是普通的单个辅音，按 §3.3「单辅音归后」处理，**不设特例**：

| 位置 | 判定 | 例词 |
|---|---|---|
| 元音 + r + **辅音/词尾** | r 归前一个音节 | **cur**-ly、**thir**-teen、**mor**-ning、**gar**-den |
| 元音 + r + **元音** | r 归后一个音节（与 m、t 等单辅音同样处理） | **o**-range、**cha**-rac-ter、**va**-ri-a-ble、**pa**-rent、**sto**-ry、a-**round** |

两条规则自洽，且都是 §3.3 算法的自然结果：`curly` 切 `cu-rly` 是错的（r 后是辅音 l，r 必须留在前面）；`character` 切 `char-ac-ter` 也是错的（r 后是元音 a，r 归后，与 pa-ra-me-ter 的 m 同理）。

> 依据：单个辅音夹在两个元音之间时，不论前面的元音是否重读，一律作后一音节的开头（Maximal Onset）。不要为 r 或重读短元音引入「归前」特例，否则 character / variable / parameter 这类同构的词会被切得互不一致；也不要以英美词典的书写拆分（char·ac·ter、var·i·a·ble）为准，那是排版断词惯例，不是发音切分。

**（2）`al` / `ol` 类 l 组合**：`元音 + l` 后接辅音时，字母组合整体对应**一个元音音位**，不可拆开，l 归属前一个音节：

| 组合 | 发音 | 例词 | 切分 |
|---|---|---|---|
| al + k | /ɔː/（l 不发音） | walk /wɔːk/、talk、chalk | **walk**（1 音节），l 哑音 |
| al + m | /ɑː/（l 不发音） | calm /kɑːm/、palm | **calm**（1 音节），l 哑音 |
| al + f/v | /ɑː/（l 不发音） | half /hɑːf/、calves | **half**（1 音节），l 哑音 |
| al + 其他辅音 | /ɔːl/（l 发音） | also、always | **al**-so、**al**-ways |
| ol + d | /əʊl/（l 发音） | old、cold /kəʊld/ | **old** / **cold**（1 音节） |

> 关键：无论 l 是否发音，`al/ol` 与后续辅音构成的组合都属于**前一个音节**，切分点不能落在 `a` 和 `l` 之间（不能切成 wa-lk、a-lso）。

### 3.5 特殊拼写规则

1. **词尾哑 e**：不发音、不产生音节（cake 为 1 音节，不切 ca-ke）；`-ed` 结尾时 e 前非 t/d 则 e 不发音（hoped 1 音节），是 t/d 则发音（wanted → want-ed，2 音节）；注意 `hundred` 这类非过去式，e 发音（hun-dred）；
2. **辅音 + le 自成音节**：词尾 `辅音 + le` 是一个独立音节：ta-ble、bot-tle、ap-ple、peo-ple、pur-ple、rid-dle；
3. **成音节辅音**（音标层）：词尾 `-l/-n/-m` 前是辅音且后无元音时额外算 1 个音节（bottle /ˈbɒtl/ 2 音节、lesson /ˈlesn/ 2 音节、curtain /ˈkɜːtn/ 2 音节）；流音结尾不算（film 1 音节）；
4. **元音字母组合整体保留**：ou/ow/ea/ai/ie 等作为一个发音单位，切分点不能落在组合内部（co-**lour**、**four**-teen、**ear**-ly）；
5. **igh / eigh / aigh / augh / ough 是元音字母组合**，整体表达一个元音音位（igh → /aɪ/：right、light、high、night；eigh → /eɪ/：eight、weight、neighbour；augh/ough → /ɔː/ /aʊ/ /oʊ/ /uː/：daughter、bought、though、through），与 ou/ea/ai 同属第 4 条的“整体保留”单位，切分点不能落在组合内部：**eigh**-teen、**eigh**-ty、**daugh**-ter、**naugh**-ty、**neigh**-bour、**high**-er、**bright**-ness。其中的 g、h 是组合的组成部分，**不是哑音**（见 §3.6）；
6. **-tion / -sion / -cial / -tial 是否是整体，看音标里写的是 ʃn 还是 ʃən**。正常情况下 tion 读 /ʃn/（ʃ 和 n 之间没有元音，n 成音节），是一个整体、n 归前：sta-**tion** /ˈsteɪʃn/、na-**tion**-al /ˈnæʃnəl/、oc-ca-**sion**-al-ly /əˈkeɪʒnəli/；词尾或后接辅音时即使写作 /ʃən/ 也归前（ques-**tion**、men-**tioned**、spe-**cial**-ly、i-ni-**tial**-ly）。但当音标里 tion 读成 /ʃə/ + /n/ 且 n 后面紧跟元音时，n 已经是下一音节的起音，tion 在这个词里**不再是整体**：optional /ˈɑːpʃənəl/ → ɑːp | ʃə | nəl → op-**tio**-nal；同理 ad-di-**tio**-nal /əˈdɪʃənəl/、con-di-**tio**-nal、sta-**tio**-na-ry /ˈsteɪʃəneri/、spe-**cia**-lize /ˈspeʃəlaɪz/、i-ni-**tia**-lize、re-vo-lu-**tio**-nize（不切 op-tion-al）。美音或英音**任一**写成 ʃn / ʒn 就按整体处理（national 美音 ˈnæʃənəl、英音 ˈnæʃnəl → na-tion-al）。不论哪种情况，其中的 io / ia 都是一个元音核（读 /ə/），不参与 §3.9 的拆核补足；
7. **弱读元音脱落**：以美音元音数为准。美音保留 schwa 的（ˈhɪstəri、ˈevəri、ˈsevərəl、ˈɪntərəst）按字母层切满：his-to-ry、e-ve-ry、se-ve-ral、in-te-rest；美音脱落的（ˈbaʊndri、ˈleɪtnsi、ˈoʊpnɪŋ）段数多出 1，把脱落元音所在的段**并入后一段**：boun-dary、la-tency；若该词有 §3.2 的词根边界，合并只在词根内部进行，不跨边界：open-ing（不是 o-pening）；
8. **trans- / sub- 前缀 + 辅音**：前缀整体成段，不让 s/b 被后面的辅音簇带走：**trans**-late、**trans**-port、**trans**-mit、**sub**-rou-tine、**sub**-scribe（后接元音时按普通规则：tran-sient、tran-sac-tion、su-burb）。

### 3.6 哑音字母规则（`silentIndices`）⭐

不发音的字母用 `silentIndices: number[]` 记录其在整词中的 **0-based 下标**。判定按优先级：

**（1）词尾哑 e**：不发音的词尾 e（cake 的 e 下标 3、hoped 的 e）。

**（2）双辅音字母：第一个不发音**（最常见的哑音来源）。双写辅音只发一个音，**第一个辅音字母是哑音**，与是否位于音节边界无关（词尾、单音节词同样标）：

| 单词 | 切分 | 哑音字母 | `silentIndices` |
|---|---|---|---|
| yellow | yel-low | 第 1 个 l（下标 2） | `[2]` |
| apple | ap-ple | 第 1 个 p（下标 1） | `[1]` |
| bottle | bot-tle | 第 1 个 t（下标 2） | `[2]` |
| happy | hap-py | 第 1 个 p（下标 2） | `[2]` |
| coffee | cof-fee | 第 1 个 f（下标 2） | `[2]` |
| classroom | class-room | 第 1 个 s（下标 3） | `[3]` |
| loss / small / off | 不切 | 第 1 个 s / l / f | `[2]` / `[3]` / `[1]` |
| address | ad-dress | 第 1 个 d、第 1 个 s | `[1, 5]` |

例外：**cc + e/i/y** 读 /ks/ 两个音（suc-cess、ac-cept、ac-cess），两个 c 都发音，不算哑音。

**（3）组合中的不发音字母**：

| 类型 | 例词 | 哑音字母 | `silentIndices` |
|---|---|---|---|
| al+k/m/f 中的 l（§3.4） | walk / half | l（下标 2） | `[2]` |

**不算哑音的组合**：igh / eigh / aigh / augh / ough 是元音字母组合（§3.5 第 5 条），right、light、eight、daughter、through 里的 g、h 是组合的一部分，**不要**写进 `silentIndices`（right 只有 4 个字母全部参与拼读，没有哑音）。同理 th/sh/ch/ph/wh/ck/qu 等双字母一音的组合也不拆成“一个发音一个不发音”。gh 只在**单独读 /f/ 或不读的词尾**才按经典哑音逐词判定（例如 laugh 读 /f/ 不算哑音；sigh 的 igh 同样是组合，不算）。

**（4）经典不规则哑音字母**（逐词判定）：

| 类型 | 例词 | `silentIndices` 示例 |
|---|---|---|
| 词中哑 t | listen、castle | listen→`[3]` |
| 词中哑 b | doubt、debt | doubt→`[3]` |
| 词尾哑 b | comb、climb、thumb | comb→`[3]` |
| 词尾哑 n | autumn、column | autumn→`[5]` |
| 词首哑 k | know、knife、knee | know→`[0]` |
| 词首哑 w | write、wrong、wrap | write→`[0]` |
| 词首哑 h | hour、honest | hour→`[0]` |
| wh 中哑 h | what、when | what→`[1]` |
| 词中哑 h | ghost、rhythm、exhibit | ghost→`[1]` |

**填写要求**：下标必须逐字符精确数过（从 0 起）；多个哑音字母全部列出、升序排列；没有哑音则省略该字段。

### 3.7 校验标准（每条必须满足）

1. **拼接回验**：`syllables.join('') === name`；
2. **元音回验**：每段至少含一个元音字母（a/e/i/o/u/y）；缩写词（pm、TV、Ms）豁免；
3. **音标回验**：音节数 = 音标元音音位数（含成音节辅音）；
4. 双元音 / 长元音 / r 控制组合 / al·ol 组合不能被切开；
5. `silentIndices` 中每个下标对应的字母确实不发音，且下标未越界。

### 3.8 特例表与豁免

**特例表**（一个字母组合对应两个音标元音，规则切分无解，手工指定）：

| 词 | 音标 | 特例切分 | 原因 |
|---|---|---|---|
| diet | /ˈdaɪət/ | di-et | ie 拆两个音位 |
| quiet | /ˈkwaɪət/ | qui-et | 同上 |
| science | /ˈsaɪəns/ | sci-ence | 同上 |
| radio | /ˈreɪdiəʊ/ | ra-di-o | io 拆两个音位 |
| piano | /piˈænəʊ/ | pi-a-no | 同上 |
| video | /ˈvɪdiəʊ/ | vi-de-o | 同上 |
| museum | /mjuˈziːəm/ | mu-se-um | 同上 |
| diary | /ˈdaɪəri/ | di-a-ry | 同上 |
| really | /ˈriːəli/ | re-al-ly | ea 拆两个音位 |
| poem / poet | /ˈpəʊɪm/ | po-em / po-et | oe 拆两个音位 |
| crayon | /ˈkreɪən/ | cray-on | ay 拆两个音位 |
| lion | /ˈlaɪən/ | li-on | io 拆两个音位 |
| koala | /kəʊˈɑːlə/ | ko-a-la | oa 拆两个音位 |
| vegetable | /ˈvedʒtəbl/ | vege-ta-ble | 中位 e 不发音 |
| chocolate | /ˈtʃɒklət/ | choco-late | 中位 o、尾 e 不发音 |
| expensive | /ɪkˈspensɪv/ | ex-pen-sive | 词首元音 + 辅音簇易切坏 |
| February | /ˈfebruəri/ | fe-bru-a-ry | ua 连续元音核 |
| weekend | /ˌwiːkˈend/ | week-end | end 词尾易误伤 |
| twenty | /ˈtwenti/ | twen-ty | 规则会切成 twe-nty |
| grandparent 系 | — | grand-pa-rent / grand-fa-ther / grand-mo-ther / grand-pa / grand-ma | ndp/ndf/ndm 簇切不出 grand- 边界 |

**豁免**：

- **缩写词**：pm、TV、PE、Mr、Mrs、OK、UK、Ms 等保持整词 1 段，豁免元音回验；
- **含空格/连字符的复合词短语**：ice cream、T-shirt、ping-pong、kung fu 等按成分分别切分，不参与常规校验；
- **字母层极限**：-ism（criticism）、-rithm（algorithm）等后缀的字母不足以表达全部音位（/zəm/ 两个音位只有 1 个元音字母），此类词取字母层最大段数（段数可比音标元音数少 1–2），并注明。

### 3.9 制作流程（从音标到音节）

```
单词 + 音标(uk/us)
  ├─ 0. 音标按 §2 规范化
  ├─ 1. 计算音标元音数 V（双元音/长元音算 1；成音节辅音 +1）
  ├─ 2. 复合词检测（§3.2）→ 命中则先拆词界，子词分别走下一步
  ├─ 3. 字母层规则切分（§3.3–§3.5）→ 段数 S
  │      S == V 采用；S > V 把脱落元音所在段并入后一段（不跨词根/复合词边界）；S < V 拆连续元音核补足（-tion/-cial 的 io/ia 不拆）；
  │      仍不符 → 特例表（§3.8）
  ├─ 4. 标记哑音字母 silentIndices（§3.6）
  └─ 5. 三重校验（§3.7）通过后写入数据
```

---

## 4. 中文译文数据规则

`trans` 为字符串数组，**每个词性一条字符串**，格式「词性前缀 + 空格 + 释义序列」：

```json
{ "trans": ["v. 发现；发掘；查明", "n. 发现物"] }
```

1. **词性前缀**用标准缩写：`n.` `v.` `vt.` `vi.` `adj.` `adv.` `prep.` `conj.` `art.` `pron.`；
2. **多条释义**之间用中文分号 `；` 分隔；
3. **一词多性**：不同词性拆成数组中的多条字符串，各自带词性前缀；
4. **释义质量**：最常用的 2–4 个核心义项，按使用频率排序，不堆砌生僻义；
5. 精编数据必须带词性前缀。

---

## 5. 词根词缀数据规则

### 5.1 结构

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

### 5.2 form 书写规范（连字符位置决定角色）

| 写法 | 角色 | 示例 |
|---|---|---|
| 结尾带连字符 | **前缀** | `dis-`、`inter-`、`re-` |
| 开头带连字符 | **后缀** | `-ive`、`-tion`、`-ly` |
| 不带连字符 | **词根** | `cover`、`spect`、`dict` |

补充约束：

- `prefix.form`（去掉连字符后）必须是单词拼写的**字面词首**，`suffix.form` 必须是**字面词尾**；
- `root` 可以是拉丁/希腊词根（spect、dict），也可以是完整成词的词基（cover、nation）；
- 词素含义用简短中文，多义项用 `/` 分隔；后缀含义附词性提示（如 `动作/过程/结果 (n.)`）；
- **多层后缀**（如 internationally 的 -al + -ly）：`suffix.form` 填**字面词尾整段**（`-ally`），含义写合成结果（`...地 (adv.)`），每层推导在 `derivation` 中展开；多层前缀同理。

### 5.3 拆解规则

1. **前缀匹配**：按长度降序尝试（避免 `in-` 抢走 `inter-`），剥离后剩余部分至少 3 个字母。常用前缀：anti-（反对/抗）、auto-（自己/自动）、co-/com-/con-（共同）、de-（向下/去除）、dis-（否定/相反/去除）、ex-（出/向外）、fore-（在前/预先）、il-/im-/in-/ir-（不/非/向内）、inter-（在...之间/相互）、mis-（错误）、multi-（多）、non-（非）、over-（过度）、post-（在...之后）、pre-（在...之前）、pro-（向前）、re-（再次/返回）、semi-（半）、sub-（在...之下）、trans-（横跨/转变）、un-（不/相反）…
2. **后缀匹配**：按长度降序尝试，保留最小词基长度。常用后缀：-able/-ible（能...的 adj.）、-al（...的 adj.）、-ance/-ence（性质/状态 n.）、-ation/-tion/-sion（动作/过程/结果 n.）、-er/-or（从事...的人/物 n.）、-ful（充满...的 adj.）、-fy（使化 v.）、-ic/-ical（...的 adj.）、-ism（主义 n.）、-ist（专家 n.）、-ity/-ty（性质 n.）、-ive（有...倾向的 adj.）、-ize/-ise（使...化 v.）、-less（无...的 adj.）、-ly（...地 adv.）、-ment（行为/结果 n.）、-ness（状态 n.）、-ous（充满...的 adj.）、-ship（身份/关系 n.）…
3. **词根识别**：spect/spic（看/观察）、vis/vid（看/见）、aud（听）、dict（说话/断言）、voc/vok（声音/呼喊）、log（言语/逻辑）、rupt（破裂/爆发）、tract（拉/吸引）、press（压/按）、pel/puls（推/驱动）、pend/pens（悬挂/称量）、tend/tens（伸展）、flect/flex（弯曲）、port（搬运）、mit/miss（送/放出）、duc/duct（引导）、scrib/script（写）、graph/gram（写/画）、struct（建造）、fer（带来）…
4. **组装 `derivation`**：推导链 `前缀含义 + 词根含义 (+ 后缀含义) → 单词义`，如「在国家与国家之间的 → 国际的」；
5. **`origin` 与 `memoryHook`**：`origin` 写词源事实（源语言、原词、演变），`memoryHook` 写联想口诀（可用拆词联想）；
6. **不强行拆解**：基础独体词（dog、run、blue）没有可靠的词根词缀时省略 `etymology`，或只填 `origin`/`memoryHook`，**不要编造前后缀**。

### 5.4 复合词的拆解写法

复合词用 `prefix`/`root` 表达两个成分（与 §3.2 复合词切分呼应）：

```json
{
  "prefix": { "form": "grand-", "meaning": "大" },
  "root": { "form": "parent", "meaning": "父母" },
  "derivation": "大父母 → 祖父母"
}
```

---

## 6. 例句数据规则（覆盖所有含义，单义词至少 2 条）

```json
"examples": [
  { "en": "英文例句（覆盖第一义项/词性）", "cn": "中文翻译" },
  { "en": "英文例句（覆盖第二义项/词性）", "cn": "中文翻译" }
]
```

原则：**覆盖全面、越简单越好**。例句的任务是让学习者看到该单词在不同含义和生活语境下的实际用法。

1. **覆盖所有含义**：生成例句时，必须覆盖该单词的所有含义（包括不同词性、不同类型的含义，以及不同主要释义与含义，都要分别给出针对性的示例例句）；
2. **单义词保底**：如果一个单词就一个意思，至少给出两个例句；
3. **短**：英文 **5–10 词**，一句只说一件事；宁可短，不要长。超过 10 词先删修饰语；
4. **简单**：
   - 一个主句，不用复杂从句、不用分词短语、不用倒装；
   - 用最常见的日常词（吃饭、上学、家人、天气、买东西），除目标词外，其余单词都应比目标词更简单、更常见；
   - 时态用一般现在时、一般过去时、一般将来时；不叠加完成进行等复合时态；
   - 不用习语、不用比喻、不用专有名词堆砌；
5. `en` 语法正确、地道；`cn` 为对应的自然中文，同样简短，不加解释、不加修饰；
6. 单词可用屈折变化形式（时态、单复数），但保持原词可辨识；
7. 例句里能顺带用上 `phrases` 里的搭配最好（如 look → I'm looking for my keys.）。

对比：

| 目标词 | ✗ 太长太难 | ✓ 简单简短 |
|---|---|---|
| discover | Scientists recently discovered a previously unknown species of frog in the Amazon rainforest. | We discovered a small cave near the beach. |
| the | The sun dipped slowly beneath the Pacific horizon, casting a crimson glow across the clouds. | The book on the desk is mine. |
| help | It requires an extraordinary degree of patience to help students overcome their anxiety. | Can you help me with my homework? |
| yellow | The ginkgo leaves turn bright yellow in late autumn along the university avenue. | Her new dress is yellow. |

---

## 7. 常见短语数据规则（每词 4–10 条）

```json
"phrases": [
  { "en": "discover the truth", "cn": "查明真相" },
  { "en": "discover by chance", "cn": "偶然发现" },
  { "en": "discover new talents", "cn": "发掘新人" },
  { "en": "discover a secret", "cn": "发现秘密" }
]
```

1. **数量范围**：短语至少 4 个，最多 10 个（4–10 条）；
2. **尽量全面与常用组合**：尽量全面，收录该单词最常用的短语组合（动词短语、介词固定搭配、高频搭配等）；
3. **优先级**：固定搭配/习语 > 动词短语（动词 + 介词/副词） > 高频名词/形容词修饰搭配；例如 look 应给 `look forward to`、`look after`、`look for`、`look up`，而不是随意生造；
4. `en` 为短语原形（动词用原形，不带主语和完整句子）；`cn` 为简洁对应中文（2–6 字为宜），不加解释性文字；
5. 短语应与 `trans` 核心义项紧密相关，能帮助区分近义词或展示介词搭配（如 `depend on`、`be famous for`）；
6. 基础独体词确实没有固定搭配时（如 zebra、seven），省略该字段，**不要编造生硬搭配**。

---

## 8. 制作总流程（Checklist）

```
1. name          确定拼写（保留正确大小写）
2. usphone       查证美音 IPA，按 §2 规范化
   ukphone       查证英音 IPA，按 §2 规范化
3. trans         按 §4 写词性 + 中文释义（每词性一条，义项用 ； 分隔）
4. syllables     按 §3 切分：复合词先拆词界 → 一元一辅从后往前切 →
                 r 控制 / al·ol 组合 / 哑 e / -le / gh 等特殊规则 →
                 音标元音数校验 → 特例表兜底
5. silentIndices 按 §3.6 标记哑音：词尾哑 e、双辅音第一个字母、
                 al 组合中的 l、gh 组合、经典哑音（kn-/wr-/-mb/-mn/listen t 等）
6. etymology     按 §5 拆解前缀/词根/后缀（连字符定角色），写 derivation 推导链，
                 补 origin 词源与 memoryHook 助记；拆不出则省略，不编造
7. examples      按 §6 编写双语例句（覆盖所有含义，不同类型/不同意思均给示例，单义词至少 2 条；5–10 词简单句）
8. phrases       按 §7 编写短语（至少 4 个、最多 10 个，尽量全面收录常用的短语组合）
9. 终检          §3.7 五项校验全部通过；trans/音标/音节/哑音互相印证
```
