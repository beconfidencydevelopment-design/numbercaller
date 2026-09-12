"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconPlus } from "@/components/icons";

import { cn } from "@/lib/utils";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  CompanyTag,
  EmptyState,
  FillRow,
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

/** Only three states earn attention: never paid, past the cycle, or dormant. */
function flagFor(company: Company, incurred: number) {
  if (company.lastPaymentAt === null && incurred > 0) return "risk" as const;
  if (company.expectation.includes("overdue")) return "warn" as const;
  return null;
}

/**
 * The company selector.
 *
 * It had been six names in a row with a coloured dot on two of them, which
 * broke this console's one hard rule — colour is never the only channel — and
 * made the owner click through all six to find out who owes money. The two
 * that need a decision now carry the amount, which is both the missing second
 * channel and the answer to the question the page exists to ask.
 */
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
  const flag = flagFor(company, e.incurred);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "relative flex h-14 shrink-0 items-center gap-2 border-b-2 px-3 text-body font-medium transition-colors",
        active
          ? "border-ops-accent text-ops-text"
          : "border-transparent text-ops-text-secondary hover:text-ops-text",
      )}
    >
      <CompanyTag id={company.id} name={company.name} size={24} />
      {flag && (
        <span
          className={cn(
            "ops-num inline-flex h-6 items-center rounded-[5px] px-2 text-micro font-medium",
            flag === "risk" ? "bg-ops-risk-bg text-ops-risk-fg" : "bg-ops-warn-bg text-ops-warn-fg",
          )}
        >
          {money(e.atRisk)}
          <span className="sr-only">{flag === "risk" ? " never paid" : " overdue"}</span>
        </span>
      )}
    </button>
  );
}

/**
 * The exposure tile.
 *
 * Label, one figure, one caption — the same contract the headline figures on
 * Home use, so a client profile and the dashboard speak one language. Tone
 * colours the number, never the card: a fully tinted surface is a shout, and
 * this screen only has one thing worth shouting about at a time.
 */
function Figure({
  label,
  value,
  caption,
  badge,
  tone = "neutral",
}: {
  label: string;
  value: string;
  caption: React.ReactNode;
  badge?: React.ReactNode;
  tone?: "neutral" | "warn" | "risk";
}) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-body font-medium text-ops-text-secondary">{label}</span>
        {badge}
      </div>
      <div
        className={cn(
          "ops-figure text-display font-medium leading-none",
          tone === "risk" ? "text-ops-risk-fg" : tone === "warn" ? "text-ops-warn-fg" : "text-ops-text",
        )}
      >
        {value}
      </div>
      <div className="mt-auto text-body text-ops-text-tertiary">{caption}</div>
    </Card>
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

  /**
   * Nothing spent means nothing owed.
   *
   * "Never paid" on a company that has never been invoiced a dollar reads as
   * a receivable problem that does not exist, and Canpar opened on a red pill
   * beside four zeroes. Financials already made this distinction in its By
   * company table; the client profile now makes the same one.
   */
  const paymentStatus =
    e.incurred === 0
      ? payments.length === 0
        ? { tone: "idle" as const, label: "No activity" }
        : /* Paid in the past, nothing running now. "On cycle" would claim a
             relationship that stopped in August. */
          { tone: "idle" as const, label: "Dormant" }
      : active.lastPaymentAt === null
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
            <IconPlus className="size-3.5" />
            Add company
          </Button>
        }
        tabs={
          <div
            role="tablist"
            aria-label="Client companies"
            className="-mb-1 flex items-center gap-1 overflow-x-auto"
          >
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
        {/* ------------------------------------------------------------- */}
        {/* Exposure                                                       */}
        {/*                                                                */}
        {/* Four tiles of equal weight. The at-risk figure used to sit on a
            fully tinted red card, which made one of four cards shout on a
            screen the client asked to feel calm; the colour now rides the
            number and the pill, where it is just as unmissable.

            The third tile used to read "Lifetime net". For a client that has
            never paid, net is the at-risk figure with a minus in front of it,
            so the default view of this page opened on the same number twice.
            Received to date can never be that duplicate, and a $0 against a
            $12,017 spend is the whole story of this account in one line.    */}
        {/* ------------------------------------------------------------- */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Figure
            label="Spent this period"
            value={money(e.sep)}
            /* The bare label reads "21.1% vs last month" whether the spend
               rose or fell, which on a cost figure is the half that matters.
               Only the comparison sentences take a direction; "New this
               period" and "No activity" already carry their own. */
            caption={
              change.dir !== "flat" && change.label.endsWith("vs last month")
                ? `${change.dir === "up" ? "Up" : "Down"} ${change.label}`
                : change.label
            }
          />

          <Figure
            label="At risk"
            value={money(e.atRisk)}
            /* Colour follows the status, not the size of the number. A client
               on cycle carries a balance every period; painting that red beside
               a green "On cycle" pill made the tile argue with itself. Red is
               reserved for a client that has never paid, gold for one past its
               cycle. */
            tone={paymentStatus.tone === "risk" ? "risk" : paymentStatus.tone === "warn" ? "warn" : "neutral"}
            badge={<StatusPill tone={paymentStatus.tone}>{paymentStatus.label}</StatusPill>}
            caption={
              /* Zero at risk comes first. Staples has been paid in full and
                 has spent nothing since, and the old order still captioned it
                 "Unpaid since Aug 18" beside a $0 figure. */
              e.atRisk === 0
                ? "No outstanding exposure"
                : active.lastPaymentAt === null
                  ? `Every dollar since ${formatMonth(active.onboardedAt)}`
                  : `Unpaid since ${formatDate(active.lastPaymentAt)}`
            }
          />

          <Figure
            label="Received to date"
            value={money(e.received)}
            caption={`${money(e.net, { signed: true })} net · ${money(e.incurred)} incurred`}
          />

          <Figure
            label="Active drivers"
            value={String(drivers.length)}
            caption={
              drivers.length === 0 ? (
                "None assigned"
              ) : (
                <span className="flex items-center gap-1">
                  {drivers.slice(0, 5).map((d) => (
                    <Avatar key={d.id} id={d.id} name={d.name} initials={initialsOf(d.name)} />
                  ))}
                  {drivers.length > 5 && (
                    <span className="text-ops-text-tertiary">+{drivers.length - 5}</span>
                  )}
                </span>
              )
            }
          />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Payment status                                                 */}
        {/* ------------------------------------------------------------- */}
        {/* The metadata used to float in the middle of this strip as two
            unlabelled pairs at a different baseline to everything around
            them. It is a definition list now, on one baseline, fenced by
            hairlines — the console's own language for a row of facts.

            This is also the page's one primary action. Recording a payment
            answers exactly the sentence this strip states, and it had been
            printed three times on one screen: here, in the Payments received
            header, and again inside that card's empty state. */}
        <Card className="flex-row flex-wrap items-center gap-x-6 gap-y-4 px-4 py-4">
          {/* A floor on the sentence, so a 1024 laptop wraps the metadata and
              the button onto their own line instead of squeezing "Payment
              status" into two. */}
          <div className="min-w-[320px] flex-1">
            <div className="flex items-center gap-2">
              <span className="ops-eyebrow">Payment status</span>
              <StatusPill tone={paymentStatus.tone}>{paymentStatus.label}</StatusPill>
            </div>
            <p className="mt-2 text-body font-medium text-ops-text">
              {active.lastPaymentAt === null
                ? e.incurred === 0
                  ? `Nothing invoiced or spent · onboarded ${formatMonth(active.onboardedAt)}`
                  : `No payment on record · onboarded ${formatMonth(active.onboardedAt)}`
                : `Last paid ${daysAgo(active.lastPaymentAt)} · ${formatDate(active.lastPaymentAt)}`}
            </p>
            <p className="mt-1 text-body text-ops-text-secondary">{active.expectation}</p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-4">
            <dl className="flex items-center divide-x divide-dashed divide-ops-line border-x border-dashed border-ops-line">
              {[
                { k: "Cycle", v: CYCLE_LABEL[active.cycle] },
                { k: "Entries", v: String(entries.length) },
                { k: "Onboarded", v: formatMonth(active.onboardedAt) },
              ].map((f) => (
                <div key={f.k} className="px-5">
                  <dt className="ops-eyebrow">{f.k}</dt>
                  <dd className="ops-num mt-1 text-body font-medium text-ops-text">{f.v}</dd>
                </div>
              ))}
            </dl>

            <Button variant="primary" size="sm">
              <IconPlus className="size-3.5" />
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
            <div className="ops-card-table">
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
                        <td className="px-4 py-3 font-medium text-ops-text">{CATEGORY_LABEL[r.category]}</td>
                        {[r.jul, r.aug, r.sep].map((v, i) => (
                          <td key={i} className="px-3 py-3 text-right">
                            <Money
                              value={v}
                              tone={false}
                              className={v === 0 ? "text-ops-text-tertiary" : "text-ops-text-secondary"}
                            />
                          </td>
                        ))}
                        {/* The bar sits beside the number it encodes rather
                          than under the label three columns away, which is
                          how the Companies table on Home reads. */}
                        <td className="px-4 py-3">
                          <span className="flex items-center justify-end gap-3">
                            <ShareBar value={total} max={maxRow} className="hidden h-1 w-20 xl:block" />
                            <Money
                              value={total}
                              tone={false}
                              className="w-20 text-right font-medium text-ops-text"
                            />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <FillRow span={5} />
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
            </div>
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
              <div className="ops-card-table max-h-[380px] overflow-y-auto">
                <table className="w-full text-body">
                  <thead className="ops-sticky-head">
                    <tr className="text-left">
                      <th className="ops-eyebrow border-b border-ops-line px-4 py-2 font-medium">Driver</th>
                      <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-medium">
                        Entries
                      </th>
                      <th className="ops-eyebrow border-b border-ops-line px-3 py-2 text-right font-medium">
                        Logged
                      </th>
                      <th className="ops-eyebrow border-b border-ops-line px-4 py-2 text-right font-medium">
                        Outstanding
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ops-line">
                    {drivers.map((d) => (
                      <tr key={d.id} className="h-10 hover:bg-ops-hover">
                        <td className="px-4">
                          <span className="flex items-center gap-2">
                            <Avatar id={d.id} name={d.name} initials={initialsOf(d.name)} />
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
                            <Money
                              value={outstandingFor(d)}
                              tone={false}
                              className="font-medium text-ops-text"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    <FillRow span={4} />
                  </tbody>
                  {/* The card sits beside a table that ends in a total, so it
                      ends in one too. The figures are the column sums it
                      already prints; without them the card ran out halfway and
                      left its own footprint of white. */}
                  <tfoot>
                    <tr className="border-t-2 border-ops-line-strong bg-ops-sunken font-medium">
                      <td className="px-4 py-3 text-ops-text">
                        {drivers.length} {drivers.length === 1 ? "driver" : "drivers"}
                      </td>
                      <td className="ops-num px-3 py-3 text-right text-ops-text">
                        {drivers.reduce((n, d) => n + d.entries, 0)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Money
                          value={drivers.reduce((n, d) => n + d.logged, 0)}
                          tone={false}
                          className="text-ops-text"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money
                          value={drivers.reduce((n, d) => n + outstandingFor(d), 0)}
                          tone={false}
                          className="text-ops-text"
                        />
                      </td>
                    </tr>
                  </tfoot>
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
            {/* No action here. The strip above states this client's payment
                situation and carries the one button that answers it; a second
                copy 400px below it is not a second affordance, it is noise. */}
            <SectionTitle
              title="Payments received"
              count={payments.length}
              hint={payments.length > 0 ? `${money(e.received)} to date` : undefined}
            />
          </CardHeader>
          {payments.length === 0 ? (
            /* The old copy here repeated the strip's expectation sentence
               word for word. This says the one thing the strip does not: how
               much has gone out with nothing coming back. */
            <EmptyState
              className="py-10"
              title="No payments on record"
              detail={
                e.incurred === 0
                  ? `Nothing has been spent servicing ${active.name}, so there is nothing outstanding against it.`
                  : `${money(e.incurred)} has been spent servicing ${active.name} and nothing has been received against it.`
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
                      {formatDate(p.coversFrom)} to {formatDate(p.coversTo)}
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
