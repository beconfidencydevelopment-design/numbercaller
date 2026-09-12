"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Money,
  SectionTitle,
  ShareBar,
  StatusPill,
} from "./primitives";
import { PageBody, PageHeader } from "./page-header";
import {
  CATEGORY_LABEL,
  COMPANIES,
  companyHistory,
  CYCLE_LABEL,
  METHOD_LABEL,
  driversFor,
  expensesFor,
  outstandingFor,
  paymentsFor,
} from "@/lib/ops/data";
import type { Company } from "@/lib/ops/types";
import { daysAgo, delta, formatDate, formatMonth, initialsOf, money } from "@/lib/ops/format";

/**
 * Exposure for a company: what SNK has spent servicing it that the company
 * has not paid for. For a client that has never paid, that is the entire
 * relationship — which is why it leads the profile rather than sitting in a
 * table three screens down.
 */
function exposureFor(company: Company) {
  const h = companyHistory(company.id);
  return {
    ...h,
    received: h.revenueReceived,
    /**
     * A client that has never paid puts every dollar ever spent on it at
     * risk, not just this period's. For a client on cycle, the exposure is
     * what has been incurred since its last payment.
     */
    atRisk: company.lastPaymentAt === null ? h.incurred : h.sep,
  };
}

function CompanyTab({
  company,
  active,
  onSelect,
}: {
  company: Company;
  active: boolean;
  onSelect: () => void;
}) {
  const e = exposureFor(company);
  // A dot means "this one needs a decision", and only three states earn it:
  // never paid, past the cycle, or dormant.
  const flag =
    company.lastPaymentAt === null && e.incurred > 0
      ? "risk"
      : company.expectation.includes("overdue")
        ? "warn"
        : null;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "relative flex h-9 shrink-0 items-center gap-2 border-b-2 px-3 text-body font-medium transition-colors",
        active ? "border-ops-accent text-ops-text" : "border-transparent text-ops-text-secondary hover:text-ops-text",
      )}
    >
      {company.name}
      {flag && (
        <span
          className={cn("size-1.5 rounded-full", flag === "risk" ? "bg-ops-risk-dot" : "bg-ops-warn-dot")}
          aria-label={flag === "risk" ? "never paid" : "overdue"}
        />
      )}
    </button>
  );
}

export function ClientsView() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("company");
  const active = COMPANIES.find((c) => c.id === requested) ?? COMPANIES[0];

  const e = exposureFor(active);
  const history = companyHistory(active.id);
  const drivers = driversFor(active.id);
  const payments = paymentsFor(active.id);
  const entries = expensesFor(active.id);
  const change = delta(e.sep, e.aug);
  const maxRow = Math.max(...history.rows.map((r) => r.jul + r.aug + r.sep), 1);

  const select = (id: string) => router.push(`/ops/clients?company=${id}`, { scroll: false });

  const paymentStatus =
    active.lastPaymentAt === null
      ? { tone: "risk" as const, label: "Never paid" }
      : active.expectation.includes("overdue")
        ? { tone: "warn" as const, label: "Overdue" }
        : { tone: "ok" as const, label: "On cycle" };

  return (
    <>
      <PageHeader
        title="Clients"
        detail="Company profiles, exposure and payment history"
        actions={
          <Button variant="primary">
            <Plus className="size-3.5" />
            Add company
          </Button>
        }
        tabs={
          <div role="tablist" aria-label="Client companies" className="-mb-1 flex items-center gap-1 overflow-x-auto">
            {COMPANIES.map((c) => (
              <CompanyTab key={c.id} company={c} active={c.id === active.id} onSelect={() => select(c.id)} />
            ))}
          </div>
        }
      />

      <PageBody className="flex flex-col gap-4">
        {/* ------------------------------------------------------------- */}
        {/* Exposure                                                       */}
        {/* ------------------------------------------------------------- */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[var(--ops-r-card)] border border-ops-line bg-ops-surface p-4">
            <div className="text-body font-medium text-ops-text-secondary">Spent this period</div>
            <div className="ops-figure mt-2 text-display font-medium leading-none text-ops-text">
              {money(e.sep)}
            </div>
            <div className="mt-2 text-body text-ops-text-tertiary">{change.label}</div>
          </div>

          <div
            className={cn(
              "rounded-[var(--ops-r-card)] border p-4",
              e.atRisk > 0 ? "border-ops-risk-line bg-ops-risk-bg" : "border-ops-line bg-ops-surface",
            )}
          >
            <div className={cn("text-body font-medium", e.atRisk > 0 ? "text-ops-risk-fg" : "text-ops-text-secondary")}>
              At risk
            </div>
            <div
              className={cn(
                "ops-figure mt-2 text-display font-medium leading-none",
                e.atRisk > 0 ? "text-ops-risk-fg" : "text-ops-text",
              )}
            >
              {money(e.atRisk)}
            </div>
            <div className={cn("mt-2 text-body", e.atRisk > 0 ? "text-ops-risk-fg/80" : "text-ops-text-tertiary")}>
              {active.lastPaymentAt === null
                ? e.incurred > 0
                  ? `Never paid — every dollar since ${formatMonth(active.onboardedAt)}`
                  : "No outstanding exposure"
                : `Unpaid since ${formatDate(active.lastPaymentAt)}`}
            </div>
          </div>

          <div className="rounded-[var(--ops-r-card)] border border-ops-line bg-ops-surface p-4">
            <div className="text-body font-medium text-ops-text-secondary">Lifetime net</div>
            <div className="ops-figure mt-2 text-display font-medium leading-none">
              <Money value={e.net} positiveTone className="ops-figure" />
            </div>
            <div className="mt-2 text-body text-ops-text-tertiary">
              {money(e.received)} received · {money(e.incurred)} incurred
            </div>
          </div>

          <div className="rounded-[var(--ops-r-card)] border border-ops-line bg-ops-surface p-4">
            <div className="text-body font-medium text-ops-text-secondary">Active drivers</div>
            <div className="ops-figure mt-2 text-display font-medium leading-none text-ops-text">
              {drivers.length}
            </div>
            <div className="mt-2 flex items-center gap-1">
              {drivers.slice(0, 5).map((d) => (
                <Avatar key={d.id} initials={initialsOf(d.name)} className="size-6 text-micro" />
              ))}
              {drivers.length > 5 && (
                <span className="text-body text-ops-text-tertiary">+{drivers.length - 5}</span>
              )}
              {drivers.length === 0 && <span className="text-body text-ops-text-tertiary">None assigned</span>}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Payment status                                                 */}
        {/* ------------------------------------------------------------- */}
        <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="ops-eyebrow">Payment status</span>
              <StatusPill tone={paymentStatus.tone}>{paymentStatus.label}</StatusPill>
            </div>
            <p className="mt-2 text-body font-medium text-ops-text">
              {active.lastPaymentAt === null
                ? `No payment on record · onboarded ${formatMonth(active.onboardedAt)}`
                : `Last paid ${daysAgo(active.lastPaymentAt)} · ${formatDate(active.lastPaymentAt)}`}
            </p>
            <p className="mt-1 text-body text-ops-text-secondary">{active.expectation}</p>
          </div>
          <dl className="flex items-center gap-6">
            <div>
              <dt className="text-body text-ops-text-tertiary">Cycle</dt>
              <dd className="text-body font-medium text-ops-text">{CYCLE_LABEL[active.cycle]}</dd>
            </div>
            <div>
              <dt className="text-body text-ops-text-tertiary">Entries</dt>
              <dd className="ops-num text-body font-medium text-ops-text">{entries.length}</dd>
            </div>
          </dl>
          <div className="ml-auto">
            <Button variant="primary" size="sm">
              <Plus className="size-3.5" />
              Record payment
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* ----------------------------------------------------------- */}
          {/* Category breakdown                                           */}
          {/* ----------------------------------------------------------- */}
          <Card className="overflow-hidden">
            <CardHeader>
              <SectionTitle title="Expense by category" hint="last three periods" />
            </CardHeader>
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-ops-line text-left">
                  <th className="ops-eyebrow px-4 py-2 font-medium">Category</th>
                  <th className="ops-eyebrow px-3 py-2 text-right font-medium">Jul</th>
                  <th className="ops-eyebrow px-3 py-2 text-right font-medium">Aug</th>
                  <th className="ops-eyebrow px-3 py-2 text-right font-medium">Sep</th>
                  <th className="ops-eyebrow px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-line">
                {history.rows.map((r) => {
                  const total = r.jul + r.aug + r.sep;
                  return (
                    <tr key={r.category} className="hover:bg-ops-hover">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ops-text">{CATEGORY_LABEL[r.category]}</div>
                        <ShareBar value={total} max={maxRow} className="mt-2 max-w-[150px]" />
                      </td>
                      {[r.jul, r.aug, r.sep].map((v, i) => (
                        <td key={i} className="px-3 py-3 text-right">
                          <Money
                            value={v}
                            tone={false}
                            className={v === 0 ? "text-ops-text-tertiary" : "text-ops-text-secondary"}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <Money value={total} tone={false} className="font-medium text-ops-text" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ops-line-strong bg-ops-sunken text-body font-medium">
                  <td className="px-4 py-3 text-ops-text">Total</td>
                  <td className="px-3 py-3 text-right">
                    <Money value={e.jul} tone={false} className="text-ops-text" />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Money value={e.aug} tone={false} className="text-ops-text" />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Money value={e.sep} tone={false} className="text-ops-text" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Money value={e.incurred} tone={false} className="text-ops-text" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>

          {/* ----------------------------------------------------------- */}
          {/* Drivers on this account                                      */}
          {/* ----------------------------------------------------------- */}
          <Card className="overflow-hidden">
            <CardHeader>
              <SectionTitle title="Drivers on this account" count={drivers.length} />
            </CardHeader>
            {drivers.length === 0 ? (
              <EmptyState
                title="No drivers assigned"
                detail={`${active.name} has no drivers on the roster, which is why there are no entries against it this period.`}
              />
            ) : (
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full text-body">
                  <thead className="ops-sticky-head">
                    <tr className="text-left">
                      <th className="ops-eyebrow border-b border-ops-line px-4 py-2 font-medium">Driver</th>
                      <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-medium">Entries</th>
                      <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-medium">Logged</th>
                      <th className="ops-eyebrow border-b border-ops-line px-4 py-2 text-right font-medium">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ops-line">
                    {drivers.map((d) => (
                      <tr key={d.id} className="h-10 hover:bg-ops-hover">
                        <td className="px-4">
                          <span className="flex items-center gap-2">
                            <Avatar initials={initialsOf(d.name)} className="size-6 text-micro" />
                            <span className="font-medium text-ops-text">{d.name}</span>
                          </span>
                        </td>
                        <td className="ops-num px-3 text-right text-ops-text-secondary">{d.entries}</td>
                        <td className="px-3 text-right">
                          <Money value={d.logged} tone={false} className="text-ops-text-secondary" />
                        </td>
                        <td className="px-4 text-right">
                          {outstandingFor(d) === 0 ? (
                            <StatusPill tone="ok">Settled</StatusPill>
                          ) : (
                            <Money value={outstandingFor(d)} tone={false} className="font-medium text-ops-text" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Payments received                                              */}
        {/* ------------------------------------------------------------- */}
        <Card className="overflow-hidden">
          <CardHeader>
            <SectionTitle
              title="Payments received"
              count={payments.length}
              action={
                <Button variant="default" size="sm">
                  <Plus className="size-3.5" />
                  Record payment
                </Button>
              }
            />
          </CardHeader>
          {payments.length === 0 ? (
            <EmptyState
              title="No payments on record"
              detail={
                active.lastPaymentAt === null
                  ? `${active.name} has been invoiced nothing and paid nothing since ${formatMonth(active.onboardedAt)}. ${active.expectation}.`
                  : active.expectation
              }
              action={
                <Button variant="primary" size="sm">
                  <Plus className="size-3.5" />
                  Record payment
                </Button>
              }
            />
          ) : (
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-ops-line text-left">
                  <th className="ops-eyebrow px-4 py-2 font-medium">Date</th>
                  <th className="ops-eyebrow px-3 py-2 font-medium">Method</th>
                  <th className="ops-eyebrow px-3 py-2 font-medium">Covers</th>
                  <th className="ops-eyebrow px-4 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-line">
                {payments.map((p) => (
                  <tr key={p.id} className="h-10 hover:bg-ops-hover">
                    <td className="px-4 font-medium text-ops-text">{formatDate(p.at)}</td>
                    <td className="px-3 text-body text-ops-text-secondary">{METHOD_LABEL[p.method]}</td>
                    <td className="px-3 text-body text-ops-text-secondary">
                      {formatDate(p.coversFrom)} – {formatDate(p.coversTo)}
                    </td>
                    <td className="px-4 text-right">
                      <Money value={p.amount} tone={false} className="font-medium text-ops-text" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </PageBody>
    </>
  );
}
