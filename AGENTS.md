# AGENTS.md — JXC Prototype

> 强盛进销存前端原型工程协作说明，这个是给维他命的学员们使用的。

## 项目定位

这是一个 **React + TypeScript + Vite** 的中后台原型工程，用于承接“强盛科技 2014-2015 渠道扩张期”的进销存一期业务。

目标不是直接上线，而是服务 3 件事：

- 把课程和项目文档里的业务方案落成可演示的前端原型
- 让页面结构、主链路、字段展示、状态口径更直观
- 为后续 UI 细化、真实开发、接口接入提供稳定骨架

## 当前技术栈

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React

路由模式：`HashRouter`

## 当前代码结构

```text
src/
├── app/                  # 路由、导航、页面元信息
│   ├── navigation.ts
│   └── routes.tsx
├── components/           # AppShell、通用UI组件、辅助组件
├── contracts/            # 页面/模块契约层
│   ├── types.ts
│   └── modules/
├── data/                 # 收口注册层、局部页面专属数据
│   ├── modulePages.ts
│   ├── mock.ts
│   └── salesOrderWorkspace.ts
├── mocks/                # 核心页面直接消费的 Mock 数据入口
├── pages/                # 页面组件
├── docs/                 # UI 设计与实现说明
└── utils/                # 工具函数
```

## 分层原则

### 1. 文档层

文档侧继续按真实产品经理工作方式产出：

- 模块 PRD
- 页面级 Demo PRD
- 字段清单

### 2. 契约层

前端不直接读取 PRD，而是读取 `src/contracts/` 下的模块契约。

每个模块一个文件，例如：

- `productManagement.ts`
- `purchaseOrders.ts`
- `salesDelivery.ts`

契约里定义：

- 筛选项
- 表格列
- 表单分组
- 详情分组
- 状态 Tab
- Mock 记录
- 配置页/查询页/表单页的数据结构

### 3. 实现层

页面组件按复杂度分为：

- `core`：核心业务页，单独实现
- `secondary`：次级页，可由通用骨架承接
- `placeholder`：占位页，先保留入口与定位

## 产品文档到前端代码的约束规范

### 真相源优先级

前端代码生成、修改、重构时，必须按下面顺序理解和服从信息源：

1. 字段清单
2. 业务 PRD
3. 前端 Demo 版 PRD
4. 当前项目 AGENTS、README、UI 规范、现有代码结构
5. 通用实现经验

如果信息冲突，优先级必须是：

`字段清单 > 业务PRD > 前端Demo版PRD > 现有实现习惯`

### 核心原则

- 产品文档按页面和模块组织，前端代码按契约和组件体系组织
- 前端必须忠实表达产品逻辑，但不能用逐页硬编码的方式破坏工程结构
- 写代码前必须先把产品文档转译为“页面契约”，再决定代码落点
- 能复用现有骨架、组件、契约的，不要重复实现
- 能抽成共享结构的，不要把同类逻辑复制到多个页面里

### 页面实现判断规则

生成或修改前端代码前，必须先判断当前页面属于哪类：

- `core`
  主链路核心页，允许单独实现，但底层仍要复用通用组件
- `secondary`
  标准管理页，优先通过 `contracts/modules/*.ts` + Generic 页面承接
- `placeholder`
  当前阶段只保留入口、标题、定位和扩展说明

### 代码落点规则

不同类型的信息必须写到正确位置：

- 导航、页面类型、页面深度、页面元信息：
  `src/app/navigation.ts`
- 路由注册：
  `src/app/routes.tsx`
- 模块契约定义：
  `src/contracts/modules/*.ts`
- 契约公共 helper：
  `src/contracts/modules/shared.ts`
- 核心页直用 Mock 数据入口：
  `src/mocks/*.ts`
- 模块定义收口与导出：
  `src/data/modulePages.ts`
- 页面实现：
  `src/pages/*.tsx`
- 通用组件：
  `src/components/*.tsx`

### 字段与结构约束

- 不允许跳过字段清单直接定义页面字段
- 不允许在页面组件里临时发明清单外字段名、枚举值、状态文案
- 列表列、表单字段、详情分组、状态 Tab、按钮动作，必须优先来自 PRD 和字段清单
- Demo PRD 负责描述页面结构、交互和展示方式，不替代字段清单
- 如果字段清单和前端现状不一致，应优先收敛前端契约，而不是就地修改页面绕过契约层

### 组件化与复用约束

- 不允许所有页面都按独立页面完全重写
- 不允许只为了快而复制粘贴同类页面的筛选区、表格区、详情区、表单区
- 不允许绕开 `components/Ui.tsx` 另造一套同职能基础组件
- 标准 CRUD / Query / Config 页面优先复用 Generic 骨架
- 核心页可独立实现，但必须复用既有组件、样式令牌和页面骨架规则

### 对 `modulePages.ts` 的特殊约束

- `src/data/modulePages.ts` 是收口注册层，不是主编辑区
- 不要再把完整模块定义长期堆回这个文件
- 新增模块时，优先在 `src/contracts/modules/` 新建文件，再回到 `modulePages.ts` 注册导出

### 对构建和交付的约束

- 每次结构性改动后必须执行 `npm run build`
- 只提交源码和说明文档改动，不把构建产物当作业务改动提交目标
- 如果本轮变更只做结构调整，应尽量保证页面表现不变
- 如果本轮变更涉及业务口径收敛，必须明确说明依据来自哪个字段清单或 PRD

### 禁止项

- 禁止按页面机械硬编码，完全无视现有契约层
- 禁止为了“先出效果”破坏 `app / contracts / mocks / pages` 分层
- 禁止把业务逻辑、字段定义、Mock 数据全部重新塞回一个大文件
- 禁止在没有文档依据时擅自补充重业务规则、重审批、重风控逻辑
- 禁止把视觉层优化伪装成业务实现完成

## 关键文件职责

### `src/app/navigation.ts`

统一维护：

- `ViewKey`
- 左侧导航结构
- 页面类型
- 页面深度
- 页面元信息

新增页面时，先补这里。

### `src/app/routes.tsx`

统一管理路由注册。

- 核心页手动注册
- Generic 页按视图数组自动注册
- 占位页统一兜底

### `src/contracts/modules/`

这是当前业务模块定义的主阵地。

原则：

- 一个模块一个文件
- 文件名与页面/模块语义一致
- 不要再把大段模块定义回填到 `modulePages.ts`

### `src/contracts/modules/shared.ts`

公共 helper 统一放这里，例如：

- `money`
- `buildLines`
- `buildLogs`
- `buildTimeline`
- `buildRelations`

如果多个模块都要复用，优先放到这里，不要各自复制。

### `src/data/modulePages.ts`

这里只做 **收口和导出**：

- 聚合 `crudModuleDefinitions`
- 聚合 `queryModuleDefinitions`
- 聚合 `formModuleDefinitions`
- 聚合 `configModuleDefinitions`
- 导出 `getModuleDefinition`、`getCrudModuleDefinition` 等函数

不要再把完整模块定义长期堆回这个文件。

### `src/mocks/`

给核心页面提供更清晰的 Mock 入口。

例如：

- `dashboard.ts`
- `sales.ts`
- `inventory.ts`

核心页面优先从这里拿数据，不直接从旧的 `data/mock.ts` 读取。

## 页面实现约束

### UI 组件

基础 UI 组件统一从：

- `src/components/Ui.tsx`

导入。

如需新增基础组件，优先加到 `Ui.tsx` 或 `components/` 中已有体系里，不要随意重复造轮子。

补充约束：

- 优先使用已有组件：`Button`、`Input`、`Select`、`PageTitle`、`TabBar`、`StatusPill`、`Pagination`
- 禁止在页面里自行实现同职能基础组件并与 `Ui.tsx` 并存
- 如需新增基础组件，先判断是否应该扩展 `Ui.tsx`，再考虑新增独立组件文件
- **下拉、日历、锚点弹出层**：须遵守 `src/docs/UI-DESIGN-GUIDE.md` **3.16 节（Portal + fixed 浮层规范）**；`Select`、`DateField`、`DateRangeField`、`BatchSearchInput` 已按该规范实现。新增同类交互应在 `Ui.tsx`（或统一组件层）用同一套方式扩展，**禁止**在业务页面用 `absolute` 浮层凑合、再按页面逐个「修裁切」

### 视觉规范

新页面开发前，先看：

- `src/docs/UI-DESIGN-GUIDE.md`
- `05-UI规范库/`
- `05-UI规范库/09-模块契约与原型复刻规范.md`

尤其是：

- 页面模板与骨架规范
- 组件与交互规则
- 状态权限与异常规则

实现时补充遵循：

- 文字色优先使用 `text-text-1/2/3`
- 品牌色优先使用 `bg-brand-6` / `text-brand-6`
- 分割线优先使用 `border-line-1/2`
- 阴影优先使用项目内已有阴影令牌和样式类
- 页面布局遵循 `AppShell` 的后台结构，不自行发明新的整体壳层

### 页面类型判断

如果是以下页面，优先考虑独立实现：

- 工作台
- 销售订单
- 零售收银
- 库存查询
- 收款登记
- 客户往来查询

如果是标准管理页，可优先走契约 + Generic 页面：

- 商品管理
- 客户管理
- 供应商管理
- 仓库管理
- 采购订单
- 采购入库
- 采购退货
- 销售出库
- 调拨
- 盘点
- 报损

## 新增/修改模块的推荐流程

1. 先确认对应 PRD、字段清单、页面范围
2. 在 `src/contracts/modules/` 新建或修改对应模块契约
3. 如是新页面，补 `src/app/navigation.ts`
4. 如需要新路由，补 `src/app/routes.tsx`
5. 如是核心页，修改 `src/pages/` 下独立页面
6. 如是次级页，优先让 Generic 页面消费契约
7. 执行 `npm run build` 验证

### 命名规范

- 页面文件：`PascalCasePage.tsx`
- 组件文件：`PascalCase.tsx`
- 工具文件：`camelCase.ts`
- 模块契约文件：与模块语义一致的小驼峰或业务语义命名，例如 `purchaseOrders.ts`

### 路由维护说明

- 当前固定路由入口在 `src/app/routes.tsx`
- 页面导航元信息统一维护在 `src/app/navigation.ts`
- 不再回到旧结构里通过 `src/App.tsx` 或 `src/data/mock.ts` 直接维护导航和路由

## 当前维护原则

- 优先保证业务口径和页面结构一致，再谈视觉细化
- 优先抽离重复定义到 `contracts/modules/shared.ts`
- 优先维护模块契约，不要先改散落页面
- 不要把构建产物改动混进源码变更

## 注意事项

- `dist/` 是构建产物，不作为业务改动提交目标
- `modulePages.ts` 现在是注册层，不是主编辑区
- `AGENTS.md` 是当前项目协作的唯一主说明文件
