"use client";

import * as React from "react";
import { IconClose } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "./primitives";

/* -------------------------------------------------------------------------- */
/* The dialog shell                                                            */
/* -------------------------------------------------------------------------- */

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * One dialog for all four forms.
 *
 * Everything a dialog owes the keyboard is here rather than in each form:
 * focus moves in on open and returns to whatever opened it on close, Escape
 * closes, Tab cannot walk out of the panel and into the page behind it, and
 * the page behind stops scrolling. Four forms each solving that separately is
 * four chances to get it wrong, and the one that gets it wrong is the one a
 * keyboard user is stuck inside.
 */
export function Modal({
  title,
  detail,
  onClose,
  children,
  footer,
  width = "md",
}: {
  title: string;
  detail?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "md" | "lg";
}) {
  const panel = React.useRef<HTMLDivElement>(null);
  const body = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = panel.current;
    /* The first control of the form, not the close button that happens to
       come first in the DOM. Opening a dialog with focus on Dismiss asks the
       keyboard user to tab past the exit to reach the thing they opened. */
    (body.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      root?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="ops-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-12">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-ops-scrim" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative my-auto w-full rounded-[var(--ops-r-card)] border border-ops-line bg-ops-surface shadow-ops-pop",
          width === "lg" ? "max-w-[640px]" : "max-w-[520px]",
        )}
      >
        <div className="flex items-start gap-4 border-b border-ops-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-title font-medium text-ops-text">
              {title}
            </h2>
            {detail && <p className="mt-1 text-body text-ops-text-secondary">{detail}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-[var(--ops-r-control)] text-ops-text-tertiary transition-colors hover:bg-ops-hover hover:text-ops-text"
          >
            <IconClose className="size-4" />
          </button>
        </div>

        <div ref={body} className="px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ops-line bg-ops-sunken px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Form pieces                                                                 */
/* -------------------------------------------------------------------------- */

const CONTROL =
  "h-9 w-full rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-3 text-body text-ops-text outline-none transition-colors placeholder:text-ops-text-tertiary focus:border-ops-accent";

/**
 * A labelled control.
 *
 * The label is a real `<label>` wrapping its control, so the whole thing is a
 * hit target and nothing depends on an id matching by hand. An error is tied
 * to the control with `aria-describedby` and stated in words: the red border
 * alone is invisible to a third of red-blind readers and to anyone printing
 * the screen.
 */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: (props: { className: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
  className?: string;
}) {
  const id = React.useId();
  return (
    <label className={cn("flex min-w-0 flex-col gap-2", className)}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-body font-medium text-ops-text">{label}</span>
        {hint && <span className="text-body text-ops-text-tertiary">{hint}</span>}
      </span>
      {children({
        className: cn(CONTROL, error && "border-ops-risk-line focus:border-ops-risk-fg"),
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? id : undefined,
      })}
      {error && (
        <span id={id} className="text-body text-ops-risk-fg">
          {error}
        </span>
      )}
    </label>
  );
}

/** The money control. Prefixed, right-aligned, tabular, never a bare number. */
export function MoneyField({
  label,
  hint,
  error,
  value,
  onChange,
  max,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(p) => (
        <span className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 text-body text-ops-text-tertiary">$</span>
          <input
            {...p}
            className={cn(p.className, "ops-num pl-8 text-right")}
            inputMode="decimal"
            value={value}
            max={max}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
          />
        </span>
      )}
    </Field>
  );
}

/** Two fields on one line from `sm` up, stacked below it. */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/**
 * What the form is about to do, in the ledger's own words.
 *
 * Every one of these forms changes a figure the owner is looking at somewhere
 * else on the console. Stating the effect before the button is pressed is the
 * difference between recording a payment and hoping you recorded a payment.
 */
export function Effect({ rows }: { rows: Array<{ label: string; value: React.ReactNode; strong?: boolean }> }) {
  return (
    <dl className="divide-y divide-dashed divide-ops-line rounded-[var(--ops-r-inner)] border border-ops-line bg-ops-sunken px-4">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-3">
          <dt className={cn("text-body", r.strong ? "font-medium text-ops-text" : "text-ops-text-secondary")}>
            {r.label}
          </dt>
          <dd className={cn("ops-num text-body", r.strong ? "font-medium text-ops-text" : "text-ops-text")}>
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Cancel plus the one action, in that order, right-aligned. */
export function ModalFooter({
  onClose,
  submitLabel,
  disabled,
  form,
}: {
  onClose: () => void;
  submitLabel: string;
  disabled?: boolean;
  form: string;
}) {
  return (
    <>
      <Button variant="default" size="sm" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" size="sm" type="submit" form={form} disabled={disabled}>
        {submitLabel}
      </Button>
    </>
  );
}
