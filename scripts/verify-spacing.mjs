/**
 * Spacing gate.
 *
 * The console has one spacing scale — 4, 8, 12, 16, 20, 24, 32, 40, 48, 64,
 * 80 — declared as --space-* in app/globals.css and wired into Tailwind's
 * spacing utilities. This scan fails on any padding, margin or gap utility
 * that steps off it: the half-steps (`py-2.5`, `gap-1.5`) and arbitrary pixel
 * values (`py-[6px]`). Heights, widths and sizes are not spacing and are not
 * checked.
 *
 *   node scripts/verify-spacing.mjs
 */
import { readdirSync, readFileSync } from "node:fs";

const dir = new URL("../components/ops/", import.meta.url);
const PROPS = "(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left)";
const OFF_SCALE = new RegExp(`(?<![\\w-])-?${PROPS}-(?:0\\.5|1\\.5|2\\.5|3\\.5|7|9|11|13|14|15|px|\\[[^\\]]+\\])(?![\\w-])`, "g");

let failures = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
  const src = readFileSync(new URL(file, dir), "utf8");
  src.split("\n").forEach((line, i) => {
    const code = line.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\*.*$/, "").replace(/\/\/.*$/, "");
    const hits = [...code.matchAll(OFF_SCALE)].map((m) => m[0]);
    if (hits.length) {
      failures += hits.length;
      console.log(`  FAIL  components/ops/${file}:${i + 1}  ${[...new Set(hits)].join(" ")}`);
    }
  });
}
console.log(`\nSPACING — ${failures === 0 ? "every value on the scale" : `${failures} off-scale value(s)`}`);
process.exit(failures ? 1 : 0);
