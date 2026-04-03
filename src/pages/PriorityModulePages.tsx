import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, FilterActions, FilterField, Pagination, SearchInput, Select, StatusPill, TabBar, TableSortHeader } from "../components/Ui";
import { getCrudModuleDefinition, getModuleDefinition, type CrudModuleDefinition, type QueryModuleDefinition, type Tone } from "../data/modulePages";
import type { ViewKey } from "../data/mock";
import { cn } from "../utils/cn";

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
    }).sort((a, b) => comparePriorityRecord(a, b, sortConfig));
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
    <div className="flex flex-col">
      {module.statusTabs ? (
        <TabBar
          items={module.statusTabs.map((tab) => ({ key: tab, label: tab }))}
          activeKey={activeTab}
          onChange={(tab) => startTransition(() => setActiveTab(tab))}
        />
      ) : null}

      <div className="mb-6 flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-[rgba(247,248,250,0.5)] px-4 py-3.5 text-[13px]">
        {module.filters.map((filter) => (
          <PriorityFilterItem
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
          <table className="min-w-[1120px] border-collapse text-sm lg:min-w-full">
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
                <th className="border-b border-line-1 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((record) => (
                <tr key={record.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-[#fafcff]">
                  {module.columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-2.5", column.align === "right" && "text-right")}>
                      {renderPriorityValue(record[column.key], column.kind, record[column.toneKey ?? "statusTone"] as Tone | undefined)}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}`)}>详情</Button>
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}/edit`)}>修改</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function PriorityFilterItem({
  filter,
  keyword,
  onKeywordChange,
  value,
  onValueChange,
}: {
  filter: CrudModuleDefinition["filters"][number];
  keyword: string;
  onKeywordChange: (value: string) => void;
  value: string;
  onValueChange: (value: string) => void;
}) {
  if (filter.type === "search") {
    return (
      <FilterField label={filter.label} className="min-w-[220px]">
        <SearchInput value={keyword} onChange={onKeywordChange} placeholder={filter.placeholder ?? "搜索"} className="w-[220px] bg-white" />
      </FilterField>
    );
  }

  if (filter.type === "select") {
    return (
      <FilterField label={filter.label} className="min-w-[180px]">
        <div className="w-[180px]">
          <Select value={value} onChange={onValueChange} options={filter.options ?? []} placeholder={filter.label} className="bg-white" />
        </div>
      </FilterField>
    );
  }

  return null;
}

function renderPriorityValue(value: unknown, kind?: "text" | "status" | "money", tone?: Tone) {
  if (kind === "status") {
    return <StatusPill tone={tone ?? "gray"}>{String(value ?? "-")}</StatusPill>;
  }
  return String(value ?? "-");
}

function comparePriorityRecord(
  a: Record<string, any>,
  b: Record<string, any>,
  sortConfig: { key: string; direction: "asc" | "desc" } | null,
) {
  if (!sortConfig) return 0;
  const { key, direction } = sortConfig;
  const factor = direction === "asc" ? 1 : -1;
  const valueA = normalizePrioritySortValue(a[key]);
  const valueB = normalizePrioritySortValue(b[key]);
  if (valueA < valueB) return -1 * factor;
  if (valueA > valueB) return 1 * factor;
  return 0;
}

function normalizePrioritySortValue(value: unknown) {
  if (typeof value === "number") return value;
  const text = String(value ?? "");
  const money = Number(text.replace(/[^0-9.-]+/g, ""));
  if (text.includes("¥") && Number.isFinite(money)) return money;
  const time = new Date(text.replace(/\./g, "/")).getTime();
  if (Number.isFinite(time) && /[-/:]/.test(text)) return time;
  return text.toLowerCase();
}

function PriorityQueryListPage({ view }: { view: "sales-query" }) {
  const module = getModuleDefinition(view) as QueryModuleDefinition | undefined;
  const [keyword, setKeyword] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredKeyword = useDeferredValue(keyword);

  if (!module) return null;

  const filteredRows = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    return module.rows
      .filter((row) => (!normalized ? true : Object.values(row).join(" ").toLowerCase().includes(normalized)))
      .sort((a, b) => comparePriorityRecord(a, b, sortConfig));
  }, [deferredKeyword, module.rows, sortConfig]);

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
    <div className="flex flex-col">
      <div className="mb-6 flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-[rgba(247,248,250,0.5)] px-4 py-3.5 text-[13px]">
        {module.filters.map((filter) => (
          <PriorityFilterItem
            key={filter.key}
            filter={filter as CrudModuleDefinition["filters"][number]}
            keyword={keyword}
            onKeywordChange={setKeyword}
            value=""
            onValueChange={() => {}}
          />
        ))}
        <FilterActions onSecondaryClick={() => setKeyword("")} extra={<Button>导出</Button>} />
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
                <tr key={`${index}-${row[module.columns[0].key]}`} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-[#fafcff]">
                  {module.columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-2.5", column.align === "right" && "text-right")}>
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
