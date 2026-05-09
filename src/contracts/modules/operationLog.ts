import type { ConfigModuleDefinition } from "../types";

export const operationLogModuleDefinition: ConfigModuleDefinition = {
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
};
