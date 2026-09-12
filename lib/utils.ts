import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The console's type scale uses named font sizes — `text-body`, `text-display`
 * — rather than Tailwind's `text-sm` / `text-lg`. tailwind-merge cannot tell a
 * custom `text-*` size from a `text-*` colour, so it classed `text-display` as
 * a colour and dropped it whenever a real colour followed in the same `cn()`:
 *
 *     cn("ops-figure text-display", "text-ops-risk-fg")   →  text-ops-risk-fg
 *
 * Every KPI figure on Home silently rendered at 14px. Registering the scale
 * here is what keeps a size and a colour from colliding.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["micro", "body", "title", "figure", "display", "hero"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
