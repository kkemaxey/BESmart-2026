import { DispatchStudio } from "@/components/dispatch/DispatchStudio";
import { EmergencyShed } from "@/components/dispatch/EmergencyShed";
import { PageHeader } from "@/components/shell/PageHeader";

export default function DispatchPage() {
  return (
    <>
      <PageHeader
        title="Live Dispatch & Workload Modulation"
        lede="Rehearse a curtailment event end to end before you commit it to the grid."
        action={<EmergencyShed />}
      />
      <DispatchStudio />
    </>
  );
}
