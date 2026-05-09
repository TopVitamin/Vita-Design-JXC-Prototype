import type { ConfigModuleDefinition } from "../types";
import { buildLogs } from "./shared";

export const openingInitModuleDefinition: ConfigModuleDefinition = {
  kind: "config",
  view: "opening-init",
  title: "期初初始化",
  description: "查看商品、客户、供应商和库存期初导入状态。",
  panels: [
    {
      title: "初始化进度",
      desc: "按主数据和库存维度查看期初装载状态。",
      items: [
        { label: "商品期初", value: "已完成", tone: "green" },
        { label: "客户期初", value: "已完成", tone: "green" },
        { label: "供应商期初", value: "已完成", tone: "green" },
        { label: "库存期初", value: "待复核", tone: "orange" },
      ],
    },
    {
      title: "导入要求",
      desc: "确保期初数据口径与库存底账一致。",
      items: [
        { label: "模板版本", value: "V2.1" },
        { label: "校验规则", value: "编码唯一/数量非负" },
        { label: "责任人", value: "实施顾问" },
      ],
    },
  ],
  logs: buildLogs("期初初始化"),
};
