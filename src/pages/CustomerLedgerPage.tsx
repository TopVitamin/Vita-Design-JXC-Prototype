import { Button, FilterActions, FilterField, ResizableHeaderCell, SearchInput, Select, StatusPill, useResizableColumns } from "../components/Ui";
import { ledgerRecords } from "../mocks/ledger";

export function CustomerLedgerPage() {
  const ledgerColumns = [
    { key: "customer", width: 220, minWidth: 180 },
    { key: "documentType", width: 140, minWidth: 120 },
    { key: "documentNo", width: 180, minWidth: 150 },
    { key: "receivable", width: 140, minWidth: 120 },
    { key: "paid", width: 140, minWidth: 120 },
    { key: "balance", width: 140, minWidth: 120 },
    { key: "dueDate", width: 150, minWidth: 130 },
    { key: "status", width: 120, minWidth: 110, resizable: false },
  ];
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("customer-ledger:list", ledgerColumns);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        <FilterField label="综合搜索">
          <SearchInput value="" onChange={() => {}} placeholder="搜索客户/单号" className="w-[220px]" />
        </FilterField>
        <FilterField label="客户等级">
          <div className="w-[220px]">
            <Select value="" onChange={() => {}} options={["全部客户", "重点客户", "账期客户"]} placeholder="客户等级" />
          </div>
        </FilterField>
        <FilterField label="往来状态">
          <div className="w-[220px]">
            <Select value="" onChange={() => {}} options={["待回款", "已结清", "已逾期"]} placeholder="往来状态" />
          </div>
        </FilterField>
        <FilterField label="时间范围">
          <div className="w-[220px]">
            <Select value="" onChange={() => {}} options={["本月", "近30天", "本季度"]} placeholder="时间范围" />
          </div>
        </FilterField>
        <FilterActions extra={<Button>导出对账单</Button>} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
          <div ref={containerRef} className="overflow-x-auto">
            <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, 1100) }}>
              <thead className="bg-fill-2 text-left text-text-2">
                <tr className="h-[44px]">
                  <ResizableHeaderCell width={getColumnStyle("customer").width} minWidth={getColumnStyle("customer").minWidth} onResizeStart={(clientX) => startResize("customer", clientX)}>客户名称</ResizableHeaderCell>
                  <ResizableHeaderCell width={getColumnStyle("documentType").width} minWidth={getColumnStyle("documentType").minWidth} onResizeStart={(clientX) => startResize("documentType", clientX)}>单据类型</ResizableHeaderCell>
                  <ResizableHeaderCell width={getColumnStyle("documentNo").width} minWidth={getColumnStyle("documentNo").minWidth} onResizeStart={(clientX) => startResize("documentNo", clientX)}>单据编号</ResizableHeaderCell>
                  <ResizableHeaderCell width={getColumnStyle("receivable").width} minWidth={getColumnStyle("receivable").minWidth} onResizeStart={(clientX) => startResize("receivable", clientX)}>应收金额</ResizableHeaderCell>
                  <ResizableHeaderCell width={getColumnStyle("paid").width} minWidth={getColumnStyle("paid").minWidth} onResizeStart={(clientX) => startResize("paid", clientX)}>已回款</ResizableHeaderCell>
                  <ResizableHeaderCell width={getColumnStyle("balance").width} minWidth={getColumnStyle("balance").minWidth} onResizeStart={(clientX) => startResize("balance", clientX)}>未回金额</ResizableHeaderCell>
                  <ResizableHeaderCell width={getColumnStyle("dueDate").width} minWidth={getColumnStyle("dueDate").minWidth} onResizeStart={(clientX) => startResize("dueDate", clientX)}>到期日</ResizableHeaderCell>
                  <ResizableHeaderCell width={getColumnStyle("status").width} minWidth={getColumnStyle("status").minWidth} resizable={false} className="border-r-0">状态</ResizableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {ledgerRecords.map((record) => (
                  <tr key={record.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                    <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("customer")}>{record.customer}</td>
                    <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("documentType")}>{record.documentType}</td>
                    <td className="border-r border-line-1 px-4 text-brand-6 whitespace-nowrap" style={getColumnStyle("documentNo")}>{record.documentNo}</td>
                    <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("receivable")}>{record.receivable}</td>
                    <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("paid")}>{record.paid}</td>
                    <td className="border-r border-line-1 px-4 font-medium text-text-1 whitespace-nowrap" style={getColumnStyle("balance")}>{record.balance}</td>
                    <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("dueDate")}>{record.dueDate}</td>
                    <td className="px-4 whitespace-nowrap" style={getColumnStyle("status")}>
                      <StatusPill tone={record.tone}>{record.status}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
