import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, PageTitle } from "../components/Ui";
import { getSalesOrderRecord } from "../data/salesOrderWorkspace";
import { SalesOrderEditorPage } from "./SalesOrderEditorPage";

export function SalesOrderEditPage() {
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const [record, setRecord] = useState(() => getSalesOrderRecord(orderId));

  useEffect(() => {
    setRecord(getSalesOrderRecord(orderId));
  }, [orderId]);

  if (!record) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="编辑销售订单"
          actions={<Button onClick={() => navigate("/sales-orders")}>返回列表</Button>}
        >
          未找到对应订单，请从销售订单列表重新进入。
        </PageTitle>
      </div>
    );
  }

  return <SalesOrderEditorPage mode="edit" initialRecord={record} />;
}
