import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Checkbox, FilterActions, FilterField, FormField, HintBox, Input, Message, PageTitle, Pagination, ResizableHeaderCell, SearchInput, Select, StatusPill, TextArea, useResizableColumns } from "../components/Ui";
import {
  confirmReceiptRecord,
  createReceiptDraft,
  deleteReceiptRecord,
  previewReceiptLinkStats,
  getReceiptCustomerOptions,
  getReceiptRecord,
  getReceiptRecords,
  saveReceiptDraft,
  voidReceiptRecord,
} from "../data/arWorkspace";

function parseCustomerOption(option: string) {
  const [code, ...nameParts] = option.split(" ");
  return { customerCode: code ?? "", customerName: nameParts.join(" ") };
}

function parseAmount(value: string) {
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

function moneyText(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusTone(status: "草稿" | "已确认" | "已作废") {
  if (status === "已确认") return "green";
  if (status === "已作废") return "red";
  return "gray";
}

export function ReceiptManagementListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部单据");
  const [methodFilter, setMethodFilter] = useState("全部");
  const [heldFilter, setHeldFilter] = useState("全部");
  const [customerFilter, setCustomerFilter] = useState("全部客户");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const records = getReceiptRecords();

  const columns = [
    { key: "receiptNo", width: 210, minWidth: 180 },
    { key: "status", width: 90, minWidth: 80 },
    { key: "isHeld", width: 90, minWidth: 80 },
    { key: "customer", width: 180, minWidth: 150 },
    { key: "receiptDate", width: 110, minWidth: 100 },
    { key: "receiptMethod", width: 100, minWidth: 90 },
    { key: "receiptAmount", width: 130, minWidth: 110 },
    { key: "updatedAt", width: 170, minWidth: 150 },
    { key: "__actions__", width: 180, minWidth: 160, resizable: false },
  ];
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("receipt-management:list", columns);

  const filteredRows = useMemo(() => {
    return records.filter((r) => {
      if (keyword && !r.receiptNo.toLowerCase().includes(keyword.toLowerCase()) && !r.customerName.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (customerFilter !== "全部客户" && `${r.customerCode} ${r.customerName}` !== customerFilter) return false;
      if (statusFilter !== "全部单据" && r.status !== statusFilter) return false;
      if (methodFilter !== "全部" && r.receiptMethod !== methodFilter) return false;
      if (heldFilter === "暂挂款" && !r.isHeld) return false;
      if (heldFilter === "已认款" && r.isHeld) return false;
      return true;
    });
  }, [records, keyword, customerFilter, statusFilter, methodFilter, heldFilter]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="收款单">管理客户收款记录，支持登记、确认和核销。</PageTitle>

      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        <FilterField label="收款单号">
          <div className="w-[220px]">
            <SearchInput value={keyword} onChange={setKeyword} placeholder="输入单号搜索" className="bg-white" />
          </div>
        </FilterField>
        <FilterField label="客户">
          <div className="w-[240px]">
            <Select value={customerFilter} onChange={setCustomerFilter} options={["全部客户", ...getReceiptCustomerOptions()]} allowSearch />
          </div>
        </FilterField>
        <FilterField label="收款方式">
          <div className="w-[140px]">
            <Select value={methodFilter} onChange={(v) => setMethodFilter(v)} options={["全部", "银行转账", "支付宝", "微信支付", "现金"]} />
          </div>
        </FilterField>
        <FilterField label="单据状态">
          <div className="w-[120px]">
            <Select value={statusFilter} onChange={(v) => setStatusFilter(v)} options={["全部单据", "草稿", "已确认", "已作废"]} />
          </div>
        </FilterField>
        <FilterField label="是否暂挂">
          <div className="w-[120px]">
            <Select value={heldFilter} onChange={(v) => setHeldFilter(v)} options={["全部", "暂挂款", "已认款"]} />
          </div>
        </FilterField>
        <FilterActions onSecondaryClick={() => { setKeyword(""); setCustomerFilter("全部客户"); setStatusFilter("全部单据"); setMethodFilter("全部"); setHeldFilter("全部"); setCurrentPage(1); }} />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button tone="primary" onClick={() => navigate("/receipt-management/new")}>新增</Button>
        <Button>导出</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, 1100) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                {["receiptNo", "status", "isHeld", "customer", "receiptDate", "receiptMethod", "receiptAmount", "updatedAt"].map((key) => (
                  <ResizableHeaderCell key={key} width={getColumnStyle(key).width} minWidth={getColumnStyle(key).minWidth} className={key === "receiptAmount" ? "text-right" : ""} onResizeStart={(clientX) => startResize(key, clientX)}>
                    <span className="font-medium">{{
                      receiptNo: "收款单号",
                      status: "单据状态",
                      isHeld: "是否暂挂",
                      customer: "客户",
                      receiptDate: "收款日期",
                      receiptMethod: "收款方式",
                      receiptAmount: "收款金额",
                      updatedAt: "最后修改时间",
                    }[key]}</span>
                  </ResizableHeaderCell>
                ))}
                <ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">
                  <span className="font-medium">操作</span>
                </ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r) => (
                <tr key={r.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  <td className="border-r border-line-1 px-4 whitespace-nowrap text-link" style={getColumnStyle("receiptNo")}><div className="overflow-hidden text-ellipsis cursor-pointer" onClick={() => navigate(`/receipt-management/${r.id}`)}>{r.receiptNo}</div></td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("status")}><StatusPill tone={r.statusTone}>{r.status}</StatusPill></td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("isHeld")}>{r.isHeld ? <StatusPill tone={r.heldTone || "gray"}>{r.heldTone === "orange" ? "暂挂款" : "已认款"}</StatusPill> : "-"}</td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("customer")} title={r.customerName}><div className="overflow-hidden text-ellipsis">{r.customerName}</div></td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("receiptDate")}>{r.receiptDate}</td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("receiptMethod")}>{r.receiptMethod}</td>
                  <td className="border-r border-line-1 px-4 text-right whitespace-nowrap font-medium text-text-1" style={getColumnStyle("receiptAmount")}>{moneyText(parseAmount(r.receiptAmount))}</td>
                  <td className="border-r border-line-1 px-4 whitespace-nowrap" style={getColumnStyle("updatedAt")}>{r.updatedAt}</td>
                  <td className="px-4 whitespace-nowrap text-center" style={getColumnStyle("__actions__")}>
                    <div className="flex items-center justify-center gap-2">
                      <button className="text-link hover:text-link-hover" onClick={() => navigate(`/receipt-management/${r.id}`)}>查看</button>
                      {r.status === "草稿" ? (
                        <>
                          <button className="text-link hover:text-link-hover" onClick={() => navigate(`/receipt-management/${r.id}/edit`)}>编辑</button>
                          <button className="text-link hover:text-link-hover text-blue-600" onClick={() => { confirmReceiptRecord(r.id); Message.success("收款已确认"); setCurrentPage(1); }}>确认收款</button>
                          <button className="text-link hover:text-link-hover text-red-500" onClick={() => { deleteReceiptRecord(r.id); Message.success("收款单已删除"); setCurrentPage(1); }}>删除</button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination total={filteredRows.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }} />
    </div>
  );
}

export function ReceiptManagementFormPage({ mode }: { mode: "create" | "edit" }) {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const record = mode === "edit" && recordId ? getReceiptRecord(recordId) : null;
  const draft = mode === "create" ? createReceiptDraft({ customerCode: searchParams.get("customerCode") ?? "", customerName: searchParams.get("customerName") ?? "" }) : record;

  const [form, setForm] = useState({
    customer: draft ? `${draft.customerCode} ${draft.customerName}`.trim() : "",
    receiptDate: draft?.receiptDate || new Date().toISOString().split("T")[0],
    receiptMethod: draft?.receiptMethod || "",
    receiptAmount: draft ? String(parseAmount(draft.receiptAmount)) : "",
    accountInfo: draft?.accountInfo || "",
    customerPaymentAccount: draft?.customerPaymentAccount || "",
    note: draft?.note || "",
    isHeld: draft?.isHeld ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linkedDeliveryNos, setLinkedDeliveryNos] = useState<string[]>(draft?.linkedDeliveryNos ?? []);

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (typeof value === "string" && errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const selectedCustomer = form.customer ? parseCustomerOption(form.customer) : { customerCode: "", customerName: "" };
  const amount = parseFloat(form.receiptAmount || "0") || 0;
  const receiptPreview = selectedCustomer.customerCode ? previewReceiptLinkStats(selectedCustomer.customerCode, amount, draft?.id, linkedDeliveryNos) : { linkedDeliveryNos: [], linkedDeliveryAmounts: [], candidateDeliveryDocs: [], stats: { linkedCount: 0, linkedAmount: "¥0.00", receiptAmount: moneyText(amount), difference: "-", differenceTone: "orange" as const } };

  const handlePersist = (intent: "draft" | "confirm") => {
    const nextErrors: Record<string, string> = {};
    if (!form.customer) nextErrors.customer = "请选择客户";
    if (!form.receiptDate) nextErrors.receiptDate = "请选择收款日期";
    if (!form.receiptMethod) nextErrors.receiptMethod = "请选择收款方式";
    if (!form.receiptAmount || parseFloat(form.receiptAmount) <= 0) nextErrors.receiptAmount = "请输入大于0的收款金额";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const saved = saveReceiptDraft({
      id: draft?.id,
      customerCode: selectedCustomer.customerCode,
      customerName: selectedCustomer.customerName,
      receiptDate: form.receiptDate,
      receiptMethod: form.receiptMethod,
      receiptAmount: form.receiptAmount,
      accountInfo: form.accountInfo,
      customerPaymentAccount: form.customerPaymentAccount,
      note: form.note,
      isHeld: form.isHeld,
      linkedDeliveryNos,
    });

    if (intent === "confirm") {
      confirmReceiptRecord(saved.id);
      Message.success("收款已确认");
      navigate(`/receipt-management/${saved.id}`);
      return;
    }

    Message.success(mode === "create" ? "收款单已保存" : "收款单已更新");
    navigate(`/receipt-management/${saved.id}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={mode === "create" ? "新增收款单" : `编辑收款单 ${draft?.receiptNo || ""}`} />
      <HintBox>不关联出库单时，系统自动将本单标记为「暂挂款」</HintBox>

      <div className="rounded-xl border border-line-1 bg-white">
        <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">基本信息</div>
        <div className="grid gap-5 p-6 lg:grid-cols-2">
          <FormField label="收款单号">
            <Input value={mode === "create" ? "保存后自动生成" : draft?.receiptNo || ""} readOnly className="bg-fill-2" />
          </FormField>
          <FormField label="客户" required>
            <Select value={form.customer} onChange={(v) => updateField("customer", v)} options={getReceiptCustomerOptions()} allowSearch placeholder="请选择客户" />
            {errors.customer ? <div className="mt-1 text-xs text-danger">{errors.customer}</div> : null}
          </FormField>
          <FormField label="收款日期" required>
            <Input value={form.receiptDate} onChange={(v) => updateField("receiptDate", v)} placeholder="YYYY-MM-DD" />
            {errors.receiptDate ? <div className="mt-1 text-xs text-danger">{errors.receiptDate}</div> : null}
          </FormField>
          <FormField label="收款方式" required>
            <Select value={form.receiptMethod} onChange={(v) => updateField("receiptMethod", v)} options={["银行转账", "支付宝", "微信支付", "现金"]} placeholder="请选择收款方式" />
            {errors.receiptMethod ? <div className="mt-1 text-xs text-danger">{errors.receiptMethod}</div> : null}
          </FormField>
          <FormField label="收款金额" required>
            <Input value={form.receiptAmount} onChange={(v) => updateField("receiptAmount", v)} placeholder="0.00" />
            {errors.receiptAmount ? <div className="mt-1 text-xs text-danger">{errors.receiptAmount}</div> : null}
          </FormField>
          <FormField label="到账账户">
            <Input value={form.accountInfo} onChange={(v) => updateField("accountInfo", v)} placeholder="如：工商银行 6222xxxx·深圳分行（选填）" />
          </FormField>
          <FormField label="客户方付款账户">
            <Input value={form.customerPaymentAccount} onChange={(v) => updateField("customerPaymentAccount", v)} placeholder="如：招商银行 6225xxxx（选填）" />
          </FormField>
          <FormField label="是否暂挂">
            <Select value={form.isHeld ? "暂挂款" : "已认款"} onChange={(v) => updateField("isHeld", v === "暂挂款")} options={["已认款", "暂挂款"]} />
          </FormField>
        </div>
        <div className="px-6 pb-6">
          <FormField label="摘要/备注">
            <TextArea value={form.note} onChange={(v) => updateField("note", v)} placeholder="如：11月货款、预付定金（选填）" />
          </FormField>
        </div>
      </div>

      <div className="rounded-xl border border-line-1 bg-white">
        <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">关联出库单</div>
        <div className="space-y-3 p-6">
          {receiptPreview.candidateDeliveryDocs.length === 0 ? (
            <div className="text-sm text-text-3">当前客户暂无可关联的销售出库单</div>
          ) : (
            receiptPreview.candidateDeliveryDocs.map((doc) => (
              <label key={doc.no} className="flex items-center justify-between rounded-lg border border-line-1 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={linkedDeliveryNos.includes(doc.no)}
                    onChange={(checked) =>
                      setLinkedDeliveryNos((current) =>
                        checked ? [...current, doc.no] : current.filter((item) => item !== doc.no),
                      )
                    }
                  />
                  <span className="font-medium text-text-1">{doc.no}</span>
                </div>
                <span className="text-text-2">{moneyText(doc.amount)}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-line-1 bg-white">
        <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">统计信息</div>
        <div className="flex gap-8 p-6">
          <div className="text-sm text-text-2">关联出库单数量<span className="ml-2 text-text-1 font-medium">{receiptPreview.stats.linkedCount} 张</span></div>
          <div className="text-sm text-text-2">关联出库单金额合计<span className="ml-2 text-text-1 font-medium">{receiptPreview.stats.linkedAmount}</span></div>
          <div className="text-sm text-text-2">本次收款金额<span className="ml-2 text-text-1 font-medium">{moneyText(amount)}</span></div>
          <div className="text-sm text-text-2">收款差额<span className={`ml-2 font-medium ${receiptPreview.stats.differenceTone === "blue" ? "text-blue-600" : receiptPreview.stats.differenceTone === "orange" ? "text-orange-500" : "text-green-600"}`}>{receiptPreview.stats.difference}</span></div>
        </div>
      </div>

      <div className="flex gap-3 border-t border-line-1 pt-4">
        <Button tone="primary" onClick={() => handlePersist("draft")}>保存草稿</Button>
        <Button tone="primary" onClick={() => handlePersist("confirm")}>确认收款</Button>
        <Button onClick={() => navigate("/receipt-management")}>返回列表</Button>
      </div>
    </div>
  );
}

export function ReceiptManagementDetailPage() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const record = recordId ? getReceiptRecord(recordId) : null;

  if (!record) return <div className="p-8 text-center text-text-2">收款单不存在</div>;

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="收款单详情">{record.receiptNo} 的详细信息</PageTitle>

      <div className="rounded-xl border border-line-1 bg-white">
        <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">基本信息</div>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3 p-6 text-sm">
          <div><span className="text-text-2">收款单号</span><div className="mt-1 font-medium">{record.receiptNo}</div></div>
          <div><span className="text-text-2">单据状态</span><div className="mt-1"><StatusPill tone={record.statusTone}>{record.status}</StatusPill></div></div>
          <div><span className="text-text-2">是否暂挂</span><div className="mt-1">{record.isHeld ? <StatusPill tone={record.heldTone || "gray"}>{record.heldTone === "orange" ? "暂挂款" : "已认款"}</StatusPill> : "-"}</div></div>
          <div><span className="text-text-2">核销状态</span><div className="mt-1">{record.verificationStatus ? <StatusPill tone={record.verificationTone || "gray"}>{record.verificationStatus}</StatusPill> : "-"}</div></div>
          <div><span className="text-text-2">客户</span><div className="mt-1">{`${record.customerCode} ${record.customerName}`}</div></div>
          <div><span className="text-text-2">收款日期</span><div className="mt-1">{record.receiptDate}</div></div>
          <div><span className="text-text-2">收款方式</span><div className="mt-1">{record.receiptMethod}</div></div>
          <div><span className="text-text-2">收款金额</span><div className="mt-1 font-medium text-text-1">{moneyText(parseAmount(record.receiptAmount))}</div></div>
          <div><span className="text-text-2">到账账户</span><div className="mt-1">{record.accountInfo || "-"}</div></div>
          <div><span className="text-text-2">客户方付款账户</span><div className="mt-1">{record.customerPaymentAccount || "-"}</div></div>
          <div><span className="text-text-2">摘要/备注</span><div className="mt-1">{record.note || "-"}</div></div>
          <div><span className="text-text-2">确认人</span><div className="mt-1">{record.confirmedBy || "-"}</div></div>
          <div><span className="text-text-2">确认时间</span><div className="mt-1">{record.confirmedAt || "-"}</div></div>
        </div>
      </div>

      {record.stats ? (
        <div className="rounded-xl border border-line-1 bg-white">
          <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">统计信息</div>
          <div className="flex gap-8 p-6">
            <div className="text-sm text-text-2">关联出库单数量<span className="ml-2 text-text-1 font-medium">{record.stats.linkedCount} 张</span></div>
            <div className="text-sm text-text-2">关联出库单金额合计<span className="ml-2 text-text-1 font-medium">{record.stats.linkedAmount}</span></div>
            <div className="text-sm text-text-2">本次收款金额<span className="ml-2 text-text-1 font-medium">{record.stats.receiptAmount}</span></div>
            <div className="text-sm text-text-2">收款差额<span className={`ml-2 font-medium ${record.stats.differenceTone === "blue" ? "text-blue-600" : record.stats.differenceTone === "orange" ? "text-orange-500" : "text-green-600"}`}>{record.stats.difference}</span></div>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-line-1 bg-white">
        <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">制单信息</div>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3 p-6 text-sm">
          <div><span className="text-text-2">创建人</span><div className="mt-1">{record.creator || "-"}</div></div>
          <div><span className="text-text-2">创建时间</span><div className="mt-1">{record.createdAt || "-"}</div></div>
          <div><span className="text-text-2">最后修改人</span><div className="mt-1">{record.lastModifier || "-"}</div></div>
          <div><span className="text-text-2">最后修改时间</span><div className="mt-1">{record.updatedAt}</div></div>
        </div>
      </div>

      <div className="flex gap-3 border-t border-line-1 pt-4">
        <Button onClick={() => navigate("/receipt-management")}>返回列表</Button>
        {record.status === "草稿" ? (
          <>
            <Button onClick={() => navigate(`/receipt-management/${record.id}/edit`)}>编辑</Button>
            <Button tone="primary" onClick={() => { confirmReceiptRecord(record.id); Message.success("收款已确认，客户应收余额已更新"); navigate(`/receipt-management/${record.id}`); }}>确认收款</Button>
            <Button onClick={() => { voidReceiptRecord(record.id); Message.success("收款单已作废"); navigate(`/receipt-management/${record.id}`); }}>作废</Button>
            <Button onClick={() => { deleteReceiptRecord(record.id); Message.success("收款单已删除"); navigate("/receipt-management"); }}>删除</Button>
          </>
        ) : null}
        <Button onClick={() => Message.success("导出成功")}>导出</Button>
      </div>
    </div>
  );
}
