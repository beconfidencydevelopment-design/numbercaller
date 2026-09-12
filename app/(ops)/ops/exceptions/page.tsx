import { PageHeader } from "@/components/ops/page-header";
import { ShipmentsView } from "@/components/ops/shipments-view";
import { RANKED } from "@/lib/ops/data";

export const metadata = { title: "Exceptions · SNK Operations" };

const count = RANKED.filter((s) => s.status === "exception").length;

export default function ExceptionsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Exceptions"
        subtitle={`${count} shipments failed an attempt and need a decision before the next round`}
      />
      <div className="min-h-0 flex-1">
        <ShipmentsView initialView="exceptions" />
      </div>
    </div>
  );
}
