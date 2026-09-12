"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChartNoAxesColumn,
  CircleAlert,
  Gauge,
  LayoutDashboard,
  Moon,
  Package,
  PanelLeft,
  Route,
  Search,
  Settings,
  Sun,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd } from "./primitives";
import { usePersistedFlag, useBrand, useTheme } from "@/lib/ops/client-state";
import { NOW, RANKED, DRIVERS } from "@/lib/ops/data";
import { formatClock } from "@/lib/ops/format";

const attentionCount = RANKED.filter(
  (s) => s.sla === "breached" || s.sla === "at_risk" || s.status === "exception" || (!s.driverId && s.status !== "delivered" && s.status !== "booked"),
).length;
const activeCount = RANKED.filter((s) => s.status !== "delivered").length;
const exceptionCount = RANKED.filter((s) => s.status === "exception").length;
const driversOut = DRIVERS.filter((d) => d.state === "on_route").length;

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  /** Counts that represent a problem are tinted; volume counts stay neutral. */
  alarming?: boolean;
};

const PRIMARY: NavItem[] = [
  // Two audiences, two entry points: Overview is the manager's weekly read,
  // Today is the dispatcher's shift board and stays the default route.
  { href: "/ops/overview", label: "Overview", icon: Gauge },
  { href: "/ops", label: "Today", icon: LayoutDashboard, count: attentionCount, alarming: true },
  { href: "/ops/shipments", label: "Shipments", icon: Package, count: activeCount },
  { href: "/ops/exceptions", label: "Exceptions", icon: CircleAlert, count: exceptionCount, alarming: true },
  { href: "/ops/drivers", label: "Drivers", icon: Truck, count: driversOut },
  { href: "/ops/routes", label: "Routes", icon: Route },
];

const SECONDARY: NavItem[] = [
  { href: "/ops/reports", label: "Reports", icon: ChartNoAxesColumn },
  { href: "/ops/settings", label: "Settings", icon: Settings },
];

/**
 * Brand comparison control. Review-only — remove once the identity is
 * signed off, along with the losing `data-brand` block in globals.css.
 */
function BrandSwitch() {
  const { brand, setBrand } = useBrand();
  const OPTIONS = [
    { id: "violet" as const, label: "Violet", swatch: "#5b3ee6" },
    { id: "orange" as const, label: "Orange", swatch: "#c74106" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Brand colour"
      title="Brand colour — for review"
      className="flex items-center gap-0.5 rounded-full border border-ops-line bg-ops-sunken p-0.5"
    >
      {OPTIONS.map((o) => {
        const active = brand === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${o.label} brand`}
            onClick={() => setBrand(o.id)}
            className={cn(
              "grid size-[22px] place-items-center rounded-full transition-colors",
              active ? "bg-ops-surface shadow-sm" : "hover:bg-ops-hover",
            )}
          >
            <span
              className={cn("size-2.5 rounded-full", active ? "ring-2 ring-ops-surface" : "opacity-55")}
              style={{ background: o.swatch }}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  // Exact match for the index route, prefix match for the rest, so /ops
  // doesn't stay highlighted while you're on /ops/shipments.
  const active = item.href === "/ops" ? pathname === "/ops" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex h-7 items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-ops-active text-ops-text"
          : "text-ops-text-secondary hover:bg-ops-hover hover:text-ops-text",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className={cn("size-[15px] shrink-0", active ? "text-ops-text" : "text-ops-text-tertiary group-hover:text-ops-text-secondary")} />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.count !== undefined && item.count > 0 && (
            <span
              className={cn(
                "ops-num ml-auto rounded px-1 text-[11px] font-semibold tabular-nums",
                item.alarming ? "bg-ops-risk-bg text-ops-risk-fg" : "text-ops-text-tertiary",
              )}
            >
              {item.count}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

export function AppShell({
  children,
  onOpenPalette,
}: {
  children: React.ReactNode;
  onOpenPalette: () => void;
}) {
  const [collapsed, setCollapsed] = usePersistedFlag("snk-nav-collapsed");
  const { dark, toggle } = useTheme();

  const toggleNav = () => setCollapsed(!collapsed);

  return (
    <div className="ops-root ops-frame">
      <div className="flex">
      {/* ---------------------------------------------------------------- */}
      {/* Sidebar                                                           */}
      {/* ---------------------------------------------------------------- */}
      <nav
        aria-label="Main"
        className={cn(
          "hidden shrink-0 flex-col border-r border-ops-line bg-ops-surface transition-[width] duration-150 md:flex",
          collapsed ? "w-[52px]" : "w-[212px]",
        )}
      >
        <div className={cn("flex h-12 items-center gap-2 border-b border-ops-line px-3", collapsed && "justify-center px-0")}>
          <span className="grid size-6 shrink-0 place-items-center rounded bg-ops-text text-[11px] font-bold text-ops-text-inverse">
            S
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold leading-4 text-ops-text">SNK Courier</div>
              <div className="truncate text-[10px] leading-3 text-ops-text-tertiary">Bermondsey hub</div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="flex flex-col gap-px">
            {PRIMARY.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>

          <div className="my-2 h-px bg-ops-line" />

          <div className="flex flex-col gap-px">
            {SECONDARY.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>

        {/* Shift status. An ops console should always answer "who is out?" */}
        {!collapsed && (
          <div className="border-t border-ops-line p-3">
            <div className="ops-eyebrow mb-1.5">Shift</div>
            <div className="flex items-baseline gap-1.5">
              <span className="ops-num text-[18px] font-semibold leading-none text-ops-text">{driversOut}</span>
              <span className="text-[11px] text-ops-text-tertiary">of {DRIVERS.length} drivers on route</span>
            </div>
            <div className="mt-2 flex h-1 gap-px overflow-hidden rounded-full">
              {DRIVERS.map((d) => (
                <span
                  key={d.id}
                  title={`${d.name} — ${d.state.replace("_", " ")}`}
                  className={cn(
                    "flex-1",
                    d.state === "on_route" && "bg-ops-ok-dot",
                    d.state === "break" && "bg-ops-warn-dot",
                    d.state === "at_depot" && "bg-ops-idle-dot",
                    d.state === "offline" && "bg-ops-risk-dot",
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <div className={cn("flex items-center gap-2 border-t border-ops-line p-2", collapsed && "justify-center")}>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ops-active text-[10px] font-semibold text-ops-text-secondary">
            AK
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium leading-4 text-ops-text">Amina Kaur</div>
              <div className="truncate text-[10px] leading-3 text-ops-text-tertiary">Duty manager</div>
            </div>
          )}
        </div>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* Main column                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-ops-line bg-ops-surface px-3">
          <button
            type="button"
            onClick={toggleNav}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid size-7 shrink-0 place-items-center rounded-md text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
          >
            <PanelLeft className="size-4" />
          </button>

          {/* Global search doubles as the command palette entry point. */}
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex h-7 w-full max-w-[420px] items-center gap-2 rounded-md border border-ops-line bg-ops-sunken px-2 text-left text-ops-text-tertiary transition-colors hover:border-ops-line-strong hover:bg-ops-surface"
          >
            <Search className="size-3.5 shrink-0" />
            <span className="text-[12px]">Search tracking, recipient, postcode…</span>
            <span className="ml-auto hidden sm:block">
              <Kbd>⌘K</Kbd>
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            {/* Live-ness indicator. In an ops tool, staleness is a safety issue. */}
            <span className="mr-1 hidden items-center gap-1.5 text-[11px] text-ops-text-tertiary lg:flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ops-ok-dot opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-ops-ok-dot" />
              </span>
              Live · synced {formatClock(NOW)}
            </span>

            <BrandSwitch />

            <button
              type="button"
              onClick={toggle}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              className="grid size-7 place-items-center rounded-md text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <button
              type="button"
              aria-label={`Notifications, ${exceptionCount} unread`}
              className="relative grid size-7 place-items-center rounded-md text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
            >
              <Bell className="size-4" />
              {exceptionCount > 0 && (
                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-ops-risk-dot ring-2 ring-ops-surface" />
              )}
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden bg-ops-workspace">{children}</main>
        </div>
      </div>
    </div>
  );
}
