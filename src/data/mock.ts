export type AppIconTone = "blue" | "cyan" | "sky" | "violet" | "amber" | "emerald";

export type PageDepth = "core" | "secondary" | "placeholder";

export type ViewKey =
  | "dashboard"
  | "sales-orders"
  | "retail-cashier"
  | "inventory-query"
  | "receipt-entry"
  | "customer-ledger"
  | "product-management"
  | "customer-management"
  | "supplier-management"
  | "warehouse-management"
  | "sales-delivery"
  | "sales-query"
  | "purchase-orders"
  | "purchase-receipt"
  | "purchase-return"
  | "stock-transfer"
  | "stock-count"
  | "stock-loss"
  | "receivable-query"
  | "payable-query"
  | "payment-entry"
  | "sales-summary"
  | "inventory-balance"
  | "user-permission"
  | "document-number"
  | "opening-init"
  | "print-template"
  | "operation-log";

export type NavChild = {
  key: ViewKey;
  label: string;
  pageType: "dashboard" | "list" | "detail" | "form" | "query" | "cashier" | "placeholder" | "config";
  depth: PageDepth;
  description: string;
  isIncomplete?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  children: NavChild[];
};

export type DashboardFeature = {
  title: string;
  desc: string;
  accent: string;
};

export type DashboardTool = {
  title: string;
  desc: string;
  color: string;
  icon: AppIconTone;
};

export type SalesOrder = {
  id: string;
  orderNo: string;
  customer: string;
  customerLevel: string;
  warehouse: string;
  amount: string;
  status: string;
  statusTone: "green" | "blue" | "orange" | "red" | "gray";
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
  tone: "green" | "orange" | "red" | "gray";
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
  tone: "green" | "orange" | "red" | "gray";
};

export type CashierItem = {
  sku: string;
  name: string;
  spec: string;
  qty: number;
  price: number;
};

export type PlaceholderSummary = {
  title: string;
  desc: string;
  bullets: string[];
};

export type ReceiptFormState = {
  customer: string;
  documentType: string;
  amount: string;
  paymentMethod: string;
  receivedAt: string;
  handler: string;
  note: string;
};

export const inventoryNavGroups: NavGroup[] = [
  {
    id: "dashboard",
    label: "首页",
    children: [
      {
        key: "dashboard",
        label: "工作台",
        pageType: "dashboard",
        depth: "core",
        description: "展示核心入口、待办和主链路概览。",
        isIncomplete: true,
      },
    ],
  },
  {
    id: "master-data",
    label: "基础资料",
    children: [
      {
        key: "product-management",
        label: "商品管理",
        pageType: "list",
        depth: "secondary",
        description: "维护商品档案、分类、规格和价格策略。",
        isIncomplete: true,
      },
      {
        key: "customer-management",
        label: "客户管理",
        pageType: "list",
        depth: "secondary",
        description: "维护客户等级、账期和往来策略。",
        isIncomplete: true,
      },
      {
        key: "supplier-management",
        label: "供应商管理",
        pageType: "list",
        depth: "secondary",
        description: "维护供应商主体、合作属性和结算规则。",
        isIncomplete: true,
      },
      {
        key: "warehouse-management",
        label: "仓库管理",
        pageType: "list",
        depth: "secondary",
        description: "维护仓库档案、用途和库存归属。",
        isIncomplete: true,
      },
    ],
  },
  {
    id: "sales",
    label: "销售管理",
    children: [
      {
        key: "sales-orders",
        label: "销售订单",
        pageType: "list",
        depth: "core",
        description: "承接批发开单主链路，处理订单查询、新增、状态跟踪。",
      },
      {
        key: "sales-delivery",
        label: "销售出库",
        pageType: "detail",
        depth: "secondary",
        description: "查看和执行销售出库，跟踪发货状态。",
        isIncomplete: true,
      },
      {
        key: "sales-query",
        label: "销售查询",
        pageType: "query",
        depth: "secondary",
        description: "查询订单、客户、商品维度的销售记录。",
        isIncomplete: true,
      },
    ],
  },
  {
    id: "retail",
    label: "零售管理",
    children: [
      {
        key: "retail-cashier",
        label: "零售收银",
        pageType: "cashier",
        depth: "core",
        description: "承接门店现场成交，完成搜索、加购、折让、收款。",
        isIncomplete: true,
      },
    ],
  },
  {
    id: "purchase",
    label: "采购管理",
    children: [
      {
        key: "purchase-orders",
        label: "采购订单",
        pageType: "list",
        depth: "secondary",
        description: "查看采购下单记录，承接供货需求。",
        isIncomplete: true,
      },
      {
        key: "purchase-receipt",
        label: "采购入库",
        pageType: "list",
        depth: "secondary",
        description: "查看采购入库和到货状态。",
        isIncomplete: true,
      },
      {
        key: "purchase-return",
        label: "采购退货",
        pageType: "list",
        depth: "secondary",
        description: "查看采购退货记录与供应商协同状态。",
        isIncomplete: true,
      },
    ],
  },
  {
    id: "stock",
    label: "库存管理",
    children: [
      {
        key: "inventory-query",
        label: "库存查询",
        pageType: "query",
        depth: "core",
        description: "展示现存、占用、可用库存，承接共享底账查询。",
        isIncomplete: true,
      },
      {
        key: "stock-transfer",
        label: "调拨管理",
        pageType: "list",
        depth: "secondary",
        description: "记录仓间调拨和调拨执行状态。",
        isIncomplete: true,
      },
      {
        key: "stock-count",
        label: "盘点管理",
        pageType: "list",
        depth: "secondary",
        description: "查看盘点计划、差异和处理结果。",
        isIncomplete: true,
      },
      {
        key: "stock-loss",
        label: "报损管理",
        pageType: "list",
        depth: "secondary",
        description: "记录报损申请和库存调整结果。",
        isIncomplete: true,
      },
    ],
  },
  {
    id: "finance",
    label: "往来管理",
    children: [
      {
        key: "receivable-query",
        label: "应收查询",
        pageType: "query",
        depth: "secondary",
        description: "查看客户应收余额与账龄。",
        isIncomplete: true,
      },
      {
        key: "receipt-entry",
        label: "收款登记",
        pageType: "form",
        depth: "core",
        description: "承接财务回款登记，录入客户、金额和付款方式。",
        isIncomplete: true,
      },
      {
        key: "payable-query",
        label: "应付查询",
        pageType: "query",
        depth: "secondary",
        description: "查看供应商应付余额与账期。",
        isIncomplete: true,
      },
      {
        key: "payment-entry",
        label: "付款登记",
        pageType: "form",
        depth: "secondary",
        description: "记录对供应商付款及付款备注。",
        isIncomplete: true,
      },
    ],
  },
  {
    id: "stats",
    label: "查询统计",
    children: [
      {
        key: "sales-summary",
        label: "销售汇总",
        pageType: "query",
        depth: "secondary",
        description: "提供基础销售汇总指标和趋势。",
        isIncomplete: true,
      },
      {
        key: "inventory-balance",
        label: "库存余额",
        pageType: "query",
        depth: "secondary",
        description: "提供库存余额和仓库口径视图。",
        isIncomplete: true,
      },
      {
        key: "customer-ledger",
        label: "客户往来查询",
        pageType: "query",
        depth: "core",
        description: "查看客户应收、回款记录和往来余额。",
        isIncomplete: true,
      },
    ],
  },
  {
    id: "settings",
    label: "系统设置",
    children: [
      {
        key: "user-permission",
        label: "用户与权限",
        pageType: "config",
        depth: "secondary",
        description: "维护用户账号、角色与数据权限。",
      },
      {
        key: "document-number",
        label: "单据编号",
        pageType: "config",
        depth: "secondary",
        description: "配置销售、采购、库存单据的编号规则。",
      },
      {
        key: "opening-init",
        label: "期初初始化",
        pageType: "config",
        depth: "secondary",
        description: "查看商品、客户、供应商和库存期初导入状态。",
      },
      {
        key: "print-template",
        label: "打印模板",
        pageType: "config",
        depth: "secondary",
        description: "维护销售、采购、库存单据打印模板。",
      },
      {
        key: "operation-log",
        label: "操作日志",
        pageType: "config",
        depth: "secondary",
        description: "查看关键业务操作、审批动作和配置变更。",
      },
    ],
  },
];

export const inventoryShortcuts = [
  "销售订单",
  "零售收银",
  "库存查询",
  "收款登记",
];

export const dashboardFeatureCards: DashboardFeature[] = [
  { title: "销售订单主链路", desc: "从批发开单到出库跟踪，串起一期核心交易流程。", accent: "bg-blue-600" },
  { title: "零售收银台", desc: "覆盖门店现场成交、改价、抹零和即时收款。", accent: "bg-emerald-500" },
  { title: "库存共享底账", desc: "统一现存、占用、可用库存口径，支撑业务与仓库协同。", accent: "bg-violet-500" },
  { title: "客户往来闭环", desc: "把应收查询、收款登记和历史回款记录串成闭环。", accent: "bg-amber-500" },
];

export const dashboardTools: DashboardTool[] = [
  { title: "销售订单", desc: "查看订单、跟踪状态、进入开单主链路。", color: "from-blue-50 to-blue-100", icon: "blue" },
  { title: "零售收银", desc: "快速录入商品，完成门店成交与收款。", color: "from-cyan-50 to-cyan-100", icon: "cyan" },
  { title: "库存查询", desc: "按仓库、商品、状态查看实时库存。", color: "from-sky-50 to-sky-100", icon: "sky" },
  { title: "收款登记", desc: "承接财务回款登记和备注记录。", color: "from-violet-50 to-violet-100", icon: "violet" },
  { title: "客户往来", desc: "查看客户应收和回款明细。", color: "from-amber-50 to-amber-100", icon: "amber" },
  { title: "采购订单", desc: "查看采购单据和到货协同状态。", color: "from-emerald-50 to-emerald-100", icon: "emerald" },
];

export const recentVisits = ["销售订单", "库存查询", "收款登记", "客户往来", "采购订单", "商品管理"];

export const recommendationCards = ["打印模板", "调拨管理", "库存余额", "操作日志"];

export const salesOrderTabs = ["全部订单", "待审核", "待出库", "已完成", "已关闭"];

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

export const cashierQuickGoods = [
  "扫码枪标准版",
  "标签打印纸",
  "热敏打印机",
  "仓储周转箱",
  "蓝牙手持终端",
  "标签色带",
];

export const cashierItems: CashierItem[] = [
  { sku: "SKU-100124", name: "便携扫码枪", spec: "无线版", qty: 2, price: 299 },
  { sku: "SKU-100331", name: "标签打印纸", spec: "100mm*50mm", qty: 6, price: 18 },
  { sku: "SKU-100422", name: "热敏打印机", spec: "旗舰版", qty: 1, price: 699 },
];

export const receiptFormDefault: ReceiptFormState = {
  customer: "",
  documentType: "",
  amount: "",
  paymentMethod: "",
  receivedAt: "",
  handler: "",
  note: "",
};

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
  "retail-cashier": {
    title: "零售收银",
    desc: "核心收银页，用于门店成交、改价和即时收款。",
    bullets: ["商品录入区", "购物清单", "结算区"],
  },
  "inventory-query": {
    title: "库存查询",
    desc: "核心查询页，用于查看现存、占用、可用库存。",
    bullets: ["筛选区", "库存表格", "预警状态"],
  },
  "receipt-entry": {
    title: "收款登记",
    desc: "核心表单页，用于登记客户回款。",
    bullets: ["客户选择", "金额录入", "底部操作"],
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
  "payable-query": {
    title: "应付查询",
    desc: "查看供应商应付余额与账期。",
    bullets: ["查询区", "结果区", "后续联动"],
  },
  "payment-entry": {
    title: "付款登记",
    desc: "记录供应商付款及备注。",
    bullets: ["表单骨架", "关键字段", "后续联动"],
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

export function getPageMeta(view: ViewKey) {
  for (const group of inventoryNavGroups) {
    const page = group.children.find((item) => item.key === view);
    if (page) {
      return {
        sectionId: group.id,
        sectionLabel: group.label,
        pageLabel: page.label,
        pageType: page.pageType,
        pageDepth: page.depth,
        description: page.description,
      };
    }
  }

  return {
    sectionId: "dashboard",
    sectionLabel: "首页",
    pageLabel: "工作台",
    pageType: "dashboard" as const,
    pageDepth: "core" as const,
    description: "展示核心入口、待办和主链路概览。",
  };
}
