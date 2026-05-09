import { useState } from "react";
import { Button, DateField, FormField, HintBox, Input, PageTitle, Select, TextArea } from "../components/Ui";
import { receiptFormDefault } from "../mocks/receipt";

export function ReceiptEntryPage() {
  const [form, setForm] = useState(receiptFormDefault);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <PageTitle title="收款登记" />

      <HintBox>建议优先从销售订单或客户往来进入收款登记，保持业务链路闭环。</HintBox>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField label="客户名称" required>
          <Select
            value={form.customer}
            onChange={(value) => updateField("customer", value)}
            options={["北京吉浓文化传媒有限公司", "杭州智帆商贸有限公司", "苏州元禾供应链有限公司"]}
          />
        </FormField>
        <FormField label="单据类型" required>
          <Select value={form.documentType} onChange={(value) => updateField("documentType", value)} options={["销售订单", "零售收银", "历史往来"]} />
        </FormField>
        <FormField label="收款金额" required>
          <Input value={form.amount} onChange={(value) => updateField("amount", value)} placeholder="请输入金额" />
        </FormField>
        <FormField label="付款方式" required>
          <Select value={form.paymentMethod} onChange={(value) => updateField("paymentMethod", value)} options={["现金", "银行转账", "支付宝", "微信支付"]} />
        </FormField>
        <FormField label="收款人" required>
          <Select value={form.handler} onChange={(value) => updateField("handler", value)} options={["王晨", "李菲", "钱宇", "周曼"]} placeholder="请选择经办人" />
        </FormField>
        <FormField label="收款时间" required>
          <DateField value={form.receivedAt} onChange={(value) => updateField("receivedAt", value)} />
        </FormField>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <FormField label="备注">
          <TextArea value={form.note} onChange={(value) => updateField("note", value)} placeholder="补充说明本次回款来源、对应订单或冲抵口径" />
        </FormField>
        <div className="rounded-lg border border-line-1 bg-fill-1 p-4">
          <div className="text-sm font-semibold text-text-1">历史应收摘要</div>
          <div className="mt-4 space-y-3 text-[13px] text-text-2">
            <div className="flex items-center justify-between">
              <span>客户应收余额</span>
              <span className="font-medium text-danger">¥26,420.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span>本月已回款</span>
              <span className="font-medium text-text-1">¥18,600.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span>待跟进订单</span>
              <span className="font-medium text-text-1">4笔</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-line-1 pt-4 sm:flex-row sm:justify-end">
        <Button tone="primary">提交登记</Button>
        <Button>取消</Button>
      </div>
    </div>
  );
}
