import type { CrudModuleDefinition } from "../types";
import { buildDocumentModule, buildLines, buildLogs, buildRelations, buildTimeline, money } from "./shared";

export const stockLossModuleDefinition: CrudModuleDefinition = buildDocumentModule({
  view: "stock-loss",
  title: "报损管理",
  singular: "报损单",
  listDescription: "记录报损申请和库存调整结果。",
  statusTabs: ["全部单据", "待审核", "待处理", "已完成"],
  filters: [
    { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 仓库 / 负责人" },
    { key: "status", label: "报损状态", type: "select", options: ["全部状态", "待审核", "待处理", "已完成"] },
  ],
  columns: [
    { key: "no", label: "报损单号" },
    { key: "counterparty", label: "报损仓库" },
    { key: "warehouse", label: "责任区域" },
    { key: "amount", label: "报损金额", align: "right", kind: "money" },
    { key: "status", label: "报损状态", kind: "status", toneKey: "statusTone" },
    { key: "handler", label: "负责人" },
    { key: "createdAt", label: "申请时间" },
  ],
  records: [
    {
      id: "bs-001",
      no: "BS20250403001",
      counterparty: "华北总仓",
      warehouse: "设备区",
      amount: money(598),
      status: "待审核",
      statusTone: "orange",
      handler: "李菲",
      createdAt: "2025/04/03 11:20",
      businessDate: "2025-04-03",
      deliveryDate: "2025-04-04",
      settlement: "异常报损",
      paymentMethod: "无需付款",
      remark: "设备包装破损，申请报损。",
      internalNote: "等待主管审核。",
      lines: buildLines("BS"),
      timeline: buildTimeline("报损管理", "报损单", "待主管审核"),
      logs: buildLogs("报损单"),
      relations: buildRelations("BS"),
    },
  ],
  formSections: [
    {
      title: "单据信息",
      fields: [
        { key: "no", label: "报损单号", type: "input", required: true },
        { key: "counterparty", label: "报损仓库", type: "select", required: true, options: ["华北总仓", "杭州分仓", "华南中心仓"] },
        { key: "businessDate", label: "申请日期", type: "date", required: true },
        { key: "deliveryDate", label: "处理截止", type: "date" },
        { key: "warehouse", label: "责任区域", type: "input" },
        { key: "handler", label: "负责人", type: "input" },
        { key: "settlement", label: "报损类型", type: "select", options: ["异常报损", "自然损耗"] },
        { key: "paymentMethod", label: "处理方式", type: "select", options: ["无需付款"] },
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
    { label: "报损单号", key: "no" },
    { label: "报损仓库", key: "counterparty" },
    { label: "责任区域", key: "warehouse" },
    { label: "报损状态", key: "status", kind: "status", toneKey: "statusTone" },
  ],
  detailSections: [
    {
      title: "单据信息",
      items: [
        { label: "报损单号", key: "no" },
        { label: "报损仓库", key: "counterparty" },
        { label: "申请日期", key: "businessDate" },
        { label: "处理截止", key: "deliveryDate" },
        { label: "责任区域", key: "warehouse" },
        { label: "负责人", key: "handler" },
        { label: "报损类型", key: "settlement" },
        { label: "处理方式", key: "paymentMethod" },
      ],
    },
  ],
  noteKeys: { external: "remark", internal: "internalNote" },
  tags: ["待审核", "库存调整", "异常处理"],
});
