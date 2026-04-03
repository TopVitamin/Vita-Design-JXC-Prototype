import { Button, FilterActions, FilterField, PageTitle, SearchInput, Select, StatusPill } from "../components/Ui";
import { ledgerRecords } from "../data/mock";

export function CustomerLedgerPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="客户往来查询" />

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line-1 bg-white p-4">
        <FilterField label="综合搜索" className="min-w-[220px]">
          <SearchInput value="" onChange={() => {}} placeholder="搜索客户/单号" className="w-[220px]" />
        </FilterField>
        <FilterField label="客户等级" className="min-w-[180px]">
          <Select value="" onChange={() => {}} options={["全部客户", "重点客户", "账期客户"]} placeholder="客户等级" />
        </FilterField>
        <FilterField label="往来状态" className="min-w-[180px]">
          <Select value="" onChange={() => {}} options={["待回款", "已结清", "已逾期"]} placeholder="往来状态" />
        </FilterField>
        <FilterField label="时间范围" className="min-w-[180px]">
          <Select value="" onChange={() => {}} options={["本月", "近30天", "本季度"]} placeholder="时间范围" />
        </FilterField>
        <FilterActions extra={<Button>导出对账单</Button>} />
      </div>

      <div className="overflow-hidden rounded-xl border border-line-1">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] border-collapse text-sm lg:min-w-full">
            <thead className="bg-fill-1 text-left text-text-2">
              <tr className="h-[42px]">
                <th className="border-b border-r border-line-1 px-4">客户名称</th>
                <th className="border-b border-r border-line-1 px-4">单据类型</th>
                <th className="border-b border-r border-line-1 px-4">单据编号</th>
                <th className="border-b border-r border-line-1 px-4">应收金额</th>
                <th className="border-b border-r border-line-1 px-4">已回款</th>
                <th className="border-b border-r border-line-1 px-4">未回金额</th>
                <th className="border-b border-r border-line-1 px-4">到期日</th>
                <th className="border-b border-line-1 px-4">状态</th>
              </tr>
            </thead>
            <tbody>
              {ledgerRecords.map((record) => (
                <tr key={record.id} className="h-[42px] border-b border-line-1 text-text-2 hover:bg-[#fafcff]">
                  <td className="border-r border-line-1 px-4">{record.customer}</td>
                  <td className="border-r border-line-1 px-4">{record.documentType}</td>
                  <td className="border-r border-line-1 px-4 text-brand-6">{record.documentNo}</td>
                  <td className="border-r border-line-1 px-4">{record.receivable}</td>
                  <td className="border-r border-line-1 px-4">{record.paid}</td>
                  <td className="border-r border-line-1 px-4 font-medium text-text-1">{record.balance}</td>
                  <td className="border-r border-line-1 px-4">{record.dueDate}</td>
                  <td className="px-4">
                    <StatusPill tone={record.tone}>{record.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
