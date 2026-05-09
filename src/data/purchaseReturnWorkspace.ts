import {
  getPurchaseReceipt,
  getPurchaseReceipts,
  type PurchaseReceiptLine,
} from "./purchaseWorkspace";

export type ReturnTone = "green" | "blue" | "orange" | "red" | "gray";
export type PurchaseReturnStatus = "草稿" | "待审核" | "待出库" | "部分出库" | "已完成" | "已作废";
export type PurchaseReturnStockoutStatus = "草稿" | "已出库" | "已作废";

export type PurchaseReturnLine = {
  id: string;
  receiptLineId: string;
  skuCode: string;
  skuName: string;
  spec: string;
  unit: string;
  originalStockInQty: number;
  availableQty: number;
  returnQty: number;
  shippedQty: number;
  pendingQty: number;
  reason: string;
  note: string;
};

export type PurchaseReturnRecord = {
  id: string;
  no: string;
  receiptId: string;
  receiptNo: string;
  orderNo: string;
  supplierLabel: string;
  warehouseLabel: string;
  returnDate: string;
  status: PurchaseReturnStatus;
  statusTone: ReturnTone;
  remark: string;
  lines: PurchaseReturnLine[];
  skuCount: number;
  totalQty: number;
  shippedTotalQty: number;
  pendingTotalQty: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  auditBy: string;
  auditAt: string;
};

export type PurchaseReturnStockoutLine = {
  id: string;
  returnLineId: string;
  skuCode: string;
  skuName: string;
  spec: string;
  unit: string;
  requestedQty: number;
  pendingQty: number;
  stockoutQty: number;
  price: number;
  amount: number;
  note: string;
};

export type PurchaseReturnStockoutRecord = {
  id: string;
  no: string;
  returnId: string;
  returnNo: string;
  supplierLabel: string;
  warehouseLabel: string;
  stockoutDate: string;
  status: PurchaseReturnStockoutStatus;
  statusTone: ReturnTone;
  remark: string;
  lines: PurchaseReturnStockoutLine[];
  totalQty: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  confirmBy: string;
  confirmAt: string;
};

type ReturnSeed = Omit<
  PurchaseReturnRecord,
  "receiptNo" | "orderNo" | "supplierLabel" | "warehouseLabel" | "lines" | "skuCount" | "totalQty" | "shippedTotalQty" | "pendingTotalQty" | "statusTone"
> & {
  lines: Array<Omit<PurchaseReturnLine, "skuCode" | "skuName" | "spec" | "unit" | "originalStockInQty" | "availableQty" | "shippedQty" | "pendingQty">>;
};

type StockoutSeed = Omit<
  PurchaseReturnStockoutRecord,
  "returnNo" | "supplierLabel" | "warehouseLabel" | "lines" | "totalQty" | "totalAmount" | "statusTone"
> & {
  lines: Array<Omit<PurchaseReturnStockoutLine, "skuCode" | "skuName" | "spec" | "unit" | "requestedQty" | "pendingQty" | "amount">>;
};

const RETURN_STORAGE_KEY = "jxc-purchase-returns-v20260420";
const STOUT_STORAGE_KEY = "jxc-purchase-return-stockouts-v20260420";
const CURRENT_USER = "当前用户";

export const purchaseReturnReasonOptions = ["质量问题", "型号不符", "数量超收", "后发现不良品", "其他"];

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

export function getReturnTone(status: PurchaseReturnStatus | PurchaseReturnStockoutStatus): ReturnTone {
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

const returnSeedFallback: ReturnSeed[] = [
  {
    id: "pr-001",
    no: "PR20260420-0001",
    receiptId: "pi-006",
    returnDate: "2026-04-20",
    status: "草稿",
    remark: "扫码枪到店后发现部分按键失灵。",
    createdBy: "林悦",
    createdAt: "2026-04-20 09:20:00",
    updatedBy: "林悦",
    updatedAt: "2026-04-20 09:28:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "pr-001-line-1", receiptLineId: "pi-006-line-1", returnQty: 2, reason: "质量问题", note: "抽检2支异常" },
      { id: "pr-001-line-2", receiptLineId: "pi-006-line-2", returnQty: 0, reason: "", note: "" },
    ],
  },
  {
    id: "pr-002",
    no: "PR20260420-0002",
    receiptId: "pi-007",
    returnDate: "2026-04-20",
    status: "草稿",
    remark: "标签纸规格不符，先建草稿。",
    createdBy: "周晴",
    createdAt: "2026-04-20 10:05:00",
    updatedBy: "周晴",
    updatedAt: "2026-04-20 10:05:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "pr-002-line-1", receiptLineId: "pi-007-line-1", returnQty: 6, reason: "型号不符", note: "厚度不匹配" },
      { id: "pr-002-line-2", receiptLineId: "pi-007-line-2", returnQty: 0, reason: "", note: "" },
    ],
  },
  {
    id: "pr-003",
    no: "PR20260419-0003",
    receiptId: "pi-004",
    returnDate: "2026-04-19",
    status: "待审核",
    remark: "PDA外观磕碰需退回。",
    createdBy: "林悦",
    createdAt: "2026-04-19 11:10:00",
    updatedBy: "林悦",
    updatedAt: "2026-04-19 11:30:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "pr-003-line-1", receiptLineId: "pi-004-line-1", returnQty: 1, reason: "质量问题", note: "开机异常" },
      { id: "pr-003-line-2", receiptLineId: "pi-004-line-2", returnQty: 0, reason: "", note: "" },
    ],
  },
  {
    id: "pr-004",
    no: "PR20260419-0004",
    receiptId: "pi-008",
    returnDate: "2026-04-19",
    status: "待审核",
    remark: "首批辅料少发，退回破损部分。",
    createdBy: "周晴",
    createdAt: "2026-04-19 14:05:00",
    updatedBy: "周晴",
    updatedAt: "2026-04-19 14:10:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "pr-004-line-1", receiptLineId: "pi-008-line-1", returnQty: 2, reason: "质量问题", note: "破损" },
      { id: "pr-004-line-2", receiptLineId: "pi-008-line-2", returnQty: 3, reason: "后发现不良品", note: "封口开裂" },
    ],
  },
  {
    id: "pr-005",
    no: "PR20260418-0005",
    receiptId: "pi-006",
    returnDate: "2026-04-18",
    status: "待出库",
    remark: "扫码枪整箱退回。",
    createdBy: "林悦",
    createdAt: "2026-04-18 16:20:00",
    updatedBy: "吴皓",
    updatedAt: "2026-04-18 17:10:00",
    auditBy: "吴皓",
    auditAt: "2026-04-18 17:10:00",
    lines: [
      { id: "pr-005-line-1", receiptLineId: "pi-006-line-1", returnQty: 3, reason: "质量问题", note: "批次异常" },
      { id: "pr-005-line-2", receiptLineId: "pi-006-line-2", returnQty: 0, reason: "", note: "" },
    ],
  },
  {
    id: "pr-006",
    no: "PR20260418-0006",
    receiptId: "pi-007",
    returnDate: "2026-04-18",
    status: "待出库",
    remark: "标签纸批次规格差异。",
    createdBy: "周晴",
    createdAt: "2026-04-18 15:18:00",
    updatedBy: "吴皓",
    updatedAt: "2026-04-18 16:05:00",
    auditBy: "吴皓",
    auditAt: "2026-04-18 16:05:00",
    lines: [
      { id: "pr-006-line-1", receiptLineId: "pi-007-line-1", returnQty: 8, reason: "型号不符", note: "" },
      { id: "pr-006-line-2", receiptLineId: "pi-007-line-2", returnQty: 2, reason: "其他", note: "盒损" },
    ],
  },
  {
    id: "pr-007",
    no: "PR20260417-0007",
    receiptId: "pi-005",
    returnDate: "2026-04-17",
    status: "部分出库",
    remark: "辅料分两批退回。",
    createdBy: "周晴",
    createdAt: "2026-04-17 13:00:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-19 10:12:00",
    auditBy: "吴皓",
    auditAt: "2026-04-17 14:20:00",
    lines: [
      { id: "pr-007-line-1", receiptLineId: "pi-005-line-1", returnQty: 6, reason: "质量问题", note: "" },
      { id: "pr-007-line-2", receiptLineId: "pi-005-line-2", returnQty: 10, reason: "数量超收", note: "门店不需要" },
    ],
  },
  {
    id: "pr-008",
    no: "PR20260417-0008",
    receiptId: "pi-010",
    returnDate: "2026-04-17",
    status: "部分出库",
    remark: "第二批辅料退货分批执行。",
    createdBy: "周晴",
    createdAt: "2026-04-17 16:20:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-19 15:20:00",
    auditBy: "吴皓",
    auditAt: "2026-04-17 17:00:00",
    lines: [
      { id: "pr-008-line-1", receiptLineId: "pi-010-line-1", returnQty: 5, reason: "后发现不良品", note: "" },
      { id: "pr-008-line-2", receiptLineId: "pi-010-line-2", returnQty: 8, reason: "质量问题", note: "" },
    ],
  },
  {
    id: "pr-009",
    no: "PR20260416-0009",
    receiptId: "pi-004",
    returnDate: "2026-04-16",
    status: "已完成",
    remark: "首批PDA退回已闭环。",
    createdBy: "林悦",
    createdAt: "2026-04-16 15:10:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-18 15:00:00",
    auditBy: "吴皓",
    auditAt: "2026-04-16 16:00:00",
    lines: [
      { id: "pr-009-line-1", receiptLineId: "pi-004-line-1", returnQty: 2, reason: "质量问题", note: "" },
      { id: "pr-009-line-2", receiptLineId: "pi-004-line-2", returnQty: 1, reason: "型号不符", note: "" },
    ],
  },
  {
    id: "pr-010",
    no: "PR20260416-0010",
    receiptId: "pi-008",
    returnDate: "2026-04-16",
    status: "已完成",
    remark: "成都仓破损辅料已全部退完。",
    createdBy: "周晴",
    createdAt: "2026-04-16 10:10:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-17 09:10:00",
    auditBy: "吴皓",
    auditAt: "2026-04-16 11:00:00",
    lines: [
      { id: "pr-010-line-1", receiptLineId: "pi-008-line-1", returnQty: 1, reason: "质量问题", note: "" },
      { id: "pr-010-line-2", receiptLineId: "pi-008-line-2", returnQty: 4, reason: "后发现不良品", note: "" },
    ],
  },
  {
    id: "pr-011",
    no: "PR20260415-0011",
    receiptId: "pi-005",
    returnDate: "2026-04-15",
    status: "已作废",
    remark: "重复提单，已作废。",
    createdBy: "周晴",
    createdAt: "2026-04-15 13:00:00",
    updatedBy: "吴皓",
    updatedAt: "2026-04-15 13:30:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "pr-011-line-1", receiptLineId: "pi-005-line-1", returnQty: 1, reason: "其他", note: "" },
      { id: "pr-011-line-2", receiptLineId: "pi-005-line-2", returnQty: 0, reason: "", note: "" },
    ],
  },
  {
    id: "pr-012",
    no: "PR20260415-0012",
    receiptId: "pi-010",
    returnDate: "2026-04-15",
    status: "待出库",
    remark: "辅料补退第二笔。",
    createdBy: "周晴",
    createdAt: "2026-04-15 14:05:00",
    updatedBy: "吴皓",
    updatedAt: "2026-04-15 15:00:00",
    auditBy: "吴皓",
    auditAt: "2026-04-15 15:00:00",
    lines: [
      { id: "pr-012-line-1", receiptLineId: "pi-010-line-1", returnQty: 2, reason: "质量问题", note: "" },
      { id: "pr-012-line-2", receiptLineId: "pi-010-line-2", returnQty: 3, reason: "后发现不良品", note: "" },
    ],
  },
];

const stockoutSeedFallback: StockoutSeed[] = [
  {
    id: "prs-001",
    no: "PRS20260420-0001",
    returnId: "pr-005",
    stockoutDate: "2026-04-20",
    status: "草稿",
    remark: "待仓库复核后出库。",
    createdBy: "王倩",
    createdAt: "2026-04-20 10:20:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-20 10:28:00",
    confirmBy: "",
    confirmAt: "",
    lines: [{ id: "prs-001-line-1", returnLineId: "pr-005-line-1", stockoutQty: 1, price: 299, note: "" }],
  },
  {
    id: "prs-002",
    no: "PRS20260420-0002",
    returnId: "pr-006",
    stockoutDate: "2026-04-20",
    status: "草稿",
    remark: "已备货，待确认。",
    createdBy: "王倩",
    createdAt: "2026-04-20 11:05:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-20 11:10:00",
    confirmBy: "",
    confirmAt: "",
    lines: [
      { id: "prs-002-line-1", returnLineId: "pr-006-line-1", stockoutQty: 3, price: 22, note: "" },
      { id: "prs-002-line-2", returnLineId: "pr-006-line-2", stockoutQty: 1, price: 35, note: "" },
    ],
  },
  {
    id: "prs-003",
    no: "PRS20260420-0003",
    returnId: "pr-012",
    stockoutDate: "2026-04-20",
    status: "草稿",
    remark: "等待物流单号。",
    createdBy: "王倩",
    createdAt: "2026-04-20 13:00:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-20 13:02:00",
    confirmBy: "",
    confirmAt: "",
    lines: [{ id: "prs-003-line-1", returnLineId: "pr-012-line-2", stockoutQty: 1, price: 22, note: "" }],
  },
  {
    id: "prs-004",
    no: "PRS20260419-0004",
    returnId: "pr-007",
    stockoutDate: "2026-04-19",
    status: "已出库",
    remark: "第一批辅料已发回。",
    createdBy: "王倩",
    createdAt: "2026-04-19 09:10:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-19 09:18:00",
    confirmBy: "王倩",
    confirmAt: "2026-04-19 09:18:00",
    lines: [
      { id: "prs-004-line-1", returnLineId: "pr-007-line-1", stockoutQty: 2, price: 46, note: "" },
      { id: "prs-004-line-2", returnLineId: "pr-007-line-2", stockoutQty: 4, price: 22, note: "" },
    ],
  },
  {
    id: "prs-005",
    no: "PRS20260419-0005",
    returnId: "pr-008",
    stockoutDate: "2026-04-19",
    status: "已出库",
    remark: "第一批辅料退回。",
    createdBy: "王倩",
    createdAt: "2026-04-19 14:05:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-19 14:15:00",
    confirmBy: "王倩",
    confirmAt: "2026-04-19 14:15:00",
    lines: [
      { id: "prs-005-line-1", returnLineId: "pr-008-line-1", stockoutQty: 2, price: 46, note: "" },
      { id: "prs-005-line-2", returnLineId: "pr-008-line-2", stockoutQty: 3, price: 22, note: "" },
    ],
  },
  {
    id: "prs-006",
    no: "PRS20260418-0006",
    returnId: "pr-009",
    stockoutDate: "2026-04-18",
    status: "已出库",
    remark: "PDA退回完成。",
    createdBy: "王倩",
    createdAt: "2026-04-18 11:20:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-18 11:28:00",
    confirmBy: "王倩",
    confirmAt: "2026-04-18 11:28:00",
    lines: [
      { id: "prs-006-line-1", returnLineId: "pr-009-line-1", stockoutQty: 2, price: 1680, note: "" },
      { id: "prs-006-line-2", returnLineId: "pr-009-line-2", stockoutQty: 1, price: 299, note: "" },
    ],
  },
  {
    id: "prs-007",
    no: "PRS20260417-0007",
    returnId: "pr-010",
    stockoutDate: "2026-04-17",
    status: "已出库",
    remark: "成都仓退货已完成。",
    createdBy: "王倩",
    createdAt: "2026-04-17 09:00:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-17 09:06:00",
    confirmBy: "王倩",
    confirmAt: "2026-04-17 09:06:00",
    lines: [
      { id: "prs-007-line-1", returnLineId: "pr-010-line-1", stockoutQty: 1, price: 46, note: "" },
      { id: "prs-007-line-2", returnLineId: "pr-010-line-2", stockoutQty: 4, price: 22, note: "" },
    ],
  },
  {
    id: "prs-008",
    no: "PRS20260417-0008",
    returnId: "pr-007",
    stockoutDate: "2026-04-20",
    status: "已出库",
    remark: "第二批辅料退回。",
    createdBy: "王倩",
    createdAt: "2026-04-20 15:10:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-20 15:18:00",
    confirmBy: "王倩",
    confirmAt: "2026-04-20 15:18:00",
    lines: [
      { id: "prs-008-line-1", returnLineId: "pr-007-line-1", stockoutQty: 1, price: 46, note: "" },
      { id: "prs-008-line-2", returnLineId: "pr-007-line-2", stockoutQty: 3, price: 22, note: "" },
    ],
  },
  {
    id: "prs-009",
    no: "PRS20260417-0009",
    returnId: "pr-008",
    stockoutDate: "2026-04-20",
    status: "已出库",
    remark: "第二批辅料退回。",
    createdBy: "王倩",
    createdAt: "2026-04-20 16:05:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-20 16:12:00",
    confirmBy: "王倩",
    confirmAt: "2026-04-20 16:12:00",
    lines: [
      { id: "prs-009-line-1", returnLineId: "pr-008-line-1", stockoutQty: 1, price: 46, note: "" },
      { id: "prs-009-line-2", returnLineId: "pr-008-line-2", stockoutQty: 2, price: 22, note: "" },
    ],
  },
  {
    id: "prs-010",
    no: "PRS20260416-0010",
    returnId: "pr-008",
    stockoutDate: "2026-04-16",
    status: "已作废",
    remark: "误建草稿后作废。",
    createdBy: "王倩",
    createdAt: "2026-04-16 10:05:00",
    updatedBy: "王倩",
    updatedAt: "2026-04-16 10:10:00",
    confirmBy: "",
    confirmAt: "",
    lines: [{ id: "prs-010-line-1", returnLineId: "pr-008-line-2", stockoutQty: 1, price: 22, note: "" }],
  },
];

function getStoredReturnSeeds() {
  return readStorage(RETURN_STORAGE_KEY, returnSeedFallback);
}

function setStoredReturnSeeds(value: ReturnSeed[]) {
  writeStorage(RETURN_STORAGE_KEY, value);
}

function getStoredStockoutSeeds() {
  return readStorage(STOUT_STORAGE_KEY, stockoutSeedFallback);
}

function setStoredStockoutSeeds(value: StockoutSeed[]) {
  writeStorage(STOUT_STORAGE_KEY, value);
}

function nextNumber(prefix: "PR" | "PRS", existingNos: string[]) {
  const today = nowDate().replace(/-/g, "");
  const maxSeq = existingNos
    .filter((no) => no.startsWith(`${prefix}${today}-`))
    .map((no) => Number(no.split("-")[1] ?? 0))
    .reduce((max, current) => Math.max(max, current), 0);
  return `${prefix}${today}-${String(maxSeq + 1).padStart(4, "0")}`;
}

function buildRequestedTotals(returns: ReturnSeed[]) {
  return returns
    .filter((item) => item.status !== "已作废")
    .reduce<Record<string, number>>((acc, current) => {
      current.lines.forEach((line) => {
        acc[line.receiptLineId] = (acc[line.receiptLineId] ?? 0) + Number(line.returnQty || 0);
      });
      return acc;
    }, {});
}

function buildShippedTotals(stockouts: StockoutSeed[]) {
  return stockouts
    .filter((item) => item.status === "已出库")
    .reduce<Record<string, number>>((acc, current) => {
      current.lines.forEach((line) => {
        acc[line.returnLineId] = (acc[line.returnLineId] ?? 0) + Number(line.stockoutQty || 0);
      });
      return acc;
    }, {});
}

function hydrateReturns(returnSeeds: ReturnSeed[], stockoutSeeds: StockoutSeed[]): PurchaseReturnRecord[] {
  const requestedTotals = buildRequestedTotals(returnSeeds);
  const shippedTotals = buildShippedTotals(stockoutSeeds);

  return returnSeeds.map((seed) => {
    const receipt = getPurchaseReceipt(seed.receiptId);
    const lines = seed.lines.map((line) => {
      const receiptLine = receipt?.lines.find((item) => item.id === line.receiptLineId);
      const ownQty = seed.status === "已作废" ? 0 : Number(line.returnQty || 0);
      const activeRequestedByOthers = Math.max((requestedTotals[line.receiptLineId] ?? 0) - ownQty, 0);
      const originalStockInQty = receiptLine?.stockedQty ?? 0;
      const availableQty = Math.max(originalStockInQty - activeRequestedByOthers, 0);
      const shippedQty = shippedTotals[line.id] ?? 0;
      const pendingQty = Math.max(Number(line.returnQty || 0) - shippedQty, 0);
      return {
        ...line,
        skuCode: receiptLine?.skuCode ?? "-",
        skuName: receiptLine?.skuName ?? "-",
        spec: receiptLine?.spec ?? "-",
        unit: receiptLine?.unit ?? "-",
        originalStockInQty,
        availableQty,
        shippedQty,
        pendingQty,
      };
    });

    const receiptOrderNo = seed.receiptId ? getPurchaseReceipt(seed.receiptId)?.orderNo ?? "-" : "-";
    const hasShipped = lines.some((line) => line.shippedQty > 0);
    const allDone = lines.filter((line) => Number(line.returnQty || 0) > 0).every((line) => line.pendingQty === 0);

    let status = seed.status;
    if (status !== "草稿" && status !== "待审核" && status !== "已作废") {
      if (allDone && lines.some((line) => line.returnQty > 0)) {
        status = "已完成";
      } else if (hasShipped) {
        status = "部分出库";
      } else {
        status = "待出库";
      }
    }

    return {
      ...seed,
      receiptNo: receipt?.no ?? "-",
      orderNo: receiptOrderNo,
      supplierLabel: receipt?.supplierLabel ?? "-",
      warehouseLabel: receipt?.warehouseLabel ?? "-",
      status,
      statusTone: getReturnTone(status),
      lines,
      skuCount: lines.filter((line) => line.returnQty > 0).length,
      totalQty: lines.reduce((sum, line) => sum + Number(line.returnQty || 0), 0),
      shippedTotalQty: lines.reduce((sum, line) => sum + line.shippedQty, 0),
      pendingTotalQty: lines.reduce((sum, line) => sum + line.pendingQty, 0),
    };
  });
}

function hydrateStockouts(returnSeeds: ReturnSeed[], stockoutSeeds: StockoutSeed[]): PurchaseReturnStockoutRecord[] {
  const returns = hydrateReturns(returnSeeds, stockoutSeeds);
  return stockoutSeeds.map((seed) => {
    const returnDoc = returns.find((item) => item.id === seed.returnId);
    const lines = seed.lines.map((line) => {
      const returnLine = returnDoc?.lines.find((item) => item.id === line.returnLineId);
      const qty = Number(line.stockoutQty || 0);
      const price = Number(line.price || 0);
      return {
        ...line,
        skuCode: returnLine?.skuCode ?? "-",
        skuName: returnLine?.skuName ?? "-",
        spec: returnLine?.spec ?? "-",
        unit: returnLine?.unit ?? "-",
        requestedQty: returnLine?.returnQty ?? 0,
        pendingQty: returnLine?.pendingQty ?? 0,
        amount: Number((qty * price).toFixed(2)),
      };
    });

    return {
      ...seed,
      returnNo: returnDoc?.no ?? "-",
      supplierLabel: returnDoc?.supplierLabel ?? "-",
      warehouseLabel: returnDoc?.warehouseLabel ?? "-",
      statusTone: getReturnTone(seed.status),
      lines,
      totalQty: lines.reduce((sum, line) => sum + line.stockoutQty, 0),
      totalAmount: Number(lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2)),
    };
  });
}

export function getPurchaseReturnWorkspace() {
  const returnSeeds = getStoredReturnSeeds();
  const stockoutSeeds = getStoredStockoutSeeds();
  return {
    returns: hydrateReturns(returnSeeds, stockoutSeeds),
    stockouts: hydrateStockouts(returnSeeds, stockoutSeeds),
  };
}

export function getPurchaseReturns() {
  return getPurchaseReturnWorkspace().returns;
}

export function getPurchaseReturn(id: string) {
  return getPurchaseReturns().find((item) => item.id === id) ?? null;
}

export function getPurchaseReturnStockouts() {
  return getPurchaseReturnWorkspace().stockouts;
}

export function getPurchaseReturnStockout(id: string) {
  return getPurchaseReturnStockouts().find((item) => item.id === id) ?? null;
}

export function getPurchaseReturnSourceReceipts() {
  return getPurchaseReceipts().filter((item) => item.status === "已入库");
}

export function getPurchaseReturnSourceReceipt(id: string) {
  return getPurchaseReceipt(id);
}

export function getPurchaseReturnStockoutSourceReturns() {
  return getPurchaseReturns().filter((item) => item.status === "待出库" || item.status === "部分出库");
}

export function buildReturnLinesFromReceipt(receiptId: string): PurchaseReturnLine[] {
  const receipt = getPurchaseReceipt(receiptId);
  const totals = buildRequestedTotals(getStoredReturnSeeds());
  return (
    receipt?.lines.map((line) => ({
      id: `return-line-${line.id}`,
      receiptLineId: line.id,
      skuCode: line.skuCode,
      skuName: line.skuName,
      spec: line.spec,
      unit: line.unit,
      originalStockInQty: line.stockedQty,
      availableQty: Math.max(line.stockedQty - (totals[line.id] ?? 0), 0),
      returnQty: 0,
      shippedQty: 0,
      pendingQty: 0,
      reason: "",
      note: "",
    })) ?? []
  );
}

export function buildStockoutLinesFromReturn(returnId: string): PurchaseReturnStockoutLine[] {
  const returnDoc = getPurchaseReturn(returnId);
  const receipt = returnDoc ? getPurchaseReceipt(returnDoc.receiptId) : null;
  return (
    returnDoc?.lines.map((line) => {
      const receiptLine = receipt?.lines.find((item) => item.id === line.receiptLineId);
      return {
        id: `stockout-line-${line.id}`,
        returnLineId: line.id,
        skuCode: line.skuCode,
        skuName: line.skuName,
        spec: line.spec,
        unit: line.unit,
        requestedQty: line.returnQty,
        pendingQty: line.pendingQty,
        stockoutQty: 0,
        price: receiptLine?.stockInPrice ?? 0,
        amount: 0,
        note: "",
      };
    }) ?? []
  );
}

export function createPurchaseReturnDraft(receiptId = ""): PurchaseReturnRecord {
  const receipt = receiptId ? getPurchaseReceipt(receiptId) : null;
  return {
    id: `purchase-return-draft-${Date.now()}`,
    no: "",
    receiptId: receipt?.id ?? "",
    receiptNo: receipt?.no ?? "",
    orderNo: receipt?.orderNo ?? "",
    supplierLabel: receipt?.supplierLabel ?? "",
    warehouseLabel: receipt?.warehouseLabel ?? "",
    returnDate: nowDate(),
    status: "草稿",
    statusTone: "gray",
    remark: "",
    lines: receipt ? buildReturnLinesFromReceipt(receipt.id) : [],
    skuCount: 0,
    totalQty: 0,
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

export function createPurchaseReturnStockoutDraft(returnId = ""): PurchaseReturnStockoutRecord {
  const returnDoc = returnId ? getPurchaseReturn(returnId) : null;
  return {
    id: `purchase-return-stockout-draft-${Date.now()}`,
    no: "",
    returnId: returnDoc?.id ?? "",
    returnNo: returnDoc?.no ?? "",
    supplierLabel: returnDoc?.supplierLabel ?? "",
    warehouseLabel: returnDoc?.warehouseLabel ?? "",
    stockoutDate: nowDate(),
    status: "草稿",
    statusTone: "gray",
    remark: "",
    lines: returnDoc ? buildStockoutLinesFromReturn(returnDoc.id) : [],
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

function toReturnSeed(record: PurchaseReturnRecord, status: PurchaseReturnStatus): ReturnSeed {
  return {
    ...record,
    status,
    lines: record.lines.map((line) => ({
      id: line.id,
      receiptLineId: line.receiptLineId,
      returnQty: Number(line.returnQty || 0),
      reason: line.reason,
      note: line.note,
    })),
  };
}

function toStockoutSeed(record: PurchaseReturnStockoutRecord, status: PurchaseReturnStockoutStatus): StockoutSeed {
  return {
    ...record,
    status,
    lines: record.lines.map((line) => ({
      id: line.id,
      returnLineId: line.returnLineId,
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

export function savePurchaseReturn(record: PurchaseReturnRecord, intent: "draft" | "submit") {
  const returnSeeds = getStoredReturnSeeds();
  const source = getPurchaseReturn(record.id);
  const timestamp = nowDateTime();
  const status = intent === "submit" ? "待审核" : "草稿";
  const nextRecord: PurchaseReturnRecord = {
    ...record,
    no: record.no || nextNumber("PR", getPurchaseReturns().map((item) => item.no)),
    status,
    statusTone: getReturnTone(status),
    skuCount: record.lines.filter((line) => Number(line.returnQty || 0) > 0).length,
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.returnQty || 0), 0),
    shippedTotalQty: source?.shippedTotalQty ?? 0,
    pendingTotalQty: record.lines.reduce((sum, line) => sum + Number(line.returnQty || 0), 0),
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    auditBy: source?.auditBy ?? "",
    auditAt: source?.auditAt ?? "",
  };
  setStoredReturnSeeds(replaceRecord(returnSeeds, toReturnSeed(nextRecord, status)));
  return getPurchaseReturn(nextRecord.id);
}

export function savePurchaseReturnStockout(record: PurchaseReturnStockoutRecord) {
  const stockoutSeeds = getStoredStockoutSeeds();
  const source = getPurchaseReturnStockout(record.id);
  const timestamp = nowDateTime();
  const nextRecord: PurchaseReturnStockoutRecord = {
    ...record,
    no: record.no || nextNumber("PRS", getPurchaseReturnStockouts().map((item) => item.no)),
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
  return getPurchaseReturnStockout(nextRecord.id);
}

export function approvePurchaseReturn(id: string) {
  const records = getStoredReturnSeeds();
  const timestamp = nowDateTime();
  setStoredReturnSeeds(
    records.map((item) => (item.id === id ? { ...item, status: "待出库", updatedBy: CURRENT_USER, updatedAt: timestamp, auditBy: CURRENT_USER, auditAt: timestamp } : item)),
  );
}

export function rejectPurchaseReturn(id: string) {
  const records = getStoredReturnSeeds();
  const timestamp = nowDateTime();
  setStoredReturnSeeds(records.map((item) => (item.id === id ? { ...item, status: "草稿", updatedBy: CURRENT_USER, updatedAt: timestamp, auditBy: "", auditAt: "" } : item)));
}

export function voidPurchaseReturn(id: string) {
  const records = getStoredReturnSeeds();
  const timestamp = nowDateTime();
  setStoredReturnSeeds(records.map((item) => (item.id === id ? { ...item, status: "已作废", updatedBy: CURRENT_USER, updatedAt: timestamp } : item)));
}

export function confirmPurchaseReturnStockout(record: PurchaseReturnStockoutRecord) {
  const returnDoc = getPurchaseReturn(record.returnId);
  if (!returnDoc || (returnDoc.status !== "待出库" && returnDoc.status !== "部分出库")) {
    return null;
  }
  const stockoutSeeds = getStoredStockoutSeeds();
  const source = getPurchaseReturnStockout(record.id);
  const timestamp = nowDateTime();
  const nextRecord: PurchaseReturnStockoutRecord = {
    ...record,
    no: record.no || nextNumber("PRS", getPurchaseReturnStockouts().map((item) => item.no)),
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
  return getPurchaseReturnStockout(nextRecord.id);
}

export function deletePurchaseReturn(id: string) {
  setStoredReturnSeeds(getStoredReturnSeeds().filter((item) => item.id !== id));
}

export function deletePurchaseReturnStockout(id: string) {
  setStoredStockoutSeeds(getStoredStockoutSeeds().filter((item) => item.id !== id));
}

export function getLinkedReturnStockouts(returnId: string) {
  return getPurchaseReturnStockouts().filter((item) => item.returnId === returnId && item.status === "已出库");
}
