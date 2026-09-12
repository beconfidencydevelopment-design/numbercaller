"use client";

import * as React from "react";
import {
  Ban,
  MessageSquare,
  Phone,
  RotateCcw,
  Truck,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, Chip, StatusPill, TONE_DOT } from "./primitives";
import type { RankedShipment } from "@/lib/ops/types";
import {
  EXCEPTION_LABEL,
  SERVICE_LABEL,
  SLA_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  driverById,
} from "@/lib/ops/data";
import { formatCountdown, formatFull, formatRelative } from "@/lib/ops/format";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11px] text-ops-text-tertiary">{label}</dt>
      <dd className="truncate text-[12px] font-medium text-ops-text">{children}</dd>
    </div>
  );
}

export function DetailDrawer({
  shipment,
  onClose,
}: {
  shipment: RankedShipment | null;
  onClose: () => void;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!shipment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shipment, onClose]);

  if (!shipment) return null;

  const driver = driverById(shipment.driverId);
  const overdue = shipment.minutesToSla < 0;

  return (
    <>
      {/* Scrim is deliberately light: the operator should keep peripheral
          awareness of the board while a record is open. */}
      <div className="absolute inset-0 z-30 bg-black/10" onClick={onClose} aria-hidden />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Shipment ${shipment.tracking}`}
        className="absolute inset-y-0 right-0 z-40 flex w-full max-w-[440px] flex-col border-l border-ops-line bg-ops-surface shadow-ops-drawer"
      >
        {/* Header ------------------------------------------------------- */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-ops-line px-3">
          <span className="ops-mono text-[13px] font-medium text-ops-text">{shipment.tracking}</span>
          <StatusPill tone={STATUS_TONE[shipment.status]}>{STATUS_LABEL[shipment.status]}</StatusPill>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="ml-auto grid size-7 place-items-center rounded-md text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* The promise, stated once, unmissably. This is the fact the whole
              console exists to protect. */}
          <div
            className={cn(
              "flex items-center gap-3 border-b px-3 py-2.5",
              overdue
                ? "border-ops-risk-line bg-ops-risk-bg"
                : "border-ops-line bg-ops-sunken",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-ops-text-tertiary">
                {overdue ? "Promise broken" : "Delivery promise"}
              </div>
              <div className="truncate text-[12px] font-medium text-ops-text">
                {formatFull(shipment.slaDueAt)}
              </div>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "ops-num text-[20px] font-semibold leading-none",
                  overdue ? "text-ops-risk-fg" : "text-ops-text",
                )}
              >
                {formatCountdown(shipment.minutesToSla)}
              </div>
              <div className="mt-0.5 text-[11px] text-ops-text-tertiary">
                {SLA_LABEL[shipment.sla]}
              </div>
            </div>
          </div>

          {/* Recipient --------------------------------------------------- */}
          <div className="border-b border-ops-line px-3 py-3">
            <div className="text-[14px] font-semibold text-ops-text">{shipment.recipient}</div>
            {shipment.company && (
              <div className="text-[12px] text-ops-text-secondary">{shipment.company}</div>
            )}
            <div className="mt-0.5 text-[12px] text-ops-text-secondary">
              {shipment.city} · <span className="ops-mono">{shipment.postcode}</span>
            </div>

            {shipment.exception && (
              <div className="mt-2.5 flex items-start gap-2 rounded-md border border-ops-risk-line bg-ops-risk-bg px-2 py-1.5">
                <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", TONE_DOT.risk)} aria-hidden />
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-ops-risk-fg">
                    {EXCEPTION_LABEL[shipment.exception]}
                  </div>
                  <div className="text-[11px] text-ops-risk-fg/80">
                    Attempt {shipment.attempts} of 3 · needs a decision before the next round
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions. Placed above the detail because the operator opened
              this panel to *do* something, not to read. */}
          <div className="flex flex-wrap gap-1.5 border-b border-ops-line px-3 py-2.5">
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-md bg-ops-accent px-2.5 text-[12px] font-medium text-white hover:bg-ops-accent-hover">
              <RotateCcw className="size-3.5" /> Retry delivery
            </button>
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-md border border-ops-line bg-ops-surface px-2.5 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
              <Truck className="size-3.5" /> Reassign
            </button>
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-md border border-ops-line bg-ops-surface px-2.5 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
              <Phone className="size-3.5" /> Call
            </button>
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-md border border-ops-line bg-ops-surface px-2.5 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
              <MessageSquare className="size-3.5" /> Notify
            </button>
            <button type="button" className="inline-flex size-7 items-center justify-center rounded-md border border-ops-line bg-ops-surface text-ops-text-secondary hover:bg-ops-hover" aria-label="Cancel shipment">
              <Ban className="size-3.5" />
            </button>
          </div>

          {/* Facts -------------------------------------------------------- */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-ops-line px-3 py-3">
            <Fact label="Service">
              <Chip>{SERVICE_LABEL[shipment.service]}</Chip>
            </Fact>
            <Fact label="Zone">{shipment.zone}</Fact>
            <Fact label="Driver">
              {driver ? (
                <span className="flex items-center gap-1.5">
                  <Avatar initials={driver.initials} />
                  {driver.name}
                </span>
              ) : (
                <span className="text-ops-warn-fg">Unassigned</span>
              )}
            </Fact>
            <Fact label="Vehicle">{driver?.vehicle ?? "—"}</Fact>
            <Fact label="ETA">
              {shipment.eta ? formatRelative(shipment.eta) : "—"}
            </Fact>
            <Fact label="Attempts">{shipment.attempts}</Fact>
            <Fact label="Pieces">{shipment.pieces}</Fact>
            <Fact label="Weight">{shipment.weightKg} kg</Fact>
          </dl>

          {/* Timeline ------------------------------------------------------ */}
          <div className="px-3 py-3">
            <div className="ops-eyebrow mb-2.5">Activity</div>
            <ol className="relative flex flex-col gap-3">
              {shipment.timeline.map((ev, i) => (
                <li key={ev.id} className="relative flex gap-2.5 pl-0.5">
                  {i !== shipment.timeline.length - 1 && (
                    <span className="absolute left-[3px] top-3 h-full w-px bg-ops-line" aria-hidden />
                  )}
                  <span className={cn("relative mt-1 size-[7px] shrink-0 rounded-full ring-2 ring-ops-surface", TONE_DOT[ev.tone])} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] font-medium text-ops-text">{ev.label}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-ops-text-tertiary">
                        {formatRelative(ev.at)}
                      </span>
                    </div>
                    {ev.detail && (
                      <div className="text-[11px] text-ops-text-secondary">{ev.detail}</div>
                    )}
                    {ev.actor && (
                      <div className="text-[11px] text-ops-text-tertiary">{ev.actor}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Internal note. Ops teams keep this context in WhatsApp today;
            putting it on the record is where a lot of the real value is. */}
        <div className="shrink-0 border-t border-ops-line p-2.5">
          <label htmlFor="ops-note" className="sr-only">Internal note</label>
          <textarea
            id="ops-note"
            rows={2}
            placeholder="Add an internal note…"
            className="w-full resize-none rounded-md border border-ops-line bg-ops-sunken px-2 py-1.5 text-[12px] text-ops-text outline-none placeholder:text-ops-text-tertiary focus:border-ops-accent-line focus:bg-ops-surface"
          />
        </div>
      </aside>
    </>
  );
}
