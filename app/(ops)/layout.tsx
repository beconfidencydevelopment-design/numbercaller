import type { Metadata } from "next";
import { OpsChrome } from "@/components/ops/ops-chrome";

export const metadata: Metadata = {
  title: "SNK Operations Console",
  description: "Live courier operations: exceptions, shipments, drivers and routes.",
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <OpsChrome>{children}</OpsChrome>;
}
