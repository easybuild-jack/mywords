# 📐 MyWords 音节切分规则规范 (Syllable Splitting Rules)

> 版本：v1.0 ｜ 适用范围：所有词库单词的 syllables 字段生成与校验
> 配套工具：`scripts/rebuild-basewords-syllables.mjs`（重建）、`scripts/check-syllables-by-phonetics.mjs`（校验）

---

## 1. 总则（核心规则）

> **一个元音音位（phoneme）= 一个音节。**

音节是"发音"的单位，不是"字母"的单位。切分必须**以音标中的元音音位数量为准**，而不是数元音字母。

- 双元音（/eɪ/、/aɪ/ 等）**算一个元音**，切分时其对应的字母组合整体保留；
- 长元音（/iː/、/uː/ 等）**算一个元音**；
- 词尾哑 e、不发音字母**不产生音节**；
- 成音节辅音（-le 等）**额外算一个音节**。

### 判定优先级
1. 音标元音数（硬约束：`音节数 == 音标元音数`）
2. 切分位置规则（见 §3、§4）
3. 拼接回验与元音回验（见 §6）

---

## 2. 元音音位表（IPA）

### 2.1 单元音（12 个）
| 前元音 | 中元音 | 后元音 |
|---|---|---|
| /iː/ bee | /ɜː/ bird | /uː/ too |
| /ɪ/ bit | /ə/ about | /ʊ/ book |
| /e/ bed | /ʌ/ cup | /ɔː/ law |
| /æ/ cat | | /ɒ/ hot（英）|
| | | /ɑː/ car（英）|

### 2.2 双元音（8 个，**整体算 1 个元音**）
| 双元音 | 例词 |
|---|---|
| /eɪ/ day | /aɪ/ my |
| /ɔɪ/ boy | /aʊ/ now |
| /əʊ/ go（英）/oʊ/（美）| /ɪə/ ear（英）|
| /eə/ air（英）| /ʊə/ tour（英）|

### 2.3 程序中的符号表（与 `scripts/rebuild-basewords-syllables.mjs` 一致）
- 双字符元音符号（最长优先匹配）：`eɪ aɪ ɔɪ aʊ əʊ oʊ ɪə eə ʊə iː uː ɜː ɔː ɑː`
- 单字符元音符号：`ɪ ə e æ ʌ ʊ ɒ ɔ ɑ ɜ i u a o`
- 重音符号 `ˈ ˌ` 不计入元音。

---

## 3. 字母层切分规则（一元一辅）

在字母层面把单词切成音节，遵循 **V-CV（元音-辅音-元音）贪心规则**：

### 3.1 元音核（Vowel Nucleus）判定
- 元音字母：`a e i o u`；
- **y 的规则**：词首且后接元音字母时是辅音（yes、young），其余位置算元音（happy、rhythm、day）；
- **qu 例外**：`qu` 里的 `u` 不独立成核（quick、queen）；
- 连续元音字母合并为一个核（`ou`、`ea`、`ow` 等整体是一个核）。

### 3.2 辅音归属（一元一辅，从后往前切）
相邻两个元音核之间的辅音簇，**从后往前**分配：单辅音归后一个音节，多辅音簇按下表处理：

| 辅音簇类型 | 处理 | 例词 |
|---|---|---|
| 单辅音 | 归后一个音节（V-CV）| colour→co-lour、orange→o-range、banana→ba-na-na |
| **簇首 r 控制**（r 前是元音、r 后是辅音/词尾）| r 归属前一个音节 | curly→cur-ly、carrot→car-rot、thirteen→thir-teen |
| 双写辅音（ll、tt、ss）| 整簇归后 | yellow→ye-llow |
| 双字母一音（th、sh、ch、ph、wh、ck、ng、gh、qu）| 整簇归后 | teacher→tea-cher |
| **可作词首的辅音簇**（br、gr、pr、sk 等 onset）| 整簇归后 | library→li-bra-ry、kilogram→ki-lo-gram、April→a-pril |
| **其他多辅音簇** | **第一个辅音归前、其余归后**（VC-CV，从后往前切）| September→sep-tem-ber、October→oc-to-ber、November→no-vem-ber |

> 关键：一元一辅不是"辅音簇全部归后"，而是**从后往前切**——每个音节从词尾方向拿"一个元音 + 一个辅音（簇尾）"，剩余辅音留归前一个音节。
>
> onset 表（可作词首的辅音簇）：`bl br cl cr dr dw fl fr gl gr pl pr sc sk sl sm sn sp st sw tr tw` + 三字母 `scr shr spl spr squ str thr`。

### 3.3 复合词黄金切分规则（Compound Words Decomposer）⚠️ 最高优先级

在自然拼读与音节学中，首要原则是：**"Divide between compound words"（复合词优先在子词边界切分）**。

由两个或多个独立词拼合而成的复合词，**严禁使用普通辅音规则跨词界切分**，否则会产生严重的语音与语义错误：

| 复合单词 | 复合成分 | 错误切分（普通辅音规则） | 正确切分（复合词规则） | 错误原因分析 |
|---|---|---|---|---|
| **`headache`** | head + ache | hea-dache | **head-ache** | 普通单辅音规则（V-CV）会将 d 归后，破坏 head 与 ache 词界 |
| **`toothache`** | tooth + ache | too-thache | **tooth-ache** | 普通双辅音规则将 th 整体归后，破坏 tooth 词界 |
| **`grandfather`**| grand + father| gran-dfa-ther | **grand-fa-ther** | ndf 辅音簇错切，应先分解为 grand + father 再递归切分 |
| **`grandmother`**| grand + mother| gran-dmo-ther | **grand-mo-ther** | ndm 辅音簇错切，分解为 grand + mother 再递归切分 |
| **`pancake`** | pan + cake | pan-ca-ke / pa-ncake | **pan-cake** | 保护 pan 与 cake 独立词完整性 |
| **`sunflower`** | sun + flower | su-nflow-er | **sun-flow-er** | 保护 sun 词界，flower 进一步切为 flow-er |
| **`keyboard`** | key + board | key-bo-ard | **key-board** | 保护 key 与 board 词界 |
| **`password`** | pass + word | pa-ssword | **pass-word** | 保护 pass 与 word 词界 |
| **`playground`** | play + ground | pla-yground | **play-ground** | 保护 play 与 ground 词界 |
| **`watermelon`** | water + melon | wa-ter-me-lon | **wa-ter-mel-on** | 分解为 water (wa-ter) + melon (mel-on) |
| **`butterfly`** | butter + fly | bu-tter-fly | **but-ter-fly** | 分解为 butter (but-ter) + fly |
| **`blackboard`** | black + board | bla-ckboard | **black-board** | 保护 black 与 board 词界 |
| **`bedroom`** | bed + room | be-droom | **bed-room** | 保护 bed 与 room 词界 |
| **`classroom`** | class + room | cla-ssroom | **class-room** | 保护 class 与 room 词界 |
| **`inside`** | in + side | i-nside | **in-side** | 保护 in 与 side 词界 |
| **`outside`** | out + side | ou-tside | **out-side** | 保护 out 与 side 词界 |
| **`sometimes`** | some + times | so-metimes | **some-times** | 保护 some 与 times 词界 |
| **`everyone`** | every + one | eve-ry-one | **ev-ery-one** | 分解为 every (ev-ery) + one |
| **`without`** | with + out | wi-thout | **with-out** | 保护 with 与 out 词界 |

#### 算法实现机制（分治递归）：
1. **复合词探测器 (`detectCompoundSplit`)**：
   - 扫描高频复合词前半部集合（`COMPOUND_HEADS`：`head`, `tooth`, `grand`, `sun`, `key`, `pass`, `play`, `water`, `black`, `butter`, `bed`, `class`, `some`, `every`, `with` 等）；
   - 扫描高频复合词后半部集合（`COMPOUND_TAILS`：`ache`, `father`, `mother`, `cake`, `flower`, `board`, `word`, `ground`, `melon`, `fly`, `room`, `side`, `time`, `one` 等）；
   - 当 `left` 与 `right` 命中复合词分界点时，优先在此切开；
2. **递归子切分**：
   $$\text{Syllables}(word) = [\dots\text{Syllables}(left), \dots\text{Syllables}(right)]$$

---

## 4. r 控制元音规则（重点，不可拆开）

**ar / er / ir / or / ur 是 r 控制元音组合，发音上是一个整体**，切分时不能把 `元音` 和 `r` 拆到两个音节。

判定规则（英语 r 连接规则，字母层可判定）：

| 位置 | 判定 | 例词 | 正确切分 |
|---|---|---|---|
| **元音 + r + 辅音/词尾** | r 归属前一个音节，组合整体保留 | curly (u-r-l) | **cur-ly**（不是 cu-rly）|
| | | thirteen (i-r-t) | thir-teen |
| | | morning (o-r-n) | mor-ning |
| | | garden (a-r-d) | gar-den |
| | | carrot (a-r-r) | car-rot |
| | | airport (i-r-p) | air-port |
| | | hurry (u-r-r) | hur-ry |
| **元音 + r + 元音** | r 归属后一个音节，拆开 | orange (o-r-a) | **o-range**（不是 or-ange）|
| | | story (o-r-y) | sto-ry |
| | | tired (i-r-e) | ti-red |
| | | parent (a-r-e) | pa-rent |
| | | different (e-r-e) | diffe-rent |

> 两条规则自洽：`curly` 拆 `cu-rly` 是错的（r 后是辅音 l），`orange` 拆 `o-range` 是对的（r 后是元音 a）。

---

## 5. 特殊拼写与不发音字母规则

### 5.1 词尾哑 e（Silent e）
- 词尾 `e` 不发音、不产生音节：cake → `cake`（1 音节），不是 ca-ke；
- **-ed 结尾**：e 前的字母不是 t/d 时 e 不发音（hoped 1 音节）；是 t/d 时 e 发音（wanted 2 音节）。
- ⚠️ 误伤示例：`hundred` 以 `red` 结尾但不是过去式，e 发音（2 音节 hun-dred）——通过音标回验修正（§6）。

### 5.2 辅音 + le 自成音节
- 词尾 `辅音 + le` 是一个独立音节：ta-ble、bot-tle、ap-ple、peo-ple、pur-ple、rid-dle。

### 5.3 成音节辅音（音标层）
- 音标中词尾的 `-l / -n / -m`，其前是辅音且之后无元音时，额外算 1 个音节：
  - bottle /ˈbɒtl/ → 2 音节（ɒ + 成音节 l）
  - lesson /ˈlesn/ → 2 音节
  - curtain /ˈkɜːtn/ → 2 音节
- **流音结尾不算**：film /fɪlm/（1 音节，m 前是 l）、only /ˈəʊnli/（l 后有元音）。

### 5.4 元音字母组合整体保留
- 连续元音字母（ou、ow、ea、ai、ie 等）作为一个发音单位，切分点不能落在组合内部：
  - colour → co-**lour**（ou 整体在第二音节）
  - fourteen → **four**-teen（our 整体）
  - early → **ear**-ly（ea + r 整体）

### 5.5 元音 + 不发音 gh 组合（eigh / igh / augh / ough）
- **本质：字母组合对应一个音标 → 整体保留**（与 §4 r 控制、§5.4 元音组合同一原则）。
  `eigh` 整体发一个双元音 /eɪ/（gh 不发音），是"一元一辅 + 从后往前切"的必然结果：
  - eighteen /ˌeɪˈtiːn/：从后往前，`teen`（tiːn）拿走一个元音，前面剩的 `eigh`（eɪ + 尾随 gh）整体归第一个音节 → **eigh**-teen
  - eighty → **eigh**-ty
  - daughter → **daugh**-ter
  - naughty → **naugh**-ty
  - neighbour → **neigh**-bour
- 实现（字母层）：元音后的 `gh` 归属前一个音节（`ei` 是核、`gh` 是尾随辅音字母，划给前音节 = 组合整体保留）。

### 5.6 不发音字母标记与灰化规范（`silentIndices`）
对于单词中存在的不发音辅音或哑音字母（如 `bottle` 中第 1 个 `t`、`listen` 中的 `t`、`doubt` 中的 `b`、`autumn` 中的 `n`）：
- 采用 **`silentIndices: number[]`** 数组记录不发音字母在单词中的 0-based 下标；
  - 例：`"bottle"` 的第 1 个 `t` 下标为 `2`，记录为 `"silentIndices": [2]`；
- 渲染层在 `splitIntoGraphemes` 中将对应字母标记为 `kind: 'silent'`，样式统一应用 `text-gray-400`（灰化色呈现）；
- 官方内置词库直接写回 JSON 文件持久化，用户自定义词库写入本地 IndexedDB。

---

## 6. 校验标准（每一条都必须满足）

生成/修正 syllables 后，逐词校验：

1. **拼接回验**：各段拼接必须还原成原词（`syllables.join('') === word`）——学习卡按段高亮的前提；
2. **元音回验**：每段必须至少含一个元音字母（a/e/i/o/u/y）；整词无元音的缩写词（pm、TV、Ms 等）豁免；
3. **音标回验**：音节数必须等于音标（uk/us）中的元音音位数（含成音节辅音）；
4. 双元音 / 长元音 / r 控制组合不能被切分拆开。

---

## 7. 特例与豁免

### 7.1 特例表（字母层无解的词，见重建脚本 `OVERRIDES`）
一个字母组合对应两个音标元音，字母层无法切对，由特例表手工指定：

| 词 | 特例切分 | 原因 |
|---|---|---|
| hour /ˈaʊər/ | ho-ur | our 发两个音位 aʊ + ə |
| sour /ˈsaʊər/ | so-ur | 同上 |
| fire /ˈfaɪər/ | fi-re | ire 发 aɪ + ə |
| tired /ˈtaɪəd/ | ti-red | 同上 |
| diet /ˈdaɪət/ | di-et | ie 拆两个音位 |
| quiet /ˈkwaɪət/ | qui-et | 同上 |
| science /ˈsaɪəns/ | sci-ence | ie 拆两个音位 |
| radio /ˈreɪdiəʊ/ | ra-di-o | io 拆两个音位 |
| piano /piˈænəʊ/ | pi-a-no | 同上 |
| video /ˈvɪdiəʊ/ | vi-de-o | 同上 |
| museum /mjuˈziːəm/ | mu-se-um | 同上 |
| diary /ˈdaɪəri/ | di-a-ry | 同上 |
| really /ˈriːəli/ | re-al-ly | ea 拆两个音位 |
| poem /ˈpəʊɪm/ | po-em | oe 拆两个音位 |
| poet /ˈpəʊɪt/ | po-et | 同上 |
| crayon /ˈkreɪən/ | cray-on | ay 拆两个音位 |
| lion /ˈlaɪən/ | li-on | io 拆两个音位 |
| koala /kəʊˈɑːlə/ | ko-a-la | oa 拆两个音位 |
| vegetable /ˈvedʒtəbl/ | vege-ta-ble | 中位 e 不发音 |
| chocolate /ˈtʃɒklət/ | choco-late | 中位 o、尾 e 不发音 |
| expensive /ɪkˈspensɪv/ | ex-pen-sive | 词首元音 + 辅音簇，规则会切坏 |
| February /ˈfebruəri/ | fe-bru-a-ry | ua 连续元音核字母层拆不开（一元一辅：fe-bru）|
| weekend /ˌwiːkˈend/ | week-end | end 词尾易误伤，特例指定 |
| twenty /ˈtwenti/ | twen-ty | 一元一辅会切 twe-nty |
| grandparent /ˈɡrænpeərənt/ | grand-pa-rent | ndp 簇规则切不出 grand- 词头边界 |
| grandfather /ˈɡrænfɑːðər/ | grand-fa-ther | 同上 |
| grandmother /ˈɡrænmʌðər/ | grand-mo-ther | 同上 |
| grandpa /ˈɡrænpɑː/ | grand-pa | 同上 |
| grandma /ˈɡrænmɑː/ | grand-ma | 同上 |

### 7.2 缩写词（字母层无法表达音节）
`pm`、`TV`、`PE`、`Mr`、`Mrs`、`OK`、`UK`、`Ms` 等：无元音字母或为字母缩写，**保持整词 1 段**，豁免元音回验。

### 7.3 复合词/短语（含空格或连字符）
`ice cream`、`T-shirt`、`ping-pong`、`kung fu`、`hard-working`、`ice-skate`、`stomach ache` 等：**按成分分别切分**（ice + cream），不参与常规校验。

---

## 8. 处理流程（从音标到音节）

```
单词 + 音标(uk/us)
   │
   ├─ 0. 音标归一化（其他词库音标含非标准写法）：
   │        • ；/| 分隔的多个发音变体 → 取第一个（ˈekspɔːt；ɪkˈ- → ˈekspɔːt）
   │        • 混入的英文注释 for v. / for n. 等 → 去掉
   │        • 老式写法 əu/ou/au → əʊ/oʊ/aʊ（ˈprəuses → ˈprəʊses）
   │        • 非标准字符 ɛ/ɚ/ɝ → e/ər/ɜːr
   │
   ├─ 1. 计算音标元音数 V（双元音/长元音算 1；成音节辅音 +1；uk/us 不一致取与字母层接近的）
   │
   ├─ 2. 字母层规则切分（§3-§5）→ 段数 S
   │        ├─ S == V → 采用
   │        ├─ S > V  → 相邻合并（优先合并最短对，保持每段含元音）到 V
   │        ├─ S < V  → 拆段补足：词尾 re（sure → su-re）/ 连续元音核（ia → i-a）
   │        │           / 多核段（ena → e-na）拆到 V；仍不足 → 特例表（§7）
   │        └─ 特例表命中 → 直接用
   │
   ├─ 3. 校验（§6）：拼接回验 + 元音回验 + 音节数 = V
   │
   └─ 4. 写入 word.syllables
```

> 字母层极限：`-ism`（criticism 的 'sm'）、`-rithm`（algorithm）、`-ble`（desirable）
> 等后缀的字母不足以表达全部音位（/zəm/ 两个音位只有 1 个元音字母），
> 这类词特例表给出字母层最大段数（段数可能比音标元音数少 1-2）。

---

## 9. 词库覆盖

| 词库 | 词数 | 处理工具 |
|---|---|---|
| basewords（基础词汇）| 1195 | `scripts/rebuild-basewords-syllables.mjs` |
| CET4_T（四级）| 2607 | `scripts/rebuild-dict-syllables.mjs` |
| it-words（IT 编程）| 1700 | `scripts/rebuild-dict-syllables.mjs` |
| 2025KaoYanHongBaoShu（考研）| 6705 | `scripts/rebuild-dict-syllables.mjs` |
| 4000_Essential_English_Words（核心 4000）| 3600 | `scripts/rebuild-dict-syllables.mjs` |

所有词库已按本规范生成 syllables；复合词/缩写（含空格、连字符、全大写）保持原样。
规则调整后：`node scripts/rebuild-dict-syllables.mjs`（可加 `--dry-run` 预览）、
`node scripts/check-syllables-by-phonetics.mjs`（校验 basewords）验证。

---

## 9. 已修正的代表性错误（历史）

| 单词 | 错误切分 | 修正后 | 违反的规则 |
|---|---|---|---|
| curly | cu-rly | **cur-ly** | §4 r 控制元音 |
| colour | col-our | co-lour | §3.2 一元一辅 |
| orange | or-ange | o-range | §4（r 后元音，拆开）|
| yellow | yel-low | ye-llow | §3.2 双写辅音归后 |
| thirteen | thi-rteen | thir-teen | §4 r 控制元音 |
| morning | mo-rning | mor-ning | §4 |
| garden | ga-rden | gar-den | §4 |
| Sunday | su-nday | **sun-day** | §3.3 复合词黄金规则（day 整体）|
| headache | hea-dache | **head-ache** | §3.3 复合词黄金规则（head + ache）|
| toothache | too-thache | **tooth-ache** | §3.3 复合词黄金规则（tooth + ache）|
| grandfather | gran-dfa-ther | **grand-fa-ther** | §3.3 复合词黄金规则（grand + father）|
| grandmother | gran-dmo-ther | **grand-mo-ther** | §3.3 复合词黄金规则（grand + mother）|
| February | feb-ru-a-ry | **fe-bru-a-ry** | §3.2 一元一辅（br 归后）|
| September | se-pte-mber | **sep-tem-ber** | §3.2 多辅音簇从后往前切（pt、mb）|
| October | o-cto-ber | **oc-to-ber** | §3.2（ct 簇）|
| November | no-ve-mber | **no-vem-ber** | §3.2（mb 簇）|
| eighteen | ei-ghteen | **eigh-teen** | §5.5 元音+gh 组合整体保留 |
| Monday | mo-nday | mon-day | §3.3 |
| weekend | wee-kend | week-end | §3.3（特例）|
| bedroom | be-droom | bed-room | §3.3 |
| chocolate | choc-o-late | choco-late | §5.1 不发音元音 |

---

*本规范与 `scripts/rebuild-basewords-syllables.mjs`、`scripts/check-syllables-by-phonetics.mjs` 中的实现保持一致；规则调整时需同步修改两处脚本并重新跑校验。*
