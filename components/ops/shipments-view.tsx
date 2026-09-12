"use client";

import * as React from "react";
import { DropdownMenu } from "radix-ui";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Inbox,
  ListFilter,
  MessageSquare,
  Rows3,
  RotateCcw,
  Search,
  Truck,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, Chip, Kbd, StatusPill } from "./primitives";
import { DetailDrawer } from "./detail-drawer";
import type { RankedShipment, ShipmentStatus } from "@/lib/ops/types";
import {
  RANKED,
  SERVICE_LABEL,
  SLA_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  driverById,
} from "@/lib/ops/data";
import { formatCountdown, formatRelative } from "@/lib/ops/format";

/* -------------------------------------------------------------------------- */
/* Saved views                                                                 */
/* Named questions an operator actually asks, not generic status tabs. This is */
/* the difference between a table and a tool.                                  */
/* -------------------------------------------------------------------------- */

type ViewId = "attention" | "active" | "exceptions" | "unassigned" | "same_day" | "delivered";

const VIEWS: Array<{ id: ViewId; label: string; test: (s: RankedShipment) => boolean; alarming?: boolean }> = [
  {
    id: "attention",
    label: "Needs attention",
    alarming: true,
    test: (s) =>
      s.status !== "delivered" &&
      (s.sla === "breached" || s.sla === "at_risk" || s.status === "exception" || (!s.driverId && s.status !== "booked")),
  },
  { id: "active", label: "All active", test: (s) => s.status !== "delivered" },
  { id: "exceptions", label: "Exceptions", alarming: true, test: (s) => s.status === "exception" },
  { id: "unassigned", label: "Unassigned", test: (s) => !s.driverId && s.status !== "delivered" },
  { id: "same_day", label: "Same day", test: (s) => s.service === "same_day" && s.status !== "delivered" },
  { id: "delivered", label: "Delivered", test: (s) => s.status === "delivered" },
];

const ALL_STATUSES: ShipmentStatus[] = ["booked", "collected", "at_hub", "out_for_delivery", "held", "exception", "delivered"];
const ZONES = ["North", "East", "South", "West"];

type SortId = "urgency" | "sla" | "updated" | "tracking";
const SORTS: Array<{ id: SortId; label: string }> = [
  { id: "urgency", label: "Most urgent" },
  { id: "sla", label: "Promise time" },
  { id: "updated", label: "Recently updated" },
  { id: "tracking", label: "Tracking number" },
];

/* -------------------------------------------------------------------------- */

function MenuButton({
  label,
  active,
  children,
}: {
  label: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] font-medium transition-colors",
          active
            ? "border-ops-accent-line bg-ops-accent-weak text-ops-text"
            : "border-ops-line bg-ops-surface text-ops-text-secondary hover:bg-ops-hover hover:text-ops-text",
        )}
      >
        {label}
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={4}
          align="start"
          className="ops-root z-50 min-w-[184px] rounded-lg border border-ops-line bg-ops-surface p-1 shadow-ops-pop"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function CheckRow({
  checked,
  onSelect,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.CheckboxItem
      checked={checked}
      onSelect={(e) => {
        e.preventDefault(); // keep the menu open for multi-select
        onSelect();
      }}
      className="flex h-7 cursor-pointer select-none items-center gap-2 rounded-md px-2 text-[12px] text-ops-text outline-none data-[highlighted]:bg-ops-hover"
    >
      <span className={cn(
        "grid size-3.5 shrink-0 place-items-center rounded border",
        checked ? "border-ops-accent bg-ops-accent text-white" : "border-ops-line-strong",
      )}>
        {checked && <Check className="size-2.5" strokeWidth={3} />}
      </span>
      {children}
    </DropdownMenu.CheckboxItem>
  );
}

export function ShipmentsView({ initialView = "attention" }: { initialView?: ViewId }) {
  const [view, setView] = React.useState<ViewId>(initialView);
  const [query, setQuery] = React.useState("");
  const [statuses, setStatuses] = React.useState<Set<ShipmentStatus>>(new Set());
  const [zones, setZones] = React.useState<Set<string>>(new Set());
  const [sort, setSort] = React.useState<SortId>("urgency");
  const [compact, setCompact] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [cursor, setCursor] = React.useState(0);

  const viewCounts = React.useMemo(
    () => Object.fromEntries(VIEWS.map((v) => [v.id, RANKED.filter(v.test).length])) as Record<ViewId, number>,
    [],
  );

  const rows = React.useMemo(() => {
    const viewTest = VIEWS.find((v) => v.id === view)!.test;
    const q = query.trim().toLowerCase();

    const filtered = RANKED.filter((s) => {
      if (!viewTest(s)) return false;
      if (statuses.size && !statuses.has(s.status)) return false;
      if (zones.size && !zones.has(s.zone)) return false;
      if (q) {
        const hay = `${s.tracking} ${s.recipient} ${s.company ?? ""} ${s.city} ${s.postcode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    if (sort === "sla") sorted.sort((a, b) => a.slaDueAt - b.slaDueAt);
    else if (sort === "updated") sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    else if (sort === "tracking") sorted.sort((a, b) => a.tracking.localeCompare(b.tracking));
    return sorted;
  }, [view, query, statuses, zones, sort]);

  // Keep the keyboard cursor inside the result set when filters change.
  // Done during render rather than in an effect so the list never paints one
  // frame with a cursor pointing at a row that is no longer there.
  const filterKey = `${view}|${query}|${[...statuses].sort().join(",")}|${[...zones].sort().join(",")}|${sort}`;
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setCursor(0);
  }

  const openShipment = rows.find((s) => s.id === openId) ?? null;
  // The search box is a filter too — without counting it, an empty result
  // from a search alone offered no way back.
  const filterCount = statuses.size + zones.size + (query.trim() ? 1 : 0);
  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleSet = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const clearFilters = () => {
    setStatuses(new Set());
    setZones(new Set());
    setQuery("");
  };

  /* Keyboard navigation over the list. Arrow keys move, Enter opens, X
     selects — the same grammar as every serious operations tool. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (openId) return;
    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, rows.length - 1));
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[cursor]) setOpenId(rows[cursor].id);
    } else if (e.key.toLowerCase() === "x") {
      e.preventDefault();
      if (rows[cursor]) setSelected((s) => toggleSet(s, rows[cursor].id));
    } else if (e.key === "Escape") {
      setSelected(new Set());
    }
  };

  const rowH = compact ? "h-8" : "h-9";

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ================= Saved views ================= */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-ops-line bg-ops-surface px-3">
        {VIEWS.map((v) => {
          const active = v.id === view;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "relative flex h-9 shrink-0 items-center gap-1.5 px-2 text-[12px] font-medium transition-colors",
                active ? "text-ops-text" : "text-ops-text-secondary hover:text-ops-text",
              )}
            >
              {v.label}
              <span
                className={cn(
                  "ops-num rounded px-1 text-[11px] font-semibold",
                  v.alarming && viewCounts[v.id] > 0
                    ? "bg-ops-risk-bg text-ops-risk-fg"
                    : "bg-ops-active text-ops-text-secondary",
                )}
              >
                {viewCounts[v.id]}
              </span>
              {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ops-text" />}
            </button>
          );
        })}
      </div>

      {/* ================= Toolbar ================= */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-ops-line bg-ops-surface px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ops-text-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter these results…"
            aria-label="Filter shipments"
            className="h-7 w-[210px] rounded-md border border-ops-line bg-ops-sunken pl-7 pr-2 text-[12px] text-ops-text outline-none placeholder:text-ops-text-tertiary focus:border-ops-accent-line focus:bg-ops-surface"
          />
        </div>

        <MenuButton
          active={statuses.size > 0}
          label={
            <span className="flex items-center gap-1.5">
              <ListFilter className="size-3.5" />
              Status{statuses.size > 0 && ` · ${statuses.size}`}
            </span>
          }
        >
          {ALL_STATUSES.map((s) => (
            <CheckRow key={s} checked={statuses.has(s)} onSelect={() => setStatuses((prev) => toggleSet(prev, s))}>
              <StatusPill tone={STATUS_TONE[s]}>{STATUS_LABEL[s]}</StatusPill>
            </CheckRow>
          ))}
        </MenuButton>

        <MenuButton active={zones.size > 0} label={<>Zone{zones.size > 0 && ` · ${zones.size}`}</>}>
          {ZONES.map((z) => (
            <CheckRow key={z} checked={zones.has(z)} onSelect={() => setZones((prev) => toggleSet(prev, z))}>
              {z}
            </CheckRow>
          ))}
        </MenuButton>

        <MenuButton
          label={
            <span className="flex items-center gap-1.5">
              <ArrowUpDown className="size-3.5" />
              {SORTS.find((s) => s.id === sort)!.label}
            </span>
          }
        >
          {SORTS.map((s) => (
            <DropdownMenu.Item
              key={s.id}
              onSelect={() => setSort(s.id)}
              className="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2 text-[12px] text-ops-text outline-none data-[highlighted]:bg-ops-hover"
            >
              <Check className={cn("size-3", sort === s.id ? "opacity-100" : "opacity-0")} strokeWidth={3} />
              {s.label}
            </DropdownMenu.Item>
          ))}
        </MenuButton>

        {filterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[12px] text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
          >
            <X className="size-3" /> Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <span className="ops-num hidden text-[11px] text-ops-text-tertiary sm:block">
            {rows.length} of {RANKED.length}
          </span>
          <button
            type="button"
            onClick={() => setCompact((c) => !c)}
            aria-pressed={compact}
            aria-label="Toggle row density"
            title="Row density"
            className={cn(
              "grid size-7 place-items-center rounded-md border text-ops-text-secondary hover:bg-ops-hover hover:text-ops-text",
              compact ? "border-ops-accent-line bg-ops-accent-weak" : "border-ops-line bg-ops-surface",
            )}
          >
            <Rows3 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* ================= Table ================= */}
      <div
        className="min-h-0 flex-1 overflow-auto outline-none"
        tabIndex={0}
        role="grid"
        aria-label="Shipments"
        aria-rowcount={rows.length}
        onKeyDown={onKeyDown}
      >
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <div className="grid size-9 place-items-center rounded-full bg-ops-active text-ops-text-tertiary">
              <Inbox className="size-4" />
            </div>
            <div className="text-[13px] font-medium text-ops-text">Nothing matches these filters</div>
            <p className="max-w-[280px] text-[12px] text-ops-text-secondary">
              {view === "attention"
                ? "No shipment is currently breaching or at risk. That is the state you want."
                : "Try widening the status or zone filter, or clear the search."}
            </p>
            {filterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-1 inline-flex h-7 items-center rounded-md border border-ops-line bg-ops-surface px-2.5 text-[12px] font-medium text-ops-text hover:bg-ops-hover"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="[&>th]:border-b [&>th]:border-ops-line [&>th]:bg-ops-sunken [&>th]:px-2 [&>th]:py-1.5 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-medium [&>th]:text-ops-text-tertiary">
                <th className="w-8 pl-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() =>
                      setSelected(allVisibleSelected ? new Set() : new Set(rows.map((r) => r.id)))
                    }
                    aria-label="Select all visible shipments"
                    className="size-3.5 accent-[var(--ops-accent)]"
                  />
                </th>
                <th className="w-[104px]">Tracking</th>
                <th className="min-w-[180px]">Recipient</th>
                <th className="w-[132px]">Status</th>
                <th className="w-[104px]">Promise</th>
                <th className="w-[150px]">Driver</th>
                <th className="w-[92px]">Service</th>
                <th className="w-[86px] pr-3 text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const driver = driverById(s.driverId);
                const isSelected = selected.has(s.id);
                const isCursor = i === cursor;
                const overdue = s.minutesToSla < 0 && s.status !== "delivered";

                return (
                  <tr
                    key={s.id}
                    onClick={() => {
                      setCursor(i);
                      setOpenId(s.id);
                    }}
                    aria-selected={isSelected}
                    className={cn(
                      "group cursor-pointer [&>td]:border-b [&>td]:border-ops-line [&>td]:px-2",
                      rowH,
                      isSelected ? "bg-ops-accent-weak" : "bg-ops-surface hover:bg-ops-hover",
                      isCursor && !isSelected && "bg-ops-hover",
                    )}
                  >
                    {/* A left rule is a cheaper, calmer risk signal than tinting
                        the whole row red 20 times over. */}
                    <td className="relative w-8 pl-3" onClick={(e) => e.stopPropagation()}>
                      {overdue && <span className="absolute inset-y-0 left-0 w-[2px] bg-ops-risk-dot" aria-hidden />}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setSelected((prev) => toggleSet(prev, s.id))}
                        aria-label={`Select ${s.tracking}`}
                        className="size-3.5 accent-[var(--ops-accent)]"
                      />
                    </td>

                    <td className="ops-mono whitespace-nowrap text-ops-text">{s.tracking}</td>

                    <td className="max-w-0">
                      <div className="truncate text-[12px] font-medium text-ops-text">{s.recipient}</div>
                      <div className="truncate text-[11px] text-ops-text-tertiary">
                        {s.company ? `${s.company} · ` : ""}{s.city} {s.postcode}
                      </div>
                    </td>

                    <td>
                      <StatusPill tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</StatusPill>
                    </td>

                    {/* Promise column: the countdown is the number, the state is
                        the label. Never colour alone. */}
                    <td>
                      <div className="flex flex-col leading-tight">
                        <span className={cn("ops-num text-[12px] font-semibold", overdue ? "text-ops-risk-fg" : "text-ops-text")}>
                          {s.status === "delivered" ? "—" : formatCountdown(s.minutesToSla)}
                        </span>
                        <span className={cn(
                          "text-[10px]",
                          s.sla === "breached" || s.sla === "at_risk" ? "text-ops-risk-fg" :
                          s.sla === "due_soon" ? "text-ops-warn-fg" : "text-ops-text-tertiary",
                        )}>
                          {SLA_LABEL[s.sla]}
                        </span>
                      </div>
                    </td>

                    <td>
                      {driver ? (
                        <span className="flex items-center gap-1.5">
                          <Avatar initials={driver.initials} />
                          <span className="truncate text-[12px] text-ops-text-secondary">{driver.name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ops-warn-fg">
                          <span className="size-1.5 rounded-full bg-ops-warn-dot" aria-hidden />
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td><Chip>{SERVICE_LABEL[s.service]}</Chip></td>

                    <td className="pr-3 text-right text-[11px] whitespace-nowrap text-ops-text-tertiary">
                      {formatRelative(s.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= Footer / keyboard hints ================= */}
      <div className="flex h-7 shrink-0 items-center gap-3 border-t border-ops-line bg-ops-surface px-3 text-[11px] text-ops-text-tertiary">
        <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> move</span>
        <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
        <span className="flex items-center gap-1"><Kbd>X</Kbd> select</span>
        <span className="ml-auto ops-num">{rows.length} shown</span>
      </div>

      {/* ================= Bulk action bar ================= */}
      {selected.size > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-[var(--ops-r-card)] border border-ops-line bg-ops-raised px-2 py-1.5 shadow-ops-pop">
            <span className="ops-num px-1 text-[12px] font-semibold text-ops-text">{selected.size}</span>
            <span className="text-[12px] text-ops-text-secondary">selected</span>
            <span className="mx-1 h-4 w-px bg-ops-line" />
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
              <Truck className="size-3.5" /> Reassign
            </button>
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
              <RotateCcw className="size-3.5" /> Retry
            </button>
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
              <MessageSquare className="size-3.5" /> Notify
            </button>
            <span className="mx-1 h-4 w-px bg-ops-line" />
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
              className="grid size-7 place-items-center rounded-md text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <DetailDrawer shipment={openShipment} onClose={() => setOpenId(null)} />
    </div>
  );
}
