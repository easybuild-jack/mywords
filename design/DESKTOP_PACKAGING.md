# MyWords 桌面化安装可行性分析

> 结论先行：**可行，且有低中高三档成本不同的路径**。推荐「PWA 先落地 → Tauri 做最终桌面安装包」的两步走策略。

---

## 1. 项目现状盘点（决定可行性的关键事实）

| 事实 | 来源 | 对桌面化的影响 |
|------|------|----------------|
| 数据全部存在浏览器 IndexedDB（Dexie.js），本地优先 | `package.json`：dexie / dexie-react-hooks | ✅ 最大利好：天然离线架构，不依赖远程数据库 |
| 词库是静态 JSON / mp3 音频，放在 `public/` | public/ 下 13 个 json、61 个 mp3 | ✅ 可随安装包打包，完全离线 |
| 存在 3 个服务端 API 路由 | `src/app/api/` | ⚠️ 唯一的改造障碍点 |
| `/api/ai/chat`：AI 代理转发（用户自带 API Key，转发到 OpenAI 兼容端点） | `src/app/api/ai/chat/route.ts` | ⚠️ 需迁移或改造（见下） |
| `/api/words/collect`、`/api/words/pending`：生词云端同步，Upstash Redis 为**可选**配置，无配置时回退本地 JSON 文件 | `src/lib/server/collectStore.ts` | ⚠️ 云同步功能在纯静态版需另想方案 |
| Next.js 16 App Router，无自定义 server，next.config 为空 | `next.config.ts` | ✅ 无特殊定制，改造成本低 |
| 无 Node 原生依赖（无 better-sqlite3 等 native 模块） | `package.json` | ✅ 打包兼容性好 |

**核心判断：这个项目本质是"本地优先"应用，服务端只承担 AI 代理和可选云同步两个薄功能，桌面化天然可行。**

---

## 2. 三条路线评估

### 路线 A：PWA（渐进式 Web App）— 成本最低，先做

**做法**：添加 `manifest.json` + 图标 + Service Worker，用户在 Edge/Chrome 中点"安装应用"，桌面出现快捷方式。

- 优点：改动极小（1-2 天）；Windows 10/11 自带 Edge 支持独立窗口运行；不需要改任何 API 路由（只要本地 `next start` 在跑，或配合 SW 缓存）。
- 缺点：本质仍是浏览器壳；离线需要做静态化或 SW 缓存策略；无原生能力（文件读写、系统通知升级等）。
- 风险点：Service Worker 对 Next.js App Router 的缓存粒度要小心，否则更新后出现新旧资源混用。

### 路线 B：Tauri v2（Rust + 系统 WebView2）— 推荐的最终形态

**做法**：前端做 `output: 'export'` 静态导出，Tauri 壳加载静态资源，系统级安装包（MSI/NSIS）。

- 优点：安装包约 10MB（对比 Electron 200MB）；内存占用小；原生窗口、托盘、自动更新都是内置能力；Windows 自带 WebView2（Win10 1803+ 基本全覆盖）。
- 需要解决的 3 个点（都有成熟方案）：
  1. **AI 代理路由**：两条路 — ① 迁移为 Tauri Rust command（前端 `invoke` 调用，替代 fetch `/api/ai/chat`），逻辑就是转发 HTTP，Rust 侧约 50 行；② 若上游 API 允许 CORS，前端直连（API Key 已在用户手里，本来就不经服务端存储）。
  2. **生词云同步**：Upstash Redis 是 REST API 且支持浏览器直连（官方文档明确支持 CORS），可把 `collectStore` 逻辑移到前端；或改为 Tauri command 写本地文件。
  3. **词库/音频资源**：放 Tauri 的 `resources`，体积约几十 MB，随安装包分发，无问题。
- 风险点：需要安装 Rust 工具链；首次编译较慢；WebView2 版本差异（极少数旧系统需装 WebView2 Runtime）。

### 路线 C：Electron — 数据兼容最稳，包体最大

**做法**：Electron 主进程里直接跑 Next.js 生产服务（`next start` 或 `custom server`），渲染进程加载 localhost。

- 优点：3 个 API 路由**原样保留，零改动**；Node 生态完整（以后加本地文件导出、打印等能力都方便）；社区方案最多。
- 缺点：安装包 150-200MB、内存占用高（每实例一个完整 Chromium）；需要处理打包时排除 devDependencies、asar 配置、数据目录（IndexedDB 存在 Electron 的 userData 目录，与浏览器数据不互通）。
- 适用场景：如果想"零改代码快速拥有桌面版"，Electron 其实是最省事的——代价是体积。

---

## 3. 对比总览

| 维度 | PWA | Tauri v2 | Electron |
|------|-----|----------|----------|
| 改造成本 | ★☆☆ 极低 | ★★☆ 中 | ★★☆ 中 |
| 安装包体积 | 0 | ~10 MB | 150-200 MB |
| 桌面体验 | 弱（浏览器壳） | 好（原生） | 好（原生） |
| API 路由兼容 | 依赖本地服务 | 需迁移（工作量小） | 完全兼容 |
| 离线能力 | 需 SW 策略 | 完全离线 | 完全离线 |
| 后续扩展性 | 无原生能力 | Rust 生态 | Node 生态 |
| 维护热度/社区 | 浏览器标准 | 快速上升 | 成熟但偏重 |

---

## 4. 推荐路径：两步走

**第一步（低成本验证）：做 PWA**
- 加 manifest + 图标 + 基础 Service Worker；
- 验证 IndexedDB 数据在"安装后的独立窗口"里稳定可用；
- 这一步的产物（图标、离线策略）后续路线都能复用。

**第二步（最终形态）：Tauri v2 打包**
- `next.config.ts` 加 `output: 'export'` 做静态导出（需先确认所有页面无 SSR 依赖，从代码看是客户端为主的 SPA，风险低）；
- `/api/ai/chat` 迁为 Tauri command 或前端直连；
- Upstash 同步走 REST 直连（浏览器本来就能直连 Upstash REST）；
- 产出 MSI/NSIS 安装包，支持自动更新。

**如果只想要"最快出安装包、一行业务代码不改"**：直接选 Electron（主进程跑 next start），接受 200MB 体积。

---

## 5. 风险与待确认项

1. **IndexedDB 数据迁移**：用户若已在浏览器里积累了学习数据，桌面安装版的 IndexedDB 是全新目录，需提供导出/导入功能（Dexie 有现成的 export/import 插件，工作量小）。
2. **静态导出兼容性验证**：需全局排查 `useSearchParams`、动态路由等在 `output: 'export'` 下的要求（Svelte/React 客户端组件一般没问题，但要实际构建验证）。
3. **AI 请求的 CORS**：若选择前端直连上游 AI 端点，部分 OpenAI 兼容服务不允许浏览器跨域调用——Tauri command 方案可绕开，不受此限制。
4. **代码签名**：正式分发的 Windows 安装包若无签名，SmartScreen 会告警；个人使用可忽略，对外分发需要证书（按年付费）。

---

*分析时间：2026-09-20。仅分析，未改动任何代码。*
