import { useMemo } from "react";
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { configModuleViews, crudModuleViews, formModuleViews, queryModuleViews } from "./data/modulePages";
import { CustomerLedgerPage } from "./pages/CustomerLedgerPage";
import { DashboardPage } from "./pages/DashboardPage";
import {
  GenericConfigPage,
  GenericCrudCreatePage,
  GenericCrudDetailPage,
  GenericCrudEditPage,
  GenericCrudListPage,
  GenericFormPage,
  GenericQueryPage,
} from "./pages/GenericModulePages";
import { InventoryQueryPage } from "./pages/InventoryQueryPage";
import { ModulePlaceholderPage } from "./pages/ModulePlaceholderPage";
import {
  CustomerManagementPage,
  ProductManagementPage,
  PurchaseOrdersPage,
  PurchaseReceiptPage,
  PurchaseReturnPage,
  SalesDeliveryPage,
  SalesQueryPage,
  StockCountPage,
  StockLossPage,
  StockTransferPage,
  SupplierManagementPage,
  WarehouseManagementPage,
} from "./pages/PriorityModulePages";
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
  const isGenericCrud = crudModuleViews.includes(currentView);

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

  if (isGenericCrud && pathname === `/${currentView}/new`) {
    return {
      ...baseMeta,
      pageLabel: `${baseMeta.pageLabel}新增`,
      description: `新增${baseMeta.pageLabel}并录入基础信息。`,
    };
  }

  if (isGenericCrud && new RegExp(`^/${currentView}/[^/]+/edit$`).test(pathname)) {
    return {
      ...baseMeta,
      pageLabel: `${baseMeta.pageLabel}修改`,
      description: `修改${baseMeta.pageLabel}信息并保存。`,
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
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sales-orders" element={<SalesOrdersPage />} />
        <Route path="/sales-orders/new" element={<SalesOrderCreatePage />} />
        <Route path="/sales-orders/:orderId/edit" element={<SalesOrderEditPage />} />
        <Route path="/sales-orders/:orderId" element={<SalesOrderDetailPage />} />
        <Route path="/product-management" element={<ProductManagementPage />} />
        <Route path="/customer-management" element={<CustomerManagementPage />} />
        <Route path="/supplier-management" element={<SupplierManagementPage />} />
        <Route path="/warehouse-management" element={<WarehouseManagementPage />} />
        <Route path="/sales-delivery" element={<SalesDeliveryPage />} />
        <Route path="/sales-query" element={<SalesQueryPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/purchase-receipt" element={<PurchaseReceiptPage />} />
        <Route path="/purchase-return" element={<PurchaseReturnPage />} />
        <Route path="/stock-transfer" element={<StockTransferPage />} />
        <Route path="/stock-count" element={<StockCountPage />} />
        <Route path="/stock-loss" element={<StockLossPage />} />
        <Route path="/retail-cashier" element={<RetailCashierPage />} />
        <Route path="/inventory-query" element={<InventoryQueryPage />} />
        <Route path="/receipt-entry" element={<ReceiptEntryPage />} />
        <Route path="/customer-ledger" element={<CustomerLedgerPage />} />
        {crudModuleViews.map((view) => (
          <Route key={`${view}-list`} path={`/${view}`} element={<GenericCrudListPage view={view} />} />
        ))}
        {crudModuleViews.map((view) => (
          <Route key={`${view}-new`} path={`/${view}/new`} element={<GenericCrudCreatePage view={view} />} />
        ))}
        {crudModuleViews.map((view) => (
          <Route key={`${view}-edit`} path={`/${view}/:recordId/edit`} element={<GenericCrudEditPage view={view} />} />
        ))}
        {crudModuleViews.map((view) => (
          <Route key={`${view}-detail`} path={`/${view}/:recordId`} element={<GenericCrudDetailPage view={view} />} />
        ))}
        {queryModuleViews.map((view) => (
          <Route key={`${view}-query`} path={`/${view}`} element={<GenericQueryPage view={view} />} />
        ))}
        {formModuleViews.map((view) => (
          <Route key={`${view}-form`} path={`/${view}`} element={<GenericFormPage view={view} />} />
        ))}
        {configModuleViews.map((view) => (
          <Route key={`${view}-config`} path={`/${view}`} element={<GenericConfigPage view={view} />} />
        ))}
        {Array.from(allViews).map((view) => {
          if (
            !["dashboard", "sales-orders", "retail-cashier", "inventory-query", "receipt-entry", "customer-ledger", "product-management", "customer-management", "supplier-management", "warehouse-management", "sales-delivery", "sales-query", "purchase-orders", "purchase-receipt", "purchase-return", "stock-transfer", "stock-count", "stock-loss"].includes(view) &&
            !crudModuleViews.includes(view) &&
            !queryModuleViews.includes(view) &&
            !formModuleViews.includes(view) &&
            !configModuleViews.includes(view)
          ) {
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
