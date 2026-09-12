"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatusPill } from "./primitives";
import { VolumeChart } from "./volume-chart";
import {
  DAILY,
  EXCEPTION_BREAKDOWN,
  EXCEPTION_LABEL,
  NOW,
  RANKED,
  SERVICE_LABEL,
  SERVICE_PERFORMANCE,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/ops/data";
import { formatClock, formatRelative, formatWeekday } from "@/lib/ops/format";

/* ---------------------------------------------------------------------- */

const last30 = DAILY.slice(-30);
const prev30 = DAILY.slice(-60, -30);
const sum = (rows: typeof DAILY, key: "delivered" | "booked" | "failed") =>
  rows.reduce((n, d) => n + d[key], 0);

const deliveredNow = sum(last30, "delivered");
const deliveredPrev = sum(prev30, "delivered");
const deliveredDelta = ((deliveredNow - deliveredPrev) / deliveredPrev) * 100;

const failedNow = sum(last30, "failed");
const failedPrev = sum(prev30, "failed");
const failedDelta = ((failedNow - failedPrev) / failedPrev) * 100;

const onTimeNow = last30.reduce((n, d) => n + d.onTime, 0) / last30.length;
const onTimePrev = prev30.reduce((n, d) => n + d.onTime, 0) / prev30.length;

const perDay = Math.round(deliveredNow / last30.length);
const maxReason = Math.max(...EXCEPTION_BREAKDOWN.map((r) => r.count));

/** Volume split by zone, for the hero card's lower half. */
const ZONES = ["North", "East", "South", "West"] as const;
const zoneRows = ZONES.map((zone) => {
  const count = RANKED.filter((s) => s.zone === zone).length;
  return { zone, count };
});
const zoneMax = Math.max(...zoneRows.map((z) => z.count));

/** 30-day on-time trend, drawn as a sparkline beside the headline figure. */
const spark = last30.map((d) => d.onTime);
const sparkMin = Math.min(...spark);
const sparkMax = Math.max(...spark);
const sparkPath = spark
  .map((v, i) => {
    const x = (i / (spark.length - 1)) * 100;
    const y = 26 - ((v - sparkMin) / (sparkMax - sparkMin || 1)) * 22;
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  })
  .join(" ");

const recent = RANKED.filter((s) => s.status === "delivered" || s.status === "exception")
  .sort((a, b) => b.updatedAt - a.updatedAt)
  .slice(0, 6);

/* ---------------------------------------------------------------------- */

function Delta({ value, goodWhenDown = false }: { value: number; goodWhenDown?: boolean }) {
  if (Math.abs(value) < 0.05) {
    return <span className="text-[11px] font-medium text-ops-text-tertiary">No change</span>;
  }
  const up = value >= 0;
  const good = goodWhenDown ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", good ? "text-ops-ok-fg" : "text-ops-risk-fg")}>
      <Icon className="size-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function SubStat({ label, value, delta, caption }: { label: string; value: string; delta?: React.ReactNode; caption: string }) {
  return (
    <div className="flex-1 rounded-[var(--ops-r-inner)] border border-ops-line bg-ops-sunken px-3 py-2.5">
      <div className="text-[11px] text-ops-text-secondary">{label}</div>
      <div className="ops-figure mt-0.5 text-[17px] font-semibold text-ops-text">{value}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {delta}
        <span className="text-[10px] text-ops-text-tertiary">{caption}</span>
      </div>
    </div>
  );
}

function CardHead({ title, subtitle, href }: { title: string; subtitle: string; href?: string }) {
  return (
    <header className="flex items-start gap-2 px-4 pb-3 pt-3.5">
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold text-ops-text">{title}</h2>
        <p className="truncate text-[11px] text-ops-text-tertiary">{subtitle}</p>
      </div>
      {href && (
        <Link href={href} className="ml-auto shrink-0 text-[11px] font-medium text-ops-accent hover:underline">
          See all
        </Link>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------------- */

export function OverviewView() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1500px] p-4">
        {/* Header ---------------------------------------------------- */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div>
            <h1 className="ops-figure text-[24px] font-semibold leading-tight text-ops-text">
              Good afternoon, Amina
            </h1>
            <p className="text-[12px] text-ops-text-secondary">
              {formatWeekday(NOW)} · {formatClock(NOW)} · Bermondsey hub
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ops-line bg-ops-surface px-3 text-[12px] font-medium text-ops-text hover:bg-ops-hover"
            >
              Last 30 days
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ops-line bg-ops-surface px-3 text-[12px] font-medium text-ops-text hover:bg-ops-hover"
            >
              <Download className="size-3.5" /> Export report
            </button>
          </div>
        </div>

        {/* Row 1 ----------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Hero figure. Proportional numerals, no tabular spacing. */}
          <section className="ops-card lg:col-span-5">
            <div className="px-4 pb-4 pt-3.5">
              <div className="text-[12px] text-ops-text-secondary">Parcels delivered</div>
              <div className="ops-figure mt-1 text-[40px] font-semibold leading-none text-ops-text">
                {deliveredNow.toLocaleString("en-GB")}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Delta value={deliveredDelta} />
                <span className="text-[11px] text-ops-text-tertiary">vs previous 30 days</span>
              </div>

              <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
                <SubStat
                  label="On-time rate"
                  value={`${onTimeNow.toFixed(1)}%`}
                  delta={<Delta value={onTimeNow - onTimePrev} />}
                  caption="vs target"
                />
                <SubStat
                  label="Failed attempts"
                  value={failedNow.toLocaleString("en-GB")}
                  delta={<Delta value={failedDelta} goodWhenDown />}
                  caption="redelivery cost"
                />
                <SubStat label="Daily average" value={String(perDay)} caption="parcels per day" />
              </div>

              {/* Sparkline: a single trend line needs no legend, the label
                  names it. Endpoint is direct-labelled, the rest is shape. */}
              <div className="mt-3.5 rounded-[var(--ops-r-inner)] border border-ops-line bg-ops-sunken px-3 py-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] text-ops-text-secondary">Daily on-time rate</span>
                  <span className="ml-auto flex items-baseline gap-1">
                    <span className="ops-num text-[11px] font-medium text-ops-text">
                      {spark[spark.length - 1].toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-ops-text-tertiary">today</span>
                  </span>
                </div>
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-1.5 h-8 w-full" role="img" aria-label={`On-time rate ranged ${sparkMin}% to ${sparkMax}% over the last 30 days`}>
                  <path d={sparkPath} fill="none" stroke="var(--ops-series-volume)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </div>

              {/* Volume by zone. Same meter language as the service card, so
                  the page teaches one pattern rather than three. */}
              <div className="mt-3">
                <div className="ops-eyebrow mb-2">Active volume by zone</div>
                <div className="flex flex-col gap-2">
                  {zoneRows.map((z) => (
                    <div key={z.zone} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-[11px] text-ops-text-secondary">{z.zone}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ops-active">
                        <div
                          className="h-full rounded-full bg-ops-series-volume"
                          style={{ width: `${(z.count / zoneMax) * 100}%`, opacity: 0.4 + 0.6 * (z.count / zoneMax) }}
                        />
                      </div>
                      <span className="ops-num w-6 shrink-0 text-right text-[11px] font-medium text-ops-text">{z.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Service level performance ------------------------------- */}
          <section className="ops-card lg:col-span-4">
            <CardHead title="Service level performance" subtitle="On-time rate against contract" href="/ops/shipments" />
            <div className="flex flex-col gap-2 px-4 pb-4">
              {SERVICE_PERFORMANCE.map((s) => {
                const met = s.actual >= s.target;
                return (
                  <div key={s.service} className="rounded-[var(--ops-r-inner)] border border-ops-line bg-ops-sunken px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-ops-text">{SERVICE_LABEL[s.service]}</span>
                      <span className="ml-auto">
                        <StatusPill tone={met ? "ok" : "warn"}>{met ? "On target" : "Below target"}</StatusPill>
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="ops-figure text-[15px] font-semibold text-ops-text">{s.actual}%</span>
                      <span className="text-[11px] text-ops-text-tertiary">/ {s.target}% target</span>
                    </div>
                    {/* Meter with a target marker, not a bare progress bar. */}
                    <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-ops-active">
                      <div
                        className={cn("absolute inset-y-0 left-0 rounded-full", met ? "bg-ops-ok-dot" : "bg-ops-warn-dot")}
                        style={{ width: `${s.actual}%` }}
                      />
                      <div className="absolute inset-y-0 w-0.5 bg-ops-text-secondary" style={{ left: `${s.target}%` }} aria-hidden />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Exceptions by reason ------------------------------------ */}
          <section className="ops-card lg:col-span-3">
            <CardHead title="Why deliveries fail" subtitle="Last 90 days by reason" href="/ops/exceptions" />
            <div className="flex flex-col gap-2 px-4 pb-4">
              {EXCEPTION_BREAKDOWN.map((r) => (
                <div key={r.reason}>
                  {/* Label sits above the bar, never inside it: an in-bar
                      label clips on the short bars, which is exactly what
                      goes wrong in the reference. */}
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[11px] text-ops-text-secondary">{EXCEPTION_LABEL[r.reason]}</span>
                    <span className="ops-num ml-auto shrink-0 text-[11px] font-medium text-ops-text">{r.share}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ops-active">
                    {/* Single hue, opacity stepped by rank: this is a
                        magnitude comparison, not eight separate identities. */}
                    <div
                      className="h-full rounded-full bg-ops-series-volume"
                      style={{ width: `${(r.count / maxReason) * 100}%`, opacity: 0.35 + 0.65 * (r.count / maxReason) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Row 2 ----------------------------------------------------- */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <VolumeChart />
          </div>

          <section className="ops-card lg:col-span-4">
            <CardHead title="Recent activity" subtitle="Latest completions and failures" href="/ops/shipments" />
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="[&>th]:border-y [&>th]:border-ops-line [&>th]:bg-ops-sunken [&>th]:px-3 [&>th]:py-1.5 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-medium [&>th]:text-ops-text-tertiary">
                  <th>Tracking</th>
                  <th>Zone</th>
                  <th>When</th>
                  <th className="text-right">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="[&>td]:border-b [&>td]:border-ops-line [&>td]:px-3 [&>td]:py-2 last:[&>td]:border-b-0">
                    <td className="ops-mono text-ops-text">{s.tracking}</td>
                    <td className="text-[12px] text-ops-text-secondary">{s.zone}</td>
                    <td className="text-[11px] text-ops-text-tertiary">{formatRelative(s.updatedAt)}</td>
                    <td className="text-right">
                      <StatusPill tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
