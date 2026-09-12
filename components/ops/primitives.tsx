import * as React from "react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/ops/types";
import { money } from "@/lib/ops/format";

/**
 * Saturated colour in this console means exactly one thing: the state of an
 * amount. These maps are the only place it enters the UI, which is what keeps
 * a single overdue row legible on a screen of twenty.
 *
 * The accent is deliberately absent. It is an orange derived from the SNK
 * logo and under red-blind vision it sits within a few ΔE of both the warning
 * gold and the overdue red — so it is reserved for things you can click, and
 * never used to say what something *is*.
 */
const TONE_PILL: Record<StatusTone, string> = {
  ok: "bg-ops-ok-bg text-ops-ok-fg ring-ops-ok-line",
  move: "bg-ops-move-bg text-ops-move-fg ring-ops-move-line",
  warn: "bg-ops-warn-bg text-ops-warn-fg ring-ops-warn-line",
  risk: "bg-ops-risk-bg text-ops-risk-fg ring-ops-risk-line",
  idle: "bg-ops-idle-bg text-ops-idle-fg ring-ops-idle-line",
};

export const TONE_DOT: Record<StatusTone, string> = {
  ok: "bg-ops-ok-dot",
  move: "bg-ops-move-dot",
  warn: "bg-ops-warn-dot",
  risk: "bg-ops-risk-dot",
  idle: "bg-ops-idle-dot",
};

export const TONE_TEXT: Record<StatusTone, string> = {
  ok: "text-ops-ok-fg",
  move: "text-ops-move-fg",
  warn: "text-ops-warn-fg",
  risk: "text-ops-risk-fg",
  idle: "text-ops-text-secondary",
};

/**
 * Status is never encoded by colour alone: every pill carries a dot *and* a
 * word, so it survives greyscale, printing and colour blindness.
 */
export function StatusPill({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2 py-1 text-[12px] font-medium whitespace-nowrap ring-1 ring-inset",
        TONE_PILL[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])} aria-hidden />}
      {children}
    </span>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-ops-line bg-ops-sunken px-2 py-1 text-[12px] font-medium whitespace-nowrap text-ops-text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  className,
  tone = "idle",
}: {
  initials: string;
  className?: string;
  tone?: "idle" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide",
        tone === "accent"
          ? "bg-ops-accent-weak text-ops-accent"
          : "bg-ops-active text-ops-text-secondary",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-ops-line bg-ops-sunken px-1 py-1 font-mono text-[11px] leading-4 text-ops-text-tertiary">
      {children}
    </kbd>
  );
}

/* -------------------------------------------------------------------------- */
/* Money                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The money primitive.
 *
 * Tabular by default so columns align on the decimal, and negative amounts
 * take the overdue colour *in addition to* a minus sign — never instead of.
 * `positiveTone` is off by default because in a ledger most positive numbers
 * are just amounts, not good news.
 */
export function Money({
  value,
  className,
  signed = false,
  tone = true,
  positiveTone = false,
}: {
  value: number;
  className?: string;
  signed?: boolean;
  tone?: boolean;
  positiveTone?: boolean;
}) {
  const negative = value < 0;
  return (
    <span
      className={cn(
        "ops-num whitespace-nowrap",
        tone && negative && "text-ops-risk-fg",
        tone && positiveTone && value > 0 && "text-ops-ok-fg",
        className,
      )}
    >
      {money(value, { signed })}
    </span>
  );
}

/**
 * Month-over-month change.
 *
 * Coloured by direction — up is green, down is red, flat is grey — which is
 * how both the reference and the client's own build read it. An earlier
 * version tinted by whether the move was *good*, which made every card on a
 * bad month red and lost the one thing the tint is for: telling up from
 * down at a glance. Direction is also carried by the arrow, never by tint
 * alone.
 */
export function DeltaChip({
  pct,
  dir,
  good,
  caption = "vs last month",
  className,
}: {
  pct: number;
  dir: "up" | "down" | "flat";
  /** Whether this movement is good news. Ignored when flat. */
  good?: boolean;
  caption?: string;
  className?: string;
}) {
  void good; // kept for callers; tint follows direction, as the reference and the client's build do
  const tone: StatusTone = dir === "flat" ? "idle" : dir === "up" ? "ok" : "risk";
  // Flat reads "— 0%", as the client's cards print it; a bare "—0%" looks like a negative.
  const glyph = dir === "up" ? "↑" : dir === "down" ? "↓" : "— ";
  return (
    <span className={cn("inline-flex items-baseline gap-2 text-[12px]", className)}>
      {/* Tint only, no ring — the pill should sit on the card, not on top of it. */}
      <span className={cn("ops-num rounded-[5px] px-2 py-1 text-[12px] font-medium", TONE_PILL[tone].replace(/ ring-[^ ]+/g, ""))}>
        {glyph}{pct}%
      </span>
      {caption && <span className="ops-num text-ops-text-tertiary">{caption}</span>}
    </span>
  );
}

/**
 * A segmented meter.
 *
 * Reads as a count of discrete units rather than a continuous fill, which is
 * the honest shape for "17 of 18 drivers" — and it is a treatment the
 * generated-dashboard look never reaches for.
 */
export function DottedMeter({
  value,
  max,
  tone = "accent",
  segments = 24,
  className,
}: {
  value: number;
  max: number;
  tone?: "accent" | StatusTone;
  segments?: number;
  className?: string;
}) {
  const filled = max > 0 ? Math.round((value / max) * segments) : 0;
  const on = tone === "accent" ? "bg-ops-accent" : TONE_DOT[tone];
  return (
    <div className={cn("flex h-2 w-full gap-1", className)} aria-hidden>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={cn("h-full min-w-0 flex-1 rounded-[2px]", i < filled ? on : "bg-ops-active")} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Structure                                                                   */
/* -------------------------------------------------------------------------- */

export function SectionTitle({
  title,
  count,
  hint,
  action,
  icon: Icon,
  className,
}: {
  title: string;
  count?: number;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  /** A small line icon in a tinted disc before the title. */
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-8 w-full items-center gap-2", className)}>
      {Icon && (
        <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-ops-sunken text-ops-text-secondary ring-1 ring-inset ring-ops-line">
          <Icon className="size-3.5" />
        </span>
      )}
      <h2 className="whitespace-nowrap text-[14px] font-semibold tracking-[-0.01em] text-ops-text">{title}</h2>
      {count !== undefined && (
        <span className="ops-num rounded-md bg-ops-active px-2 py-1 text-[12px] font-semibold text-ops-text-secondary">
          {count}
        </span>
      )}
      {hint && <span className="truncate text-[13px] text-ops-text-tertiary">{hint}</span>}
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return <Tag className={cn("ops-card", className)}>{children}</Tag>;
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 border-b border-ops-line px-4 py-3", className)}>
      {children}
    </div>
  );
}

/**
 * One empty state shape for the whole console, with copy supplied per use.
 * A generic "No data" tells the reader nothing; every caller says what would
 * put something here.
 */
export function EmptyState({
  title,
  detail,
  action,
  className,
}: {
  title: string;
  detail?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="text-[14px] font-medium text-ops-text">{title}</div>
      {detail && <p className="mt-1 max-w-[42ch] text-[13px] text-ops-text-secondary">{detail}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Charts                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Shape only: no axis, no labels, no tooltip. The number beside it carries the
 * value. That is the honest use of a sparkline — it answers "which way is this
 * going", never "what is it".
 */
export function Sparkline({
  values,
  stroke = "var(--ops-series-a)",
  fill,
  className,
}: {
  values: number[];
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pt = (v: number, i: number) =>
    `${((i / (values.length - 1)) * 100).toFixed(2)},${(22 - ((v - min) / span) * 18).toFixed(2)}`;
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${pt(v, i)}`).join(" ");
  const id = React.useId();

  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className={cn("h-6 w-full", className)} aria-hidden focusable="false">
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fill} stopOpacity="0.28" />
              <stop offset="100%" stopColor={fill} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L100,24 L0,24 Z`} fill={`url(#${id})`} />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Horizontal share bar. A part-to-whole comparison across a handful of named
 * categories reads faster as ranked bars than as a donut — the labels sit on
 * the baseline and the lengths are directly comparable.
 */
export function ShareBar({
  value,
  max,
  tone = "accent",
  className,
}: {
  value: number;
  max: number;
  tone?: "accent" | StatusTone;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(value > 0 ? 2 : 0, (value / max) * 100) : 0;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ops-active", className)}>
      <div
        className={cn(
          "h-full rounded-full",
          tone === "accent" ? "bg-ops-accent" : TONE_DOT[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** A value against a target. A ratio against a limit is a meter, not a donut. */
export function Meter({
  value,
  target,
  tone = "ok",
  className,
}: {
  value: number;
  target: number;
  tone?: StatusTone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-ops-active", className)}>
      <div className={cn("absolute inset-y-0 left-0 rounded-full", TONE_DOT[tone])} style={{ width: `${pct}%` }} />
      <div className="absolute inset-y-0 w-px bg-ops-text-tertiary" style={{ left: `${target}%` }} aria-hidden />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                    */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "default" | "ghost" | "quiet";

const BUTTON: Record<ButtonVariant, string> = {
  primary: "bg-ops-accent text-ops-text-inverse hover:bg-ops-accent-hover border-transparent",
  default: "bg-ops-surface text-ops-text border-ops-line hover:bg-ops-hover",
  ghost: "bg-transparent text-ops-text-secondary border-transparent hover:bg-ops-hover hover:text-ops-text",
  quiet: "bg-ops-sunken text-ops-text-secondary border-ops-line hover:bg-ops-hover hover:text-ops-text",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" }
>(function Button({ variant = "default", size = "md", className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        /* A disabled control goes neutral rather than translucent. Fading the
           accent leaves a washed orange that still reads as the primary
           action, and puts white text on a ground it no longer contrasts
           with. */
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--ops-r-control)] border font-medium transition-colors",
        "disabled:pointer-events-none disabled:border-ops-line disabled:bg-ops-active disabled:text-ops-text-tertiary",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[14px]",
        BUTTON[variant],
        className,
      )}
    />
  );
});

/**
 * An inline action inside a row.
 *
 * The client's build renders these as bare orange words. Giving them a border
 * means the affordance is carried by shape, so the accent is not the only
 * thing separating "you can click this" from "this is overdue".
 */
export function RowAction({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-ops-accent-line bg-ops-accent-weak px-2 text-[12px] font-semibold text-ops-accent transition-colors hover:border-ops-accent hover:bg-ops-accent hover:text-ops-text-inverse",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Chart pieces — the Skymetrics vocabulary                                    */
/* -------------------------------------------------------------------------- */

/** A small arrow in a tinted disc, set beside a figure. Direction is the glyph; the tint reinforces it. */
export function ArrowGlyph({ dir, good, className }: { dir: "up" | "down" | "flat"; good?: boolean; className?: string }) {
  if (dir === "flat") return null;
  void good;
  const tone: StatusTone = dir === "up" ? "ok" : "risk";
  return (
    <span
      className={cn(
        "inline-grid size-4 shrink-0 place-items-center rounded-full text-[11px] font-semibold leading-none",
        TONE_PILL[tone].replace(/ ring-[^ ]+/g, ""),
        className,
      )}
      aria-hidden
    >
      {dir === "up" ? "↑" : "↓"}
    </span>
  );
}

/** A dashed hairline between sections inside a card. */
export function DashedRule({ className }: { className?: string }) {
  return <div className={cn("border-t border-dashed border-ops-line", className)} aria-hidden />;
}

/**
 * A semicircle gauge: one ratio against a limit.
 *
 * Thin stroke, round caps, the unfilled track a lighter step of the same
 * family. The figure sits in the arc; what it is a share *of* goes in the
 * card footer, not the gauge.
 */
export function Gauge({
  value,
  max,
  tone = "ok",
  label,
  sublabel,
  className,
}: {
  value: number;
  max: number;
  tone?: StatusTone | "accent";
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
}) {
  const r = 44;
  const c = Math.PI * r; // half circumference
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const stroke = tone === "accent" ? "var(--ops-accent)" : `var(--ops-${tone}-dot)`;
  return (
    <div className={cn("relative mx-auto w-full max-w-[220px]", className)}>
      <svg viewBox="0 0 100 56" className="w-full" aria-hidden>
        <path d="M6,52 A44,44 0 0 1 94,52" fill="none" stroke="var(--ops-active)" strokeWidth="7" strokeLinecap="round" />
        {pct > 0 && (
          <path
            d="M6,52 A44,44 0 0 1 94,52"
            fill="none"
            stroke={stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
          />
        )}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="ops-figure text-[28px] font-medium leading-none text-ops-text">{label}</span>
        {sublabel && <span className="mt-1 text-[12px] text-ops-text-secondary">{sublabel}</span>}
      </div>
    </div>
  );
}

/**
 * A stage of a funnel: a run of thin pills, the first `filled` lit.
 * Reads as a count of discrete units, which is what "1 of 18" is.
 */
export function SegmentedMeter({
  value,
  max,
  segments = 12,
  tone = "ok",
  className,
}: {
  value: number;
  max: number;
  segments?: number;
  tone?: StatusTone | "accent";
  className?: string;
}) {
  const lit = max > 0 ? Math.round((value / max) * segments) : 0;
  const on = tone === "accent" ? "bg-ops-accent" : TONE_DOT[tone];
  return (
    <div className={cn("flex h-2 items-stretch gap-1", className)} aria-hidden>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={cn("w-1 rounded-full", i < lit ? on : "bg-ops-active")} />
      ))}
    </div>
  );
}

/**
 * Part-to-whole as one bar, 2px surface gaps between segments, rounded ends.
 * Colour follows the entity: each segment's slot is fixed by the caller, never
 * by its size or rank. Six or fewer segments; fold the tail into "Other".
 */
export function CompositionBar({
  segments,
  className,
}: {
  segments: Array<{ id: string; value: number; color: string; label: string }>;
  className?: string;
}) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1;
  return (
    <div className={cn("flex h-2 w-full gap-1 overflow-hidden", className)} role="img" aria-label={segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ")}>
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <span
            key={s.id}
            className="h-full min-w-1 rounded-full"
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label} · ${Math.round((s.value / total) * 100)}%`}
          />
        ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Line chart — two series, the reference's "Sales & Returns"                  */
/* -------------------------------------------------------------------------- */

/** Monotone cubic through the points: smooth, and it never overshoots a value. */
function smoothPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";
  const n = pts.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  const m: number[] = [d[0]];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  let path = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dx = (x1 - x0) / 3;
    path += ` C${x0 + dx},${y0 + m[i] * dx} ${x1 - dx},${y1 - m[i + 1] * dx} ${x1},${y1}`;
  }
  return path;
}

export interface LineSeries {
  id: string;
  label: string;
  color: string;
  values: number[];
  /** The series the chart is about; it gets the area wash and the end dot. */
  emphasis?: boolean;
}

/**
 * Two lines over a shared x, the emphasised one with a wash under it, dashed
 * hairline gridlines, a crosshair and a tooltip on hover. The current period
 * label sits in a pill. Ticks are clean numbers; values live in the tooltip
 * and in whatever table the caller renders beside it.
 */
export function LineChart({
  labels,
  series,
  currentIndex,
  /** Index from which the data is still accumulating; that tail is drawn faint and dashed. */
  faintFrom,
  format,
  ticks,
  className,
}: {
  labels: string[];
  series: LineSeries[];
  currentIndex?: number;
  faintFrom?: number;
  format: (v: number) => string;
  ticks: number[];
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const W = 400;
  const H = 160;
  const PAD = { l: 0, r: 0, t: 8, b: 6 };
  const top = ticks[ticks.length - 1];
  const n = labels.length;
  const x = (i: number) => PAD.l + 12 + (i * (W - PAD.l - PAD.r - 24)) / Math.max(1, n - 1);
  const y = (v: number) => H - PAD.b - (v / top) * (H - PAD.b - PAD.t);
  const id = React.useId();

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHover(best);
  };

  return (
    <div className={cn("relative flex flex-1 flex-col", className)}>
      <div className="flex flex-1 gap-3">
        <div className="ops-num flex w-11 shrink-0 flex-col justify-between pb-2 pt-2 text-right text-[11px] leading-none text-ops-text-tertiary">
          {[...ticks].reverse().map((t) => (
            <span key={t}>{format(t)}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-full min-h-[180px] w-full"
            role="img"
            aria-label={series.map((s) => s.label).join(" and ")}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              {series.filter((s) => s.emphasis).map((s) => (
                <linearGradient key={s.id} id={`${id}-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.16" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {ticks.map((t) => (
              <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} stroke="var(--ops-line)" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
            ))}
            {series.map((s) => {
              const pts: Array<[number, number]> = s.values.map((v, i) => [x(i), y(v)]);
              const cut = faintFrom ?? n; // points at index >= cut are still accumulating
              const solid = smoothPath(pts.slice(0, cut));
              const faint = cut < n ? smoothPath(pts.slice(Math.max(0, cut - 1))) : "";
              const last = Math.max(0, Math.min(cut, n) - 1);
              return (
                <g key={s.id}>
                  {s.emphasis && <path d={`${solid} L${x(last)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#${id}-${s.id})`} />}
                  <path d={solid} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  {faint && (
                    <path d={faint} fill="none" stroke={s.color} strokeWidth="2" strokeOpacity="0.45" strokeDasharray="4 5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  )}
                </g>
              );
            })}
            {hover !== null && (
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} stroke="var(--ops-line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            )}
            {series.map((s) => {
              const i = hover ?? n - 1;
              return (
                <circle key={s.id} cx={x(i)} cy={y(s.values[i])} r="4" fill={s.color} stroke="var(--ops-surface)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              );
            })}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-3 py-2 text-[12px] shadow-ops-pop"
              style={{ left: `${(x(hover) / W) * 100}%`, transform: hover > n / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
            >
              <div className="text-ops-text-tertiary">{labels[hover]}</div>
              {series.map((s) => (
                <div key={s.id} className="mt-1 flex items-center gap-2 whitespace-nowrap">
                  <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
                  <span className="text-ops-text-secondary">{s.label}</span>
                  <span className="ops-num ml-auto pl-3 font-medium text-ops-text">{format(s.values[hover])}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex pl-12 text-[12px] text-ops-text-secondary">
        {labels.map((l, i) => (
          <span key={l} className={cn("flex-1", i === 0 ? "text-left" : i === n - 1 ? "text-right" : "text-center")}>
            <span className={cn("inline-block rounded-[6px] px-2 py-1", i === currentIndex && "bg-ops-active text-ops-text")}>{l}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Funnel — the reference's "Sales conversion"                                 */
/* -------------------------------------------------------------------------- */

/**
 * Stages as runs of thin pills. Each stage's height steps down with its
 * completion, the lit pills are the done share, and the percentage sits over
 * the stage. Name and count go under it, in text tokens.
 */
export function Funnel({
  stages,
  segments = 8,
  className,
}: {
  stages: Array<{ id: string; label: string; done: number; total: number }>;
  segments?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <div className="flex flex-1 items-end gap-3">
        {stages.map((st, i) => {
          const pct = st.total > 0 ? st.done / st.total : 0;
          const lit = Math.round(pct * segments);
          const height = 100 - i * (55 / Math.max(1, stages.length - 1)); // 100% → 45%
          return (
            <div key={st.id} className="flex min-w-0 flex-1 flex-col justify-end">
              <span className="ops-num mb-2 text-[13px] font-medium text-ops-text">{Math.round(pct * 100)}%</span>
              <div className="flex h-[120px] items-end gap-1" aria-hidden>
                {Array.from({ length: segments }, (_, k) => (
                  <span
                    key={k}
                    className={cn("w-full min-w-1 rounded-full", k < lit ? "bg-ops-ok-dot" : "bg-ops-active")}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-3">
        {stages.map((st) => (
          <div key={st.id} className="min-w-0 flex-1">
            <div className="text-[12px] leading-4 text-ops-text-secondary">{st.label}</div>
            <div className="ops-num text-[13px] font-medium text-ops-text">
              {st.done} of {st.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Segmented gauge — a health ramp in five chunks                              */
/* -------------------------------------------------------------------------- */

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = ((deg - 180) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

/** An arc from `a0` to `a1` degrees along the top semicircle (0 = left, 180 = right). */
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`;
};

/**
 * A semicircle in `segments` chunks with gaps between them. The fill runs
 * continuously from the left and stops wherever the ratio lands — mid-chunk
 * if that is where it falls — so the picture says "this far" rather than
 * rounding to a whole chunk. The stroke is a ramp from the warning tone to
 * the good tone, left to right; the lit part carries a faint hatch so the
 * fill survives greyscale.
 */
export function SegmentedGauge({
  value,
  max,
  segments = 5,
  label,
  sublabel,
  className,
}: {
  value: number;
  max: number;
  segments?: number;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
}) {
  const id = React.useId();
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const cx = 100;
  const cy = 96;
  const r = 78;
  const gapDeg = 3.5;
  const span = (180 - gapDeg * (segments - 1)) / segments;
  const chunks = Array.from({ length: segments }, (_, i) => {
    const a0 = i * (span + gapDeg);
    const a1 = a0 + span;
    const litTo = Math.max(0, Math.min(1, pct * segments - i));
    return { a0, a1, litTo };
  });

  return (
    <div className={cn("relative mx-auto w-full max-w-[260px]", className)}>
      <svg viewBox="0 0 200 104" className="w-full" aria-hidden>
        <defs>
          <linearGradient id={`${id}-ramp`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--ops-warn-dot)" />
            <stop offset="100%" stopColor="var(--ops-ok-dot)" />
          </linearGradient>
          <pattern id={`${id}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ops-surface)" strokeWidth="1.5" strokeOpacity="0.35" />
          </pattern>
        </defs>
        {chunks.map((c, i) => (
          <path key={`t${i}`} d={arc(cx, cy, r, c.a0, c.a1)} fill="none" stroke="var(--ops-active)" strokeWidth="18" strokeLinecap="butt" />
        ))}
        {chunks
          .filter((c) => c.litTo > 0)
          .map((c, i) => {
            const end = c.a0 + (c.a1 - c.a0) * c.litTo;
            return (
              <g key={`f${i}`}>
                <path d={arc(cx, cy, r, c.a0, end)} fill="none" stroke={`url(#${id}-ramp)`} strokeWidth="18" strokeLinecap="butt" />
                <path d={arc(cx, cy, r, c.a0, end)} fill="none" stroke={`url(#${id}-hatch)`} strokeWidth="18" strokeLinecap="butt" />
              </g>
            );
          })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="ops-figure text-[28px] font-medium leading-none text-ops-text">{label}</span>
        {sublabel && <span className="mt-2 text-[13px] text-ops-text-secondary">{sublabel}</span>}
      </div>
    </div>
  );
}
