import { useMemo, useState } from "react";
import { TABLE_MIN_WIDTH } from "../utils/tableConstants";
import { useNavigate } from "react-router-dom";
import { Button, FilterActions, FilterField, PageTitle, Pagination, ResizableHeaderCell, SearchInput, Select, StatusPill, TableSortHeader, useResizableColumns } from "../components/Ui";
import { getPayableRows } from "../data/arWorkspace";
import { money } from "../contracts/modules/shared";
import { cn } from "../utils/cn";

const periodStatusMap: Record<string, string> = {
  within: "账期内",
  approaching: "临近到期",
  overdue: "已逾期",
  settled: "已结清",
};
const periodToneMap: Record<string, "green" | "orange" | "red" | "gray"> = {
  within: "green",
  approaching: "orange",
  overdue: "red",
  settled: "gray",
};

export function PayableQueryPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [periodStatusFilter, setPeriodStatusFilter] = useState("全部");
  const [hasPaymentFilter, setHasPaymentFilter] = useState("有未付款");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const columns = [
    { key: "supplier", width: 200, minWidth: 180 },
    { key: "balance", width: 140, minWidth: 120 },
    { key: "periodStatusTag", width: 110, minWidth: 100 },
    { key: "remainingDays", width: 110, minWidth: 100 },
    { key: "dueDate", width: 120, minWidth: 110 },
    { key: "supplierPeriodDays", width: 110, minWidth: 100 },
    { key: "uninvoicedCount", width: 120, minWidth: 100 },
    { key: "lastPaymentDate", width: 120, minWidth: 110 },
    { key: "lastPaymentAmount", width: 130, minWidth: 110 },
    { key: "action", width: 100, minWidth: 90, resizable: false },
  ];
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("payable-query:list", columns);

  const rows = useMemo(() => getPayableRows(), []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (keyword) {
        const kw = keyword.toLowerCase();
        if (!row.supplierName.toLowerCase().includes(kw) && !row.supplierCode.toLowerCase().includes(kw)) return false;
      }
      if (periodStatusFilter !== "全部") {
        const filterMap: Record<string, string[]> = {
          "账期内": ["within"],
          "临近到期（7天内）": ["approaching"],
          "已逾期": ["overdue"],
          "已结清": ["settled"],
        };
        const allowed = filterMap[periodStatusFilter] || [];
        if (!allowed.includes(row.periodStatus)) return false;
      }
      if (hasPaymentFilter === "有未付款" && row.balance === "0.00") return false;
      if (hasPaymentFilter === "已全额付款" && row.balance !== "0.00") return false;
      return true;
    });
  }, [keyword, periodStatusFilter, hasPaymentFilter, rows]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const metrics = useMemo(() => {
    const hitSuppliers = filteredRows.length;
    const totalBalance = filteredRows.reduce((sum, r) => sum + parseFloat(r.balance.replace(/,/g, "")), 0);
    const approachingBalance = filteredRows.filter(r => r.periodStatus === "approaching").reduce((sum, r) => sum + parseFloat(r.balance.replace(/,/g, "")), 0);
    const overdueBalance = filteredRows.filter(r => r.periodStatus === "overdue").reduce((sum, r) => sum + parseFloat(r.balance.replace(/,/g, "")), 0);
    return { hitSuppliers, totalBalance, approachingBalance, overdueBalance };
  }, [filteredRows]);

  const handleRegisterPayment = (row: { supplierCode: string; supplierName: string }) => {
    navigate(`/payment-management/new?supplierCode=${row.supplierCode}&supplierName=${encodeURIComponent(row.supplierName)}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="应付查询">
        <span className="text-xs text-text-3">查看各供应商当前应付余额、账期状态和付款记录，为付款登记提供决策依据。</span>
      </PageTitle>

      {/* 汇总数据区 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-line-1 bg-white px-4 py-3">
          <div className="text-xs text-text-2">命中供应商数</div>
          <div className="mt-1 text-xl font-semibold text-blue-600">{metrics.hitSuppliers} 位供应商</div>
        </div>
        <div className="rounded-lg border border-line-1 bg-white px-4 py-3">
          <div className="text-xs text-text-2">应付总余额</div>
          <div className="mt-1 text-xl font-semibold text-orange-500">¥{metrics.totalBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-lg border border-line-1 bg-white px-4 py-3">
          <div className="text-xs text-text-2">即将到期（7天内）</div>
          <div className="mt-1 text-xl font-semibold text-orange-500">¥{metrics.approachingBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-lg border border-line-1 bg-white px-4 py-3">
          <div className="text-xs text-text-2">已逾期未付款</div>
          <div className="mt-1 text-xl font-semibold text-red-500">¥{metrics.overdueBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* 账期状态颜色说明 */}
      <div className="flex items-center gap-4 text-xs text-text-2">
        <span className="text-text-3">账期状态：</span>
        <span className="flex items-center gap-1"><StatusPill tone="green">账期内</StatusPill> 距账期到期 &gt; 7 天</span>
        <span className="flex items-center gap-1"><StatusPill tone="orange">临近到期</StatusPill> 距账期到期 1-7 天</span>
        <span className="flex items-center gap-1"><StatusPill tone="red">已逾期</StatusPill> 已超过账期到期日</span>
        <span className="flex items-center gap-1"><StatusPill tone="gray">已结清</StatusPill> 应付余额 = 0</span>
      </div>

      {/* 查询区 */}
      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        <FilterField label="供应商">
          <div className="w-[220px]">
            <SearchInput value={keyword} onChange={setKeyword} placeholder="搜索供应商名称/编码" className="bg-white" />
          </div>
        </FilterField>
        <FilterField label="账期状态">
          <div className="w-[180px]">
            <Select value={periodStatusFilter} onChange={(v) => { setPeriodStatusFilter(v); setCurrentPage(1); }} options={["全部", "账期内", "临近到期（7天内）", "已逾期", "已结清"]} />
          </div>
        </FilterField>
        <FilterField label="是否有未付款">
          <div className="w-[160px]">
            <Select value={hasPaymentFilter} onChange={(v) => { setHasPaymentFilter(v); setCurrentPage(1); }} options={["全部", "有未付款", "已全额付款"]} />
          </div>
        </FilterField>
        <FilterActions onSecondaryClick={() => { setKeyword(""); setPeriodStatusFilter("全部"); setHasPaymentFilter("有未付款"); setCurrentPage(1); }} />
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
                <ResizableHeaderCell width={getColumnStyle("supplier").width} minWidth={getColumnStyle("supplier").minWidth} onResizeStart={(clientX) => startResize("supplier", clientX)}>
                  <span className="font-medium">供应商</span>
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("balance").width} minWidth={getColumnStyle("balance").minWidth} className="text-right" onResizeStart={(clientX) => startResize("balance", clientX)}>
                  <TableSortHeader label="应付余额" sortKey="balance" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("periodStatusTag").width} minWidth={getColumnStyle("periodStatusTag").minWidth} onResizeStart={(clientX) => startResize("periodStatusTag", clientX)}>
                  <span className="font-medium">账期状态</span>
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("remainingDays").width} minWidth={getColumnStyle("remainingDays").minWidth} className="text-right" onResizeStart={(clientX) => startResize("remainingDays", clientX)}>
                  <TableSortHeader label="剩余账期（天）" sortKey="remainingDays" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("dueDate").width} minWidth={getColumnStyle("dueDate").minWidth} onResizeStart={(clientX) => startResize("dueDate", clientX)}>
                  <span className="font-medium">账期到期日</span>
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("supplierPeriodDays").width} minWidth={getColumnStyle("supplierPeriodDays").minWidth} className="text-right" onResizeStart={(clientX) => startResize("supplierPeriodDays", clientX)}>
                  <TableSortHeader label="供应商账期（天）" sortKey="supplierPeriodDays" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("uninvoicedCount").width} minWidth={getColumnStyle("uninvoicedCount").minWidth} className="text-right" onResizeStart={(clientX) => startResize("uninvoicedCount", clientX)}>
                  <TableSortHeader label="未核销入库单数" sortKey="uninvoicedCount" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("lastPaymentDate").width} minWidth={getColumnStyle("lastPaymentDate").minWidth} onResizeStart={(clientX) => startResize("lastPaymentDate", clientX)}>
                  <span className="font-medium">最近付款日期</span>
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("lastPaymentAmount").width} minWidth={getColumnStyle("lastPaymentAmount").minWidth} className="text-right" onResizeStart={(clientX) => startResize("lastPaymentAmount", clientX)}>
                  <TableSortHeader label="最近付款金额" sortKey="lastPaymentAmount" currentSort={null} onSort={() => {}} align="right" />
                </ResizableHeaderCell>
                <ResizableHeaderCell width={getColumnStyle("action").width} minWidth={getColumnStyle("action").minWidth} resizable={false} className="border-r-0 text-center">
                  <span className="font-medium">操作</span>
                </ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.supplierCode} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  <td className="border-r border-line-1 px-4 whitespace-nowrap text-link" style={getColumnStyle("supplier")} title={row.supplierName}>
                    <div className="overflow-hidden text-ellipsis cursor-pointer" onClick={() => handleRegisterPayment(row)}>
                      <span className="text-text-3 mr-1">{row.supplierCode}</span>{row.supplierName}
                    </div>
                  </td>
                  <td className={cn("border-r border-line-1 px-4 text-right whitespace-nowrap font-medium", row.balance === "0.00" ? "text-text-3" : "text-text-1")} style={getColumnStyle("balance")}>
                    {row.balance === "0.00" ? "¥0.00" : money(parseFloat(row.balance.replace(/,/g, "")))}
                  </td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("periodStatusTag")}>
                    <StatusPill tone={periodToneMap[row.periodStatus]}>{periodStatusMap[row.periodStatus]}</StatusPill>
                  </td>
                  <td className={cn("border-r border-line-1 px-4 text-right whitespace-nowrap font-medium", row.remainingDays < 0 ? "text-red-500" : row.remainingDays <= 7 ? "text-orange-500" : "text-text-1")} style={getColumnStyle("remainingDays")}>
                    {row.remainingDays >= 0 ? `${row.remainingDays}天` : `${row.remainingDays}天`}
                  </td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("dueDate")}>{row.dueDate || "-"}</td>
                  <td className="border-r border-line-1 px-4 text-right whitespace-nowrap text-text-3" style={getColumnStyle("supplierPeriodDays")}>
                    {row.supplierPeriodDays > 0 ? `${row.supplierPeriodDays}天` : "-"}
                  </td>
                  <td className="border-r border-line-1 px-4 text-right whitespace-nowrap" style={getColumnStyle("uninvoicedCount")}>{row.uninvoicedCount}</td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("lastPaymentDate")}>{row.lastPaymentDate || "-"}</td>
                  <td className="border-r border-line-1 px-4 text-right whitespace-nowrap" style={getColumnStyle("lastPaymentAmount")}>
                    {row.lastPaymentAmount === "0.00" ? "-" : money(parseFloat(row.lastPaymentAmount.replace(/,/g, "")))}
                  </td>
                  <td className="px-4 whitespace-nowrap text-center" style={getColumnStyle("action")}>
                    <button className="text-link hover:text-link-hover" onClick={() => handleRegisterPayment(row)}>登记付款</button>
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
