"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, CornerDownLeft, Receipt, Search, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd } from "./primitives";
import { COMPANIES, DRIVERS, EXPENSES, companyName, outstandingFor } from "@/lib/ops/data";
import { formatDate, money } from "@/lib/ops/format";

type Row = {
  id: string;
  label: string;
  detail: string;
  href: string;
  group: "Companies" | "Drivers" | "Entries";
  icon: React.ComponentType<{ className?: string }>;
};

/**
 * One flat index built once at module scope, not per keystroke. The whole
 * ledger is 47 rows; filtering it is free, and building it eagerly means the
 * first keystroke is as fast as the tenth.
 */
const INDEX: Row[] = [
  ...COMPANIES.map((c) => ({
    id: `c-${c.id}`,
    label: c.name,
    detail: c.lastPaymentAt ? `Last paid ${formatDate(c.lastPaymentAt)}` : "Never paid",
    href: `/ops/clients?company=${c.id}`,
    group: "Companies" as const,
    icon: Building2,
  })),
  ...DRIVERS.map((d) => ({
    id: `d-${d.id}`,
    label: d.name,
    detail: `${companyName(d.companyId)} · ${money(outstandingFor(d))} outstanding`,
    href: "/ops/drivers",
    group: "Drivers" as const,
    icon: Users,
  })),
  ...EXPENSES.map((e) => ({
    id: `e-${e.id}`,
    label: e.description,
    detail: `${companyName(e.companyId)} · ${formatDate(e.at)} · ${money(e.amount)}`,
    href: "/ops/expenses",
    group: "Entries" as const,
    icon: Receipt,
  })),
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(0);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? INDEX.filter((r) => `${r.label} ${r.detail}`.toLowerCase().includes(q))
      : INDEX.filter((r) => r.group !== "Entries");
    return rows.slice(0, 24);
  }, [query]);

  // Adjust during render rather than in an effect: when the result list
  // shrinks the cursor must not point past the end, and correcting it in an
  // effect would render one frame with an invalid selection.
  const safeCursor = results.length === 0 ? 0 : Math.min(cursor, results.length - 1);
  if (safeCursor !== cursor) setCursor(safeCursor);

  const go = React.useCallback(
    (row: Row | undefined) => {
      if (!row) return;
      router.push(row.href);
      onClose();
    },
    [router, onClose],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      go(results[safeCursor]);
    }
  };

  /**
   * Group boundaries are computed alongside the rows rather than tracked with
   * a mutable cursor inside the map. The React compiler lint rejects
   * reassigning a closure variable during render — and rightly so: it makes
   * the output depend on iteration order surviving a re-entrant render.
   */
  const rows = results.map((row, i) => ({
    row,
    i,
    header: i === 0 || results[i - 1].group !== row.group ? row.group : null,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative flex max-h-[64vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[var(--ops-r-card)] border border-ops-line bg-ops-surface shadow-ops-pop"
      >
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-ops-line px-3">
          <Search className="size-4 shrink-0 text-ops-text-tertiary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search entries, drivers, companies"
            className="h-full w-full bg-transparent text-body text-ops-text outline-none placeholder:text-ops-text-tertiary"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-body text-ops-text-secondary">
              Nothing matches “{query}”.
            </p>
          )}
          {rows.map(({ row, i, header }) => {
            const Icon = row.icon;
            return (
              <React.Fragment key={row.id}>
                {header && <div className="ops-eyebrow px-3 pb-1 pt-2">{header}</div>}
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(row)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--ops-r-control)] px-3 py-2 text-left",
                    i === safeCursor ? "bg-ops-active" : "hover:bg-ops-hover",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-ops-text-tertiary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-medium text-ops-text">{row.label}</span>
                    <span className="block truncate text-body text-ops-text-tertiary">{row.detail}</span>
                  </span>
                  {i === safeCursor && <CornerDownLeft className="size-3.5 shrink-0 text-ops-text-tertiary" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
