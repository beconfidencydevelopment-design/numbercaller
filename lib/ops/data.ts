import type {
  ActivityEvent,
  StatusTone,
  ChecklistItem,
  Company,
  Driver,
  ExpenseCategory,
  ExpenseEntry,
  Obligation,
  Partner,
  Payment,
  PeriodSummary,
  RecurringEntry,
  RevenueEntry,
} from "./types";

/**
 * The books, as they stand in the client's live build.
 *
 * Every figure here is transcribed from the production app rather than
 * invented, because the brief is to redesign that product, not to redesign
 * the business. Where the live build contradicted itself the *figures* were
 * kept and the *labels* corrected — each of those is marked `RECONCILED`
 * below and listed in docs/DESIGN-CONTEXT.md for the client to confirm.
 *
 * Deterministic by construction: a fixed clock, no generators, no
 * `Date.now()` and no `Math.random()` anywhere. Server and client render
 * byte-identical output, which is what keeps React from throwing a hydration
 * mismatch on every timestamp. Swap this module for the API at the same seam.
 */

/** Fixed clock: Friday 4 September 2026, 14:35 in Toronto. */
export const NOW = Date.parse("2026-09-04T18:35:00Z");

/** The open period. */
export const PERIOD = { key: "2026-09", label: "Sep 2026", long: "September 2026" };
export const PERIOD_START = Date.parse("2026-09-01T04:00:00Z");
export const PERIOD_DAYS = 30;
export const DAY_OF_PERIOD = 4;

const d = (iso: string) => Date.parse(`${iso}T12:00:00-04:00`);

/* -------------------------------------------------------------------------- */
/* Labels                                                                      */
/* -------------------------------------------------------------------------- */

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  driver_pay: "Driver Pay",
  vehicle_rent: "Vehicle Rent",
  fuel: "Fuel",
  maintenance: "Maintenance",
  insurance: "Insurance",
  other: "Other",
};

export const CYCLE_LABEL = {
  biweekly: "Biweekly",
  monthly: "Monthly",
  irregular: "Irregular",
} as const;

export const METHOD_LABEL = {
  direct_deposit: "Direct deposit",
  cheque: "Cheque",
  transfer: "Transfer",
} as const;

/* -------------------------------------------------------------------------- */
/* Companies                                                                   */
/* -------------------------------------------------------------------------- */

export const COMPANIES: Company[] = [
  {
    id: "precision",
    name: "Precision",
    cycle: "biweekly",
    onboardedAt: d("2026-08-01"),
    lastPaymentAt: null,
    expectation: "Expected around Sep 15 based on 45-day onboarding cycle",
  },
  {
    id: "intelcom",
    name: "Intelcom",
    cycle: "biweekly",
    onboardedAt: d("2026-01-15"),
    lastPaymentAt: d("2026-08-21"),
    expectation: "Expected next: ~Sep 8 based on biweekly cycle",
  },
  {
    id: "rona",
    name: "Rona",
    cycle: "biweekly",
    onboardedAt: d("2026-02-10"),
    lastPaymentAt: d("2026-08-11"),
    expectation: "~14 days overdue based on biweekly cycle",
  },
  {
    id: "napa",
    name: "Napa",
    cycle: "monthly",
    onboardedAt: d("2026-03-05"),
    lastPaymentAt: d("2026-08-18"),
    expectation: "Expected next: ~4 days",
  },
  {
    id: "staples",
    name: "Staples",
    cycle: "irregular",
    onboardedAt: d("2026-04-02"),
    lastPaymentAt: d("2026-08-18"),
    expectation: "Last active: Aug 2026",
  },
  {
    id: "canpar",
    name: "Canpar",
    cycle: "irregular",
    onboardedAt: d("2026-05-20"),
    lastPaymentAt: null,
    expectation: "No activity recorded",
  },
];

/** Costs that belong to the business rather than to a client company. */
export const GLOBAL_COMPANY = { id: "global", name: "Global" };

export const companyById = (id: string): Company | undefined =>
  COMPANIES.find((c) => c.id === id);

export const companyName = (id: string): string =>
  id === GLOBAL_COMPANY.id ? GLOBAL_COMPANY.name : companyById(id)?.name ?? id;

/* -------------------------------------------------------------------------- */
/* Drivers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `logged` is this period's entries; `carried` is the unsettled balance rolled
 * in from August. Outstanding is the sum of the two minus anything settled —
 * derived below rather than stored, because the live build stores it and the
 * stored figure does not always match the columns beside it.
 */
export const DRIVERS: Driver[] = [
  { id: "prabh",  name: "Prabh",    companyId: "precision", entries: 18, logged: 2100, carried: 800, settled: 0, lastEntryAt: d("2026-09-04") },
  { id: "amir",   name: "Amir",     companyId: "precision", entries: 12, logged: 1200, carried: 0,   settled: 0, lastEntryAt: d("2026-09-04") },
  { id: "raj",    name: "Raj",      companyId: "precision", entries: 8,  logged: 800,  carried: 0,   settled: 0, lastEntryAt: d("2026-09-04") },
  { id: "sajan",  name: "Sajan",    companyId: "precision", entries: 5,  logged: 497,  carried: 0,   settled: 0, lastEntryAt: null },
  { id: "d-a",    name: "Driver A", companyId: "intelcom",  entries: 14, logged: 1470, carried: 600, settled: 0, lastEntryAt: d("2026-09-04") },
  { id: "d-b",    name: "Driver B", companyId: "intelcom",  entries: 11, logged: 1225, carried: 0,   settled: 0, lastEntryAt: d("2026-09-04") },
  { id: "d-c",    name: "Driver C", companyId: "intelcom",  entries: 9,  logged: 980,  carried: 0,   settled: 0, lastEntryAt: d("2026-09-04") },
  { id: "d-d",    name: "Driver D", companyId: "intelcom",  entries: 7,  logged: 735,  carried: 0,   settled: 0, lastEntryAt: d("2026-09-03") },
  { id: "d-e",    name: "Driver E", companyId: "intelcom",  entries: 5,  logged: 490,  carried: 0,   settled: 0, lastEntryAt: null },
  { id: "d-f",    name: "Driver F", companyId: "intelcom",  entries: 3,  logged: 240,  carried: 0,   settled: 0, lastEntryAt: null },
  { id: "d-g",    name: "Driver G", companyId: "intelcom",  entries: 2,  logged: 195,  carried: 0,   settled: 0, lastEntryAt: null },
  { id: "d-h",    name: "Driver H", companyId: "intelcom",  entries: 2,  logged: 160,  carried: 0,   settled: 0, lastEntryAt: null },
  { id: "d-i",    name: "Driver I", companyId: "intelcom",  entries: 2,  logged: 130,  carried: 0,   settled: 0, lastEntryAt: null },
  { id: "d-j",    name: "Driver J", companyId: "intelcom",  entries: 1,  logged: 105,  carried: 0,   settled: 0, lastEntryAt: null },
  { id: "d-k",    name: "Driver K", companyId: "intelcom",  entries: 1,  logged: 63,   carried: 0,   settled: 0, lastEntryAt: null },
  { id: "d-l",    name: "Driver L", companyId: "intelcom",  entries: 1,  logged: 60,   carried: 0,   settled: 0, lastEntryAt: null },
  { id: "mike",   name: "Mike",     companyId: "rona",      entries: 8,  logged: 600,  carried: 400, settled: 0, lastEntryAt: d("2026-09-04") },
  { id: "hassan", name: "Hassan",   companyId: "napa",      entries: 6,  logged: 450,  carried: 0,   settled: 450, lastEntryAt: d("2026-09-04") },
];

export const driverById = (id: string | null): Driver | undefined =>
  id ? DRIVERS.find((x) => x.id === id) : undefined;

/** What SNK still owes this driver. Derived, never stored. */
export const outstandingFor = (dr: Driver): number => dr.logged + dr.carried - dr.settled;

export const isSettled = (dr: Driver): boolean => outstandingFor(dr) === 0;

/* -------------------------------------------------------------------------- */
/* Expense ledger — the open period                                            */
/* -------------------------------------------------------------------------- */

type Raw = [string, string, ExpenseCategory, string | null, string, number, boolean];

const RAW_EXPENSES: Raw[] = [
  ["2026-09-04", "precision", "driver_pay", "prabh",  "Deliveries – 42 stops", 280, false],
  ["2026-09-04", "precision", "driver_pay", "amir",   "Deliveries – 38 stops", 260, false],
  ["2026-09-04", "intelcom",  "driver_pay", "d-a",    "Route east – 35 stops", 245, false],
  ["2026-09-04", "intelcom",  "driver_pay", "d-b",    "Route west – 33 stops", 245, false],
  ["2026-09-04", "rona",      "driver_pay", "mike",   "Deliveries – 12 stops", 180, false],
  ["2026-09-04", "napa",      "driver_pay", "hassan", "Deliveries – 8 stops",  150, false],
  ["2026-09-04", "intelcom",  "driver_pay", "d-c",    "Route north – 30 stops", 225, false],
  ["2026-09-04", "precision", "driver_pay", "raj",    "Deliveries – 28 stops", 200, false],

  ["2026-09-03", "precision", "driver_pay", "prabh",  "Deliveries – 45 stops", 280, false],
  ["2026-09-03", "precision", "driver_pay", "amir",   "Deliveries – 40 stops", 260, false],
  ["2026-09-03", "intelcom",  "driver_pay", "d-d",    "Route south – 29 stops", 240, false],
  ["2026-09-03", "global",    "insurance",  null,     "Monthly commercial vehicle insurance", 918, true],

  ["2026-09-02", "precision", "driver_pay", "prabh",  "Deliveries – 41 stops", 280, false],
  ["2026-09-02", "precision", "driver_pay", "amir",   "Deliveries – 37 stops", 260, false],
  ["2026-09-02", "precision", "driver_pay", "raj",    "Deliveries – 26 stops", 200, false],
  ["2026-09-02", "intelcom",  "driver_pay", "d-a",    "Route east – 34 stops", 245, false],
  ["2026-09-02", "intelcom",  "driver_pay", "d-b",    "Route west – 32 stops", 240, false],
  ["2026-09-02", "rona",      "driver_pay", "mike",   "Deliveries – 11 stops", 180, false],
  ["2026-09-02", "napa",      "driver_pay", "hassan", "Deliveries – 7 stops",  150, false],

  ["2026-09-01", "precision", "vehicle_rent", null, "Fleet lease – September", 2577, true],
  ["2026-09-01", "intelcom",  "vehicle_rent", null, "Fleet lease – September", 4422, true],
  ["2026-09-01", "rona",      "fuel",         null, "Fuel card top-up",        240,  true],
  ["2026-09-01", "napa",      "fuel",         null, "Fuel card top-up",        150,  true],
];

export const EXPENSES: ExpenseEntry[] = RAW_EXPENSES.map((r, i) => ({
  id: `e${i + 1}`,
  at: d(r[0]),
  companyId: r[1],
  category: r[2],
  driverId: r[3],
  description: r[4],
  amount: r[5],
  status: "outstanding",
  payable: r[6],
}));

export const EXPENSE_TOTAL = EXPENSES.reduce((n, e) => n + e.amount, 0); // 12,427

/**
 * Days inside the open period that carry no entries.
 *
 * Only days that have already happened. The live build lists Sat 5 and Sun 6
 * September — both in the future from its own clock — as "No operations",
 * which reads as missing data rather than as a quiet weekend.
 * RECONCILED: future days are not rendered.
 */
export const QUIET_DAYS: number[] = (() => {
  const seen = new Set(EXPENSES.map((e) => new Date(e.at).getUTCDate()));
  const out: number[] = [];
  for (let day = 1; day <= DAY_OF_PERIOD; day++) {
    if (!seen.has(day)) out.push(d(`2026-09-${String(day).padStart(2, "0")}`));
  }
  return out;
})();

/* -------------------------------------------------------------------------- */
/* Per-company history                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Prior-period expense by category, as transcribed from the company profiles.
 *
 * July and August only. **September is derived from the ledger** by
 * `companyHistory()` below rather than transcribed, because the live build
 * keeps the two apart and they disagree: its Precision profile books the whole
 * $4,597 as Driver Pay while the expense ledger shows $2,020 of driver pay and
 * a $2,577 fleet lease, and its Intelcom profile totals $6,780 against a
 * ledger of $5,862. One period, one source. RECONCILED.
 */
const PRIOR_HISTORY: Record<
  string,
  { revenueReceived: number; rows: Array<{ category: ExpenseCategory; jul: number; aug: number }> }
> = {
  precision: {
    revenueReceived: 0,
    rows: [
      { category: "driver_pay", jul: 3200, aug: 4100 },
      { category: "fuel", jul: 0, aug: 0 },
      { category: "maintenance", jul: 0, aug: 120 },
    ],
  },
  intelcom: {
    revenueReceived: 115656,
    rows: [
      { category: "driver_pay", jul: 4800, aug: 5300 },
      { category: "vehicle_rent", jul: 800, aug: 850 },
      { category: "fuel", jul: 100, aug: 140 },
    ],
  },
  rona: {
    revenueReceived: 18400,
    rows: [
      { category: "driver_pay", jul: 520, aug: 560 },
      { category: "fuel", jul: 180, aug: 200 },
      { category: "maintenance", jul: 0, aug: 0 },
    ],
  },
  napa: {
    revenueReceived: 7400,
    rows: [
      { category: "driver_pay", jul: 380, aug: 420 },
      { category: "fuel", jul: 120, aug: 110 },
      { category: "maintenance", jul: 0, aug: 0 },
    ],
  },
  staples: {
    revenueReceived: 4500,
    rows: [
      { category: "driver_pay", jul: 0, aug: 0 },
      { category: "fuel", jul: 0, aug: 0 },
      { category: "maintenance", jul: 0, aug: 0 },
    ],
  },
  canpar: {
    revenueReceived: 0,
    rows: [
      { category: "driver_pay", jul: 0, aug: 0 },
      { category: "fuel", jul: 0, aug: 0 },
      { category: "maintenance", jul: 0, aug: 0 },
    ],
  },
};

/**
 * Three periods of expense by category for one company.
 *
 * July and August come from `PRIOR_HISTORY`; September is summed out of the
 * live ledger, so the company profile and the Expenses page can never show
 * different totals for the open period. Categories that appear only in the
 * ledger are folded in, so a fleet lease cannot go missing because the
 * historical table had no row for it.
 */
export function companyHistory(companyId: string) {
  const prior = PRIOR_HISTORY[companyId];
  const ledger = expensesFor(companyId);

  const sepByCategory = new Map<ExpenseCategory, number>();
  for (const e of ledger) {
    sepByCategory.set(e.category, (sepByCategory.get(e.category) ?? 0) + e.amount);
  }

  const categories: ExpenseCategory[] = [...prior.rows.map((r) => r.category)];
  for (const c of sepByCategory.keys()) if (!categories.includes(c)) categories.push(c);

  const rows = categories.map((category) => {
    const p = prior.rows.find((r) => r.category === category);
    return {
      category,
      jul: p?.jul ?? 0,
      aug: p?.aug ?? 0,
      sep: sepByCategory.get(category) ?? 0,
    };
  });

  const sum = (k: "jul" | "aug" | "sep") => rows.reduce((n, r) => n + r[k], 0);
  const incurred = sum("jul") + sum("aug") + sum("sep");

  return {
    revenueReceived: prior.revenueReceived,
    rows,
    jul: sum("jul"),
    aug: sum("aug"),
    sep: sum("sep"),
    incurred,
    net: prior.revenueReceived - incurred,
  };
}

export const PAYMENTS: Payment[] = [
  { id: "p1", companyId: "intelcom", at: d("2026-08-21"), amount: 45156, method: "direct_deposit", coversFrom: d("2026-08-07"), coversTo: d("2026-08-20") },
  { id: "p2", companyId: "intelcom", at: d("2026-08-07"), amount: 38400, method: "direct_deposit", coversFrom: d("2026-07-24"), coversTo: d("2026-08-06") },
  { id: "p3", companyId: "intelcom", at: d("2026-07-24"), amount: 32100, method: "direct_deposit", coversFrom: d("2026-07-10"), coversTo: d("2026-07-23") },
  { id: "p4", companyId: "rona", at: d("2026-08-11"), amount: 6400, method: "cheque", coversFrom: d("2026-07-21"), coversTo: d("2026-08-03") },
  { id: "p5", companyId: "rona", at: d("2026-07-28"), amount: 5900, method: "cheque", coversFrom: d("2026-07-07"), coversTo: d("2026-07-20") },
  { id: "p6", companyId: "rona", at: d("2026-07-14"), amount: 6100, method: "cheque", coversFrom: d("2026-06-23"), coversTo: d("2026-07-06") },
  { id: "p7", companyId: "napa", at: d("2026-08-18"), amount: 3800, method: "direct_deposit", coversFrom: d("2026-07-18"), coversTo: d("2026-08-17") },
  { id: "p8", companyId: "napa", at: d("2026-07-18"), amount: 3600, method: "direct_deposit", coversFrom: d("2026-06-18"), coversTo: d("2026-07-17") },
  { id: "p9", companyId: "staples", at: d("2026-08-18"), amount: 2100, method: "cheque", coversFrom: d("2026-07-18"), coversTo: d("2026-08-17") },
  { id: "p10", companyId: "staples", at: d("2026-07-18"), amount: 2400, method: "cheque", coversFrom: d("2026-06-18"), coversTo: d("2026-07-17") },
];

export const paymentsFor = (companyId: string) =>
  PAYMENTS.filter((p) => p.companyId === companyId).sort((a, b) => b.at - a.at);

/* -------------------------------------------------------------------------- */
/* Revenue                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Two payments are sitting in draft. They are the reason Home shows $0
 * revenue against $57,956 of money the business believes it is owed — the
 * single most important thing on the screen, and the thing the current
 * layout buries.
 */
export const REVENUE: RevenueEntry[] = [
  { id: "r1", at: d("2026-09-01"), companyId: "intelcom", coversLabel: "Aug 15–Aug 31", amount: 45156, state: "draft" },
  { id: "r2", at: d("2026-09-01"), companyId: "rona", coversLabel: "Aug 1–Aug 15", amount: 12800, state: "draft" },
];

export const DRAFT_REVENUE = REVENUE.filter((r) => r.state === "draft");
export const FINALIZED_REVENUE = REVENUE.filter((r) => r.state === "finalized");
export const DRAFT_REVENUE_TOTAL = DRAFT_REVENUE.reduce((n, r) => n + r.amount, 0); // 57,956
export const REVENUE_TOTAL = FINALIZED_REVENUE.reduce((n, r) => n + r.amount, 0); // 0

/* -------------------------------------------------------------------------- */
/* Cash, obligations, partners                                                 */
/* -------------------------------------------------------------------------- */

export const CASH_RECEIVED = 0;
export const CASH_PAID_OUT = 459;
export const CASH_NET = CASH_RECEIVED - CASH_PAID_OUT; // -459

export const RECURRING: RecurringEntry[] = [
  { id: "rc1", description: "Monthly commercial vehicle insurance", companyId: "global", category: "insurance", amount: 918, frequency: "monthly", nextAt: d("2026-10-01"), active: true },
  { id: "rc2", description: "Fleet lease – Precision", companyId: "precision", category: "vehicle_rent", amount: 2577, frequency: "monthly", nextAt: d("2026-10-01"), active: true },
  { id: "rc3", description: "Fleet lease – Intelcom", companyId: "intelcom", category: "vehicle_rent", amount: 4422, frequency: "monthly", nextAt: d("2026-10-01"), active: true },
];

const driverPayrollOutstanding = DRIVERS.reduce((n, dr) => n + dr.logged - dr.settled, 0); // 11,050
export const DRIVER_OUTSTANDING_TOTAL = DRIVERS.reduce((n, dr) => n + outstandingFor(dr), 0); // 12,850
export const DRIVER_CARRIED_TOTAL = DRIVERS.reduce((n, dr) => n + dr.carried, 0); // 1,800
export const DRIVERS_SETTLED = DRIVERS.filter(isSettled).length; // 1
export const DRIVERS_UNSETTLED = DRIVERS.length - DRIVERS_SETTLED; // 17

export const OBLIGATIONS: Obligation[] = [
  {
    id: "o1",
    label: "Driver payroll",
    detail: `${DRIVERS.length} drivers · ${DRIVERS_SETTLED} settled`,
    amount: driverPayrollOutstanding,
    overdue: false,
    carried: false,
  },
  { id: "o2", label: "Global insurance", detail: "Due Sep 15", amount: 918, overdue: false, carried: false },
  { id: "o3", label: "Vehicle rent – Precision", detail: "Aug 2026 · carried forward", amount: 2577, overdue: true, carried: true },
  { id: "o4", label: "Vehicle rent – Intelcom", detail: "Aug 2026 · carried forward", amount: 4422, overdue: true, carried: true },
];

export const OBLIGATION_TOTAL = OBLIGATIONS.reduce((n, o) => n + o.amount, 0); // 18,967

export const UNPAID_BILLS = EXPENSES.filter((e) => e.payable && e.category === "insurance");
export const UNPAID_BILL_TOTAL = 918;

/* -------------------------------------------------------------------------- */
/* Periods                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `distributed` is what the partners actually split, and it is **not**
 * `revenue - expenses` for every row.
 *
 * July closed clean, so the two agree. August closed with $14,636 of expense
 * still unpaid, so the distributed figure is higher than the accrual
 * subtraction. September is open and only $459 has left the bank.
 *
 * The live build prints these three figures in one "Profit" column with no
 * indication that the basis changes between rows, which is why the table
 * looks like it cannot add up. The figures are kept exactly; the console
 * labels the basis instead. RECONCILED.
 */
export const PERIODS: PeriodSummary[] = [
  { key: "2026-07", label: "Jul 2026", revenue: 95400, expenses: 100714, distributed: -5314, basis: "accrual", closedAt: d("2026-08-03"), locked: true },
  { key: "2026-08", label: "Aug 2026", revenue: 82980, expenses: 126350, distributed: -28734, basis: "cash", closedAt: d("2026-09-02"), locked: true },
  { key: "2026-09", label: "Sep 2026", revenue: REVENUE_TOTAL, expenses: EXPENSE_TOTAL, distributed: CASH_NET, basis: "cash", closedAt: null, locked: false },
];

export const OPEN_PERIOD = PERIODS[PERIODS.length - 1];
export const CLOSED_PERIODS = PERIODS.filter((p) => p.locked);

/** Everything before the open period, which is what "carried forward" means. */
export const CARRIED_FORWARD = CLOSED_PERIODS.reduce((n, p) => n + p.distributed, 0); // -34,048

export const PARTNERS: Partner[] = [
  { id: "syed", name: "Syed", share: 0.35, withdrawn: 0 },
  { id: "kiani", name: "Kiani", share: 0.65, withdrawn: 0 },
];

export const CUMULATIVE_DISTRIBUTED = PERIODS.reduce((n, p) => n + p.distributed, 0); // -34,507

export const shareOf = (partner: Partner, amount: number) => Math.round(amount * partner.share);

/* -------------------------------------------------------------------------- */
/* Activity                                                                    */
/* -------------------------------------------------------------------------- */

const MIN = 60_000;
const HOUR = 60 * MIN;

export const ACTIVITY: ActivityEvent[] = [
  { id: "a1", at: NOW - 2 * MIN,  actorId: "abc", actor: "ABC", summary: "logged 1 entry for Precision",  amount: 280,  entries: 1, tone: "move" },
  { id: "a2", at: NOW - 2 * HOUR, actorId: "abc", actor: "ABC", summary: "logged 8 entries for Precision", amount: 1720, entries: 8, tone: "move" },
  { id: "a3", at: NOW - 2 * HOUR - 25 * MIN, actorId: "abc", actor: "ABC", summary: "logged 5 entries for Intelcom", amount: 985, entries: 5, tone: "move" },
  { id: "a4", at: NOW - 3 * HOUR, actorId: "abc", actor: "ABC", summary: "logged 2 entries for Rona",     amount: 360,  entries: 2, tone: "move" },
  { id: "a5", at: NOW - 21 * HOUR, actorId: "syed", actor: "Syed", summary: "settled Prabh's payroll",     amount: 2850, entries: 0, tone: "ok" },
];

/**
 * The "new since you were last here" banner.
 *
 * Derived from the feed rather than stored. The live build's banner says
 * "12 new entries · $3,200" while the list beneath it shows 16 entries
 * totalling $3,345. RECONCILED: one source, so the two can never disagree.
 */
export const SINCE_LAST_VISIT = (() => {
  const cutoff = NOW - 21 * HOUR;
  const rows = ACTIVITY.filter((a) => a.at > cutoff && a.entries > 0);
  return {
    entries: rows.reduce((n, a) => n + a.entries, 0),
    amount: rows.reduce((n, a) => n + (a.amount ?? 0), 0),
    since: cutoff,
  };
})();

/* -------------------------------------------------------------------------- */
/* Derived roll-ups                                                            */
/* -------------------------------------------------------------------------- */

export const expensesByCompany = (): Array<{ company: Company; total: number; drivers: number }> =>
  COMPANIES.map((c) => ({
    company: c,
    total: EXPENSES.filter((e) => e.companyId === c.id).reduce((n, e) => n + e.amount, 0),
    drivers: DRIVERS.filter((dr) => dr.companyId === c.id).length,
  }));

export const COMPANIES_WITH_ACTIVITY = expensesByCompany().filter((r) => r.total > 0).length; // 4

export const driversFor = (companyId: string) => DRIVERS.filter((dr) => dr.companyId === companyId);

export function expensesFor(companyId: string) {
  return EXPENSES.filter((e) => e.companyId === companyId);
}

/** Period-to-date burn, used for the pacing line on Home. */
export const DAILY_AVERAGE = Math.round(EXPENSE_TOTAL / DAY_OF_PERIOD); // 3,107
export const PACING = DAILY_AVERAGE * PERIOD_DAYS; // 93,210

/* -------------------------------------------------------------------------- */
/* Month-end checklist                                                         */
/* -------------------------------------------------------------------------- */

/** What Precision owes and has never paid. The sharpest number in the book. */
export const PRECISION_AT_RISK = EXPENSES
  .filter((e) => e.companyId === "precision")
  .reduce((n, e) => n + e.amount, 0); // 4,597

export const CHECKLIST: ChecklistItem[] = [
  {
    id: "c1",
    label: "All expenses logged",
    detail: `${COMPANIES_WITH_ACTIVITY} of ${COMPANIES.length} companies have entries for September. Canpar and Staples have none.`,
    done: false,
    actionLabel: "Review",
    href: "/ops/expenses",
  },
  {
    id: "c2",
    label: "Revenue entries finalized",
    detail: `${DRAFT_REVENUE.length} draft entries still unfinalized`,
    amount: DRAFT_REVENUE_TOTAL,
    done: false,
    actionLabel: "Finalize",
    href: "/ops/financials?tab=revenue",
  },
  {
    id: "c3",
    label: "Drivers settled",
    detail: `${DRIVERS_SETTLED} of ${DRIVERS.length} drivers settled`,
    amount: driverPayrollOutstanding,
    done: false,
    actionLabel: "Settle",
    href: "/ops/drivers",
  },
  {
    id: "c4",
    label: "Bills paid",
    detail: `${UNPAID_BILLS.length} unpaid bill`,
    amount: UNPAID_BILL_TOTAL,
    done: false,
    actionLabel: "Pay",
    href: "/ops/expenses",
  },
  {
    id: "c5",
    label: "Period closed",
    detail: `Complete all items above to close ${PERIOD.long}`,
    done: false,
    actionLabel: "Close",
    href: "/ops/financials?tab=close",
  },
];

/* -------------------------------------------------------------------------- */
/* Pending actions, as Home lists them                                         */
/* -------------------------------------------------------------------------- */

export interface PendingAction {
  id: string;
  label: string;
  /** One line of context, derived from the item's own progress. */
  detail: string;
  /** Money at stake. Null for an action that moves no money by itself. */
  amount: number | null;
  /** How far along the item is, in the unit the item counts in. */
  progress: { done: number; total: number };
  action: string;
  href: string;
  tone: StatusTone;
}

/**
 * Ranked by money at stake, largest first, so the list can be worked top to
 * bottom. The live build lists them in a fixed order that puts $918 of bills
 * above $57,956 of unfinalized revenue.
 */
export const PENDING_ACTIONS: PendingAction[] = (
  [
    { id: "pa1", label: `Finalize ${DRAFT_REVENUE.length} draft payments`, detail: `${FINALIZED_REVENUE.length} of ${REVENUE.length} finalized · ${DRAFT_REVENUE.map((r) => companyName(r.companyId)).join(", ")}`, amount: DRAFT_REVENUE_TOTAL, progress: { done: FINALIZED_REVENUE.length, total: REVENUE.length }, action: "Finalize", href: "/ops/financials?tab=revenue", tone: "warn" },
    { id: "pa2", label: "Settle driver pay", detail: `${DRIVERS_SETTLED} of ${DRIVERS.length} drivers settled`, amount: DRIVER_OUTSTANDING_TOTAL, progress: { done: DRIVERS_SETTLED, total: DRIVERS.length }, action: "Settle", href: "/ops/drivers", tone: "risk" },
    { id: "pa3", label: "Record Precision payment — no revenue logged", detail: "Never paid since onboarding", amount: PRECISION_AT_RISK, progress: { done: 0, total: 1 }, action: "Add", href: "/ops/clients?company=precision", tone: "risk" },
    { id: "pa4", label: `Pay ${UNPAID_BILLS.length} bill`, detail: "Global insurance · due Sep 15", amount: UNPAID_BILL_TOTAL, progress: { done: 0, total: UNPAID_BILLS.length }, action: "Pay", href: "/ops/expenses", tone: "warn" },
    { id: "pa5", label: `Close ${PERIOD.label} period`, detail: `0 of ${CHECKLIST.length} steps complete`, amount: null, progress: { done: 0, total: 1 }, action: "Close", href: "/ops/financials?tab=close", tone: "idle" },
  ] satisfies PendingAction[]
).sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1));

/* -------------------------------------------------------------------------- */
/* Month-over-month deltas on the headline figures                            */
/* -------------------------------------------------------------------------- */

/**
 * Transcribed from the live build's headline cards, not derived.
 *
 * The demo ledger only holds the open period, so there is no August cash
 * position to compute a change against. The client's own figures are kept
 * verbatim and labelled as a comparison to last month, which is what their
 * cards say. Replace with a computed value the moment the API exposes prior
 * periods.
 */
export const HEADLINE_DELTA: Record<"cash" | "revenue" | "expenses" | "profit", { pct: number; dir: "up" | "down" | "flat" }> = {
  cash: { pct: 17, dir: "down" },
  revenue: { pct: 0, dir: "flat" },
  expenses: { pct: 12, dir: "up" },
  profit: { pct: 17, dir: "down" },
};

/* -------------------------------------------------------------------------- */
/* Period-to-date series                                                       */
/* -------------------------------------------------------------------------- */

export interface DayPoint {
  at: number;
  day: number;
  entries: number;
  spend: number;
  cumulative: number;
}

/**
 * Spend per day of the open period, and the running total.
 *
 * Derived from the ledger rather than supplied as its own series, so the
 * sparkline on Home and the rows on Expenses can never tell different
 * stories. Four days in, four points — a sparkline over a stub of a month is
 * honest about how little there is to see.
 */
export const PERIOD_SERIES: DayPoint[] = (() => {
  const out: DayPoint[] = [];
  let running = 0;
  for (let day = 1; day <= DAY_OF_PERIOD; day++) {
    const at = d(`2026-09-${String(day).padStart(2, "0")}`);
    const rows = EXPENSES.filter((e) => new Date(e.at).getUTCDate() === day);
    const spend = rows.reduce((n, e) => n + e.amount, 0);
    running += spend;
    out.push({ at, day, entries: rows.length, spend, cumulative: running });
  }
  return out;
})();

/** Cash leaving the business, cumulatively. Only one payment has cleared. */
export const CASH_SERIES: number[] = PERIOD_SERIES.map((_, i) =>
  i === PERIOD_SERIES.length - 1 ? CASH_NET : 0,
);

export const EXPENSE_SERIES: number[] = PERIOD_SERIES.map((p) => p.cumulative);
export const REVENUE_SERIES: number[] = PERIOD_SERIES.map(() => REVENUE_TOTAL);
