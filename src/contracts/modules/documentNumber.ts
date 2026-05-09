import type { ConfigModuleDefinition } from "../types";
import { buildLogs } from "./shared";

export const documentNumberModuleDefinition: ConfigModuleDefinition = {
  kind: "config",
  view: "document-number",
  title: "单据编号",
  description: "配置销售、采购、库存单据的编号规则。",
  ruleColumns: [
    { key: "docType", label: "单据类型" },
    { key: "prefix", label: "前缀" },
    { key: "dateFormat", label: "日期格式" },
    { key: "sequence", label: "序号位数" },
    { key: "resetType", label: "重置方式" },
    { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
  ],
  rules: [
    { id: "rule001", docType: "销售订单", prefix: "XS", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "日归零", status: "启用", statusTone: "green" },
    { id: "rule002", docType: "采购订单", prefix: "CG", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "月归零", status: "启用", statusTone: "green" },
    { id: "rule003", docType: "零售单", prefix: "LS", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "日归零", status: "启用", statusTone: "green" },
    { id: "rule004", docType: "出库单", prefix: "CK", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "日归零", status: "启用", statusTone: "green" },
    { id: "rule005", docType: "入库单", prefix: "RK", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "月归零", status: "启用", statusTone: "green" },
    { id: "rule006", docType: "调拨单", prefix: "DB", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "月归零", status: "停用", statusTone: "gray" },
  ],
  logs: buildLogs("编号规则"),
};
