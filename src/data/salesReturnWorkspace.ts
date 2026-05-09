import { getSalesStockout, getSalesStockouts, type SalesStockoutLine } from "./salesWorkspace";

export type SalesReturnTone = "green" | "blue" | "orange" | "red" | "gray";
export type SalesReturnStatus = "草稿" | "待审核" | "待入库" | "部分入库" | "已完成" | "已作废";
export type SalesReturnInboundStatus = "草稿" | "已入库" | "已作废";

export type SalesReturnLine = {
  id: string;
  stockoutLineId: string;
  skuCode: string;
  skuName: string;
  spec: string;
  unit: string;
  originalStockoutQty: number;
  availableQty: number;
  returnQty: number;
  inboundQty: number;
  pendingQty: number;
  reason: string;
  note: string;
  price: number;
  amount: number;
};

export type SalesReturnRecord = {
  id: string;
  no: string;
  stockoutId: string;
  stockoutNo: string;
  customerLabel: string;
  warehouseLabel: string;
  returnDate: string;
  status: SalesReturnStatus;
  statusTone: SalesReturnTone;
  remark: string;
  lines: SalesReturnLine[];
  skuCount: number;
  totalQty: number;
  totalAmount: number;
  inboundTotalQty: number;
  pendingTotalQty: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  auditBy: string;
  auditAt: string;
};

export type SalesReturnInboundLine = {
  id: string;
  returnLineId: string;
  skuCode: string;
  skuName: string;
  spec: string;
  unit: string;
  requestedQty: number;
  pendingQty: number;
  inboundQty: number;
  price: number;
  amount: number;
  note: string;
};

export type SalesReturnInboundRecord = {
  id: string;
  no: string;
  returnId: string;
  returnNo: string;
  customerLabel: string;
  warehouseLabel: string;
  inboundDate: string;
  status: SalesReturnInboundStatus;
  statusTone: SalesReturnTone;
  remark: string;
  lines: SalesReturnInboundLine[];
  totalQty: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  confirmBy: string;
  confirmAt: string;
};

type SalesReturnSeed = Omit<
  SalesReturnRecord,
  "stockoutNo" | "customerLabel" | "warehouseLabel" | "lines" | "skuCount" | "totalQty" | "totalAmount" | "inboundTotalQty" | "pendingTotalQty" | "statusTone"
> & {
  lines: Array<Omit<SalesReturnLine, "skuCode" | "skuName" | "spec" | "unit" | "originalStockoutQty" | "availableQty" | "inboundQty" | "pendingQty" | "price" | "amount">>;
};

type SalesReturnInboundSeed = Omit<
  SalesReturnInboundRecord,
  "returnNo" | "customerLabel" | "warehouseLabel" | "lines" | "totalQty" | "totalAmount" | "statusTone"
> & {
  lines: Array<Omit<SalesReturnInboundLine, "skuCode" | "skuName" | "spec" | "unit" | "requestedQty" | "pendingQty" | "price" | "amount">>;
};

const RETURN_STORAGE_KEY = "jxc-sales-returns-v20260420";
const INBOUND_STORAGE_KEY = "jxc-sales-return-inbound-v20260420";
const CURRENT_USER = "当前用户";

export const salesReturnReasonOptions = ["质量问题", "型号不符", "数量多发", "后发现不良品", "其他"];

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

export function getSalesReturnTone(status: SalesReturnStatus | SalesReturnInboundStatus): SalesReturnTone {
  switch (status) {
    case "待审核":
      return "orange";
    case "待入库":
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

const returnSeedFallback: SalesReturnSeed[] = [
  {
    id: "sr-001",
    no: "SR20260420-0001",
    stockoutId: "sout-006",
    returnDate: "2026-04-20",
    status: "草稿",
    remark: "客户反馈打印机外观划伤。",
    createdBy: "李菲",
    createdAt: "2026-04-20 09:40:00",
    updatedBy: "李菲",
    updatedAt: "2026-04-20 09:48:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "sr-001-line-1", stockoutLineId: "sout-006-line-1", returnQty: 1, reason: "质量问题", note: "外箱破损" },
      { id: "sr-001-line-2", stockoutLineId: "sout-006-line-2", returnQty: 0, reason: "", note: "" },
    ],
  },
  {
    id: "sr-002",
    no: "SR20260420-0002",
    stockoutId: "sout-007",
    returnDate: "2026-04-20",
    status: "草稿",
    remark: "客户收货后发现型号不符。",
    createdBy: "王晨",
    createdAt: "2026-04-20 10:20:00",
    updatedBy: "王晨",
    updatedAt: "2026-04-20 10:22:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "sr-002-line-1", stockoutLineId: "sout-007-line-1", returnQty: 1, reason: "型号不符", note: "" },
      { id: "sr-002-line-2", stockoutLineId: "sout-007-line-2", returnQty: 2, reason: "数量多发", note: "" },
    ],
  },
  {
    id: "sr-003",
    no: "SR20260419-0003",
    stockoutId: "sout-004",
    returnDate: "2026-04-19",
    status: "待审核",
    remark: "终端返修申请待确认。",
    createdBy: "沈岩",
    createdAt: "2026-04-19 14:40:00",
    updatedBy: "沈岩",
    updatedAt: "2026-04-19 14:50:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "sr-003-line-1", stockoutLineId: "sout-004-line-1", returnQty: 1, reason: "后发现不良品", note: "" },
      { id: "sr-003-line-2", stockoutLineId: "sout-004-line-2", returnQty: 0, reason: "", note: "" },
    ],
  },
  {
    id: "sr-004",
    no: "SR20260419-0004",
    stockoutId: "sout-005",
    returnDate: "2026-04-19",
    status: "待审核",
    remark: "扫码枪客户误收一批。",
    createdBy: "王晨",
    createdAt: "2026-04-19 16:10:00",
    updatedBy: "王晨",
    updatedAt: "2026-04-19 16:15:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "sr-004-line-1", stockoutLineId: "sout-005-line-1", returnQty: 2, reason: "数量多发", note: "" },
      { id: "sr-004-line-2", stockoutLineId: "sout-005-line-2", returnQty: 1, reason: "其他", note: "客户取消部分卷数" },
    ],
  },
  {
    id: "sr-005",
    no: "SR20260418-0005",
    stockoutId: "sout-006",
    returnDate: "2026-04-18",
    status: "待入库",
    remark: "打印机回仓待签收。",
    createdBy: "李菲",
    createdAt: "2026-04-18 17:20:00",
    updatedBy: "陈诺",
    updatedAt: "2026-04-18 18:00:00",
    auditBy: "陈诺",
    auditAt: "2026-04-18 18:00:00",
    lines: [
      { id: "sr-005-line-1", stockoutLineId: "sout-006-line-1", returnQty: 2, reason: "质量问题", note: "" },
      { id: "sr-005-line-2", stockoutLineId: "sout-006-line-2", returnQty: 0, reason: "", note: "" },
    ],
  },
  {
    id: "sr-006",
    no: "SR20260418-0006",
    stockoutId: "sout-007",
    returnDate: "2026-04-18",
    status: "待入库",
    remark: "项目客户退回2支扫码枪。",
    createdBy: "王晨",
    createdAt: "2026-04-18 12:20:00",
    updatedBy: "陈诺",
    updatedAt: "2026-04-18 12:40:00",
    auditBy: "陈诺",
    auditAt: "2026-04-18 12:40:00",
    lines: [
      { id: "sr-006-line-1", stockoutLineId: "sout-007-line-1", returnQty: 1, reason: "型号不符", note: "" },
      { id: "sr-006-line-2", stockoutLineId: "sout-007-line-2", returnQty: 2, reason: "数量多发", note: "" },
    ],
  },
  {
    id: "sr-007",
    no: "SR20260417-0007",
    stockoutId: "sout-008",
    returnDate: "2026-04-17",
    status: "部分入库",
    remark: "扫码枪分批退回。",
    createdBy: "王晨",
    createdAt: "2026-04-17 16:10:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-19 18:00:00",
    auditBy: "陈诺",
    auditAt: "2026-04-17 16:40:00",
    lines: [
      { id: "sr-007-line-1", stockoutLineId: "sout-008-line-1", returnQty: 3, reason: "质量问题", note: "" },
      { id: "sr-007-line-2", stockoutLineId: "sout-008-line-2", returnQty: 4, reason: "其他", note: "客户取消" },
    ],
  },
  {
    id: "sr-008",
    no: "SR20260417-0008",
    stockoutId: "sout-009",
    returnDate: "2026-04-17",
    status: "部分入库",
    remark: "第二批客户退货分两车回仓。",
    createdBy: "王晨",
    createdAt: "2026-04-17 14:20:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-19 15:20:00",
    auditBy: "陈诺",
    auditAt: "2026-04-17 14:40:00",
    lines: [
      { id: "sr-008-line-1", stockoutLineId: "sout-009-line-1", returnQty: 2, reason: "后发现不良品", note: "" },
      { id: "sr-008-line-2", stockoutLineId: "sout-009-line-2", returnQty: 5, reason: "其他", note: "客户改单" },
    ],
  },
  {
    id: "sr-009",
    no: "SR20260416-0009",
    stockoutId: "sout-007",
    returnDate: "2026-04-16",
    status: "已完成",
    remark: "项目客户首单退货闭环。",
    createdBy: "王晨",
    createdAt: "2026-04-16 13:20:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-18 09:20:00",
    auditBy: "陈诺",
    auditAt: "2026-04-16 13:50:00",
    lines: [
      { id: "sr-009-line-1", stockoutLineId: "sout-007-line-1", returnQty: 1, reason: "型号不符", note: "" },
      { id: "sr-009-line-2", stockoutLineId: "sout-007-line-2", returnQty: 1, reason: "其他", note: "" },
    ],
  },
  {
    id: "sr-010",
    no: "SR20260416-0010",
    stockoutId: "sout-006",
    returnDate: "2026-04-16",
    status: "已完成",
    remark: "打印机整机退货已闭环。",
    createdBy: "李菲",
    createdAt: "2026-04-16 10:20:00",
    updatedBy: "杭州电商仓",
    updatedAt: "2026-04-17 09:10:00",
    auditBy: "陈诺",
    auditAt: "2026-04-16 10:40:00",
    lines: [
      { id: "sr-010-line-1", stockoutLineId: "sout-006-line-1", returnQty: 1, reason: "质量问题", note: "" },
      { id: "sr-010-line-2", stockoutLineId: "sout-006-line-2", returnQty: 2, reason: "数量多发", note: "" },
    ],
  },
  {
    id: "sr-011",
    no: "SR20260415-0011",
    stockoutId: "sout-005",
    returnDate: "2026-04-15",
    status: "已作废",
    remark: "重复申请，已作废。",
    createdBy: "王晨",
    createdAt: "2026-04-15 15:10:00",
    updatedBy: "陈诺",
    updatedAt: "2026-04-15 15:20:00",
    auditBy: "",
    auditAt: "",
    lines: [
      { id: "sr-011-line-1", stockoutLineId: "sout-005-line-1", returnQty: 1, reason: "其他", note: "" },
      { id: "sr-011-line-2", stockoutLineId: "sout-005-line-2", returnQty: 0, reason: "", note: "" },
    ],
  },
  {
    id: "sr-012",
    no: "SR20260415-0012",
    stockoutId: "sout-008",
    returnDate: "2026-04-15",
    status: "待入库",
    remark: "第二批扫码枪另起退货单。",
    createdBy: "王晨",
    createdAt: "2026-04-15 16:20:00",
    updatedBy: "陈诺",
    updatedAt: "2026-04-15 16:40:00",
    auditBy: "陈诺",
    auditAt: "2026-04-15 16:40:00",
    lines: [
      { id: "sr-012-line-1", stockoutLineId: "sout-008-line-1", returnQty: 1, reason: "质量问题", note: "" },
      { id: "sr-012-line-2", stockoutLineId: "sout-008-line-2", returnQty: 2, reason: "其他", note: "" },
    ],
  },
];

const inboundSeedFallback: SalesReturnInboundSeed[] = [
  {
    id: "srin-001",
    no: "SR-IN20260420-0001",
    returnId: "sr-005",
    inboundDate: "2026-04-20",
    status: "草稿",
    remark: "第一车待回仓签收。",
    createdBy: "杭州电商仓",
    createdAt: "2026-04-20 09:50:00",
    updatedBy: "杭州电商仓",
    updatedAt: "2026-04-20 09:55:00",
    confirmBy: "",
    confirmAt: "",
    lines: [{ id: "srin-001-line-1", returnLineId: "sr-005-line-1", inboundQty: 1, note: "" }],
  },
  {
    id: "srin-002",
    no: "SR-IN20260420-0002",
    returnId: "sr-006",
    inboundDate: "2026-04-20",
    status: "草稿",
    remark: "项目客户退货待回仓。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-20 10:40:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-20 10:45:00",
    confirmBy: "",
    confirmAt: "",
    lines: [
      { id: "srin-002-line-1", returnLineId: "sr-006-line-1", inboundQty: 1, note: "" },
      { id: "srin-002-line-2", returnLineId: "sr-006-line-2", inboundQty: 1, note: "" },
    ],
  },
  {
    id: "srin-003",
    no: "SR-IN20260420-0003",
    returnId: "sr-012",
    inboundDate: "2026-04-20",
    status: "草稿",
    remark: "扫码枪第二批待签收。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-20 11:30:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-20 11:35:00",
    confirmBy: "",
    confirmAt: "",
    lines: [{ id: "srin-003-line-1", returnLineId: "sr-012-line-2", inboundQty: 1, note: "" }],
  },
  {
    id: "srin-004",
    no: "SR-IN20260419-0004",
    returnId: "sr-007",
    inboundDate: "2026-04-19",
    status: "已入库",
    remark: "第一批扫码枪退回入库。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-19 16:20:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-19 16:28:00",
    confirmBy: "广州中央仓",
    confirmAt: "2026-04-19 16:28:00",
    lines: [
      { id: "srin-004-line-1", returnLineId: "sr-007-line-1", inboundQty: 1, note: "" },
      { id: "srin-004-line-2", returnLineId: "sr-007-line-2", inboundQty: 2, note: "" },
    ],
  },
  {
    id: "srin-005",
    no: "SR-IN20260419-0005",
    returnId: "sr-008",
    inboundDate: "2026-04-19",
    status: "已入库",
    remark: "第二批退货第一车回仓。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-19 15:30:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-19 15:36:00",
    confirmBy: "广州中央仓",
    confirmAt: "2026-04-19 15:36:00",
    lines: [
      { id: "srin-005-line-1", returnLineId: "sr-008-line-1", inboundQty: 1, note: "" },
      { id: "srin-005-line-2", returnLineId: "sr-008-line-2", inboundQty: 2, note: "" },
    ],
  },
  {
    id: "srin-006",
    no: "SR-IN20260418-0006",
    returnId: "sr-009",
    inboundDate: "2026-04-18",
    status: "已入库",
    remark: "项目退货已回仓。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-18 10:50:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-18 10:56:00",
    confirmBy: "广州中央仓",
    confirmAt: "2026-04-18 10:56:00",
    lines: [
      { id: "srin-006-line-1", returnLineId: "sr-009-line-1", inboundQty: 1, note: "" },
      { id: "srin-006-line-2", returnLineId: "sr-009-line-2", inboundQty: 1, note: "" },
    ],
  },
  {
    id: "srin-007",
    no: "SR-IN20260417-0007",
    returnId: "sr-010",
    inboundDate: "2026-04-17",
    status: "已入库",
    remark: "打印机整机退货回仓。",
    createdBy: "杭州电商仓",
    createdAt: "2026-04-17 09:40:00",
    updatedBy: "杭州电商仓",
    updatedAt: "2026-04-17 09:45:00",
    confirmBy: "杭州电商仓",
    confirmAt: "2026-04-17 09:45:00",
    lines: [
      { id: "srin-007-line-1", returnLineId: "sr-010-line-1", inboundQty: 1, note: "" },
      { id: "srin-007-line-2", returnLineId: "sr-010-line-2", inboundQty: 2, note: "" },
    ],
  },
  {
    id: "srin-008",
    no: "SR-IN20260417-0008",
    returnId: "sr-007",
    inboundDate: "2026-04-20",
    status: "已入库",
    remark: "第二车扫码枪回仓。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-20 16:00:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-20 16:08:00",
    confirmBy: "广州中央仓",
    confirmAt: "2026-04-20 16:08:00",
    lines: [
      { id: "srin-008-line-1", returnLineId: "sr-007-line-1", inboundQty: 1, note: "" },
      { id: "srin-008-line-2", returnLineId: "sr-007-line-2", inboundQty: 1, note: "" },
    ],
  },
  {
    id: "srin-009",
    no: "SR-IN20260417-0009",
    returnId: "sr-008",
    inboundDate: "2026-04-20",
    status: "已入库",
    remark: "第二车客户退货回仓。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-20 16:20:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-20 16:26:00",
    confirmBy: "广州中央仓",
    confirmAt: "2026-04-20 16:26:00",
    lines: [
      { id: "srin-009-line-1", returnLineId: "sr-008-line-1", inboundQty: 1, note: "" },
      { id: "srin-009-line-2", returnLineId: "sr-008-line-2", inboundQty: 1, note: "" },
    ],
  },
  {
    id: "srin-010",
    no: "SR-IN20260416-0010",
    returnId: "sr-008",
    inboundDate: "2026-04-16",
    status: "已作废",
    remark: "误建草稿后作废。",
    createdBy: "广州中央仓",
    createdAt: "2026-04-16 11:10:00",
    updatedBy: "广州中央仓",
    updatedAt: "2026-04-16 11:15:00",
    confirmBy: "",
    confirmAt: "",
    lines: [{ id: "srin-010-line-1", returnLineId: "sr-008-line-2", inboundQty: 1, note: "" }],
  },
];

function getStoredReturnSeeds() {
  return readStorage(RETURN_STORAGE_KEY, returnSeedFallback);
}

function setStoredReturnSeeds(records: SalesReturnSeed[]) {
  writeStorage(RETURN_STORAGE_KEY, records);
}

function getStoredInboundSeeds() {
  return readStorage(INBOUND_STORAGE_KEY, inboundSeedFallback);
}

function setStoredInboundSeeds(records: SalesReturnInboundSeed[]) {
  writeStorage(INBOUND_STORAGE_KEY, records);
}

function nextNumber(prefix: "SR" | "SR-IN", existingNos: string[]) {
  const today = nowDate().replace(/-/g, "");
  const maxSeq = existingNos
    .filter((no) => no.startsWith(`${prefix}${today}-`))
    .map((no) => Number(no.split("-")[1] ?? 0))
    .reduce((max, current) => Math.max(max, current), 0);
  return `${prefix}${today}-${String(maxSeq + 1).padStart(4, "0")}`;
}

function buildRequestedMap(returns: SalesReturnSeed[]) {
  return returns
    .filter((item) => item.status !== "已作废")
    .reduce<Record<string, number>>((acc, current) => {
      current.lines.forEach((line) => {
        acc[line.stockoutLineId] = (acc[line.stockoutLineId] ?? 0) + Number(line.returnQty || 0);
      });
      return acc;
    }, {});
}

function buildInboundMap(inbounds: SalesReturnInboundSeed[]) {
  return inbounds
    .filter((item) => item.status === "已入库")
    .reduce<Record<string, number>>((acc, current) => {
      current.lines.forEach((line) => {
        acc[line.returnLineId] = (acc[line.returnLineId] ?? 0) + Number(line.inboundQty || 0);
      });
      return acc;
    }, {});
}

function hydrateReturns(returnSeeds: SalesReturnSeed[], inboundSeeds: SalesReturnInboundSeed[]): SalesReturnRecord[] {
  const requestedMap = buildRequestedMap(returnSeeds);
  const inboundMap = buildInboundMap(inboundSeeds);
  return returnSeeds.map((seed) => {
    const stockout = getSalesStockout(seed.stockoutId);
    const lines = seed.lines.map((line) => {
      const stockoutLine = stockout?.lines.find((item) => item.id === line.stockoutLineId);
      const ownQty = seed.status === "已作废" ? 0 : Number(line.returnQty || 0);
      const requestedByOthers = Math.max((requestedMap[line.stockoutLineId] ?? 0) - ownQty, 0);
      const originalStockoutQty = stockoutLine?.stockoutQty ?? 0;
      const availableQty = Math.max(originalStockoutQty - requestedByOthers, 0);
      const inboundQty = inboundMap[line.id] ?? 0;
      const pendingQty = Math.max(Number(line.returnQty || 0) - inboundQty, 0);
      const price = stockoutLine?.price ?? 0;
      return {
        ...line,
        skuCode: stockoutLine?.skuCode ?? "-",
        skuName: stockoutLine?.skuName ?? "-",
        spec: stockoutLine?.spec ?? "-",
        unit: stockoutLine?.unit ?? "-",
        originalStockoutQty,
        availableQty,
        inboundQty,
        pendingQty,
        price,
        amount: Number((Number(line.returnQty || 0) * price).toFixed(2)),
      };
    });

    let status = seed.status;
    if (status !== "草稿" && status !== "待审核" && status !== "已作废") {
      if (lines.some((line) => line.returnQty > 0) && lines.every((line) => line.pendingQty === 0 || line.returnQty === 0)) {
        status = "已完成";
      } else if (lines.some((line) => line.inboundQty > 0)) {
        status = "部分入库";
      } else {
        status = "待入库";
      }
    }

    return {
      ...seed,
      stockoutNo: stockout?.no ?? "-",
      customerLabel: stockout?.customerLabel ?? "-",
      warehouseLabel: stockout?.warehouseLabel ?? "-",
      status,
      statusTone: getSalesReturnTone(status),
      lines,
      skuCount: lines.filter((line) => line.returnQty > 0).length,
      totalQty: lines.reduce((sum, line) => sum + Number(line.returnQty || 0), 0),
      totalAmount: Number(lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
      inboundTotalQty: lines.reduce((sum, line) => sum + line.inboundQty, 0),
      pendingTotalQty: lines.reduce((sum, line) => sum + line.pendingQty, 0),
    };
  });
}

function hydrateInbounds(returnSeeds: SalesReturnSeed[], inboundSeeds: SalesReturnInboundSeed[]): SalesReturnInboundRecord[] {
  const returns = hydrateReturns(returnSeeds, inboundSeeds);
  return inboundSeeds.map((seed) => {
    const returnDoc = returns.find((item) => item.id === seed.returnId);
    const lines = seed.lines.map((line) => {
      const returnLine = returnDoc?.lines.find((item) => item.id === line.returnLineId);
      const inboundQty = Number(line.inboundQty || 0);
      const price = Number(returnLine?.price || 0);
      return {
        ...line,
        skuCode: returnLine?.skuCode ?? "-",
        skuName: returnLine?.skuName ?? "-",
        spec: returnLine?.spec ?? "-",
        unit: returnLine?.unit ?? "-",
        requestedQty: returnLine?.returnQty ?? 0,
        pendingQty: returnLine?.pendingQty ?? 0,
        price,
        amount: Number((inboundQty * price).toFixed(2)),
      };
    });
    return {
      ...seed,
      returnNo: returnDoc?.no ?? "-",
      customerLabel: returnDoc?.customerLabel ?? "-",
      warehouseLabel: returnDoc?.warehouseLabel ?? "-",
      statusTone: getSalesReturnTone(seed.status),
      lines,
      totalQty: lines.reduce((sum, line) => sum + line.inboundQty, 0),
      totalAmount: Number(lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2)),
    };
  });
}

export function getSalesReturnWorkspace() {
  const returnSeeds = getStoredReturnSeeds();
  const inboundSeeds = getStoredInboundSeeds();
  return {
    returns: hydrateReturns(returnSeeds, inboundSeeds),
    inbounds: hydrateInbounds(returnSeeds, inboundSeeds),
  };
}

export function getSalesReturns() {
  return getSalesReturnWorkspace().returns;
}

export function getSalesReturn(id: string) {
  return getSalesReturns().find((item) => item.id === id) ?? null;
}

export function getSalesReturnInbounds() {
  return getSalesReturnWorkspace().inbounds;
}

export function getSalesReturnInbound(id: string) {
  return getSalesReturnInbounds().find((item) => item.id === id) ?? null;
}

export function getSalesReturnSourceStockouts() {
  return getSalesStockouts().filter((item) => item.status === "已出库");
}

export function buildSalesReturnLinesFromStockout(stockoutId: string): SalesReturnLine[] {
  const stockout = getSalesStockout(stockoutId);
  const requestedMap = buildRequestedMap(getStoredReturnSeeds());
  return (
    stockout?.lines.map((line) => ({
      id: `sales-return-line-${line.id}`,
      stockoutLineId: line.id,
      skuCode: line.skuCode,
      skuName: line.skuName,
      spec: line.spec,
      unit: line.unit,
      originalStockoutQty: line.stockoutQty,
      availableQty: Math.max(line.stockoutQty - (requestedMap[line.id] ?? 0), 0),
      returnQty: 0,
      inboundQty: 0,
      pendingQty: 0,
      reason: "",
      note: "",
      price: line.price,
      amount: 0,
    })) ?? []
  );
}

export function createSalesReturnDraft(stockoutId = ""): SalesReturnRecord {
  const stockout = stockoutId ? getSalesStockout(stockoutId) : null;
  return {
    id: `sales-return-draft-${Date.now()}`,
    no: "",
    stockoutId: stockout?.id ?? "",
    stockoutNo: stockout?.no ?? "",
    customerLabel: stockout?.customerLabel ?? "",
    warehouseLabel: stockout?.warehouseLabel ?? "",
    returnDate: nowDate(),
    status: "草稿",
    statusTone: "gray",
    remark: "",
    lines: stockout ? buildSalesReturnLinesFromStockout(stockout.id) : [],
    skuCount: 0,
    totalQty: 0,
    totalAmount: 0,
    inboundTotalQty: 0,
    pendingTotalQty: 0,
    createdBy: CURRENT_USER,
    createdAt: nowDateTime(),
    updatedBy: CURRENT_USER,
    updatedAt: nowDateTime(),
    auditBy: "",
    auditAt: "",
  };
}

export function getSalesReturnInboundSourceReturns() {
  return getSalesReturns().filter((item) => item.status === "待入库" || item.status === "部分入库");
}

export function buildSalesReturnInboundLinesFromReturn(returnId: string): SalesReturnInboundLine[] {
  const returnDoc = getSalesReturn(returnId);
  return (
    returnDoc?.lines
      .filter((line) => line.returnQty > 0)
      .map((line) => ({
        id: `sales-return-inbound-line-${line.id}`,
        returnLineId: line.id,
        skuCode: line.skuCode,
        skuName: line.skuName,
        spec: line.spec,
        unit: line.unit,
        requestedQty: line.returnQty,
        pendingQty: line.pendingQty,
        inboundQty: 0,
        price: line.price,
        amount: 0,
        note: "",
      })) ?? []
  );
}

export function createSalesReturnInboundDraft(returnId = ""): SalesReturnInboundRecord {
  const returnDoc = returnId ? getSalesReturn(returnId) : null;
  return {
    id: `sales-return-inbound-draft-${Date.now()}`,
    no: "",
    returnId: returnDoc?.id ?? "",
    returnNo: returnDoc?.no ?? "",
    customerLabel: returnDoc?.customerLabel ?? "",
    warehouseLabel: returnDoc?.warehouseLabel ?? "",
    inboundDate: nowDate(),
    status: "草稿",
    statusTone: "gray",
    remark: "",
    lines: returnDoc ? buildSalesReturnInboundLinesFromReturn(returnDoc.id) : [],
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

function toReturnSeed(record: SalesReturnRecord, status: SalesReturnStatus): SalesReturnSeed {
  return {
    ...record,
    status,
    lines: record.lines.map((line) => ({
      id: line.id,
      stockoutLineId: line.stockoutLineId,
      returnQty: Number(line.returnQty || 0),
      reason: line.reason,
      note: line.note,
    })),
  };
}

function toInboundSeed(record: SalesReturnInboundRecord, status: SalesReturnInboundStatus): SalesReturnInboundSeed {
  return {
    ...record,
    status,
    lines: record.lines.map((line) => ({
      id: line.id,
      returnLineId: line.returnLineId,
      inboundQty: Number(line.inboundQty || 0),
      note: line.note,
    })),
  };
}

function replaceRecord<T extends { id: string }>(items: T[], record: T) {
  const exists = items.some((item) => item.id === record.id);
  return exists ? items.map((item) => (item.id === record.id ? record : item)) : [record, ...items];
}

export function saveSalesReturn(record: SalesReturnRecord, intent: "draft" | "submit") {
  const returnSeeds = getStoredReturnSeeds();
  const source = getSalesReturn(record.id);
  const timestamp = nowDateTime();
  const status = intent === "submit" ? "待审核" : "草稿";
  const nextRecord: SalesReturnRecord = {
    ...record,
    no: record.no || nextNumber("SR", getSalesReturns().map((item) => item.no)),
    status,
    statusTone: getSalesReturnTone(status),
    skuCount: record.lines.filter((line) => Number(line.returnQty || 0) > 0).length,
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.returnQty || 0), 0),
    totalAmount: Number(record.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
    inboundTotalQty: source?.inboundTotalQty ?? 0,
    pendingTotalQty: record.lines.reduce((sum, line) => sum + Number(line.returnQty || 0), 0) - (source?.inboundTotalQty ?? 0),
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    auditBy: source?.auditBy ?? "",
    auditAt: source?.auditAt ?? "",
  };
  setStoredReturnSeeds(replaceRecord(returnSeeds, toReturnSeed(nextRecord, status)));
  return getSalesReturn(nextRecord.id);
}

export function approveSalesReturn(id: string) {
  const records = getStoredReturnSeeds();
  const timestamp = nowDateTime();
  setStoredReturnSeeds(records.map((item) => (item.id === id ? { ...item, status: "待入库", updatedBy: CURRENT_USER, updatedAt: timestamp, auditBy: CURRENT_USER, auditAt: timestamp } : item)));
}

export function rejectSalesReturn(id: string) {
  const records = getStoredReturnSeeds();
  const timestamp = nowDateTime();
  setStoredReturnSeeds(records.map((item) => (item.id === id ? { ...item, status: "草稿", updatedBy: CURRENT_USER, updatedAt: timestamp, auditBy: "", auditAt: "" } : item)));
}

export function voidSalesReturn(id: string) {
  const records = getStoredReturnSeeds();
  const timestamp = nowDateTime();
  setStoredReturnSeeds(records.map((item) => (item.id === id ? { ...item, status: "已作废", updatedBy: CURRENT_USER, updatedAt: timestamp } : item)));
}

export function saveSalesReturnInbound(record: SalesReturnInboundRecord) {
  const inboundSeeds = getStoredInboundSeeds();
  const source = getSalesReturnInbound(record.id);
  const timestamp = nowDateTime();
  const nextRecord: SalesReturnInboundRecord = {
    ...record,
    no: record.no || nextNumber("SR-IN", getSalesReturnInbounds().map((item) => item.no)),
    status: "草稿",
    statusTone: "gray",
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.inboundQty || 0), 0),
    totalAmount: Number(record.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    confirmBy: source?.confirmBy ?? "",
    confirmAt: source?.confirmAt ?? "",
  };
  setStoredInboundSeeds(replaceRecord(inboundSeeds, toInboundSeed(nextRecord, "草稿")));
  return getSalesReturnInbound(nextRecord.id);
}

export function confirmSalesReturnInbound(record: SalesReturnInboundRecord) {
  const returnDoc = getSalesReturn(record.returnId);
  if (!returnDoc || (returnDoc.status !== "待入库" && returnDoc.status !== "部分入库")) {
    return null;
  }
  const inboundSeeds = getStoredInboundSeeds();
  const source = getSalesReturnInbound(record.id);
  const timestamp = nowDateTime();
  const nextRecord: SalesReturnInboundRecord = {
    ...record,
    no: record.no || nextNumber("SR-IN", getSalesReturnInbounds().map((item) => item.no)),
    status: "已入库",
    statusTone: "green",
    totalQty: record.lines.reduce((sum, line) => sum + Number(line.inboundQty || 0), 0),
    totalAmount: Number(record.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
    createdBy: source?.createdBy ?? CURRENT_USER,
    createdAt: source?.createdAt ?? timestamp,
    updatedBy: CURRENT_USER,
    updatedAt: timestamp,
    confirmBy: CURRENT_USER,
    confirmAt: timestamp,
  };
  setStoredInboundSeeds(replaceRecord(inboundSeeds, toInboundSeed(nextRecord, "已入库")));
  return getSalesReturnInbound(nextRecord.id);
}

export function deleteSalesReturn(id: string) {
  setStoredReturnSeeds(getStoredReturnSeeds().filter((item) => item.id !== id));
}

export function deleteSalesReturnInbound(id: string) {
  setStoredInboundSeeds(getStoredInboundSeeds().filter((item) => item.id !== id));
}

export function getLinkedSalesReturnInbounds(returnId: string) {
  return getSalesReturnInbounds().filter((item) => item.returnId === returnId);
}
