import type { QueryModuleDefinition } from "../types";
import { money } from "./shared";
import { payableQueryRows } from "../../mocks/payable";

export const payableQueryModuleDefinition: QueryModuleDefinition = {
  kind: "query",
  view: "payable-query",
  title: "应付查询",
  listDescription: "查看各供应商当前应付余额、账期状态和付款记录，为付款登记提供决策依据。",
  filters: [
    { key: "supplier", label: "供应商", type: "select", placeholder: "选择供应商", options: ["全部"] },
    { key: "periodStatus", label: "账期状态", type: "select", options: ["全部", "账期内", "临近到期（7天内）", "已逾期", "已结清"] },
    { key: "hasPayment", label: "是否有未付款", type: "select", options: ["全部", "有未付款", "已全额付款"] },
  ],
  metrics: [
    { label: "命中供应商数", value: "8 位供应商", tone: "blue" },
    { label: "应付总余额", value: "¥1,005,300.00", tone: "orange" },
    { label: "即将到期（7天内）", value: "¥68,000.00", tone: "orange" },
    { label: "已逾期未付款", value: "¥195,200.00", tone: "red" },
  ],
  columns: [
    { key: "supplier", label: "供应商", width: 200 },
    { key: "balance", label: "应付余额", align: "right", kind: "money", width: 140 },
    { key: "periodStatusTag", label: "账期状态", width: 110 },
    { key: "remainingDays", label: "剩余账期（天）", align: "right", width: 110 },
    { key: "dueDate", label: "账期到期日", width: 120 },
    { key: "supplierPeriodDays", label: "供应商账期（天）", align: "right", width: 110 },
    { key: "uninvoicedCount", label: "未核销入库单数", align: "right", width: 120 },
    { key: "lastPaymentDate", label: "最近付款日期", width: 120 },
    { key: "lastPaymentAmount", label: "最近付款金额", align: "right", kind: "money", width: 130 },
    { key: "action", label: "操作", width: 100 },
  ],
  rows: payableQueryRows.map((row) => {
    const statusMap: Record<string, string> = {
      within: "账期内",
      approaching: "临近到期",
      overdue: "已逾期",
      settled: "已结清",
    };
    const toneMap: Record<string, "green" | "orange" | "red" | "gray"> = {
      within: "green",
      approaching: "orange",
      overdue: "red",
      settled: "gray",
    };
    return {
      supplier: `${row.supplierCode} ${row.supplierName}`,
      balance: row.balance === "0.00" ? "¥0.00" : money(parseFloat(row.balance.replace(/,/g, ""))),
      periodStatusTag: statusMap[row.periodStatus],
      remainingDays: row.remainingDays >= 0 ? `${row.remainingDays}天` : `${row.remainingDays}天`,
      dueDate: row.dueDate,
      supplierPeriodDays: row.supplierPeriodDays > 0 ? `${row.supplierPeriodDays}天` : "-",
      uninvoicedCount: String(row.uninvoicedCount),
      lastPaymentDate: row.lastPaymentDate,
      lastPaymentAmount: row.lastPaymentAmount === "0.00" ? "-" : money(parseFloat(row.lastPaymentAmount.replace(/,/g, ""))),
      action: "登记付款",
      _tone: toneMap[row.periodStatus],
    };
  }),
};
