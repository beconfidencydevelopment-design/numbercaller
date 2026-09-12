"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Download, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  Money,
  RowAction,
  SectionTitle,
  ShareBar,
  Sparkline,
  StatusPill,
  TONE_DOT,
} from "./primitives";
import { PageBody, PageHeader } from "./page-header";
import {
  ACTIVITY,
  CASH_NET,
  CASH_PAID_OUT,
  CASH_RECEIVED,
  CASH_SERIES,
  CLOSED_PERIODS,
  COMPANIES,
  COMPANIES_WITH_ACTIVITY,
  DAILY_AVERAGE,
  DAY_OF_PERIOD,
  DRAFT_REVENUE,
  DRAFT_REVENUE_TOTAL,
  DRIVERS,
  DRIVERS_SETTLED,
  DRIVERS_UNSETTLED,
  DRIVER_CARRIED_TOTAL,
  DRIVER_OUTSTANDING_TOTAL,
  EXPENSES,
  EXPENSE_SERIES,
  EXPENSE_TOTAL,
  NOW,
  PACING,
  PARTNERS,
  PENDING_ACTIONS,
  PERIOD,
  PERIODS,
  PERIOD_DAYS,
  REVENUE_SERIES,
  REVENUE_TOTAL,
  SINCE_LAST_VISIT,
  expensesByCompany,
  shareOf,
} from "@/lib/ops/data";
import {
  formatDate,
  formatTime,
  initialsOf,
  money,
  relativeTime,
} from "@/lib/ops/format";

/* -------------------------------------------------------------------------- */
/* Headline figures                                                            */
/* -------------------------------------------------------------------------- */

/**
 * A money tile.
 *
 * The label says which basis the figure is on, because this product carries
 * both and the difference is the whole reason the books look wrong at a
 * glance. `note` is the one line of context that makes the number actionable
 * — never a bare percentage against a month nobody can see.
 */
function Figure({
  label,
  basis,
  value,
  note,
  series,
  tone = "neutral",
  focal,
  href,
}: {
  label: string;
  basis?: string;
  value: number;
  note?: React.ReactNode;
  series?: number[];
  tone?: "neutral" | "risk" | "ok";
  focal?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-[12px] font-medium", focal ? "text-ops-focal-muted" : "text-ops-text-secondary")}>
          {label}
        </span>
        {basis && (
          <span className={cn("text-[11px]", focal ? "text-ops-focal-muted/70" : "text-ops-text-tertiary")}>
            {basis}
          </span>
        )}
      </div>

      <div
        className={cn(
          "ops-figure mt-2 text-[30px] font-semibold leading-none",
          focal
            ? "text-ops-focal-fg"
            : tone === "risk"
              ? "text-ops-risk-fg"
              : tone === "ok"
                ? "text-ops-ok-fg"
                : "text-ops-text",
        )}
      >
        {money(value)}
      </div>

      {series && (
        <Sparkline
          className="mt-3 h-7"
          values={series}
          stroke={focal ? "var(--ops-accent)" : tone === "risk" ? "var(--ops-series-neg)" : "var(--ops-series-a)"}
          fill={focal ? "var(--ops-accent)" : tone === "risk" ? "var(--ops-series-neg)" : "var(--ops-series-a)"}
        />
      )}

      {note && (
        <div
          className={cn(
            "mt-2 text-[11px] leading-4",
            focal ? "text-ops-focal-muted" : "text-ops-text-tertiary",
          )}
        >
          {note}
        </div>
      )}
    </>
  );

  const shell = cn(
    "flex min-w-0 flex-col rounded-[var(--ops-r-card)] border p-4 text-left transition-colors",
    focal ? "border-ops-focal-line bg-ops-focal-bg" : "border-ops-line bg-ops-surface hover:border-ops-line-strong",
  );

  return href ? (
    <Link href={href} className={shell}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pending work                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The action list, ranked by money at stake rather than by the order the
 * items happen to be declared. An owner opening this at 8am should be able to
 * work top to bottom.
 */
function PendingActions() {
  return (
    <Card className="overflow-hidden border-ops-focal-line bg-ops-focal-bg">
      <div className="flex items-center gap-2 border-b border-ops-focal-line px-4 py-2.5">
        <h2 className="text-[14px] font-semibold text-ops-focal-fg">Needs you</h2>
        <span className="ops-num rounded-md bg-white/10 px-1.5 py-px text-[11px] font-semibold text-ops-focal-fg">
          {PENDING_ACTIONS.length}
        </span>
        <span className="ml-auto text-[11px] text-ops-focal-muted">Largest first · before {PERIOD.label} can close</span>
      </div>
      <ul className="divide-y divide-ops-focal-line">
        {PENDING_ACTIONS.map((a) => (
          <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[a.tone])} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[13px] text-ops-focal-fg">{a.label}</span>
            {a.amount !== null && (
              <span className="ops-num shrink-0 text-[13px] font-semibold text-ops-focal-fg">
                {money(a.amount)}
              </span>
            )}
            <Link
              href={a.href}
              className="inline-flex h-6 w-[74px] shrink-0 items-center justify-center gap-1 rounded-md border border-white/15 bg-white/5 text-[11px] font-semibold text-ops-focal-fg transition-colors hover:bg-white/15"
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

/**
 * What has been booked into the period so far.
 *
 * The live build titles this "Today's logging" and dates it Sep 4, then fills
 * it with period-to-date figures — 23 entries, 18 drivers, 4 of 6 companies —
 * none of which are today's. RECONCILED: the title now matches the numbers,
 * and the total is the period total the Expenses page also shows, so the two
 * screens cannot disagree.
 */
function LoggedThisPeriod() {
  const rows = expensesByCompany();
  const drivers = new Set(EXPENSES.map((e) => e.driverId).filter(Boolean)).size;

  return (
    <Card>
      <CardHeader>
        <SectionTitle
          title="Logged this period"
          hint={`through ${formatDate(NOW)}`}
          action={
            <Link
              href="/ops/expenses"
              className="flex items-center gap-1 text-[12px] font-semibold text-ops-accent hover:underline"
            >
              Open ledger <ArrowRight className="size-3" />
            </Link>
          }
        />
      </CardHeader>

      <dl className="grid grid-cols-2 divide-x divide-y divide-ops-line sm:grid-cols-4 sm:divide-y-0">
        {[
          { label: "Entries", value: String(EXPENSES.length) },
          { label: "Value", value: money(EXPENSE_TOTAL) },
          { label: "Drivers with entries", value: String(drivers) },
          { label: "Companies", value: `${COMPANIES_WITH_ACTIVITY} of ${COMPANIES.length}` },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3">
            <dt className="text-[11px] text-ops-text-tertiary">{s.label}</dt>
            <dd className="ops-figure mt-1 text-[18px] font-semibold leading-none text-ops-text">{s.value}</dd>
          </div>
        ))}
      </dl>

      {/* Coverage. Two companies with no entries is either a quiet month or a
          missed invoice, and it is the check that stops a period closing
          short. */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-ops-line px-4 py-2.5">
        <span className="mr-1 text-[11px] text-ops-text-tertiary">Coverage</span>
        {rows.map(({ company, total }) => (
          <span
            key={company.id}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-medium ring-1 ring-inset",
              total > 0
                ? "bg-ops-ok-bg text-ops-ok-fg ring-ops-ok-line"
                : "bg-ops-idle-bg text-ops-idle-fg ring-ops-idle-line",
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

/* -------------------------------------------------------------------------- */

export function HomeView() {
  const [banner, setBanner] = React.useState(true);
  const companies = expensesByCompany();
  const maxCompanySpend = Math.max(...companies.map((c) => c.total), 1);
  /**
   * A dormant company that has never been invoiced is not "never paid" — it
   * is simply not trading. Counting Canpar alongside Precision turns the one
   * genuine receivable problem in the book into a pair of them.
   */
  const neverPaid = companies.filter((c) => c.company.lastPaymentAt === null && c.total > 0);
  const lastSettled = ACTIVITY.find((a) => a.tone === "ok");

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

      <PageBody className="flex flex-col gap-4">
        {banner && (
          <div className="flex items-center gap-3 rounded-[var(--ops-r-card)] border border-ops-move-line bg-ops-move-bg px-4 py-2.5">
            <span className="size-1.5 shrink-0 rounded-full bg-ops-move-dot" aria-hidden />
            <p className="min-w-0 flex-1 text-[12px] text-ops-move-fg">
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
              className="grid size-5 shrink-0 place-items-center rounded text-ops-move-fg/70 hover:bg-black/5 hover:text-ops-move-fg"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Headline row                                                   */}
        {/* ------------------------------------------------------------- */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Figure
            label="Cash position"
            basis="cash basis"
            value={CASH_NET}
            tone="risk"
            focal
            series={CASH_SERIES}
            note={
              DRAFT_REVENUE.length > 0 ? (
                <>
                  {money(DRAFT_REVENUE_TOTAL)} sits in {DRAFT_REVENUE.length} draft payments and has not
                  reached the bank
                </>
              ) : undefined
            }
            href="/ops/financials"
          />
          <Figure
            label="Revenue"
            basis="finalized"
            value={REVENUE_TOTAL}
            series={REVENUE_SERIES}
            note={
              <>
                Nothing finalized this period ·{" "}
                <span className="font-medium text-ops-warn-fg">{money(DRAFT_REVENUE_TOTAL)} in draft</span>
              </>
            }
            href="/ops/financials"
          />
          <Figure
            label="Expenses"
            basis="incurred"
            value={EXPENSE_TOTAL}
            series={EXPENSE_SERIES}
            note={`${EXPENSES.length} entries · ${money(DAILY_AVERAGE)}/day · pacing ${money(PACING)}`}
            href="/ops/expenses"
          />
          <Figure
            label="Net profit"
            basis="cash basis"
            value={CASH_NET}
            tone="risk"
            series={CASH_SERIES}
            note={
              <>
                Only {money(CASH_PAID_OUT)} has actually left the bank. {money(EXPENSE_TOTAL)} was
                incurred; the rest is owed, not paid.
              </>
            }
            href="/ops/financials"
          />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Pending + settlement                                           */}
        {/* ------------------------------------------------------------- */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <PendingActions />
            <LoggedThisPeriod />
          </div>

          <Card>
            <CardHeader>
              <SectionTitle
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
            <div className="px-4 py-3.5">
              <div className="ops-figure text-[30px] font-semibold leading-none text-ops-text">
                {money(DRIVER_OUTSTANDING_TOTAL)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ops-text-secondary">
                <span>
                  <strong className="ops-num font-semibold text-ops-text">{DRIVERS_UNSETTLED}</strong> unsettled
                </span>
                <span className="text-ops-line-strong" aria-hidden>
                  ·
                </span>
                <span>
                  <strong className="ops-num font-semibold text-ops-text">{DRIVERS_SETTLED}</strong> settled
                </span>
              </div>

              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-ops-active">
                <div
                  className="bg-ops-risk-dot"
                  style={{ width: `${(DRIVERS_UNSETTLED / DRIVERS.length) * 100}%` }}
                />
                <div className="flex-1 bg-ops-ok-dot" />
              </div>

              <dl className="mt-3.5 space-y-1.5 border-t border-ops-line pt-3 text-[12px]">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ops-text-secondary">Logged this period</dt>
                  <dd>
                    <Money value={DRIVER_OUTSTANDING_TOTAL - DRIVER_CARRIED_TOTAL} tone={false} className="font-medium text-ops-text" />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ops-text-secondary">Carried from August</dt>
                  <dd>
                    <Money value={DRIVER_CARRIED_TOTAL} tone={false} className="font-medium text-ops-text" />
                  </dd>
                </div>
                {lastSettled && (
                  <div className="flex items-baseline justify-between gap-3 text-ops-text-tertiary">
                    <dt>Last settled</dt>
                    <dd>
                      {formatDate(lastSettled.at)} · {money(lastSettled.amount ?? 0)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </Card>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Companies + partner split                                      */}
        {/* ------------------------------------------------------------- */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <SectionTitle
                title="Companies"
                hint={`${COMPANIES_WITH_ACTIVITY} of ${COMPANIES.length} active · ${neverPaid.length} never paid`}
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
            <ul className="divide-y divide-ops-line">
              {companies.map(({ company, total, drivers }) => (
                <li key={company.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <Link
                        href={`/ops/clients?company=${company.id}`}
                        className="truncate text-[13px] font-medium text-ops-text hover:text-ops-accent"
                      >
                        {company.name}
                      </Link>
                      {company.lastPaymentAt === null && total > 0 && (
                        <StatusPill tone="risk">Never paid</StatusPill>
                      )}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <ShareBar value={total} max={maxCompanySpend} className="max-w-[180px]" />
                      <span className="shrink-0 text-[11px] text-ops-text-tertiary">
                        {drivers === 0 ? "no drivers" : `${drivers} ${drivers === 1 ? "driver" : "drivers"}`}
                      </span>
                    </span>
                  </span>
                  <span className="w-[86px] shrink-0 text-right">
                    <Money value={total} tone={false} className="text-[13px] font-semibold text-ops-text" />
                  </span>
                  {total > 0 && company.lastPaymentAt === null && (
                    <RowAction>Record payment</RowAction>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <SectionTitle
                title="Partner split"
                hint="cash basis"
                action={
                  <Link
                    href="/ops/financials"
                    className="flex items-center gap-1 text-[12px] font-semibold text-ops-accent hover:underline"
                  >
                    Withdrawals <ArrowRight className="size-3" />
                  </Link>
                }
              />
            </CardHeader>
            <div className="grid grid-cols-2 divide-x divide-ops-line">
              {PARTNERS.map((p) => (
                <div key={p.id} className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Avatar initials={initialsOf(p.name)} className="size-5 text-[9px]" />
                    <span className="text-[12px] text-ops-text-secondary">
                      {p.name} · {Math.round(p.share * 100)}%
                    </span>
                  </div>
                  <div className="ops-figure mt-2 text-[22px] font-semibold leading-none text-ops-risk-fg">
                    {money(shareOf(p, CASH_NET))}
                  </div>
                </div>
              ))}
            </div>
            <dl className="grid grid-cols-3 divide-x divide-ops-line border-t border-ops-line">
              {[
                { label: "Received", value: CASH_RECEIVED },
                { label: "Paid out", value: -CASH_PAID_OUT },
                { label: "Net", value: CASH_NET },
              ].map((r) => (
                <div key={r.label} className="px-4 py-2.5">
                  <dt className="text-[11px] text-ops-text-tertiary">{r.label}</dt>
                  <dd className="mt-0.5">
                    <Money value={r.value} className="text-[13px] font-semibold" />
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Period comparison + activity                                   */}
        {/* ------------------------------------------------------------- */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardHeader>
              <SectionTitle title="Month by month" hint="last three periods" />
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
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
                    <tr key={p.key} className="hover:bg-ops-hover">
                      <td className="px-4 py-2.5">
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
                      <td className="px-3 py-2.5 text-right">
                        <Money value={p.revenue} tone={false} className="text-ops-text-secondary" />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Money value={p.expenses} tone={false} className="text-ops-text-secondary" />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-flex items-center gap-1.5">
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
                      <td className="px-3 py-2.5 text-right">
                        <Money value={shareOf(PARTNERS[0], p.distributed)} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Money value={shareOf(PARTNERS[1], p.distributed)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* The basis changes between rows, so it is stated rather than
                left for the reader to discover by subtracting. */}
            <p className="border-t border-ops-line bg-ops-sunken px-4 py-2 text-[11px] text-ops-text-tertiary">
              Distributed is what the partners split. For a period that closed with bills unpaid it is not
              revenue less expenses — {CLOSED_PERIODS[1]?.label} carried{" "}
              {money(CLOSED_PERIODS[1].revenue - CLOSED_PERIODS[1].expenses - CLOSED_PERIODS[1].distributed)} of
              expense into September.
            </p>
          </Card>

          <Card>
            <CardHeader>
              <SectionTitle title="Recent activity" />
            </CardHeader>
            <ol className="divide-y divide-ops-line">
              {ACTIVITY.map((ev) => (
                <li key={ev.id} className="flex gap-2.5 px-4 py-2.5">
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", TONE_DOT[ev.tone])} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] text-ops-text">
                      <strong className="font-semibold">{ev.actor}</strong> {ev.summary}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ops-text-tertiary">
                      {relativeTime(ev.at)}
                    </span>
                  </span>
                  {ev.amount !== null && (
                    <Money value={ev.amount} tone={false} className="shrink-0 text-[12px] font-medium text-ops-text" />
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
