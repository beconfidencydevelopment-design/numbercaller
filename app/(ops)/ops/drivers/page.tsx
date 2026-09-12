import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ops/page-header";
import { Avatar, Chip, StatusPill } from "@/components/ops/primitives";
import { DRIVERS, RANKED } from "@/lib/ops/data";
import type { DriverState } from "@/lib/ops/types";

export const metadata = { title: "Drivers · SNK Operations" };

const STATE_LABEL: Record<DriverState, string> = {
  on_route: "On route",
  at_depot: "At depot",
  break: "On break",
  offline: "Offline",
};

const STATE_TONE = {
  on_route: "ok",
  at_depot: "idle",
  break: "warn",
  offline: "risk",
} as const;

export default function DriversPage() {
  const onRoute = DRIVERS.filter((d) => d.state === "on_route").length;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Drivers"
        subtitle={`${onRoute} of ${DRIVERS.length} on route · Bermondsey hub`}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="[&>th]:border-b [&>th]:border-ops-line [&>th]:bg-ops-sunken [&>th]:px-2 [&>th]:py-1.5 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-medium [&>th]:text-ops-text-tertiary">
              <th className="pl-4">Driver</th>
              <th className="w-[110px]">State</th>
              <th className="w-[90px]">Vehicle</th>
              <th className="w-[80px]">Zone</th>
              <th className="w-[150px]">Progress</th>
              <th className="w-[90px]">Assigned</th>
              <th className="w-[110px] pr-4 text-right">Last ping</th>
            </tr>
          </thead>
          <tbody>
            {DRIVERS.map((d) => {
              const load = RANKED.filter((s) => s.driverId === d.id && s.status !== "delivered").length;
              const total = d.remaining + d.completed;
              const pct = Math.round((d.completed / total) * 100);
              const stale = d.lastPingMins > 20;

              return (
                <tr key={d.id} className="h-11 bg-ops-surface hover:bg-ops-hover [&>td]:border-b [&>td]:border-ops-line [&>td]:px-2">
                  <td className="pl-4">
                    <span className="flex items-center gap-2">
                      <Avatar initials={d.initials} className="size-6 text-[10px]" />
                      <span className="text-[12px] font-medium text-ops-text">{d.name}</span>
                    </span>
                  </td>
                  <td>
                    <StatusPill tone={STATE_TONE[d.state]}>{STATE_LABEL[d.state]}</StatusPill>
                  </td>
                  <td><Chip>{d.vehicle}</Chip></td>
                  <td className="text-[12px] text-ops-text-secondary">{d.zone}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-ops-active">
                        <div className="h-full rounded-full bg-ops-ok-dot" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="ops-num text-[11px] text-ops-text-secondary">
                        {d.completed}/{total}
                      </span>
                    </div>
                  </td>
                  <td className="ops-num text-[12px] text-ops-text">{load}</td>
                  <td className="pr-4 text-right">
                    <span className={cn("ops-num text-[12px]", stale ? "font-semibold text-ops-risk-fg" : "text-ops-text-tertiary")}>
                      {d.lastPingMins}m ago
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
