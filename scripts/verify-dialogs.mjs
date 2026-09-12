/**
 * Behaviour gate for the four dialogs.
 *
 * Everything here is invisible in a screenshot and silent in the compiler: a
 * focus trap that leaks, a body scroll lock that never lifts, focus that does
 * not come back to the control you opened the dialog from. Each one is fine
 * for a mouse and a wall for a keyboard, and each one has broken in a real
 * product because nobody was checking.
 *
 * Unlike the other four gates this one drives a browser, so it needs a dev
 * server and a Chrome binary:
 *
 *   npm run dev
 *   node scripts/verify-dialogs.mjs [http://localhost:3000]
 *
 * puppeteer-core is deliberately not a dependency of this project, so point
 * PUPPETEER_CORE at a copy you already have and the gate runs; without one it
 * skips cleanly rather than failing.
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
    /* try the next one */
  }
}
if (!puppeteer) {
  console.log("DIALOGS — skipped (no puppeteer-core; set PUPPETEER_CORE to a copy of it)");
  process.exit(0);
}

const cache = `${process.env.HOME}/.cache/puppeteer/chrome`;
let exe;
try {
  const build = readdirSync(cache)[0];
  exe = `${cache}/${build}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
} catch {
  console.log("DIALOGS — skipped (no Chrome for Testing in ~/.cache/puppeteer)");
  process.exit(0);
}

const fails = [];
const ok = (name, pass, extra = "") => {
  console.log(`  ${pass ? "pass" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
  if (!pass) fails.push(name);
};

const browser = await puppeteer.launch({ executablePath: exe, headless: "shell", args: ["--hide-scrollbars"] });
const page = await browser.newPage();

const click = (label) =>
  page.evaluate((x) => {
    const el = [...document.querySelectorAll("button")].find((n) => n.textContent.trim().startsWith(x));
    el?.click();
    return Boolean(el);
  }, label);

const settle = () => new Promise((r) => setTimeout(r, 300));

/* A short viewport on purpose: the tallest of the four forms does not fit in
   480px, which is where a dialog that centres itself without a scroller
   crops its own submit button. */
await page.setViewport({ width: 1280, height: 480, deviceScaleFactor: 1 });
await page.goto(`${BASE}/ops/expenses`, { waitUntil: "networkidle0", timeout: 45000 });

await click("Add expense");
await settle();

const open = await page.evaluate(() => {
  const wrap = document.querySelector(".ops-overlay");
  const dialog = document.querySelector('[role="dialog"]');
  const active = document.activeElement;
  return {
    scrollable: wrap.scrollHeight > wrap.clientHeight,
    bodyLocked: getComputedStyle(document.body).overflow === "hidden",
    labelled: Boolean(dialog?.getAttribute("aria-labelledby")),
    modal: dialog?.getAttribute("aria-modal") === "true",
    focusTag: active.tagName,
    focusIsClose: active.getAttribute?.("aria-label") === "Close",
  };
});
ok("a dialog taller than the viewport scrolls", open.scrollable);
ok("the page behind stops scrolling", open.bodyLocked);
ok("the dialog names itself to a screen reader", open.labelled && open.modal);
ok("focus opens on the form, not on Dismiss", !open.focusIsClose, open.focusTag);

for (let i = 0; i < 25; i += 1) await page.keyboard.press("Tab");
ok(
  "Tab cannot walk out of the dialog",
  await page.evaluate(() => Boolean(document.activeElement.closest('[role="dialog"]'))),
);

/* Opened from the keyboard, because a scripted `.click()` never focuses its
   button and there would be nothing to restore focus to. */
await page.keyboard.press("Escape");
await settle();
await page.evaluate(() =>
  [...document.querySelectorAll("button")].find((n) => n.textContent.trim().startsWith("Add expense"))?.focus(),
);
await page.keyboard.press("Enter");
await settle();
ok("Enter on the trigger opens it", await page.evaluate(() => Boolean(document.querySelector('[role="dialog"]'))));

await page.keyboard.press("Escape");
await settle();
const closed = await page.evaluate(() => ({
  gone: !document.querySelector('[role="dialog"]'),
  focus: document.activeElement.textContent?.trim().slice(0, 24) ?? "",
  unlocked: getComputedStyle(document.body).overflow !== "hidden",
}));
ok("Escape closes it", closed.gone);
ok("focus returns to whatever opened it", closed.focus.startsWith("Add expense"), closed.focus);
ok("page scrolling is restored", closed.unlocked);

await click("Add expense");
await settle();
await page.evaluate(() => document.querySelector('.ops-overlay > button[aria-label="Close"]')?.click());
await settle();
ok("clicking the scrim closes it", await page.evaluate(() => !document.querySelector('[role="dialog"]')));

/* Validation has to speak, not just glow: a red border is nothing to a screen
   reader and nothing in greyscale. */
await click("Add expense");
await settle();
await click("Log expense");
await settle();
const invalid = await page.evaluate(() => {
  const bad = [...document.querySelectorAll('[aria-invalid="true"]')];
  return {
    count: bad.length,
    described: bad.every((el) => {
      const id = el.getAttribute("aria-describedby");
      return id && (document.getElementById(id)?.textContent ?? "").trim().length > 0;
    }),
    stillOpen: Boolean(document.querySelector('[role="dialog"]')),
  };
});
ok("an invalid submit does not close the dialog", invalid.stillOpen);
ok("every invalid field is marked", invalid.count > 0, `${invalid.count} fields`);
ok("every invalid field states its reason in words", invalid.described);

console.log(`\nDIALOGS — ${fails.length === 0 ? "every behaviour check passes" : `${fails.length} failure(s)`}`);
await browser.close();
process.exit(fails.length ? 1 : 0);
