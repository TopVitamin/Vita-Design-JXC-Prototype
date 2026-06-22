import { useMemo, useState } from "react";
import { TABLE_MIN_WIDTH } from "../utils/tableConstants";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Checkbox, DateField, FilterActions, FilterField, FormField, HintBox, Input, Message, PageTitle, Pagination, ResizableHeaderCell, SearchInput, Select, StatusPill, TextArea, useResizableColumns } from "../components/Ui";
import { ActionsCell, DataCell, StatusCell } from "../components/TableCells";
import {
  confirmPaymentRecord,
  createPaymentDraft,
  deletePaymentRecord,
  getPaymentRecord,
  getPaymentRecords,
  getPaymentSupplierOptions,
  previewPaymentLinkStats,
  savePaymentDraft,
  voidPaymentRecord,
} from "../data/arWorkspace";

const periodStatusMap: Record<string, string> = {
  within: "账期内",
  approaching: "临近到期",
  overdue: "已逾期",
  settled: "已结清",
};
const periodToneMap: Record<string, "green" | "orange" | "red" | "gray"> = {
  within: "green",
  approaching: "orange",
  overdue: "red",
  settled: "gray",
};

function parseSupplierOption(option: string) {
  const [code, ...nameParts] = option.split(" ");
  return { supplierCode: code ?? "", supplierName: nameParts.join(" ") };
}

function parseAmount(value: string) {
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

function moneyText(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentManagementListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部单据");
  const [methodFilter, setMethodFilter] = useState("全部");
  const [supplierFilter, setSupplierFilter] = useState("全部供应商");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const records = getPaymentRecords();

  const columns = [
    { key: "paymentNo", width: 210, minWidth: 180 },
    { key: "status", width: 90, minWidth: 80 },
    { key: "periodStatus", width: 100, minWidth: 90 },
    { key: "supplier", width: 180, minWidth: 150 },
    { key: "paymentDate", width: 110, minWidth: 100 },
    { key: "paymentMethod", width: 100, minWidth: 90 },
    { key: "paymentAmount", width: 130, minWidth: 110 },
    { key: "updatedAt", width: 170, minWidth: 150 },
    { key: "__actions__", width: 180, minWidth: 160, resizable: false },
  ];
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns("payment-management:list", columns);

  const filteredRows = useMemo(() => {
    return records.filter((r) => {
      if (keyword && !r.paymentNo.toLowerCase().includes(keyword.toLowerCase()) && !r.supplierName.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (supplierFilter !== "全部供应商" && `${r.supplierCode} ${r.supplierName}` !== supplierFilter) return false;
      if (statusFilter !== "全部单据" && r.status !== statusFilter) return false;
      if (methodFilter !== "全部" && r.paymentMethod !== methodFilter) return false;
      return true;
    });
  }, [records, keyword, supplierFilter, statusFilter, methodFilter]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="付款单">管理供应商付款记录，支持登记、确认和核销。</PageTitle>

      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        <FilterField label="付款单号">
          <div className="w-[220px]">
            <SearchInput value={keyword} onChange={setKeyword} placeholder="输入单号搜索" className="bg-white" />
          </div>
        </FilterField>
        <FilterField label="供应商">
          <div className="w-[240px]">
            <Select value={supplierFilter} onChange={(v) => setSupplierFilter(v)} options={["全部供应商", ...getPaymentSupplierOptions()]} allowSearch />
          </div>
        </FilterField>
        <FilterField label="付款方式">
          <div className="w-[140px]">
            <Select value={methodFilter} onChange={(v) => setMethodFilter(v)} options={["全部", "银行转账", "支付宝", "微信支付", "现金"]} />
          </div>
        </FilterField>
        <FilterField label="单据状态">
          <div className="w-[120px]">
            <Select value={statusFilter} onChange={(v) => setStatusFilter(v)} options={["全部单据", "草稿", "已确认", "已作废"]} />
          </div>
        </FilterField>
        <FilterActions onSecondaryClick={() => { setKeyword(""); setSupplierFilter("全部供应商"); setStatusFilter("全部单据"); setMethodFilter("全部"); setCurrentPage(1); }} />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button tone="primary" onClick={() => navigate("/payment-management/new")}>新增</Button>
        <Button>导出</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
        <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.standard) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                {["paymentNo", "status", "periodStatus", "supplier", "paymentDate", "paymentMethod", "paymentAmount", "updatedAt"].map((key) => (
                  <ResizableHeaderCell key={key} width={getColumnStyle(key).width} minWidth={getColumnStyle(key).minWidth} className={key === "paymentAmount" ? "text-right" : ""} onResizeStart={(clientX) => startResize(key, clientX)}>
                    <span className="font-medium">{{
                      paymentNo: "付款单号",
                      status: "单据状态",
                      periodStatus: "账期状态",
                      supplier: "供应商",
                      paymentDate: "付款日期",
                      paymentMethod: "付款方式",
                      paymentAmount: "付款金额",
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
                  <DataCell style={getColumnStyle("paymentNo")} nowrap className="text-link"><div className="overflow-hidden text-ellipsis cursor-pointer" onClick={() => navigate(`/payment-management/${r.id}`)}>{r.paymentNo}</div></DataCell>
                  <StatusCell style={getColumnStyle("status")} nowrap tone={r.statusTone} label={r.status} />
                  <StatusCell style={getColumnStyle("periodStatus")} nowrap tone={periodToneMap[r.periodStatus]} label={periodStatusMap[r.periodStatus]} />
                  <DataCell style={getColumnStyle("supplier")} nowrap truncate title={r.supplierName}>{r.supplierName}</DataCell>
                  <DataCell style={getColumnStyle("paymentDate")} nowrap>{r.paymentDate}</DataCell>
                  <DataCell style={getColumnStyle("paymentMethod")} nowrap>{r.paymentMethod}</DataCell>
                  <DataCell style={getColumnStyle("paymentAmount")} align="right" nowrap emphasis>{moneyText(parseAmount(r.paymentAmount))}</DataCell>
                  <DataCell style={getColumnStyle("updatedAt")} nowrap>{r.updatedAt}</DataCell>
                  <ActionsCell style={getColumnStyle("__actions__")} nowrap>
                    <button className="text-link hover:text-link-hover" onClick={() => navigate(`/payment-management/${r.id}`)}>查看</button>
                    {r.status === "草稿" ? (
                      <>
                        <button className="text-link hover:text-link-hover" onClick={() => navigate(`/payment-management/${r.id}/edit`)}>编辑</button>
                        <button className="text-link hover:text-link-hover" onClick={() => { confirmPaymentRecord(r.id); Message.success("付款已确认"); setCurrentPage(1); }}>确认付款</button>
                        <button className="text-danger hover:text-danger/80" onClick={() => { deletePaymentRecord(r.id); Message.success("付款单已删除"); setCurrentPage(1); }}>删除</button>
                      </>
                    ) : null}
                  </ActionsCell>
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

export function PaymentManagementFormPage({ mode }: { mode: "create" | "edit" }) {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const record = mode === "edit" && recordId ? getPaymentRecord(recordId) : null;
  const draft = mode === "create" ? createPaymentDraft({ supplierCode: searchParams.get("supplierCode") ?? "", supplierName: searchParams.get("supplierName") ?? "" }) : record;

  const [form, setForm] = useState({
    supplier: draft ? `${draft.supplierCode} ${draft.supplierName}`.trim() : "",
    paymentDate: draft?.paymentDate || new Date().toISOString().split("T")[0],
    paymentMethod: draft?.paymentMethod || "",
    paymentAmount: draft ? String(parseAmount(draft.paymentAmount)) : "",
    paymentAccount: draft?.paymentAccount || "",
    supplierReceiveAccount: draft?.supplierReceiveAccount || "",
    note: draft?.note || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linkedInboundNos, setLinkedInboundNos] = useState<string[]>(draft?.linkedInboundNos ?? []);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const selectedSupplier = form.supplier ? parseSupplierOption(form.supplier) : { supplierCode: "", supplierName: "" };
  const amount = parseFloat(form.paymentAmount || "0") || 0;
  const paymentPreview = selectedSupplier.supplierCode ? previewPaymentLinkStats(selectedSupplier.supplierCode, amount, draft?.id, linkedInboundNos) : { linkedInboundNos: [], linkedInboundAmounts: [], candidateInboundDocs: [], stats: { linkedCount: 0, linkedAmount: "¥0.00", paymentAmount: moneyText(amount), difference: "-", differenceTone: "orange" as const } };

  const handlePersist = (intent: "draft" | "confirm") => {
    const nextErrors: Record<string, string> = {};
    if (!form.supplier) nextErrors.supplier = "请选择供应商";
    if (!form.paymentDate) nextErrors.paymentDate = "请选择付款日期";
    if (!form.paymentMethod) nextErrors.paymentMethod = "请选择付款方式";
    if (!form.paymentAmount || parseFloat(form.paymentAmount) <= 0) nextErrors.paymentAmount = "请输入大于0的付款金额";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const saved = savePaymentDraft({
      id: draft?.id,
      supplierCode: selectedSupplier.supplierCode,
      supplierName: selectedSupplier.supplierName,
      paymentDate: form.paymentDate,
      paymentMethod: form.paymentMethod,
      paymentAmount: form.paymentAmount,
      paymentAccount: form.paymentAccount,
      supplierReceiveAccount: form.supplierReceiveAccount,
      note: form.note,
      linkedInboundNos,
    });

    if (intent === "confirm") {
      confirmPaymentRecord(saved.id);
      Message.success("付款已确认");
      navigate(`/payment-management/${saved.id}`);
      return;
    }

    Message.success(mode === "create" ? "付款单已保存" : "付款单已更新");
    navigate(`/payment-management/${saved.id}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title={mode === "create" ? "新增付款单" : `编辑付款单 ${draft?.paymentNo || ""}`}
        actions={
          <>
            <Button onClick={() => navigate("/payment-management")}>返回列表</Button>
            <Button tone="primary" onClick={() => handlePersist("draft")}>保存草稿</Button>
            <Button tone="primary" onClick={() => handlePersist("confirm")}>确认付款</Button>
          </>
        }
      />

      <HintBox>不关联入库单时，系统自动将本单标记为「暂挂款」</HintBox>

      <div className="rounded-xl border border-line-1 bg-white">
        <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">基本信息</div>
        <div className="grid gap-5 p-6 lg:grid-cols-2">
          <FormField label="付款单号">
            <Input value={mode === "create" ? "保存后自动生成" : draft?.paymentNo || ""} readOnly className="bg-fill-2" />
          </FormField>
          <FormField label="供应商" required>
            <Select value={form.supplier} onChange={(v) => updateField("supplier", v)} options={getPaymentSupplierOptions()} allowSearch placeholder="请选择供应商" />
            {errors.supplier ? <div className="mt-1 text-xs text-danger">{errors.supplier}</div> : null}
          </FormField>
          <FormField label="付款日期" required>
            <DateField value={form.paymentDate} onChange={(v) => updateField("paymentDate", v)} />
            {errors.paymentDate ? <div className="mt-1 text-xs text-danger">{errors.paymentDate}</div> : null}
          </FormField>
          <FormField label="付款方式" required>
            <Select value={form.paymentMethod} onChange={(v) => updateField("paymentMethod", v)} options={["银行转账", "支付宝", "微信支付", "现金"]} placeholder="请选择付款方式" />
            {errors.paymentMethod ? <div className="mt-1 text-xs text-danger">{errors.paymentMethod}</div> : null}
          </FormField>
          <FormField label="付款金额" required>
            <Input value={form.paymentAmount} onChange={(v) => updateField("paymentAmount", v.replace(/[^\d.]/g, "").replace(/^(\d*\.\d{0,2}).*$/, "$1"))} placeholder="0.00" maxLength={15} />
            {errors.paymentAmount ? <div className="mt-1 text-xs text-danger">{errors.paymentAmount}</div> : null}
          </FormField>
          <FormField label="付款账户">
            <Input value={form.paymentAccount} onChange={(v) => updateField("paymentAccount", v)} placeholder="如：工商银行 6222xxxx·深圳分行（选填）" maxLength={100} />
          </FormField>
          <FormField label="供应商收款账户">
            <Input value={form.supplierReceiveAccount} onChange={(v) => updateField("supplierReceiveAccount", v)} placeholder="如：建设银行 6217xxxx（选填）" maxLength={100} />
          </FormField>
        </div>
        <div className="px-6 pb-6">
          <FormField label="摘要/备注">
            <TextArea value={form.note} onChange={(v) => updateField("note", v)} placeholder="如：11月货款、预付定金（选填）" maxLength={200} />
          </FormField>
        </div>
      </div>

      <div className="rounded-xl border border-line-1 bg-white">
        <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">关联入库单</div>
        <div className="space-y-3 p-6">
          {paymentPreview.candidateInboundDocs.length === 0 ? (
            <div className="text-sm text-text-3">当前供应商暂无可关联的采购入库单</div>
          ) : (
            paymentPreview.candidateInboundDocs.map((doc) => (
              <label key={doc.no} className="flex items-center justify-between rounded-lg border border-line-1 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={linkedInboundNos.includes(doc.no)}
                    onChange={(checked) =>
                      setLinkedInboundNos((current) =>
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
          <div className="text-sm text-text-2">关联入库单数量<span className="ml-2 text-text-1 font-medium">{paymentPreview.stats.linkedCount} 张</span></div>
          <div className="text-sm text-text-2">关联入库单金额合计<span className="ml-2 text-text-1 font-medium">{paymentPreview.stats.linkedAmount}</span></div>
          <div className="text-sm text-text-2">本次付款金额<span className="ml-2 text-text-1 font-medium">{moneyText(amount)}</span></div>
          <div className="text-sm text-text-2">付款差额<span className={`ml-2 font-medium ${paymentPreview.stats.differenceTone === "blue" ? "text-brand-6" : paymentPreview.stats.differenceTone === "orange" ? "text-warning" : "text-success"}`}>{paymentPreview.stats.difference}</span></div>
        </div>
      </div>
    </div>
  );
}

export function PaymentManagementDetailPage() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const record = recordId ? getPaymentRecord(recordId) : null;

  if (!record) return <div className="p-8 text-center text-text-2">付款单不存在</div>;

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title="付款单详情"
        actions={
          <>
            <Button onClick={() => navigate("/payment-management")}>返回列表</Button>
            {record.status === "草稿" ? (
              <>
                <Button onClick={() => navigate(`/payment-management/${record.id}/edit`)}>编辑</Button>
                <Button tone="primary" onClick={() => { confirmPaymentRecord(record.id); Message.success("付款已确认，供应商应付余额已更新"); navigate(`/payment-management/${record.id}`); }}>确认付款</Button>
                <Button onClick={() => { voidPaymentRecord(record.id); Message.success("付款单已作废"); navigate(`/payment-management/${record.id}`); }}>作废</Button>
                <Button onClick={() => { deletePaymentRecord(record.id); Message.success("付款单已删除"); navigate("/payment-management"); }}>删除</Button>
              </>
            ) : null}
            <Button onClick={() => Message.success("导出成功")}>导出</Button>
          </>
        }
      >
        查看付款单 {record.paymentNo} 的详细信息
      </PageTitle>

      <div className="rounded-xl border border-line-1 bg-white">
        <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">基本信息</div>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3 p-6 text-sm">
          <div><span className="text-text-2">付款单号</span><div className="mt-1 font-medium">{record.paymentNo}</div></div>
          <div><span className="text-text-2">单据状态</span><div className="mt-1"><StatusPill tone={record.statusTone}>{record.status}</StatusPill></div></div>
          <div><span className="text-text-2">账期状态</span><div className="mt-1"><StatusPill tone={periodToneMap[record.periodStatus]}>{periodStatusMap[record.periodStatus]}</StatusPill></div></div>
          <div><span className="text-text-2">核销状态</span><div className="mt-1">{record.verificationStatus ? <StatusPill tone={record.verificationTone ?? "gray"}>{record.verificationStatus}</StatusPill> : "-"}</div></div>
          <div><span className="text-text-2">供应商</span><div className="mt-1">{`${record.supplierCode} ${record.supplierName}`}</div></div>
          <div><span className="text-text-2">付款日期</span><div className="mt-1">{record.paymentDate}</div></div>
          <div><span className="text-text-2">付款方式</span><div className="mt-1">{record.paymentMethod}</div></div>
          <div><span className="text-text-2">付款金额</span><div className="mt-1 font-medium text-text-1">{moneyText(parseAmount(record.paymentAmount))}</div></div>
          <div><span className="text-text-2">付款账户</span><div className="mt-1">{record.paymentAccount || "-"}</div></div>
          <div><span className="text-text-2">供应商收款账户</span><div className="mt-1">{record.supplierReceiveAccount || "-"}</div></div>
          <div><span className="text-text-2">摘要/备注</span><div className="mt-1">{record.note || "-"}</div></div>
          <div><span className="text-text-2">确认人</span><div className="mt-1">{record.confirmedBy || "-"}</div></div>
          <div><span className="text-text-2">确认时间</span><div className="mt-1">{record.confirmedAt || "-"}</div></div>
        </div>
      </div>

      {record.stats ? (
        <div className="rounded-xl border border-line-1 bg-white">
          <div className="border-b border-line-1 px-6 py-3 text-sm font-medium text-text-1">统计信息</div>
          <div className="flex gap-8 p-6">
            <div className="text-sm text-text-2">关联入库单数量<span className="ml-2 text-text-1 font-medium">{record.stats.linkedCount} 张</span></div>
            <div className="text-sm text-text-2">关联入库单金额合计<span className="ml-2 text-text-1 font-medium">{record.stats.linkedAmount}</span></div>
            <div className="text-sm text-text-2">本次付款金额<span className="ml-2 text-text-1 font-medium">{record.stats.paymentAmount}</span></div>
            <div className="text-sm text-text-2">付款差额<span className={`ml-2 font-medium ${record.stats.differenceTone === "blue" ? "text-brand-6" : record.stats.differenceTone === "orange" ? "text-warning" : "text-success"}`}>{record.stats.difference}</span></div>
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
    </div>
  );
}
