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
        "inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset",
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
        "inline-flex items-center gap-1 rounded-md border border-ops-line bg-ops-sunken px-2 py-1 text-[11px] font-medium whitespace-nowrap text-ops-text-secondary",
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
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tracking-wide",
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
    <kbd className="rounded border border-ops-line bg-ops-sunken px-1 py-1 font-mono text-[10px] leading-4 text-ops-text-tertiary">
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
 * Direction is carried by the arrow glyph and the sign, never only by the
 * tint — and "worse" is decided by the caller, because a rise in expenses and
 * a rise in revenue are not the same news.
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
  const tone: StatusTone = dir === "flat" ? "idle" : good ? "ok" : "risk";
  // Flat reads "— 0%", as the client's cards print it; a bare "—0%" looks like a negative.
  const glyph = dir === "up" ? "↑" : dir === "down" ? "↓" : "— ";
  return (
    <span className={cn("inline-flex items-baseline gap-2 text-[11px]", className)}>
      {/* Tint only, no ring — the pill should sit on the card, not on top of it. */}
      <span className={cn("ops-num rounded-[5px] px-2 py-1 text-[10.5px] font-medium", TONE_PILL[tone].replace(/ ring-[^ ]+/g, ""))}>
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
      <h2 className="whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-ops-text">{title}</h2>
      {count !== undefined && (
        <span className="ops-num rounded-md bg-ops-active px-2 py-1 text-[11px] font-semibold text-ops-text-secondary">
          {count}
        </span>
      )}
      {hint && <span className="truncate text-[12px] text-ops-text-tertiary">{hint}</span>}
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
      <div className="text-[13px] font-medium text-ops-text">{title}</div>
      {detail && <p className="mt-1 max-w-[42ch] text-[12px] text-ops-text-secondary">{detail}</p>}
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
        size === "sm" ? "h-7 px-3 text-[12px]" : "h-8 px-3 text-[13px]",
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
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-ops-accent-line bg-ops-accent-weak px-2 text-[11px] font-semibold text-ops-accent transition-colors hover:border-ops-accent hover:bg-ops-accent hover:text-ops-text-inverse",
        className,
      )}
    >
      {children}
    </button>
  );
}
