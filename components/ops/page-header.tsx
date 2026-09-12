import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * One page header for every screen: title, one line of context, actions on
 * the right. The current build varies the header per page — different sizes,
 * the period control in a different place each time — which is most of why it
 * reads as five screens rather than one product.
 */
export function PageHeader({
  title,
  detail,
  actions,
  tabs,
  className,
}: {
  title: string;
  detail?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-ops-line bg-ops-surface", className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 pb-5 pt-6">
        <div className="min-w-0">
          <h1 className="text-[28px] font-medium tracking-[-0.02em] text-ops-text">{title}</h1>
          {detail && <p className="mt-1 text-[13px] text-ops-text-secondary">{detail}</p>}
        </div>
        {actions && <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="px-6">{tabs}</div>}
    </div>
  );
}

/** Secondary navigation inside a page. Financials is the only user today. */
export function Tabs({
  items,
  active,
  onChange,
}: {
  items: Array<{ id: string; label: string; count?: number }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="-mb-1 flex items-center gap-1 overflow-x-auto">
      {items.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative flex h-9 shrink-0 items-center gap-2 border-b-2 px-3 text-[14px] font-medium transition-colors",
              on
                ? "border-ops-accent text-ops-text"
                : "border-transparent text-ops-text-secondary hover:text-ops-text",
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ops-num rounded-full bg-ops-active px-2 text-[12px] font-semibold text-ops-text-tertiary">
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Consistent page body gutter, so every screen lines up with every other. */
export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  /* Full width on a fixed 24px gutter, the same gutter as the top bar and footer,
     so every band shares one left edge. A centred max-width column left ~100px
     of dead margin either side on a 1920 monitor and put the page title 100px
     right of the search field above it. Wide screens get wider tables, which
     is what a ledger wants. */
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}
