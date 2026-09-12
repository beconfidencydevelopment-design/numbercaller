"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { DAILY, type DayPoint } from "@/lib/ops/data";
import { formatDay } from "@/lib/ops/format";

const RANGES = [
  { id: 14, label: "14D" },
  { id: 30, label: "30D" },
  { id: 90, label: "90D" },
] as const;

/** Plot geometry in viewBox units; the SVG scales to its container. */
const W = 720;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 22, left: 40 };

/**
 * Delivered volume against work booked.
 *
 * One series is the point (delivered, solid area) and one is context (booked,
 * dashed line) — the "emphasis" form, rather than two competing fills. The
 * gap between the lines is the backlog, which is the actual insight: when
 * booked runs above delivered for several days, tomorrow breaches.
 *
 * Both series share one axis. A second y-scale would make the gap meaningless.
 */
export function VolumeChart() {
  const [days, setDays] = React.useState<number>(30);
  const [asTable, setAsTable] = React.useState(false);
  const [hover, setHover] = React.useState<number | null>(null);

  const data = React.useMemo(() => DAILY.slice(-days), [days]);

  const max = React.useMemo(
    () => Math.ceil(Math.max(...data.map((d) => Math.max(d.booked, d.delivered))) / 50) * 50,
    [data],
  );

  const x = (i: number) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom);

  const line = (key: "booked" | "delivered") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");

  const area =
    `${line("delivered")} L${x(data.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const active: DayPoint | null = hover !== null ? data[hover] : null;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const frac = (rel - PAD.left) / (W - PAD.left - PAD.right);
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(frac * (data.length - 1)))));
  };

  // Label roughly six x-ticks whatever the range, so they never collide.
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <section className="ops-card flex flex-col">
      <header className="flex flex-wrap items-center gap-3 px-4 pb-2 pt-3">
        <div>
          <h2 className="text-[13px] font-semibold text-ops-text">Volume &amp; backlog</h2>
          <p className="text-[11px] text-ops-text-tertiary">Parcels delivered against parcels booked</p>
        </div>

        {/* Legend is always present for two series. */}
        <div className="flex items-center gap-3 text-[11px] text-ops-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-3 rounded-full bg-ops-series-volume" aria-hidden />
            Delivered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-3 border-t-2 border-dashed border-ops-text-tertiary" aria-hidden />
            Booked
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAsTable((t) => !t)}
            aria-pressed={asTable}
            className="h-6 rounded-full border border-ops-line px-2 text-[11px] font-medium text-ops-text-secondary hover:bg-ops-hover hover:text-ops-text"
          >
            {asTable ? "Chart" : "Table"}
          </button>
          <div className="flex items-center gap-0.5 rounded-full bg-ops-active p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setDays(r.id)}
                aria-pressed={days === r.id}
                className={cn(
                  "h-6 rounded-full px-2.5 text-[11px] font-medium transition-colors",
                  days === r.id
                    ? "bg-ops-text text-ops-text-inverse"
                    : "text-ops-text-secondary hover:text-ops-text",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {asTable ? (
        /* Table twin: every value in the chart is reachable without hover. */
        <div className="max-h-[232px] overflow-auto px-1 pb-1">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0">
              <tr className="[&>th]:border-b [&>th]:border-ops-line [&>th]:bg-ops-sunken [&>th]:px-2 [&>th]:py-1 [&>th]:text-[11px] [&>th]:font-medium [&>th]:text-ops-text-tertiary">
                <th className="text-left">Date</th>
                <th className="text-right">Booked</th>
                <th className="text-right">Delivered</th>
                <th className="text-right">Failed</th>
                <th className="text-right">On-time</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.at} className="[&>td]:border-b [&>td]:border-ops-line [&>td]:px-2 [&>td]:py-1 [&>td]:text-[12px]">
                  <td className="text-ops-text-secondary">{formatDay(d.at)}</td>
                  <td className="ops-num text-right text-ops-text">{d.booked}</td>
                  <td className="ops-num text-right text-ops-text">{d.delivered}</td>
                  <td className="ops-num text-right text-ops-risk-fg">{d.failed}</td>
                  <td className="ops-num text-right text-ops-text-secondary">{d.onTime}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative px-2 pb-2">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full touch-none"
            style={{ height: 232 }}
            role="img"
            aria-label={`Delivered volume against booked volume over the last ${days} days`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="vol-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ops-series-volume)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--ops-series-volume)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Recessive grid + axis */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--ops-grid)" strokeWidth="1" />
                <text x={PAD.left - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--ops-text-tertiary)">
                  {t}
                </text>
              </g>
            ))}

            {data.map((d, i) =>
              i % labelEvery === 0 ? (
                <text
                  key={d.at}
                  x={x(i)}
                  y={H - 6}
                  textAnchor={i === 0 ? "start" : i > data.length - labelEvery ? "end" : "middle"}
                  fontSize="10"
                  fill="var(--ops-text-tertiary)"
                >
                  {formatDay(d.at)}
                </text>
              ) : null,
            )}

            <path d={area} fill="url(#vol-fill)" />
            <path d={line("booked")} fill="none" stroke="var(--ops-text-tertiary)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
            <path d={line("delivered")} fill="none" stroke="var(--ops-series-volume)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--ops-line-strong)" strokeWidth="1" strokeDasharray="3 3" />
                {/* 2px surface ring keeps the markers legible over the fill. */}
                <circle cx={x(hover)} cy={y(data[hover].booked)} r="4" fill="var(--ops-text-tertiary)" stroke="var(--ops-surface)" strokeWidth="2" />
                <circle cx={x(hover)} cy={y(data[hover].delivered)} r="4.5" fill="var(--ops-series-volume)" stroke="var(--ops-surface)" strokeWidth="2" />
              </g>
            )}
          </svg>

          {active && (
            <div
              className="pointer-events-none absolute top-3 rounded-[var(--ops-r-inner)] border border-ops-line bg-ops-raised px-2.5 py-2 shadow-ops-pop"
              style={{
                left: `calc(${(x(hover!) / W) * 100}% + ${hover! > data.length / 2 ? -136 : 12}px)`,
              }}
            >
              <div className="mb-1 text-[11px] font-medium text-ops-text">{formatDay(active.at)}</div>
              <dl className="flex flex-col gap-0.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-ops-series-volume" aria-hidden />
                  <dt className="text-ops-text-secondary">Delivered</dt>
                  <dd className="ops-num ml-auto font-medium text-ops-text">{active.delivered}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-ops-text-tertiary" aria-hidden />
                  <dt className="text-ops-text-secondary">Booked</dt>
                  <dd className="ops-num ml-auto font-medium text-ops-text">{active.booked}</dd>
                </div>
                <div className="mt-0.5 flex items-center gap-2 border-t border-ops-line pt-1">
                  <dt className="text-ops-text-secondary">Backlog</dt>
                  <dd className={cn("ops-num ml-auto font-medium", active.booked > active.delivered ? "text-ops-risk-fg" : "text-ops-ok-fg")}>
                    {active.booked - active.delivered > 0 ? "+" : ""}
                    {active.booked - active.delivered}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
