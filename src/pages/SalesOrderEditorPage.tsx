import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, HintBox } from "../components/Ui";
import {
  SalesOrderBasicForm,
  SalesOrderItemsEditor,
  SalesOrderRemarkForm,
  SalesOrderSection,
  calculateSalesOrderTotals,
  formatCurrency,
} from "../components/SalesOrderWorkspace";
import {
  createLineItemFromProduct,
  findSalesOrderCustomer,
  findSalesOrderProduct,
  salesOrderCustomerProfiles,
  salesOrderDeliveryMethodOptions,
  salesOrderPaymentOptions,
  salesOrderPriorityOptions,
  salesOrderProductCatalog,
  salesOrderSalesChannelOptions,
  salesOrderSettlementOptions,
  salesOrderTagOptions,
  salesOrderWarehouseOptions,
  type SalesOrderLineItem,
  type SalesOrderWorkspaceRecord,
} from "../data/salesOrderWorkspace";

type SalesOrderEditorPageProps = {
  mode: "create" | "edit";
  initialRecord: SalesOrderWorkspaceRecord;
};

export function SalesOrderEditorPage({
  mode,
  initialRecord,
}: SalesOrderEditorPageProps) {
  const navigate = useNavigate();
  const [record, setRecord] = useState(initialRecord);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setRecord(initialRecord);
    setMessage(null);
  }, [initialRecord]);

  const totals = calculateSalesOrderTotals(record.lines);
  const isCreateMode = mode === "create";

  const updateField = <K extends keyof SalesOrderWorkspaceRecord>(field: K, value: SalesOrderWorkspaceRecord[K]) => {
    setRecord((current) => {
      const next = { ...current, [field]: value };

      if (field === "customer") {
        const customer = findSalesOrderCustomer(String(value));
        if (customer) {
          next.customerCode = customer.code;
          next.customerLevel = customer.level;
          next.contactName = customer.contactName;
          next.contactPhone = customer.contactPhone;
          next.address = customer.address;
          next.settlementMethod = customer.settlementMethod;
          next.paymentMethod = customer.paymentMethod;
          next.priceTier = customer.priceTier;
          next.creditLimit = customer.creditLimit;
          next.receivableBalance = customer.receivableBalance;
          next.availableCredit = customer.availableCredit;
          next.tags = customer.tags;
          next.riskNote = `客户切换为${customer.name}后，建议先核验${customer.settlementMethod}口径和信用占用。`;
        }
      }

      return next;
    });
  };

  const updateLine = <K extends keyof SalesOrderLineItem>(lineId: string, field: K, value: SalesOrderLineItem[K]) => {
    setRecord((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        if (field === "sku") {
          const product = findSalesOrderProduct(String(value));
          if (product) {
            return {
              ...line,
              sku: product.sku,
              productName: product.productName,
              spec: product.spec,
              unit: product.unit,
              availableStock: product.availableStock,
              price: product.referencePrice,
              taxRate: product.taxRate,
            };
          }
        }

        return { ...line, [field]: value };
      }),
    }));
  };

  const addEmptyLine = () => {
    setRecord((current) => ({
      ...current,
      lines: [...current.lines, createLineItemFromProduct("", current.warehouse)],
    }));
    setMessage("已新增空白商品行，可直接录入或替换SKU。");
  };

  const addRecommendedProduct = (sku: string) => {
    setRecord((current) => ({
      ...current,
      lines: [...current.lines, createLineItemFromProduct(sku, current.warehouse)],
    }));
    const product = findSalesOrderProduct(sku);
    setMessage(product ? `已加入推荐商品:${product.productName}` : "已加入推荐商品。");
  };

  const removeLine = (lineId: string) => {
    setRecord((current) => {
      if (current.lines.length <= 1) {
        setMessage("至少保留一行商品，避免订单主体为空。");
        return current;
      }

      return {
        ...current,
        lines: current.lines.filter((line) => line.id !== lineId),
      };
    });
  };

  const handleSubmit = () => {
    setRecord((current) => ({
      ...current,
      status: "待审核",
      statusTone: "orange",
      approvalStatus: mode === "create" ? "待销售主管审核" : "待重新审核",
      updatedAt: "2025/04/03 15:36",
    }));
    setMessage(mode === "create" ? "订单已提交。" : "修改已提交。");
  };

  const handleReset = () => {
    setRecord(initialRecord);
    setMessage("已恢复到当前页面载入时的Mock数据。");
  };

  return (
    <div className="space-y-4">
      {message ? <HintBox>{message}</HintBox> : null}

      <div className="space-y-4">
        <SalesOrderSection title="订单信息">
          <SalesOrderBasicForm
            record={record}
            customerOptions={salesOrderCustomerProfiles.map((item) => item.name)}
            warehouseOptions={salesOrderWarehouseOptions}
            channelOptions={salesOrderSalesChannelOptions}
            settlementOptions={salesOrderSettlementOptions}
            paymentOptions={salesOrderPaymentOptions}
            deliveryOptions={salesOrderDeliveryMethodOptions}
            priorityOptions={salesOrderPriorityOptions}
            columns={4}
            onFieldChange={updateField}
          />
        </SalesOrderSection>

        <SalesOrderSection title="商品明细">
          <div className="space-y-3">
            <SalesOrderItemsEditor
              lines={record.lines}
              recommendedSkus={salesOrderProductCatalog.slice(0, 4).map((item) => ({
                sku: item.sku,
                label: item.productName,
              }))}
              onAddEmptyLine={addEmptyLine}
              onAddProduct={addRecommendedProduct}
              onRemoveLine={removeLine}
              onLineChange={updateLine}
            />

            <div className="flex flex-col gap-2 rounded-lg border border-line-1 bg-fill-2 px-4 py-3 text-sm text-text-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <span>商品数量:{totals.totalQty}件</span>
                <span>优惠减免:{formatCurrency(totals.discountAmount)}</span>
                <span>税额:{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="text-[17px] font-semibold text-brand-7">订单总额:{formatCurrency(totals.grandTotal)}</div>
            </div>
          </div>
        </SalesOrderSection>

        <SalesOrderSection title="备注说明">
          <SalesOrderRemarkForm record={record} onFieldChange={updateField} tagOptions={salesOrderTagOptions} />
        </SalesOrderSection>
      </div>

      <div className="flex flex-col gap-3 border-t border-line-1 pt-4 sm:flex-row sm:justify-end">
        <Button tone="primary" onClick={handleSubmit}>保存</Button>
        <Button onClick={() => navigate("/sales-orders")}>返回列表</Button>
      </div>
    </div>
  );
}
