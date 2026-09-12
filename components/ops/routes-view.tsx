"use client";

import * as React from "react";
import { CircleCheck, MapPin, Package, TriangleAlert, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, Chip, StatusPill } from "./primitives";
import type { DeliveryRoute, StopState } from "@/lib/ops/types";
import { ROUTES, driverById } from "@/lib/ops/data";
import { formatClock, formatRelative } from "@/lib/ops/format";

const STOP_DOT: Record<StopState, string> = {
  done: "bg-ops-ok-dot",
  failed: "bg-ops-risk-dot",
  current: "bg-ops-accent",
  pending: "bg-ops-line-strong",
};

function tally(route: DeliveryRoute) {
  const done = route.stops.filter((s) => s.state === "done").length;
  const failed = route.stops.filter((s) => s.state === "failed").length;
  const remaining = route.stops.length - done - failed;
  return { done, failed, remaining, total: route.stops.length };
}

/* ---------------------------------------------------------------------- */

function RouteRow({
  route,
  selected,
  onSelect,
}: {
  route: DeliveryRoute;
  selected: boolean;
  onSelect: () => void;
}) {
  const driver = driverById(route.driverId)!;
  const { done, failed, total } = tally(route);
  const pct = Math.round(((done + failed) / total) * 100);
  const finished = done + failed === total;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "relative w-full border-b border-ops-line px-3 py-2.5 text-left transition-colors",
        selected ? "bg-ops-accent-weak" : "hover:bg-ops-hover",
      )}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-[2px] bg-ops-accent" aria-hidden />}

      <div className="flex items-center gap-2">
        <span className="ops-mono text-[12px] font-medium text-ops-text">{route.code}</span>
        <Chip>{route.zone}</Chip>
        <span className="ml-auto flex items-center gap-1">
          {failed > 0 && <StatusPill tone="risk">{failed} failed</StatusPill>}
          {finished ? <StatusPill tone="ok">Complete</StatusPill> : <StatusPill tone="move">On round</StatusPill>}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <Avatar initials={driver.initials} />
        <span className="truncate text-[12px] text-ops-text-secondary">{driver.name}</span>
        <span className="ops-num ml-auto shrink-0 text-[11px] text-ops-text-tertiary">
          {done + failed}/{total}
        </span>
      </div>

      <div className="mt-1.5 flex h-1 gap-px overflow-hidden rounded-full bg-ops-active">
        <span className="bg-ops-ok-dot" style={{ width: `${(done / total) * 100}%` }} />
        {failed > 0 && <span className="bg-ops-risk-dot" style={{ width: `${(failed / total) * 100}%` }} />}
      </div>

      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-ops-text-tertiary">
        <span>{pct}% cleared</span>
        <span aria-hidden>·</span>
        <span>finishes {formatClock(route.etaFinish)}</span>
      </div>
    </button>
  );
}

/* ---------------------------------------------------------------------- */

export function RoutesView() {
  const [selectedId, setSelectedId] = React.useState(ROUTES[0].id);
  const route = ROUTES.find((r) => r.id === selectedId)!;
  const driver = driverById(route.driverId)!;
  const { done, failed, remaining } = tally(route);

  const onRound = ROUTES.filter((r) => tally(r).remaining > 0).length;

  return (
    <div className="flex h-full min-h-0">
      {/* --------------------------- Rounds list --------------------------- */}
      <div className="flex w-[292px] shrink-0 flex-col border-r border-ops-line bg-ops-surface">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-ops-line px-3">
          <div>
            <h1 className="text-[13px] font-semibold leading-4 text-ops-text">Rounds</h1>
            <p className="text-[10px] leading-3 text-ops-text-tertiary">
              {onRound} of {ROUTES.length} still out
            </p>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-[var(--ops-r-control)] border border-ops-line px-2 text-[12px] font-medium text-ops-text hover:bg-ops-hover"
          >
            <Truck className="size-3.5" /> Plan
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {ROUTES.map((r) => (
            <RouteRow key={r.id} route={r} selected={r.id === selectedId} onSelect={() => setSelectedId(r.id)} />
          ))}
        </div>
      </div>

      {/* -------------------------- Stop sequence -------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col bg-ops-workspace">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-ops-line bg-ops-surface px-4 py-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="ops-mono text-[14px] font-semibold text-ops-text">{route.code}</h2>
              <Chip>{route.zone}</Chip>
            </div>
            <p className="truncate text-[11px] text-ops-text-tertiary">
              {driver.name} · {driver.vehicle} · started {formatClock(route.startedAt)}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-2.5 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
              Resequence
            </button>
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-[var(--ops-r-control)] bg-ops-accent px-2.5 text-[12px] font-medium text-white hover:bg-ops-accent-hover">
              <MapPin className="size-3.5" /> Track live
            </button>
          </div>
        </div>

        {/* Round summary */}
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-ops-line bg-ops-workspace px-4 py-3">
          {[
            { label: "Delivered", value: done, tone: "ok" as const, icon: CircleCheck },
            { label: "Failed", value: failed, tone: "risk" as const, icon: TriangleAlert },
            { label: "Remaining", value: remaining, tone: "idle" as const, icon: Package },
          ].map((s) => (
            <div key={s.label} className="flex min-w-[128px] flex-1 items-center gap-2.5 rounded-[var(--ops-r-inner)] border border-ops-line bg-ops-surface px-3 py-2.5">
              <s.icon
                className={cn(
                  "size-4 shrink-0",
                  s.tone === "ok" && "text-ops-ok-fg",
                  s.tone === "risk" && "text-ops-risk-fg",
                  s.tone === "idle" && "text-ops-text-tertiary",
                )}
              />
              <div className="min-w-0">
                <div className="ops-figure text-[18px] font-semibold leading-none text-ops-text">{s.value}</div>
                <div className="truncate text-[11px] text-ops-text-secondary">{s.label}</div>
              </div>
            </div>
          ))}
          <div className="flex min-w-[150px] flex-1 flex-col justify-center gap-1 rounded-[var(--ops-r-inner)] border border-ops-line bg-ops-surface px-3 py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] text-ops-text-secondary">Vehicle load</span>
              <span className="ops-num ml-auto text-[11px] font-medium text-ops-text">{route.loadPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ops-active">
              <div className="h-full rounded-full bg-ops-series-volume" style={{ width: `${route.loadPct}%` }} />
            </div>
            <div className="text-[10px] text-ops-text-tertiary">at load-out</div>
          </div>
        </div>

        {/* The sequence. Reading down it answers "where is the driver, and
            what is still ahead of them" without opening a single record. */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ol className="ops-card">
            {route.stops.map((stop, i) => {
              const settled = stop.state === "done" || stop.state === "failed";
              const isCurrent = stop.state === "current";

              return (
                <li
                  key={stop.id}
                  className={cn(
                    "relative flex items-center gap-3 border-b border-ops-line px-3 py-2 last:border-b-0",
                    isCurrent && "bg-ops-accent-weak",
                  )}
                >
                  {/* Connector between sequence markers */}
                  {i !== route.stops.length - 1 && (
                    <span className="absolute left-[26px] top-1/2 h-full w-px bg-ops-line" aria-hidden />
                  )}

                  <span
                    className={cn(
                      "relative z-10 grid size-[22px] shrink-0 place-items-center rounded-full text-[10px] font-semibold ring-2 ring-ops-surface",
                      stop.state === "done" && "bg-ops-ok-bg text-ops-ok-fg",
                      stop.state === "failed" && "bg-ops-risk-bg text-ops-risk-fg",
                      stop.state === "current" && "bg-ops-accent text-white ring-ops-accent-weak",
                      stop.state === "pending" && "bg-ops-active text-ops-text-tertiary",
                    )}
                  >
                    {stop.seq}
                  </span>

                  <span className="ops-mono w-[76px] shrink-0 text-ops-text-secondary">{stop.tracking}</span>

                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[12px] font-medium", settled ? "text-ops-text-secondary" : "text-ops-text")}>
                      {stop.recipient}
                    </span>
                    <span className="block truncate text-[11px] text-ops-text-tertiary">
                      {stop.postcode} · {stop.window}
                      {stop.note ? ` · ${stop.note}` : ""}
                    </span>
                  </span>

                  {isCurrent && (
                    <StatusPill tone="move" className="shrink-0">
                      With driver
                    </StatusPill>
                  )}

                  <span className="flex w-[72px] shrink-0 items-center justify-end gap-1.5">
                    <span className={cn("size-1.5 rounded-full", STOP_DOT[stop.state])} aria-hidden />
                    <span className={cn("ops-num text-[11px]", stop.state === "failed" ? "text-ops-risk-fg" : "text-ops-text-tertiary")}>
                      {settled ? formatClock(stop.at) : formatRelative(stop.at)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
