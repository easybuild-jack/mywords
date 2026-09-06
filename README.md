# ⚡ SynapWord (突触记词)

> **专为深度英语学习者打造的音节拼读、构词法拆解与肌肉记忆闭环默写系统。**

---

## ✨ 核心特性

- 🧠 **认知突触联结**：通过音节、重音、词根词缀建立对英语单词的立体神经记忆网络。
- 🎹 **键盘肌肉记忆默写**：支持盲打拼读、音标默写，听音辨字与击键反馈相结合，打磨深度拼写记忆。
- 🔬 **音节规则拼读拆解**：针对复杂长难词进行音节切分与音标标注，符合自然拼读规律。
- 📚 **词库与生错词本**：词库灵活管理、生词错词自动归集沉淀与艾宾浩斯复习流。
- 🎨 **沉浸式科技美学**：多款深度定制的赛博暗黑、未来科幻主题皮肤与极致微交互设计。

---

## 🚀 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始学习。

### 3. 构建生产版本

```bash
npm run build
npm run start
```

---

## 🛠️ 技术栈

- **前端框架**：Next.js 16 (App Router) + React 19 + TypeScript
- **样式与动效**：Tailwind CSS v4 + Framer Motion + Lucide React
- **本地存储与数据库**：Dexie.js (IndexedDB) + Zustand (持久化状态)
- **音频引擎**：Howler.js + Web Speech Synthesis API
