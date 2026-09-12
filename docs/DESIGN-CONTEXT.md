# SNK Courier operations console — design context

Read this before changing anything under `app/(ops)`, `components/ops` or
`lib/ops`. It records the decisions behind the build so they don't get undone
by accident.

## What this is

A redesign of SNK Courier's existing operations console, which runs in
production at `snk-courier-operations.lovable.app`.

**The brief is a visual redesign, not a product redesign.** The client was
explicit after the previous round:

> "I asked you to use the exact same features, logic, and content that are
> already in my dashboard. Please don't add anything on your own… You changed
> the purpose of the dashboard by adding things like package tracking, which I
> don't want. I only want you to improve the UI, layout, and overall design and
> make it look more premium and professional."

That earlier round built an exception-first *dispatch* console — shipments,
SLA breaches, routes, driver tracking. It was a well-made product for a
business SNK is not in. It was replaced wholesale in commit *"Rebuild the
console against the client's real product"*; the work is still in git history
if any of it is ever wanted.

The marketing site in this repo (`app/(site)`) is a **different product**
(NumberCaller) and is unrelated. Don't restyle it to match the console.

## What SNK actually does

SNK is a courier **contractor**. It supplies drivers to client companies —
Intelcom, Precision, Rona, Napa, Staples, Canpar — and carries the cost of
those drivers and of the fleet until the companies pay.

That is the whole product. It is a bookkeeping tool, not a logistics tool:

- log expenses per company per day (driver pay, fleet lease, fuel, insurance)
- settle driver payroll
- record client payments and chase the ones that haven't come
- split the result between two partners, Syed 35% / Kiani 65%
- close the month

**The business's real problem is working capital, not delivery.** It pays
drivers weekly and gets paid on 45-day cycles, one client has never paid at
all, and September shows $0 revenue against $12,427 of expenses. Every design
decision below serves that: surface what is owed, by whom, and what is holding
the period open.

## The five screens

These mirror the live build exactly. Do not add a sixth without the client
asking for it.

| Route | Live equivalent | What it answers |
|---|---|---|
| `/ops` | Home | What needs me today? |
| `/ops/expenses` | Expenses | What has been booked this period? |
| `/ops/clients` | Clients | Who owes us, and how exposed are we? |
| `/ops/drivers` | Drivers | Who do we owe, and how much? |
| `/ops/financials` | Financials | Can the month close? |

`/ops/financials` carries the same five tabs as the live build: Overview,
Revenue, Withdrawals, Close period, History.

The console is mounted under `/ops` rather than at `/` only because the
NumberCaller marketing site owns the root of this repo.

## Decisions that must not regress

**Money has two bases and the product says which.** Expenses are recorded when
*incurred*; cash position and the partner split move when money actually
*changes hands*. September reads −$459 distributed against $12,427 of expenses
because only $459 has left the bank. Every money figure in the UI is labelled
with its basis (`incurred`, `finalized`, `cash basis`). The live build prints
all of them in one unlabelled row, which is the single biggest reason its
numbers look broken. See `PeriodSummary` in `lib/ops/types.ts`.

**One ledger is the source of truth for the open period.** `companyHistory()`
derives September from `EXPENSES`; only July and August are transcribed. The
live build keeps a second per-company dataset that disagrees with its own
expense list — its Precision profile books all $4,597 as Driver Pay when the
ledger shows $2,020 of driver pay and a $2,577 fleet lease.

**Driver outstanding is derived, never stored.** `outstandingFor()` is
`logged + carried − settled`. Four of the eighteen drivers carry a balance
from August, and any view that shows `logged` without `carried` produces a row
that does not add up.

**Colour never carries meaning alone.** Every status has a dot *and* a word,
and every negative amount has a minus sign. This is load-bearing here: the
accent is an orange derived from the SNK logo, and under red-blind vision it
sits ~5 ΔE from the warning gold and ~2 ΔE from the overdue red. The numbers
are printed by `scripts/verify-contrast.mjs` on every run.

**The accent is interactive-only.** Buttons, links, focus, the active nav pill.
It is never a status, for the reason above.

## Design system

**The register is calm.** The two references for this round — Opedia's
ShipSync for layout flow, the Skymetrics dashboard for look and feel — agree
on one thing: nothing on the page shouts. That translated into four rules.

- **Neutral greys, not warm.** Canvas `#ededee`, workspace `#f4f4f5`, cards
  white with an `#e8e8ea` edge and no shadow. Depth comes from hairlines.
- **Geist Mono for every numeral, label and caption.** `.ops-num`,
  `.ops-figure`, `.ops-eyebrow` all set the mono; Geist for titles and copy.
  This is most of what makes the console read as a ledger — figures across
  four cards share one rhythm and can be compared without effort.
- **No dark tiles.** The inverted focal card is gone from Home; hierarchy is
  carried by position and size. `--ops-focal-*` tokens remain for any future
  overlay but nothing on the five screens uses them.
- **A left rail.** The client's own build, ShipSync and Skymetrics all use
  one. Five items, counts in the mono, the active item marked by a tint and a
  2px accent hairline on its left edge — not a filled pill.

**Home follows the ShipSync flow exactly:** four headline figures → a slim
period strip → one wide card with two narrow beside it, all three built to the
same height → the full-width Companies table → Monthly comparison with Recent
activity beside it.

**Icons come from one file.** `components/icons.tsx` re-exports HugeIcons
(Stroke Rounded, 24 grid, 1.5 stroke, both packages MIT) under our own names —
`IconHome`, `IconArrowRight` and so on. Nothing else imports the library, so
swapping it again is a one-file change. Naming gotcha: a HugeIcons name ending
`01` is a chevron and `02` is a shafted arrow — 02 for calls to action, 01 for
steppers. The marketing site keeps lucide; the two products do not share an
icon set.

**Every person has a photograph.** `lib/ops/people.ts` is the single
name-to-portrait lookup and every `<Avatar>` resolves through it; initials are
a fallback for a missing portrait, never the default. Portraits are in
`public/people/`, licence and provenance in `CREDITS.md` there. **`syed.jpg`
and `kiani.jpg` stand in for two real people — the client's own partners — and
must be swapped for their actual photographs before this ships.**

**Type is one scale**, six steps declared as `--text-*` in `app/globals.css`
and used as `text-body`, `text-display` and so on — each carrying its own
line-height and tracking:

| Step | Size | Used for |
|---|---:|---|
| `text-micro` | 12px | axis ticks, legends, status pills, avatar discs, compact row actions |
| `text-body` | 14px | **the workhorse** — copy, labels, captions, table headers *and* cells |
| `text-title` | 18px | card titles |
| `text-figure` | 22px | secondary figures inside a card |
| `text-display` | 28px | page title, KPI figures |
| `text-hero` | 34px | the one hero amount on a card |

Measured off the reference rather than guessed: its hierarchy is three
registers — display at ~2.8× body, card title at ~1.3×, and body, labels and
captions all at 1× separated by **colour, not size**. Ours had drifted to
fifteen sizes with 11/12/13/14px doing 157 of 202 uses, which is four steps a
pixel apart: noise, not hierarchy. Hence the rule that **secondary text gets
greyer, never smaller** — `verify-type.mjs` fails if `micro` ever outnumbers
`body`.

Weight is the same discipline: regular is the default (`.ops-root` sets 400),
medium carries figures and titles, and `font-semibold` is banned outright —
the gate fails on it. The audit that started this pass found 102 semibold to
85 medium; when everything is emphasised nothing is.

**`cn()` registers the scale with tailwind-merge** (`lib/utils.ts`). Without
that, twMerge cannot tell a custom `text-*` size from a `text-*` colour and
silently drops the size: `cn("text-display", "text-ops-risk-fg")` rendered
every KPI figure at 14px. If you add a step, add it there too.

**Spacing is one scale**, declared as `--space-1` … `--space-20` (4, 8, 12,
16, 20, 24, 32, 40, 48, 64, 80) and wired into Tailwind so `p-4` *is*
`--space-4`. Half-steps and arbitrary pixel values are off the scale;
`scripts/verify-spacing.mjs` fails on them.

**Desktop breakpoints.** The three-column rows are tuned for 1440 and switch
on at the custom `wide` breakpoint (87.5rem / 1400px) — Tailwind's `xl` is
1280, which truncated labels and wrapped titles on a 13-inch laptop. The rail
appears at `lg` (1024). Custom breakpoints must be in rem: v4 cannot sort a
`px` breakpoint against its rem defaults and emits it early, so the smaller
breakpoint's rule wins. Verified widths: 1024, 1280, 1440, 1680, 1920 — none
scroll horizontally.

Tokens live in `app/globals.css`. Do not hard-code colour in a component —
`scripts/verify-contrast.mjs` fails the build if you do.

- **Brand.** `--ops-brand` `#f37124` is the logo orange from the client's asset
  pack, and is used *only* where the mark appears: it measures 2.92:1 against
  white and cannot legally carry text. `--ops-accent` `#b0480a` is the same hue
  (22.5°) and saturation (0.90) darkened until it clears 4.5:1 as a button
  ground and as link text on every surface. Two tokens, so nobody "fixes" the
  logo to match the buttons. `--ops-brand-ink` `#2d2e32` is the logo's charcoal
  and is the light-theme focal tile.
- **Warm neutral surfaces.** A cool grey ramp under an orange accent reads
  cheap. The ramp is warm and near-zero chroma so status colour stays the only
  saturated thing on screen.
- **14px base, 40px rows, tabular numerals in every column.** Down from the
  live build's 16px/44px. `.ops-num` for anything in a column, `.ops-figure`
  for a large standalone number — tabular digits look loosely spaced at display
  sizes.
- **`.ops-card` is the single card treatment**, declared inside
  `@layer components` so Tailwind utilities can still override it. Unlayered it
  would beat `bg-ops-focal-bg` and silently flatten the one inverted tile.
- **The app sits in a floating frame** (`.ops-frame`), full-bleed below 900px.
  Shared by all three dashboards the client picked as references.
- **A ledger ends in a total.** Every table has a `tfoot` that adds the column
  up. The live build ends its expense table in "Showing 1–23 of 23".

## Figures corrected from the live build

The client asked for the same content. These are places where the live build
contradicts **itself**, so the content could not be copied verbatim without
copying a visible error. In every case the *figures* were kept and the
*labels* or the *derivation* were corrected. **Each one needs the client's
confirmation.**

1. **"Today's logging · Sep 4"** showed 23 entries and $5,200. Sep 4 has 8
   entries totalling $1,785; 23 and $12,427 are the period figures. Retitled
   "Logged this period" and the total now matches the Expenses page.
2. **The "new entries" banner** said 12 entries / $3,200 above a feed listing
   16 entries / $3,345. Both now derive from the feed.
3. **Eight driver cards** read "5 entries" and "No entries logged" at once.
   A missing date now renders as "no date recorded".
4. **The driver table** showed Logged $2,100, Settled $0, Outstanding $2,900
   with no column explaining the $800. A "Carried" column was added.
5. **The expenses list** showed Sat 5 and Sun 6 September as "No operations"
   — both in the future from its own clock. Future days are not rendered.
6. **"By company" on Financials** omitted the Global insurance row, so the
   rows summed to $11,509 under a total of $12,427. Global is now a row.
7. **Precision's "↑ 12% vs last month"** sat above a table giving 8.9%. The
   change is now derived.
8. **Canpar** was flagged "Never paid" in red with $0 of activity. Dormant
   accounts read "No activity"; only companies actually owed money are flagged.
9. **Company onboarding dates** rendered as "Aug 1" from month-precision data.
   They render as "Aug 2026".
10. **The "Settle all · $12,850" button** opened a single-driver picker — the
    label promised a bulk action and delivered a single one. The two actions
    are now one dialog with a scope control, "One driver" or "All 17
    unsettled", so the payroll arithmetic lives in one place. The per-driver
    action moved onto the driver card and the payroll row it settles, which is
    what removed the header's single-driver picker entirely.

11. **Home's cash-position caption** read "Last: $45,156 from Intelcom · Sep 1"
    above a revenue figure of $0 — it cites a payment that is still sitting in
    *draft* on the Revenue tab as though the cash had arrived. The caption now
    says what the draft is and that it has not reached the bank.
12. **"Pay 2 bills · $918"** counts two bills against a single $918 insurance
    entry. The amount is kept; the count is derived, so it reads "Pay 1 bill".
13. **"18 days ago" / "28 days ago" / "21 days ago"** on the company list are
    measured from about Sep 8, while the build's own clock is Sep 4. All
    elapsed times are now derived from the period clock, so Intelcom reads 14
    days rather than 18.

Two things were **left exactly as they are** and need a decision:

- **Cash position and Net profit are the same −$459** on the Home headline row.
  Two of four headline cards showing one number is a real redundancy, but
  removing one is a content change. Ask before merging them.
- **August 2026 distributes −$28,734** against revenue $82,980 and expenses
  $126,350, which subtract to −$43,370. July reconciles exactly; August does
  not. The most likely reading is that August closed with ~$14,636 of expense
  unpaid, which is consistent with the carried-forward vehicle rent — but it is
  a guess. The console labels the column "Distributed (cash basis)" and
  footnotes the gap rather than changing the number.

## Home — the reference's chart set, verbatim

The client asked for the same graphs as Zajno's Skymetrics, in the same
places, so Home now runs: four stat tiles → a two-series line with a crosshair
tooltip beside a segmented funnel → a semicircle gauge, a composition bar with
legend, and a mini table → the Companies ledger → Actions pending beside the
activity feed → the client's Monthly comparison table.

Rules that came with it:

- **One typeface.** Geist for everything. Numerals get `tabular-nums` in
  columns and proportional figures standalone — a feature setting, not a
  second font.
- **Deltas are coloured by direction** — up green, down red, flat grey — as
  the reference and the client's own build do. Tinting by "is this good?" made
  every card on a bad month red and lost the one thing the tint is for.
- **Cards in a row share a height.** Grid rows stretch and the chart or list
  inside absorbs the difference; the bottom edge is never padded.
- **An open period is drawn faint and dashed** on the line, with the wash
  stopping at the last closed month, so a four-day-old September does not
  read as revenue collapsing. Its axis label sits in a pill.
- **20px card padding, 20px gutters, 14px body, 28px figures.**

## Home — which form, where, and why (the reasoning behind each block)

The reference for this round is Zajno's Skymetrics dashboard (Dribbble
27460154). Its vocabulary is specific and every card on Home now follows it:
a grey title, one sentence saying what the card shows, the headline figures
with legend dots on the right, then the chart; dashed hairlines for rules and
gridlines; **sans for every label, mono for every numeral**. Forms were
chosen per block by the data's job, not by what looked empty — and three
blocks deliberately have no chart.

| Block | Data's job | Form | Why not the alternative |
|---|---|---|---|
| Four headline figures | one current value + change | **stat tile** (label, pill, mono figure, arrow disc, caption) | A sparkline would be four points, two of them flat |
| Actions pending | five items with a count each | **list + segmented meter** ("1 of 18" as lit pills) | A bar per amount cost the client's labels their last word at 1440 |
| Partner split | two fixed shares of one figure | **small table** with dashed rules | The 35/65 split is definitional; a pie would draw a constant |
| Monthly comparison | two series over three periods | **grouped columns**, open period faint, month in a pill | A line over three points invents a slope; a dual axis is banned |
| Driver settlement | one ratio against a limit | **semicircle gauge** (1 of 18 settled) + totals below | A 2-slice pie; a bar that would be 94% red |
| Companies | six rows, mixed attributes | **table** with a magnitude bar in the spend cell | The bar earns its place here: 5,862 against 450 is read at a glance |
| Logged this period | part-to-whole across five payers | **composition bar** with a legend, own costs in grey as "Other" | A donut for five close-ish values; more than six segments |
| Recent activity | a feed | **list** | — |

Palette decisions were computed, not eyeballed, with the dataviz validator:
revenue `#b0480a` / expenses idle-grey is the *emphasis* form (one hue plus
grey); the four company slots `#b0480a #2563eb #0d9488 #7c3aed` (dark
`#e26520 #4f8ff7 #14a08f #a56ff0`) pass lightness band, chroma floor,
adjacent-pair CVD ΔE ≥ 15, normal-vision ΔE ≥ 18 and 3:1 on both surfaces.
Green was rejected as a category because it is the settled/paid status
colour. The dark series colour steps down from the accent (`#fa8138` is too
light for a mark, L 0.73 against a 0.48–0.67 band).

Rows are paired by height: the five-row list beside the gauge, the tall chart
card beside two stacked cards, the ledger and the composition card full width.

## Home layout

The page is **one main column and one rail, each a continuous stack** — not a
series of two-column rows. That distinction is the whole reason the page went
from 1675px to 1405px:

Three independent `grid-cols-[1.35fr_1fr]` rows pad the shorter card in each
row out to the height of the taller one. On this content that left roughly
480px of empty surface down the right-hand side, in three separate holes. With
each column flowing on its own, a card sits directly under the card above it
and the two columns run out together. If you add a card, add it to a stack —
do not start a new two-column row.

Density rules that came out of the same pass:

- **No sparkline on the headline figures.** The period is four days old; any
  trend line is four points wide and two of them are flat. The space goes to a
  sentence explaining the figure, which is what Wave, Xero and QuickBooks all
  do with it.
- **Companies is a table, not a stack of cards with progress bars.** Six rows
  at 36px is a block you take in at once; the same six as cards was 440px of
  mostly air.
- **Headline figures: value first, then a hairline, then the label.** The
  figure is what the eye lands on, so it leads; the label underneath is
  confirmation, with a small icon in a tinted disc. The month-over-month chip
  sits beside the value. This is the shape the current Dribbble crop has
  settled on (Repo Studio's Fluxo, Excited's Ledge, Sujon Hossain's Raxon) and
  it reads as a ledger rather than a template.
- **Deltas are the client's own figures**, transcribed in `HEADLINE_DELTA`
  and labelled "vs last month" as their cards say. The demo ledger has no
  August to compute against; swap for a derived value when the API has prior
  periods. Direction tint is decided per figure — rising expenses are red,
  rising revenue would be green.
- **Segmented meters, not continuous bars, for counts.** "17 of 18 drivers"
  is eighteen units, so `DottedMeter` draws eighteen. Continuous fills are
  reserved for money against money.
- **A line icon in a tinted disc before every card title.** Gives each block
  an identity at a glance; every recent reference does it.
- Reference screens for this page: Wave's Payable & Owing, Xero's financial
  position, QuickBooks' Business at a glance, Monarch's cash-flow report
  (Mobbin); Fluxo, Ledge, Raxon and Ronas IT's fintech dashboard (Dribbble,
  Aug–Sep 2026). What was deliberately *not* taken from Dribbble: serif
  display numerals, kebab menus that do nothing, decorative sparklines, AI
  assistant panels.

## Conventions

**Next.js version.** See `AGENTS.md` — this is not the Next.js in your training
data. Read the relevant guide in `node_modules/next/dist/docs/` before writing
framework code.

**Round any coordinate that reaches the DOM.** Trigonometry lands on a
different final binary digit in Node than in the browser — one gauge arc came
out `45.17585349808353` on the server and `...354` on the client — and React
compares path strings character by character, so the page threw a hydration
mismatch on every load. `primitives.tsx` rounds to three decimals, which is a
thousandth of a unit on a 200-unit viewBox. Any new chart that computes
coordinates has to do the same.

**Demo data is deterministic.** `NOW` in `lib/ops/data.ts` is a fixed clock
(Fri 4 Sep 2026, 14:35 Toronto) and nothing is generated. Never use
`Date.now()` or `Math.random()` in render — server and client would disagree
and React throws a hydration mismatch. All `Intl` formatters pin `en-CA` and
`America/Toronto`: the clients are Intelcom, Canpar and Rona, and the business
writes cheques, not checks. `scripts/verify-ledger.mjs` fails if any of this
regresses. Swap the module for the API at that seam.

**No `setState` inside an effect,** and no reassigning a closure variable
during render. The React compiler lint rejects both. Use `useSyncExternalStore`
for external state (`lib/ops/client-state.ts`) and precompute derived lists.

## Verification — run both before shipping

```
node scripts/verify-contrast.mjs   # 190 colour pairs, both themes, + CVD + literals
node scripts/verify-ledger.mjs     # 36 reconciliation checks on the books
node scripts/verify-spacing.mjs    # every padding/margin/gap on the 4-80 scale, + card direction
node scripts/verify-type.mjs       # every size on the scale; no semibold
```

The fifth gate drives a browser, so it needs the dev server running and a copy
of puppeteer-core. Without one it skips rather than fails.

```
PUPPETEER_CORE=/path/to/puppeteer-core node scripts/verify-dialogs.mjs
```

It checks the things a screenshot cannot show and the compiler cannot see: the
focus trap, the body scroll lock, focus returning to the control that opened
the dialog, and every invalid field stating its reason in words rather than
only turning red.

There is no eyeballing of contrast on this project. `verify-contrast` reads the
tokens out of `globals.css` so it cannot drift from what ships, and it scans
components for hard-coded colour — added after a `text-white` on the primary
button shipped at ~2:1 in dark theme while every token pair passed.

**Then look at it.** Build, run, screenshot at 1440, and read the numbers as a
bookkeeper would. Almost every defect worth fixing on this project was found by
looking, not by reading code: a "Drivers paid" tile counting drivers nobody had
paid, two headline cards showing the same figure, a dormant client flagged as a
bad debt. Data that is technically correct but implausible is still a bug.

## Open threads

1. **The two decisions above** — the duplicate headline card, and August's
   distributed figure.
2. **What the modals do on submit.** All four are built, validated and
   keyboard-complete (`components/ops/modal.tsx` for the shell,
   `ops-modals.tsx` for the forms). They hand a typed payload to a submit
   handler and then confirm, in the ledger's own figures, exactly where the
   entry would land — `$12,427 → $12,667`, `Prabh $2,900 → $3,140`. They do
   not write to the demo ledger, because half the value of this console is
   that one figure reconciles across five screens and a live mutation would
   quietly break that. Wiring them to a real store is one function per form;
   the reconciliation gate has to be re-thought first.
3. **Other buttons that do not open anything yet:** Finalize and Edit on
   draft revenue, Pause and Edit on auto-recurring entries, Details and Reopen
   on closed periods, Pay on the unpaid bill, Export, Add driver, Add company.
   None were in the four; say whether any of them matter for the next round.
4. **Not yet built:** real data layer, auth, export, the mobile breakpoint
   below 900px (the frame goes full-bleed but the tables have not been designed
   for a phone — do not simply let them scroll).
5. **Dark theme** ships behind the toggle in the top bar. It is presentational
   only and the live build has no equivalent; confirm the client wants it kept.
