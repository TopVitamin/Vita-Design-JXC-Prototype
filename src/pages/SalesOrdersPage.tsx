import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, Pagination, SearchInput, StatusPill, TableSortHeader } from "../components/Ui";
import { Drawer } from "../components/Drawer";
import { salesOrders, salesOrderTabs } from "../data/mock";
import { cn } from "../utils/cn";

export function SalesOrdersPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("全部订单");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const deferredKeyword = useDeferredValue(keyword);

  const filteredOrders = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();

    return salesOrders.filter((order) => {
      const byKeyword =
        !normalized ||
        [order.orderNo, order.customer, order.creator, order.warehouse].some((value) =>
          value.toLowerCase().includes(normalized),
        );

      if (!byKeyword) {
        return false;
      }

      if (activeTab !== "全部订单") {
        return order.status === activeTab;
      }

      return true;
    }).sort((a, b) => {
      if (!sortConfig) return 0;
      
      const { key, direction } = sortConfig;
      const factor = direction === "asc" ? 1 : -1;
      
      let valA: any = a[key as keyof typeof a];
      let valB: any = b[key as keyof typeof b];

      if (key === "amount") {
        valA = Number(String(valA).replace(/[^0-9.-]+/g, ""));
        valB = Number(String(valB).replace(/[^0-9.-]+/g, ""));
      } else if (key === "createdAt") {
        valA = new Date(String(valA)).getTime();
        valB = new Date(String(valB)).getTime();
      }

      if (valA < valB) return -1 * factor;
      if (valA > valB) return 1 * factor;
      return 0;
    });
  }, [activeTab, deferredKeyword, sortConfig]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else {
        setSortConfig(null);
        return;
      }
    }
    setSortConfig({ key, direction });
  };

  const isAllSelected = filteredOrders.length > 0 && selectedIds.length === filteredOrders.length;
  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="flex flex-col">
      {/* 状态的搜索做成类似参考图的底部带下划线的 Tab 切换 */}
      <div className="mb-5 flex items-center gap-6 border-b border-line-2 px-1 pt-2">
        {salesOrderTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() =>
              startTransition(() => {
                setActiveTab(tab);
              })
            }
            className={cn(
              "relative pb-3 text-[14px] font-medium transition cursor-pointer custom-tab",
              activeTab === tab
                ? "text-brand-6"
                : "text-text-2 hover:text-text-1",
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 h-[2px] w-full bg-brand-6" />
            )}
          </button>
        ))}
      </div>

      {/* 搜索过滤模块：独立一块放置所有特征查询功能，左侧起算 */}
      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-lg border border-line-1 bg-[rgba(247,248,250,0.5)] px-4 py-3.5 text-[13px]">
        
        <div className="flex items-center shrink-0">
          <span className="text-text-2 font-medium">业务日期：</span>
          <RangeDateFields />
        </div>

        <div className="h-4 w-px bg-line-2 shrink-0" />

        <div className="flex items-center shrink-0">
          <span className="text-text-2 font-medium">综合搜索：</span>
          <SearchInput value={keyword} onChange={setKeyword} placeholder="单号 / 客户 / 仓库" className="w-[200px] sm:w-[260px] bg-white" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button tone="primary">查询</Button>
          <Button>重置</Button>
        </div>

        <div className="h-4 w-px bg-line-2 shrink-0 ml-1" />
        
        <Button onClick={() => setIsAdvancedOpen(true)} className="shrink-0">
          高级搜索
        </Button>
      </div>

      {/* 动作行与表格合成一个紧密的组块来体现“亲密性原则” */}
      <div className="flex flex-col gap-3">
        {/* 动作行：紧贴下方表格的大盘操作汇总 */}
        <div className="flex flex-wrap items-center gap-2.5">
        <Button tone="primary" onClick={() => navigate("/sales-orders/new")}>新建订单</Button>
        <Button>导出</Button>
        <div className="mx-1 h-4 w-px bg-line-2" />
        {["批量审核", "批量导出", "批量关闭", "查看库存占用"].map((action) => (
          <Button key={action}>{action}</Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] border-collapse text-sm lg:min-w-full">
            <thead className="bg-fill-1 text-left text-text-2">
              <tr className="h-[44px]">
                <th className="sticky left-0 z-10 w-10 border-b border-r border-line-1 bg-fill-1 px-3">
                  <Checkbox checked={isAllSelected} onChange={toggleAll} />
                </th>
                <th className="sticky left-10 z-10 min-w-[140px] border-b border-r border-line-1 bg-fill-1 px-4">
                  <TableSortHeader label="订单编号" sortKey="orderNo" currentSort={sortConfig} onSort={handleSort} />
                </th>
                <th className="min-w-[240px] border-b border-r border-line-1 px-4">
                  <TableSortHeader label="客户名称" sortKey="customer" currentSort={sortConfig} onSort={handleSort} />
                </th>
                <th className="min-w-[100px] border-b border-r border-line-1 px-4">客户等级</th>
                <th className="min-w-[120px] border-b border-r border-line-1 px-4">发货仓库</th>
                <th className="min-w-[120px] border-b border-r border-line-1 px-4 text-right">
                  <TableSortHeader align="right" label="订单金额" sortKey="amount" currentSort={sortConfig} onSort={handleSort} />
                </th>
                <th className="min-w-[100px] border-b border-r border-line-1 px-4">订单状态</th>
                <th className="min-w-[100px] border-b border-r border-line-1 px-4">收款状态</th>
                <th className="min-w-[90px] border-b border-r border-line-1 px-4">创建人</th>
                <th className="min-w-[150px] border-b border-line-1 px-4">
                  <TableSortHeader label="创建时间" sortKey="createdAt" currentSort={sortConfig} onSort={handleSort} />
                </th>
                <th className="min-w-[140px] border-b border-line-1 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="group h-[44px] border-b border-line-1 text-text-2 hover:bg-[#fafcff]">
                  <td className="sticky left-0 z-10 border-r border-line-1 bg-white px-3 group-hover:bg-[#fafcff]">
                    <Checkbox checked={selectedIds.includes(order.id)} onChange={() => toggleSelection(order.id)} />
                  </td>
                  <td className="sticky left-10 z-10 border-r border-line-1 bg-white px-4 group-hover:bg-[#fafcff]">
                    <button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-orders/${order.id}`)}>
                      {order.orderNo}
                    </button>
                  </td>
                  <td className="border-r border-line-1 px-4">{order.customer}</td>
                  <td className="border-r border-line-1 px-4">{order.customerLevel}</td>
                  <td className="border-r border-line-1 px-4">{order.warehouse}</td>
                  <td className="border-r border-line-1 px-4 text-right">{order.amount}</td>
                  <td className="border-r border-line-1 px-4">
                    <StatusPill tone={order.statusTone}>{order.status}</StatusPill>
                  </td>
                  <td className="border-r border-line-1 px-4">{order.paymentStatus}</td>
                  <td className="border-r border-line-1 px-4">{order.creator}</td>
                  <td className="px-4">{order.createdAt}</td>
                  <td className="px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" onClick={() => navigate(`/sales-orders/${order.id}`)}>详情</Button>
                      <Button size="sm" onClick={() => navigate(`/sales-orders/${order.id}/edit`)}>修改</Button>
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
        total={128}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      >
        {selectedIds.length > 0 ? (
          <>
            <span className="text-brand-6 font-medium">已选择 {selectedIds.length} 条</span>
            <span className="mx-2 text-line-3">|</span>
          </>
        ) : null}
      </Pagination>

      <Drawer
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        title="高级搜索"
        footer={
          <>
            <Button onClick={() => setIsAdvancedOpen(false)}>清空</Button>
            <Button tone="primary" onClick={() => setIsAdvancedOpen(false)}>
              搜索
            </Button>
          </>
        }
      >
        <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
          <DrawerField label="单据编号"><MockInput placeholder="请输入" /></DrawerField>
          <DrawerField label="商品名称"><MockInput placeholder="请输入" /></DrawerField>
          <DrawerField label="客户名称"><MockInput placeholder="请输入" /></DrawerField>
          <DrawerField label="客户分类"><MockSelect options={["重点客户", "普通客户", "账期客户"]} placeholder="全部分类" /></DrawerField>
          <DrawerField label="经手人"><MockSelect options={["王晨", "李菲", "钱宇", "周曼"]} placeholder="全部" /></DrawerField>
          <DrawerField label="出库状态"><MockSelect options={["待出库", "已出库", "已签收"]} placeholder="全部" /></DrawerField>
          <DrawerField label="制单日期"><RangeDateFields /></DrawerField>
        </div>
      </Drawer>
    </div>
  );
}

function DrawerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[13px] font-medium text-text-2">{label}：</div>
      {children}
    </label>
  );
}

function RangeDateFields() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <DateInput placeholder="开始时间" />
      <DateInput placeholder="结束时间" />
    </div>
  );
}

function DateInput({ placeholder }: { placeholder: string }) {
  return (
    <label className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] text-text-3 transition focus-within:border-brand-6 focus-within:bg-white">
      <input className="w-full bg-transparent text-text-1 outline-none placeholder:text-text-3" placeholder={placeholder} />
      <CalendarDays size={14} />
    </label>
  );
}

function MockInput({ placeholder }: { placeholder: string }) {
  return (
    <input
      defaultValue=""
      placeholder={placeholder}
      className={cn(
        "h-8 w-full rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] text-text-1 outline-none transition focus:border-brand-6 focus:bg-white placeholder:text-text-3"
      )}
    />
  );
}

function MockSelect({ options, placeholder }: { options: string[], placeholder: string }) {
  return (
    <label className="flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-line-2 bg-fill-1 px-3 text-[13px] text-text-2 transition focus-within:border-brand-6 focus-within:bg-white">
      <select defaultValue="" className="w-full appearance-none bg-transparent text-text-1 outline-none">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="shrink-0 text-text-3" />
    </label>
  );
}
