import type { ConfigModuleDefinition } from "../types";
import { buildLogs } from "./shared";

export const printTemplateModuleDefinition: ConfigModuleDefinition = {
  kind: "config",
  view: "print-template",
  title: "打印模板",
  description: "维护销售、采购、库存单据打印模板。",
  templateColumns: [
    { key: "docType", label: "单据类型" },
    { key: "templateName", label: "模板名称" },
    { key: "paperSize", label: "纸张尺寸" },
    { key: "isDefault", label: "默认模板", kind: "status", toneKey: "isDefaultTone" },
    { key: "updatedAt", label: "更新时间" },
  ],
  templates: [
    { id: "tpl001", docType: "销售订单", templateName: "标准版A4", paperSize: "A4", isDefault: "是", isDefaultTone: "green", updatedAt: "2025/03/15" },
    { id: "tpl002", docType: "销售订单", templateName: "简洁版A5", paperSize: "A5", isDefault: "否", isDefaultTone: "gray", updatedAt: "2025/03/15" },
    { id: "tpl003", docType: "采购订单", templateName: "供应商版A4", paperSize: "A4", isDefault: "是", isDefaultTone: "green", updatedAt: "2025/03/15" },
    { id: "tpl004", docType: "出库单", templateName: "仓库版热敏", paperSize: "80mm", isDefault: "是", isDefaultTone: "green", updatedAt: "2025/03/20" },
    { id: "tpl005", docType: "入库单", templateName: "标准版A4", paperSize: "A4", isDefault: "是", isDefaultTone: "green", updatedAt: "2025/03/15" },
  ],
  logs: buildLogs("打印模板"),
};
