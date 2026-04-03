import { useState } from "react";
import { createDraftSalesOrder } from "../data/salesOrderWorkspace";
import { SalesOrderEditorPage } from "./SalesOrderEditorPage";

export function SalesOrderCreatePage() {
  const [initialRecord] = useState(() => createDraftSalesOrder());

  return <SalesOrderEditorPage mode="create" initialRecord={initialRecord} />;
}
