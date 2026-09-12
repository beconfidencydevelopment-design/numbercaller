"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconChecklist,
  IconDrivers,
  IconExpenses,
  IconLock,
  IconMoney,
  IconWallet,
  IconClose,
  IconDownload,
  IconPlus,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import {
  ArrowGlyph,
  Avatar,
  Button,
  Card,
  CompositionBar,
  DashedRule,
  DeltaChip,
  Funnel,
  LineChart,
  SegmentedGauge,
  Money,
  RowAction,
  ShareBar,
  StatusPill,
} from "./primitives";
import { PageBody, PageHeader } from "./page-header";
import type { StatusTone } from "@/lib/ops/types";
import {
  ACTIVITY,
  CASH_NET,
  CASH_PAID_OUT,
  CASH_RECEIVED,
  CLOSED_PERIODS,
  COMPANIES,
  COMPANIES_WITH_ACTIVITY,
  CUMULATIVE_DISTRIBUTED,
  DAILY_AVERAGE,
  DAY_OF_PERIOD,
  DRAFT_REVENUE_TOTAL,
  DRIVERS,
  DRIVERS_SETTLED,
  DRIVERS_UNSETTLED,
  DRIVER_CARRIED_TOTAL,
  DRIVER_OUTSTANDING_TOTAL,
  EXPENSES,
  EXPENSE_TOTAL,
  FINALIZED_REVENUE,
  GLOBAL_COMPANY,
  HEADLINE_DELTA,
  NOW,
  OPEN_PERIOD,
  PACING,
  PARTNERS,
  PENDING_ACTIONS,
  PERIOD,
  PERIODS,
  PERIOD_DAYS,
  REVENUE,
  REVENUE_TOTAL,
  SINCE_LAST_VISIT,
  UNPAID_BILLS,
  driversFor,
  expensesByCompany,
  expensesFor,
  shareOf,
} from "@/lib/ops/data";
import { daysAgo, formatDate, formatTime, initialsOf, money, relativeTime } from "@/lib/ops/format";

/* -------------------------------------------------------------------------- */
/* Shared card anatomy                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Every chart card opens the same way: a grey title, one sentence saying what
 * the chart shows, and — on the right — the headline figures the chart is
 * drawn from, each with its legend dot and its change. The reader gets the
 * answer before the picture; the picture then confirms it.
 */
function ChartHead({
  title,
  subtitle,
  figures,
  action,
}: {
  title: string;
  subtitle: React.ReactNode;
  figures?: Array<{ key: string; label: string; swatch?: string; value: React.ReactNode; delta?: React.ReactNode }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 pt-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-title font-medium text-ops-text">{title}</h2>
          <p className="mt-1 text-body text-ops-text-tertiary">{subtitle}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {figures && (
        <div className="mt-3 flex flex-wrap items-start gap-8">
          {figures.map((f) => (
            <div key={f.key} className="min-w-0">
              <div className="flex items-center gap-2 text-body text-ops-text-secondary">
                {f.swatch && <span className="size-2 rounded-full" style={{ background: f.swatch }} aria-hidden />}
                {f.label}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="ops-figure text-figure font-medium leading-none text-ops-text">{f.value}</span>
                {f.delta}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** The one control a card header carries: an outlined pill, top right. */
function HeadAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-3 text-body font-medium text-ops-text hover:border-ops-accent hover:text-ops-accent"
    >
      {children}
      <IconArrowRight className="size-3" />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Headline figures                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The stat tile, as the reference draws it: label and change on the first
 * line, the figure in the mono with a small arrow disc beside it, one caption
 * underneath. Nothing else.
 */
function Figure({
  label,
  value,
  delta,
  good,
  caption,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number;
  delta: { pct: number; dir: "up" | "down" | "flat" };
  good: boolean;
  caption: React.ReactNode;
  tone?: "neutral" | "risk";
  href: string;
}) {
  return (
    <Link href={href} className="ops-card flex min-w-0 flex-col p-5 transition-colors hover:border-ops-line-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-body text-ops-text-secondary">{label}</span>
        <DeltaChip pct={delta.pct} dir={delta.dir} good={good} caption="" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <span className={cn("ops-figure text-display font-medium leading-none", tone === "risk" ? "text-ops-risk-fg" : "text-ops-text")}>
          {money(value)}
        </span>
        <ArrowGlyph dir={delta.dir} good={good} />
      </div>
      <p className="mt-4 text-body text-ops-text-secondary">{caption}</p>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Actions pending                                                             */
/* -------------------------------------------------------------------------- */

/** The kind of work each item is, so the row has an anchor and not just a dot. */
const ACTION_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  pa1: IconExpenses,
  pa2: IconDrivers,
  pa3: IconWallet,
  pa4: IconMoney,
  pa5: IconLock,
};

const ACTION_TILE: Record<StatusTone, string> = {
  risk: "bg-ops-risk-bg text-ops-risk-fg",
  warn: "bg-ops-warn-bg text-ops-warn-fg",
  ok: "bg-ops-ok-bg text-ops-ok-fg",
  move: "bg-ops-move-bg text-ops-move-fg",
  idle: "bg-ops-idle-bg text-ops-idle-fg",
};

function PendingActions() {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <ChartHead
        title="Actions pending"
        subtitle={`${PENDING_ACTIONS.length} items, largest first, before ${PERIOD.label} can close.`}
      />
      <ul className="mt-5 flex flex-1 flex-col divide-y divide-dashed divide-ops-line border-t border-dashed border-ops-line">
        {PENDING_ACTIONS.map((a) => {
          const Icon = ACTION_ICON[a.id] ?? IconChecklist;
          return (
            <li key={a.id} className="group flex min-h-16 flex-1 items-center gap-4 px-5 transition-colors hover:bg-ops-hover">
              {/* Tinted by severity and shaped by the kind of work, so the row
                  is identifiable before it is read — the dot it replaces
                  carried the first of those and neither of the others. */}
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-[var(--ops-r-control)]", ACTION_TILE[a.tone])} aria-hidden>
                <Icon className="size-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-body text-ops-text">{a.label}</span>
                <span className="block truncate text-body text-ops-text-tertiary">{a.detail}</span>
              </span>

              {a.amount !== null ? (
                <Money value={a.amount} tone={false} className="w-24 shrink-0 text-right text-body font-medium text-ops-text" />
              ) : (
                <span className="w-24 shrink-0" aria-hidden />
              )}

              <Link
                href={a.href}
                className="inline-flex h-8 w-24 shrink-0 items-center justify-center gap-1 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface text-body font-medium text-ops-text transition-colors hover:border-ops-accent hover:text-ops-accent"
              >
                {a.action}
                <IconArrowRight className="size-3" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Partner split — a small table                                               */
/* -------------------------------------------------------------------------- */

function PartnerSplit() {
  /* Two shares of one pot, so the honest form is a part-to-whole bar — not a
     two-slice pie. Widths use the absolute shares because the split is 35/65
     whether the period made money or lost it; the labels keep the sign. */
  const segments = PARTNERS.map((p, i) => ({
    id: p.id,
    label: p.name,
    value: Math.abs(shareOf(p, CASH_NET)),
    color: `var(--ops-cat-${i + 1})`,
  }));
  const anyValue = segments.some((x) => x.value > 0);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <ChartHead
        title="Partner split"
        subtitle={`${money(CASH_NET)} distributed this period, ${Math.round(PARTNERS[0].share * 100)} / ${Math.round(PARTNERS[1].share * 100)} on a cash basis.`}
        action={<HeadAction href="/ops/financials?tab=withdrawals">Withdrawals</HeadAction>}
      />

      <div className="px-5 pt-5">
        {anyValue ? (
          <CompositionBar segments={segments} />
        ) : (
          <div className="h-2 w-full rounded-full bg-ops-active" aria-hidden />
        )}
      </div>

      {/* Each partner as a block rather than a row. A share on its own cannot
          be acted on: what decides whether a withdrawal is possible is the
          balance — everything earned to date, less everything taken out — so
          the four figures the Withdrawals tab keeps for each partner are all
          here, with the balance carrying the emphasis. */}
      <ul className="flex flex-1 flex-col divide-y divide-dashed divide-ops-line px-5">
        {PARTNERS.map((p, i) => {
          const toDate = shareOf(p, CUMULATIVE_DISTRIBUTED);
          const balance = toDate - p.withdrawn;
          return (
            <li key={p.id} className="flex flex-1 flex-col justify-center gap-4 py-5">
              <div className="flex items-center gap-3">
                <span className="size-2 shrink-0 rounded-full" style={{ background: `var(--ops-cat-${i + 1})` }} aria-hidden />
                <Avatar id={p.id} name={p.name} initials={initialsOf(p.name)} className="size-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-ops-text">{p.name}</span>
                  <span className="ops-num block text-body text-ops-text-tertiary">
                    {Math.round(p.share * 100)}% share
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <Money value={shareOf(p, CASH_NET)} className="block text-figure font-medium" />
                  <span className="block text-body text-ops-text-tertiary">this period</span>
                </span>
              </div>

              {/* Earned to date, less taken out, is the balance — so the row
                  reads as the sum it is. The first two are equal today only
                  because neither partner has withdrawn anything; the client's
                  own Withdrawals tab keeps all three for the same reason. */}
              <dl className="flex items-center gap-3 rounded-[var(--ops-r-inner)] bg-ops-sunken px-4 py-3">
                {[
                  { label: "To date", value: toDate, op: "−" },
                  { label: "Withdrawn", value: p.withdrawn, op: "=" },
                  { label: "Balance", value: balance, strong: true },
                ].map((r) => (
                  <React.Fragment key={r.label}>
                    <div className="min-w-0 flex-1">
                      <dt className="truncate text-body text-ops-text-tertiary">{r.label}</dt>
                      <dd className="mt-1">
                        <Money value={r.value} className={cn("text-body", r.strong ? "font-medium" : "font-normal")} />
                      </dd>
                    </div>
                    {r.op && <span className="ops-num shrink-0 text-body text-ops-text-tertiary">{r.op}</span>}
                  </React.Fragment>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>

      <dl className="grid grid-cols-3 divide-x divide-dashed divide-ops-line border-t border-dashed border-ops-line">
        {[
          { label: "Received", value: CASH_RECEIVED },
          { label: "Paid out", value: -CASH_PAID_OUT },
          { label: "Net", value: CASH_NET },
        ].map((r) => (
          <div key={r.label} className="px-5 py-4">
            <dt className="text-body text-ops-text-secondary">{r.label}</dt>
            <dd className="mt-1">
              <Money value={r.value} className="text-body font-medium" />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Revenue against expenses — the reference's "Sales & Returns"                */
/* -------------------------------------------------------------------------- */

function RevenueExpenses() {
  const overspent = CLOSED_PERIODS.filter((p) => p.expenses > p.revenue).length;
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <ChartHead
        title="Revenue & expenses"
        subtitle={`Expenses outran revenue in ${overspent} of ${CLOSED_PERIODS.length} closed periods. ${OPEN_PERIOD.label} is day ${DAY_OF_PERIOD} of ${PERIOD_DAYS}.`}
        figures={[
          {
            key: "rev",
            label: "Revenue",
            swatch: "var(--ops-series-a)",
            value: money(REVENUE_TOTAL),
            delta: <DeltaChip pct={HEADLINE_DELTA.revenue.pct} dir={HEADLINE_DELTA.revenue.dir} caption="" />,
          },
          {
            key: "exp",
            label: "Expenses",
            swatch: "var(--ops-idle-dot)",
            value: money(EXPENSE_TOTAL),
            delta: <DeltaChip pct={HEADLINE_DELTA.expenses.pct} dir={HEADLINE_DELTA.expenses.dir} caption="" />,
          },
        ]}
      />
      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
        <LineChart
          labels={PERIODS.map((p) => p.label.split(" ")[0])}
          currentIndex={PERIODS.length - 1}
          faintFrom={PERIODS.findIndex((p) => !p.locked)}
          defaultIndex={Math.max(0, PERIODS.findIndex((p) => !p.locked) - 1)}
          ticks={[0, 50_000, 100_000, 150_000]}
          format={(v) => (v === 0 ? "$0" : `$${Math.round(v / 1000)}k`)}
          series={[
            { id: "revenue", label: "Revenue", color: "var(--ops-series-a)", values: PERIODS.map((p) => p.revenue), emphasis: true },
            { id: "expenses", label: "Expenses", color: "var(--ops-idle-dot)", values: PERIODS.map((p) => p.expenses) },
          ]}
        />
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Period close — the reference's "Sales conversion" funnel                    */
/* -------------------------------------------------------------------------- */

function PeriodClose() {
  const stages = [
    { id: "logged", label: "Expenses", done: COMPANIES_WITH_ACTIVITY, total: COMPANIES.length },
    { id: "revenue", label: "Revenue", done: FINALIZED_REVENUE.length, total: REVENUE.length },
    { id: "drivers", label: "Drivers", done: DRIVERS_SETTLED, total: DRIVERS.length },
    { id: "bills", label: "Bills", done: 0, total: UNPAID_BILLS.length },
    { id: "closed", label: "Closed", done: 0, total: 1 },
  ];
  const complete = stages.filter((st) => st.total > 0 && st.done === st.total).length;
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <ChartHead
        title="Period close"
        subtitle={`Expenses logged, revenue finalized, drivers settled, bills paid — then ${PERIOD.label} can close.`}
        figures={[{ key: "steps", label: "Steps complete", value: `${complete} of ${stages.length}` }]}
      />
      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
        <Funnel stages={stages} />
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Monthly comparison — the client's table                                     */
/* -------------------------------------------------------------------------- */

function MonthByMonth() {
  const augGap = CLOSED_PERIODS[1].revenue - CLOSED_PERIODS[1].expenses - CLOSED_PERIODS[1].distributed;
  return (
    <Card className="overflow-hidden">
      <ChartHead title="Monthly comparison" subtitle="Revenue, expenses and what the partners split, for the last three periods." />
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-body">
          <thead>
            <tr className="border-t border-dashed border-ops-line text-left">
              <th className="ops-eyebrow px-5 py-3 font-medium">Period</th>
              <th className="ops-eyebrow px-3 py-3 text-right font-medium">Revenue</th>
              <th className="ops-eyebrow px-3 py-3 text-right font-medium">Expenses</th>
              <th className="ops-eyebrow px-3 py-3 text-right font-medium">Distributed</th>
              <th className="ops-eyebrow px-3 py-3 text-right font-medium">Syed 35%</th>
              <th className="ops-eyebrow px-5 py-3 text-right font-medium">Kiani 65%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-ops-line border-t border-dashed border-ops-line">
            {PERIODS.map((p) => (
              <tr key={p.key} className="h-12">
                <td className="px-5">
                  <span className="flex items-center gap-2">
                    <span className="text-ops-text">{p.label}</span>
                    {p.locked ? <StatusPill tone="idle" dot={false}>Closed</StatusPill> : <StatusPill tone="warn">Open</StatusPill>}
                  </span>
                </td>
                <td className="px-3 text-right"><Money value={p.revenue} tone={false} className="text-ops-text-secondary" /></td>
                <td className="px-3 text-right"><Money value={p.expenses} tone={false} className="text-ops-text-secondary" /></td>
                <td className="px-3 text-right">
                  <span className="inline-flex items-baseline gap-2">
                    <Money value={p.distributed} className="font-medium" />
                    <span className="text-micro text-ops-text-tertiary" title={p.basis === "cash" ? "Cash basis: what actually left the bank." : "Accrual basis: revenue less expenses incurred."}>{p.basis}</span>
                  </span>
                </td>
                <td className="px-3 text-right"><Money value={shareOf(PARTNERS[0], p.distributed)} /></td>
                <td className="px-5 text-right"><Money value={shareOf(PARTNERS[1], p.distributed)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-dashed border-ops-line px-5 py-4 text-body leading-[1.5] text-ops-text-tertiary">
        Distributed is what the partners split. For a period that closed with bills unpaid it is not revenue less expenses —{" "}
        {CLOSED_PERIODS[1].label} carried {money(augGap)} of expense into September.
      </p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Driver settlement — a gauge                                                 */
/* -------------------------------------------------------------------------- */

function DriverSettlement() {
  const lastSettled = ACTIVITY.find((a) => a.tone === "ok");
  const settledPct = Math.round((DRIVERS_SETTLED / DRIVERS.length) * 100);
  return (
    <Card className="flex h-full flex-col overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-title font-medium text-ops-text">Driver settlement</h2>
          <p className="mt-1 text-body text-ops-text-tertiary">{PERIOD.label} payroll</p>
        </div>
        <HeadAction href="/ops/drivers">Settle</HeadAction>
      </div>

      <div className="mt-5">
        <div className="ops-figure text-hero font-medium leading-none text-ops-text">{money(DRIVER_OUTSTANDING_TOTAL)}</div>
        <p className="mt-2 text-body text-ops-text-secondary">
          <span className="font-medium text-ops-text">{DRIVERS_UNSETTLED} unsettled</span> · {DRIVERS_SETTLED} settled
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center py-5">
        <SegmentedGauge value={DRIVERS_SETTLED} max={DRIVERS.length} label={`${settledPct}%`} sublabel="of drivers settled" />
      </div>

      <p className="text-body leading-[1.5] text-ops-text-secondary">
        {money(DRIVER_OUTSTANDING_TOTAL - DRIVER_CARRIED_TOTAL)} this period + {money(DRIVER_CARRIED_TOTAL)} carried from August
        {lastSettled ? ` · last settled ${formatDate(lastSettled.at)} (${money(lastSettled.amount ?? 0)})` : ""}
      </p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Companies — the ledger                                                      */
/* -------------------------------------------------------------------------- */

/** Up to two letters, from the company name. */
const monogramOf = (name: string) => name.slice(0, 2).toUpperCase();

function Companies() {
  const rows = expensesByCompany().map(({ company, total }) => {
    const drivers = driversFor(company.id);
    const overdue = company.expectation.toLowerCase().includes("overdue");
    const dormant = total === 0 && drivers.length === 0;
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
  const maxSpend = Math.max(...rows.map((r) => r.total), 1);

  return (
    <Card className="overflow-hidden">
      <ChartHead
        title="Companies"
        subtitle={`${COMPANIES.length} clients · ${COMPANIES_WITH_ACTIVITY} active · ${money(EXPENSE_TOTAL)} total spend · ${neverPaid} never paid`}
        action={<HeadAction href="/ops/clients">All clients</HeadAction>}
      />
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[860px] text-body">
          <thead>
            <tr className="border-t border-dashed border-ops-line text-left">
              {/* Explicit widths: left to itself the browser gave Company half
                  the table and left the middle columns floating in a gap. */}
              <th className="ops-eyebrow px-5 py-3 font-normal">Company</th>
              <th className="ops-eyebrow w-36 px-3 py-3 font-normal">Last paid</th>
              <th className="ops-eyebrow w-40 px-3 py-3 font-normal">Drivers</th>
              <th className="ops-eyebrow w-64 px-3 py-3 text-right font-normal">This period</th>
              <th className="ops-eyebrow w-52 px-5 py-3 text-right font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-ops-line border-t border-dashed border-ops-line">
            {rows.map(({ company, total, drivers, status }) => (
              <tr key={company.id} className="group h-16 transition-colors hover:bg-ops-hover">
                <td className="px-5">
                  {/* A neutral monogram tile ringed in the company's own
                      categorical colour — the same colour it takes in the
                      composition bar above, so one company reads as one
                      company across the page. The ring carries the hue
                      because a solid tile cannot: white on the teal and the
                      grey falls under 4.5:1, and every solid fails in dark. */}
                  <Link
                    href={`/ops/clients?company=${company.id}`}
                    className="flex items-center gap-3 text-ops-text hover:text-ops-accent"
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-[var(--ops-r-control)] bg-ops-sunken text-micro font-medium text-ops-text-secondary"
                      style={{ boxShadow: `inset 0 0 0 2px ${COMPANY_COLOR[company.id] ?? "var(--ops-line-strong)"}` }}
                      aria-hidden
                    >
                      {monogramOf(company.name)}
                    </span>
                    <span className="font-medium">{company.name}</span>
                  </Link>
                </td>

                <td className="px-3 text-ops-text-secondary">
                  {company.lastPaymentAt ? (
                    <>
                      <span className="block">{formatDate(company.lastPaymentAt)}</span>
                      <span className="ops-num block text-ops-text-tertiary">{daysAgo(company.lastPaymentAt)}</span>
                    </>
                  ) : (
                    <span className="text-ops-text-tertiary">—</span>
                  )}
                </td>

                {/* The count as faces. Every driver has a portrait, so the
                    column can show who rather than how many. */}
                <td className="px-3">
                  {drivers.length > 0 ? (
                    <span className="flex items-center gap-2">
                      <span className="flex -space-x-2">
                        {drivers.slice(0, 3).map((d) => (
                          <Avatar
                            key={d.id}
                            id={d.id}
                            name={d.name}
                            initials={initialsOf(d.name)}
                            className="size-7 ring-2 ring-ops-surface"
                          />
                        ))}
                      </span>
                      <span className="ops-num text-ops-text-secondary">
                        {drivers.length > 3 ? `+${drivers.length - 3}` : ""}
                      </span>
                    </span>
                  ) : (
                    <span className="text-ops-text-tertiary">—</span>
                  )}
                </td>

                <td className="px-3">
                  <span className="flex items-center justify-end gap-3">
                    {total > 0 && <ShareBar value={total} max={maxSpend} className="hidden h-1 w-24 lg:block" />}
                    {total > 0 ? (
                      <Money value={total} tone={false} className="w-20 text-right font-medium text-ops-text" />
                    ) : (
                      <span className="ops-num w-20 text-right text-ops-text-tertiary">{money(0)}</span>
                    )}
                  </span>
                </td>

                <td className="px-5 text-right">
                  <span className="inline-flex items-center gap-2">
                    <StatusPill tone={status.tone} dot={status.tone !== "idle"}>{status.label}</StatusPill>
                    {status.tone === "risk" && <RowAction>Record</RowAction>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ops-line bg-ops-sunken font-medium">
              <td colSpan={2} className="px-5 py-4 text-ops-text">{COMPANIES.length} companies</td>
              <td className="ops-num px-3 py-4 text-ops-text">{DRIVERS.length}</td>
              <td className="px-3 py-4 text-right"><Money value={EXPENSE_TOTAL} tone={false} className="text-ops-text" /></td>
              <td className="px-5" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Logged this period — composition by company                                 */
/* -------------------------------------------------------------------------- */

const COMPANY_COLOR: Record<string, string> = {
  precision: "var(--ops-cat-1)",
  intelcom: "var(--ops-cat-2)",
  rona: "var(--ops-cat-3)",
  napa: "var(--ops-cat-4)",
};

function LoggedThisPeriod() {
  const byCompany = expensesByCompany();
  const own = expensesFor(GLOBAL_COMPANY.id).reduce((n, e) => n + e.amount, 0);
  const segments = [
    ...byCompany.map(({ company, total }) => ({
      id: company.id,
      label: company.name,
      value: total,
      color: COMPANY_COLOR[company.id] ?? "var(--ops-idle-dot)",
    })),
    { id: GLOBAL_COMPANY.id, label: "Own costs", value: own, color: "var(--ops-idle-dot)" },
  ];
  const max = Math.max(...segments.map((x) => x.value), 1);

  /* Who did the logging. The client's own activity feed credits every entry
     to a person, so the card can say who has been in the book this period —
     with their face, not their initials. */
  const loggers = DRIVERS.filter((d) => d.lastEntryAt !== null).slice(0, 6);
  const loggerCount = DRIVERS.filter((d) => d.lastEntryAt !== null).length;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <ChartHead
        title="Logged this period"
        subtitle={`${EXPENSES.length} entries through ${formatDate(NOW)}, by who the cost was for.`}
        action={<HeadAction href="/ops/expenses">Ledger</HeadAction>}
      />

      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 px-5 sm:grid-cols-4">
        {[
          { label: "Entries", value: String(EXPENSES.length) },
          { label: "Value", value: money(EXPENSE_TOTAL) },
          { label: "Drivers", value: String(loggerCount) },
          { label: "Companies", value: `${COMPANIES_WITH_ACTIVITY} of ${COMPANIES.length}` },
        ].map((x) => (
          <div key={x.label}>
            <dt className="truncate text-body text-ops-text-secondary">{x.label}</dt>
            <dd className="ops-num mt-1 text-figure font-medium text-ops-text">{x.value}</dd>
          </div>
        ))}
      </dl>

      <DashedRule className="mx-5 mt-5" />

      <div className="px-5 pt-5">
        <CompositionBar segments={segments} />
      </div>

      {/* Each payer with its share bar, so the legend also ranks them rather
          than only naming the colours. */}
      <ul className="flex flex-1 flex-col justify-center gap-4 px-5 py-5">
        {segments.map((x) => (
          <li key={x.id} className="flex items-center gap-3">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: x.color, opacity: x.value > 0 ? 1 : 0.35 }}
              aria-hidden
            />
            <span className={cn("w-20 shrink-0 truncate text-body", x.value > 0 ? "text-ops-text" : "text-ops-text-tertiary")}>
              {x.label}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block h-2 w-full overflow-hidden rounded-full bg-ops-active">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(x.value / max) * 100}%`, background: x.color }}
                />
              </span>
            </span>
            <Money
              value={x.value}
              tone={false}
              className={cn("w-20 shrink-0 text-right text-body", x.value > 0 ? "font-medium text-ops-text" : "text-ops-text-tertiary")}
            />
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 border-t border-dashed border-ops-line px-5 py-4">
        <span className="flex -space-x-2">
          {loggers.map((d) => (
            <Avatar
              key={d.id}
              id={d.id}
              name={d.name}
              initials={initialsOf(d.name)}
              className="size-7 ring-2 ring-ops-surface"
            />
          ))}
        </span>
        <span className="text-body text-ops-text-secondary">
          {loggerCount} drivers logged entries this period
        </span>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Recent activity                                                             */
/* -------------------------------------------------------------------------- */

function RecentActivity() {
  /* The client's feed groups by day — "Today", then "Earlier this week" — and
     the grouping is what stops five near-identical lines reading as one
     block. Derived from the fixed clock, not stored. */
  const startOfToday = new Date(NOW);
  startOfToday.setUTCHours(4, 0, 0, 0); // midnight Toronto
  const groups = [
    { key: "today", label: "Today", rows: ACTIVITY.filter((a) => a.at >= startOfToday.getTime()) },
    { key: "earlier", label: "Earlier this week", rows: ACTIVITY.filter((a) => a.at < startOfToday.getTime()) },
  ].filter((g) => g.rows.length > 0);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <ChartHead
        title="Recent activity"
        subtitle={`${ACTIVITY.length} events since ${formatDate(SINCE_LAST_VISIT.since)}.`}
        action={<HeadAction href="/ops/expenses">View all</HeadAction>}
      />
      <div className="mt-5 flex flex-1 flex-col border-t border-dashed border-ops-line">
        {groups.map((g) => (
          <React.Fragment key={g.key}>
            <div className="bg-ops-sunken px-5 py-2 text-body text-ops-text-tertiary">{g.label}</div>
            <ol className="divide-y divide-dashed divide-ops-line">
              {g.rows.map((ev) => (
                <li key={ev.id} className="flex min-h-16 items-center gap-3 px-5 py-3">
                  {/* The actor gets a face. A coloured dot said only that
                      something happened; the portrait says who did it, which
                      is the column's actual subject. */}
                  <Avatar id={ev.actorId} name={ev.actor} initials={initialsOf(ev.actor)} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body text-ops-text">
                      <span className="font-medium">{ev.actor}</span> {ev.summary}
                    </span>
                    <span className="block text-body text-ops-text-tertiary">{relativeTime(ev.at)}</span>
                  </span>
                  {ev.amount !== null && (
                    <Money value={ev.amount} tone={false} className="shrink-0 text-body font-medium text-ops-text" />
                  )}
                </li>
              ))}
            </ol>
          </React.Fragment>
        ))}
      </div>
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
              <IconDownload className="size-4" />
              Export
            </Button>
            <Button variant="primary">
              <IconPlus className="size-4" />
              Log expense
            </Button>
          </>
        }
      />

      <PageBody className="flex flex-col gap-5">
        {banner && (
          <div className="flex items-center gap-3 rounded-[var(--ops-r-card)] border border-ops-move-line bg-ops-move-bg px-5 py-2">
            <span className="size-2 shrink-0 rounded-full bg-ops-move-dot" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-body text-ops-move-fg">
              <span className="font-medium">{SINCE_LAST_VISIT.entries} new entries</span> since {formatDate(SINCE_LAST_VISIT.since)},{" "}
              {formatTime(SINCE_LAST_VISIT.since)} · {money(SINCE_LAST_VISIT.amount)} total
            </p>
            <Link href="/ops/expenses" className="shrink-0 text-body font-medium text-ops-move-fg hover:underline">
              View
            </Link>
            <button type="button" onClick={() => setBanner(false)} aria-label="Dismiss" className="grid size-5 shrink-0 place-items-center rounded text-ops-move-fg/70 hover:bg-ops-move-line hover:text-ops-move-fg">
              <IconClose className="size-4" />
            </button>
          </div>
        )}

        {/* Row 1 — the four headline figures */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Figure label="Cash position" value={CASH_NET} delta={HEADLINE_DELTA.cash} good={HEADLINE_DELTA.cash.dir === "up"} tone="risk" href="/ops/financials" caption={`${money(DRAFT_REVENUE_TOTAL)} in drafts, not yet banked`} />
          <Figure label="Revenue" value={REVENUE_TOTAL} delta={HEADLINE_DELTA.revenue} good={HEADLINE_DELTA.revenue.dir === "up"} href="/ops/financials?tab=revenue" caption={`Nothing finalized · ${money(DRAFT_REVENUE_TOTAL)} in draft`} />
          <Figure label="Total expenses" value={EXPENSE_TOTAL} delta={HEADLINE_DELTA.expenses} good={HEADLINE_DELTA.expenses.dir === "down"} href="/ops/expenses" caption={`${money(DAILY_AVERAGE)} a day · on pace for ${money(PACING)}`} />
          <Figure label="Net profit" value={CASH_NET} delta={HEADLINE_DELTA.profit} good={HEADLINE_DELTA.profit.dir === "up"} tone="risk" href="/ops/financials" caption={`${money(CASH_PAID_OUT)} of it has actually left the bank`} />
        </div>

        {/* Row 2 — the two-series line and the funnel, as the reference lays them */}
        <div className="grid gap-5 wide:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <RevenueExpenses />
          <PeriodClose />
        </div>

        {/* Row 3 — gauge, composition bar, mini table */}
        <div className="grid gap-5 md:grid-cols-2 wide:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.3fr)]">
          <DriverSettlement />
          <LoggedThisPeriod />
          <PartnerSplit />
        </div>

        {/* Row 4 — the ledger */}
        <Companies />

        {/* Row 5 — the work, and the feed */}
        <div className="grid gap-5 wide:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <PendingActions />
          <RecentActivity />
        </div>

        {/* Row 6 — the client's month-by-month table */}
        <MonthByMonth />
      </PageBody>
    </>
  );
}
