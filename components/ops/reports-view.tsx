"use client";

import * as React from "react";
import { CalendarClock, Download, FileText, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { Chip, StatusPill } from "./primitives";
import { PageHeader } from "./page-header";
import { NOW } from "@/lib/ops/data";
import { formatDay, formatFull, formatRelative } from "@/lib/ops/format";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

/**
 * Reports is a library and a schedule, not a second analytics page.
 * Overview already answers "how are we doing"; this screen answers "send the
 * client their SLA evidence every Monday without me remembering to".
 */
const LIBRARY = [
  {
    id: "sla",
    name: "SLA performance",
    detail: "On-time rate by service level and customer, against contracted targets.",
    span: "Monthly",
    scheduled: true,
  },
  {
    id: "exceptions",
    name: "Exception analysis",
    detail: "Failed attempts grouped by reason, zone and driver, with repeat-address flags.",
    span: "Weekly",
    scheduled: true,
  },
  {
    id: "driver",
    name: "Driver productivity",
    detail: "Stops per hour, first-time delivery rate and round completion by driver.",
    span: "Weekly",
    scheduled: false,
  },
  {
    id: "volume",
    name: "Volume & capacity",
    detail: "Booked against delivered by zone, with backlog carried into the next day.",
    span: "Daily",
    scheduled: true,
  },
  {
    id: "billing",
    name: "Billing reconciliation",
    detail: "Delivered consignments matched to invoiced lines, with surcharges itemised.",
    span: "Monthly",
    scheduled: false,
  },
  {
    id: "cost",
    name: "Cost of failure",
    detail: "Redelivery attempts costed by service level and root cause.",
    span: "Monthly",
    scheduled: false,
  },
];

const SCHEDULED = [
  { id: "s1", report: "SLA performance", freq: "Monthly · 1st, 07:00", to: "ops@snk.co.uk, finance@snk.co.uk", next: NOW + 19 * DAY, live: true },
  { id: "s2", report: "Exception analysis", freq: "Weekly · Monday, 08:00", to: "ops@snk.co.uk", next: NOW + 2 * DAY, live: true },
  { id: "s3", report: "Volume & capacity", freq: "Daily · 06:00", to: "duty-manager@snk.co.uk", next: NOW + 15 * HOUR, live: true },
  { id: "s4", report: "Driver productivity", freq: "Weekly · Friday, 17:00", to: "fleet@snk.co.uk", next: NOW + 6 * DAY, live: false },
];

const EXPORTS = [
  { id: "e1", file: "sla-performance-2026-08.pdf", at: NOW - 4 * HOUR, size: "412 KB", by: "Amina Kaur" },
  { id: "e2", file: "exception-analysis-w36.csv", at: NOW - 26 * HOUR, size: "88 KB", by: "Scheduled" },
  { id: "e3", file: "volume-capacity-2026-09-11.csv", at: NOW - 33 * HOUR, size: "141 KB", by: "Scheduled" },
  { id: "e4", file: "billing-recon-2026-08.xlsx", at: NOW - 5 * DAY, size: "1.2 MB", by: "Tom Reilly" },
];

export function ReportsView() {
  const [tab, setTab] = React.useState<"library" | "scheduled" | "exports">("library");

  const TABS = [
    { id: "library" as const, label: "Library", count: LIBRARY.length },
    { id: "scheduled" as const, label: "Scheduled", count: SCHEDULED.filter((s) => s.live).length },
    { id: "exports" as const, label: "Recent exports", count: EXPORTS.length },
  ];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Reports"
        subtitle="Standing reports, delivery schedules and export history"
        actions={
          <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-[var(--ops-r-control)] bg-ops-accent px-2.5 text-[12px] font-medium text-white hover:bg-ops-accent-hover">
            <FileText className="size-3.5" /> New report
          </button>
        }
      />

      <div className="flex shrink-0 items-center gap-1 border-b border-ops-line bg-ops-surface px-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "true" : undefined}
            className={cn(
              "relative flex h-9 items-center gap-1.5 px-2 text-[12px] font-medium transition-colors",
              tab === t.id ? "text-ops-text" : "text-ops-text-secondary hover:text-ops-text",
            )}
          >
            {t.label}
            <span className="ops-num rounded bg-ops-active px-1 text-[11px] font-semibold text-ops-text-secondary">{t.count}</span>
            {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ops-text" />}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-ops-workspace p-4">
        {tab === "library" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {LIBRARY.map((r) => (
              <article key={r.id} className="ops-card flex flex-col gap-2 p-3.5">
                <div className="flex items-start gap-2">
                  <h3 className="text-[13px] font-semibold text-ops-text">{r.name}</h3>
                  {r.scheduled && (
                    <span className="ml-auto shrink-0">
                      <StatusPill tone="ok">Scheduled</StatusPill>
                    </span>
                  )}
                </div>
                <p className="text-[12px] leading-relaxed text-ops-text-secondary">{r.detail}</p>
                <div className="mt-auto flex items-center gap-1.5 pt-1">
                  <Chip>{r.span}</Chip>
                  <button type="button" className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-[var(--ops-r-control)] border border-ops-line px-2 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
                    <Play className="size-3" /> Run
                  </button>
                  <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-[var(--ops-r-control)] border border-ops-line px-2 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
                    <CalendarClock className="size-3" /> Schedule
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "scheduled" && (
          <div className="ops-card">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="[&>th]:border-b [&>th]:border-ops-line [&>th]:bg-ops-sunken [&>th]:px-3 [&>th]:py-1.5 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-medium [&>th]:text-ops-text-tertiary">
                  <th>Report</th>
                  <th className="w-[190px]">Frequency</th>
                  <th className="w-[280px]">Recipients</th>
                  <th className="w-[130px]">Next run</th>
                  <th className="w-[90px] text-right">Active</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULED.map((s) => (
                  <tr key={s.id} className="h-10 [&>td]:border-b [&>td]:border-ops-line [&>td]:px-3 last:[&>td]:border-b-0">
                    <td className="text-[12px] font-medium text-ops-text">{s.report}</td>
                    <td className="text-[12px] text-ops-text-secondary">{s.freq}</td>
                    <td className="truncate text-[12px] text-ops-text-secondary">{s.to}</td>
                    <td className="text-[11px] text-ops-text-tertiary">{s.live ? formatRelative(s.next) : "—"}</td>
                    <td className="text-right">
                      {/* Presentational switch: the schedule is the thing an
                          ops manager actually toggles, so it lives in the row. */}
                      <span
                        role="switch"
                        aria-checked={s.live}
                        aria-label={`${s.report} schedule`}
                        tabIndex={0}
                        className={cn(
                          "inline-flex h-4 w-7 items-center rounded-full p-0.5 transition-colors",
                          s.live ? "bg-ops-accent" : "bg-ops-line-strong",
                        )}
                      >
                        <span className={cn("size-3 rounded-full bg-white transition-transform", s.live && "translate-x-3")} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "exports" && (
          <div className="ops-card">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="[&>th]:border-b [&>th]:border-ops-line [&>th]:bg-ops-sunken [&>th]:px-3 [&>th]:py-1.5 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-medium [&>th]:text-ops-text-tertiary">
                  <th>File</th>
                  <th className="w-[170px]">Generated</th>
                  <th className="w-[130px]">By</th>
                  <th className="w-[90px]">Size</th>
                  <th className="w-[60px]" />
                </tr>
              </thead>
              <tbody>
                {EXPORTS.map((e) => (
                  <tr key={e.id} className="group h-10 [&>td]:border-b [&>td]:border-ops-line [&>td]:px-3 last:[&>td]:border-b-0">
                    <td className="ops-mono text-ops-text">{e.file}</td>
                    <td className="text-[12px] text-ops-text-secondary">{formatFull(e.at)}</td>
                    <td className="text-[12px] text-ops-text-secondary">{e.by}</td>
                    <td className="ops-num text-[12px] text-ops-text-tertiary">{e.size}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        aria-label={`Download ${e.file}`}
                        className="grid size-7 place-items-center rounded-[var(--ops-r-control)] text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
                      >
                        <Download className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-ops-line px-3 py-2 text-[11px] text-ops-text-tertiary">
              Exports are retained for 90 days. Oldest in this list: {formatDay(EXPORTS[EXPORTS.length - 1].at)}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
