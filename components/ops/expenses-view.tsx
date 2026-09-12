"use client";

import * as React from "react";
import {
  IconClose,
  IconDownload,
  IconPlus,
  IconSearch,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import {
  Avatar,
  Button,
  Card,
  CategoryTag,
  CompanyTag,
  EmptyState,
  Money,
  RowAction,
  Segmented,
  StatusPill,
} from "./primitives";
import { PageBody, PageHeader } from "./page-header";
import { Select } from "./select";
import { useOpsModal } from "./ops-modals";
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
  const drivers = new Set(rows.map((r) => r.driverId).filter(Boolean)).size;
  return (
    <tr className="bg-ops-sunken">
      <td colSpan={5} className="border-y border-ops-line px-4 py-2">
        <span className="font-medium text-ops-text">{formatWeekday(at)}</span>
        <span className="ml-2 text-ops-text-tertiary">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
          {drivers > 0 && ` · ${drivers} ${drivers === 1 ? "driver" : "drivers"}`}
        </span>
      </td>
      <td className="border-y border-ops-line px-3 py-2 text-right">
        <Money value={total} tone={false} className="font-medium text-ops-text" />
      </td>
      <td colSpan={2} className="border-y border-ops-line" />
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
      <td colSpan={8} className="border-b border-ops-line px-4 py-2">
        <span className="text-ops-text-tertiary">{formatWeekday(at)}</span>
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
  const openModal = useOpsModal();

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
    const entries = [...map.entries()].map(([at, rows]) => ({
      at,
      rows,
      quiet: false,
    }));
    const quiet = filtersOn
      ? []
      : QUIET_DAYS.map((at) => ({
          at,
          rows: [] as ExpenseEntry[],
          quiet: true,
        }));
    return [...entries, ...quiet].sort((a, b) => b.at - a.at);
  }, [filtered, filtersOn]);

  /**
   * The running total, which is the client's own column and the thing that
   * makes a list of costs read as a ledger.
   *
   * It accumulates in display order from the bottom up, so the top row always
   * equals the period total in the page header and in the footer. Reading a
   * column that disagrees with the total above it is how people stop trusting
   * a finance screen, and a newest-first table accumulated oldest-first would
   * do exactly that.
   */
  const runningById = React.useMemo(() => {
    const ordered = days.flatMap((d) => d.rows);
    const out = new Map<string, number>();
    let sum = 0;
    for (let i = ordered.length - 1; i >= 0; i -= 1) {
      sum += ordered[i].amount;
      out.set(ordered[i].id, sum);
    }
    return out;
  }, [days]);

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
              <IconDownload className="size-3.5" />
              Export
            </Button>
            <Button variant="primary" onClick={() => openModal({ kind: "log-expense" })}>
              <IconPlus className="size-3.5" />
              Add expense
            </Button>
          </>
        }
      />

      <PageBody>
        <Card className="overflow-hidden">
          {/* ----------------------------------------------------------- */}
          {/* Toolbar                                                      */}
          {/*                                                              */}
          {/* Inside the card, not floating above it. These controls act on
              nothing but this table, and a row of inputs sitting on the
              page background reads as a second object competing with the
              ledger rather than as its own header.                        */}
          {/* ----------------------------------------------------------- */}
          <div className="flex flex-wrap items-center gap-2 border-b border-ops-line px-4 py-3">
            {/* The top bar already carries a console-wide search. This one
              only narrows the rows below it, so it says so — two identical
              "Search entries" fields 90px apart is a trap, not a feature. */}
            <label className="relative flex h-8 min-w-[190px] flex-1 items-center sm:max-w-[240px]">
              <IconSearch className="pointer-events-none absolute left-3 size-3.5 text-ops-text-tertiary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Filter ${EXPENSES.length} entries`}
                aria-label="Filter entries in this ledger"
                className="h-full w-full rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface pl-8 pr-3 text-body text-ops-text outline-none placeholder:text-ops-text-tertiary focus:border-ops-line-strong"
              />
            </label>

            <Select
              size="sm"
              label="Company"
              value={company}
              onChange={setCompany}
              className="w-[176px]"
              options={[
                { value: "all", label: "All companies" },
                ...COMPANIES.map((c) => ({ value: c.id, label: c.name })),
                { value: GLOBAL_COMPANY.id, label: GLOBAL_COMPANY.name },
              ]}
            />

            <Select
              size="sm"
              label="Category"
              value={category}
              onChange={setCategory}
              className="w-[168px]"
              options={[
                { value: "all", label: "All categories" },
                ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
              ]}
            />

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
                <IconClose className="size-3.5" />
                Clear
              </Button>
            )}

            {/* What narrows the ledger sits on the left; what states it is
              looking at sits on the right, the way the period switcher does
              in the top bar. A toolbar that runs out halfway across the card
              reads as an unfinished row. */}
            <div className="ml-auto flex items-center gap-3">
              {/* Only once a filter is on. Unfiltered it would be the third
              printing of "23 entries · $12,427" on one screen, after the
              page header and the table footer. */}
              {filtersOn && (
                <div className="flex items-center gap-2 text-ops-text-secondary">
                  <span>
                    <strong className="ops-num font-medium text-ops-text">{filtered.length}</strong> of{" "}
                    {EXPENSES.length}
                  </span>
                  <span className="text-ops-line-strong" aria-hidden>
                    ·
                  </span>
                  <Money value={filteredTotal} tone={false} className="font-medium text-ops-text" />
                </div>
              )}

              <Segmented
                label="Status"
                size="sm"
                value={status}
                onChange={setStatus}
                options={[
                  { id: "all" as StatusFilter, label: "All" },
                  { id: "outstanding" as StatusFilter, label: "Outstanding" },
                  { id: "settled" as StatusFilter, label: "Settled" },
                ]}
              />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Ledger                                                         */}
          {/* ------------------------------------------------------------- */}
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
              <table className="w-full min-w-[720px] border-collapse text-body">
                {/* Explicit widths. Left to itself the browser gives the long
                    description column whatever it wants and the money columns
                    drift by a few pixels between filter states, which reads as
                    the table twitching every time you type.

                    The widths step with the viewport because the money must
                    never be the thing that scrolls off a ledger. A 1024px
                    laptop with the rail open leaves about 744px for the table,
                    so the two weakest columns give way first: Category, which
                    is the same three words on eighteen of twenty-three rows
                    and still has its own filter above, and the driver's name,
                    whose portrait carries the identity on its own. */}
                <colgroup>
                  <col className="w-11" />
                  <col className="w-[150px] wide:w-[168px]" />
                  <col className="w-0 wide:w-[150px]" />
                  <col className="w-[52px] xl:w-[170px]" />
                  <col />
                  <col className="w-[104px] wide:w-[112px]" />
                  <col className="w-[124px]" />
                  <col className="w-[100px] wide:w-[120px]" />
                </colgroup>
                <thead className="ops-sticky-head">
                  <tr className="text-left">
                    <th className="border-b border-ops-line px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all entries"
                        className="size-3.5 accent-[var(--ops-accent)]"
                      />
                    </th>
                    <th className="ops-eyebrow border-b border-ops-line py-3 pr-3 font-normal">Company</th>
                    <th className="ops-eyebrow hidden border-b border-ops-line py-3 pr-3 font-normal wide:table-cell">
                      Category
                    </th>
                    <th className="ops-eyebrow border-b border-ops-line py-3 pr-3 font-normal">Driver</th>
                    <th className="ops-eyebrow border-b border-ops-line py-3 pr-3 font-normal">
                      Description
                    </th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-3 text-right font-normal">
                      Amount
                    </th>
                    <th className="ops-eyebrow whitespace-nowrap border-b border-ops-line px-3 py-3 text-right font-normal">
                      Running total
                    </th>
                    <th className="border-b border-ops-line px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
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
                                "h-12 border-b border-dashed border-ops-line transition-colors last:border-b-0",
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
                              <td className="pr-3 text-ops-text">
                                <CompanyTag id={e.companyId} name={companyName(e.companyId)} size={24} />
                              </td>
                              <td className="hidden pr-3 wide:table-cell">
                                <CategoryTag category={e.category} />
                              </td>
                              <td className="pr-3">
                                {driver ? (
                                  <span className="flex min-w-0 items-center gap-2">
                                    <Avatar
                                      id={driver.id}
                                      name={driver.name}
                                      initials={initialsOf(driver.name)}
                                    />
                                    {/* Below 1280 the portrait carries the identity on
                                        its own, and the name is what the money
                                        columns need back. */}
                                    <span className="hidden truncate text-ops-text-secondary xl:inline">
                                      {driver.name}
                                    </span>
                                  </span>
                                ) : (
                                  /* No driver is a real state, not missing data:
                                     rent, fuel and insurance are the firm's own
                                     bills. Saying so beats an em dash. */
                                  <span className="hidden text-ops-text-tertiary xl:inline">Company bill</span>
                                )}
                              </td>
                              <td className="truncate pr-3 text-ops-text-secondary">{e.description}</td>
                              <td className="px-3 text-right">
                                <Money value={e.amount} tone={false} className="font-medium text-ops-text" />
                              </td>
                              <td className="px-3 text-right">
                                <Money
                                  value={runningById.get(e.id) ?? 0}
                                  tone={false}
                                  className="text-ops-text-tertiary"
                                />
                              </td>
                              <td className="px-4 text-right">
                                {/* Every entry in the open period is outstanding,
                                    so a pill repeated 23 times would be ink
                                    without information — the header and the
                                    footer carry that. What differs per row is
                                    who clears it: five are bills you can pay
                                    from here, the rest clear when the driver is
                                    settled, which the face in the driver column
                                    already says. */}
                                {e.status !== "outstanding" ? (
                                  <StatusPill tone="ok">Settled</StatusPill>
                                ) : e.payable ? (
                                  <RowAction>Mark paid</RowAction>
                                ) : null}
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
                    <td colSpan={5} className="px-4 py-3 font-medium text-ops-text">
                      {filtersOn ? "Filtered total" : `${filtered.length} entries · ${PERIOD_NOTE}`}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Money value={filteredTotal} tone={false} className="font-medium text-ops-text" />
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-right text-ops-text-tertiary">
                      {money(outstanding)} still outstanding
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
            <span className="text-body text-ops-text-secondary">
              <strong className="ops-num font-medium text-ops-text">{selected.size}</strong> selected ·{" "}
              <Money value={selectedTotal} tone={false} className="font-medium text-ops-text" />
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

