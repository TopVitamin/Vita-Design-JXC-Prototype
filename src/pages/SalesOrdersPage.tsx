import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, DateField, DateRangeField, FilterActions, FilterField, Input, PageTitle, Pagination, SearchInput, Select, StatusPill, TabBar, TableSortHeader } from "../components/Ui";
import { Drawer } from "../components/Drawer";
import { salesOrders, salesOrderTabs } from "../data/mock";

export function SalesOrdersPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("全部订单");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // 业务日期范围状态
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

  // 高级搜索状态
  const [advancedFilters, setAdvancedFilters] = useState({
    orderNo: "",
    productName: "",
    customer: "",
    customerClass: "",
    handler: "",
    outboundStatus: "",
    startDate: "",
    endDate: "",
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const deferredKeyword = useDeferredValue(keyword);

  // 重置所有筛选条件
  const handleReset = () => {
    setKeyword("");
    setDateRange({ start: "", end: "" });
    setAdvancedFilters({
      orderNo: "",
      productName: "",
      customer: "",
      customerClass: "",
      handler: "",
      outboundStatus: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  // 执行高级搜索
  const handleAdvancedSearch = () => {
    setIsAdvancedOpen(false);
    setCurrentPage(1);
  };

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
    <div className="flex flex-col gap-4">
      <TabBar
        items={salesOrderTabs.map((tab) => ({ key: tab, label: tab }))}
        activeKey={activeTab}
        onChange={(tab) =>
          startTransition(() => {
            setActiveTab(tab);
          })
        }
      />

      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        <FilterField label="业务日期">
          <DateRangeField value={dateRange} onChange={setDateRange} placeholder="请选择日期范围" className="w-[220px]" />
        </FilterField>

        <FilterField label="综合搜索">
          <SearchInput value={keyword} onChange={setKeyword} placeholder="单号 / 客户 / 仓库" className="w-[220px] bg-white" />
        </FilterField>

        <FilterActions
          onPrimaryClick={() => setCurrentPage(1)}
          onSecondaryClick={handleReset}
          extra={
            <Button onClick={() => setIsAdvancedOpen(true)}>
              高级搜索
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button tone="primary" onClick={() => navigate("/sales-orders/new")}>新增销售订单</Button>
          <Button>导出</Button>
          {["批量审核", "批量导出", "批量关闭", "查看库存占用"].map((action) => (
            <Button key={action}>{action}</Button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] border-collapse text-sm lg:min-w-full">
              <thead className="bg-fill-2 text-left text-text-2">
                <tr className="h-[44px]">
                  <th className="sticky left-0 z-10 w-10 border-b border-r border-line-1 bg-fill-2 px-3">
                    <Checkbox checked={isAllSelected} onChange={toggleAll} />
                  </th>
                  <th className="sticky left-10 z-10 min-w-[140px] border-b border-r border-line-1 bg-fill-2 px-4">
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
                  <th className="min-w-[140px] whitespace-nowrap border-b border-line-1 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="group h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                    <td className="sticky left-0 z-10 min-w-[40px] border-r border-line-1 bg-white px-3 group-hover:bg-hover">
                      <Checkbox checked={selectedIds.includes(order.id)} onChange={() => toggleSelection(order.id)} />
                    </td>
                    <td className="sticky left-10 z-10 min-w-[140px] border-r border-line-1 bg-white px-4 group-hover:bg-hover">
                      <button type="button" className="text-brand-6 hover:text-brand-7" onClick={() => navigate(`/sales-orders/${order.id}`)}>
                        {order.orderNo}
                      </button>
                    </td>
                    <td className="border-r border-line-1 px-4">{order.customer}</td>
                    <td className="border-r border-line-1 px-4">{order.customerLevel}</td>
                    <td className="border-r border-line-1 px-4">{order.warehouse}</td>
                    <td className="border-r border-line-1 px-4 text-right">{order.amount}</td>
                    <td className="min-w-[100px] whitespace-nowrap border-r border-line-1 px-4">
                      <StatusPill tone={order.statusTone}>{order.status}</StatusPill>
                    </td>
                    <td className="min-w-[100px] whitespace-nowrap border-r border-line-1 px-4">{order.paymentStatus}</td>
                    <td className="border-r border-line-1 px-4">{order.creator}</td>
                    <td className="px-4">{order.createdAt}</td>
                    <td className="min-w-[120px] whitespace-nowrap px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" onClick={() => navigate(`/sales-orders/${order.id}`)}>详情</Button>
                        <Button size="sm" onClick={() => navigate(`/sales-orders/${order.id}/edit`)}>编辑</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      </div>

      <Drawer
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        title="高级搜索"
        footer={
          <>
            <Button onClick={() => setAdvancedFilters({ orderNo: "", productName: "", customer: "", customerClass: "", handler: "", outboundStatus: "", startDate: "", endDate: "" })}>清空</Button>
            <Button tone="primary" onClick={handleAdvancedSearch}>
              搜索
            </Button>
          </>
        }
      >
        <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
          <DrawerField label="单据编号"><Input value={advancedFilters.orderNo} onChange={(v) => setAdvancedFilters((f) => ({ ...f, orderNo: v }))} placeholder="请输入" /></DrawerField>
          <DrawerField label="商品名称"><Input value={advancedFilters.productName} onChange={(v) => setAdvancedFilters((f) => ({ ...f, productName: v }))} placeholder="请输入" /></DrawerField>
          <DrawerField label="客户名称"><Input value={advancedFilters.customer} onChange={(v) => setAdvancedFilters((f) => ({ ...f, customer: v }))} placeholder="请输入" /></DrawerField>
          <DrawerField label="客户分类"><Select value={advancedFilters.customerClass} onChange={(v) => setAdvancedFilters((f) => ({ ...f, customerClass: v }))} options={["重点客户", "普通客户", "账期客户"]} placeholder="全部分类" /></DrawerField>
          <DrawerField label="经手人"><Select value={advancedFilters.handler} onChange={(v) => setAdvancedFilters((f) => ({ ...f, handler: v }))} options={["王晨", "李菲", "钱宇", "周曼"]} placeholder="全部" /></DrawerField>
          <DrawerField label="出库状态"><Select value={advancedFilters.outboundStatus} onChange={(v) => setAdvancedFilters((f) => ({ ...f, outboundStatus: v }))} options={["待出库", "已出库", "已签收"]} placeholder="全部" /></DrawerField>
          <DrawerField label="制单日期">
            <DateRangeField
              value={{ start: advancedFilters.startDate, end: advancedFilters.endDate }}
              onChange={(range) => setAdvancedFilters((f) => ({ ...f, startDate: range.start, endDate: range.end }))}
            />
          </DrawerField>
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
