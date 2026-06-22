import type { CrudModuleDefinition } from "../types";
import { buildDocumentModule, money } from "./shared";
import { receiptRecords } from "../../mocks/receipts";

/**
 * 注意：此 CrudModuleDefinition 当前未被路由消费（收款登记的实际页面是
 * src/pages/ReceiptManagementPage.tsx，独立实现）。本文件作为字段设计预留
 * 定义保留，便于将来把收款登记收敛进 GenericCrud 体系时复用。
 */
export const receiptManagementModuleDefinition: CrudModuleDefinition = buildDocumentModule({
  view: "receipt-management",
  title: "收款单",
  singular: "收款单",
  listDescription: "管理客户收款记录，支持登记、确认和核销。",
  statusTabs: ["全部单据", "草稿", "已确认", "已作废"],
  filters: [
    { key: "keyword", label: "收款单号", type: "search", placeholder: "输入单号搜索" },
    { key: "customer", label: "客户", type: "select", options: ["全部客户"] },
    { key: "receiptMethod", label: "收款方式", type: "select", options: ["全部", "银行转账", "支付宝", "微信支付", "现金"] },
    { key: "status", label: "单据状态", type: "select", options: ["全部状态", "草稿", "已确认", "已作废"] },
    { key: "receiptDate", label: "收款日期", type: "dateRange" },
    { key: "isHeld", label: "是否暂挂", type: "select", options: ["全部", "暂挂款", "已认款"] },
    { key: "updatedAt", label: "最后修改时间", type: "dateRange" },
  ],
  columns: [
    { key: "receiptNo", label: "收款单号", width: 210 },
    { key: "status", label: "单据状态", kind: "status", toneKey: "statusTone", width: 90 },
    { key: "isHeld", label: "是否暂挂", width: 90 },
    { key: "customer", label: "客户", width: 180 },
    { key: "receiptDate", label: "收款日期", width: 110 },
    { key: "receiptMethod", label: "收款方式", width: 100 },
    { key: "receiptAmount", label: "收款金额", align: "right", kind: "money", width: 130 },
    { key: "updatedAt", label: "最后修改时间", width: 170 },
  ],
  records: receiptRecords.map((r) => ({
    id: r.id,
    receiptNo: r.receiptNo,
    status: r.status,
    statusTone: r.statusTone,
    isHeld: r.isHeld ? (r.heldTone === "orange" ? "暂挂款" : "已认款") : "",
    isHeldTone: r.heldTone,
    customer: `${r.customerCode} ${r.customerName}`,
    receiptDate: r.receiptDate,
    receiptMethod: r.receiptMethod,
    receiptAmount: money(parseFloat(r.receiptAmount.replace(/,/g, ""))),
    updatedAt: r.updatedAt,
  })),
  formSections: [
    {
      title: "基本信息",
      fields: [
        { key: "receiptNo", label: "收款单号", type: "input", readOnly: true, placeholder: "保存后自动生成" },
        { key: "customer", label: "客户", type: "select", required: true, options: ["C001 北京吉浓文化传媒有限公司", "C002 杭州智帆商贸有限公司", "C003 苏州元禾供应链有限公司", "C004 深圳腾岳科技有限公司"] },
        { key: "receiptDate", label: "收款日期", type: "date", required: true },
        { key: "receiptMethod", label: "收款方式", type: "select", required: true, options: ["银行转账", "支付宝", "微信支付", "现金"] },
        { key: "receiptAmount", label: "收款金额", type: "input", required: true, placeholder: "0.00" },
        { key: "accountInfo", label: "到账账户", type: "input", placeholder: "如：工商银行 6222xxxx·深圳分行（选填）" },
        { key: "customerPaymentAccount", label: "客户方付款账户", type: "input", placeholder: "如：招商银行 6225xxxx（选填）" },
      ],
    },
    {
      title: "备注",
      fields: [
        { key: "note", label: "摘要/备注", type: "textarea", span: 2, placeholder: "如：11月货款、预付定金（选填）" },
      ],
    },
  ],
  headerFields: [
    { label: "收款单号", key: "receiptNo" },
    { label: "单据状态", key: "status", kind: "status", toneKey: "statusTone" },
    { label: "客户", key: "customer" },
  ],
  detailSections: [
    {
      title: "基本信息",
      items: [
        { label: "收款单号", key: "receiptNo" },
        { label: "单据状态", key: "status", kind: "status", toneKey: "statusTone" },
        { label: "是否暂挂", key: "isHeld", kind: "status" },
        { label: "核销状态", key: "verificationStatus", kind: "status" },
        { label: "客户", key: "customer" },
        { label: "收款日期", key: "receiptDate" },
        { label: "收款方式", key: "receiptMethod" },
        { label: "收款金额", key: "receiptAmount", kind: "money" },
        { label: "到账账户", key: "accountInfo" },
        { label: "客户方付款账户", key: "customerPaymentAccount" },
        { label: "摘要/备注", key: "note" },
        { label: "确认人", key: "confirmedBy" },
        { label: "确认时间", key: "confirmedAt" },
      ],
    },
    {
      title: "关联出库单",
      items: [
        { label: "出库单号", key: "linkedDeliveryNo" },
        { label: "出库日期", key: "linkedDeliveryDate" },
        { label: "出库单应收金额", key: "linkedDeliveryAmount", kind: "money" },
      ],
    },
    {
      title: "统计信息",
      items: [
        { label: "关联出库单数量", key: "linkedCount" },
        { label: "关联出库单金额合计", key: "linkedAmount", kind: "money" },
        { label: "本次收款金额", key: "receiptAmountStat", kind: "money" },
        { label: "收款差额", key: "difference", kind: "status" },
      ],
    },
  ],
  noteKeys: { external: "note", internal: "" },
  tags: ["收款", "客户", "应收账款"],
  counterpartyLabel: "客户",
});
