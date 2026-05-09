import type { CrudModuleDefinition, CrudRecord } from "../types";
import { buildEntityModule, buildLogs, stripEntityRelations } from "./shared";

const customerLevelOptions = ["全部", "A级", "B级", "C级"];
const customerSettlementOptions = ["全部", "现结", "账期结算"];
const customerPriceLevelOptions = ["一级价", "二级价", "三级价"];
const enabledStatusOptions = ["全部", "启用", "停用"];
const phonePattern = /^(1\d{10}|0\d{2,3}-?\d{7,8})$/;
const customerCodePattern = /^[A-Z0-9-]{2,20}$/;
const sanitizeEntityCode = (value: string) => value.replace(/[^A-Z0-9-]/g, "");

function buildCustomerRecord(base: CrudRecord): CrudRecord {
  return {
    ...base,
    statusTone: base.status === "启用" ? "green" : "gray",
    createdBy: "王晨",
    updatedBy: "李菲",
    logs: buildLogs("客户"),
  };
}

const customerRecords: CrudRecord[] = stripEntityRelations([
  buildCustomerRecord({
    id: "customer-001",
    code: "CUST-0001",
    name: "北京吉浓文化传媒有限公司",
    level: "A级",
    contact: "赵倩",
    phone: "13800138011",
    priceLevel: "一级价",
    settlementMethod: "账期结算",
    accountPeriodDays: "30",
    creditLimit: "200000.00",
    defaultReceiver: "韩默",
    defaultReceiverPhone: "13800138012",
    defaultAddress: "北京市朝阳区望京SOHO T2-1208",
    remark: "华北直营网点客户，报价和账期均按标准口径执行。",
    stopReason: "",
    status: "启用",
    createdAt: "2026-04-12 09:18:22",
    updatedAt: "2026-04-18 14:22:06",
    codeLocked: "true",
  }),
  buildCustomerRecord({
    id: "customer-002",
    code: "CUST-0002",
    name: "杭州智帆商贸有限公司",
    level: "B级",
    contact: "陈扬",
    phone: "13700137022",
    priceLevel: "二级价",
    settlementMethod: "现结",
    accountPeriodDays: "0",
    creditLimit: "0.00",
    defaultReceiver: "陈扬",
    defaultReceiverPhone: "13700137022",
    defaultAddress: "杭州市拱墅区祥园路88号跨贸园B座902",
    remark: "高频补货客户，现结为主。",
    stopReason: "",
    status: "启用",
    createdAt: "2026-04-10 10:20:15",
    updatedAt: "2026-04-18 11:36:40",
    codeLocked: "",
  }),
  buildCustomerRecord({
    id: "customer-003",
    code: "CUST-0003",
    name: "苏州元禾供应链有限公司",
    level: "A级",
    contact: "周祺",
    phone: "13900139033",
    priceLevel: "一级价",
    settlementMethod: "账期结算",
    accountPeriodDays: "15",
    creditLimit: "150000.00",
    defaultReceiver: "吴笙",
    defaultReceiverPhone: "13900139035",
    defaultAddress: "苏州市工业园区星湖街328号",
    remark: "项目型客户，常走批量订单。",
    stopReason: "",
    status: "启用",
    createdAt: "2026-04-09 13:02:11",
    updatedAt: "2026-04-17 17:18:10",
    codeLocked: "true",
  }),
  buildCustomerRecord({
    id: "customer-004",
    code: "CUST-0004",
    name: "深圳腾岳科技有限公司",
    level: "C级",
    contact: "李澈",
    phone: "13600136044",
    priceLevel: "三级价",
    settlementMethod: "账期结算",
    accountPeriodDays: "45",
    creditLimit: "300000.00",
    defaultReceiver: "",
    defaultReceiverPhone: "",
    defaultAddress: "",
    remark: "项目交付客户，阶段性集中下单。",
    stopReason: "",
    status: "启用",
    createdAt: "2026-04-08 16:21:08",
    updatedAt: "2026-04-18 09:45:30",
    codeLocked: "",
  }),
  buildCustomerRecord({
    id: "customer-005",
    code: "CUST-0005",
    name: "天津领格商贸有限公司",
    level: "B级",
    contact: "刘航",
    phone: "13800138020",
    priceLevel: "二级价",
    settlementMethod: "账期结算",
    accountPeriodDays: "15",
    creditLimit: "60000.00",
    defaultReceiver: "",
    defaultReceiverPhone: "",
    defaultAddress: "",
    remark: "历史合作客户，保留档案用于历史查询。",
    stopReason: "2026年起暂停合作，不再接新单。",
    status: "停用",
    createdAt: "2026-04-06 11:10:20",
    updatedAt: "2026-04-18 18:12:45",
    codeLocked: "true",
  }),
]);

export const customerManagementModuleDefinition: CrudModuleDefinition = buildEntityModule({
  view: "customer-management",
  title: "客户管理",
  singular: "客户",
  listDescription: "维护客户基础资料、价格规则、结算口径和信用额度。",
  filters: [
    { key: "keyword", label: "综合搜索", type: "search", placeholder: "客户编码 / 客户名称 / 联系人" },
    { key: "level", label: "客户等级", type: "select", options: customerLevelOptions },
    { key: "settlementMethod", label: "结算方式", type: "select", options: customerSettlementOptions },
    { key: "status", label: "状态", type: "select", options: enabledStatusOptions },
  ],
  columns: [
    { key: "code", label: "客户编码" },
    { key: "name", label: "客户名称" },
    { key: "level", label: "客户等级" },
    { key: "contact", label: "联系人" },
    { key: "phone", label: "联系电话" },
    { key: "priceLevel", label: "价格级别" },
    { key: "settlementMethod", label: "结算方式" },
    { key: "accountPeriodDays", label: "账期天数", align: "right" },
    { key: "creditLimit", label: "信用额度", align: "right", kind: "money" },
    { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
  ],
  records: customerRecords,
  formSections: [
    {
      title: "客户资料",
      fields: [
        {
          key: "code",
          label: "客户编码",
          type: "input",
          required: true,
          minLength: 2,
          maxLength: 20,
          pattern: customerCodePattern,
          patternMessage: "客户编码只允许大写字母、数字和连字符（-）",
          inputTransform: sanitizeEntityCode,
          readOnlyWhen: ({ form, mode }) => mode === "edit" && String(form.codeLocked ?? "") === "true",
        },
        { key: "name", label: "客户名称", type: "input", required: true, maxLength: 50, inputTransform: (value) => value.replace(/^\s+/, "") },
        { key: "level", label: "客户等级", type: "select", required: true, options: ["A级", "B级", "C级"] },
        { key: "contact", label: "联系人", type: "input", required: true, maxLength: 20, inputTransform: (value) => value.replace(/^\s+/, "") },
        { key: "phone", label: "联系电话", type: "input", required: true, maxLength: 20, pattern: phonePattern, patternMessage: "请输入正确的手机号或座机号" },
      ],
    },
    {
      title: "往来规则",
      fields: [
        { key: "priceLevel", label: "价格级别", type: "select", required: true, options: customerPriceLevelOptions },
        { key: "settlementMethod", label: "结算方式", type: "select", required: true, options: ["现结", "账期结算"] },
        {
          key: "accountPeriodDays",
          label: "账期天数",
          type: "input",
          requiredWhen: ({ form }) => String(form.settlementMethod ?? "") === "账期结算",
          readOnlyWhen: ({ form }) => String(form.settlementMethod ?? "") === "现结",
          pattern: /^(0|[1-9]\d{0,2})$/,
          patternMessage: "请输入0-365之间的整数",
        },
        {
          key: "creditLimit",
          label: "信用额度",
          type: "input",
          requiredWhen: ({ form }) => String(form.settlementMethod ?? "") === "账期结算",
          readOnlyWhen: ({ form }) => String(form.settlementMethod ?? "") === "现结",
          pattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
          patternMessage: "请输入大于等于0且最多2位小数的金额",
        },
      ],
    },
    {
      title: "收货信息",
      fields: [
        { key: "defaultReceiver", label: "默认收货人", type: "input", maxLength: 20, inputTransform: (value) => value.replace(/^\s+/, "") },
        { key: "defaultReceiverPhone", label: "默认收货电话", type: "input", maxLength: 20, pattern: phonePattern, patternMessage: "请输入正确的手机号或座机号" },
        { key: "defaultAddress", label: "默认收货地址", type: "textarea", span: 2, maxLength: 100 },
      ],
    },
    {
      title: "补充信息",
      fields: [{ key: "remark", label: "客户备注", type: "textarea", span: 2, maxLength: 200 }],
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
    { label: "客户编码", key: "code" },
    { label: "客户名称", key: "name" },
    { label: "客户等级", key: "level" },
    { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
  ],
  detailSections: [
    {
      title: "客户资料",
      items: [
        { label: "客户编码", key: "code" },
        { label: "客户名称", key: "name" },
        { label: "客户等级", key: "level" },
        { label: "联系人", key: "contact" },
        { label: "联系电话", key: "phone" },
      ],
    },
    {
      title: "往来规则",
      items: [
        { label: "价格级别", key: "priceLevel" },
        { label: "结算方式", key: "settlementMethod" },
        { label: "账期天数", key: "accountPeriodDays" },
        { label: "信用额度", key: "creditLimit", kind: "money" },
      ],
    },
    {
      title: "收货信息",
      items: [
        { label: "默认收货人", key: "defaultReceiver" },
        { label: "默认收货电话", key: "defaultReceiverPhone" },
        { label: "默认收货地址", key: "defaultAddress" },
      ],
    },
    {
      title: "补充信息",
      items: [
        { label: "客户备注", key: "remark" },
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
  tags: ["停用客户不可在新单中选择", "现结客户账期与信用额度自动归零", "已引用客户编码保持只读"],
  transformForm: ({ form, key, value }) => {
    if (key !== "settlementMethod") {
      return { ...form, [key]: value };
    }

    if (value === "现结") {
      return {
        ...form,
        settlementMethod: value,
        accountPeriodDays: "0",
        creditLimit: "0.00",
      };
    }

    return {
      ...form,
      settlementMethod: value,
      accountPeriodDays: String(form.accountPeriodDays ?? "0"),
      creditLimit: String(form.creditLimit ?? "0.00"),
    };
  },
  validateForm: ({ form, sourceRecord }) => {
    const nextErrors: Record<string, string> = {};
    const settlementMethod = String(form.settlementMethod ?? "");
    const accountPeriodDays = String(form.accountPeriodDays ?? "").trim();
    const creditLimit = String(form.creditLimit ?? "").trim();

    if (settlementMethod === "账期结算") {
      const days = Number(accountPeriodDays);
      if (!accountPeriodDays) {
        nextErrors.accountPeriodDays = "账期天数不能为空";
      } else if (!Number.isInteger(days) || days < 0 || days > 365) {
        nextErrors.accountPeriodDays = "账期天数需为0-365之间的整数";
      }

      if (!creditLimit) {
        nextErrors.creditLimit = "信用额度不能为空";
      } else if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(creditLimit) || Number(creditLimit) < 0) {
        nextErrors.creditLimit = "信用额度需为大于等于0且最多2位小数";
      }
    }

    if (String(sourceRecord?.codeLocked ?? "") === "true" && String(form.code ?? "") !== String(sourceRecord?.code ?? "")) {
      nextErrors.code = "该客户已被业务单据引用，编码不可修改";
    }

    const code = String(form.code ?? "").trim();
    if (code && !customerCodePattern.test(code)) {
      nextErrors.code = "客户编码只允许大写字母、数字和连字符（-）";
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
      defaultReceiver: String(record.defaultReceiver ?? "").trim(),
      defaultReceiverPhone: String(record.defaultReceiverPhone ?? "").trim(),
      defaultAddress: String(record.defaultAddress ?? "").trim(),
      remark: String(record.remark ?? "").trim(),
      stopReason: String(record.stopReason ?? "").trim(),
      accountPeriodDays: settlementMethod === "现结" ? "0" : String(record.accountPeriodDays ?? "0").trim(),
      creditLimit: settlementMethod === "现结" ? "0.00" : String(record.creditLimit ?? "0").trim(),
    };
  },
});
