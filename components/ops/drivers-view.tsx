"use client";

import * as React from "react";
import {
  IconCards,
  IconCheck,
  IconList,
  IconPlus,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  CompanyTag,
  Money,
  SectionTitle,
  Segmented,
  ShareBar,
  StatusPill,
} from "./primitives";
import { PageBody, PageHeader } from "./page-header";
import { Select } from "./select";
import { useOpsModal } from "./ops-modals";
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
  { id: "name", label: "Name (A-Z)" },
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
  const openModal = useOpsModal();
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
        <Avatar id={driver.id} name={driver.name} initials={initialsOf(driver.name)} />
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

      {/* The action sits on the driver it settles.
          It had been a "Settle one driver" button in the page header, which
          means picking a name out of a modal list to act on a card you are
          already looking at, and it left every card ending in a metadata
          row. `mt-auto` keeps the buttons on one line across the row. */}
      {!settled && (
        <div className="mt-auto pt-3">
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => openModal({ kind: "settle-driver", driverId: driver.id })}
          >
            <IconCheck className="size-3.5" />
            Settle {money(outstanding)}
          </Button>
        </div>
      )}
    </div>
  );
}

export function DriversView() {
  const openModal = useOpsModal();
  const [sort, setSort] = React.useState<Sort>("amount_desc");
  const [view, setView] = React.useState<View>("cards");

  const byCompany = COMPANIES.map((c) => {
    const ds = driversFor(c.id);
    return { company: c, count: ds.length, total: ds.reduce((n, d) => n + outstandingFor(d), 0) };
  }).filter((g) => g.count > 0);
  const maxCompany = Math.max(...byCompany.map((g) => g.total), 1);

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
              <IconPlus className="size-3.5" />
              Add driver
            </Button>
            <Button variant="primary" onClick={() => openModal({ kind: "settle-driver", all: true })}>
              <IconCheck className="size-3.5" />
              Settle all · {money(DRIVER_OUTSTANDING_TOTAL)}
            </Button>
          </>
        }
      />

      <PageBody className="flex flex-col gap-4">
        {/* ------------------------------------------------------------- */}
        {/* Payroll summary                                                */}
        {/* ------------------------------------------------------------- */}
        {/* ------------------------------------------------------------- */}
        {/* Payroll summary                                                */}
        {/*                                                                */}
        {/* The strip used to state three facts and leave the rest of a
            1130px card empty. The per-company split that the roster below
            was spending a header row on now lives here instead, where it
            reads as one comparison rather than four captions, and it is the
            reason the roster can drop its section headers and stop leaving
            three empty slots every time a company has one driver.          */}
        {/* ------------------------------------------------------------- */}
        <Card className="flex-row flex-wrap items-stretch">
          <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-4 px-4 py-4">
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
                <div
                  className="bg-ops-ok-dot"
                  style={{ width: `${(DRIVERS_SETTLED / DRIVERS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Who the payroll is owed on behalf of. Same four companies, same
              colours and monogram tiles they carry on every other screen. */}
          <div className="flex min-w-[300px] flex-1 flex-col justify-center gap-3 border-l border-dashed border-ops-line px-4 py-4">
            {byCompany.map(({ company, total, count }) => (
              <div key={company.id} className="flex items-center gap-3">
                <span className="w-[150px] shrink-0">
                  <CompanyTag id={company.id} name={company.name} size={24} />
                </span>
                <span className="shrink-0 text-body text-ops-text-tertiary">
                  {count} {count === 1 ? "driver" : "drivers"}
                </span>
                {/* A zero-length bar beside a $0 says nothing. A company
                    whose drivers are all paid has a state, not an amount. */}
                {total > 0 ? (
                  <>
                    {/* Only where there is room for a bar to mean anything. At
                        1024 the row left it about 12px wide, which reads as a
                        rendering fault rather than a share. */}
                    <ShareBar value={total} max={maxCompany} className="hidden h-1 min-w-[80px] flex-1 wide:block" />
                    <Money
                      value={total}
                      tone={false}
                      className="w-20 shrink-0 text-right text-body font-medium text-ops-text"
                    />
                  </>
                ) : (
                  <span className="flex flex-1 justify-end">
                    <StatusPill tone="ok">All settled</StatusPill>
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* Controls                                                       */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 text-body text-ops-text-secondary">
            Sort by
            <Select
              size="sm"
              label="Sort drivers by"
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              className="w-[212px]"
              options={SORTS.map((x) => ({ value: x.id, label: x.label }))}
            />
          </span>

          <Segmented
            label="View"
            size="sm"
            className="ml-auto"
            value={view}
            onChange={setView}
            options={[
              { id: "cards" as View, label: "Cards", icon: <IconCards className="size-3.5" size={14} /> },
              { id: "table" as View, label: "Table", icon: <IconList className="size-3.5" size={14} /> },
            ]}
          />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Roster                                                         */}
        {/* ------------------------------------------------------------- */}
        {view === "cards" ? (
          /* One grid, not four.
             Grouping by company put a full-width header before every section,
             so a company with a single driver printed one card and three empty
             slots — twice over, for Rona and Napa, which is a third of the
             page in white. Every card already names its own company and the
             split lives in the summary above, so the grid can simply run. */
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {flat.map((d) => (
              <DriverCard key={d.id} driver={d} max={max} />
            ))}
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
                    <th className="ops-eyebrow border-b border-ops-line px-4 py-3 font-normal">Driver</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-3 font-normal">Company</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-3 text-right font-normal">Entries</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-3 text-right font-normal">Logged</th>
                    {/* The live build's table omits this column, so the row
                        reads 2,100 − 0 = 2,900 and appears to be broken. */}
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-3 text-right font-normal">Carried</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-3 text-right font-normal">Settled</th>
                    <th className="ops-eyebrow border-b border-ops-line px-3 py-3 text-right font-normal">Outstanding</th>
                    {/* The action, not a status. Seventeen of eighteen rows
                        said "Unsettled", which the Outstanding column beside it
                        already says with a number. What differs per row is the
                        one that is done. */}
                    <th className="border-b border-ops-line px-4 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-ops-line">
                  {flat.map((d) => (
                    <tr key={d.id} className="h-11 hover:bg-ops-hover">
                      <td className="px-4">
                        <span className="flex items-center gap-2">
                          <Avatar id={d.id} name={d.name} initials={initialsOf(d.name)} />
                          <span className="font-medium text-ops-text">{d.name}</span>
                        </span>
                      </td>
                      <td className="px-3 text-ops-text-secondary">
                        <CompanyTag id={d.companyId} name={companyName(d.companyId)} size={24} />
                      </td>
                      <td className="ops-num px-3 text-right text-ops-text-secondary">{d.entries}</td>
                      <td className="px-3 text-right">
                        <Money value={d.logged} tone={false} className="text-ops-text-secondary" />
                      </td>
                      <td className="px-3 text-right">
                        {d.carried > 0 ? (
                          <Money value={d.carried} tone={false} className="text-ops-warn-fg" />
                        ) : (
                          <span className="text-ops-text-tertiary">None</span>
                        )}
                      </td>
                      <td className="px-3 text-right">
                        {d.settled > 0 ? (
                          <Money value={d.settled} tone={false} className="text-ops-ok-fg" />
                        ) : (
                          <span className="text-ops-text-tertiary">Not yet</span>
                        )}
                      </td>
                      <td className="px-3 text-right">
                        <Money value={outstandingFor(d)} tone={false} className="font-medium text-ops-text" />
                      </td>
                      <td className="px-4 text-right">
                        {isSettled(d) ? (
                          <StatusPill tone="ok">Settled</StatusPill>
                        ) : (
                          /* Quiet, not accent. Seventeen orange chips down one
                             column would make the ledger itself unreadable,
                             and settling is the routine job here, not the
                             exception. */
                          <Button
                            variant="quiet"
                            size="sm"
                            onClick={() => openModal({ kind: "settle-driver", driverId: d.id })}
                          >
                            <IconCheck className="size-3.5" />
                            Settle
                          </Button>
                        )}
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
