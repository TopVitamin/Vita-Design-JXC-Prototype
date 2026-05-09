export type ReceiptRecord = {
  id: string;
  receiptNo: string;
  status: "草稿" | "已确认" | "已作废";
  statusTone: "gray" | "green" | "red";
  isHeld: boolean;
  heldTone?: "orange" | "green";
  customerCode: string;
  customerName: string;
  receiptDate: string;
  receiptMethod: string;
  receiptAmount: string;
  updatedAt: string;
  // 详情页用
  verificationStatus?: "完全核销" | "部分核销" | "未核销";
  verificationTone?: "green" | "orange" | "gray";
  accountInfo?: string;
  customerPaymentAccount?: string;
  note?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  linkedDeliveryNos?: string[];
  linkedDeliveryAmounts?: string[];
  stats?: {
    linkedCount: number;
    linkedAmount: string;
    receiptAmount: string;
    difference: string;
    differenceTone: "blue" | "orange" | "green";
  };
  creator?: string;
  createdAt?: string;
  lastModifier?: string;
};

export const receiptRecords: ReceiptRecord[] = [
  // 草稿 (2条)
  {
    id: "RCP-202504-001",
    receiptNo: "SK20260401001",
    status: "草稿",
    statusTone: "gray",
    isHeld: false,
    customerCode: "C001",
    customerName: "北京吉浓文化传媒有限公司",
    receiptDate: "2026-04-15",
    receiptMethod: "银行转账",
    receiptAmount: "50,000.00",
    updatedAt: "2026-04-15 14:23:18",
  },
  {
    id: "RCP-202504-002",
    receiptNo: "SK20260402002",
    status: "草稿",
    statusTone: "gray",
    isHeld: true,
    heldTone: "orange",
    customerCode: "C003",
    customerName: "苏州元禾供应链有限公司",
    receiptDate: "2026-04-14",
    receiptMethod: "支付宝",
    receiptAmount: "30,000.00",
    updatedAt: "2026-04-14 16:45:32",
  },
  // 已确认-已认款-差额=0 (3条)
  {
    id: "RCP-202504-003",
    receiptNo: "SK20260403003",
    status: "已确认",
    statusTone: "green",
    isHeld: false,
    heldTone: "green",
    customerCode: "C002",
    customerName: "杭州智帆商贸有限公司",
    receiptDate: "2026-04-10",
    receiptMethod: "银行转账",
    receiptAmount: "9,840.00",
    updatedAt: "2026-04-10 11:20:05",
    verificationStatus: "完全核销",
    verificationTone: "green",
    confirmedBy: "王晨",
    confirmedAt: "2026-04-10 11:22:18",
    linkedDeliveryNos: ["XS20260408001"],
    linkedDeliveryAmounts: ["9,840.00"],
    stats: { linkedCount: 1, linkedAmount: "9,840.00", receiptAmount: "9,840.00", difference: "¥0.00", differenceTone: "green" },
    creator: "李菲",
    createdAt: "2026-04-10 10:05:22",
  },
  {
    id: "RCP-202504-004",
    receiptNo: "SK20260403004",
    status: "已确认",
    statusTone: "green",
    isHeld: false,
    heldTone: "green",
    customerCode: "C004",
    customerName: "深圳腾岳科技有限公司",
    receiptDate: "2026-04-08",
    receiptMethod: "银行转账",
    receiptAmount: "23,450.00",
    updatedAt: "2026-04-08 15:30:42",
    verificationStatus: "完全核销",
    verificationTone: "green",
    confirmedBy: "王晨",
    confirmedAt: "2026-04-08 15:35:10",
    linkedDeliveryNos: ["XS20260408002"],
    linkedDeliveryAmounts: ["23,450.00"],
    stats: { linkedCount: 1, linkedAmount: "23,450.00", receiptAmount: "23,450.00", difference: "¥0.00", differenceTone: "green" },
    creator: "钱宇",
    createdAt: "2026-04-08 14:12:08",
  },
  {
    id: "RCP-202504-005",
    receiptNo: "SK20260403005",
    status: "已确认",
    statusTone: "green",
    isHeld: false,
    heldTone: "green",
    customerCode: "C006",
    customerName: "上海启明科技有限公司",
    receiptDate: "2026-04-05",
    receiptMethod: "微信支付",
    receiptAmount: "12,600.00",
    updatedAt: "2026-04-05 10:18:55",
    verificationStatus: "完全核销",
    verificationTone: "green",
    confirmedBy: "周曼",
    confirmedAt: "2026-04-05 10:22:33",
    linkedDeliveryNos: ["XS20260405001"],
    linkedDeliveryAmounts: ["12,600.00"],
    stats: { linkedCount: 1, linkedAmount: "12,600.00", receiptAmount: "12,600.00", difference: "¥0.00", differenceTone: "green" },
    creator: "周曼",
    createdAt: "2026-04-05 09:45:17",
  },
  // 已确认-已认款-有差额 (2条)
  {
    id: "RCP-202504-006",
    receiptNo: "SK20260403006",
    status: "已确认",
    statusTone: "green",
    isHeld: false,
    heldTone: "green",
    customerCode: "C001",
    customerName: "北京吉浓文化传媒有限公司",
    receiptDate: "2026-04-12",
    receiptMethod: "银行转账",
    receiptAmount: "80,000.00",
    updatedAt: "2026-04-12 16:20:10",
    verificationStatus: "部分核销",
    verificationTone: "orange",
    accountInfo: "工商银行 6222xxxx·深圳分行",
    customerPaymentAccount: "招商银行 6225xxxx",
    note: "部分冲抵3月货款",
    confirmedBy: "王晨",
    confirmedAt: "2026-04-12 16:25:44",
    linkedDeliveryNos: ["XS20260412001", "XS20260412002"],
    linkedDeliveryAmounts: ["45,000.00", "23,000.00"],
    stats: { linkedCount: 2, linkedAmount: "68,000.00", receiptAmount: "80,000.00", difference: "+12,000.00", differenceTone: "blue" },
    creator: "李菲",
    createdAt: "2026-04-12 15:30:00",
  },
  {
    id: "RCP-202504-007",
    receiptNo: "SK20260403007",
    status: "已确认",
    statusTone: "green",
    isHeld: false,
    heldTone: "green",
    customerCode: "C008",
    customerName: "成都锦绣山河贸易有限公司",
    receiptDate: "2026-04-03",
    receiptMethod: "银行转账",
    receiptAmount: "35,000.00",
    updatedAt: "2026-04-03 11:05:28",
    verificationStatus: "部分核销",
    verificationTone: "orange",
    confirmedBy: "钱宇",
    confirmedAt: "2026-04-03 11:12:05",
    linkedDeliveryNos: ["XS20260403001"],
    linkedDeliveryAmounts: ["40,000.00"],
    stats: { linkedCount: 1, linkedAmount: "40,000.00", receiptAmount: "35,000.00", difference: "-5,000.00", differenceTone: "orange" },
    creator: "钱宇",
    createdAt: "2026-04-03 10:30:15",
  },
  // 已确认-暂挂款 (3条)
  {
    id: "RCP-202504-008",
    receiptNo: "SK20260403008",
    status: "已确认",
    statusTone: "green",
    isHeld: true,
    heldTone: "orange",
    customerCode: "C003",
    customerName: "苏州元禾供应链有限公司",
    receiptDate: "2026-04-11",
    receiptMethod: "银行转账",
    receiptAmount: "100,000.00",
    updatedAt: "2026-04-11 09:30:00",
    verificationStatus: "未核销",
    verificationTone: "gray",
    accountInfo: "建设银行 6217xxxx·苏州分行",
    note: "预付定金",
    confirmedBy: "王晨",
    confirmedAt: "2026-04-11 09:35:22",
    stats: { linkedCount: 0, linkedAmount: "0.00", receiptAmount: "100,000.00", difference: "-", differenceTone: "orange" },
    creator: "李菲",
    createdAt: "2026-04-11 09:20:10",
  },
  {
    id: "RCP-202504-009",
    receiptNo: "SK20260403009",
    status: "已确认",
    statusTone: "green",
    isHeld: true,
    heldTone: "orange",
    customerCode: "C005",
    customerName: "宁波智链实业有限公司",
    receiptDate: "2026-04-09",
    receiptMethod: "支付宝",
    receiptAmount: "15,000.00",
    updatedAt: "2026-04-09 14:18:42",
    verificationStatus: "未核销",
    verificationTone: "gray",
    confirmedBy: "周曼",
    confirmedAt: "2026-04-09 14:25:00",
    stats: { linkedCount: 0, linkedAmount: "0.00", receiptAmount: "15,000.00", difference: "-", differenceTone: "orange" },
    creator: "周曼",
    createdAt: "2026-04-09 13:50:25",
  },
  {
    id: "RCP-202504-010",
    receiptNo: "SK20260403010",
    status: "已确认",
    statusTone: "green",
    isHeld: true,
    heldTone: "orange",
    customerCode: "C007",
    customerName: "广州云端数据服务有限公司",
    receiptDate: "2026-04-06",
    receiptMethod: "银行转账",
    receiptAmount: "200,000.00",
    updatedAt: "2026-04-06 10:00:15",
    verificationStatus: "未核销",
    verificationTone: "gray",
    confirmedBy: "王晨",
    confirmedAt: "2026-04-06 10:08:30",
    stats: { linkedCount: 0, linkedAmount: "0.00", receiptAmount: "200,000.00", difference: "-", differenceTone: "orange" },
    creator: "王晨",
    createdAt: "2026-04-06 09:30:00",
  },
  // 已作废 (1条)
  {
    id: "RCP-202504-011",
    receiptNo: "SK20260403011",
    status: "已作废",
    statusTone: "red",
    isHeld: false,
    customerCode: "C011",
    customerName: "西安恒通电子科技有限公司",
    receiptDate: "2026-04-02",
    receiptMethod: "现金",
    receiptAmount: "5,000.00",
    updatedAt: "2026-04-02 16:40:00",
    creator: "钱宇",
    createdAt: "2026-04-02 15:20:10",
  },
  // 更多草稿
  {
    id: "RCP-202504-012",
    receiptNo: "SK20260403012",
    status: "草稿",
    statusTone: "gray",
    isHeld: false,
    customerCode: "C010",
    customerName: "南京华文信息科技有限公司",
    receiptDate: "2026-04-15",
    receiptMethod: "微信支付",
    receiptAmount: "8,800.00",
    updatedAt: "2026-04-15 18:30:00",
  },
];

export const receiptFormDefault = {
  customer: "",
  receiptDate: "",
  receiptMethod: "",
  receiptAmount: "",
  accountInfo: "",
  customerPaymentAccount: "",
  note: "",
  linkedDeliveries: [] as string[],
};
