import type { CrudModuleDefinition } from "../types";
import { buildDocumentModule, buildLines, buildLogs, buildRelations, buildTimeline, money } from "./shared";

export const stockCountModuleDefinition: CrudModuleDefinition = buildDocumentModule({
  view: "stock-count",
  title: "盘点管理",
  singular: "盘点单",
  listDescription: "查看盘点计划、差异和处理结果。",
  statusTabs: ["全部单据", "待盘点", "待处理", "已完成"],
  filters: [
    { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 仓库 / 负责人" },
    { key: "status", label: "盘点状态", type: "select", options: ["全部状态", "待盘点", "待处理", "已完成"] },
  ],
  columns: [
    { key: "no", label: "盘点单号" },
    { key: "counterparty", label: "盘点仓库" },
    { key: "warehouse", label: "责任区域" },
    { key: "amount", label: "差异金额", align: "right", kind: "money" },
    { key: "status", label: "盘点状态", kind: "status", toneKey: "statusTone" },
    { key: "handler", label: "负责人" },
    { key: "createdAt", label: "发起时间" },
  ],
  records: [
    {
      id: "pd-001",
      no: "PD20250402001",
      counterparty: "华北总仓",
      warehouse: "设备区",
      amount: money(680),
      status: "待处理",
      statusTone: "orange",
      handler: "王晨",
      createdAt: "2025/04/02 17:30",
      businessDate: "2025-04-02",
      deliveryDate: "2025-04-03",
      settlement: "月度盘点",
      paymentMethod: "无需付款",
      remark: "扫码枪盘亏2支。",
      internalNote: "等待差异确认。",
      lines: buildLines("PD"),
      timeline: buildTimeline("盘点管理", "盘点单", "待差异处理"),
      logs: buildLogs("盘点单"),
      relations: buildRelations("PD"),
    },
  ],
  formSections: [
    {
      title: "单据信息",
      fields: [
        { key: "no", label: "盘点单号", type: "input", required: true },
        { key: "counterparty", label: "盘点仓库", type: "select", required: true, options: ["华北总仓", "杭州分仓", "华南中心仓"] },
        { key: "businessDate", label: "盘点日期", type: "date", required: true },
        { key: "deliveryDate", label: "处理截止", type: "date" },
        { key: "warehouse", label: "责任区域", type: "input" },
        { key: "handler", label: "负责人", type: "input" },
        { key: "settlement", label: "盘点类型", type: "select", options: ["月度盘点", "临时盘点"] },
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
    { label: "盘点单号", key: "no" },
    { label: "盘点仓库", key: "counterparty" },
    { label: "责任区域", key: "warehouse" },
    { label: "盘点状态", key: "status", kind: "status", toneKey: "statusTone" },
  ],
  detailSections: [
    {
      title: "单据信息",
      items: [
        { label: "盘点单号", key: "no" },
        { label: "盘点仓库", key: "counterparty" },
        { label: "盘点日期", key: "businessDate" },
        { label: "处理截止", key: "deliveryDate" },
        { label: "责任区域", key: "warehouse" },
        { label: "负责人", key: "handler" },
        { label: "盘点类型", key: "settlement" },
        { label: "处理方式", key: "paymentMethod" },
      ],
    },
  ],
  noteKeys: { external: "remark", internal: "internalNote" },
  tags: ["月度盘点", "差异处理", "仓库责任"],
});
