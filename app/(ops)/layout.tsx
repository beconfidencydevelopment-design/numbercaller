import type { Metadata } from "next";
import { OpsChrome } from "@/components/ops/ops-chrome";

export const metadata: Metadata = {
  title: "SNK Courier — Operations",
  description:
    "Expenses, client payments, driver settlements and period close for SNK Courier.",
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <OpsChrome>{children}</OpsChrome>;
}
