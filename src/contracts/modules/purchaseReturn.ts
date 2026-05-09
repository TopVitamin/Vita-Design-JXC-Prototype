import type { CrudModuleDefinition } from "../types";
import { buildDocumentModule, buildLines, buildLogs, buildRelations, buildTimeline, money } from "./shared";

export const purchaseReturnModuleDefinition: CrudModuleDefinition = buildDocumentModule({
  view: "purchase-return",
  title: "采购退货",
  singular: "采购退货单",
  listDescription: "查看采购退货记录与供应商协同状态。",
  statusTabs: ["全部单据", "待确认", "待退货", "已完成"],
  filters: [
    { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 供应商 / 仓库" },
    { key: "warehouse", label: "退货仓库", type: "select", options: ["全部仓库", "华北总仓", "杭州分仓"] },
    { key: "status", label: "退货状态", type: "select", options: ["全部状态", "待确认", "待退货", "已完成"] },
  ],
  columns: [
    { key: "no", label: "退货单号" },
    { key: "counterparty", label: "供应商名称" },
    { key: "warehouse", label: "退货仓库" },
    { key: "amount", label: "退货金额", align: "right", kind: "money" },
    { key: "status", label: "退货状态", kind: "status", toneKey: "statusTone" },
    { key: "handler", label: "经手人" },
    { key: "createdAt", label: "发起时间" },
  ],
  records: [
    {
      id: "rt-001",
      no: "TH20250403002",
      counterparty: "宁波智链实业有限公司",
      warehouse: "杭州分仓",
      amount: money(2160),
      status: "待退货",
      statusTone: "orange",
      handler: "周曼",
      createdAt: "2025/04/03 14:02",
      businessDate: "2025-04-03",
      deliveryDate: "2025-04-05",
      settlement: "现结",
      paymentMethod: "银行转账",
      remark: "标签纸批次异常，需退回。",
      internalNote: "已和供应商确认退货窗口。",
      lines: buildLines("TH"),
      timeline: buildTimeline("采购退货", "退货单", "待供应商确认"),
      logs: buildLogs("采购退货"),
      relations: buildRelations("TH"),
    },
  ],
  formSections: [
    {
      title: "单据信息",
      fields: [
        { key: "no", label: "退货单号", type: "input", required: true },
        { key: "counterparty", label: "供应商名称", type: "select", required: true, options: ["宁波智链实业有限公司", "苏州元禾供应链有限公司"] },
        { key: "businessDate", label: "退货日期", type: "date", required: true },
        { key: "deliveryDate", label: "预计退回", type: "date" },
        { key: "warehouse", label: "退货仓库", type: "select", options: ["华北总仓", "杭州分仓"] },
        { key: "handler", label: "经手人", type: "input" },
        { key: "settlement", label: "结算方式", type: "select", options: ["现结", "15天账期", "30天账期"] },
        { key: "paymentMethod", label: "付款方式", type: "select", options: ["银行转账", "支付宝", "微信支付"] },
      ],
    },
    {
      title: "备注说明",
      fields: [
        { key: "remark", label: "对外备注", type: "textarea", span: 2 },
        { key: "internalNote", label: "内部说明", type: "textarea", span: 2 },
      ],
    },
  ],
  headerFields: [
    { label: "退货单号", key: "no" },
    { label: "供应商名称", key: "counterparty" },
    { label: "退货仓库", key: "warehouse" },
    { label: "退货状态", key: "status", kind: "status", toneKey: "statusTone" },
  ],
  detailSections: [
    {
      title: "单据信息",
      items: [
        { label: "退货单号", key: "no" },
        { label: "供应商名称", key: "counterparty" },
        { label: "退货日期", key: "businessDate" },
        { label: "预计退回", key: "deliveryDate" },
        { label: "退货仓库", key: "warehouse" },
        { label: "经手人", key: "handler" },
        { label: "结算方式", key: "settlement" },
        { label: "付款方式", key: "paymentMethod" },
      ],
    },
  ],
  noteKeys: { external: "remark", internal: "internalNote" },
  tags: ["异常退货", "供应商协同", "待确认"],
  counterpartyLabel: "供应商名称",
});
