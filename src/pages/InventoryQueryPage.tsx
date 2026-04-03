import { Search } from "lucide-react";
import { Button, PageTitle, SearchInput, Select, StatusPill } from "../components/Ui";
import { inventoryRecords } from "../data/mock";

export function InventoryQueryPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="库存查询" />

      <div className="flex flex-col gap-4 rounded-lg border border-line-1 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SearchInput value="" onChange={() => {}} placeholder="搜索商品/SKU" />
          <Select value="" onChange={() => {}} options={["华北总仓", "华东总仓", "杭州分仓", "华南中心仓"]} placeholder="选择仓库" />
          <Select value="" onChange={() => {}} options={["库存健康", "低库存", "需补货"]} placeholder="选择库存状态" />
          <Select value="" onChange={() => {}} options={["电子设备", "耗材辅料", "包装物料"]} placeholder="选择分类" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<Search size={14} />}>查询</Button>
          <Button>导出结果</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-1">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] border-collapse text-sm lg:min-w-full">
            <thead className="bg-fill-1 text-left text-text-2">
              <tr className="h-[42px]">
                <th className="border-b border-r border-line-1 px-4">SKU</th>
                <th className="border-b border-r border-line-1 px-4">商品名称</th>
                <th className="border-b border-r border-line-1 px-4">规格</th>
                <th className="border-b border-r border-line-1 px-4">仓库</th>
                <th className="border-b border-r border-line-1 px-4">现存</th>
                <th className="border-b border-r border-line-1 px-4">占用</th>
                <th className="border-b border-r border-line-1 px-4">可用</th>
                <th className="border-b border-line-1 px-4">状态</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRecords.map((item) => (
                <tr key={item.sku} className="h-[42px] border-b border-line-1 text-text-2 hover:bg-[#fafcff]">
                  <td className="border-r border-line-1 px-4">{item.sku}</td>
                  <td className="border-r border-line-1 px-4 text-text-1">{item.productName}</td>
                  <td className="border-r border-line-1 px-4">{item.spec}</td>
                  <td className="border-r border-line-1 px-4">{item.warehouse}</td>
                  <td className="border-r border-line-1 px-4">{item.currentStock}</td>
                  <td className="border-r border-line-1 px-4">{item.reservedStock}</td>
                  <td className="border-r border-line-1 px-4 font-medium text-text-1">{item.availableStock}</td>
                  <td className="px-4">
                    <StatusPill tone={item.tone}>{item.warning}</StatusPill>
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
