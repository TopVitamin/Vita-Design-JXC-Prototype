import type { SalesOrder } from "./mock";

export type SalesOrderLineItem = {
  id: string;
  sku: string;
  productName: string;
  spec: string;
  unit: string;
  availableStock: number;
  qty: number;
  price: number;
  discountRate: number;
  taxRate: number;
  deliveryDate: string;
  note: string;
};

export type SalesOrderTimelineStep = {
  id: string;
  title: string;
  detail: string;
  owner: string;
  time: string;
  tone: "green" | "blue" | "orange" | "red" | "gray";
};

export type SalesOrderActionLog = {
  id: string;
  user: string;
  action: string;
  detail: string;
  time: string;
};

export type SalesOrderRelatedDocument = {
  id: string;
  type: string;
  no: string;
  status: string;
  amount: string;
};

export type SalesOrderCustomerProfile = {
  name: string;
  code: string;
  level: string;
  contactName: string;
  contactPhone: string;
  address: string;
  settlementMethod: string;
  paymentMethod: string;
  priceTier: string;
  creditLimit: string;
  receivableBalance: string;
  availableCredit: string;
  tags: string[];
};

export type SalesOrderProductProfile = {
  sku: string;
  productName: string;
  spec: string;
  unit: string;
  warehouseSuggestions: string[];
  availableStock: number;
  referencePrice: number;
  taxRate: number;
};

export type SalesOrderWorkspaceRecord = {
  id: string;
  orderNo: string;
  customer: string;
  customerCode: string;
  customerLevel: string;
  businessDate: string;
  deliveryDate: string;
  warehouse: string;
  salesChannel: string;
  salesperson: string;
  settlementMethod: string;
  paymentMethod: string;
  deliveryMethod: string;
  freightBearer: string;
  priceTier: string;
  priority: string;
  source: string;
  status: string;
  statusTone: SalesOrder["statusTone"];
  paymentStatus: string;
  deliveryStatus: string;
  approvalStatus: string;
  contactName: string;
  contactPhone: string;
  address: string;
  remark: string;
  internalRemark: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
  creditLimit: string;
  receivableBalance: string;
  availableCredit: string;
  riskNote: string;
  tags: string[];
  lines: SalesOrderLineItem[];
  timeline: SalesOrderTimelineStep[];
  actionLogs: SalesOrderActionLog[];
  relatedDocs: SalesOrderRelatedDocument[];
  recommendedActions: string[];
};

export const salesOrderCustomerProfiles: SalesOrderCustomerProfile[] = [
  {
    name: "北京吉浓文化传媒有限公司",
    code: "KH-000128",
    level: "A类客户",
    contactName: "赵倩",
    contactPhone: "13800138011",
    address: "北京市朝阳区望京SOHO T2-1208",
    settlementMethod: "30天账期",
    paymentMethod: "银行转账",
    priceTier: "批发价A",
    creditLimit: "¥200,000.00",
    receivableBalance: "¥26,420.00",
    availableCredit: "¥173,580.00",
    tags: ["账期客户", "重点维护"],
  },
  {
    name: "杭州智帆商贸有限公司",
    code: "KH-000207",
    level: "重点客户",
    contactName: "陈扬",
    contactPhone: "13700137022",
    address: "杭州市拱墅区祥园路88号跨贸园B座902",
    settlementMethod: "现结",
    paymentMethod: "支付宝",
    priceTier: "批发价B",
    creditLimit: "¥80,000.00",
    receivableBalance: "¥9,840.00",
    availableCredit: "¥70,160.00",
    tags: ["现款现货", "高频补货"],
  },
  {
    name: "苏州元禾供应链有限公司",
    code: "KH-000318",
    level: "重点客户",
    contactName: "周祺",
    contactPhone: "13900139033",
    address: "苏州市工业园区星湖街328号创意产业园6栋",
    settlementMethod: "15天账期",
    paymentMethod: "银行转账",
    priceTier: "批发价A",
    creditLimit: "¥150,000.00",
    receivableBalance: "¥14,320.00",
    availableCredit: "¥135,680.00",
    tags: ["账期客户", "跨仓协同"],
  },
  {
    name: "深圳腾岳科技有限公司",
    code: "KH-000406",
    level: "账期客户",
    contactName: "李澈",
    contactPhone: "13600136044",
    address: "深圳市南山区科技园高新南七道12号",
    settlementMethod: "45天账期",
    paymentMethod: "银行转账",
    priceTier: "项目价",
    creditLimit: "¥300,000.00",
    receivableBalance: "¥68,450.00",
    availableCredit: "¥231,550.00",
    tags: ["项目客户", "审批从严"],
  },
];

export const salesOrderProductCatalog: SalesOrderProductProfile[] = [
  {
    sku: "SKU-100124",
    productName: "便携扫码枪",
    spec: "无线版",
    unit: "支",
    warehouseSuggestions: ["华北总仓", "杭州分仓"],
    availableStock: 24,
    referencePrice: 299,
    taxRate: 13,
  },
  {
    sku: "SKU-100331",
    productName: "标签打印纸",
    spec: "100mm*50mm",
    unit: "卷",
    warehouseSuggestions: ["华北总仓", "杭州分仓", "苏州仓"],
    availableStock: 128,
    referencePrice: 18,
    taxRate: 13,
  },
  {
    sku: "SKU-100422",
    productName: "热敏打印机",
    spec: "旗舰版",
    unit: "台",
    warehouseSuggestions: ["华南中心仓", "华北总仓"],
    availableStock: 88,
    referencePrice: 699,
    taxRate: 13,
  },
  {
    sku: "SKU-100518",
    productName: "蓝牙手持终端",
    spec: "Pro 128G",
    unit: "台",
    warehouseSuggestions: ["华东总仓", "华南中心仓"],
    availableStock: 36,
    referencePrice: 1899,
    taxRate: 13,
  },
  {
    sku: "SKU-100610",
    productName: "仓储周转箱",
    spec: "600*400蓝色",
    unit: "个",
    warehouseSuggestions: ["华北总仓", "苏州仓"],
    availableStock: 260,
    referencePrice: 62,
    taxRate: 13,
  },
];

export const salesOrderWarehouseOptions = ["华北总仓", "华东总仓", "华南中心仓", "杭州分仓", "苏州仓"];
export const salesOrderSalesChannelOptions = ["直营网销", "线下批发", "项目交付", "区域经销"];
export const salesOrderSettlementOptions = ["现结", "15天账期", "30天账期", "45天账期"];
export const salesOrderPaymentOptions = ["银行转账", "支付宝", "微信支付", "现金"];
export const salesOrderDeliveryMethodOptions = ["仓库自提", "物流发运", "销售配送", "第三方快递"];
export const salesOrderPriorityOptions = ["普通", "加急", "重点保障"];
export const salesOrderTagOptions = ["账期客户", "重点维护", "高频补货", "项目客户", "跨仓协同", "审批从严"];

const salesOrderRecords: Record<string, SalesOrderWorkspaceRecord> = {
  "SO-202504-001": {
    id: "SO-202504-001",
    orderNo: "XS20250403001",
    customer: "北京吉浓文化传媒有限公司",
    customerCode: "KH-000128",
    customerLevel: "A类客户",
    businessDate: "2025-04-03",
    deliveryDate: "2025-04-05",
    warehouse: "华北总仓",
    salesChannel: "线下批发",
    salesperson: "王晨",
    settlementMethod: "30天账期",
    paymentMethod: "银行转账",
    deliveryMethod: "物流发运",
    freightBearer: "客户承担",
    priceTier: "批发价A",
    priority: "重点保障",
    source: "业务员代客下单",
    status: "待审核",
    statusTone: "orange",
    paymentStatus: "部分收款",
    deliveryStatus: "未出库",
    approvalStatus: "待财务复核",
    contactName: "赵倩",
    contactPhone: "13800138011",
    address: "北京市朝阳区望京SOHO T2-1208",
    remark: "客户要求4月5日上午前送达，标签打印纸与扫码枪需同车发出。",
    internalRemark: "首单加急，需同步校验客户可用信用和预收款。",
    creator: "王晨",
    createdAt: "2025/04/03 09:31",
    updatedAt: "2025/04/03 11:06",
    creditLimit: "¥200,000.00",
    receivableBalance: "¥26,420.00",
    availableCredit: "¥173,580.00",
    riskNote: "客户账期正常，但本周新增两笔待审订单，建议财务先确认预收款与信用占用。",
    tags: ["账期客户", "重点维护"],
    lines: [
      {
        id: "line-1",
        sku: "SKU-100124",
        productName: "便携扫码枪",
        spec: "无线版",
        unit: "支",
        availableStock: 24,
        qty: 20,
        price: 299,
        discountRate: 96,
        taxRate: 13,
        deliveryDate: "2025-04-05",
        note: "优先从华北总仓整箱发运",
      },
      {
        id: "line-2",
        sku: "SKU-100331",
        productName: "标签打印纸",
        spec: "100mm*50mm",
        unit: "卷",
        availableStock: 128,
        qty: 180,
        price: 18,
        discountRate: 100,
        taxRate: 13,
        deliveryDate: "2025-04-05",
        note: "与主货同送",
      },
    ],
    timeline: [
      { id: "t-1", title: "草稿创建", detail: "业务员代客下单，已补全客户和收货信息。", owner: "王晨", time: "2025/04/03 09:31", tone: "blue" },
      { id: "t-2", title: "客户确认", detail: "客户确认采购数量与送达时点。", owner: "赵倩", time: "2025/04/03 09:48", tone: "green" },
      { id: "t-3", title: "待财务复核", detail: "因账期客户新增订单，等待财务确认信用占用。", owner: "财务共享组", time: "2025/04/03 10:06", tone: "orange" },
    ],
    actionLogs: [
      { id: "a-1", user: "王晨", action: "创建订单", detail: "从销售订单列表发起新增并录入2行商品。", time: "2025/04/03 09:31" },
      { id: "a-2", user: "王晨", action: "修改收货信息", detail: "补充收货地址与联系人手机号。", time: "2025/04/03 09:40" },
      { id: "a-3", user: "李菲", action: "添加审核意见", detail: "建议核验预收款后进入审核。", time: "2025/04/03 11:06" },
    ],
    relatedDocs: [
      { id: "r-1", type: "收款登记", no: "SK20250403008", status: "已登记¥8,000.00", amount: "¥8,000.00" },
      { id: "r-2", type: "库存占用", no: "ZY20250403001", status: "已锁定", amount: "2行商品" },
    ],
    recommendedActions: ["优先复核信用额度", "确认标签打印纸是否整卷发货", "审核通过后自动推送出库任务"],
  },
  "SO-202504-002": {
    id: "SO-202504-002",
    orderNo: "XS20250403002",
    customer: "杭州智帆商贸有限公司",
    customerCode: "KH-000207",
    customerLevel: "重点客户",
    businessDate: "2025-04-03",
    deliveryDate: "2025-04-04",
    warehouse: "杭州分仓",
    salesChannel: "区域经销",
    salesperson: "李菲",
    settlementMethod: "现结",
    paymentMethod: "支付宝",
    deliveryMethod: "仓库自提",
    freightBearer: "客户承担",
    priceTier: "批发价B",
    priority: "加急",
    source: "移动端下单",
    status: "待出库",
    statusTone: "blue",
    paymentStatus: "已收款",
    deliveryStatus: "拣货中",
    approvalStatus: "审核通过",
    contactName: "陈扬",
    contactPhone: "13700137022",
    address: "杭州市拱墅区祥园路88号跨贸园B座902",
    remark: "客户下午自提，需先准备出库单和装箱清单。",
    internalRemark: "已全额收款，库内优先拣货。",
    creator: "李菲",
    createdAt: "2025/04/03 10:12",
    updatedAt: "2025/04/03 14:10",
    creditLimit: "¥80,000.00",
    receivableBalance: "¥9,840.00",
    availableCredit: "¥70,160.00",
    riskNote: "现结订单风险低，主要关注拣货和自提交接。",
    tags: ["现款现货", "高频补货"],
    lines: [
      {
        id: "line-1",
        sku: "SKU-100422",
        productName: "热敏打印机",
        spec: "旗舰版",
        unit: "台",
        availableStock: 88,
        qty: 8,
        price: 699,
        discountRate: 95,
        taxRate: 13,
        deliveryDate: "2025-04-04",
        note: "自提前完成通电检查",
      },
      {
        id: "line-2",
        sku: "SKU-100331",
        productName: "标签打印纸",
        spec: "100mm*50mm",
        unit: "卷",
        availableStock: 128,
        qty: 120,
        price: 18,
        discountRate: 100,
        taxRate: 13,
        deliveryDate: "2025-04-04",
        note: "与打印机一并备货",
      },
    ],
    timeline: [
      { id: "t-1", title: "订单创建", detail: "客户通过移动端确认采购。", owner: "李菲", time: "2025/04/03 10:12", tone: "blue" },
      { id: "t-2", title: "审核通过", detail: "财务确认全额收款，订单转待出库。", owner: "陈诺", time: "2025/04/03 10:46", tone: "green" },
      { id: "t-3", title: "仓库拣货中", detail: "已生成拣货任务，预计14:30完成。", owner: "杭州分仓", time: "2025/04/03 14:10", tone: "blue" },
    ],
    actionLogs: [
      { id: "a-1", user: "李菲", action: "创建订单", detail: "移动端同步至PC列表。", time: "2025/04/03 10:12" },
      { id: "a-2", user: "陈诺", action: "登记收款", detail: "支付宝回款已核销。", time: "2025/04/03 10:23" },
      { id: "a-3", user: "杭州分仓", action: "生成出库任务", detail: "已推送拣货单ZY20250403008。", time: "2025/04/03 14:10" },
    ],
    relatedDocs: [
      { id: "r-1", type: "收款登记", no: "SK20250403011", status: "已核销", amount: "¥9,840.00" },
      { id: "r-2", type: "销售出库", no: "CK20250403006", status: "待执行", amount: "2行商品" },
    ],
    recommendedActions: ["出库后自动发送提货短信", "打印装箱清单", "客户签收后同步完成状态"],
  },
  "SO-202504-005": {
    id: "SO-202504-005",
    orderNo: "XS20250401025",
    customer: "苏州元禾供应链有限公司",
    customerCode: "KH-000318",
    customerLevel: "重点客户",
    businessDate: "2025-04-01",
    deliveryDate: "2025-04-03",
    warehouse: "苏州仓",
    salesChannel: "项目交付",
    salesperson: "沈岩",
    settlementMethod: "15天账期",
    paymentMethod: "银行转账",
    deliveryMethod: "销售配送",
    freightBearer: "我方承担",
    priceTier: "批发价A",
    priority: "普通",
    source: "老客续单",
    status: "待出库",
    statusTone: "blue",
    paymentStatus: "待收款",
    deliveryStatus: "待排车",
    approvalStatus: "审核通过",
    contactName: "周祺",
    contactPhone: "13900139033",
    address: "苏州市工业园区星湖街328号创意产业园6栋",
    remark: "本次续单需要拆两批配送，第一批先发手持终端。",
    internalRemark: "跨仓调拨可能影响首批交付时点。",
    creator: "沈岩",
    createdAt: "2025/04/01 15:26",
    updatedAt: "2025/04/02 17:18",
    creditLimit: "¥150,000.00",
    receivableBalance: "¥14,320.00",
    availableCredit: "¥135,680.00",
    riskNote: "客户账期稳定，但蓝牙手持终端库存不足，需要确认跨仓调拨。",
    tags: ["账期客户", "跨仓协同"],
    lines: [
      {
        id: "line-1",
        sku: "SKU-100518",
        productName: "蓝牙手持终端",
        spec: "Pro 128G",
        unit: "台",
        availableStock: 36,
        qty: 6,
        price: 1899,
        discountRate: 94,
        taxRate: 13,
        deliveryDate: "2025-04-03",
        note: "优先发第一批",
      },
      {
        id: "line-2",
        sku: "SKU-100610",
        productName: "仓储周转箱",
        spec: "600*400蓝色",
        unit: "个",
        availableStock: 260,
        qty: 30,
        price: 62,
        discountRate: 100,
        taxRate: 13,
        deliveryDate: "2025-04-05",
        note: "第二批配送",
      },
    ],
    timeline: [
      { id: "t-1", title: "订单确认", detail: "项目续单，客户已确认两批交付。", owner: "沈岩", time: "2025/04/01 15:26", tone: "blue" },
      { id: "t-2", title: "审核通过", detail: "销售经理确认项目价与配送方案。", owner: "周曼", time: "2025/04/01 17:10", tone: "green" },
      { id: "t-3", title: "待排车", detail: "第一批发运前等待终端调拨到位。", owner: "苏州仓", time: "2025/04/02 17:18", tone: "orange" },
    ],
    actionLogs: [
      { id: "a-1", user: "沈岩", action: "创建订单", detail: "延续上周项目成交价格。", time: "2025/04/01 15:26" },
      { id: "a-2", user: "周曼", action: "审批通过", detail: "项目价已确认，允许拆批配送。", time: "2025/04/01 17:10" },
      { id: "a-3", user: "苏州仓", action: "发起调拨申请", detail: "蓝牙手持终端从华南中心仓调拨2台。", time: "2025/04/02 17:18" },
    ],
    relatedDocs: [
      { id: "r-1", type: "客户往来", no: "WL20250402003", status: "余额待跟进", amount: "¥14,320.00" },
      { id: "r-2", type: "调拨申请", no: "DB20250402006", status: "审批中", amount: "2台终端" },
    ],
    recommendedActions: ["跟进调拨到货时间", "第一批发运后通知客户预约收货", "同步财务关注账期余额"],
  },
};

function cloneRecord<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildLineFromProduct(product: SalesOrderProductProfile, warehouse?: string): SalesOrderLineItem {
  return {
    id: `line-${product.sku}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    sku: product.sku,
    productName: product.productName,
    spec: product.spec,
    unit: product.unit,
    availableStock: product.availableStock,
    qty: 1,
    price: product.referencePrice,
    discountRate: 100,
    taxRate: product.taxRate,
    deliveryDate: "",
    note: warehouse && !product.warehouseSuggestions.includes(warehouse) ? `建议优先改配${product.warehouseSuggestions[0]}` : "",
  };
}

export function findSalesOrderCustomer(name: string) {
  return salesOrderCustomerProfiles.find((item) => item.name === name);
}

export function findSalesOrderProduct(sku: string) {
  return salesOrderProductCatalog.find((item) => item.sku === sku);
}

export function getSalesOrderRecord(orderId: string) {
  const record = salesOrderRecords[orderId];
  return record ? cloneRecord(record) : null;
}

export function createDraftSalesOrder(): SalesOrderWorkspaceRecord {
  const customer = salesOrderCustomerProfiles[0];
  const seedProducts = [salesOrderProductCatalog[0], salesOrderProductCatalog[1]];

  return cloneRecord({
    id: "SO-DRAFT-001",
    orderNo: "XS20250403999",
    customer: customer.name,
    customerCode: customer.code,
    customerLevel: customer.level,
    businessDate: "2025-04-03",
    deliveryDate: "2025-04-06",
    warehouse: "华北总仓",
    salesChannel: "线下批发",
    salesperson: "王晨",
    settlementMethod: customer.settlementMethod,
    paymentMethod: customer.paymentMethod,
    deliveryMethod: "物流发运",
    freightBearer: "客户承担",
    priceTier: customer.priceTier,
    priority: "普通",
    source: "手工录单",
    status: "草稿",
    statusTone: "gray",
    paymentStatus: "待收款",
    deliveryStatus: "未出库",
    approvalStatus: "未提交",
    contactName: customer.contactName,
    contactPhone: customer.contactPhone,
    address: customer.address,
    remark: "建议先补充客户采购用途，再提交审核。",
    internalRemark: "新增页默认带入最近常用品项，可直接删改。",
    creator: "当前用户",
    createdAt: "2025/04/03 15:00",
    updatedAt: "2025/04/03 15:00",
    creditLimit: customer.creditLimit,
    receivableBalance: customer.receivableBalance,
    availableCredit: customer.availableCredit,
    riskNote: "当前仅为演示草稿，提交审核前建议校验价格、库存与信用口径。",
    tags: customer.tags,
    lines: seedProducts.map((product) => buildLineFromProduct(product, "华北总仓")),
    timeline: [
      { id: "t-1", title: "草稿初始化", detail: "系统已带入最近一次常用客户和商品模板。", owner: "系统", time: "2025/04/03 15:00", tone: "gray" },
    ],
    actionLogs: [
      { id: "a-1", user: "系统", action: "生成草稿", detail: "基于常用模板生成新增页Mock数据。", time: "2025/04/03 15:00" },
    ],
    relatedDocs: [],
    recommendedActions: ["优先确认客户账期与配送方式", "补全商品交付日期", "保存草稿后再提交审核"],
  });
}

export function createLineItemFromProduct(sku: string, warehouse?: string) {
  const product = findSalesOrderProduct(sku);
  if (!product) {
    return {
      id: `line-empty-${Date.now()}`,
      sku: "",
      productName: "",
      spec: "",
      unit: "件",
      availableStock: 0,
      qty: 1,
      price: 0,
      discountRate: 100,
      taxRate: 13,
      deliveryDate: "",
      note: "",
    };
  }

  return buildLineFromProduct(product, warehouse);
}
