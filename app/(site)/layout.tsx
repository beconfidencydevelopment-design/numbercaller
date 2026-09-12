import { CalendlyButton } from "@/components/site/calendly-button";

/**
 * Marketing site chrome. The Calendly launcher used to live in the root
 * layout, which meant it would also float over the operations console — a
 * sales widget inside a dispatcher's tool. It belongs to this segment only.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CalendlyButton />
    </>
  );
}
