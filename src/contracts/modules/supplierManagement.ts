import type { CrudModuleDefinition, CrudRecord } from "../types";
import { buildEntityModule, buildLogs, stripEntityRelations } from "./shared";

const supplierSettlementOptions = ["全部", "现付", "账期结算"];
const statusOptions = ["全部", "启用", "停用"];
const phonePattern = /^(1\d{10}|0\d{2,3}-?\d{7,8})$/;
const supplierCodePattern = /^[A-Z0-9-]{2,20}$/;
const sanitizeEntityCode = (value: string) => value.replace(/[^A-Z0-9-]/g, "");

function buildSupplierRecord(base: CrudRecord): CrudRecord {
  return {
    ...base,
    statusTone: base.status === "启用" ? "green" : "gray",
    createdBy: "王晨",
    updatedBy: "李菲",
    logs: buildLogs("供应商"),
  };
}

const supplierRecords: CrudRecord[] = stripEntityRelations([
  buildSupplierRecord({
    id: "supplier-001",
    code: "VEND-0001",
    name: "苏州元禾供应链有限公司",
    contact: "周祺",
    phone: "13900139033",
    address: "苏州市工业园区星湖街328号",
    settlementMethod: "账期结算",
    accountPeriodDays: "30",
    taxRate: "13%",
    remark: "采购订单与采购入库主供应商。",
    stopReason: "",
    status: "启用",
    createdAt: "2026-04-11 09:12:18",
    updatedAt: "2026-04-18 13:26:10",
    codeLocked: "true",
  }),
  buildSupplierRecord({
    id: "supplier-002",
    code: "VEND-0002",
    name: "宁波智链实业有限公司",
    contact: "沈卓",
    phone: "13600136088",
    address: "宁波市鄞州区鄞县大道888号",
    settlementMethod: "现付",
    accountPeriodDays: "0",
    taxRate: "13%",
    remark: "标签纸和色带主供。",
    stopReason: "",
    status: "启用",
    createdAt: "2026-04-10 10:22:51",
    updatedAt: "2026-04-18 10:03:35",
    codeLocked: "",
  }),
  buildSupplierRecord({
    id: "supplier-003",
    code: "VEND-0003",
    name: "广州云栈设备有限公司",
    contact: "梁恺",
    phone: "13500135066",
    address: "广州市黄埔区开发大道88号",
    settlementMethod: "账期结算",
    accountPeriodDays: "45",
    taxRate: "13%",
    remark: "华南区域设备主供。",
    stopReason: "",
    status: "启用",
    createdAt: "2026-04-08 16:41:08",
    updatedAt: "2026-04-17 17:12:21",
    codeLocked: "true",
  }),
  buildSupplierRecord({
    id: "supplier-004",
    code: "VEND-0004",
    name: "青岛海拓标签材料有限公司",
    contact: "邵岩",
    phone: "13700137113",
    address: "青岛市城阳区轨道产业园88号",
    settlementMethod: "现付",
    accountPeriodDays: "0",
    taxRate: "未税",
    remark: "标签类耗材供应商，临时可补税率口径。",
    stopReason: "",
    status: "启用",
    createdAt: "2026-04-07 15:03:11",
    updatedAt: "2026-04-16 18:18:40",
    codeLocked: "",
  }),
  buildSupplierRecord({
    id: "supplier-005",
    code: "VEND-0005",
    name: "天津迅捷物流设备有限公司",
    contact: "马骁",
    phone: "13900139010",
    address: "天津市武清区物流装备园5号",
    settlementMethod: "账期结算",
    accountPeriodDays: "15",
    taxRate: "3%",
    remark: "历史合作供应商，保留用于采购历史追溯。",
    stopReason: "合作暂停，暂不允许新建采购单引用。",
    status: "停用",
    createdAt: "2026-04-06 11:08:05",
    updatedAt: "2026-04-18 18:09:27",
    codeLocked: "true",
  }),
]);

export const supplierManagementModuleDefinition: CrudModuleDefinition = buildEntityModule({
  view: "supplier-management",
  title: "供应商管理",
  singular: "供应商",
  listDescription: "维护供应商基础资料、结算方式、账期和税率口径。",
  filters: [
    { key: "code", label: "供应商编码", type: "batch", placeholder: "可批量，精确匹配", targetFields: ["code"] },
    { key: "name", label: "供应商名称", type: "search", placeholder: "名称 / 联系人 / 电话", targetFields: ["name", "contact", "phone"] },
    { key: "settlementMethod", label: "结算方式", type: "select", options: supplierSettlementOptions },
    { key: "status", label: "状态", type: "select", options: statusOptions },
  ],
  columns: [
    { key: "code", label: "供应商编码" },
    { key: "name", label: "供应商名称" },
    { key: "contact", label: "联系人" },
    { key: "phone", label: "联系电话" },
    { key: "settlementMethod", label: "结算方式" },
    { key: "accountPeriodDays", label: "账期天数", align: "right" },
    { key: "taxRate", label: "税率" },
    { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
  ],
  records: supplierRecords,
  formSections: [
    {
      title: "供应商资料",
      fields: [
        {
          key: "code",
          label: "供应商编码",
          type: "input",
          required: true,
          minLength: 2,
          maxLength: 20,
          pattern: supplierCodePattern,
          patternMessage: "供应商编码只允许大写字母、数字和连字符（-）",
          inputTransform: sanitizeEntityCode,
          readOnlyWhen: ({ form, mode }) => mode === "edit" && String(form.codeLocked ?? "") === "true",
        },
        { key: "name", label: "供应商名称", type: "input", required: true, maxLength: 50, inputTransform: (value) => value.replace(/^\s+/, "") },
        { key: "contact", label: "联系人", type: "input", required: true, maxLength: 20, inputTransform: (value) => value.replace(/^\s+/, "") },
        { key: "phone", label: "联系电话", type: "input", required: true, maxLength: 20, pattern: phonePattern, patternMessage: "请输入正确的手机号或座机号" },
        { key: "address", label: "联系地址", type: "textarea", span: 2, maxLength: 100 },
      ],
    },
    {
      title: "结算规则",
      fields: [
        { key: "settlementMethod", label: "结算方式", type: "select", required: true, options: ["现付", "账期结算"] },
        {
          key: "accountPeriodDays",
          label: "账期天数",
          type: "input",
          requiredWhen: ({ form }) => String(form.settlementMethod ?? "") === "账期结算",
          readOnlyWhen: ({ form }) => String(form.settlementMethod ?? "") === "现付",
          pattern: /^(0|[1-9]\d{0,2})$/,
          patternMessage: "请输入0-365之间的整数",
        },
        { key: "taxRate", label: "税率", type: "input", maxLength: 10 },
        { key: "remark", label: "供应商备注", type: "textarea", span: 2, maxLength: 200 },
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
    { label: "供应商编码", key: "code" },
    { label: "供应商名称", key: "name" },
    { label: "结算方式", key: "settlementMethod" },
    { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
  ],
  detailSections: [
    {
      title: "供应商资料",
      items: [
        { label: "供应商编码", key: "code" },
        { label: "供应商名称", key: "name" },
        { label: "联系人", key: "contact" },
        { label: "联系电话", key: "phone" },
        { label: "联系地址", key: "address" },
      ],
    },
    {
      title: "结算规则",
      items: [
        { label: "结算方式", key: "settlementMethod" },
        { label: "账期天数", key: "accountPeriodDays" },
        { label: "税率", key: "taxRate" },
        { label: "供应商备注", key: "remark" },
        { label: "停用原因", key: "stopReason" },
      ],
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
  tags: ["停用供应商不可在新单中选择", "现付供应商账期自动归零", "已引用供应商编码保持只读"],
  transformForm: ({ form, key, value }) => {
    if (key !== "settlementMethod") {
      return { ...form, [key]: value };
    }

    if (value === "现付") {
      return {
        ...form,
        settlementMethod: value,
        accountPeriodDays: "0",
      };
    }

    return {
      ...form,
      settlementMethod: value,
      accountPeriodDays: String(form.accountPeriodDays ?? "0"),
    };
  },
  validateForm: ({ form, sourceRecord }) => {
    const nextErrors: Record<string, string> = {};
    const settlementMethod = String(form.settlementMethod ?? "");
    const accountPeriodDays = String(form.accountPeriodDays ?? "").trim();

    if (settlementMethod === "账期结算") {
      const days = Number(accountPeriodDays);
      if (!accountPeriodDays) {
        nextErrors.accountPeriodDays = "账期天数不能为空";
      } else if (!Number.isInteger(days) || days < 0 || days > 365) {
        nextErrors.accountPeriodDays = "账期天数需为0-365之间的整数";
      }
    }

    if (String(sourceRecord?.codeLocked ?? "") === "true" && String(form.code ?? "") !== String(sourceRecord?.code ?? "")) {
      nextErrors.code = "该供应商已被业务单据引用，编码不可修改";
    }

    const code = String(form.code ?? "").trim();
    if (code && !supplierCodePattern.test(code)) {
      nextErrors.code = "供应商编码只允许大写字母、数字和连字符（-）";
    }

    return nextErrors;
  },
  beforeSave: ({ record }) => {
    const settlementMethod = String(record.settlementMethod ?? "");
    return {
      ...record,
      code: String(record.code ?? "").trim(),
      name: String(record.name ?? "").trim(),
      contact: String(record.contact ?? "").trim(),
      phone: String(record.phone ?? "").trim(),
      address: String(record.address ?? "").trim(),
      taxRate: String(record.taxRate ?? "").trim(),
      remark: String(record.remark ?? "").trim(),
      stopReason: String(record.stopReason ?? "").trim(),
      accountPeriodDays: settlementMethod === "现付" ? "0" : String(record.accountPeriodDays ?? "0").trim(),
    };
  },
});
