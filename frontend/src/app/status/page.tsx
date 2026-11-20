import { BackendStatus } from "@/components/BackendStatus";
import { PageHeader } from "@/components/shell/PageHeader";

export default function StatusPage() {
  return (
    <>
      <PageHeader
        title="Backend status"
        lede="Health checks for the FastAPI service and database."
      />
      <BackendStatus />
    </>
  );
}
