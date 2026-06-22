import { startTransition, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, DateField, FilterActions, FilterField, FormField, HintBox, Input, Message, PageTitle, Pagination, ResizableHeaderCell, SearchInput, Select, StatusPill, TabBar, TableSortHeader, TextArea, useResizableColumns } from "../components/Ui";
import { Drawer } from "../components/Drawer";
import { FilterItem } from "../components/FilterItem";
import { SalesOrderSection } from "../components/SalesOrderWorkspace";
import {
  configModuleViews,
  createCrudModuleDraft,
  formModuleViews,
  getCrudModuleDefinition,
  getCrudModuleRecord,
  getModuleDefinition,
  queryModuleViews,
  saveCrudModuleRecord,
  type ConfigModuleDefinition,
  type CrudRecord,
  type FormModuleDefinition,
  type ModuleColumn,
  type ModuleField,
  type ModuleLineItem,
  type ModuleLog,
  type ModuleRelation,
  type QueryModuleDefinition,
  type Tone,
} from "../contracts/modules";
import { TABLE_MIN_WIDTH } from "../utils/tableConstants";
import type { ViewKey } from "../app/navigation";
import { cn } from "../utils/cn";
import { compareRecord } from "../utils/sort";
import { DataCell } from "../components/TableCells";

export function GenericCrudListPage({ view }: { view: ViewKey }) {
  const navigate = useNavigate();
  const module = getCrudModuleDefinition(view);
  // search 类型字段按 key 独立存储，支持多字段并行搜索
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(module?.statusTabs?.[0] ?? "全部单据");
  // select / batch 类型字段统一存这里（batch 存多行字符串）
  const [selectFilters, setSelectFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredSearchValues = useDeferredValue(searchValues);

  // 启停用弹窗 state（仅 entity 类型使用）
  const [statusTarget, setStatusTarget] = useState<CrudRecord | null>(null);
  const [statusAction, setStatusAction] = useState<"启用" | "停用">("停用");
  const [stopReason, setStopReason] = useState("");
  const [stopReasonError, setStopReasonError] = useState("");

  if (!module) return null;

  const listColumns = [
    ...module.columns.map((column) => ({
      key: column.key,
      width: column.width ?? (column.kind === "status" ? 120 : column.kind === "money" ? 150 : 160),
      minWidth: column.minWidth ?? (column.kind === "status" ? 110 : 120),
      maxWidth: column.maxWidth,
      resizable: column.resizable,
    })),
    { key: "__actions__", width: 160, minWidth: 140, resizable: false },
  ];
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns(`${view}:list`, listColumns);

  const filteredRows = useMemo(() => {
    return module.records.filter((record) => {
      // 整行文本，用于未配 targetFields 的 search 字段兜底模糊匹配
      const rowText = Object.values(record)
        .filter((value) => typeof value === "string" || typeof value === "number")
        .join(" ")
        .toLowerCase();

      if (module.statusTabs && activeTab !== module.statusTabs[0] && record.status !== activeTab) {
        return false;
      }

      // 逐个 filter 独立判断：search 模糊、batch 批量精确、select 精确
      for (const filter of module.filters) {
        if (filter.type === "search") {
          const value = (deferredSearchValues[filter.key] ?? "").trim().toLowerCase();
          if (!value) continue;
          const targets = filter.targetFields;
          const matched = targets
            ? targets.some((field) => String(record[field] ?? "").toLowerCase().includes(value))
            : rowText.includes(value);
          if (!matched) return false;
        } else if (filter.type === "batch") {
          const raw = selectFilters[filter.key] ?? "";
          const items = raw
            .split(/[\n,，;；\t ]+/)
            .map((item) => item.trim())
            .filter(Boolean);
          if (items.length === 0) continue;
          const targets = filter.targetFields ?? ["code"];
          const matched = targets.some((field) => items.includes(String(record[field] ?? "").trim()));
          if (!matched) return false;
        } else if (filter.type === "select") {
          const value = selectFilters[filter.key];
          if (!value || value.startsWith("全部")) continue;
          if (String(record[filter.key] ?? "") !== value) return false;
        }
      }

      return true;
    }).sort((a, b) => compareRecord(a, b, sortConfig));
  }, [activeTab, deferredSearchValues, module.filters, module.records, module.statusTabs, selectFilters, sortConfig]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else {
        setSortConfig(null);
        return;
      }
    }
    setSortConfig({ key, direction });
  };

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const openStatusModal = (record: CrudRecord, action: "启用" | "停用") => {
    setStatusTarget(record);
    setStatusAction(action);
    setStopReason("");
    setStopReasonError("");
  };

  const closeStatusModal = () => {
    setStatusTarget(null);
    setStopReason("");
    setStopReasonError("");
  };

  const handleStatusConfirm = () => {
    if (!statusTarget) return;
    if (statusAction === "停用" && !stopReason.trim()) {
      setStopReasonError("停用原因不能为空");
      return;
    }
    const nextRecord: CrudRecord = {
      ...statusTarget,
      status: statusAction,
      statusTone: statusAction === "启用" ? "green" : "gray",
      stopReason: statusAction === "停用" ? stopReason.trim() : "",
    };
    saveCrudModuleRecord(view, nextRecord, "edit");
    Message.success(statusAction === "启用" ? `${module.singular}已启用` : `${module.singular}已停用`, 2000);
    closeStatusModal();
    // 强制列表刷新：重置筛选触发 useMemo 重算
    setSelectFilters((s) => ({ ...s }));
  };

  return (
    <div className="flex flex-col gap-4">
      {module.statusTabs ? (
        <TabBar
          items={module.statusTabs.map((tab) => ({ key: tab, label: tab }))}
          activeKey={activeTab}
          onChange={(tab) => startTransition(() => setActiveTab(tab))}
        />
      ) : null}

      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        {module.filters.map((filter) => (
          <FilterItem
            key={filter.key}
            filter={filter}
            keyword={searchValues[filter.key] ?? ""}
            onKeywordChange={(value) => setSearchValues((current) => ({ ...current, [filter.key]: value }))}
            value={selectFilters[filter.key] ?? ""}
            onValueChange={(value) => setSelectFilters((current) => ({ ...current, [filter.key]: value }))}
          />
        ))}
        <FilterActions onSecondaryClick={() => { setSearchValues({}); setSelectFilters({}); setCurrentPage(1); }} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button tone="primary" onClick={() => navigate(`/${view}/new`)}>新增{module.singular}</Button>
          <Button>导出</Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
          <div ref={containerRef} className="overflow-x-auto">
          <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.standard) }}>
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                {module.columns.map((column) => (
                  <ResizableHeaderCell
                    key={column.key}
                    width={getColumnStyle(column.key).width}
                    minWidth={getColumnStyle(column.key).minWidth}
                    maxWidth={getColumnStyle(column.key).maxWidth}
                    className={cn(column.align === "right" && "text-right")}
                    resizable={column.resizable !== false}
                    onResizeStart={(clientX) => startResize(column.key, clientX)}
                  >
                    <TableSortHeader
                      label={column.label}
                      sortKey={column.key}
                      currentSort={sortConfig}
                      onSort={handleSort}
                      align={column.align === "right" ? "right" : "left"}
                    />
                  </ResizableHeaderCell>
                ))}
                <ResizableHeaderCell width={getColumnStyle("__actions__").width} minWidth={getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((record) => (
                <tr key={record.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  {module.columns.map((column) => (
                    <DataCell key={column.key} style={getColumnStyle(column.key)} align={column.align === "right" ? "right" : undefined} nowrap truncate title={String(record[column.key] ?? "")}>{renderColumnValue(record, column)}</DataCell>
                  ))}
                  <td className="px-4 whitespace-nowrap" style={getColumnStyle("__actions__")}>
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}`)}>查看</Button>
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}/edit`)}>编辑</Button>
                      {module.kind === "entity" && (
                        record.status === "启用"
                          ? <Button size="sm" onClick={() => openStatusModal(record, "停用")}>停用</Button>
                          : <Button size="sm" tone="primary" onClick={() => openStatusModal(record, "启用")}>启用</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>

        <Pagination
          total={filteredRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* 启停用确认弹窗 */}
      {statusTarget && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40">
          <div className="w-[420px] rounded-xl border border-line-1 bg-white p-6 shadow-drawer">
            <div className="mb-4 text-[15px] font-semibold text-text-1">
              确认{statusAction}：{String(statusTarget.name ?? statusTarget.code ?? "")}
            </div>
            {statusAction === "停用" ? (
              <div className="mb-4 space-y-1">
                <div className="text-[13px] text-text-2">停用原因 <span className="text-danger">*</span></div>
                <TextArea
                  value={stopReason}
                  onChange={(v) => { setStopReason(v); if (v.trim()) setStopReasonError(""); }}
                  maxLength={100}
                  placeholder="请填写停用原因"
                />
                {stopReasonError && <div className="text-[12px] text-danger">{stopReasonError}</div>}
              </div>
            ) : (
              <div className="mb-4 text-[13px] text-text-2">
                启用后该{module.singular}可重新在新单中选择。
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={closeStatusModal}>取消</Button>
              <Button tone="primary" onClick={handleStatusConfirm}>确认{statusAction}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export function GenericCrudCreatePage({ view }: { view: ViewKey }) {
  return <GenericCrudEditorPage view={view} mode="create" />;
}

export function GenericCrudEditPage({ view }: { view: ViewKey }) {
  return <GenericCrudEditorPage view={view} mode="edit" />;
}

export function GenericCrudEditorPage({
  view,
  mode,
}: {
  view: ViewKey;
  mode: "create" | "edit";
}) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const module = getCrudModuleDefinition(view);
  const sourceRecord = useMemo(
    () => (mode === "create" ? createCrudModuleDraft(view) : getCrudModuleRecord(view, recordId)),
    [mode, recordId, view],
  );
  const [form, setForm] = useState<Record<string, any>>(sourceRecord ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(sourceRecord ?? {});
    setErrors({});
  }, [recordId, sourceRecord]);

  if (!module || !sourceRecord) {
    return (
      <div className="space-y-4">
        <HintBox>未找到对应记录，请返回列表重新进入。</HintBox>
        <div className="flex justify-end">
          <Button onClick={() => navigate(`/${view}`)}>返回列表</Button>
        </div>
      </div>
    );
  }

  const lines = (form.lines as ModuleLineItem[] | undefined) ?? [];
  const totalQty = lines.reduce((sum, item) => sum + Number(item.qty ?? 0), 0);
  const totalAmount = lines.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  const updateField = (key: string, value: string) => {
    const field = module.formSections.flatMap((section) => section.fields).find((item) => item.key === key);
    const transformedValue = field?.inputTransform ? field.inputTransform(value) : value;

    setForm((current) => (
      module.transformForm
        ? module.transformForm({ form: current, key, value: transformedValue, mode, sourceRecord })
        : { ...current, [key]: transformedValue }
    ));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      if (key === "settlementMethod") {
        delete next.accountPeriodDays;
        delete next.creditLimit;
      }

      if (field?.inputTransform && transformedValue !== value && field.patternMessage) {
        next[key] = field.patternMessage;
        return next;
      }

      if (field?.minLength && transformedValue.trim().length > 0 && transformedValue.trim().length < field.minLength) {
        next[key] = `${field.label}长度不可少于${field.minLength}个字符`;
        return next;
      }

      if (field?.pattern && transformedValue.trim() && !field.pattern.test(transformedValue.trim())) {
        next[key] = field.patternMessage ?? `${field.label}格式不正确`;
      }

      return next;
    });
  };

  const updateLine = (lineId: string, key: string, value: string) => {
    setForm((current) => ({
      ...current,
      lines: (current.lines ?? []).map((item: any) =>
        item.id === lineId
          ? {
              ...item,
              [key]: key === "qty" || key === "price" || key === "amount" ? Number(value) || 0 : value,
              ...(key === "qty" || key === "price"
                ? {
                    amount:
                      (key === "qty" ? Number(value) || 0 : Number(item.qty ?? 0)) *
                      (key === "price" ? Number(value) || 0 : Number(item.price ?? 0)),
                  }
                : null),
            }
          : item,
      ),
    }));
  };

  const addLine = () => {
    setForm((current) => ({
      ...current,
      lines: [
        ...(current.lines ?? []),
        { id: `${view}-line-${Date.now()}`, code: "", name: "", spec: "", qty: 1, unit: "件", price: 0, amount: 0, note: "" },
      ],
    }));
    Message.success("已新增一行明细。", 2000);
  };

  const removeLine = (lineId: string) => {
    setForm((current) => ({
      ...current,
      lines: (current.lines ?? []).filter((item: any) => item.id !== lineId),
    }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    module.formSections.forEach((section) => {
      section.fields.forEach((field) => {
        const rawValue = String(form[field.key] ?? "");
        const value = rawValue.trim();
        const statusValue = String(form.status ?? "");

        if (isFieldRequired(field, form, mode) && !value) {
          nextErrors[field.key] = `${field.label}不能为空`;
        }

        if (field.maxLength && rawValue.length > field.maxLength) {
          nextErrors[field.key] = `${field.label}长度不可超过${field.maxLength}个字符`;
        }

        if (field.minLength && value && value.length < field.minLength) {
          nextErrors[field.key] = `${field.label}长度不可少于${field.minLength}个字符`;
        }

        if (field.pattern && value && !field.pattern.test(value)) {
          nextErrors[field.key] = field.patternMessage ?? `${field.label}格式不正确`;
        }

        if (field.key === "stopReason" && statusValue === "停用" && !value) {
          nextErrors[field.key] = "停用原因不能为空";
        }
      });
    });

    if (module.kind === "entity" && String(form.code ?? "").trim()) {
      const duplicated = module.records.find(
        (record) => String(record.code ?? "").trim() === String(form.code ?? "").trim() && record.id !== form.id,
      );
      if (duplicated) {
        nextErrors.code = `${module.singular}编码已存在`;
      }
    }

    if (module.validateForm) {
      Object.assign(nextErrors, module.validateForm({ form, mode, sourceRecord, module }));
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSave = () => {
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      Message.error("请完善必填信息后再保存。", 3000);
      return;
    }

    // 应用 beforeSave 钩子（字段裁剪、默认值注入等），未定义时透传原 form
    const finalRecord = module.beforeSave
      ? module.beforeSave({ record: form as CrudRecord, mode, sourceRecord, module })
      : (form as CrudRecord);

    const saved = saveCrudModuleRecord(view, finalRecord, mode);
    if (!saved) {
      Message.error(`${module.singular}保存失败。`, 3000);
      return;
    }
    Message.success("保存成功", 2000);
    navigate(`/${view}`);
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title={mode === "create" ? `新增${module.singular}` : `编辑${module.singular}`}
        actions={
          <>
            <Button tone="primary" onClick={handleSave}>保存</Button>
            <Button onClick={() => navigate(`/${view}`)}>返回列表</Button>
          </>
        }
      />

      <div className="space-y-4">
        {module.formSections.map((section) => (
          <SalesOrderSection key={section.title} title={section.title}>
            <ModuleFormGrid fields={section.fields} form={form} onFieldChange={updateField} errors={errors} mode={mode} />
          </SalesOrderSection>
        ))}

        {module.kind === "document" ? (
          <SalesOrderSection title="明细信息">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button tone="primary" size="sm" onClick={addLine}>新增空行</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-sm">
                  <thead className="bg-fill-2 text-left text-text-2">
                    <tr className="h-[44px]">
                      {["编码", "名称", "规格", "数量", "单位", "单价", "金额", "备注", "操作"].map((label) => (
                        <th key={label} className="border-b border-line-1 px-3">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line: any) => (
                      <tr key={line.id} className="border-b border-line-1">
                        <td className="px-3 py-2.5"><Input value={String(line.code ?? "")} onChange={(value) => updateLine(line.id, "code", value)} /></td>
                        <td className="px-3 py-2.5"><Input value={String(line.name ?? "")} onChange={(value) => updateLine(line.id, "name", value)} /></td>
                        <td className="px-3 py-2.5"><Input value={String(line.spec ?? "")} onChange={(value) => updateLine(line.id, "spec", value)} /></td>
                        <td className="px-3 py-2.5"><Input value={String(line.qty ?? 0)} onChange={(value) => updateLine(line.id, "qty", value)} className="text-right" /></td>
                        <td className="px-3 py-2.5"><Input value={String(line.unit ?? "")} onChange={(value) => updateLine(line.id, "unit", value)} /></td>
                        <td className="px-3 py-2.5"><Input value={String(line.price ?? 0)} onChange={(value) => updateLine(line.id, "price", value)} className="text-right" /></td>
                        <td className="px-3 py-2.5 text-right text-text-1">{Number(line.amount ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-2.5"><Input value={String(line.note ?? "")} onChange={(value) => updateLine(line.id, "note", value)} /></td>
                        <td className="px-3 py-2.5 text-center"><Button size="sm" onClick={() => removeLine(line.id)}>删除</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-line-1 bg-fill-2 px-4 py-3 text-sm text-text-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <span>商品数量:{totalQty}件</span>
                  <span>单据金额:¥{totalAmount.toFixed(2)}</span>
                </div>
                <div className="text-[17px] font-semibold text-brand-7">合计:¥{totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </SalesOrderSection>
        ) : null}
      </div>
    </div>
  );
}

export function GenericCrudDetailPage({ view }: { view: ViewKey }) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const module = getCrudModuleDefinition(view);
  const record = getCrudModuleRecord(view, recordId);
  const [activeTab, setActiveTab] = useState<string>(module?.kind === "document" ? "detail" : "profile");
  const [statusAction, setStatusAction] = useState<"启用" | "停用" | null>(null);
  const [stopReason, setStopReason] = useState("");
  const [stopReasonError, setStopReasonError] = useState("");

  useEffect(() => {
    setActiveTab(module?.kind === "document" ? "detail" : "profile");
  }, [module?.kind, recordId]);

  if (!module || !record) {
    return (
      <div className="space-y-4">
        <HintBox>未找到对应记录，请返回列表重新进入。</HintBox>
        <div className="flex justify-end">
          <Button onClick={() => navigate(`/${view}`)}>返回列表</Button>
        </div>
      </div>
    );
  }

  const tabs = module.kind === "document"
    ? [
        { key: "detail", label: "单据明细" },
        { key: "flow", label: "流转记录" },
        { key: "logs", label: "操作日志" },
        { key: "related", label: "备注与关联" },
      ]
    : [
        { key: "profile", label: "档案信息" },
        { key: "logs", label: "操作日志" },
      ];

  return (
    <div className="space-y-4">
      <PageTitle
        title={module.kind === "entity" ? `${module.singular}详情` : `${module.title}详情`}
        actions={
          <>
            {module.kind === "entity" ? (
              String(record.status) === "启用"
                ? <Button onClick={() => setStatusAction("停用")}>停用</Button>
                : <Button tone="primary" onClick={() => setStatusAction("启用")}>启用</Button>
            ) : null}
            <Button tone="primary" onClick={() => navigate(`/${view}/${record.id}/edit`)}>编辑</Button>
            <Button onClick={() => navigate(`/${view}/new`)}>复制新增</Button>
            <Button onClick={() => navigate(`/${view}`)}>返回列表</Button>
          </>
        }
      >
        {String(record["no"] ?? record["code"] ?? record["name"] ?? "")}
      </PageTitle>

      <div className="grid gap-x-5 gap-y-3 rounded-xl border border-line-1 bg-white px-4 py-3.5 shadow-card md:grid-cols-2 xl:grid-cols-4">
        {module.headerFields.map((field) => (
          <div key={field.label}>
            <div className="text-[13px] leading-[20px] text-text-3">{field.label}</div>
            <div className="mt-1 text-[14px] leading-[22px] text-text-1">
              {renderHeaderValue(record, field)}
            </div>
          </div>
        ))}
      </div>

      <TabBar
        items={tabs}
        activeKey={activeTab}
        onChange={(tab) => startTransition(() => setActiveTab(tab))}
        className="mb-4 border-line-1"
      />

      {activeTab === "detail" || activeTab === "profile" ? (
        <div className="space-y-4">
          {module.detailSections.map((section) => (
            <SalesOrderSection key={section.title} title={section.title}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {section.items.map((item) => (
                  <div key={item.label} className={cn(item.key === module.noteKeys.external || item.key === module.noteKeys.internal ? "xl:col-span-2" : "")}>
                    <div className="text-[13px] text-text-3">{item.label}</div>
                    <div className="mt-1 text-[14px] text-text-1">{renderSectionValue(record, item)}</div>
                  </div>
                ))}
              </div>
            </SalesOrderSection>
          ))}

          {module.kind === "document" && record.lines ? (
            <SalesOrderSection title="单据明细">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-sm">
                  <thead className="bg-fill-2 text-left text-text-2">
                    <tr className="h-[44px]">
                      {["编码", "名称", "规格", "数量", "单位", "单价", "金额", "备注"].map((label) => (
                        <th key={label} className="border-b border-line-1 px-3">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {record.lines.map((line: any) => (
                      <tr key={line.id} className="border-b border-line-1">
                        <td className="px-3 py-2.5">{line.code}</td>
                        <td className="px-3 py-2.5">{line.name}</td>
                        <td className="px-3 py-2.5">{line.spec}</td>
                        <td className="px-3 py-2.5 text-right">{line.qty}</td>
                        <td className="px-3 py-2.5">{line.unit}</td>
                        <td className="px-3 py-2.5 text-right">¥{Number(line.price).toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right">¥{Number(line.amount).toFixed(2)}</td>
                        <td className="px-3 py-2.5">{line.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SalesOrderSection>
          ) : null}
        </div>
      ) : null}

      {activeTab === "flow" ? (
        <SalesOrderSection title="流转记录">
          <div className="space-y-4">
            {(record.timeline ?? []).map((step: any, index: number) => (
              <div key={`${step.title}-${index}`} className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3.5 shadow-card">
                <div className="flex items-center gap-2">
                  <StatusPill tone={step.tone as Tone}>{step.owner}</StatusPill>
                  <span className="text-sm font-medium text-text-1">{step.title}</span>
                </div>
                <div className="mt-2 text-[13px] text-text-2">{step.detail}</div>
                <div className="mt-2 text-xs text-text-3">{step.time}</div>
              </div>
            ))}
          </div>
        </SalesOrderSection>
      ) : null}

      {activeTab === "logs" ? (
        <SalesOrderSection title="操作日志">
          <ModuleLogTable logs={(record.logs ?? []) as ModuleLog[]} tableId={`${view}-${record.id}`} />
        </SalesOrderSection>
      ) : null}

      {activeTab === "related" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <SalesOrderSection title="备注说明">
              <div className="grid gap-4 xl:grid-cols-2">
                <NoteCard label="对外备注" value={String(record[module.noteKeys.external] ?? "暂无")} />
                <NoteCard label="内部说明" value={String(record[module.noteKeys.internal] ?? "暂无")} />
              </div>
            </SalesOrderSection>
            <SalesOrderSection title="关联记录">
              <div className="space-y-3">
                {((record.relations ?? []) as ModuleRelation[]).map((item, index) => (
                  <div key={`${item.no}-${index}`} className="flex items-center justify-between rounded-xl border border-line-1 px-4 py-3 shadow-card">
                    <div>
                      <div className="text-sm font-medium text-text-1">{item.type}</div>
                      <div className="mt-1 text-[13px] text-text-3">{item.no}</div>
                    </div>
                    <div className="text-sm text-text-2">{item.status}</div>
                  </div>
                ))}
              </div>
            </SalesOrderSection>
          </div>
          <SalesOrderSection title="下一步建议">
            <div className="space-y-2 text-[13px] text-text-2">
              {module.tags.map((tag) => (
                <div key={tag} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-brand-6" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          </SalesOrderSection>
        </div>
      ) : null}

      {module.kind === "entity" && statusAction ? (
        <EntityStatusDialog
          singular={module.singular}
          name={String(record.name ?? record.code ?? "")}
          action={statusAction}
          stopReason={stopReason}
          stopReasonError={stopReasonError}
          onStopReasonChange={(value) => {
            setStopReason(value);
            if (value.trim()) setStopReasonError("");
          }}
          onCancel={() => {
            setStatusAction(null);
            setStopReason("");
            setStopReasonError("");
          }}
          onConfirm={() => {
            if (statusAction === "停用" && !stopReason.trim()) {
              setStopReasonError("停用原因不能为空");
              return;
            }

            const saved = saveCrudModuleRecord(
              view,
              {
                ...record,
                status: statusAction,
                statusTone: statusAction === "启用" ? "green" : "gray",
                stopReason: statusAction === "停用" ? stopReason.trim() : "",
              },
              "edit",
            );

            if (!saved) {
              Message.error(`${module.singular}状态更新失败`, 3000);
              return;
            }

            Message.success(statusAction === "启用" ? `${module.singular}已启用` : `${module.singular}已停用`, 2000);
            navigate(`/${view}`);
          }}
        />
      ) : null}
    </div>
  );
}

export function GenericQueryPage({ view }: { view: ViewKey }) {
  const module = getModuleDefinition(view) as QueryModuleDefinition | undefined;
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectFilters, setSelectFilters] = useState<Record<string, string>>({});
  const [dateRangeFilters, setDateRangeFilters] = useState<Record<string, { start: string; end: string }>>({});
  const deferredKeyword = useDeferredValue(keyword);

  if (!module || !queryModuleViews.includes(view)) return null;

  const queryColumns = module.columns.map((column) => ({
    key: column.key,
    width: column.width ?? (column.kind === "status" ? 120 : column.align === "right" ? 140 : 160),
    minWidth: column.minWidth ?? (column.kind === "status" ? 110 : 120),
    maxWidth: column.maxWidth,
    resizable: column.resizable,
  }));
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns(`${view}:query`, queryColumns);

  const filteredRows = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    let rows = module.rows;

    // 关键词过滤（跳过 _ 开头的展示元数据字段，如 _tone / _agingTone，避免英文色名被误匹配）
    if (normalized) {
      rows = rows.filter((row) =>
        Object.entries(row)
          .filter(([key]) => !key.startsWith("_"))
          .map(([, value]) => value)
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      );
    }

    // 下拉筛选
    for (const [key, value] of Object.entries(selectFilters)) {
      if (!value || value.startsWith("全部")) continue;
      rows = rows.filter((row) => String(row[key] ?? "") === value);
    }

    return rows;
  }, [deferredKeyword, module.rows, selectFilters]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const handleReset = () => {
    setKeyword("");
    setSelectFilters({});
    setDateRangeFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
        {module.filters.map((filter) => (
          <FilterItem
            key={filter.key}
            filter={filter}
            keyword={keyword}
            onKeywordChange={setKeyword}
            value={selectFilters[filter.key] ?? ""}
            onValueChange={(value) => setSelectFilters((current) => ({ ...current, [filter.key]: value }))}
            dateRangeValue={dateRangeFilters[filter.key]}
            onDateRangeChange={(range) => setDateRangeFilters((current) => ({ ...current, [filter.key]: range }))}
          />
        ))}
        <FilterActions onSecondaryClick={handleReset} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button>导出</Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
          <div ref={containerRef} className="overflow-x-auto">
            <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.standard) }}>
              <thead className="bg-fill-2 text-left text-text-2">
                <tr className="h-[44px]">
                  {module.columns.map((column) => (
                    <ResizableHeaderCell
                      key={column.key}
                      width={getColumnStyle(column.key).width}
                      minWidth={getColumnStyle(column.key).minWidth}
                      maxWidth={getColumnStyle(column.key).maxWidth}
                      className={cn(column.align === "right" && "text-right")}
                      resizable={column.resizable !== false}
                      onResizeStart={(clientX) => startResize(column.key, clientX)}
                    >
                      {column.label}
                    </ResizableHeaderCell>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={`${index}-${row[module.columns[0].key]}`} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                    {module.columns.map((column) => (
                      <DataCell key={column.key} style={getColumnStyle(column.key)} align={column.align === "right" ? "right" : undefined} nowrap truncate title={String(row[column.key] ?? "")}>{renderGenericValue(row[column.key], column.kind, row[column.toneKey ?? "tone"] as Tone | undefined)}</DataCell>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          total={filteredRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}

export function GenericFormPage({ view }: { view: ViewKey }) {
  const navigate = useNavigate();
  const module = getModuleDefinition(view) as FormModuleDefinition | undefined;
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!module) return;
    const defaults = Object.fromEntries(module.sections.flatMap((section) => section.fields.map((field) => [field.key, ""])));
    setForm(defaults);
  }, [module]);

  if (!module || !formModuleViews.includes(view)) return null;

  return (
    <div className="space-y-4">
      <PageTitle
        title={module.title}
        actions={
          <>
            <Button tone="primary" onClick={() => Message.success(`${module.title}已保存。`, 2000)}>保存</Button>
            <Button onClick={() => navigate(`/${view}`)}>返回列表</Button>
          </>
        }
      >
        {module.description}
      </PageTitle>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {module.sections.map((section) => (
            <SalesOrderSection key={section.title} title={section.title}>
              <ModuleFormGrid fields={section.fields} form={form} onFieldChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} mode="create" />
            </SalesOrderSection>
          ))}
        </div>
        <SalesOrderSection title="付款摘要">
          <div className="space-y-3 text-[13px] text-text-2">
            {module.sideSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span>{item.label}</span>
                <span className="font-medium text-text-1">{item.value}</span>
              </div>
            ))}
          </div>
        </SalesOrderSection>
      </div>
    </div>
  );
}

export function GenericConfigPage({ view }: { view: ViewKey }) {
  const module = getModuleDefinition(view) as ConfigModuleDefinition | undefined;
  const [selectedTab, setSelectedTab] = useState("");

  // Drawer states
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isRoleDrawerOpen, setIsRoleDrawerOpen] = useState(false);
  const [isRuleDrawerOpen, setIsRuleDrawerOpen] = useState(false);
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);

  // Form states
  const [newUserForm, setNewUserForm] = useState({ username: "", name: "", role: "", department: "", status: "启用" });
  const [newRoleForm, setNewRoleForm] = useState({ roleName: "", roleCode: "", description: "" });
  const [newRuleForm, setNewRuleForm] = useState({ docType: "", prefix: "", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "日归零", status: "启用" });
  const [newTemplateForm, setNewTemplateForm] = useState({ docType: "", templateName: "", paperSize: "A4" });

  useEffect(() => {
    // Set default tab based on module type
    if (module) {
      if (module.users) setSelectedTab("users");
      else if (module.rules) setSelectedTab("rules");
      else if (module.templates) setSelectedTab("templates");
      else if (module.logs && view === "operation-log") setSelectedTab("logs");
    }
  }, [module, view]);

  const userTable = useResizableColumns(`${view}:config-users`, [
    { key: "username", width: 140, minWidth: 120 },
    { key: "name", width: 120, minWidth: 100 },
    { key: "role", width: 140, minWidth: 120 },
    { key: "department", width: 120, minWidth: 100 },
    { key: "status", width: 110, minWidth: 100 },
    { key: "lastLogin", width: 170, minWidth: 150 },
    { key: "__actions__", width: 140, minWidth: 120, resizable: false },
  ]);
  const roleTable = useResizableColumns(`${view}:config-roles`, [
    { key: "roleName", width: 140, minWidth: 120 },
    { key: "roleCode", width: 140, minWidth: 120 },
    { key: "userCount", width: 100, minWidth: 90 },
    { key: "description", width: 240, minWidth: 180 },
    { key: "__actions__", width: 120, minWidth: 120, resizable: false },
  ]);
  const ruleTable = useResizableColumns(`${view}:config-rules`, [
    { key: "docType", width: 140, minWidth: 120 },
    { key: "prefix", width: 120, minWidth: 100 },
    { key: "dateFormat", width: 140, minWidth: 120 },
    { key: "sequence", width: 120, minWidth: 100 },
    { key: "resetType", width: 120, minWidth: 100 },
    { key: "status", width: 110, minWidth: 100 },
    { key: "__actions__", width: 100, minWidth: 100, resizable: false },
  ]);
  const templateTable = useResizableColumns(`${view}:config-templates`, [
    { key: "docType", width: 140, minWidth: 120 },
    { key: "templateName", width: 180, minWidth: 140 },
    { key: "paperSize", width: 120, minWidth: 100 },
    { key: "isDefault", width: 120, minWidth: 100 },
    { key: "updatedAt", width: 170, minWidth: 150 },
    { key: "__actions__", width: 140, minWidth: 120, resizable: false },
  ]);

  if (!module || !configModuleViews.includes(view)) return null;

  // 用户与权限页面
  if (view === "user-permission") {
    return (
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-xl border border-line-1 bg-white px-4 py-3 shadow-card">
            <div className="text-[12px] text-text-3">用户总数</div>
            <div className="mt-1 text-2xl font-semibold text-text-1">{module.users?.length ?? 0}</div>
          </div>
          <div className="rounded-xl border border-line-1 bg-white px-4 py-3 shadow-card">
            <div className="text-[12px] text-text-3">启用中</div>
            <div className="mt-1 text-2xl font-semibold text-success">{module.users?.filter(u => u.status === "启用").length ?? 0}</div>
          </div>
          <div className="rounded-xl border border-line-1 bg-white px-4 py-3 shadow-card">
            <div className="text-[12px] text-text-3">角色数量</div>
            <div className="mt-1 text-2xl font-semibold text-text-1">{module.roles?.length ?? 0}</div>
          </div>
          <div className="rounded-xl border border-line-1 bg-white px-4 py-3 shadow-card">
            <div className="text-[12px] text-text-3">今日登录</div>
            <div className="mt-1 text-2xl font-semibold text-brand-6">4</div>
          </div>
        </div>

        {/* Tab切换 */}
        <TabBar
          items={[
            { key: "users", label: "用户列表" },
            { key: "roles", label: "角色配置" },
            { key: "permissions", label: "权限策略" },
          ]}
          activeKey={selectedTab || "users"}
          onChange={(tab) => setSelectedTab(tab)}
        />

        {/* 用户列表 */}
        {selectedTab === "users" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button tone="primary" onClick={() => setIsUserDrawerOpen(true)}>新增用户</Button>
              <Button>导出</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
              <div ref={userTable.containerRef} className="overflow-x-auto">
                <table className="border-collapse text-sm" style={{ minWidth: Math.max(userTable.totalWidth, 900) }}>
                  <thead className="bg-fill-2 text-left text-text-2">
                    <tr className="h-[44px]">
                      <ResizableHeaderCell width={userTable.getColumnStyle("username").width} minWidth={userTable.getColumnStyle("username").minWidth} onResizeStart={(clientX) => userTable.startResize("username", clientX)}>用户名</ResizableHeaderCell>
                      <ResizableHeaderCell width={userTable.getColumnStyle("name").width} minWidth={userTable.getColumnStyle("name").minWidth} onResizeStart={(clientX) => userTable.startResize("name", clientX)}>姓名</ResizableHeaderCell>
                      <ResizableHeaderCell width={userTable.getColumnStyle("role").width} minWidth={userTable.getColumnStyle("role").minWidth} onResizeStart={(clientX) => userTable.startResize("role", clientX)}>角色</ResizableHeaderCell>
                      <ResizableHeaderCell width={userTable.getColumnStyle("department").width} minWidth={userTable.getColumnStyle("department").minWidth} onResizeStart={(clientX) => userTable.startResize("department", clientX)}>部门</ResizableHeaderCell>
                      <ResizableHeaderCell width={userTable.getColumnStyle("status").width} minWidth={userTable.getColumnStyle("status").minWidth} onResizeStart={(clientX) => userTable.startResize("status", clientX)}>状态</ResizableHeaderCell>
                      <ResizableHeaderCell width={userTable.getColumnStyle("lastLogin").width} minWidth={userTable.getColumnStyle("lastLogin").minWidth} onResizeStart={(clientX) => userTable.startResize("lastLogin", clientX)}>最后登录</ResizableHeaderCell>
                      <ResizableHeaderCell width={userTable.getColumnStyle("__actions__").width} minWidth={userTable.getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {module.users?.map((user) => (
                      <tr key={user.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                        <td className="border-r border-line-1 px-4 text-brand-6 whitespace-nowrap" style={userTable.getColumnStyle("username")}>{user.username}</td>
                        <td className="border-r border-line-1 px-4 text-text-1 whitespace-nowrap" style={userTable.getColumnStyle("name")}>{user.name}</td>
                        <td className="border-r border-line-1 px-4 whitespace-nowrap" style={userTable.getColumnStyle("role")}>
                          <StatusPill tone={(user.roleTone as Tone) ?? "gray"}>{user.role}</StatusPill>
                        </td>
                        <td className="border-r border-line-1 px-4 whitespace-nowrap" style={userTable.getColumnStyle("department")}>{user.department}</td>
                        <td className="border-r border-line-1 px-4 whitespace-nowrap" style={userTable.getColumnStyle("status")}>
                          <StatusPill tone={(user.statusTone as Tone) ?? "gray"}>{user.status}</StatusPill>
                        </td>
                        <td className="border-r border-line-1 px-4 whitespace-nowrap" style={userTable.getColumnStyle("lastLogin")}>{user.lastLogin}</td>
                        <td className="px-4 whitespace-nowrap" style={userTable.getColumnStyle("__actions__")}>
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm">编辑</Button>
                            <Button size="sm">{user.status === "启用" ? "禁用" : "启用"}</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 角色配置 */}
        {selectedTab === "roles" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button tone="primary" onClick={() => setIsRoleDrawerOpen(true)}>新增角色</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
              <div ref={roleTable.containerRef} className="overflow-x-auto">
                <table className="border-collapse text-sm" style={{ minWidth: Math.max(roleTable.totalWidth, 700) }}>
                  <thead className="bg-fill-2 text-left text-text-2">
                    <tr className="h-[44px]">
                      <ResizableHeaderCell width={roleTable.getColumnStyle("roleName").width} minWidth={roleTable.getColumnStyle("roleName").minWidth} onResizeStart={(clientX) => roleTable.startResize("roleName", clientX)}>角色名称</ResizableHeaderCell>
                      <ResizableHeaderCell width={roleTable.getColumnStyle("roleCode").width} minWidth={roleTable.getColumnStyle("roleCode").minWidth} onResizeStart={(clientX) => roleTable.startResize("roleCode", clientX)}>角色编码</ResizableHeaderCell>
                      <ResizableHeaderCell width={roleTable.getColumnStyle("userCount").width} minWidth={roleTable.getColumnStyle("userCount").minWidth} onResizeStart={(clientX) => roleTable.startResize("userCount", clientX)}>用户数</ResizableHeaderCell>
                      <ResizableHeaderCell width={roleTable.getColumnStyle("description").width} minWidth={roleTable.getColumnStyle("description").minWidth} onResizeStart={(clientX) => roleTable.startResize("description", clientX)}>说明</ResizableHeaderCell>
                      <ResizableHeaderCell width={roleTable.getColumnStyle("__actions__").width} minWidth={roleTable.getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell>
                    </tr>
                  </thead>
                  <tbody>
                    {module.roles?.map((role) => (
                      <tr key={role.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                        <td className="border-r border-line-1 px-4 font-medium text-text-1 whitespace-nowrap" style={roleTable.getColumnStyle("roleName")}>{role.roleName}</td>
                        <td className="border-r border-line-1 px-4 whitespace-nowrap" style={roleTable.getColumnStyle("roleCode")}>{role.roleCode}</td>
                        <td className="border-r border-line-1 px-4 whitespace-nowrap" style={roleTable.getColumnStyle("userCount")}>{role.userCount}</td>
                        <td className="border-r border-line-1 px-4 whitespace-nowrap" style={roleTable.getColumnStyle("description")} title={String(role.description ?? "")}><div className="overflow-hidden text-ellipsis">{role.description}</div></td>
                        <td className="px-4 whitespace-nowrap" style={roleTable.getColumnStyle("__actions__")}>
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm">编辑</Button>
                            <Button size="sm">权限</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 权限策略 */}
        {selectedTab === "permissions" && (
          <SalesOrderSection title="权限策略">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3 shadow-card">
                <div className="text-[12px] text-text-3">菜单权限</div>
                <div className="mt-1 text-[14px] font-medium text-text-1">按角色配置</div>
              </div>
              <div className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3 shadow-card">
                <div className="text-[12px] text-text-3">数据权限</div>
                <div className="mt-1 text-[14px] font-medium text-text-1">按组织/仓库隔离</div>
              </div>
              <div className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3 shadow-card">
                <div className="text-[12px] text-text-3">审批权限</div>
                <div className="mt-1 text-[14px] font-medium text-text-1">按单据流转控制</div>
              </div>
            </div>
          </SalesOrderSection>
        )}

        {module.logs ? (
          <SalesOrderSection title="最近操作">
            <ModuleLogTable logs={module.logs} tableId={`${view}-recent`} />
          </SalesOrderSection>
        ) : null}

        {/* 新增用户Drawer */}
        <Drawer
          isOpen={isUserDrawerOpen}
          onClose={() => setIsUserDrawerOpen(false)}
          title="新增用户"
          footer={
            <>
              <Button onClick={() => setIsUserDrawerOpen(false)}>取消</Button>
              <Button tone="primary" onClick={() => setIsUserDrawerOpen(false)}>保存</Button>
            </>
          }
        >
          <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
            <ConfigDrawerField label="用户名">
              <Input value={newUserForm.username} onChange={(v) => setNewUserForm((f) => ({ ...f, username: v }))} placeholder="请输入" />
            </ConfigDrawerField>
            <ConfigDrawerField label="姓名">
              <Input value={newUserForm.name} onChange={(v) => setNewUserForm((f) => ({ ...f, name: v }))} placeholder="请输入" />
            </ConfigDrawerField>
            <ConfigDrawerField label="角色">
              <Select value={newUserForm.role} onChange={(v) => setNewUserForm((f) => ({ ...f, role: v }))} options={["管理员", "业务员", "仓库员", "财务"]} placeholder="选择角色" />
            </ConfigDrawerField>
            <ConfigDrawerField label="部门">
              <Select value={newUserForm.department} onChange={(v) => setNewUserForm((f) => ({ ...f, department: v }))} options={["销售部", "仓储部", "管理层", "财务部"]} placeholder="选择部门" />
            </ConfigDrawerField>
            <ConfigDrawerField label="状态">
              <Select value={newUserForm.status} onChange={(v) => setNewUserForm((f) => ({ ...f, status: v }))} options={["启用", "停用"]} placeholder="选择状态" />
            </ConfigDrawerField>
          </div>
        </Drawer>

        {/* 新增角色Drawer */}
        <Drawer
          isOpen={isRoleDrawerOpen}
          onClose={() => setIsRoleDrawerOpen(false)}
          title="新增角色"
          footer={
            <>
              <Button onClick={() => setIsRoleDrawerOpen(false)}>取消</Button>
              <Button tone="primary" onClick={() => setIsRoleDrawerOpen(false)}>保存</Button>
            </>
          }
        >
          <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
            <ConfigDrawerField label="角色名称">
              <Input value={newRoleForm.roleName} onChange={(v) => setNewRoleForm((f) => ({ ...f, roleName: v }))} placeholder="请输入" />
            </ConfigDrawerField>
            <ConfigDrawerField label="角色编码">
              <Input value={newRoleForm.roleCode} onChange={(v) => setNewRoleForm((f) => ({ ...f, roleCode: v }))} placeholder="请输入" />
            </ConfigDrawerField>
            <ConfigDrawerField label="说明" className="md:col-span-2">
              <TextArea value={newRoleForm.description} onChange={(v) => setNewRoleForm((f) => ({ ...f, description: v }))} placeholder="请输入" />
            </ConfigDrawerField>
          </div>
        </Drawer>
      </div>
    );
  }

  // 单据编号页面
  if (view === "document-number") {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button tone="primary" onClick={() => setIsRuleDrawerOpen(true)}>新增规则</Button>
              <Button>导出</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
              <div ref={ruleTable.containerRef} className="overflow-x-auto">
              <table className="border-collapse text-sm" style={{ minWidth: Math.max(ruleTable.totalWidth, 800) }}>
                <thead className="bg-fill-2 text-left text-text-2">
                  <tr className="h-[44px]">
                    <ResizableHeaderCell width={ruleTable.getColumnStyle("docType").width} minWidth={ruleTable.getColumnStyle("docType").minWidth} onResizeStart={(clientX) => ruleTable.startResize("docType", clientX)}>单据类型</ResizableHeaderCell>
                    <ResizableHeaderCell width={ruleTable.getColumnStyle("prefix").width} minWidth={ruleTable.getColumnStyle("prefix").minWidth} onResizeStart={(clientX) => ruleTable.startResize("prefix", clientX)}>前缀</ResizableHeaderCell>
                    <ResizableHeaderCell width={ruleTable.getColumnStyle("dateFormat").width} minWidth={ruleTable.getColumnStyle("dateFormat").minWidth} onResizeStart={(clientX) => ruleTable.startResize("dateFormat", clientX)}>日期格式</ResizableHeaderCell>
                    <ResizableHeaderCell width={ruleTable.getColumnStyle("sequence").width} minWidth={ruleTable.getColumnStyle("sequence").minWidth} onResizeStart={(clientX) => ruleTable.startResize("sequence", clientX)}>序号位数</ResizableHeaderCell>
                    <ResizableHeaderCell width={ruleTable.getColumnStyle("resetType").width} minWidth={ruleTable.getColumnStyle("resetType").minWidth} onResizeStart={(clientX) => ruleTable.startResize("resetType", clientX)}>重置方式</ResizableHeaderCell>
                    <ResizableHeaderCell width={ruleTable.getColumnStyle("status").width} minWidth={ruleTable.getColumnStyle("status").minWidth} onResizeStart={(clientX) => ruleTable.startResize("status", clientX)}>状态</ResizableHeaderCell>
                    <ResizableHeaderCell width={ruleTable.getColumnStyle("__actions__").width} minWidth={ruleTable.getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {module.rules?.map((rule) => (
                    <tr key={rule.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                      <td className="border-r border-line-1 px-4 font-medium text-text-1 whitespace-nowrap" style={ruleTable.getColumnStyle("docType")}>{rule.docType}</td>
                      <td className="border-r border-line-1 px-4 whitespace-nowrap" style={ruleTable.getColumnStyle("prefix")}>{rule.prefix}</td>
                      <td className="border-r border-line-1 px-4 whitespace-nowrap" style={ruleTable.getColumnStyle("dateFormat")}>{rule.dateFormat}</td>
                      <td className="border-r border-line-1 px-4 whitespace-nowrap" style={ruleTable.getColumnStyle("sequence")}>{rule.sequence}</td>
                      <td className="border-r border-line-1 px-4 whitespace-nowrap" style={ruleTable.getColumnStyle("resetType")}>{rule.resetType}</td>
                      <td className="border-r border-line-1 px-4 whitespace-nowrap" style={ruleTable.getColumnStyle("status")}>
                        <StatusPill tone={(rule.statusTone as Tone) ?? "gray"}>{rule.status}</StatusPill>
                      </td>
                      <td className="px-4 whitespace-nowrap" style={ruleTable.getColumnStyle("__actions__")}>
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm">编辑</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {module.logs ? (
          <SalesOrderSection title="最近操作">
            <ModuleLogTable logs={module.logs} tableId={`${view}-recent`} />
          </SalesOrderSection>
        ) : null}

        {/* 新增规则Drawer */}
        <Drawer
          isOpen={isRuleDrawerOpen}
          onClose={() => setIsRuleDrawerOpen(false)}
          title="新增编号规则"
          footer={
            <>
              <Button onClick={() => setIsRuleDrawerOpen(false)}>取消</Button>
              <Button tone="primary" onClick={() => setIsRuleDrawerOpen(false)}>保存</Button>
            </>
          }
        >
          <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
            <ConfigDrawerField label="单据类型">
              <Select value={newRuleForm.docType} onChange={(v) => setNewRuleForm((f) => ({ ...f, docType: v }))} options={["销售订单", "采购订单", "零售单", "出库单", "入库单", "调拨单"]} placeholder="选择类型" />
            </ConfigDrawerField>
            <ConfigDrawerField label="前缀">
              <Input value={newRuleForm.prefix} onChange={(v) => setNewRuleForm((f) => ({ ...f, prefix: v }))} placeholder="如：XS" />
            </ConfigDrawerField>
            <ConfigDrawerField label="日期格式">
              <Select value={newRuleForm.dateFormat} onChange={(v) => setNewRuleForm((f) => ({ ...f, dateFormat: v }))} options={["YYYYMMDD", "YYYYMM", "YYYY"]} placeholder="选择格式" />
            </ConfigDrawerField>
            <ConfigDrawerField label="序号位数">
              <Select value={newRuleForm.sequence} onChange={(v) => setNewRuleForm((f) => ({ ...f, sequence: v }))} options={["2位", "3位", "4位", "5位"]} placeholder="选择位数" />
            </ConfigDrawerField>
            <ConfigDrawerField label="重置方式">
              <Select value={newRuleForm.resetType} onChange={(v) => setNewRuleForm((f) => ({ ...f, resetType: v }))} options={["日归零", "月归零", "不归零"]} placeholder="选择方式" />
            </ConfigDrawerField>
            <ConfigDrawerField label="状态">
              <Select value={newRuleForm.status} onChange={(v) => setNewRuleForm((f) => ({ ...f, status: v }))} options={["启用", "停用"]} placeholder="选择状态" />
            </ConfigDrawerField>
          </div>
        </Drawer>
      </div>
    );
  }

  // 期初初始化页面
  if (view === "opening-init") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          {module.panels?.map((panel) => (
            <SalesOrderSection key={panel.title} title={panel.title}>
              <div className="text-[13px] text-text-3">{panel.desc}</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {panel.items.map((item) => (
                  <div key={item.label} className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3 shadow-card">
                    <div className="text-[12px] text-text-3">{item.label}</div>
                    <div className="mt-1 text-[14px] font-medium text-text-1">
                      {item.tone ? <StatusPill tone={item.tone}>{item.value}</StatusPill> : item.value}
                    </div>
                  </div>
                ))}
              </div>
            </SalesOrderSection>
          ))}
        </div>

        <SalesOrderSection title="操作记录">
          <ModuleLogTable logs={module.logs ?? []} tableId={`${view}-logs`} />
        </SalesOrderSection>
      </div>
    );
  }

  // 打印模板页面
  if (view === "print-template") {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button tone="primary" onClick={() => setIsTemplateDrawerOpen(true)}>新增模板</Button>
              <Button>批量导入</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
              <div ref={templateTable.containerRef} className="overflow-x-auto">
              <table className="border-collapse text-sm" style={{ minWidth: Math.max(templateTable.totalWidth, 700) }}>
                <thead className="bg-fill-2 text-left text-text-2">
                  <tr className="h-[44px]">
                    <ResizableHeaderCell width={templateTable.getColumnStyle("docType").width} minWidth={templateTable.getColumnStyle("docType").minWidth} onResizeStart={(clientX) => templateTable.startResize("docType", clientX)}>单据类型</ResizableHeaderCell>
                    <ResizableHeaderCell width={templateTable.getColumnStyle("templateName").width} minWidth={templateTable.getColumnStyle("templateName").minWidth} onResizeStart={(clientX) => templateTable.startResize("templateName", clientX)}>模板名称</ResizableHeaderCell>
                    <ResizableHeaderCell width={templateTable.getColumnStyle("paperSize").width} minWidth={templateTable.getColumnStyle("paperSize").minWidth} onResizeStart={(clientX) => templateTable.startResize("paperSize", clientX)}>纸张尺寸</ResizableHeaderCell>
                    <ResizableHeaderCell width={templateTable.getColumnStyle("isDefault").width} minWidth={templateTable.getColumnStyle("isDefault").minWidth} onResizeStart={(clientX) => templateTable.startResize("isDefault", clientX)}>默认模板</ResizableHeaderCell>
                    <ResizableHeaderCell width={templateTable.getColumnStyle("updatedAt").width} minWidth={templateTable.getColumnStyle("updatedAt").minWidth} onResizeStart={(clientX) => templateTable.startResize("updatedAt", clientX)}>更新时间</ResizableHeaderCell>
                    <ResizableHeaderCell width={templateTable.getColumnStyle("__actions__").width} minWidth={templateTable.getColumnStyle("__actions__").minWidth} resizable={false} className="border-r-0 text-center">操作</ResizableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {module.templates?.map((tpl) => (
                    <tr key={tpl.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                      <td className="border-r border-line-1 px-4 font-medium text-text-1 whitespace-nowrap" style={templateTable.getColumnStyle("docType")}>{tpl.docType}</td>
                      <td className="border-r border-line-1 px-4 whitespace-nowrap" style={templateTable.getColumnStyle("templateName")}>{tpl.templateName}</td>
                      <td className="border-r border-line-1 px-4 whitespace-nowrap" style={templateTable.getColumnStyle("paperSize")}>{tpl.paperSize}</td>
                      <td className="border-r border-line-1 px-4 whitespace-nowrap" style={templateTable.getColumnStyle("isDefault")}>
                        <StatusPill tone={(tpl.isDefaultTone as Tone) ?? "gray"}>{tpl.isDefault}</StatusPill>
                      </td>
                      <td className="border-r border-line-1 px-4 whitespace-nowrap" style={templateTable.getColumnStyle("updatedAt")}>{tpl.updatedAt}</td>
                      <td className="px-4 whitespace-nowrap" style={templateTable.getColumnStyle("__actions__")}>
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm">编辑</Button>
                          <Button size="sm">预览</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {module.logs ? (
          <SalesOrderSection title="最近操作">
            <ModuleLogTable logs={module.logs} tableId={`${view}-recent`} />
          </SalesOrderSection>
        ) : null}

        {/* 新增模板Drawer */}
        <Drawer
          isOpen={isTemplateDrawerOpen}
          onClose={() => setIsTemplateDrawerOpen(false)}
          title="新增打印模板"
          footer={
            <>
              <Button onClick={() => setIsTemplateDrawerOpen(false)}>取消</Button>
              <Button tone="primary" onClick={() => setIsTemplateDrawerOpen(false)}>保存</Button>
            </>
          }
        >
          <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
            <ConfigDrawerField label="单据类型">
              <Select value={newTemplateForm.docType} onChange={(v) => setNewTemplateForm((f) => ({ ...f, docType: v }))} options={["销售订单", "采购订单", "出库单", "入库单", "调拨单"]} placeholder="选择类型" />
            </ConfigDrawerField>
            <ConfigDrawerField label="模板名称">
              <Input value={newTemplateForm.templateName} onChange={(v) => setNewTemplateForm((f) => ({ ...f, templateName: v }))} placeholder="请输入" />
            </ConfigDrawerField>
            <ConfigDrawerField label="纸张尺寸">
              <Select value={newTemplateForm.paperSize} onChange={(v) => setNewTemplateForm((f) => ({ ...f, paperSize: v }))} options={["A4", "A5", "80mm"]} placeholder="选择尺寸" />
            </ConfigDrawerField>
          </div>
        </Drawer>
      </div>
    );
  }

  // 操作日志页面
  if (view === "operation-log") {
    return (
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-xl border border-line-1 bg-white px-4 py-3 shadow-card">
            <div className="text-[12px] text-text-3">日志总数</div>
            <div className="mt-1 text-2xl font-semibold text-text-1">{module.logs?.length ?? 0}</div>
          </div>
          <div className="rounded-xl border border-line-1 bg-white px-4 py-3 shadow-card">
            <div className="text-[12px] text-text-3">今日新增</div>
            <div className="mt-1 text-2xl font-semibold text-brand-6">8</div>
          </div>
          <div className="rounded-xl border border-line-1 bg-white px-4 py-3 shadow-card">
            <div className="text-[12px] text-text-3">异常告警</div>
            <div className="mt-1 text-2xl font-semibold text-warning">2</div>
          </div>
          <div className="rounded-xl border border-line-1 bg-white px-4 py-3 shadow-card">
            <div className="text-[12px] text-text-3">系统操作</div>
            <div className="mt-1 text-2xl font-semibold text-text-1">3</div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-5 rounded-lg border border-line-1 bg-white px-4 py-3.5 text-[13px]">
          <FilterField label="综合搜索">
            <SearchInput value="" onChange={() => {}} placeholder="搜索操作/用户" className="w-[220px] bg-white" />
          </FilterField>
          <FilterField label="操作类型">
            <div className="w-[220px]">
              <Select value="" onChange={() => {}} options={["全部", "登录", "创建", "修改", "删除", "审核"]} placeholder="选择类型" className="bg-white" />
            </div>
          </FilterField>
          <FilterField label="时间范围">
            <div className="w-[220px]">
              <Select value="" onChange={() => {}} options={["全部", "今日", "近7天", "近30天"]} placeholder="选择时间" className="bg-white" />
            </div>
          </FilterField>
          <FilterActions />
        </div>

        <SalesOrderSection title="日志记录">
          <ModuleLogTable logs={module.logs ?? []} tableId={`${view}-logs`} />
        </SalesOrderSection>
      </div>
    );
  }

  // 默认展示面板（兜底）
  return (
    <div className="space-y-4">
      <div className={cn("grid gap-4", (module.panels?.length ?? 0) > 1 ? "xl:grid-cols-2" : "xl:grid-cols-1")}>
        {module.panels?.map((panel) => (
          <SalesOrderSection key={panel.title} title={panel.title}>
            <div className="text-[13px] text-text-3">{panel.desc}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {panel.items.map((item) => (
                <div key={item.label} className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3 shadow-card">
                  <div className="text-[12px] text-text-3">{item.label}</div>
                  <div className="mt-1 text-[14px] font-medium text-text-1">
                    {item.tone ? <StatusPill tone={item.tone}>{item.value}</StatusPill> : item.value}
                  </div>
                </div>
              ))}
            </div>
          </SalesOrderSection>
        ))}
      </div>
      {module.logs ? (
        <SalesOrderSection title="最近操作">
          <ModuleLogTable logs={module.logs} tableId={`${view}-recent`} />
        </SalesOrderSection>
      ) : null}
    </div>
  );
}

function ConfigDrawerField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <div className="mb-2 text-[13px] font-medium text-text-2">{label}</div>
      {children}
    </label>
  );
}

function ModuleFormGrid({
  fields,
  form,
  onFieldChange,
  errors,
  mode,
}: {
  fields: ModuleField[];
  form: Record<string, any>;
  onFieldChange: (key: string, value: string) => void;
  errors?: Record<string, string>;
  mode: "create" | "edit";
}) {
  const visibleFields = fields.filter((field) => isFieldVisible(field, form, mode));

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {visibleFields.map((field) => (
        <div key={field.key} className={cn(field.span === 2 && "xl:col-span-2", field.span === 4 && "xl:col-span-4")}>
          <FormField label={field.label} required={isFieldRequired(field, form, mode)}>
            {renderField(field, form[field.key], (value) => onFieldChange(field.key, value), form, mode)}
          </FormField>
          {errors?.[field.key] ? <div className="mt-1 text-xs text-danger">{errors[field.key]}</div> : null}
        </div>
      ))}
    </div>
  );
}

function renderField(field: ModuleField, value: any, onChange: (value: string) => void, form: Record<string, any>, mode: "create" | "edit") {
  const readOnly = isFieldReadOnly(field, form, mode);

  if (field.type === "select") {
    return <Select value={String(value ?? "")} onChange={onChange} options={field.options ?? []} />;
  }
  if (field.type === "date") {
    return <DateField value={String(value ?? "")} onChange={onChange} />;
  }
  if (field.type === "textarea") {
    return <TextArea value={String(value ?? "")} onChange={onChange} maxLength={field.maxLength} readOnly={readOnly} placeholder={field.placeholder} />;
  }
  return <Input value={String(value ?? "")} onChange={onChange} maxLength={field.maxLength} readOnly={readOnly} placeholder={field.placeholder} />;
}

function renderColumnValue(record: CrudRecord, column: ModuleColumn) {
  const value = record[column.key];
  return renderGenericValue(value, column.kind, record[column.toneKey ?? "statusTone"] as Tone | undefined);
}

function renderHeaderValue(record: CrudRecord, field: { key: string; kind?: "text" | "status" | "money"; toneKey?: string }) {
  return renderGenericValue(record[field.key], field.kind, record[field.toneKey ?? "statusTone"] as Tone | undefined);
}

function renderSectionValue(record: CrudRecord, item: { key: string; kind?: "text" | "status" | "money"; toneKey?: string }) {
  return renderGenericValue(record[item.key], item.kind, record[item.toneKey ?? "statusTone"] as Tone | undefined);
}

function renderGenericValue(value: unknown, kind?: "text" | "status" | "money", tone?: Tone) {
  if (kind === "status") {
    return <StatusPill tone={tone ?? "gray"}>{String(value ?? "-")}</StatusPill>;
  }
  if (kind === "money") {
    const textValue = String(value ?? "").trim();
    if (!textValue) {
      return "-";
    }
    const normalized = Number(textValue.replace(/[^\d.-]/g, ""));
    return Number.isFinite(normalized)
      ? `¥${normalized.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "-";
  }
  const text = String(value ?? "").trim();
  return text || "-";
}

function isFieldVisible(field: ModuleField, form: Record<string, any>, mode: "create" | "edit") {
  return field.visibleWhen ? field.visibleWhen({ form, mode }) : true;
}

function isFieldRequired(field: ModuleField, form: Record<string, any>, mode: "create" | "edit") {
  return field.requiredWhen ? field.requiredWhen({ form, mode }) : Boolean(field.required);
}

function isFieldReadOnly(field: ModuleField, form: Record<string, any>, mode: "create" | "edit") {
  if (field.readOnly) return true;
  if (field.readOnlyWhen?.({ form, mode })) return true;
  return Boolean(field.readOnlyInEdit && mode === "edit");
}

function EntityStatusDialog({
  singular,
  name,
  action,
  stopReason,
  stopReasonError,
  onStopReasonChange,
  onCancel,
  onConfirm,
}: {
  singular: string;
  name: string;
  action: "启用" | "停用";
  stopReason: string;
  stopReasonError: string;
  onStopReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40">
      <div className="w-[420px] rounded-xl border border-line-1 bg-white p-6 shadow-drawer">
        <div className="mb-4 text-[15px] font-semibold text-text-1">
          确认{action}：{name}
        </div>
        {action === "停用" ? (
          <div className="mb-4 space-y-1">
            <div className="text-[13px] text-text-2">停用原因 <span className="text-danger">*</span></div>
            <TextArea
              value={stopReason}
              onChange={onStopReasonChange}
              maxLength={100}
              placeholder="请填写停用原因"
            />
            {stopReasonError ? <div className="text-[12px] text-danger">{stopReasonError}</div> : null}
          </div>
        ) : (
          <div className="mb-4 text-[13px] text-text-2">启用后该{singular}可重新在新单中选择。</div>
        )}
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>取消</Button>
          <Button tone="primary" onClick={onConfirm}>确认{action}</Button>
        </div>
      </div>
    </div>
  );
}

function ModuleLogTable({ logs, tableId = "shared-logs" }: { logs: ModuleLog[]; tableId?: string }) {
  const logColumns = [
    { key: "time", width: 180, minWidth: 160 },
    { key: "user", width: 120, minWidth: 100 },
    { key: "action", width: 120, minWidth: 100 },
    { key: "detail", width: 360, minWidth: 220 },
  ];
  const { containerRef, totalWidth, getColumnStyle, startResize } = useResizableColumns(`${tableId}:logs`, logColumns);
  return (
    <div className="overflow-hidden rounded-xl border border-line-1 bg-white shadow-card">
      <div ref={containerRef} className="overflow-x-auto">
      <table className="border-collapse text-sm" style={{ minWidth: Math.max(totalWidth, TABLE_MIN_WIDTH.compact) }}>
        <thead className="bg-fill-2 text-left text-text-2">
          <tr className="h-10">
            <ResizableHeaderCell width={getColumnStyle("time").width} minWidth={getColumnStyle("time").minWidth} onResizeStart={(clientX) => startResize("time", clientX)}>时间</ResizableHeaderCell>
            <ResizableHeaderCell width={getColumnStyle("user").width} minWidth={getColumnStyle("user").minWidth} onResizeStart={(clientX) => startResize("user", clientX)}>操作人</ResizableHeaderCell>
            <ResizableHeaderCell width={getColumnStyle("action").width} minWidth={getColumnStyle("action").minWidth} onResizeStart={(clientX) => startResize("action", clientX)}>动作</ResizableHeaderCell>
            <ResizableHeaderCell width={getColumnStyle("detail").width} minWidth={getColumnStyle("detail").minWidth} className="border-r-0" onResizeStart={(clientX) => startResize("detail", clientX)}>说明</ResizableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={`${log.time}-${index}`} className="border-b border-line-1">
              <td className="border-r border-line-1 px-4 py-3 text-text-2 whitespace-nowrap" style={getColumnStyle("time")}>{log.time}</td>
              <td className="border-r border-line-1 px-4 py-3 whitespace-nowrap" style={getColumnStyle("user")}>{log.user}</td>
              <td className="border-r border-line-1 px-4 py-3 font-medium text-text-1 whitespace-nowrap" style={getColumnStyle("action")}>{log.action}</td>
              <td className="px-4 py-3 text-text-2 whitespace-nowrap" style={getColumnStyle("detail")} title={String(log.detail ?? "")}>
                <div className="overflow-hidden text-ellipsis">{log.detail}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function NoteCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line-1 bg-fill-2 px-4 py-3.5 shadow-card">
      <div className="text-[13px] leading-5 text-text-3">{label}</div>
      <div className="mt-2 text-[14px] font-normal leading-[22px] text-text-1">{value}</div>
    </div>
  );
}
