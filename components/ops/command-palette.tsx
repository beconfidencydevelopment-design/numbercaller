"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Package, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd, StatusPill } from "./primitives";
import { RANKED, STATUS_LABEL, STATUS_TONE } from "@/lib/ops/data";

const ROUTES = [
  { label: "Today", href: "/ops" },
  { label: "Shipments", href: "/ops/shipments" },
  { label: "Exceptions", href: "/ops/exceptions" },
  { label: "Drivers", href: "/ops/drivers" },
];

/**
 * Cmd-K search. In a tool someone lives in all day the keyboard path is the
 * primary path, not a power-user extra — a dispatcher on the phone to a
 * customer needs a tracking number on screen in under two seconds.
 */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();

  const shipments = React.useMemo(() => {
    if (!q) return RANKED.slice(0, 6);
    return RANKED.filter(
      (s) =>
        s.tracking.toLowerCase().includes(q) ||
        s.recipient.toLowerCase().includes(q) ||
        s.postcode.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [q]);

  const routes = React.useMemo(
    () => (q ? ROUTES.filter((r) => r.label.toLowerCase().includes(q)) : ROUTES),
    [q],
  );

  const items = React.useMemo(
    () => [
      ...routes.map((r) => ({ kind: "route" as const, key: r.href, label: r.label, href: r.href })),
      ...shipments.map((s) => ({ kind: "shipment" as const, key: s.id, shipment: s, href: `/ops/shipments?focus=${s.id}` })),
    ],
    [routes, shipments],
  );

  // Adjusting state during render is React's documented pattern for "reset a
  // value when its input changes" — an effect would render the stale cursor
  // first and then correct it.
  const [lastQuery, setLastQuery] = React.useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setCursor(0);
  }

  React.useEffect(() => {
    // Focus after paint, once the dialog is in the tree.
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[cursor];
      if (item) go(item.href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="ops-root fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={onKeyDown}
        className="relative mx-4 w-full max-w-[560px] overflow-hidden rounded-xl border border-ops-line bg-ops-surface shadow-ops-pop"
      >
        <div className="flex h-11 items-center gap-2 border-b border-ops-line px-3">
          <Search className="size-4 shrink-0 text-ops-text-tertiary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracking, recipient, postcode…"
            className="h-full w-full bg-transparent text-[13px] text-ops-text outline-none placeholder:text-ops-text-tertiary"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="max-h-[340px] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <div className="px-3 py-8 text-center text-[12px] text-ops-text-tertiary">
              No matches for “{query}”
            </div>
          )}

          {routes.length > 0 && <div className="ops-eyebrow px-2 pb-1 pt-2">Go to</div>}
          {items.map((item, i) => {
            const selected = i === cursor;
            if (item.kind === "route") {
              return (
                <button
                  key={item.key}
                  type="button"
                  onMouseMove={() => setCursor(i)}
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px]",
                    selected ? "bg-ops-accent-weak text-ops-text" : "text-ops-text-secondary",
                  )}
                >
                  <CornerDownLeft className="size-3.5 text-ops-text-tertiary" />
                  {item.label}
                </button>
              );
            }
            const s = item.shipment;
            const isFirstShipment = items.findIndex((x) => x.kind === "shipment") === i;
            return (
              <React.Fragment key={item.key}>
                {isFirstShipment && <div className="ops-eyebrow px-2 pb-1 pt-3">Shipments</div>}
                <button
                  type="button"
                  onMouseMove={() => setCursor(i)}
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex h-9 w-full items-center gap-2 rounded-md px-2 text-left",
                    selected ? "bg-ops-accent-weak" : "",
                  )}
                >
                  <Package className="size-3.5 shrink-0 text-ops-text-tertiary" />
                  <span className="ops-mono shrink-0 text-ops-text">{s.tracking}</span>
                  <span className="truncate text-[12px] text-ops-text-secondary">
                    {s.recipient} · {s.postcode}
                  </span>
                  <span className="ml-auto shrink-0">
                    <StatusPill tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</StatusPill>
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-ops-line bg-ops-sunken px-3 py-1.5 text-[11px] text-ops-text-tertiary">
          <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
        </div>
      </div>
    </div>
  );
}
