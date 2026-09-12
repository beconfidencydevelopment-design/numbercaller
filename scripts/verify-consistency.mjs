/**
 * Consistency gate: the same element must measure the same on every screen.
 *
 * This is the check that found a 5px icon, table headers at two paddings and
 * two weights, dashed dividers on two screens and solid on three, five row
 * heights where three were meant, and card titles at 18px on Home and 14px
 * everywhere else. None of it was visible on any one page; all of it was
 * visible when the console was read as one product — which is how the
 * client reads it.
 *
 * Like verify-dialogs it drives a browser, so it needs the dev server and a
 * copy of puppeteer-core, and skips cleanly without one:
 *
 *   PUPPETEER_CORE=/path/to/puppeteer-core node scripts/verify-consistency.mjs
 */
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const BASE = process.argv[2] ?? "http://localhost:3000";

let puppeteer;
for (const from of [process.env.PUPPETEER_CORE, "puppeteer-core"].filter(Boolean)) {
  try {
    puppeteer = require(from);
    break;
  } catch {
    /* next */
  }
}
if (!puppeteer) {
  console.log("CONSISTENCY — skipped (no puppeteer-core; set PUPPETEER_CORE to a copy of it)");
  process.exit(0);
}
let exe;
try {
  const cache = `${process.env.HOME}/.cache/puppeteer/chrome`;
  exe = `${cache}/${readdirSync(cache)[0]}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
} catch {
  console.log("CONSISTENCY — skipped (no Chrome for Testing in ~/.cache/puppeteer)");
  process.exit(0);
}

/* The allowed vocabulary. Anything outside it is drift, not a choice. */
const ROW_HEIGHTS = new Set([44, 48, 56, 64]); // compact, ledger, overview, overview-large
const AVATAR_SIZES = new Set([24, 28, 36]); // table, rail, large identity
const MIN_ICON = 12;

const VIEWS = [
  ["/ops", null],
  ["/ops/expenses", null],
  ["/ops/clients", null],
  ["/ops/drivers", null],
  ["/ops/financials", null],
  ["/ops/financials", "Revenue"],
  ["/ops/financials", "Withdrawals"],
  ["/ops/financials", "Close period"],
  ["/ops/financials", "History"],
];

const browser = await puppeteer.launch({ executablePath: exe, headless: "shell", args: ["--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });

const th = new Map();
const h2 = new Map();
const rows = new Map();
const dividers = new Map();
const icons = [];
const avatars = new Map();

const note = (map, key, where) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(where);
};

for (const [path, tab] of VIEWS) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 45000 });
  if (tab) {
    await page.evaluate(
      (t) => [...document.querySelectorAll("[role=tab]")].find((n) => n.textContent.trim().startsWith(t))?.click(),
      tab,
    );
    await new Promise((r) => setTimeout(r, 300));
  }
  const where = (path.replace("/ops", "") || "/home") + (tab ? `:${tab}` : "");
  const found = await page.evaluate(() => {
    const px = (v) => Math.round(parseFloat(v));
    const cs = (el) => getComputedStyle(el);
    const out = { th: [], h2: [], rows: [], dividers: [], icons: [], avatars: [] };
    for (const el of document.querySelectorAll("thead th")) {
      const s = cs(el);
      out.th.push(`${px(s.fontSize)}px w${s.fontWeight} pad ${s.paddingTop}/${s.paddingBottom}`);
    }
    for (const el of document.querySelectorAll(".ops-card h2")) {
      const s = cs(el);
      out.h2.push(`${px(s.fontSize)}px w${s.fontWeight}`);
    }
    for (const el of document.querySelectorAll("tbody tr")) {
      const r = el.getBoundingClientRect();
      if (r.height < 8) continue; // FillRow slack and hidden rows
      const s = cs(el);
      /* Group-header rows (day headers) sit on their own line and are not
         data rows; they are the ones with a colSpan cell. */
      if (el.querySelector("td[colspan]")) continue;
      out.rows.push(Math.round(r.height));
      if (px(s.borderBottomWidth) > 0) out.dividers.push(s.borderBottomStyle);
    }
    for (const el of document.querySelectorAll("svg")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.width < 12) {
        out.icons.push({ w: Math.round(r.width), near: el.closest("button,a,li,tr")?.textContent?.trim().slice(0, 30) ?? "" });
      }
    }
    for (const img of document.querySelectorAll("img")) {
      if (!(img.getAttribute("src") ?? "").includes("people")) continue; // portraits only
      const w = Math.round(img.parentElement.getBoundingClientRect().width);
      if (w) out.avatars.push(w);
    }
    return out;
  });
  for (const k of found.th) note(th, k, where);
  for (const k of found.h2) note(h2, k, where);
  for (const k of found.rows) note(rows, k, where);
  for (const k of found.dividers) note(dividers, k, where);
  for (const k of found.avatars) note(avatars, k, where);
  for (const i of found.icons) icons.push({ ...i, where });
}
await browser.close();

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`  ${ok ? "pass" : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);
  if (!ok) failures += 1;
};
const describe = (map) =>
  [...map.entries()].map(([k, w]) => `${k} (${[...w].slice(0, 3).join(", ")}${w.size > 3 ? ", …" : ""})`).join(" | ");

check("one table-header style across the console", th.size === 1, describe(th));
check("one card-title style across the console", h2.size === 1, describe(h2));
check(
  "every data row is one of the four row heights",
  [...rows.keys()].every((h) => ROW_HEIGHTS.has(h)),
  describe(new Map([...rows].filter(([h]) => !ROW_HEIGHTS.has(h)))) || `${[...rows.keys()].sort((a, b) => a - b).join(", ")}px`,
);
check("table dividers are dashed everywhere", dividers.size === 1 && dividers.has("dashed"), describe(dividers));
check("no icon renders under 12px", icons.length === 0, icons.map((i) => `${i.w}px near "${i.near}" on ${i.where}`).join("; "));
check(
  "every portrait is one of the three avatar sizes",
  [...avatars.keys()].every((w) => AVATAR_SIZES.has(w)),
  `${[...avatars.keys()].sort((a, b) => a - b).join(", ")}px`,
);

console.log(`\nCONSISTENCY — ${failures === 0 ? "the console measures as one product" : `${failures} failure(s)`}`);
process.exit(failures ? 1 : 0);
