export type PayableQueryRow = {
  supplierCode: string;
  supplierName: string;
  balance: string;
  periodStatus: "within" | "approaching" | "overdue" | "settled";
  remainingDays: number;
  dueDate: string;
  supplierPeriodDays: number;
  uninvoicedCount: number;
  lastPaymentDate: string;
  lastPaymentAmount: string;
  tone: "green" | "orange" | "red" | "gray";
};

export const payableQueryRows: PayableQueryRow[] = [
  {
    supplierCode: "S001",
    supplierName: "苏州元禾供应链有限公司",
    balance: "182,400.00",
    periodStatus: "overdue",
    remainingDays: -15,
    dueDate: "2025-03-15",
    supplierPeriodDays: 30,
    uninvoicedCount: 4,
    lastPaymentDate: "2025-02-28",
    lastPaymentAmount: "95,000.00",
    tone: "red",
  },
  {
    supplierCode: "S002",
    supplierName: "宁波智链实业有限公司",
    balance: "0.00",
    periodStatus: "settled",
    remainingDays: 0,
    dueDate: "2025-03-20",
    supplierPeriodDays: 45,
    uninvoicedCount: 0,
    lastPaymentDate: "2025-04-02",
    lastPaymentAmount: "9,540.00",
    tone: "gray",
  },
  {
    supplierCode: "S003",
    supplierName: "深圳华强供应链管理有限公司",
    balance: "68,000.00",
    periodStatus: "approaching",
    remainingDays: 5,
    dueDate: "2025-04-15",
    supplierPeriodDays: 30,
    uninvoicedCount: 2,
    lastPaymentDate: "2025-03-25",
    lastPaymentAmount: "42,000.00",
    tone: "orange",
  },
  {
    supplierCode: "S004",
    supplierName: "杭州鼎盛办公用品有限公司",
    balance: "286,500.00",
    periodStatus: "within",
    remainingDays: 20,
    dueDate: "2025-04-30",
    supplierPeriodDays: 60,
    uninvoicedCount: 6,
    lastPaymentDate: "2025-03-10",
    lastPaymentAmount: "120,000.00",
    tone: "green",
  },
  {
    supplierCode: "S005",
    supplierName: "广州恒通物流设备有限公司",
    balance: "12,800.00",
    periodStatus: "overdue",
    remainingDays: -8,
    dueDate: "2025-03-28",
    supplierPeriodDays: 30,
    uninvoicedCount: 1,
    lastPaymentDate: "2025-02-28",
    lastPaymentAmount: "8,500.00",
    tone: "red",
  },
  {
    supplierCode: "S006",
    supplierName: "上海启明信息技术有限公司",
    balance: "0.00",
    periodStatus: "settled",
    remainingDays: 0,
    dueDate: "2025-03-25",
    supplierPeriodDays: 45,
    uninvoicedCount: 0,
    lastPaymentDate: "2025-04-01",
    lastPaymentAmount: "36,800.00",
    tone: "gray",
  },
  {
    supplierCode: "S007",
    supplierName: "北京中科创达科技有限公司",
    balance: "425,000.00",
    periodStatus: "within",
    remainingDays: 35,
    dueDate: "2025-05-25",
    supplierPeriodDays: 60,
    uninvoicedCount: 8,
    lastPaymentDate: "2025-03-05",
    lastPaymentAmount: "200,000.00",
    tone: "green",
  },
  {
    supplierCode: "S008",
    supplierName: "成都申通快递有限公司",
    balance: "15,600.00",
    periodStatus: "approaching",
    remainingDays: 3,
    dueDate: "2025-04-17",
    supplierPeriodDays: 30,
    uninvoicedCount: 2,
    lastPaymentDate: "2025-03-20",
    lastPaymentAmount: "8,200.00",
    tone: "orange",
  },
];
