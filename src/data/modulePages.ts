import type { ViewKey } from "./mock";

export type Tone = "green" | "blue" | "orange" | "red" | "gray";

export type ModuleFilter = {
  key: string;
  label: string;
  type: "search" | "select" | "dateRange";
  placeholder?: string;
  options?: string[];
};

export type ModuleColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  kind?: "text" | "status" | "money";
  toneKey?: string;
};

export type ModuleField = {
  key: string;
  label: string;
  type: "input" | "select" | "date" | "textarea";
  required?: boolean;
  options?: string[];
  span?: 1 | 2 | 4;
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
  items: Array<{ label: string; key: string; kind?: "text" | "status"; toneKey?: string }>;
};

export type CrudModuleDefinition = {
  kind: "entity" | "document";
  view: ViewKey;
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
  // 用户管理模块
  userColumns?: ModuleColumn[];
  users?: Array<Record<string, string>>;
  // 角色管理
  roleColumns?: ModuleColumn[];
  roles?: Array<Record<string, string>>;
  // 通用面板配置（用于不需要列表的配置模块）
  panels?: Array<{
    title: string;
    desc: string;
    items: Array<{ label: string; value: string; tone?: Tone; editable?: boolean }>;
  }>;
  // 编号规则配置
  ruleColumns?: ModuleColumn[];
  rules?: Array<Record<string, string>>;
  // 模板配置
  templateColumns?: ModuleColumn[];
  templates?: Array<Record<string, string>>;
  // 日志
  logs?: ModuleLog[];
};

export type ModuleDefinition =
  | CrudModuleDefinition
  | QueryModuleDefinition
  | FormModuleDefinition
  | ConfigModuleDefinition;

function money(value: number) {
  return `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildLines(prefix: string): ModuleLineItem[] {
  return [
    {
      id: `${prefix}-line-1`,
      code: "SKU-100124",
      name: "便携扫码枪",
      spec: "无线版",
      qty: 12,
      unit: "支",
      price: 299,
      amount: 3588,
      note: "按整箱发货",
    },
    {
      id: `${prefix}-line-2`,
      code: "SKU-100331",
      name: "标签打印纸",
      spec: "100mm*50mm",
      qty: 80,
      unit: "卷",
      price: 18,
      amount: 1440,
      note: "补货常备品",
    },
  ];
}

function buildTimeline(prefix: string, draftLabel: string, reviewLabel: string): ModuleTimeline[] {
  return [
    { title: "草稿创建", detail: `${draftLabel}已录入基础信息并生成草稿。`, owner: "王晨", time: "2025/04/03 09:20", tone: "blue" },
    { title: "业务确认", detail: "业务口径已确认，等待进入下一节点。", owner: "李菲", time: "2025/04/03 09:40", tone: "green" },
    { title: reviewLabel, detail: `${prefix}当前等待后续协同处理。`, owner: "业务中台", time: "2025/04/03 10:10", tone: "orange" },
  ];
}

function buildLogs(prefix: string): ModuleLog[] {
  return [
    { time: "2025/04/03 09:20", user: "王晨", action: "创建", detail: `创建${prefix}并录入基础信息。` },
    { time: "2025/04/03 09:42", user: "李菲", action: "修改", detail: "补充联系人和备注。"},
    { time: "2025/04/03 10:10", user: "系统", action: "流转", detail: "推送下一处理节点。"},
  ];
}

function buildRelations(prefix: string): ModuleRelation[] {
  return [
    { type: "关联单据", no: `${prefix}-GL-001`, status: "已关联" },
    { type: "审批记录", no: `${prefix}-SP-001`, status: "处理中" },
  ];
}

function buildEntityModule(def: Omit<CrudModuleDefinition, "kind">): CrudModuleDefinition {
  return { kind: "entity", ...def };
}

function buildDocumentModule(def: Omit<CrudModuleDefinition, "kind">): CrudModuleDefinition {
  return { kind: "document", ...def };
}

const entityStatusOptions = ["全部状态", "启用", "停用"];
const commonTags = ["重点维护", "账期客户", "区域重点"];

function stripEntityRelations<T extends CrudRecord>(records: T[]): T[] {
  return records.map(({ relations, ...rest }) => rest as T);
}

const productExtraRecords: CrudRecord[] = [
  { id: "product-004", code: "SP-000610", name: "仓储周转箱", category: "配件类", spec: "600*400蓝色", price: money(62), status: "启用", statusTone: "green", updatedAt: "2025/04/03 11:20", brand: "范米", barcode: "6930006100004", unit: "个", warehouse: "华北总仓", remark: "仓储辅料常备。", internalNote: "用于库存模块联动演示。", logs: buildLogs("商品") },
  { id: "product-005", code: "SP-000711", name: "热敏标签机", category: "设备类", spec: "桌面版", price: money(899), status: "启用", statusTone: "green", updatedAt: "2025/04/02 18:10", brand: "维仓", barcode: "6930007110005", unit: "台", warehouse: "杭州分仓", remark: "门店打印设备。", internalNote: "与零售和采购入库可联动。", logs: buildLogs("商品") },
  { id: "product-006", code: "SP-000812", name: "标签色带", category: "耗材类", spec: "110mm黑色", price: money(26), status: "启用", statusTone: "green", updatedAt: "2025/04/01 16:44", brand: "维仓", barcode: "6930008120006", unit: "卷", warehouse: "杭州分仓", remark: "和打印纸配套销售。", internalNote: "高频耗材。", logs: buildLogs("商品") },
  { id: "product-007", code: "SP-000913", name: "手持盘点终端", category: "设备类", spec: "Lite", price: money(1299), status: "启用", statusTone: "green", updatedAt: "2025/03/30 10:12", brand: "范米", barcode: "6930009130007", unit: "台", warehouse: "华南中心仓", remark: "盘点作业设备。", internalNote: "盘点管理主商品。", logs: buildLogs("商品") },
  { id: "product-008", code: "SP-001014", name: "条码标签贴纸", category: "耗材类", spec: "80*60", price: money(12), status: "启用", statusTone: "green", updatedAt: "2025/03/29 17:36", brand: "维仓", barcode: "6930010140008", unit: "卷", warehouse: "华北总仓", remark: "用于小票和库位标签。", internalNote: "低单价高频商品。", logs: buildLogs("商品") },
  { id: "product-009", code: "SP-001115", name: "枪套支架", category: "配件类", spec: "通用款", price: money(38), status: "停用", statusTone: "gray", updatedAt: "2025/03/28 09:25", brand: "维仓", barcode: "6930011150009", unit: "个", warehouse: "华北总仓", remark: "旧版配件。", internalNote: "保留历史档案。", logs: buildLogs("商品") },
  { id: "product-010", code: "SP-001216", name: "蓝牙打印机", category: "设备类", spec: "移动版", price: money(699), status: "启用", statusTone: "green", updatedAt: "2025/03/27 14:08", brand: "范米", barcode: "6930012160010", unit: "台", warehouse: "杭州分仓", remark: "适合门店移动场景。", internalNote: "与客户管理/零售场景联动。", logs: buildLogs("商品") },
];

const customerExtraRecords: CrudRecord[] = [
  { id: "customer-003", code: "KH-000318", name: "苏州元禾供应链有限公司", level: "重点客户", contact: "周祺", phone: "13900139033", settlement: "15天账期", status: "启用", statusTone: "green", updatedAt: "2025/04/01 15:26", region: "华东区域", address: "苏州市工业园区星湖街328号", creditLimit: money(150000), remark: "项目类客户。", internalNote: "采购和销售双向演示客户。", logs: buildLogs("客户") },
  { id: "customer-004", code: "KH-000406", name: "深圳腾岳科技有限公司", level: "账期客户", contact: "李澈", phone: "13600136044", settlement: "45天账期", status: "启用", statusTone: "green", updatedAt: "2025/03/29 18:36", region: "华南区域", address: "深圳市南山区科技园高新南七道12号", creditLimit: money(300000), remark: "项目交付客户。", internalNote: "用于长账期样例。", logs: buildLogs("客户") },
  { id: "customer-005", code: "KH-000512", name: "宁波智链实业有限公司", level: "普通客户", contact: "沈卓", phone: "13600136088", settlement: "现结", status: "启用", statusTone: "green", updatedAt: "2025/03/28 17:12", region: "华东区域", address: "宁波市鄞州区鄞县大道888号", creditLimit: money(50000), remark: "常规补货客户。", internalNote: "采购退货关联客户。", logs: buildLogs("客户") },
  { id: "customer-006", code: "KH-000615", name: "上海梵仓信息科技有限公司", level: "A类客户", contact: "谢琳", phone: "13500135061", settlement: "30天账期", status: "启用", statusTone: "green", updatedAt: "2025/03/27 15:48", region: "华东区域", address: "上海市闵行区申长路188号", creditLimit: money(220000), remark: "总部集中采购。", internalNote: "销售查询重点客户。", logs: buildLogs("客户") },
  { id: "customer-007", code: "KH-000718", name: "广州拓域商业有限公司", level: "重点客户", contact: "黄舟", phone: "13700137018", settlement: "现结", status: "启用", statusTone: "green", updatedAt: "2025/03/26 10:08", region: "华南区域", address: "广州市天河区科韵路88号", creditLimit: money(90000), remark: "现款高频客户。", internalNote: "零售与销售订单共用客户。", logs: buildLogs("客户") },
  { id: "customer-008", code: "KH-000820", name: "天津领格商贸有限公司", level: "普通客户", contact: "刘航", phone: "13800138020", settlement: "15天账期", status: "停用", statusTone: "gray", updatedAt: "2025/03/25 11:14", region: "华北区域", address: "天津市西青区中北镇88号", creditLimit: money(60000), remark: "历史客户。", internalNote: "停用客户样例。", logs: buildLogs("客户") },
  { id: "customer-009", code: "KH-000921", name: "武汉迅维仓配有限公司", level: "重点客户", contact: "姚远", phone: "13900139021", settlement: "30天账期", status: "启用", statusTone: "green", updatedAt: "2025/03/24 16:10", region: "华中区域", address: "武汉市东湖高新区未来大道9号", creditLimit: money(120000), remark: "区域仓配客户。", internalNote: "库存余额查询样例。", logs: buildLogs("客户") },
  { id: "customer-010", code: "KH-001022", name: "成都智连零售有限公司", level: "普通客户", contact: "白宁", phone: "13600136022", settlement: "现结", status: "启用", statusTone: "green", updatedAt: "2025/03/23 13:42", region: "西南区域", address: "成都市高新区天府大道北段99号", creditLimit: money(70000), remark: "门店补货客户。", internalNote: "零售收银延展样例。", logs: buildLogs("客户") },
];

const supplierExtraRecords: CrudRecord[] = [
  { id: "supplier-003", code: "GY-000306", name: "广州云栈设备有限公司", category: "设备供应", contact: "梁恺", phone: "13500135066", settlement: "30天账期", status: "启用", statusTone: "green", updatedAt: "2025/03/28 16:18", region: "华南", address: "广州市黄埔区开发大道88号", bank: "中国银行广州分行", accountNo: "6222000000306001", remark: "华南设备主供。", internalNote: "销售出库和采购订单备用供应商。", logs: buildLogs("供应商") },
  { id: "supplier-004", code: "GY-000407", name: "上海梵链耗材有限公司", category: "耗材供应", contact: "陆勤", phone: "13600136077", settlement: "现结", status: "启用", statusTone: "green", updatedAt: "2025/03/27 15:02", region: "华东", address: "上海市嘉定区曹安公路188号", bank: "农业银行上海支行", accountNo: "6222000000407002", remark: "标签耗材主供。", internalNote: "用于采购入库样例扩充。", logs: buildLogs("供应商") },
  { id: "supplier-005", code: "GY-000508", name: "北京凌峰包装材料有限公司", category: "综合供应", contact: "顾凡", phone: "13700137088", settlement: "15天账期", status: "启用", statusTone: "green", updatedAt: "2025/03/26 10:40", region: "华北", address: "北京市大兴区物流园6号", bank: "建设银行北京分行", accountNo: "6222000000508003", remark: "包装辅料供应。", internalNote: "仓库和报损页面可联动。", logs: buildLogs("供应商") },
  { id: "supplier-006", code: "GY-000609", name: "杭州维仓科技有限公司", category: "设备供应", contact: "陈煦", phone: "13800138099", settlement: "30天账期", status: "启用", statusTone: "green", updatedAt: "2025/03/25 09:15", region: "华东", address: "杭州市余杭区仓前街道未来科技城", bank: "招商银行杭州分行", accountNo: "6222000000609004", remark: "设备备选供应商。", internalNote: "用于供应商详情扩展示例。", logs: buildLogs("供应商") },
  { id: "supplier-007", code: "GY-000710", name: "天津迅捷物流设备有限公司", category: "设备供应", contact: "马骁", phone: "13900139010", settlement: "现结", status: "停用", statusTone: "gray", updatedAt: "2025/03/24 14:21", region: "华北", address: "天津市武清区物流装备园5号", bank: "工商银行天津支行", accountNo: "6222000000710005", remark: "历史合作供应商。", internalNote: "停用供应商样例。", logs: buildLogs("供应商") },
  { id: "supplier-008", code: "GY-000811", name: "武汉星联电子有限公司", category: "综合供应", contact: "韩畅", phone: "13600136111", settlement: "30天账期", status: "启用", statusTone: "green", updatedAt: "2025/03/23 17:48", region: "华中", address: "武汉市东湖高新区金融港1路", bank: "中国银行武汉分行", accountNo: "6222000000811006", remark: "华中综合供应。", internalNote: "供应链样例数据。", logs: buildLogs("供应商") },
  { id: "supplier-009", code: "GY-000912", name: "成都维链仓储设备有限公司", category: "设备供应", contact: "侯铭", phone: "13500135112", settlement: "15天账期", status: "启用", statusTone: "green", updatedAt: "2025/03/22 10:55", region: "西南", address: "成都市双流区航空港工业园", bank: "建设银行成都分行", accountNo: "6222000000912007", remark: "西南区域设备供货。", internalNote: "可用于采购订单扩容。", logs: buildLogs("供应商") },
  { id: "supplier-010", code: "GY-001013", name: "青岛海拓标签材料有限公司", category: "耗材供应", contact: "邵岩", phone: "13700137113", settlement: "现结", status: "启用", statusTone: "green", updatedAt: "2025/03/21 13:39", region: "华东", address: "青岛市城阳区轨道产业园88号", bank: "农业银行青岛支行", accountNo: "6222000001013008", remark: "标签类耗材供应。", internalNote: "补足供应商列表展示。", logs: buildLogs("供应商") },
];

const warehouseExtraRecords: CrudRecord[] = [
  { id: "warehouse-003", code: "CK-0003", name: "华南中心仓", type: "总仓", manager: "钱宇", region: "华南", status: "启用", statusTone: "green", updatedAt: "2025/03/31 10:18", address: "深圳市龙岗区物流大道18号", capacity: "2600㎡", remark: "南区主发货仓。", internalNote: "蓝牙终端库存主仓。", logs: buildLogs("仓库") },
  { id: "warehouse-004", code: "CK-0004", name: "苏州仓", type: "分仓", manager: "周曼", region: "华东", status: "启用", statusTone: "green", updatedAt: "2025/03/30 14:40", address: "苏州市工业园区星湖街688号", capacity: "980㎡", remark: "项目交付仓。", internalNote: "采购退货与销售订单共用。", logs: buildLogs("仓库") },
  { id: "warehouse-005", code: "CK-0005", name: "广州门店仓", type: "门店仓", manager: "李菲", region: "华南", status: "启用", statusTone: "green", updatedAt: "2025/03/29 11:06", address: "广州市天河区体育西路66号", capacity: "320㎡", remark: "门店自提仓。", internalNote: "零售收银延展仓库。", logs: buildLogs("仓库") },
  { id: "warehouse-006", code: "CK-0006", name: "武汉中转仓", type: "分仓", manager: "王晨", region: "华中", status: "启用", statusTone: "green", updatedAt: "2025/03/28 16:12", address: "武汉市东西湖区临空港大道18号", capacity: "760㎡", remark: "中部中转仓。", internalNote: "调拨演示节点。", logs: buildLogs("仓库") },
  { id: "warehouse-007", code: "CK-0007", name: "成都分仓", type: "分仓", manager: "沈岩", region: "西南", status: "启用", statusTone: "green", updatedAt: "2025/03/27 15:05", address: "成都市双流区西航港大道8号", capacity: "880㎡", remark: "西南区域补货仓。", internalNote: "库存查询扩展示例。", logs: buildLogs("仓库") },
  { id: "warehouse-008", code: "CK-0008", name: "天津门店仓", type: "门店仓", manager: "白宁", region: "华北", status: "停用", statusTone: "gray", updatedAt: "2025/03/26 09:35", address: "天津市南开区长江道88号", capacity: "220㎡", remark: "历史门店仓。", internalNote: "停用仓库样例。", logs: buildLogs("仓库") },
  { id: "warehouse-009", code: "CK-0009", name: "青岛分仓", type: "分仓", manager: "陈扬", region: "华东", status: "启用", statusTone: "green", updatedAt: "2025/03/25 13:42", address: "青岛市即墨区蓝谷大道99号", capacity: "640㎡", remark: "北方沿海补货仓。", internalNote: "供应商入库中转。", logs: buildLogs("仓库") },
  { id: "warehouse-0010", code: "CK-0010", name: "南京维修仓", type: "门店仓", manager: "黄舟", region: "华东", status: "启用", statusTone: "green", updatedAt: "2025/03/24 10:16", address: "南京市江宁区秣周东路188号", capacity: "280㎡", remark: "售后维修仓。", internalNote: "报损和盘点样例。", logs: buildLogs("仓库") },
];

export const crudModuleDefinitions: Record<string, CrudModuleDefinition> = {
  "product-management": buildEntityModule({
    view: "product-management",
    title: "商品管理",
    singular: "商品",
    listDescription: "维护商品档案、分类、规格和价格策略。",
    filters: [
      { key: "keyword", label: "综合搜索", type: "search", placeholder: "商品编码 / 名称 / 条码" },
      { key: "category", label: "商品分类", type: "select", options: ["全部分类", "设备类", "耗材类", "配件类"] },
      { key: "status", label: "状态", type: "select", options: entityStatusOptions },
    ],
    columns: [
      { key: "code", label: "商品编码" },
      { key: "name", label: "商品名称" },
      { key: "category", label: "分类" },
      { key: "spec", label: "规格" },
      { key: "price", label: "标准售价", align: "right", kind: "money" },
      { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
      { key: "updatedAt", label: "最近更新" },
    ],
    records: stripEntityRelations([
      {
        id: "product-001",
        code: "SP-000124",
        name: "便携扫码枪",
        category: "设备类",
        spec: "无线版",
        price: money(299),
        status: "启用",
        statusTone: "green",
        updatedAt: "2025/04/03 09:31",
        brand: "维仓",
        barcode: "6930001240001",
        unit: "支",
        warehouse: "华北总仓",
        remark: "高频出货商品，建议保留安全库存。",
        internalNote: "用于演示商品档案详情。",
        logs: buildLogs("商品"),
      },
      {
        id: "product-002",
        code: "SP-000331",
        name: "标签打印纸",
        category: "耗材类",
        spec: "100mm*50mm",
        price: money(18),
        status: "启用",
        statusTone: "green",
        updatedAt: "2025/04/02 15:18",
        brand: "维仓",
        barcode: "6930003310002",
        unit: "卷",
        warehouse: "杭州分仓",
        remark: "耗材类商品，支持批量补货。",
        internalNote: "与标签机联动销售。",
        logs: buildLogs("商品"),
      },
      {
        id: "product-003",
        code: "SP-000518",
        name: "蓝牙手持终端",
        category: "设备类",
        spec: "Pro 128G",
        price: money(1899),
        status: "停用",
        statusTone: "gray",
        updatedAt: "2025/03/29 18:06",
        brand: "范米",
        barcode: "6930005180003",
        unit: "台",
        warehouse: "华南中心仓",
        remark: "旧型号停售，仅保留历史资料。",
        internalNote: "作为停用商品展示样例。",
        logs: buildLogs("商品"),
      },
      ...productExtraRecords,
    ]),
    formSections: [
      {
        title: "基础资料",
        fields: [
          { key: "code", label: "商品编码", type: "input", required: true },
          { key: "name", label: "商品名称", type: "input", required: true },
          { key: "category", label: "商品分类", type: "select", required: true, options: ["设备类", "耗材类", "配件类"] },
          { key: "spec", label: "规格型号", type: "input" },
          { key: "brand", label: "品牌", type: "input" },
          { key: "barcode", label: "条码", type: "input" },
          { key: "unit", label: "计量单位", type: "select", options: ["支", "卷", "台", "个"] },
          { key: "warehouse", label: "默认仓库", type: "select", options: ["华北总仓", "杭州分仓", "华南中心仓"] },
        ],
      },
      {
        title: "价格与说明",
        fields: [
          { key: "price", label: "标准售价", type: "input", required: true },
          { key: "status", label: "状态", type: "select", options: ["启用", "停用"] },
          { key: "remark", label: "对外备注", type: "textarea", span: 2 },
          { key: "internalNote", label: "内部说明", type: "textarea", span: 2 },
        ],
      },
    ],
    headerFields: [
      { label: "商品编码", key: "code" },
      { label: "商品名称", key: "name" },
      { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
      { label: "分类", key: "category" },
    ],
    detailSections: [
      {
        title: "基础资料",
        items: [
          { label: "商品编码", key: "code" },
          { label: "商品名称", key: "name" },
          { label: "商品分类", key: "category" },
          { label: "规格型号", key: "spec" },
          { label: "品牌", key: "brand" },
          { label: "条码", key: "barcode" },
          { label: "计量单位", key: "unit" },
          { label: "默认仓库", key: "warehouse" },
        ],
      },
      {
        title: "价格与说明",
        items: [
          { label: "标准售价", key: "price" },
          { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
          { label: "对外备注", key: "remark" },
          { label: "内部说明", key: "internalNote" },
        ],
      },
    ],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["设备类", "耗材类", "停用样例"],
  }),
  "customer-management": buildEntityModule({
    view: "customer-management",
    title: "客户管理",
    singular: "客户",
    listDescription: "维护客户档案、等级和账期规则。",
    filters: [
      { key: "keyword", label: "综合搜索", type: "search", placeholder: "客户编码 / 名称 / 联系人" },
      { key: "level", label: "客户等级", type: "select", options: ["全部等级", "A类客户", "重点客户", "普通客户"] },
      { key: "status", label: "状态", type: "select", options: entityStatusOptions },
    ],
    columns: [
      { key: "code", label: "客户编码" },
      { key: "name", label: "客户名称" },
      { key: "level", label: "客户等级" },
      { key: "contact", label: "联系人" },
      { key: "settlement", label: "结算方式" },
      { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
      { key: "updatedAt", label: "最近更新" },
    ],
    records: stripEntityRelations([
      {
        id: "customer-001",
        code: "KH-000128",
        name: "北京吉浓文化传媒有限公司",
        level: "A类客户",
        contact: "赵倩",
        phone: "13800138011",
        settlement: "30天账期",
        status: "启用",
        statusTone: "green",
        updatedAt: "2025/04/03 09:12",
        region: "华北区域",
        address: "北京市朝阳区望京SOHO T2-1208",
        creditLimit: money(200000),
        remark: "账期客户，优先走销售订单主链路。",
        internalNote: "与收款登记、客户往来查询联动展示。",
        logs: buildLogs("客户"),
      },
      {
        id: "customer-002",
        code: "KH-000207",
        name: "杭州智帆商贸有限公司",
        level: "重点客户",
        contact: "陈扬",
        phone: "13700137022",
        settlement: "现结",
        status: "启用",
        statusTone: "green",
        updatedAt: "2025/04/02 11:25",
        region: "华东区域",
        address: "杭州市拱墅区祥园路88号跨贸园B座902",
        creditLimit: money(80000),
        remark: "高频补货客户，适合演示现结场景。",
        internalNote: "与零售收银和销售订单都有关系。",
        logs: buildLogs("客户"),
      },
      ...customerExtraRecords,
    ]),
    formSections: [
      {
        title: "基础资料",
        fields: [
          { key: "code", label: "客户编码", type: "input", required: true },
          { key: "name", label: "客户名称", type: "input", required: true },
          { key: "level", label: "客户等级", type: "select", options: ["A类客户", "重点客户", "普通客户"], required: true },
          { key: "contact", label: "联系人", type: "input", required: true },
          { key: "phone", label: "联系电话", type: "input" },
          { key: "region", label: "所属区域", type: "select", options: ["华北区域", "华东区域", "华南区域"] },
          { key: "settlement", label: "结算方式", type: "select", options: ["现结", "15天账期", "30天账期", "45天账期"] },
          { key: "creditLimit", label: "信用额度", type: "input" },
          { key: "address", label: "联系地址", type: "textarea", span: 2 },
        ],
      },
      {
        title: "说明",
        fields: [
          { key: "status", label: "状态", type: "select", options: ["启用", "停用"] },
          { key: "remark", label: "对外备注", type: "textarea", span: 2 },
          { key: "internalNote", label: "内部说明", type: "textarea", span: 2 },
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
          { label: "所属区域", key: "region" },
          { label: "结算方式", key: "settlement" },
          { label: "信用额度", key: "creditLimit" },
        ],
      },
      {
        title: "说明",
        items: [
          { label: "联系地址", key: "address" },
          { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
          { label: "对外备注", key: "remark" },
          { label: "内部说明", key: "internalNote" },
        ],
      },
    ],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: commonTags,
  }),
  "supplier-management": buildEntityModule({
    view: "supplier-management",
    title: "供应商管理",
    singular: "供应商",
    listDescription: "维护供应商主体、合作属性和结算规则。",
    filters: [
      { key: "keyword", label: "综合搜索", type: "search", placeholder: "供应商编码 / 名称 / 联系人" },
      { key: "category", label: "合作类型", type: "select", options: ["全部类型", "设备供应", "耗材供应", "综合供应"] },
      { key: "status", label: "状态", type: "select", options: entityStatusOptions },
    ],
    columns: [
      { key: "code", label: "供应商编码" },
      { key: "name", label: "供应商名称" },
      { key: "category", label: "合作类型" },
      { key: "contact", label: "联系人" },
      { key: "settlement", label: "结算方式" },
      { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
      { key: "updatedAt", label: "最近更新" },
    ],
    records: stripEntityRelations([
      {
        id: "supplier-001",
        code: "GY-000101",
        name: "苏州元禾供应链有限公司",
        category: "设备供应",
        contact: "周祺",
        phone: "13900139033",
        settlement: "30天账期",
        status: "启用",
        statusTone: "green",
        updatedAt: "2025/04/01 16:18",
        region: "华东",
        address: "苏州市工业园区星湖街328号",
        bank: "工商银行苏州园区支行",
        accountNo: "6222020000118899",
        remark: "核心设备供应商。",
        internalNote: "采购订单与采购入库演示默认供应商。",
        logs: buildLogs("供应商"),
      },
      {
        id: "supplier-002",
        code: "GY-000205",
        name: "宁波智链实业有限公司",
        category: "耗材供应",
        contact: "沈卓",
        phone: "13600136088",
        settlement: "现结",
        status: "启用",
        statusTone: "green",
        updatedAt: "2025/03/29 10:20",
        region: "华东",
        address: "宁波市鄞州区鄞县大道888号",
        bank: "建设银行宁波分行",
        accountNo: "6227000000112200",
        remark: "标签纸和色带主供。",
        internalNote: "用于采购退货演示。",
        logs: buildLogs("供应商"),
      },
      ...supplierExtraRecords,
    ]),
    formSections: [
      {
        title: "基础资料",
        fields: [
          { key: "code", label: "供应商编码", type: "input", required: true },
          { key: "name", label: "供应商名称", type: "input", required: true },
          { key: "category", label: "合作类型", type: "select", options: ["设备供应", "耗材供应", "综合供应"] },
          { key: "contact", label: "联系人", type: "input" },
          { key: "phone", label: "联系电话", type: "input" },
          { key: "region", label: "所属区域", type: "select", options: ["华北", "华东", "华南"] },
          { key: "settlement", label: "结算方式", type: "select", options: ["现结", "15天账期", "30天账期"] },
          { key: "address", label: "联系地址", type: "textarea", span: 2 },
        ],
      },
      {
        title: "结算与说明",
        fields: [
          { key: "bank", label: "开户行", type: "input" },
          { key: "accountNo", label: "账号", type: "input" },
          { key: "status", label: "状态", type: "select", options: ["启用", "停用"] },
          { key: "remark", label: "对外备注", type: "textarea", span: 2 },
          { key: "internalNote", label: "内部说明", type: "textarea", span: 2 },
        ],
      },
    ],
    headerFields: [
      { label: "供应商编码", key: "code" },
      { label: "供应商名称", key: "name" },
      { label: "合作类型", key: "category" },
      { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
    ],
    detailSections: [
      {
        title: "供应商资料",
        items: [
          { label: "供应商编码", key: "code" },
          { label: "供应商名称", key: "name" },
          { label: "合作类型", key: "category" },
          { label: "联系人", key: "contact" },
          { label: "联系电话", key: "phone" },
          { label: "所属区域", key: "region" },
          { label: "结算方式", key: "settlement" },
          { label: "联系地址", key: "address" },
        ],
      },
      {
        title: "结算说明",
        items: [
          { label: "开户行", key: "bank" },
          { label: "账号", key: "accountNo" },
          { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
          { label: "对外备注", key: "remark" },
          { label: "内部说明", key: "internalNote" },
        ],
      },
    ],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["设备主供", "耗材主供", "账期合作"],
  }),
  "warehouse-management": buildEntityModule({
    view: "warehouse-management",
    title: "仓库管理",
    singular: "仓库",
    listDescription: "维护仓库档案、用途和库存归属。",
    filters: [
      { key: "keyword", label: "综合搜索", type: "search", placeholder: "仓库编码 / 名称 / 负责人" },
      { key: "type", label: "仓库类型", type: "select", options: ["全部类型", "总仓", "分仓", "门店仓"] },
      { key: "status", label: "状态", type: "select", options: entityStatusOptions },
    ],
    columns: [
      { key: "code", label: "仓库编码" },
      { key: "name", label: "仓库名称" },
      { key: "type", label: "仓库类型" },
      { key: "manager", label: "负责人" },
      { key: "region", label: "区域" },
      { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
      { key: "updatedAt", label: "最近更新" },
    ],
    records: stripEntityRelations([
      {
        id: "warehouse-001",
        code: "CK-0001",
        name: "华北总仓",
        type: "总仓",
        manager: "王晨",
        region: "华北",
        status: "启用",
        statusTone: "green",
        updatedAt: "2025/04/03 08:10",
        address: "北京市顺义区物流园88号",
        capacity: "3000㎡",
        remark: "主发货仓，承接大部分订单履约。",
        internalNote: "与销售订单、库存查询共用仓库口径。",
        logs: buildLogs("仓库"),
      },
      {
        id: "warehouse-002",
        code: "CK-0002",
        name: "杭州分仓",
        type: "分仓",
        manager: "李菲",
        region: "华东",
        status: "启用",
        statusTone: "green",
        updatedAt: "2025/04/01 14:20",
        address: "杭州市余杭区仓前街道未来城1号",
        capacity: "1200㎡",
        remark: "区域补货仓。",
        internalNote: "用于现货订单和自提订单演示。",
        logs: buildLogs("仓库"),
      },
      ...warehouseExtraRecords,
    ]),
    formSections: [
      {
        title: "仓库资料",
        fields: [
          { key: "code", label: "仓库编码", type: "input", required: true },
          { key: "name", label: "仓库名称", type: "input", required: true },
          { key: "type", label: "仓库类型", type: "select", options: ["总仓", "分仓", "门店仓"] },
          { key: "manager", label: "负责人", type: "input" },
          { key: "region", label: "所属区域", type: "select", options: ["华北", "华东", "华南"] },
          { key: "capacity", label: "仓储面积", type: "input" },
          { key: "status", label: "状态", type: "select", options: ["启用", "停用"] },
          { key: "address", label: "仓库地址", type: "textarea", span: 2 },
        ],
      },
      {
        title: "说明",
        fields: [
          { key: "remark", label: "对外备注", type: "textarea", span: 2 },
          { key: "internalNote", label: "内部说明", type: "textarea", span: 2 },
        ],
      },
    ],
    headerFields: [
      { label: "仓库编码", key: "code" },
      { label: "仓库名称", key: "name" },
      { label: "仓库类型", key: "type" },
      { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
    ],
    detailSections: [
      {
        title: "仓库资料",
        items: [
          { label: "仓库编码", key: "code" },
          { label: "仓库名称", key: "name" },
          { label: "仓库类型", key: "type" },
          { label: "负责人", key: "manager" },
          { label: "所属区域", key: "region" },
          { label: "仓储面积", key: "capacity" },
          { label: "仓库地址", key: "address" },
          { label: "状态", key: "status", kind: "status", toneKey: "statusTone" },
        ],
      },
      {
        title: "说明",
        items: [
          { label: "对外备注", key: "remark" },
          { label: "内部说明", key: "internalNote" },
        ],
      },
    ],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["总仓", "分仓", "库存底账"],
  }),
};

export const documentCrudModuleDefinitions: Record<string, CrudModuleDefinition> = {
  "sales-delivery": buildDocumentModule({
    view: "sales-delivery",
    title: "销售出库",
    singular: "销售出库单",
    listDescription: "查看和执行销售出库，跟踪发货状态。",
    statusTabs: ["全部单据", "待拣货", "待复核", "已出库"],
    filters: [
      { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 客户 / 仓库" },
      { key: "warehouse", label: "发货仓库", type: "select", options: ["全部仓库", "华北总仓", "杭州分仓", "华南中心仓"] },
      { key: "status", label: "出库状态", type: "select", options: ["全部状态", "待拣货", "待复核", "已出库"] },
    ],
    columns: [
      { key: "no", label: "单据编号" },
      { key: "counterparty", label: "客户名称" },
      { key: "warehouse", label: "发货仓库" },
      { key: "amount", label: "单据金额", align: "right", kind: "money" },
      { key: "status", label: "出库状态", kind: "status", toneKey: "statusTone" },
      { key: "handler", label: "经手人" },
      { key: "createdAt", label: "业务时间" },
    ],
    records: [
      {
        id: "delivery-001",
        no: "CK20250403001",
        counterparty: "北京吉浓文化传媒有限公司",
        warehouse: "华北总仓",
        amount: money(5028),
        status: "待复核",
        statusTone: "orange",
        handler: "王晨",
        createdAt: "2025/04/03 10:18",
        businessDate: "2025-04-03",
        deliveryDate: "2025-04-05",
        settlement: "30天账期",
        paymentMethod: "银行转账",
        remark: "优先安排标签纸与扫码枪同车发运。",
        internalNote: "等待库内复核后过账。",
        lines: buildLines("CK"),
        timeline: buildTimeline("销售出库", "出库单", "待仓库复核"),
        logs: buildLogs("销售出库"),
        relations: buildRelations("CK"),
      },
      {
        id: "delivery-002",
        no: "CK20250402008",
        counterparty: "杭州智帆商贸有限公司",
        warehouse: "杭州分仓",
        amount: money(7740),
        status: "已出库",
        statusTone: "green",
        handler: "李菲",
        createdAt: "2025/04/02 16:02",
        businessDate: "2025-04-02",
        deliveryDate: "2025-04-03",
        settlement: "现结",
        paymentMethod: "支付宝",
        remark: "客户自提完成。",
        internalNote: "已同步签收状态。",
        lines: buildLines("CK"),
        timeline: buildTimeline("销售出库", "出库单", "已完成"),
        logs: buildLogs("销售出库"),
        relations: buildRelations("CK"),
      },
    ],
    formSections: [
      {
        title: "单据信息",
        fields: [
          { key: "no", label: "单据编号", type: "input", required: true },
          { key: "counterparty", label: "客户名称", type: "select", required: true, options: ["北京吉浓文化传媒有限公司", "杭州智帆商贸有限公司", "苏州元禾供应链有限公司"] },
          { key: "businessDate", label: "业务日期", type: "date", required: true },
          { key: "deliveryDate", label: "出库日期", type: "date" },
          { key: "warehouse", label: "发货仓库", type: "select", options: ["华北总仓", "杭州分仓", "华南中心仓"] },
          { key: "handler", label: "经手人", type: "input" },
          { key: "settlement", label: "结算方式", type: "select", options: ["现结", "15天账期", "30天账期"] },
          { key: "paymentMethod", label: "付款方式", type: "select", options: ["银行转账", "支付宝", "微信支付"] },
        ],
      },
      {
        title: "备注说明",
        fields: [
          { key: "remark", label: "对外备注", type: "textarea", span: 2 },
          { key: "internalNote", label: "内部说明", type: "textarea", span: 2 },
        ],
      },
    ],
    headerFields: [
      { label: "单据编号", key: "no" },
      { label: "客户名称", key: "counterparty" },
      { label: "发货仓库", key: "warehouse" },
      { label: "出库状态", key: "status", kind: "status", toneKey: "statusTone" },
    ],
    detailSections: [
      { title: "单据信息", items: [{ label: "单据编号", key: "no" }, { label: "客户名称", key: "counterparty" }, { label: "业务日期", key: "businessDate" }, { label: "出库日期", key: "deliveryDate" }, { label: "发货仓库", key: "warehouse" }, { label: "经手人", key: "handler" }, { label: "结算方式", key: "settlement" }, { label: "付款方式", key: "paymentMethod" }] },
    ],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["待出库", "库内协同", "履约跟踪"],
    counterpartyLabel: "客户名称",
  }),
  "purchase-orders": buildDocumentModule({
    view: "purchase-orders",
    title: "采购订单",
    singular: "采购订单",
    listDescription: "查看采购下单记录，承接供货需求。",
    statusTabs: ["全部单据", "待确认", "待到货", "已完成"],
    filters: [
      { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 供应商 / 仓库" },
      { key: "warehouse", label: "入库仓库", type: "select", options: ["全部仓库", "华北总仓", "杭州分仓", "华南中心仓"] },
      { key: "status", label: "订单状态", type: "select", options: ["全部状态", "待确认", "待到货", "已完成"] },
    ],
    columns: [
      { key: "no", label: "订单编号" },
      { key: "counterparty", label: "供应商名称" },
      { key: "warehouse", label: "收货仓库" },
      { key: "amount", label: "订单金额", align: "right", kind: "money" },
      { key: "status", label: "订单状态", kind: "status", toneKey: "statusTone" },
      { key: "handler", label: "采购员" },
      { key: "createdAt", label: "下单时间" },
    ],
    records: [
      {
        id: "po-001",
        no: "CG20250403001",
        counterparty: "苏州元禾供应链有限公司",
        warehouse: "华北总仓",
        amount: money(18240),
        status: "待到货",
        statusTone: "blue",
        handler: "沈岩",
        createdAt: "2025/04/03 08:50",
        businessDate: "2025-04-03",
        deliveryDate: "2025-04-08",
        settlement: "30天账期",
        paymentMethod: "银行转账",
        remark: "优先确保扫码设备到货。",
        internalNote: "采购入库将基于该单演示。",
        lines: buildLines("CG"),
        timeline: buildTimeline("采购订单", "采购单", "待供应商回传"),
        logs: buildLogs("采购订单"),
        relations: buildRelations("CG"),
      },
      {
        id: "po-002",
        no: "CG20250401008",
        counterparty: "宁波智链实业有限公司",
        warehouse: "杭州分仓",
        amount: money(9540),
        status: "已完成",
        statusTone: "green",
        handler: "周曼",
        createdAt: "2025/04/01 14:20",
        businessDate: "2025-04-01",
        deliveryDate: "2025-04-06",
        settlement: "现结",
        paymentMethod: "银行转账",
        remark: "常规耗材补货。",
        internalNote: "可作为采购退货上游单据。",
        lines: buildLines("CG"),
        timeline: buildTimeline("采购订单", "采购单", "已完成"),
        logs: buildLogs("采购订单"),
        relations: buildRelations("CG"),
      },
    ],
    formSections: [
      {
        title: "单据信息",
        fields: [
          { key: "no", label: "订单编号", type: "input", required: true },
          { key: "counterparty", label: "供应商名称", type: "select", required: true, options: ["苏州元禾供应链有限公司", "宁波智链实业有限公司"] },
          { key: "businessDate", label: "下单日期", type: "date", required: true },
          { key: "deliveryDate", label: "预计到货", type: "date" },
          { key: "warehouse", label: "收货仓库", type: "select", options: ["华北总仓", "杭州分仓", "华南中心仓"] },
          { key: "handler", label: "采购员", type: "input" },
          { key: "settlement", label: "结算方式", type: "select", options: ["现结", "15天账期", "30天账期"] },
          { key: "paymentMethod", label: "付款方式", type: "select", options: ["银行转账", "支付宝", "微信支付"] },
        ],
      },
      {
        title: "备注说明",
        fields: [
          { key: "remark", label: "对外备注", type: "textarea", span: 2 },
          { key: "internalNote", label: "内部说明", type: "textarea", span: 2 },
        ],
      },
    ],
    headerFields: [
      { label: "订单编号", key: "no" },
      { label: "供应商名称", key: "counterparty" },
      { label: "收货仓库", key: "warehouse" },
      { label: "订单状态", key: "status", kind: "status", toneKey: "statusTone" },
    ],
    detailSections: [
      { title: "单据信息", items: [{ label: "订单编号", key: "no" }, { label: "供应商名称", key: "counterparty" }, { label: "下单日期", key: "businessDate" }, { label: "预计到货", key: "deliveryDate" }, { label: "收货仓库", key: "warehouse" }, { label: "采购员", key: "handler" }, { label: "结算方式", key: "settlement" }, { label: "付款方式", key: "paymentMethod" }] },
    ],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["待到货", "账期采购", "设备补货"],
    counterpartyLabel: "供应商名称",
  }),
  "purchase-receipt": buildDocumentModule({
    view: "purchase-receipt",
    title: "采购入库",
    singular: "采购入库单",
    listDescription: "查看采购入库和到货状态。",
    statusTabs: ["全部单据", "待验收", "待入库", "已入库"],
    filters: [
      { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 供应商 / 仓库" },
      { key: "warehouse", label: "入库仓库", type: "select", options: ["全部仓库", "华北总仓", "杭州分仓", "华南中心仓"] },
      { key: "status", label: "入库状态", type: "select", options: ["全部状态", "待验收", "待入库", "已入库"] },
    ],
    columns: [
      { key: "no", label: "入库单号" },
      { key: "counterparty", label: "供应商名称" },
      { key: "warehouse", label: "入库仓库" },
      { key: "amount", label: "入库金额", align: "right", kind: "money" },
      { key: "status", label: "入库状态", kind: "status", toneKey: "statusTone" },
      { key: "handler", label: "仓库员" },
      { key: "createdAt", label: "到货时间" },
    ],
    records: [
      { id: "pr-001", no: "RK20250403003", counterparty: "苏州元禾供应链有限公司", warehouse: "华北总仓", amount: money(18240), status: "待验收", statusTone: "orange", handler: "王晨", createdAt: "2025/04/03 13:12", businessDate: "2025-04-03", deliveryDate: "2025-04-03", settlement: "30天账期", paymentMethod: "银行转账", remark: "先清点扫码枪数量。", internalNote: "可直接转库存入账。", lines: buildLines("RK"), timeline: buildTimeline("采购入库", "到货单", "待仓库验收"), logs: buildLogs("采购入库"), relations: buildRelations("RK") },
      { id: "pr-002", no: "RK20250402006", counterparty: "宁波智链实业有限公司", warehouse: "杭州分仓", amount: money(9540), status: "已入库", statusTone: "green", handler: "李菲", createdAt: "2025/04/02 11:22", businessDate: "2025-04-02", deliveryDate: "2025-04-02", settlement: "现结", paymentMethod: "银行转账", remark: "耗材已入库完成。", internalNote: "库存同步已完成。", lines: buildLines("RK"), timeline: buildTimeline("采购入库", "到货单", "已完成"), logs: buildLogs("采购入库"), relations: buildRelations("RK") },
    ],
    formSections: [
      { title: "单据信息", fields: [{ key: "no", label: "入库单号", type: "input", required: true }, { key: "counterparty", label: "供应商名称", type: "select", required: true, options: ["苏州元禾供应链有限公司", "宁波智链实业有限公司"] }, { key: "businessDate", label: "到货日期", type: "date", required: true }, { key: "deliveryDate", label: "入库日期", type: "date" }, { key: "warehouse", label: "入库仓库", type: "select", options: ["华北总仓", "杭州分仓", "华南中心仓"] }, { key: "handler", label: "仓库员", type: "input" }, { key: "settlement", label: "结算方式", type: "select", options: ["现结", "15天账期", "30天账期"] }, { key: "paymentMethod", label: "付款方式", type: "select", options: ["银行转账", "支付宝", "微信支付"] }] },
      { title: "备注说明", fields: [{ key: "remark", label: "对外备注", type: "textarea", span: 2 }, { key: "internalNote", label: "内部说明", type: "textarea", span: 2 }] },
    ],
    headerFields: [{ label: "入库单号", key: "no" }, { label: "供应商名称", key: "counterparty" }, { label: "入库仓库", key: "warehouse" }, { label: "入库状态", key: "status", kind: "status", toneKey: "statusTone" }],
    detailSections: [{ title: "单据信息", items: [{ label: "入库单号", key: "no" }, { label: "供应商名称", key: "counterparty" }, { label: "到货日期", key: "businessDate" }, { label: "入库日期", key: "deliveryDate" }, { label: "入库仓库", key: "warehouse" }, { label: "仓库员", key: "handler" }, { label: "结算方式", key: "settlement" }, { label: "付款方式", key: "paymentMethod" }] }],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["待验收", "仓库入账", "采购到货"],
    counterpartyLabel: "供应商名称",
  }),
  "purchase-return": buildDocumentModule({
    view: "purchase-return",
    title: "采购退货",
    singular: "采购退货单",
    listDescription: "查看采购退货记录与供应商协同状态。",
    statusTabs: ["全部单据", "待确认", "待退货", "已完成"],
    filters: [
      { key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 供应商 / 仓库" },
      { key: "warehouse", label: "退货仓库", type: "select", options: ["全部仓库", "华北总仓", "杭州分仓"] },
      { key: "status", label: "退货状态", type: "select", options: ["全部状态", "待确认", "待退货", "已完成"] },
    ],
    columns: [{ key: "no", label: "退货单号" }, { key: "counterparty", label: "供应商名称" }, { key: "warehouse", label: "退货仓库" }, { key: "amount", label: "退货金额", align: "right", kind: "money" }, { key: "status", label: "退货状态", kind: "status", toneKey: "statusTone" }, { key: "handler", label: "经手人" }, { key: "createdAt", label: "发起时间" }],
    records: [
      { id: "rt-001", no: "TH20250403002", counterparty: "宁波智链实业有限公司", warehouse: "杭州分仓", amount: money(2160), status: "待退货", statusTone: "orange", handler: "周曼", createdAt: "2025/04/03 14:02", businessDate: "2025-04-03", deliveryDate: "2025-04-05", settlement: "现结", paymentMethod: "银行转账", remark: "标签纸批次异常，需退回。", internalNote: "已和供应商确认退货窗口。", lines: buildLines("TH"), timeline: buildTimeline("采购退货", "退货单", "待供应商确认"), logs: buildLogs("采购退货"), relations: buildRelations("TH") },
    ],
    formSections: [
      { title: "单据信息", fields: [{ key: "no", label: "退货单号", type: "input", required: true }, { key: "counterparty", label: "供应商名称", type: "select", required: true, options: ["宁波智链实业有限公司", "苏州元禾供应链有限公司"] }, { key: "businessDate", label: "退货日期", type: "date", required: true }, { key: "deliveryDate", label: "预计退回", type: "date" }, { key: "warehouse", label: "退货仓库", type: "select", options: ["华北总仓", "杭州分仓"] }, { key: "handler", label: "经手人", type: "input" }, { key: "settlement", label: "结算方式", type: "select", options: ["现结", "15天账期", "30天账期"] }, { key: "paymentMethod", label: "付款方式", type: "select", options: ["银行转账", "支付宝", "微信支付"] }] },
      { title: "备注说明", fields: [{ key: "remark", label: "对外备注", type: "textarea", span: 2 }, { key: "internalNote", label: "内部说明", type: "textarea", span: 2 }] },
    ],
    headerFields: [{ label: "退货单号", key: "no" }, { label: "供应商名称", key: "counterparty" }, { label: "退货仓库", key: "warehouse" }, { label: "退货状态", key: "status", kind: "status", toneKey: "statusTone" }],
    detailSections: [{ title: "单据信息", items: [{ label: "退货单号", key: "no" }, { label: "供应商名称", key: "counterparty" }, { label: "退货日期", key: "businessDate" }, { label: "预计退回", key: "deliveryDate" }, { label: "退货仓库", key: "warehouse" }, { label: "经手人", key: "handler" }, { label: "结算方式", key: "settlement" }, { label: "付款方式", key: "paymentMethod" }] }],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["异常退货", "供应商协同", "待确认"],
    counterpartyLabel: "供应商名称",
  }),
  "stock-transfer": buildDocumentModule({
    view: "stock-transfer",
    title: "调拨管理",
    singular: "调拨单",
    listDescription: "记录仓间调拨和调拨执行状态。",
    statusTabs: ["全部单据", "待出库", "在途", "已完成"],
    filters: [{ key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 调出仓 / 调入仓" }, { key: "status", label: "调拨状态", type: "select", options: ["全部状态", "待出库", "在途", "已完成"] }],
    columns: [{ key: "no", label: "调拨单号" }, { key: "counterparty", label: "调拨方向" }, { key: "warehouse", label: "调入仓库" }, { key: "amount", label: "调拨金额", align: "right", kind: "money" }, { key: "status", label: "调拨状态", kind: "status", toneKey: "statusTone" }, { key: "handler", label: "经手人" }, { key: "createdAt", label: "发起时间" }],
    records: [{ id: "db-001", no: "DB20250403001", counterparty: "华南中心仓 -> 华北总仓", warehouse: "华北总仓", amount: money(3798), status: "在途", statusTone: "blue", handler: "王晨", createdAt: "2025/04/03 12:20", businessDate: "2025-04-03", deliveryDate: "2025-04-04", settlement: "内部调拨", paymentMethod: "无需付款", remark: "优先补足华北可用库存。", internalNote: "蓝牙手持终端跨仓调拨。", lines: buildLines("DB"), timeline: buildTimeline("调拨管理", "调拨单", "在途运输"), logs: buildLogs("调拨单"), relations: buildRelations("DB") }],
    formSections: [{ title: "单据信息", fields: [{ key: "no", label: "调拨单号", type: "input", required: true }, { key: "counterparty", label: "调拨方向", type: "input", required: true }, { key: "businessDate", label: "调拨日期", type: "date", required: true }, { key: "deliveryDate", label: "预计到货", type: "date" }, { key: "warehouse", label: "调入仓库", type: "select", options: ["华北总仓", "杭州分仓", "华南中心仓"] }, { key: "handler", label: "经手人", type: "input" }, { key: "settlement", label: "业务类型", type: "select", options: ["内部调拨"] }, { key: "paymentMethod", label: "付款方式", type: "select", options: ["无需付款"] }] }, { title: "备注说明", fields: [{ key: "remark", label: "对外备注", type: "textarea", span: 2 }, { key: "internalNote", label: "内部说明", type: "textarea", span: 2 }] }],
    headerFields: [{ label: "调拨单号", key: "no" }, { label: "调拨方向", key: "counterparty" }, { label: "调入仓库", key: "warehouse" }, { label: "调拨状态", key: "status", kind: "status", toneKey: "statusTone" }],
    detailSections: [{ title: "单据信息", items: [{ label: "调拨单号", key: "no" }, { label: "调拨方向", key: "counterparty" }, { label: "调拨日期", key: "businessDate" }, { label: "预计到货", key: "deliveryDate" }, { label: "调入仓库", key: "warehouse" }, { label: "经手人", key: "handler" }, { label: "业务类型", key: "settlement" }, { label: "付款方式", key: "paymentMethod" }] }],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["跨仓协同", "在途", "内部调拨"],
  }),
  "stock-count": buildDocumentModule({
    view: "stock-count",
    title: "盘点管理",
    singular: "盘点单",
    listDescription: "查看盘点计划、差异和处理结果。",
    statusTabs: ["全部单据", "待盘点", "待处理", "已完成"],
    filters: [{ key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 仓库 / 负责人" }, { key: "status", label: "盘点状态", type: "select", options: ["全部状态", "待盘点", "待处理", "已完成"] }],
    columns: [{ key: "no", label: "盘点单号" }, { key: "counterparty", label: "盘点仓库" }, { key: "warehouse", label: "责任区域" }, { key: "amount", label: "差异金额", align: "right", kind: "money" }, { key: "status", label: "盘点状态", kind: "status", toneKey: "statusTone" }, { key: "handler", label: "负责人" }, { key: "createdAt", label: "发起时间" }],
    records: [{ id: "pd-001", no: "PD20250402001", counterparty: "华北总仓", warehouse: "设备区", amount: money(680), status: "待处理", statusTone: "orange", handler: "王晨", createdAt: "2025/04/02 17:30", businessDate: "2025-04-02", deliveryDate: "2025-04-03", settlement: "月度盘点", paymentMethod: "无需付款", remark: "扫码枪盘亏2支。", internalNote: "等待差异确认。", lines: buildLines("PD"), timeline: buildTimeline("盘点管理", "盘点单", "待差异处理"), logs: buildLogs("盘点单"), relations: buildRelations("PD") }],
    formSections: [{ title: "单据信息", fields: [{ key: "no", label: "盘点单号", type: "input", required: true }, { key: "counterparty", label: "盘点仓库", type: "select", required: true, options: ["华北总仓", "杭州分仓", "华南中心仓"] }, { key: "businessDate", label: "盘点日期", type: "date", required: true }, { key: "deliveryDate", label: "处理截止", type: "date" }, { key: "warehouse", label: "责任区域", type: "input" }, { key: "handler", label: "负责人", type: "input" }, { key: "settlement", label: "盘点类型", type: "select", options: ["月度盘点", "临时盘点"] }, { key: "paymentMethod", label: "处理方式", type: "select", options: ["无需付款"] }] }, { title: "备注说明", fields: [{ key: "remark", label: "对外备注", type: "textarea", span: 2 }, { key: "internalNote", label: "内部说明", type: "textarea", span: 2 }] }],
    headerFields: [{ label: "盘点单号", key: "no" }, { label: "盘点仓库", key: "counterparty" }, { label: "责任区域", key: "warehouse" }, { label: "盘点状态", key: "status", kind: "status", toneKey: "statusTone" }],
    detailSections: [{ title: "单据信息", items: [{ label: "盘点单号", key: "no" }, { label: "盘点仓库", key: "counterparty" }, { label: "盘点日期", key: "businessDate" }, { label: "处理截止", key: "deliveryDate" }, { label: "责任区域", key: "warehouse" }, { label: "负责人", key: "handler" }, { label: "盘点类型", key: "settlement" }, { label: "处理方式", key: "paymentMethod" }] }],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["月度盘点", "差异处理", "仓库责任"],
  }),
  "stock-loss": buildDocumentModule({
    view: "stock-loss",
    title: "报损管理",
    singular: "报损单",
    listDescription: "记录报损申请和库存调整结果。",
    statusTabs: ["全部单据", "待审核", "待处理", "已完成"],
    filters: [{ key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 仓库 / 负责人" }, { key: "status", label: "报损状态", type: "select", options: ["全部状态", "待审核", "待处理", "已完成"] }],
    columns: [{ key: "no", label: "报损单号" }, { key: "counterparty", label: "报损仓库" }, { key: "warehouse", label: "责任区域" }, { key: "amount", label: "报损金额", align: "right", kind: "money" }, { key: "status", label: "报损状态", kind: "status", toneKey: "statusTone" }, { key: "handler", label: "负责人" }, { key: "createdAt", label: "申请时间" }],
    records: [{ id: "bs-001", no: "BS20250403001", counterparty: "华北总仓", warehouse: "设备区", amount: money(598), status: "待审核", statusTone: "orange", handler: "李菲", createdAt: "2025/04/03 11:20", businessDate: "2025-04-03", deliveryDate: "2025-04-04", settlement: "异常报损", paymentMethod: "无需付款", remark: "设备包装破损，申请报损。", internalNote: "等待主管审核。", lines: buildLines("BS"), timeline: buildTimeline("报损管理", "报损单", "待主管审核"), logs: buildLogs("报损单"), relations: buildRelations("BS") }],
    formSections: [{ title: "单据信息", fields: [{ key: "no", label: "报损单号", type: "input", required: true }, { key: "counterparty", label: "报损仓库", type: "select", required: true, options: ["华北总仓", "杭州分仓", "华南中心仓"] }, { key: "businessDate", label: "申请日期", type: "date", required: true }, { key: "deliveryDate", label: "处理截止", type: "date" }, { key: "warehouse", label: "责任区域", type: "input" }, { key: "handler", label: "负责人", type: "input" }, { key: "settlement", label: "报损类型", type: "select", options: ["异常报损", "自然损耗"] }, { key: "paymentMethod", label: "处理方式", type: "select", options: ["无需付款"] }] }, { title: "备注说明", fields: [{ key: "remark", label: "对外备注", type: "textarea", span: 2 }, { key: "internalNote", label: "内部说明", type: "textarea", span: 2 }] }],
    headerFields: [{ label: "报损单号", key: "no" }, { label: "报损仓库", key: "counterparty" }, { label: "责任区域", key: "warehouse" }, { label: "报损状态", key: "status", kind: "status", toneKey: "statusTone" }],
    detailSections: [{ title: "单据信息", items: [{ label: "报损单号", key: "no" }, { label: "报损仓库", key: "counterparty" }, { label: "申请日期", key: "businessDate" }, { label: "处理截止", key: "deliveryDate" }, { label: "责任区域", key: "warehouse" }, { label: "负责人", key: "handler" }, { label: "报损类型", key: "settlement" }, { label: "处理方式", key: "paymentMethod" }] }],
    noteKeys: { external: "remark", internal: "internalNote" },
    tags: ["待审核", "库存调整", "异常处理"],
  }),
};

export const queryModuleDefinitions: Record<string, QueryModuleDefinition> = {
  "sales-query": { kind: "query", view: "sales-query", title: "销售查询", listDescription: "查询订单、客户、商品维度的销售记录。", filters: [{ key: "keyword", label: "综合搜索", type: "search", placeholder: "单号 / 客户 / 商品" }, { key: "status", label: "订单状态", type: "select", options: ["全部状态", "待审核", "待出库", "已完成"] }, { key: "date", label: "业务日期", type: "dateRange" }], metrics: [{ label: "本月销售额", value: money(362580), tone: "blue" }, { label: "订单数", value: "182单", tone: "green" }, { label: "客单价", value: money(1992), tone: "orange" }], columns: [{ key: "no", label: "订单编号" }, { key: "customer", label: "客户名称" }, { key: "product", label: "商品名称" }, { key: "qty", label: "数量", align: "right" }, { key: "amount", label: "销售金额", align: "right", kind: "money" }, { key: "status", label: "状态", kind: "status", toneKey: "tone" }], rows: [{ no: "XS20250403001", customer: "北京吉浓文化传媒有限公司", product: "便携扫码枪", qty: "12", amount: money(5028), status: "待审核", tone: "orange" }, { no: "XS20250403002", customer: "杭州智帆商贸有限公司", product: "热敏打印机", qty: "8", amount: money(7740), status: "待出库", tone: "blue" }, { no: "XS20250402017", customer: "宁波智链实业有限公司", product: "标签打印纸", qty: "120", amount: money(2160), status: "已完成", tone: "green" }] },
  "receivable-query": { kind: "query", view: "receivable-query", title: "应收查询", listDescription: "查看客户应收余额与账龄。", filters: [{ key: "keyword", label: "综合搜索", type: "search", placeholder: "客户 / 单据 / 经手人" }, { key: "aging", label: "账龄区间", type: "select", options: ["全部", "30天内", "31-60天", "60天以上"] }, { key: "date", label: "业务日期", type: "dateRange" }], metrics: [{ label: "应收余额", value: money(86420), tone: "orange" }, { label: "逾期金额", value: money(14320), tone: "red" }, { label: "本月回款", value: money(28600), tone: "green" }], columns: [{ key: "customer", label: "客户名称" }, { key: "documentNo", label: "单据编号" }, { key: "receivable", label: "应收金额", align: "right", kind: "money" }, { key: "paid", label: "已收金额", align: "right", kind: "money" }, { key: "balance", label: "未收金额", align: "right", kind: "money" }, { key: "status", label: "状态", kind: "status", toneKey: "tone" }], rows: [{ customer: "北京吉浓文化传媒有限公司", documentNo: "XS20250403001", receivable: money(18600), paid: money(8000), balance: money(10600), status: "待回款", tone: "orange" }, { customer: "苏州元禾供应链有限公司", documentNo: "XS20250401025", receivable: money(14320), paid: money(0), balance: money(14320), status: "已逾期", tone: "red" }] },
  "payable-query": { kind: "query", view: "payable-query", title: "应付查询", listDescription: "查看供应商应付余额与账期。", filters: [{ key: "keyword", label: "综合搜索", type: "search", placeholder: "供应商 / 单据 / 经手人" }, { key: "aging", label: "账龄区间", type: "select", options: ["全部", "30天内", "31-60天", "60天以上"] }, { key: "date", label: "业务日期", type: "dateRange" }], metrics: [{ label: "应付余额", value: money(125800), tone: "orange" }, { label: "本月付款", value: money(46800), tone: "green" }, { label: "待结供应商", value: "8家", tone: "blue" }], columns: [{ key: "supplier", label: "供应商名称" }, { key: "documentNo", label: "单据编号" }, { key: "payable", label: "应付金额", align: "right", kind: "money" }, { key: "paid", label: "已付金额", align: "right", kind: "money" }, { key: "balance", label: "未付金额", align: "right", kind: "money" }, { key: "status", label: "状态", kind: "status", toneKey: "tone" }], rows: [{ supplier: "苏州元禾供应链有限公司", documentNo: "CG20250403001", payable: money(18240), paid: money(0), balance: money(18240), status: "待付款", tone: "orange" }, { supplier: "宁波智链实业有限公司", documentNo: "CG20250401008", payable: money(9540), paid: money(9540), balance: money(0), status: "已结清", tone: "green" }] },
  "sales-summary": { kind: "query", view: "sales-summary", title: "销售汇总", listDescription: "提供基础销售汇总指标和趋势。", filters: [{ key: "keyword", label: "综合搜索", type: "search", placeholder: "客户 / 商品 / 区域" }, { key: "region", label: "区域", type: "select", options: ["全部区域", "华北", "华东", "华南"] }, { key: "date", label: "统计日期", type: "dateRange" }], metrics: [{ label: "销售额", value: money(362580), tone: "blue" }, { label: "毛利额", value: money(128340), tone: "green" }, { label: "订单数", value: "182单", tone: "orange" }], columns: [{ key: "dimension", label: "维度" }, { key: "sales", label: "销售额", align: "right", kind: "money" }, { key: "gross", label: "毛利额", align: "right", kind: "money" }, { key: "orders", label: "订单数", align: "right" }, { key: "trend", label: "趋势" }], rows: [{ dimension: "华北区域", sales: money(162580), gross: money(58340), orders: "72", trend: "环比+8.2%" }, { dimension: "华东区域", sales: money(124800), gross: money(43820), orders: "61", trend: "环比+4.1%" }, { dimension: "华南区域", sales: money(75200), gross: money(26180), orders: "49", trend: "环比-2.3%" }] },
  "inventory-balance": { kind: "query", view: "inventory-balance", title: "库存余额", listDescription: "提供库存余额和仓库口径视图。", filters: [{ key: "keyword", label: "综合搜索", type: "search", placeholder: "商品 / SKU / 仓库" }, { key: "warehouse", label: "仓库", type: "select", options: ["全部仓库", "华北总仓", "杭州分仓", "华南中心仓"] }, { key: "date", label: "统计日期", type: "dateRange" }], metrics: [{ label: "现存总量", value: "4,862件", tone: "blue" }, { label: "可用库存", value: "4,125件", tone: "green" }, { label: "低库存商品", value: "12个", tone: "orange" }], columns: [{ key: "sku", label: "SKU" }, { key: "product", label: "商品名称" }, { key: "warehouse", label: "仓库" }, { key: "current", label: "现存", align: "right" }, { key: "reserved", label: "占用", align: "right" }, { key: "available", label: "可用", align: "right" }], rows: [{ sku: "SKU-100124", product: "便携扫码枪", warehouse: "华北总仓", current: "24", reserved: "8", available: "16" }, { sku: "SKU-100331", product: "标签打印纸", warehouse: "杭州分仓", current: "12", reserved: "6", available: "6" }] },
};

export const formModuleDefinitions: Record<string, FormModuleDefinition> = {
  "payment-entry": {
    kind: "form",
    view: "payment-entry",
    title: "付款登记",
    description: "记录供应商付款及备注。",
    sections: [
      {
        title: "付款信息",
        fields: [
          { key: "supplier", label: "供应商名称", type: "select", required: true, options: ["苏州元禾供应链有限公司", "宁波智链实业有限公司"] },
          { key: "documentType", label: "单据类型", type: "select", required: true, options: ["采购订单", "采购入库", "采购退货"] },
          { key: "amount", label: "付款金额", type: "input", required: true },
          { key: "paymentMethod", label: "付款方式", type: "select", required: true, options: ["银行转账", "支付宝", "微信支付"] },
          { key: "paidAt", label: "付款时间", type: "date", required: true },
          { key: "handler", label: "付款人", type: "input" },
        ],
      },
      {
        title: "备注说明",
        fields: [
          { key: "note", label: "备注", type: "textarea", span: 2 },
        ],
      },
    ],
    sideSummary: [
      { label: "供应商应付余额", value: money(28640) },
      { label: "本月已付款", value: money(16800) },
      { label: "待跟进单据", value: "3笔" },
    ],
  },
};

export const configModuleDefinitions: Record<string, ConfigModuleDefinition> = {
  "user-permission": {
    kind: "config",
    view: "user-permission",
    title: "用户与权限",
    description: "维护用户账号、角色与数据权限。",
    userColumns: [
      { key: "username", label: "用户名" },
      { key: "name", label: "姓名" },
      { key: "role", label: "角色", kind: "status", toneKey: "roleTone" },
      { key: "department", label: "部门" },
      { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
      { key: "lastLogin", label: "最后登录" },
    ],
    users: [
      { id: "u001", username: "wangchen", name: "王晨", role: "业务员", roleTone: "blue", department: "销售部", status: "启用", statusTone: "green", lastLogin: "2025/04/03 18:30" },
      { id: "u002", username: "lifei", name: "李菲", role: "仓库员", roleTone: "green", department: "仓储部", status: "启用", statusTone: "green", lastLogin: "2025/04/03 17:45" },
      { id: "u003", username: "qianyu", name: "钱宇", role: "管理员", roleTone: "orange", department: "管理层", status: "启用", statusTone: "green", lastLogin: "2025/04/03 09:00" },
      { id: "u004", username: "zhouman", name: "周曼", role: "业务员", roleTone: "blue", department: "销售部", status: "启用", statusTone: "green", lastLogin: "2025/04/02 16:20" },
      { id: "u005", username: "sunli", name: "孙丽", role: "仓库员", roleTone: "green", department: "仓储部", status: "停用", statusTone: "gray", lastLogin: "2025/03/28 10:00" },
      { id: "u006", username: "zhubao", name: "朱宝", role: "业务员", roleTone: "blue", department: "销售部", status: "启用", statusTone: "green", lastLogin: "2025/04/03 14:30" },
    ],
    roleColumns: [
      { key: "roleName", label: "角色名称" },
      { key: "roleCode", label: "角色编码" },
      { key: "userCount", label: "用户数" },
      { key: "description", label: "说明" },
    ],
    roles: [
      { id: "r001", roleName: "管理员", roleCode: "ADMIN", userCount: "3人", description: "系统全部权限" },
      { id: "r002", roleName: "业务员", roleCode: "SALEMAN", userCount: "12人", description: "销售订单、发货权限" },
      { id: "r003", roleName: "仓库员", roleCode: "WAREHOUSE", userCount: "8人", description: "出库、入库、盘点权限" },
      { id: "r004", roleName: "财务", roleCode: "FINANCE", userCount: "2人", description: "收款、付款、对账权限" },
    ],
    logs: buildLogs("用户权限"),
  },
  "document-number": {
    kind: "config",
    view: "document-number",
    title: "单据编号",
    description: "配置销售、采购、库存单据的编号规则。",
    ruleColumns: [
      { key: "docType", label: "单据类型" },
      { key: "prefix", label: "前缀" },
      { key: "dateFormat", label: "日期格式" },
      { key: "sequence", label: "序号位数" },
      { key: "resetType", label: "重置方式" },
      { key: "status", label: "状态", kind: "status", toneKey: "statusTone" },
    ],
    rules: [
      { id: "rule001", docType: "销售订单", prefix: "XS", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "日归零", status: "启用", statusTone: "green" },
      { id: "rule002", docType: "采购订单", prefix: "CG", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "月归零", status: "启用", statusTone: "green" },
      { id: "rule003", docType: "零售单", prefix: "LS", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "日归零", status: "启用", statusTone: "green" },
      { id: "rule004", docType: "出库单", prefix: "CK", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "日归零", status: "启用", statusTone: "green" },
      { id: "rule005", docType: "入库单", prefix: "RK", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "月归零", status: "启用", statusTone: "green" },
      { id: "rule006", docType: "调拨单", prefix: "DB", dateFormat: "YYYYMMDD", sequence: "4位", resetType: "月归零", status: "停用", statusTone: "gray" },
    ],
    logs: buildLogs("编号规则"),
  },
  "opening-init": {
    kind: "config",
    view: "opening-init",
    title: "期初初始化",
    description: "查看商品、客户、供应商和库存期初导入状态。",
    panels: [
      { title: "初始化进度", desc: "按主数据和库存维度查看期初装载状态。", items: [
        { label: "商品期初", value: "已完成", tone: "green" },
        { label: "客户期初", value: "已完成", tone: "green" },
        { label: "供应商期初", value: "已完成", tone: "green" },
        { label: "库存期初", value: "待复核", tone: "orange" },
      ]},
      { title: "导入要求", desc: "确保期初数据口径与库存底账一致。", items: [
        { label: "模板版本", value: "V2.1" },
        { label: "校验规则", value: "编码唯一/数量非负" },
        { label: "责任人", value: "实施顾问" },
      ]},
    ],
    logs: buildLogs("期初初始化"),
  },
  "print-template": {
    kind: "config",
    view: "print-template",
    title: "打印模板",
    description: "维护销售、采购、库存单据打印模板。",
    templateColumns: [
      { key: "docType", label: "单据类型" },
      { key: "templateName", label: "模板名称" },
      { key: "paperSize", label: "纸张尺寸" },
      { key: "isDefault", label: "默认模板", kind: "status", toneKey: "isDefaultTone" },
      { key: "updatedAt", label: "更新时间" },
    ],
    templates: [
      { id: "tpl001", docType: "销售订单", templateName: "标准版A4", paperSize: "A4", isDefault: "是", isDefaultTone: "green", updatedAt: "2025/03/15" },
      { id: "tpl002", docType: "销售订单", templateName: "简洁版A5", paperSize: "A5", isDefault: "否", isDefaultTone: "gray", updatedAt: "2025/03/15" },
      { id: "tpl003", docType: "采购订单", templateName: "供应商版A4", paperSize: "A4", isDefault: "是", isDefaultTone: "green", updatedAt: "2025/03/15" },
      { id: "tpl004", docType: "出库单", templateName: "仓库版热敏", paperSize: "80mm", isDefault: "是", isDefaultTone: "green", updatedAt: "2025/03/20" },
      { id: "tpl005", docType: "入库单", templateName: "标准版A4", paperSize: "A4", isDefault: "是", isDefaultTone: "green", updatedAt: "2025/03/15" },
    ],
    logs: buildLogs("打印模板"),
  },
  "operation-log": {
    kind: "config",
    view: "operation-log",
    title: "操作日志",
    description: "查看关键业务操作、审批动作和配置变更。",
    logs: [
      { time: "2025/04/03 18:30", user: "王晨", action: "登录", detail: "用户登录系统" },
      { time: "2025/04/03 18:25", user: "王晨", action: "修改", detail: "销售订单 XS20250403001 已更新" },
      { time: "2025/04/03 17:45", user: "李菲", action: "出库", detail: "出库单 CK20250403002 已确认" },
      { time: "2025/04/03 17:30", user: "钱宇", action: "新增", detail: "新增用户 wangqiang" },
      { time: "2025/04/03 16:20", user: "周曼", action: "审核", detail: "销售订单 XS20250403001 已通过审核" },
      { time: "2025/04/03 15:00", user: "系统", action: "流转", detail: "单据 XS20250402003 进入收款节点" },
      { time: "2025/04/03 14:30", user: "朱宝", action: "创建", detail: "销售订单 XS20250403003 已创建" },
      { time: "2025/04/03 12:20", user: "王晨", action: "创建", detail: "调拨单 DB20250403001 已创建" },
      { time: "2025/04/03 10:10", user: "系统", action: "告警", detail: "库存预警：SKU-100124 现存低于最小库存" },
      { time: "2025/04/03 09:00", user: "钱宇", action: "配置", detail: "单据编号规则已更新" },
    ],
  },
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

export function getModuleDefinition(view: ViewKey) {
  return allModuleDefinitions[view];
}

export function getCrudModuleDefinition(view: ViewKey) {
  return ({ ...crudModuleDefinitions, ...documentCrudModuleDefinitions } as Record<string, CrudModuleDefinition>)[view];
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
  const first = module.records[0];
  const draft = JSON.parse(JSON.stringify(first)) as CrudRecord;
  draft.id = `${view}-draft`;
  if ("no" in draft) {
    draft.no = `${String(draft.no).slice(0, 2)}20250403999`;
  }
  if ("code" in draft) {
    draft.code = `${String(draft.code).split("-")[0]}-DRAFT`;
  }
  draft.status = "草稿";
  draft.statusTone = "gray";
  draft.logs = buildLogs(module.singular);
  if (draft.timeline) {
    draft.timeline = [{ title: "草稿创建", detail: `已创建${module.singular}草稿。`, owner: "当前用户", time: "2025/04/03 15:00", tone: "gray" }];
  }
  return draft;
}
