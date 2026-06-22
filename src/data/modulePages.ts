import type { ViewKey } from "../app/navigation";
import type {
  ConfigModuleDefinition,
  CrudModuleDefinition,
  CrudRecord,
  FormModuleDefinition,
  ModuleDefinition,
  QueryModuleDefinition,
} from "../contracts/types";
import { customerManagementModuleDefinition } from "../contracts/modules/customerManagement";
import { documentNumberModuleDefinition } from "../contracts/modules/documentNumber";
import { inventoryBalanceModuleDefinition } from "../contracts/modules/inventoryBalance";
import { openingInitModuleDefinition } from "../contracts/modules/openingInit";
import { operationLogModuleDefinition } from "../contracts/modules/operationLog";
import { payableQueryModuleDefinition } from "../contracts/modules/payableQuery";
import { printTemplateModuleDefinition } from "../contracts/modules/printTemplate";
import { purchaseOrdersModuleDefinition } from "../contracts/modules/purchaseOrders";
import { purchaseReceiptModuleDefinition } from "../contracts/modules/purchaseReceipt";
import { purchaseReturnModuleDefinition } from "../contracts/modules/purchaseReturn";
import { receivableQueryModuleDefinition } from "../contracts/modules/receivableQuery";
import { salesDeliveryModuleDefinition } from "../contracts/modules/salesDelivery";
import { salesQueryModuleDefinition } from "../contracts/modules/salesQuery";
import { salesSummaryModuleDefinition } from "../contracts/modules/salesSummary";
import { productManagementModuleDefinition } from "../contracts/modules/productManagement";
import { stockCountModuleDefinition } from "../contracts/modules/stockCount";
import { stockLossModuleDefinition } from "../contracts/modules/stockLoss";
import { stockTransferModuleDefinition } from "../contracts/modules/stockTransfer";
import { supplierManagementModuleDefinition } from "../contracts/modules/supplierManagement";
import { userPermissionModuleDefinition } from "../contracts/modules/userPermission";
import { warehouseManagementModuleDefinition } from "../contracts/modules/warehouseManagement";

export type {
  ConfigModuleDefinition,
  CrudModuleDefinition,
  CrudRecord,
  FormModuleDefinition,
  ModuleColumn,
  ModuleField,
  ModuleFilter,
  QueryModuleDefinition,
  Tone,
} from "../contracts/types";
export const crudModuleDefinitions: Record<string, CrudModuleDefinition> = {
  "product-management": productManagementModuleDefinition,
  "customer-management": customerManagementModuleDefinition,
  "supplier-management": supplierManagementModuleDefinition,
  "warehouse-management": warehouseManagementModuleDefinition,
};

export const documentCrudModuleDefinitions: Record<string, CrudModuleDefinition> = {
  "sales-delivery": salesDeliveryModuleDefinition,
  "purchase-orders": purchaseOrdersModuleDefinition,
  "purchase-receipt": purchaseReceiptModuleDefinition,
  "purchase-return": purchaseReturnModuleDefinition,
  "stock-transfer": stockTransferModuleDefinition,
  "stock-count": stockCountModuleDefinition,
  "stock-loss": stockLossModuleDefinition,
};

export const queryModuleDefinitions: Record<string, QueryModuleDefinition> = {
  "sales-query": salesQueryModuleDefinition,
  "receivable-query": receivableQueryModuleDefinition,
  "payable-query": payableQueryModuleDefinition,
  "sales-summary": salesSummaryModuleDefinition,
  "inventory-balance": inventoryBalanceModuleDefinition,
};

export const formModuleDefinitions: Record<string, FormModuleDefinition> = {
  };

export const configModuleDefinitions: Record<string, ConfigModuleDefinition> = {
  "user-permission": userPermissionModuleDefinition,
  "document-number": documentNumberModuleDefinition,
  "opening-init": openingInitModuleDefinition,
  "print-template": printTemplateModuleDefinition,
  "operation-log": operationLogModuleDefinition,
};

export const allModuleDefinitions: Record<string, ModuleDefinition> = {
  ...crudModuleDefinitions,
  ...documentCrudModuleDefinitions,
  ...queryModuleDefinitions,
  ...formModuleDefinitions,
  ...configModuleDefinitions,
};

export const crudModuleViews = Object.keys({ ...crudModuleDefinitions, ...documentCrudModuleDefinitions }) as ViewKey[];
export const queryModuleViews = Object.keys(queryModuleDefinitions) as ViewKey[];
export const formModuleViews = Object.keys(formModuleDefinitions) as ViewKey[];
export const configModuleViews = Object.keys(configModuleDefinitions) as ViewKey[];

const CRUD_STORAGE_KEY = "jxc-prototype-crud-records";
const allCrudModuleDefinitions = { ...crudModuleDefinitions, ...documentCrudModuleDefinitions } as Record<string, CrudModuleDefinition>;

function cloneRecord<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readCrudStorage(): Record<string, CrudRecord[]> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(CRUD_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CrudRecord[]>) : {};
  } catch {
    return {};
  }
}

function writeCrudStorage(storage: Record<string, CrudRecord[]>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CRUD_STORAGE_KEY, JSON.stringify(storage));
}

function getNowLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getCrudStorageSlot(view: ViewKey) {
  const module = allCrudModuleDefinitions[view];
  const version = module?.storageVersion ?? "v1";
  return `${view}::${version}`;
}

function getCrudRecords(view: ViewKey, fallback?: CrudRecord[]) {
  const storage = readCrudStorage();
  const storedRecords = storage[getCrudStorageSlot(view)];
  if (storedRecords) {
    return cloneRecord(storedRecords);
  }
  return cloneRecord(fallback ?? allCrudModuleDefinitions[view]?.records ?? []);
}

function persistCrudRecords(view: ViewKey, records: CrudRecord[]) {
  const storage = readCrudStorage();
  storage[getCrudStorageSlot(view)] = cloneRecord(records);
  writeCrudStorage(storage);
}

function buildEmptyDraft(module: CrudModuleDefinition, view: ViewKey): CrudRecord {
  const draft = Object.fromEntries(
    module.formSections.flatMap((section) =>
      section.fields.map((field) => {
        if (field.key === "status") {
          return [field.key, module.kind === "entity" ? "启用" : "草稿"];
        }
        return [field.key, ""];
      }),
    ),
  ) as CrudRecord;

  draft.id = `${view}-draft-${Date.now()}`;

  if (module.kind === "entity") {
    draft.status = "启用";
    draft.statusTone = "green";
    draft.stopReason = "";
  } else {
    draft.status = "草稿";
    draft.statusTone = "gray";
    draft.lines = [];
    draft.timeline = [
      {
        title: "草稿创建",
        detail: `已创建${module.singular}草稿。`,
        owner: "当前用户",
        time: getNowLabel(),
        tone: "gray",
      },
    ];
  }

  draft.logs = [
    {
      time: getNowLabel(),
      user: "当前用户",
      action: "创建草稿",
      detail: `创建${module.singular}草稿。`,
    },
  ];

  if (!(module.noteKeys.external in draft)) {
    draft[module.noteKeys.external] = "";
  }
  if (!(module.noteKeys.internal in draft)) {
    draft[module.noteKeys.internal] = "";
  }

  return draft;
}

export function getModuleDefinition(view: ViewKey) {
  return allModuleDefinitions[view];
}

export function getCrudModuleDefinition(view: ViewKey) {
  const module = allCrudModuleDefinitions[view];
  if (!module) return undefined;
  return {
    ...module,
    records: getCrudRecords(view, module.records),
  };
}

export function getCrudModuleRecord(view: ViewKey, id: string) {
  const module = getCrudModuleDefinition(view);
  if (!module) return null;
  const record = module.records.find((item) => item.id === id);
  return record ? JSON.parse(JSON.stringify(record)) as CrudRecord : null;
}

export function createCrudModuleDraft(view: ViewKey) {
  const module = getCrudModuleDefinition(view);
  if (!module) return null;
  return buildEmptyDraft(module, view);
}

export function saveCrudModuleRecord(view: ViewKey, record: CrudRecord, mode: "create" | "edit") {
  const module = getCrudModuleDefinition(view);
  if (!module) return null;

  const records = getCrudRecords(view, module.records);
  const now = getNowLabel();
  const nextRecord = module.beforeSave
    ? cloneRecord(module.beforeSave({ record: cloneRecord(record), mode, sourceRecord: mode === "edit" ? getCrudModuleRecord(view, String(record.id ?? "")) : null, module }))
    : cloneRecord(record);
  const isEntity = module.kind === "entity";

  if (mode === "create") {
    nextRecord.id = `${view}-${Date.now()}`;
    if (isEntity && !nextRecord.status) {
      nextRecord.status = "启用";
      nextRecord.statusTone = "green";
    }
    if (!("createdAt" in nextRecord) || !nextRecord.createdAt) {
      nextRecord.createdAt = now;
    }
    if (!("createdBy" in nextRecord) || !nextRecord.createdBy) {
      nextRecord.createdBy = "当前用户";
    }
  }

  nextRecord.updatedAt = now;
  nextRecord.updatedBy = "当前用户";

  const nextLogs = (nextRecord.logs ?? []).slice();
  nextLogs.unshift({
    time: now,
    user: "当前用户",
    action: mode === "create" ? "保存" : "更新",
    detail: mode === "create" ? `新增${module.singular}。` : `更新${module.singular}信息。`,
  });
  nextRecord.logs = nextLogs;

  const nextRecords =
    mode === "create"
      ? [nextRecord, ...records]
      : records.map((item) => (item.id === nextRecord.id ? nextRecord : item));

  persistCrudRecords(view, nextRecords);
  return cloneRecord(nextRecord);
}
