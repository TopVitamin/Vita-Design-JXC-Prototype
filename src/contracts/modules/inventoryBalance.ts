import type { QueryModuleDefinition } from "../types";

export const inventoryBalanceModuleDefinition: QueryModuleDefinition = {
  kind: "query",
  view: "inventory-balance",
  title: "库存余额",
  listDescription: "提供库存余额和仓库口径视图。",
  filters: [
    { key: "keyword", label: "综合搜索", type: "search", placeholder: "商品 / SKU / 仓库" },
    { key: "warehouse", label: "仓库", type: "select", options: ["全部仓库", "华北总仓", "杭州分仓", "华南中心仓"] },
    { key: "date", label: "统计日期", type: "dateRange" },
  ],
  metrics: [
    { label: "现存总量", value: "4,862件", tone: "blue" },
    { label: "可用库存", value: "4,125件", tone: "green" },
    { label: "低库存商品", value: "12个", tone: "orange" },
  ],
  columns: [
    { key: "sku", label: "SKU" },
    { key: "product", label: "商品名称" },
    { key: "warehouse", label: "仓库" },
    { key: "current", label: "现存", align: "right" },
    { key: "reserved", label: "占用", align: "right" },
    { key: "available", label: "可用", align: "right" },
  ],
  rows: [
    { sku: "SKU-100124", product: "便携扫码枪", warehouse: "华北总仓", current: "24", reserved: "8", available: "16" },
    { sku: "SKU-100331", product: "标签打印纸", warehouse: "杭州分仓", current: "12", reserved: "6", available: "6" },
  ],
};
