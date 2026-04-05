import { Button, FilterActions, FilterField, SearchInput, Select, StatusPill } from "../components/Ui";
import { ledgerRecords } from "../data/mock";

export function CustomerLedgerPage() {
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
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] border-collapse text-sm lg:min-w-full">
              <thead className="bg-fill-2 text-left text-text-2">
                <tr className="h-[44px]">
                  <th className="border-b border-r border-line-1 px-4">客户名称</th>
                  <th className="border-b border-r border-line-1 px-4">单据类型</th>
                  <th className="border-b border-r border-line-1 px-4">单据编号</th>
                  <th className="border-b border-r border-line-1 px-4">应收金额</th>
                  <th className="border-b border-r border-line-1 px-4">已回款</th>
                  <th className="border-b border-r border-line-1 px-4">未回金额</th>
                  <th className="border-b border-r border-line-1 px-4">到期日</th>
                  <th className="min-w-[100px] whitespace-nowrap border-b border-line-1 px-4">状态</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRecords.map((record) => (
                  <tr key={record.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                    <td className="border-r border-line-1 px-4">{record.customer}</td>
                    <td className="border-r border-line-1 px-4">{record.documentType}</td>
                    <td className="border-r border-line-1 px-4 text-brand-6">{record.documentNo}</td>
                    <td className="border-r border-line-1 px-4">{record.receivable}</td>
                    <td className="border-r border-line-1 px-4">{record.paid}</td>
                    <td className="border-r border-line-1 px-4 font-medium text-text-1">{record.balance}</td>
                    <td className="border-r border-line-1 px-4">{record.dueDate}</td>
                    <td className="min-w-[100px] whitespace-nowrap px-4">
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
