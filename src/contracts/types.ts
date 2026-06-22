import type { ViewKey } from "../app/navigation";

export type Tone = "green" | "blue" | "orange" | "red" | "gray";

export type ModuleFilter = {
  key: string;
  label: string;
  type: "search" | "batch" | "select" | "dateRange";
  placeholder?: string;
  options?: string[];
  /**
   * search / batch 类型专用：指定该筛选项精确匹配 record 的哪些字段。
   * - 未配置时，search 退化为整行模糊匹配（保留旧行为），batch 退化为匹配 code 字段。
   * - 配置后，search 对这些字段做模糊匹配（OR），batch 对这些字段做批量精确匹配（OR）。
   */
  targetFields?: string[];
};

export type ModuleColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  kind?: "text" | "status" | "money";
  toneKey?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
};

export type ModuleField = {
  key: string;
  label: string;
  type: "input" | "select" | "date" | "textarea";
  required?: boolean;
  requiredWhen?: (context: { form: Record<string, any>; mode: "create" | "edit" }) => boolean;
  options?: string[];
  span?: 1 | 2 | 4;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  readOnlyInEdit?: boolean;
  readOnly?: boolean;
  readOnlyWhen?: (context: { form: Record<string, any>; mode: "create" | "edit" }) => boolean;
  visibleWhen?: (context: { form: Record<string, any>; mode: "create" | "edit" }) => boolean;
  placeholder?: string;
  inputTransform?: (value: string) => string;
};

export type ModuleFormSection = {
  title: string;
  fields: ModuleField[];
};

export type ModuleHeaderField = {
  label: string;
  key: string;
  kind?: "text" | "status";
  toneKey?: string;
};

export type ModuleRelation = {
  type: string;
  no: string;
  status: string;
};

export type ModuleTimeline = {
  title: string;
  detail: string;
  owner: string;
  time: string;
  tone: Tone;
};

export type ModuleLog = {
  time: string;
  user: string;
  action: string;
  detail: string;
};

export type ModuleLineItem = {
  id: string;
  code: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  price: number;
  amount: number;
  note: string;
};

export type CrudRecord = {
  id: string;
  [key: string]: string | number | undefined | ModuleLineItem[] | ModuleTimeline[] | ModuleLog[] | ModuleRelation[];
  lines?: ModuleLineItem[];
  timeline?: ModuleTimeline[];
  logs?: ModuleLog[];
  relations?: ModuleRelation[];
};

export type DetailSection = {
  title: string;
  items: Array<{ label: string; key: string; kind?: "text" | "status" | "money"; toneKey?: string }>;
};

export type CrudModuleDefinition = {
  kind: "entity" | "document";
  view: ViewKey;
  storageVersion?: string;
  title: string;
  singular: string;
  listDescription: string;
  statusTabs?: string[];
  filters: ModuleFilter[];
  columns: ModuleColumn[];
  records: CrudRecord[];
  formSections: ModuleFormSection[];
  headerFields: ModuleHeaderField[];
  detailSections: DetailSection[];
  noteKeys: { external: string; internal: string };
  tags: string[];
  counterpartyLabel?: string;
  transformForm?: (params: {
    form: Record<string, any>;
    key: string;
    value: string;
    mode: "create" | "edit";
    sourceRecord?: CrudRecord | null;
  }) => Record<string, any>;
  validateForm?: (params: {
    form: Record<string, any>;
    mode: "create" | "edit";
    sourceRecord?: CrudRecord | null;
    module: CrudModuleDefinition;
  }) => Record<string, string>;
  beforeSave?: (params: {
    record: CrudRecord;
    mode: "create" | "edit";
    sourceRecord?: CrudRecord | null;
    module: CrudModuleDefinition;
  }) => CrudRecord;
};

export type QueryMetric = {
  label: string;
  value: string;
  tone?: Tone;
};

export type QueryModuleDefinition = {
  kind: "query";
  view: ViewKey;
  title: string;
  listDescription: string;
  filters: ModuleFilter[];
  metrics: QueryMetric[];
  columns: ModuleColumn[];
  rows: Array<Record<string, string>>;
};

export type FormModuleDefinition = {
  kind: "form";
  view: ViewKey;
  title: string;
  description: string;
  sections: ModuleFormSection[];
  sideSummary: Array<{ label: string; value: string }>;
};

export type ConfigModuleDefinition = {
  kind: "config";
  view: ViewKey;
  title: string;
  description: string;
  userColumns?: ModuleColumn[];
  users?: Array<Record<string, string>>;
  roleColumns?: ModuleColumn[];
  roles?: Array<Record<string, string>>;
  panels?: Array<{
    title: string;
    desc: string;
    items: Array<{ label: string; value: string; tone?: Tone; editable?: boolean }>;
  }>;
  ruleColumns?: ModuleColumn[];
  rules?: Array<Record<string, string>>;
  templateColumns?: ModuleColumn[];
  templates?: Array<Record<string, string>>;
  logs?: ModuleLog[];
};

export type ModuleDefinition =
  | CrudModuleDefinition
  | QueryModuleDefinition
  | FormModuleDefinition
  | ConfigModuleDefinition;
