import { Suspense } from "react";
import { FinancialsView } from "@/components/ops/financials-view";

export default function Page() {
  return (
    <Suspense>
      <FinancialsView />
    </Suspense>
  );
}
