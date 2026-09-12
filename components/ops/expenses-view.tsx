"use client";

import * as React from "react";
import { Download, Plus, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Money,
  RowAction,
  StatusPill,
} from "./primitives";
import { PageBody, PageHeader } from "./page-header";
import {
  CATEGORY_LABEL,
  COMPANIES,
  EXPENSES,
  EXPENSE_TOTAL,
  GLOBAL_COMPANY,
  QUIET_DAYS,
  companyName,
  driverById,
} from "@/lib/ops/data";
import type { ExpenseCategory, ExpenseEntry } from "@/lib/ops/types";
import { formatWeekday, initialsOf, money } from "@/lib/ops/format";

type StatusFilter = "all" | "settled" | "outstanding";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ExpenseCategory[];

/**
 * A day header inside the ledger.
 *
 * Grouping by day rather than repeating the date on every row is what turns
 * 23 rows into four readable blocks, and it gives each day a subtotal — the
 * figure an owner actually scans for.
 */
function DayHeader({ at, rows }: { at: number; rows: ExpenseEntry[] }) {
  const total = rows.reduce((n, r) => n + r.amount, 0);
  return (
    <tr className="bg-ops-sunken">
      <td colSpan={5} className="border-y border-ops-line px-4 py-2">
        <span className="text-[12px] font-semibold text-ops-text">{formatWeekday(at)}</span>
        <span className="ml-2 text-[11px] text-ops-text-tertiary">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
        </span>
      </td>
      <td className="border-y border-ops-line px-3 py-2 text-right">
        <Money value={total} tone={false} className="text-[12px] font-semibold text-ops-text" />
      </td>
      <td className="border-y border-ops-line" />
    </tr>
  );
}

/**
 * A day inside the period with nothing booked against it.
 *
 * Worth a row: it separates "the business was quiet" from "somebody forgot to
 * enter this", which is the difference between a period that can close and
 * one that cannot. Only days that have already happened are listed — the live
 * build shows the coming Saturday and Sunday as having no operations.
 */
function QuietDay({ at }: { at: number }) {
  return (
    <tr>
      <td colSpan={7} className="border-b border-ops-line px-4 py-2">
        <span className="text-[12px] text-ops-text-tertiary">{formatWeekday(at)}</span>
        <StatusPill tone="idle" dot={false} className="ml-2">
          No operations
        </StatusPill>
      </td>
    </tr>
  );
}

export function ExpensesView() {
  const [company, setCompany] = React.useState<string>("all");
  const [category, setCategory] = React.useState<string>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXPENSES.filter((e) => {
      if (company !== "all" && e.companyId !== company) return false;
      if (category !== "all" && e.category !== category) return false;
      if (status === "settled" && e.status === "outstanding") return false;
      if (status === "outstanding" && e.status !== "outstanding") return false;
      if (!q) return true;
      const driver = driverById(e.driverId);
      return `${e.description} ${companyName(e.companyId)} ${driver?.name ?? ""} ${CATEGORY_LABEL[e.category]}`
        .toLowerCase()
        .includes(q);
    });
  }, [company, category, status, query]);

  const filteredTotal = filtered.reduce((n, e) => n + e.amount, 0);
  const outstanding = filtered.filter((e) => e.status === "outstanding").reduce((n, e) => n + e.amount, 0);
  const filtersOn = company !== "all" || category !== "all" || status !== "all" || query.trim() !== "";

  /** Group into days, newest first, with quiet days interleaved by date. */
  const days = React.useMemo(() => {
    const map = new Map<number, ExpenseEntry[]>();
    for (const e of filtered) {
      const list = map.get(e.at) ?? [];
      list.push(e);
      map.set(e.at, list);
    }
    const entries = [...map.entries()].map(([at, rows]) => ({ at, rows, quiet: false }));
    const quiet = filtersOn ? [] : QUIET_DAYS.map((at) => ({ at, rows: [] as ExpenseEntry[], quiet: true }));
    return [...entries, ...quiet].sort((a, b) => b.at - a.at);
  }, [filtered, filtersOn]);

  const allIds = filtered.map((e) => e.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds));
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectedTotal = EXPENSES.filter((e) => selected.has(e.id)).reduce((n, e) => n + e.amount, 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        detail={
          <>
            {EXPENSES.length} entries · {money(EXPENSE_TOTAL)} incurred ·{" "}
            <span className="font-medium text-ops-risk-fg">{money(EXPENSE_TOTAL)} still outstanding</span>
          </>
        }
        actions={
          <>
            <Button variant="default">
              <Download className="size-3.5" />
              Export
            </Button>
            <Button variant="primary">
              <Plus className="size-3.5" />
              Add expense
            </Button>
          </>
        }
      />

      <PageBody className="flex flex-col gap-3">
        {/* ------------------------------------------------------------- */}
        {/* Filters                                                        */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex h-8 min-w-[190px] flex-1 items-center sm:max-w-[260px]">
            <Search className="pointer-events-none absolute left-3 size-3.5 text-ops-text-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entries"
              aria-label="Search entries"
              className="h-full w-full rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface pl-8 pr-3 text-[13px] text-ops-text outline-none placeholder:text-ops-text-tertiary focus:border-ops-line-strong"
            />
          </label>

          <Select value={company} onChange={setCompany} label="Company">
            <option value="all">All companies</option>
            {COMPANIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={GLOBAL_COMPANY.id}>{GLOBAL_COMPANY.name}</option>
          </Select>

          <Select value={category} onChange={setCategory} label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>

          {/* A three-way segmented control, because the options are mutually
              exclusive and there are few enough to show at once. */}
          <div role="radiogroup" aria-label="Status" className="flex h-8 items-center rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface p-1">
            {([
              ["all", "All"],
              ["outstanding", "Outstanding"],
              ["settled", "Settled"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={status === id}
                onClick={() => setStatus(id)}
                className={cn(
                  "h-7 rounded-[6px] px-3 text-[12px] font-medium transition-colors",
                  status === id
                    ? "bg-ops-active text-ops-text"
                    : "text-ops-text-secondary hover:text-ops-text",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {filtersOn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCompany("all");
                setCategory("all");
                setStatus("all");
                setQuery("");
              }}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2 text-[12px] text-ops-text-secondary">
            <span>
              <strong className="ops-num font-semibold text-ops-text">{filtered.length}</strong>
              {filtered.length === EXPENSES.length ? " entries" : ` of ${EXPENSES.length}`}
            </span>
            <span className="text-ops-line-strong" aria-hidden>
              ·
            </span>
            <Money value={filteredTotal} tone={false} className="font-semibold text-ops-text" />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Ledger                                                         */}
        {/* ------------------------------------------------------------- */}
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              title="No entries match these filters"
              detail="Clear the filters to see the full period, or log a new expense against one of the six companies."
              action={
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setCompany("all");
                    setCategory("all");
                    setStatus("all");
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-[13px]">
                <thead className="ops-sticky-head">
                  <tr className="text-left">
                    <th className="w-9 border-b border-ops-line px-4 py-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all entries"
                        className="size-3.5 accent-[var(--ops-accent)]"
                      />
                    </th>
                    <th className="ops-eyebrow border-b border-ops-line py-2 pr-3 font-semibold">Company</th>
                    <th className="ops-eyebrow border-b border-ops-line py-2 pr-3 font-semibold">Category</th>
                    <th className="ops-eyebrow border-b border-ops-line py-2 pr-3 font-semibold">Driver</th>
                    <th className="ops-eyebrow border-b border-ops-line py-2 pr-3 font-semibold">Description</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-semibold">Amount</th>
                    <th className="ops-eyebrow border-b border-ops-line px-4 py-2 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) =>
                    day.quiet ? (
                      <QuietDay key={`q-${day.at}`} at={day.at} />
                    ) : (
                      <React.Fragment key={day.at}>
                        <DayHeader at={day.at} rows={day.rows} />
                        {day.rows.map((e) => {
                          const driver = driverById(e.driverId);
                          const on = selected.has(e.id);
                          return (
                            <tr
                              key={e.id}
                              className={cn(
                                "h-10 border-b border-ops-line last:border-b-0",
                                on ? "bg-ops-accent-weak" : "hover:bg-ops-hover",
                              )}
                            >
                              <td className="px-4">
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => toggle(e.id)}
                                  aria-label={`Select ${e.description}`}
                                  className="size-3.5 accent-[var(--ops-accent)]"
                                />
                              </td>
                              <td className="pr-3 font-medium text-ops-text">{companyName(e.companyId)}</td>
                              <td className="pr-3">
                                <span className="text-[12px] text-ops-text-secondary">
                                  {CATEGORY_LABEL[e.category]}
                                </span>
                              </td>
                              <td className="pr-3">
                                {driver ? (
                                  <span className="flex items-center gap-2">
                                    <Avatar initials={initialsOf(driver.name)} className="size-5 text-[9px]" />
                                    <span className="text-[12px] text-ops-text-secondary">{driver.name}</span>
                                  </span>
                                ) : (
                                  <span className="text-[12px] text-ops-text-tertiary">—</span>
                                )}
                              </td>
                              <td className="max-w-[280px] truncate pr-3 text-[12px] text-ops-text-secondary">
                                {e.description}
                              </td>
                              <td className="px-3 text-right">
                                <Money value={e.amount} tone={false} className="font-semibold text-ops-text" />
                              </td>
                              <td className="px-4 text-right">
                                {/* Every entry in the period is outstanding, so a
                                    loud pill on all 23 rows would carry no
                                    information. The state is stated quietly here
                                    and the weight is put on the footer total. */}
                                <span className="inline-flex items-center gap-2">
                                  <StatusPill tone={e.status === "outstanding" ? "idle" : "ok"}>
                                    {e.status === "outstanding" ? "Outstanding" : "Settled"}
                                  </StatusPill>
                                  {e.payable && <RowAction>Mark paid</RowAction>}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ),
                  )}
                </tbody>
                {/* A ledger ends in a total. The live build ends in
                    "Showing 1–23 of 23" and never adds the column up. */}
                <tfoot>
                  <tr className="border-t-2 border-ops-line-strong bg-ops-sunken">
                    <td colSpan={5} className="px-4 py-3 text-[12px] font-semibold text-ops-text">
                      {filtersOn ? "Filtered total" : `${filtered.length} entries · ${PERIOD_NOTE}`}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Money value={filteredTotal} tone={false} className="text-[14px] font-semibold text-ops-text" />
                    </td>
                    <td className="px-4 py-3 text-right text-[11px] text-ops-text-tertiary">
                      {money(outstanding)} unpaid
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </PageBody>

      {/* Bulk bar. Appears only with a selection, so it costs nothing the
          rest of the time. */}
      {selected.size > 0 && (
        <div className="pointer-events-none sticky bottom-3 z-10 flex justify-center px-5">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-ops-line bg-ops-surface px-3 py-2 shadow-ops-pop">
            <span className="text-[12px] text-ops-text-secondary">
              <strong className="ops-num font-semibold text-ops-text">{selected.size}</strong> selected ·{" "}
              <Money value={selectedTotal} tone={false} className="font-semibold text-ops-text" />
            </span>
            <Button variant="default" size="sm">
              Mark paid
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

const PERIOD_NOTE = "period to date";

/** Native select, styled to match the rest of the control row. */
function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-2 text-[12px] font-medium text-ops-text outline-none hover:bg-ops-hover focus:border-ops-line-strong"
    >
      {children}
    </select>
  );
}
