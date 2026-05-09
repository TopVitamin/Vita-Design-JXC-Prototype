import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BatchSearchInput, Button, Checkbox, DateField, DateRangeField, Input, Message, PageTitle, Pagination, ResizableHeaderCell, Select, StatusPill, TableSortHeader, TextArea, useResizableColumns } from "../components/Ui";
import { cn } from "../utils/cn";
import { compareRecord } from "../utils/sort";
import {
  approveSalesReturn,
  buildSalesReturnInboundLinesFromReturn,
  buildSalesReturnLinesFromStockout,
  confirmSalesReturnInbound,
  createSalesReturnDraft,
  createSalesReturnInboundDraft,
  deleteSalesReturn,
  deleteSalesReturnInbound,
  getLinkedSalesReturnInbounds,
  getSalesReturn,
  getSalesReturnInbound,
  getSalesReturnInbounds,
  getSalesReturnInboundSourceReturns,
  getSalesReturnSourceStockouts,
  getSalesReturns,
  salesReturnReasonOptions,
  saveSalesReturn,
  saveSalesReturnInbound,
  type SalesReturnInboundLine,
  type SalesReturnInboundRecord,
  type SalesReturnLine,
  type SalesReturnRecord,
  type SalesReturnStatus,
  rejectSalesReturn,
  voidSalesReturn,
} from "../data/salesReturnWorkspace";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;
type ConfirmState = { title: string; content: string; confirmText: string; onConfirm: () => void };

const returnColumns = [
  { key: "__select__", width: 48, minWidth: 48, maxWidth: 48, resizable: false },
  { key: "no", width: 180, minWidth: 180 },
  { key: "status", width: 100, minWidth: 100 },
  { key: "stockoutNo", width: 190, minWidth: 190 },
  { key: "customerLabel", width: 220, minWidth: 200 },
  { key: "warehouseLabel", width: 170, minWidth: 160 },
  { key: "returnDate", width: 120, minWidth: 120 },
  { key: "totalAmount", width: 140, minWidth: 140 },
  { key: "updatedAt", width: 170, minWidth: 170 },
  { key: "__actions__", width: 200, minWidth: 180, resizable: false },
] as const;

const inboundColumns = [
  { key: "__select__", width: 48, minWidth: 48, maxWidth: 48, resizable: false },
  { key: "no", width: 190, minWidth: 190 },
  { key: "status", width: 90, minWidth: 90 },
  { key: "returnNo", width: 190, minWidth: 190 },
  { key: "customerLabel", width: 220, minWidth: 200 },
  { key: "warehouseLabel", width: 170, minWidth: 160 },
  { key: "inboundDate", width: 120, minWidth: 120 },
  { key: "totalAmount", width: 140, minWidth: 140 },
  { key: "updatedAt", width: 170, minWidth: 170 },
  { key: "__actions__", width: 180, minWidth: 160, resizable: false },
] as const;

function openToast(text: string) { Message.success(text, 2200); }
function openError(text: string) { Message.error(text, 2800); }
function formatMoney(value: number) { return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function parseBatchInput(value: string) { return value.split(/[\n,，]/).map((item) => item.trim()).filter(Boolean); }
function inDateRange(value: string, range: { start: string; end: string }) { if (range.start && value < range.start) return false; if (range.end && value > range.end) return false; return true; }

function SurfaceCard({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return <section className="rounded-lg border border-line-1 bg-white shadow-soft"><div className="flex items-center justify-between border-b border-line-1 px-4 py-3"><div className="text-[15px] font-semibold text-text-1">{title}</div>{extra ? <div className="text-[13px] text-text-2">{extra}</div> : null}</div><div className="px-4 py-4">{children}</div></section>;
}
function LabeledField({ label, required = false, error, className, children }: { label: string; required?: boolean; error?: string; className?: string; children: ReactNode }) {
  return <div className={className}><div className="mb-1.5 text-[13px] text-text-2">{label}{required ? <span className="ml-0.5 text-danger">*</span> : null}</div>{children}{error ? <div className="mt-1 text-xs text-danger">{error}</div> : null}</div>;
}
function ReadonlyValue({ value, className }: { value: string; className?: string }) {
  return <div className={cn("flex min-h-8 items-center rounded-md border border-line-1 bg-fill-2 px-3 text-[13px] text-text-2", className)}>{value || "-"}</div>;
}
function ConfirmModal({ state, onCancel }: { state: ConfirmState | null; onCancel: () => void }) {
  if (!state) return null;
  return <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/35 px-4"><div className="w-full max-w-[420px] rounded-lg border border-line-1 bg-white shadow-drawer"><div className="border-b border-line-1 px-5 py-4 text-[15px] font-semibold text-text-1">{state.title}</div><div className="px-5 py-4 text-[14px] leading-6 text-text-2">{state.content}</div><div className="flex justify-end gap-2 border-t border-line-1 px-5 py-4"><Button onClick={onCancel}>取消</Button><Button tone="primary" onClick={state.onConfirm}>{state.confirmText}</Button></div></div></div>;
}
function EmptyStateRow({ colSpan }: { colSpan: number }) { return <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-[13px] text-text-3">暂无数据</td></tr>; }
function TextAction({ children, onClick }: { children: string; onClick: () => void }) { return <button type="button" className="text-[13px] text-brand-6 transition hover:text-brand-7" onClick={onClick}>{children}</button>; }

function getReturnActions(status: SalesReturnStatus) {
  switch (status) {
    case "草稿": return ["查看", "编辑", "提交审核", "删除"];
    case "待审核": return ["查看", "审核", "驳回", "作废"];
    case "待入库": return ["查看", "创建退货入库单", "作废"];
    case "部分入库": return ["查看", "创建退货入库单"];
    default: return ["查看"];
  }
}

function getInboundActions(status: SalesReturnInboundRecord["status"]) {
  return status === "草稿" ? ["查看", "编辑", "确认入库", "删除"] : ["查看"];
}

export function SalesReturnListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<SalesReturnRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [expanded, setExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({ no: "", stockoutNo: "", customer: "", warehouse: "", status: "全部", returnDate: { start: "", end: "" }, updatedAt: { start: "", end: "" } });

  useEffect(() => { setRecords(getSalesReturns()); }, []);

  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("sales-return:list:v2", [...returnColumns]);
  const filteredRecords = useMemo(() => {
    const noSet = parseBatchInput(filters.no);
    const stockoutSet = parseBatchInput(filters.stockoutNo);
    return records.filter((record) => {
      if (noSet.length > 0 && !noSet.includes(record.no)) return false;
      if (stockoutSet.length > 0 && !stockoutSet.includes(record.stockoutNo)) return false;
      if (filters.customer && record.customerLabel !== filters.customer) return false;
      if (filters.warehouse && record.warehouseLabel !== filters.warehouse) return false;
      if (filters.status !== "全部" && record.status !== filters.status) return false;
      if (!inDateRange(record.returnDate, filters.returnDate)) return false;
      if (!inDateRange(record.updatedAt.slice(0, 10), filters.updatedAt)) return false;
      return true;
    }).sort((a, b) => compareRecord(a as any, b as any, sortConfig));
  }, [records, filters, sortConfig]);
  const pageRows = useMemo(() => filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredRecords, currentPage, pageSize]);
  const isAllSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.includes(row.id));
  const refresh = () => setRecords(getSalesReturns());
  const handleSort = (key: string) => setSortConfig((current) => !current || current.key !== key ? { key, direction: "asc" } : current.direction === "asc" ? { key, direction: "desc" } : null);

  const handleAction = (record: SalesReturnRecord, action: string) => {
    if (action === "查看") return navigate(`/sales-return/${record.id}`);
    if (action === "编辑") return navigate(`/sales-return/${record.id}/edit`);
    if (action === "创建退货入库单") return navigate(`/sales-return-inbound/new?returnId=${record.id}`);
    const mapping: Record<string, ConfirmState> = {
      删除: { title: "确认删除", content: "删除后不可恢复，该销售退货单将从系统中永久移除，确认删除？", confirmText: "确认删除", onConfirm: () => { deleteSalesReturn(record.id); openToast("销售退货单已删除"); setConfirmState(null); refresh(); } },
      提交审核: { title: "提交审核", content: "提交后单据将进入待审核状态，确认提交？", confirmText: "确认提交", onConfirm: () => { const saved = saveSalesReturn(record, "submit"); if (!saved) return openError("提交失败"); openToast("已提交审核，等待审核确认"); setConfirmState(null); refresh(); } },
      审核: { title: "确认审核", content: "审核通过后关键字段将锁定，不可再修改，确认审核通过？", confirmText: "确认审核", onConfirm: () => { approveSalesReturn(record.id); openToast("审核通过"); setConfirmState(null); refresh(); } },
      驳回: { title: "确认驳回", content: "驳回后单据将退回草稿，内勤可重新修改，确认驳回？", confirmText: "确认驳回", onConfirm: () => { rejectSalesReturn(record.id); openToast("已驳回，单据已退回草稿"); setConfirmState(null); refresh(); } },
      作废: { title: "确认作废", content: "作废后不可恢复，单据将进入已作废状态，确认作废？", confirmText: "确认作废", onConfirm: () => { voidSalesReturn(record.id); openToast("销售退货单已作废"); setConfirmState(null); refresh(); } },
    };
    setConfirmState(mapping[action]);
  };

  return (
    <div className="flex flex-col gap-4">
      <SurfaceCard title="查询条件">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <LabeledField label="退货单号"><BatchSearchInput value={filters.no} onChange={(no) => setFilters((current) => ({ ...current, no }))} placeholder="支持换行或英文逗号分隔" /></LabeledField>
          <LabeledField label="原销售出库单"><BatchSearchInput value={filters.stockoutNo} onChange={(stockoutNo) => setFilters((current) => ({ ...current, stockoutNo }))} placeholder="按出库单号批量精确搜索" /></LabeledField>
          <LabeledField label="客户"><Select value={filters.customer} onChange={(customer) => setFilters((current) => ({ ...current, customer }))} options={[...new Set(records.map((item) => item.customerLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="退回仓库"><Select value={filters.warehouse} onChange={(warehouse) => setFilters((current) => ({ ...current, warehouse }))} options={[...new Set(records.map((item) => item.warehouseLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="单据状态"><Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={["全部", "草稿", "待审核", "待入库", "部分入库", "已完成", "已作废"]} /></LabeledField>
          <LabeledField label="申请日期"><DateRangeField value={filters.returnDate} onChange={(returnDate) => setFilters((current) => ({ ...current, returnDate }))} /></LabeledField>
          {expanded ? <LabeledField label="最后修改时间"><DateRangeField value={filters.updatedAt} onChange={(updatedAt) => setFilters((current) => ({ ...current, updatedAt }))} /></LabeledField> : null}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={() => setExpanded((current) => !current)}>{expanded ? "收起" : "展开"}</Button>
          <Button onClick={() => { setFilters({ no: "", stockoutNo: "", customer: "", warehouse: "", status: "全部", returnDate: { start: "", end: "" }, updatedAt: { start: "", end: "" } }); setSelectedIds([]); setCurrentPage(1); }}>重置</Button>
          <Button tone="primary" onClick={() => setCurrentPage(1)}>搜索</Button>
        </div>
      </SurfaceCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2"><Button tone="primary" onClick={() => navigate("/sales-return/new")}>新增</Button><Button onClick={() => openToast(`导出成功，共导出 ${selectedIds.length || filteredRecords.length} 条记录`)}>导出</Button></div>
              </div>
      <div className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft"><div ref={containerRef} className="overflow-x-auto"><table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, 1560) }}>
        <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[44px]"><th className="sticky left-0 z-10 border-b border-r border-line-1 bg-fill-2 px-3" style={getColumnStyle("__select__")}><Checkbox checked={isAllSelected} onChange={(checked) => setSelectedIds(checked ? Array.from(new Set([...selectedIds, ...pageRows.map((row) => row.id)])) : selectedIds.filter((id) => !pageRows.some((row) => row.id === id)))} /></th><ResizableHeaderCell width={getColumnStyle("no").width} minWidth={getColumnStyle("no").minWidth} className="sticky z-10 bg-fill-2" style={{ left: getColumnStyle("__select__").width }} onResizeStart={(clientX) => startResize("no", clientX)}><TableSortHeader label="退货单号" sortKey="no" currentSort={sortConfig} onSort={handleSort} /></ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("status").width} minWidth={getColumnStyle("status").minWidth} onResizeStart={(clientX) => startResize("status", clientX)}>单据状态</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("stockoutNo").width} minWidth={getColumnStyle("stockoutNo").minWidth} onResizeStart={(clientX) => startResize("stockoutNo", clientX)}>原销售出库单</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("customerLabel").width} minWidth={getColumnStyle("customerLabel").minWidth} onResizeStart={(clientX) => startResize("customerLabel", clientX)}>客户</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("warehouseLabel").width} minWidth={getColumnStyle("warehouseLabel").minWidth} onResizeStart={(clientX) => startResize("warehouseLabel", clientX)}>退回仓库</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("returnDate").width} minWidth={getColumnStyle("returnDate").minWidth} onResizeStart={(clientX) => startResize("returnDate", clientX)}>申请日期</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("totalAmount").width} minWidth={getColumnStyle("totalAmount").minWidth} onResizeStart={(clientX) => startResize("totalAmount", clientX)}><TableSortHeader label="退货总金额" sortKey="totalAmount" currentSort={sortConfig} onSort={handleSort} align="right" /></ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("updatedAt").width} minWidth={getColumnStyle("updatedAt").minWidth} onResizeStart={(clientX) => startResize("updatedAt", clientX)}>最后修改时间</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell></tr></thead>
        <tbody>{pageRows.length === 0 ? <EmptyStateRow colSpan={10} /> : pageRows.map((record) => <tr key={record.id} className="group h-[44px] border-b border-line-1 text-text-2 hover:bg-hover-bg"><td className="sticky left-0 z-10 border-r border-line-1 bg-white px-3 group-hover:bg-hover-bg" style={getColumnStyle("__select__")}><Checkbox checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id])} /></td><td className="sticky z-10 border-r border-line-1 bg-white px-4 group-hover:bg-hover-bg" style={{ ...getColumnStyle("no"), left: getColumnStyle("__select__").width }}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-return/${record.id}`)}>{record.no}</button></td><td className="border-r border-line-1 px-4" style={getColumnStyle("status")}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></td><td className="border-r border-line-1 px-4" style={getColumnStyle("stockoutNo")}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-delivery/${record.stockoutId}`)}>{record.stockoutNo}</button></td><td className="border-r border-line-1 px-4" style={getColumnStyle("customerLabel")}>{record.customerLabel}</td><td className="border-r border-line-1 px-4" style={getColumnStyle("warehouseLabel")}>{record.warehouseLabel}</td><td className="border-r border-line-1 px-4" style={getColumnStyle("returnDate")}>{record.returnDate}</td><td className="border-r border-line-1 px-4 text-right" style={getColumnStyle("totalAmount")}>{formatMoney(record.totalAmount)}</td><td className="border-r border-line-1 px-4" style={getColumnStyle("updatedAt")}>{record.updatedAt}</td><td className="px-4" style={getColumnStyle("__actions__")}><div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">{getReturnActions(record.status).map((action) => <TextAction key={action} onClick={() => handleAction(record, action)}>{action}</TextAction>)}</div></td></tr>)}</tbody>
      </table></div></div>
      <Pagination total={filteredRecords.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} />
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function SalesReturnInboundListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<SalesReturnInboundRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [expanded, setExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({ no: "", returnNo: "", customer: "", warehouse: "", status: "全部", inboundDate: { start: "", end: "" }, updatedAt: { start: "", end: "" } });

  useEffect(() => { setRecords(getSalesReturnInbounds()); }, []);
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("sales-return-inbound:list:v2", [...inboundColumns]);
  const filteredRecords = useMemo(() => {
    const noSet = parseBatchInput(filters.no);
    const returnSet = parseBatchInput(filters.returnNo);
    return records.filter((record) => {
      if (noSet.length > 0 && !noSet.includes(record.no)) return false;
      if (returnSet.length > 0 && !returnSet.includes(record.returnNo)) return false;
      if (filters.customer && record.customerLabel !== filters.customer) return false;
      if (filters.warehouse && record.warehouseLabel !== filters.warehouse) return false;
      if (filters.status !== "全部" && record.status !== filters.status) return false;
      if (!inDateRange(record.inboundDate, filters.inboundDate)) return false;
      if (!inDateRange(record.updatedAt.slice(0, 10), filters.updatedAt)) return false;
      return true;
    }).sort((a, b) => compareRecord(a as any, b as any, sortConfig));
  }, [records, filters, sortConfig]);
  const pageRows = useMemo(() => filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredRecords, currentPage, pageSize]);
  const isAllSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.includes(row.id));
  const refresh = () => setRecords(getSalesReturnInbounds());
  const handleSort = (key: string) => setSortConfig((current) => !current || current.key !== key ? { key, direction: "asc" } : current.direction === "asc" ? { key, direction: "desc" } : null);

  const handleAction = (record: SalesReturnInboundRecord, action: string) => {
    if (action === "查看") return navigate(`/sales-return-inbound/${record.id}`);
    if (action === "编辑") return navigate(`/sales-return-inbound/${record.id}/edit`);
    const mapping: Record<string, ConfirmState> = {
      确认入库: { title: "确认入库", content: "确认入库后库存将立即增加，且操作不可撤销，确认入库？", confirmText: "确认入库", onConfirm: () => { const saved = confirmSalesReturnInbound(record); if (!saved) return openError("关联的销售退货单状态异常，无法继续入库"); openToast("入库成功，库存已增加"); setConfirmState(null); refresh(); } },
      删除: { title: "确认删除", content: "删除后不可恢复，该入库单将从系统中永久移除，确认删除？", confirmText: "确认删除", onConfirm: () => { deleteSalesReturnInbound(record.id); openToast("销售退货入库单已删除"); setConfirmState(null); refresh(); } },
    };
    setConfirmState(mapping[action]);
  };

  return (
    <div className="flex flex-col gap-4">
      <SurfaceCard title="查询条件">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <LabeledField label="入库单号"><BatchSearchInput value={filters.no} onChange={(no) => setFilters((current) => ({ ...current, no }))} placeholder="支持换行或英文逗号分隔" /></LabeledField>
          <LabeledField label="关联销售退货单"><BatchSearchInput value={filters.returnNo} onChange={(returnNo) => setFilters((current) => ({ ...current, returnNo }))} placeholder="按退货单号批量精确搜索" /></LabeledField>
          <LabeledField label="客户"><Select value={filters.customer} onChange={(customer) => setFilters((current) => ({ ...current, customer }))} options={[...new Set(records.map((item) => item.customerLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="退回仓库"><Select value={filters.warehouse} onChange={(warehouse) => setFilters((current) => ({ ...current, warehouse }))} options={[...new Set(records.map((item) => item.warehouseLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="入库状态"><Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={["全部", "草稿", "已入库", "已作废"]} /></LabeledField>
          <LabeledField label="入库日期"><DateRangeField value={filters.inboundDate} onChange={(inboundDate) => setFilters((current) => ({ ...current, inboundDate }))} /></LabeledField>
          {expanded ? <LabeledField label="最后修改时间"><DateRangeField value={filters.updatedAt} onChange={(updatedAt) => setFilters((current) => ({ ...current, updatedAt }))} /></LabeledField> : null}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={() => setExpanded((current) => !current)}>{expanded ? "收起" : "展开"}</Button>
          <Button onClick={() => { setFilters({ no: "", returnNo: "", customer: "", warehouse: "", status: "全部", inboundDate: { start: "", end: "" }, updatedAt: { start: "", end: "" } }); setSelectedIds([]); setCurrentPage(1); }}>重置</Button>
          <Button tone="primary" onClick={() => setCurrentPage(1)}>搜索</Button>
        </div>
      </SurfaceCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2"><Button tone="primary" onClick={() => navigate("/sales-return-inbound/new")}>新增</Button><Button onClick={() => openToast(`导出成功，共导出 ${selectedIds.length || filteredRecords.length} 条记录`)}>导出</Button></div>
              </div>
      <div className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft"><div ref={containerRef} className="overflow-x-auto"><table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, 1560) }}>
        <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[44px]"><th className="sticky left-0 z-10 border-b border-r border-line-1 bg-fill-2 px-3" style={getColumnStyle("__select__")}><Checkbox checked={isAllSelected} onChange={(checked) => setSelectedIds(checked ? Array.from(new Set([...selectedIds, ...pageRows.map((row) => row.id)])) : selectedIds.filter((id) => !pageRows.some((row) => row.id === id)))} /></th><ResizableHeaderCell width={getColumnStyle("no").width} minWidth={getColumnStyle("no").minWidth} className="sticky z-10 bg-fill-2" style={{ left: getColumnStyle("__select__").width }} onResizeStart={(clientX) => startResize("no", clientX)}><TableSortHeader label="入库单号" sortKey="no" currentSort={sortConfig} onSort={handleSort} /></ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("status").width} minWidth={getColumnStyle("status").minWidth} onResizeStart={(clientX) => startResize("status", clientX)}>入库状态</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("returnNo").width} minWidth={getColumnStyle("returnNo").minWidth} onResizeStart={(clientX) => startResize("returnNo", clientX)}>关联销售退货单</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("customerLabel").width} minWidth={getColumnStyle("customerLabel").minWidth} onResizeStart={(clientX) => startResize("customerLabel", clientX)}>客户</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("warehouseLabel").width} minWidth={getColumnStyle("warehouseLabel").minWidth} onResizeStart={(clientX) => startResize("warehouseLabel", clientX)}>退回仓库</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("inboundDate").width} minWidth={getColumnStyle("inboundDate").minWidth} onResizeStart={(clientX) => startResize("inboundDate", clientX)}>入库日期</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("totalAmount").width} minWidth={getColumnStyle("totalAmount").minWidth} onResizeStart={(clientX) => startResize("totalAmount", clientX)}><TableSortHeader label="本次入库总金额" sortKey="totalAmount" currentSort={sortConfig} onSort={handleSort} align="right" /></ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("updatedAt").width} minWidth={getColumnStyle("updatedAt").minWidth} onResizeStart={(clientX) => startResize("updatedAt", clientX)}>最后修改时间</ResizableHeaderCell><ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell></tr></thead>
        <tbody>{pageRows.length === 0 ? <EmptyStateRow colSpan={10} /> : pageRows.map((record) => <tr key={record.id} className="group h-[44px] border-b border-line-1 text-text-2 hover:bg-hover-bg"><td className="sticky left-0 z-10 border-r border-line-1 bg-white px-3 group-hover:bg-hover-bg" style={getColumnStyle("__select__")}><Checkbox checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id])} /></td><td className="sticky z-10 border-r border-line-1 bg-white px-4 group-hover:bg-hover-bg" style={{ ...getColumnStyle("no"), left: getColumnStyle("__select__").width }}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-return-inbound/${record.id}`)}>{record.no}</button></td><td className="border-r border-line-1 px-4" style={getColumnStyle("status")}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></td><td className="border-r border-line-1 px-4" style={getColumnStyle("returnNo")}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-return/${record.returnId}`)}>{record.returnNo}</button></td><td className="border-r border-line-1 px-4" style={getColumnStyle("customerLabel")}>{record.customerLabel}</td><td className="border-r border-line-1 px-4" style={getColumnStyle("warehouseLabel")}>{record.warehouseLabel}</td><td className="border-r border-line-1 px-4" style={getColumnStyle("inboundDate")}>{record.inboundDate}</td><td className="border-r border-line-1 px-4 text-right" style={getColumnStyle("totalAmount")}>{formatMoney(record.totalAmount)}</td><td className="border-r border-line-1 px-4" style={getColumnStyle("updatedAt")}>{record.updatedAt}</td><td className="px-4" style={getColumnStyle("__actions__")}><div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">{getInboundActions(record.status).map((action) => <TextAction key={action} onClick={() => handleAction(record, action)}>{action}</TextAction>)}</div></td></tr>)}</tbody>
      </table></div></div>
      <Pagination total={filteredRecords.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} />
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function SalesReturnCreatePage() { return <SalesReturnEditorPage mode="create" />; }
export function SalesReturnEditPage() { return <SalesReturnEditorPage mode="edit" />; }

function SalesReturnEditorPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const source = mode === "create" ? createSalesReturnDraft(searchParams.get("stockoutId") ?? "") : getSalesReturn(recordId);
  const [form, setForm] = useState<SalesReturnRecord | null>(source ? JSON.parse(JSON.stringify(source)) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const stockoutOptions = getSalesReturnSourceStockouts();

  useEffect(() => {
    setForm(source ? JSON.parse(JSON.stringify(source)) : null);
    setErrors({});
    setDirty(false);
  }, [mode, recordId, searchParams]);

  if (!form) return <SurfaceCard title="提示">未找到对应销售退货单，请返回列表重新进入。</SurfaceCard>;

  const totalQty = form.lines.reduce((sum, line) => sum + Number(line.returnQty || 0), 0);
  const totalAmount = form.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const updateField = (key: keyof SalesReturnRecord, value: string) => {
    setDirty(true);
    setForm((current) => current ? { ...current, [key]: value } : current);
    setErrors((current) => ({ ...current, [String(key)]: "" }));
  };

  const updateLine = (lineId: string, patch: Partial<SalesReturnLine>) => {
    setDirty(true);
    setForm((current) => current ? {
      ...current,
      lines: current.lines.map((line) => line.id === lineId ? { ...line, ...patch, amount: Number((((patch.returnQty ?? line.returnQty) || 0) * Number(line.price || 0)).toFixed(2)) } : line),
    } : current);
  };

  const selectStockout = (stockoutId: string) => {
    const stockout = stockoutOptions.find((item) => item.id === stockoutId);
    if (!stockout) return;
    const apply = () => {
      setDirty(true);
      setForm((current) => current ? { ...current, stockoutId: stockout.id, stockoutNo: stockout.no, customerLabel: stockout.customerLabel, warehouseLabel: stockout.warehouseLabel, lines: buildSalesReturnLinesFromStockout(stockout.id) } : current);
      setConfirmState(null);
    };
    if (form.lines.some((line) => line.returnQty > 0 || line.reason || line.note)) {
      return setConfirmState({ title: "重新选择原销售出库单", content: "重新选择将清空当前明细，确认继续？", confirmText: "确认", onConfirm: apply });
    }
    apply();
  };

  const validate = (intent: "draft" | "submit") => {
    const nextErrors: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);
    if (intent === "submit") {
      if (!form.stockoutId) nextErrors.stockoutId = "请选择原销售出库单";
      if (!form.returnDate) nextErrors.returnDate = "请选择申请日期";
      if (form.returnDate > today) nextErrors.returnDate = "申请日期不能晚于今天";
      if (!form.lines.some((line) => Number(line.returnQty || 0) > 0)) openError("请至少填写一行退货数量");
      form.lines.forEach((line, index) => {
        if (Number(line.returnQty || 0) > Number(line.availableQty || 0)) nextErrors[`line-${index}-qty`] = `申请退货数量不能超过可退数量（${line.availableQty} 件）`;
        if (Number(line.returnQty || 0) > 0 && !line.reason) nextErrors[`line-${index}-reason`] = "请选择退货原因";
      });
    } else if (form.returnDate > today) {
      nextErrors.returnDate = "申请日期不能晚于今天";
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const persist = (intent: "draft" | "submit") => {
    const nextErrors = validate(intent);
    if (Object.keys(nextErrors).length > 0) return;
    const saved = saveSalesReturn(form, intent);
    if (!saved) return openError("保存失败");
    setDirty(false);
    if (intent === "draft") {
      setForm(saved);
      openToast("保存成功");
    } else {
      openToast("已提交审核，等待审核确认");
      navigate(`/sales-return/${saved.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={mode === "create" ? "新增销售退货单" : `编辑销售退货单 ${form.no}`} actions={<div className="flex flex-wrap gap-2"><Button tone="primary" onClick={() => persist("draft")}>保存草稿</Button><Button tone="primary" onClick={() => persist("submit")}>提交审核</Button><Button onClick={() => !dirty ? navigate("/sales-return") : setConfirmState({ title: "确认离开", content: "当前有未保存的内容，确认离开？", confirmText: "确认离开", onConfirm: () => navigate("/sales-return") })}>返回列表</Button></div>} />
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="原销售出库单" required error={errors.stockoutId}>{mode === "edit" ? <ReadonlyValue value={form.stockoutNo} /> : <Select value={form.stockoutNo} onChange={(stockoutNo) => { const stockout = stockoutOptions.find((item) => item.no === stockoutNo); if (stockout) selectStockout(stockout.id); }} options={stockoutOptions.map((item) => item.no)} allowSearch placeholder="请选择原销售出库单" />}</LabeledField>
          <LabeledField label="客户"><ReadonlyValue value={form.customerLabel || "-"} /></LabeledField>
          <LabeledField label="退回仓库"><ReadonlyValue value={form.warehouseLabel || "-"} /></LabeledField>
          <LabeledField label="申请日期" required error={errors.returnDate}><DateField value={form.returnDate} onChange={(value) => updateField("returnDate", value)} /></LabeledField>
          <LabeledField label="退货备注" className="md:col-span-2 xl:col-span-4"><TextArea value={form.remark} onChange={(value) => updateField("remark", value)} maxLength={200} placeholder="请输入退货备注（选填）" /></LabeledField>
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`退货总数量 ${totalQty} 件 | 总金额 ${formatMoney(totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="min-w-[1540px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["序号", "商品", "规格型号", "单位", "原出库数量", "可退数量", "申请退货数量", "退货原因", "单价（含税）", "退货金额", "行备注"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead>
            <tbody>{form.lines.map((line, index) => <tr key={line.id} className={cn("border-b border-line-1", line.availableQty === 0 && "bg-fill-2 text-text-3")}><td className="px-3 py-2.5">{index + 1}</td><td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td><td className="px-3 py-2.5">{line.spec || "-"}</td><td className="px-3 py-2.5">{line.unit || "-"}</td><td className="px-3 py-2.5">{line.originalStockoutQty}</td><td className="px-3 py-2.5 text-warning">{line.availableQty}</td><td className="px-3 py-2.5"><Input value={String(line.returnQty || 0)} onChange={(value) => updateLine(line.id, { returnQty: Number(value) || 0 })} className="text-right" readOnly={line.availableQty === 0} />{errors[`line-${index}-qty`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-qty`]}</div> : null}</td><td className="px-3 py-2.5">{Number(line.returnQty || 0) > 0 ? <><Select value={line.reason} onChange={(reason) => updateLine(line.id, { reason })} options={salesReturnReasonOptions} placeholder="请选择退货原因" />{errors[`line-${index}-reason`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-reason`]}</div> : null}</> : <ReadonlyValue value="-" />}</td><td className="px-3 py-2.5">{formatMoney(line.price)}</td><td className="px-3 py-2.5">{formatMoney(line.amount)}</td><td className="px-3 py-2.5"><Input value={line.note} onChange={(value) => updateLine(line.id, { note: value })} readOnly={line.availableQty === 0} placeholder="行备注（选填）" /></td></tr>)}</tbody>
            <tfoot className="bg-zinc-100"><tr className="h-[42px] font-semibold text-text-1"><td colSpan={11} className="px-4">退货总数量 {totalQty} 件 | 总金额 {formatMoney(totalAmount)}</td></tr></tfoot>
          </table>
        </div>
      </SurfaceCard>
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function SalesReturnInboundCreatePage() { return <SalesReturnInboundEditorPage mode="create" />; }
export function SalesReturnInboundEditPage() { return <SalesReturnInboundEditorPage mode="edit" />; }

function SalesReturnInboundEditorPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const source = mode === "create" ? createSalesReturnInboundDraft(searchParams.get("returnId") ?? "") : getSalesReturnInbound(recordId);
  const [form, setForm] = useState<SalesReturnInboundRecord | null>(source ? JSON.parse(JSON.stringify(source)) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const returnOptions = getSalesReturnInboundSourceReturns();

  useEffect(() => {
    setForm(source ? JSON.parse(JSON.stringify(source)) : null);
    setErrors({});
    setDirty(false);
  }, [mode, recordId, searchParams]);

  if (!form) return <SurfaceCard title="提示">未找到对应销售退货入库单，请返回列表重新进入。</SurfaceCard>;

  const totalQty = form.lines.reduce((sum, line) => sum + Number(line.inboundQty || 0), 0);
  const totalAmount = form.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const updateField = (key: keyof SalesReturnInboundRecord, value: string) => {
    setDirty(true);
    setForm((current) => current ? { ...current, [key]: value } : current);
    setErrors((current) => ({ ...current, [String(key)]: "" }));
  };

  const updateLine = (lineId: string, patch: Partial<SalesReturnInboundLine>) => {
    setDirty(true);
    setForm((current) => current ? { ...current, lines: current.lines.map((line) => line.id === lineId ? { ...line, ...patch, amount: Number((((patch.inboundQty ?? line.inboundQty) || 0) * Number(line.price || 0)).toFixed(2)) } : line) } : current);
  };

  const selectReturn = (returnId: string) => {
    const returnDoc = returnOptions.find((item) => item.id === returnId);
    if (!returnDoc) return;
    const apply = () => {
      setDirty(true);
      setForm((current) => current ? { ...current, returnId: returnDoc.id, returnNo: returnDoc.no, customerLabel: returnDoc.customerLabel, warehouseLabel: returnDoc.warehouseLabel, lines: buildSalesReturnInboundLinesFromReturn(returnDoc.id) } : current);
      setConfirmState(null);
    };
    if (form.lines.some((line) => line.inboundQty > 0 || line.note)) {
      return setConfirmState({ title: "重新选择销售退货单", content: "重新选择将清空当前明细，确认继续？", confirmText: "确认", onConfirm: apply });
    }
    apply();
  };

  const validate = (intent: "draft" | "confirm") => {
    const nextErrors: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);
    if (intent === "confirm") {
      if (!form.returnId) nextErrors.returnId = "请选择关联销售退货单";
      if (!form.inboundDate) nextErrors.inboundDate = "请选择入库日期";
      if (form.inboundDate > today) nextErrors.inboundDate = "入库日期不能晚于今天";
      if (!form.lines.some((line) => Number(line.inboundQty || 0) > 0)) openError("请至少填写一行入库数量");
      form.lines.forEach((line, index) => {
        if (Number(line.inboundQty || 0) > Number(line.pendingQty || 0)) nextErrors[`line-${index}-qty`] = `入库数量不能超过未入库数量（${line.pendingQty} 件）`;
      });
    } else if (form.inboundDate > today) {
      nextErrors.inboundDate = "入库日期不能晚于今天";
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const saveDraft = () => {
    const nextErrors = validate("draft");
    if (Object.keys(nextErrors).length > 0) return;
    const saved = saveSalesReturnInbound(form);
    if (!saved) return openError("保存失败");
    setDirty(false);
    setForm(saved);
    openToast("保存成功");
  };

  const doConfirm = () => {
    const nextErrors = validate("confirm");
    if (Object.keys(nextErrors).length > 0) return;
    setConfirmState({ title: "确认入库", content: "确认入库后库存将立即增加，且操作不可撤销，确认入库？", confirmText: "确认入库", onConfirm: () => { const saved = confirmSalesReturnInbound(form); if (!saved) return openError("关联的销售退货单状态异常，无法继续入库"); setConfirmState(null); setDirty(false); openToast("入库成功，库存已增加"); navigate(`/sales-return-inbound/${saved.id}`); } });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={mode === "create" ? "新增销售退货入库单" : `编辑销售退货入库单 ${form.no}`} actions={<div className="flex flex-wrap gap-2"><Button tone="primary" onClick={saveDraft}>保存草稿</Button><Button tone="primary" onClick={doConfirm}>确认入库</Button><Button onClick={() => !dirty ? navigate("/sales-return-inbound") : setConfirmState({ title: "确认离开", content: "当前有未保存的内容，确认离开？", confirmText: "确认离开", onConfirm: () => navigate("/sales-return-inbound") })}>返回列表</Button></div>} />
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="关联销售退货单" required error={errors.returnId}>{mode === "edit" ? <ReadonlyValue value={form.returnNo} /> : <Select value={form.returnNo} onChange={(returnNo) => { const returnDoc = returnOptions.find((item) => item.no === returnNo); if (returnDoc) selectReturn(returnDoc.id); }} options={returnOptions.map((item) => item.no)} allowSearch placeholder="请选择关联销售退货单" />}</LabeledField>
          <LabeledField label="客户"><ReadonlyValue value={form.customerLabel || "-"} /></LabeledField>
          <LabeledField label="退回仓库"><ReadonlyValue value={form.warehouseLabel || "-"} /></LabeledField>
          <LabeledField label="入库日期" required error={errors.inboundDate}><DateField value={form.inboundDate} onChange={(value) => updateField("inboundDate", value)} /></LabeledField>
          <LabeledField label="入库备注" className="md:col-span-2 xl:col-span-4"><TextArea value={form.remark} onChange={(value) => updateField("remark", value)} maxLength={200} placeholder="请输入入库备注（选填）" /></LabeledField>
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`本次入库 ${totalQty} 件 | 总金额 ${formatMoney(totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="min-w-[1500px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["序号", "商品", "规格型号", "单位", "退货申请数量", "未入库数量", "本次入库数量", "单价（含税）", "入库金额", "行备注"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead>
            <tbody>{form.lines.map((line, index) => { const disabled = line.pendingQty === 0; return <tr key={line.id} className={cn("border-b border-line-1", disabled && "bg-fill-2 text-text-3")}><td className="px-3 py-2.5">{index + 1}</td><td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td><td className="px-3 py-2.5">{line.spec || "-"}</td><td className="px-3 py-2.5">{line.unit || "-"}</td><td className="px-3 py-2.5">{line.requestedQty}</td><td className="px-3 py-2.5 text-warning">{line.pendingQty}</td><td className="px-3 py-2.5"><Input value={String(line.inboundQty || 0)} onChange={(value) => updateLine(line.id, { inboundQty: Number(value) || 0 })} className="text-right" readOnly={disabled} />{errors[`line-${index}-qty`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-qty`]}</div> : null}</td><td className="px-3 py-2.5">{formatMoney(line.price)}</td><td className="px-3 py-2.5">{formatMoney(line.amount)}</td><td className="px-3 py-2.5"><Input value={line.note} onChange={(value) => updateLine(line.id, { note: value })} readOnly={disabled} placeholder="行备注（选填）" /></td></tr>; })}</tbody>
            <tfoot className="bg-zinc-100"><tr className="h-[42px] font-semibold text-text-1"><td colSpan={10} className="px-4">本次入库合计：{totalQty} 件 | {formatMoney(totalAmount)}</td></tr></tfoot>
          </table>
        </div>
      </SurfaceCard>
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function SalesReturnDetailPage() {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const record = getSalesReturn(recordId);
  if (!record) return <SurfaceCard title="提示">未找到对应销售退货单，请返回列表重新进入。</SurfaceCard>;

  const linkedInbounds = getLinkedSalesReturnInbounds(record.id);
  const showProgress = record.status === "待入库" || record.status === "部分入库" || record.status === "已完成";
  const detailActions = (() => {
    switch (record.status) {
      case "草稿": return ["编辑", "删除", "提交审核"];
      case "待审核": return ["审核", "驳回", "作废"];
      case "待入库": return ["创建退货入库单", "作废"];
      case "部分入库": return ["创建退货入库单"];
      default: return [];
    }
  })();

  const openAction = (action: string) => {
    if (action === "编辑") return navigate(`/sales-return/${record.id}/edit`);
    if (action === "创建退货入库单") return navigate(`/sales-return-inbound/new?returnId=${record.id}`);
    const mapping: Record<string, ConfirmState> = {
      删除: { title: "确认删除", content: "删除后不可恢复，该销售退货单将从系统中永久移除，确认删除？", confirmText: "确认删除", onConfirm: () => { deleteSalesReturn(record.id); openToast("销售退货单已删除"); navigate("/sales-return"); } },
      提交审核: { title: "提交审核", content: "提交后单据将进入待审核状态，确认提交？", confirmText: "确认提交", onConfirm: () => { const saved = saveSalesReturn(record, "submit"); if (!saved) return openError("提交失败"); openToast("已提交审核，等待审核确认"); navigate(`/sales-return/${record.id}`); } },
      审核: { title: "确认审核", content: "审核通过后关键字段将锁定，不可再修改，确认审核通过？", confirmText: "确认审核", onConfirm: () => { approveSalesReturn(record.id); openToast("审核通过"); navigate(`/sales-return/${record.id}`); } },
      驳回: { title: "确认驳回", content: "驳回后单据将退回草稿，内勤可重新修改，确认驳回？", confirmText: "确认驳回", onConfirm: () => { rejectSalesReturn(record.id); openToast("已驳回，单据已退回草稿"); navigate(`/sales-return/${record.id}`); } },
      作废: { title: "确认作废", content: "作废后不可恢复，单据将进入已作废状态，确认作废？", confirmText: "确认作废", onConfirm: () => { voidSalesReturn(record.id); openToast("销售退货单已作废"); navigate(`/sales-return/${record.id}`); } },
    };
    setConfirmState(mapping[action]);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={`销售退货单 ${record.no}`} actions={<div className="flex flex-wrap gap-2"><Button onClick={() => navigate("/sales-return")}>返回列表</Button>{detailActions.map((action) => <Button key={action} tone={action === "创建退货入库单" ? "primary" : "default"} onClick={() => openAction(action)}>{action}</Button>)}</div>}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></PageTitle>
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="退货单号" value={record.no} />
          <DetailValue label="原销售出库单" value={<button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-delivery/${record.stockoutId}`)}>{record.stockoutNo}</button>} />
          <DetailValue label="客户" value={record.customerLabel} />
          <DetailValue label="退回仓库" value={record.warehouseLabel} />
          <DetailValue label="申请日期" value={record.returnDate} />
          <DetailValue label="退货备注" value={record.remark || "-"} className="xl:col-span-3" />
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`退货总数量 ${record.totalQty} 件 | 总金额 ${formatMoney(record.totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="min-w-[1500px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">
                {(showProgress
                  ? ["序号", "商品", "规格型号", "单位", "申请退货数量", "累计已入库数量", "未入库数量", "退货原因", "单价（含税）", "退货金额", "行备注"]
                  : ["序号", "商品", "规格型号", "单位", "原出库数量", "可退数量", "申请退货数量", "退货原因", "单价（含税）", "退货金额", "行备注"]
                ).map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}
              </tr>
            </thead>
            <tbody>{record.lines.map((line, index) => <tr key={line.id} className="border-b border-line-1"><td className="px-3 py-2.5">{index + 1}</td><td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td><td className="px-3 py-2.5">{line.spec || "-"}</td><td className="px-3 py-2.5">{line.unit || "-"}</td>{showProgress ? <><td className="px-3 py-2.5 font-medium">{line.returnQty}</td><td className={cn("px-3 py-2.5", record.status === "已完成" && "text-success")}>{line.inboundQty}</td><td className={cn("px-3 py-2.5", line.pendingQty > 0 && "text-warning")}>{line.pendingQty}</td></> : <><td className="px-3 py-2.5">{line.originalStockoutQty}</td><td className="px-3 py-2.5 text-warning">{line.availableQty}</td><td className={cn("px-3 py-2.5 font-medium", line.returnQty === 0 && "text-text-3")}>{line.returnQty}</td></>}<td className="px-3 py-2.5">{line.reason || "-"}</td><td className="px-3 py-2.5">{formatMoney(line.price)}</td><td className="px-3 py-2.5">{formatMoney(line.amount)}</td><td className="px-3 py-2.5">{line.note || "-"}</td></tr>)}</tbody>
          </table>
        </div>
      </SurfaceCard>
      {showProgress ? <SurfaceCard title="关联退货入库单"><div className="overflow-x-auto"><table className="min-w-full border-collapse text-sm"><thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["入库单号", "入库日期", "本次入库数量", "确认入库人", "入库状态"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead><tbody>{linkedInbounds.map((doc) => <tr key={doc.id} className="border-b border-line-1"><td className="px-3 py-2.5"><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-return-inbound/${doc.id}`)}>{doc.no}</button></td><td className="px-3 py-2.5">{doc.status === "草稿" ? "-" : doc.inboundDate}</td><td className="px-3 py-2.5">{doc.totalQty}</td><td className="px-3 py-2.5">{doc.confirmBy || "-"}</td><td className="px-3 py-2.5"><StatusPill tone={doc.statusTone}>{doc.status}</StatusPill></td></tr>)}</tbody></table></div></SurfaceCard> : null}
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

export function SalesReturnInboundDetailPage() {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const record = getSalesReturnInbound(recordId);
  if (!record) return <SurfaceCard title="提示">未找到对应销售退货入库单，请返回列表重新进入。</SurfaceCard>;

  const openAction = (action: string) => {
    if (action === "编辑") return navigate(`/sales-return-inbound/${record.id}/edit`);
    if (action === "联查销售退货单") return navigate(`/sales-return/${record.returnId}`);
    const mapping: Record<string, ConfirmState> = {
      删除: { title: "确认删除", content: "删除后不可恢复，该入库单将从系统中永久移除，确认删除？", confirmText: "确认删除", onConfirm: () => { deleteSalesReturnInbound(record.id); openToast("销售退货入库单已删除"); navigate("/sales-return-inbound"); } },
      确认入库: { title: "确认入库", content: "确认入库后库存将立即增加，且操作不可撤销，确认入库？", confirmText: "确认入库", onConfirm: () => { const saved = confirmSalesReturnInbound(record); if (!saved) return openError("关联的销售退货单状态异常，无法继续入库"); openToast("入库成功，库存已增加"); navigate(`/sales-return-inbound/${record.id}`); } },
    };
    setConfirmState(mapping[action]);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={`销售退货入库单 ${record.no}`} actions={<div className="flex flex-wrap gap-2"><Button onClick={() => navigate("/sales-return-inbound")}>返回列表</Button>{record.status === "草稿" ? <><Button onClick={() => openAction("编辑")}>编辑</Button><Button onClick={() => openAction("删除")}>删除</Button><Button tone="primary" onClick={() => openAction("确认入库")}>确认入库</Button></> : null}<Button onClick={() => openAction("联查销售退货单")}>联查销售退货单</Button></div>}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></PageTitle>
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="入库单号" value={record.no} />
          <DetailValue label="关联销售退货单" value={<button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-return/${record.returnId}`)}>{record.returnNo}</button>} />
          <DetailValue label="客户" value={record.customerLabel} />
          <DetailValue label="退回仓库" value={record.warehouseLabel} />
          <DetailValue label="入库日期" value={record.inboundDate} />
          <DetailValue label="入库备注" value={record.remark || "-"} className="xl:col-span-3" />
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`本次入库 ${record.totalQty} 件 | 总金额 ${formatMoney(record.totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="min-w-[1500px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["序号", "商品", "规格型号", "单位", "退货申请数量", "本次入库数量", "单价（含税）", "入库金额", "行备注"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead>
            <tbody>{record.lines.map((line, index) => <tr key={line.id} className="border-b border-line-1"><td className="px-3 py-2.5">{index + 1}</td><td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td><td className="px-3 py-2.5">{line.spec || "-"}</td><td className="px-3 py-2.5">{line.unit || "-"}</td><td className="px-3 py-2.5">{line.requestedQty}</td><td className="px-3 py-2.5 font-medium">{line.inboundQty}</td><td className="px-3 py-2.5">{formatMoney(line.price)}</td><td className="px-3 py-2.5">{formatMoney(line.amount)}</td><td className="px-3 py-2.5">{line.note || "-"}</td></tr>)}</tbody>
          </table>
        </div>
      </SurfaceCard>
      <SurfaceCard title="制单信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="创建人" value={record.createdBy} />
          <DetailValue label="创建时间" value={record.createdAt} />
          <DetailValue label="最后修改人" value={record.updatedBy || "-"} />
          <DetailValue label="最后修改时间" value={record.updatedAt || "-"} />
          <DetailValue label="确认入库人" value={record.confirmBy || "-"} />
          <DetailValue label="确认入库时间" value={record.confirmAt || "-"} />
        </div>
      </SurfaceCard>
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

function DetailValue({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return <div className={className}><div className="text-[13px] text-text-3">{label}</div><div className="mt-1 text-[14px] text-text-1">{value}</div></div>;
}
