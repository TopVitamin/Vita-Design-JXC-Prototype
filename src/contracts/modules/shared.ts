import type { CrudModuleDefinition, CrudRecord, ModuleLineItem, ModuleLog, ModuleRelation, ModuleTimeline } from "../types";

export function money(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function buildLines(prefix: string): ModuleLineItem[] {
  return [
    {
      id: `${prefix}-line-1`,
      code: "SKU-100124",
      name: "便携扫码枪",
      spec: "无线版",
      qty: 12,
      unit: "支",
      price: 299,
      amount: 3588,
      note: "按整箱发货",
    },
    {
      id: `${prefix}-line-2`,
      code: "SKU-100331",
      name: "标签打印纸",
      spec: "100mm*50mm",
      qty: 80,
      unit: "卷",
      price: 18,
      amount: 1440,
      note: "补货常备品",
    },
  ];
}

export function buildTimeline(prefix: string, draftLabel: string, reviewLabel: string): ModuleTimeline[] {
  return [
    { title: "草稿创建", detail: `${draftLabel}已录入基础信息并生成草稿。`, owner: "王晨", time: "2025/04/03 09:20", tone: "blue" },
    { title: "业务确认", detail: "业务口径已确认，等待进入下一节点。", owner: "李菲", time: "2025/04/03 09:40", tone: "green" },
    { title: reviewLabel, detail: `${prefix}当前等待后续协同处理。`, owner: "业务中台", time: "2025/04/03 10:10", tone: "orange" },
  ];
}

export function buildLogs(prefix: string): ModuleLog[] {
  return [
    { time: "2025/04/03 09:20", user: "王晨", action: "创建", detail: `创建${prefix}并录入基础信息。` },
    { time: "2025/04/03 09:42", user: "李菲", action: "修改", detail: "补充联系人和备注。" },
    { time: "2025/04/03 10:10", user: "系统", action: "流转", detail: "推送下一处理节点。" },
  ];
}

export function buildRelations(prefix: string): ModuleRelation[] {
  return [
    { type: "关联单据", no: `${prefix}-GL-001`, status: "已关联" },
    { type: "审批记录", no: `${prefix}-SP-001`, status: "处理中" },
  ];
}

export function buildEntityModule(def: Omit<CrudModuleDefinition, "kind">): CrudModuleDefinition {
  return { kind: "entity", ...def };
}

export function buildDocumentModule(def: Omit<CrudModuleDefinition, "kind">): CrudModuleDefinition {
  return { kind: "document", ...def };
}

export const entityStatusOptions = ["全部状态", "启用", "停用"];
export const commonTags = ["重点维护", "账期客户", "区域重点"];

export function stripEntityRelations<T extends CrudRecord>(records: T[]): T[] {
  return records.map(({ relations, ...rest }) => rest as T);
}
