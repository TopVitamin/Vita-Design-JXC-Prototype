import { startTransition, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, DateField, FilterActions, FilterField, FormField, HintBox, Input, PageTitle, Pagination, SearchInput, Select, StatusPill, TabBar, TableSortHeader, TextArea } from "../components/Ui";
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
  type ConfigModuleDefinition,
  type CrudModuleDefinition,
  type CrudRecord,
  type FormModuleDefinition,
  type ModuleColumn,
  type ModuleField,
  type ModuleFilter,
  type QueryModuleDefinition,
  type Tone,
} from "../data/modulePages";
import type { ViewKey } from "../data/mock";
import { cn } from "../utils/cn";
import { compareRecord, normalizeSortValue } from "../utils/sort";

export function GenericCrudListPage({ view }: { view: ViewKey }) {
  const navigate = useNavigate();
  const module = getCrudModuleDefinition(view);
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState(module?.statusTabs?.[0] ?? "全部单据");
  const [selectFilters, setSelectFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredKeyword = useDeferredValue(keyword);

  if (!module) return null;

  const filteredRows = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    return module.records.filter((record) => {
      const rowText = Object.values(record)
        .filter((value) => typeof value === "string" || typeof value === "number")
        .join(" ")
        .toLowerCase();

      if (normalized && !rowText.includes(normalized)) {
        return false;
      }

      if (module.statusTabs && activeTab !== module.statusTabs[0] && record.status !== activeTab) {
        return false;
      }

      for (const [key, value] of Object.entries(selectFilters)) {
        if (!value || value.startsWith("全部")) continue;
        if (String(record[key] ?? "") !== value) return false;
      }

      return true;
    }).sort((a, b) => compareRecord(a, b, sortConfig));
  }, [activeTab, deferredKeyword, module.records, module.statusTabs, selectFilters, sortConfig]);

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
            keyword={keyword}
            onKeywordChange={setKeyword}
            value={selectFilters[filter.key] ?? ""}
            onValueChange={(value) => setSelectFilters((current) => ({ ...current, [filter.key]: value }))}
          />
        ))}
        <FilterActions onSecondaryClick={() => { setKeyword(""); setSelectFilters({}); }} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button tone="primary" onClick={() => navigate(`/${view}/new`)}>新增{module.singular}</Button>
          <Button>导出</Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-line-1 shadow-soft">
          <div className="overflow-x-auto">
          <table className="min-w-[1100px] border-collapse text-sm lg:min-w-full">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                {module.columns.map((column) => (
                  <th key={column.key} className={cn("border-b border-r border-line-1 px-4", column.align === "right" && "text-right")}>
                    <TableSortHeader
                      label={column.label}
                      sortKey={column.key}
                      currentSort={sortConfig}
                      onSort={handleSort}
                      align={column.align === "right" ? "right" : "left"}
                    />
                  </th>
                ))}
                <th className="min-w-[120px] whitespace-nowrap border-b border-line-1 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((record) => (
                <tr key={record.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                  {module.columns.map((column) => (
                    <td key={column.key} className={cn("border-r border-line-1 px-4", column.align === "right" && "text-right")}>
                      {renderColumnValue(record, column)}
                    </td>
                  ))}
                  <td className="min-w-[120px] whitespace-nowrap px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}`)}>详情</Button>
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}/edit`)}>编辑</Button>
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
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(sourceRecord ?? {});
    setMessage(null);
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

  const lines = (form.lines as any[] | undefined) ?? [];
  const totalQty = lines.reduce((sum, item) => sum + Number(item.qty ?? 0), 0);
  const totalAmount = lines.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  const updateField = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
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
    setMessage("已新增一行明细。");
  };

  const removeLine = (lineId: string) => {
    setForm((current) => ({
      ...current,
      lines: (current.lines ?? []).filter((item: any) => item.id !== lineId),
    }));
  };

  const handleSave = () => {
    setMessage(`${module.singular}已保存。`);
  };

  return (
    <div className="space-y-4">
      <PageTitle title={mode === "create" ? `新增${module.singular}` : `编辑${module.singular}`} />
      {message ? <HintBox>{message}</HintBox> : null}

      <div className="space-y-4">
        {module.formSections.map((section) => (
          <SalesOrderSection key={section.title} title={section.title}>
            <ModuleFormGrid fields={section.fields} form={form} onFieldChange={updateField} />
          </SalesOrderSection>
        ))}

        {module.kind === "document" ? (
          <SalesOrderSection title="明细信息">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button tone="primary" size="sm" onClick={addLine}>新增空行</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] border-collapse text-sm lg:min-w-full">
                  <thead className="bg-fill-2 text-left text-text-2">
                    <tr className="h-[42px]">
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

      <div className="flex flex-col gap-3 border-t border-line-1 pt-4 sm:flex-row sm:justify-end">
        <Button tone="primary" onClick={handleSave}>保存</Button>
        <Button onClick={() => navigate(`/${view}`)}>返回列表</Button>
      </div>
    </div>
  );
}

export function GenericCrudDetailPage({ view }: { view: ViewKey }) {
  const navigate = useNavigate();
  const { recordId = "" } = useParams();
  const module = getCrudModuleDefinition(view);
  const record = getCrudModuleRecord(view, recordId);
  const [activeTab, setActiveTab] = useState(module?.kind === "document" ? "detail" : "profile");

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
        title={`${module.title}详情`}
        actions={
          <>
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
        activeKey={activeTab as any}
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
                <table className="min-w-[980px] border-collapse text-sm lg:min-w-full">
                  <thead className="bg-fill-2 text-left text-text-2">
                    <tr className="h-[42px]">
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
          <ModuleLogTable logs={(record.logs ?? []) as any[]} />
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
                {((record.relations ?? []) as any[]).map((item, index) => (
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

  const filteredRows = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    let rows = module.rows;

    // 关键词过滤
    if (normalized) {
      rows = rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(normalized));
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
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] border-collapse text-sm lg:min-w-full">
              <thead className="bg-fill-2 text-left text-text-2">
                <tr className="h-[44px]">
                  {module.columns.map((column) => (
                    <th key={column.key} className={cn("border-b border-r border-line-1 px-4", column.align === "right" && "text-right")}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={`${index}-${row[module.columns[0].key]}`} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                    {module.columns.map((column) => (
                      <td key={column.key} className={cn("border-r border-line-1 px-4", column.align === "right" && "text-right", column.kind === "status" && "min-w-[100px] whitespace-nowrap")}>
                        {renderGenericValue(row[column.key], column.kind, row[column.toneKey ?? "tone"] as Tone | undefined)}
                      </td>
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
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!module) return;
    const defaults = Object.fromEntries(module.sections.flatMap((section) => section.fields.map((field) => [field.key, ""])));
    setForm(defaults);
    setMessage(null);
  }, [module]);

  if (!module || !formModuleViews.includes(view)) return null;

  return (
    <div className="space-y-4">
      <PageTitle title={module.title}>{module.description}</PageTitle>
      {message ? <HintBox>{message}</HintBox> : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {module.sections.map((section) => (
            <SalesOrderSection key={section.title} title={section.title}>
              <ModuleFormGrid fields={section.fields} form={form} onFieldChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} />
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
      <div className="flex flex-col gap-3 border-t border-line-1 pt-4 sm:flex-row sm:justify-end">
        <Button tone="primary" onClick={() => setMessage(`${module.title}已保存。`)}>保存</Button>
        <Button onClick={() => navigate(`/${view}`)}>返回列表</Button>
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
              <div className="overflow-x-auto">
                <table className="min-w-[900px] border-collapse text-sm lg:min-w-full">
                  <thead className="bg-fill-2 text-left text-text-2">
                    <tr className="h-[44px]">
                      <th className="border-b border-r border-line-1 px-4">用户名</th>
                      <th className="border-b border-r border-line-1 px-4">姓名</th>
                      <th className="border-b border-r border-line-1 px-4">角色</th>
                      <th className="border-b border-r border-line-1 px-4">部门</th>
                      <th className="border-b border-r border-line-1 px-4">状态</th>
                      <th className="border-b border-r border-line-1 px-4">最后登录</th>
                      <th className="min-w-[120px] whitespace-nowrap border-b border-line-1 px-4 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {module.users?.map((user) => (
                      <tr key={user.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                        <td className="border-r border-line-1 px-4 text-brand-6">{user.username}</td>
                        <td className="border-r border-line-1 px-4 text-text-1">{user.name}</td>
                        <td className="border-r border-line-1 px-4">
                          <StatusPill tone={(user.roleTone as Tone) ?? "gray"}>{user.role}</StatusPill>
                        </td>
                        <td className="border-r border-line-1 px-4">{user.department}</td>
                        <td className="border-r border-line-1 px-4">
                          <StatusPill tone={(user.statusTone as Tone) ?? "gray"}>{user.status}</StatusPill>
                        </td>
                        <td className="border-r border-line-1 px-4">{user.lastLogin}</td>
                        <td className="min-w-[120px] whitespace-nowrap px-4">
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
              <div className="overflow-x-auto">
                <table className="min-w-[700px] border-collapse text-sm lg:min-w-full">
                  <thead className="bg-fill-2 text-left text-text-2">
                    <tr className="h-[44px]">
                      <th className="border-b border-r border-line-1 px-4">角色名称</th>
                      <th className="border-b border-r border-line-1 px-4">角色编码</th>
                      <th className="border-b border-r border-line-1 px-4">用户数</th>
                      <th className="border-b border-r border-line-1 px-4">说明</th>
                      <th className="min-w-[120px] whitespace-nowrap border-b border-line-1 px-4 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {module.roles?.map((role) => (
                      <tr key={role.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                        <td className="border-r border-line-1 px-4 font-medium text-text-1">{role.roleName}</td>
                        <td className="border-r border-line-1 px-4">{role.roleCode}</td>
                        <td className="border-r border-line-1 px-4">{role.userCount}</td>
                        <td className="border-r border-line-1 px-4">{role.description}</td>
                        <td className="min-w-[120px] whitespace-nowrap px-4">
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
            <ModuleLogTable logs={module.logs} />
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
            <div className="overflow-x-auto">
              <table className="min-w-[800px] border-collapse text-sm lg:min-w-full">
                <thead className="bg-fill-2 text-left text-text-2">
                  <tr className="h-[44px]">
                    <th className="border-b border-r border-line-1 px-4">单据类型</th>
                    <th className="border-b border-r border-line-1 px-4">前缀</th>
                    <th className="border-b border-r border-line-1 px-4">日期格式</th>
                    <th className="border-b border-r border-line-1 px-4">序号位数</th>
                    <th className="border-b border-r border-line-1 px-4">重置方式</th>
                    <th className="border-b border-r border-line-1 px-4">状态</th>
                    <th className="min-w-[100px] whitespace-nowrap border-b border-line-1 px-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {module.rules?.map((rule) => (
                    <tr key={rule.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                      <td className="border-r border-line-1 px-4 font-medium text-text-1">{rule.docType}</td>
                      <td className="border-r border-line-1 px-4">{rule.prefix}</td>
                      <td className="border-r border-line-1 px-4">{rule.dateFormat}</td>
                      <td className="border-r border-line-1 px-4">{rule.sequence}</td>
                      <td className="border-r border-line-1 px-4">{rule.resetType}</td>
                      <td className="border-r border-line-1 px-4">
                        <StatusPill tone={(rule.statusTone as Tone) ?? "gray"}>{rule.status}</StatusPill>
                      </td>
                      <td className="min-w-[100px] whitespace-nowrap px-4">
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
            <ModuleLogTable logs={module.logs} />
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
          <ModuleLogTable logs={module.logs ?? []} />
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
            <div className="overflow-x-auto">
              <table className="min-w-[700px] border-collapse text-sm lg:min-w-full">
                <thead className="bg-fill-2 text-left text-text-2">
                  <tr className="h-[44px]">
                    <th className="border-b border-r border-line-1 px-4">单据类型</th>
                    <th className="border-b border-r border-line-1 px-4">模板名称</th>
                    <th className="border-b border-r border-line-1 px-4">纸张尺寸</th>
                    <th className="border-b border-r border-line-1 px-4">默认模板</th>
                    <th className="border-b border-r border-line-1 px-4">更新时间</th>
                    <th className="min-w-[120px] whitespace-nowrap border-b border-line-1 px-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {module.templates?.map((tpl) => (
                    <tr key={tpl.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-hover">
                      <td className="border-r border-line-1 px-4 font-medium text-text-1">{tpl.docType}</td>
                      <td className="border-r border-line-1 px-4">{tpl.templateName}</td>
                      <td className="border-r border-line-1 px-4">{tpl.paperSize}</td>
                      <td className="border-r border-line-1 px-4">
                        <StatusPill tone={(tpl.isDefaultTone as Tone) ?? "gray"}>{tpl.isDefault}</StatusPill>
                      </td>
                      <td className="border-r border-line-1 px-4">{tpl.updatedAt}</td>
                      <td className="min-w-[120px] whitespace-nowrap px-4">
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
            <ModuleLogTable logs={module.logs} />
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
          <ModuleLogTable logs={module.logs ?? []} />
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
          <ModuleLogTable logs={module.logs} />
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
}: {
  fields: ModuleField[];
  form: Record<string, any>;
  onFieldChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {fields.map((field) => (
        <div key={field.key} className={cn(field.span === 2 && "xl:col-span-2", field.span === 4 && "xl:col-span-4")}>
          <FormField label={field.label} required={field.required}>
            {renderField(field, form[field.key], (value) => onFieldChange(field.key, value))}
          </FormField>
        </div>
      ))}
    </div>
  );
}

function renderField(field: ModuleField, value: any, onChange: (value: string) => void) {
  if (field.type === "select") {
    return <Select value={String(value ?? "")} onChange={onChange} options={field.options ?? []} />;
  }
  if (field.type === "date") {
    return <DateField value={String(value ?? "")} onChange={onChange} />;
  }
  if (field.type === "textarea") {
    return <TextArea value={String(value ?? "")} onChange={onChange} />;
  }
  return <Input value={String(value ?? "")} onChange={onChange} />;
}

function renderColumnValue(record: CrudRecord, column: ModuleColumn) {
  const value = record[column.key];
  return renderGenericValue(value, column.kind, record[column.toneKey ?? "statusTone"] as Tone | undefined);
}

function renderHeaderValue(record: CrudRecord, field: { key: string; kind?: "text" | "status"; toneKey?: string }) {
  return renderGenericValue(record[field.key], field.kind, record[field.toneKey ?? "statusTone"] as Tone | undefined);
}

function renderSectionValue(record: CrudRecord, item: { key: string; kind?: "text" | "status"; toneKey?: string }) {
  return renderGenericValue(record[item.key], item.kind, record[item.toneKey ?? "statusTone"] as Tone | undefined);
}

function renderGenericValue(value: unknown, kind?: "text" | "status" | "money", tone?: Tone) {
  if (kind === "status") {
    return <StatusPill tone={tone ?? "gray"}>{String(value ?? "-")}</StatusPill>;
  }
  return String(value ?? "-");
}

function ModuleLogTable({ logs }: { logs: any[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-1 bg-white shadow-card">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-fill-2 text-left text-text-2">
          <tr className="h-10">
            <th className="border-b border-line-1 px-4">时间</th>
            <th className="border-b border-line-1 px-4">操作人</th>
            <th className="border-b border-line-1 px-4">动作</th>
            <th className="border-b border-line-1 px-4">说明</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={`${log.time}-${index}`} className="border-b border-line-1">
              <td className="px-4 py-3 text-text-2">{log.time}</td>
              <td className="px-4 py-3">{log.user}</td>
              <td className="px-4 py-3 font-medium text-text-1">{log.action}</td>
              <td className="px-4 py-3 text-text-2">{log.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
