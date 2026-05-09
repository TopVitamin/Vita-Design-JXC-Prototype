import type { QueryModuleDefinition } from "../types";
import { money } from "./shared";

export const salesQueryModuleDefinition: QueryModuleDefinition = {
  kind: "query",
  view: "sales-query",
  title: "销售查询",
  listDescription: "查询订单、客户、商品维度的销售记录。",
  filters: [
    { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 客户 / 商品" },
    { key: "status", label: "订单状态", type: "select", options: ["全部状态", "待审核", "待出库", "已完成"] },
    { key: "date", label: "业务日期", type: "dateRange" },
  ],
  metrics: [
    { label: "本月销售额", value: money(362580), tone: "blue" },
    { label: "订单数", value: "182单", tone: "green" },
    { label: "客单价", value: money(1992), tone: "orange" },
  ],
  columns: [
    { key: "no", label: "订单编号" },
    { key: "customer", label: "客户名称" },
    { key: "product", label: "商品名称" },
    { key: "qty", label: "数量", align: "right" },
    { key: "amount", label: "销售金额", align: "right", kind: "money" },
    { key: "status", label: "状态", kind: "status", toneKey: "tone" },
  ],
  rows: [
    { no: "XS20250403001", customer: "北京吉浓文化传媒有限公司", product: "便携扫码枪", qty: "12", amount: money(5028), status: "待审核", tone: "orange" },
    { no: "XS20250403002", customer: "杭州智帆商贸有限公司", product: "热敏打印机", qty: "8", amount: money(7740), status: "待出库", tone: "blue" },
    { no: "XS20250402017", customer: "宁波智链实业有限公司", product: "标签打印纸", qty: "120", amount: money(2160), status: "已完成", tone: "green" },
  ],
};
