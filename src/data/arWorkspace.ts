import { receiptRecords, type ReceiptRecord } from "../mocks/receipts";
import { paymentRecords, type PaymentRecord } from "../mocks/payments";
import { receivableQueryRows, type ReceivableQueryRow } from "../mocks/receivable";
import { payableQueryRows, type PayableQueryRow } from "../mocks/payable";
import { getSalesStockouts } from "./salesWorkspace";
import { getPurchaseReceipts } from "./purchaseWorkspace";

const RECEIPT_STORAGE_KEY = "jxc-ar-receipts-v20260420";
const PAYMENT_STORAGE_KEY = "jxc-ar-payments-v20260420";
const CURRENT_USER = "当前用户";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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

function formatMoneyValue(value: number) {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function moneyText(value: number) {
  return `¥${formatMoneyValue(value)}`;
}

function parseAmount(value?: string) {
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

function nextNumber(prefix: "SK" | "FK", existingNos: string[]) {
  const today = nowDate().replace(/-/g, "");
  const maxSeq = existingNos
    .filter((no) => no.startsWith(`${prefix}${today}`))
    .map((no) => Number(no.replace(`${prefix}${today}`, "")))
    .reduce((max, current) => Math.max(max, current), 0);
  return `${prefix}${today}${String(maxSeq + 1).padStart(3, "0")}`;
}

function getStoredReceipts() {
  return readStorage(RECEIPT_STORAGE_KEY, receiptRecords);
}

function setStoredReceipts(records: ReceiptRecord[]) {
  writeStorage(RECEIPT_STORAGE_KEY, records);
}

function getStoredPayments() {
  return readStorage(PAYMENT_STORAGE_KEY, paymentRecords);
}

function setStoredPayments(records: PaymentRecord[]) {
  writeStorage(PAYMENT_STORAGE_KEY, records);
}

function replaceRecord<T extends { id: string }>(items: T[], record: T) {
  const exists = items.some((item) => item.id === record.id);
  return exists ? items.map((item) => (item.id === record.id ? record : item)) : [record, ...items];
}

function maxByDate<T>(items: T[], getDate: (item: T) => string) {
  return items.reduce<T | null>((latest, current) => {
    if (!latest) return current;
    return getDate(current) > getDate(latest) ? current : latest;
  }, null);
}

function getUsedDeliveryNos(excludeReceiptId?: string) {
  return new Set(
    getStoredReceipts()
      .filter((item) => item.id !== excludeReceiptId && item.status === "已确认")
      .flatMap((item) => item.linkedDeliveryNos ?? []),
  );
}

function getUsedInboundNos(excludePaymentId?: string) {
  return new Set(
    getStoredPayments()
      .filter((item) => item.id !== excludePaymentId && item.status === "已确认")
      .flatMap((item) => item.linkedInboundNos ?? []),
  );
}

function getCandidateDeliveryDocs(customerCode: string, excludeReceiptId?: string) {
  const usedNos = getUsedDeliveryNos(excludeReceiptId);
  return getSalesStockouts()
    .filter((item) => item.status === "已出库" && item.customerLabel.startsWith(`${customerCode} `) && !usedNos.has(item.no))
    .map((item) => ({ no: item.no, amount: item.totalAmount }));
}

function getCandidateInboundDocs(supplierCode: string, excludePaymentId?: string) {
  const usedNos = getUsedInboundNos(excludePaymentId);
  return getPurchaseReceipts()
    .filter((item) => item.status === "已入库" && item.supplierLabel.startsWith(`${supplierCode} `) && !usedNos.has(item.no))
    .map((item) => ({ no: item.no, amount: item.totalAmount }));
}

function buildReceiptLinkStats(customerCode: string, amount: number, excludeReceiptId?: string, selectedNos?: string[]) {
  const docs = getCandidateDeliveryDocs(customerCode, excludeReceiptId);
  const linkedDocs = selectedNos && selectedNos.length > 0 ? docs.filter((item) => selectedNos.includes(item.no)) : docs;
  const actualLinkedAmount = linkedDocs.reduce((sum, item) => sum + item.amount, 0);
  const diff = amount - actualLinkedAmount;
  return {
    linkedDeliveryNos: linkedDocs.map((item) => item.no),
    linkedDeliveryAmounts: linkedDocs.map((item) => formatMoneyValue(item.amount)),
    candidateDeliveryDocs: docs,
    stats: {
      linkedCount: linkedDocs.length,
      linkedAmount: moneyText(actualLinkedAmount),
      receiptAmount: moneyText(amount),
      difference: linkedDocs.length === 0 ? "-" : diff === 0 ? "¥0.00" : diff > 0 ? `+${formatMoneyValue(diff)}` : `${formatMoneyValue(diff)}`,
      differenceTone: linkedDocs.length === 0 ? ("orange" as const) : diff === 0 ? ("green" as const) : diff > 0 ? ("blue" as const) : ("orange" as const),
    },
  };
}

function buildPaymentLinkStats(supplierCode: string, amount: number, excludePaymentId?: string, selectedNos?: string[]) {
  const docs = getCandidateInboundDocs(supplierCode, excludePaymentId);
  const linkedDocs = selectedNos && selectedNos.length > 0 ? docs.filter((item) => selectedNos.includes(item.no)) : docs;
  const linkedAmountNumber = linkedDocs.reduce((sum, item) => sum + item.amount, 0);
  const diff = amount - linkedAmountNumber;
  return {
    linkedInboundNos: linkedDocs.map((item) => item.no),
    linkedInboundAmounts: linkedDocs.map((item) => formatMoneyValue(item.amount)),
    candidateInboundDocs: docs,
    stats: {
      linkedCount: linkedDocs.length,
      linkedAmount: moneyText(linkedAmountNumber),
      paymentAmount: moneyText(amount),
      difference: linkedDocs.length === 0 ? "-" : diff === 0 ? "¥0.00" : diff > 0 ? `+${formatMoneyValue(diff)}` : `${formatMoneyValue(diff)}`,
      differenceTone: linkedDocs.length === 0 ? ("orange" as const) : diff === 0 ? ("green" as const) : diff > 0 ? ("blue" as const) : ("orange" as const),
    },
  };
}

export function previewReceiptLinkStats(customerCode: string, amount: number, excludeReceiptId?: string, selectedNos?: string[]) {
  return buildReceiptLinkStats(customerCode, amount, excludeReceiptId, selectedNos);
}

export function previewPaymentLinkStats(supplierCode: string, amount: number, excludePaymentId?: string, selectedNos?: string[]) {
  return buildPaymentLinkStats(supplierCode, amount, excludePaymentId, selectedNos);
}

export function getReceiptRecord(recordId: string) {
  return getStoredReceipts().find((item) => item.id === recordId) ?? null;
}

export function getPaymentRecord(recordId: string) {
  return getStoredPayments().find((item) => item.id === recordId) ?? null;
}

export function getReceiptRecords() {
  return clone(getStoredReceipts());
}

export function getPaymentRecords() {
  return clone(getStoredPayments());
}

export function getReceiptCustomerOptions() {
  return Array.from(new Set([...receivableQueryRows.map((item) => `${item.customerCode} ${item.customerName}`), ...getStoredReceipts().map((item) => `${item.customerCode} ${item.customerName}`)]));
}

export function getPaymentSupplierOptions() {
  return Array.from(new Set([...payableQueryRows.map((item) => `${item.supplierCode} ${item.supplierName}`), ...getStoredPayments().map((item) => `${item.supplierCode} ${item.supplierName}`)]));
}

export function createReceiptDraft(prefill?: { customerCode?: string; customerName?: string }) {
  return {
    id: `receipt-draft-${Date.now()}`,
    receiptNo: "",
    status: "草稿" as const,
    statusTone: "gray" as const,
    isHeld: false,
    customerCode: prefill?.customerCode ?? "",
    customerName: prefill?.customerName ?? "",
    receiptDate: nowDate(),
    receiptMethod: "",
    receiptAmount: "0.00",
    updatedAt: nowDateTime(),
    verificationStatus: "未核销" as const,
    verificationTone: "gray" as const,
    accountInfo: "",
    customerPaymentAccount: "",
    note: "",
    confirmedBy: "",
    confirmedAt: "",
    linkedDeliveryNos: [],
    linkedDeliveryAmounts: [],
    stats: {
      linkedCount: 0,
      linkedAmount: "¥0.00",
      receiptAmount: "¥0.00",
      difference: "-",
      differenceTone: "orange" as const,
    },
    creator: CURRENT_USER,
    createdAt: nowDateTime(),
    lastModifier: CURRENT_USER,
  } satisfies ReceiptRecord;
}

export function createPaymentDraft(prefill?: { supplierCode?: string; supplierName?: string }) {
  return {
    id: `payment-draft-${Date.now()}`,
    paymentNo: "",
    status: "草稿" as const,
    statusTone: "gray" as const,
    periodStatus: "within" as const,
    periodTone: "green" as const,
    supplierCode: prefill?.supplierCode ?? "",
    supplierName: prefill?.supplierName ?? "",
    paymentDate: nowDate(),
    paymentMethod: "",
    paymentAmount: "0.00",
    updatedAt: nowDateTime(),
    verificationStatus: "未核销" as const,
    verificationTone: "gray" as const,
    paymentAccount: "",
    supplierReceiveAccount: "",
    note: "",
    confirmedBy: "",
    confirmedAt: "",
    linkedInboundNos: [],
    linkedInboundAmounts: [],
    stats: {
      linkedCount: 0,
      linkedAmount: "¥0.00",
      paymentAmount: "¥0.00",
      difference: "-",
      differenceTone: "orange" as const,
    },
    creator: CURRENT_USER,
    createdAt: nowDateTime(),
    lastModifier: CURRENT_USER,
  } satisfies PaymentRecord;
}

export function saveReceiptDraft(input: {
  id?: string;
  customerCode: string;
  customerName: string;
  receiptDate: string;
  receiptMethod: string;
  receiptAmount: string;
  accountInfo?: string;
  customerPaymentAccount?: string;
  note?: string;
  isHeld?: boolean;
  linkedDeliveryNos?: string[];
}) {
  const records = getStoredReceipts();
  const source = input.id ? records.find((item) => item.id === input.id) : null;
  const amount = parseAmount(input.receiptAmount);
  const linked = buildReceiptLinkStats(input.customerCode, amount, source?.id, input.linkedDeliveryNos);
  const next: ReceiptRecord = {
    id: source?.id ?? `receipt-${Date.now()}`,
    receiptNo: source?.receiptNo || nextNumber("SK", records.map((item) => item.receiptNo)),
    status: "草稿",
    statusTone: "gray",
    isHeld: input.isHeld ?? source?.isHeld ?? false,
    heldTone: (input.isHeld ?? source?.isHeld) ? "orange" : undefined,
    customerCode: input.customerCode,
    customerName: input.customerName,
    receiptDate: input.receiptDate,
    receiptMethod: input.receiptMethod,
    receiptAmount: formatMoneyValue(amount),
    updatedAt: nowDateTime(),
    verificationStatus: "未核销",
    verificationTone: "gray",
    accountInfo: input.accountInfo ?? "",
    customerPaymentAccount: input.customerPaymentAccount ?? "",
    note: input.note ?? "",
    confirmedBy: source?.confirmedBy ?? "",
    confirmedAt: source?.confirmedAt ?? "",
    linkedDeliveryNos: linked.linkedDeliveryNos,
    linkedDeliveryAmounts: linked.linkedDeliveryAmounts,
    stats: linked.stats,
    creator: source?.creator ?? CURRENT_USER,
    createdAt: source?.createdAt ?? nowDateTime(),
    lastModifier: CURRENT_USER,
  };
  setStoredReceipts(replaceRecord(records, next));
  return next;
}

export function confirmReceiptRecord(recordId: string) {
  const records = getStoredReceipts();
  const source = records.find((item) => item.id === recordId);
  if (!source) return null;
  const amount = parseAmount(source.receiptAmount);
  const linked = buildReceiptLinkStats(source.customerCode, amount, source.id);
  const confirmed: ReceiptRecord = {
    ...source,
    status: "已确认",
    statusTone: "green",
    verificationStatus: source.isHeld ? "未核销" : linked.linkedDeliveryNos.length > 0 ? "完全核销" : "未核销",
    verificationTone: source.isHeld ? "gray" : linked.linkedDeliveryNos.length > 0 ? "green" : "gray",
    heldTone: source.isHeld ? "orange" : "green",
    confirmedBy: CURRENT_USER,
    confirmedAt: nowDateTime(),
    updatedAt: nowDateTime(),
    linkedDeliveryNos: linked.linkedDeliveryNos,
    linkedDeliveryAmounts: linked.linkedDeliveryAmounts,
    stats: linked.stats,
  };
  setStoredReceipts(replaceRecord(records, confirmed));
  return confirmed;
}

export function voidReceiptRecord(recordId: string) {
  const records = getStoredReceipts();
  const source = records.find((item) => item.id === recordId);
  if (!source) return null;
  const next = { ...source, status: "已作废" as const, statusTone: "red" as const, updatedAt: nowDateTime() };
  setStoredReceipts(replaceRecord(records, next));
  return next;
}

export function deleteReceiptRecord(recordId: string) {
  setStoredReceipts(getStoredReceipts().filter((item) => item.id !== recordId));
}

export function savePaymentDraft(input: {
  id?: string;
  supplierCode: string;
  supplierName: string;
  paymentDate: string;
  paymentMethod: string;
  paymentAmount: string;
  paymentAccount?: string;
  supplierReceiveAccount?: string;
  note?: string;
  linkedInboundNos?: string[];
}) {
  const records = getStoredPayments();
  const source = input.id ? records.find((item) => item.id === input.id) : null;
  const amount = parseAmount(input.paymentAmount);
  const linked = buildPaymentLinkStats(input.supplierCode, amount, source?.id, input.linkedInboundNos);
  const next: PaymentRecord = {
    id: source?.id ?? `payment-${Date.now()}`,
    paymentNo: source?.paymentNo || nextNumber("FK", records.map((item) => item.paymentNo)),
    status: "草稿",
    statusTone: "gray",
    periodStatus: source?.periodStatus ?? "within",
    periodTone: source?.periodTone ?? "green",
    supplierCode: input.supplierCode,
    supplierName: input.supplierName,
    paymentDate: input.paymentDate,
    paymentMethod: input.paymentMethod,
    paymentAmount: formatMoneyValue(amount),
    updatedAt: nowDateTime(),
    verificationStatus: "未核销",
    verificationTone: "gray",
    paymentAccount: input.paymentAccount ?? "",
    supplierReceiveAccount: input.supplierReceiveAccount ?? "",
    note: input.note ?? "",
    confirmedBy: source?.confirmedBy ?? "",
    confirmedAt: source?.confirmedAt ?? "",
    linkedInboundNos: linked.linkedInboundNos,
    linkedInboundAmounts: linked.linkedInboundAmounts,
    stats: linked.stats,
    creator: source?.creator ?? CURRENT_USER,
    createdAt: source?.createdAt ?? nowDateTime(),
    lastModifier: CURRENT_USER,
  };
  setStoredPayments(replaceRecord(records, next));
  return next;
}

export function confirmPaymentRecord(recordId: string) {
  const records = getStoredPayments();
  const source = records.find((item) => item.id === recordId);
  if (!source) return null;
  const amount = parseAmount(source.paymentAmount);
  const linked = buildPaymentLinkStats(source.supplierCode, amount, source.id);
  const confirmed: PaymentRecord = {
    ...source,
    status: "已确认",
    statusTone: "green",
    verificationStatus: linked.linkedInboundNos.length ? "完全核销" : "未核销",
    verificationTone: linked.linkedInboundNos.length ? "green" : "gray",
    confirmedBy: CURRENT_USER,
    confirmedAt: nowDateTime(),
    updatedAt: nowDateTime(),
    linkedInboundNos: linked.linkedInboundNos,
    linkedInboundAmounts: linked.linkedInboundAmounts,
    stats: linked.stats,
  };
  setStoredPayments(replaceRecord(records, confirmed));
  return confirmed;
}

export function voidPaymentRecord(recordId: string) {
  const records = getStoredPayments();
  const source = records.find((item) => item.id === recordId);
  if (!source) return null;
  const next = { ...source, status: "已作废" as const, statusTone: "red" as const, updatedAt: nowDateTime() };
  setStoredPayments(replaceRecord(records, next));
  return next;
}

export function deletePaymentRecord(recordId: string) {
  setStoredPayments(getStoredPayments().filter((item) => item.id !== recordId));
}

export function getReceivableRows(): ReceivableQueryRow[] {
  const baseRows = clone(receivableQueryRows);
  const current = getStoredReceipts();
  const seedConfirmed = receiptRecords.filter((item) => item.status === "已确认" && !item.isHeld);
  const currentConfirmed = current.filter((item) => item.status === "已确认" && !item.isHeld);

  const seedByCustomer = seedConfirmed.reduce<Record<string, number>>((acc, item) => {
    acc[item.customerCode] = (acc[item.customerCode] ?? 0) + parseAmount(item.receiptAmount);
    return acc;
  }, {});
  const currentByCustomer = currentConfirmed.reduce<Record<string, number>>((acc, item) => {
    acc[item.customerCode] = (acc[item.customerCode] ?? 0) + parseAmount(item.receiptAmount);
    return acc;
  }, {});

  return baseRows.map((row) => {
    const delta = (currentByCustomer[row.customerCode] ?? 0) - (seedByCustomer[row.customerCode] ?? 0);
    const nextBalance = Math.max(parseAmount(row.balance) - delta, 0);
    const confirmedRows = current.filter((item) => item.customerCode === row.customerCode && item.status === "已确认");
    const latest = maxByDate(confirmedRows, (item) => `${item.receiptDate} ${item.confirmedAt ?? item.updatedAt}`);
    const creditLimit = parseAmount(row.creditLimit);
    const creditUsageRate = creditLimit > 0 ? Math.round((nextBalance / creditLimit) * 100) : 0;
    return {
      ...row,
      balance: formatMoneyValue(nextBalance),
      creditUsageRate,
      lastReceiptDate: latest?.receiptDate ?? row.lastReceiptDate,
      lastReceiptAmount: latest ? formatMoneyValue(parseAmount(latest.receiptAmount)) : row.lastReceiptAmount,
    };
  });
}

export function getPayableRows(): PayableQueryRow[] {
  const baseRows = clone(payableQueryRows);
  const current = getStoredPayments();
  const seedConfirmed = paymentRecords.filter((item) => item.status === "已确认");
  const currentConfirmed = current.filter((item) => item.status === "已确认");

  const seedBySupplier = seedConfirmed.reduce<Record<string, number>>((acc, item) => {
    acc[item.supplierCode] = (acc[item.supplierCode] ?? 0) + parseAmount(item.paymentAmount);
    return acc;
  }, {});
  const currentBySupplier = currentConfirmed.reduce<Record<string, number>>((acc, item) => {
    acc[item.supplierCode] = (acc[item.supplierCode] ?? 0) + parseAmount(item.paymentAmount);
    return acc;
  }, {});

  return baseRows.map((row) => {
    const delta = (currentBySupplier[row.supplierCode] ?? 0) - (seedBySupplier[row.supplierCode] ?? 0);
    const nextBalance = Math.max(parseAmount(row.balance) - delta, 0);
    const confirmedRows = current.filter((item) => item.supplierCode === row.supplierCode && item.status === "已确认");
    const latest = maxByDate(confirmedRows, (item) => `${item.paymentDate} ${item.confirmedAt ?? item.updatedAt}`);
    return {
      ...row,
      balance: formatMoneyValue(nextBalance),
      periodStatus: nextBalance === 0 ? "settled" : row.periodStatus,
      lastPaymentDate: latest?.paymentDate ?? row.lastPaymentDate,
      lastPaymentAmount: latest ? formatMoneyValue(parseAmount(latest.paymentAmount)) : row.lastPaymentAmount,
    };
  });
}
