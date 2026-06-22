import { useMemo, useState } from "react";
import { TABLE_MIN_WIDTH } from "../utils/tableConstants";
import { useNavigate } from "react-router-dom";
import { Button, FilterActions, FilterField, PageTitle, Pagination, ResizableHeaderCell, SearchInput, Select, TableSortHeader, useResizableColumns } from "../components/Ui";
import { getReceivableRows } from "../data/arWorkspace";
import { money } from "../contracts/modules/shared";
import { cn } from "../utils/cn";

function AgingBar({ distribution }: { distribution: { overdue: number; overdue30: number; overdue60: number } }) {
  const total = distribution.overdue + distribution.overdue30 + distribution.overdue60;
  if (total === 0) return <span className="text-text-3">-</span>;
  const overduePct = Math.round((distribution.overdue / total) * 100);
  const overdue30Pct = Math.round((distribution.overdue30 / total) * 100);
  const overdue60Pct = Math.round((distribution.overdue60 / total) * 100);
  return (
    <div className="flex items-center gap-1 w-full">
      <div className="flex flex-1 h-3 rounded-full overflow-hidden bg-fill-2 gap-[2px]">
        {overduePct > 0 && <div className="bg-red-500 rounded-full" style={{ width: `${overduePct}%` }} />}
        {overdue30Pct > 0 && <div className="bg-orange-400 rounded-full" style={{ width: `${overdue30Pct}%` }} />}
        {overdue60Pct > 0 && <div className="bg-orange-300 rounded-full" style={{ width: `${overdue60Pct}%` }} />}
      </div>
      <span className="text-xs text-text-3 whitespace-nowrap">{overduePct}/{overdue30Pct}/{overdue60Pct}%</span>
    </div>
  );
}

const toneClass: Record<string, string> = {
  green: "text-green-600",
  orange: "text-orange-500",
  red: "text-red-500 font-semibold",
};

export function ReceivableQueryPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [agingFilter, setAgingFilter] = useState("全部");
  const [hasBalanceFilter, setHasBalanceFilter] = useState("有未回款");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const columns = [
    { key: "customer", width: 200, minWidth: 180 },
    { key: "balance", width: 140, minWidth: 120 },
    { key: "longestAging", width: 110, minWidth: 100 },
    { key: "agingDistribution", width: 200, minWidth: 180 },
    { key: "uninvoicedCount", width: 120, minWidth: 100 },
    { key: "creditLimit", width: 120, minWidth: 100 },
    { key: "creditUsageRate", width: 100, minWidth: 90 },
    { key: "lastReceiptDate", width: 120, minWidth: 110 },
    { key: "lastReceiptAmount", width: 130, minWidth: 110 },
    { key: "action", width: 100, minWidth: 90, resizable: false },
  ];
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("receivable-query:list", columns);

  const rows = useMemo(() => getReceivableRows(), []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (keyword) {
        const kw = keyword.toLowerCase();
        if (!row.customerName.toLowerCase().includes(kw) && !row.customerCode.toLowerCase().includes(kw)) return false;
      }
      if (agingFilter !== "全部") {
        const aging = row.longestAging;
        if (agingFilter === "未逾期（<30天）" && aging >= 30) return false;
        if (agingFilter === "逾期1-30天（30-59天）" && (aging < 30 || aging >= 60)) return false;
        if (agingFilter === "逾期31-60天（60-89天）" && (aging < 60 || aging >= 90)) return false;
        if (agingFilter === "逾期60天以上（≥90天）" && aging < 90) return false;
      }
      if (hasBalanceFilter === "有未回款" && row.balance === "0.00") return false;
      if (hasBalanceFilter === "已全额回款" && row.balance !== "0.00") return false;
      return true;
    });
  }, [keyword, agingFilter, hasBalanceFilter, rows]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const metrics = useMemo(() => {
    const hitCustomers = filteredRows.length;
    const totalBalance = filteredRows.reduce((sum, r) => sum + parseFloat(r.balance.replace(/,/g, "")), 0);
    const overdueBalance = filteredRows.filter(r => r.longestAging >= 90).reduce((sum, r) => sum + parseFloat(r.balance.replace(/,/g, "")), 0);
    const thisMonthReceipt = filteredRows.reduce((sum, r) => {
      if (r.lastReceiptDate && r.lastReceiptDate.startsWith("2026-04")) {
        return sum + parseFloat(r.lastReceiptAmount.replace(/,/g, ""));
      }
      return sum;
    }, 0);
    return { hitCustomers, totalBalance, overdueBalance, thisMonthReceipt };
  }, [filteredRows]);

  const handleRegisterReceipt = (row: { customerCode: string; customerName: string }) => {
    navigate(`/receipt-management/new?customerCode=${row.customerCode}&customerName=${encodeURIComponent(row.customerName)}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="应收查询">
        <span className="text-xs text-text-3">查看各客户当前应收余额、账龄分布和逾期情况，为收款登记提供决策依据。</span>
      </PageTitle>

      {/* 汇总数据区 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-line-1 bg-white px-4 py-3">
          <div className="text-xs text-text-2">命中客户数</div>
          <div className="mt-1 text-xl font-semibold text-blue-600">{metrics.hitCustomers} 位客户</div>
        </div>
        <div className="rounded-lg border border-line-1 bg-white px-4 py-3">
          <div className="text-xs text-text-2">应收总余额</div>
          <div className="mt-1 text-xl font-semibold text-orange-500">¥{metrics.totalBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-lg border border-line-1 bg-white px-4 py-3">
          <div className="text-xs text-text-2">逾期未回款</div>
          <div className="mt-1 text-xl font-semibold text-red-500">¥{metrics.overdueBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-lg border border-line-1 bg-white px-4 py-3">
          <div className="text-xs text-text-2">本月已回款</div>
          <div className="mt-1 text-xl font-semibold text-green-600">¥{metrics.thisMonthReceipt.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* 账龄颜色说明 */}
      <div className="flex items-center gap-4 text-xs text-text-2">
        <span className="text-text-3">账龄区间：</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>未逾期（&lt;30天）</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-orange-400"></span>逾期1-30天（30-59天）</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-orange-300"></span>逾期31-60天（60-89天）</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>逾期60天以上（≥90天）</span>
      </div>

      {/* 查询区 */}
      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        <FilterField label="客户">
          <div className="w-[220px]">
            <SearchInput value={keyword} onChange={setKeyword} placeholder="搜索客户名称/编码" className="bg-white" />
          </div>
        </FilterField>
        <FilterField label="账龄区间">
          <div className="w-[220px]">
            <Select value={agingFilter} onChange={(v) => { setAgingFilter(v); setCurrentPage(1); }} options={["全部", "未逾期（<30天）", "逾期1-30天（30-59天）", "逾期31-60天（60-89天）", "逾期60天以上（≥90天）"]} />
          </div>
        </FilterField>
        <FilterField label="是否有未回款">
          <div className="w-[160px]">
            <Select value={hasBalanceFilter} onChange={(v) => { setHasBalanceFilter(v); setCurrentPage(1); }} options={["全部", "有未回款", "已全额回款"]} />
          </div>
        </FilterField>
        <FilterActions onSecondaryClick={() => { setKeyword(""); setAgingFilter("全部"); setHasBalanceFilter("有未回款"); setCurrentPage(1); }} />
      </div>

      {/* 工具条 */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button>导出</Button>
      </div>

      {/* 表格 */}
      <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.standard) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                <ResizableHeaderCell width={getColumnStyle("customer").width} minWidth={getColumnStyle("customer").minWidth} onResizeStart={(clientX) => startResize("customer", clientX)}>
                  <span className="font-medium">客户</span>
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("balance").width} minWidth={getColumnStyle("balance").minWidth} className="text-right" onResizeStart={(clientX) => startResize("balance", clientX)}>
                  <TableSortHeader label="应收余额" sortKey="balance" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("longestAging").width} minWidth={getColumnStyle("longestAging").minWidth} className="text-right" onResizeStart={(clientX) => startResize("longestAging", clientX)}>
                  <TableSortHeader label="最长账龄（天）" sortKey="longestAging" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("agingDistribution").width} minWidth={getColumnStyle("agingDistribution").minWidth} onResizeStart={(clientX) => startResize("agingDistribution", clientX)}>
                  <span className="font-medium">账龄分布</span>
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("uninvoicedCount").width} minWidth={getColumnStyle("uninvoicedCount").minWidth} className="text-right" onResizeStart={(clientX) => startResize("uninvoicedCount", clientX)}>
                  <TableSortHeader label="未核销出库单数" sortKey="uninvoicedCount" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("creditLimit").width} minWidth={getColumnStyle("creditLimit").minWidth} className="text-right" onResizeStart={(clientX) => startResize("creditLimit", clientX)}>
                  <TableSortHeader label="信用额度" sortKey="creditLimit" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("creditUsageRate").width} minWidth={getColumnStyle("creditUsageRate").minWidth} className="text-right" onResizeStart={(clientX) => startResize("creditUsageRate", clientX)}>
                  <TableSortHeader label="信用占用率" sortKey="creditUsageRate" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("lastReceiptDate").width} minWidth={getColumnStyle("lastReceiptDate").minWidth} onResizeStart={(clientX) => startResize("lastReceiptDate", clientX)}>
                  <span className="font-medium">最近收款日期</span>
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("lastReceiptAmount").width} minWidth={getColumnStyle("lastReceiptAmount").minWidth} className="text-right" onResizeStart={(clientX) => startResize("lastReceiptAmount", clientX)}>
                  <TableSortHeader label="最近收款金额" sortKey="lastReceiptAmount" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("action").width} minWidth={getColumnStyle("action").minWidth} resizable={false} className="border-r-0 text-center">
                  <span className="font-medium">操作</span>
                </ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.customerCode} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  <td className="border-r border-line-1 px-4 whitespace-nowrap text-link" style={getColumnStyle("customer")} title={row.customerName}>
                    <div className="overflow-hidden text-ellipsis cursor-pointer" onClick={() => handleRegisterReceipt(row)}>
                      <span className="text-text-3 mr-1">{row.customerCode}</span>{row.customerName}
                    </div>
                  </td>
                  <td className={cn("border-r border-line-1 px-4 text-right whitespace-nowrap font-medium", row.balance === "0.00" ? "text-text-3" : "text-text-1")} style={getColumnStyle("balance")}>
                    {row.balance === "0.00" ? "¥0.00" : money(parseFloat(row.balance.replace(/,/g, "")))}
                  </td>
                  <td className={cn("border-r border-line-1 px-4 text-right whitespace-nowrap font-medium", toneClass[row.agingTone] || "")} style={getColumnStyle("longestAging")}>
                    {row.longestAging > 0 ? `${row.longestAging}天` : "-"}
                  </td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("agingDistribution")}>
                    <AgingBar distribution={row.agingDistribution} />
                  </td>
                  <td className="border-r border-line-1 px-4 text-right whitespace-nowrap" style={getColumnStyle("uninvoicedCount")}>{row.uninvoicedCount}</td>
                  <td className="border-r border-line-1 px-4 text-right whitespace-nowrap text-text-3" style={getColumnStyle("creditLimit")}>
                    {row.creditLimit === "0.00" ? "-" : money(parseFloat(row.creditLimit.replace(/,/g, "")))}
                  </td>
                  <td className={cn("border-r border-line-1 px-4 text-right whitespace-nowrap", row.creditUsageRate > 80 ? "text-orange-500 font-medium" : "text-text-3")} style={getColumnStyle("creditUsageRate")}>
                    {row.creditLimit === "0.00" ? "-" : `${row.creditUsageRate}%`}
                  </td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("lastReceiptDate")}>{row.lastReceiptDate || "-"}</td>
                  <td className="border-r border-line-1 px-4 text-right whitespace-nowrap" style={getColumnStyle("lastReceiptAmount")}>
                    {row.lastReceiptAmount === "0.00" ? "-" : money(parseFloat(row.lastReceiptAmount.replace(/,/g, "")))}
                  </td>
                  <td className="px-4 whitespace-nowrap text-center" style={getColumnStyle("action")}>
                    <button className="text-link hover:text-link-hover" onClick={() => handleRegisterReceipt(row)}>登记收款</button>
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
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
      />
    </div>
  );
}
