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

/* The select inside the dialog. Its menu is portalled to the body, so it is
   outside the dialog it belongs to in the DOM and has to prove it still sits
   over it, still lines up with its own control, and that one Escape closes
   one layer rather than two. */
await click("Add expense");
await settle();
await page.evaluate(() => document.querySelectorAll('[role="dialog"] [role="combobox"]')[1]?.focus());
await page.keyboard.press("Enter");
await settle();
const menu = await page.evaluate(() => {
  const btn = document.querySelectorAll('[role="dialog"] [role="combobox"]')[1];
  const list = document.querySelector('[role="listbox"]');
  if (!list) return null;
  const b = btn.getBoundingClientRect();
  const l = list.getBoundingClientRect();
  return {
    alignedLeft: Math.abs(l.left - b.left) <= 1,
    /* Below when there is room, above when there is not, never across it.
       Covering its own control is exactly what the native menu did. */
    clear: l.top >= b.bottom || l.bottom <= b.top,
    atLeastAsWide: l.width >= b.width - 1,
    onScreen: l.right <= window.innerWidth && l.bottom <= window.innerHeight && l.top >= 0,
  };
});
ok("a select opens a menu", Boolean(menu));
ok("the menu clears its own control and lines up with it", Boolean(menu?.clear && menu?.alignedLeft));
ok("it is at least as wide as the control and stays on screen", Boolean(menu?.atLeastAsWide && menu?.onScreen));

await page.keyboard.press("Escape");
await settle();
const layers = await page.evaluate(() => ({
  menu: Boolean(document.querySelector('[role="listbox"]')),
  dialog: Boolean(document.querySelector('[role="dialog"]')),
}));
ok("one Escape closes the menu", !layers.menu);
ok("and leaves the dialog open", layers.dialog);
await page.keyboard.press("Escape");
await settle();

/* The destructive path. Reopening a period that a later period was closed on
   top of must not be one careless Enter away, and the period with nothing
   downstream must not be made tedious for the sake of symmetry. */
await page.keyboard.press("Escape");
await settle();
await page.goto(`${BASE}/ops/financials`, { waitUntil: "networkidle0", timeout: 45000 });
await page.evaluate(() =>
  [...document.querySelectorAll("[role=tab]")].find((n) => n.textContent.trim().startsWith("History"))?.click(),
);
await settle();

const reopen = async (nth) => {
  await page.evaluate((n) => {
    [...document.querySelectorAll("button")].filter((b) => b.textContent.trim().startsWith("Reopen"))[n]?.click();
  }, nth);
  await settle();
  return page.evaluate(() => {
    const submit = [...document.querySelectorAll('[role="dialog"] button')].find((b) =>
      b.textContent.trim().startsWith("Reopen"),
    );
    return {
      title: document.querySelector('[role="dialog"] h2')?.textContent?.trim() ?? "",
      disabled: submit?.disabled ?? null,
      hasCheckbox: Boolean(document.querySelector('[role="dialog"] input[type="checkbox"]')),
      focusSafe: document.activeElement.textContent?.trim() === "Cancel",
    };
  });
};

const upstream = await reopen(0);
ok("reopening a period with one closed after it asks first", upstream.hasCheckbox, upstream.title);
ok("and its destructive button starts disabled", upstream.disabled === true);
await page.evaluate(() => {
  const box = document.querySelector('[role="dialog"] input[type="checkbox"]');
  box.click();
});
await settle();
ok(
  "acknowledging enables it",
  await page.evaluate(
    () =>
      ![...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim().startsWith("Reopen"))
        ?.disabled,
  ),
);

await page.keyboard.press("Escape");
await settle();
const latest = await reopen(1);
ok("the most recent closed period is a plain confirmation", !latest.hasCheckbox, latest.title);
ok("its destructive button is live", latest.disabled === false);
ok("and focus rests on Cancel, not on the destructive action", latest.focusSafe);

console.log(`\nDIALOGS — ${fails.length === 0 ? "every behaviour check passes" : `${fails.length} failure(s)`}`);
await browser.close();
process.exit(fails.length ? 1 : 0);
