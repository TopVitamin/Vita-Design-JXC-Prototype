import { useMemo } from "react";
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CustomerLedgerPage } from "./pages/CustomerLedgerPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryQueryPage } from "./pages/InventoryQueryPage";
import { ModulePlaceholderPage } from "./pages/ModulePlaceholderPage";
import { ReceiptEntryPage } from "./pages/ReceiptEntryPage";
import { RetailCashierPage } from "./pages/RetailCashierPage";
import { SalesOrderCreatePage } from "./pages/SalesOrderCreatePage";
import { SalesOrderDetailPage } from "./pages/SalesOrderDetailPage";
import { SalesOrderEditPage } from "./pages/SalesOrderEditPage";
import { SalesOrdersPage } from "./pages/SalesOrdersPage";
import { getPageMeta, inventoryNavGroups, type ViewKey } from "./data/mock";

const allViews = new Set<ViewKey>(inventoryNavGroups.flatMap((group) => group.children.map((item) => item.key)));

function getShellMeta(pathname: string, currentView: ViewKey) {
  const baseMeta = getPageMeta(currentView);

  if (pathname === "/sales-orders/new") {
    return {
      ...baseMeta,
      pageLabel: "销售订单新增",
      description: "新增销售订单，录入客户、商品与交付信息。",
    };
  }

  if (/^\/sales-orders\/[^/]+\/edit$/.test(pathname)) {
    return {
      ...baseMeta,
      pageLabel: "销售订单修改",
      description: "修改销售订单信息并重新提交流转。",
    };
  }

  if (/^\/sales-orders\/[^/]+$/.test(pathname)) {
    return {
      ...baseMeta,
      pageLabel: "销售订单详情",
      description: "查看销售订单详情、商品明细与流转记录。",
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
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sales-orders" element={<SalesOrdersPage />} />
        <Route path="/sales-orders/new" element={<SalesOrderCreatePage />} />
        <Route path="/sales-orders/:orderId/edit" element={<SalesOrderEditPage />} />
        <Route path="/sales-orders/:orderId" element={<SalesOrderDetailPage />} />
        <Route path="/retail-cashier" element={<RetailCashierPage />} />
        <Route path="/inventory-query" element={<InventoryQueryPage />} />
        <Route path="/receipt-entry" element={<ReceiptEntryPage />} />
        <Route path="/customer-ledger" element={<CustomerLedgerPage />} />
        {Array.from(allViews).map((view) => {
          if (!["dashboard", "sales-orders", "retail-cashier", "inventory-query", "receipt-entry", "customer-ledger"].includes(view)) {
             return <Route key={view} path={`/${view}`} element={<ModulePlaceholderPage view={view} depth={getPageMeta(view).pageDepth} />} />;
          }
          return null;
        })}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ShellWrapper />
    </HashRouter>
  );
}
