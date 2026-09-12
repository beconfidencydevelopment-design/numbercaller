/**
 * One name-to-photo lookup for every person in the product.
 *
 * Every avatar call site resolves through here, so a person cannot appear
 * with a photo on one screen and initials on another. Initials are a
 * last-resort fallback for a name with no portrait — not a style.
 *
 * Portraits live in `public/people/<id>.jpg`; provenance and licence are in
 * `public/people/CREDITS.md`.
 */

/** Ids match `DRIVERS` and `PARTNERS` in `./data`. */
const PORTRAIT_IDS = new Set([
  "syed", "kiani", "abc",
  "prabh", "amir", "raj", "sajan",
  "d-a", "d-b", "d-c", "d-d", "d-e", "d-f",
  "d-g", "d-h", "d-i", "d-j", "d-k", "d-l",
  "mike", "hassan",
]);

export function portraitFor(id: string | null | undefined): string | null {
  return id && PORTRAIT_IDS.has(id) ? `/people/${id}.jpg` : null;
}
