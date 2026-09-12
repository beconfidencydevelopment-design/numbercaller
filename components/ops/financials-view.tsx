"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconLock,
  IconPlus,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  FillRow,
  Money,
  RowAction,
  SectionTitle as Title,
  ShareBar,
  StatusPill,
} from "./primitives";
import { PageBody, PageHeader, Tabs } from "./page-header";
import {
  CARRIED_FORWARD,
  CASH_NET,
  CASH_PAID_OUT,
  CASH_RECEIVED,
  CHECKLIST,
  CLOSED_PERIODS,
  COMPANIES,
  CUMULATIVE_DISTRIBUTED,
  DRAFT_REVENUE,
  DRAFT_REVENUE_TOTAL,
  EXPENSE_TOTAL,
  GLOBAL_COMPANY,
  FINALIZED_REVENUE,
  OBLIGATIONS,
  OBLIGATION_TOTAL,
  PARTNERS,
  PERIOD,
  RECURRING,
  REVENUE_TOTAL,
  CATEGORY_LABEL,
  companyName,
  expensesFor,
  shareOf,
} from "@/lib/ops/data";
import { formatDate, formatDateFull, initialsOf, money } from "@/lib/ops/format";

type TabId = "overview" | "revenue" | "withdrawals" | "close" | "history";

const TAB_IDS: TabId[] = ["overview", "revenue", "withdrawals", "close", "history"];

/* -------------------------------------------------------------------------- */
/* Overview                                                                    */
/* -------------------------------------------------------------------------- */

function Overview() {
  const maxObligation = Math.max(...OBLIGATIONS.map((o) => o.amount), 1);
  /**
   * Every company, plus the business's own costs.
   *
   * Insurance and anything else booked against `Global` belongs to SNK rather
   * than to a client, but it is still $918 of the period's $12,427 — leaving
   * it out, as the live build does, gives a table whose rows sum to $11,509
   * under a total of $12,427.
   */
  const byCompany = [
    ...COMPANIES.map((c) => ({
      id: c.id,
      name: c.name,
      href: `/ops/clients?company=${c.id}`,
      lastPaymentAt: c.lastPaymentAt,
      dormant: false,
      expenses: expensesFor(c.id).reduce((n, e) => n + e.amount, 0),
    })),
    {
      id: GLOBAL_COMPANY.id,
      name: `${GLOBAL_COMPANY.name} · own costs`,
      href: null,
      lastPaymentAt: null,
      dormant: true,
      expenses: expensesFor(GLOBAL_COMPANY.id).reduce((n, e) => n + e.amount, 0),
    },
  ].map((r) => ({ ...r, dormant: r.dormant || r.expenses === 0 }));

  return (
    <div className="flex flex-col gap-4">
      {/* Headline row. Revenue and expenses are accrual; everything to the
          right of the divider is cash. The split is stated, because the two
          bases give different answers and the live build shows them side by
          side with no label. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Revenue", basis: "finalized", value: REVENUE_TOTAL, tone: "neutral" as const },
          { label: "Expenses", basis: "incurred", value: EXPENSE_TOTAL, tone: "neutral" as const },
          { label: "Distributed", basis: "cash basis", value: CASH_NET, tone: "risk" as const },
          { label: "Syed 35%", basis: "of distributed", value: shareOf(PARTNERS[0], CASH_NET), tone: "risk" as const },
          { label: "Kiani 65%", basis: "of distributed", value: shareOf(PARTNERS[1], CASH_NET), tone: "risk" as const },
        ].map((s) => (
          <div key={s.label} className="rounded-[var(--ops-r-card)] border border-ops-line bg-ops-surface p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-body font-medium text-ops-text-secondary">{s.label}</span>
              <span className="text-micro text-ops-text-tertiary">{s.basis}</span>
            </div>
            <div
              className={cn(
                "ops-figure mt-2 text-display font-medium leading-none",
                s.tone === "risk" && s.value < 0 ? "text-ops-risk-fg" : "text-ops-text",
              )}
            >
              {money(s.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--ops-r-card)] border border-ops-line bg-ops-sunken px-4 py-3">
        <span className="ops-eyebrow">Cash movement</span>
        {[
          { label: "Received", value: CASH_RECEIVED },
          { label: "Paid out", value: -CASH_PAID_OUT },
          { label: "Net", value: CASH_NET },
        ].map((r) => (
          <span key={r.label} className="flex items-baseline gap-2 text-body">
            <span className="text-ops-text-secondary">{r.label}</span>
            <Money value={r.value} className="text-body font-medium" />
          </span>
        ))}
        <span className="ml-auto text-body text-ops-text-secondary">
          Carried forward from {CLOSED_PERIODS[CLOSED_PERIODS.length - 1].label}:{" "}
          <Money value={CARRIED_FORWARD} className="font-medium" />
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* --------------------------------------------------------- */}
        {/* Unpaid obligations                                         */}
        {/* --------------------------------------------------------- */}
        <Card className="overflow-hidden">
          <CardHeader>
            <Title
              title="Unpaid obligations"
              hint={`${money(OBLIGATION_TOTAL)} total`}
            />
          </CardHeader>
          <ul className="flex-1 divide-y divide-ops-line">
            {OBLIGATIONS.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-body font-medium text-ops-text">{o.label}</span>
                    {o.overdue && <StatusPill tone="risk">Overdue</StatusPill>}
                    {o.carried && !o.overdue && <StatusPill tone="warn">Carried</StatusPill>}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <ShareBar
                      value={o.amount}
                      max={maxObligation}
                      tone={o.overdue ? "risk" : "accent"}
                      className="max-w-[160px]"
                    />
                    <span className="shrink-0 text-body text-ops-text-tertiary">{o.detail}</span>
                  </span>
                </span>
                <Money value={o.amount} tone={false} className="shrink-0 text-body font-medium text-ops-text" />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t-2 border-ops-line-strong bg-ops-sunken px-4 py-3">
            <span className="text-body font-medium text-ops-text">Total outstanding</span>
            <Money value={OBLIGATION_TOTAL} tone={false} className="text-body font-medium text-ops-text" />
          </div>
        </Card>

        {/* --------------------------------------------------------- */}
        {/* By company                                                 */}
        {/* --------------------------------------------------------- */}
        <Card className="overflow-hidden">
          <CardHeader>
            <Title title="By company" hint={`${PERIOD.label} · no revenue finalized`} />
          </CardHeader>
          <div className="ops-card-table overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-ops-line text-left">
                  <th className="ops-eyebrow px-4 py-2 font-medium">Company</th>
                  <th className="ops-eyebrow px-3 py-2 text-right font-medium">Expenses</th>
                  <th className="ops-eyebrow px-3 py-2 text-right font-medium">Revenue</th>
                  <th className="ops-eyebrow px-3 py-2 text-right font-medium">Net</th>
                  <th className="ops-eyebrow px-4 py-2 text-right font-medium">Last paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-line">
                {byCompany.map((r) => (
                  <tr key={r.id} className="h-10 hover:bg-ops-hover">
                    <td className="px-4">
                      {r.href ? (
                        <Link href={r.href} className="font-medium text-ops-text hover:text-ops-accent">
                          {r.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-ops-text-secondary">{r.name}</span>
                      )}
                    </td>
                    <td className="px-3 text-right">
                      <Money value={r.expenses} tone={false} className="text-ops-text-secondary" />
                    </td>
                    <td className="px-3 text-right text-ops-text-tertiary">{money(0)}</td>
                    <td className="px-3 text-right">
                      <Money value={-r.expenses} className="font-medium" />
                    </td>
                    <td className="px-4 text-right">
                      {r.lastPaymentAt ? (
                        <span className="text-body text-ops-text-secondary">{formatDate(r.lastPaymentAt)}</span>
                      ) : r.dormant ? (
                        /* Nothing was spent, so nothing is owed. A red "Never"
                           here reads as a receivable problem that does not
                           exist. */
                        <StatusPill tone="idle" dot={false}>
                          No activity
                        </StatusPill>
                      ) : (
                        <StatusPill tone="risk">Never paid</StatusPill>
                      )}
                    </td>
                  </tr>
                ))}
                <FillRow span={5} />
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ops-line-strong bg-ops-sunken text-body font-medium">
                  <td className="px-4 py-3 text-ops-text">Total</td>
                  <td className="px-3 py-3 text-right">
                    <Money value={EXPENSE_TOTAL} tone={false} className="text-ops-text" />
                  </td>
                  <td className="px-3 py-3 text-right text-ops-text-tertiary">{money(0)}</td>
                  <td className="px-3 py-3 text-right">
                    <Money value={-EXPENSE_TOTAL} />
                  </td>
                  <td className="px-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Recurring                                                      */}
      {/* ------------------------------------------------------------- */}
      <Card className="overflow-hidden">
        <CardHeader>
          <Title
            title="Auto-recurring entries"
            count={RECURRING.filter((r) => r.active).length}
            hint={`${money(RECURRING.reduce((n, r) => n + r.amount, 0))} posts again on ${formatDate(RECURRING[0].nextAt)}`}
          />
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-body">
            <thead>
              <tr className="border-b border-ops-line text-left">
                <th className="ops-eyebrow px-4 py-2 font-medium">Description</th>
                <th className="ops-eyebrow px-3 py-2 font-medium">Company</th>
                <th className="ops-eyebrow px-3 py-2 font-medium">Category</th>
                <th className="ops-eyebrow px-3 py-2 text-right font-medium">Amount</th>
                <th className="ops-eyebrow px-3 py-2 font-medium">Next</th>
                <th className="ops-eyebrow px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ops-line">
              {RECURRING.map((r) => (
                <tr key={r.id} className="h-10 hover:bg-ops-hover">
                  <td className="px-4 font-medium text-ops-text">{r.description}</td>
                  <td className="px-3 text-body text-ops-text-secondary">{companyName(r.companyId)}</td>
                  <td className="px-3 text-body text-ops-text-secondary">{CATEGORY_LABEL[r.category]}</td>
                  <td className="px-3 text-right">
                    <Money value={r.amount} tone={false} className="font-medium text-ops-text" />
                  </td>
                  <td className="px-3 text-body text-ops-text-secondary">
                    {formatDate(r.nextAt)} · monthly
                  </td>
                  <td className="px-4 text-right">
                    <span className="inline-flex items-center gap-2">
                      <RowAction>Pause</RowAction>
                      <RowAction>Edit</RowAction>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Revenue                                                                     */
/* -------------------------------------------------------------------------- */

function Revenue() {
  return (
    <div className="flex flex-col gap-4">
      {DRAFT_REVENUE.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--ops-r-card)] border border-ops-warn-line bg-ops-warn-bg px-4 py-3">
          <span className="size-1.5 shrink-0 rounded-full bg-ops-warn-dot" aria-hidden />
          <p className="min-w-0 flex-1 text-body text-ops-warn-fg">
            <strong className="font-medium">{money(DRAFT_REVENUE_TOTAL)}</strong> across{" "}
            {DRAFT_REVENUE.length} draft payments. Nothing counts toward revenue, cash position or the
            partner split until it is finalized, which is why the period reads {money(REVENUE_TOTAL)}.
          </p>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <Title title="Draft revenue" count={DRAFT_REVENUE.length} hint={`${money(DRAFT_REVENUE_TOTAL)} pending`} />
        </CardHeader>
        <table className="w-full text-body">
          <thead>
            <tr className="border-b border-ops-line text-left">
              <th className="ops-eyebrow px-4 py-2 font-medium">Logged</th>
              <th className="ops-eyebrow px-3 py-2 font-medium">Company</th>
              <th className="ops-eyebrow px-3 py-2 font-medium">Covers</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Amount</th>
              <th className="ops-eyebrow px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-line">
            {DRAFT_REVENUE.map((r) => (
              <tr key={r.id} className="h-11 hover:bg-ops-hover">
                <td className="px-4 font-medium text-ops-text">{formatDate(r.at)}</td>
                <td className="px-3">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ops-text">{companyName(r.companyId)}</span>
                    <StatusPill tone="warn">Draft</StatusPill>
                  </span>
                </td>
                <td className="px-3 text-body text-ops-text-secondary">{r.coversLabel}</td>
                <td className="px-3 text-right">
                  <Money value={r.amount} tone={false} className="text-body font-medium text-ops-text" />
                </td>
                <td className="px-4 text-right">
                  <span className="inline-flex items-center gap-2">
                    <RowAction>Finalize</RowAction>
                    <RowAction>Edit</RowAction>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ops-line-strong bg-ops-sunken text-body font-medium">
              <td colSpan={3} className="px-4 py-3 text-ops-text">
                Would take the period to
              </td>
              <td className="px-3 py-3 text-right">
                <Money value={DRAFT_REVENUE_TOTAL} tone={false} className="text-ops-text" />
              </td>
              <td className="px-4" />
            </tr>
          </tfoot>
        </table>
      </Card>

      <Card>
        <CardHeader>
          <Title title={`Finalized revenue · ${PERIOD.long}`} />
        </CardHeader>
        {FINALIZED_REVENUE.length === 0 ? (
          <EmptyState
            title="Nothing finalized this period"
            detail={`Finalizing a draft moves it into revenue and into the partner split. Until then ${PERIOD.label} shows ${money(0)} earned against ${money(EXPENSE_TOTAL)} spent.`}
            action={
              <Button variant="primary" size="sm">
                Finalize {DRAFT_REVENUE.length} drafts
              </Button>
            }
          />
        ) : null}
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Withdrawals                                                                 */
/* -------------------------------------------------------------------------- */

function Withdrawals() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        {PARTNERS.map((p) => {
          const cumulative = shareOf(p, CUMULATIVE_DISTRIBUTED);
          const balance = cumulative - p.withdrawn;
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-center gap-2">
                <Avatar id={p.id} name={p.name} initials={initialsOf(p.name)} />
                <span className="text-body font-medium text-ops-text">{p.name}</span>
                <span className="text-body text-ops-text-tertiary">{Math.round(p.share * 100)}% share</span>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Cumulative share", value: cumulative },
                  { label: "Withdrawn", value: p.withdrawn },
                  { label: "Balance", value: balance },
                ].map((r) => (
                  <div key={r.label}>
                    <dt className="text-body text-ops-text-tertiary">{r.label}</dt>
                    <dd className="ops-figure mt-1 text-figure font-medium leading-none">
                      <Money value={r.value} className="ops-figure" />
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 border-t border-ops-line pt-3 text-body text-ops-text-tertiary">
                {balance < 0
                  ? `A negative balance is ${p.name}'s share of accumulated losses, not money owed to ${p.name}.`
                  : `${p.name} can withdraw up to this balance.`}
              </p>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <Title
            title="Withdrawal history"
            action={
              <Button variant="default" size="sm">
                <IconPlus className="size-3.5" />
                Record withdrawal
              </Button>
            }
          />
        </CardHeader>
        <EmptyState
          title="No withdrawals recorded"
          detail="Neither partner has taken money out of the business. Record one here when they do, and it comes off the balance above."
        />
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Close period                                                                */
/* -------------------------------------------------------------------------- */

function ClosePeriod() {
  const remaining = CHECKLIST.filter((c) => !c.done).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card className="overflow-hidden">
        <CardHeader>
          <Title
            title={`Close ${PERIOD.label}`}
            hint={`${CHECKLIST.length - remaining} of ${CHECKLIST.length} complete`}
          />
        </CardHeader>

        <ol className="divide-y divide-ops-line">
          {CHECKLIST.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-body font-medium",
                  item.done
                    ? "border-ops-ok-line bg-ops-ok-bg text-ops-ok-fg"
                    : "border-ops-line-strong bg-ops-surface text-ops-text-tertiary",
                )}
              >
                {item.done ? <IconCheck className="size-3" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium text-ops-text">{item.label}</span>
                <span className="block text-body text-ops-text-tertiary">{item.detail}</span>
              </span>
              {item.amount !== undefined && (
                <Money value={item.amount} tone={false} className="shrink-0 text-body font-medium text-ops-text" />
              )}
              <Link
                href={item.href}
                className="inline-flex h-6 w-[70px] shrink-0 items-center justify-center gap-1 rounded-md border border-ops-accent-line bg-ops-accent-weak text-micro font-medium text-ops-accent hover:border-ops-accent hover:bg-ops-accent hover:text-ops-text-inverse"
              >
                {item.actionLabel}
                <IconArrowRight className="size-3" />
              </Link>
            </li>
          ))}
        </ol>

        <div className="flex items-center gap-3 border-t border-ops-line bg-ops-sunken px-4 py-3">
          <p className="min-w-0 flex-1 text-body text-ops-text-secondary">
            {remaining} items still open. Closing locks the period and rolls the balance into October.
          </p>
          <Button variant="primary" disabled>
            <IconLock className="size-3.5" />
            Close {PERIOD.label}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <Title title="If you closed now" hint="preview" />
        </CardHeader>
        <dl className="divide-y divide-ops-line">
          {[
            { label: "Revenue", value: REVENUE_TOTAL, note: `${money(DRAFT_REVENUE_TOTAL)} left in draft` },
            { label: "Expenses", value: EXPENSE_TOTAL, note: "incurred this period" },
            { label: "Distributed", value: CASH_NET, note: "cash basis", strong: true },
            { label: `${PARTNERS[0].name} 35%`, value: shareOf(PARTNERS[0], CASH_NET) },
            { label: `${PARTNERS[1].name} 65%`, value: shareOf(PARTNERS[1], CASH_NET) },
          ].map((r) => (
            <div key={r.label} className="flex items-baseline gap-3 px-4 py-3">
              <dt className="min-w-0 flex-1">
                <span className="block text-body text-ops-text">{r.label}</span>
                {r.note && <span className="block text-body text-ops-text-tertiary">{r.note}</span>}
              </dt>
              <dd>
                <Money value={r.value} className={cn("text-body", r.strong ? "font-medium" : "font-medium")} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-ops-line bg-ops-sunken px-4 py-3 text-body text-ops-text-tertiary">
          {money(OBLIGATION_TOTAL)} of obligations would carry into October, the same way{" "}
          {money(Math.abs(CARRIED_FORWARD))} carried in.
        </p>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* History                                                                     */
/* -------------------------------------------------------------------------- */

function History() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Title title="Closed periods" count={CLOSED_PERIODS.length} />
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-body">
          <thead>
            <tr className="border-b border-ops-line text-left">
              <th className="ops-eyebrow px-4 py-2 font-medium">Period</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Revenue</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Expenses</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Distributed</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Syed 35%</th>
              <th className="ops-eyebrow px-3 py-2 text-right font-medium">Kiani 65%</th>
              <th className="ops-eyebrow px-3 py-2 font-medium">Closed</th>
              <th className="ops-eyebrow px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-line">
            {CLOSED_PERIODS.map((p) => (
              <tr key={p.key} className="h-11 hover:bg-ops-hover">
                <td className="px-4">
                  <span className="flex items-center gap-2">
                    <IconLock className="size-3 text-ops-text-tertiary" />
                    <span className="font-medium text-ops-text">{p.label}</span>
                    <StatusPill tone="idle" dot={false}>
                      Locked
                    </StatusPill>
                  </span>
                </td>
                <td className="px-3 text-right">
                  <Money value={p.revenue} tone={false} className="text-ops-text-secondary" />
                </td>
                <td className="px-3 text-right">
                  <Money value={p.expenses} tone={false} className="text-ops-text-secondary" />
                </td>
                <td className="px-3 text-right">
                  <Money value={p.distributed} className="font-medium" />
                </td>
                <td className="px-3 text-right">
                  <Money value={shareOf(PARTNERS[0], p.distributed)} />
                </td>
                <td className="px-3 text-right">
                  <Money value={shareOf(PARTNERS[1], p.distributed)} />
                </td>
                <td className="px-3 text-body text-ops-text-secondary">
                  {p.closedAt ? formatDateFull(p.closedAt) : "Open"}
                </td>
                <td className="px-4 text-right">
                  <span className="inline-flex items-center gap-2">
                    <RowAction>Details</RowAction>
                    <RowAction>Reopen</RowAction>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ops-line-strong bg-ops-sunken text-body font-medium">
              <td className="px-4 py-3 text-ops-text">Carried into {PERIOD.label}</td>
              <td className="px-3 py-3 text-right">
                <Money value={CLOSED_PERIODS.reduce((n, p) => n + p.revenue, 0)} tone={false} className="text-ops-text" />
              </td>
              <td className="px-3 py-3 text-right">
                <Money value={CLOSED_PERIODS.reduce((n, p) => n + p.expenses, 0)} tone={false} className="text-ops-text" />
              </td>
              <td className="px-3 py-3 text-right">
                <Money value={CARRIED_FORWARD} />
              </td>
              <td className="px-3 py-3 text-right">
                <Money value={shareOf(PARTNERS[0], CARRIED_FORWARD)} />
              </td>
              <td className="px-3 py-3 text-right">
                <Money value={shareOf(PARTNERS[1], CARRIED_FORWARD)} />
              </td>
              <td colSpan={2} className="px-4" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

export function FinancialsView() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("tab") as TabId | null;
  const tab: TabId = requested && TAB_IDS.includes(requested) ? requested : "overview";

  const setTab = (id: string) => router.push(`/ops/financials?tab=${id}`, { scroll: false });

  return (
    <>
      <PageHeader
        title="Financials"
        detail="Revenue, profit distribution and period close"
        actions={
          <Button variant="default">
            <IconDownload className="size-3.5" />
            Export report
          </Button>
        }
        tabs={
          <Tabs
            active={tab}
            onChange={setTab}
            items={[
              { id: "overview", label: "Overview" },
              { id: "revenue", label: "Revenue", count: DRAFT_REVENUE.length },
              { id: "withdrawals", label: "Withdrawals" },
              { id: "close", label: "Close period", count: CHECKLIST.filter((c) => !c.done).length },
              { id: "history", label: "History" },
            ]}
          />
        }
      />

      <PageBody>
        {tab === "overview" && <Overview />}
        {tab === "revenue" && <Revenue />}
        {tab === "withdrawals" && <Withdrawals />}
        {tab === "close" && <ClosePeriod />}
        {tab === "history" && <History />}
      </PageBody>
    </>
  );
}
