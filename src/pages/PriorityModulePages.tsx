import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, FilterActions, FilterField, Pagination, SearchInput, Select, StatusPill, TabBar, TableSortHeader } from "../components/Ui";
import { FilterItem } from "../components/FilterItem";
import { getCrudModuleDefinition, getModuleDefinition, type CrudModuleDefinition, type QueryModuleDefinition, type Tone } from "../data/modulePages";
import type { ViewKey } from "../data/mock";
import { cn } from "../utils/cn";
import { compareRecord, normalizeSortValue } from "../utils/sort";

export function ProductManagementPage() {
  return <PriorityCrudListPage view="product-management" />;
}

export function CustomerManagementPage() {
  return <PriorityCrudListPage view="customer-management" />;
}

export function PurchaseOrdersPage() {
  return <PriorityCrudListPage view="purchase-orders" />;
}

export function SupplierManagementPage() {
  return <PriorityCrudListPage view="supplier-management" />;
}

export function WarehouseManagementPage() {
  return <PriorityCrudListPage view="warehouse-management" />;
}

export function SalesDeliveryPage() {
  return <PriorityCrudListPage view="sales-delivery" />;
}

export function PurchaseReceiptPage() {
  return <PriorityCrudListPage view="purchase-receipt" />;
}

export function PurchaseReturnPage() {
  return <PriorityCrudListPage view="purchase-return" />;
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
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState(module?.statusTabs?.[0] ?? "全部");
  const [selectFilters, setSelectFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const deferredKeyword = useDeferredValue(keyword);

  if (!module) return null;

  const filteredRows = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    return module.records.filter((record) => {
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
  }, [activeTab, deferredKeyword, module.records, module.statusTabs, selectFilters, sortConfig]);

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
          <div className="overflow-x-auto">
          <table className="min-w-[1100px] border-collapse text-sm lg:min-w-full">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                {module.columns.map((column) => (
                  <th key={column.key} className={cn("border-b border-r border-line-1 px-4", column.align === "right" && "text-right")}>
                    <TableSortHeader
                      label={column.label}
                      sortKey={column.key}
                      currentSort={sortConfig}
                      onSort={handleSort}
                      align={column.align === "right" ? "right" : "left"}
                    />
                  </th>
                ))}
                <th className="min-w-[120px] whitespace-nowrap border-b border-line-1 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((record) => (
                <tr key={record.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  {module.columns.map((column) => (
                    <td key={column.key} className={cn("border-r border-line-1 px-4", column.align === "right" && "text-right")}>
                      {renderPriorityValue(record[column.key], column.kind, record[column.toneKey ?? "statusTone"] as Tone | undefined)}
                    </td>
                  ))}
                  <td className="min-w-[120px] whitespace-nowrap px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}`)}>详情</Button>
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}/edit`)}>编辑</Button>
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
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] border-collapse text-sm lg:min-w-full">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                {module.columns.map((column) => (
                  <th key={column.key} className={cn("border-b border-line-1 px-4", column.align === "right" && "text-right")}>
                    <TableSortHeader
                      label={column.label}
                      sortKey={column.key}
                      currentSort={sortConfig}
                      onSort={handleSort}
                      align={column.align === "right" ? "right" : "left"}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={`${index}-${row[module.columns[0].key]}`} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  {module.columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-2.5", column.align === "right" && "text-right", column.kind === "status" && "min-w-[100px] whitespace-nowrap")}>
                      {renderPriorityValue(row[column.key], column.kind, row[column.toneKey ?? "tone"] as Tone | undefined)}
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
