export type PaymentRecord = {
  id: string;
  paymentNo: string;
  status: "草稿" | "已确认" | "已作废";
  statusTone: "gray" | "green" | "red";
  periodStatus: "within" | "approaching" | "overdue" | "settled";
  periodTone: "green" | "orange" | "red" | "gray";
  supplierCode: string;
  supplierName: string;
  paymentDate: string;
  paymentMethod: string;
  paymentAmount: string;
  updatedAt: string;
  // 详情页用
  verificationStatus?: "完全核销" | "部分核销" | "未核销";
  verificationTone?: "green" | "blue" | "orange" | "red" | "gray";
  paymentAccount?: string;
  supplierReceiveAccount?: string;
  note?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  linkedInboundNos?: string[];
  linkedInboundAmounts?: string[];
  stats?: {
    linkedCount: number;
    linkedAmount: string;
    paymentAmount: string;
    difference: string;
    differenceTone: "blue" | "orange" | "green";
  };
  creator?: string;
  createdAt?: string;
  lastModifier?: string;
};

export const paymentRecords: PaymentRecord[] = [
  // 草稿 (2条)
  {
    id: "PAY-202504-001",
    paymentNo: "FK20260401001",
    status: "草稿",
    statusTone: "gray",
    periodStatus: "within",
    periodTone: "green",
    supplierCode: "S004",
    supplierName: "杭州鼎盛办公用品有限公司",
    paymentDate: "2026-04-15",
    paymentMethod: "银行转账",
    paymentAmount: "50,000.00",
    updatedAt: "2026-04-15 14:23:18",
  },
  {
    id: "PAY-202504-002",
    paymentNo: "FK20260402002",
    status: "草稿",
    statusTone: "gray",
    periodStatus: "approaching",
    periodTone: "orange",
    supplierCode: "S003",
    supplierName: "深圳华强供应链管理有限公司",
    paymentDate: "2026-04-14",
    paymentMethod: "银行转账",
    paymentAmount: "30,000.00",
    updatedAt: "2026-04-14 16:45:32",
  },
  // 已确认-完全核销 (3条)
  {
    id: "PAY-202504-003",
    paymentNo: "FK20260403003",
    status: "已确认",
    statusTone: "green",
    periodStatus: "settled",
    periodTone: "gray",
    supplierCode: "S002",
    supplierName: "宁波智链实业有限公司",
    paymentDate: "2026-04-10",
    paymentMethod: "银行转账",
    paymentAmount: "9,540.00",
    updatedAt: "2026-04-10 11:20:05",
    verificationStatus: "完全核销",
    verificationTone: "green",
    confirmedBy: "王晨",
    confirmedAt: "2026-04-10 11:22:18",
    linkedInboundNos: ["CG20260408001"],
    linkedInboundAmounts: ["9,540.00"],
    stats: { linkedCount: 1, linkedAmount: "9,540.00", paymentAmount: "9,540.00", difference: "¥0.00", differenceTone: "green" },
    creator: "李菲",
    createdAt: "2026-04-10 10:05:22",
  },
  {
    id: "PAY-202504-004",
    paymentNo: "FK20260403004",
    status: "已确认",
    statusTone: "green",
    periodStatus: "settled",
    periodTone: "gray",
    supplierCode: "S006",
    supplierName: "上海启明信息技术有限公司",
    paymentDate: "2026-04-08",
    paymentMethod: "银行转账",
    paymentAmount: "36,800.00",
    updatedAt: "2026-04-08 15:30:42",
    verificationStatus: "完全核销",
    verificationTone: "green",
    confirmedBy: "王晨",
    confirmedAt: "2026-04-08 15:35:10",
    linkedInboundNos: ["CG20260408002"],
    linkedInboundAmounts: ["36,800.00"],
    stats: { linkedCount: 1, linkedAmount: "36,800.00", paymentAmount: "36,800.00", difference: "¥0.00", differenceTone: "green" },
    creator: "钱宇",
    createdAt: "2026-04-08 14:12:08",
  },
  {
    id: "PAY-202504-005",
    paymentNo: "FK20260403005",
    status: "已确认",
    statusTone: "green",
    periodStatus: "settled",
    periodTone: "gray",
    supplierCode: "S001",
    supplierName: "苏州元禾供应链有限公司",
    paymentDate: "2026-04-05",
    paymentMethod: "银行转账",
    paymentAmount: "95,000.00",
    updatedAt: "2026-04-05 10:18:55",
    verificationStatus: "完全核销",
    verificationTone: "green",
    confirmedBy: "周曼",
    confirmedAt: "2026-04-05 10:22:33",
    linkedInboundNos: ["CG20260405001"],
    linkedInboundAmounts: ["95,000.00"],
    stats: { linkedCount: 1, linkedAmount: "95,000.00", paymentAmount: "95,000.00", difference: "¥0.00", differenceTone: "green" },
    creator: "周曼",
    createdAt: "2026-04-05 09:45:17",
  },
  // 已确认-部分核销 (2条)
  {
    id: "PAY-202504-006",
    paymentNo: "FK20260403006",
    status: "已确认",
    statusTone: "green",
    periodStatus: "within",
    periodTone: "green",
    supplierCode: "S007",
    supplierName: "北京中科创达科技有限公司",
    paymentDate: "2026-04-12",
    paymentMethod: "银行转账",
    paymentAmount: "150,000.00",
    updatedAt: "2026-04-12 16:20:10",
    verificationStatus: "部分核销",
    verificationTone: "orange",
    paymentAccount: "工商银行 6222xxxx·北京分行",
    supplierReceiveAccount: "建设银行 6217xxxx·北京海淀支行",
    note: "部分冲抵货款",
    confirmedBy: "王晨",
    confirmedAt: "2026-04-12 16:25:44",
    linkedInboundNos: ["CG20260412001", "CG20260412002"],
    linkedInboundAmounts: ["80,000.00", "45,000.00"],
    stats: { linkedCount: 2, linkedAmount: "125,000.00", paymentAmount: "150,000.00", difference: "+25,000.00", differenceTone: "blue" },
    creator: "李菲",
    createdAt: "2026-04-12 15:30:00",
  },
  {
    id: "PAY-202504-007",
    paymentNo: "FK20260403007",
    status: "已确认",
    statusTone: "green",
    periodStatus: "approaching",
    periodTone: "orange",
    supplierCode: "S008",
    supplierName: "成都申通快递有限公司",
    paymentDate: "2026-04-03",
    paymentMethod: "银行转账",
    paymentAmount: "8,200.00",
    updatedAt: "2026-04-03 11:05:28",
    verificationStatus: "部分核销",
    verificationTone: "orange",
    confirmedBy: "钱宇",
    confirmedAt: "2026-04-03 11:12:05",
    linkedInboundNos: ["CG20260403001"],
    linkedInboundAmounts: ["10,000.00"],
    stats: { linkedCount: 1, linkedAmount: "10,000.00", paymentAmount: "8,200.00", difference: "-1,800.00", differenceTone: "orange" },
    creator: "钱宇",
    createdAt: "2026-04-03 10:30:15",
  },
  // 已确认-未核销 (暂挂款) (1条)
  {
    id: "PAY-202504-008",
    paymentNo: "FK20260403008",
    status: "已确认",
    statusTone: "green",
    periodStatus: "within",
    periodTone: "green",
    supplierCode: "S004",
    supplierName: "杭州鼎盛办公用品有限公司",
    paymentDate: "2026-04-11",
    paymentMethod: "银行转账",
    paymentAmount: "80,000.00",
    updatedAt: "2026-04-11 09:30:00",
    verificationStatus: "未核销",
    verificationTone: "gray",
    paymentAccount: "建设银行 6217xxxx·杭州分行",
    note: "预付货款",
    confirmedBy: "王晨",
    confirmedAt: "2026-04-11 09:35:22",
    stats: { linkedCount: 0, linkedAmount: "0.00", paymentAmount: "80,000.00", difference: "-", differenceTone: "orange" },
    creator: "李菲",
    createdAt: "2026-04-11 09:20:10",
  },
  // 已作废 (1条)
  {
    id: "PAY-202504-009",
    paymentNo: "FK20260403009",
    status: "已作废",
    statusTone: "red",
    periodStatus: "overdue",
    periodTone: "red",
    supplierCode: "S005",
    supplierName: "广州恒通物流设备有限公司",
    paymentDate: "2026-04-02",
    paymentMethod: "现金",
    paymentAmount: "3,000.00",
    updatedAt: "2026-04-02 16:40:00",
    creator: "钱宇",
    createdAt: "2026-04-02 15:20:10",
  },
  // 更多草稿
  {
    id: "PAY-202504-010",
    paymentNo: "FK20260403010",
    status: "草稿",
    statusTone: "gray",
    periodStatus: "within",
    periodTone: "green",
    supplierCode: "S007",
    supplierName: "北京中科创达科技有限公司",
    paymentDate: "2026-04-15",
    paymentMethod: "银行转账",
    paymentAmount: "100,000.00",
    updatedAt: "2026-04-15 18:30:00",
  },
];

export const paymentFormDefault = {
  supplier: "",
  paymentDate: "",
  paymentMethod: "",
  paymentAmount: "",
  paymentAccount: "",
  supplierReceiveAccount: "",
  note: "",
  linkedInboundOrders: [] as string[],
};
