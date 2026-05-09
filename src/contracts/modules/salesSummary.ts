import type { QueryModuleDefinition } from "../types";
import { money } from "./shared";

export const salesSummaryModuleDefinition: QueryModuleDefinition = {
  kind: "query",
  view: "sales-summary",
  title: "销售汇总",
  listDescription: "提供基础销售汇总指标和趋势。",
  filters: [
    { key: "keyword", label: "综合搜索", type: "search", placeholder: "客户 / 商品 / 区域" },
    { key: "region", label: "区域", type: "select", options: ["全部区域", "华北", "华东", "华南"] },
    { key: "date", label: "统计日期", type: "dateRange" },
  ],
  metrics: [
    { label: "销售额", value: money(362580), tone: "blue" },
    { label: "毛利额", value: money(128340), tone: "green" },
    { label: "订单数", value: "182单", tone: "orange" },
  ],
  columns: [
    { key: "dimension", label: "维度" },
    { key: "sales", label: "销售额", align: "right", kind: "money" },
    { key: "gross", label: "毛利额", align: "right", kind: "money" },
    { key: "orders", label: "订单数", align: "right" },
    { key: "trend", label: "趋势" },
  ],
  rows: [
    { dimension: "华北区域", sales: money(162580), gross: money(58340), orders: "72", trend: "环比+8.2%" },
    { dimension: "华东区域", sales: money(124800), gross: money(43820), orders: "61", trend: "环比+4.1%" },
    { dimension: "华南区域", sales: money(75200), gross: money(26180), orders: "49", trend: "环比-2.3%" },
  ],
};
