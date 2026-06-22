import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BatchSearchInput, Button, DateField, DateRangeField, Input, PageTitle, Pagination, ResizableHeaderCell, Select, StatusPill, TableSortHeader, TextArea, useResizableColumns } from "../components/Ui";
import { ConfirmModal, ConfirmState, EmptyStateRow, LabeledField, ReadonlyValue, SurfaceCard, TextAction, formatMoney, inDateRange, openError, openToast, parseBatchInput } from "../components/ModuleKit";
import { ActionsCell, DataCell, MoneyCell, StatusCell, StickyFirstColumnCell, StickyFirstColumnHeader, StickySelectCell, SummaryFooter } from "../components/TableCells";
import { cn } from "../utils/cn";
import { TABLE_MIN_WIDTH } from "../utils/tableConstants";
import { compareRecord } from "../utils/sort";
import {
  approvePurchaseReturn,
  buildReturnLinesFromReceipt,
  buildStockoutLinesFromReturn,
  confirmPurchaseReturnStockout,
  createPurchaseReturnDraft,
  createPurchaseReturnStockoutDraft,
  deletePurchaseReturn,
  deletePurchaseReturnStockout,
  getLinkedReturnStockouts,
  getPurchaseReturn,
  getPurchaseReturnSourceReceipts,
  getPurchaseReturns,
  getPurchaseReturnStockout,
  getPurchaseReturnStockouts,
  getPurchaseReturnStockoutSourceReturns,
  purchaseReturnReasonOptions,
  rejectPurchaseReturn,
  savePurchaseReturn,
  savePurchaseReturnStockout,
  type PurchaseReturnLine,
  type PurchaseReturnRecord,
  type PurchaseReturnStatus,
  type PurchaseReturnStockoutLine,
  type PurchaseReturnStockoutRecord,
  voidPurchaseReturn,
} from "../data/purchaseReturnWorkspace";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

const returnColumns = [
  { key: "__select__", width: 48, minWidth: 48, maxWidth: 48, resizable: false },
  { key: "no", width: 180, minWidth: 180 },
  { key: "status", width: 100, minWidth: 100 },
  { key: "receiptNo", width: 170, minWidth: 170 },
  { key: "supplierLabel", width: 200, minWidth: 180 },
  { key: "warehouseLabel", width: 160, minWidth: 150 },
  { key: "returnDate", width: 120, minWidth: 120 },
  { key: "totalQty", width: 110, minWidth: 110 },
  { key: "updatedAt", width: 170, minWidth: 170 },
  { key: "__actions__", width: 190, minWidth: 160, resizable: false },
] as const;

const stockoutColumns = [
  { key: "__select__", width: 48, minWidth: 48, maxWidth: 48, resizable: false },
  { key: "no", width: 180, minWidth: 180 },
  { key: "status", width: 90, minWidth: 90 },
  { key: "returnNo", width: 170, minWidth: 170 },
  { key: "supplierLabel", width: 200, minWidth: 180 },
  { key: "warehouseLabel", width: 160, minWidth: 150 },
  { key: "stockoutDate", width: 120, minWidth: 120 },
  { key: "totalAmount", width: 140, minWidth: 140 },
  { key: "updatedAt", width: 170, minWidth: 170 },
  { key: "__actions__", width: 180, minWidth: 150, resizable: false },
] as const;

function getReturnActions(status: PurchaseReturnStatus) {
  switch (status) {
    case "草稿":
      return ["查看", "编辑", "提交审核", "删除"];
    case "待审核":
      return ["查看", "审核", "驳回", "作废"];
    case "待出库":
      return ["查看", "创建退货出库单", "作废"];
    case "部分出库":
      return ["查看", "创建退货出库单"];
    default:
      return ["查看"];
  }
}

function getStockoutActions(status: PurchaseReturnStockoutRecord["status"]) {
  return status === "草稿" ? ["查看", "编辑", "确认出库", "删除"] : ["查看"];
}

export function PurchaseReturnListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PurchaseReturnRecord[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    no: "",
    receiptNo: "",
    supplier: "",
    warehouse: "",
    status: "全部",
    returnDate: { start: "", end: "" },
    updatedAt: { start: "", end: "" },
  });

  useEffect(() => {
    setRecords(getPurchaseReturns());
  }, []);

  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("purchase-return:list:v2", [...returnColumns]);

  const filteredRecords = useMemo(() => {
    const noSet = parseBatchInput(filters.no);
    const receiptSet = parseBatchInput(filters.receiptNo);
    return records.filter((record) => {
      if (noSet.length > 0 && !noSet.includes(record.no)) return false;
      if (receiptSet.length > 0 && !receiptSet.includes(record.receiptNo)) return false;
      if (filters.supplier && record.supplierLabel !== filters.supplier) return false;
      if (filters.warehouse && record.warehouseLabel !== filters.warehouse) return false;
      if (filters.status !== "全部" && record.status !== filters.status) return false;
      if (!inDateRange(record.returnDate, filters.returnDate)) return false;
      if (!inDateRange(record.updatedAt.slice(0, 10), filters.updatedAt)) return false;
      return true;
    }).sort((a, b) => compareRecord(a, b, sortConfig));
  }, [records, filters, sortConfig]);

  const pageRows = useMemo(() => filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredRecords, currentPage, pageSize]);
  const isAllSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.includes(row.id));

  const refresh = () => setRecords(getPurchaseReturns());
  const handleSort = (key: string) => setSortConfig((current) => !current || current.key !== key ? { key, direction: "asc" } : current.direction === "asc" ? { key, direction: "desc" } : null);

  const handleAction = (record: PurchaseReturnRecord, action: string) => {
    if (action === "查看") return navigate(`/purchase-return/${record.id}`);
    if (action === "编辑") return navigate(`/purchase-return/${record.id}/edit`);
    if (action === "创建退货出库单") return navigate(`/purchase-return-stockout/new?returnId=${record.id}`);
    const mapping: Record<string, ConfirmState> = {
      删除: {
        title: "确认删除",
        content: "删除后不可恢复，该退货单将从系统中永久移除，确认删除？",
        confirmText: "确认删除",
        onConfirm: () => {
          deletePurchaseReturn(record.id);
          openToast("采购退货单已删除");
          setConfirmState(null);
          refresh();
        },
      },
      提交审核: {
        title: "提交审核",
        content: "提交后单据将进入待审核状态，确认提交？",
        confirmText: "确认提交",
        onConfirm: () => {
          const saved = savePurchaseReturn(record, "submit");
          if (!saved) return openError("提交失败");
          openToast("已提交审核，等待审核确认");
          setConfirmState(null);
          refresh();
        },
      },
      审核: {
        title: "确认审核",
        content: "审核通过后关键字段将锁定，不可再修改，确认审核通过？",
        confirmText: "确认审核",
        onConfirm: () => {
          approvePurchaseReturn(record.id);
          openToast("审核通过");
          setConfirmState(null);
          refresh();
        },
      },
      驳回: {
        title: "确认驳回",
        content: "驳回后单据将退回草稿，申请人可重新修改，确认驳回？",
        confirmText: "确认驳回",
        onConfirm: () => {
          rejectPurchaseReturn(record.id);
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
          voidPurchaseReturn(record.id);
          openToast("采购退货单已作废");
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
          <LabeledField label="退货单号"><BatchSearchInput value={filters.no} onChange={(no) => setFilters((current) => ({ ...current, no }))} placeholder="支持换行或英文逗号分隔" /></LabeledField>
          <LabeledField label="关联采购入库单"><BatchSearchInput value={filters.receiptNo} onChange={(receiptNo) => setFilters((current) => ({ ...current, receiptNo }))} placeholder="按入库单号批量精确搜索" /></LabeledField>
          <LabeledField label="供应商"><Select value={filters.supplier} onChange={(supplier) => setFilters((current) => ({ ...current, supplier }))} options={[...new Set(records.map((item) => item.supplierLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="退货仓库"><Select value={filters.warehouse} onChange={(warehouse) => setFilters((current) => ({ ...current, warehouse }))} options={[...new Set(records.map((item) => item.warehouseLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="单据状态"><Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={["全部", "草稿", "待审核", "待出库", "部分出库", "已完成", "已作废"]} /></LabeledField>
          <LabeledField label="申请日期"><DateRangeField value={filters.returnDate} onChange={(returnDate) => setFilters((current) => ({ ...current, returnDate }))} /></LabeledField>
          {expanded ? <LabeledField label="最后修改时间"><DateRangeField value={filters.updatedAt} onChange={(updatedAt) => setFilters((current) => ({ ...current, updatedAt }))} /></LabeledField> : null}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={() => setExpanded((current) => !current)}>{expanded ? "收起" : "展开"}</Button>
          <Button onClick={() => { setFilters({ no: "", receiptNo: "", supplier: "", warehouse: "", status: "全部", returnDate: { start: "", end: "" }, updatedAt: { start: "", end: "" } }); setSelectedIds([]); setCurrentPage(1); }}>重置</Button>
          <Button tone="primary" onClick={() => setCurrentPage(1)}>搜索</Button>
        </div>
      </SurfaceCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button tone="primary" onClick={() => navigate("/purchase-return/new")}>新增</Button>
          <Button onClick={() => openToast(`导出成功，共导出 ${selectedIds.length || filteredRecords.length} 条记录`)}>导出</Button>
        </div>
              </div>

      <div className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.document) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                <StickySelectCell style={getColumnStyle("__select__")} variant="header" checked={isAllSelected} onChange={(checked) => setSelectedIds(checked ? Array.from(new Set([...selectedIds, ...pageRows.map((row) => row.id)])) : selectedIds.filter((id) => !pageRows.some((row) => row.id === id)))} />
                <StickyFirstColumnHeader width={getColumnStyle("no").width} minWidth={getColumnStyle("no").minWidth} left={getColumnStyle("__select__").width} onResizeStart={(clientX) => startResize("no", clientX)} label="退货单号" sortKey="no" currentSort={sortConfig} onSort={handleSort} />
                <ResizableHeaderCell width={getColumnStyle("status").width} minWidth={getColumnStyle("status").minWidth} onResizeStart={(clientX) => startResize("status", clientX)}>单据状态</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("receiptNo").width} minWidth={getColumnStyle("receiptNo").minWidth} onResizeStart={(clientX) => startResize("receiptNo", clientX)}>关联采购入库单</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("supplierLabel").width} minWidth={getColumnStyle("supplierLabel").minWidth} onResizeStart={(clientX) => startResize("supplierLabel", clientX)}>供应商</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("warehouseLabel").width} minWidth={getColumnStyle("warehouseLabel").minWidth} onResizeStart={(clientX) => startResize("warehouseLabel", clientX)}>退货仓库</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("returnDate").width} minWidth={getColumnStyle("returnDate").minWidth} onResizeStart={(clientX) => startResize("returnDate", clientX)}>申请日期</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("totalQty").width} minWidth={getColumnStyle("totalQty").minWidth} onResizeStart={(clientX) => startResize("totalQty", clientX)}>退货总数量</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("updatedAt").width} minWidth={getColumnStyle("updatedAt").minWidth} onResizeStart={(clientX) => startResize("updatedAt", clientX)}>最后修改时间</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? <EmptyStateRow colSpan={10} /> : pageRows.map((record) => (
                <tr key={record.id} className="group h-[44px] border-b border-line-1 text-text-2 hover:bg-hover-bg">
                  <StickySelectCell style={getColumnStyle("__select__")} variant="body" checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id])} />
                  <StickyFirstColumnCell bodyStyle={{ ...getColumnStyle("no"), left: getColumnStyle("__select__").width }}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-return/${record.id}`)}>{record.no}</button></StickyFirstColumnCell>
                  <StatusCell style={getColumnStyle("status")} tone={record.statusTone} label={record.status} />
                  <DataCell style={getColumnStyle("receiptNo")}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-receipt/${record.receiptId}`)}>{record.receiptNo}</button></DataCell>
                  <DataCell style={getColumnStyle("supplierLabel")}>{record.supplierLabel}</DataCell>
                  <DataCell style={getColumnStyle("warehouseLabel")}>{record.warehouseLabel}</DataCell>
                  <DataCell style={getColumnStyle("returnDate")}>{record.returnDate}</DataCell>
                  <DataCell style={getColumnStyle("totalQty")}>{record.totalQty}</DataCell>
                  <DataCell style={getColumnStyle("updatedAt")}>{record.updatedAt}</DataCell>
                  <ActionsCell style={getColumnStyle("__actions__")}>{getReturnActions(record.status).map((action) => <TextAction key={action} onClick={() => handleAction(record, action)}>{action}</TextAction>)}</ActionsCell>
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

export function PurchaseReturnStockoutListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PurchaseReturnStockoutRecord[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    no: "",
    returnNo: "",
    supplier: "",
    warehouse: "",
    status: "全部",
    stockoutDate: { start: "", end: "" },
    updatedAt: { start: "", end: "" },
  });

  useEffect(() => {
    setRecords(getPurchaseReturnStockouts());
  }, []);

  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("purchase-return-stockout:list:v2", [...stockoutColumns]);

  const filteredRecords = useMemo(() => {
    const noSet = parseBatchInput(filters.no);
    const returnSet = parseBatchInput(filters.returnNo);
    return records.filter((record) => {
      if (noSet.length > 0 && !noSet.includes(record.no)) return false;
      if (returnSet.length > 0 && !returnSet.includes(record.returnNo)) return false;
      if (filters.supplier && record.supplierLabel !== filters.supplier) return false;
      if (filters.warehouse && record.warehouseLabel !== filters.warehouse) return false;
      if (filters.status !== "全部" && record.status !== filters.status) return false;
      if (!inDateRange(record.stockoutDate, filters.stockoutDate)) return false;
      if (!inDateRange(record.updatedAt.slice(0, 10), filters.updatedAt)) return false;
      return true;
    }).sort((a, b) => compareRecord(a, b, sortConfig));
  }, [records, filters, sortConfig]);

  const pageRows = useMemo(() => filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredRecords, currentPage, pageSize]);
  const isAllSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.includes(row.id));

  const refresh = () => setRecords(getPurchaseReturnStockouts());
  const handleSort = (key: string) => setSortConfig((current) => !current || current.key !== key ? { key, direction: "asc" } : current.direction === "asc" ? { key, direction: "desc" } : null);

  const handleAction = (record: PurchaseReturnStockoutRecord, action: string) => {
    if (action === "查看") return navigate(`/purchase-return-stockout/${record.id}`);
    if (action === "编辑") return navigate(`/purchase-return-stockout/${record.id}/edit`);
    const mapping: Record<string, ConfirmState> = {
      确认出库: {
        title: "确认出库",
        content: "确认出库后库存将立即扣减，且操作不可撤销，确认出库？",
        confirmText: "确认出库",
        onConfirm: () => {
          const saved = confirmPurchaseReturnStockout(record);
          if (!saved) return openError("关联的采购退货单已作废，无法继续出库");
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
          deletePurchaseReturnStockout(record.id);
          openToast("采购退货出库单已删除");
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
          <LabeledField label="关联采购退货单"><BatchSearchInput value={filters.returnNo} onChange={(returnNo) => setFilters((current) => ({ ...current, returnNo }))} placeholder="按退货单号批量精确搜索" /></LabeledField>
          <LabeledField label="供应商"><Select value={filters.supplier} onChange={(supplier) => setFilters((current) => ({ ...current, supplier }))} options={[...new Set(records.map((item) => item.supplierLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="出库仓库"><Select value={filters.warehouse} onChange={(warehouse) => setFilters((current) => ({ ...current, warehouse }))} options={[...new Set(records.map((item) => item.warehouseLabel))]} allowSearch placeholder="全部" /></LabeledField>
          <LabeledField label="出库状态"><Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={["全部", "草稿", "已出库", "已作废"]} /></LabeledField>
          <LabeledField label="出库日期"><DateRangeField value={filters.stockoutDate} onChange={(stockoutDate) => setFilters((current) => ({ ...current, stockoutDate }))} /></LabeledField>
          {expanded ? <LabeledField label="最后修改时间"><DateRangeField value={filters.updatedAt} onChange={(updatedAt) => setFilters((current) => ({ ...current, updatedAt }))} /></LabeledField> : null}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={() => setExpanded((current) => !current)}>{expanded ? "收起" : "展开"}</Button>
          <Button onClick={() => { setFilters({ no: "", returnNo: "", supplier: "", warehouse: "", status: "全部", stockoutDate: { start: "", end: "" }, updatedAt: { start: "", end: "" } }); setSelectedIds([]); setCurrentPage(1); }}>重置</Button>
          <Button tone="primary" onClick={() => setCurrentPage(1)}>搜索</Button>
        </div>
      </SurfaceCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button tone="primary" onClick={() => navigate("/purchase-return-stockout/new")}>新增</Button>
          <Button onClick={() => openToast(`导出成功，共导出 ${selectedIds.length || filteredRecords.length} 条记录`)}>导出</Button>
        </div>
              </div>

      <div className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.document) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                <StickySelectCell style={getColumnStyle("__select__")} variant="header" checked={isAllSelected} onChange={(checked) => setSelectedIds(checked ? Array.from(new Set([...selectedIds, ...pageRows.map((row) => row.id)])) : selectedIds.filter((id) => !pageRows.some((row) => row.id === id)))} />
                <StickyFirstColumnHeader width={getColumnStyle("no").width} minWidth={getColumnStyle("no").minWidth} left={getColumnStyle("__select__").width} onResizeStart={(clientX) => startResize("no", clientX)} label="出库单号" sortKey="no" currentSort={sortConfig} onSort={handleSort} />
                <ResizableHeaderCell width={getColumnStyle("status").width} minWidth={getColumnStyle("status").minWidth} onResizeStart={(clientX) => startResize("status", clientX)}>出库状态</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("returnNo").width} minWidth={getColumnStyle("returnNo").minWidth} onResizeStart={(clientX) => startResize("returnNo", clientX)}>关联采购退货单</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("supplierLabel").width} minWidth={getColumnStyle("supplierLabel").minWidth} onResizeStart={(clientX) => startResize("supplierLabel", clientX)}>供应商</ResizableHeaderCell>
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
                  <StickySelectCell style={getColumnStyle("__select__")} variant="body" checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id])} />
                  <StickyFirstColumnCell bodyStyle={{ ...getColumnStyle("no"), left: getColumnStyle("__select__").width }}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-return-stockout/${record.id}`)}>{record.no}</button></StickyFirstColumnCell>
                  <StatusCell style={getColumnStyle("status")} tone={record.statusTone} label={record.status} />
                  <DataCell style={getColumnStyle("returnNo")}><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-return/${record.returnId}`)}>{record.returnNo}</button></DataCell>
                  <DataCell style={getColumnStyle("supplierLabel")}>{record.supplierLabel}</DataCell>
                  <DataCell style={getColumnStyle("warehouseLabel")}>{record.warehouseLabel}</DataCell>
                  <DataCell style={getColumnStyle("stockoutDate")}>{record.stockoutDate}</DataCell>
                  <MoneyCell style={getColumnStyle("totalAmount")} value={record.totalAmount} />
                  <DataCell style={getColumnStyle("updatedAt")}>{record.updatedAt}</DataCell>
                  <ActionsCell style={getColumnStyle("__actions__")}>{getStockoutActions(record.status).map((action) => <TextAction key={action} onClick={() => handleAction(record, action)}>{action}</TextAction>)}</ActionsCell>
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

export function PurchaseReturnCreatePage() { return <PurchaseReturnEditorPage mode="create" />; }
export function PurchaseReturnEditPage() { return <PurchaseReturnEditorPage mode="edit" />; }

function PurchaseReturnEditorPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const source = mode === "create" ? createPurchaseReturnDraft(searchParams.get("receiptId") ?? "") : getPurchaseReturn(recordId);
  const [form, setForm] = useState<PurchaseReturnRecord | null>(source ? JSON.parse(JSON.stringify(source)) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const receiptOptions = getPurchaseReturnSourceReceipts();

  useEffect(() => {
    setForm(source ? JSON.parse(JSON.stringify(source)) : null);
    setErrors({});
    setDirty(false);
  }, [mode, recordId, searchParams]);

  if (!form) return <SurfaceCard title="提示">未找到对应采购退货单，请返回列表重新进入。</SurfaceCard>;

  const summaryQty = form.lines.reduce((sum, line) => sum + Number(line.returnQty || 0), 0);

  const updateField = (key: keyof PurchaseReturnRecord, value: string) => {
    setDirty(true);
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [String(key)]: "" }));
  };

  const updateLine = (lineId: string, patch: Partial<PurchaseReturnLine>) => {
    setDirty(true);
    setForm((current) => current ? { ...current, lines: current.lines.map((line) => line.id === lineId ? { ...line, ...patch } : line) } : current);
  };

  const selectReceipt = (receiptId: string) => {
    const receipt = receiptOptions.find((item) => item.id === receiptId);
    if (!receipt) return;
    const apply = () => {
      setDirty(true);
      setForm((current) => current ? {
        ...current,
        receiptId: receipt.id,
        receiptNo: receipt.no,
        orderNo: receipt.orderNo,
        supplierLabel: receipt.supplierLabel,
        warehouseLabel: receipt.warehouseLabel,
        lines: buildReturnLinesFromReceipt(receipt.id),
      } : current);
      setConfirmState(null);
    };
    if (form.lines.some((line) => line.returnQty > 0 || line.reason || line.note)) {
      return setConfirmState({ title: "重新选择采购入库单", content: "重新选择将清空当前明细，确认继续？", confirmText: "确认", onConfirm: apply });
    }
    apply();
  };

  const validate = (intent: "draft" | "submit") => {
    const nextErrors: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);
    if (intent === "submit") {
      if (!form.receiptId) nextErrors.receiptId = "请选择关联采购入库单";
      if (!form.returnDate) nextErrors.returnDate = "请选择申请日期";
      if (form.returnDate > today) nextErrors.returnDate = "申请日期不能晚于今天";
      if (!form.lines.some((line) => Number(line.returnQty || 0) > 0)) openError("请至少填写一行退货数量");
      form.lines.forEach((line, index) => {
        if (Number(line.returnQty || 0) > Number(line.availableQty || 0)) nextErrors[`line-${index}-qty`] = `退货数量不能超过可退数量（${line.availableQty} 件）`;
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
    const saved = savePurchaseReturn(form, intent);
    if (!saved) return openError("保存失败");
    setDirty(false);
    if (intent === "draft") {
      setForm(saved);
      openToast("保存成功");
    } else {
      openToast("已提交审核，等待审核确认");
      navigate(`/purchase-return/${saved.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={mode === "create" ? "新增采购退货单" : `编辑采购退货单 ${form.no}`} actions={<div className="flex flex-wrap gap-2"><Button tone="primary" onClick={() => persist("draft")}>保存草稿</Button><Button tone="primary" onClick={() => persist("submit")}>提交审核</Button><Button onClick={() => !dirty ? navigate("/purchase-return") : setConfirmState({ title: "确认离开", content: "当前有未保存的内容，确认离开？", confirmText: "确认离开", onConfirm: () => navigate("/purchase-return") })}>返回列表</Button></div>} />
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="关联采购入库单" required error={errors.receiptId}>{mode === "edit" ? <ReadonlyValue value={form.receiptNo} /> : <Select value={form.receiptNo} onChange={(receiptNo) => {
            const receipt = receiptOptions.find((item) => item.no === receiptNo);
            if (receipt) selectReceipt(receipt.id);
          }} options={receiptOptions.map((item) => item.no)} allowSearch placeholder="请选择关联采购入库单" />}</LabeledField>
          <LabeledField label="供应商"><ReadonlyValue value={form.supplierLabel || "-"} /></LabeledField>
          <LabeledField label="退货仓库"><ReadonlyValue value={form.warehouseLabel || "-"} /></LabeledField>
          <LabeledField label="申请日期" required error={errors.returnDate}><DateField value={form.returnDate} onChange={(value) => updateField("returnDate", value)} /></LabeledField>
          <LabeledField label="退货备注" className="md:col-span-2 xl:col-span-4"><TextArea value={form.remark} onChange={(value) => updateField("remark", value)} maxLength={200} placeholder="请输入退货备注（选填）" /></LabeledField>
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`退货总数量 ${summaryQty} 件`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1420px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">{["序号", "商品", "规格型号", "单位", "原入库数量", "可退数量", "本次退货数量", "退货原因", "行备注"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr>
            </thead>
            <tbody>
              {form.lines.map((line, index) => {
                const disabled = line.availableQty === 0;
                return (
                  <tr key={line.id} className={cn("border-b border-line-1", disabled && "bg-fill-2 text-text-3")}>
                    <td className="px-3 py-2.5">{index + 1}</td>
                    <td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td>
                    <td className="px-3 py-2.5">{line.spec || "-"}</td>
                    <td className="px-3 py-2.5">{line.unit || "-"}</td>
                    <td className="px-3 py-2.5 text-right">{line.originalStockInQty}</td>
                    <td className="px-3 py-2.5 text-right text-warning">{line.availableQty}</td>
                    <td className="px-3 py-2.5">
                      <Input value={String(line.returnQty || 0)} onChange={(value) => updateLine(line.id, { returnQty: Number(value) || 0 })} className="text-right" readOnly={disabled} />
                      {errors[`line-${index}-qty`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-qty`]}</div> : null}
                    </td>
                    <td className="px-3 py-2.5">
                      {Number(line.returnQty || 0) > 0 ? <><Select value={line.reason} onChange={(reason) => updateLine(line.id, { reason })} options={purchaseReturnReasonOptions} placeholder="请选择退货原因" />{errors[`line-${index}-reason`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-reason`]}</div> : null}</> : <ReadonlyValue value="-" />}
                    </td>
                    <td className="px-3 py-2.5"><Input value={line.note} onChange={(value) => updateLine(line.id, { note: value })} readOnly={disabled} placeholder="行备注（选填）" /></td>
                  </tr>
                );
              })}
            </tbody>
            <SummaryFooter colSpan={9} lineCount={form.lines.length}>本次退货合计：{summaryQty} 件</SummaryFooter>
          </table>
        </div>
      </SurfaceCard>
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function PurchaseReturnStockoutCreatePage() { return <PurchaseReturnStockoutEditorPage mode="create" />; }
export function PurchaseReturnStockoutEditPage() { return <PurchaseReturnStockoutEditorPage mode="edit" />; }

function PurchaseReturnStockoutEditorPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const source = mode === "create" ? createPurchaseReturnStockoutDraft(searchParams.get("returnId") ?? "") : getPurchaseReturnStockout(recordId);
  const [form, setForm] = useState<PurchaseReturnStockoutRecord | null>(source ? JSON.parse(JSON.stringify(source)) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const returnOptions = getPurchaseReturnStockoutSourceReturns();

  useEffect(() => {
    setForm(source ? JSON.parse(JSON.stringify(source)) : null);
    setErrors({});
    setDirty(false);
  }, [mode, recordId, searchParams]);

  if (!form) return <SurfaceCard title="提示">未找到对应采购退货出库单，请返回列表重新进入。</SurfaceCard>;

  const totalQty = form.lines.reduce((sum, line) => sum + Number(line.stockoutQty || 0), 0);
  const totalAmount = form.lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const updateField = (key: keyof PurchaseReturnStockoutRecord, value: string) => {
    setDirty(true);
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [String(key)]: "" }));
  };

  const updateLine = (lineId: string, patch: Partial<PurchaseReturnStockoutLine>) => {
    setDirty(true);
    setForm((current) => current ? {
      ...current,
      lines: current.lines.map((line) => line.id === lineId ? {
        ...line,
        ...patch,
        amount: Number((((patch.stockoutQty ?? line.stockoutQty) || 0) * Number(line.price || 0)).toFixed(2)),
      } : line),
    } : current);
  };

  const selectReturn = (returnId: string) => {
    const returnDoc = returnOptions.find((item) => item.id === returnId);
    if (!returnDoc) return;
    const apply = () => {
      setDirty(true);
      setForm((current) => current ? {
        ...current,
        returnId: returnDoc.id,
        returnNo: returnDoc.no,
        supplierLabel: returnDoc.supplierLabel,
        warehouseLabel: returnDoc.warehouseLabel,
        lines: buildStockoutLinesFromReturn(returnDoc.id),
      } : current);
      setConfirmState(null);
    };
    if (form.lines.some((line) => line.stockoutQty > 0 || line.note)) {
      return setConfirmState({ title: "重新选择采购退货单", content: "重新选择将清空当前明细，确认继续？", confirmText: "确认", onConfirm: apply });
    }
    apply();
  };

  const validate = (intent: "draft" | "confirm") => {
    const nextErrors: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);
    if (intent === "confirm") {
      if (!form.returnId) nextErrors.returnId = "请选择关联采购退货单";
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
    const saved = savePurchaseReturnStockout(form);
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
        const saved = confirmPurchaseReturnStockout(form);
        if (!saved) return openError("关联的采购退货单已作废，无法继续出库");
        setConfirmState(null);
        setDirty(false);
        openToast("出库成功，库存已扣减");
        navigate(`/purchase-return-stockout/${saved.id}`);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={mode === "create" ? "新增采购退货出库单" : `编辑采购退货出库单 ${form.no}`} actions={<div className="flex flex-wrap gap-2"><Button tone="primary" onClick={saveDraft}>保存草稿</Button><Button tone="primary" onClick={doConfirm}>确认出库</Button><Button onClick={() => !dirty ? navigate("/purchase-return-stockout") : setConfirmState({ title: "确认离开", content: "当前有未保存的内容，确认离开？", confirmText: "确认离开", onConfirm: () => navigate("/purchase-return-stockout") })}>返回列表</Button></div>} />
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="关联采购退货单" required error={errors.returnId}>{mode === "edit" ? <ReadonlyValue value={form.returnNo} /> : <Select value={form.returnNo} onChange={(returnNo) => {
            const returnDoc = returnOptions.find((item) => item.no === returnNo);
            if (returnDoc) selectReturn(returnDoc.id);
          }} options={returnOptions.map((item) => item.no)} allowSearch placeholder="请选择关联采购退货单" />}</LabeledField>
          <LabeledField label="供应商"><ReadonlyValue value={form.supplierLabel || "-"} /></LabeledField>
          <LabeledField label="出库仓库"><ReadonlyValue value={form.warehouseLabel || "-"} /></LabeledField>
          <LabeledField label="出库日期" required error={errors.stockoutDate}><DateField value={form.stockoutDate} onChange={(value) => updateField("stockoutDate", value)} /></LabeledField>
          <LabeledField label="出库备注" className="md:col-span-2 xl:col-span-4"><TextArea value={form.remark} onChange={(value) => updateField("remark", value)} maxLength={200} placeholder="请输入出库备注（选填）" /></LabeledField>
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`本次出库：${totalQty} 件 | 总金额 ${formatMoney(totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1480px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["序号", "商品", "规格型号", "单位", "退货申请数量", "未出库数量", "本次出库数量", "出库单价", "出库金额", "行备注"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead>
            <tbody>
              {form.lines.map((line, index) => {
                const disabled = line.pendingQty === 0;
                return (
                  <tr key={line.id} className={cn("border-b border-line-1", disabled && "bg-fill-2 text-text-3")}>
                    <td className="px-3 py-2.5">{index + 1}</td>
                    <td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td>
                    <td className="px-3 py-2.5">{line.spec || "-"}</td>
                    <td className="px-3 py-2.5">{line.unit || "-"}</td>
                    <td className="px-3 py-2.5 text-right">{line.requestedQty}</td>
                    <td className="px-3 py-2.5 text-right text-warning">{line.pendingQty}</td>
                    <td className="px-3 py-2.5"><Input value={String(line.stockoutQty || 0)} onChange={(value) => updateLine(line.id, { stockoutQty: Number(value) || 0 })} className="text-right" readOnly={disabled} />{errors[`line-${index}-qty`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-qty`]}</div> : null}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(line.price)}</td>
                    <td className="px-3 py-2.5 text-right">{formatMoney(line.amount)}</td>
                    <td className="px-3 py-2.5"><Input value={line.note} onChange={(value) => updateLine(line.id, { note: value })} readOnly={disabled} placeholder="行备注（选填）" /></td>
                  </tr>
                );
              })}
            </tbody>
            <SummaryFooter colSpan={10} lineCount={form.lines.length}>本次出库合计：{totalQty} 件 | {formatMoney(totalAmount)}</SummaryFooter>
          </table>
        </div>
      </SurfaceCard>
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

export function PurchaseReturnDetailPage() {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const record = getPurchaseReturn(recordId);
  if (!record) return <SurfaceCard title="提示">未找到对应采购退货单，请返回列表重新进入。</SurfaceCard>;
  const linkedStockouts = getLinkedReturnStockouts(record.id);

  const openAction = (action: string) => {
    if (action === "编辑") return navigate(`/purchase-return/${record.id}/edit`);
    if (action === "创建退货出库单") return navigate(`/purchase-return-stockout/new?returnId=${record.id}`);
    const mapping: Record<string, ConfirmState> = {
      删除: { title: "确认删除", content: "删除后不可恢复，该退货单将从系统中永久移除，确认删除？", confirmText: "确认删除", onConfirm: () => { deletePurchaseReturn(record.id); openToast("采购退货单已删除"); navigate("/purchase-return"); } },
      提交审核: { title: "提交审核", content: "提交后单据将进入待审核状态，确认提交？", confirmText: "确认提交", onConfirm: () => { const saved = savePurchaseReturn(record, "submit"); if (!saved) return openError("提交失败"); openToast("已提交审核，等待审核确认"); navigate(`/purchase-return/${record.id}`); } },
      审核通过: { title: "确认审核", content: "审核通过后关键字段将锁定，不可再修改，确认审核通过？", confirmText: "确认审核", onConfirm: () => { approvePurchaseReturn(record.id); openToast("审核通过"); navigate(`/purchase-return/${record.id}`); } },
      驳回: { title: "确认驳回", content: "驳回后单据将退回草稿，申请人可重新修改，确认驳回？", confirmText: "确认驳回", onConfirm: () => { rejectPurchaseReturn(record.id); openToast("已驳回，单据已退回草稿"); navigate(`/purchase-return/${record.id}`); } },
      作废: { title: "确认作废", content: "作废后不可恢复，单据将进入已作废状态，确认作废？", confirmText: "确认作废", onConfirm: () => { voidPurchaseReturn(record.id); openToast("采购退货单已作废"); navigate(`/purchase-return/${record.id}`); } },
    };
    setConfirmState(mapping[action === "审核" ? "审核通过" : action]);
  };

  const detailActions = (() => {
    switch (record.status) {
      case "草稿": return ["编辑", "删除", "提交审核"];
      case "待审核": return ["审核通过", "驳回", "作废"];
      case "待出库": return ["创建退货出库单", "作废"];
      case "部分出库": return ["创建退货出库单"];
      default: return [];
    }
  })();

  const showProgressCols = record.status === "待出库" || record.status === "部分出库" || record.status === "已完成";

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={`采购退货单 ${record.no}`} actions={<div className="flex flex-wrap gap-2"><Button onClick={() => navigate("/purchase-return")}>返回列表</Button>{detailActions.map((action) => <Button key={action} tone={action === "创建退货出库单" ? "primary" : "default"} onClick={() => openAction(action)}>{action}</Button>)}</div>}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></PageTitle>
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="退货单号" value={record.no} />
          <DetailValue label="关联采购入库单" value={<button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-receipt/${record.receiptId}`)}>{record.receiptNo}</button>} />
          <DetailValue label="供应商" value={record.supplierLabel} />
          <DetailValue label="退货仓库" value={record.warehouseLabel} />
          <DetailValue label="申请日期" value={record.returnDate} />
          <DetailValue label="退货备注" value={record.remark || "-"} className="xl:col-span-3" />
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`退货总数量 ${record.totalQty} 件`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1380px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">
                {(showProgressCols
                  ? ["序号", "商品", "规格型号", "单位", "本次退货数量", "累计已出库数量", "未出库数量", "退货原因", "行备注"]
                  : ["序号", "商品", "规格型号", "单位", "原入库数量", "可退数量", "本次退货数量", "退货原因", "行备注"]
                ).map((label) => (
                  <th key={label} className="border-b border-line-1 px-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {record.lines.map((line, index) => (
                <tr key={line.id} className="border-b border-line-1">
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td>
                  <td className="px-3 py-2.5">{line.spec || "-"}</td>
                  <td className="px-3 py-2.5">{line.unit || "-"}</td>
                  {showProgressCols ? <>
                    <td className="px-3 py-2.5 font-medium">{line.returnQty}</td>
                    <td className={cn("px-3 py-2.5", record.status === "已完成" && "text-success")}>{line.shippedQty}</td>
                    <td className={cn("px-3 py-2.5", line.pendingQty > 0 && "text-warning")}>{line.pendingQty}</td>
                  </> : <>
                    <td className="px-3 py-2.5">{line.originalStockInQty}</td>
                    <td className="px-3 py-2.5 text-warning">{line.availableQty}</td>
                    <td className={cn("px-3 py-2.5 font-medium", line.returnQty === 0 && "text-text-3")}>{line.returnQty}</td>
                  </>}
                  <td className="px-3 py-2.5">{line.reason || "-"}</td>
                  <td className="px-3 py-2.5">{line.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
      {showProgressCols ? (
        <SurfaceCard title="关联退货出库单">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["出库单号", "出库日期", "本次出库数量", "操作人", "状态"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead>
              <tbody>{linkedStockouts.map((doc) => <tr key={doc.id} className="border-b border-line-1"><td className="px-3 py-2.5"><button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-return-stockout/${doc.id}`)}>{doc.no}</button></td><td className="px-3 py-2.5">{doc.stockoutDate}</td><td className="px-3 py-2.5">{doc.totalQty}</td><td className="px-3 py-2.5">{doc.confirmBy || "-"}</td><td className="px-3 py-2.5"><StatusPill tone={doc.statusTone}>{doc.status}</StatusPill></td></tr>)}</tbody>
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

export function PurchaseReturnStockoutDetailPage() {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const record = getPurchaseReturnStockout(recordId);
  if (!record) return <SurfaceCard title="提示">未找到对应采购退货出库单，请返回列表重新进入。</SurfaceCard>;

  const openAction = (action: string) => {
    if (action === "编辑") return navigate(`/purchase-return-stockout/${record.id}/edit`);
    const mapping: Record<string, ConfirmState> = {
      删除: { title: "确认删除", content: "删除后不可恢复，该出库单将从系统中永久移除，确认删除？", confirmText: "确认删除", onConfirm: () => { deletePurchaseReturnStockout(record.id); openToast("采购退货出库单已删除"); navigate("/purchase-return-stockout"); } },
      确认出库: { title: "确认出库", content: "确认出库后库存将立即扣减，且操作不可撤销，确认出库？", confirmText: "确认出库", onConfirm: () => { const saved = confirmPurchaseReturnStockout(record); if (!saved) return openError("关联的采购退货单已作废，无法继续出库"); openToast("出库成功，库存已扣减"); navigate(`/purchase-return-stockout/${record.id}`); } },
    };
    setConfirmState(mapping[action]);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={`采购退货出库单 ${record.no}`} actions={<div className="flex flex-wrap gap-2"><Button onClick={() => navigate("/purchase-return-stockout")}>返回列表</Button>{record.status === "草稿" ? <><Button onClick={() => openAction("编辑")}>编辑</Button><Button onClick={() => openAction("删除")}>删除</Button><Button tone="primary" onClick={() => openAction("确认出库")}>确认出库</Button></> : null}</div>}><StatusPill tone={record.statusTone}>{record.status}</StatusPill></PageTitle>
      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="出库单号" value={record.no} />
          <DetailValue label="关联采购退货单" value={<button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-return/${record.returnId}`)}>{record.returnNo}</button>} />
          <DetailValue label="供应商" value={record.supplierLabel} />
          <DetailValue label="出库仓库" value={record.warehouseLabel} />
          <DetailValue label="出库日期" value={record.stockoutDate} />
          <DetailValue label="出库备注" value={record.remark || "-"} className="xl:col-span-3" />
        </div>
      </SurfaceCard>
      <SurfaceCard title="商品明细" extra={`本次出库：${record.totalQty} 件 | 总金额 ${formatMoney(record.totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1380px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2"><tr className="h-[42px]">{["序号", "商品", "规格型号", "单位", "退货申请数量", "本次出库数量", "出库单价", "出库金额", "行备注"].map((label) => <th key={label} className="border-b border-line-1 px-3">{label}</th>)}</tr></thead>
            <tbody>{record.lines.map((line, index) => <tr key={line.id} className="border-b border-line-1"><td className="px-3 py-2.5">{index + 1}</td><td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td><td className="px-3 py-2.5">{line.spec || "-"}</td><td className="px-3 py-2.5">{line.unit || "-"}</td><td className="px-3 py-2.5">{line.requestedQty}</td><td className="px-3 py-2.5 font-medium">{line.stockoutQty}</td><td className="px-3 py-2.5">{formatMoney(line.price)}</td><td className="px-3 py-2.5">{formatMoney(line.amount)}</td><td className="px-3 py-2.5">{line.note || "-"}</td></tr>)}</tbody>
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
