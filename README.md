# Vita-Design JXC Prototype (企业级进销存高密度管理系统原型)

> 本项目是一套基于最新技术栈构建的**“中国式复杂中后台（B端）”**前端重型架构骨架。它彻底抛弃了西方 SaaS 常见的“大白空”极简风格，转而向阿里云、飞书管理后台等中国一线大厂系统对齐，实现了极致的空间压榨、极高的数据密度呈现与强悍的十万级长列表渲染性能。

## ✨ 核心特性大纲

这是一套真正的“六边形战士”架构，不仅有皮囊，更有内脏：

### 🎨 1. 像素级的高冷专业视觉设计 (Design Tokens)
- **极简 Zinc 黑白灰**：完全舍弃原版 Shadcn UI 默认带来的圆角与投影滥用。全系统以 `bg-zinc-100` 为基底，利用 `1px border-zinc-200` 进行克制的层级勾勒。
- **中国式企业级字体红线**：严打西方常见的奇数字号（13px/15px），全面收口至双数：主流程 `14px (text-sm)`，数据区 `12px (text-xs)`。
- **空间极限利用**：表单件 (Input/Select/Button) 统一死守 `32px (h-8)` 黄金高度，卡片间使用 `gap-2` 细胞级紧闭度。

### 🧠 2. 无缝多页签引擎 (Zustand Multi-Tabs)
- 摒弃了导致开发成本急剧增加、页面频闪的传统 Router 跳转。
- 使用 **Zustand** 构建全局状态中枢。你在列表页点击“新建全量组织”，系统会犹如 VS Code 一般，在顶部直接**拉起一个全新的 Tab 页签**，而原来列表页的搜索流、横向滚动条状态都会被 100% 封存保活（Keep-Alive）。

### 🚀 3. 万行数据虚拟列表墙 (TanStack Performance)
- **极限抗压渲染**：原生 Table 画 5000 行会直接炸飞浏览器。本项目引入了前沿的 `@tanstack/react-table` + `@tanstack/react-virtual` 底层库。
- 将传统 DOM 渲染替换为“无头表格 + 视窗跟踪”。即便后端吐出海量报表数据，DOM 树上永远只会有当前视窗高度的二三十个节点，达成如丝般顺滑的 60fps 体验。

### 🛡 4. 军工级防脱轨组件
- **原子权限拦截**：构建了独立的 `<AuthWrapper>` 组件，不符合权限的点（例如含有抹除高危意义的“删除/封禁”），直接遭遇 React 虚拟 DOM 阶段的物理级粉碎，并非简单的 `disabled: opacity-50`。
- **体验级 Loading 与 Empty 空置态**：系统自带高密度骨架屏（Skeleton Table）与零数据占位指引，实现 B 端产品最需要的“操作防呆闭环”。

## 🛠️ 骨干技术栈

- **Core**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v3
- **Components**: Shadcn UI (源码级暴改)
- **State Mgmt**: Zustand
- **Data Grid**: TanStack Table v8 + React Virtual
- **Form (Prep)**: React Hook Form + Zod 

## 📦 本地快速起跑指令

该工程已被高度浓缩，没有任何难以理解的 Node.js 或 Nginx 依赖障碍，确保开发环境一键起飞：

```bash
# 1. 克隆这份代码到本地
git clone https://github.com/TopVitamin/Vita-Design-JXC-Prototype.git

# 2. 进入引擎目录
cd jxc-prototype

# 3. 装载依赖引擎
npm install

# 4. 点火运行 (通常会秒级飙升到 localhost:5173)
npm run dev
```

## 🏗 主要工程路由参照表

- 路由调度核心：`src/store/tabStore.ts`
- 架构页面骨架：`src/layouts/AdminLayout.tsx`
- 十万级虚拟大表单：`src/components/DenseTable.tsx`
- 轻重交互收口案例演示：`src/pages/DataViewPage.tsx` && `src/pages/DenseFormPage.tsx`

---

*Designed & Engineered for High-Density Chinese B2B Business Solutions.*
