import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, FilterActions, FilterField, Message, Pagination, ResizableHeaderCell, SearchInput, Select, StatusPill, TabBar, TableSortHeader, useResizableColumns } from "../components/Ui";
import { FilterItem } from "../components/FilterItem";
import { getCrudModuleDefinition, getModuleDefinition, saveCrudModuleRecord, type CrudModuleDefinition, type QueryModuleDefinition, type Tone } from "../contracts/modules";
import { GenericCrudListPage } from "./GenericModulePages";
import type { ViewKey } from "../app/navigation";
import { cn } from "../utils/cn";
import { compareRecord, normalizeSortValue } from "../utils/sort";

export function ProductManagementPage() {
  return <GenericCrudListPage view="product-management" />;
}

export function CustomerManagementPage() {
  return <GenericCrudListPage view="customer-management" />;
}



export function SupplierManagementPage() {
  return <GenericCrudListPage view="supplier-management" />;
}

export function WarehouseManagementPage() {
  return <PriorityCrudListPage view="warehouse-management" />;
}

export function SalesDeliveryPage() {
  return <PriorityCrudListPage view="sales-delivery" />;
}



export function SalesQueryPage() {
  return <PriorityQueryListPage view="sales-query" />;
}

export function StockTransferPage() {
  return <PriorityCrudListPage view="stock-transfer" />;
}

export function StockCountPage() {
  return <PriorityCrudListPage view="stock-count" />;
}

export function StockLossPage() {
  return <PriorityCrudListPage view="stock-loss" />;
}

function PriorityCrudListPage({ view }: { view: ViewKey }) {
  const navigate = useNavigate();
  const module = getCrudModuleDefinition(view);
  const [records, setRecords] = useState(module?.records ?? []);
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState(module?.statusTabs?.[0] ?? "全部");
  const [selectFilters, setSelectFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    setRecords(module?.records ?? []);
  }, [view]);

  if (!module) return null;

  const listColumns = [
    ...module.columns.map((column) => ({
      key: column.key,
      width: column.width ?? (column.kind === "status" ? 120 : column.kind === "money" ? 150 : 160),
      minWidth: column.minWidth ?? (column.kind === "status" ? 110 : 120),
      maxWidth: column.maxWidth,
      resizable: column.resizable,
    })),
    { key: "__actions__", width: 160, minWidth: 140, resizable: false },
  ];
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns(`${view}:priority-list`, listColumns);

  const filteredRows = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    return records.filter((record) => {
      if (normalized) {
        const rowText = Object.values(record)
          .filter((value) => typeof value === "string" || typeof value === "number")
          .join(" ")
          .toLowerCase();
        if (!rowText.includes(normalized)) return false;
      }

      if (module.statusTabs && activeTab !== module.statusTabs[0] && String(record.status) !== activeTab) {
        return false;
      }

      for (const [key, value] of Object.entries(selectFilters)) {
        if (!value || value.startsWith("全部")) continue;
        if (String(record[key] ?? "") !== value) return false;
      }

      return true;
    }).sort((a, b) => compareRecord(a, b, sortConfig));
  }, [activeTab, deferredKeyword, records, module.statusTabs, selectFilters, sortConfig]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else {
        setSortConfig(null);
        return;
      }
    }
    setSortConfig({ key, direction });
  };

  const handleToggleStatus = (recordId: string) => {
    if (module.kind !== "entity") return;

    const currentRecord = records.find((item) => item.id === recordId);
    if (!currentRecord) return;
    const currentStatus = String(currentRecord?.status ?? "");
    const nextEnabled = currentStatus !== "启用";
    const nextRecord = {
      ...currentRecord,
      status: nextEnabled ? "启用" : "停用",
      statusTone: nextEnabled ? "green" : "gray",
      stopReason: nextEnabled ? "" : "前端Demo演示：对象停用。",
    };
    const saved = saveCrudModuleRecord(view, nextRecord, "edit");
    if (!saved) {
      Message.error(`${module.singular}状态更新失败。`, 3000);
      return;
    }
    setRecords((current) => current.map((record) => (record.id === recordId ? saved : record)));
    Message.success(currentStatus === "启用" ? `${module.singular}已停用。` : `${module.singular}已启用。`, 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {module.statusTabs ? (
        <TabBar
          items={module.statusTabs.map((tab) => ({ key: tab, label: tab }))}
          activeKey={activeTab}
          onChange={(tab) => startTransition(() => setActiveTab(tab))}
        />
      ) : null}

      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        {module.filters.map((filter) => (
          <FilterItem
            key={filter.key}
            filter={filter}
            keyword={keyword}
            onKeywordChange={setKeyword}
            value={selectFilters[filter.key] ?? ""}
            onValueChange={(value) => setSelectFilters((current) => ({ ...current, [filter.key]: value }))}
          />
        ))}
        <FilterActions onSecondaryClick={() => { setKeyword(""); setSelectFilters({}); }} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button tone="primary" onClick={() => navigate(`/${view}/new`)}>新增{module.singular}</Button>
          <Button>导出</Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
          <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, 1100) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                {module.columns.map((column) => (
                  <ResizableHeaderCell
                    key={column.key}
                    width={getColumnStyle(column.key).width}
                    minWidth={getColumnStyle(column.key).minWidth}
                    maxWidth={getColumnStyle(column.key).maxWidth}
                    className={cn(column.align === "right" && "text-right")}
                    resizable={column.resizable !== false}
                    onResizeStart={(clientX) => startResize(column.key, clientX)}
                  >
                    <TableSortHeader
                      label={column.label}
                      sortKey={column.key}
                      currentSort={sortConfig}
                      onSort={handleSort}
                      align={column.align === "right" ? "right" : "left"}
                    />
                  </ResizableHeaderCell>
                ))}
                <ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((record) => (
                <tr key={record.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  {module.columns.map((column) => (
                    <td key={column.key} className={cn("border-r border-line-1 px-4 whitespace-nowrap", column.align === "right" && "text-right")} style={getColumnStyle(column.key)} title={String(record[column.key] ?? "")}>
                      <div className="overflow-hidden text-ellipsis">
                        {renderPriorityValue(record[column.key], column.kind, record[column.toneKey ?? "statusTone"] as Tone | undefined)}
                      </div>
                    </td>
                  ))}
                  <td className="px-4 whitespace-nowrap" style={getColumnStyle("__actions__")}>
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}`)}>查看</Button>
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}/edit`)}>编辑</Button>
                      {module.kind === "entity" ? (
                        <Button size="sm" onClick={() => handleToggleStatus(record.id)}>
                          {String(record.status) === "启用" ? "停用" : "启用"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>

        <Pagination
          total={filteredRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}

function renderPriorityValue(value: unknown, kind?: "text" | "status" | "money", tone?: Tone) {
  if (kind === "status") {
    return <StatusPill tone={tone ?? "gray"}>{String(value ?? "-")}</StatusPill>;
  }
  return String(value ?? "-");
}

function PriorityQueryListPage({ view }: { view: "sales-query" }) {
  const module = getModuleDefinition(view) as QueryModuleDefinition | undefined;
  const [keyword, setKeyword] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectFilters, setSelectFilters] = useState<Record<string, string>>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<Record<string, { start: string; end: string }>>({});
  const deferredKeyword = useDeferredValue(keyword);

  if (!module) return null;

  const queryColumns = module.columns.map((column) => ({
    key: column.key,
    width: column.width ?? (column.kind === "status" ? 120 : column.align === "right" ? 140 : 160),
    minWidth: column.minWidth ?? (column.kind === "status" ? 110 : 120),
    maxWidth: column.maxWidth,
    resizable: column.resizable,
  }));
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns(`${view}:priority-query`, queryColumns);

  const filteredRows = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    let rows = module.rows;

    // 关键词过滤
    if (normalized) {
      rows = rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(normalized));
    }

    // 下拉筛选
    for (const [key, value] of Object.entries(selectFilters)) {
      if (!value || value.startsWith("全部")) continue;
      rows = rows.filter((row) => String(row[key] ?? "") === value);
    }

    return rows.sort((a, b) => compareRecord(a, b, sortConfig));
  }, [deferredKeyword, module.rows, sortConfig, selectFilters]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else {
        setSortConfig(null);
        return;
      }
    }
    setSortConfig({ key, direction });
  };

  const handleReset = () => {
    setKeyword("");
    setSelectFilters({});
    setDateRangeFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        {module.filters.map((filter) => (
          <FilterItem
            key={filter.key}
            filter={filter as CrudModuleDefinition["filters"][number]}
            keyword={keyword}
            onKeywordChange={setKeyword}
            value={selectFilters[filter.key] ?? ""}
            onValueChange={(value) => setSelectFilters((current) => ({ ...current, [filter.key]: value }))}
            dateRangeValue={dateRangeFilters[filter.key]}
            onDateRangeChange={(range) => setDateRangeFilters((current) => ({ ...current, [filter.key]: range }))}
          />
        ))}
        <FilterActions onSecondaryClick={handleReset} extra={<Button>导出</Button>} />
      </div>

      <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, 1080) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                {module.columns.map((column) => (
                  <ResizableHeaderCell
                    key={column.key}
                    width={getColumnStyle(column.key).width}
                    minWidth={getColumnStyle(column.key).minWidth}
                    maxWidth={getColumnStyle(column.key).maxWidth}
                    className={cn(column.align === "right" && "text-right")}
                    resizable={column.resizable !== false}
                    onResizeStart={(clientX) => startResize(column.key, clientX)}
                  >
                    <TableSortHeader
                      label={column.label}
                      sortKey={column.key}
                      currentSort={sortConfig}
                      onSort={handleSort}
                      align={column.align === "right" ? "right" : "left"}
                    />
                  </ResizableHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={`${index}-${row[module.columns[0].key]}`} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  {module.columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-2.5 whitespace-nowrap", column.align === "right" && "text-right")} style={getColumnStyle(column.key)} title={String(row[column.key] ?? "")}>
                      <div className="overflow-hidden text-ellipsis">
                        {renderPriorityValue(row[column.key], column.kind, row[column.toneKey ?? "tone"] as Tone | undefined)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        total={filteredRows.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
