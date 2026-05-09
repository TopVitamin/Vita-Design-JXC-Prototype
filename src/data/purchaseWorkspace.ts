export type PurchaseOrderStatus = "草稿" | "待审核" | "待入库" | "部分入库" | "已完成" | "已作废";
export type PurchaseReceiptStatus = "草稿" | "已入库" | "已作废";
export type Tone = "green" | "blue" | "orange" | "red" | "gray";

export type PurchaseOrderLine = {
  id: string;
  skuCode: string;
  skuName: string;
  skuBarcode: string;
  spec: string;
  unit: string;
  qty: number;
  price: number;
  taxRate: string;
  amount: number;
  receivedQty: number;
  pendingQty: number;
  note: string;
};

export type PurchaseReceiptLine = {
  id: string;
  orderLineId: string;
  skuCode: string;
  skuName: string;
  spec: string;
  unit: string;
  orderQty: number;
  pendingQty: number;
  receivedQty: number;
  stockedQty: number;
  diffQty: number;
  diffReason: string;
  abnormalNote: string;
  stockInPrice: number;
  stockInAmount: number;
};

export type PurchaseOrderRecord = {
  id: string;
  no: string;
  supplierCode: string;
  supplierName: string;
  supplierLabel: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseLabel: string;
  orderDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  statusTone: Tone;
  remark: string;
  lines: PurchaseOrderLine[];
  skuCount: number;
  totalQty: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  auditBy: string;
  auditAt: string;
  closedManually?: boolean;
};

export type PurchaseReceiptRecord = {
  id: string;
  no: string;
  orderId: string;
  orderNo: string;
  supplierCode: string;
  supplierName: string;
  supplierLabel: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseLabel: string;
  stockInDate: string;
  status: PurchaseReceiptStatus;
  statusTone: Tone;
  remark: string;
  lines: PurchaseReceiptLine[];
  totalQty: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  confirmBy: string;
  confirmAt: string;
};

type PurchaseOrderSeed = Omit<PurchaseOrderRecord, "lines" | "skuCount" | "totalQty" | "totalAmount" | "statusTone"> & {
  lines: Array<Omit<PurchaseOrderLine, "amount" | "receivedQty" | "pendingQty">>;
};

type PurchaseReceiptSeed = Omit<
  PurchaseReceiptRecord,
  "orderNo" | "supplierCode" | "supplierName" | "supplierLabel" | "warehouseCode" | "warehouseName" | "warehouseLabel" | "lines" | "totalQty" | "totalAmount" | "statusTone"
> & {
  lines: Array<Omit<PurchaseReceiptLine, "skuCode" | "skuName" | "spec" | "unit" | "orderQty" | "pendingQty" | "diffQty" | "stockInAmount">>;
};

const ORDER_STORAGE_KEY = "jxc-purchase-orders-v20260420";
const RECEIPT_STORAGE_KEY = "jxc-purchase-receipts-v20260420";
const CURRENT_USER = "当前用户";

export const purchaseTaxRateOptions = ["0%", "3%", "6%", "9%", "13%"];
export const purchaseReceiptDiffReasons = ["少货", "质量问题", "型号不符", "配件缺失", "其他"];

const suppliers = [
  { code: "VEND001", name: "常青供应链科技有限公司" },
  { code: "VEND002", name: "华远包装材料有限公司" },
  { code: "VEND003", name: "博辰电子设备有限公司" },
  { code: "VEND004", name: "海岳辅料贸易有限公司" },
];

const warehouses = [
  { code: "WH001", name: "广州中央仓" },
  { code: "WH002", name: "杭州电商仓" },
  { code: "WH003", name: "成都分拨仓" },
];

const catalog = [
  { code: "SKU1001", name: "无线扫码枪", barcode: "6901001000012", spec: "X1标准版", unit: "支", price: 299, taxRate: "13%" },
  { code: "SKU1002", name: "热敏标签纸", barcode: "6901001000029", spec: "100*50", unit: "卷", price: 18, taxRate: "13%" },
  { code: "SKU1003", name: "周转箱", barcode: "", spec: "60L蓝色", unit: "个", price: 46, taxRate: "13%" },
  { code: "SKU1004", name: "PDA手持终端", barcode: "6901001000043", spec: "T8 4G", unit: "台", price: 1680, taxRate: "13%" },
  { code: "SKU1005", name: "防震泡沫袋", barcode: "", spec: "中号", unit: "包", price: 22, taxRate: "13%" },
  { code: "SKU1006", name: "货位卡", barcode: "6901001000067", spec: "通用型", unit: "盒", price: 35, taxRate: "13%" },
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

export function formatMoney(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatInt(value: number) {
  return value.toLocaleString("zh-CN");
}

export function getStatusTone(status: PurchaseOrderStatus | PurchaseReceiptStatus): Tone {
  switch (status) {
    case "待审核":
      return "orange";
    case "待入库":
      return "blue";
    case "部分入库":
      return "blue";
    case "已完成":
    case "已入库":
      return "green";
    case "已作废":
      return "red";
    default:
      return "gray";
  }
}

function buildOrderLine(id: string, itemIndex: number, qty: number, note = "") {
  const item = catalog[itemIndex];
  return {
    id,
    skuCode: item.code,
    skuName: item.name,
    skuBarcode: item.barcode,
    spec: item.spec,
    unit: item.unit,
    qty,
    price: item.price,
    taxRate: item.taxRate,
    note,
  };
}

const orderSeedFallback: PurchaseOrderSeed[] = [
  {
    id: "po-001",
    no: "PO20260419-0001",
    supplierCode: "VEND001",
    supplierName: "常青供应链科技有限公司",
    supplierLabel: "VEND001 常青供应链科技有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    warehouseLabel: "WH001 广州中央仓",
    orderDate: "2026-04-19",
    expectedDate: "2026-04-23",
    status: "草稿",
    remark: "扫码设备补货，优先到广州仓。",
    createdBy: "林悦",
    createdAt: "2026-04-19 09:12:00",
    updatedBy: "林悦",
    updatedAt: "2026-04-19 09:12:00",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("po-001-line-1", 0, 20), buildOrderLine("po-001-line-2", 1, 60)],
  },
  {
    id: "po-002",
    no: "PO20260419-0002",
    supplierCode: "VEND002",
    supplierName: "华远包装材料有限公司",
    supplierLabel: "VEND002 华远包装材料有限公司",
    warehouseCode: "WH002",
    warehouseName: "杭州电商仓",
    warehouseLabel: "WH002 杭州电商仓",
    orderDate: "2026-04-19",
    expectedDate: "2026-04-24",
    status: "草稿",
    remark: "包装耗材按本周缺口补货。",
    createdBy: "周晴",
    createdAt: "2026-04-19 11:08:15",
    updatedBy: "周晴",
    updatedAt: "2026-04-19 11:08:15",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("po-002-line-1", 4, 120), buildOrderLine("po-002-line-2", 5, 40)],
  },
  {
    id: "po-003",
    no: "PO20260418-0003",
    supplierCode: "VEND003",
    supplierName: "博辰电子设备有限公司",
    supplierLabel: "VEND003 博辰电子设备有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    warehouseLabel: "WH001 广州中央仓",
    orderDate: "2026-04-18",
    expectedDate: "2026-04-21",
    status: "待审核",
    remark: "PDA设备一期铺仓。",
    createdBy: "林悦",
    createdAt: "2026-04-18 15:20:11",
    updatedBy: "林悦",
    updatedAt: "2026-04-18 16:45:20",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("po-003-line-1", 3, 12), buildOrderLine("po-003-line-2", 0, 10)],
  },
  {
    id: "po-004",
    no: "PO20260418-0004",
    supplierCode: "VEND004",
    supplierName: "海岳辅料贸易有限公司",
    supplierLabel: "VEND004 海岳辅料贸易有限公司",
    warehouseCode: "WH003",
    warehouseName: "成都分拨仓",
    warehouseLabel: "WH003 成都分拨仓",
    orderDate: "2026-04-18",
    expectedDate: "2026-04-22",
    status: "待审核",
    remark: "辅料集中采购。",
    createdBy: "周晴",
    createdAt: "2026-04-18 13:40:00",
    updatedBy: "周晴",
    updatedAt: "2026-04-18 13:55:20",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("po-004-line-1", 2, 35), buildOrderLine("po-004-line-2", 4, 80)],
  },
  {
    id: "po-005",
    no: "PO20260417-0005",
    supplierCode: "VEND001",
    supplierName: "常青供应链科技有限公司",
    supplierLabel: "VEND001 常青供应链科技有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    warehouseLabel: "WH001 广州中央仓",
    orderDate: "2026-04-17",
    expectedDate: "2026-04-20",
    status: "待入库",
    remark: "门店扩仓前先到一批扫码设备。",
    createdBy: "林悦",
    createdAt: "2026-04-17 10:12:00",
    updatedBy: "吴皓",
    updatedAt: "2026-04-17 18:25:12",
    auditBy: "吴皓",
    auditAt: "2026-04-17 18:25:12",
    lines: [buildOrderLine("po-005-line-1", 0, 16), buildOrderLine("po-005-line-2", 1, 80)],
  },
  {
    id: "po-006",
    no: "PO20260417-0006",
    supplierCode: "VEND002",
    supplierName: "华远包装材料有限公司",
    supplierLabel: "VEND002 华远包装材料有限公司",
    warehouseCode: "WH002",
    warehouseName: "杭州电商仓",
    warehouseLabel: "WH002 杭州电商仓",
    orderDate: "2026-04-17",
    expectedDate: "2026-04-21",
    status: "待入库",
    remark: "大促前包装耗材预备量。",
    createdBy: "周晴",
    createdAt: "2026-04-17 09:30:45",
    updatedBy: "吴皓",
    updatedAt: "2026-04-17 16:10:00",
    auditBy: "吴皓",
    auditAt: "2026-04-17 16:10:00",
    lines: [buildOrderLine("po-006-line-1", 4, 90), buildOrderLine("po-006-line-2", 5, 30)],
  },
  {
    id: "po-007",
    no: "PO20260416-0007",
    supplierCode: "VEND003",
    supplierName: "博辰电子设备有限公司",
    supplierLabel: "VEND003 博辰电子设备有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    warehouseLabel: "WH001 广州中央仓",
    orderDate: "2026-04-16",
    expectedDate: "2026-04-19",
    status: "部分入库",
    remark: "PDA首批到货，需分批收货。",
    createdBy: "林悦",
    createdAt: "2026-04-16 10:45:12",
    updatedBy: "王倩",
    updatedAt: "2026-04-19 14:22:10",
    auditBy: "吴皓",
    auditAt: "2026-04-16 18:00:00",
    lines: [buildOrderLine("po-007-line-1", 3, 12), buildOrderLine("po-007-line-2", 0, 10)],
  },
  {
    id: "po-008",
    no: "PO20260416-0008",
    supplierCode: "VEND004",
    supplierName: "海岳辅料贸易有限公司",
    supplierLabel: "VEND004 海岳辅料贸易有限公司",
    warehouseCode: "WH003",
    warehouseName: "成都分拨仓",
    warehouseLabel: "WH003 成都分拨仓",
    orderDate: "2026-04-16",
    expectedDate: "2026-04-20",
    status: "部分入库",
    remark: "分拨仓辅料首批已到，剩余待补。",
    createdBy: "周晴",
    createdAt: "2026-04-16 11:02:30",
    updatedBy: "王倩",
    updatedAt: "2026-04-19 09:10:28",
    auditBy: "吴皓",
    auditAt: "2026-04-16 17:40:16",
    lines: [buildOrderLine("po-008-line-1", 2, 50), buildOrderLine("po-008-line-2", 4, 100)],
  },
  {
    id: "po-009",
    no: "PO20260415-0009",
    supplierCode: "VEND001",
    supplierName: "常青供应链科技有限公司",
    supplierLabel: "VEND001 常青供应链科技有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    warehouseLabel: "WH001 广州中央仓",
    orderDate: "2026-04-15",
    expectedDate: "2026-04-18",
    status: "已完成",
    remark: "扫码枪整单已收齐。",
    createdBy: "林悦",
    createdAt: "2026-04-15 09:00:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-18 16:20:01",
    auditBy: "吴皓",
    auditAt: "2026-04-15 15:30:15",
    lines: [buildOrderLine("po-009-line-1", 0, 14), buildOrderLine("po-009-line-2", 1, 40)],
  },
  {
    id: "po-010",
    no: "PO20260415-0010",
    supplierCode: "VEND002",
    supplierName: "华远包装材料有限公司",
    supplierLabel: "VEND002 华远包装材料有限公司",
    warehouseCode: "WH002",
    warehouseName: "杭州电商仓",
    warehouseLabel: "WH002 杭州电商仓",
    orderDate: "2026-04-15",
    expectedDate: "2026-04-18",
    status: "已完成",
    remark: "包装耗材已全部收齐。",
    createdBy: "周晴",
    createdAt: "2026-04-15 10:08:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-18 10:11:33",
    auditBy: "吴皓",
    auditAt: "2026-04-15 14:20:08",
    lines: [buildOrderLine("po-010-line-1", 4, 120), buildOrderLine("po-010-line-2", 5, 60)],
  },
  {
    id: "po-011",
    no: "PO20260414-0011",
    supplierCode: "VEND003",
    supplierName: "博辰电子设备有限公司",
    supplierLabel: "VEND003 博辰电子设备有限公司",
    warehouseCode: "WH001",
    warehouseName: "广州中央仓",
    warehouseLabel: "WH001 广州中央仓",
    orderDate: "2026-04-14",
    expectedDate: "2026-04-17",
    status: "已作废",
    remark: "需求取消，整单作废。",
    createdBy: "林悦",
    createdAt: "2026-04-14 13:08:19",
    updatedBy: "吴皓",
    updatedAt: "2026-04-15 08:31:45",
    auditBy: "",
    auditAt: "",
    lines: [buildOrderLine("po-011-line-1", 3, 8), buildOrderLine("po-011-line-2", 0, 6)],
  },
  {
    id: "po-012",
    no: "PO20260414-0012",
    supplierCode: "VEND004",
    supplierName: "海岳辅料贸易有限公司",
    supplierLabel: "VEND004 海岳辅料贸易有限公司",
    warehouseCode: "WH003",
    warehouseName: "成都分拨仓",
    warehouseLabel: "WH003 成都分拨仓",
    orderDate: "2026-04-14",
    expectedDate: "2026-04-19",
    status: "待入库",
    remark: "西南仓一期耗材补货。",
    createdBy: "周晴",
    createdAt: "2026-04-14 09:18:00",
    updatedBy: "吴皓",
    updatedAt: "2026-04-14 17:40:19",
    auditBy: "吴皓",
    auditAt: "2026-04-14 17:40:19",
    lines: [buildOrderLine("po-012-line-1", 2, 28), buildOrderLine("po-012-line-2", 4, 75)],
  },
];

const receiptSeedFallback: PurchaseReceiptSeed[] = [
  {
    id: "pi-001",
    no: "PI20260419-0001",
    orderId: "po-005",
    stockInDate: "2026-04-20",
    status: "草稿",
    remark: "到货待验，先登记草稿。",
    createdBy: "王倩",
    createdAt: "2026-04-20 09:10:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-20 09:18:00",
    confirmBy: "",
    confirmAt: "",
    lines: [
      { id: "pi-001-line-1", orderLineId: "po-005-line-1", receivedQty: 8, stockedQty: 8, diffReason: "", abnormalNote: "", stockInPrice: 299 },
      { id: "pi-001-line-2", orderLineId: "po-005-line-2", receivedQty: 40, stockedQty: 38, diffReason: "少货", abnormalNote: "外箱少到2卷", stockInPrice: 18 },
    ],
  },
  {
    id: "pi-002",
    no: "PI20260419-0002",
    orderId: "po-006",
    stockInDate: "2026-04-20",
    status: "草稿",
    remark: "包装材料待仓管复核。",
    createdBy: "王倩",
    createdAt: "2026-04-20 10:22:11",
    updatedBy: "王倩",
    updatedAt: "2026-04-20 10:22:11",
    confirmBy: "",
    confirmAt: "",
    lines: [
      { id: "pi-002-line-1", orderLineId: "po-006-line-1", receivedQty: 30, stockedQty: 30, diffReason: "", abnormalNote: "", stockInPrice: 22 },
      { id: "pi-002-line-2", orderLineId: "po-006-line-2", receivedQty: 10, stockedQty: 10, diffReason: "", abnormalNote: "", stockInPrice: 35 },
    ],
  },
  {
    id: "pi-003",
    no: "PI20260419-0003",
    orderId: "po-007",
    stockInDate: "2026-04-20",
    status: "草稿",
    remark: "补收批次待确认。",
    createdBy: "王倩",
    createdAt: "2026-04-20 11:01:09",
    updatedBy: "王倩",
    updatedAt: "2026-04-20 11:05:30",
    confirmBy: "",
    confirmAt: "",
    lines: [
      { id: "pi-003-line-1", orderLineId: "po-007-line-1", receivedQty: 2, stockedQty: 2, diffReason: "", abnormalNote: "", stockInPrice: 1680 },
      { id: "pi-003-line-2", orderLineId: "po-007-line-2", receivedQty: 2, stockedQty: 1, diffReason: "质量问题", abnormalNote: "1支屏幕碎裂", stockInPrice: 299 },
    ],
  },
  {
    id: "pi-004",
    no: "PI20260418-0004",
    orderId: "po-007",
    stockInDate: "2026-04-18",
    status: "已入库",
    remark: "首批PDA已入库。",
    createdBy: "王倩",
    createdAt: "2026-04-18 14:10:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-18 14:35:18",
    confirmBy: "王倩",
    confirmAt: "2026-04-18 14:35:18",
    lines: [
      { id: "pi-004-line-1", orderLineId: "po-007-line-1", receivedQty: 5, stockedQty: 5, diffReason: "", abnormalNote: "", stockInPrice: 1680 },
      { id: "pi-004-line-2", orderLineId: "po-007-line-2", receivedQty: 4, stockedQty: 4, diffReason: "", abnormalNote: "", stockInPrice: 299 },
    ],
  },
  {
    id: "pi-005",
    no: "PI20260418-0005",
    orderId: "po-008",
    stockInDate: "2026-04-18",
    status: "已入库",
    remark: "首批辅料入库。",
    createdBy: "王倩",
    createdAt: "2026-04-18 09:18:45",
    updatedBy: "王倩",
    updatedAt: "2026-04-18 09:32:00",
    confirmBy: "王倩",
    confirmAt: "2026-04-18 09:32:00",
    lines: [
      { id: "pi-005-line-1", orderLineId: "po-008-line-1", receivedQty: 20, stockedQty: 20, diffReason: "", abnormalNote: "", stockInPrice: 46 },
      { id: "pi-005-line-2", orderLineId: "po-008-line-2", receivedQty: 35, stockedQty: 32, diffReason: "少货", abnormalNote: "供应商补发3包", stockInPrice: 22 },
    ],
  },
  {
    id: "pi-006",
    no: "PI20260417-0006",
    orderId: "po-009",
    stockInDate: "2026-04-17",
    status: "已入库",
    remark: "扫码枪一次性全收。",
    createdBy: "王倩",
    createdAt: "2026-04-17 13:18:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-17 13:40:10",
    confirmBy: "王倩",
    confirmAt: "2026-04-17 13:40:10",
    lines: [
      { id: "pi-006-line-1", orderLineId: "po-009-line-1", receivedQty: 14, stockedQty: 14, diffReason: "", abnormalNote: "", stockInPrice: 299 },
      { id: "pi-006-line-2", orderLineId: "po-009-line-2", receivedQty: 40, stockedQty: 40, diffReason: "", abnormalNote: "", stockInPrice: 18 },
    ],
  },
  {
    id: "pi-007",
    no: "PI20260417-0007",
    orderId: "po-010",
    stockInDate: "2026-04-17",
    status: "已入库",
    remark: "包装材料整单入库。",
    createdBy: "王倩",
    createdAt: "2026-04-17 10:20:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-17 10:45:36",
    confirmBy: "王倩",
    confirmAt: "2026-04-17 10:45:36",
    lines: [
      { id: "pi-007-line-1", orderLineId: "po-010-line-1", receivedQty: 120, stockedQty: 120, diffReason: "", abnormalNote: "", stockInPrice: 22 },
      { id: "pi-007-line-2", orderLineId: "po-010-line-2", receivedQty: 60, stockedQty: 60, diffReason: "", abnormalNote: "", stockInPrice: 35 },
    ],
  },
  {
    id: "pi-008",
    no: "PI20260416-0008",
    orderId: "po-012",
    stockInDate: "2026-04-16",
    status: "已入库",
    remark: "首批西南仓辅料到货。",
    createdBy: "王倩",
    createdAt: "2026-04-16 16:30:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-16 16:45:26",
    confirmBy: "王倩",
    confirmAt: "2026-04-16 16:45:26",
    lines: [
      { id: "pi-008-line-1", orderLineId: "po-012-line-1", receivedQty: 10, stockedQty: 10, diffReason: "", abnormalNote: "", stockInPrice: 46 },
      { id: "pi-008-line-2", orderLineId: "po-012-line-2", receivedQty: 28, stockedQty: 25, diffReason: "少货", abnormalNote: "供应商承诺补发", stockInPrice: 22 },
    ],
  },
  {
    id: "pi-009",
    no: "PI20260416-0009",
    orderId: "po-008",
    stockInDate: "2026-04-16",
    status: "已作废",
    remark: "误建草稿后作废。",
    createdBy: "王倩",
    createdAt: "2026-04-16 11:48:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-16 11:50:02",
    confirmBy: "",
    confirmAt: "",
    lines: [
      { id: "pi-009-line-1", orderLineId: "po-008-line-1", receivedQty: 10, stockedQty: 10, diffReason: "", abnormalNote: "", stockInPrice: 46 },
      { id: "pi-009-line-2", orderLineId: "po-008-line-2", receivedQty: 10, stockedQty: 10, diffReason: "", abnormalNote: "", stockInPrice: 22 },
    ],
  },
  {
    id: "pi-010",
    no: "PI20260415-0010",
    orderId: "po-008",
    stockInDate: "2026-04-19",
    status: "已入库",
    remark: "第二批到货完成。",
    createdBy: "王倩",
    createdAt: "2026-04-19 15:06:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-19 15:16:42",
    confirmBy: "王倩",
    confirmAt: "2026-04-19 15:16:42",
    lines: [
      { id: "pi-010-line-1", orderLineId: "po-008-line-1", receivedQty: 12, stockedQty: 12, diffReason: "", abnormalNote: "", stockInPrice: 46 },
      { id: "pi-010-line-2", orderLineId: "po-008-line-2", receivedQty: 25, stockedQty: 24, diffReason: "质量问题", abnormalNote: "1包破损隔离", stockInPrice: 22 },
    ],
  },
];

function getStoredOrderSeeds() {
  return readStorage(ORDER_STORAGE_KEY, orderSeedFallback);
}

function setStoredOrderSeeds(records: PurchaseOrderSeed[]) {
  writeStorage(ORDER_STORAGE_KEY, records);
}

function getStoredReceiptSeeds() {
  return readStorage(RECEIPT_STORAGE_KEY, receiptSeedFallback);
}

function setStoredReceiptSeeds(records: PurchaseReceiptSeed[]) {
  writeStorage(RECEIPT_STORAGE_KEY, records);
}

function buildReceivedMap(receipts: PurchaseReceiptSeed[]) {
  return receipts
    .filter((receipt) => receipt.status === "已入库")
    .reduce<Record<string, number>>((acc, receipt) => {
      receipt.lines.forEach((line) => {
        acc[line.orderLineId] = (acc[line.orderLineId] ?? 0) + Number(line.stockedQty ?? 0);
      });
      return acc;
    }, {});
}

function hydrateOrders(orderSeeds: PurchaseOrderSeed[], receiptSeeds: PurchaseReceiptSeed[]): PurchaseOrderRecord[] {
  const receivedMap = buildReceivedMap(receiptSeeds);

  return orderSeeds.map((seed) => {
    const lines = seed.lines.map((line) => {
      const receivedQty = receivedMap[line.id] ?? 0;
      const pendingQty = Math.max(line.qty - receivedQty, 0);
      return {
        ...line,
        amount: Number((line.qty * line.price).toFixed(2)),
        receivedQty,
        pendingQty,
      };
    });

    const skuCount = lines.length;
    const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);
    const totalAmount = Number(lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2));
    const hasReceipt = lines.some((line) => line.receivedQty > 0);
    const allDone = lines.every((line) => line.pendingQty === 0);

    let status = seed.status;
    if (status !== "草稿" && status !== "待审核" && status !== "已作废") {
      if (seed.closedManually) {
        status = "已完成";
      } else if (allDone) {
        status = "已完成";
      } else if (hasReceipt) {
        status = "部分入库";
      } else {
        status = "待入库";
      }
    }

    return {
      ...seed,
      status,
      statusTone: getStatusTone(status),
      lines,
      skuCount,
      totalQty,
      totalAmount,
    };
  });
}

function hydrateReceipts(orderSeeds: PurchaseOrderSeed[], receiptSeeds: PurchaseReceiptSeed[]): PurchaseReceiptRecord[] {
  const orders = hydrateOrders(orderSeeds, receiptSeeds);
  const orderMap = new Map(orders.map((order) => [order.id, order]));

  return receiptSeeds.map((seed) => {
    const order = orderMap.get(seed.orderId);
    const lines = seed.lines.map((line) => {
      const orderLine = order?.lines.find((item) => item.id === line.orderLineId);
      const receivedQty = Number(line.receivedQty ?? 0);
      const stockedQty = Number(line.stockedQty ?? 0);
      return {
        ...line,
        skuCode: orderLine?.skuCode ?? "-",
        skuName: orderLine?.skuName ?? "-",
        spec: orderLine?.spec ?? "-",
        unit: orderLine?.unit ?? "-",
        orderQty: orderLine?.qty ?? 0,
        pendingQty: orderLine?.pendingQty ?? 0,
        diffQty: Math.max(receivedQty - stockedQty, 0),
        stockInAmount: Number((stockedQty * line.stockInPrice).toFixed(2)),
      };
    });

    return {
      ...seed,
      orderNo: order?.no ?? "-",
      supplierCode: order?.supplierCode ?? "-",
      supplierName: order?.supplierName ?? "-",
      supplierLabel: order?.supplierLabel ?? "-",
      warehouseCode: order?.warehouseCode ?? "-",
      warehouseName: order?.warehouseName ?? "-",
      warehouseLabel: order?.warehouseLabel ?? "-",
      statusTone: getStatusTone(seed.status),
      lines,
      totalQty: lines.reduce((sum, line) => sum + line.stockedQty, 0),
      totalAmount: Number(lines.reduce((sum, line) => sum + line.stockInAmount, 0).toFixed(2)),
    };
  });
}

export function getPurchaseWorkspace() {
  const orderSeeds = getStoredOrderSeeds();
  const receiptSeeds = getStoredReceiptSeeds();
  return {
    orders: hydrateOrders(orderSeeds, receiptSeeds),
    receipts: hydrateReceipts(orderSeeds, receiptSeeds),
  };
}

export function getPurchaseOrders() {
  return getPurchaseWorkspace().orders;
}

export function getPurchaseOrder(orderId: string) {
  return getPurchaseOrders().find((order) => order.id === orderId) ?? null;
}

export function getPurchaseReceipts() {
  return getPurchaseWorkspace().receipts;
}

export function getPurchaseReceipt(receiptId: string) {
  return getPurchaseReceipts().find((receipt) => receipt.id === receiptId) ?? null;
}

export function getReceiptCreateOrderOptions() {
  return getPurchaseOrders().filter((order) => order.status === "待入库" || order.status === "部分入库");
}

function nextNumber(prefix: "PO" | "PI", existingNos: string[]) {
  const today = nowDate().replace(/-/g, "");
  const maxSeq = existingNos
    .filter((no) => no.startsWith(`${prefix}${today}-`))
    .map((no) => Number(no.split("-")[1] ?? 0))
    .reduce((max, current) => Math.max(max, current), 0);
  return `${prefix}${today}-${String(maxSeq + 1).padStart(4, "0")}`;
}

export function createOrderDraft() {
  return {
    id: `po-draft-${Date.now()}`,
    no: "",
    supplierCode: "",
    supplierName: "",
    supplierLabel: "",
    warehouseCode: "",
    warehouseName: "",
    warehouseLabel: "",
    orderDate: nowDate(),
    expectedDate: "",
    status: "草稿" as PurchaseOrderStatus,
    statusTone: "gray" as Tone,
    remark: "",
    lines: [],
    skuCount: 0,
    totalQty: 0,
    totalAmount: 0,
    createdBy: CURRENT_USER,
    createdAt: nowDateTime(),
    updatedBy: CURRENT_USER,
    updatedAt: nowDateTime(),
    auditBy: "",
    auditAt: "",
  };
}

export function createReceiptDraft(orderId = "") {
  const order = orderId ? getPurchaseOrder(orderId) : null;
  return {
    id: `pi-draft-${Date.now()}`,
    no: "",
    orderId: order?.id ?? "",
    orderNo: order?.no ?? "",
    supplierCode: order?.supplierCode ?? "",
    supplierName: order?.supplierName ?? "",
    supplierLabel: order?.supplierLabel ?? "",
    warehouseCode: order?.warehouseCode ?? "",
    warehouseName: order?.warehouseName ?? "",
    warehouseLabel: order?.warehouseLabel ?? "",
    stockInDate: nowDate(),
    status: "草稿" as PurchaseReceiptStatus,
    statusTone: "gray" as Tone,
    remark: "",
    lines: order ? buildReceiptLinesFromOrder(order) : [],
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

export function getSupplierOptions() {
  return suppliers.map((item) => `${item.code} ${item.name}`);
}

export function getWarehouseOptions() {
  return warehouses.map((item) => `${item.code} ${item.name}`);
}

export function getProductOptions() {
  return catalog.map((item) => `${item.code} ${item.name}`);
}

export function getProductCatalog() {
  return catalog.map((item) => ({ ...item }));
}

export function findCatalogItem(option: string) {
  return catalog.find((item) => `${item.code} ${item.name}` === option) ?? null;
}

export function findSupplier(option: string) {
  return suppliers.find((item) => `${item.code} ${item.name}` === option) ?? null;
}

export function findWarehouse(option: string) {
  return warehouses.find((item) => `${item.code} ${item.name}` === option) ?? null;
}

export function buildReceiptLinesFromOrder(order: PurchaseOrderRecord): PurchaseReceiptLine[] {
  return order.lines.map((line) => ({
    id: `receipt-line-${line.id}`,
    orderLineId: line.id,
    skuCode: line.skuCode,
    skuName: line.skuName,
    spec: line.spec,
    unit: line.unit,
    orderQty: line.qty,
    pendingQty: line.pendingQty,
    receivedQty: 0,
    stockedQty: 0,
    diffQty: 0,
    diffReason: "",
    abnormalNote: "",
    stockInPrice: line.price,
    stockInAmount: 0,
  }));
}

function toOrderSeed(record: PurchaseOrderRecord, status: PurchaseOrderStatus): PurchaseOrderSeed {
  return {
    ...record,
    status,
    lines: record.lines.map((line) => ({
      id: line.id,
      skuCode: line.skuCode,
      skuName: line.skuName,
      skuBarcode: line.skuBarcode,
      spec: line.spec,
      unit: line.unit,
      qty: Number(line.qty ?? 0),
      price: Number(line.price ?? 0),
      taxRate: line.taxRate,
      note: line.note,
    })),
  };
}

function toReceiptSeed(record: PurchaseReceiptRecord, status: PurchaseReceiptStatus): PurchaseReceiptSeed {
  return {
    ...record,
    status,
    lines: record.lines.map((line) => ({
      id: line.id,
      orderLineId: line.orderLineId,
      receivedQty: Number(line.receivedQty ?? 0),
      stockedQty: Number(line.stockedQty ?? 0),
      diffReason: line.diffReason,
      abnormalNote: line.abnormalNote,
      stockInPrice: Number(line.stockInPrice ?? 0),
    })),
  };
}

function replaceRecord<T extends { id: string }>(items: T[], record: T) {
  const exists = items.some((item) => item.id === record.id);
  return exists ? items.map((item) => (item.id === record.id ? record : item)) : [record, ...items];
}

export function savePurchaseOrder(record: PurchaseOrderRecord, intent: "draft" | "submit") {
  const orderSeeds = getStoredOrderSeeds();
  const receiptSeeds = getStoredReceiptSeeds();
  const workspace = getPurchaseWorkspace();
  const source = workspace.orders.find((item) => item.id === record.id);
  const timestamp = nowDateTime();
  const status = intent === "submit" ? "待审核" : source?.status ?? "草稿";
  const nextRecord: PurchaseOrderRecord = {
    ...record,
    no: record.no || nextNumber("PO", workspace.orders.map((item) => item.no)),
    status,
    statusTone: getStatusTone(status),
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.qty ?? 0), 0),
    totalAmount: Number(record.lines.reduce((sum, line) => sum + Number(line.qty ?? 0) * Number(line.price ?? 0), 0).toFixed(2)),
    skuCount: record.lines.length,
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    auditBy: source?.auditBy ?? "",
    auditAt: source?.auditAt ?? "",
    closedManually: source?.closedManually ?? false,
  };

  setStoredOrderSeeds(replaceRecord(orderSeeds, toOrderSeed(nextRecord, status)));
  return hydrateOrders(getStoredOrderSeeds(), receiptSeeds).find((item) => item.id === nextRecord.id) ?? null;
}

export function savePurchaseReceipt(record: PurchaseReceiptRecord) {
  const receiptSeeds = getStoredReceiptSeeds();
  const order = getPurchaseOrder(record.orderId);
  const source = getPurchaseReceipt(record.id);
  const timestamp = nowDateTime();
  const nextRecord: PurchaseReceiptRecord = {
    ...record,
    no: record.no || nextNumber("PI", getPurchaseReceipts().map((item) => item.no)),
    orderNo: order?.no ?? record.orderNo,
    supplierCode: order?.supplierCode ?? record.supplierCode,
    supplierName: order?.supplierName ?? record.supplierName,
    supplierLabel: order?.supplierLabel ?? record.supplierLabel,
    warehouseCode: order?.warehouseCode ?? record.warehouseCode,
    warehouseName: order?.warehouseName ?? record.warehouseName,
    warehouseLabel: order?.warehouseLabel ?? record.warehouseLabel,
    status: "草稿",
    statusTone: "gray",
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.stockedQty ?? 0), 0),
    totalAmount: Number(record.lines.reduce((sum, line) => sum + Number(line.stockInAmount ?? 0), 0).toFixed(2)),
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    confirmBy: source?.confirmBy ?? "",
    confirmAt: source?.confirmAt ?? "",
  };

  setStoredReceiptSeeds(replaceRecord(receiptSeeds, toReceiptSeed(nextRecord, "草稿")));
  return getPurchaseReceipt(nextRecord.id);
}

export function confirmPurchaseReceipt(record: PurchaseReceiptRecord) {
  const order = getPurchaseOrder(record.orderId);
  if (!order || (order.status !== "待入库" && order.status !== "部分入库")) {
    return null;
  }

  const receiptSeeds = getStoredReceiptSeeds();
  const source = getPurchaseReceipt(record.id);
  const timestamp = nowDateTime();
  const nextRecord: PurchaseReceiptRecord = {
    ...record,
    no: record.no || nextNumber("PI", getPurchaseReceipts().map((item) => item.no)),
    orderNo: order.no,
    supplierCode: order.supplierCode,
    supplierName: order.supplierName,
    supplierLabel: order.supplierLabel,
    warehouseCode: order.warehouseCode,
    warehouseName: order.warehouseName,
    warehouseLabel: order.warehouseLabel,
    status: "已入库",
    statusTone: "green",
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.stockedQty ?? 0), 0),
    totalAmount: Number(record.lines.reduce((sum, line) => sum + Number(line.stockInAmount ?? 0), 0).toFixed(2)),
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    confirmBy: CURRENT_USER,
    confirmAt: timestamp,
  };

  setStoredReceiptSeeds(replaceRecord(receiptSeeds, toReceiptSeed(nextRecord, "已入库")));
  return getPurchaseReceipt(nextRecord.id);
}

export function deletePurchaseOrder(orderId: string) {
  setStoredOrderSeeds(getStoredOrderSeeds().filter((item) => item.id !== orderId));
}

export function deletePurchaseReceipt(receiptId: string) {
  setStoredReceiptSeeds(getStoredReceiptSeeds().filter((item) => item.id !== receiptId));
}

export function approvePurchaseOrder(orderId: string) {
  const records = getStoredOrderSeeds();
  const timestamp = nowDateTime();
  setStoredOrderSeeds(
    records.map((item) =>
      item.id === orderId ? { ...item, status: "待入库", updatedBy: CURRENT_USER, updatedAt: timestamp, auditBy: CURRENT_USER, auditAt: timestamp } : item,
    ),
  );
}

export function rejectPurchaseOrder(orderId: string) {
  const records = getStoredOrderSeeds();
  const timestamp = nowDateTime();
  setStoredOrderSeeds(
    records.map((item) =>
      item.id === orderId ? { ...item, status: "草稿", updatedBy: CURRENT_USER, updatedAt: timestamp, auditBy: "", auditAt: "" } : item,
    ),
  );
}

export function voidPurchaseOrder(orderId: string) {
  const records = getStoredOrderSeeds();
  const timestamp = nowDateTime();
  setStoredOrderSeeds(
    records.map((item) =>
      item.id === orderId ? { ...item, status: "已作废", updatedBy: CURRENT_USER, updatedAt: timestamp, auditBy: item.auditBy, auditAt: item.auditAt } : item,
    ),
  );
}

export function closePurchaseOrder(orderId: string) {
  const records = getStoredOrderSeeds();
  const timestamp = nowDateTime();
  setStoredOrderSeeds(
    records.map((item) =>
      item.id === orderId ? { ...item, status: "已完成", closedManually: true, updatedBy: CURRENT_USER, updatedAt: timestamp } : item,
    ),
  );
}

export function getLinkedStockedReceipts(orderId: string) {
  return getPurchaseReceipts().filter((receipt) => receipt.orderId === orderId && receipt.status === "已入库");
}

export function getLinkedDraftReceipts(orderId: string) {
  return getPurchaseReceipts().filter((receipt) => receipt.orderId === orderId && receipt.status === "草稿");
}
