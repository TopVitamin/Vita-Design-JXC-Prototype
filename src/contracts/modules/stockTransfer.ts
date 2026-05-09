import type { CrudModuleDefinition } from "../types";
import { buildDocumentModule, buildLines, buildLogs, buildRelations, buildTimeline, money } from "./shared";

export const stockTransferModuleDefinition: CrudModuleDefinition = buildDocumentModule({
  view: "stock-transfer",
  title: "调拨管理",
  singular: "调拨单",
  listDescription: "记录仓间调拨和调拨执行状态。",
  statusTabs: ["全部单据", "待出库", "在途", "已完成"],
  filters: [
    { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 调出仓 / 调入仓" },
    { key: "status", label: "调拨状态", type: "select", options: ["全部状态", "待出库", "在途", "已完成"] },
  ],
  columns: [
    { key: "no", label: "调拨单号" },
    { key: "counterparty", label: "调拨方向" },
    { key: "warehouse", label: "调入仓库" },
    { key: "amount", label: "调拨金额", align: "right", kind: "money" },
    { key: "status", label: "调拨状态", kind: "status", toneKey: "statusTone" },
    { key: "handler", label: "经手人" },
    { key: "createdAt", label: "发起时间" },
  ],
  records: [
    {
      id: "db-001",
      no: "DB20250403001",
      counterparty: "华南中心仓 -> 华北总仓",
      warehouse: "华北总仓",
      amount: money(3798),
      status: "在途",
      statusTone: "blue",
      handler: "王晨",
      createdAt: "2025/04/03 12:20",
      businessDate: "2025-04-03",
      deliveryDate: "2025-04-04",
      settlement: "内部调拨",
      paymentMethod: "无需付款",
      remark: "优先补足华北可用库存。",
      internalNote: "蓝牙手持终端跨仓调拨。",
      lines: buildLines("DB"),
      timeline: buildTimeline("调拨管理", "调拨单", "在途运输"),
      logs: buildLogs("调拨单"),
      relations: buildRelations("DB"),
    },
  ],
  formSections: [
    {
      title: "单据信息",
      fields: [
        { key: "no", label: "调拨单号", type: "input", required: true },
        { key: "counterparty", label: "调拨方向", type: "input", required: true },
        { key: "businessDate", label: "调拨日期", type: "date", required: true },
        { key: "deliveryDate", label: "预计到货", type: "date" },
        { key: "warehouse", label: "调入仓库", type: "select", options: ["华北总仓", "杭州分仓", "华南中心仓"] },
        { key: "handler", label: "经手人", type: "input" },
        { key: "settlement", label: "业务类型", type: "select", options: ["内部调拨"] },
        { key: "paymentMethod", label: "付款方式", type: "select", options: ["无需付款"] },
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
    { label: "调拨单号", key: "no" },
    { label: "调拨方向", key: "counterparty" },
    { label: "调入仓库", key: "warehouse" },
    { label: "调拨状态", key: "status", kind: "status", toneKey: "statusTone" },
  ],
  detailSections: [
    {
      title: "单据信息",
      items: [
        { label: "调拨单号", key: "no" },
        { label: "调拨方向", key: "counterparty" },
        { label: "调拨日期", key: "businessDate" },
        { label: "预计到货", key: "deliveryDate" },
        { label: "调入仓库", key: "warehouse" },
        { label: "经手人", key: "handler" },
        { label: "业务类型", key: "settlement" },
        { label: "付款方式", key: "paymentMethod" },
      ],
    },
  ],
  noteKeys: { external: "remark", internal: "internalNote" },
  tags: ["跨仓协同", "在途", "内部调拨"],
});
