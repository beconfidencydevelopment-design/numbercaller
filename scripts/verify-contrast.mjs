/**
 * Contrast gate for the console palette.
 *
 * Reads the tokens out of app/globals.css so it can never drift from what
 * actually ships, resolves both themes, and checks every foreground/background
 * pair the interface can actually produce.
 *
 *   node scripts/verify-contrast.mjs
 *
 * Exits non-zero on any failure. Run it before shipping a colour change —
 * this project does not eyeball contrast.
 */
import { readFileSync } from "node:fs";
import { contrast, hexToRgb } from "./contrast.mjs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** Pull one `:root {}` / `.dark {}` block's --ops-* declarations. */
function block(selector) {
  const re = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`, "g");
  const out = {};
  for (const m of css.matchAll(re)) {
    for (const d of m[1].matchAll(/(--ops-[\w-]+):\s*([^;]+);/g)) {
      const value = d[2].trim();
      if (/^#[0-9a-f]{3,8}$/i.test(value)) out[d[1]] = value;
    }
  }
  return out;
}

const LIGHT = block("\\:root");
const DARK = { ...LIGHT, ...block("\\.dark") };

/** Every ground a piece of text can land on. */
const GROUNDS = ["--ops-surface", "--ops-sunken", "--ops-workspace", "--ops-hover", "--ops-active"];

const AA = 4.5;
const AA_LARGE = 3.0; // ≥18.66px bold / ≥24px regular
const UI = 3.0; // non-text: dots, meter fills, chart marks, focus rings

/**
 * The pair list is written by hand rather than generated, because the useful
 * question is not "do all 40 tokens contrast with all 40 tokens" but "does
 * each pair the UI actually renders pass". Adding a new pairing to a
 * component means adding a line here.
 */
const PAIRS = [
  // Text ramp on every surface it can sit on
  ...GROUNDS.flatMap((g) => [
    ["--ops-text", g, AA, "body text"],
    ["--ops-text-secondary", g, AA, "secondary text"],
    ["--ops-text-tertiary", g, AA, "metadata"],
  ]),

  // Accent: link text on every surface, and white label on the filled button
  ...GROUNDS.map((g) => ["--ops-accent", g, AA, "link / action text"]),
  ["--ops-text-inverse", "--ops-accent", AA, "primary button label"],
  ["--ops-text-inverse", "--ops-accent-hover", AA, "primary button label, hover"],
  ["--ops-accent", "--ops-accent-weak", AA, "accent on its own tint"],

  // The destructive button is filled, so its label is checked the same way
  ["--ops-text-inverse", "--ops-risk-fg", AA, "destructive button label"],
  ["--ops-text-inverse", "--ops-risk-solid-hover", AA, "destructive button label, hover"],

  // Status pills: label on tint, and on every bare surface
  ...["ok", "move", "warn", "risk", "idle"].flatMap((t) => [
    [`--ops-${t}-fg`, `--ops-${t}-bg`, AA, `${t} pill label`],
    ...GROUNDS.map((g) => [`--ops-${t}-fg`, g, AA, `${t} text on surface`]),
    [`--ops-${t}-dot`, `--ops-${t}-bg`, UI, `${t} dot on its pill`],
    ...GROUNDS.map((g) => [`--ops-${t}-dot`, g, UI, `${t} dot on surface`]),
  ]),

  // The inverted tile
  ["--ops-focal-fg", "--ops-focal-bg", AA, "focal value"],
  ["--ops-focal-muted", "--ops-focal-bg", AA, "focal label"],

  // Chart marks and gridlines
  ["--ops-series-a", "--ops-surface", UI, "series A mark"],
  ["--ops-series-b", "--ops-surface", UI, "series B mark"],
  ["--ops-series-neg", "--ops-surface", UI, "negative series mark"],
  ...[1, 2, 3, 4].map((i) => [`--ops-cat-${i}`, "--ops-surface", UI, `categorical slot ${i}`]),

  // Structure: a hairline must be visible against the surfaces it divides
  ["--ops-line", "--ops-surface", 1.18, "hairline on surface"],
  ["--ops-line", "--ops-sunken", 1.12, "hairline on sunken"],
  ["--ops-line-strong", "--ops-surface", 1.5, "strong divider"],
];

let failures = 0;
let checks = 0;

for (const [themeName, tokens] of [["light", LIGHT], ["dark", DARK]]) {
  const rows = [];
  for (const [fg, bg, min, label] of PAIRS) {
    const a = tokens[fg];
    const b = tokens[bg];
    if (!a || !b) {
      rows.push({ ok: false, line: `MISSING TOKEN  ${fg} / ${bg}` });
      failures++;
      continue;
    }
    const r = contrast(a, b);
    const ok = r >= min - 1e-9;
    checks++;
    if (!ok) failures++;
    rows.push({
      ok,
      line: `${ok ? "pass" : "FAIL"}  ${r.toFixed(2).padStart(6)} / ${min.toFixed(2)}  ${label}  (${fg} ${a} on ${bg} ${b})`,
    });
  }
  const bad = rows.filter((r) => !r.ok);
  console.log(`\n${themeName.toUpperCase()} — ${rows.length - bad.length}/${rows.length} pairs pass`);
  for (const r of bad) console.log("  " + r.line);
}

/* --- Colour is never the only signal ------------------------------------- */
/**
 * The accent is an orange derived from the SNK logo, which under red-blind
 * vision sits very close to both the warning gold and the overdue red. That
 * is survivable only because status in this product always carries a dot and
 * a word as well. This check records the collision so nobody later "improves"
 * the design by dropping the text label.
 */
function simulate(hex, type) {
  const lin = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const m = type === "protanopia"
    ? [[0.152, 1.053, -0.205], [0.115, 0.786, 0.099], [-0.004, -0.048, 1.052]]
    : [[0.367, 0.861, -0.228], [0.280, 0.673, 0.047], [-0.012, 0.043, 0.969]];
  const out = m.map((row) => row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])
    .map((v) => { v = Math.max(0, Math.min(1, v)); return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)); });
  return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
}
const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
function lab(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };

console.log("\nHUE SEPARATION — light theme, ΔE from the accent");
for (const t of ["warn", "risk", "ok", "move"]) {
  const fg = LIGHT[`--ops-${t}-fg`];
  console.log(
    `  ${t.padEnd(5)} normal ${dE(LIGHT["--ops-accent"], fg).toFixed(1).padStart(5)}` +
    `   protanopia ${dE(simulate(LIGHT["--ops-accent"], "protanopia"), simulate(fg, "protanopia")).toFixed(1).padStart(5)}` +
    `   deuteranopia ${dE(simulate(LIGHT["--ops-accent"], "deuteranopia"), simulate(fg, "deuteranopia")).toFixed(1).padStart(5)}`,
  );
}
console.log("  → status must always carry a dot and a word. Colour alone is not a signal here.");

/* --- No colour literals in components ------------------------------------- */
/**
 * The pair list above verifies tokens. It cannot see a component that writes
 * the colour directly — and one did: the primary button hard-coded
 * `text-white`, which is correct on the dark orange of the light theme and
 * about 2:1 on the bright orange of the dark one. This scan is the half of
 * the gate that catches that.
 *
 * `bg-white/10`-style overlays are allowed: they sit on the focal tile, which
 * is a known dark ground in both themes.
 */
const { readdirSync } = await import("node:fs");
const componentDir = new URL("../components/ops/", import.meta.url);
const LITERAL = /(?<![\w/-])(?:text-(?:white|black)(?![/\w-])|bg-(?:white|black)(?![/\w-])|#[0-9a-fA-F]{3,8}\b|\brgba?\()/;

let literalFailures = 0;
for (const file of readdirSync(componentDir).filter((f) => f.endsWith(".tsx"))) {
  const src = readFileSync(new URL(file, componentDir), "utf8");
  src.split("\n").forEach((line, i) => {
    const code = line.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\*.*$/, "").replace(/\/\/.*$/, "");
    if (LITERAL.test(code)) {
      console.log(`  FAIL  colour literal  components/ops/${file}:${i + 1}  ${line.trim().slice(0, 90)}`);
      literalFailures++;
    }
  });
}
console.log(`\nCOLOUR LITERALS — ${literalFailures === 0 ? "none found" : `${literalFailures} found`}`);
failures += literalFailures;

console.log(`\n${checks} pairs checked, ${failures} failure(s).`);
process.exit(failures ? 1 : 0);
