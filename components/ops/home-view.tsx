"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Download, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ArrowGlyph,
  Avatar,
  Button,
  Card,
  CompositionBar,
  DashedRule,
  DeltaChip,
  Gauge,
  Money,
  RowAction,
  SegmentedMeter,
  ShareBar,
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
  DRIVERS_SETTLED,
  DRIVERS_UNSETTLED,
  DRIVER_CARRIED_TOTAL,
  DRIVER_OUTSTANDING_TOTAL,
  EXPENSES,
  EXPENSE_TOTAL,
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
  REVENUE_TOTAL,
  SINCE_LAST_VISIT,
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
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 pt-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="text-[13px] font-medium text-ops-text-secondary">{title}</h2>
          {action}
        </div>
        <p className="mt-2 text-[13px] text-ops-text">{subtitle}</p>
      </div>
      {figures && (
        <div className="flex flex-wrap items-start gap-6">
          {figures.map((f) => (
            <div key={f.key} className="min-w-0">
              <div className="flex items-center gap-2 text-[12px] text-ops-text-secondary">
                {f.swatch && <span className="size-2 rounded-full" style={{ background: f.swatch }} aria-hidden />}
                {f.label}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="ops-figure text-[24px] font-medium leading-none text-ops-text">{f.value}</span>
                {f.delta}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
    <Link href={href} className="ops-card flex min-w-0 flex-col p-4 transition-colors hover:border-ops-line-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] text-ops-text-secondary">{label}</span>
        <DeltaChip pct={delta.pct} dir={delta.dir} good={good} caption="" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={cn("ops-figure text-[24px] font-medium leading-none", tone === "risk" ? "text-ops-risk-fg" : "text-ops-text")}>
          {money(value)}
        </span>
        <ArrowGlyph dir={delta.dir} good={good} />
      </div>
      <p className="mt-3 truncate text-[12px] text-ops-text-secondary">{caption}</p>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Actions pending                                                             */
/* -------------------------------------------------------------------------- */

function PendingActions() {
  return (
    <Card className="overflow-hidden">
      <ChartHead
        title="Actions pending"
        subtitle={`${PENDING_ACTIONS.length} items, largest first, before ${PERIOD.label} can close.`}
      />
      <ul className="mt-3 divide-y divide-dashed divide-ops-line border-t border-dashed border-ops-line">
        {PENDING_ACTIONS.map((a) => (
          <li key={a.id} className="flex h-12 items-center gap-3 px-4">
            <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[a.tone])} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[13px] text-ops-text">{a.label}</span>
            {/* The stage's progress in the reference's own funnel language: a
                run of pills, the done ones lit. "1 of 18" reads as a count. */}
            <span className="hidden items-center gap-2 lg:flex">
              <SegmentedMeter value={a.progress.done} max={a.progress.total} segments={10} tone="ok" />
              <span className="ops-num w-14 text-[11px] text-ops-text-tertiary">
                {a.progress.done} of {a.progress.total}
              </span>
            </span>
            {a.amount !== null ? (
              <Money value={a.amount} tone={false} className="w-20 shrink-0 text-right text-[13px] font-medium text-ops-text" />
            ) : (
              <span className="w-20 shrink-0" aria-hidden />
            )}
            <Link
              href={a.href}
              className="inline-flex h-7 w-[74px] shrink-0 items-center justify-center gap-1 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface text-[11px] font-medium text-ops-text transition-colors hover:border-ops-accent hover:text-ops-accent"
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
/* Partner split — a small table                                               */
/* -------------------------------------------------------------------------- */

function PartnerSplit() {
  return (
    <Card className="overflow-hidden">
      <ChartHead
        title="Partner split"
        subtitle={`${money(CASH_NET)} distributed on a cash basis, ${Math.round(PARTNERS[0].share * 100)} / ${Math.round(PARTNERS[1].share * 100)}.`}
        action={
          <Link href="/ops/financials?tab=withdrawals" className="text-[12px] font-medium text-ops-accent hover:underline">
            Withdrawals →
          </Link>
        }
      />
      <table className="mt-3 w-full text-[13px]">
        <thead>
          <tr className="border-t border-dashed border-ops-line text-left">
            <th className="ops-eyebrow px-4 py-2 font-medium">Partner</th>
            <th className="ops-eyebrow px-3 py-2 text-right font-medium">Share</th>
            <th className="ops-eyebrow px-4 py-2 text-right font-medium">Distributed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-ops-line border-t border-dashed border-ops-line">
          {PARTNERS.map((p) => (
            <tr key={p.id} className="h-10">
              <td className="px-4">
                <span className="flex items-center gap-2">
                  <Avatar initials={initialsOf(p.name)} className="size-5 text-[9px]" />
                  <span className="text-ops-text">{p.name}</span>
                </span>
              </td>
              <td className="ops-num px-3 text-right text-ops-text-secondary">{Math.round(p.share * 100)}%</td>
              <td className="px-4 text-right">
                <Money value={shareOf(p, CASH_NET)} className="font-medium" />
              </td>
            </tr>
          ))}
          {[
            { label: "Received", value: CASH_RECEIVED },
            { label: "Paid out", value: -CASH_PAID_OUT },
          ].map((r) => (
            <tr key={r.label} className="h-9 text-[12px]">
              <td className="px-4 text-ops-text-secondary" colSpan={2}>
                {r.label}
              </td>
              <td className="px-4 text-right">
                <Money value={r.value} className="font-medium" />
              </td>
            </tr>
          ))}
          <tr className="h-10 bg-ops-sunken">
            <td className="px-4 font-medium text-ops-text" colSpan={2}>
              Net
            </td>
            <td className="px-4 text-right">
              <Money value={CASH_NET} className="font-medium" />
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Monthly comparison — revenue against expenses                               */
/* -------------------------------------------------------------------------- */

function PeriodBars() {
  const W = 200;
  const H = 40;
  const PAD_B = 6;
  const top = 150_000;
  const ticks = [0, 50_000, 100_000, 150_000];
  const y = (v: number) => H - PAD_B - (v / top) * (H - PAD_B - 2);
  const slot = W / PERIODS.length;
  const bw = 5.5;
  const gap = 1;
  const cap = 1;
  const column = (x: number, v: number) => {
    const y0 = y(0);
    const y1 = y(v);
    const h = Math.max(0, y0 - y1);
    if (h === 0) return "";
    const r = Math.min(cap, h / 2);
    return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + bw - r} Q${x + bw},${y1} ${x + bw},${y1 + r} V${y0} Z`;
  };

  return (
    <div className="px-4 pb-3 pt-4">
      <div className="flex gap-2">
        <div className="ops-num flex w-10 shrink-0 flex-col justify-between pb-2 text-right text-[10px] leading-none text-ops-text-tertiary">
          {[...ticks].reverse().map((t) => (
            <span key={t}>{t === 0 ? "$0" : `$${t / 1000}k`}</span>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[200px] w-full" role="img" aria-label="Revenue and expenses by period">
          {ticks.map((t) => (
            <line
              key={t}
              x1="0"
              x2={W}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--ops-line)"
              strokeWidth="1"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {PERIODS.map((p, i) => {
            const x0 = i * slot + slot / 2 - bw - gap / 2;
            const faint = !p.locked;
            return (
              <g key={p.key} opacity={faint ? 0.45 : 1}>
                <path d={column(x0, p.revenue)} fill="var(--ops-series-a)">
                  <title>{`${p.label} · Revenue ${money(p.revenue)}`}</title>
                </path>
                <path d={column(x0 + bw + gap, p.expenses)} fill="var(--ops-idle-dot)">
                  <title>{`${p.label} · Expenses ${money(p.expenses)}`}</title>
                </path>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex pl-12 text-center text-[11px] text-ops-text-secondary">
        {PERIODS.map((p) => (
          <span key={p.key} className="flex-1">
            <span className={cn("rounded-[6px] px-2 py-1", !p.locked && "bg-ops-active text-ops-text")}>
              {p.label.split(" ")[0]}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function MonthByMonth() {
  const overspent = CLOSED_PERIODS.filter((p) => p.expenses > p.revenue).length;
  const augGap = CLOSED_PERIODS[1].revenue - CLOSED_PERIODS[1].expenses - CLOSED_PERIODS[1].distributed;

  return (
    <Card className="overflow-hidden">
      <ChartHead
        title="Monthly comparison"
        subtitle={`Expenses outran revenue in ${overspent} of ${CLOSED_PERIODS.length} closed periods. ${OPEN_PERIOD.label} is day ${DAY_OF_PERIOD} of ${PERIOD_DAYS}.`}
        figures={[
          {
            key: "rev",
            label: "Revenue",
            swatch: "var(--ops-series-a)",
            value: money(REVENUE_TOTAL),
            delta: <DeltaChip pct={HEADLINE_DELTA.revenue.pct} dir={HEADLINE_DELTA.revenue.dir} good caption="" />,
          },
          {
            key: "exp",
            label: "Expenses",
            swatch: "var(--ops-idle-dot)",
            value: money(EXPENSE_TOTAL),
            delta: <DeltaChip pct={HEADLINE_DELTA.expenses.pct} dir={HEADLINE_DELTA.expenses.dir} good={false} caption="" />,
          },
        ]}
      />
      <PeriodBars />
      <DashedRule />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="text-left">
              <th className="ops-eyebrow px-4 py-2 font-medium">Period</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Revenue</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Expenses</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Distributed</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Syed 35%</th>
              <th className="ops-eyebrow px-4 py-2 text-right font-medium">Kiani 65%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-ops-line border-t border-dashed border-ops-line">
            {PERIODS.map((p) => (
              <tr key={p.key} className="h-10">
                <td className="px-4">
                  <span className="flex items-center gap-2">
                    <span className="text-ops-text">{p.label}</span>
                    {p.locked ? (
                      <StatusPill tone="idle" dot={false}>Closed</StatusPill>
                    ) : (
                      <StatusPill tone="warn">Open</StatusPill>
                    )}
                  </span>
                </td>
                <td className="px-3 text-right"><Money value={p.revenue} tone={false} className="text-ops-text-secondary" /></td>
                <td className="px-3 text-right"><Money value={p.expenses} tone={false} className="text-ops-text-secondary" /></td>
                <td className="px-3 text-right">
                  <span className="inline-flex items-baseline gap-2">
                    <Money value={p.distributed} className="font-medium" />
                    <span className="text-[10px] text-ops-text-tertiary" title={p.basis === "cash" ? "Cash basis: what actually left the bank." : "Accrual basis: revenue less expenses incurred."}>
                      {p.basis}
                    </span>
                  </span>
                </td>
                <td className="px-3 text-right"><Money value={shareOf(PARTNERS[0], p.distributed)} /></td>
                <td className="px-4 text-right"><Money value={shareOf(PARTNERS[1], p.distributed)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-dashed border-ops-line px-4 py-3 text-[11px] leading-[1.5] text-ops-text-tertiary">
        Distributed is what the partners split. For a period that closed with bills unpaid it is not revenue less
        expenses — {CLOSED_PERIODS[1].label} carried {money(augGap)} of expense into September.
      </p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Driver settlement — a gauge                                                 */
/* -------------------------------------------------------------------------- */

function DriverSettlement() {
  const lastSettled = ACTIVITY.find((a) => a.tone === "ok");
  return (
    <Card className="overflow-hidden">
      <ChartHead
        title="Driver settlement"
        subtitle={`${DRIVERS_UNSETTLED} of ${DRIVERS.length} drivers are still owed for ${PERIOD.label}.`}
        action={
          <Link href="/ops/drivers" className="text-[12px] font-medium text-ops-accent hover:underline">
            Settle →
          </Link>
        }
      />
      <div className="px-4 pb-2 pt-6">
        <Gauge value={DRIVERS_SETTLED} max={DRIVERS.length} tone="ok" label={`${DRIVERS_SETTLED} of ${DRIVERS.length}`} sublabel="drivers settled" />
      </div>
      <dl className="divide-y divide-dashed divide-ops-line border-t border-dashed border-ops-line text-[12px]">
        {[
          { label: "Outstanding", value: money(DRIVER_OUTSTANDING_TOTAL), strong: true },
          { label: "Logged this period", value: money(DRIVER_OUTSTANDING_TOTAL - DRIVER_CARRIED_TOTAL) },
          { label: "Carried from August", value: money(DRIVER_CARRIED_TOTAL) },
          { label: "Last settled", value: lastSettled ? `${formatDate(lastSettled.at)} · ${money(lastSettled.amount ?? 0)}` : "—", quiet: true },
        ].map((r) => (
          <div key={r.label} className="flex h-9 items-center justify-between gap-3 px-4">
            <dt className={cn(r.strong ? "font-medium text-ops-text" : "text-ops-text-secondary")}>{r.label}</dt>
            <dd className={cn("ops-num", r.strong ? "text-[13px] font-medium text-ops-text" : r.quiet ? "text-ops-text-tertiary" : "font-medium text-ops-text")}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Companies — the ledger                                                      */
/* -------------------------------------------------------------------------- */

function Companies() {
  const rows = expensesByCompany().map(({ company, total }) => {
    const drivers = driversFor(company.id).length;
    const overdue = company.expectation.toLowerCase().includes("overdue");
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
  const maxSpend = Math.max(...rows.map((r) => r.total), 1);

  return (
    <Card className="overflow-hidden">
      <ChartHead
        title="Companies"
        subtitle={`${COMPANIES.length} clients · ${COMPANIES_WITH_ACTIVITY} active · ${money(EXPENSE_TOTAL)} total spend · ${neverPaid} never paid`}
        action={
          <Link href="/ops/clients" className="text-[12px] font-medium text-ops-accent hover:underline">
            All clients →
          </Link>
        }
      />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-t border-dashed border-ops-line text-left">
              <th className="ops-eyebrow px-4 py-2 font-medium">Company</th>
              <th className="ops-eyebrow px-3 py-2 font-medium">Last paid</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Drivers</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">This period</th>
              <th className="ops-eyebrow px-4 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-ops-line border-t border-dashed border-ops-line">
            {rows.map(({ company, total, drivers, status }) => (
              <tr key={company.id} className="h-11 hover:bg-ops-hover">
                <td className="px-4">
                  <Link href={`/ops/clients?company=${company.id}`} className="text-ops-text hover:text-ops-accent">
                    {company.name}
                  </Link>
                </td>
                <td className="px-3 text-[12px] text-ops-text-secondary">
                  {company.lastPaymentAt ? (
                    <>
                      {formatDate(company.lastPaymentAt)}
                      <span className="ml-2 text-ops-text-tertiary">{daysAgo(company.lastPaymentAt)}</span>
                    </>
                  ) : (
                    <span className="text-ops-text-tertiary">—</span>
                  )}
                </td>
                <td className="ops-num px-3 text-right text-ops-text-secondary">
                  {drivers || <span className="text-ops-text-tertiary">—</span>}
                </td>
                <td className="px-3 text-right">
                  <span className="inline-flex items-center justify-end gap-3">
                    {total > 0 && <ShareBar value={total} max={maxSpend} className="hidden h-1 w-24 lg:block" />}
                    {total > 0 ? (
                      <Money value={total} tone={false} className="w-20 text-right font-medium text-ops-text" />
                    ) : (
                      <span className="ops-num w-20 text-right text-ops-text-tertiary">{money(0)}</span>
                    )}
                  </span>
                </td>
                <td className="px-4 text-right">
                  <span className="inline-flex items-center gap-2">
                    <StatusPill tone={status.tone} dot={status.tone !== "idle"}>{status.label}</StatusPill>
                    {status.tone === "risk" && <RowAction>Record</RowAction>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ops-line bg-ops-sunken text-[13px] font-medium">
              <td colSpan={2} className="px-4 py-3 text-ops-text">{COMPANIES.length} companies</td>
              <td className="ops-num px-3 py-3 text-right text-ops-text">{DRIVERS.length}</td>
              <td className="px-3 py-3 text-right"><Money value={EXPENSE_TOTAL} tone={false} className="text-ops-text" /></td>
              <td className="px-4" />
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
  const drivers = new Set(EXPENSES.map((e) => e.driverId).filter(Boolean)).size;
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

  return (
    <Card className="overflow-hidden">
      <ChartHead
        title="Logged this period"
        subtitle={`${EXPENSES.length} entries through ${formatDate(NOW)}, split by who the cost was for.`}
        action={
          <Link href="/ops/expenses" className="text-[12px] font-medium text-ops-accent hover:underline">
            Ledger →
          </Link>
        }
      />
      <div className="mt-4 grid gap-6 border-t border-dashed border-ops-line px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          {[
            { label: "Entries", value: String(EXPENSES.length) },
            { label: "Value", value: money(EXPENSE_TOTAL) },
            { label: "Drivers with entries", value: String(drivers) },
            { label: "Companies trading", value: `${COMPANIES_WITH_ACTIVITY} of ${COMPANIES.length}` },
          ].map((s) => (
            <div key={s.label}>
              <dt className="truncate text-[12px] text-ops-text-secondary">{s.label}</dt>
              <dd className="ops-num mt-1 text-[16px] font-medium text-ops-text">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="lg:border-l lg:border-dashed lg:border-ops-line lg:pl-6">
          <CompositionBar segments={segments} />
          <ul className="mt-3 grid grid-cols-2 gap-x-6 text-[12px] sm:grid-cols-3">
            {segments.map((s) => (
              <li key={s.id} className="flex h-7 items-center gap-2">
                <span className="size-2 shrink-0 rounded-full" style={{ background: s.color, opacity: s.value > 0 ? 1 : 0.35 }} aria-hidden />
                <span className={cn("flex-1 truncate", s.value > 0 ? "text-ops-text-secondary" : "text-ops-text-tertiary")}>{s.label}</span>
                <span className={cn("ops-num", s.value > 0 ? "font-medium text-ops-text" : "text-ops-text-tertiary")}>{money(s.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Recent activity                                                             */
/* -------------------------------------------------------------------------- */

function RecentActivity() {
  return (
    <Card className="overflow-hidden">
      <ChartHead title="Recent activity" subtitle={`${ACTIVITY.length} events since ${formatDate(SINCE_LAST_VISIT.since)}.`} />
      <ol className="mt-3 divide-y divide-dashed divide-ops-line border-t border-dashed border-ops-line">
        {ACTIVITY.map((ev) => (
          <li key={ev.id} className="flex h-12 items-center gap-3 px-4">
            <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[ev.tone])} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] text-ops-text">
                <span className="font-medium">{ev.actor}</span> {ev.summary}
              </span>
              <span className="block text-[11px] text-ops-text-tertiary">{relativeTime(ev.at)}</span>
            </span>
            {ev.amount !== null && <Money value={ev.amount} tone={false} className="shrink-0 text-[13px] font-medium text-ops-text" />}
          </li>
        ))}
      </ol>
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
              <Download className="size-4" />
              Export
            </Button>
            <Button variant="primary">
              <Plus className="size-4" />
              Log expense
            </Button>
          </>
        }
      />

      <PageBody className="flex flex-col gap-4">
        {banner && (
          <div className="flex items-center gap-3 rounded-[var(--ops-r-card)] border border-ops-move-line bg-ops-move-bg px-4 py-2">
            <span className="size-2 shrink-0 rounded-full bg-ops-move-dot" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-[12px] text-ops-move-fg">
              <span className="font-medium">{SINCE_LAST_VISIT.entries} new entries</span> since {formatDate(SINCE_LAST_VISIT.since)},{" "}
              {formatTime(SINCE_LAST_VISIT.since)} · {money(SINCE_LAST_VISIT.amount)} total
            </p>
            <Link href="/ops/expenses" className="shrink-0 text-[12px] font-medium text-ops-move-fg hover:underline">
              View
            </Link>
            <button type="button" onClick={() => setBanner(false)} aria-label="Dismiss" className="grid size-5 shrink-0 place-items-center rounded text-ops-move-fg/70 hover:bg-ops-move-line hover:text-ops-move-fg">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Row 1 — the four headline figures */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Figure label="Cash position" value={CASH_NET} delta={HEADLINE_DELTA.cash} good={HEADLINE_DELTA.cash.dir === "up"} tone="risk" href="/ops/financials" caption={`${money(DRAFT_REVENUE_TOTAL)} still in ${DRAFT_REVENUE.length} drafts, not in the bank`} />
          <Figure label="Revenue" value={REVENUE_TOTAL} delta={HEADLINE_DELTA.revenue} good={HEADLINE_DELTA.revenue.dir === "up"} href="/ops/financials?tab=revenue" caption={`Nothing finalized · ${money(DRAFT_REVENUE_TOTAL)} in draft`} />
          <Figure label="Total expenses" value={EXPENSE_TOTAL} delta={HEADLINE_DELTA.expenses} good={HEADLINE_DELTA.expenses.dir === "down"} href="/ops/expenses" caption={`${money(DAILY_AVERAGE)} a day · on pace for ${money(PACING)}`} />
          <Figure label="Net profit" value={CASH_NET} delta={HEADLINE_DELTA.profit} good={HEADLINE_DELTA.profit.dir === "up"} tone="risk" href="/ops/financials" caption={`Only ${money(CASH_PAID_OUT)} has actually left the bank`} />
        </div>

        {/*
          Rows are paired by height, not by theme. The five-row list and the
          gauge card come out within 50px of each other; the tall chart card
          pairs with two stacked cards; the composition card takes the full
          width, where its stats, bar and legend sit side by side.
        */}
        <div className="grid items-start gap-4 wide:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <PendingActions />
          <DriverSettlement />
        </div>

        <div className="grid items-start gap-4 wide:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <MonthByMonth />
          <div className="flex flex-col gap-4">
            <RecentActivity />
            <PartnerSplit />
          </div>
        </div>

        <Companies />

        <LoggedThisPeriod />
      </PageBody>
    </>
  );
}
