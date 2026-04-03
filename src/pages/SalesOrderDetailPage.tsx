import { startTransition, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, PageTitle, TabBar } from "../components/Ui";
import {
  SalesOrderActionLogPanel,
  SalesOrderCustomerSide,
  SalesOrderItemsReadonly,
  SalesOrderRelatedDocsPanel,
  SalesOrderRemarkReadonly,
  SalesOrderSection,
  SalesOrderSuggestionSide,
  SalesOrderSummarySide,
  SalesOrderTimelinePanel,
  calculateSalesOrderTotals,
} from "../components/SalesOrderWorkspace";
import { findSalesOrderCustomer, getSalesOrderRecord } from "../data/salesOrderWorkspace";
import { cn } from "../utils/cn";

type DetailTabKey = "items" | "flow" | "logs" | "related";

const detailTabs: Array<{ key: DetailTabKey; label: string }> = [
  { key: "items", label: "商品明细" },
  { key: "flow", label: "流转记录" },
  { key: "logs", label: "操作日志" },
  { key: "related", label: "备注与关联" },
];

export function SalesOrderDetailPage() {
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const [record, setRecord] = useState(() => getSalesOrderRecord(orderId));
  const [activeTab, setActiveTab] = useState<DetailTabKey>("items");

  useEffect(() => {
    setRecord(getSalesOrderRecord(orderId));
    setActiveTab("items");
  }, [orderId]);

  if (!record) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="销售订单详情"
          actions={<Button onClick={() => navigate("/sales-orders")}>返回列表</Button>}
        >
          未找到对应订单，请从列表页重新进入详情。
        </PageTitle>
      </div>
    );
  }

  const totals = calculateSalesOrderTotals(record.lines);
  const customer = findSalesOrderCustomer(record.customer);

  return (
    <div className="space-y-4">
      <PageTitle
        title="销售订单详情"
        actions={
          <>
            <Button tone="primary" onClick={() => navigate(`/sales-orders/${record.id}/edit`)}>编辑</Button>
            <Button onClick={() => navigate("/sales-orders/new")}>复制新增</Button>
            <Button onClick={() => navigate("/sales-orders")}>返回列表</Button>
          </>
        }
      >
        {`${record.orderNo}｜来源:${record.source}｜创建人:${record.creator}｜最近更新时间:${record.updatedAt}`}
      </PageTitle>

      <DetailHeaderStrip record={record} />

      <TabBar
        items={detailTabs}
        activeKey={activeTab}
        onChange={(tab) =>
          startTransition(() => {
            setActiveTab(tab);
          })
        }
        className="mb-4 border-line-1"
      />

      {activeTab === "items" ? (
        <div className="space-y-4">
          <DetailMetricStrip record={record} totals={totals} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <SalesOrderSection title="商品明细">
              <SalesOrderItemsReadonly lines={record.lines} />
            </SalesOrderSection>
            <SalesOrderSummarySide totals={totals} record={record} />
          </div>
        </div>
      ) : null}

      {activeTab === "flow" ? (
        <SalesOrderSection title="审批与履约轨迹">
          <SalesOrderTimelinePanel steps={record.timeline} />
        </SalesOrderSection>
      ) : null}

      {activeTab === "logs" ? (
        <SalesOrderSection title="操作日志">
          <SalesOrderActionLogPanel logs={record.actionLogs} />
        </SalesOrderSection>
      ) : null}

      {activeTab === "related" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <SalesOrderSection title="备注与协同">
              <SalesOrderRemarkReadonly record={record} />
            </SalesOrderSection>
            <SalesOrderSection title="关联单据">
              <SalesOrderRelatedDocsPanel docs={record.relatedDocs} />
            </SalesOrderSection>
          </div>
          <div className="space-y-4">
            <SalesOrderSuggestionSide suggestions={record.recommendedActions} title="下一步建议" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailHeaderStrip({
  record,
}: {
  record: NonNullable<ReturnType<typeof getSalesOrderRecord>>;
}) {
  const facts = [
    { label: "订单编号", value: record.orderNo },
    { label: "客户名称", value: record.customer },
    { label: "联系人", value: record.contactName },
    { label: "联系电话", value: record.contactPhone },
    {
      label: "订单状态",
      value: <DetailStatusBadge tone={record.statusTone}>{record.status}</DetailStatusBadge>,
    },
    {
      label: "审批状态",
      value: <DetailStatusBadge tone={getApprovalTone(record.approvalStatus)}>{record.approvalStatus}</DetailStatusBadge>,
    },
    { label: "业务日期", value: record.businessDate },
    { label: "交货日期", value: record.deliveryDate },
    { label: "销售渠道", value: record.salesChannel },
    { label: "销售仓库", value: record.warehouse },
    { label: "销售员", value: record.salesperson },
    { label: "销售时间", value: record.createdAt },
    { label: "收款方式", value: record.paymentMethod },
    { label: "结算方式", value: record.settlementMethod },
  ];

  return (
    <div className="grid gap-x-5 gap-y-3 rounded-xl border border-line-1 bg-white px-4 py-3.5 shadow-card md:grid-cols-2 xl:grid-cols-4">
      {facts.map((item) => (
        <div key={item.label}>
          <div className="text-[13px] leading-[20px] text-text-3">{item.label}</div>
          <div className="mt-1 text-[14px] font-normal leading-[22px] text-text-1">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function DetailMetricStrip({
  record,
  totals,
}: {
  record: NonNullable<ReturnType<typeof getSalesOrderRecord>>;
  totals: ReturnType<typeof calculateSalesOrderTotals>;
}) {
  const items = [
    { label: "收款状态", value: record.paymentStatus },
    { label: "履约状态", value: record.deliveryStatus },
    { label: "商品数量", value: `${totals.totalQty}件` },
    { label: "订单金额", value: record.lines.length ? `${totals.grandTotal.toFixed(2)}元` : "0.00元" },
  ];

  return (
    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-line-1 bg-white px-4 py-2.5 shadow-card">
            <div className="text-[12px] leading-[18px] text-text-3">{item.label}</div>
            <div className="mt-0.5 text-[15px] font-medium leading-[22px] text-text-1">{item.value}</div>
          </div>
        ))}
    </div>
  );
}

function DetailStatusBadge({
  tone,
  children,
}: {
  tone: "green" | "blue" | "orange" | "red" | "gray";
  children: React.ReactNode;
}) {
  const toneClass = {
    green: "border-[rgba(0,180,42,0.18)] bg-[rgba(0,180,42,0.04)] text-success",
    blue: "border-[rgba(22,93,255,0.18)] bg-[rgba(22,93,255,0.04)] text-brand-6",
    orange: "border-[rgba(255,125,0,0.18)] bg-[rgba(255,125,0,0.04)] text-warning",
    red: "border-[rgba(245,63,63,0.18)] bg-[rgba(245,63,63,0.04)] text-danger",
    gray: "border-line-2 bg-fill-2 text-text-2",
  }[tone];

  return (
    <span className={cn("inline-flex h-7 items-center rounded-md border px-2 text-[13px] font-medium leading-5", toneClass)}>
      {children}
    </span>
  );
}

function getApprovalTone(status: string): "green" | "blue" | "orange" | "red" | "gray" {
  if (status.includes("通过") || status.includes("完成")) {
    return "green";
  }
  if (status.includes("复核")) {
    return "blue";
  }
  if (status.includes("审核")) {
    return "orange";
  }
  if (status.includes("驳回") || status.includes("异常")) {
    return "red";
  }
  if (status.includes("处理中")) {
    return "blue";
  }
  return "gray";
}
