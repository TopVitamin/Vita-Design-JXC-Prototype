import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, DateField, FilterActions, FilterField, FormField, HintBox, Input, PageTitle, Pagination, SearchInput, Select, StatusPill, TabBar, TableSortHeader, TextArea } from "../components/Ui";
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
    <div className="flex flex-col">
      {module.statusTabs ? (
        <TabBar
          items={module.statusTabs.map((tab) => ({ key: tab, label: tab }))}
          activeKey={activeTab}
          onChange={(tab) => startTransition(() => setActiveTab(tab))}
        />
      ) : null}

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line-1 bg-[rgba(247,248,250,0.5)] px-4 py-3.5 text-[13px]">
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
                  <th key={column.key} className={cn("border-b border-line-1 px-4", column.align === "right" && "text-right")}>
                    <TableSortHeader
                      label={column.label}
                      sortKey={column.key}
                      currentSort={sortConfig}
                      onSort={handleSort}
                      align={column.align === "right" ? "right" : "left"}
                    />
                  </th>
                ))}
                <th className="border-b border-line-1 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((record) => (
                <tr key={record.id} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-[#fafcff]">
                  {module.columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-2.5", column.align === "right" && "text-right")}>
                      {renderColumnValue(record, column)}
                    </td>
                  ))}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}`)}>详情</Button>
                      <Button size="sm" onClick={() => navigate(`/${view}/${record.id}/edit`)}>修改</Button>
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
  const deferredKeyword = useDeferredValue(keyword);

  if (!module || !queryModuleViews.includes(view)) return null;

  const filteredRows = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    if (!normalized) return module.rows;
    return module.rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(normalized));
  }, [deferredKeyword, module.rows]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line-1 bg-[rgba(247,248,250,0.5)] px-4 py-3.5 text-[13px]">
        {module.filters.map((filter) => (
          <FilterItem key={filter.key} filter={filter} keyword={keyword} onKeywordChange={setKeyword} value="" onValueChange={() => {}} />
        ))}
        <FilterActions onSecondaryClick={() => setKeyword("")} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <Button>导出</Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-line-1 shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] border-collapse text-sm lg:min-w-full">
            <thead className="bg-fill-2 text-left text-text-2">
              <tr className="h-[44px]">
                {module.columns.map((column) => (
                  <th key={column.key} className={cn("border-b border-line-1 px-4", column.align === "right" && "text-right")}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={`${index}-${row[module.columns[0].key]}`} className="h-[44px] border-b border-line-1 text-text-2 hover:bg-[#fafcff]">
                  {module.columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-2.5", column.align === "right" && "text-right")}>
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
  if (!module || !configModuleViews.includes(view)) return null;

  return (
    <div className="space-y-4">
      <PageTitle title={module.title}>{module.description}</PageTitle>
      <div className={cn("grid gap-4", module.panels.length > 1 ? "xl:grid-cols-2" : "xl:grid-cols-1")}>
        {module.panels.map((panel) => (
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

function FilterItem({
  filter,
  keyword,
  onKeywordChange,
  value,
  onValueChange,
}: {
  filter: ModuleFilter;
  keyword: string;
  onKeywordChange: (value: string) => void;
  value: string;
  onValueChange: (value: string) => void;
}) {
  if (filter.type === "search") {
    return (
      <FilterField label={filter.label} className="min-w-[220px]">
        <SearchInput value={keyword} onChange={onKeywordChange} placeholder={filter.placeholder ?? "搜索"} className="w-[220px] bg-white" />
      </FilterField>
    );
  }

  if (filter.type === "select") {
    return (
      <FilterField label={filter.label} className="min-w-[180px]">
        <div className="w-[180px]">
          <Select value={value} onChange={onValueChange} options={filter.options ?? []} placeholder={filter.label} className="bg-white" />
        </div>
      </FilterField>
    );
  }

  return (
    <FilterField label={filter.label} className="min-w-[260px]">
      <div className="grid grid-cols-2 gap-2">
        <DateField value="" onChange={() => {}} className="bg-white" />
        <DateField value="" onChange={() => {}} className="bg-white" />
      </div>
    </FilterField>
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

function compareRecord(
  a: CrudRecord,
  b: CrudRecord,
  sortConfig: { key: string; direction: "asc" | "desc" } | null,
) {
  if (!sortConfig) return 0;
  const { key, direction } = sortConfig;
  const factor = direction === "asc" ? 1 : -1;
  const valueA = normalizeSortValue(a[key]);
  const valueB = normalizeSortValue(b[key]);
  if (valueA < valueB) return -1 * factor;
  if (valueA > valueB) return 1 * factor;
  return 0;
}

function normalizeSortValue(value: unknown) {
  if (typeof value === "number") return value;
  const text = String(value ?? "");
  const money = Number(text.replace(/[^0-9.-]+/g, ""));
  if (text.includes("¥") && Number.isFinite(money)) return money;
  const time = new Date(text.replace(/\./g, "/")).getTime();
  if (Number.isFinite(time) && /[-/:]/.test(text)) return time;
  return text.toLowerCase();
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
