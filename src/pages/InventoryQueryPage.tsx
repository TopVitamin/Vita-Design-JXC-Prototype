import { useMemo, useState } from "react";
import { Button, FilterActions, FilterField, Pagination, SearchInput, Select, StatusPill, TableSortHeader } from "../components/Ui";
import { inventoryRecords } from "../data/mock";

export function InventoryQueryPage() {
  const [keyword, setKeyword] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return inventoryRecords
      .filter((item) => {
        if (!normalized) return true;
        return [item.sku, item.productName, item.warehouse, item.spec].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        const factor = direction === "asc" ? 1 : -1;
        const valueA = a[key as keyof typeof a];
        const valueB = b[key as keyof typeof b];
        if (valueA < valueB) return -1 * factor;
        if (valueA > valueB) return 1 * factor;
        return 0;
      });
  }, [keyword, sortConfig]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") direction = "desc";
      else {
        setSortConfig(null);
        return;
      }
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-line-1 bg-[rgba(247,248,250,0.5)] px-4 py-3.5">
        <FilterField label="综合搜索" className="min-w-[220px]">
          <SearchInput value={keyword} onChange={setKeyword} placeholder="搜索商品/SKU" className="w-[220px] bg-white" />
        </FilterField>
        <FilterField label="仓库" className="min-w-[180px]">
          <Select value="" onChange={() => {}} options={["华北总仓", "华东总仓", "杭州分仓", "华南中心仓"]} placeholder="选择仓库" className="bg-white" />
        </FilterField>
        <FilterField label="库存状态" className="min-w-[180px]">
          <Select value="" onChange={() => {}} options={["库存健康", "低库存", "需补货"]} placeholder="选择库存状态" className="bg-white" />
        </FilterField>
        <FilterField label="商品分类" className="min-w-[180px]">
          <Select value="" onChange={() => {}} options={["电子设备", "耗材辅料", "包装物料"]} placeholder="选择分类" className="bg-white" />
        </FilterField>
        <FilterActions onSecondaryClick={() => setKeyword("")} extra={<Button>导出结果</Button>} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <Button>查看库存预警</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] border-collapse text-sm lg:min-w-full">
            <thead className="bg-fill-1 text-left text-text-2">
              <tr className="h-[44px]">
                <th className="border-b border-r border-line-1 px-4"><TableSortHeader label="SKU" sortKey="sku" currentSort={sortConfig} onSort={handleSort} /></th>
                <th className="border-b border-r border-line-1 px-4"><TableSortHeader label="商品名称" sortKey="productName" currentSort={sortConfig} onSort={handleSort} /></th>
                <th className="border-b border-r border-line-1 px-4">规格</th>
                <th className="border-b border-r border-line-1 px-4"><TableSortHeader label="仓库" sortKey="warehouse" currentSort={sortConfig} onSort={handleSort} /></th>
                <th className="border-b border-r border-line-1 px-4 text-right"><TableSortHeader label="现存" sortKey="currentStock" currentSort={sortConfig} onSort={handleSort} align="right" /></th>
                <th className="border-b border-r border-line-1 px-4 text-right"><TableSortHeader label="占用" sortKey="reservedStock" currentSort={sortConfig} onSort={handleSort} align="right" /></th>
                <th className="border-b border-r border-line-1 px-4 text-right"><TableSortHeader label="可用" sortKey="availableStock" currentSort={sortConfig} onSort={handleSort} align="right" /></th>
                <th className="border-b border-line-1 px-4">状态</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((item) => (
                <tr key={item.sku} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-[#fafcff]">
                  <td className="border-r border-line-1 px-4">{item.sku}</td>
                  <td className="border-r border-line-1 px-4 text-text-1">{item.productName}</td>
                  <td className="border-r border-line-1 px-4">{item.spec}</td>
                  <td className="border-r border-line-1 px-4">{item.warehouse}</td>
                  <td className="border-r border-line-1 px-4 text-right">{item.currentStock}</td>
                  <td className="border-r border-line-1 px-4 text-right">{item.reservedStock}</td>
                  <td className="border-r border-line-1 px-4 text-right font-medium text-text-1">{item.availableStock}</td>
                  <td className="px-4">
                    <StatusPill tone={item.tone}>{item.warning}</StatusPill>
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
  );
}
