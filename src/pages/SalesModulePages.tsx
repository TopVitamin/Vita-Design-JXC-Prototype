import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BatchSearchInput, Button, Checkbox, DateField, DateRangeField, Input, Message, PageTitle, Pagination, ResizableHeaderCell, Select, StatusPill, TableSortHeader, TextArea, useResizableColumns } from "../components/Ui";
import { cn } from "../utils/cn";
import { compareRecord } from "../utils/sort";
import {
  approveSalesOrder,
  buildStockoutLinesFromOrder,
  closeSalesOrder,
  confirmSalesStockout,
  createSalesOrderDraft,
  createSalesStockoutDraft,
  deleteSalesOrder,
  deleteSalesStockout,
  findCustomer,
  findProduct,
  findWarehouse,
  getCustomerOptions,
  getLinkedSalesStockouts,
  getPriceForLevel,
  getProductOptions,
  getSalesOrder,
  getSalesOrders,
  getSalesStockout,
  getSalesStockouts,
  getStockoutSourceOrders,
  getWarehouseOptions,
  salesPriceLevels,
  salesTaxRates,
  saveSalesOrder,
  saveSalesStockout,
  type PriceLevel,
  type SalesOrderLine,
  type SalesOrderRecord,
  type SalesOrderStatus,
  type SalesStockoutLine,
  type SalesStockoutRecord,
  voidSalesOrder,
  rejectSalesOrder,
} from "../data/salesWorkspace";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;
type ConfirmState = { title: string; content: string; confirmText: string; onConfirm: () => void };

const orderColumns = [
  { key: "__select__", width: 48, minWidth: 48, maxWidth: 48, resizable: false },
  { key: "no", width: 180, minWidth: 180 },
  { key: "status", width: 100, minWidth: 100 },
  { key: "customerLabel", width: 220, minWidth: 200 },
  { key: "warehouseLabel", width: 170, minWidth: 160 },
  { key: "orderDate", width: 120, minWidth: 120 },
  { key: "expectedDate", width: 130, minWidth: 130 },
  { key: "totalAmount", width: 140, minWidth: 140 },
  { key: "updatedAt", width: 170, minWidth: 170 },
  { key: "__actions__", width: 200, minWidth: 180, resizable: false },
] as const;

const stockoutColumns = [
  { key: "__select__", width: 48, minWidth: 48, maxWidth: 48, resizable: false },
  { key: "no", width: 200, minWidth: 200 },
  { key: "status", width: 90, minWidth: 90 },
  { key: "orderNo", width: 180, minWidth: 180 },
  { key: "customerLabel", width: 220, minWidth: 200 },
  { key: "warehouseLabel", width: 170, minWidth: 160 },
  { key: "stockoutDate", width: 120, minWidth: 120 },
  { key: "totalAmount", width: 140, minWidth: 140 },
  { key: "updatedAt", width: 170, minWidth: 170 },
  { key: "__actions__", width: 170, minWidth: 150, resizable: false },
] as const;

function openToast(text: string) {
  Message.success(text, 2200);
}

function openError(text: string) {
  Message.error(text, 2800);
}

function formatMoney(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseBatchInput(value: string) {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function inDateRange(value: string, range: { start: string; end: string }) {
  if (range.start && value < range.start) return false;
  if (range.end && value > range.end) return false;
  return true;
}

function SurfaceCard({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line-1 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-line-1 px-4 py-3">
        <div className="text-[15px] font-semibold text-text-1">{title}</div>
        {extra ? <div className="text-[13px] text-text-2">{extra}</div> : null}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function LabeledField({ label, required = false, error, className, children }: { label: string; required?: boolean; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <div className="mb-1.5 text-[13px] text-text-2">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </div>
      {children}
      {error ? <div className="mt-1 text-xs text-danger">{error}</div> : null}
    </div>
  );
}

function ReadonlyValue({ value, className }: { value: string; className?: string }) {
  return <div className={cn("flex min-h-8 items-center rounded-md border border-line-1 bg-fill-2 px-3 text-[13px] text-text-2", className)}>{value || "-"}</div>;
}

function ConfirmModal({ state, onCancel }: { state: ConfirmState | null; onCancel: () => void }) {
  if (!state) return null;
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[420px] rounded-lg border border-line-1 bg-white shadow-drawer">
        <div className="border-b border-line-1 px-5 py-4 text-[15px] font-semibold text-text-1">{state.title}</div>
        <div className="px-5 py-4 text-[14px] leading-6 text-text-2">{state.content}</div>
        <div className="flex justify-end gap-2 border-t border-line-1 px-5 py-4">
          <Button onClick={onCancel}>取消</Button>
          <Button tone="primary" onClick={state.onConfirm}>{state.confirmText}</Button>
        </div>
      </div>
    </div>
  );
}

function EmptyStateRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-[13px] text-text-3">暂无数据</td>
    </tr>
  );
}

function TextAction({ children, onClick }: { children: string; onClick: () => void }) {
  return <button type="button" className="text-[13px] text-brand-6 transition hover:text-brand-7" onClick={onClick}>{children}</button>;
}

function getOrderActions(status: SalesOrderStatus) {
  switch (status) {
    case "草稿":
      return ["查看", "编辑", "提交审核", "删除"];
    case "待审核":
      return ["查看", "审核", "驳回", "作废"];
    case "待出库":
      return ["查看", "创建出库单", "作废"];
    case "部分出库":
      return ["查看", "创建出库单", "关闭订单"];
    default:
      return ["查看"];
  }
}

function getStockoutActions(status: SalesStockoutRecord["status"]) {
  return status === "草稿" ? ["查看", "编辑", "确认出库", "删除"] : ["查看"];
}

export function SalesOrderListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<SalesOrderRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    no: "",
    customer: "",
    warehouse: "",
    status: "全部",
    orderDate: { start: "", end: "" },
    expectedDate: { start: "", end: "" },
    updatedAt: { start: "", end: "" },
  });

  useEffect(() => {
    setRecords(getSalesOrders());
  }, []);

  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("sales-orders:list:v2", [...orderColumns]);

  const filteredRecords = useMemo(() => {
    const noSet = parseBatchInput(filters.no);
    return records
      .filter((record) => {
        if (noSet.length > 0 && !noSet.includes(record.no)) return false;
        if (filters.customer && record.customerLabel !== filters.customer) return false;
        if (filters.warehouse && record.warehouseLabel !== filters.warehouse) return false;
        if (filters.status !== "全部" && record.status !== filters.status) return false;
        if (!inDateRange(record.orderDate, filters.orderDate)) return false;
        if (!inDateRange(record.expectedDate, filters.expectedDate)) return false;
        if (!inDateRange(record.updatedAt.slice(0, 10), filters.updatedAt)) return false;
        return true;
      })
      .sort((a, b) => compareRecord(a as any, b as any, sortConfig));
  }, [records, filters, sortConfig]);

  const pageRows = useMemo(() => filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredRecords, currentPage, pageSize]);
  const isAllSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.includes(row.id));

  const refresh = () => setRecords(getSalesOrders());
  const handleSort = (key: string) => setSortConfig((current) => !current || current.key !== key ? { key, direction: "asc" } : current.direction === "asc" ? { key, direction: "desc" } : null);

  const handleAction = (record: SalesOrderRecord, action: string) => {
    if (action === "查看") return navigate(`/sales-orders/${record.id}`);
    if (action === "编辑") return navigate(`/sales-orders/${record.id}/edit`);
    if (action === "创建出库单") return navigate(`/sales-delivery/new?orderId=${record.id}`);
    const mapping: Record<string, ConfirmState> = {
      删除: {
        title: "确认删除",
        content: "删除后不可恢复，该销售订单将从系统中永久移除，确认删除？",
        confirmText: "确认删除",
        onConfirm: () => {
          deleteSalesOrder(record.id);
          openToast("销售订单已删除");
          setConfirmState(null);
          refresh();
        },
      },
      提交审核: {
        title: "提交审核",
        content: "提交后单据将进入待审核状态，确认提交？",
        confirmText: "确认提交",
        onConfirm: () => {
          const saved = saveSalesOrder(record, "submit");
          if (!saved) return openError("提交失败");
          openToast("已提交审核，等待审核确认");
          setConfirmState(null);
          refresh();
        },
      },
      审核: {
        title: "确认审核",
        content: "审核通过后关键字段将锁定并占用库存，不可再修改，确认审核通过？",
        confirmText: "确认审核",
        onConfirm: () => {
          approveSalesOrder(record.id);
          openToast("审核通过，库存已占用");
          setConfirmState(null);
          refresh();
        },
      },
      驳回: {
        title: "确认驳回",
        content: "驳回后单据将退回草稿，内勤可重新修改，确认驳回？",
        confirmText: "确认驳回",
        onConfirm: () => {
          rejectSalesOrder(record.id);
          openToast("已驳回，单据已退回草稿");
          setConfirmState(null);
          refresh();
        },
      },
      作废: {
        title: "确认作废",
        content: "作废后不可恢复，单据将进入已作废状态，确认作废？",
        confirmText: "确认作废",
        onConfirm: () => {
          voidSalesOrder(record.id);
          openToast("销售订单已作废");
          setConfirmState(null);
          refresh();
        },
      },
      关闭订单: {
        title: "确认关闭",
        content: "关闭后剩余未出库数量将不再发货，占用库存将释放，确认关闭订单？",
        confirmText: "确认关闭",
        onConfirm: () => {
          closeSalesOrder(record.id);
          openToast("订单已关闭，剩余占用库存已释放");
          setConfirmState(null);
          refresh();
        },
      },
    };
    setConfirmState(mapping[action]);
  };

  return (
    <div className="flex flex-col gap-4">
      <SurfaceCard title="查询条件">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <LabeledField label="销售单号"><BatchSearchInput value={filters.no} onChange={(no) => setFilters((current) => ({ ...current, no }))} placeholder="支持换行或英文逗号分隔" /></LabeledField>
          <LabeledField label="客户"><Select value={filters.customer} onChange={(customer) => setFilters((current) => ({ ...current, customer }))} options={[...new Set(records.map((item) => item.customerLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="出库仓库"><Select value={filters.warehouse} onChange={(warehouse) => setFilters((current) => ({ ...current, warehouse }))} options={[...new Set(records.map((item) => item.warehouseLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="单据状态"><Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={["全部", "草稿", "待审核", "待出库", "部分出库", "已完成", "已作废"]} /></LabeledField>
          <LabeledField label="下单日期"><DateRangeField value={filters.orderDate} onChange={(orderDate) => setFilters((current) => ({ ...current, orderDate }))} /></LabeledField>
          <LabeledField label="预计发货日期"><DateRangeField value={filters.expectedDate} onChange={(expectedDate) => setFilters((current) => ({ ...current, expectedDate }))} /></LabeledField>
          {expanded ? <LabeledField label="最后修改时间"><DateRangeField value={filters.updatedAt} onChange={(updatedAt) => setFilters((current) => ({ ...current, updatedAt }))} /></LabeledField> : null}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={() => setExpanded((current) => !current)}>{expanded ? "收起" : "展开"}</Button>
          <Button onClick={() => { setFilters({ no: "", customer: "", warehouse: "", status: "全部", orderDate: { start: "", end: "" }, expectedDate: { start: "", end: "" }, updatedAt: { start: "", end: "" } }); setSelectedIds([]); setCurrentPage(1); }}>重置</Button>
          <Button tone="primary" onClick={() => setCurrentPage(1)}>搜索</Button>
        </div>
      </SurfaceCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button tone="primary" onClick={() => navigate("/sales-orders/new")}>新增</Button>
          <Button onClick={() => openToast(`导出成功，共导出 ${selectedIds.length || filteredRecords.length} 条记录`)}>导出</Button>
        </div>
              </div>

      <div className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, 1520) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                <th className="sticky left-0 z-10 border-b border-r border-line-1 bg-fill-2 px-3" style={getColumnStyle("__select__")}><Checkbox checked={isAllSelected} onChange={(checked) => setSelectedIds(checked ? Array.from(new Set([...selectedIds, ...pageRows.map((row) => row.id)])) : selectedIds.filter((id) => !pageRows.some((row) => row.id === id)))} /></th>
                <ResizableHeaderCell width={getColumnStyle("no").width} minWidth={getColumnStyle("no").minWidth} className="sticky z-10 bg-fill-2" style={{ left: getColumnStyle("__select__").width }} onResizeStart={(clientX) => startResize("no", clientX)}><TableSortHeader label="销售单号" sortKey="no" currentSort={sortConfig} onSort={handleSort} /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("status").width} minWidth={getColumnStyle("status").minWidth} onResizeStart={(clientX) => startResize("status", clientX)}>单据状态</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("customerLabel").width} minWidth={getColumnStyle("customerLabel").minWidth} onResizeStart={(clientX) => startResize("customerLabel", clientX)}>客户</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("warehouseLabel").width} minWidth={getColumnStyle("warehouseLabel").minWidth} onResizeStart={(clientX) => startResize("warehouseLabel", clientX)}>出库仓库</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("orderDate").width} minWidth={getColumnStyle("orderDate").minWidth} onResizeStart={(clientX) => startResize("orderDate", clientX)}>下单日期</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("expectedDate").width} minWidth={getColumnStyle("expectedDate").minWidth} onResizeStart={(clientX) => startResize("expectedDate", clientX)}>预计发货日期</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("totalAmount").width} minWidth={getColumnStyle("totalAmount").minWidth} onResizeStart={(clientX) => startResize("totalAmount", clientX)}><TableSortHeader label="销售总金额" sortKey="totalAmount" currentSort={sortConfig} onSort={handleSort} align="right" /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("updatedAt").width} minWidth={getColumnStyle("updatedAt").minWidth} onResizeStart={(clientX) => startResize("updatedAt", clientX)}>最后修改时间</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? <EmptyStateRow colSpan={10} /> : pageRows.map((record) => (
                <tr key={record.id} className="group h-[44px] border-b border-line-1 text-text-2 hover:bg-hover-bg">
                  <td className="sticky left-0 z-10 border-r border-line-1 bg-white px-3 group-hover:bg-hover-bg" style={getColumnStyle("__select__")}><Checkbox checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id])} /></td>
                  <td className="sticky z-10 border-r border-line-1 bg-white px-4 group-hover:bg-hover-bg" style={{ ...getColumnStyle("no"), left: getColumnStyle("__select__").width }}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-orders/${record.id}`)}>{record.no}</button></td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("status")}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("customerLabel")}>{record.customerLabel}</td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("warehouseLabel")}>{record.warehouseLabel}</td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("orderDate")}>{record.orderDate}</td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("expectedDate")}>{record.expectedDate || "-"}</td>
                  <td className="border-r border-line-1 px-4 text-right" style={getColumnStyle("totalAmount")}>{formatMoney(record.totalAmount)}</td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("updatedAt")}>{record.updatedAt}</td>
                  <td className="px-4" style={getColumnStyle("__actions__")}><div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">{getOrderActions(record.status).map((action) => <TextAction key={action} onClick={() => handleAction(record, action)}>{action}</TextAction>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination total={filteredRecords.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} />
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function SalesStockoutListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<SalesStockoutRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    no: "",
    orderNo: "",
    customer: "",
    warehouse: "",
    status: "全部",
    stockoutDate: { start: "", end: "" },
    updatedAt: { start: "", end: "" },
  });

  useEffect(() => {
    setRecords(getSalesStockouts());
  }, []);

  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("sales-delivery:list:v2", [...stockoutColumns]);

  const filteredRecords = useMemo(() => {
    const noSet = parseBatchInput(filters.no);
    const orderNoSet = parseBatchInput(filters.orderNo);
    return records
      .filter((record) => {
        if (noSet.length > 0 && !noSet.includes(record.no)) return false;
        if (orderNoSet.length > 0 && !orderNoSet.includes(record.orderNo)) return false;
        if (filters.customer && record.customerLabel !== filters.customer) return false;
        if (filters.warehouse && record.warehouseLabel !== filters.warehouse) return false;
        if (filters.status !== "全部" && record.status !== filters.status) return false;
        if (!inDateRange(record.stockoutDate, filters.stockoutDate)) return false;
        if (!inDateRange(record.updatedAt.slice(0, 10), filters.updatedAt)) return false;
        return true;
      })
      .sort((a, b) => compareRecord(a as any, b as any, sortConfig));
  }, [records, filters, sortConfig]);

  const pageRows = useMemo(() => filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredRecords, currentPage, pageSize]);
  const isAllSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.includes(row.id));

  const refresh = () => setRecords(getSalesStockouts());
  const handleSort = (key: string) => setSortConfig((current) => !current || current.key !== key ? { key, direction: "asc" } : current.direction === "asc" ? { key, direction: "desc" } : null);

  const handleAction = (record: SalesStockoutRecord, action: string) => {
    if (action === "查看") return navigate(`/sales-delivery/${record.id}`);
    if (action === "编辑") return navigate(`/sales-delivery/${record.id}/edit`);
    const mapping: Record<string, ConfirmState> = {
      确认出库: {
        title: "确认出库",
        content: "确认出库后库存将立即扣减，且操作不可撤销，确认出库？",
        confirmText: "确认出库",
        onConfirm: () => {
          const saved = confirmSalesStockout(record);
          if (!saved) return openError("关联的销售订单状态异常，无法继续出库");
          openToast("出库成功，库存已扣减");
          setConfirmState(null);
          refresh();
        },
      },
      删除: {
        title: "确认删除",
        content: "删除后不可恢复，该出库单将从系统中永久移除，确认删除？",
        confirmText: "确认删除",
        onConfirm: () => {
          deleteSalesStockout(record.id);
          openToast("销售出库单已删除");
          setConfirmState(null);
          refresh();
        },
      },
    };
    setConfirmState(mapping[action]);
  };

  return (
    <div className="flex flex-col gap-4">
      <SurfaceCard title="查询条件">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <LabeledField label="出库单号"><BatchSearchInput value={filters.no} onChange={(no) => setFilters((current) => ({ ...current, no }))} placeholder="支持换行或英文逗号分隔" /></LabeledField>
          <LabeledField label="关联销售订单"><BatchSearchInput value={filters.orderNo} onChange={(orderNo) => setFilters((current) => ({ ...current, orderNo }))} placeholder="按销售单号批量精确搜索" /></LabeledField>
          <LabeledField label="客户"><Select value={filters.customer} onChange={(customer) => setFilters((current) => ({ ...current, customer }))} options={[...new Set(records.map((item) => item.customerLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="出库仓库"><Select value={filters.warehouse} onChange={(warehouse) => setFilters((current) => ({ ...current, warehouse }))} options={[...new Set(records.map((item) => item.warehouseLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="出库状态"><Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={["全部", "草稿", "已出库", "已作废"]} /></LabeledField>
          <LabeledField label="出库日期"><DateRangeField value={filters.stockoutDate} onChange={(stockoutDate) => setFilters((current) => ({ ...current, stockoutDate }))} /></LabeledField>
          {expanded ? <LabeledField label="最后修改时间"><DateRangeField value={filters.updatedAt} onChange={(updatedAt) => setFilters((current) => ({ ...current, updatedAt }))} /></LabeledField> : null}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={() => setExpanded((current) => !current)}>{expanded ? "收起" : "展开"}</Button>
          <Button onClick={() => { setFilters({ no: "", orderNo: "", customer: "", warehouse: "", status: "全部", stockoutDate: { start: "", end: "" }, updatedAt: { start: "", end: "" } }); setSelectedIds([]); setCurrentPage(1); }}>重置</Button>
          <Button tone="primary" onClick={() => setCurrentPage(1)}>搜索</Button>
        </div>
      </SurfaceCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button tone="primary" onClick={() => navigate("/sales-delivery/new")}>新增</Button>
          <Button onClick={() => openToast(`导出成功，共导出 ${selectedIds.length || filteredRecords.length} 条记录`)}>导出</Button>
        </div>
              </div>

      <div className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, 1560) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                <th className="sticky left-0 z-10 border-b border-r border-line-1 bg-fill-2 px-3" style={getColumnStyle("__select__")}><Checkbox checked={isAllSelected} onChange={(checked) => setSelectedIds(checked ? Array.from(new Set([...selectedIds, ...pageRows.map((row) => row.id)])) : selectedIds.filter((id) => !pageRows.some((row) => row.id === id)))} /></th>
                <ResizableHeaderCell width={getColumnStyle("no").width} minWidth={getColumnStyle("no").minWidth} className="sticky z-10 bg-fill-2" style={{ left: getColumnStyle("__select__").width }} onResizeStart={(clientX) => startResize("no", clientX)}><TableSortHeader label="出库单号" sortKey="no" currentSort={sortConfig} onSort={handleSort} /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("status").width} minWidth={getColumnStyle("status").minWidth} onResizeStart={(clientX) => startResize("status", clientX)}>出库状态</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("orderNo").width} minWidth={getColumnStyle("orderNo").minWidth} onResizeStart={(clientX) => startResize("orderNo", clientX)}>关联销售订单</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("customerLabel").width} minWidth={getColumnStyle("customerLabel").minWidth} onResizeStart={(clientX) => startResize("customerLabel", clientX)}>客户</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("warehouseLabel").width} minWidth={getColumnStyle("warehouseLabel").minWidth} onResizeStart={(clientX) => startResize("warehouseLabel", clientX)}>出库仓库</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("stockoutDate").width} minWidth={getColumnStyle("stockoutDate").minWidth} onResizeStart={(clientX) => startResize("stockoutDate", clientX)}>出库日期</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("totalAmount").width} minWidth={getColumnStyle("totalAmount").minWidth} onResizeStart={(clientX) => startResize("totalAmount", clientX)}><TableSortHeader label="本次出库总金额" sortKey="totalAmount" currentSort={sortConfig} onSort={handleSort} align="right" /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("updatedAt").width} minWidth={getColumnStyle("updatedAt").minWidth} onResizeStart={(clientX) => startResize("updatedAt", clientX)}>最后修改时间</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? <EmptyStateRow colSpan={10} /> : pageRows.map((record) => (
                <tr key={record.id} className="group h-[44px] border-b border-line-1 text-text-2 hover:bg-hover-bg">
                  <td className="sticky left-0 z-10 border-r border-line-1 bg-white px-3 group-hover:bg-hover-bg" style={getColumnStyle("__select__")}><Checkbox checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id])} /></td>
                  <td className="sticky z-10 border-r border-line-1 bg-white px-4 group-hover:bg-hover-bg" style={{ ...getColumnStyle("no"), left: getColumnStyle("__select__").width }}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-delivery/${record.id}`)}>{record.no}</button></td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("status")}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("orderNo")}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-orders/${record.orderId}`)}>{record.orderNo}</button></td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("customerLabel")}>{record.customerLabel}</td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("warehouseLabel")}>{record.warehouseLabel}</td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("stockoutDate")}>{record.stockoutDate}</td>
                  <td className="border-r border-line-1 px-4 text-right" style={getColumnStyle("totalAmount")}>{formatMoney(record.totalAmount)}</td>
                  <td className="border-r border-line-1 px-4" style={getColumnStyle("updatedAt")}>{record.updatedAt}</td>
                  <td className="px-4" style={getColumnStyle("__actions__")}><div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">{getStockoutActions(record.status).map((action) => <TextAction key={action} onClick={() => handleAction(record, action)}>{action}</TextAction>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination total={filteredRecords.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} />
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function SalesOrderCreatePageV2() {
  return <SalesOrderEditorPageV2 mode="create" />;
}

export function SalesOrderEditPageV2() {
  return <SalesOrderEditorPageV2 mode="edit" />;
}

function SalesOrderEditorPageV2({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const source = mode === "create" ? createSalesOrderDraft() : getSalesOrder(orderId);
  const [form, setForm] = useState<SalesOrderRecord | null>(source ? JSON.parse(JSON.stringify(source)) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [warning, setWarning] = useState<string>("");

  useEffect(() => {
    setForm(source ? JSON.parse(JSON.stringify(source)) : null);
    setErrors({});
    setDirty(false);
    setWarning("");
  }, [mode, orderId]);

  if (!form) return <SurfaceCard title="提示">未找到对应销售订单，请返回列表重新进入。</SurfaceCard>;

  const readOnlyBase = mode === "edit" && form.status !== "草稿";
  const summary = summarizeOrder(form.lines);

  const updateField = (key: keyof SalesOrderRecord, value: string) => {
    setDirty(true);
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [String(key)]: "" }));
  };

  const updateLine = (lineId: string, patch: Partial<SalesOrderLine>) => {
    setDirty(true);
    setForm((current) => current ? {
      ...current,
      lines: current.lines.map((line) => line.id === lineId ? {
        ...line,
        ...patch,
        amount: Number((((patch.qty ?? line.qty) || 0) * Number((patch.price ?? line.price) || 0)).toFixed(2)),
      } : line),
    } : current);
  };

  const addLine = () => {
    if (form.lines.length >= 50) return openError("商品明细最多 50 行");
    setDirty(true);
    setForm((current) => current ? {
      ...current,
      lines: [
        ...current.lines,
        {
          id: `line-${Date.now()}`,
          skuCode: "",
          skuName: "",
          spec: "",
          unit: "",
          availableStock: 0,
          qty: 0,
          price: 0,
          taxRate: "",
          discountRate: 100,
          amount: 0,
          shippedQty: 0,
          pendingQty: 0,
          note: "",
        },
      ],
    } : current);
  };

  const removeLine = (lineId: string) => {
    if (form.lines.length <= 1) return openError("至少保留一行商品明细");
    setDirty(true);
    setForm((current) => current ? { ...current, lines: current.lines.filter((line) => line.id !== lineId) } : current);
  };

  const validate = (intent: "draft" | "submit") => {
    const nextErrors: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);
    const stockWarnings = form.lines.filter((line) => Number(line.availableStock || 0) < Number(line.qty || 0) && Number(line.qty || 0) > 0).map((line) => line.skuName || line.skuCode);

    if (intent === "submit") {
      if (!form.customerLabel) nextErrors.customerLabel = "请选择客户";
      if (!form.warehouseLabel) nextErrors.warehouseLabel = "请选择出库仓库";
      if (!form.orderDate) nextErrors.orderDate = "请选择下单日期";
      if (form.orderDate > today) nextErrors.orderDate = "下单日期不能晚于今天";
      if (form.lines.length === 0) openError("商品明细不可为空，请至少添加一行商品");
      form.lines.forEach((line, index) => {
        if (!line.skuCode) nextErrors[`line-${index}-sku`] = "请选择商品";
        if (Number(line.qty || 0) <= 0) nextErrors[`line-${index}-qty`] = "销售数量不可为 0";
        if (Number(line.price || 0) < 0 || Number.isNaN(Number(line.price || 0))) nextErrors[`line-${index}-price`] = "请填写单价";
      });
    } else if (form.orderDate > today) {
      nextErrors.orderDate = "下单日期不能晚于今天";
    }

    setErrors(nextErrors);
    setWarning(stockWarnings.length > 0 ? `以下商品可用库存不足，请确认后再提交：${stockWarnings.join("、")}` : "");
    return nextErrors;
  };

  const persist = (intent: "draft" | "submit") => {
    const nextErrors = validate(intent);
    if (Object.keys(nextErrors).length > 0) return;
    const saved = saveSalesOrder(form, intent);
    if (!saved) return openError("保存失败");
    setDirty(false);
    if (intent === "draft") {
      setForm(saved);
      openToast("保存成功");
    } else {
      openToast("已提交审核，等待审核确认");
      navigate(`/sales-orders/${saved.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={mode === "create" ? "新增销售订单" : `编辑销售订单 ${form.no}`} actions={<div className="flex flex-wrap gap-2"><Button tone="primary" onClick={() => persist("draft")}>保存草稿</Button><Button tone="primary" onClick={() => persist("submit")}>提交审核</Button><Button onClick={() => !dirty ? navigate("/sales-orders") : setConfirmState({ title: "确认离开", content: "当前有未保存的内容，确认离开？", confirmText: "确认离开", onConfirm: () => navigate("/sales-orders") })}>返回列表</Button></div>} />
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="客户" required error={errors.customerLabel}>
            {readOnlyBase ? <ReadonlyValue value={form.customerLabel} /> : <Select value={form.customerLabel} onChange={(customerLabel) => {
              const customer = findCustomer(customerLabel);
              updateField("customerLabel", customerLabel);
              if (customer) {
                updateField("customerCode", customer.code);
                updateField("customerName", customer.name);
                updateField("priceLevel", customer.defaultPriceLevel);
                setForm((current) => current ? { ...current, accountPeriodDays: customer.accountPeriodDays, creditLimit: customer.creditLimit } : current);
              }
            }} options={getCustomerOptions()} allowSearch placeholder="请选择客户" />}
          </LabeledField>
          <LabeledField label="出库仓库" required error={errors.warehouseLabel}>
            {readOnlyBase ? <ReadonlyValue value={form.warehouseLabel} /> : <Select value={form.warehouseLabel} onChange={(warehouseLabel) => {
              const warehouse = findWarehouse(warehouseLabel);
              updateField("warehouseLabel", warehouseLabel);
              if (warehouse) {
                updateField("warehouseCode", warehouse.code);
                updateField("warehouseName", warehouse.name);
              }
            }} options={getWarehouseOptions()} allowSearch placeholder="请选择出库仓库" />}
          </LabeledField>
          <LabeledField label="价格级别">
            {readOnlyBase ? <ReadonlyValue value={form.priceLevel} /> : <Select value={form.priceLevel} onChange={(priceLevel) => {
              updateField("priceLevel", priceLevel);
              openToast("价格级别已修改，商品单价不会自动刷新，如需更新请重新选择商品");
            }} options={salesPriceLevels} />}
          </LabeledField>
          <LabeledField label="账期（天）"><ReadonlyValue value={form.accountPeriodDays ? `${form.accountPeriodDays}天` : "-"} /></LabeledField>
          <LabeledField label="信用额度"><ReadonlyValue value={form.creditLimit ? formatMoney(form.creditLimit) : "-"} /></LabeledField>
          <LabeledField label="下单日期" required error={errors.orderDate}>{readOnlyBase ? <ReadonlyValue value={form.orderDate} /> : <DateField value={form.orderDate} onChange={(value) => updateField("orderDate", value)} />}</LabeledField>
          <LabeledField label="预计发货日期"><DateField value={form.expectedDate} onChange={(value) => updateField("expectedDate", value)} /></LabeledField>
          <LabeledField label="销售备注" className="md:col-span-2 xl:col-span-4"><TextArea value={form.remark} onChange={(value) => updateField("remark", value)} maxLength={200} placeholder="请输入销售备注（选填）" /></LabeledField>
        </div>
      </SurfaceCard>

      {warning ? <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-[13px] text-warning">{warning}</div> : null}

      <SurfaceCard title="商品明细" extra={`共 ${summary.skuCount} 种商品 | 总金额 ${formatMoney(summary.totalAmount)}`}>
        <div className="mb-3 flex justify-between">
          <Button tone="primary" onClick={addLine}>新增商品行</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1620px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">{["序号", "商品", "规格型号", "单位", "可用库存", "销售数量", "单价（含税）", "税率", "折扣率", "金额（含税）", "行备注", "操作"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr>
            </thead>
            <tbody>
              {form.lines.map((line, index) => (
                <tr key={line.id} className="border-b border-line-1">
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    {readOnlyBase ? <ReadonlyValue value={`${line.skuCode} ${line.skuName}`.trim()} /> : <>
                      <Select value={line.skuCode ? `${line.skuCode} ${line.skuName}` : ""} onChange={(option) => {
                        const product = findProduct(option);
                        if (!product) return;
                        updateLine(line.id, {
                          skuCode: product.code,
                          skuName: product.name,
                          spec: product.spec,
                          unit: product.unit,
                          availableStock: product.availableStock,
                          price: getPriceForLevel(product.code, form.priceLevel as PriceLevel),
                          taxRate: product.taxRate,
                        });
                      }} options={getProductOptions()} allowSearch placeholder="请选择商品" />
                      {errors[`line-${index}-sku`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-sku`]}</div> : null}
                    </>}
                  </td>
                  <td className="px-3 py-2.5"><ReadonlyValue value={line.spec || "-"} /></td>
                  <td className="px-3 py-2.5"><ReadonlyValue value={line.unit || "-"} /></td>
                  <td className={cn("px-3 py-2.5 text-right", Number(line.availableStock || 0) < Number(line.qty || 0) && "font-medium text-warning")}>{line.availableStock || "-"}</td>
                  <td className="px-3 py-2.5">{readOnlyBase ? <ReadonlyValue value={String(line.qty || 0)} /> : <><Input value={String(line.qty || "")} onChange={(value) => updateLine(line.id, { qty: Number(value) || 0 })} className="text-right" />{errors[`line-${index}-qty`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-qty`]}</div> : null}</>}</td>
                  <td className="px-3 py-2.5">{readOnlyBase ? <ReadonlyValue value={formatMoney(line.price || 0)} /> : <><Input value={String(line.price || "")} onChange={(value) => updateLine(line.id, { price: Number(value) || 0 })} className="text-right" />{errors[`line-${index}-price`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-price`]}</div> : null}</>}</td>
                  <td className="px-3 py-2.5">{readOnlyBase ? <ReadonlyValue value={line.taxRate || "-"} /> : <Select value={line.taxRate} onChange={(taxRate) => updateLine(line.id, { taxRate })} options={salesTaxRates} placeholder="请选择税率" />}</td>
                  <td className="px-3 py-2.5">{readOnlyBase ? <ReadonlyValue value={`${line.discountRate || 100}%`} /> : <Input value={String(line.discountRate || 100)} onChange={(value) => updateLine(line.id, { discountRate: Number(value) || 100 })} className="text-right" />}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(line.amount || 0)}</td>
                  <td className="px-3 py-2.5"><Input value={line.note} onChange={(value) => updateLine(line.id, { note: value })} readOnly={readOnlyBase} placeholder="行备注（选填）" /></td>
                  <td className="px-3 py-2.5 text-center">{readOnlyBase ? <span className="text-text-3">-</span> : <TextAction onClick={() => removeLine(line.id)}>删除</TextAction>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-100"><tr className="h-[42px] font-semibold text-text-1"><td colSpan={12} className="px-4">共 {summary.skuCount} 种商品 | 合计：{summary.totalQty} 件 | {formatMoney(summary.totalAmount)}</td></tr></tfoot>
          </table>
        </div>
      </SurfaceCard>
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

function summarizeOrder(lines: SalesOrderLine[]) {
  return {
    skuCount: lines.length,
    totalQty: lines.reduce((sum, line) => sum + Number(line.qty || 0), 0),
    totalAmount: Number(lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
  };
}

export function SalesStockoutCreatePageV2() {
  return <SalesStockoutEditorPageV2 mode="create" />;
}

export function SalesStockoutEditPageV2() {
  return <SalesStockoutEditorPageV2 mode="edit" />;
}

function SalesStockoutEditorPageV2({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const source = mode === "create" ? createSalesStockoutDraft(searchParams.get("orderId") ?? "") : getSalesStockout(recordId);
  const [form, setForm] = useState<SalesStockoutRecord | null>(source ? JSON.parse(JSON.stringify(source)) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const orderOptions = getStockoutSourceOrders();

  useEffect(() => {
    setForm(source ? JSON.parse(JSON.stringify(source)) : null);
    setErrors({});
    setDirty(false);
  }, [mode, recordId, searchParams]);

  if (!form) return <SurfaceCard title="提示">未找到对应销售出库单，请返回列表重新进入。</SurfaceCard>;

  const totalQty = form.lines.reduce((sum, line) => sum + Number(line.stockoutQty || 0), 0);
  const totalAmount = form.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const updateField = (key: keyof SalesStockoutRecord, value: string) => {
    setDirty(true);
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [String(key)]: "" }));
  };

  const updateLine = (lineId: string, patch: Partial<SalesStockoutLine>) => {
    setDirty(true);
    setForm((current) => current ? {
      ...current,
      lines: current.lines.map((line) => line.id === lineId ? { ...line, ...patch, amount: Number((((patch.stockoutQty ?? line.stockoutQty) || 0) * Number(line.price || 0)).toFixed(2)) } : line),
    } : current);
  };

  const selectOrder = (orderId: string) => {
    const order = orderOptions.find((item) => item.id === orderId);
    if (!order) return;
    const apply = () => {
      setDirty(true);
      setForm((current) => current ? { ...current, orderId: order.id, orderNo: order.no, customerLabel: order.customerLabel, warehouseLabel: order.warehouseLabel, lines: buildStockoutLinesFromOrder(order) } : current);
      setConfirmState(null);
    };
    if (form.lines.some((line) => line.stockoutQty > 0 || line.note)) {
      return setConfirmState({ title: "重新选择销售订单", content: "重新选择将清空当前明细，确认继续？", confirmText: "确认", onConfirm: apply });
    }
    apply();
  };

  const validate = (intent: "draft" | "confirm") => {
    const nextErrors: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);
    if (intent === "confirm") {
      if (!form.orderId) nextErrors.orderId = "请选择关联销售订单";
      if (!form.stockoutDate) nextErrors.stockoutDate = "请选择出库日期";
      if (form.stockoutDate > today) nextErrors.stockoutDate = "出库日期不能晚于今天";
      if (!form.lines.some((line) => Number(line.stockoutQty || 0) > 0)) openError("请至少填写一行出库数量");
      form.lines.forEach((line, index) => {
        if (Number(line.stockoutQty || 0) > Number(line.pendingQty || 0)) nextErrors[`line-${index}-qty`] = `出库数量不能超过未出库数量（${line.pendingQty} 件）`;
      });
    } else if (form.stockoutDate > today) {
      nextErrors.stockoutDate = "出库日期不能晚于今天";
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const saveDraft = () => {
    const nextErrors = validate("draft");
    if (Object.keys(nextErrors).length > 0) return;
    const saved = saveSalesStockout(form);
    if (!saved) return openError("保存失败");
    setDirty(false);
    setForm(saved);
    openToast("保存成功");
  };

  const doConfirm = () => {
    const nextErrors = validate("confirm");
    if (Object.keys(nextErrors).length > 0) return;
    setConfirmState({
      title: "确认出库",
      content: "确认出库后库存将立即扣减，且操作不可撤销，确认出库？",
      confirmText: "确认出库",
      onConfirm: () => {
        const saved = confirmSalesStockout(form);
        if (!saved) return openError("关联的销售订单状态异常，无法继续出库");
        setConfirmState(null);
        setDirty(false);
        openToast("出库成功，库存已扣减");
        navigate(`/sales-delivery/${saved.id}`);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={mode === "create" ? "新增销售出库单" : `编辑销售出库单 ${form.no}`} actions={<div className="flex flex-wrap gap-2"><Button tone="primary" onClick={saveDraft}>保存草稿</Button><Button tone="primary" onClick={doConfirm}>确认出库</Button><Button onClick={() => !dirty ? navigate("/sales-delivery") : setConfirmState({ title: "确认离开", content: "当前有未保存的内容，确认离开？", confirmText: "确认离开", onConfirm: () => navigate("/sales-delivery") })}>返回列表</Button></div>} />
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="关联销售订单" required error={errors.orderId}>{mode === "edit" ? <ReadonlyValue value={form.orderNo} /> : <Select value={form.orderNo} onChange={(orderNo) => { const order = orderOptions.find((item) => item.no === orderNo); if (order) selectOrder(order.id); }} options={orderOptions.map((item) => item.no)} allowSearch placeholder="请选择关联销售订单" />}</LabeledField>
          <LabeledField label="客户"><ReadonlyValue value={form.customerLabel || "-"} /></LabeledField>
          <LabeledField label="出库仓库"><ReadonlyValue value={form.warehouseLabel || "-"} /></LabeledField>
          <LabeledField label="出库日期" required error={errors.stockoutDate}><DateField value={form.stockoutDate} onChange={(value) => updateField("stockoutDate", value)} /></LabeledField>
          <LabeledField label="出库备注" className="md:col-span-2 xl:col-span-4"><TextArea value={form.remark} onChange={(value) => updateField("remark", value)} maxLength={200} placeholder="请输入出库备注（选填）" /></LabeledField>
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`本次出库 ${totalQty} 件 | 总金额 ${formatMoney(totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="min-w-[1460px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["序号", "商品", "规格型号", "单位", "订单数量", "未出库数量", "本次出库数量", "单价（含税）", "出库金额", "异常备注"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead>
            <tbody>
              {form.lines.map((line, index) => {
                const disabled = line.pendingQty === 0;
                return (
                  <tr key={line.id} className={cn("border-b border-line-1", disabled && "bg-fill-2 text-text-3")}>
                    <td className="px-3 py-2.5">{index + 1}</td>
                    <td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td>
                    <td className="px-3 py-2.5">{line.spec || "-"}</td>
                    <td className="px-3 py-2.5">{line.unit || "-"}</td>
                    <td className="px-3 py-2.5 text-right">{line.orderQty}</td>
                    <td className="px-3 py-2.5 text-right text-warning">{line.pendingQty}</td>
                    <td className="px-3 py-2.5"><Input value={String(line.stockoutQty || 0)} onChange={(value) => updateLine(line.id, { stockoutQty: Number(value) || 0 })} className="text-right" readOnly={disabled} />{errors[`line-${index}-qty`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-qty`]}</div> : null}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(line.price)}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(line.amount)}</td>
                    <td className="px-3 py-2.5"><Input value={line.note} onChange={(value) => updateLine(line.id, { note: value })} readOnly={disabled} placeholder="异常备注（如少发/替换说明，选填）" /></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-zinc-100"><tr className="h-[42px] font-semibold text-text-1"><td colSpan={10} className="px-4">本次出库合计：{totalQty} 件 | {formatMoney(totalAmount)}</td></tr></tfoot>
          </table>
        </div>
      </SurfaceCard>
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function SalesOrderDetailPageV2() {
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const record = getSalesOrder(orderId);
  if (!record) return <SurfaceCard title="提示">未找到对应销售订单，请返回列表重新进入。</SurfaceCard>;

  const linkedStockouts = getLinkedSalesStockouts(record.id);
  const showProgressCols = record.status === "待出库" || record.status === "部分出库" || record.status === "已完成";

  const detailActions = (() => {
    switch (record.status) {
      case "草稿":
        return ["编辑", "删除", "提交审核"];
      case "待审核":
        return ["审核通过", "驳回", "作废"];
      case "待出库":
        return ["创建出库单", "作废"];
      case "部分出库":
        return ["创建出库单", "关闭订单"];
      default:
        return [];
    }
  })();

  const openAction = (action: string) => {
    if (action === "编辑") return navigate(`/sales-orders/${record.id}/edit`);
    if (action === "创建出库单") return navigate(`/sales-delivery/new?orderId=${record.id}`);
    const mapping: Record<string, ConfirmState> = {
      删除: { title: "确认删除", content: "删除后不可恢复，该销售订单将从系统中永久移除，确认删除？", confirmText: "确认删除", onConfirm: () => { deleteSalesOrder(record.id); openToast("销售订单已删除"); navigate("/sales-orders"); } },
      提交审核: { title: "提交审核", content: "提交后单据将进入待审核状态，确认提交？", confirmText: "确认提交", onConfirm: () => { const saved = saveSalesOrder(record, "submit"); if (!saved) return openError("提交失败"); openToast("已提交审核，等待审核确认"); navigate(`/sales-orders/${record.id}`); } },
      审核通过: { title: "确认审核", content: "审核通过后关键字段将锁定并占用库存，不可再修改，确认审核通过？", confirmText: "确认审核", onConfirm: () => { approveSalesOrder(record.id); openToast("审核通过，库存已占用"); navigate(`/sales-orders/${record.id}`); } },
      驳回: { title: "确认驳回", content: "驳回后单据将退回草稿，内勤可重新修改，确认驳回？", confirmText: "确认驳回", onConfirm: () => { rejectSalesOrder(record.id); openToast("已驳回，单据已退回草稿"); navigate(`/sales-orders/${record.id}`); } },
      作废: { title: "确认作废", content: "作废后不可恢复，单据将进入已作废状态，确认作废？", confirmText: "确认作废", onConfirm: () => { voidSalesOrder(record.id); openToast("销售订单已作废"); navigate(`/sales-orders/${record.id}`); } },
      关闭订单: { title: "确认关闭", content: "关闭后剩余未出库数量将不再发货，占用库存将释放，确认关闭订单？", confirmText: "确认关闭", onConfirm: () => { closeSalesOrder(record.id); openToast("订单已关闭，剩余占用库存已释放"); navigate(`/sales-orders/${record.id}`); } },
    };
    setConfirmState(mapping[action]);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={`销售订单 ${record.no}`} actions={<div className="flex flex-wrap gap-2"><Button onClick={() => navigate("/sales-orders")}>返回列表</Button>{detailActions.map((action) => <Button key={action} tone={action === "创建出库单" ? "primary" : "default"} onClick={() => openAction(action)}>{action}</Button>)}</div>}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></PageTitle>
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="销售单号" value={record.no} />
          <DetailValue label="客户" value={record.customerLabel} />
          <DetailValue label="出库仓库" value={record.warehouseLabel} />
          <DetailValue label="价格级别" value={record.priceLevel} />
          <DetailValue label="账期（天）" value={record.accountPeriodDays ? `${record.accountPeriodDays}天` : "-"} />
          <DetailValue label="信用额度" value={record.creditLimit ? formatMoney(record.creditLimit) : "-"} />
          <DetailValue label="下单日期" value={record.orderDate} />
          <DetailValue label="预计发货日期" value={record.expectedDate || "-"} />
          <DetailValue label="销售备注" value={record.remark || "-"} className="xl:col-span-4" />
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`共 ${record.skuCount} 种商品 | 总金额 ${formatMoney(record.totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="min-w-[1560px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">
                {(showProgressCols
                  ? ["序号", "商品", "规格型号", "单位", "销售数量", "累计已出库数量", "未出库数量", "单价（含税）", "金额（含税）", "行备注"]
                  : ["序号", "商品", "规格型号", "单位", "销售数量", "单价（含税）", "税率", "折扣率", "金额（含税）", "行备注"]
                ).map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {record.lines.map((line, index) => (
                <tr key={line.id} className="border-b border-line-1">
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td>
                  <td className="px-3 py-2.5">{line.spec || "-"}</td>
                  <td className="px-3 py-2.5">{line.unit || "-"}</td>
                  <td className="px-3 py-2.5">{line.qty}</td>
                  {showProgressCols ? <>
                    <td className={cn("px-3 py-2.5", record.status === "已完成" && "text-success")}>{line.shippedQty}</td>
                    <td className={cn("px-3 py-2.5", line.pendingQty > 0 && "text-warning")}>{line.pendingQty}</td>
                    <td className="px-3 py-2.5">{formatMoney(line.price)}</td>
                    <td className="px-3 py-2.5">{formatMoney(line.amount)}</td>
                  </> : <>
                    <td className="px-3 py-2.5">{formatMoney(line.price)}</td>
                    <td className="px-3 py-2.5">{line.taxRate || "-"}</td>
                    <td className="px-3 py-2.5">{line.discountRate || 100}%</td>
                    <td className="px-3 py-2.5">{formatMoney(line.amount)}</td>
                  </>}
                  <td className="px-3 py-2.5">{line.note || "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-100"><tr className="h-[42px] font-semibold text-text-1"><td colSpan={10} className="px-4">共 {record.skuCount} 种商品 | 合计 {record.totalQty} 件 | 已出库 {record.shippedTotalQty} 件 | 待出库 {record.pendingTotalQty} 件 | {formatMoney(record.totalAmount)}</td></tr></tfoot>
          </table>
        </div>
      </SurfaceCard>
      {showProgressCols ? (
        <SurfaceCard title="关联出库单">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["出库单号", "出库日期", "本次出库数量", "确认出库人", "出库状态"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead>
              <tbody>{linkedStockouts.map((doc) => <tr key={doc.id} className="border-b border-line-1"><td className="px-3 py-2.5"><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-delivery/${doc.id}`)}>{doc.no}</button></td><td className="px-3 py-2.5">{doc.status === "草稿" ? "-" : doc.stockoutDate}</td><td className={cn("px-3 py-2.5", doc.status === "草稿" && "text-text-3")}>{doc.totalQty}</td><td className="px-3 py-2.5">{doc.confirmBy || "-"}</td><td className="px-3 py-2.5"><StatusPill tone={doc.statusTone}>{doc.status}</StatusPill></td></tr>)}</tbody>
            </table>
          </div>
        </SurfaceCard>
      ) : null}
      <SurfaceCard title="制单信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="创建人" value={record.createdBy} />
          <DetailValue label="创建时间" value={record.createdAt} />
          <DetailValue label="最后修改人" value={record.updatedBy || "-"} />
          <DetailValue label="最后修改时间" value={record.updatedAt || "-"} />
          <DetailValue label="审核人" value={record.auditBy || "-"} />
          <DetailValue label="审核时间" value={record.auditAt || "-"} />
        </div>
      </SurfaceCard>
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function SalesStockoutDetailPageV2() {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const record = getSalesStockout(recordId);
  if (!record) return <SurfaceCard title="提示">未找到对应销售出库单，请返回列表重新进入。</SurfaceCard>;

  const openAction = (action: string) => {
    if (action === "编辑") return navigate(`/sales-delivery/${record.id}/edit`);
    if (action === "联查销售订单") return navigate(`/sales-orders/${record.orderId}`);
    const mapping: Record<string, ConfirmState> = {
      删除: { title: "确认删除", content: "删除后不可恢复，该出库单将从系统中永久移除，确认删除？", confirmText: "确认删除", onConfirm: () => { deleteSalesStockout(record.id); openToast("销售出库单已删除"); navigate("/sales-delivery"); } },
      确认出库: { title: "确认出库", content: "确认出库后库存将立即扣减，且操作不可撤销，确认出库？", confirmText: "确认出库", onConfirm: () => { const saved = confirmSalesStockout(record); if (!saved) return openError("关联的销售订单状态异常，无法继续出库"); openToast("出库成功，库存已扣减"); navigate(`/sales-delivery/${record.id}`); } },
    };
    setConfirmState(mapping[action]);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={`销售出库单 ${record.no}`} actions={<div className="flex flex-wrap gap-2"><Button onClick={() => navigate("/sales-delivery")}>返回列表</Button>{record.status === "草稿" ? <><Button onClick={() => openAction("编辑")}>编辑</Button><Button onClick={() => openAction("删除")}>删除</Button><Button tone="primary" onClick={() => openAction("确认出库")}>确认出库</Button></> : null}<Button onClick={() => openAction("联查销售订单")}>联查销售订单</Button></div>}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></PageTitle>
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="出库单号" value={record.no} />
          <DetailValue label="关联销售订单" value={<button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-orders/${record.orderId}`)}>{record.orderNo}</button>} />
          <DetailValue label="客户" value={record.customerLabel} />
          <DetailValue label="出库仓库" value={record.warehouseLabel} />
          <DetailValue label="出库日期" value={record.stockoutDate} />
          <DetailValue label="出库备注" value={record.remark || "-"} className="xl:col-span-3" />
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`本次出库 ${record.totalQty} 件 | 总金额 ${formatMoney(record.totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="min-w-[1420px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["序号", "商品", "规格型号", "单位", "订单数量", "本次出库数量", "单价（含税）", "出库金额", "异常备注"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead>
            <tbody>{record.lines.map((line, index) => <tr key={line.id} className="border-b border-line-1"><td className="px-3 py-2.5">{index + 1}</td><td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td><td className="px-3 py-2.5">{line.spec || "-"}</td><td className="px-3 py-2.5">{line.unit || "-"}</td><td className="px-3 py-2.5">{line.orderQty}</td><td className="px-3 py-2.5 font-medium">{line.stockoutQty}</td><td className="px-3 py-2.5">{formatMoney(line.price)}</td><td className="px-3 py-2.5">{formatMoney(line.amount)}</td><td className="px-3 py-2.5">{line.note || "-"}</td></tr>)}</tbody>
          </table>
        </div>
      </SurfaceCard>
      <SurfaceCard title="制单信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="创建人" value={record.createdBy} />
          <DetailValue label="创建时间" value={record.createdAt} />
          <DetailValue label="最后修改人" value={record.updatedBy || "-"} />
          <DetailValue label="最后修改时间" value={record.updatedAt || "-"} />
          <DetailValue label="确认出库人" value={record.confirmBy || "-"} />
          <DetailValue label="确认出库时间" value={record.confirmAt || "-"} />
        </div>
      </SurfaceCard>
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

function DetailValue({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return <div className={className}><div className="text-[13px] text-text-3">{label}</div><div className="mt-1 text-[14px] text-text-1">{value}</div></div>;
}
