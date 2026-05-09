export type SalesOrderStatus = "草稿" | "待审核" | "待出库" | "部分出库" | "已完成" | "已作废";
export type SalesStockoutStatus = "草稿" | "已出库" | "已作废";
export type SalesTone = "green" | "blue" | "orange" | "red" | "gray";
export type PriceLevel = "标准价" | "批发价" | "VIP价" | "伙伴价";

export type SalesOrderLine = {
  id: string;
  skuCode: string;
  skuName: string;
  spec: string;
  unit: string;
  availableStock: number;
  qty: number;
  price: number;
  taxRate: string;
  discountRate: number;
  amount: number;
  shippedQty: number;
  pendingQty: number;
  note: string;
};

export type SalesOrderRecord = {
  id: string;
  no: string;
  customerCode: string;
  customerName: string;
  customerLabel: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseLabel: string;
  priceLevel: PriceLevel;
  accountPeriodDays: number;
  creditLimit: number;
  orderDate: string;
  expectedDate: string;
  status: SalesOrderStatus;
  statusTone: SalesTone;
  remark: string;
  lines: SalesOrderLine[];
  skuCount: number;
  totalQty: number;
  totalAmount: number;
  shippedTotalQty: number;
  pendingTotalQty: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  auditBy: string;
  auditAt: string;
  closedManually?: boolean;
};

export type SalesStockoutLine = {
  id: string;
  orderLineId: string;
  skuCode: string;
  skuName: string;
  spec: string;
  unit: string;
  orderQty: number;
  pendingQty: number;
  stockoutQty: number;
  price: number;
  amount: number;
  note: string;
};

export type SalesStockoutRecord = {
  id: string;
  no: string;
  orderId: string;
  orderNo: string;
  customerLabel: string;
  warehouseLabel: string;
  stockoutDate: string;
  status: SalesStockoutStatus;
  statusTone: SalesTone;
  remark: string;
  lines: SalesStockoutLine[];
  totalQty: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  confirmBy: string;
  confirmAt: string;
};

type SalesOrderSeed = Omit<
  SalesOrderRecord,
  "customerLabel" | "warehouseLabel" | "lines" | "skuCount" | "totalQty" | "totalAmount" | "shippedTotalQty" | "pendingTotalQty" | "statusTone"
> & {
  lines: Array<Omit<SalesOrderLine, "amount" | "shippedQty" | "pendingQty">>;
};

type SalesStockoutSeed = Omit<
  SalesStockoutRecord,
  "orderNo" | "customerLabel" | "warehouseLabel" | "lines" | "totalQty" | "totalAmount" | "statusTone"
> & {
  lines: Array<Omit<SalesStockoutLine, "skuCode" | "skuName" | "spec" | "unit" | "orderQty" | "pendingQty" | "amount">>;
};

type CustomerProfile = {
  code: string;
  name: string;
  accountPeriodDays: number;
  creditLimit: number;
  defaultPriceLevel: PriceLevel;
};

type ProductProfile = {
  code: string;
  name: string;
  spec: string;
  unit: string;
  availableStock: number;
  prices: Record<PriceLevel, number>;
  taxRate: string;
};

const ORDER_STORAGE_KEY = "jxc-sales-orders-v20260420";
const STOCKOUT_STORAGE_KEY = "jxc-sales-stockouts-v20260420";
const CURRENT_USER = "当前用户";

export const salesPriceLevels: PriceLevel[] = ["标准价", "批发价", "VIP价", "伙伴价"];
export const salesTaxRates = ["0%", "3%", "6%", "9%", "13%"];

const customers: CustomerProfile[] = [
  { code: "C001", name: "广州振华贸易有限公司", accountPeriodDays: 30, creditLimit: 180000, defaultPriceLevel: "批发价" },
  { code: "C002", name: "杭州智帆商贸有限公司", accountPeriodDays: 0, creditLimit: 80000, defaultPriceLevel: "标准价" },
  { code: "C003", name: "苏州元禾供应链有限公司", accountPeriodDays: 15, creditLimit: 150000, defaultPriceLevel: "伙伴价" },
  { code: "C004", name: "深圳腾岳科技有限公司", accountPeriodDays: 45, creditLimit: 300000, defaultPriceLevel: "VIP价" },
];

const warehouses = [
  { code: "WH001", name: "广州中央仓" },
  { code: "WH002", name: "杭州电商仓" },
  { code: "WH003", name: "苏州仓" },
];

const products: ProductProfile[] = [
  { code: "SKU1001", name: "无线扫码枪", spec: "X1标准版", unit: "支", availableStock: 48, prices: { 标准价: 329, 批发价: 299, VIP价: 285, 伙伴价: 279 }, taxRate: "13%" },
  { code: "SKU1002", name: "热敏标签纸", spec: "100*50", unit: "卷", availableStock: 280, prices: { 标准价: 22, 批发价: 18, VIP价: 17, 伙伴价: 16.5 }, taxRate: "13%" },
  { code: "SKU1003", name: "热敏打印机", spec: "旗舰版", unit: "台", availableStock: 68, prices: { 标准价: 759, 批发价: 699, VIP价: 679, 伙伴价: 669 }, taxRate: "13%" },
  { code: "SKU1004", name: "蓝牙手持终端", spec: "Pro 128G", unit: "台", availableStock: 30, prices: { 标准价: 1999, 批发价: 1899, VIP价: 1849, 伙伴价: 1819 }, taxRate: "13%" },
  { code: "SKU1005", name: "仓储周转箱", spec: "600*400蓝色", unit: "个", availableStock: 260, prices: { 标准价: 68, 批发价: 62, VIP价: 59, 伙伴价: 57 }, taxRate: "13%" },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return clone(fallback);
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function writeStorage<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function pad(num: number) {
  return String(num).padStart(2, "0");
}

function nowDate() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function nowDateTime() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getSalesTone(status: SalesOrderStatus | SalesStockoutStatus): SalesTone {
  switch (status) {
    case "待审核":
      return "orange";
    case "待出库":
    case "部分出库":
      return "blue";
    case "已完成":
    case "已出库":
      return "green";
    case "已作废":
      return "red";
    default:
      return "gray";
  }
}

function buildOrderLine(id: string, productIndex: number, qty: number, priceLevel: PriceLevel, note = "") {
  const product = products[productIndex];
  return {
    id,
    skuCode: product.code,
    skuName: product.name,
    spec: product.spec,
    unit: product.unit,
    availableStock: product.availableStock,
    qty,
    price: product.prices[priceLevel],
    taxRate: product.taxRate,
    discountRate: 100,
    note,
  };
}

const orderSeedFallback: SalesOrderSeed[] = [
  {
    id: "so-001",
    no: "SO20260420-0001",
    customerCode: "C001",
    customerName: "广州振华贸易有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    priceLevel: "批发价",
    accountPeriodDays: 30,
    creditLimit: 180000,
    orderDate: "2026-04-20",
    expectedDate: "2026-04-22",
    status: "草稿",
    remark: "扫码设备首批报价单草稿。",
    createdBy: "王晨",
    createdAt: "2026-04-20 09:10:00",
    updatedBy: "王晨",
    updatedAt: "2026-04-20 09:10:00",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("so-001-line-1", 0, 12, "批发价"), buildOrderLine("so-001-line-2", 1, 60, "批发价")],
  },
  {
    id: "so-002",
    no: "SO20260420-0002",
    customerCode: "C002",
    customerName: "杭州智帆商贸有限公司",
    warehouseCode: "WH002",
    warehouseName: "杭州电商仓",
    priceLevel: "标准价",
    accountPeriodDays: 0,
    creditLimit: 80000,
    orderDate: "2026-04-20",
    expectedDate: "2026-04-21",
    status: "草稿",
    remark: "客户下午自提，先建草稿。",
    createdBy: "李菲",
    createdAt: "2026-04-20 10:18:00",
    updatedBy: "李菲",
    updatedAt: "2026-04-20 10:18:00",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("so-002-line-1", 2, 6, "标准价"), buildOrderLine("so-002-line-2", 1, 40, "标准价")],
  },
  {
    id: "so-003",
    no: "SO20260419-0003",
    customerCode: "C003",
    customerName: "苏州元禾供应链有限公司",
    warehouseCode: "WH003",
    warehouseName: "苏州仓",
    priceLevel: "伙伴价",
    accountPeriodDays: 15,
    creditLimit: 150000,
    orderDate: "2026-04-19",
    expectedDate: "2026-04-22",
    status: "待审核",
    remark: "项目补单待主管审核。",
    createdBy: "沈岩",
    createdAt: "2026-04-19 13:10:00",
    updatedBy: "沈岩",
    updatedAt: "2026-04-19 13:30:00",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("so-003-line-1", 3, 4, "伙伴价"), buildOrderLine("so-003-line-2", 4, 20, "伙伴价")],
  },
  {
    id: "so-004",
    no: "SO20260419-0004",
    customerCode: "C004",
    customerName: "深圳腾岳科技有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    priceLevel: "VIP价",
    accountPeriodDays: 45,
    creditLimit: 300000,
    orderDate: "2026-04-19",
    expectedDate: "2026-04-23",
    status: "待审核",
    remark: "项目客户大单待信用确认。",
    createdBy: "王晨",
    createdAt: "2026-04-19 15:00:00",
    updatedBy: "王晨",
    updatedAt: "2026-04-19 15:18:00",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("so-004-line-1", 3, 8, "VIP价"), buildOrderLine("so-004-line-2", 0, 10, "VIP价")],
  },
  {
    id: "so-005",
    no: "SO20260418-0005",
    customerCode: "C001",
    customerName: "广州振华贸易有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    priceLevel: "批发价",
    accountPeriodDays: 30,
    creditLimit: 180000,
    orderDate: "2026-04-18",
    expectedDate: "2026-04-20",
    status: "待出库",
    remark: "标签纸加急发货。",
    createdBy: "王晨",
    createdAt: "2026-04-18 09:30:00",
    updatedBy: "陈诺",
    updatedAt: "2026-04-18 10:20:00",
    auditBy: "陈诺",
    auditAt: "2026-04-18 10:20:00",
    lines: [buildOrderLine("so-005-line-1", 1, 120, "批发价"), buildOrderLine("so-005-line-2", 0, 6, "批发价")],
  },
  {
    id: "so-006",
    no: "SO20260418-0006",
    customerCode: "C002",
    customerName: "杭州智帆商贸有限公司",
    warehouseCode: "WH002",
    warehouseName: "杭州电商仓",
    priceLevel: "标准价",
    accountPeriodDays: 0,
    creditLimit: 80000,
    orderDate: "2026-04-18",
    expectedDate: "2026-04-19",
    status: "待出库",
    remark: "客户自提前先打包。",
    createdBy: "李菲",
    createdAt: "2026-04-18 11:05:00",
    updatedBy: "陈诺",
    updatedAt: "2026-04-18 11:28:00",
    auditBy: "陈诺",
    auditAt: "2026-04-18 11:28:00",
    lines: [buildOrderLine("so-006-line-1", 2, 5, "标准价"), buildOrderLine("so-006-line-2", 1, 80, "标准价")],
  },
  {
    id: "so-007",
    no: "SO20260417-0007",
    customerCode: "C003",
    customerName: "苏州元禾供应链有限公司",
    warehouseCode: "WH003",
    warehouseName: "苏州仓",
    priceLevel: "伙伴价",
    accountPeriodDays: 15,
    creditLimit: 150000,
    orderDate: "2026-04-17",
    expectedDate: "2026-04-20",
    status: "部分出库",
    remark: "终端分两批交付。",
    createdBy: "沈岩",
    createdAt: "2026-04-17 14:10:00",
    updatedBy: "苏州仓",
    updatedAt: "2026-04-19 09:10:00",
    auditBy: "周曼",
    auditAt: "2026-04-17 15:00:00",
    lines: [buildOrderLine("so-007-line-1", 3, 6, "伙伴价"), buildOrderLine("so-007-line-2", 4, 30, "伙伴价")],
  },
  {
    id: "so-008",
    no: "SO20260417-0008",
    customerCode: "C001",
    customerName: "广州振华贸易有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    priceLevel: "批发价",
    accountPeriodDays: 30,
    creditLimit: 180000,
    orderDate: "2026-04-17",
    expectedDate: "2026-04-21",
    status: "部分出库",
    remark: "扫码枪按客户要求拆单发。",
    createdBy: "王晨",
    createdAt: "2026-04-17 16:20:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-19 16:00:00",
    auditBy: "陈诺",
    auditAt: "2026-04-17 17:10:00",
    lines: [buildOrderLine("so-008-line-1", 0, 20, "批发价"), buildOrderLine("so-008-line-2", 1, 40, "批发价")],
  },
  {
    id: "so-009",
    no: "SO20260416-0009",
    customerCode: "C002",
    customerName: "杭州智帆商贸有限公司",
    warehouseCode: "WH002",
    warehouseName: "杭州电商仓",
    priceLevel: "标准价",
    accountPeriodDays: 0,
    creditLimit: 80000,
    orderDate: "2026-04-16",
    expectedDate: "2026-04-18",
    status: "已完成",
    remark: "打印机整单已交付。",
    createdBy: "李菲",
    createdAt: "2026-04-16 09:00:00",
    updatedBy: "杭州电商仓",
    updatedAt: "2026-04-18 18:00:00",
    auditBy: "陈诺",
    auditAt: "2026-04-16 10:00:00",
    lines: [buildOrderLine("so-009-line-1", 2, 8, "标准价"), buildOrderLine("so-009-line-2", 1, 60, "标准价")],
  },
  {
    id: "so-010",
    no: "SO20260416-0010",
    customerCode: "C004",
    customerName: "深圳腾岳科技有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    priceLevel: "VIP价",
    accountPeriodDays: 45,
    creditLimit: 300000,
    orderDate: "2026-04-16",
    expectedDate: "2026-04-19",
    status: "已完成",
    remark: "项目客户首批设备已签收。",
    createdBy: "王晨",
    createdAt: "2026-04-16 11:00:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-18 12:10:00",
    auditBy: "陈诺",
    auditAt: "2026-04-16 12:00:00",
    lines: [buildOrderLine("so-010-line-1", 3, 6, "VIP价"), buildOrderLine("so-010-line-2", 0, 12, "VIP价")],
  },
  {
    id: "so-011",
    no: "SO20260415-0011",
    customerCode: "C003",
    customerName: "苏州元禾供应链有限公司",
    warehouseCode: "WH003",
    warehouseName: "苏州仓",
    priceLevel: "伙伴价",
    accountPeriodDays: 15,
    creditLimit: 150000,
    orderDate: "2026-04-15",
    expectedDate: "2026-04-17",
    status: "已作废",
    remark: "客户取消订单。",
    createdBy: "沈岩",
    createdAt: "2026-04-15 13:20:00",
    updatedBy: "周曼",
    updatedAt: "2026-04-15 14:00:00",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("so-011-line-1", 4, 10, "伙伴价"), buildOrderLine("so-011-line-2", 1, 30, "伙伴价")],
  },
  {
    id: "so-012",
    no: "SO20260415-0012",
    customerCode: "C001",
    customerName: "广州振华贸易有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    priceLevel: "批发价",
    accountPeriodDays: 30,
    creditLimit: 180000,
    orderDate: "2026-04-15",
    expectedDate: "2026-04-18",
    status: "待出库",
    remark: "第二批扫码枪待发货。",
    createdBy: "王晨",
    createdAt: "2026-04-15 15:30:00",
    updatedBy: "陈诺",
    updatedAt: "2026-04-15 16:10:00",
    auditBy: "陈诺",
    auditAt: "2026-04-15 16:10:00",
    lines: [buildOrderLine("so-012-line-1", 0, 10, "批发价"), buildOrderLine("so-012-line-2", 1, 50, "批发价")],
  },
];

const stockoutSeedFallback: SalesStockoutSeed[] = [
  {
    id: "sout-001",
    no: "SO-OUT20260420-0001",
    orderId: "so-005",
    stockoutDate: "2026-04-20",
    status: "草稿",
    remark: "第一车待装货。",
    createdBy: "苏州仓",
    createdAt: "2026-04-20 09:15:00",
    updatedBy: "苏州仓",
    updatedAt: "2026-04-20 09:22:00",
    confirmBy: "",
    confirmAt: "",
    lines: [
      { id: "sout-001-line-1", orderLineId: "so-005-line-1", stockoutQty: 40, price: 18, note: "" },
      { id: "sout-001-line-2", orderLineId: "so-005-line-2", stockoutQty: 2, price: 299, note: "先发2支" },
    ],
  },
  {
    id: "sout-002",
    no: "SO-OUT20260420-0002",
    orderId: "so-006",
    stockoutDate: "2026-04-20",
    status: "草稿",
    remark: "客户自提前待复核。",
    createdBy: "杭州电商仓",
    createdAt: "2026-04-20 10:05:00",
    updatedBy: "杭州电商仓",
    updatedAt: "2026-04-20 10:10:00",
    confirmBy: "",
    confirmAt: "",
    lines: [
      { id: "sout-002-line-1", orderLineId: "so-006-line-1", stockoutQty: 2, price: 759, note: "" },
      { id: "sout-002-line-2", orderLineId: "so-006-line-2", stockoutQty: 20, price: 22, note: "" },
    ],
  },
  {
    id: "sout-003",
    no: "SO-OUT20260420-0003",
    orderId: "so-007",
    stockoutDate: "2026-04-20",
    status: "草稿",
    remark: "第二批终端待发车。",
    createdBy: "苏州仓",
    createdAt: "2026-04-20 11:10:00",
    updatedBy: "苏州仓",
    updatedAt: "2026-04-20 11:18:00",
    confirmBy: "",
    confirmAt: "",
    lines: [
      { id: "sout-003-line-1", orderLineId: "so-007-line-1", stockoutQty: 2, price: 1819, note: "" },
      { id: "sout-003-line-2", orderLineId: "so-007-line-2", stockoutQty: 10, price: 57, note: "" },
    ],
  },
  {
    id: "sout-004",
    no: "SO-OUT20260419-0004",
    orderId: "so-007",
    stockoutDate: "2026-04-19",
    status: "已出库",
    remark: "第一批终端已发。",
    createdBy: "苏州仓",
    createdAt: "2026-04-19 14:10:00",
    updatedBy: "苏州仓",
    updatedAt: "2026-04-19 14:20:00",
    confirmBy: "苏州仓",
    confirmAt: "2026-04-19 14:20:00",
    lines: [
      { id: "sout-004-line-1", orderLineId: "so-007-line-1", stockoutQty: 2, price: 1819, note: "" },
      { id: "sout-004-line-2", orderLineId: "so-007-line-2", stockoutQty: 8, price: 57, note: "" },
    ],
  },
  {
    id: "sout-005",
    no: "SO-OUT20260419-0005",
    orderId: "so-008",
    stockoutDate: "2026-04-19",
    status: "已出库",
    remark: "第一批扫码枪已发。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-19 15:10:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-19 15:18:00",
    confirmBy: "广州中央仓",
    confirmAt: "2026-04-19 15:18:00",
    lines: [
      { id: "sout-005-line-1", orderLineId: "so-008-line-1", stockoutQty: 8, price: 299, note: "" },
      { id: "sout-005-line-2", orderLineId: "so-008-line-2", stockoutQty: 10, price: 18, note: "" },
    ],
  },
  {
    id: "sout-006",
    no: "SO-OUT20260418-0006",
    orderId: "so-009",
    stockoutDate: "2026-04-18",
    status: "已出库",
    remark: "整单交付完成。",
    createdBy: "杭州电商仓",
    createdAt: "2026-04-18 16:00:00",
    updatedBy: "杭州电商仓",
    updatedAt: "2026-04-18 16:08:00",
    confirmBy: "杭州电商仓",
    confirmAt: "2026-04-18 16:08:00",
    lines: [
      { id: "sout-006-line-1", orderLineId: "so-009-line-1", stockoutQty: 8, price: 759, note: "" },
      { id: "sout-006-line-2", orderLineId: "so-009-line-2", stockoutQty: 60, price: 22, note: "" },
    ],
  },
  {
    id: "sout-007",
    no: "SO-OUT20260418-0007",
    orderId: "so-010",
    stockoutDate: "2026-04-18",
    status: "已出库",
    remark: "项目客户首批发货。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-18 10:30:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-18 10:38:00",
    confirmBy: "广州中央仓",
    confirmAt: "2026-04-18 10:38:00",
    lines: [
      { id: "sout-007-line-1", orderLineId: "so-010-line-1", stockoutQty: 6, price: 1849, note: "" },
      { id: "sout-007-line-2", orderLineId: "so-010-line-2", stockoutQty: 12, price: 285, note: "" },
    ],
  },
  {
    id: "sout-008",
    no: "SO-OUT20260417-0008",
    orderId: "so-008",
    stockoutDate: "2026-04-20",
    status: "已出库",
    remark: "第二批扫码枪已发。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-20 15:20:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-20 15:28:00",
    confirmBy: "广州中央仓",
    confirmAt: "2026-04-20 15:28:00",
    lines: [
      { id: "sout-008-line-1", orderLineId: "so-008-line-1", stockoutQty: 6, price: 299, note: "" },
      { id: "sout-008-line-2", orderLineId: "so-008-line-2", stockoutQty: 12, price: 18, note: "" },
    ],
  },
  {
    id: "sout-009",
    no: "SO-OUT20260417-0009",
    orderId: "so-012",
    stockoutDate: "2026-04-17",
    status: "已出库",
    remark: "第二批发货已完成。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-17 13:10:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-17 13:18:00",
    confirmBy: "广州中央仓",
    confirmAt: "2026-04-17 13:18:00",
    lines: [
      { id: "sout-009-line-1", orderLineId: "so-012-line-1", stockoutQty: 10, price: 299, note: "" },
      { id: "sout-009-line-2", orderLineId: "so-012-line-2", stockoutQty: 50, price: 18, note: "" },
    ],
  },
  {
    id: "sout-010",
    no: "SO-OUT20260416-0010",
    orderId: "so-008",
    stockoutDate: "2026-04-16",
    status: "已作废",
    remark: "误建草稿后作废。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-16 12:30:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-16 12:35:00",
    confirmBy: "",
    confirmAt: "",
    lines: [{ id: "sout-010-line-1", orderLineId: "so-008-line-1", stockoutQty: 2, price: 299, note: "" }],
  },
];

function getStoredOrderSeeds() {
  return readStorage(ORDER_STORAGE_KEY, orderSeedFallback);
}

function setStoredOrderSeeds(records: SalesOrderSeed[]) {
  writeStorage(ORDER_STORAGE_KEY, records);
}

function getStoredStockoutSeeds() {
  return readStorage(STOCKOUT_STORAGE_KEY, stockoutSeedFallback);
}

function setStoredStockoutSeeds(records: SalesStockoutSeed[]) {
  writeStorage(STOCKOUT_STORAGE_KEY, records);
}

function buildShippedMap(stockouts: SalesStockoutSeed[]) {
  return stockouts
    .filter((stockout) => stockout.status === "已出库")
    .reduce<Record<string, number>>((acc, stockout) => {
      stockout.lines.forEach((line) => {
        acc[line.orderLineId] = (acc[line.orderLineId] ?? 0) + Number(line.stockoutQty || 0);
      });
      return acc;
    }, {});
}

function hydrateOrders(orderSeeds: SalesOrderSeed[], stockoutSeeds: SalesStockoutSeed[]): SalesOrderRecord[] {
  const shippedMap = buildShippedMap(stockoutSeeds);
  return orderSeeds.map((seed) => {
    const lines = seed.lines.map((line) => {
      const shippedQty = shippedMap[line.id] ?? 0;
      const pendingQty = Math.max(Number(line.qty || 0) - shippedQty, 0);
      return {
        ...line,
        amount: Number((Number(line.qty || 0) * Number(line.price || 0)).toFixed(2)),
        shippedQty,
        pendingQty,
      };
    });
    const shippedTotalQty = lines.reduce((sum, line) => sum + line.shippedQty, 0);
    const pendingTotalQty = lines.reduce((sum, line) => sum + line.pendingQty, 0);
    let status = seed.status;
    if (status !== "草稿" && status !== "待审核" && status !== "已作废") {
      if (seed.closedManually || pendingTotalQty === 0) {
        status = "已完成";
      } else if (shippedTotalQty > 0) {
        status = "部分出库";
      } else {
        status = "待出库";
      }
    }
    return {
      ...seed,
      customerLabel: `${seed.customerCode} ${seed.customerName}`,
      warehouseLabel: `${seed.warehouseCode} ${seed.warehouseName}`,
      status,
      statusTone: getSalesTone(status),
      lines,
      skuCount: lines.length,
      totalQty: lines.reduce((sum, line) => sum + Number(line.qty || 0), 0),
      totalAmount: Number(lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2)),
      shippedTotalQty,
      pendingTotalQty,
    };
  });
}

function hydrateStockouts(orderSeeds: SalesOrderSeed[], stockoutSeeds: SalesStockoutSeed[]): SalesStockoutRecord[] {
  const orders = hydrateOrders(orderSeeds, stockoutSeeds);
  return stockoutSeeds.map((seed) => {
    const order = orders.find((item) => item.id === seed.orderId);
    const lines = seed.lines.map((line) => {
      const orderLine = order?.lines.find((item) => item.id === line.orderLineId);
      const qty = Number(line.stockoutQty || 0);
      const price = Number(line.price || 0);
      return {
        ...line,
        skuCode: orderLine?.skuCode ?? "-",
        skuName: orderLine?.skuName ?? "-",
        spec: orderLine?.spec ?? "-",
        unit: orderLine?.unit ?? "-",
        orderQty: orderLine?.qty ?? 0,
        pendingQty: orderLine?.pendingQty ?? 0,
        amount: Number((qty * price).toFixed(2)),
      };
    });
    return {
      ...seed,
      orderNo: order?.no ?? "-",
      customerLabel: order?.customerLabel ?? "-",
      warehouseLabel: order?.warehouseLabel ?? "-",
      statusTone: getSalesTone(seed.status),
      lines,
      totalQty: lines.reduce((sum, line) => sum + line.stockoutQty, 0),
      totalAmount: Number(lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2)),
    };
  });
}

export function getSalesWorkspace() {
  const orderSeeds = getStoredOrderSeeds();
  const stockoutSeeds = getStoredStockoutSeeds();
  return {
    orders: hydrateOrders(orderSeeds, stockoutSeeds),
    stockouts: hydrateStockouts(orderSeeds, stockoutSeeds),
  };
}

export function getSalesOrders() {
  return getSalesWorkspace().orders;
}

export function getSalesOrder(id: string) {
  return getSalesOrders().find((item) => item.id === id) ?? null;
}

export function getSalesStockouts() {
  return getSalesWorkspace().stockouts;
}

export function getSalesStockout(id: string) {
  return getSalesStockouts().find((item) => item.id === id) ?? null;
}

export function getCustomerOptions() {
  return customers.map((item) => `${item.code} ${item.name}`);
}

export function getWarehouseOptions() {
  return warehouses.map((item) => `${item.code} ${item.name}`);
}

export function getProductOptions() {
  return products.map((item) => `${item.code} ${item.name}`);
}

export function findCustomer(option: string) {
  return customers.find((item) => `${item.code} ${item.name}` === option) ?? null;
}

export function findWarehouse(option: string) {
  return warehouses.find((item) => `${item.code} ${item.name}` === option) ?? null;
}

export function findProduct(option: string) {
  return products.find((item) => `${item.code} ${item.name}` === option) ?? null;
}

export function getPriceForLevel(productCode: string, level: PriceLevel) {
  return products.find((item) => item.code === productCode)?.prices[level] ?? 0;
}

export function createSalesOrderDraft(): SalesOrderRecord {
  return {
    id: `sales-order-draft-${Date.now()}`,
    no: "",
    customerCode: "",
    customerName: "",
    customerLabel: "",
    warehouseCode: "",
    warehouseName: "",
    warehouseLabel: "",
    priceLevel: "标准价",
    accountPeriodDays: 0,
    creditLimit: 0,
    orderDate: nowDate(),
    expectedDate: "",
    status: "草稿",
    statusTone: "gray",
    remark: "",
    lines: [
      {
        id: `line-${Date.now()}`,
        skuCode: "",
        skuName: "",
        spec: "",
        unit: "",
        availableStock: 0,
        qty: 0,
        price: 0,
        taxRate: "",
        discountRate: 100,
        amount: 0,
        shippedQty: 0,
        pendingQty: 0,
        note: "",
      },
    ],
    skuCount: 1,
    totalQty: 0,
    totalAmount: 0,
    shippedTotalQty: 0,
    pendingTotalQty: 0,
    createdBy: CURRENT_USER,
    createdAt: nowDateTime(),
    updatedBy: CURRENT_USER,
    updatedAt: nowDateTime(),
    auditBy: "",
    auditAt: "",
  };
}

export function getStockoutSourceOrders() {
  return getSalesOrders().filter((item) => item.status === "待出库" || item.status === "部分出库");
}

export function buildStockoutLinesFromOrder(order: SalesOrderRecord): SalesStockoutLine[] {
  return order.lines.map((line) => ({
    id: `stockout-line-${line.id}`,
    orderLineId: line.id,
    skuCode: line.skuCode,
    skuName: line.skuName,
    spec: line.spec,
    unit: line.unit,
    orderQty: line.qty,
    pendingQty: line.pendingQty,
    stockoutQty: 0,
    price: line.price,
    amount: 0,
    note: "",
  }));
}

export function createSalesStockoutDraft(orderId = ""): SalesStockoutRecord {
  const order = orderId ? getSalesOrder(orderId) : null;
  return {
    id: `sales-stockout-draft-${Date.now()}`,
    no: "",
    orderId: order?.id ?? "",
    orderNo: order?.no ?? "",
    customerLabel: order?.customerLabel ?? "",
    warehouseLabel: order?.warehouseLabel ?? "",
    stockoutDate: nowDate(),
    status: "草稿",
    statusTone: "gray",
    remark: "",
    lines: order ? buildStockoutLinesFromOrder(order) : [],
    totalQty: 0,
    totalAmount: 0,
    createdBy: CURRENT_USER,
    createdAt: nowDateTime(),
    updatedBy: CURRENT_USER,
    updatedAt: nowDateTime(),
    confirmBy: "",
    confirmAt: "",
  };
}

function nextNumber(prefix: "SO" | "SO-OUT", existingNos: string[]) {
  const today = nowDate().replace(/-/g, "");
  const maxSeq = existingNos
    .filter((no) => no.startsWith(`${prefix}${today}-`))
    .map((no) => Number(no.split("-")[1] ?? 0))
    .reduce((max, current) => Math.max(max, current), 0);
  return `${prefix}${today}-${String(maxSeq + 1).padStart(4, "0")}`;
}

function toOrderSeed(record: SalesOrderRecord, status: SalesOrderStatus): SalesOrderSeed {
  return {
    ...record,
    status,
    lines: record.lines.map((line) => ({
      id: line.id,
      skuCode: line.skuCode,
      skuName: line.skuName,
      spec: line.spec,
      unit: line.unit,
      availableStock: line.availableStock,
      qty: Number(line.qty || 0),
      price: Number(line.price || 0),
      taxRate: line.taxRate,
      discountRate: Number(line.discountRate || 100),
      note: line.note,
    })),
  };
}

function toStockoutSeed(record: SalesStockoutRecord, status: SalesStockoutStatus): SalesStockoutSeed {
  return {
    ...record,
    status,
    lines: record.lines.map((line) => ({
      id: line.id,
      orderLineId: line.orderLineId,
      stockoutQty: Number(line.stockoutQty || 0),
      price: Number(line.price || 0),
      note: line.note,
    })),
  };
}

function replaceRecord<T extends { id: string }>(items: T[], record: T) {
  const exists = items.some((item) => item.id === record.id);
  return exists ? items.map((item) => (item.id === record.id ? record : item)) : [record, ...items];
}

export function saveSalesOrder(record: SalesOrderRecord, intent: "draft" | "submit") {
  const orderSeeds = getStoredOrderSeeds();
  const source = getSalesOrder(record.id);
  const timestamp = nowDateTime();
  const status = intent === "submit" ? "待审核" : "草稿";
  const nextRecord: SalesOrderRecord = {
    ...record,
    no: record.no || nextNumber("SO", getSalesOrders().map((item) => item.no)),
    status,
    statusTone: getSalesTone(status),
    skuCount: record.lines.length,
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.qty || 0), 0),
    totalAmount: Number(record.lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.price || 0), 0).toFixed(2)),
    shippedTotalQty: source?.shippedTotalQty ?? 0,
    pendingTotalQty: record.lines.reduce((sum, line) => sum + Number(line.qty || 0), 0) - (source?.shippedTotalQty ?? 0),
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    auditBy: source?.auditBy ?? "",
    auditAt: source?.auditAt ?? "",
    closedManually: false,
  };
  setStoredOrderSeeds(replaceRecord(orderSeeds, toOrderSeed(nextRecord, status)));
  return getSalesOrder(nextRecord.id);
}

export function approveSalesOrder(id: string) {
  const records = getStoredOrderSeeds();
  const timestamp = nowDateTime();
  setStoredOrderSeeds(records.map((item) => (item.id === id ? { ...item, status: "待出库", updatedBy: CURRENT_USER, updatedAt: timestamp, auditBy: CURRENT_USER, auditAt: timestamp } : item)));
}

export function rejectSalesOrder(id: string) {
  const records = getStoredOrderSeeds();
  const timestamp = nowDateTime();
  setStoredOrderSeeds(records.map((item) => (item.id === id ? { ...item, status: "草稿", updatedBy: CURRENT_USER, updatedAt: timestamp, auditBy: "", auditAt: "" } : item)));
}

export function voidSalesOrder(id: string) {
  const records = getStoredOrderSeeds();
  const timestamp = nowDateTime();
  setStoredOrderSeeds(records.map((item) => (item.id === id ? { ...item, status: "已作废", updatedBy: CURRENT_USER, updatedAt: timestamp } : item)));
}

export function closeSalesOrder(id: string) {
  const records = getStoredOrderSeeds();
  const timestamp = nowDateTime();
  setStoredOrderSeeds(records.map((item) => (item.id === id ? { ...item, status: "已完成", closedManually: true, updatedBy: CURRENT_USER, updatedAt: timestamp } : item)));
}

export function saveSalesStockout(record: SalesStockoutRecord) {
  const stockoutSeeds = getStoredStockoutSeeds();
  const source = getSalesStockout(record.id);
  const timestamp = nowDateTime();
  const nextRecord: SalesStockoutRecord = {
    ...record,
    no: record.no || nextNumber("SO-OUT", getSalesStockouts().map((item) => item.no)),
    status: "草稿",
    statusTone: "gray",
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.stockoutQty || 0), 0),
    totalAmount: Number(record.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    confirmBy: source?.confirmBy ?? "",
    confirmAt: source?.confirmAt ?? "",
  };
  setStoredStockoutSeeds(replaceRecord(stockoutSeeds, toStockoutSeed(nextRecord, "草稿")));
  return getSalesStockout(nextRecord.id);
}

export function confirmSalesStockout(record: SalesStockoutRecord) {
  const order = getSalesOrder(record.orderId);
  if (!order || (order.status !== "待出库" && order.status !== "部分出库")) {
    return null;
  }
  const stockoutSeeds = getStoredStockoutSeeds();
  const source = getSalesStockout(record.id);
  const timestamp = nowDateTime();
  const nextRecord: SalesStockoutRecord = {
    ...record,
    no: record.no || nextNumber("SO-OUT", getSalesStockouts().map((item) => item.no)),
    status: "已出库",
    statusTone: "green",
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.stockoutQty || 0), 0),
    totalAmount: Number(record.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    confirmBy: CURRENT_USER,
    confirmAt: timestamp,
  };
  setStoredStockoutSeeds(replaceRecord(stockoutSeeds, toStockoutSeed(nextRecord, "已出库")));
  return getSalesStockout(nextRecord.id);
}

export function deleteSalesOrder(id: string) {
  setStoredOrderSeeds(getStoredOrderSeeds().filter((item) => item.id !== id));
}

export function deleteSalesStockout(id: string) {
  setStoredStockoutSeeds(getStoredStockoutSeeds().filter((item) => item.id !== id));
}

export function getLinkedSalesStockouts(orderId: string) {
  return getSalesStockouts().filter((item) => item.orderId === orderId);
}
