# Vita-Design JXC Prototype (进销存全景路由系统原型)

> 本项目是专为“大型进销存(JXC)与供应链管理(SCM)”打造的综合中后台前段工程骨架。它以全量业务模块的路由映射为核心，实现了从工作台看板到具体业务单据流转的 1:1 结构级高保证还原。

## ✨ 核心工程架构与演进方向

本原型并未侧重于个别页面的高细粒度美术填充，而是将视野拔高，构建了整个企业级系统的**路由血脉与骨干航道**。

### 1. 广袤的 Router-DOM 矩阵网络
- **巨型菜单解析**：基于 `react-router-dom` 部署。底层预制了完整的菜单层级映射（商品、销售、采购、仓储物理设备、账务报表等顶级菜单），并通过 `AppShell` 完成了极度稳定的嵌套展示。
- **页面级动态元数据 (Meta Injection)**：在用户从“销售订单列表”跳转到“新增订单”或“详情页”时，系统会依托底层的纯函数映射，实时变幻页面级的 Header、Title、Breadcrumb。

### 2. 泛型化(Generic)的业务视图装配
传统手写上百个页面的思路被彻底击碎，项目大范围启用了**泛型生成(Generic Rendering)**：
- 将复杂的页面提纯归类为：`GenericCrudListPage`、`GenericFormPage`、`GenericQueryPage`、`GenericConfigPage`。
- 新增一个进销存业务线只需在枚举中声明 Key，其基础的 CRUD 路由骨架与页面装配组件将借由高阶组件自动化合成。

### 3. 主流的 React 后台底层生态
- **Core**: React 18 + TS 构建坚如磐石的强类型保障。
- **Router**: 采用安全的 HashRouter 策略防脱轨。
- **Styling**: Tailwind CSS + Lucide Icons，无缝构建现代化组件块，拒绝依赖传统厚重的定制化 CSS 包袱。

## 📦 如何在本地开启全景预览

非常轻量的环境依赖设计，拉取后即可一键点火：

```bash
# 1. 切入工程引擎机房
cd jxc-prototype

# 2. 拉取全量运转依赖
npm install

# 3. 毫秒级冷启动引擎
npm run dev
```

## 🏗 工程目录导读

- `src/App.tsx`: 系统路由中枢总闸，统筹整个 JXC 版图的跳转与保护逻辑。
- `src/data/`: 存放控制庞大菜单体系和视图枚举的硬编码引擎 (Menu/Meta Trees)。
- `src/pages/`: 包含销售、采购、入库等独立精编页面以及大量的 `GenericModulePages.tsx` 泛型克隆模版。
- `src/components/AppShell/`: 企业级标准骨架，承接了侧边导航(Sidebar)与全局多级面包屑顶栏(Header)。

---
*Enterprise Resource Planning (ERP) & JXC Core Prototype Structure.*
