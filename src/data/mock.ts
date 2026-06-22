import type { ViewKey } from "../app/navigation";

// 本文件只保留 Dashboard / InventoryQuery / CustomerLedger / ModulePlaceholder 等页面
// 实际消费的静态演示数据。模块化的 CRUD/Query 数据 SSOT 在 src/mocks/ 与
// src/contracts/modules/，不要在此重复定义。
//
// 注意：导航配置（ViewKey / NavChild / NavGroup / inventoryNavGroups / getPageMeta）
// 的唯一真相源在 src/app/navigation.ts，本文件不再重复定义。

export type SalesOrder = {
  id: string;
  orderNo: string;
  customer: string;
  customerLevel: string;
  warehouse: string;
  amount: string;
  status: string;
  statusTone: "blue" | "orange" | "green" | "gray";
  paymentStatus: string;
  creator: string;
  createdAt: string;
};

export type InventoryRecord = {
  sku: string;
  productName: string;
  warehouse: string;
  spec: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  warning: string;
  tone: "green" | "orange" | "red";
};

export type LedgerRecord = {
  id: string;
  customer: string;
  documentType: string;
  documentNo: string;
  receivable: string;
  paid: string;
  balance: string;
  dueDate: string;
  status: string;
  tone: "green" | "orange" | "red";
};

export type PlaceholderSummary = {
  title: string;
  desc: string;
  bullets: string[];
};

export const recentVisits = ["销售订单", "库存查询", "收款登记", "客户往来", "采购订单", "商品管理"];

export const salesOrders: SalesOrder[] = [
  {
    id: "SO-202504-001",
    orderNo: "XS20250403001",
    customer: "北京吉浓文化传媒有限公司",
    customerLevel: "A类客户",
    warehouse: "华北总仓",
    amount: "¥18,600.00",
    status: "待审核",
    statusTone: "orange",
    paymentStatus: "部分收款",
    creator: "王晨",
    createdAt: "2025/04/03 09:31",
  },
  {
    id: "SO-202504-002",
    orderNo: "XS20250403002",
    customer: "杭州智帆商贸有限公司",
    customerLevel: "重点客户",
    warehouse: "杭州分仓",
    amount: "¥9,840.00",
    status: "待出库",
    statusTone: "blue",
    paymentStatus: "已收款",
    creator: "李菲",
    createdAt: "2025/04/03 10:12",
  },
  {
    id: "SO-202504-003",
    orderNo: "XS20250403003",
    customer: "深圳腾岳科技有限公司",
    customerLevel: "账期客户",
    warehouse: "华南中心仓",
    amount: "¥23,450.00",
    status: "已完成",
    statusTone: "green",
    paymentStatus: "已收款",
    creator: "钱宇",
    createdAt: "2025/04/02 16:40",
  },
  {
    id: "SO-202504-004",
    orderNo: "XS20250402017",
    customer: "宁波智链实业有限公司",
    customerLevel: "普通客户",
    warehouse: "华东总仓",
    amount: "¥6,520.00",
    status: "已关闭",
    statusTone: "gray",
    paymentStatus: "未收款",
    creator: "周曼",
    createdAt: "2025/04/02 11:18",
  },
  {
    id: "SO-202504-005",
    orderNo: "XS20250401025",
    customer: "苏州元禾供应链有限公司",
    customerLevel: "重点客户",
    warehouse: "苏州仓",
    amount: "¥14,320.00",
    status: "待出库",
    statusTone: "blue",
    paymentStatus: "待收款",
    creator: "沈岩",
    createdAt: "2025/04/01 15:26",
  },
];

export const inventoryRecords: InventoryRecord[] = [
  {
    sku: "SKU-100012",
    productName: "Figma设计源文件V2.0",
    warehouse: "华北总仓",
    spec: "标准版 / 蓝色",
    currentStock: 328,
    reservedStock: 42,
    availableStock: 286,
    warning: "库存健康",
    tone: "green",
  },
  {
    sku: "SKU-100124",
    productName: "便携扫码枪",
    warehouse: "华东总仓",
    spec: "无线版",
    currentStock: 24,
    reservedStock: 8,
    availableStock: 16,
    warning: "低库存",
    tone: "orange",
  },
  {
    sku: "SKU-100331",
    productName: "标签打印纸",
    warehouse: "杭州分仓",
    spec: "100mm*50mm",
    currentStock: 12,
    reservedStock: 6,
    availableStock: 6,
    warning: "需补货",
    tone: "red",
  },
  {
    sku: "SKU-100422",
    productName: "热敏打印机",
    warehouse: "华南中心仓",
    spec: "旗舰版",
    currentStock: 88,
    reservedStock: 10,
    availableStock: 78,
    warning: "库存健康",
    tone: "green",
  },
];

export const ledgerRecords: LedgerRecord[] = [
  {
    id: "L-001",
    customer: "北京吉浓文化传媒有限公司",
    documentType: "销售订单",
    documentNo: "XS20250403001",
    receivable: "¥18,600.00",
    paid: "¥8,000.00",
    balance: "¥10,600.00",
    dueDate: "2025/04/15",
    status: "待回款",
    tone: "orange",
  },
  {
    id: "L-002",
    customer: "杭州智帆商贸有限公司",
    documentType: "销售订单",
    documentNo: "XS20250403002",
    receivable: "¥9,840.00",
    paid: "¥9,840.00",
    balance: "¥0.00",
    dueDate: "2025/04/10",
    status: "已结清",
    tone: "green",
  },
  {
    id: "L-003",
    customer: "苏州元禾供应链有限公司",
    documentType: "销售订单",
    documentNo: "XS20250401025",
    receivable: "¥14,320.00",
    paid: "¥0.00",
    balance: "¥14,320.00",
    dueDate: "2025/04/08",
    status: "已逾期",
    tone: "red",
  },
];

export const placeholderSummaries: Record<ViewKey, PlaceholderSummary> = {
  dashboard: {
    title: "工作台",
    desc: "首页用于承接高频入口、待办和主链路概览。",
    bullets: ["展示核心入口", "展示近期访问", "承接演示主线"],
  },
  "sales-orders": {
    title: "销售订单",
    desc: "核心列表页，用于查询、新增和跟踪批发订单。",
    bullets: ["查询区", "操作区", "订单表格"],
  },
  "inventory-query": {
    title: "库存查询",
    desc: "核心查询页，用于查看现存、占用、可用库存。",
    bullets: ["筛选区", "库存表格", "预警状态"],
  },
  "customer-ledger": {
    title: "客户往来查询",
    desc: "核心查询页，用于查看客户应收与回款记录。",
    bullets: ["往来摘要", "记录表格", "状态筛选"],
  },
  "product-management": {
    title: "商品管理",
    desc: "维护商品主数据、规格和价格规则。",
    bullets: ["页面标题", "关键字段", "后续扩展方向"],
  },
  "customer-management": {
    title: "客户管理",
    desc: "维护客户档案、等级和账期规则。",
    bullets: ["页面标题", "关键字段", "后续扩展方向"],
  },
  "supplier-management": {
    title: "供应商管理",
    desc: "维护供应商信息和合作属性。",
    bullets: ["页面标题", "关键字段", "后续扩展方向"],
  },
  "warehouse-management": {
    title: "仓库管理",
    desc: "维护仓库档案、用途和库存归属。",
    bullets: ["页面标题", "关键字段", "后续扩展方向"],
  },
  "sales-delivery": {
    title: "销售出库",
    desc: "查看和执行销售出库，后续补齐详情和流程。",
    bullets: ["列表骨架", "状态跟踪", "详情延展"],
  },
  "sales-return": {
    title: "销售退货",
    desc: "查看销售退货申请与逆向处理进度。",
    bullets: ["列表骨架", "关键字段", "后续联动"],
  },
  "sales-return-inbound": {
    title: "销售退货入库",
    desc: "查看销售退货入库执行记录。",
    bullets: ["列表骨架", "关键字段", "后续联动"],
  },
  "sales-query": {
    title: "销售查询",
    desc: "查询订单与销售结果，补充统计视角。",
    bullets: ["查询区", "结果区", "统计占位"],
  },
  "purchase-orders": {
    title: "采购订单",
    desc: "查看采购下单记录与协同状态。",
    bullets: ["列表骨架", "关键字段", "后续联动"],
  },
  "purchase-receipt": {
    title: "采购入库",
    desc: "查看采购到货与入库结果。",
    bullets: ["列表骨架", "关键字段", "后续联动"],
  },
  "purchase-return": {
    title: "采购退货",
    desc: "查看采购退货记录。",
    bullets: ["列表骨架", "关键字段", "后续联动"],
  },
  "purchase-return-stockout": {
    title: "采购退货出库",
    desc: "查看采购退货出库执行记录。",
    bullets: ["列表骨架", "关键字段", "后续联动"],
  },
  "stock-transfer": {
    title: "调拨管理",
    desc: "记录仓间调拨与执行状态。",
    bullets: ["列表骨架", "关键字段", "后续联动"],
  },
  "stock-count": {
    title: "盘点管理",
    desc: "查看盘点计划、差异和处理结果。",
    bullets: ["列表骨架", "关键字段", "后续联动"],
  },
  "stock-loss": {
    title: "报损管理",
    desc: "记录报损申请与库存调整结果。",
    bullets: ["列表骨架", "关键字段", "后续联动"],
  },
  "receivable-query": {
    title: "应收查询",
    desc: "查看客户应收余额与账龄。",
    bullets: ["查询区", "结果区", "后续联动"],
  },
  "receipt-management": {
    title: "收款登记",
    desc: "管理客户收款记录，支持登记、确认和核销。",
    bullets: ["列表页", "新增/编辑页", "详情页"],
  },
  "payable-query": {
    title: "应付查询",
    desc: "查看供应商应付余额与账期。",
    bullets: ["查询区", "结果区", "后续联动"],
  },
  "payment-management": {
    title: "付款登记",
    desc: "管理供应商付款记录，支持登记、确认和核销。",
    bullets: ["列表页", "新增/编辑页", "详情页"],
  },
  "sales-summary": {
    title: "销售汇总",
    desc: "提供基础销售汇总指标与趋势。",
    bullets: ["查询区", "图表占位", "结果区"],
  },
  "inventory-balance": {
    title: "库存余额",
    desc: "提供库存余额口径视图。",
    bullets: ["查询区", "结果区", "状态占位"],
  },
  "user-permission": {
    title: "用户与权限",
    desc: "当前阶段只保留系统设置入口和扩展方向。",
    bullets: ["页面标题", "未展开原因", "后续扩展方向"],
  },
  "document-number": {
    title: "单据编号",
    desc: "当前阶段只保留编号配置入口。",
    bullets: ["页面标题", "未展开原因", "后续扩展方向"],
  },
  "opening-init": {
    title: "期初初始化",
    desc: "当前阶段只保留初始化入口。",
    bullets: ["页面标题", "未展开原因", "后续扩展方向"],
  },
  "print-template": {
    title: "打印模板",
    desc: "当前阶段只保留打印配置入口。",
    bullets: ["页面标题", "未展开原因", "后续扩展方向"],
  },
  "operation-log": {
    title: "操作日志",
    desc: "当前阶段只保留日志入口与审计方向。",
    bullets: ["页面标题", "未展开原因", "后续扩展方向"],
  },
};
