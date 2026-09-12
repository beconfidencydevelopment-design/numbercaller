/**
 * Domain model for the SNK Courier operations console.
 *
 * SNK is a courier *contractor*: it supplies drivers to client companies
 * (Intelcom, Precision, Rona, Napa, Staples, Canpar), pays those drivers and
 * the fleet costs up front, and invoices the companies on their own cycles.
 *
 * The modelling decision that matters: **money has two bases and the product
 * shows both.** Expenses are recorded when incurred (accrual); cash position
 * and partner shares move when money actually changes hands. A figure that
 * does not say which basis it is on is the single biggest source of confusion
 * in this product, so every money-bearing type below carries it.
 */

export type StatusTone = "ok" | "move" | "warn" | "risk" | "idle";

export type ExpenseCategory =
  | "driver_pay"
  | "vehicle_rent"
  | "fuel"
  | "maintenance"
  | "insurance"
  | "other";

export type ExpenseStatus = "outstanding" | "settled" | "paid";

export type PaymentCycle = "biweekly" | "monthly" | "irregular";

export type PaymentMethod = "direct_deposit" | "cheque" | "transfer";

export interface Company {
  id: string;
  name: string;
  cycle: PaymentCycle;
  /** Month the company was onboarded, as a timestamp for that month's first. */
  onboardedAt: number;
  /** Null means the company has never paid — the sharpest signal in the set. */
  lastPaymentAt: number | null;
  /** Free text the client's build shows under payment status. */
  expectation: string;
}

export interface Driver {
  id: string;
  name: string;
  companyId: string;
  /** Entries logged against this driver in the open period. */
  entries: number;
  /** Value of those entries. */
  logged: number;
  /** Unsettled balance rolled in from a prior period. */
  carried: number;
  /** Paid out to the driver in this period. */
  settled: number;
  /** Null when no entry carries a date — rendered as an em dash, never as
      "no entries logged" next to a non-zero entry count. */
  lastEntryAt: number | null;
}

export interface ExpenseEntry {
  id: string;
  at: number;
  companyId: string;
  category: ExpenseCategory;
  driverId: string | null;
  description: string;
  amount: number;
  status: ExpenseStatus;
  /** Bills can be marked paid; driver pay is cleared by settling the driver. */
  payable: boolean;
}

export interface Payment {
  id: string;
  companyId: string;
  at: number;
  amount: number;
  method: PaymentMethod;
  coversFrom: number;
  coversTo: number;
}

export type RevenueState = "draft" | "finalized";

export interface RevenueEntry {
  id: string;
  at: number;
  companyId: string;
  coversLabel: string;
  amount: number;
  state: RevenueState;
}

export interface RecurringEntry {
  id: string;
  description: string;
  companyId: string;
  category: ExpenseCategory;
  amount: number;
  frequency: "monthly";
  nextAt: number;
  active: boolean;
}

export interface PeriodSummary {
  /** "2026-09" */
  key: string;
  label: string;
  /** Accrual: invoiced/finalized revenue for the period. */
  revenue: number;
  /** Accrual: expenses incurred in the period. */
  expenses: number;
  /**
   * The figure the business distributes on.
   *
   * For a closed period where everything settled, this equals
   * `revenue - expenses`. For an open or partly-settled period it does not,
   * because unpaid obligations have not left the bank yet. The console always
   * labels which basis a profit figure is on rather than letting the reader
   * assume the subtraction.
   */
  distributed: number;
  basis: "cash" | "accrual";
  closedAt: number | null;
  locked: boolean;
}

export interface Partner {
  id: string;
  name: string;
  /** 0–1. */
  share: number;
  withdrawn: number;
}

export interface ActivityEvent {
  id: string;
  at: number;
  /** Person id, for the portrait lookup. */
  actorId: string;
  actor: string;
  summary: string;
  amount: number | null;
  entries: number;
  tone: StatusTone;
}

export interface Obligation {
  id: string;
  label: string;
  detail: string;
  amount: number;
  overdue: boolean;
  /** Carried in from a period that is already closed. */
  carried: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  /** Money the item is holding up, where it holds up money. */
  amount?: number;
  done: boolean;
  actionLabel: string;
  href: string;
}
