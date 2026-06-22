import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  DollarSign,
  LayoutGrid,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { recentVisits } from "../data/mock";
import { salesOrders } from "../data/mock";
import { cn } from "../utils/cn";

// ── Mock KPI data ────────────────────────────────────────────────────────────
const kpiCards = [
  {
    label: "今日订单",
    value: "24",
    unit: "笔",
    trend: "+3",
    trendUp: true,
    gradient: "from-sky-50 via-blue-50 to-white",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    trendColor: "text-blue-600",
    icon: ShoppingCart,
    sub: "较昨日",
  },
  {
    label: "待出库订单",
    value: "8",
    unit: "笔",
    trend: "2笔逾期",
    trendUp: false,
    gradient: "from-orange-50 via-amber-50 to-white",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    trendColor: "text-orange-600",
    icon: Package,
    sub: "需处理",
  },
  {
    label: "今日销售额",
    value: "¥3.2",
    unit: "万",
    trend: "+12%",
    trendUp: true,
    gradient: "from-emerald-50 via-teal-50 to-white",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    trendColor: "text-emerald-600",
    icon: DollarSign,
    sub: "较上周同期",
  },
  {
    label: "库存预警",
    value: "5",
    unit: "个",
    trend: "需补货",
    trendUp: false,
    gradient: "from-red-50 via-rose-50 to-white",
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    trendColor: "text-red-500",
    icon: Activity,
    sub: "SKU告警",
  },
];

// ── Quick actions ─────────────────────────────────────────────────────────────
const quickActions = [
  { label: "新建销售订单", icon: Plus, route: "/sales-orders", primary: true },
  { label: "采购订单", icon: Truck, route: "/purchase-orders", primary: false },
  { label: "库存查询", icon: LayoutGrid, route: "/inventory-query", primary: false },
  { label: "收款登记", icon: Wallet, route: "/receipt-management", primary: false },
];

// ── Module groups ─────────────────────────────────────────────────────────────
const moduleGroups = [
  {
    group: "销售管理",
    icon: ShoppingCart,
    accent: "bg-blue-500",
    modules: [
      { label: "销售订单", desc: "批发开单 / 状态跟踪", route: "/sales-orders" },
      { label: "销售出库", desc: "发货执行 / 物流跟踪", route: "/sales-delivery", incomplete: true },
      { label: "销售查询", desc: "多维销售记录查询", route: "/sales-query", incomplete: true },
    ],
  },
  {
    group: "采购管理",
    icon: Truck,
    accent: "bg-cyan-500",
    modules: [
      { label: "采购订单", desc: "供货需求下单", route: "/purchase-orders", incomplete: true },
      { label: "采购入库", desc: "到货验收入库", route: "/purchase-receipt", incomplete: true },
      { label: "采购退货", desc: "退供协同处理", route: "/purchase-return", incomplete: true },
    ],
  },
  {
    group: "库存管理",
    icon: Package,
    accent: "bg-violet-500",
    modules: [
      { label: "库存查询", desc: "现存 / 占用 / 可用", route: "/inventory-query", incomplete: true },
      { label: "调拨管理", desc: "仓间调拨记录", route: "/stock-transfer", incomplete: true },
      { label: "盘点管理", desc: "计划 / 差异 / 结果", route: "/stock-count", incomplete: true },
    ],
  },
  {
    group: "往来管理",
    icon: ReceiptText,
    accent: "bg-amber-500",
    modules: [
      { label: "应收查询", desc: "客户应收余额", route: "/receivable-query", incomplete: true },
      { label: "收款登记", desc: "回款录入确认", route: "/receipt-management" },
      { label: "应付查询", desc: "供应商应付余额", route: "/payable-query", incomplete: true },
    ],
  },
];

const routeMap: Record<string, string> = {
  销售订单: "/sales-orders",
  采购订单: "/purchase-orders",
  库存查询: "/inventory-query",
  收款登记: "/receipt-management",
  客户往来: "/customer-ledger",
  商品管理: "/product-management",
};

// ── Status badge ──────────────────────────────────────────────────────────────
const statusMap: Record<string, { label: string; tone: string }> = {
  待审核: { label: "待审核", tone: "bg-orange-100 text-orange-700" },
  待出库: { label: "待出库", tone: "bg-blue-100 text-blue-700" },
  已完成: { label: "已完成", tone: "bg-emerald-100 text-emerald-700" },
  已关闭: { label: "已关闭", tone: "bg-gray-100 text-gray-500" },
};

export function DashboardPage() {
  const navigate = useNavigate();

  const go = (label: string) => {
    const route = routeMap[label];
    if (route) navigate(route);
  };

  const goRoute = (route: string) => navigate(route);

  return (
    <div className="space-y-5">

      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-line-1 bg-gradient-to-br p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover focus:outline-none",
                kpi.gradient,
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.iconBg)}>
                  <Icon size={18} className={kpi.iconColor} />
                </div>
                <div className={cn("flex items-center gap-0.5 text-xs font-medium", kpi.trendColor)}>
                  {kpi.trendUp ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {kpi.trend}
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-text-1">{kpi.value}</span>
                <span className="text-sm font-medium text-text-3">{kpi.unit}</span>
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs text-text-3">{kpi.sub}</span>
                <span className="text-[13px] font-semibold text-text-1">{kpi.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Hero Banner + Quick Actions ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-line-1 bg-white shadow-soft">
        {/* Subtle background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{
          backgroundImage: `radial-gradient(circle, #165dff 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }} />

        <div className="relative px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* Left: Greeting + date */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-2 bg-brand-1 px-3 py-1 text-xs font-medium text-brand-6">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-6 animate-pulse" />
                一期工作台
              </div>
              <h1 className="mt-3 text-[22px] font-bold tracking-tight text-text-1 sm:text-[26px]">
                您好，欢迎回来
              </h1>
              <p className="mt-1.5 text-sm text-text-3">
                2026年4月19日 &nbsp;·&nbsp; 星期日 &nbsp;·&nbsp; 晴
              </p>

              {/* Quick stats row */}
              <div className="mt-5 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-text-3">今日成交 <span className="font-semibold text-text-1">24笔</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <span className="text-xs text-text-3">待处理 <span className="font-semibold text-text-1">8笔</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-xs text-text-3">库存预警 <span className="font-semibold text-text-1">5个</span></span>
                </div>
              </div>
            </div>

            {/* Right: Quick action buttons */}
            <div className="flex flex-wrap gap-3 lg:shrink-0">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => goRoute(action.route)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                      action.primary
                        ? "bg-brand-6 text-white shadow-brand hover:bg-brand-7 hover:shadow-brand-lg"
                        : "border border-line-1 bg-white text-text-1 hover:border-brand-3 hover:bg-brand-1 hover:text-brand-6",
                    )}
                  >
                    <Icon size={15} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content: Recent Orders + Module Groups ─────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* Left: Recent Orders ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-line-1 bg-white shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line-1">
            <div>
              <h2 className="text-base font-semibold text-text-1">近期销售订单</h2>
              <p className="mt-0.5 text-xs text-text-3">最新5条批发订单记录</p>
            </div>
            <button
              type="button"
              onClick={() => go("销售订单")}
              className="flex items-center gap-1 text-xs font-medium text-brand-6 hover:text-brand-7 transition-colors"
            >
              查看全部
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-line-1">
            {salesOrders.slice(0, 5).map((order) => {
              const status = statusMap[order.status] ?? { label: order.status, tone: "bg-gray-100 text-gray-500" };
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => navigate(`/sales-orders/${order.id}`)}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-fill-2"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-medium text-text-1">{order.customer}</span>
                      <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium", status.tone)}>
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-text-3">
                      <span>{order.orderNo}</span>
                      <span>·</span>
                      <span>{order.warehouse}</span>
                      <span>·</span>
                      <span>{order.createdAt}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[14px] font-semibold text-text-1">{order.amount}</div>
                    <div className="mt-0.5 text-[11px] text-text-3">{order.paymentStatus}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Module Groups ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Module shortcuts grid */}
          <div className="rounded-2xl border border-line-1 bg-white shadow-soft overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line-1">
              <h2 className="text-base font-semibold text-text-1">快捷模块</h2>
              <button
                type="button"
                onClick={() => go("商品管理")}
                className="flex items-center gap-1 text-xs font-medium text-brand-6 hover:text-brand-7 transition-colors"
              >
                全部模块
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => goRoute(action.route)}
                    className="group flex items-center gap-3 rounded-xl border border-line-1 bg-fill-1 px-3 py-3 text-left transition-all duration-200 hover:border-brand-3 hover:bg-brand-1 hover:shadow-soft"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-1 text-brand-6 transition-colors group-hover:bg-brand-6 group-hover:text-white">
                      <Icon size={16} />
                    </span>
                    <span className="text-[13px] font-medium text-text-1">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent visits */}
          <div className="rounded-2xl border border-line-1 bg-white shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-line-1">
              <h2 className="text-base font-semibold text-text-1">最近访问</h2>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {recentVisits.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => go(item)}
                  className="flex items-center gap-1.5 rounded-lg border border-line-1 bg-fill-1 px-3 py-1.5 text-[12px] text-text-2 transition-all hover:border-brand-3 hover:bg-brand-1 hover:text-brand-6"
                >
                  <Clock3 size={11} />
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Module Group Cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {moduleGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div
              key={group.group}
              className="group rounded-2xl border border-line-1 bg-white shadow-soft overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              {/* Group header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line-1">
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-white", group.accent)}>
                  <GroupIcon size={15} />
                </span>
                <span className="text-[14px] font-semibold text-text-1">{group.group}</span>
                <ArrowUpRight size={13} className="ml-auto text-text-3 transition group-hover:text-brand-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              {/* Module list */}
              <div className="divide-y divide-line-1">
                {group.modules.map((mod) => (
                  <button
                    key={mod.label}
                    type="button"
                    onClick={() => goRoute(mod.route)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-fill-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium text-text-1">{mod.label}</span>
                        {mod.incomplete && (
                          <span className="rounded-md bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-600">未完善</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-text-3 truncate">{mod.desc}</p>
                    </div>
                    <ChevronRight size={13} className="shrink-0 text-text-3" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
