"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ListChecks,
  Building2,
  CalendarRange,
  Check,
  Download,
  Plus,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  DeltaChip,
  DottedMeter,
  Money,
  RowAction,
  SectionTitle,
  StatusPill,
  TONE_DOT,
} from "./primitives";
import { PageBody, PageHeader } from "./page-header";
import {
  ACTIVITY,
  CASH_NET,
  CASH_PAID_OUT,
  CASH_RECEIVED,
  CLOSED_PERIODS,
  COMPANIES,
  COMPANIES_WITH_ACTIVITY,
  DAILY_AVERAGE,
  DAY_OF_PERIOD,
  DRAFT_REVENUE,
  DRAFT_REVENUE_TOTAL,
  DRIVERS,
  DRIVERS_UNSETTLED,
  DRIVER_CARRIED_TOTAL,
  DRIVER_OUTSTANDING_TOTAL,
  EXPENSES,
  EXPENSE_TOTAL,
  HEADLINE_DELTA,
  NOW,
  PACING,
  PARTNERS,
  PENDING_ACTIONS,
  PERIOD,
  PERIODS,
  PERIOD_DAYS,
  REVENUE_TOTAL,
  SINCE_LAST_VISIT,
  driversFor,
  expensesByCompany,
  shareOf,
} from "@/lib/ops/data";
import { daysAgo, formatDate, formatTime, initialsOf, money, relativeTime } from "@/lib/ops/format";

/* -------------------------------------------------------------------------- */
/* Headline figures                                                            */
/* -------------------------------------------------------------------------- */

/**
 * A headline figure.
 *
 * Label and change on the first line, the figure on the second, one line of
 * explanation on the third. Nothing else — no icon, no footer band, no
 * sparkline. The figure is set in the mono, which is what makes the row read
 * as a ledger rather than a template: numerals share a rhythm across all
 * four cards and the eye can compare them without effort.
 */
function Figure({
  label,
  basis,
  value,
  delta,
  good,
  note,
  tone = "neutral",
  href,
}: {
  label: string;
  basis: string;
  value: number;
  delta: { pct: number; dir: "up" | "down" | "flat" };
  /** Whether the delta direction is good news for this figure. */
  good: boolean;
  note: React.ReactNode;
  tone?: "neutral" | "risk";
  href: string;
}) {
  return (
    <Link
      href={href}
      className="ops-card flex min-w-0 flex-col px-4 pb-3.5 pt-3 transition-colors hover:border-ops-line-strong"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="ops-num truncate text-[11.5px] text-ops-text-secondary">
          {label} <span className="text-ops-text-tertiary">· {basis}</span>
        </span>
        <DeltaChip pct={delta.pct} dir={delta.dir} good={good} caption="" />
      </div>
      <div
        className={cn(
          "ops-figure mt-2 text-[26px] font-medium leading-none",
          tone === "risk" ? "text-ops-risk-fg" : "text-ops-text",
        )}
      >
        {money(value)}
      </div>
      <p className="mt-2 text-[11px] leading-[1.45] text-ops-text-tertiary">{note}</p>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Needs you                                                                   */
/* -------------------------------------------------------------------------- */

function PendingActions() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-ops-sunken">
        <SectionTitle
          icon={ListChecks}
          title="Actions pending"
          count={PENDING_ACTIONS.length}
          hint={`largest first · before ${PERIOD.label} can close`}
        />
      </CardHeader>
      <ul className="divide-y divide-ops-line">
        {PENDING_ACTIONS.map((a) => (
          <li key={a.id} className="flex h-11 items-center gap-3 px-4">
            <span className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[a.tone])} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[13px] text-ops-text">{a.label}</span>
            {a.amount !== null && (
              <Money value={a.amount} tone={false} className="shrink-0 text-[13px] font-medium text-ops-text" />
            )}
            <Link
              href={a.href}
              className="inline-flex h-6 w-[74px] shrink-0 items-center justify-center gap-1 rounded-md border border-ops-line bg-ops-surface text-[11px] font-medium text-ops-text transition-colors hover:border-ops-accent hover:text-ops-accent"
            >
              {a.action}
              <ArrowRight className="size-3" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Companies                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Who owes us, as a ledger rather than a stack of rows with progress bars.
 *
 * The columns are the ones an owner chasing money reads across: how long since
 * they last paid, on what cycle, how much we are carrying. Six companies at
 * 36px is a block you can take in at once; the same six as cards with bars was
 * 440px of mostly air.
 */
function Companies() {
  const rows = expensesByCompany().map(({ company, total }) => {
    const drivers = driversFor(company.id).length;
    const overdue = company.expectation.toLowerCase().includes("overdue");
    /* Dormant means not trading — no spend and nobody on the roster. Staples
       last paid in August but has booked nothing since and has no drivers, so
       "On cycle" would imply a relationship that is not running. */
    const dormant = total === 0 && drivers === 0;
    return {
      company,
      total,
      drivers,
      status: dormant
        ? ({ tone: "idle", label: "No activity" } as const)
        : company.lastPaymentAt === null
          ? ({ tone: "risk", label: "Never paid" } as const)
          : overdue
            ? ({ tone: "warn", label: "Overdue" } as const)
            : ({ tone: "ok", label: "On cycle" } as const),
    };
  });

  const neverPaid = rows.filter((r) => r.status.label === "Never paid").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <SectionTitle
          icon={Building2}
          title="Companies"
          hint={`${COMPANIES.length} clients · ${COMPANIES_WITH_ACTIVITY} active · ${money(EXPENSE_TOTAL)} total spend · ${neverPaid} never paid`}
          action={
            <Link
              href="/ops/clients"
              className="flex items-center gap-1 text-[12px] font-semibold text-ops-accent hover:underline"
            >
              All clients <ArrowRight className="size-3" />
            </Link>
          }
        />
      </CardHeader>

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-ops-line text-left">
            <th className="ops-eyebrow px-4 py-2 font-semibold">Company</th>
            <th className="ops-eyebrow px-3 py-2 font-semibold">Last paid</th>
            <th className="ops-eyebrow px-3 py-2 text-right font-semibold">Drivers</th>
            <th className="ops-eyebrow px-3 py-2 text-right font-semibold">This period</th>
            <th className="ops-eyebrow px-4 py-2 text-right font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ops-line">
          {rows.map(({ company, total, drivers, status }) => (
            <tr key={company.id} className="h-9 hover:bg-ops-hover">
              <td className="px-4">
                <Link
                  href={`/ops/clients?company=${company.id}`}
                  className="font-medium text-ops-text hover:text-ops-accent"
                >
                  {company.name}
                </Link>
              </td>
              <td className="px-3 text-[12px] text-ops-text-secondary">
                {company.lastPaymentAt ? (
                  <>
                    {formatDate(company.lastPaymentAt)}
                    <span className="ml-1.5 text-ops-text-tertiary">{daysAgo(company.lastPaymentAt)}</span>
                  </>
                ) : (
                  <span className="text-ops-text-tertiary">—</span>
                )}
              </td>
              <td className="ops-num px-3 text-right text-[12px] text-ops-text-secondary">
                {drivers || <span className="text-ops-text-tertiary">—</span>}
              </td>
              <td className="px-3 text-right">
                {total > 0 ? (
                  <Money value={total} tone={false} className="font-semibold text-ops-text" />
                ) : (
                  <span className="text-ops-text-tertiary">{money(0)}</span>
                )}
              </td>
              <td className="px-4 text-right">
                <span className="inline-flex items-center gap-1.5">
                  <StatusPill tone={status.tone} dot={status.tone !== "idle"}>
                    {status.label}
                  </StatusPill>
                  {status.tone === "risk" && <RowAction>Record</RowAction>}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ops-line-strong bg-ops-sunken text-[13px] font-semibold">
            <td colSpan={2} className="px-4 py-2.5 text-ops-text">
              {COMPANIES.length} companies
            </td>
            <td className="ops-num px-3 py-2.5 text-right text-ops-text">{DRIVERS.length}</td>
            <td className="px-3 py-2.5 text-right">
              <Money value={EXPENSE_TOTAL} tone={false} className="text-ops-text" />
            </td>
            <td className="px-4" />
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Rail cards                                                                  */
/* -------------------------------------------------------------------------- */

function DriverSettlement() {
  const lastSettled = ACTIVITY.find((a) => a.tone === "ok");

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <SectionTitle
          icon={Users}
          title="Driver settlement"
          action={
            <Link
              href="/ops/drivers"
              className="flex items-center gap-1 text-[12px] font-semibold text-ops-accent hover:underline"
            >
              Settle <ArrowRight className="size-3" />
            </Link>
          }
        />
      </CardHeader>

      <div className="px-4 pb-3 pt-3.5">
        <div className="flex items-end justify-between gap-3">
          <div className="ops-figure text-[27px] font-semibold leading-none text-ops-text">
            {money(DRIVER_OUTSTANDING_TOTAL)}
          </div>
          <div className="text-[11px] text-ops-text-tertiary">
            <span className="ops-num font-semibold text-ops-text">{DRIVERS_UNSETTLED}</span> of{" "}
            <span className="ops-num">{DRIVERS.length}</span> unpaid
          </div>
        </div>

        {/* One segment per driver: eighteen units, seventeen still owed. */}
        <DottedMeter className="mt-3" value={DRIVERS_UNSETTLED} max={DRIVERS.length} segments={DRIVERS.length} tone="risk" />
      </div>

      <dl className="divide-y divide-ops-line border-t border-ops-line text-[12px]">
        {[
          { label: "Logged this period", value: money(DRIVER_OUTSTANDING_TOTAL - DRIVER_CARRIED_TOTAL) },
          { label: "Carried from August", value: money(DRIVER_CARRIED_TOTAL) },
          {
            label: "Last settled",
            value: lastSettled ? `${formatDate(lastSettled.at)} · ${money(lastSettled.amount ?? 0)}` : "—",
            quiet: true,
          },
        ].map((r) => (
          <div key={r.label} className="flex h-8 items-center justify-between gap-3 px-4">
            <dt className="text-ops-text-secondary">{r.label}</dt>
            <dd className={cn("ops-num font-medium", r.quiet ? "text-ops-text-tertiary" : "text-ops-text")}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function LoggedThisPeriod() {
  const rows = expensesByCompany();
  const drivers = new Set(EXPENSES.map((e) => e.driverId).filter(Boolean)).size;

  /* Two deliberate rows: the counts, then coverage. Letting the chips wrap
     off the end of the first row left a ragged second line that read as an
     overflow rather than a design. */
  return (
    <Card className="divide-y divide-ops-line">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-2.5">
        <span className="ops-num text-[11.5px] text-ops-text-secondary">
          Logged this period <span className="text-ops-text-tertiary">· through {formatDate(NOW)}</span>
        </span>
        {[
          { label: "entries", value: String(EXPENSES.length) },
          { label: "value", value: money(EXPENSE_TOTAL) },
          { label: "drivers with entries", value: String(drivers) },
          { label: "companies trading", value: `${COMPANIES_WITH_ACTIVITY} of ${COMPANIES.length}` },
        ].map((s) => (
          <span key={s.label} className="flex items-baseline gap-1.5">
            <span className="ops-num text-[14px] font-medium text-ops-text">{s.value}</span>
            <span className="ops-num text-[11px] text-ops-text-tertiary">{s.label}</span>
          </span>
        ))}
        <Link href="/ops/expenses" className="ml-auto flex items-center gap-1 text-[12px] font-medium text-ops-accent hover:underline">
          Ledger <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2">
        <span className="ops-num mr-1 text-[11px] text-ops-text-tertiary">Coverage</span>
        {rows.map(({ company, total }) => (
          <span
            key={company.id}
            className={cn(
              "inline-flex items-center gap-1 rounded-[5px] px-1.5 py-[2px] text-[10.5px] font-medium",
              total > 0 ? "bg-ops-ok-bg text-ops-ok-fg" : "bg-ops-idle-bg text-ops-idle-fg",
            )}
          >
            {total > 0 ? <Check className="size-3" /> : <X className="size-3" />}
            {company.name}
          </span>
        ))}
      </div>
    </Card>
  );
}

function PartnerSplit() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <SectionTitle
          icon={Wallet}
          title="Partner split"
          hint="cash basis"
          action={
            <Link
              href="/ops/financials?tab=withdrawals"
              className="flex items-center gap-1 text-[12px] font-semibold text-ops-accent hover:underline"
            >
              Withdrawals <ArrowRight className="size-3" />
            </Link>
          }
        />
      </CardHeader>

      <dl className="divide-y divide-ops-line text-[13px]">
        {PARTNERS.map((p) => (
          <div key={p.id} className="flex h-10 items-center gap-2 px-4">
            <Avatar initials={initialsOf(p.name)} className="size-5 text-[9px]" />
            <dt className="flex-1 text-ops-text">
              {p.name}
              <span className="ml-1.5 text-[11px] text-ops-text-tertiary">
                {Math.round(p.share * 100)}%
              </span>
            </dt>
            <dd>
              <Money value={shareOf(p, CASH_NET)} className="font-semibold" />
            </dd>
          </div>
        ))}
        {[
          { label: "Received", value: CASH_RECEIVED },
          { label: "Paid out", value: -CASH_PAID_OUT },
        ].map((r) => (
          <div key={r.label} className="flex h-8 items-center justify-between gap-3 px-4 text-[12px]">
            <dt className="text-ops-text-secondary">{r.label}</dt>
            <dd>
              <Money value={r.value} className="font-medium" />
            </dd>
          </div>
        ))}
        <div className="flex h-9 items-center justify-between gap-3 bg-ops-sunken px-4 text-[12px]">
          <dt className="font-semibold text-ops-text">Net</dt>
          <dd>
            <Money value={CASH_NET} className="text-[13px] font-semibold" />
          </dd>
        </div>
      </dl>
    </Card>
  );
}

function RecentActivity() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <SectionTitle icon={Activity} title="Recent activity" />
      </CardHeader>
      <ol className="divide-y divide-ops-line">
        {ACTIVITY.map((ev) => (
          <li key={ev.id} className="flex items-center gap-2.5 px-4 py-2">
            <span className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[ev.tone])} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] text-ops-text">
                <strong className="font-semibold">{ev.actor}</strong> {ev.summary}
              </span>
              <span className="block text-[11px] text-ops-text-tertiary">{relativeTime(ev.at)}</span>
            </span>
            {ev.amount !== null && (
              <Money value={ev.amount} tone={false} className="shrink-0 text-[12px] font-medium text-ops-text" />
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function MonthByMonth() {
  const augGap =
    CLOSED_PERIODS[1].revenue - CLOSED_PERIODS[1].expenses - CLOSED_PERIODS[1].distributed;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <SectionTitle icon={CalendarRange} title="Monthly comparison" hint="last three periods" />
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="border-b border-ops-line text-left">
              <th className="ops-eyebrow px-4 py-2 font-semibold">Period</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-semibold">Revenue</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-semibold">Expenses</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-semibold">Distributed</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-semibold">Syed 35%</th>
              <th className="ops-eyebrow px-4 py-2 text-right font-semibold">Kiani 65%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-line">
            {PERIODS.map((p) => (
              <tr key={p.key} className="h-9 hover:bg-ops-hover">
                <td className="px-4">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ops-text">{p.label}</span>
                    {p.locked ? (
                      <StatusPill tone="idle" dot={false}>
                        Closed
                      </StatusPill>
                    ) : (
                      <StatusPill tone="warn">Open</StatusPill>
                    )}
                  </span>
                </td>
                <td className="px-3 text-right">
                  <Money value={p.revenue} tone={false} className="text-ops-text-secondary" />
                </td>
                <td className="px-3 text-right">
                  <Money value={p.expenses} tone={false} className="text-ops-text-secondary" />
                </td>
                <td className="px-3 text-right">
                  <span className="inline-flex items-baseline gap-1.5">
                    <Money value={p.distributed} className="font-semibold" />
                    <span
                      className="text-[10px] uppercase tracking-wide text-ops-text-tertiary"
                      title={
                        p.basis === "cash"
                          ? "Cash basis: what actually left the bank. Unpaid obligations are not in this figure."
                          : "Accrual basis: revenue less expenses incurred."
                      }
                    >
                      {p.basis}
                    </span>
                  </span>
                </td>
                <td className="px-3 text-right">
                  <Money value={shareOf(PARTNERS[0], p.distributed)} />
                </td>
                <td className="px-4 text-right">
                  <Money value={shareOf(PARTNERS[1], p.distributed)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* The basis changes between rows, so it is stated rather than left for
          the reader to discover by subtracting. */}
      <p className="border-t border-ops-line bg-ops-sunken px-4 py-2 text-[11px] leading-[1.5] text-ops-text-tertiary">
        Distributed is what the partners split. For a period that closed with bills unpaid it is not revenue
        less expenses — {CLOSED_PERIODS[1].label} carried {money(augGap)} of expense into September.
      </p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

export function HomeView() {
  const [banner, setBanner] = React.useState(true);

  return (
    <>
      <PageHeader
        title="Business overview"
        detail={`${PERIOD.long} · day ${DAY_OF_PERIOD} of ${PERIOD_DAYS}`}
        actions={
          <>
            <Button variant="default">
              <Download className="size-3.5" />
              Export
            </Button>
            <Button variant="primary">
              <Plus className="size-3.5" />
              Log expense
            </Button>
          </>
        }
      />

      <PageBody className="flex flex-col gap-3">
        {banner && (
          <div className="flex items-center gap-3 rounded-[var(--ops-r-card)] border border-ops-move-line bg-ops-move-bg px-4 py-2">
            <span className="size-1.5 shrink-0 rounded-full bg-ops-move-dot" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-[12px] text-ops-move-fg">
              <strong className="font-semibold">{SINCE_LAST_VISIT.entries} new entries</strong> since{" "}
              {formatDate(SINCE_LAST_VISIT.since)}, {formatTime(SINCE_LAST_VISIT.since)} ·{" "}
              {money(SINCE_LAST_VISIT.amount)} total
            </p>
            <Link href="/ops/expenses" className="shrink-0 text-[12px] font-semibold text-ops-move-fg hover:underline">
              View
            </Link>
            <button
              type="button"
              onClick={() => setBanner(false)}
              aria-label="Dismiss"
              className="grid size-5 shrink-0 place-items-center rounded text-ops-move-fg/70 hover:bg-ops-move-line hover:text-ops-move-fg"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Row 1 — the four headline figures */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Figure
            label="Cash position"
            basis="cash basis"
            value={CASH_NET}
            delta={HEADLINE_DELTA.cash}
            good={HEADLINE_DELTA.cash.dir === "up"}
            tone="risk"
            href="/ops/financials"
            note={`${money(DRAFT_REVENUE_TOTAL)} sits in ${DRAFT_REVENUE.length} draft payments and has not reached the bank.`}
          />
          <Figure
            label="Revenue"
            basis="finalized"
            value={REVENUE_TOTAL}
            delta={HEADLINE_DELTA.revenue}
            good={HEADLINE_DELTA.revenue.dir === "up"}
            href="/ops/financials?tab=revenue"
            note={
              <>
                Nothing finalized this period ·{" "}
                <span className="font-medium text-ops-warn-fg">{money(DRAFT_REVENUE_TOTAL)} in draft</span>.
              </>
            }
          />
          <Figure
            label="Total expenses"
            basis="incurred"
            value={EXPENSE_TOTAL}
            delta={HEADLINE_DELTA.expenses}
            good={HEADLINE_DELTA.expenses.dir === "down"}
            href="/ops/expenses"
            note={`${EXPENSES.length} entries · ${money(DAILY_AVERAGE)} a day · on pace for ${money(PACING)}.`}
          />
          <Figure
            label="Net profit"
            basis="cash basis"
            value={CASH_NET}
            delta={HEADLINE_DELTA.profit}
            good={HEADLINE_DELTA.profit.dir === "up"}
            tone="risk"
            href="/ops/financials"
            note={`Only ${money(CASH_PAID_OUT)} has actually left the bank. ${money(EXPENSE_TOTAL)} was incurred; the rest is owed, not paid.`}
          />
        </div>

        {/* Row 1b — a slim strip of what has been booked so far */}
        <LoggedThisPeriod />

        {/*
          Row 2 — one wide card and two narrow ones, the shape of the
          reference. The three are built to the same height: five action
          rows, a figure plus three key/value rows, two partners plus three
          key/value rows. No card is padded out to meet another.
        */}
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <PendingActions />
          <DriverSettlement />
          <PartnerSplit />
        </div>

        {/* Row 3 — the full-width ledger */}
        <Companies />

        {/* Row 4 */}
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <MonthByMonth />
          <RecentActivity />
        </div>
      </PageBody>
    </>
  );
}
