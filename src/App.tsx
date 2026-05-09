import { useMemo } from "react";
import { HashRouter, useLocation, useNavigate } from "react-router-dom";
import { AppRoutes } from "./app/routes";
import { allViews, getPageMeta, inventoryNavGroups, type ViewKey } from "./app/navigation";
import { crudModuleViews } from "./contracts/modules";
import { AppShell } from "./components/AppShell";
import { MessageContainer } from "./components/Ui";

function getShellMeta(pathname: string, currentView: ViewKey) {
  const baseMeta = getPageMeta(currentView);
  const isGenericCrud = crudModuleViews.includes(currentView);
  const customCrudViews: ViewKey[] = ["sales-orders", "sales-return", "sales-return-inbound"];

  if (customCrudViews.includes(currentView) && pathname === `/${currentView}/new`) {
    return {
      ...baseMeta,
      pageLabel: `新增${baseMeta.pageLabel}`,
      description: `新增${baseMeta.pageLabel}并录入业务信息。`,
    };
  }

  if (customCrudViews.includes(currentView) && new RegExp(`^/${currentView}/[^/]+/edit$`).test(pathname)) {
    return {
      ...baseMeta,
      pageLabel: `编辑${baseMeta.pageLabel}`,
      description: `编辑${baseMeta.pageLabel}并处理业务流转。`,
    };
  }

  if (customCrudViews.includes(currentView) && new RegExp(`^/${currentView}/[^/]+$`).test(pathname)) {
    return {
      ...baseMeta,
      pageLabel: `${baseMeta.pageLabel}详情`,
      description: `查看${baseMeta.pageLabel}详情、明细与流转记录。`,
    };
  }

  if (isGenericCrud && pathname === `/${currentView}/new`) {
    return {
      ...baseMeta,
      pageLabel: `新增${baseMeta.pageLabel}`,
      description: `新增${baseMeta.pageLabel}并录入基础信息。`,
    };
  }

  if (isGenericCrud && new RegExp(`^/${currentView}/[^/]+/edit$`).test(pathname)) {
    return {
      ...baseMeta,
      pageLabel: `编辑${baseMeta.pageLabel}`,
      description: `编辑${baseMeta.pageLabel}信息并保存。`,
    };
  }

  if (isGenericCrud && new RegExp(`^/${currentView}/[^/]+$`).test(pathname)) {
    return {
      ...baseMeta,
      pageLabel: `${baseMeta.pageLabel}详情`,
      description: `查看${baseMeta.pageLabel}详情与关联记录。`,
    };
  }

  return baseMeta;
}

function ShellWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname.replace(/^\//, "");
  const primaryPath = currentPath.split("/")[0] || "dashboard";
  const currentView = (allViews.has(primaryPath as ViewKey) ? primaryPath : "dashboard") as ViewKey;
  
  const currentMeta = useMemo(() => getShellMeta(location.pathname, currentView), [currentView, location.pathname]);

  const handleNavigate = (view: ViewKey) => {
    navigate(`/${view}`);
  };

  return (
    <AppShell
      currentView={currentView}
      currentSectionLabel={currentMeta.sectionLabel}
      currentPageLabel={currentMeta.pageLabel}
      currentDescription={currentMeta.description}
      navigationGroups={inventoryNavGroups}
      onNavigate={handleNavigate}
    >
      <AppRoutes />
    </AppShell>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ShellWrapper />
      <MessageContainer />
    </HashRouter>
  );
}
