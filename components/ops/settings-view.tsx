"use client";

import * as React from "react";
import { Bell, Boxes, Plug, Timer, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, StatusPill } from "./primitives";
import { PageHeader } from "./page-header";
import { SERVICE_LABEL, SERVICE_PERFORMANCE } from "@/lib/ops/data";

const PANELS = [
  { id: "service", label: "Service levels", icon: Timer },
  { id: "promise", label: "Promise thresholds", icon: Boxes },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "team", label: "Team", icon: Users },
  { id: "integrations", label: "Integrations", icon: Plug },
] as const;

type PanelId = (typeof PANELS)[number]["id"];

const CUTOFFS: Record<string, string> = {
  same_day: "11:00",
  next_day: "18:30",
  economy: "18:30",
  freight: "16:00",
};

const TEAM = [
  { name: "Amina Kaur", email: "amina@snk.co.uk", role: "Duty manager", initials: "AK", active: true },
  { name: "Tom Reilly", email: "tom@snk.co.uk", role: "Dispatcher", initials: "TR", active: true },
  { name: "Priya Shah", email: "priya@snk.co.uk", role: "Dispatcher", initials: "PS", active: true },
  { name: "Leo Whitmore", email: "leo@snk.co.uk", role: "Finance", initials: "LW", active: true },
  { name: "Cara Nolan", email: "cara@snk.co.uk", role: "Read only", initials: "CN", active: false },
];

const INTEGRATIONS = [
  { name: "Shopify", detail: "Pulls orders as bookings from three connected stores.", connected: true },
  { name: "Xero", detail: "Pushes delivered consignments to invoicing nightly.", connected: true },
  { name: "Samsara", detail: "Vehicle telematics and driver device pings.", connected: true },
  { name: "Twilio", detail: "Recipient SMS on out-for-delivery and failed attempt.", connected: false },
];

const ALERTS = [
  { id: "a1", label: "Promise breached", detail: "The moment a parcel passes its committed time.", channel: "In-app + SMS", on: true },
  { id: "a2", label: "Breaching within 60 minutes", detail: "Early warning while the round can still be changed.", channel: "In-app", on: true },
  { id: "a3", label: "Second failed attempt", detail: "Before a parcel is committed to a third round.", channel: "In-app + email", on: true },
  { id: "a4", label: "Driver device silent", detail: "No ping for longer than the threshold below.", channel: "In-app + SMS", on: true },
  { id: "a5", label: "Round finished", detail: "Every stop on a round settled.", channel: "In-app", on: false },
];

/* ---------------------------------------------------------------------- */

function Switch({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      aria-label={label}
      tabIndex={0}
      className={cn(
        "inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors",
        on ? "bg-ops-accent" : "bg-ops-line-strong",
      )}
    >
      <span className={cn("size-3 rounded-full bg-white transition-transform", on && "translate-x-3")} />
    </span>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-ops-text">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-ops-text-tertiary">{hint}</span>}
    </label>
  );
}

const inputCls =
  "h-8 w-full rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-2 text-[12px] text-ops-text outline-none focus:border-ops-accent-line";

function Panel({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return (
    <section className="ops-card">
      <header className="border-b border-ops-line px-4 py-3">
        <h2 className="text-[13px] font-semibold text-ops-text">{title}</h2>
        <p className="text-[11px] text-ops-text-tertiary">{detail}</p>
      </header>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------------- */

export function SettingsView() {
  const [panel, setPanel] = React.useState<PanelId>("service");

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Settings"
        subtitle="Bermondsey hub · changes apply to every operator on this account"
        actions={
          <>
            <button type="button" className="inline-flex h-7 items-center rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-2.5 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
              Discard
            </button>
            <button type="button" className="inline-flex h-7 items-center rounded-[var(--ops-r-control)] bg-ops-accent px-2.5 text-[12px] font-medium text-white hover:bg-ops-accent-hover">
              Save changes
            </button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Settings sections" className="w-[196px] shrink-0 border-r border-ops-line bg-ops-surface p-2">
          <div className="flex flex-col gap-px">
            {PANELS.map((p) => {
              const active = panel === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPanel(p.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex h-7 items-center gap-2 rounded-[var(--ops-r-control)] px-2 text-left text-[12px] font-medium transition-colors",
                    active ? "bg-ops-active text-ops-text" : "text-ops-text-secondary hover:bg-ops-hover hover:text-ops-text",
                  )}
                >
                  <p.icon className={cn("size-3.5 shrink-0", active ? "text-ops-text" : "text-ops-text-tertiary")} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto bg-ops-workspace p-4">
          <div className="flex max-w-[760px] flex-col gap-3">
            {panel === "service" && (
              <Panel title="Service levels" detail="The promise each service makes, and the booking cut-off that protects it.">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="[&>th]:border-b [&>th]:border-ops-line [&>th]:bg-ops-sunken [&>th]:px-3 [&>th]:py-1.5 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-medium [&>th]:text-ops-text-tertiary">
                      <th>Service</th>
                      <th className="w-[110px]">Cut-off</th>
                      <th className="w-[110px]">Target</th>
                      <th className="w-[130px]">Last 90 days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SERVICE_PERFORMANCE.map((s) => {
                      const met = s.actual >= s.target;
                      return (
                        <tr key={s.service} className="h-11 [&>td]:border-b [&>td]:border-ops-line [&>td]:px-3 last:[&>td]:border-b-0">
                          <td className="text-[12px] font-medium text-ops-text">{SERVICE_LABEL[s.service]}</td>
                          <td>
                            <input className={inputCls} defaultValue={CUTOFFS[s.service]} aria-label={`${SERVICE_LABEL[s.service]} cut-off`} />
                          </td>
                          <td>
                            <input className={inputCls} defaultValue={`${s.target}%`} aria-label={`${SERVICE_LABEL[s.service]} target`} />
                          </td>
                          {/* Showing measured performance next to the input is
                              the point: a target nobody hits should be changed
                              or resourced, and the operator can see which. */}
                          <td>
                            <StatusPill tone={met ? "ok" : "warn"}>{s.actual}%</StatusPill>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Panel>
            )}

            {panel === "promise" && (
              <Panel title="Promise thresholds" detail="When the console starts treating a parcel as a problem.">
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <Field label="At-risk window" hint="Minutes before the promise at which a parcel moves to At risk.">
                    <input className={inputCls} defaultValue="60" inputMode="numeric" />
                  </Field>
                  <Field label="Due-soon window" hint="Minutes before the promise at which a parcel is flagged amber.">
                    <input className={inputCls} defaultValue="180" inputMode="numeric" />
                  </Field>
                  <Field label="Driver silent after" hint="Minutes without a device ping before the driver is flagged.">
                    <input className={inputCls} defaultValue="20" inputMode="numeric" />
                  </Field>
                  <Field label="Maximum attempts" hint="Attempts before a parcel is returned to the hub.">
                    <input className={inputCls} defaultValue="3" inputMode="numeric" />
                  </Field>
                </div>
                <div className="flex items-center gap-3 border-t border-ops-line px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium text-ops-text">Auto-escalate breaches to the duty manager</div>
                    <div className="text-[11px] text-ops-text-tertiary">Raises a task the moment a parcel passes its committed time.</div>
                  </div>
                  <span className="ml-auto"><Switch on label="Auto-escalate breaches" /></span>
                </div>
              </Panel>
            )}

            {panel === "alerts" && (
              <Panel title="Alerts" detail="What interrupts an operator, and how.">
                <div>
                  {ALERTS.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 border-b border-ops-line px-4 py-3 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-medium text-ops-text">{a.label}</div>
                        <div className="text-[11px] text-ops-text-tertiary">{a.detail}</div>
                      </div>
                      <span className="shrink-0 text-[11px] text-ops-text-secondary">{a.channel}</span>
                      <Switch on={a.on} label={a.label} />
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {panel === "team" && (
              <Panel title="Team" detail="Five people have access to this hub.">
                <div>
                  {TEAM.map((m) => (
                    <div key={m.email} className="flex items-center gap-3 border-b border-ops-line px-4 py-2.5 last:border-b-0">
                      <Avatar initials={m.initials} className="size-7 text-[10px]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-ops-text">{m.name}</div>
                        <div className="truncate text-[11px] text-ops-text-tertiary">{m.email}</div>
                      </div>
                      {!m.active && <StatusPill tone="idle">Invite pending</StatusPill>}
                      <select
                        aria-label={`Role for ${m.name}`}
                        defaultValue={m.role}
                        className="h-8 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-2 text-[12px] text-ops-text outline-none focus:border-ops-accent-line"
                      >
                        {["Duty manager", "Dispatcher", "Finance", "Read only"].map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {panel === "integrations" && (
              <Panel title="Integrations" detail="Systems that write bookings in, or read deliveries out.">
                <div>
                  {INTEGRATIONS.map((i) => (
                    <div key={i.name} className="flex items-center gap-3 border-b border-ops-line px-4 py-3 last:border-b-0">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[var(--ops-r-control)] bg-ops-active text-[11px] font-semibold text-ops-text-secondary">
                        {i.name.slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-medium text-ops-text">{i.name}</div>
                        <div className="truncate text-[11px] text-ops-text-tertiary">{i.detail}</div>
                      </div>
                      {i.connected ? (
                        <StatusPill tone="ok">Connected</StatusPill>
                      ) : (
                        <button type="button" className="inline-flex h-7 items-center rounded-[var(--ops-r-control)] border border-ops-line px-2.5 text-[12px] font-medium text-ops-text hover:bg-ops-hover">
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
