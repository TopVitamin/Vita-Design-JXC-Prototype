import { useMemo, useState } from "react";
import { TABLE_MIN_WIDTH } from "../utils/tableConstants";
import { Button, FilterActions, FilterField, Pagination, ResizableHeaderCell, SearchInput, Select, TableSortHeader, useResizableColumns } from "../components/Ui";
import { DataCell, StatusCell } from "../components/TableCells";
import { EmptyStateRow } from "../components/ModuleKit";
import { inventoryRecords } from "../data/mock";

export function InventoryQueryPage() {
  const [keyword, setKeyword] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const inventoryColumns = [
    { key: "sku", width: 160, minWidth: 140 },
    { key: "productName", width: 240, minWidth: 180 },
    { key: "spec", width: 180, minWidth: 140 },
    { key: "warehouse", width: 160, minWidth: 140 },
    { key: "currentStock", width: 120, minWidth: 110 },
    { key: "reservedStock", width: 120, minWidth: 110 },
    { key: "availableStock", width: 120, minWidth: 110 },
    { key: "warning", width: 120, minWidth: 110, resizable: false },
  ];
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("inventory-query:list", inventoryColumns);

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        <FilterField label="综合搜索">
          <SearchInput value={keyword} onChange={setKeyword} placeholder="搜索商品/SKU" className="w-[220px] bg-white" />
        </FilterField>
        <FilterField label="仓库">
          <div className="w-[220px]">
            <Select value="" onChange={() => {}} options={["华北总仓", "华东总仓", "杭州分仓", "华南中心仓"]} placeholder="选择仓库" className="bg-white" />
          </div>
        </FilterField>
        <FilterField label="库存状态">
          <div className="w-[220px]">
            <Select value="" onChange={() => {}} options={["库存健康", "低库存", "需补货"]} placeholder="选择库存状态" className="bg-white" />
          </div>
        </FilterField>
        <FilterField label="商品分类">
          <div className="w-[220px]">
            <Select value="" onChange={() => {}} options={["电子设备", "耗材辅料", "包装物料"]} placeholder="选择分类" className="bg-white" />
          </div>
        </FilterField>
        <FilterActions onSecondaryClick={() => setKeyword("")} extra={<Button>导出结果</Button>} />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button>查看库存预警</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.standard) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                <ResizableHeaderCell width={getColumnStyle("sku").width} minWidth={getColumnStyle("sku").minWidth} onResizeStart={(clientX) => startResize("sku", clientX)}><TableSortHeader label="SKU" sortKey="sku" currentSort={sortConfig} onSort={handleSort} /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("productName").width} minWidth={getColumnStyle("productName").minWidth} onResizeStart={(clientX) => startResize("productName", clientX)}><TableSortHeader label="商品名称" sortKey="productName" currentSort={sortConfig} onSort={handleSort} /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("spec").width} minWidth={getColumnStyle("spec").minWidth} onResizeStart={(clientX) => startResize("spec", clientX)}>规格</ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("warehouse").width} minWidth={getColumnStyle("warehouse").minWidth} onResizeStart={(clientX) => startResize("warehouse", clientX)}><TableSortHeader label="仓库" sortKey="warehouse" currentSort={sortConfig} onSort={handleSort} /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("currentStock").width} minWidth={getColumnStyle("currentStock").minWidth} className="text-right" onResizeStart={(clientX) => startResize("currentStock", clientX)}><TableSortHeader label="现存" sortKey="currentStock" currentSort={sortConfig} onSort={handleSort} align="right" /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("reservedStock").width} minWidth={getColumnStyle("reservedStock").minWidth} className="text-right" onResizeStart={(clientX) => startResize("reservedStock", clientX)}><TableSortHeader label="占用" sortKey="reservedStock" currentSort={sortConfig} onSort={handleSort} align="right" /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("availableStock").width} minWidth={getColumnStyle("availableStock").minWidth} className="text-right" onResizeStart={(clientX) => startResize("availableStock", clientX)}><TableSortHeader label="可用" sortKey="availableStock" currentSort={sortConfig} onSort={handleSort} align="right" /></ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("warning").width} minWidth={getColumnStyle("warning").minWidth} resizable={false} className="border-r-0">状态</ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? <EmptyStateRow colSpan={8} /> : paginatedRows.map((item) => (
                <tr key={item.sku} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  <DataCell style={getColumnStyle("sku")} nowrap>{item.sku}</DataCell>
                  <DataCell style={getColumnStyle("productName")} nowrap className="text-text-1" truncate title={item.productName}>{item.productName}</DataCell>
                  <DataCell style={getColumnStyle("spec")} nowrap>{item.spec}</DataCell>
                  <DataCell style={getColumnStyle("warehouse")} nowrap>{item.warehouse}</DataCell>
                  <DataCell style={getColumnStyle("currentStock")} align="right" nowrap>{item.currentStock}</DataCell>
                  <DataCell style={getColumnStyle("reservedStock")} align="right" nowrap>{item.reservedStock}</DataCell>
                  <DataCell style={getColumnStyle("availableStock")} align="right" nowrap emphasis>{item.availableStock}</DataCell>
                  <StatusCell style={getColumnStyle("warning")} nowrap isLast tone={item.tone} label={item.warning} />
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
