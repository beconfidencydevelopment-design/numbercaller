/**
 * Reconciliation gate for the demo ledger.
 *
 * The design brief for this console is a bookkeeping product, so the numbers
 * on one screen have to survive being read next to the numbers on another.
 * Every assertion here is a figure a client would check by hand.
 *
 *   node scripts/verify-ledger.mjs
 *
 * Exits non-zero on any mismatch.
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-loader.mjs", pathToFileURL("./scripts/"));

const d = await import("../lib/ops/data.ts");

let failures = 0;
const checks = [];

function eq(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  checks.push({ ok, label, actual, expected });
}

/* --- The expense ledger ---------------------------------------------------- */
eq("expense entry count", d.EXPENSES.length, 23);
eq("expense total", d.EXPENSE_TOTAL, 12427);
eq(
  "expense total === sum of entries",
  d.EXPENSES.reduce((n, e) => n + e.amount, 0),
  d.EXPENSE_TOTAL,
);

/* --- By company, including the business's own costs ------------------------ */
const perCompany = [...d.COMPANIES.map((c) => c.id), d.GLOBAL_COMPANY.id].map((id) =>
  d.expensesFor(id).reduce((n, e) => n + e.amount, 0),
);
eq(
  "by-company rows sum to the period total",
  perCompany.reduce((n, v) => n + v, 0),
  d.EXPENSE_TOTAL,
);

/* --- Company profiles agree with the ledger for the open period ------------ */
for (const c of d.COMPANIES) {
  eq(
    `${c.name}: profile September === ledger September`,
    d.companyHistory(c.id).sep,
    d.expensesFor(c.id).reduce((n, e) => n + e.amount, 0),
  );
}

/* --- Driver payroll -------------------------------------------------------- */
eq("driver count", d.DRIVERS.length, 18);
eq("settled drivers", d.DRIVERS_SETTLED, 1);
eq("unsettled drivers", d.DRIVERS_UNSETTLED, 17);
eq("driver outstanding total", d.DRIVER_OUTSTANDING_TOTAL, 12850);
eq("carried from August", d.DRIVER_CARRIED_TOTAL, 1800);
eq(
  "outstanding === logged + carried − settled",
  d.DRIVERS.reduce((n, x) => n + x.logged + x.carried - x.settled, 0),
  d.DRIVER_OUTSTANDING_TOTAL,
);
eq(
  "every driver's own row adds up",
  d.DRIVERS.filter((x) => d.outstandingFor(x) === x.logged + x.carried - x.settled).length,
  d.DRIVERS.length,
);

/* --- Obligations ----------------------------------------------------------- */
eq("obligation total", d.OBLIGATION_TOTAL, 18967);
eq(
  "obligations sum to their own total",
  d.OBLIGATIONS.reduce((n, o) => n + o.amount, 0),
  d.OBLIGATION_TOTAL,
);

/* --- Revenue --------------------------------------------------------------- */
eq("draft revenue total", d.DRAFT_REVENUE_TOTAL, 57956);
eq("finalized revenue", d.REVENUE_TOTAL, 0);

/* --- Periods and partner split --------------------------------------------- */
eq("carried forward from closed periods", d.CARRIED_FORWARD, -34048);
eq("cumulative distributed", d.CUMULATIVE_DISTRIBUTED, -34507);
eq(
  "partner shares sum to the distributed figure",
  d.PARTNERS.reduce((n, p) => n + d.shareOf(p, d.CUMULATIVE_DISTRIBUTED), 0),
  d.CUMULATIVE_DISTRIBUTED,
);
eq("partner shares sum to 100%", d.PARTNERS.reduce((n, p) => n + p.share, 0), 1);

/* --- The same sum must not differ between two cards ------------------------ */
/**
 * Home shows the year-to-date distribution twice: as the footer of Monthly
 * comparison, and as each partner's "to date" position on Partner split. They
 * are the same sum, so they are asserted to be the same number — a figure that
 * disagrees with itself across two cards on one screen is the exact class of
 * defect this console was rebuilt to remove.
 */
eq(
  "monthly footer total === cumulative distributed",
  d.PERIODS.reduce((n, p) => n + p.distributed, 0),
  d.CUMULATIVE_DISTRIBUTED,
);
for (const p of d.PARTNERS) {
  eq(
    `${p.name}: year-to-date share === position to date`,
    d.shareOf(p, d.PERIODS.reduce((n, x) => n + x.distributed, 0)),
    d.shareOf(p, d.CUMULATIVE_DISTRIBUTED),
  );
}

/* --- Pacing ---------------------------------------------------------------- */
eq("daily average", d.DAILY_AVERAGE, 3107);
eq("pacing", d.PACING, 93210);

/* --- The activity banner is derived, not transcribed ----------------------- */
eq(
  "banner entry count === feed entry count",
  d.SINCE_LAST_VISIT.entries,
  d.ACTIVITY.filter((a) => a.at > d.SINCE_LAST_VISIT.since && a.entries > 0).reduce((n, a) => n + a.entries, 0),
);

/* --- Determinism: nothing may read the wall clock -------------------------- */
const { readFileSync, readdirSync } = await import("node:fs");
const sources = [
  ...readdirSync("lib/ops").map((f) => `lib/ops/${f}`),
  ...readdirSync("components/ops").map((f) => `components/ops/${f}`),
];
/** Comments discuss the rule; only real code may break it. */
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const clockUsers = sources.filter((f) =>
  /Date\.now\(\)|Math\.random\(\)|new Date\(\s*\)/.test(stripComments(readFileSync(f, "utf8"))),
);
eq("no wall clock or randomness in render", clockUsers.join(", ") || "none", "none");

/* --- Every company that appears in a chart or a tile has its own colour -----
   A company with entries but no entry in COMPANY_COLOR falls back to grey in
   the composition bar, the monogram tile and the ledger at once, which reads
   as a rendering bug rather than as missing data. The business's own costs
   are deliberately neutral and are the one exception. ------------------------ */
const colouredCompanies = Object.keys(d.COMPANY_COLOR);
const uncoloured = [...new Set(d.EXPENSES.map((e) => e.companyId))]
  .filter((id) => id !== d.GLOBAL_COMPANY.id && !colouredCompanies.includes(id));
eq("every company with entries has a colour", uncoloured.join(", ") || "none", "none");
eq("the categorical palette is not overdrawn", colouredCompanies.length <= 4, true);

/* --- The ledger's running total lands on the period total ------------------
   The Expenses table accumulates from the bottom of the visible list upward,
   so its first row prints the period total. If that identity ever broke, the
   column and the page header would disagree in front of the client. -------- */
const runningTop = d.EXPENSES.reduce((n, e) => n + e.amount, 0);
eq("running total tops out at the period total", runningTop, d.EXPENSE_TOTAL);

/* --- Nothing in the period is dated in the future -------------------------- */
const future = [
  ...d.EXPENSES.map((e) => e.at),
  ...d.QUIET_DAYS,
  ...d.ACTIVITY.map((a) => a.at),
  ...d.PAYMENTS.map((p) => p.at),
].filter((t) => t > d.NOW);
eq("no future-dated rows", future.length, 0);

/* --------------------------------------------------------------------------- */
for (const c of checks) {
  const line = `${c.ok ? "pass" : "FAIL"}  ${c.label}`;
  if (c.ok) console.log("  " + line);
  else console.log(`  ${line}\n        got ${c.actual}, expected ${c.expected}`);
}
console.log(`\n${checks.length} checks, ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
