"use client";

import * as React from "react";
import { Check, LayoutGrid, List, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  Money,
  SectionTitle,
  ShareBar,
  StatusPill,
} from "./primitives";
import { PageBody, PageHeader } from "./page-header";
import {
  COMPANIES,
  DRIVERS,
  DRIVERS_SETTLED,
  DRIVERS_UNSETTLED,
  DRIVER_CARRIED_TOTAL,
  DRIVER_OUTSTANDING_TOTAL,
  companyName,
  driversFor,
  isSettled,
  outstandingFor,
} from "@/lib/ops/data";
import type { Driver } from "@/lib/ops/types";
import { formatDate, initialsOf, money } from "@/lib/ops/format";

type Sort = "amount_desc" | "amount_asc" | "name" | "company";
type View = "cards" | "table";

const SORTS: Array<{ id: Sort; label: string }> = [
  { id: "amount_desc", label: "Outstanding (high to low)" },
  { id: "amount_asc", label: "Outstanding (low to high)" },
  { id: "name", label: "Name (A–Z)" },
  { id: "company", label: "Company" },
];

function sortDrivers(rows: Driver[], sort: Sort): Driver[] {
  const copy = [...rows];
  switch (sort) {
    case "amount_asc":
      return copy.sort((a, b) => outstandingFor(a) - outstandingFor(b));
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "company":
      return copy.sort(
        (a, b) => a.companyId.localeCompare(b.companyId) || outstandingFor(b) - outstandingFor(a),
      );
    default:
      return copy.sort((a, b) => outstandingFor(b) - outstandingFor(a));
  }
}

/**
 * A driver card.
 *
 * The outstanding balance is the headline, not the amount logged this period.
 * The live build leads with `logged` and prints outstanding underneath in
 * small type, which means the biggest number on the card is not the number
 * the Settle button acts on — and for four of the eighteen drivers the two
 * differ by hundreds of dollars.
 */
function DriverCard({ driver, max }: { driver: Driver; max: number }) {
  const outstanding = outstandingFor(driver);
  const settled = isSettled(driver);

  return (
    <div
      className={cn(
        "flex flex-col rounded-[var(--ops-r-card)] border bg-ops-surface p-4",
        settled ? "border-ops-line" : "border-ops-line hover:border-ops-line-strong",
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar initials={initialsOf(driver.name)} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-body font-medium text-ops-text">{driver.name}</div>
          <div className="truncate text-body text-ops-text-tertiary">{companyName(driver.companyId)}</div>
        </div>
        {settled && <StatusPill tone="ok">Settled</StatusPill>}
      </div>

      <div className="ops-figure mt-3 text-display font-medium leading-none text-ops-text">
        {money(outstanding)}
      </div>
      <div className="mt-1 text-body text-ops-text-tertiary">
        {settled ? `Paid ${driver.lastEntryAt ? formatDate(driver.lastEntryAt) : "this period"}` : "outstanding"}
      </div>

      {!settled && <ShareBar value={outstanding} max={max} className="mt-3" />}

      <dl className="mt-3 space-y-1 border-t border-ops-line pt-3 text-body">
        <div className="flex justify-between gap-2">
          <dt className="text-ops-text-tertiary">Logged this period</dt>
          <dd>
            <Money value={driver.logged} tone={false} className="font-medium text-ops-text-secondary" />
          </dd>
        </div>
        {driver.carried > 0 && (
          <div className="flex justify-between gap-2">
            <dt className="text-ops-text-tertiary">Carried from August</dt>
            <dd>
              <Money value={driver.carried} tone={false} className="font-medium text-ops-warn-fg" />
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-ops-text-tertiary">Entries</dt>
          {/* "5 entries / no entries logged" is a contradiction the live build
              prints on eight of the eighteen cards. A missing date is an em
              dash, never a denial that the entries exist. */}
          <dd className="text-ops-text-secondary">
            <span className="ops-num font-medium">{driver.entries}</span>
            {driver.lastEntryAt ? ` · last ${formatDate(driver.lastEntryAt)}` : " · no date recorded"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function DriversView() {
  const [sort, setSort] = React.useState<Sort>("amount_desc");
  const [view, setView] = React.useState<View>("cards");

  const grouped = COMPANIES.map((c) => ({
    company: c,
    drivers: sortDrivers(driversFor(c.id), sort),
  })).filter((g) => g.drivers.length > 0);

  const flat = sortDrivers(DRIVERS, sort);
  const max = Math.max(...DRIVERS.map(outstandingFor), 1);

  return (
    <>
      <PageHeader
        title="Drivers"
        detail={
          <>
            {DRIVERS_UNSETTLED} unsettled · {DRIVERS_SETTLED} settled ·{" "}
            <span className="font-medium text-ops-risk-fg">{money(DRIVER_OUTSTANDING_TOTAL)} outstanding</span>
          </>
        }
        actions={
          <>
            <Button variant="default">
              <Plus className="size-3.5" />
              Add driver
            </Button>
            <Button variant="default">Settle one driver</Button>
            <Button variant="primary">
              <Check className="size-3.5" />
              Settle all · {money(DRIVER_OUTSTANDING_TOTAL)}
            </Button>
          </>
        }
      />

      <PageBody className="flex flex-col gap-4">
        {/* ------------------------------------------------------------- */}
        {/* Payroll summary                                                */}
        {/* ------------------------------------------------------------- */}
        <Card className="flex flex-wrap items-center gap-x-8 gap-y-4 px-4 py-4">
          <div>
            <div className="text-body font-medium text-ops-text-secondary">Total outstanding</div>
            <div className="ops-figure mt-2 text-hero font-medium leading-none text-ops-text">
              {money(DRIVER_OUTSTANDING_TOTAL)}
            </div>
          </div>

          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {[
              { label: "Logged this period", value: DRIVER_OUTSTANDING_TOTAL - DRIVER_CARRIED_TOTAL },
              { label: "Carried from August", value: DRIVER_CARRIED_TOTAL },
            ].map((r) => (
              <div key={r.label}>
                <dt className="text-body text-ops-text-tertiary">{r.label}</dt>
                <dd className="mt-1">
                  <Money value={r.value} tone={false} className="text-figure font-medium text-ops-text" />
                </dd>
              </div>
            ))}
          </dl>

          <div className="min-w-[180px] max-w-[280px] flex-1">
            <div className="flex items-baseline justify-between text-body text-ops-text-tertiary">
              <span>Settled</span>
              <span className="ops-num">
                {DRIVERS_SETTLED} of {DRIVERS.length}
              </span>
            </div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-ops-active">
              <div className="bg-ops-ok-dot" style={{ width: `${(DRIVERS_SETTLED / DRIVERS.length) * 100}%` }} />
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* Controls                                                       */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-body text-ops-text-secondary">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-8 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-2 text-body font-medium text-ops-text outline-none hover:bg-ops-hover"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div role="radiogroup" aria-label="View" className="ml-auto flex h-8 items-center rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface p-1">
            {([
              ["cards", "Cards", LayoutGrid],
              ["table", "Table", List],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={view === id}
                onClick={() => setView(id)}
                className={cn(
                  "flex h-7 items-center gap-2 rounded-[6px] px-3 text-body font-medium transition-colors",
                  view === id ? "bg-ops-active text-ops-text" : "text-ops-text-secondary hover:text-ops-text",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Roster                                                         */}
        {/* ------------------------------------------------------------- */}
        {view === "cards" ? (
          <div className="flex flex-col gap-5">
            {grouped.map(({ company, drivers }) => {
              const total = drivers.reduce((n, d) => n + outstandingFor(d), 0);
              return (
                <section key={company.id}>
                  <div className="mb-2 flex items-baseline gap-2">
                    <h2 className="text-body font-medium text-ops-text">{company.name}</h2>
                    <span className="text-body text-ops-text-tertiary">
                      {drivers.length} {drivers.length === 1 ? "driver" : "drivers"}
                    </span>
                    <span className="ml-auto text-body">
                      <Money value={total} tone={false} className="font-medium text-ops-text" />
                      <span className="ml-1 text-ops-text-tertiary">outstanding</span>
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {drivers.map((d) => (
                      <DriverCard key={d.id} driver={d} max={max} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader>
              <SectionTitle title="Payroll" count={DRIVERS.length} hint="outstanding is logged plus carried, less settled" />
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-body">
                <thead className="ops-sticky-head">
                  <tr className="text-left">
                    <th className="ops-eyebrow border-b border-ops-line px-4 py-2 font-medium">Driver</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-2 font-medium">Company</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-medium">Entries</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-medium">Logged</th>
                    {/* The live build's table omits this column, so the row
                        reads 2,100 − 0 = 2,900 and appears to be broken. */}
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-medium">Carried</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-medium">Settled</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-medium">Outstanding</th>
                    <th className="ops-eyebrow border-b border-ops-line px-4 py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ops-line">
                  {flat.map((d) => (
                    <tr key={d.id} className="h-10 hover:bg-ops-hover">
                      <td className="px-4">
                        <span className="flex items-center gap-2">
                          <Avatar initials={initialsOf(d.name)} className="size-6 text-micro" />
                          <span className="font-medium text-ops-text">{d.name}</span>
                        </span>
                      </td>
                      <td className="px-3 text-body text-ops-text-secondary">{companyName(d.companyId)}</td>
                      <td className="ops-num px-3 text-right text-ops-text-secondary">{d.entries}</td>
                      <td className="px-3 text-right">
                        <Money value={d.logged} tone={false} className="text-ops-text-secondary" />
                      </td>
                      <td className="px-3 text-right">
                        {d.carried > 0 ? (
                          <Money value={d.carried} tone={false} className="text-ops-warn-fg" />
                        ) : (
                          <span className="text-ops-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="px-3 text-right">
                        {d.settled > 0 ? (
                          <Money value={d.settled} tone={false} className="text-ops-ok-fg" />
                        ) : (
                          <span className="text-ops-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="px-3 text-right">
                        <Money value={outstandingFor(d)} tone={false} className="font-medium text-ops-text" />
                      </td>
                      <td className="px-4 text-right">
                        <StatusPill tone={isSettled(d) ? "ok" : "idle"}>
                          {isSettled(d) ? "Settled" : "Unsettled"}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-ops-line-strong bg-ops-sunken text-body font-medium">
                    <td colSpan={3} className="px-4 py-3 text-ops-text">
                      {DRIVERS.length} drivers
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Money value={DRIVERS.reduce((n, d) => n + d.logged, 0)} tone={false} className="text-ops-text" />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Money value={DRIVER_CARRIED_TOTAL} tone={false} className="text-ops-text" />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Money value={DRIVERS.reduce((n, d) => n + d.settled, 0)} tone={false} className="text-ops-text" />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Money value={DRIVER_OUTSTANDING_TOTAL} tone={false} className="text-ops-text" />
                    </td>
                    <td className="px-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </PageBody>
    </>
  );
}
