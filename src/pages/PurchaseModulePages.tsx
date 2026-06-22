import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BatchSearchInput, Button, Checkbox, DateField, DateRangeField, Input, PageTitle, Pagination, ResizableHeaderCell, Select, StatusPill, TabBar, TableSortHeader, TextArea, useResizableColumns } from "../components/Ui";
import { ConfirmModal, ConfirmState, EmptyStateRow, LabeledField, ReadonlyValue, SurfaceCard, TextAction, formatMoney, inDateRange, openError, openToast, parseBatchInput } from "../components/ModuleKit";
import { ActionsCell, DataCell, MoneyCell, StatusCell, StickyFirstColumnCell, StickyFirstColumnHeader, StickySelectCell, SummaryFooter } from "../components/TableCells";
import { cn } from "../utils/cn";
import { compareRecord } from "../utils/sort";
import { TABLE_MIN_WIDTH } from "../utils/tableConstants";
import {
  approvePurchaseOrder,
  buildReceiptLinesFromOrder,
  closePurchaseOrder,
  confirmPurchaseReceipt,
  createOrderDraft,
  createReceiptDraft,
  deletePurchaseOrder,
  deletePurchaseReceipt,
  findSupplier,
  findWarehouse,
  formatInt,
  getLinkedDraftReceipts,
  getLinkedStockedReceipts,
  getProductCatalog,
  getPurchaseOrder,
  getPurchaseOrders,
  getPurchaseReceipt,
  getPurchaseReceipts,
  getReceiptCreateOrderOptions,
  getSupplierOptions,
  getWarehouseOptions,
  purchaseReceiptDiffReasons,
  purchaseTaxRateOptions,
  rejectPurchaseOrder,
  savePurchaseOrder,
  savePurchaseReceipt,
  type PurchaseOrderLine,
  type PurchaseOrderRecord,
  type PurchaseReceiptLine,
  type PurchaseReceiptRecord,
  type PurchaseOrderStatus,
  voidPurchaseOrder,
} from "../data/purchaseWorkspace";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

type OrderFilterState = {
  no: string;
  supplier: string;
  warehouse: string;
  status: string;
  orderDate: { start: string; end: string };
  expectedDate: { start: string; end: string };
  updatedAt: { start: string; end: string };
};

type StatusTab = "全部" | "草稿" | "待审核" | "待入库" | "部分入库" | "已完成" | "已作废";

const STATUS_TABS: StatusTab[] = ["全部", "草稿", "待审核", "待入库", "部分入库", "已完成", "已作废"];

type ReceiptFilterState = {
  no: string;
  orderNo: string;
  supplier: string;
  warehouse: string;
  status: string;
  stockInDate: { start: string; end: string };
  updatedAt: { start: string; end: string };
};

const orderListColumns = [
  { key: "__select__", width: 48, minWidth: 48, maxWidth: 48, resizable: false },
  { key: "no", width: 180, minWidth: 180 },
  { key: "status", width: 100, minWidth: 100 },
  { key: "supplierLabel", width: 200, minWidth: 200 },
  { key: "warehouseLabel", width: 160, minWidth: 160 },
  { key: "orderDate", width: 120, minWidth: 120 },
  { key: "expectedDate", width: 130, minWidth: 130 },
  { key: "skuCount", width: 80, minWidth: 80 },
  { key: "totalAmount", width: 130, minWidth: 130 },
  { key: "updatedAt", width: 170, minWidth: 170 },
  { key: "__actions__", width: 120, minWidth: 120, resizable: false },
] as const;

const receiptListColumns = [
  { key: "__select__", width: 48, minWidth: 48, maxWidth: 48, resizable: false },
  { key: "no", width: 180, minWidth: 180 },
  { key: "status", width: 90, minWidth: 90 },
  { key: "orderNo", width: 170, minWidth: 170 },
  { key: "supplierLabel", width: 220, minWidth: 200 },
  { key: "warehouseLabel", width: 180, minWidth: 160 },
  { key: "stockInDate", width: 120, minWidth: 120 },
  { key: "totalAmount", width: 140, minWidth: 140 },
  { key: "updatedAt", width: 170, minWidth: 170 },
  { key: "__actions__", width: 180, minWidth: 150, resizable: false },
] as const;

const emptyOrderFilters = (): OrderFilterState => ({
  no: "",
  supplier: "",
  warehouse: "",
  status: "全部",
  orderDate: { start: "", end: "" },
  expectedDate: { start: "", end: "" },
  updatedAt: { start: "", end: "" },
});

const emptyReceiptFilters = (): ReceiptFilterState => ({
  no: "",
  orderNo: "",
  supplier: "",
  warehouse: "",
  status: "全部",
  stockInDate: { start: "", end: "" },
  updatedAt: { start: "", end: "" },
});

function todayValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasAtMostTwoDecimals(value: number) {
  return Number.isInteger(value * 100);
}

type ProductPickerModalProps = {
  open: boolean;
  maxSelectCount: number;
  selectedCodes: string[];
  onCancel: () => void;
  onConfirm: (codes: string[]) => void;
};

function ProductPickerModal({ open, maxSelectCount, selectedCodes: _selectedCodes, onCancel, onConfirm }: ProductPickerModalProps) {
  const [keyword, setKeyword] = useState("");
  const [draftSelected, setDraftSelected] = useState<string[]>([]);
  const catalog = useMemo(() => getProductCatalog(), []);

  useEffect(() => {
    if (!open) {
      setKeyword("");
      setDraftSelected([]);
    }
  }, [open]);

  if (!open) return null;

  const filteredCatalog = catalog.filter((item) => {
    const haystack = `${item.code} ${item.name} ${item.barcode} ${item.spec}`.toLowerCase();
    return haystack.includes(keyword.trim().toLowerCase());
  });

  const reachedLimit = draftSelected.length >= maxSelectCount;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4">
      <div className="flex max-h-[80vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-lg border border-line-1 bg-white shadow-drawer">
        <div className="flex items-center justify-between border-b border-line-1 px-5 py-4">
          <div>
            <div className="text-[15px] font-semibold text-text-1">选择商品</div>
            <div className="mt-1 text-xs text-text-3">最多可选择 {maxSelectCount} 条商品明细</div>
          </div>
          <Button onClick={onCancel}>关闭</Button>
        </div>
        <div className="px-5 py-4">
          <Input value={keyword} onChange={setKeyword} placeholder="按商品编码、名称、条码、规格搜索" />
        </div>
        <div className="overflow-auto px-5 pb-4">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">
                {["选择", "商品编码", "商品名称", "商品条码", "规格型号", "单位", "默认采购价"].map((label) => (
                  <th key={label} className="border-b border-line-1 px-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCatalog.length === 0 ? (
                <EmptyStateRow colSpan={7} text="暂无匹配商品" />
              ) : (
                filteredCatalog.map((item) => {
                  const checked = draftSelected.includes(item.code);
                  const disabled = !checked && reachedLimit;
                  return (
                    <tr key={item.code} className="border-b border-line-1">
                      <td className="px-3 py-2.5">
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onChange={(nextChecked) => {
                            setDraftSelected((current) => {
                              if (nextChecked) return [...current, item.code];
                              return current.filter((code) => code !== item.code);
                            });
                          }}
                        />
                      </td>
                      <td className="px-3 py-2.5">{item.code}</td>
                      <td className="px-3 py-2.5">{item.name}</td>
                      <td className="px-3 py-2.5">{item.barcode || "-"}</td>
                      <td className="px-3 py-2.5">{item.spec || "-"}</td>
                      <td className="px-3 py-2.5">{item.unit || "-"}</td>
                      <td className="px-3 py-2.5 text-right">{formatMoney(item.price)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 border-t border-line-1 px-5 py-4">
          <Button onClick={onCancel}>取消</Button>
          <Button tone="primary" onClick={draftSelected.length === 0 ? undefined : () => onConfirm(draftSelected)} className={draftSelected.length === 0 ? "pointer-events-none opacity-50" : ""}>
            确认选择
          </Button>
        </div>
      </div>
    </div>
  );
}

function getTabCounts(records: PurchaseOrderRecord[], filters: OrderFilterState) {
  const noSet = parseBatchInput(filters.no);
  const result: Record<StatusTab, number> = {
    "全部": 0,
    "草稿": 0,
    "待审核": 0,
    "待入库": 0,
    "部分入库": 0,
    "已完成": 0,
    "已作废": 0,
  };
  records.forEach((record) => {
    // Apply non-status filters for tab counts
    if (noSet.length > 0 && !noSet.includes(record.no)) return;
    if (filters.supplier && record.supplierLabel !== filters.supplier) return;
    if (filters.warehouse && record.warehouseLabel !== filters.warehouse) return;
    if (!inDateRange(record.orderDate, filters.orderDate)) return;
    if (!inDateRange(record.expectedDate, filters.expectedDate)) return;
    if (!inDateRange(record.updatedAt.slice(0, 10), filters.updatedAt)) return;
    result["全部"]++;
    if (result[record.status] !== undefined) result[record.status]++;
  });
  return result;
}

function StatusTabBadge({ count, active }: { count: number; active?: boolean }) {
  const countCls = active ? "text-brand-6/85" : "text-text-3";
  if (count === 0) return <span className={cn("ml-1 tabular-nums text-[12px]", countCls)}>0</span>;
  if (count > 99) return <span className={cn("ml-1 tabular-nums text-[12px]", countCls)}>99+</span>;
  return <span className={cn("ml-1 tabular-nums text-[12px]", countCls)}>{count}</span>;
}

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PurchaseOrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<StatusTab>("全部");
  const [filters, setFilters] = useState<OrderFilterState>(emptyOrderFilters);
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const tabCounts = useMemo(() => getTabCounts(records, filters), [records, filters]);

  useEffect(() => {
    setRecords(getPurchaseOrders());
  }, []);

  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("purchase-orders:list:v2", [...orderListColumns]);

  const filteredRecords = useMemo(() => {
    const noSet = parseBatchInput(filters.no);
    return records
      .filter((record) => {
        // Tab filter
        if (activeTab !== "全部" && record.status !== activeTab) return false;
        // Query filters
        if (noSet.length > 0 && !noSet.includes(record.no)) return false;
        if (filters.supplier && record.supplierLabel !== filters.supplier) return false;
        if (filters.warehouse && record.warehouseLabel !== filters.warehouse) return false;
        // Status filter in query bar is hidden when a specific tab is active, but we still apply it if set
        if (activeTab === "全部" && filters.status !== "全部" && record.status !== filters.status) return false;
        if (!inDateRange(record.orderDate, filters.orderDate)) return false;
        if (!inDateRange(record.expectedDate, filters.expectedDate)) return false;
        if (!inDateRange(record.updatedAt.slice(0, 10), filters.updatedAt)) return false;
        return true;
      })
      .sort((a, b) => compareRecord(a, b, sortConfig));
  }, [records, filters, sortConfig, activeTab]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [currentPage, filteredRecords, pageSize]);

  const isAllSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.includes(row.id));

  const refresh = () => {
    setRecords(getPurchaseOrders());
  };

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else {
        setSortConfig(null);
      }
      return;
    }
    setSortConfig({ key, direction: "asc" });
  };

  const handleAction = (record: PurchaseOrderRecord, action: string) => {
    if (action === "查看") {
      navigate(`/purchase-orders/${record.id}`);
      return;
    }
    if (action === "编辑") {
      navigate(`/purchase-orders/${record.id}/edit`);
      return;
    }
    if (action === "创建入库单") {
      navigate(`/purchase-receipt/new?orderId=${record.id}`);
      return;
    }

    const actionMap: Record<string, { title: string; content: string; confirmText: string; run: () => void }> = {
      删除: {
        title: "确认删除",
        content: "删除后不可恢复，该采购订单将从系统中永久移除，确认删除？",
        confirmText: "确认删除",
        run: () => {
          deletePurchaseOrder(record.id);
          openToast("采购订单已删除");
          setConfirmState(null);
          refresh();
        },
      },
      提交审核: {
        title: "提交审核",
        content: "提交后单据将进入待审核状态，确认提交？",
        confirmText: "确认提交",
        run: () => {
          const saved = savePurchaseOrder(record, "submit");
          if (!saved) {
            openError("提交失败");
            return;
          }
          openToast("已提交审核，等待审核确认");
          setConfirmState(null);
          refresh();
        },
      },
      审核: {
        title: "确认审核",
        content: "审核通过后关键字段将锁定，不可再修改，确认审核通过？",
        confirmText: "确认审核",
        run: () => {
          approvePurchaseOrder(record.id);
          openToast("审核通过");
          setConfirmState(null);
          refresh();
        },
      },
      驳回: {
        title: "确认驳回",
        content: "驳回后单据将退回草稿，采购员可重新修改，确认驳回？",
        confirmText: "确认驳回",
        run: () => {
          rejectPurchaseOrder(record.id);
          openToast("已驳回，单据已退回草稿");
          setConfirmState(null);
          refresh();
        },
      },
      作废: {
        title: "确认作废",
        content: "作废后不可恢复，单据将进入已作废状态，确认作废？",
        confirmText: "确认作废",
        run: () => {
          voidPurchaseOrder(record.id);
          openToast("采购订单已作废");
          setConfirmState(null);
          refresh();
        },
      },
      关闭订单: {
        title: "确认关闭",
        content: "关闭后剩余未入库数量将不再接收，确认关闭订单？",
        confirmText: "确认关闭",
        run: () => {
          closePurchaseOrder(record.id);
          openToast("订单已关闭，剩余数量不再接收");
          setConfirmState(null);
          refresh();
        },
      },
    };

    const target = actionMap[action];
    if (!target) return;
    setConfirmState({
      title: target.title,
      content: target.content,
      confirmText: target.confirmText,
      onConfirm: target.run,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft">
        <div className="bg-white px-4 pt-2.5">
          <TabBar
            variant="underline"
            items={STATUS_TABS.map((tab) => ({
              key: tab,
              label: (
                <span className="flex items-center whitespace-nowrap">
                  {tab}
                  <StatusTabBadge count={tabCounts[tab]} active={activeTab === tab} />
                </span>
              ),
            }))}
            activeKey={activeTab}
            onChange={(key: StatusTab) => {
              setActiveTab(key);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <LabeledField label="采购单号">
              <BatchSearchInput value={filters.no} onChange={(no) => setFilters((current) => ({ ...current, no }))} placeholder="支持换行或英文逗号分隔" />
            </LabeledField>
            <LabeledField label="供应商">
              <Select value={filters.supplier} onChange={(supplier) => setFilters((current) => ({ ...current, supplier }))} options={getSupplierOptions()} allowSearch placeholder="全部" />
            </LabeledField>
            <LabeledField label="入库仓库">
              <Select value={filters.warehouse} onChange={(warehouse) => setFilters((current) => ({ ...current, warehouse }))} options={getWarehouseOptions()} allowSearch placeholder="全部" />
            </LabeledField>
            {activeTab === "全部" ? (
              <LabeledField label="订单状态">
                <Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={["全部", "草稿", "待审核", "待入库", "部分入库", "已完成", "已作废"]} />
              </LabeledField>
            ) : null}
            <LabeledField label="下单日期">
              <DateRangeField value={filters.orderDate} onChange={(orderDate) => setFilters((current) => ({ ...current, orderDate }))} />
            </LabeledField>
            <LabeledField label="预计到货日期">
              <DateRangeField value={filters.expectedDate} onChange={(expectedDate) => setFilters((current) => ({ ...current, expectedDate }))} />
            </LabeledField>
            {expanded ? (
              <LabeledField label="最后修改时间">
                <DateRangeField value={filters.updatedAt} onChange={(updatedAt) => setFilters((current) => ({ ...current, updatedAt }))} />
              </LabeledField>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button onClick={() => setExpanded((current) => !current)}>{expanded ? "收起" : "展开"}</Button>
            <Button
              onClick={() => {
                setFilters(emptyOrderFilters());
                setSelectedIds([]);
                setCurrentPage(1);
              }}
            >
              重置
            </Button>
            <Button tone="primary" onClick={() => setCurrentPage(1)}>
              搜索
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button tone="primary" onClick={() => navigate("/purchase-orders/new")}>
            新增
          </Button>
          <Button onClick={() => openToast(`导出成功，共导出 ${selectedIds.length || filteredRecords.length} 条记录`)}>导出</Button>
        </div>
              </div>

      <div className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.document) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                <StickySelectCell style={getColumnStyle("__select__")} variant="header" checked={isAllSelected} onChange={(checked) => setSelectedIds(checked ? Array.from(new Set([...selectedIds, ...pageRows.map((row) => row.id)])) : selectedIds.filter((id) => !pageRows.some((row) => row.id === id)))} />
                <StickyFirstColumnHeader width={getColumnStyle("no").width} minWidth={getColumnStyle("no").minWidth} left={getColumnStyle("__select__").width} onResizeStart={(clientX) => startResize("no", clientX)} label="采购单号" sortKey="no" currentSort={sortConfig} onSort={handleSort} />
                <ResizableHeaderCell width={getColumnStyle("status").width} minWidth={getColumnStyle("status").minWidth} onResizeStart={(clientX) => startResize("status", clientX)}>订单状态</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("supplierLabel").width} minWidth={getColumnStyle("supplierLabel").minWidth} onResizeStart={(clientX) => startResize("supplierLabel", clientX)}>供应商</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("warehouseLabel").width} minWidth={getColumnStyle("warehouseLabel").minWidth} onResizeStart={(clientX) => startResize("warehouseLabel", clientX)}>入库仓库</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("orderDate").width} minWidth={getColumnStyle("orderDate").minWidth} onResizeStart={(clientX) => startResize("orderDate", clientX)}>
                  <TableSortHeader label="下单日期" sortKey="orderDate" currentSort={sortConfig} onSort={handleSort} />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("expectedDate").width} minWidth={getColumnStyle("expectedDate").minWidth} onResizeStart={(clientX) => startResize("expectedDate", clientX)}>预计到货日期</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("skuCount").width} minWidth={getColumnStyle("skuCount").minWidth} className="text-center" onResizeStart={(clientX) => startResize("skuCount", clientX)}>商品种数</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("totalAmount").width} minWidth={getColumnStyle("totalAmount").minWidth} className="text-right" onResizeStart={(clientX) => startResize("totalAmount", clientX)}>
                  <TableSortHeader label="采购总金额" sortKey="totalAmount" currentSort={sortConfig} onSort={handleSort} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("updatedAt").width} minWidth={getColumnStyle("updatedAt").minWidth} onResizeStart={(clientX) => startResize("updatedAt", clientX)}>
                  <TableSortHeader label="最后修改时间" sortKey="updatedAt" currentSort={sortConfig} onSort={handleSort} />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">
                  操作
                </ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <EmptyStateRow colSpan={10} text="暂无数据" />
              ) : (
                pageRows.map((record) => (
                  <tr key={record.id} className="group h-[44px] border-b border-line-1 text-text-2 hover:bg-hover-bg">
                    <StickySelectCell style={getColumnStyle("__select__")} variant="body" checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((current) => (current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id]))} />
                    <StickyFirstColumnCell bodyStyle={{ ...getColumnStyle("no"), left: getColumnStyle("__select__").width }}>
                      <button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-orders/${record.id}`)}>
                        {record.no}
                      </button>
                    </StickyFirstColumnCell>
                    <StatusCell style={getColumnStyle("status")} tone={record.statusTone} label={record.status} />
                    <DataCell style={getColumnStyle("supplierLabel")}>{record.supplierLabel}</DataCell>
                    <DataCell style={getColumnStyle("warehouseLabel")}>{record.warehouseLabel}</DataCell>
                    <DataCell style={getColumnStyle("orderDate")}>{record.orderDate}</DataCell>
                    <DataCell style={getColumnStyle("expectedDate")}>{record.expectedDate || "-"}</DataCell>
                    <DataCell style={getColumnStyle("skuCount")} align="center">{record.skuCount} 种</DataCell>
                    <MoneyCell style={getColumnStyle("totalAmount")} value={record.totalAmount} />
                    <DataCell style={getColumnStyle("updatedAt")}>{record.updatedAt}</DataCell>
                    <ActionsCell style={getColumnStyle("__actions__")}>
                        {getOrderActions(record.status).map((action) => (
                          <TextAction key={action} onClick={() => handleAction(record, action)}>
                            {action}
                          </TextAction>
                        ))}
                    </ActionsCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        total={filteredRecords.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

function getOrderActions(status: PurchaseOrderStatus) {
  switch (status) {
    case "草稿":
      return ["查看", "编辑", "提交审核", "删除"];
    case "待审核":
      return ["查看", "审核", "驳回", "作废"];
    case "待入库":
      return ["查看", "创建入库单", "作废"];
    case "部分入库":
      return ["查看", "创建入库单", "关闭订单"];
    default:
      return ["查看"];
  }
}

export function PurchaseReceiptPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PurchaseReceiptRecord[]>([]);
  const [filters, setFilters] = useState<ReceiptFilterState>(emptyReceiptFilters);
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    setRecords(getPurchaseReceipts());
  }, []);

  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("purchase-receipt:list:v2", [...receiptListColumns]);

  const filteredRecords = useMemo(() => {
    const noSet = parseBatchInput(filters.no);
    const orderNoSet = parseBatchInput(filters.orderNo);
    return records
      .filter((record) => {
        if (noSet.length > 0 && !noSet.includes(record.no)) return false;
        if (orderNoSet.length > 0 && !orderNoSet.includes(record.orderNo)) return false;
        if (filters.supplier && record.supplierLabel !== filters.supplier) return false;
        if (filters.warehouse && record.warehouseLabel !== filters.warehouse) return false;
        if (filters.status !== "全部" && record.status !== filters.status) return false;
        if (!inDateRange(record.stockInDate, filters.stockInDate)) return false;
        if (!inDateRange(record.updatedAt.slice(0, 10), filters.updatedAt)) return false;
        return true;
      })
      .sort((a, b) => compareRecord(a, b, sortConfig));
  }, [records, filters, sortConfig]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [currentPage, filteredRecords, pageSize]);

  const isAllSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.includes(row.id));

  const refresh = () => setRecords(getPurchaseReceipts());

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else {
        setSortConfig(null);
      }
      return;
    }
    setSortConfig({ key, direction: "asc" });
  };

  const handleAction = (record: PurchaseReceiptRecord, action: string) => {
    if (action === "查看") {
      navigate(`/purchase-receipt/${record.id}`);
      return;
    }
    if (action === "编辑") {
      navigate(`/purchase-receipt/${record.id}/edit`);
      return;
    }

    const actionMap: Record<string, { title: string; content: string; confirmText: string; run: () => void }> = {
      确认入库: {
        title: "确认入库",
        content: "确认入库后库存将立即更新，且不可撤销，确认入库？",
        confirmText: "确认入库",
        run: () => {
          const saved = confirmPurchaseReceipt(record);
          if (!saved) {
            openError("关联的采购订单状态异常，无法继续入库");
            return;
          }
          openToast("入库成功，库存已更新");
          setConfirmState(null);
          refresh();
        },
      },
      删除: {
        title: "确认删除",
        content: "删除后不可恢复，该入库单将从系统中永久移除，确认删除？",
        confirmText: "确认删除",
        run: () => {
          deletePurchaseReceipt(record.id);
          openToast("采购入库单已删除");
          setConfirmState(null);
          refresh();
        },
      },
    };

    const target = actionMap[action];
    if (!target) return;
    setConfirmState({
      title: target.title,
      content: target.content,
      confirmText: target.confirmText,
      onConfirm: target.run,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SurfaceCard title="查询条件">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <LabeledField label="入库单号">
            <BatchSearchInput value={filters.no} onChange={(no) => setFilters((current) => ({ ...current, no }))} placeholder="支持换行或英文逗号分隔" />
          </LabeledField>
          <LabeledField label="关联采购订单">
            <BatchSearchInput value={filters.orderNo} onChange={(orderNo) => setFilters((current) => ({ ...current, orderNo }))} placeholder="按采购单号批量精确搜索" />
          </LabeledField>
          <LabeledField label="供应商">
            <Select value={filters.supplier} onChange={(supplier) => setFilters((current) => ({ ...current, supplier }))} options={getSupplierOptions()} allowSearch placeholder="全部" />
          </LabeledField>
          <LabeledField label="入库仓库">
            <Select value={filters.warehouse} onChange={(warehouse) => setFilters((current) => ({ ...current, warehouse }))} options={getWarehouseOptions()} allowSearch placeholder="全部" />
          </LabeledField>
          <LabeledField label="入库状态">
            <Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={["全部", "草稿", "已入库", "已作废"]} />
          </LabeledField>
          <LabeledField label="入库日期" className="xl:col-span-2">
            <DateRangeField value={filters.stockInDate} onChange={(stockInDate) => setFilters((current) => ({ ...current, stockInDate }))} />
          </LabeledField>
          {expanded ? (
            <LabeledField label="最后修改时间" className="xl:col-span-2">
              <DateRangeField value={filters.updatedAt} onChange={(updatedAt) => setFilters((current) => ({ ...current, updatedAt }))} />
            </LabeledField>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={() => setExpanded((current) => !current)}>{expanded ? "收起" : "展开"}</Button>
          <Button
            onClick={() => {
              setFilters(emptyReceiptFilters());
              setSelectedIds([]);
              setCurrentPage(1);
            }}
          >
            重置
          </Button>
          <Button tone="primary" onClick={() => setCurrentPage(1)}>
            搜索
          </Button>
        </div>
      </SurfaceCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button tone="primary" onClick={() => navigate("/purchase-receipt/new")}>
            新增
          </Button>
          <Button onClick={() => openToast(`导出成功，共导出 ${selectedIds.length || filteredRecords.length} 条记录`)}>导出</Button>
        </div>
              </div>

      <div className="overflow-hidden rounded-lg border border-line-1 bg-white shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.documentReceipt) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                <StickySelectCell style={getColumnStyle("__select__")} variant="header" checked={isAllSelected} onChange={(checked) => setSelectedIds(checked ? Array.from(new Set([...selectedIds, ...pageRows.map((row) => row.id)])) : selectedIds.filter((id) => !pageRows.some((row) => row.id === id)))} />
                <StickyFirstColumnHeader width={getColumnStyle("no").width} minWidth={getColumnStyle("no").minWidth} left={getColumnStyle("__select__").width} onResizeStart={(clientX) => startResize("no", clientX)} label="入库单号" sortKey="no" currentSort={sortConfig} onSort={handleSort} />
                <ResizableHeaderCell width={getColumnStyle("status").width} minWidth={getColumnStyle("status").minWidth} onResizeStart={(clientX) => startResize("status", clientX)}>入库状态</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("orderNo").width} minWidth={getColumnStyle("orderNo").minWidth} onResizeStart={(clientX) => startResize("orderNo", clientX)}>关联采购订单</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("supplierLabel").width} minWidth={getColumnStyle("supplierLabel").minWidth} onResizeStart={(clientX) => startResize("supplierLabel", clientX)}>供应商</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("warehouseLabel").width} minWidth={getColumnStyle("warehouseLabel").minWidth} onResizeStart={(clientX) => startResize("warehouseLabel", clientX)}>入库仓库</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("stockInDate").width} minWidth={getColumnStyle("stockInDate").minWidth} onResizeStart={(clientX) => startResize("stockInDate", clientX)}>入库日期</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("totalAmount").width} minWidth={getColumnStyle("totalAmount").minWidth} className="text-right" onResizeStart={(clientX) => startResize("totalAmount", clientX)}>
                  <TableSortHeader label="本次入库总金额" sortKey="totalAmount" currentSort={sortConfig} onSort={handleSort} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("updatedAt").width} minWidth={getColumnStyle("updatedAt").minWidth} onResizeStart={(clientX) => startResize("updatedAt", clientX)}>最后修改时间</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">
                  操作
                </ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <EmptyStateRow colSpan={10} text="暂无数据" />
              ) : (
                pageRows.map((record) => (
                  <tr key={record.id} className="group h-[44px] border-b border-line-1 text-text-2 hover:bg-hover-bg">
                    <StickySelectCell style={getColumnStyle("__select__")} variant="body" checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((current) => (current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id]))} />
                    <StickyFirstColumnCell bodyStyle={{ ...getColumnStyle("no"), left: getColumnStyle("__select__").width }}>
                      <button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-receipt/${record.id}`)}>
                        {record.no}
                      </button>
                    </StickyFirstColumnCell>
                    <StatusCell style={getColumnStyle("status")} tone={record.statusTone} label={record.status} />
                    <DataCell style={getColumnStyle("orderNo")}>
                      <button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-orders/${record.orderId}`)}>
                        {record.orderNo}
                      </button>
                    </DataCell>
                    <DataCell style={getColumnStyle("supplierLabel")}>{record.supplierLabel}</DataCell>
                    <DataCell style={getColumnStyle("warehouseLabel")}>{record.warehouseLabel}</DataCell>
                    <DataCell style={getColumnStyle("stockInDate")}>{record.stockInDate}</DataCell>
                    <MoneyCell style={getColumnStyle("totalAmount")} value={record.totalAmount} />
                    <DataCell style={getColumnStyle("updatedAt")}>{record.updatedAt}</DataCell>
                    <ActionsCell style={getColumnStyle("__actions__")}>
                        {getReceiptActions(record.status).map((action) => (
                          <TextAction key={action} onClick={() => handleAction(record, action)}>
                            {action}
                          </TextAction>
                        ))}
                    </ActionsCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        total={filteredRecords.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

function getReceiptActions(status: PurchaseReceiptRecord["status"]) {
  if (status === "草稿") return ["查看", "编辑", "确认入库", "删除"];
  return ["查看"];
}

export function PurchaseOrderCreatePage() {
  return <PurchaseOrderEditorPage mode="create" />;
}

export function PurchaseOrderEditPage() {
  return <PurchaseOrderEditorPage mode="edit" />;
}

function PurchaseOrderEditorPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const source = mode === "create" ? createOrderDraft() : getPurchaseOrder(recordId);
  const [form, setForm] = useState<PurchaseOrderRecord | null>(source ? JSON.parse(JSON.stringify(source)) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  useEffect(() => {
    setForm(source ? JSON.parse(JSON.stringify(source)) : null);
    setErrors({});
    setDirty(false);
  }, [mode, recordId]);

  if (!form) {
    return <SurfaceCard title="提示">未找到对应采购订单，请返回列表重新进入。</SurfaceCard>;
  }

  const isDraftMode = form.status === "草稿";
  const lockCoreFields = mode === "edit" && !isDraftMode;
  const summary = summarizeOrder(form.lines);

  const updateField = (key: keyof PurchaseOrderRecord, value: string) => {
    setDirty(true);
    setForm((current) => {
      if (!current) return current;
      return { ...current, [key]: value };
    });
    setErrors((current) => ({ ...current, [String(key)]: "" }));
  };

  const updateLine = (lineId: string, patch: Partial<PurchaseOrderLine>) => {
    setDirty(true);
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        lines: current.lines.map((line) => {
          if (line.id !== lineId) return line;
          const nextLine = { ...line, ...patch };
          return {
            ...nextLine,
            amount: Number((Number(nextLine.qty || 0) * Number(nextLine.price || 0)).toFixed(2)),
            pendingQty: Math.max(Number(nextLine.qty || 0) - Number(nextLine.receivedQty || 0), 0),
          };
        }),
      };
    });
  };

  const addProducts = (codes: string[]) => {
    if (codes.length === 0) return;
    const nextCatalog = getProductCatalog().filter((item) => codes.includes(item.code));
    setDirty(true);
    setForm((current) =>
      current
        ? {
            ...current,
            lines: [
              ...current.lines,
              ...nextCatalog.map((item, index) => ({
                id: `line-${Date.now()}-${index}`,
                skuCode: item.code,
                skuName: item.name,
                skuBarcode: item.barcode,
                spec: item.spec,
                unit: item.unit,
                qty: 1,
                price: item.price,
                taxRate: "",
                amount: Number(item.price.toFixed(2)),
                receivedQty: 0,
                pendingQty: 1,
                note: "",
              })),
            ],
          }
        : current,
    );
  };

  const removeLine = (lineId: string) => {
    if (form.lines.length <= 1) {
      openError("至少保留一行商品明细");
      return;
    }
    setDirty(true);
    setForm((current) => (current ? { ...current, lines: current.lines.filter((line) => line.id !== lineId) } : current));
  };

  const validate = (_intent: "draft" | "submit") => {
    const nextErrors: Record<string, string> = {};
    const today = todayValue();
    if (!form.supplierLabel) nextErrors.supplierLabel = "请选择供应商";
    if (!form.warehouseLabel) nextErrors.warehouseLabel = "请选择入库仓库";
    if (!form.orderDate) nextErrors.orderDate = "请选择下单日期";
    if (form.orderDate && form.orderDate > today) nextErrors.orderDate = "下单日期不能晚于今天";
    if ((form.remark || "").length > 200) nextErrors.remark = "采购备注不能超过 200 个字符";

    if (form.lines.length === 0) {
      openError("商品明细不可为空，请至少添加一行商品");
    }

    form.lines.forEach((line, index) => {
      if (!line.skuCode) nextErrors[`line-${index}-sku`] = "请选择商品";

      const qty = Number(line.qty);
      if (!Number.isInteger(qty) || qty <= 0) {
        nextErrors[`line-${index}-qty`] = "采购数量必须为大于 0 的整数";
      } else if (qty > 9999999) {
        nextErrors[`line-${index}-qty`] = "采购数量不能超过 9,999,999";
      }

      const price = Number(line.price);
      if (Number.isNaN(price) || price < 0) {
        nextErrors[`line-${index}-price`] = "单价必须大于等于 0";
      } else if (!hasAtMostTwoDecimals(price)) {
        nextErrors[`line-${index}-price`] = "单价最多保留 2 位小数";
      }

      if ((line.note || "").length > 100) {
        nextErrors[`line-${index}-note`] = "行备注不能超过 100 个字符";
      }
    });

    setErrors(nextErrors);
    return nextErrors;
  };

  const persist = (intent: "draft" | "submit") => {
    const nextErrors = validate(intent);
    if (Object.keys(nextErrors).length > 0) return;
    const saved = savePurchaseOrder(form, intent);
    if (!saved) {
      openError("保存失败");
      return;
    }
    setDirty(false);
    if (intent === "draft") {
      setForm(saved);
      openToast("保存成功");
    } else {
      openToast("已提交审核，等待审核确认");
      navigate(`/purchase-orders/${saved.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title={mode === "create" ? "新增采购订单" : `编辑采购订单 ${form.no}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (!dirty) {
                  navigate("/purchase-orders");
                  return;
                }
                setConfirmState({
                  title: "确认离开",
                  content: "当前有未保存的内容，确认离开？",
                  confirmText: "确认离开",
                  onConfirm: () => navigate("/purchase-orders"),
                });
              }}
            >
              返回列表
            </Button>
            <Button onClick={() => persist("draft")}>保存</Button>
            {isDraftMode ? (
              <Button tone="primary" onClick={() => persist("submit")}>
                保存并提交
              </Button>
            ) : null}
          </div>
        }
      />

      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="供应商" required error={errors.supplierLabel}>
            {lockCoreFields ? (
              <ReadonlyValue value={form.supplierLabel} />
            ) : (
              <Select
                value={form.supplierLabel}
                onChange={(supplierLabel) => {
                  const supplier = findSupplier(supplierLabel);
                  updateField("supplierLabel", supplierLabel);
                  if (supplier) {
                    updateField("supplierCode", supplier.code);
                    updateField("supplierName", supplier.name);
                  }
                }}
                options={getSupplierOptions()}
                allowSearch
                placeholder="请选择供应商"
              />
            )}
          </LabeledField>
          <LabeledField label="入库仓库" required error={errors.warehouseLabel}>
            {lockCoreFields ? (
              <ReadonlyValue value={form.warehouseLabel} />
            ) : (
              <Select
                value={form.warehouseLabel}
                onChange={(warehouseLabel) => {
                  const warehouse = findWarehouse(warehouseLabel);
                  updateField("warehouseLabel", warehouseLabel);
                  if (warehouse) {
                    updateField("warehouseCode", warehouse.code);
                    updateField("warehouseName", warehouse.name);
                  }
                }}
                options={getWarehouseOptions()}
                allowSearch
                placeholder="请选择入库仓库"
              />
            )}
          </LabeledField>
          <LabeledField label="下单日期" required error={errors.orderDate}>
            {lockCoreFields ? <ReadonlyValue value={form.orderDate} /> : <DateField value={form.orderDate} onChange={(value) => updateField("orderDate", value)} />}
          </LabeledField>
          <LabeledField label="预计到货日期">
            <DateField value={form.expectedDate} onChange={(value) => updateField("expectedDate", value)} />
          </LabeledField>
          <LabeledField label="采购员">
            {lockCoreFields ? <ReadonlyValue value={form.handler || "-"} /> : <Input value={form.handler} onChange={(value) => updateField("handler", value)} maxLength={20} placeholder="请输入采购员（选填）" />}
          </LabeledField>
          <LabeledField label="结算方式">
            {lockCoreFields ? <ReadonlyValue value={form.settlement} /> : <Select value={form.settlement} onChange={(value) => updateField("settlement", value)} options={["现结", "15天账期", "30天账期"]} />}
          </LabeledField>
          <LabeledField label="付款方式">
            {lockCoreFields ? <ReadonlyValue value={form.paymentMethod} /> : <Select value={form.paymentMethod} onChange={(value) => updateField("paymentMethod", value)} options={["银行转账", "支付宝", "微信支付"]} />}
          </LabeledField>
          <LabeledField label="采购备注" className="md:col-span-2 xl:col-span-4">
            {errors.remark ? <div className="mb-1 text-xs text-danger">{errors.remark}</div> : null}
            <TextArea value={form.remark} onChange={(value) => updateField("remark", value)} maxLength={200} placeholder="请输入采购备注（选填）" />
          </LabeledField>
        </div>
      </SurfaceCard>

      <SurfaceCard title="商品明细">
        <div className="mb-3 flex justify-between">
          <Button
            tone="primary"
            onClick={
              lockCoreFields || form.lines.length >= 50
                ? undefined
                : () => {
                    if (form.lines.length >= 50) {
                      openError("商品明细最多 50 行");
                      return;
                    }
                    setProductPickerOpen(true);
                  }
            }
            className={lockCoreFields || form.lines.length >= 50 ? "pointer-events-none opacity-50" : ""}
          >
            选择商品
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-line-1 bg-white">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[60px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[150px]" />
              <col className="w-[120px]" />
              <col className="w-[72px]" />
              <col className="w-[110px]" />
              <col className="w-[130px]" />
              <col className="w-[120px]" />
              <col className="w-[130px]" />
              <col className="w-[200px]" />
              <col className="w-[88px]" />
            </colgroup>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">
                {["序号", "商品编码", "商品名称", "商品条码", "规格型号", "单位", "采购数量", "单价（含税）", "税率", "金额（含税）", "行备注", "操作"].map((label) => (
                  <th key={label} className="border-b border-line-1 px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.lines.length === 0 ? (
                <EmptyStateRow colSpan={12} text="请先选择商品" />
              ) : form.lines.map((line, index) => (
                <tr key={line.id} className="border-b border-line-1 align-top transition hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 text-text-2">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    <ReadonlyValue value={line.skuCode || "-"} />
                    {errors[`line-${index}-sku`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-sku`]}</div> : null}
                  </td>
                  <td className="px-3 py-2.5"><ReadonlyValue value={line.skuName || "-"} /></td>
                  <td className="px-3 py-2.5"><ReadonlyValue value={line.skuBarcode || "-"} /></td>
                  <td className="px-3 py-2.5">
                    <ReadonlyValue value={line.spec || "-"} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ReadonlyValue value={line.unit || "-"} />
                  </td>
                  <td className="px-3 py-2.5">
                    {lockCoreFields ? (
                      <ReadonlyValue value={String(line.qty || 0)} />
                    ) : (
                      <>
                        <Input
                          value={line.qty ? String(line.qty) : ""}
                          onChange={(value) => {
                            const normalized = value.replace(/[^\d]/g, "");
                            updateLine(line.id, { qty: normalized ? Number(normalized) : 0 });
                          }}
                          className="text-right"
                        />
                        {errors[`line-${index}-qty`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-qty`]}</div> : null}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {lockCoreFields ? (
                      <ReadonlyValue value={formatMoney(line.price || 0)} />
                    ) : (
                      <>
                        <Input
                          value={line.price === 0 ? "0" : String(line.price || "")}
                          onChange={(value) => {
                            const normalized = value.replace(/[^\d.]/g, "");
                            const safeValue = normalized.split(".").length > 2
                              ? `${normalized.split(".")[0]}.${normalized.split(".").slice(1).join("")}`
                              : normalized;
                            const [integer = "", decimal = ""] = safeValue.split(".");
                            const nextPrice = decimal ? Number(`${integer || "0"}.${decimal.slice(0, 2)}`) : Number(integer || 0);
                            updateLine(line.id, { price: Number.isNaN(nextPrice) ? 0 : nextPrice });
                          }}
                          className="text-right"
                        />
                        {errors[`line-${index}-price`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-price`]}</div> : null}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {lockCoreFields ? <ReadonlyValue value={line.taxRate || "-"} /> : <Select value={line.taxRate} onChange={(taxRate) => updateLine(line.id, { taxRate })} options={purchaseTaxRateOptions} placeholder="请选择税率" />}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-text-1">{formatMoney(line.amount || 0)}</td>
                  <td className="px-3 py-2.5">
                    <Input value={line.note} onChange={(value) => updateLine(line.id, { note: value.slice(0, 100) })} placeholder="行备注（选填）" readOnly={false} />
                    {errors[`line-${index}-note`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-note`]}</div> : null}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {lockCoreFields ? <span className="text-text-3">-</span> : <TextAction onClick={() => removeLine(line.id)}>删除</TextAction>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <OrderSummaryFooter
                skuCount={summary.skuCount}
                totalQty={summary.totalQty}
                totalAmount={summary.totalAmount}
                includeOperation
              />
            </tfoot>
          </table>
        </div>
      </SurfaceCard>

      <ProductPickerModal
        open={productPickerOpen}
        maxSelectCount={Math.max(50 - form.lines.length, 0)}
        selectedCodes={form.lines.map((line) => line.skuCode).filter(Boolean)}
        onCancel={() => setProductPickerOpen(false)}
        onConfirm={(codes) => {
          addProducts(codes);
          setProductPickerOpen(false);
        }}
      />
      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

function summarizeOrder(lines: PurchaseOrderLine[]) {
  return {
    skuCount: lines.length,
    totalQty: lines.reduce((sum, line) => sum + Number(line.qty || 0), 0),
    totalAmount: Number(lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2)),
    totalReceivedQty: lines.reduce((sum, line) => sum + Number(line.receivedQty || 0), 0),
    totalPendingQty: lines.reduce((sum, line) => sum + Number(line.pendingQty || 0), 0),
  };
}

function OrderSummaryFooter({
  skuCount,
  totalQty,
  totalAmount,
  totalReceivedQty,
  totalPendingQty,
  includeReceivedQty = false,
  includePendingQty = false,
  includeOperation = false,
}: {
  skuCount: number;
  totalQty: number;
  totalAmount: number;
  totalReceivedQty?: number;
  totalPendingQty?: number;
  includeReceivedQty?: boolean;
  includePendingQty?: boolean;
  includeOperation?: boolean;
}) {
  return (
    <tr className="h-[44px] font-semibold text-text-1">
      <td className="px-4">合计</td>
      <td colSpan={5} className="px-3">
        共 {skuCount} 种商品
      </td>
      <td className="px-3 text-right">{formatInt(totalQty)}</td>
      <td className="px-3" />
      <td className="px-3" />
      <td className="px-3 text-right">{formatMoney(totalAmount)}</td>
      {includeReceivedQty ? <td className="px-3 text-right">{formatInt(totalReceivedQty ?? 0)}</td> : null}
      {includePendingQty ? <td className="px-3 text-right">{formatInt(totalPendingQty ?? 0)}</td> : null}
      <td className="px-3" />
      {includeOperation ? <td className="px-3" /> : null}
    </tr>
  );
}

export function PurchaseReceiptCreatePage() {
  return <PurchaseReceiptEditorPage mode="create" />;
}

export function PurchaseReceiptEditPage() {
  return <PurchaseReceiptEditorPage mode="edit" />;
}

function PurchaseReceiptEditorPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const source = mode === "create" ? createReceiptDraft(searchParams.get("orderId") ?? "") : getPurchaseReceipt(recordId);
  const [form, setForm] = useState<PurchaseReceiptRecord | null>(source ? JSON.parse(JSON.stringify(source)) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [dirty, setDirty] = useState(false);
  const orderOptions = getReceiptCreateOrderOptions();

  useEffect(() => {
    setForm(source ? JSON.parse(JSON.stringify(source)) : null);
    setErrors({});
    setDirty(false);
  }, [mode, recordId, searchParams]);

  if (!form) {
    return <SurfaceCard title="提示">未找到对应采购入库单，请返回列表重新进入。</SurfaceCard>;
  }

  const isEditReadonlyOrder = mode === "edit";
  const summary = summarizeReceipt(form.lines);

  const updateField = (key: keyof PurchaseReceiptRecord, value: string) => {
    setDirty(true);
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [String(key)]: "" }));
  };

  const updateLine = (lineId: string, patch: Partial<PurchaseReceiptLine>) => {
    setDirty(true);
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        lines: current.lines.map((line) => {
          if (line.id !== lineId) return line;
          const nextLine = { ...line, ...patch };
          const receivedQty = Number(nextLine.receivedQty || 0);
          const stockedQty = Number(nextLine.stockedQty || 0);
          const diffQty = Math.max(receivedQty - stockedQty, 0);
          return {
            ...nextLine,
            diffQty,
            diffReason: diffQty === 0 ? "" : nextLine.diffReason,
            abnormalNote: diffQty === 0 ? "" : nextLine.abnormalNote,
            stockInAmount: Number((stockedQty * Number(nextLine.stockInPrice || 0)).toFixed(2)),
          };
        }),
      };
    });
  };

  const handleSelectOrder = (orderId: string) => {
    const order = getPurchaseOrder(orderId);
    if (!order) return;
    const apply = () => {
      setDirty(true);
      setForm((current) =>
        current
          ? {
              ...current,
              orderId: order.id,
              orderNo: order.no,
              supplierCode: order.supplierCode,
              supplierName: order.supplierName,
              supplierLabel: order.supplierLabel,
              warehouseCode: order.warehouseCode,
              warehouseName: order.warehouseName,
              warehouseLabel: order.warehouseLabel,
              lines: buildReceiptLinesFromOrder(order),
            }
          : current,
      );
      setConfirmState(null);
    };

    if (form.lines.some((line) => line.receivedQty > 0 || line.stockedQty > 0 || line.diffReason || line.abnormalNote)) {
      setConfirmState({
        title: "重新选择采购订单",
        content: "重新选择将清空当前明细，确认继续？",
        confirmText: "确认",
        onConfirm: apply,
      });
      return;
    }

    apply();
  };

  const validate = (intent: "draft" | "confirm") => {
    const nextErrors: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);
    if (intent === "confirm") {
      if (!form.orderId) nextErrors.orderId = "请选择关联采购订单";
      if (!form.stockInDate) nextErrors.stockInDate = "请选择入库日期";
      if (form.stockInDate > today) nextErrors.stockInDate = "入库日期不能晚于今天";
      form.lines.forEach((line, index) => {
        if (Number(line.receivedQty) <= 0) nextErrors[`line-${index}-receivedQty`] = "实收数量不可为 0";
        if (Number(line.receivedQty) > Number(line.pendingQty)) nextErrors[`line-${index}-receivedQty`] = `实收数量不能超过未入库数量（${line.pendingQty} 件）`;
        if (Number(line.stockedQty) <= 0) nextErrors[`line-${index}-stockedQty`] = "入库数量不可为 0";
        if (Number(line.stockedQty) > Number(line.receivedQty)) nextErrors[`line-${index}-stockedQty`] = `入库数量不能超过本次实收数量（${line.receivedQty} 件）`;
        if (line.diffQty > 0 && !line.diffReason) nextErrors[`line-${index}-diffReason`] = "差异数量大于 0，请选择差异原因";
        if (Number(line.stockInPrice) < 0 || Number.isNaN(Number(line.stockInPrice))) nextErrors[`line-${index}-stockInPrice`] = "请填写入库单价";
      });
    } else if (form.stockInDate && form.stockInDate > today) {
      nextErrors.stockInDate = "入库日期不能晚于今天";
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const saveDraft = () => {
    const nextErrors = validate("draft");
    if (Object.keys(nextErrors).length > 0) return;
    const saved = savePurchaseReceipt(form);
    if (!saved) {
      openError("保存失败");
      return;
    }
    setDirty(false);
    setForm(saved);
    openToast("保存成功");
  };

  const doConfirm = () => {
    const nextErrors = validate("confirm");
    if (Object.keys(nextErrors).length > 0) return;
    setConfirmState({
      title: "确认入库",
      content: "确认入库后库存将立即更新，且操作不可撤销，确认入库？",
      confirmText: "确认入库",
      onConfirm: () => {
        const saved = confirmPurchaseReceipt(form);
        if (!saved) {
          openError("关联的采购订单已关闭，无法继续入库");
          return;
        }
        setConfirmState(null);
        setDirty(false);
        openToast("入库成功，库存已更新");
        navigate(`/purchase-receipt/${saved.id}`);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title={mode === "create" ? "新增采购入库单" : `编辑采购入库单 ${form.no}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button tone="primary" onClick={saveDraft}>
              保存草稿
            </Button>
            <Button tone="primary" onClick={doConfirm}>
              确认入库
            </Button>
            <Button
              onClick={() => {
                if (!dirty) {
                  navigate("/purchase-receipt");
                  return;
                }
                setConfirmState({
                  title: "确认离开",
                  content: "当前有未保存的内容，确认离开？",
                  confirmText: "确认离开",
                  onConfirm: () => navigate("/purchase-receipt"),
                });
              }}
            >
              返回列表
            </Button>
          </div>
        }
      />

      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="关联采购订单" required error={errors.orderId}>
            {isEditReadonlyOrder ? (
              <ReadonlyValue value={form.orderNo} />
            ) : (
              <Select
                value={form.orderNo}
                onChange={(orderNo) => {
                  const order = orderOptions.find((item) => item.no === orderNo);
                  if (order) handleSelectOrder(order.id);
                }}
                options={orderOptions.map((order) => order.no)}
                allowSearch
                placeholder="请选择关联采购订单"
              />
            )}
          </LabeledField>
          <LabeledField label="供应商">
            <ReadonlyValue value={form.supplierLabel || "-"} />
          </LabeledField>
          <LabeledField label="入库仓库">
            <ReadonlyValue value={form.warehouseLabel || "-"} />
          </LabeledField>
          <LabeledField label="入库日期" required error={errors.stockInDate}>
            <DateField value={form.stockInDate} onChange={(value) => updateField("stockInDate", value)} />
          </LabeledField>
          <LabeledField label="入库备注" className="md:col-span-2 xl:col-span-4">
            <TextArea value={form.remark} onChange={(value) => updateField("remark", value)} maxLength={200} placeholder="请输入入库备注（选填）" />
          </LabeledField>
        </div>
      </SurfaceCard>

      <SurfaceCard title="商品明细">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1520px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">
                {["序号", "商品", "规格型号", "单位", "订单数量", "本次实收数量", "本次入库数量", "差异数量", "差异原因", "异常说明", "入库单价", "入库金额"].map((label) => (
                  <th key={label} className="border-b border-line-1 px-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line, index) => (
                <tr key={line.id} className="border-b border-line-1">
                  <td className="px-3 py-2.5 text-text-2">{index + 1}</td>
                  <td className="px-3 py-2.5">{`${line.skuCode} ${line.skuName}`}</td>
                  <td className="px-3 py-2.5">{line.spec || "-"}</td>
                  <td className="px-3 py-2.5">{line.unit || "-"}</td>
                  <td className="px-3 py-2.5 text-right">{line.orderQty}</td>
                  <td className="px-3 py-2.5">
                    <Input value={String(line.receivedQty || "")} onChange={(value) => updateLine(line.id, { receivedQty: Number(value) || 0 })} className="text-right" />
                    {errors[`line-${index}-receivedQty`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-receivedQty`]}</div> : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <Input value={String(line.stockedQty || "")} onChange={(value) => updateLine(line.id, { stockedQty: Number(value) || 0 })} className="text-right font-semibold text-text-1" />
                    {errors[`line-${index}-stockedQty`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-stockedQty`]}</div> : null}
                  </td>
                  <td className={cn("px-3 py-2.5 text-right", line.diffQty > 0 && "font-medium text-warning")}>{line.diffQty}</td>
                  <td className="px-3 py-2.5">
                    {line.diffQty > 0 ? (
                      <>
                        <Select value={line.diffReason} onChange={(diffReason) => updateLine(line.id, { diffReason })} options={purchaseReceiptDiffReasons} placeholder="请选择差异原因" />
                        {errors[`line-${index}-diffReason`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-diffReason`]}</div> : null}
                      </>
                    ) : (
                      <ReadonlyValue value="-" />
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Input value={line.abnormalNote} onChange={(value) => updateLine(line.id, { abnormalNote: value })} readOnly={line.diffQty === 0} placeholder="补充说明（选填）" />
                  </td>
                  <td className="px-3 py-2.5">
                    <Input value={String(line.stockInPrice || "")} onChange={(value) => updateLine(line.id, { stockInPrice: Number(value) || 0 })} className="text-right" />
                    {errors[`line-${index}-stockInPrice`] ? <div className="mt-1 text-xs text-danger">{errors[`line-${index}-stockInPrice`]}</div> : null}
                  </td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(line.stockInAmount || 0)}</td>
                </tr>
              ))}
            </tbody>
            <SummaryFooter colSpan={12} lineCount={form.lines.length}>合计：{formatInt(summary.totalQty)} 件 | {formatMoney(summary.totalAmount)}</SummaryFooter>
          </table>
        </div>
      </SurfaceCard>

      <ConfirmModal state={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

function summarizeReceipt(lines: PurchaseReceiptLine[]) {
  return {
    totalQty: lines.reduce((sum, line) => sum + Number(line.stockedQty || 0), 0),
    totalAmount: Number(lines.reduce((sum, line) => sum + Number(line.stockInAmount || 0), 0).toFixed(2)),
  };
}

export function PurchaseOrderDetailPage() {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const record = useMemo(() => getPurchaseOrder(recordId), [recordId, refreshTick]);

  if (!record) {
    return <SurfaceCard title="提示">未找到对应采购订单，请返回列表重新进入。</SurfaceCard>;
  }

  const receiptRecords = getLinkedStockedReceipts(record.id);
  const draftReceiptCount = getLinkedDraftReceipts(record.id).length;
  const summary = summarizeOrder(record.lines);

  const openAction = (action: string) => {
    if (action === "编辑") {
      navigate(`/purchase-orders/${record.id}/edit`);
      return;
    }
    if (action === "创建入库单") {
      navigate(`/purchase-receipt/new?orderId=${record.id}`);
      return;
    }
    if (action === "查看") return;
    const mapping: Record<string, { title: string; content: string; confirmText: string; run: () => void }> = {
      删除: {
        title: "确认删除",
        content: "删除后不可恢复，该采购订单将从系统中永久移除，确认删除？",
        confirmText: "确认删除",
        run: () => {
          deletePurchaseOrder(record.id);
          openToast("采购订单已删除");
          navigate("/purchase-orders");
        },
      },
      提交审核: {
        title: "提交审核",
        content: "提交后单据将进入待审核状态，确认提交？",
        confirmText: "确认提交",
        run: () => {
          const saved = savePurchaseOrder(record, "submit");
          if (!saved) {
            openError("提交失败");
            return;
          }
          setConfirmState(null);
          openToast("已提交审核，等待审核确认");
          setRefreshTick((current) => current + 1);
        },
      },
      审核通过: {
        title: "确认审核",
        content: "审核通过后关键字段将锁定，不可再修改，确认审核通过？",
        confirmText: "确认审核",
        run: () => {
          approvePurchaseOrder(record.id);
          setConfirmState(null);
          openToast("审核通过");
          setRefreshTick((current) => current + 1);
        },
      },
      驳回: {
        title: "确认驳回",
        content: "驳回后单据将退回草稿，采购员可重新修改，确认驳回？",
        confirmText: "确认驳回",
        run: () => {
          rejectPurchaseOrder(record.id);
          setConfirmState(null);
          openToast("已驳回，单据已退回草稿");
          setRefreshTick((current) => current + 1);
        },
      },
      作废: {
        title: "确认作废",
        content: "作废后不可恢复，单据将进入已作废状态，确认作废？",
        confirmText: "确认作废",
        run: () => {
          voidPurchaseOrder(record.id);
          setConfirmState(null);
          openToast("采购订单已作废");
          setRefreshTick((current) => current + 1);
        },
      },
      关闭订单: {
        title: "确认关闭",
        content: draftReceiptCount > 0 ? `该订单下存在 ${draftReceiptCount} 张草稿入库单，关闭后将无法继续操作，请确认。` : "关闭后剩余数量不再接收，确认关闭订单？",
        confirmText: "确认关闭",
        run: () => {
          closePurchaseOrder(record.id);
          setConfirmState(null);
          openToast("订单已关闭，剩余数量不再接收");
          setRefreshTick((current) => current + 1);
        },
      },
    };
    const target = action === "审核" ? mapping["审核通过"] : mapping[action];
    if (!target) return;
    setConfirmState({ title: target.title, content: target.content, confirmText: target.confirmText, onConfirm: target.run });
  };

  const detailActions = getDetailOrderActions(record.status);

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title={`采购订单 ${record.no}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/purchase-orders")}>返回列表</Button>
            {detailActions.map((action) => (
              <Button key={action} tone={action === "创建入库单" ? "primary" : "default"} onClick={() => openAction(action)}>
                {action}
              </Button>
            ))}
          </div>
        }
      >
        <StatusPill tone={record.statusTone}>{record.status}</StatusPill>
      </PageTitle>

      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="采购单号" value={record.no} />
          <DetailValue label="供应商" value={record.supplierLabel} />
          <DetailValue label="入库仓库" value={record.warehouseLabel} />
          <DetailValue label="下单日期" value={record.orderDate} />
          <DetailValue label="预计到货日期" value={record.expectedDate || "-"} />
          <DetailValue label="采购员" value={record.handler || "-"} />
          <DetailValue label="结算方式" value={record.settlement || "-"} />
          <DetailValue label="付款方式" value={record.paymentMethod || "-"} />
          <DetailValue label="采购备注" value={record.remark || "-"} className="xl:col-span-3" />
        </div>
      </SurfaceCard>

      <SurfaceCard title="商品明细">
        <div className="overflow-hidden rounded-lg border border-line-1 bg-white">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[60px]" />
              <col className="w-[120px]" />
              <col className="w-[140px]" />
              <col className="w-[150px]" />
              <col className="w-[120px]" />
              <col className="w-[72px]" />
              <col className="w-[110px]" />
              <col className="w-[130px]" />
              <col className="w-[100px]" />
              <col className="w-[130px]" />
              {record.status === "待入库" || record.status === "部分入库" || record.status === "已完成" ? <col className="w-[130px]" key="receivedQty" /> : null}
              {record.status === "待入库" || record.status === "部分入库" ? <col className="w-[120px]" key="pendingQty" /> : null}
              <col className="w-[180px]" />
            </colgroup>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">
                {getOrderDetailColumns(record.status).map((label) => (
                  <th key={label} className="border-b border-line-1 px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {record.lines.map((line, index) => (
                <tr key={line.id} className="border-b border-line-1 align-top transition hover:bg-slate-50/70">
                  <td className="px-3 py-2.5">{index + 1}</td>
                  <td className="px-3 py-2.5">{line.skuCode || "-"}</td>
                  <td className="px-3 py-2.5">{line.skuName || "-"}</td>
                  <td className="px-3 py-2.5">{line.skuBarcode || "-"}</td>
                  <td className="px-3 py-2.5">{line.spec || "-"}</td>
                  <td className="px-3 py-2.5">{line.unit || "-"}</td>
                  <td className="px-3 py-2.5 text-right">{line.qty}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(line.price)}</td>
                  <td className="px-3 py-2.5">{line.taxRate || "-"}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(line.amount)}</td>
                  {record.status === "待入库" || record.status === "部分入库" || record.status === "已完成" ? (
                    <td className="px-3 py-2.5 text-right">{line.receivedQty}</td>
                  ) : null}
                  {record.status === "待入库" || record.status === "部分入库" ? <td className="px-3 py-2.5 text-right">{line.pendingQty}</td> : null}
                  <td className="px-3 py-2.5">{line.note || "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <OrderSummaryFooter
                skuCount={summary.skuCount}
                totalQty={summary.totalQty}
                totalAmount={summary.totalAmount}
                totalReceivedQty={summary.totalReceivedQty}
                totalPendingQty={summary.totalPendingQty}
                includeReceivedQty={record.status === "待入库" || record.status === "部分入库" || record.status === "已完成"}
                includePendingQty={record.status === "待入库" || record.status === "部分入库"}
              />
            </tfoot>
          </table>
        </div>
      </SurfaceCard>

      {record.status === "待入库" || record.status === "部分入库" || record.status === "已完成" ? (
        <SurfaceCard title="关联入库单">
          {receiptRecords.length === 0 ? (
            <div className="text-[13px] text-text-3">审核通过后可查看关联入库单</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line-1 bg-white">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[220px]" />
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                  <col className="w-[120px]" />
                </colgroup>
                <thead className="bg-fill-2 text-left text-text-2">
                  <tr className="h-[42px]">
                    {["入库单号", "入库日期", "本次入库数量", "操作人", "状态"].map((label) => (
                      <th key={label} className="border-b border-line-1 px-3 py-3 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receiptRecords.map((receipt) => (
                    <tr key={receipt.id} className="border-b border-line-1 transition hover:bg-slate-50/70">
                      <td className="px-3 py-2.5">
                        <button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-receipt/${receipt.id}`)}>
                          {receipt.no}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">{receipt.stockInDate}</td>
                      <td className="px-3 py-2.5">{receipt.totalQty}</td>
                      <td className="px-3 py-2.5">{receipt.confirmBy || "-"}</td>
                      <td className="px-3 py-2.5">
                        <StatusPill tone={receipt.statusTone}>{receipt.status}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

function getDetailOrderActions(status: PurchaseOrderStatus) {
  switch (status) {
    case "草稿":
      return ["编辑", "删除", "提交审核"];
    case "待审核":
      return ["审核通过", "驳回", "作废"];
    case "待入库":
      return ["创建入库单", "作废"];
    case "部分入库":
      return ["创建入库单", "关闭订单"];
    default:
      return [];
  }
}

function getOrderDetailColumns(status: PurchaseOrderStatus) {
  const base = ["序号", "商品编码", "商品名称", "商品条码", "规格型号", "单位", "采购数量", "单价（含税）", "税率", "金额（含税）"];
  if (status === "待入库" || status === "部分入库" || status === "已完成") {
    base.push("累计已入库数量");
  }
  if (status === "待入库" || status === "部分入库") {
    base.push("未入库数量");
  }
  base.push("行备注");
  return base;
}

export function PurchaseReceiptDetailPage() {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const record = getPurchaseReceipt(recordId);

  if (!record) {
    return <SurfaceCard title="提示">未找到对应采购入库单，请返回列表重新进入。</SurfaceCard>;
  }

  const summary = summarizeReceipt(record.lines);

  const handleAction = (action: string) => {
    if (action === "编辑") {
      navigate(`/purchase-receipt/${record.id}/edit`);
      return;
    }
    const mapping: Record<string, ConfirmState> = {
      删除: {
        title: "确认删除",
        content: "删除后不可恢复，该入库单将从系统中永久移除，确认删除？",
        confirmText: "确认删除",
        onConfirm: () => {
          deletePurchaseReceipt(record.id);
          openToast("采购入库单已删除");
          navigate("/purchase-receipt");
        },
      },
      确认入库: {
        title: "确认入库",
        content: "确认入库后库存将立即更新，且操作不可撤销，确认入库？",
        confirmText: "确认入库",
        onConfirm: () => {
          const saved = confirmPurchaseReceipt(record);
          if (!saved) {
            openError("关联的采购订单已关闭，无法继续入库");
            return;
          }
          openToast("入库成功，库存已更新");
          navigate(`/purchase-receipt/${record.id}`);
        },
      },
    };
    const target = mapping[action];
    if (target) setConfirmState(target);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title={`采购入库单 ${record.no}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/purchase-receipt")}>返回列表</Button>
            {record.status === "草稿" ? (
              <>
                <Button onClick={() => handleAction("编辑")}>编辑</Button>
                <Button onClick={() => handleAction("删除")}>删除</Button>
                <Button tone="primary" onClick={() => handleAction("确认入库")}>
                  确认入库
                </Button>
              </>
            ) : null}
          </div>
        }
      >
        <StatusPill tone={record.statusTone}>{record.status}</StatusPill>
      </PageTitle>

      <SurfaceCard title="基本信息">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailValue label="入库单号" value={record.no} />
          <DetailValue
            label="关联采购订单"
            value={
              <button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/purchase-orders/${record.orderId}`)}>
                {record.orderNo}
              </button>
            }
          />
          <DetailValue label="供应商" value={record.supplierLabel} />
          <DetailValue label="入库仓库" value={record.warehouseLabel} />
          <DetailValue label="入库日期" value={record.stockInDate} />
          <DetailValue label="入库备注" value={record.remark || "-"} className="xl:col-span-3" />
        </div>
      </SurfaceCard>

      <SurfaceCard title="商品明细" extra={`本次入库：${formatInt(summary.totalQty)} 件 | 总金额 ${formatMoney(summary.totalAmount)}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse text-sm">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[42px]">
                {["序号", "商品", "规格型号", "单位", "订单数量", "本次实收数量", "本次入库数量", "差异数量", "差异原因", "异常说明", "入库单价", "入库金额"].map((label) => (
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
                  <td className="px-3 py-2.5 text-right">{line.orderQty}</td>
                  <td className="px-3 py-2.5 text-right">{line.receivedQty}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-text-1">{line.stockedQty}</td>
                  <td className={cn("px-3 py-2.5 text-right", line.diffQty > 0 && "font-medium text-warning")}>{line.diffQty}</td>
                  <td className="px-3 py-2.5">{line.diffReason || "-"}</td>
                  <td className="px-3 py-2.5">{line.abnormalNote || "-"}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(line.stockInPrice)}</td>
                  <td className="px-3 py-2.5 text-right">{formatMoney(line.stockInAmount)}</td>
                </tr>
              ))}
            </tbody>
            <SummaryFooter colSpan={12} lineCount={record.lines.length}>合计 {formatInt(summary.totalQty)} 件 | {formatMoney(summary.totalAmount)}</SummaryFooter>
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

function DetailValue({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[13px] text-text-3">{label}</div>
      <div className="mt-1 text-[14px] text-text-1">{value}</div>
    </div>
  );
}
