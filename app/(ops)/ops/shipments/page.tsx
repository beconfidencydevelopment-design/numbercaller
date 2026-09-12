import { PageHeader } from "@/components/ops/page-header";
import { ShipmentsView } from "@/components/ops/shipments-view";
import { RANKED } from "@/lib/ops/data";

export const metadata = { title: "Shipments · SNK Operations" };

const activeCount = RANKED.filter((s) => s.status !== "delivered").length;

export default function ShipmentsPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Shipments"
        subtitle={`${activeCount} active consignments across four zones`}
      />
      <div className="min-h-0 flex-1">
        <ShipmentsView initialView="active" />
      </div>
    </div>
  );
}
