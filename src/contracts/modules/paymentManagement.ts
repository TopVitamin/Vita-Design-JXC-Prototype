import type { CrudModuleDefinition } from "../types";
import { buildDocumentModule, money } from "./shared";
import { paymentRecords } from "../../mocks/payments";

export const paymentManagementModuleDefinition: CrudModuleDefinition = buildDocumentModule({
  view: "payment-management",
  title: "付款单",
  singular: "付款单",
  listDescription: "管理供应商付款记录，支持登记、确认和核销。",
  statusTabs: ["全部单据", "草稿", "已确认", "已作废"],
  filters: [
    { key: "keyword", label: "付款单号", type: "search", placeholder: "输入单号搜索" },
    { key: "supplier", label: "供应商", type: "select", options: ["全部供应商"] },
    { key: "paymentMethod", label: "付款方式", type: "select", options: ["全部", "银行转账", "支付宝", "微信支付", "现金"] },
    { key: "status", label: "单据状态", type: "select", options: ["全部状态", "草稿", "已确认", "已作废"] },
    { key: "paymentDate", label: "付款日期", type: "dateRange" },
    { key: "updatedAt", label: "最后修改时间", type: "dateRange" },
  ],
  columns: [
    { key: "paymentNo", label: "付款单号", width: 210 },
    { key: "status", label: "单据状态", kind: "status", toneKey: "statusTone", width: 90 },
    { key: "periodStatus", label: "账期状态", width: 100 },
    { key: "supplier", label: "供应商", width: 180 },
    { key: "paymentDate", label: "付款日期", width: 110 },
    { key: "paymentMethod", label: "付款方式", width: 100 },
    { key: "paymentAmount", label: "付款金额", align: "right", kind: "money", width: 130 },
    { key: "updatedAt", label: "最后修改时间", width: 170 },
  ],
  records: paymentRecords.map((r) => {
    const periodStatusMap: Record<string, string> = {
      within: "账期内",
      approaching: "临近到期",
      overdue: "已逾期",
      settled: "已结清",
    };
    const periodToneMap: Record<string, string> = {
      within: "green",
      approaching: "orange",
      overdue: "red",
      settled: "gray",
    };
    return {
      id: r.id,
      paymentNo: r.paymentNo,
      status: r.status,
      statusTone: r.statusTone,
      periodStatus: periodStatusMap[r.periodStatus],
      periodStatusTone: periodToneMap[r.periodStatus],
      supplier: `${r.supplierCode} ${r.supplierName}`,
      paymentDate: r.paymentDate,
      paymentMethod: r.paymentMethod,
      paymentAmount: money(parseFloat(r.paymentAmount.replace(/,/g, ""))),
      updatedAt: r.updatedAt,
    };
  }),
  formSections: [
    {
      title: "基本信息",
      fields: [
        { key: "paymentNo", label: "付款单号", type: "input", readOnly: true, placeholder: "保存后自动生成" },
        { key: "supplier", label: "供应商", type: "select", required: true, options: ["S001 苏州元禾供应链有限公司", "S002 宁波智链实业有限公司", "S003 深圳华强供应链管理有限公司", "S004 杭州鼎盛办公用品有限公司"] },
        { key: "paymentDate", label: "付款日期", type: "date", required: true },
        { key: "paymentMethod", label: "付款方式", type: "select", required: true, options: ["银行转账", "支付宝", "微信支付", "现金"] },
        { key: "paymentAmount", label: "付款金额", type: "input", required: true, placeholder: "0.00" },
        { key: "paymentAccount", label: "付款账户", type: "input", placeholder: "如：工商银行 6222xxxx·深圳分行（选填）" },
        { key: "supplierReceiveAccount", label: "供应商收款账户", type: "input", placeholder: "如：建设银行 6217xxxx（选填）" },
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
    { label: "付款单号", key: "paymentNo" },
    { label: "单据状态", key: "status", kind: "status", toneKey: "statusTone" },
    { label: "供应商", key: "supplier" },
  ],
  detailSections: [
    {
      title: "基本信息",
      items: [
        { label: "付款单号", key: "paymentNo" },
        { label: "单据状态", key: "status", kind: "status", toneKey: "statusTone" },
        { label: "账期状态", key: "periodStatus", kind: "status" },
        { label: "核销状态", key: "verificationStatus", kind: "status" },
        { label: "供应商", key: "supplier" },
        { label: "付款日期", key: "paymentDate" },
        { label: "付款方式", key: "paymentMethod" },
        { label: "付款金额", key: "paymentAmount", kind: "money" },
        { label: "付款账户", key: "paymentAccount" },
        { label: "供应商收款账户", key: "supplierReceiveAccount" },
        { label: "摘要/备注", key: "note" },
        { label: "确认人", key: "confirmedBy" },
        { label: "确认时间", key: "confirmedAt" },
      ],
    },
    {
      title: "关联入库单",
      items: [
        { label: "入库单号", key: "linkedInboundNo" },
        { label: "入库日期", key: "linkedInboundDate" },
        { label: "入库单应付金额", key: "linkedInboundAmount", kind: "money" },
      ],
    },
    {
      title: "统计信息",
      items: [
        { label: "关联入库单数量", key: "linkedCount" },
        { label: "关联入库单金额合计", key: "linkedAmount", kind: "money" },
        { label: "本次付款金额", key: "paymentAmountStat", kind: "money" },
        { label: "付款差额", key: "difference", kind: "status" },
      ],
    },
  ],
  noteKeys: { external: "note", internal: "" },
  tags: ["付款", "供应商", "应付账款"],
  counterpartyLabel: "供应商",
});
