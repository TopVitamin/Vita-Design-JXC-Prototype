export type PageDepth = "core" | "secondary" | "placeholder";

export type ViewKey =
  | "dashboard"
  | "sales-orders"
  | "sales-return"
  | "sales-return-inbound"
    | "inventory-query"
    | "customer-ledger"
  | "product-management"
  | "customer-management"
  | "supplier-management"
  | "warehouse-management"
  | "sales-delivery"
  | "sales-query"
  | "purchase-orders"
  | "purchase-receipt"
  | "purchase-return"
  | "purchase-return-stockout"
  | "stock-transfer"
  | "stock-count"
  | "stock-loss"
  | "receivable-query"
  | "payable-query"
  | "receipt-management"
  | "payment-management"
    | "sales-summary"
  | "inventory-balance"
  | "user-permission"
  | "document-number"
  | "opening-init"
  | "print-template"
  | "operation-log";

export type NavChild = {
  key: ViewKey;
  label: string;
  pageType: "dashboard" | "list" | "detail" | "form" | "query" | "cashier" | "placeholder" | "config";
  depth: PageDepth;
  description: string;
  isIncomplete?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  children: NavChild[];
};

export type PageMeta = {
  sectionId: string;
  sectionLabel: string;
  pageLabel: string;
  pageType: NavChild["pageType"];
  pageDepth: PageDepth;
  description: string;
};

export const inventoryNavGroups: NavGroup[] = [
  {
    id: "dashboard",
    label: "首页",
    children: [
      {
        key: "dashboard",
        label: "工作台",
        pageType: "dashboard",
        depth: "core",
        description: "展示核心入口、待办和主链路概览。",
      },
    ],
  },
  {
    id: "master-data",
    label: "基础资料",
    children: [
      {
        key: "product-management",
        label: "商品管理",
        pageType: "list",
        depth: "secondary",
        description: "维护商品档案、分类、规格和价格策略。",
      },
      {
        key: "customer-management",
        label: "客户管理",
        pageType: "list",
        depth: "secondary",
        description: "维护客户等级、账期和往来策略。",
      },
      {
        key: "supplier-management",
        label: "供应商管理",
        pageType: "list",
        depth: "secondary",
        description: "维护供应商主体、合作属性和结算规则。",
      },
      {
        key: "warehouse-management",
        label: "仓库管理",
        pageType: "list",
        depth: "secondary",
        description: "维护仓库档案、用途和库存归属。",
      },
    ],
  },
  {
    id: "purchase",
    label: "采购管理",
    children: [
      {
        key: "purchase-orders",
        label: "采购订单",
        pageType: "list",
        depth: "secondary",
        description: "查看采购下单记录，承接供货需求。",
      },
      {
        key: "purchase-receipt",
        label: "采购入库",
        pageType: "list",
        depth: "secondary",
        description: "查看采购入库和到货状态。",
      },
      {
        key: "purchase-return",
        label: "采购退货",
        pageType: "list",
        depth: "secondary",
        description: "查看采购退货记录与供应商协同状态。",
      },
      {
        key: "purchase-return-stockout",
        label: "采购退货出库",
        pageType: "list",
        depth: "secondary",
        description: "查看采购退货出库执行记录与库存扣减状态。",
      },
    ],
  },
  {
    id: "sales",
    label: "销售管理",
    children: [
      {
        key: "sales-orders",
        label: "销售订单",
        pageType: "list",
        depth: "core",
        description: "承接批发开单主链路，处理订单查询、新增、状态跟踪。",
      },
      {
        key: "sales-delivery",
        label: "销售出库",
        pageType: "detail",
        depth: "secondary",
        description: "查看和执行销售出库，跟踪发货状态。",
      },
      {
        key: "sales-return",
        label: "销售退货",
        pageType: "list",
        depth: "secondary",
        description: "查看销售退货记录与客户逆向处理状态。",
      },
      {
        key: "sales-return-inbound",
        label: "销售退货入库",
        pageType: "list",
        depth: "secondary",
        description: "查看销售退货入库执行记录与库存回加状态。",
      },
      {
        key: "sales-query",
        label: "销售查询",
        pageType: "query",
        depth: "secondary",
        description: "查询订单、客户、商品维度的销售记录。",
      },
    ],
  },
  {
    id: "stock",
    label: "库存管理",
    children: [
      {
        key: "inventory-query",
        label: "库存查询",
        pageType: "query",
        depth: "core",
        description: "展示现存、占用、可用库存，承接共享底账查询。",
      },
      {
        key: "stock-transfer",
        label: "调拨管理",
        pageType: "list",
        depth: "secondary",
        description: "记录仓间调拨和调拨执行状态。",
      },
      {
        key: "stock-count",
        label: "盘点管理",
        pageType: "list",
        depth: "secondary",
        description: "查看盘点计划、差异和处理结果。",
      },
      {
        key: "stock-loss",
        label: "报损管理",
        pageType: "list",
        depth: "secondary",
        description: "记录报损申请和库存调整结果。",
      },
    ],
  },
  {
    id: "finance",
    label: "往来管理",
    children: [
      {
        key: "receivable-query",
        label: "应收查询",
        pageType: "query",
        depth: "secondary",
        description: "查看客户应收余额与账龄。",
      },
      {
        key: "receipt-management",
        label: "收款登记",
        pageType: "list",
        depth: "secondary",
        description: "管理客户收款记录，支持登记、确认和核销。",
      },
      {
        key: "payable-query",
        label: "应付查询",
        pageType: "query",
        depth: "secondary",
        description: "查看供应商应付余额与账期。",
      },
      {
        key: "payment-management",
        label: "付款登记",
        pageType: "list",
        depth: "secondary",
        description: "管理供应商付款记录，支持登记、确认和核销。",
      },
      ],
  },
  {
    id: "stats",
    label: "查询统计",
    children: [
      {
        key: "sales-summary",
        label: "销售汇总",
        pageType: "query",
        depth: "secondary",
        description: "提供基础销售汇总指标和趋势。",
      },
      {
        key: "inventory-balance",
        label: "库存余额",
        pageType: "query",
        depth: "secondary",
        description: "提供库存余额和仓库口径视图。",
      },
      {
        key: "customer-ledger",
        label: "客户往来查询",
        pageType: "query",
        depth: "core",
        description: "查看客户应收、回款记录和往来余额。",
      },
    ],
  },
  {
    id: "settings",
    label: "系统设置",
    children: [
      {
        key: "user-permission",
        label: "用户与权限",
        pageType: "config",
        depth: "secondary",
        description: "维护用户账号、角色与数据权限。",
      },
      {
        key: "document-number",
        label: "单据编号",
        pageType: "config",
        depth: "secondary",
        description: "配置销售、采购、库存单据的编号规则。",
      },
      {
        key: "opening-init",
        label: "期初初始化",
        pageType: "config",
        depth: "secondary",
        description: "查看商品、客户、供应商和库存期初导入状态。",
      },
      {
        key: "print-template",
        label: "打印模板",
        pageType: "config",
        depth: "secondary",
        description: "维护销售、采购、库存单据打印模板。",
      },
      {
        key: "operation-log",
        label: "操作日志",
        pageType: "config",
        depth: "secondary",
        description: "查看关键业务操作、审批动作和配置变更。",
      },
    ],
  },
];

export const allViews = new Set<ViewKey>(inventoryNavGroups.flatMap((group) => group.children.map((item) => item.key)));

export function getPageMeta(view: ViewKey): PageMeta {
  for (const group of inventoryNavGroups) {
    const page = group.children.find((item) => item.key === view);
    if (page) {
      return {
        sectionId: group.id,
        sectionLabel: group.label,
        pageLabel: page.label,
        pageType: page.pageType,
        pageDepth: page.depth,
        description: page.description,
      };
    }
  }

  return {
    sectionId: "dashboard",
    sectionLabel: "首页",
    pageLabel: "工作台",
    pageType: "dashboard",
    pageDepth: "core",
    description: "展示核心入口、待办和主链路概览。",
  };
}
