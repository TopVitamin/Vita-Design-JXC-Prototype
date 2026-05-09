import { Minus, Plus, Search, ShoppingCart } from "lucide-react";
import { Button, Input, PageTitle } from "../components/Ui";
import { cashierItems, cashierQuickGoods } from "../mocks/cashier";

export function RetailCashierPage() {
  const subtotal = cashierItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discount = 40;
  const payable = subtotal - discount;

  return (
    <div className="space-y-4">
      <PageTitle title="零售收银">承接门店现场成交，当前覆盖商品搜索、已选清单、折让与结算区。</PageTitle>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-line-1 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input value="" onChange={() => {}} placeholder="扫描商品条码 / 搜索商品名称" />
              </div>
              <Button icon={<Search size={14} />}>搜索商品</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {cashierQuickGoods.map((item) => (
                <button key={item} type="button" className="rounded-md bg-fill-1 px-3 py-2 text-[13px] text-text-2 hover:bg-fill-2">
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line-1 bg-white">
            <div className="flex items-center justify-between border-b border-line-1 px-4 py-3">
              <div className="text-sm font-semibold text-text-1">已选商品</div>
              <div className="text-[13px] text-text-3">共 {cashierItems.length} 种商品</div>
            </div>
            <div className="divide-y divide-line-1">
              {cashierItems.map((item) => (
                <div key={item.sku} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-text-1">{item.name}</div>
                    <div className="mt-1 text-[12px] text-text-3">
                      {item.sku} / {item.spec}
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 rounded-md border border-line-2 px-2 py-1">
                      <Button size="icon" icon={<Minus size={14} />} className="text-text-3 hover:text-text-1" />
                      <span className="min-w-8 text-center text-sm text-text-1">{item.qty}</span>
                      <Button size="icon" icon={<Plus size={14} />} className="text-text-3 hover:text-text-1" />
                    </div>
                    <div className="w-20 text-right text-sm font-medium text-text-1">¥{item.price * item.qty}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-line-1 bg-fill-1 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-1 text-brand-6">
                <ShoppingCart size={18} />
              </span>
              <div>
                <div className="text-sm font-semibold text-text-1">结算区</div>
                <div className="text-[12px] text-text-3">用于承接抹零、支付方式与最终成交。</div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-[13px] text-text-2">
              <div className="flex items-center justify-between">
                <span>商品小计</span>
                <span className="font-medium text-text-1">¥{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>优惠金额</span>
                <span className="font-medium text-warning">-¥{discount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line-1 pt-3">
                <span className="text-sm font-semibold text-text-1">应收金额</span>
                <span className="text-2xl font-semibold text-brand-6">¥{payable.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              <Button tone="primary">现金收款</Button>
              <Button>扫码支付</Button>
              <Button>挂账</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
