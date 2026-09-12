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
- **Top pill nav, not a left rail.** Five destinations don't need a permanent
  200px column, the pages under it are wide ledgers, and it is the shape of all
  three references (Finexa, Restro, InvestIQ).
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
    are now separate buttons, "Settle one driver" and "Settle all · $12,850".
    Neither opens a modal yet: the modals are open thread 2 below, and the
    bulk one must actually settle all seventeen when it is built.

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
node scripts/verify-contrast.mjs   # 182 colour pairs, both themes, + CVD + literals
node scripts/verify-ledger.mjs     # 30 reconciliation checks on the books
```

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
2. **Modals.** Log expense, Record payment, Settle driver and Record withdrawal
   exist in the live build and are not yet built here. Their fields are
   captured in the round notes.
3. **Not yet built:** real data layer, auth, export, the mobile breakpoint
   below 900px (the frame goes full-bleed but the tables have not been designed
   for a phone — do not simply let them scroll).
4. **Dark theme** ships behind the toggle in the top bar. It is presentational
   only and the live build has no equivalent; confirm the client wants it kept.
