import { PageHeader } from "@/components/ops/page-header";
import { Placeholder } from "@/components/ops/placeholder";

export default function Page() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Reports" />
      <Placeholder area="Reports" />
    </div>
  );
}
