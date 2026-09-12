import * as React from "react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/ops/types";

/**
 * Colour in this console means exactly one thing: status. These tone maps are
 * the only place saturated colour is allowed to enter the UI, which is what
 * keeps a single red badge legible on a screen of 30 rows.
 */
const TONE_PILL: Record<StatusTone, string> = {
  ok: "bg-ops-ok-bg text-ops-ok-fg ring-ops-ok-line",
  move: "bg-ops-move-bg text-ops-move-fg ring-ops-move-line",
  warn: "bg-ops-warn-bg text-ops-warn-fg ring-ops-warn-line",
  risk: "bg-ops-risk-bg text-ops-risk-fg ring-ops-risk-line",
  idle: "bg-ops-idle-bg text-ops-idle-fg ring-ops-idle-line",
};

const TONE_DOT: Record<StatusTone, string> = {
  ok: "bg-ops-ok-dot",
  move: "bg-ops-move-dot",
  warn: "bg-ops-warn-dot",
  risk: "bg-ops-risk-dot",
  idle: "bg-ops-idle-dot",
};

const TONE_TEXT: Record<StatusTone, string> = {
  ok: "text-ops-ok-fg",
  move: "text-ops-move-fg",
  warn: "text-ops-warn-fg",
  risk: "text-ops-risk-fg",
  idle: "text-ops-text-secondary",
};

export { TONE_DOT, TONE_TEXT };

/**
 * Status is never encoded by colour alone — every pill carries a dot *and* a
 * text label, so it survives colour-blindness and greyscale printing.
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
        "inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[11px] font-medium whitespace-nowrap ring-1 ring-inset",
        TONE_PILL[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} aria-hidden />}
      {children}
    </span>
  );
}

/** Low-emphasis metadata chip used for service level, zone, piece counts. */
export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-ops-line bg-ops-sunken px-1.5 py-[2px] text-[11px] font-medium text-ops-text-secondary whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-ops-active text-[9px] font-semibold tracking-wide text-ops-text-secondary",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/** Keyboard hint. Used in the search field and the palette. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-ops-line bg-ops-sunken px-1 py-px font-mono text-[10px] leading-4 text-ops-text-tertiary">
      {children}
    </kbd>
  );
}

export function SectionTitle({
  title,
  count,
  hint,
  action,
}: {
  title: string;
  count?: number;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-7 items-center gap-2">
      <h2 className="text-[13px] font-semibold text-ops-text">{title}</h2>
      {count !== undefined && (
        <span className="ops-num rounded bg-ops-active px-1.5 py-px text-[11px] font-semibold text-ops-text-secondary">
          {count}
        </span>
      )}
      {hint && <span className="text-[11px] text-ops-text-tertiary">{hint}</span>}
      <div className="ml-auto">{action}</div>
    </div>
  );
}
