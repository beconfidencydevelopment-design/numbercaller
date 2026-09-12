"use client";

import * as React from "react";
import { IconCheck, IconPlus } from "@/components/icons";
import { Avatar, Button, CompanyTag, StatusPill } from "./primitives";
import { Effect, Field, FieldRow, Modal, ModalFooter, MoneyField, ScopeToggle } from "./modal";
import {
  CASH_NET,
  CASH_RECEIVED,
  CATEGORY_LABEL,
  CLOSED_PERIODS,
  DRAFT_REVENUE,
  DRAFT_REVENUE_TOTAL,
  COMPANIES,
  CUMULATIVE_DISTRIBUTED,
  DRIVERS,
  DRIVERS_SETTLED,
  DRIVER_OUTSTANDING_TOTAL,
  EXPENSE_TOTAL,
  GLOBAL_COMPANY,
  METHOD_LABEL,
  NOW,
  PARTNERS,
  PERIOD,
  REVENUE_TOTAL,
  companyHistory,
  companyName,
  driverById,
  isSettled,
  outstandingFor,
  shareOf,
} from "@/lib/ops/data";
import type { ExpenseCategory, PaymentMethod } from "@/lib/ops/types";
import { formatMonth, fromDateInput, initialsOf, money, toDateInput } from "@/lib/ops/format";

/* -------------------------------------------------------------------------- */
/* What a modal is, and how anything opens one                                 */
/* -------------------------------------------------------------------------- */

export type ModalRequest =
  | { kind: "log-expense"; companyId?: string }
  | { kind: "record-payment"; companyId?: string }
  | { kind: "settle-driver"; driverId?: string; all?: boolean }
  | { kind: "record-withdrawal"; partnerId?: string }
  | { kind: "finalize-revenue"; revenueId?: string; all?: boolean };

const ModalContext = React.createContext<(r: ModalRequest) => void>(() => {});

/** `const open = useOpsModal(); open({ kind: "settle-driver", driverId })`. */
export function useOpsModal() {
  return React.useContext(ModalContext);
}

export function OpsModals({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = React.useState<ModalRequest | null>(null);
  const open = React.useCallback((r: ModalRequest) => setRequest(r), []);
  const close = React.useCallback(() => setRequest(null), []);

  return (
    <ModalContext.Provider value={open}>
      {children}
      {request?.kind === "log-expense" && <LogExpense request={request} onClose={close} />}
      {request?.kind === "record-payment" && <RecordPayment request={request} onClose={close} />}
      {request?.kind === "settle-driver" && <SettleDriver request={request} onClose={close} />}
      {request?.kind === "record-withdrawal" && <RecordWithdrawal request={request} onClose={close} />}
      {request?.kind === "finalize-revenue" && <FinalizeRevenue request={request} onClose={close} />}
    </ModalContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared behaviour                                                            */
/* -------------------------------------------------------------------------- */

const TODAY = toDateInput(NOW);

/** Amount parsing that treats an empty box as zero rather than as NaN. */
const amountOf = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Nothing may be dated after the console's clock.
 *
 * The ledger gate asserts that no row in the demo is dated in the future, and
 * a form that can create one is a form that can break the thing the gate is
 * protecting. It is also just true of a book of account: you cannot log an
 * expense you have not incurred yet.
 */
const futureError = (value: string) =>
  fromDateInput(value) > NOW + 43_200_000 ? "That date has not happened yet." : undefined;

/** `$12,427` until there is a change to show, then `$12,427 → $12,707`. */
const shift = (from: number, to: number) => (from === to ? money(from) : `${money(from)} → ${money(to)}`);

/**
 * The state every form ends in.
 *
 * These forms hand a typed payload to a submit handler; the demo ledger it
 * would post to is frozen on purpose, because half the value of this console
 * is that the same figure reconciles across five screens and a live mutation
 * would quietly break that. So the form confirms exactly what it captured and
 * says where it would land, which is the part a client needs to sign off.
 */
function Recorded({
  title,
  rows,
  onClose,
  again,
}: {
  title: string;
  rows: Array<{ label: string; value: React.ReactNode; strong?: boolean }>;
  onClose: () => void;
  again?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ops-ok-bg text-ops-ok-fg">
          <IconCheck className="size-4" />
        </span>
        <p className="text-body font-medium text-ops-text">{title}</p>
      </div>
      <div className="mt-5">
        <Effect rows={rows} />
      </div>
      <p className="mt-4 text-body text-ops-text-tertiary">
        Demo data is fixed so that every figure reconciles across the console, so nothing here is
        written to the ledger.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        {again && (
          <Button variant="default" size="sm" onClick={again}>
            <IconPlus className="size-3.5" />
            Log another
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Log expense                                                              */
/* -------------------------------------------------------------------------- */

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ExpenseCategory[];

function LogExpense({ request, onClose }: { request: Extract<ModalRequest, { kind: "log-expense" }>; onClose: () => void }) {
  const [done, setDone] = React.useState<null | { amount: number; company: string; category: ExpenseCategory }>(null);
  const [at, setAt] = React.useState(TODAY);
  const [companyId, setCompanyId] = React.useState(request.companyId ?? COMPANIES[0].id);
  const [category, setCategory] = React.useState<ExpenseCategory>("driver_pay");
  const [driverId, setDriverId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [tried, setTried] = React.useState(false);

  /* Driver pay is owed to a person; a bill is owed by the business. The
     client's own ledger makes that distinction through the driver field, so
     the field appears and is required for exactly one category. */
  const needsDriver = category === "driver_pay";
  const roster = DRIVERS.filter((d) => d.companyId === companyId);
  const value = amountOf(amount);

  const errors = {
    at: futureError(at),
    driver: needsDriver && !driverId ? "Driver pay has to name the driver it is owed to." : undefined,
    description: description.trim() === "" ? "Say what this entry is for." : undefined,
    amount: value <= 0 ? "Enter an amount above zero." : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  /* A driver who does not work for the selected company cannot be paid by it. */
  if (driverId && !roster.some((d) => d.id === driverId)) setDriverId("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    setDone({ amount: value, company: companyName(companyId), category });
  };

  const reset = () => {
    setDone(null);
    setDescription("");
    setAmount("");
    setTried(false);
  };

  return (
    <Modal
      title="Log expense"
      detail={done ? undefined : `Against ${PERIOD.label}, which is still open.`}
      onClose={onClose}
      width="lg"
    >
      {done ? (
        <Recorded
          title={`${money(done.amount)} logged against ${done.company}.`}
          rows={[
            { label: "Category", value: CATEGORY_LABEL[done.category] },
            { label: `${PERIOD.label} expenses`, value: shift(EXPENSE_TOTAL, EXPENSE_TOTAL + done.amount) },
            ...(done.category === "driver_pay" && driverId
              ? [
                  {
                    label: `${driverById(driverId)?.name ?? "Driver"} outstanding`,
                    value: shift(outstandingFor(driverById(driverId)!), outstandingFor(driverById(driverId)!) + done.amount),
                    strong: true,
                  },
                ]
              : [{ label: "Unpaid bills", value: `${money(done.amount)} added`, strong: true }]),
          ]}
          onClose={onClose}
          again={reset}
        />
      ) : (
        <form id="log-expense" onSubmit={submit} className="flex flex-col gap-4">
          <FieldRow>
            <Field label="Date" error={show("at")}>
              {(p) => <input {...p} type="date" max={TODAY} value={at} onChange={(e) => setAt(e.target.value)} />}
            </Field>
            <Field label="Company">
              {(p) => (
                <select {...p} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                  {COMPANIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value={GLOBAL_COMPANY.id}>{GLOBAL_COMPANY.name} (own costs)</option>
                </select>
              )}
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Category">
              {(p) => (
                <select {...p} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field
              label="Driver"
              hint={needsDriver ? undefined : "Not for a bill"}
              error={show("driver")}
            >
              {(p) => (
                <select
                  {...p}
                  disabled={!needsDriver}
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className={`${p.className} disabled:bg-ops-active disabled:text-ops-text-tertiary`}
                >
                  <option value="">{needsDriver ? "Select a driver" : "Company bill"}</option>
                  {roster.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </FieldRow>

          <Field label="Description" error={show("description")}>
            {(p) => (
              <input
                {...p}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={needsDriver ? "Deliveries · 42 stops" : "Fuel card top-up"}
              />
            )}
          </Field>

          <MoneyField label="Amount" error={show("amount")} value={amount} onChange={setAmount} />

          <Effect
            rows={[
              { label: "Company", value: <CompanyTag id={companyId} name={companyName(companyId)} size={24} /> },
              {
                label: `${PERIOD.label} expenses`,
                value: shift(EXPENSE_TOTAL, EXPENSE_TOTAL + value),
                strong: true,
              },
            ]}
          />
        </form>
      )}

      {!done && (
        <div className="mt-5 flex justify-end gap-2">
          <ModalFooter onClose={onClose} submitLabel="Log expense" form="log-expense" />
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Record payment                                                           */
/* -------------------------------------------------------------------------- */

const METHODS = Object.keys(METHOD_LABEL) as PaymentMethod[];

function RecordPayment({
  request,
  onClose,
}: {
  request: Extract<ModalRequest, { kind: "record-payment" }>;
  onClose: () => void;
}) {
  const [done, setDone] = React.useState<null | { amount: number }>(null);
  const [companyId, setCompanyId] = React.useState(request.companyId ?? COMPANIES[0].id);
  const [at, setAt] = React.useState(TODAY);
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethod>("direct_deposit");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [tried, setTried] = React.useState(false);

  const company = COMPANIES.find((c) => c.id === companyId)!;
  const history = companyHistory(companyId);
  const atRisk = company.lastPaymentAt === null ? history.incurred : history.sep;
  const value = amountOf(amount);

  const errors = {
    at: futureError(at),
    amount: value <= 0 ? "Enter an amount above zero." : undefined,
    to: from && to && fromDateInput(to) < fromDateInput(from) ? "The period ends before it starts." : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (valid) setDone({ amount: value });
  };

  return (
    <Modal
      title="Record payment"
      detail={done ? undefined : "Money received from a client, against work already logged."}
      onClose={onClose}
      width="lg"
    >
      {done ? (
        <Recorded
          title={`${money(done.amount)} received from ${company.name}.`}
          rows={[
            { label: "Method", value: METHOD_LABEL[method] },
            { label: `${company.name} at risk`, value: shift(atRisk, Math.max(atRisk - done.amount, 0)), strong: true },
            { label: "Received to date", value: shift(history.revenueReceived, history.revenueReceived + done.amount) },
            { label: "Cash received this period", value: shift(CASH_RECEIVED, CASH_RECEIVED + done.amount) },
          ]}
          onClose={onClose}
        />
      ) : (
        <form id="record-payment" onSubmit={submit} className="flex flex-col gap-4">
          <FieldRow>
            <Field label="Company">
              {(p) => (
                <select {...p} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                  {COMPANIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Date received" error={show("at")}>
              {(p) => <input {...p} type="date" max={TODAY} value={at} onChange={(e) => setAt(e.target.value)} />}
            </Field>
          </FieldRow>

          <FieldRow>
            <MoneyField
              label="Amount"
              hint={atRisk > 0 ? `${money(atRisk)} at risk` : undefined}
              error={show("amount")}
              value={amount}
              onChange={setAmount}
            />
            <Field label="Method">
              {(p) => (
                <select {...p} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {METHOD_LABEL[m]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </FieldRow>

          {/* Which work the money is for. A payment that names no period is
              what makes a client's account impossible to reconcile later,
              and the client's own payment rows carry it. */}
          <FieldRow>
            <Field label="Covers from" hint="optional">
              {(p) => <input {...p} type="date" max={TODAY} value={from} onChange={(e) => setFrom(e.target.value)} />}
            </Field>
            <Field label="Covers to" hint="optional" error={show("to")}>
              {(p) => <input {...p} type="date" max={TODAY} value={to} onChange={(e) => setTo(e.target.value)} />}
            </Field>
          </FieldRow>

          <Effect
            rows={[
              {
                label: `${company.name} last paid`,
                value: company.lastPaymentAt === null ? <StatusPill tone="risk">Never paid</StatusPill> : formatMonth(company.lastPaymentAt),
              },
              {
                label: "At risk after this",
                value: shift(atRisk, Math.max(atRisk - value, 0)),
                strong: true,
              },
            ]}
          />
        </form>
      )}

      {!done && (
        <div className="mt-5 flex justify-end gap-2">
          <ModalFooter onClose={onClose} submitLabel="Record payment" form="record-payment" />
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Settle driver                                                            */
/* -------------------------------------------------------------------------- */

function SettleDriver({
  request,
  onClose,
}: {
  request: Extract<ModalRequest, { kind: "settle-driver" }>;
  onClose: () => void;
}) {
  const unsettled = DRIVERS.filter((d) => !isSettled(d));
  const [done, setDone] = React.useState<null | { amount: number; count: number }>(null);
  const [all, setAll] = React.useState(Boolean(request.all));
  const [driverId, setDriverId] = React.useState(request.driverId ?? unsettled[0]?.id ?? DRIVERS[0].id);
  const driver = driverById(driverId) ?? DRIVERS[0];
  const owed = outstandingFor(driver);

  const [amount, setAmount] = React.useState(String(owed));
  const [at, setAt] = React.useState(TODAY);
  const [tried, setTried] = React.useState(false);

  /* Switching driver re-arms the amount, because the previous driver's
     balance is meaningless against this one. */
  const [lastDriver, setLastDriver] = React.useState(driverId);
  if (lastDriver !== driverId) {
    setLastDriver(driverId);
    setAmount(String(owed));
  }

  const value = all ? DRIVER_OUTSTANDING_TOTAL : amountOf(amount);
  const errors = {
    at: futureError(at),
    amount: all
      ? undefined
      : value <= 0
        ? "Enter an amount above zero."
        : value > owed
          ? `${driver.name} is owed ${money(owed)}. Settling more than that would put the payroll out.`
          : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (valid) setDone({ amount: value, count: all ? unsettled.length : 1 });
  };

  const settledAfter = DRIVERS_SETTLED + (all ? unsettled.length : value >= owed ? 1 : 0);

  return (
    <Modal
      title={all ? "Settle all drivers" : "Settle driver"}
      detail={done ? undefined : `Driver pay for ${PERIOD.label}, plus anything carried from August.`}
      onClose={onClose}
      width="lg"
    >
      {done ? (
        <Recorded
          title={
            done.count === 1
              ? `${money(done.amount)} settled with ${driver.name}.`
              : `${money(done.amount)} settled across ${done.count} drivers.`
          }
          rows={[
            { label: "Payroll outstanding", value: shift(DRIVER_OUTSTANDING_TOTAL, DRIVER_OUTSTANDING_TOTAL - done.amount), strong: true },
            { label: "Drivers settled", value: `${DRIVERS_SETTLED} of ${DRIVERS.length} → ${settledAfter} of ${DRIVERS.length}` },
          ]}
          onClose={onClose}
        />
      ) : (
        <form id="settle-driver" onSubmit={submit} className="flex flex-col gap-4">
          {/* Settling everyone and settling one person are the same act at
              two scales, so they are one form. Two separate dialogs would
              mean two places to keep the payroll arithmetic correct. */}
          <ScopeToggle
            label="Scope"
            value={all}
            onChange={setAll}
            options={[
              { id: false, label: "One driver" },
              { id: true, label: `All ${unsettled.length} unsettled` },
            ]}
          />

          {all ? (
            <Effect
              rows={[
                { label: "Drivers", value: `${unsettled.length} unsettled` },
                { label: "Total to pay", value: money(DRIVER_OUTSTANDING_TOTAL), strong: true },
              ]}
            />
          ) : (
            <>
              <Field label="Driver">
                {(p) => (
                  <select {...p} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                    {DRIVERS.map((d) => (
                      <option key={d.id} value={d.id} disabled={isSettled(d)}>
                        {d.name} · {companyName(d.companyId)}
                        {isSettled(d) ? " (settled)" : ` · ${money(outstandingFor(d))}`}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              {/* The sum, not just the answer. Four of the eighteen drivers
                  carry a balance from August, and a settle screen that shows
                  only the total is the one place that difference matters. */}
              <Effect
                rows={[
                  {
                    label: "Driver",
                    value: (
                      <span className="flex items-center gap-2">
                        <Avatar id={driver.id} name={driver.name} initials={initialsOf(driver.name)} />
                        {driver.name}
                      </span>
                    ),
                  },
                  { label: `Logged in ${PERIOD.label}`, value: money(driver.logged) },
                  { label: "Carried from August", value: money(driver.carried) },
                  { label: "Owed", value: money(owed), strong: true },
                ]}
              />

              <FieldRow>
                <MoneyField
                  label="Amount to pay"
                  hint={`${money(owed)} owed`}
                  error={show("amount")}
                  value={amount}
                  onChange={setAmount}
                  max={owed}
                />
                <Field label="Date paid" error={show("at")}>
                  {(p) => <input {...p} type="date" max={TODAY} value={at} onChange={(e) => setAt(e.target.value)} />}
                </Field>
              </FieldRow>

              {value > 0 && value < owed && (
                <p className="text-body text-ops-warn-fg">
                  {money(owed - value)} would stay outstanding and carry into October.
                </p>
              )}
            </>
          )}
        </form>
      )}

      {!done && (
        <div className="mt-5 flex justify-end gap-2">
          <ModalFooter
            onClose={onClose}
            submitLabel={all ? `Settle ${money(DRIVER_OUTSTANDING_TOTAL)}` : "Settle driver"}
            form="settle-driver"
          />
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Record withdrawal                                                        */
/* -------------------------------------------------------------------------- */

function RecordWithdrawal({
  request,
  onClose,
}: {
  request: Extract<ModalRequest, { kind: "record-withdrawal" }>;
  onClose: () => void;
}) {
  const [done, setDone] = React.useState<null | { amount: number }>(null);
  const [partnerId, setPartnerId] = React.useState(request.partnerId ?? PARTNERS[0].id);
  const [amount, setAmount] = React.useState("");
  const [at, setAt] = React.useState(TODAY);
  const [tried, setTried] = React.useState(false);

  const partner = PARTNERS.find((p) => p.id === partnerId) ?? PARTNERS[0];
  const cumulative = shareOf(partner, CUMULATIVE_DISTRIBUTED);
  const balance = cumulative - partner.withdrawn;
  const value = amountOf(amount);

  const errors = {
    at: futureError(at),
    amount: value <= 0 ? "Enter an amount above zero." : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (valid) setDone({ amount: value });
  };

  return (
    <Modal
      title="Record withdrawal"
      detail={done ? undefined : "Money a partner has taken out of the business."}
      onClose={onClose}
    >
      {done ? (
        <Recorded
          title={`${money(done.amount)} recorded against ${partner.name}.`}
          rows={[
            { label: `${partner.name} withdrawn`, value: shift(partner.withdrawn, partner.withdrawn + done.amount) },
            { label: `${partner.name} balance`, value: shift(balance, balance - done.amount), strong: true },
          ]}
          onClose={onClose}
        />
      ) : (
        <form id="record-withdrawal" onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Partner">
            {(p) => (
              <select {...p} value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                {PARTNERS.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} · {Math.round(x.share * 100)}% share
                  </option>
                ))}
              </select>
            )}
          </Field>

          <FieldRow>
            <MoneyField label="Amount" error={show("amount")} value={amount} onChange={setAmount} />
            <Field label="Date" error={show("at")}>
              {(p) => <input {...p} type="date" max={TODAY} value={at} onChange={(e) => setAt(e.target.value)} />}
            </Field>
          </FieldRow>

          <Effect
            rows={[
              { label: "Cumulative share", value: money(cumulative) },
              { label: "Withdrawn so far", value: money(partner.withdrawn) },
              { label: "Balance after this", value: money(balance - value), strong: true },
            ]}
          />

          {/* A warning, not a block. Both partners are carrying a negative
              balance from two loss-making periods, so every withdrawal today
              is against money the business has not made. That is the owner's
              decision to take, but it should not be taken by accident. */}
          {balance < 0 && (
            <p className="text-body text-ops-warn-fg">
              {partner.name} is already {money(Math.abs(balance))} below their share of distributed
              profit, carried from {CLOSED_PERIODS.map((c) => c.label).join(" and ")}. A withdrawal
              takes that further.
            </p>
          )}
        </form>
      )}

      {!done && (
        <div className="mt-5 flex justify-end gap-2">
          <ModalFooter onClose={onClose} submitLabel="Record withdrawal" form="record-withdrawal" />
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Finalize revenue                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Finalizing is the one action on this console whose name suggests it does
 * more than it does.
 *
 * It moves a draft into revenue. It does not move a dollar. September
 * distributes on a cash basis, so the partner split and the cash position
 * only change when a client actually pays, which is a different form on a
 * different page — and the Revenue tab's own banner used to claim otherwise.
 * Saying so here, at the moment the button is under the cursor, is the whole
 * reason this dialog is worth more than a confirm().
 */
function FinalizeRevenue({
  request,
  onClose,
}: {
  request: Extract<ModalRequest, { kind: "finalize-revenue" }>;
  onClose: () => void;
}) {
  const [done, setDone] = React.useState(false);
  const [all, setAll] = React.useState(request.all ?? !request.revenueId);
  const [revenueId, setRevenueId] = React.useState(request.revenueId ?? DRAFT_REVENUE[0]?.id ?? "");

  const entry = DRAFT_REVENUE.find((r) => r.id === revenueId) ?? DRAFT_REVENUE[0];
  const value = all ? DRAFT_REVENUE_TOTAL : (entry?.amount ?? 0);
  const count = all ? DRAFT_REVENUE.length : 1;
  const draftAfter = DRAFT_REVENUE_TOTAL - value;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setDone(true);
  };

  return (
    <Modal
      title={all ? `Finalize ${DRAFT_REVENUE.length} drafts` : "Finalize revenue"}
      detail={
        done
          ? undefined
          : `Moves ${all ? "both entries" : "the entry"} into ${PERIOD.label} revenue. ${all ? "They do" : "It does"} not move cash.`
      }
      onClose={onClose}
      width="lg"
    >
      {done ? (
        <Recorded
          title={
            count === 1
              ? `${money(value)} finalized for ${companyName(entry.companyId)}.`
              : `${money(value)} finalized across ${count} entries.`
          }
          rows={[
            { label: `${PERIOD.label} revenue`, value: shift(REVENUE_TOTAL, REVENUE_TOTAL + value), strong: true },
            { label: "Still in draft", value: shift(DRAFT_REVENUE_TOTAL, draftAfter) },
            { label: "Cash position", value: `${money(CASH_NET)}, unchanged` },
          ]}
          onClose={onClose}
        />
      ) : (
        <form id="finalize-revenue" onSubmit={submit} className="flex flex-col gap-4">
          {DRAFT_REVENUE.length > 1 && (
            <ScopeToggle
              label="Scope"
              value={all}
              onChange={setAll}
              options={[
                { id: false, label: "One entry" },
                { id: true, label: `All ${DRAFT_REVENUE.length} drafts` },
              ]}
            />
          )}

          {!all && (
            <Field label="Draft entry">
              {(p) => (
                <select {...p} value={revenueId} onChange={(e) => setRevenueId(e.target.value)}>
                  {DRAFT_REVENUE.map((r) => (
                    <option key={r.id} value={r.id}>
                      {companyName(r.companyId)} · {r.coversLabel} · {money(r.amount)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}

          <Effect
            rows={[
              all
                ? { label: "Entries", value: `${DRAFT_REVENUE.length} drafts` }
                : {
                    label: "Company",
                    value: <CompanyTag id={entry.companyId} name={companyName(entry.companyId)} size={24} />,
                  },
              ...(all ? [] : [{ label: "Covers", value: entry.coversLabel }]),
              { label: `${PERIOD.label} revenue`, value: shift(REVENUE_TOTAL, REVENUE_TOTAL + value), strong: true },
              { label: "Still in draft after this", value: shift(DRAFT_REVENUE_TOTAL, draftAfter) },
            ]}
          />

          {/* The sentence this dialog exists for. */}
          <p className="text-body text-ops-text-secondary">
            The cash position stays at {money(CASH_NET)} and the partner split does not move.{" "}
            {PERIOD.label} distributes on a cash basis, so both change when {" "}
            {all ? "these clients pay" : `${companyName(entry.companyId)} pays`}, not when{" "}
            {all ? "they are" : "it is"} finalized.
          </p>
        </form>
      )}

      {!done && (
        <div className="mt-5 flex justify-end gap-2">
          <ModalFooter
            onClose={onClose}
            submitLabel={all ? `Finalize ${money(DRAFT_REVENUE_TOTAL)}` : "Finalize entry"}
            form="finalize-revenue"
          />
        </div>
      )}
    </Modal>
  );
}
