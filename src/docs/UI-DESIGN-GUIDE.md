# JXC Prototype UI 设计规范

> 本文档供人类和 AI 阅读理解，用于指导后续新页面/模块开发。

---

## 1. 概述与设计理念

### 1.1 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript + Vite |
| 路由 | React Router v6（HashRouter） |
| 样式 | Tailwind CSS + CSS 自定义属性 |
| 图标 | Lucide React |
| 构建工具 | Vite |

### 1.2 设计理念

- **业务优先**：UI 是业务逻辑的外壳，一切从业务场景出发
- **数据驱动**：列表页以数据表格为核心，详情页以字段展示为主
- **可复用架构**：通用模块（Generic）通过配置驱动，高频定制页（Custom）独立开发
- **渐进增强**：列表 → 详情 → 编辑页逐层展开，避免一步到位

### 1.3 模块类型分类

| 类型 | 标识 | 说明 | 示例页面 |
|------|------|------|---------|
| 核心模块 | `core` | 主链路，高保真实现 | 销售订单、零售收银、库存查询、收款登记、客户往来 |
| 辅助模块 | `secondary` | 支持链路，中等保真 | 采购订单、销售出库、调拨管理 |
| 占位模块 | `placeholder` | 骨架页，提示扩展方向 | 销售汇总、用户权限 |

### 1.4 页面类型分类

| 页面类型 | 说明 | 路由模式 |
|----------|------|----------|
| `dashboard` | 工作台/首页 | `/{view}` |
| `list` | 列表页（含增删改查） | `/{view}` |
| `detail` | 详情页（只读展示） | `/{view}/:recordId` |
| `form` | 表单页（单表录入） | `/{view}` |
| `query` | 查询页（多维筛选+结果） | `/{view}` |
| `cashier` | 收银台（实时交易） | `/{view}` |
| `config` | 配置页 | `/{view}` |

---

## 2. 设计令牌（Design Tokens）

### 2.1 颜色系统

所有颜色通过 CSS 自定义属性定义，确保全局一致性和主题切换能力。

```css
/* 品牌色 - 蓝色系 */
--brand-1: #e8f3ff;  /* 品牌浅色背景 */
--brand-2: #c4dcff;  /* 品牌次浅色 */
--brand-3: #94bfff;  /* 品牌中间色 */
--brand-4: #6aa1ff;  /* 品牌次深色 */
--brand-5: #4080ff;  /* 品牌深色 */
--brand-6: #165dff;  /* 主品牌色（按钮/链接/强调） */
--brand-7: #0e42d2;  /* 品牌最深色（hover 态） */

/* 文字色 */
--text-1: #1d2129;   /* 主要文字 */
--text-2: #4e5969;  /* 次要文字 */
--text-3: #86909c;  /* 辅助文字/占位符 */
--text-4: #c9cdd4;  /* 禁用文字 */
--text-white: #ffffff;

/* 填充色 */
--fill-1: #ffffff;   /* 纯白背景 */
--fill-2: #f7f8fa;   /* 浅灰背景（表格表头/页面背景） */
--fill-3: #f2f3f5;   /* 中灰背景（disabled/分割线） */
--fill-4: #e5e6eb;   /* 深灰背景 */

/* 线条色 */
--line-1: #f2f3f5;   /* 最浅分割线 */
--line-2: #e5e6eb;   /* 次浅分割线（页面内容分割） */
--line-3: #c9cdd4;   /* 中等分割线（输入框边框） */
--line-4: #86909c;   /* 深分割线 */

/* 语义色 */
--success: #00b42a;  /* 绿色-成功/通过 */
--warning: #ff7d00;  /* 橙色-警告/待处理 */
--danger: #f53f3f;   /* 红色-危险/驳回/异常 */

/* 页面背景 */
background: #f5f7fa; /* 整体页面底色 */
```

**Tailwind 映射**（在 `tailwind.config.ts` 中定义）：

```ts
colors: {
  brand: { 1~7: "var(--brand-1~7)" },
  text: { 1~4, white: "var(--text-1~4, white)" },
  fill: { 1~4: "var(--fill-1~4)" },
  line: { 1~4: "var(--line-1~4)" },
  success: "#00b42a",
  warning: "#ff7d00",
  danger: "#f53f3f",
}
```

### 2.2 字体

```css
font-family: "PingFang SC", "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
```

| 用途 | 字号 | 字重 | 颜色 |
|------|------|------|------|
| 页面大标题（H1） | 22px（lg: 24px） | 600（semibold） | text-1 |
| 区块标题（H2） | 16px | 600 | text-1 |
| 正文 | 14px | 400 | text-1 |
| 辅助说明 | 13px | 400 | text-3 |
| 表格表头 | 14px | 400 | text-2 |
| 表格内容 | 14px | 400 | text-2 |

### 2.3 间距系统

基于 4px 网格系统，常用间距：

| token | 值 | 用途 |
|-------|---|------|
| `space-1` | 4px | 紧凑元素内部间距 |
| `space-2` | 8px | 小间距 |
| `space-3` | 12px | 中小间距 |
| `space-4` | 16px | 中间距（组件内主间距） |
| `space-5` | 20px | 中大间距 |
| `space-6` | 24px | 大间距（区块间） |
| `gap-3` | 12px | flex 子元素间距 |
| `gap-4` | 16px | flex 子元素大间距 |
| `gap-5` | 20px | 区块内元素间距 |

### 2.4 阴影

| token | 值 | 用途 |
|-------|---|------|
| `shadow-panel` | `0 10px 30px rgba(15,35,95,0.05)` | 页面内容区容器 |
| `shadow-soft` | `0 6px 18px rgba(15,35,95,0.06)` | Surface 组件/次级容器 |
| `shadow-card` | `0 6px 18px rgba(15,35,95,0.04)` | 卡片组件 |
| `shadow-dropdown` | `0 12px 32px rgba(29,33,41,0.14)` | 下拉菜单/弹出层 |
| `shadow-drawer` | `0 16px 40px rgba(29,33,41,0.18)` | 抽屉组件 |

### 2.5 圆角

| 场景 | 圆角 |
|------|------|
| 按钮/输入框 | `rounded-md`（6px） |
| 卡片/Surface | `rounded-lg`（8px） |
| 页面容器 | `rounded-xl`（12px） |
| 下拉/弹出层 | `rounded-xl`（12px） |
| 头像/徽章 | `rounded-full` |

### 2.6 Z-Index 层

| 层级 | 值 | 用途 |
|------|---|------|
| `z-dropdown` | 100 | 下拉菜单、Tooltip |
| `z-drawer` | 200 | 抽屉组件 |
| `z-modal` | 300 | 模态对话框 |

---

## 3. 基础组件库

> 所有组件定义在 `src/components/Ui.tsx`，导出供全站使用。

### 3.1 Button

```tsx
<Button tone="primary" size="md" icon={<Plus />}>新增订单</Button>
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `tone` | `"primary"` \| `"default"` \| `"ghost"` | 视觉基调 |
| `size` | `"md"` \| `"sm"` \| `"icon"` | 尺寸 |
| `icon` | `ReactNode` | 左侧图标（可选） |
| `onClick` | `() => void` | 点击回调 |

**tone 对应样式**：
- `primary`：品牌蓝底白字，`bg-brand-6 hover:bg-brand-7`
- `default`：白底灰边，`bg-white border border-line-2 hover:bg-fill-2`
- `ghost`：透明底，`bg-transparent hover:bg-fill-2`

**size 对应高度**：`md=36px`，`sm=32px`，`icon=32px`

### 3.2 Input / SearchInput

```tsx
// 普通输入框
<Input value={v} onChange={(v) => setV(v)} placeholder="请输入" />

// 搜索输入框（带搜索图标）
<SearchInput value={kw} onChange={setKw} placeholder="单号/客户/仓库" />
```

### 3.3 Select

```tsx
<Select
  value={v}
  onChange={(v) => setV(v)}
  options={["选项A", "选项B", "选项C"]}
  placeholder="请选择"
/>
```

下拉选项层已按 **3.16 浮层 Portal 规范** 实现（`Ui.tsx`），可放在带 `overflow-hidden` / `overflow-x-auto` 的筛选卡片、表格容器内使用，无需页面单独处理裁切。

### 3.4 DateField / DateRangeField

```tsx
// 单日期
<DateField value="2025/04/03" onChange={(v) => setV(v)} />

// 日期范围
<DateRangeField
  value={{ start: "2025/04/01", end: "2025/04/30" }}
  onChange={(range) => setRange(range)}
/>
```

日历面板同样遵循 **3.16**，与 `Select` 一致不受外层 `overflow` 裁切。

### 3.5 PageTitle

页面大标题组件，包含标题、右侧操作按钮区、辅助说明。

```tsx
<PageTitle
  title="销售订单详情"
  actions={<Button tone="primary">编辑</Button>}
>
  订单号｜来源｜创建人
</PageTitle>
```

**布局**：移动端纵向堆叠（flex-col），大屏水平排列（lg:flex-row）。

### 3.6 Surface

内容区块容器，带白色背景和 `shadow-soft`。

```tsx
<Surface>内容</Surface>
```

### 3.7 TabBar

横向 Tab 切换组件，源码：`src/components/Ui.tsx` → `TabBar`。

#### 三种形态（`variant`）

| 取值 | 适用场景 |
|------|----------|
| **`pill`**（默认） | 详情页子区块切换、与正文间距较大的独立 Tab 带。圆角描边按钮样式。 |
| **`segmented`** | 需要「分段控件」弱工具感时使用（浅灰托盘 + 白底选中项）。 |
| **`underline`** | **列表页顶部「按单据状态筛选」** 等场景：底部分割线 + 选中项蓝色字 + **居中短墨条**，与 Ant Design `Tabs type="line"` 一致。 |

```tsx
<TabBar
  variant="underline"
  items={[
    { key: "all", label: "全部" },
    { key: "pending", label: "待审核" },
  ]}
  activeKey={activeTab}
  onChange={(key) => setActiveTab(key)}
/>
```

#### `underline` 视觉规范（团队约定）

- **整根分割线**：`TabBar` 根节点带 `border-b border-line-1`，与下方筛选区形成明确层级，不要用 Tab 与筛选之间「大块空白」代替分割。
- **选中态**：文案 `text-brand-6` + `font-medium`；指示器为 **水平居中、宽约 32px（`w-8`）、高 2px** 的 `brand-6` 色条（`::after`），压在底线上，**不要用整格 Tab 宽度的 `border-b-2`**，避免与「短墨条」参考不一致。
- **未选中**：`text-text-2`，悬停可略偏主色（如 `hover:text-brand-6/90`）。
- **Tab 按钮内边距（组件内已写死，勿在业务里重复造轮子）**：上 `pt-2`、下 `pb-3`，保证短墨条与文字、底线的呼吸感；若全项目要统一调整，只改 `Ui.tsx` 一处。
- **无障碍**：`role="tablist"` / `tab` / `aria-selected` 已由组件输出，业务侧保持 `items.key` 稳定即可。

#### 与「筛选区同卡」时的外边距（业务侧）

列表页将 `underline` Tab 与筛选表单放在**同一张白卡片**内时，Tab 外建议包一层：

- `className="bg-white px-4 pt-2.5"`（与卡片上边框的留白；**推荐 `pt-2.5`～`pt-3`**，忌 `pt-1` 贴顶、忌 `pt-4` 以上过大）
- 筛选区：`px-4 py-4`，与 Tab 区之间**不再**单独套一层带灰底的条，分割线仅依赖 `TabBar` 自带 `border-b`。

**参考实现**：`src/pages/PurchaseModulePages.tsx` → `PurchaseOrdersPage`（状态 Tab + 数量角标 + 查询表单同卡）。

### 3.8 StatusPill

状态徽章/标签。

```tsx
<StatusPill tone="green">已完成</StatusPill>
<StatusPill tone="orange">待审核</StatusPill>
<StatusPill tone="red">已驳回</StatusPill>
<StatusPill tone="blue">处理中</StatusPill>
<StatusPill tone="gray">已关闭</StatusPill>
```

### 3.9 Table（原生）

使用原生 `<table>` 元素，配合 Tailwind 类名。表格容器使用 `overflow-hidden rounded-xl border border-line-1 shadow-soft`。

**表头**：`bg-fill-2 text-left text-text-2`，高度 `h-[44px]`
**行**：`h-[44px] border-b border-line-1 hover:bg-hover`
**固定列**：`sticky left-0 z-10 bg-fill-1`

### 3.10 Pagination

分页组件，放在表格下方。

```tsx
<Pagination
  total={128}
  currentPage={currentPage}
  pageSize={pageSize}
  onPageChange={setCurrentPage}
  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
/>
```

### 3.11 FilterField / FilterActions

筛选区容器组件。

```tsx
<FilterField label="客户名称">
  <Select value={v} onChange={setV} options={...} />
</FilterField>

<FilterActions
  onPrimaryClick={handleSearch}
  onSecondaryClick={handleReset}
/>
```

### 3.12 TableSortHeader

可排序表头单元格。

```tsx
<TableSortHeader
  label="订单金额"
  sortKey="amount"
  currentSort={sortConfig}
  onSort={handleSort}
  align="right"
/>
```

### 3.13 Checkbox

```tsx
<Checkbox checked={isChecked} onChange={(checked) => setChecked(checked)} />
```

### 3.14 Drawer

右侧滑出抽屉，用于高级搜索等场景。

```tsx
<Drawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="高级搜索"
  footer={<><Button>取消</Button><Button tone="primary">搜索</Button></>}
>
```

- 默认宽度：`max-w-[680px]`
- overlay 点击关闭
- body 滚动锁定

### 3.15 FormField / TextArea / HintBox

表单辅助组件。

```tsx
<FormField label="备注说明" required>
  <TextArea value={v} onChange={setV} />
</FormField>

<HintBox type="info" message="提示信息" />
```

### 3.16 浮层与弹出层（Portal 统一规范）

**问题**：列表筛选区、表格区常用 `rounded-lg` + `overflow-hidden`（或 `overflow-x-auto`）控制圆角与横向滚动。子节点若用 **`position: absolute` + `top: 100%`** 挂在表单项下方，浮层仍是卡片 DOM 子树，会被 **`overflow` 裁切**，表现为下拉、日历「只露一半」或完全看不见。

**原则**：凡「锚在某一控件附近、盖住下方内容」的交互层（下拉列表、日期面板、批量录入大面板、自定义气泡菜单等），**默认不得在业务页面里用纯 absolute 凑合**；应统一为 **Portal 挂到 `document.body` + `position: fixed` + 与锚点对齐**，与列表卡片是否 `overflow-hidden` 解耦。

#### 实现清单（新增同类组件时必做）

1. **触发区与面板分离 ref**：如 `triggerRef`（仅触发条/按钮）、`popoverRef`（浮层根节点）。
2. **挂载**：`createPortal(面板节点, document.body)`；渲染前判断 `typeof document !== "undefined"`（兼容构建/SSR 习惯）。
3. **定位**：根据 `triggerRef.current.getBoundingClientRect()` 设置 `top = rect.bottom + 间距`、`left = rect.left`；`minWidth` 至少不小于触发器宽度（或与设计稿一致的最小宽）。
4. **视口边界**：`left` 在 `8px` 与 `window.innerWidth - 面板宽 - 8` 之间夹紧，避免贴右被裁。
5. **层级**：使用 `Ui.tsx` 顶部常量 **`FLOATING_PANEL_Z`（当前 320）**，保证高于卡片、表头 sticky、一般 `z-50` 内容；**不要**各组件随意写 magic number。
6. **滚动与缩放**：`window` 上监听 **`scroll`（`capture: true`，包含内部滚动容器）** 与 **`resize`**，在打开期间更新位置；关闭时移除监听。
7. **点击外部关闭**：`mousedown` 判断目标既不在 `triggerRef` 内也不在 `popoverRef` 内再关闭；**仅在下拉打开时注册监听**，避免无意义全局监听。
8. **大面板高度**：对可能很高的浮层设置 **`max-height: min(设计上限, calc(100vh - 余量))`**，内部 **`overflow-y: auto`**，避免伸出视口底部仍「像被挡住」。

#### 已在 `Ui.tsx` 落地的组件（直接复用，勿重复造轮子）

| 组件 | 说明 |
|------|------|
| `Select` | 可搜索、选项列表 |
| `BatchSearchInput` | 采购单号等批量精确匹配大弹层 |
| `DateField` | 单日历 |
| `DateRangeField` | 日期范围 |

新增下拉/浮层类组件时，**复制上述同一套逻辑**（或抽成内部 hook 后再接新 UI），不要只改「当前报问题的页面」。

#### 反模式（禁止依赖）

- 在页面里再包一层 `overflow-visible`「专门给某个下拉救火」——根因未除，换容器又坏。
- 浮层仍放在筛选卡片内部且仅 `absolute` + 抬 `z-index`——**无法越过父级 `overflow-hidden`**。

---

## 4. 页面结构模式

### 4.1 列表页（List Page）

**文件**：`src/pages/SalesOrdersPage.tsx`（定制）或 `GenericCrudListPage`（通用）

**结构**：

```
TabBar（状态筛选）          ← 横向 Tab
FilterBar（搜索过滤区）     ← 条件筛选 + 搜索 + 操作按钮
ActionBar（批量操作行）     ← 选中后出现
Table（数据表格）           ← 主体内容
Pagination（分页）           ← 底部
```

**推荐变体（状态筛选为主入口时）**：将「状态 Tab + 筛选表单」合并为**一张卡片**，Tab 使用 `TabBar variant="underline"`，详见下文 **4.1.1**。

**FilterBar 布局**：
- 外层：`rounded-lg border border-line-1 bg-white px-4 py-3.5`
- 内部使用 `flex flex-wrap items-end gap-5`
- 每行用 `FilterField` 包裹，`gap-5` 控制间距

**Table 布局**：
- 容器：`overflow-hidden rounded-xl border border-line-1 shadow-soft`
- 表头：固定背景色 `bg-fill-2`，行高 `h-[44px]`
- 表体行高：`h-[44px]`，hover `bg-hover`
- 支持 sticky 列（如复选框、编号列）
- 最后一列操作按钮居中 `text-center`

### 4.1.1 列表页：状态横线 Tab + 筛选区（通用模版）

**用途**：采购/销售/库存等列表页，顶部按「单据状态」快速切换，下方为同一套查询条件。与详情页内的 `pill` Tab 区分：**列表状态筛选用 `underline` + 同卡布局**。

**版式要点**：

1. 外层一张卡：`section` + `rounded-lg border border-line-1 bg-white shadow-soft` + `overflow-hidden`。
2. **上区**：仅包 Tab — `div.bg-white.px-4.pt-2.5`（顶距可按产品微调 `pt-2` / `pt-3`）。
3. **下区**：筛选表单 — `div.px-4.py-4`，与 Tab 之间只靠 `TabBar` 的 `border-b` 分割，不再加第二层灰底栏。
4. Tab 与表格工具栏、表格之间仍可用页面级 `gap-4` 分隔。

**可复制骨架**：

```tsx
<section className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft">
  <div className="bg-white px-4 pt-2.5">
    <TabBar
      variant="underline"
      items={STATUS_TABS.map((tab) => ({
        key: tab,
        label: (
          <span className="flex items-center whitespace-nowrap">
            {tab}
            {/* 可选：数量角标；当前 Tab 建议与主色一致，如 text-brand-6/85 */}
          </span>
        ),
      }))}
      activeKey={activeTab}
      onChange={(key) => {
        setActiveTab(key);
        setCurrentPage(1);
      }}
    />
  </div>
  <div className="px-4 py-4">
    {/* 查询字段网格 + 展开/重置/搜索 等操作 */}
  </div>
</section>
```

**与组件职责分界**：短墨条、底线、Tab 内边距由 **`TabBar` `underline`** 实现；卡片圆角、顶距 `pt-2.5`、筛选区内边距由**页面**实现。新增列表页时优先复制上述结构，避免再引入一套自定义 Tab 样式。

### 4.2 详情页（Detail Page）

**文件**：`src/pages/SalesOrderDetailPage.tsx`

**结构**：

```
PageTitle（标题 + 操作按钮）
DetailHeaderStrip（关键字段概览，grid 布局）
TabBar（Tab 切换）
  ├── items Tab：DetailMetricStrip + 商品明细 + 侧边汇总
  ├── flow Tab：审批/履约时间轴
  ├── logs Tab：操作日志
  └── related Tab：备注 + 关联单据
```

**DetailHeaderStrip**：
- 外层：`grid gap-x-5 gap-y-3 rounded-xl border border-line-1 bg-white px-4 py-3.5 shadow-card`
- 响应式：`md:grid-cols-2 xl:grid-cols-4`
- 标签：`text-[13px] text-text-3`
- 值：`text-[14px] text-text-1`

**两栏布局**：
- 左侧主内容：`minmax(0,1fr)`
- 右侧边栏：`320px` 固定宽度
- 使用 `xl:grid-cols-[minmax(0,1fr)_320px]`

### 4.3 编辑页（Edit Page）

**文件**：`src/pages/SalesOrderEditPage.tsx`

**结构**：

```
PageTitle
DetailHeaderStrip（只读关键信息）
FormArea（可编辑字段区）
  ├── Section 1：基础信息
  ├── Section 2：明细信息
  └── ...
FooterActions（底部操作栏）
  └── 返回列表 | 保存草稿 | 提交审核
```

### 4.4 新增页（Create Page）

**文件**：`src/pages/SalesOrderCreatePage.tsx`

与编辑页结构类似，但为空状态，无预填数据，底部操作通常为"保存草稿"和"提交审核"。

### 4.5 查询页（Query Page）

**文件**：`src/pages/InventoryQueryPage.tsx`

**结构**：

```
FilterBar（筛选条件行）
ResultCards/SummaryStrip（汇总指标）
Table（结果表格）
Pagination
```

### 4.6 收银台页面（Cashier Page）

**文件**：`src/pages/RetailCashierPage.tsx`

**结构**：

```
左侧：商品搜索/录入区 + 购物清单
右侧：结算信息 + 收款操作区
```

### 4.7 表单页（Form Page）

**文件**：`src/pages/ReceiptEntryPage.tsx`

**结构**：

```
PageTitle
FormArea（单表单录入）
  └── FormField 列表，垂直排列
FooterActions
```

---

## 5. 布局规范

### 5.1 AppShell 外层结构

```
AppShell
├── Header（固定高度 54px）
│   ├── Logo + 系统名称
│   ├── 全局搜索框（md+ 显示）
│   └── 工具按钮 + 用户头像
├── Sidebar（可折叠侧边栏）
│   ├── 导航分组
│   │   ├── 分组图标 + 名称
│   │   └── 子菜单项（可展开）
│   └── 折叠/展开切换按钮
└── Main Content Area
    ├── Breadcrumb（当前路径提示）
    └── Page Container（白色圆角卡片，p-4/5/6）
```

**Header 高度**：`h-[54px]`，背景 `bg-brand-6`，文字白色。

**Sidebar**：
- 展开宽度：`w-[200px]`
- 折叠宽度：`w-14`（仅显示图标）
- 折叠时子菜单以悬浮 Popover 展示

**Main Content**：
- 外层：`min-h-0 flex-1 overflow-hidden`
- 内层：`min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4 lg:p-5`
- 页面容器：`min-h-0 flex-1 overflow-auto rounded-lg bg-white p-4 shadow-panel sm:p-5 lg:rounded-xl lg:p-6`

### 5.2 响应式断点

| 断点 | 宽度 | 典型场景 |
|------|------|---------|
| `sm` | 640px | 大手机横屏 |
| `md` | 768px | 平板竖屏 |
| `lg` | 1024px | 平板横屏/小笔记本 |
| `xl` | 1280px | 桌面 |

### 5.3 内容区内边距

- 移动端（`p-3`，即 12px）
- 小屏平板（`sm:p-4`，即 16px）
- 大屏（`lg:p-6`，即 24px）
- 页面标题下方间距：`pb-3`（12px）

### 5.4 区块间距

- 同一页面内相邻区块：`gap-4`（16px）
- 大区块间：`gap-5` 或 `gap-6`

---

## 6. 导航与路由规范

### 6.1 路由配置

使用 React Router v6 HashRouter，所有路由定义在 `src/App.tsx`。

```tsx
// 固定路由（Custom 页面）
<Route path="/sales-orders" element={<SalesOrdersPage />} />
<Route path="/sales-orders/new" element={<SalesOrderCreatePage />} />
<Route path="/sales-orders/:orderId/edit" element={<SalesOrderEditPage />} />
<Route path="/sales-orders/:orderId" element={<SalesOrderDetailPage />} />

// 动态路由（Generic 页面，自动生成）
{crudModuleViews.map((view) => (
  <Route key={`${view}-list`} path={`/${view}`} element={<GenericCrudListPage view={view} />} />
))}
{crudModuleViews.map((view) => (
  <Route key={`${view}-new`} path={`/${view}/new`} element={<GenericCrudCreatePage view={view} />} />
))}
```

### 6.2 URL 设计

| 操作 | URL 格式 |
|------|----------|
| 列表 | `/{view}` |
| 新增 | `/{view}/new` |
| 详情 | `/{view}/:recordId` |
| 编辑 | `/{view}/:recordId/edit` |
| 查询页 | `/{view}` |
| 表单页 | `/{view}` |
| 配置页 | `/{view}` |

### 6.3 Shell 元信息

`AppShell` 顶部显示当前位置，通过 `getShellMeta()` 根据路由动态生成面包屑文案。

### 6.4 导航数据

导航配置在 `src/data/mock.ts` 的 `inventoryNavGroups` 数组中，每个 `NavGroup` 包含分组 ID、名称和子页面列表。

```tsx
export type NavChild = {
  key: ViewKey;          // 路由标识
  label: string;         // 显示名称
  pageType: PageType;    // 页面类型
  depth: PageDepth;       // 模块重要程度
  description: string;   // 功能描述
  isIncomplete?: boolean; // 是否未完善
};
```

---

## 7. 状态管理规范

### 7.1 本地状态（useState）

页面级状态优先使用 `useState`，无需全局共享的状态一律 local。

**常见页面状态**：

```tsx
// 列表页
const [keyword, setKeyword] = useState("");
const [activeTab, setActiveTab] = useState("全部");
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);

// 编辑/新增页
const [formData, setFormData] = useState({ ... });
const [errors, setErrors] = useState<Record<string, string>>({});

// Drawer / Modal
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
```

### 7.2 派生状态（useMemo）

所有计算逻辑通过 `useMemo` 包装，避免重复计算。

```tsx
const filteredData = useMemo(() => {
  return data.filter(...).sort(...);
}, [dep1, dep2, dep3]);
```

### 7.3 路由参数（useParams）

详情/编辑页通过 URL 参数获取记录 ID。

```tsx
const { orderId = "" } = useParams();
const [record, setRecord] = useState(() => getRecord(orderId));
```

### 7.4 全局状态

目前无 Redux/Context 全局状态，所有跨组件状态通过 props 传递或路由参数获取。

---

## 8. 命名规范

### 8.1 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面文件 | `PascalCase` + 页面类型后缀 | `SalesOrdersPage.tsx`、`SalesOrderDetailPage.tsx` |
| 组件文件 | `PascalCase.tsx` | `AppShell.tsx`、`Ui.tsx`、`Drawer.tsx` |
| 工具文件 | `camelCase.ts` | `cn.ts`、`sort.ts` |
| 数据文件 | `camelCase.ts` | `mock.ts`、`modulePages.ts` |
| 样式文件 | `index.css` | 全局样式 |

### 8.2 组件命名

- React 组件：PascalCase（`SalesOrdersPage`）
- 导出函数：PascalCase
- 工具函数：camelCase（`cn`）

### 8.3 CSS 类名

- 一律使用 Tailwind CSS 工具类
- 禁止使用内联 style（除动态值）
- 自定义 CSS 仅用于 CSS 变量定义（`index.css`）和 Tailwind 无法覆盖的场景

### 8.4 状态变量命名

| 变量 | 类型 | 命名规范 |
|------|------|----------|
| 单值 | `string` | `orderNo`、`customer` |
| 布尔 | `boolean` | `isOpen`、`isLoading`、`isAllSelected` |
| 列表 | `Array<T>` | `orders`、`filteredOrders` |
| 分页 | `number` | `currentPage`、`pageSize` |
| 排序 | `{ key: string; direction: "asc" \| "desc" }` | `sortConfig` |
| 选中 | `string[]` | `selectedIds` |
| 高级筛选 | `Record<string, string>` | `advancedFilters` |

### 8.5 事件处理函数命名

| 操作 | 函数名规范 |
|------|-----------|
| 重置 | `handleReset` |
| 搜索 | `handleSearch` |
| 排序 | `handleSort` |
| 分页 | `handlePageChange` |
| 选择 | `handleSelect` / `toggleSelection` |
| 导航 | `handleNavigate` |
| 弹层开关 | `handleDrawerOpen` / `handleDrawerClose` |

---

## 9. 新增模块开发步骤

### 9.1 判断：Generic 还是 Custom？

| 条件 | 选择 |
|------|------|
| 页面结构为标准 CRUD（列表→详情→编辑） | Generic |
| 有特殊业务逻辑、复杂交互、自定义布局 | Custom |
| 首次开发，结构未确定 | Generic 先跑通，再升级 Custom |

### 9.2 Generic 模块开发（4步）

**Step 1：在 `modulePages.ts` 中定义模块配置**

```tsx
// src/data/modulePages.ts
export const crudModuleViews = [..., "new-module"];

export const moduleDefinitions = {
  "new-module": {
    name: "新模块",
    statusTabs: ["全部", "待处理", "已完成"],
    filters: [
      { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号/客户" },
      { key: "status", label: "状态", type: "select", options: ["待处理", "已完成"] },
    ],
    columns: [
      { key: "no", label: "单号" },
      { key: "customer", label: "客户" },
      { key: "amount", label: "金额", align: "right", kind: "money" },
      { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
    ],
    detailHeaderFields: [...],
    formSections: [...],
  } as CrudModuleDefinition,
};
```

**Step 2：注册路由（可选，自动生成已覆盖）**

如果使用 `crudModuleViews` 自动注册，可跳过。否则在 `App.tsx` 中手动添加。

**Step 3：提供 Mock 数据**

```tsx
// 在 getCrudModuleRecord(view, id) 中补充数据获取逻辑
// 或在 mock.ts 中添加对应记录
```

**Step 4：在导航中注册**

```tsx
// src/data/mock.ts
{
  key: "new-module",
  label: "新模块",
  pageType: "list",
  depth: "secondary",
  description: "模块描述",
}
```

### 9.3 Custom 模块开发（5步）

**Step 1：在 `src/pages/` 创建页面文件**

```tsx
// src/pages/NewModulePage.tsx
export function NewModulePage() {
  return (
    <div>
      <PageTitle title="新模块">描述信息</PageTitle>
      {/* 页面内容 */}
    </div>
  );
}
```

**Step 2：在 `App.tsx` 注册路由**

```tsx
import { NewModulePage } from "./pages/NewModulePage";

<Route path="/new-module" element={<NewModulePage />} />
```

**Step 3：在 `src/data/mock.ts` 添加导航元信息**

在 `inventoryNavGroups` 对应分组下添加 `NavChild`。

**Step 4：实现页面内容**

参考本规范第 4 节页面结构模式和第 3 节组件库。

**Step 5：如需面包屑动态文案，更新 `getShellMeta()`**

```tsx
// src/App.tsx
if (pathname === "/new-module") {
  return { ...baseMeta, pageLabel: "新模块", description: "..." };
}
```

### 9.4 新增页面类型对应的 Generic 模板

| 模板函数 | 适用场景 | 路由 |
|---------|---------|------|
| `GenericCrudListPage` | 标准增删改查列表 | `/{view}` |
| `GenericCrudDetailPage` | 详情页（只读） | `/{view}/:recordId` |
| `GenericCrudEditPage` | 编辑页 | `/{view}/:recordId/edit` |
| `GenericCrudCreatePage` | 新增页 | `/{view}/new` |
| `GenericQueryPage` | 多维查询页 | `/{view}` |
| `GenericFormPage` | 单表单录入页 | `/{view}` |
| `GenericConfigPage` | 配置页 | `/{view}` |

---

## 10. 常见模式代码模板

### 10.1 列表页筛选区模板

```tsx
<div className="mb-6 flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
  <FilterField label="业务日期">
    <DateRangeField value={dateRange} onChange={setDateRange} placeholder="请选择" className="w-[220px]" />
  </FilterField>
  <FilterField label="综合搜索">
    <SearchInput value={keyword} onChange={setKeyword} placeholder="单号/客户/仓库" className="w-[220px] bg-white" />
  </FilterField>
  <FilterActions
    onPrimaryClick={() => setCurrentPage(1)}
    onSecondaryClick={handleReset}
    extra={<Button onClick={() => setIsAdvancedOpen(true)}>高级搜索</Button>}
  />
</div>
```

### 10.2 表格模板（含固定列）

```tsx
<div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
  <div className="overflow-x-auto">
    <table className="min-w-[1100px] border-collapse text-sm lg:min-w-full">
      <thead className="bg-fill-2 text-left text-text-2">
        <tr className="h-[44px]">
          <th className="sticky left-0 z-10 w-10 border-b border-r border-line-1 bg-fill-1 px-3">
            <Checkbox checked={isAll} onChange={toggleAll} />
          </th>
          <th className="sticky left-10 z-10 min-w-[140px] border-b border-r border-line-1 bg-fill-1 px-4">单号</th>
          <th className="min-w-[200px] border-b border-r border-line-1 px-4">客户</th>
          <th className="border-b border-line-1 px-4 text-right">金额</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
            <td className="sticky left-0 z-10 border-r border-line-1 bg-white px-3">
              <Checkbox checked={selectedIds.includes(row.id)} onChange={() => toggle(row.id)} />
            </td>
            <td className="sticky left-10 z-10 border-r border-line-1 bg-white px-4">
              <button type="button" className="text-brand-6 hover:text-brand-7">{row.no}</button>
            </td>
            <td className="border-r border-line-1 px-4">{row.customer}</td>
            <td className="px-4 text-right">{row.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 10.3 详情页两栏布局模板

```tsx
<div className="space-y-4">
  {/* 关键字段概览 */}
  <DetailHeaderStrip />

  {/* Tab 切换 */}
  <TabBar items={tabs} activeKey={activeTab} onChange={setActiveTab} />

  {/* 两栏布局 */}
  {activeTab === "items" && (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <SalesOrderSection title="商品明细">
        {/* 内容 */}
      </SalesOrderSection>
      <SalesOrderSummarySide title="汇总" />
    </div>
  )}
</div>
```

### 10.4 Drawer 高级搜索模板

```tsx
<Drawer
  isOpen={isAdvancedOpen}
  onClose={() => setIsAdvancedOpen(false)}
  title="高级搜索"
  footer={
    <>
      <Button onClick={() => setFilters({})}>清空</Button>
      <Button tone="primary" onClick={handleSearch}>搜索</Button>
    </>
  }
>
  <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
    <DrawerField label="单号"><Input value={f.no} onChange={(v) => setF(f => ({...f, no: v}))} /></DrawerField>
    <DrawerField label="客户"><Select value={f.customer} onChange={(v) => setF(f => ({...f, customer: v}))} options={...} /></DrawerField>
  </div>
</Drawer>

function DrawerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[13px] font-medium text-text-2">{label}：</div>
      {children}
    </label>
  );
}
```

### 10.5 PageTitle + TabBar + 内容 布局模板

列表页「状态 Tab 与筛选同卡」请使用 **4.1.1 节** 与 **`TabBar variant="underline"`**，勿直接套用下列默认 `pill` 结构。

```tsx
export function SomePage() {
  return (
    <div className="flex flex-col">
      <TabBar items={tabs} activeKey={activeTab} onChange={setActiveTab} />
      <div className="mt-4 space-y-4">
        <PageTitle
          title="页面标题"
          actions={<><Button tone="primary">操作1</Button><Button>操作2</Button></>}
        >
          副标题或描述信息
        </PageTitle>
        {/* 页面内容 */}
      </div>
    </div>
  );
}
```

### 10.6 编辑页表单模板

```tsx
<Surface>
  <form className="space-y-5">
    <div className="grid gap-5 md:grid-cols-2">
      <FormField label="客户名称" required>
        <Input value={form.customer} onChange={(v) => setForm({...form, customer: v})} />
      </FormField>
      <FormField label="销售仓库">
        <Select value={form.warehouse} onChange={(v) => setForm({...form, warehouse: v})} options={...} />
      </FormField>
    </div>
    <FormField label="备注">
      <TextArea value={form.note} onChange={(v) => setForm({...form, note: v})} />
    </FormField>
  </form>
</Surface>

<div className="mt-6 flex justify-end gap-3 border-t border-line-1 pt-4">
  <Button onClick={() => navigate(-1)}>取消</Button>
  <Button tone="primary" onClick={handleSave}>保存</Button>
</div>
```

### 10.7 useMemo + 排序模板

```tsx
const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

const sortedData = useMemo(() => {
  if (!sortConfig) return rawData;
  const { key, direction } = sortConfig;
  const factor = direction === "asc" ? 1 : -1;
  return [...rawData].sort((a, b) => {
    const valA = a[key as keyof typeof a];
    const valB = b[key as keyof typeof b];
    if (valA < valB) return -1 * factor;
    if (valA > valB) return 1 * factor;
    return 0;
  });
}, [rawData, sortConfig]);

const handleSort = (key: string) => {
  setSortConfig(prev => {
    if (prev?.key !== key) return { key, direction: "asc" };
    if (prev.direction === "asc") return { key, direction: "desc" };
    return null;
  });
};
```

---

## 附录

### A. 文件结构速查

```
src/
├── App.tsx                    # 路由配置 + ShellWrapper
├── index.css                  # 全局样式 + CSS 变量定义
├── components/
│   ├── AppShell.tsx           # 主布局（Header + Sidebar + Main）
│   ├── Ui.tsx                 # 基础组件库（Button~Pagination）
│   ├── Drawer.tsx             # 抽屉组件
│   ├── FilterItem.tsx         # 筛选项组件
│   └── SalesOrderWorkspace.tsx # 销售订单详情页子组件集合
├── pages/
│   ├── SalesOrdersPage.tsx    # 销售订单列表（Custom）
│   ├── SalesOrderDetailPage.tsx
│   ├── SalesOrderEditPage.tsx
│   ├── SalesOrderCreatePage.tsx
│   ├── GenericModulePages.tsx # 通用 CRUD/Query/Form 页面
│   ├── PriorityModulePages.tsx # 优先开发的辅助模块
│   └── ...
├── data/
│   ├── mock.ts                # 导航配置 + Mock 数据
│   └── modulePages.ts          # 通用模块配置定义
└── utils/
    ├── cn.ts                   # classNames 合并工具
    └── sort.ts                 # 排序工具
```

### B. ViewKey 完整列表

```
dashboard | sales-orders | retail-cashier | inventory-query
| receipt-entry | customer-ledger
| product-management | customer-management
| supplier-management | warehouse-management
| sales-delivery | sales-query
| purchase-orders | purchase-receipt | purchase-return
| stock-transfer | stock-count | stock-loss
| receivable-query | payable-query | payment-entry
| sales-summary | inventory-balance
| user-permission | document-number | opening-init
| print-template | operation-log
```

### C. Tone 类型定义

```tsx
type Tone = "green" | "blue" | "orange" | "red" | "gray";
type StatusTone = "green" | "blue" | "orange" | "red" | "gray";
```

### D. CSS 变量使用检查清单

- [ ] 文字色是否用 `text-text-1/2/3` 而非硬编码 hex？
- [ ] 背景色是否用 `bg-fill-1/2/3` 或 `bg-white`？
- [ ] 分割线是否用 `border-line-1/2` 而非 `#e5e6eb`？
- [ ] 品牌强调色是否用 `text-brand-6` / `bg-brand-6`？
- [ ] 语义色是否用 `text-success` / `text-warning` / `text-danger`？
- [ ] 阴影是否用 `shadow-panel` / `shadow-soft` / `shadow-card`？
