import type { ConfigModuleDefinition } from "../types";
import { buildLogs } from "./shared";

export const userPermissionModuleDefinition: ConfigModuleDefinition = {
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
};
