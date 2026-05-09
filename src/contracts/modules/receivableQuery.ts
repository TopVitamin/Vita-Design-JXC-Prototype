import type { QueryModuleDefinition } from "../types";
import { money } from "./shared";
import { receivableQueryRows } from "../../mocks/receivable";

export const receivableQueryModuleDefinition: QueryModuleDefinition = {
  kind: "query",
  view: "receivable-query",
  title: "应收查询",
  listDescription: "查看各客户当前应收余额、账龄分布和逾期情况，为收款登记提供决策依据。",
  filters: [
    { key: "customer", label: "客户", type: "select", placeholder: "选择客户", options: ["全部"] },
    { key: "aging", label: "账龄区间", type: "select", options: ["全部", "未逾期（<30天）", "逾期1-30天（30-59天）", "逾期31-60天（60-89天）", "逾期60天以上（≥90天）"] },
    { key: "hasBalance", label: "是否有未回款", type: "select", options: ["全部", "有未回款", "已全额回款"] },
  ],
  metrics: [
    { label: "命中客户数", value: "12 位客户", tone: "blue" },
    { label: "应收总余额", value: "¥946,050.00", tone: "orange" },
    { label: "逾期未回款", value: "¥644,800.00", tone: "red" },
    { label: "本月已回款", value: "¥108,740.00", tone: "green" },
  ],
  columns: [
    { key: "customer", label: "客户", width: 200 },
    { key: "balance", label: "应收余额", align: "right", kind: "money", width: 140 },
    { key: "longestAging", label: "当期最长账龄（天）", align: "right", width: 110 },
    { key: "uninvoicedCount", label: "未核销出库单数", align: "right", width: 120 },
    { key: "creditLimit", label: "信用额度", align: "right", kind: "money", width: 120 },
    { key: "creditUsageRate", label: "信用占用率", align: "right", width: 100 },
    { key: "lastReceiptDate", label: "最近收款日期", width: 120 },
    { key: "lastReceiptAmount", label: "最近收款金额", align: "right", kind: "money", width: 130 },
    { key: "action", label: "操作", width: 100 },
  ],
  rows: receivableQueryRows.map((row) => ({
    customer: `${row.customerCode} ${row.customerName}`,
    balance: row.balance === "0.00" ? "¥0.00" : money(parseFloat(row.balance.replace(/,/g, ""))),
    longestAging: row.longestAging > 0 ? `${row.longestAging}天` : "-",
    uninvoicedCount: String(row.uninvoicedCount),
    creditLimit: row.creditLimit === "0.00" ? "-" : money(parseFloat(row.creditLimit.replace(/,/g, ""))),
    creditUsageRate: row.creditLimit === "0.00" ? "-" : `${row.creditUsageRate}%`,
    lastReceiptDate: row.lastReceiptDate,
    lastReceiptAmount: row.lastReceiptAmount === "0.00" ? "-" : money(parseFloat(row.lastReceiptAmount.replace(/,/g, ""))),
    action: "登记收款",
    _tone: row.tone,
    _agingTone: row.agingTone,
  })),
};
