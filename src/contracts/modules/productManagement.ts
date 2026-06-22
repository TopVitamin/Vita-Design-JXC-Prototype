import type { CrudModuleDefinition, CrudRecord } from "../types";
import { buildEntityModule, buildLogs, entityStatusOptions, stripEntityRelations } from "./shared";

const productCategoryOptions = ["采集设备", "打印设备", "打印耗材", "仓储辅料", "门店设备"];
const productUnitOptions = ["件", "盒", "套", "包"];
const productCodePattern = /^[A-Z0-9-]{2,30}$/;
const productBarcodePattern = /^[A-Za-z0-9]{1,30}$/;
const nonNegativeMoneyPattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
const sanitizeProductCode = (value: string) => value.replace(/[^A-Z0-9-]/g, "");

function buildProductRecord(base: CrudRecord): CrudRecord {
  return {
    ...base,
    statusTone: base.status === "启用" ? "green" : "gray",
    logs: buildLogs("商品"),
  };
}

const productRecords: CrudRecord[] = stripEntityRelations([
  buildProductRecord({
    id: "product-001",
    code: "SKU-0001",
    name: "便携扫码枪",
    category: "采集设备",
    specModel: "无线版",
    salesUnit: "件",
    barcode: "SCAN0001",
    retailPrice: "399.00",
    wholesalePrice: "299.00",
    purchasePrice: "238.00",
    remark: "批发和零售共用商品，主打门店快速开单。",
    stopReason: "",
    status: "启用",
    createdBy: "王晨",
    createdAt: "2026-04-10 09:18:22",
    updatedBy: "李菲",
    updatedAt: "2026-04-19 10:22:16",
    codeLocked: "true",
  }),
  buildProductRecord({
    id: "product-002",
    code: "SKU-0002",
    name: "热敏标签机",
    category: "打印设备",
    specModel: "桌面款",
    salesUnit: "件",
    barcode: "PRINT0002",
    retailPrice: "999.00",
    wholesalePrice: "899.00",
    purchasePrice: "735.00",
    remark: "门店打印场景常用设备。",
    stopReason: "",
    status: "启用",
    createdBy: "王晨",
    createdAt: "2026-04-11 11:08:02",
    updatedBy: "周曼",
    updatedAt: "2026-04-19 09:45:20",
    codeLocked: "",
  }),
  buildProductRecord({
    id: "product-003",
    code: "SKU-0003",
    name: "标签打印纸",
    category: "打印耗材",
    specModel: "100mm*50mm",
    salesUnit: "盒",
    barcode: "PAPER0003",
    retailPrice: "0",
    wholesalePrice: "18.00",
    purchasePrice: "12.50",
    remark: "零售价允许为0，门店通常以组合商品形式销售。",
    stopReason: "",
    status: "启用",
    createdBy: "管理员",
    createdAt: "2026-04-08 14:22:10",
    updatedBy: "管理员",
    updatedAt: "2026-04-19 08:18:33",
    codeLocked: "true",
  }),
  buildProductRecord({
    id: "product-004",
    code: "SKU-0004",
    name: "仓储周转箱",
    category: "仓储辅料",
    specModel: "600*400 蓝色",
    salesUnit: "件",
    barcode: "",
    retailPrice: "",
    wholesalePrice: "62.00",
    purchasePrice: "48.00",
    remark: "纯批发和仓内周转使用，条码可为空。",
    stopReason: "",
    status: "启用",
    createdBy: "管理员",
    createdAt: "2026-04-06 16:18:00",
    updatedBy: "王晨",
    updatedAt: "2026-04-18 17:36:10",
    codeLocked: "",
  }),
  buildProductRecord({
    id: "product-005",
    code: "SKU-0005",
    name: "蓝牙打印机",
    category: "门店设备",
    specModel: "移动版",
    salesUnit: "件",
    barcode: "STORE0005",
    retailPrice: "799.00",
    wholesalePrice: "699.00",
    purchasePrice: "560.00",
    remark: "门店移动打印设备，历史上曾停用过一次。",
    stopReason: "旧批次停售，已由新型号替代。",
    status: "停用",
    createdBy: "管理员",
    createdAt: "2026-04-05 13:40:15",
    updatedBy: "李菲",
    updatedAt: "2026-04-19 11:12:48",
    codeLocked: "true",
  }),
]);

export const productManagementModuleDefinition: CrudModuleDefinition = buildEntityModule({
  storageVersion: "v2-20260419",
  view: "product-management",
  title: "商品管理",
  singular: "商品",
  listDescription: "维护商品识别口径、规格信息和价格信息。",
  filters: [
    { key: "code", label: "商品编码", type: "batch", placeholder: "可批量，精确匹配", targetFields: ["code"] },
    { key: "barcode", label: "条码", type: "batch", placeholder: "可批量，精确匹配", targetFields: ["barcode"] },
    { key: "name", label: "商品名称", type: "search", placeholder: "按商品名称模糊搜索", targetFields: ["name", "specModel"] },
    { key: "category", label: "商品分类", type: "select", options: ["全部", ...productCategoryOptions] },
    { key: "status", label: "状态", type: "select", options: entityStatusOptions },
  ],
  columns: [
    { key: "code", label: "商品编码" },
    { key: "name", label: "商品名称" },
    { key: "category", label: "商品分类" },
    { key: "specModel", label: "规格型号" },
    { key: "salesUnit", label: "销售单位", width: 110, minWidth: 100 },
    { key: "wholesalePrice", label: "默认批发价", align: "right", kind: "money", width: 140, minWidth: 130 },
    { key: "retailPrice", label: "默认零售价", align: "right", kind: "money", width: 140, minWidth: 130 },
    { key: "status", label: "状态", kind: "status", toneKey: "statusTone", width: 110, minWidth: 100 },
    { key: "updatedAt", label: "最后修改时间", width: 180, minWidth: 170 },
  ],
  records: productRecords,
  formSections: [
    {
      title: "基础资料",
      fields: [
        {
          key: "code",
          label: "商品编码",
          type: "input",
          required: true,
          minLength: 2,
          maxLength: 30,
          pattern: productCodePattern,
          patternMessage: "商品编码只允许大写字母、数字和连字符（-）",
          inputTransform: sanitizeProductCode,
          readOnlyWhen: ({ form, mode }) => mode === "edit" && String(form.codeLocked ?? "") === "true",
        },
        { key: "name", label: "商品名称", type: "input", required: true, maxLength: 50, inputTransform: (value) => value.replace(/^\s+/, "") },
        { key: "category", label: "商品分类", type: "select", required: true, options: productCategoryOptions },
        { key: "specModel", label: "规格型号", type: "input", required: true, maxLength: 100 },
        { key: "salesUnit", label: "销售单位", type: "select", required: true, options: productUnitOptions },
        {
          key: "barcode",
          label: "条码",
          type: "input",
          maxLength: 30,
          pattern: productBarcodePattern,
          patternMessage: "商品条码仅允许字母和数字",
        },
      ],
    },
    {
      title: "价格与说明",
      fields: [
        { key: "retailPrice", label: "默认零售价", type: "input", pattern: nonNegativeMoneyPattern, patternMessage: "默认零售价需为大于等于0且最多2位小数" },
        { key: "wholesalePrice", label: "默认批发价", type: "input", required: true, pattern: nonNegativeMoneyPattern, patternMessage: "默认批发价需为大于等于0且最多2位小数" },
        { key: "purchasePrice", label: "参考采购价", type: "input", pattern: nonNegativeMoneyPattern, patternMessage: "参考采购价需为大于等于0且最多2位小数" },
        { key: "remark", label: "商品备注", type: "textarea", span: 2, maxLength: 200 },
      ],
    },
    {
      title: "系统信息",
      fields: [
        { key: "createdBy", label: "创建人", type: "input", readOnly: true, visibleWhen: ({ mode }) => mode === "edit" },
        { key: "createdAt", label: "创建时间", type: "input", readOnly: true, visibleWhen: ({ mode }) => mode === "edit" },
        { key: "updatedBy", label: "最后修改人", type: "input", readOnly: true, visibleWhen: ({ mode }) => mode === "edit" },
        { key: "updatedAt", label: "最后修改时间", type: "input", readOnly: true, visibleWhen: ({ mode }) => mode === "edit" },
      ],
    },
  ],
  headerFields: [
    { label: "商品编码", key: "code" },
    { label: "商品名称", key: "name" },
    { label: "商品分类", key: "category" },
    { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
  ],
  detailSections: [
    {
      title: "基础资料",
      items: [
        { label: "商品编码", key: "code" },
        { label: "商品名称", key: "name" },
        { label: "商品分类", key: "category" },
        { label: "规格型号", key: "specModel" },
        { label: "销售单位", key: "salesUnit" },
        { label: "条码", key: "barcode" },
      ],
    },
    {
      title: "价格与说明",
      items: [
        { label: "默认零售价", key: "retailPrice", kind: "money" },
        { label: "默认批发价", key: "wholesalePrice", kind: "money" },
        { label: "参考采购价", key: "purchasePrice", kind: "money" },
        { label: "商品备注", key: "remark" },
      ],
    },
    {
      title: "补充信息",
      items: [{ label: "停用原因", key: "stopReason" }],
    },
    {
      title: "系统信息",
      items: [
        { label: "创建人", key: "createdBy" },
        { label: "创建时间", key: "createdAt" },
        { label: "最后修改人", key: "updatedBy" },
        { label: "最后修改时间", key: "updatedAt" },
      ],
    },
  ],
  noteKeys: { external: "remark", internal: "stopReason" },
  tags: ["编码与条码唯一校验", "启停用通过弹窗处理", "价格字段拆分为零售/批发/采购"],
  validateForm: ({ form, sourceRecord, module }) => {
    const nextErrors: Record<string, string> = {};

    if (String(sourceRecord?.codeLocked ?? "") === "true" && String(form.code ?? "") !== String(sourceRecord?.code ?? "")) {
      nextErrors.code = "该商品已被业务单据引用，编码不可修改";
    }

    const code = String(form.code ?? "").trim();
    if (code && !productCodePattern.test(code)) {
      nextErrors.code = "商品编码只允许大写字母、数字和连字符（-）";
    }

    const barcode = String(form.barcode ?? "").trim();
    if (barcode && !productBarcodePattern.test(barcode)) {
      nextErrors.barcode = "商品条码仅允许字母和数字";
    }

    if (barcode) {
      const duplicatedBarcode = module.records.find(
        (record) => String(record.barcode ?? "").trim() === barcode && record.id !== form.id,
      );
      if (duplicatedBarcode) {
        nextErrors.barcode = "商品条码已存在";
      }
    }

    return nextErrors;
  },
  beforeSave: ({ record }) => ({
    ...record,
    code: String(record.code ?? "").trim(),
    name: String(record.name ?? "").trim(),
    category: String(record.category ?? "").trim(),
    specModel: String(record.specModel ?? "").trim(),
    salesUnit: String(record.salesUnit ?? "").trim(),
    barcode: String(record.barcode ?? "").trim(),
    retailPrice: String(record.retailPrice ?? "").trim(),
    wholesalePrice: String(record.wholesalePrice ?? "").trim(),
    purchasePrice: String(record.purchasePrice ?? "").trim(),
    remark: String(record.remark ?? "").trim(),
    stopReason: String(record.stopReason ?? "").trim(),
  }),
});
