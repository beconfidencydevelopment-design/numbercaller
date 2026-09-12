"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { IconChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  /** A second line, or a figure on the right. Never the only thing said. */
  detail?: React.ReactNode;
  /** Rendered before the label in both the trigger and the list. */
  icon?: React.ReactNode;
  disabled?: boolean;
};

/**
 * The console's select.
 *
 * A native `<select>` was doing this job and doing it badly: macOS positions
 * its menu so the *selected* row sits over the control, which meant the
 * company filter opened upward, half-covering the toolbar it belongs to and
 * landing wherever the current value happened to be in the list. There is no
 * CSS for that — the menu is drawn by the OS.
 *
 * So the menu is ours: it opens below the control, aligned to its left edge,
 * flipping above only when there is genuinely no room. It is portalled to the
 * body because the toolbars it lives in sit inside `overflow-hidden` cards,
 * which would otherwise clip it, and it is positioned `fixed` against the
 * trigger's own rect so the two cannot drift apart.
 */
export function Select({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
  placeholder = "Select",
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Accessible name, when no visible `<label>` wraps the control. */
  label?: string;
  size?: "sm" | "md";
  className?: string;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [rect, setRect] = React.useState<{ top: number; left: number; width: number; drop: "down" | "up" } | null>(
    null,
  );
  const trigger = React.useRef<HTMLButtonElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const search = React.useRef("");
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = React.useId();

  const selected = options.find((o) => o.value === value);
  const enabled = options.filter((o) => !o.disabled);

  const place = React.useCallback(() => {
    const el = trigger.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const wanted = Math.min(options.length * 36 + 8, 320);
    const below = window.innerHeight - r.bottom - 8;
    const drop = below < wanted && r.top > below ? "up" : "down";
    setRect({
      top: drop === "down" ? r.bottom + 4 : Math.max(r.top - 4 - wanted, 8),
      left: r.left,
      width: r.width,
      drop,
    });
  }, [options.length]);

  const show = () => {
    place();
    setActive(Math.max(options.findIndex((o) => o.value === value), 0));
    setOpen(true);
  };

  /* Close on anything that moves the trigger rather than trying to follow it.
     Chasing a scrolling ancestor is how a menu ends up floating over the
     header on its way past. */
  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!trigger.current?.contains(t) && !list.current?.contains(t)) setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open]);

  React.useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const step = (delta: number) => {
    const from = active;
    for (let i = 1; i <= options.length; i += 1) {
      const next = (from + delta * i + options.length * Math.abs(delta) * options.length) % options.length;
      if (!options[next].disabled) return setActive(next);
    }
  };

  const commit = (i: number) => {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    trigger.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        show();
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        /* One Escape closes one layer. `stopPropagation` is not enough:
           under the App Router React attaches its own listener to the
           document, which is the same node the dialog listens on, and
           stopping propagation does not stop a sibling listener on the node
           you are already at. Dismissing a dropdown inside Log expense was
           taking the whole form with it. */
        e.nativeEvent.stopImmediatePropagation();
        setOpen(false);
        trigger.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        step(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        step(-1);
        break;
      case "Home":
        e.preventDefault();
        setActive(options.indexOf(enabled[0]));
        break;
      case "End":
        e.preventDefault();
        setActive(options.indexOf(enabled[enabled.length - 1]));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(active);
        break;
      default: {
        /* Type-ahead, the one thing a native select does that people miss.
           The buffer is cleared by a timer rather than by comparing clock
           readings, because nothing in `components/ops` is allowed to read
           the wall clock — the ledger gate scans for it, and the rule is
           worth more than the two lines it costs here. */
        if (e.key.length !== 1) return;
        const term = search.current + e.key;
        search.current = term;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
          search.current = "";
        }, 800);
        const hit = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(term.toLowerCase()));
        if (hit >= 0) setActive(hit);
      }
    }
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-haspopup="listbox"
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center gap-2 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface text-left text-body text-ops-text transition-colors hover:bg-ops-hover",
          size === "sm" ? "h-8 pl-3 pr-2" : "h-9 pl-3 pr-2",
          open && "border-ops-line-strong",
          className,
        )}
      >
        {selected?.icon}
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-ops-text-tertiary")}>
          {selected?.label ?? placeholder}
        </span>
        <IconChevronDown className="size-4 shrink-0 text-ops-text-tertiary" size={16} />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={list}
            id={listId}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            className="ops-overlay fixed z-50 max-h-[320px] overflow-y-auto rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface p-1 shadow-ops-pop"
            style={{ top: rect.top, left: rect.left, minWidth: rect.width }}
          >
            {options.map((o, i) => (
              <div
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                aria-disabled={o.disabled}
                data-active={i === active}
                onPointerEnter={() => !o.disabled && setActive(i)}
                onClick={() => commit(i)}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-[6px] px-3 text-body",
                  o.disabled && "cursor-not-allowed text-ops-text-tertiary",
                  !o.disabled && i === active && "bg-ops-hover",
                  o.value === value ? "font-medium text-ops-text" : !o.disabled && "text-ops-text-secondary",
                )}
              >
                {o.icon}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.detail && <span className="shrink-0 text-ops-text-tertiary">{o.detail}</span>}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
