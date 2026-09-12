/**
 * Type gate.
 *
 * The console has one type scale — micro 12, body 14, title 18, figure 22,
 * display 28, hero 34 — declared as `--text-*` in app/globals.css and used
 * through `text-body`, `text-display` and friends. This scan fails on an
 * arbitrary `text-[13px]`, which is how the last scale drifted to fifteen
 * sizes with four of them a pixel apart.
 *
 * It also caps `font-semibold`: the reference sets almost everything in
 * regular and reserves medium for figures and titles. When everything is
 * emphasised nothing is.
 *
 *   node scripts/verify-type.mjs
 */
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../components/ops/", import.meta.url);
const ARBITRARY = /text-\[[0-9.]+(?:px|rem|em)\]/g;
const SEMIBOLD = /\bfont-(semibold|bold)\b/g;

let failures = 0;
const seen = new Map();

for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
  const src = readFileSync(new URL(file, dir), "utf8");
  src.split("\n").forEach((line, i) => {
    const code = line.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\*.*$/, "").replace(/\/\/.*$/, "");
    for (const m of code.matchAll(ARBITRARY)) {
      console.log(`  FAIL  off-scale size  components/ops/${file}:${i + 1}  ${m[0]}`);
      failures++;
    }
    for (const m of code.matchAll(SEMIBOLD)) {
      console.log(`  FAIL  heavy weight    components/ops/${file}:${i + 1}  ${m[0]}`);
      failures++;
    }
  });
  for (const m of src.matchAll(/\btext-(micro|body|title|figure|display|hero)\b/g)) {
    seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
  }
}

const order = ["micro", "body", "title", "figure", "display", "hero"];
console.log("\nTYPE — usage by step");
for (const step of order) console.log(`  ${step.padEnd(8)} ${String(seen.get(step) ?? 0).padStart(4)}`);

/* Body must be the workhorse. A scale where the smallest step outnumbers the
   body step is one where secondary text was made smaller instead of greyer. */
const body = seen.get("body") ?? 0;
const micro = seen.get("micro") ?? 0;
if (micro > body) {
  console.log(`\n  FAIL  micro (${micro}) outnumbers body (${body}) — secondary text should be grey, not small`);
  failures++;
}

console.log(`\n${failures === 0 ? "every size on the scale" : `${failures} violation(s)`}`);
process.exit(failures ? 1 : 0);
