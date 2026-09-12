# SNK Courier Operations Console — design context

Read this before changing anything under `app/(ops)`, `components/ops` or
`lib/ops`. It records the decisions behind the build so they don't get
undone by accident.

## What this is

A redesign of a courier operations dashboard for a client (SNK Courier).
The original was built in Lovable at `snk-courier-operations.lovable.app`.

**Nobody on this project has seen the original build.** It was unreachable
from the environment where this was designed, so everything here comes from
courier-operations first principles plus three reference dashboards the
client supplied (Finexa, Restro, InvestIQ). A pass against the real build is
still outstanding — see Open threads.

The marketing site in this repo (`app/(site)`) is a **different product**
(NumberCaller) and is unrelated. Don't restyle it to match the console.

## The core thesis

The default output of an AI builder is *four KPI cards, a chart, a table* —
an analytics layout answering "how did last month go?" for a manager who
visits weekly.

A dispatcher asks a different question all day: **"what is going wrong right
now, and what do I do about it?"**

Rather than compromise between them, the console has two front doors:

| Route | Audience | Character |
|---|---|---|
| `/ops/overview` | Owner / manager | Analytics. Hero figure, meters, trend, activity. Follows the client's references. |
| `/ops` (Today) | Dispatcher | Exception-first shift board. Dense, worklist-led. **The default route.** |

If you are asked to "make Today more like the references", push back: that
undoes the thesis. Overview is where reference-style analytics belongs.

## Domain decisions that must not regress

**Status and SLA are orthogonal.** A parcel can be `out_for_delivery` *and*
past its promise. Collapsing them into one status column hides the fact the
business is paid on. See `lib/ops/types.ts`.

**Ranking is banded, not additive** (`rank()` in `lib/ops/data.ts`). SLA state
is the primary key; problem flags rank only *within* a band. An earlier
additive version floated an exception with seven hours of slack above a
parcel two hours past its promise. Modifiers are capped well below one band
step — keep them that way.

**Triage buckets are mutually exclusive** (`triage()` in `today-view.tsx`).
Each shipment is claimed by the most severe bucket that matches, once. The
overlapping version made an operator handle the same parcel twice and
overstated the workload.

## Design system rules

Tokens live in `app/globals.css`. Do not hard-code colour in components.

- **Saturated colour is reserved for status.** Surfaces are near-monochrome so
  one red badge still reads on a screen of thirty rows.
- **Status is never colour alone.** Every pill carries a dot *and* a text
  label. Survives colour-blindness and greyscale.
- **13px base, 36px rows, tabular numerals** in columns. Density is a feature:
  a dispatcher needs thirty rows on screen, not eight. Hero and stat values
  use `.ops-figure` (proportional numerals) — tabular digits look loose at
  display sizes.
- **`.ops-card` is the single card treatment.** Change it there, not per
  component.
- **The app sits in a floating frame** (`.ops-frame`), inset with a large
  radius, full-bleed below 900px. This is the most consistent signal across
  all three client references.
- **Every colour pair is contrast-verified**, both themes, before it ships.
  There is no eyeballing on this project — write a script and run it.

### Two brands, one build

`data-brand="violet" | "orange"` on the root element, applied pre-hydration
alongside the theme. The switch (`BrandSwitch` in `app-shell.tsx`) is a
**review control**.

When the client signs off: delete `BrandSwitch`, its `useBrand` hook, and the
losing `data-brand` block in `globals.css`.

Orange notes: the vivid orange in the client's references measures 3.09:1
against white button text and fails WCAG AA. `#c74106` is the most saturated
orange that clears 4.5:1 as both a button ground and link text on every
surface. The orange variant also shifts the amber "at risk" tokens toward
yellow, because an orange accent otherwise crowds the warning state.

## Conventions

**Next.js version.** See `AGENTS.md` — this is not the Next.js in your
training data. Read the relevant guide in `node_modules/next/dist/docs/`
before writing framework code.

**Demo data is deterministic.** `NOW` in `lib/ops/data.ts` is a fixed clock
and all generators are seeded (`mulberry32`). Never use `Date.now()` or
`Math.random()` in render — server and client would disagree and React throws
a hydration mismatch. All `Intl` formatters pin an explicit locale and
timezone for the same reason. Swap the generator for the API at that seam.

**No `setState` inside an effect.** The React compiler lint rejects it.
Use `useSyncExternalStore` for external state (see `lib/ops/client-state.ts`)
and the adjust-during-render pattern for "reset when input changes".

**Verify by looking.** Every defect of consequence on this project was found
by screenshotting the running app, not by reading code — a fake 100% on-time
rate, duplicate parcels across triage buckets, future-dated delivery events,
projected stop times displaying as hours in the past, service percentages of
"50%" and "100%" from a three-item sample. Build, run, screenshot, read the
numbers as a domain expert would. Data that is technically correct but
implausible is still a bug.

## Screens

Designed: Overview, Today, Shipments, Exceptions, Drivers, Routes, Reports,
Settings. No placeholders remain.

States built: empty (copy varies per view), loading skeleton matched to real
row height, keyboard navigation, command palette (⌘K), detail drawer, bulk
selection, density toggle, dark theme.

## Open threads

1. **Brand decision** — violet vs orange, with the client. Recommendation:
   violet (orange is the sector default and crowds the warning state).
2. **The AI assistant pill** from the Finexa reference was deliberately left
   out. Adding it to the nav implies a feature nobody has scoped.
3. **Compare against the real Lovable build** once it is reachable, to check
   nothing the client depends on has been dropped.
4. **Not yet built:** real data layer, auth, live updates, driver-facing
   mobile (a separate surface — do not cram the ops table into a phone).

## Review deliverable

A client-facing design review page is published as a Claude Artifact and has
been updated each round. Ask the project owner for the link before writing a
new one.
