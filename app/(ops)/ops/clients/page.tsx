import { Suspense } from "react";
import { ClientsView } from "@/components/ops/clients-view";

export default function Page() {
  // `useSearchParams` needs a Suspense boundary so the shell can stream while
  // the selected company resolves on the client.
  return (
    <Suspense>
      <ClientsView />
    </Suspense>
  );
}
