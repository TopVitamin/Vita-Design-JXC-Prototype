# CLAUDE.md — JXC Prototype

> 强盛进销存原型项目（jxc-prototype）的开发规范与上下文说明。

---

## 项目概述

React 18 + TypeScript + Vite + Tailwind CSS 的进销存系统原型，用于展示强盛科技信息化演进故事中的核心业务链路。

- **技术栈**：React 18 / TypeScript / Vite / Tailwind CSS / Lucide React / React Router v6
- **路由模式**：HashRouter，所有路由以 `#/` 开头
- **样式方案**：Tailwind CSS 工具类 + CSS 自定义属性（定义在 `src/index.css`）

---

## 开发规范

### UI 设计规范（强制）

**新页面开发必须先阅读 `src/docs/UI-DESIGN-GUIDE.md`，遵循其中的组件 API、布局模式和命名规范。**

具体包括：
- 使用 `src/components/Ui.tsx` 中定义的组件（Button、Input、Select、PageTitle、TabBar、StatusPill、Pagination 等）
- 文字色统一使用 `text-text-1/2/3` 而非硬编码 hex
- 品牌色统一使用 `bg-brand-6` / `text-brand-6`
- 分割线使用 `border-line-1/2`
- 阴影使用 `shadow-panel` / `shadow-soft` / `shadow-card`
- 页面布局遵循 AppShell 结构（Header + Sidebar + Main Content）
- 列表页使用标准 FilterBar + Table + Pagination 结构
- 详情页使用 PageTitle + DetailHeaderStrip + TabBar 结构

### 组件库使用

所有基础 UI 组件从 `src/components/Ui.tsx` 导入，禁止自行实现同名组件：

```tsx
import { Button, PageTitle, StatusPill, TabBar, Input, Select, ... } from "../components/Ui";
```

如需新增基础组件，优先加到 `Ui.tsx` 中而非创建新文件。

### 页面文件位置

| 页面类型 | 文件位置 |
|---------|---------|
| 核心定制页（销售订单/零售收银等） | `src/pages/` 独立文件 |
| 通用模块页（标准 CRUD） | `src/pages/GenericModulePages.tsx` |
| 辅助占位页 | `src/pages/PriorityModulePages.tsx` |

### 命名规范

- 页面文件：`PascalCasePage.tsx`（如 `SalesOrdersPage.tsx`）
- 组件文件：`PascalCase.tsx`（如 `AppShell.tsx`）
- 工具文件：`camelCase.ts`（如 `cn.ts`、`sort.ts`）
- 状态变量：`useState` 优先，useMemo 包装派生计算

### 路由注册

- 固定路由在 `src/App.tsx` 的 `<Routes>` 中手动注册
- Generic 模块通过 `crudModuleViews` / `queryModuleViews` / `formModuleViews` / `configModuleViews` 数组自动注册
- 导航元信息统一在 `src/data/mock.ts` 的 `inventoryNavGroups` 中管理

---

## 现有模块速查

### 页面路由

```
/dashboard                    → DashboardPage
/sales-orders                 → SalesOrdersPage
/sales-orders/new             → SalesOrderCreatePage
/sales-orders/:orderId        → SalesOrderDetailPage
/sales-orders/:orderId/edit   → SalesOrderEditPage
/retail-cashier               → RetailCashierPage
/inventory-query              → InventoryQueryPage
/receipt-entry                → ReceiptEntryPage
/customer-ledger              → CustomerLedgerPage
/{crudModuleViews}            → GenericCrudListPage
/{crudModuleViews}/new        → GenericCrudCreatePage
/{crudModuleViews}/:recordId  → GenericCrudDetailPage
/{crudModuleViews}/:recordId/edit → GenericCrudEditPage
```

### ViewKey 完整列表

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

---

## 设计令牌速查

```css
/* 品牌色 */
--brand-6: #165dff   /* 主色，按钮/链接 */

/* 文字色 */
--text-1: #1d2129   /* 主要 */
--text-2: #4e5969   /* 次要 */
--text-3: #86909c   /* 辅助 */

/* 填充色 */
--fill-2: #f7f8fa   /* 表格表头/页面背景 */

/* 分割线 */
--line-1: #e5e6eb   /* 内容分割 */
--line-2: #c9cdd4   /* 表格边框 */

/* 语义色 */
--success: #00b42a
--warning: #ff7d00
--danger: #f53f3f
```

---

## 新增模块开发流程

1. 阅读 `src/docs/UI-DESIGN-GUIDE.md` 第 9 节
2. 判断使用 Generic 还是 Custom
3. Generic：在 `src/data/modulePages.ts` 添加配置，在 `mock.ts` 注册导航
4. Custom：在 `src/pages/` 创建页面文件，在 `App.tsx` 注册路由，在 `mock.ts` 注册导航
5. 确保 CSS 变量使用符合设计令牌规范
