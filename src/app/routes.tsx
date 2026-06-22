import { Navigate, Route, Routes } from "react-router-dom";
import { configModuleViews, crudModuleViews, formModuleViews, queryModuleViews } from "../contracts/modules";
import { CustomerLedgerPage } from "../pages/CustomerLedgerPage";
import { DashboardPage } from "../pages/DashboardPage";
import {
  GenericConfigPage,
  GenericCrudCreatePage,
  GenericCrudDetailPage,
  GenericCrudEditPage,
  GenericCrudListPage,
  GenericFormPage,
  GenericQueryPage,
} from "../pages/GenericModulePages";
import { InventoryQueryPage } from "../pages/InventoryQueryPage";
import { ModulePlaceholderPage } from "../pages/ModulePlaceholderPage";
import {
  CustomerManagementPage,
  ProductManagementPage,
  SalesDeliveryPage,
  SalesQueryPage,
  StockCountPage,
  StockLossPage,
  StockTransferPage,
  SupplierManagementPage,
  WarehouseManagementPage,
} from "../pages/PriorityModulePages";
import {
  PurchaseOrderCreatePage,
  PurchaseOrderDetailPage,
  PurchaseOrderEditPage,
  PurchaseOrdersPage,
  PurchaseReceiptCreatePage,
  PurchaseReceiptDetailPage,
  PurchaseReceiptEditPage,
  PurchaseReceiptPage,
} from "../pages/PurchaseModulePages";
import {
  PurchaseReturnCreatePage,
  PurchaseReturnDetailPage,
  PurchaseReturnEditPage,
  PurchaseReturnListPage,
  PurchaseReturnStockoutCreatePage,
  PurchaseReturnStockoutDetailPage,
  PurchaseReturnStockoutEditPage,
  PurchaseReturnStockoutListPage,
} from "../pages/PurchaseReturnModulePages";
import { ReceivableQueryPage } from "../pages/ReceivableQueryPage";
import { ReceiptManagementListPage, ReceiptManagementFormPage, ReceiptManagementDetailPage } from "../pages/ReceiptManagementPage";
import { PayableQueryPage } from "../pages/PayableQueryPage";
import { PaymentManagementListPage, PaymentManagementFormPage, PaymentManagementDetailPage } from "../pages/PaymentManagementPage";
import {
  SalesOrderCreatePageV2,
  SalesOrderDetailPageV2,
  SalesOrderEditPageV2,
  SalesOrderListPage,
  SalesStockoutCreatePageV2,
  SalesStockoutDetailPageV2,
  SalesStockoutEditPageV2,
  SalesStockoutListPage,
} from "../pages/SalesModulePages";
import {
  SalesReturnCreatePage,
  SalesReturnDetailPage,
  SalesReturnEditPage,
  SalesReturnInboundCreatePage,
  SalesReturnInboundDetailPage,
  SalesReturnInboundEditPage,
  SalesReturnInboundListPage,
  SalesReturnListPage,
} from "../pages/SalesReturnModulePages";
import { allViews, getPageMeta, type ViewKey } from "./navigation";

const explicitViews = new Set([
  "dashboard",
  "sales-orders",
  "sales-return",
  "sales-return-inbound",
    "inventory-query",
    "customer-ledger",
  "product-management",
  "customer-management",
  "supplier-management",
  "warehouse-management",
  "sales-delivery",
  "sales-query",
  "purchase-orders",
  "purchase-receipt",
  "purchase-return",
  "purchase-return-stockout",
  "stock-transfer",
  "stock-count",
  "stock-loss",
  "receivable-query",
  "payable-query",
  "receipt-management",
  "payment-management",
]);

const customCrudViews = new Set(["purchase-orders", "purchase-receipt", "purchase-return", "sales-delivery"]);

function getCrudListRouteElement(view: ViewKey) {
  switch (view) {
    case "product-management":
      return <ProductManagementPage key={view} />;
    case "customer-management":
      return <CustomerManagementPage key={view} />;
    case "supplier-management":
      return <SupplierManagementPage key={view} />;
    case "warehouse-management":
      return <WarehouseManagementPage key={view} />;
    case "sales-delivery":
      return <SalesDeliveryPage key={view} />;
    case "purchase-orders":
      return <PurchaseOrdersPage key={view} />;
    case "purchase-receipt":
      return <PurchaseReceiptPage key={view} />;
    case "stock-transfer":
      return <StockTransferPage key={view} />;
    case "stock-count":
      return <StockCountPage key={view} />;
    case "stock-loss":
      return <StockLossPage key={view} />;
    default:
      return <GenericCrudListPage key={view} view={view} />;
  }
}

function getQueryRouteElement(view: ViewKey) {
  switch (view) {
    case "sales-query":
      return <SalesQueryPage key={view} />;
    default:
      return <GenericQueryPage key={view} view={view} />;
  }
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/sales-orders" element={<SalesOrderListPage />} />
      <Route path="/sales-orders/new" element={<SalesOrderCreatePageV2 />} />
      <Route path="/sales-orders/:orderId/edit" element={<SalesOrderEditPageV2 />} />
      <Route path="/sales-orders/:orderId" element={<SalesOrderDetailPageV2 />} />
      <Route path="/sales-delivery" element={<SalesStockoutListPage />} />
      <Route path="/sales-delivery/new" element={<SalesStockoutCreatePageV2 />} />
      <Route path="/sales-delivery/:recordId/edit" element={<SalesStockoutEditPageV2 />} />
      <Route path="/sales-delivery/:recordId" element={<SalesStockoutDetailPageV2 />} />
      <Route path="/sales-return" element={<SalesReturnListPage />} />
      <Route path="/sales-return/new" element={<SalesReturnCreatePage />} />
      <Route path="/sales-return/:recordId/edit" element={<SalesReturnEditPage />} />
      <Route path="/sales-return/:recordId" element={<SalesReturnDetailPage />} />
      <Route path="/sales-return-inbound" element={<SalesReturnInboundListPage />} />
      <Route path="/sales-return-inbound/new" element={<SalesReturnInboundCreatePage />} />
      <Route path="/sales-return-inbound/:recordId/edit" element={<SalesReturnInboundEditPage />} />
      <Route path="/sales-return-inbound/:recordId" element={<SalesReturnInboundDetailPage />} />
      <Route path="/inventory-query" element={<InventoryQueryPage />} />
      <Route path="/receivable-query" element={<ReceivableQueryPage />} />
      <Route path="/receipt-management" element={<ReceiptManagementListPage />} />
      <Route path="/receipt-management/new" element={<ReceiptManagementFormPage mode="create" />} />
      <Route path="/receipt-management/:recordId/edit" element={<ReceiptManagementFormPage mode="edit" />} />
      <Route path="/receipt-management/:recordId" element={<ReceiptManagementDetailPage />} />
      <Route path="/payable-query" element={<PayableQueryPage />} />
      <Route path="/payment-management" element={<PaymentManagementListPage />} />
      <Route path="/payment-management/new" element={<PaymentManagementFormPage mode="create" />} />
      <Route path="/payment-management/:recordId/edit" element={<PaymentManagementFormPage mode="edit" />} />
      <Route path="/payment-management/:recordId" element={<PaymentManagementDetailPage />} />
      <Route path="/customer-ledger" element={<CustomerLedgerPage />} />
      <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
      <Route path="/purchase-orders/new" element={<PurchaseOrderCreatePage />} />
      <Route path="/purchase-orders/:recordId/edit" element={<PurchaseOrderEditPage />} />
      <Route path="/purchase-orders/:recordId" element={<PurchaseOrderDetailPage />} />
      <Route path="/purchase-receipt" element={<PurchaseReceiptPage />} />
      <Route path="/purchase-receipt/new" element={<PurchaseReceiptCreatePage />} />
      <Route path="/purchase-receipt/:recordId/edit" element={<PurchaseReceiptEditPage />} />
      <Route path="/purchase-receipt/:recordId" element={<PurchaseReceiptDetailPage />} />
      <Route path="/purchase-return" element={<PurchaseReturnListPage />} />
      <Route path="/purchase-return/new" element={<PurchaseReturnCreatePage />} />
      <Route path="/purchase-return/:recordId/edit" element={<PurchaseReturnEditPage />} />
      <Route path="/purchase-return/:recordId" element={<PurchaseReturnDetailPage />} />
      <Route path="/purchase-return-stockout" element={<PurchaseReturnStockoutListPage />} />
      <Route path="/purchase-return-stockout/new" element={<PurchaseReturnStockoutCreatePage />} />
      <Route path="/purchase-return-stockout/:recordId/edit" element={<PurchaseReturnStockoutEditPage />} />
      <Route path="/purchase-return-stockout/:recordId" element={<PurchaseReturnStockoutDetailPage />} />
      {crudModuleViews.filter((view) => !customCrudViews.has(view)).map((view) => (
        <Route key={`${view}-list`} path={`/${view}`} element={getCrudListRouteElement(view)} />
      ))}
      {crudModuleViews.filter((view) => !customCrudViews.has(view)).map((view) => (
        <Route key={`${view}-new`} path={`/${view}/new`} element={<GenericCrudCreatePage key={`${view}-new`} view={view} />} />
      ))}
      {crudModuleViews.filter((view) => !customCrudViews.has(view)).map((view) => (
        <Route key={`${view}-edit`} path={`/${view}/:recordId/edit`} element={<GenericCrudEditPage key={`${view}-edit`} view={view} />} />
      ))}
      {crudModuleViews.filter((view) => !customCrudViews.has(view)).map((view) => (
        <Route key={`${view}-detail`} path={`/${view}/:recordId`} element={<GenericCrudDetailPage key={`${view}-detail`} view={view} />} />
      ))}
      {queryModuleViews.map((view) => (
        <Route key={`${view}-query`} path={`/${view}`} element={getQueryRouteElement(view)} />
      ))}
      {formModuleViews.map((view) => (
        <Route key={`${view}-form`} path={`/${view}`} element={<GenericFormPage key={view} view={view} />} />
      ))}
      {configModuleViews.map((view) => (
        <Route key={`${view}-config`} path={`/${view}`} element={<GenericConfigPage key={view} view={view} />} />
      ))}
      {Array.from(allViews).map((view) => {
        if (
          !explicitViews.has(view) &&
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
  );
}
