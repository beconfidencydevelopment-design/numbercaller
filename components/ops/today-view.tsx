"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, SectionTitle, Sparkline, StatusPill, TONE_DOT } from "./primitives";
import { DetailDrawer } from "./detail-drawer";
import type { RankedShipment, StatusTone } from "@/lib/ops/types";
import {
  DRIVERS,
  EXCEPTION_LABEL,
  KPI_SERIES,
  NOW,
  RANKED,
  driverById,
} from "@/lib/ops/data";
import { formatClock, formatCountdown, formatRelative, formatWeekday } from "@/lib/ops/format";

/* ---------------------------------------------------------------------- */
/* Derived board state                                                     */
/* ---------------------------------------------------------------------- */

const active = RANKED.filter((s) => s.status !== "delivered");
const delivered = RANKED.filter((s) => s.status === "delivered");

/** True totals, used by the KPI strip. A shipment can appear in several. */
const breachedAll = active.filter((s) => s.sla === "breached");
const atRiskAll = active.filter((s) => s.sla === "at_risk");
const exceptionsAll = active.filter((s) => s.status === "exception");
const unassignedAll = active.filter((s) => !s.driverId && s.status !== "booked");

/**
 * Triage buckets, and these are *mutually exclusive*.
 *
 * The overlapping version listed the same parcel under both "breaching within
 * the hour" and "failed attempts", so an operator working top to bottom
 * handled it twice and the board overstated the workload. Each shipment is
 * claimed by the most severe bucket that matches it, exactly once.
 */
function triage() {
  const claimed = new Set<string>();
  const take = (rows: RankedShipment[]) => {
    const out = rows.filter((s) => !claimed.has(s.id));
    out.forEach((s) => claimed.add(s.id));
    // Within a bucket, the tightest deadline comes first.
    return out.sort((a, b) => a.slaDueAt - b.slaDueAt);
  };
  return {
    breached: take(breachedAll),
    atRisk: take(atRiskAll),
    exceptions: take(exceptionsAll),
    unassigned: take(unassignedAll),
  };
}
const buckets = triage();

/** On-time is measured against the actual completion time, not the promise. */
const onTimeRate = delivered.length
  ? Math.round(
      (delivered.filter((s) => s.deliveredAt !== null && s.deliveredAt <= s.slaDueAt).length /
        delivered.length) * 100,
    )
  : 100;
const ON_TIME_TARGET = 95;

/** Newest events across the whole board — the ambient "is it moving?" signal. */
const feed = RANKED.flatMap((s) => s.timeline.map((e) => ({ ...e, shipment: s })))
  .sort((a, b) => b.at - a.at)
  .slice(0, 14);

/* ---------------------------------------------------------------------- */
/* Stat tiles — value + label + context. No chart: a single current number */
/* is a stat tile's job, and a one-bar chart would say less.               */
/* ---------------------------------------------------------------------- */

function Stat({
  label,
  value,
  context,
  tone = "idle",
  emphasis,
  series,
  focal,
}: {
  label: string;
  value: React.ReactNode;
  context?: string;
  tone?: StatusTone;
  emphasis?: boolean;
  series?: number[];
  /** Exactly one cell per row may be focal. */
  focal?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[150px] flex-1 flex-col justify-between gap-1.5 rounded-[var(--ops-r-inner)] border px-3 py-2.5",
        focal
          ? "border-ops-focal-line bg-ops-focal-bg"
          : "border-ops-line bg-ops-surface",
      )}
    >
      <div className="flex items-center gap-1.5">
        {emphasis && (
          <span
            className={cn("size-1.5 shrink-0 rounded-full", focal ? "bg-ops-risk-dot" : TONE_DOT[tone])}
            aria-hidden
          />
        )}
        <span className={cn("truncate text-[11px]", focal ? "text-ops-focal-muted" : "text-ops-text-secondary")}>
          {label}
        </span>
      </div>

      <div
        className={cn(
          "ops-figure text-[24px] font-semibold leading-none",
          focal ? "text-ops-focal-fg" : emphasis && tone === "risk" ? "text-ops-risk-fg" : "text-ops-text",
        )}
      >
        {value}
      </div>

      {series && (
        <Sparkline
          values={series}
          stroke={focal ? "var(--ops-risk-dot)" : emphasis && tone === "risk" ? "var(--ops-risk-dot)" : "var(--ops-series-volume)"}
        />
      )}

      {context && (
        <div className={cn("truncate text-[10px]", focal ? "text-ops-focal-muted" : "text-ops-text-tertiary")}>
          {context}
        </div>
      )}
    </div>
  );
}

/** A ratio against a limit is a meter, not a donut. */
function OnTimeMeter() {
  const missed = onTimeRate < ON_TIME_TARGET;
  return (
    <div className="flex min-w-[150px] flex-1 flex-col justify-between gap-1.5 rounded-[var(--ops-r-inner)] border border-ops-line bg-ops-surface px-3 py-2.5">
      <span className="truncate text-[11px] text-ops-text-secondary">On-time today</span>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("ops-figure text-[24px] font-semibold leading-none", missed ? "text-ops-warn-fg" : "text-ops-text")}>
          {onTimeRate}%
        </span>
        <span className="text-[11px] text-ops-text-tertiary">/ {ON_TIME_TARGET}% target</span>
      </div>
      <div className="relative mt-0.5 h-1 w-full overflow-hidden rounded-full bg-ops-active">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full", missed ? "bg-ops-warn-dot" : "bg-ops-ok-dot")}
          style={{ width: `${onTimeRate}%` }}
        />
        <div className="absolute inset-y-0 w-px bg-ops-text-tertiary" style={{ left: `${ON_TIME_TARGET}%` }} aria-hidden />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Attention board                                                         */
/* ---------------------------------------------------------------------- */

function AttentionRow({
  s,
  onOpen,
}: {
  s: RankedShipment;
  onOpen: (id: string) => void;
}) {
  const driver = driverById(s.driverId);
  const overdue = s.minutesToSla < 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(s.id)}
      className="flex h-9 w-full items-center gap-2.5 border-b border-ops-line px-3 text-left last:border-b-0 hover:bg-ops-hover"
    >
      <span className="ops-mono w-[76px] shrink-0 text-ops-text">{s.tracking}</span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-medium text-ops-text">{s.recipient}</span>
        <span className="block truncate text-[11px] text-ops-text-tertiary">
          {s.city} {s.postcode}
          {s.exception ? ` · ${EXCEPTION_LABEL[s.exception]}` : ""}
        </span>
      </span>

      <span className="hidden w-[128px] shrink-0 lg:block">
        {driver ? (
          <span className="flex items-center gap-1.5">
            <Avatar initials={driver.initials} />
            <span className="truncate text-[11px] text-ops-text-secondary">{driver.name}</span>
          </span>
        ) : (
          <span className="text-[11px] font-medium text-ops-warn-fg">Unassigned</span>
        )}
      </span>

      <span className={cn("ops-num w-[62px] shrink-0 text-right text-[12px] font-semibold", overdue ? "text-ops-risk-fg" : "text-ops-text")}>
        {formatCountdown(s.minutesToSla)}
      </span>
    </button>
  );
}

function AttentionGroup({
  title,
  hint,
  rows,
  href,
  onOpen,
}: {
  title: string;
  hint: string;
  rows: RankedShipment[];
  href: string;
  onOpen: (id: string) => void;
}) {
  if (rows.length === 0) return null;
  const shown = rows.slice(0, 5);

  return (
    <section className="ops-card">
      <div className="flex h-9 items-center gap-2 border-b border-ops-line bg-ops-sunken px-3">
        <SectionTitle title={title} count={rows.length} hint={hint} />
        <Link
          href={href}
          className="ml-auto flex shrink-0 items-center gap-1 text-[11px] font-medium text-ops-accent hover:underline"
        >
          View all <ArrowRight className="size-3" />
        </Link>
      </div>
      {shown.map((s) => (
        <AttentionRow key={s.id} s={s} onOpen={onOpen} />
      ))}
      {rows.length > shown.length && (
        <Link
          href={href}
          className="flex h-8 items-center justify-center border-t border-ops-line text-[11px] font-medium text-ops-text-secondary hover:bg-ops-hover"
        >
          {rows.length - shown.length} more
        </Link>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------- */

export function TodayView() {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const openShipment = RANKED.find((s) => s.id === openId) ?? null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-ops-line bg-ops-surface px-4 py-2.5">
        <div>
          <h1 className="text-[15px] font-semibold leading-5 text-ops-text">Today</h1>
          <p className="text-[11px] text-ops-text-tertiary">
            {formatWeekday(NOW)} · {formatClock(NOW)} · Bermondsey hub
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-ops-line bg-ops-surface px-2.5 text-[12px] font-medium text-ops-text hover:bg-ops-hover"
          >
            Export
          </button>
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-ops-accent px-2.5 text-[12px] font-medium text-white hover:bg-ops-accent-hover"
          >
            <Truck className="size-3.5" />
            Assign {unassignedAll.length} unassigned
          </button>
        </div>
      </div>

      {/* KPI row. A thin strip, not a wall of cards — these are context for
          the worklist below, not the point of the page. */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-ops-line bg-ops-workspace px-4 py-3">
        <Stat label="Promise broken" value={breachedAll.length} tone="risk" emphasis focal series={KPI_SERIES.breached} context="needs a call now" />
        <Stat label="Breaching < 1h" value={atRiskAll.length} tone="risk" emphasis series={KPI_SERIES.atRisk} context="still recoverable" />
        <Stat label="Failed attempts" value={exceptionsAll.length} tone="warn" emphasis series={KPI_SERIES.exceptions} context="awaiting decision" />
        <Stat label="Unassigned" value={unassignedAll.length} tone="warn" emphasis series={KPI_SERIES.unassigned} context="no driver allocated" />
        <Stat label="Out for delivery" value={active.filter((s) => s.status === "out_for_delivery").length} series={KPI_SERIES.outForDelivery} context={`${active.length} active total`} />
        <OnTimeMeter />
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 p-4 xl:flex-row">
          {/* The worklist is the hero of this page. Everything above is context. */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <AttentionGroup
              title="Promise already broken"
              hint="oldest first"
              rows={buckets.breached}
              href="/ops/shipments"
              onOpen={setOpenId}
            />
            <AttentionGroup
              title="Breaching within the hour"
              hint="still saveable"
              rows={buckets.atRisk}
              href="/ops/shipments"
              onOpen={setOpenId}
            />
            <AttentionGroup
              title="Failed attempts"
              hint="not already listed above"
              rows={buckets.exceptions}
              href="/ops/exceptions"
              onOpen={setOpenId}
            />
            <AttentionGroup
              title="Unassigned"
              hint="not already listed above"
              rows={buckets.unassigned}
              href="/ops/shipments"
              onOpen={setOpenId}
            />

            {buckets.breached.length + buckets.atRisk.length + buckets.exceptions.length + buckets.unassigned.length === 0 && (
              <div className="ops-card px-6 py-16 text-center">
                <div className="text-[13px] font-medium text-ops-text">Nothing needs attention</div>
                <p className="mt-1 text-[12px] text-ops-text-secondary">
                  Every active shipment is on track and assigned.
                </p>
              </div>
            )}
          </div>

          {/* Right rail */}
          <div className="flex w-full shrink-0 flex-col gap-3 xl:w-[320px]">
            <section className="ops-card">
              <div className="flex h-9 items-center border-b border-ops-line bg-ops-sunken px-3">
                <SectionTitle title="Drivers" count={DRIVERS.length} />
              </div>
              {DRIVERS.map((d) => {
                const stale = d.lastPingMins > 20;
                return (
                  <div key={d.id} className="flex h-10 items-center gap-2 border-b border-ops-line px-3 last:border-b-0">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        d.state === "on_route" && "bg-ops-ok-dot",
                        d.state === "break" && "bg-ops-warn-dot",
                        d.state === "at_depot" && "bg-ops-idle-dot",
                        d.state === "offline" && "bg-ops-risk-dot",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-ops-text">{d.name}</div>
                      <div className="truncate text-[11px] text-ops-text-tertiary">
                        {d.vehicle} · {d.zone}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="ops-num text-[12px] font-medium text-ops-text">{d.remaining}</div>
                      <div className="text-[10px] text-ops-text-tertiary">left</div>
                    </div>
                    {/* A silent device is an operational risk, so it is stated
                        in words rather than implied by a colour. */}
                    {stale && (
                      <StatusPill tone="risk" dot={false} className="shrink-0">
                        {d.lastPingMins}m silent
                      </StatusPill>
                    )}
                  </div>
                );
              })}
            </section>

            <section className="ops-card">
              <div className="flex h-9 items-center border-b border-ops-line bg-ops-sunken px-3">
                <SectionTitle title="Activity" hint="live" />
              </div>
              <ol className="max-h-[420px] overflow-y-auto">
                {feed.map((ev) => (
                  <li key={`${ev.shipment.id}-${ev.id}`} className="flex gap-2 border-b border-ops-line px-3 py-2 last:border-b-0">
                    <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", TONE_DOT[ev.tone])} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-[12px] text-ops-text">{ev.label}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-ops-text-tertiary">
                          {formatRelative(ev.at)}
                        </span>
                      </div>
                      <div className="ops-mono truncate text-ops-text-tertiary">{ev.shipment.tracking}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>

      <DetailDrawer shipment={openShipment} onClose={() => setOpenId(null)} />
    </div>
  );
}
