import type { ReactNode } from "react";
import { AlertCircle, ArrowRight, ChevronDown, ClipboardList, Plus, Trash2 } from "lucide-react";
import type {
  SalesOrderActionLog,
  SalesOrderCustomerProfile,
  SalesOrderLineItem,
  SalesOrderRelatedDocument,
  SalesOrderTimelineStep,
  SalesOrderWorkspaceRecord,
} from "../data/salesOrderWorkspace";
import { Button, DateField, FormField, Input, Select, StatusPill, Surface, TextArea } from "./Ui";
import { cn } from "../utils/cn";

export type SalesOrderTotals = {
  totalQty: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
};

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function parseCurrencyText(value: string) {
  const numeric = Number(String(value).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseNumber(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getLineDiscountedAmount(line: SalesOrderLineItem) {
  return line.qty * line.price * (line.discountRate / 100);
}

function getLineTaxAmount(line: SalesOrderLineItem) {
  return getLineDiscountedAmount(line) * (line.taxRate / 100);
}

function getLineSubtotal(line: SalesOrderLineItem) {
  return line.qty * line.price;
}

function getLineGrandTotal(line: SalesOrderLineItem) {
  return getLineDiscountedAmount(line) + getLineTaxAmount(line);
}

export function calculateSalesOrderTotals(lines: SalesOrderLineItem[]): SalesOrderTotals {
  return lines.reduce<SalesOrderTotals>(
    (acc, line) => {
      const subtotal = getLineSubtotal(line);
      const discountedAmount = getLineDiscountedAmount(line);
      const taxAmount = getLineTaxAmount(line);

      acc.totalQty += line.qty;
      acc.subtotal += subtotal;
      acc.discountAmount += subtotal - discountedAmount;
      acc.taxAmount += taxAmount;
      acc.grandTotal += discountedAmount + taxAmount;

      return acc;
    },
    { totalQty: 0, subtotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 },
  );
}

export function SalesOrderMetricStrip({
  record,
  totals,
}: {
  record: SalesOrderWorkspaceRecord;
  totals: SalesOrderTotals;
}) {
  const metrics = [
    { label: "订单状态", value: record.status, hint: record.approvalStatus, tone: record.statusTone },
    { label: "收款状态", value: record.paymentStatus, hint: `履约:${record.deliveryStatus}` },
    { label: "本单金额", value: formatCurrency(totals.grandTotal), hint: `共${totals.totalQty}件` },
    { label: "可用信用", value: record.availableCredit, hint: record.customerLevel },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Surface key={metric.label} className="rounded-xl border border-line-1 px-4 py-4 shadow-card">
          <div className="text-xs text-text-3">{metric.label}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-lg font-semibold text-text-1">{metric.value}</div>
            {"tone" in metric && metric.tone ? <StatusPill tone={metric.tone}>{metric.hint}</StatusPill> : null}
          </div>
          {"tone" in metric && metric.tone ? null : <div className="mt-1 text-xs text-text-3">{metric.hint}</div>}
        </Surface>
      ))}
    </div>
  );
}

export function SalesOrderSection({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Surface className="rounded-xl border border-line-1 shadow-card">
      <div className="flex min-h-[52px] items-center justify-between border-b border-line-1 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-sm bg-brand-6" />
          <h2 className="text-[15px] font-semibold text-text-1">{title}</h2>
        </div>
        {extra ? <div className="flex items-center gap-2">{extra}</div> : null}
      </div>
      <div className="px-4 py-4">{children}</div>
    </Surface>
  );
}

export function ReadonlyField({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: SalesOrderWorkspaceRecord["statusTone"];
}) {
  return (
    <div className="rounded-md border border-line-1 bg-fill-2 px-4 py-3">
      <div className="text-xs text-text-3">{label}</div>
      <div className="mt-2 text-sm font-medium text-text-1">
        {tone ? <StatusPill tone={tone}>{value}</StatusPill> : value}
      </div>
    </div>
  );
}

export function SalesOrderSummarySide({
  totals,
  record,
}: {
  totals: SalesOrderTotals;
  record: SalesOrderWorkspaceRecord;
}) {
  return (
    <Surface className="rounded-xl border border-line-1 px-4 py-4 shadow-card">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-1">
        <ClipboardList size={16} className="text-brand-6" />
        金额汇总
      </div>
      <div className="mt-4 space-y-3 text-[13px] text-text-2">
        <SummaryRow label="商品原价合计" value={formatCurrency(totals.subtotal)} />
        <SummaryRow label="优惠减免" value={`-${formatCurrency(totals.discountAmount)}`} />
        <SummaryRow label="税额" value={formatCurrency(totals.taxAmount)} />
        <SummaryRow label="收款状态" value={record.paymentStatus} highlight />
      </div>
      <div className="mt-4 rounded-xl bg-brand-1 px-4 py-3">
        <div className="text-xs text-brand-6">订单总额</div>
        <div className="mt-1 text-2xl font-semibold text-brand-7">{formatCurrency(totals.grandTotal)}</div>
      </div>
    </Surface>
  );
}

export function SalesOrderCustomerSide({
  record,
  customer,
}: {
  record: SalesOrderWorkspaceRecord;
  customer?: SalesOrderCustomerProfile;
}) {
  const currentCustomer = customer ?? {
    name: record.customer,
    code: record.customerCode,
    level: record.customerLevel,
    contactName: record.contactName,
    contactPhone: record.contactPhone,
    address: record.address,
    settlementMethod: record.settlementMethod,
    paymentMethod: record.paymentMethod,
    priceTier: record.priceTier,
    creditLimit: record.creditLimit,
    receivableBalance: record.receivableBalance,
    availableCredit: record.availableCredit,
    tags: record.tags,
  };

  return (
    <Surface className="rounded-xl border border-line-1 px-4 py-4 shadow-card">
      <div className="text-sm font-semibold text-text-1">客户信用摘要</div>
      <div className="mt-4 space-y-3 text-[13px] text-text-2">
        <SummaryRow label="客户编码" value={currentCustomer.code} />
        <SummaryRow label="客户等级" value={currentCustomer.level} />
        <SummaryRow label="结算方式" value={currentCustomer.settlementMethod} />
        <SummaryRow label="默认付款" value={currentCustomer.paymentMethod} />
        <SummaryRow label="信用额度" value={currentCustomer.creditLimit} />
        <SummaryRow label="应收余额" value={currentCustomer.receivableBalance} highlight />
        <SummaryRow label="可用信用" value={currentCustomer.availableCredit} />
      </div>
      <div className="mt-4 rounded-xl border border-warning/20 bg-warning/10 px-3 py-3 text-[13px] leading-6 text-text-2">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-[2px] text-warning" />
          <span>{record.riskNote}</span>
        </div>
      </div>
    </Surface>
  );
}

export function SalesOrderSuggestionSide({
  suggestions,
  title = "建议动作",
}: {
  suggestions: string[];
  title?: string;
}) {
  return (
    <Surface className="rounded-xl border border-line-1 px-4 py-4 shadow-card">
      <div className="text-sm font-semibold text-text-1">{title}</div>
      <div className="mt-4 space-y-2">
        {suggestions.map((item) => (
          <div key={item} className="flex items-start gap-2 text-[13px] text-text-2">
            <ArrowRight size={14} className="mt-[2px] text-brand-6" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </Surface>
  );
}

export function SalesOrderBasicForm({
  record,
  customerOptions,
  warehouseOptions,
  channelOptions,
  settlementOptions,
  paymentOptions,
  deliveryOptions,
  priorityOptions,
  columns = 3,
  onFieldChange,
}: {
  record: SalesOrderWorkspaceRecord;
  customerOptions: string[];
  warehouseOptions: string[];
  channelOptions: string[];
  settlementOptions: string[];
  paymentOptions: string[];
  deliveryOptions: string[];
  priorityOptions: string[];
  columns?: 3 | 4;
  onFieldChange: <K extends keyof SalesOrderWorkspaceRecord>(field: K, value: SalesOrderWorkspaceRecord[K]) => void;
}) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", columns === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3")}>
      <FormField label="客户名称" required>
        <Select value={record.customer} onChange={(value) => onFieldChange("customer", value)} options={customerOptions} />
      </FormField>
      <FormField label="业务日期" required>
        <DateField value={record.businessDate} onChange={(value) => onFieldChange("businessDate", value)} />
      </FormField>
      <FormField label="交货日期" required>
        <DateField value={record.deliveryDate} onChange={(value) => onFieldChange("deliveryDate", value)} />
      </FormField>
      <FormField label="销售仓库" required>
        <Select value={record.warehouse} onChange={(value) => onFieldChange("warehouse", value)} options={warehouseOptions} />
      </FormField>
      <FormField label="销售渠道">
        <Select value={record.salesChannel} onChange={(value) => onFieldChange("salesChannel", value)} options={channelOptions} />
      </FormField>
      <FormField label="优先级">
        <Select value={record.priority} onChange={(value) => onFieldChange("priority", value)} options={priorityOptions} />
      </FormField>
      <FormField label="经手业务员">
        <Input value={record.salesperson} onChange={(value) => onFieldChange("salesperson", value)} placeholder="请输入业务员" />
      </FormField>
      <FormField label="结算方式">
        <Select value={record.settlementMethod} onChange={(value) => onFieldChange("settlementMethod", value)} options={settlementOptions} />
      </FormField>
      <FormField label="付款方式">
        <Select value={record.paymentMethod} onChange={(value) => onFieldChange("paymentMethod", value)} options={paymentOptions} />
      </FormField>
      <FormField label="交付方式">
        <Select value={record.deliveryMethod} onChange={(value) => onFieldChange("deliveryMethod", value)} options={deliveryOptions} />
      </FormField>
      <FormField label="运费承担">
        <Input value={record.freightBearer} onChange={(value) => onFieldChange("freightBearer", value)} placeholder="请输入运费承担方" />
      </FormField>
      <FormField label="价格体系">
        <Input value={record.priceTier} onChange={(value) => onFieldChange("priceTier", value)} placeholder="请输入价格体系" />
      </FormField>
      <FormField label="收货联系人">
        <Input value={record.contactName} onChange={(value) => onFieldChange("contactName", value)} placeholder="请输入联系人" />
      </FormField>
      <FormField label="联系电话">
        <Input value={record.contactPhone} onChange={(value) => onFieldChange("contactPhone", value)} placeholder="请输入联系电话" />
      </FormField>
      <FormField label="客户编码">
        <Input value={record.customerCode} onChange={(value) => onFieldChange("customerCode", value)} placeholder="请输入客户编码" />
      </FormField>
      <div className={cn("lg:col-span-2", columns === 4 ? "xl:col-span-4" : "xl:col-span-3")}>
        <FormField label="收货地址">
          <TextArea value={record.address} onChange={(value) => onFieldChange("address", value)} placeholder="请输入收货地址" />
        </FormField>
      </div>
    </div>
  );
}

export function SalesOrderReadonlyMeta({
  record,
}: {
  record: SalesOrderWorkspaceRecord;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-1 bg-white">
      <CompactMetaGroup
        title="基础信息"
        items={[
          { label: "订单编号", value: <span className="text-brand-6">{record.orderNo}</span> },
          { label: "客户名称", value: record.customer },
          { label: "联系人", value: record.contactName },
          { label: "联系电话", value: record.contactPhone },
          { label: "订单状态", value: <StatusPill tone={record.statusTone}>{record.status}</StatusPill> },
          { label: "审批状态", value: record.approvalStatus },
          { label: "客户编码", value: record.customerCode },
          { label: "客户等级", value: record.customerLevel },
        ]}
      />

      <CompactMetaGroup
        title="业务与履约"
        bordered
        items={[
          { label: "业务日期", value: record.businessDate },
          { label: "销售仓库", value: record.warehouse },
          { label: "销售员", value: record.salesperson },
          { label: "最近更新", value: record.updatedAt },
          { label: "交货日期", value: record.deliveryDate },
          { label: "销售渠道", value: record.salesChannel },
          { label: "交付方式", value: record.deliveryMethod },
          { label: "优先级", value: record.priority },
        ]}
      />

      <CompactMetaGroup
        title="结算与其他"
        bordered
        items={[
          { label: "结算方式", value: record.settlementMethod },
          { label: "付款方式", value: record.paymentMethod },
          { label: "来源", value: record.source },
          { label: "运费承担", value: record.freightBearer },
          { label: "创建人", value: record.creator },
          { label: "价格体系", value: record.priceTier },
          { label: "收货地址", value: record.address, span: "full" },
        ]}
      />
    </div>
  );
}

export function SalesOrderRemarkForm({
  record,
  onFieldChange,
  tagOptions,
}: {
  record: SalesOrderWorkspaceRecord;
  tagOptions: string[];
  onFieldChange: <K extends keyof SalesOrderWorkspaceRecord>(field: K, value: SalesOrderWorkspaceRecord[K]) => void;
}) {
  const toggleTag = (tag: string) => {
    const exists = record.tags.includes(tag);
    const nextTags = exists ? record.tags.filter((item) => item !== tag) : [...record.tags, tag];
    onFieldChange("tags", nextTags);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tagOptions.map((tag) => {
          const active = record.tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition",
                active ? "border-brand-6 bg-brand-1 text-brand-6" : "border-line-2 bg-white text-text-2 hover:border-brand-3",
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <FormField label="对客备注">
          <TextArea value={record.remark} onChange={(value) => onFieldChange("remark", value)} placeholder="请输入客户可见备注" />
        </FormField>
        <FormField label="内部协同备注">
          <TextArea value={record.internalRemark} onChange={(value) => onFieldChange("internalRemark", value)} placeholder="请输入内部交接说明" />
        </FormField>
      </div>
    </div>
  );
}

export function SalesOrderRemarkReadonly({
  record,
}: {
  record: SalesOrderWorkspaceRecord;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {record.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-brand-1 px-3 py-1 text-[12px] text-brand-6">
            {tag}
          </span>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3.5 shadow-card">
          <div className="text-[13px] leading-5 text-text-3">对客备注</div>
          <div className="mt-2 text-[14px] font-normal leading-[22px] text-text-1">{record.remark || "暂无"}</div>
        </div>
        <div className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3.5 shadow-card">
          <div className="text-[13px] leading-5 text-text-3">内部协同备注</div>
          <div className="mt-2 text-[14px] font-normal leading-[22px] text-text-1">{record.internalRemark || "暂无"}</div>
        </div>
      </div>
    </div>
  );
}

export function SalesOrderItemsEditor({
  lines,
  recommendedSkus,
  onAddEmptyLine,
  onAddProduct,
  onRemoveLine,
  onLineChange,
}: {
  lines: SalesOrderLineItem[];
  recommendedSkus: { sku: string; label: string }[];
  onAddEmptyLine: () => void;
  onAddProduct: (sku: string) => void;
  onRemoveLine: (lineId: string) => void;
  onLineChange: <K extends keyof SalesOrderLineItem>(lineId: string, field: K, value: SalesOrderLineItem[K]) => void;
}) {
  return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
        <Button tone="primary" size="sm" icon={<Plus size={14} />} onClick={onAddEmptyLine}>
          新增空行
        </Button>
        {recommendedSkus.map((item) => (
          <Button key={item.sku} size="sm" onClick={() => onAddProduct(item.sku)}>
            加入{item.label}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1440px] border-collapse text-sm">
          <thead className="bg-fill-2 text-left text-text-2">
            <tr className="h-[44px]">
              <th className="whitespace-nowrap border-b border-line-1 px-3">SKU</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3">商品名称</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3">规格</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3 text-right">可用库存</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3 text-right">数量</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3 text-right">单价</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3 text-right">折扣%</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3 text-right">税率%</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3">交付日期</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3">备注</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3 text-right">行金额</th>
              <th className="whitespace-nowrap border-b border-line-1 px-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-line-1 align-top">
                <td className="whitespace-nowrap px-3 py-2.5"><Input value={line.sku} onChange={(value) => onLineChange(line.id, "sku", value)} /></td>
                <td className="whitespace-nowrap px-3 py-2.5"><Input value={line.productName} onChange={(value) => onLineChange(line.id, "productName", value)} /></td>
                <td className="whitespace-nowrap px-3 py-2.5"><Input value={line.spec} onChange={(value) => onLineChange(line.id, "spec", value)} /></td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <div className="h-8 min-w-[88px] rounded-lg border border-line-1 bg-fill-2 px-3 text-right leading-8 text-text-2">{line.availableStock}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Input value={String(line.qty)} onChange={(value) => onLineChange(line.id, "qty", parseNumber(value))} className="text-right" />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Input value={String(line.price)} onChange={(value) => onLineChange(line.id, "price", parseNumber(value))} className="text-right" />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Input value={String(line.discountRate)} onChange={(value) => onLineChange(line.id, "discountRate", parseNumber(value))} className="text-right" />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Input value={String(line.taxRate)} onChange={(value) => onLineChange(line.id, "taxRate", parseNumber(value))} className="text-right" />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <DateField value={line.deliveryDate} onChange={(value) => onLineChange(line.id, "deliveryDate", value)} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Input value={line.note} onChange={(value) => onLineChange(line.id, "note", value)} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-text-1">{formatCurrency(getLineGrandTotal(line))}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <Button size="icon" tone="ghost" icon={<Trash2 size={14} />} onClick={() => onRemoveLine(line.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SalesOrderItemsReadonly({
  lines,
}: {
  lines: SalesOrderLineItem[];
}) {
  const totals = calculateSalesOrderTotals(lines);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] border-collapse text-sm lg:min-w-full">
        <thead className="bg-fill-2 text-left text-text-2">
          <tr className="h-[44px]">
            <th className="border-b border-line-1 px-3">SKU</th>
            <th className="border-b border-line-1 px-3">商品名称</th>
            <th className="border-b border-line-1 px-3">规格</th>
            <th className="border-b border-line-1 px-3 text-right">数量</th>
            <th className="border-b border-line-1 px-3">单位</th>
            <th className="border-b border-line-1 px-3 text-right">单价</th>
            <th className="border-b border-line-1 px-3 text-right">折扣%</th>
            <th className="border-b border-line-1 px-3 text-right">税率%</th>
            <th className="border-b border-line-1 px-3">交付日期</th>
            <th className="border-b border-line-1 px-3">备注</th>
            <th className="border-b border-line-1 px-3 text-right">行金额</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
              <td className="px-3 py-2.5">{line.sku}</td>
              <td className="px-3 py-2.5 font-medium text-text-1">{line.productName}</td>
              <td className="px-3 py-2.5">{line.spec}</td>
              <td className="px-3 py-2.5 text-right">{line.qty}</td>
              <td className="px-3 py-2.5">{line.unit}</td>
              <td className="px-3 py-2.5 text-right">{formatCurrency(line.price)}</td>
              <td className="px-3 py-2.5 text-right">{line.discountRate}</td>
              <td className="px-3 py-2.5 text-right">{line.taxRate}</td>
              <td className="px-3 py-2.5">{line.deliveryDate}</td>
              <td className="px-3 py-2.5">{line.note || "-"}</td>
              <td className="px-3 py-2.5 text-right font-medium text-text-1">{formatCurrency(getLineGrandTotal(line))}</td>
            </tr>
          ))}
          <tr className="bg-fill-2">
            <td colSpan={10} className="px-3 py-2.5 text-right font-medium text-text-2">合计</td>
            <td className="px-3 py-2.5 text-right text-base font-semibold text-brand-7">{formatCurrency(totals.grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function SalesOrderTimelinePanel({
  steps,
}: {
  steps: SalesOrderTimelineStep[];
}) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="relative pl-6">
          {index < steps.length - 1 ? <span className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-px bg-line-2" /> : null}
          <span className={cn(
            "absolute left-0 top-1.5 h-[14px] w-[14px] rounded-full border-2 bg-white",
            step.tone === "green" ? "border-success" : step.tone === "orange" ? "border-warning" : step.tone === "red" ? "border-danger" : "border-brand-6",
          )} />
          <div className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-text-1">{step.title}</span>
              <StatusPill tone={step.tone}>{step.owner}</StatusPill>
            </div>
            <div className="mt-2 text-[13px] leading-6 text-text-2">{step.detail}</div>
            <div className="mt-2 text-xs text-text-3">{step.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SalesOrderActionLogPanel({
  logs,
}: {
  logs: SalesOrderActionLog[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-1 bg-white shadow-card">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-fill-2 text-left text-text-2">
          <tr className="h-10">
            <th className="border-b border-line-1 px-4">时间</th>
            <th className="border-b border-line-1 px-4">操作人</th>
            <th className="border-b border-line-1 px-4">动作</th>
            <th className="border-b border-line-1 px-4">说明</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
              <td className="px-4 py-3 text-text-2">{log.time}</td>
              <td className="px-4 py-3">{log.user}</td>
              <td className="px-4 py-3 font-medium text-text-1">{log.action}</td>
              <td className="px-4 py-3 text-text-2">{log.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SalesOrderRelatedDocsPanel({
  docs,
}: {
  docs: SalesOrderRelatedDocument[];
}) {
  return (
    <div className="space-y-3">
      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-2 px-4 py-8 text-center text-sm text-text-3">暂无关联单据</div>
      ) : (
        docs.map((doc) => (
          <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-1 px-4 py-3 shadow-card">
            <div>
              <div className="text-sm font-medium text-text-1">{doc.type}</div>
              <div className="mt-1 text-[13px] text-text-3">{doc.no}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-text-1">{doc.status}</div>
              <div className="mt-1 text-[13px] text-brand-6">{doc.amount}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className={cn("font-medium", highlight ? "text-text-1" : "text-text-2")}>{value}</span>
    </div>
  );
}

function CompactMetaGroup({
  title,
  items,
  bordered = false,
}: {
  title: string;
  items: Array<{ label: string; value: ReactNode; span?: "full" }>;
  bordered?: boolean;
}) {
  return (
    <div className={cn(bordered && "border-t border-line-1")}>
      <div className="flex min-h-[52px] items-center gap-1 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-[14px] w-1 rounded-sm bg-brand-6" />
          <span className="text-base font-medium text-text-1">{title}</span>
        </div>
        <ChevronDown size={16} className="text-text-3" />
      </div>
      <div className="border-t border-line-1 px-4 pb-4 pt-2">
        <div className="grid gap-x-5 gap-y-3 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={`${title}-${item.label}`}
            className={cn(
              "flex items-start gap-3 text-sm leading-[22px]",
              item.span === "full" && "xl:col-span-3",
            )}
          >
            <div className="w-[84px] shrink-0 text-right text-text-2">{item.label}</div>
            <div className="min-w-0 flex-1 font-normal text-text-1">{item.value}</div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
