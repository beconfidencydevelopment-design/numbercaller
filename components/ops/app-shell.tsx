"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Moon,
  Receipt,
  Search,
  Sun,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, Kbd } from "./primitives";
import { BrandMark } from "./brand-mark";
import { useTheme } from "@/lib/ops/client-state";
import { COMPANIES, DRAFT_REVENUE, DRIVERS_UNSETTLED, EXPENSES, NOW, PERIOD } from "@/lib/ops/data";
import { formatDateFull, formatTime } from "@/lib/ops/format";

/**
 * Navigation.
 *
 * A left rail, as in the client's own build and in both dashboards they
 * pointed at for this round. Five destinations with counts, the user pinned
 * to the bottom. The rail is quiet on purpose — small icons, one weight of
 * text, the active item marked by a tint and a hairline of accent on its
 * left edge rather than by a filled pill.
 */
type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
};

const NAV: NavItem[] = [
  { href: "/ops", label: "Home", icon: LayoutGrid },
  { href: "/ops/expenses", label: "Expenses", icon: Receipt, count: EXPENSES.length },
  { href: "/ops/clients", label: "Clients", icon: Building2, count: COMPANIES.length },
  { href: "/ops/drivers", label: "Drivers", icon: Users, count: DRIVERS_UNSETTLED },
  { href: "/ops/financials", label: "Financials", icon: ChartPie, count: DRAFT_REVENUE.length },
];

function NavLink({ item, compact }: { item: NavItem; compact?: boolean }) {
  const pathname = usePathname();
  const active = item.href === "/ops" ? pathname === "/ops" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 rounded-[var(--ops-r-control)] px-2.5 text-[13px] transition-colors",
        active
          ? "bg-ops-active font-medium text-ops-text"
          : "text-ops-text-secondary hover:bg-ops-hover hover:text-ops-text",
        compact && "h-8 shrink-0 rounded-full px-3",
      )}
    >
      {active && !compact && (
        <span className="absolute inset-y-2 -left-2 w-[2px] rounded-full bg-ops-accent" aria-hidden />
      )}
      <Icon className={cn("size-4 shrink-0", active ? "text-ops-text" : "text-ops-text-tertiary")} />
      <span className="truncate">{item.label}</span>
      {item.count !== undefined && item.count > 0 && (
        <span className="ops-num ml-auto text-[11px] text-ops-text-tertiary">{item.count}</span>
      )}
    </Link>
  );
}

/**
 * Period switcher. Fixed in the chrome so it never has to be re-found — every
 * figure on every screen is scoped to it.
 */
function PeriodSwitcher() {
  return (
    <div className="flex h-8 items-center gap-0.5 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface px-1">
      <button
        type="button"
        aria-label="Previous period"
        className="grid size-6 place-items-center rounded-md text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <span className="ops-num flex items-center gap-1.5 whitespace-nowrap px-1.5 text-[12px] font-medium text-ops-text">
        <span className="size-1.5 rounded-full bg-ops-warn-dot" aria-hidden />
        {PERIOD.label}
        <span className="font-normal text-ops-text-tertiary">open</span>
      </span>
      <button
        type="button"
        aria-label="Next period"
        disabled
        className="grid size-6 place-items-center rounded-md text-ops-text-tertiary disabled:opacity-35"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

export function AppShell({
  children,
  onOpenPalette,
}: {
  children: React.ReactNode;
  onOpenPalette: () => void;
}) {
  const { dark, toggle } = useTheme();

  return (
    <div className="ops-root ops-frame">
      <div className="flex">
        {/* ------------------------------------------------------------- */}
        {/* Rail                                                           */}
        {/* ------------------------------------------------------------- */}
        <aside className="hidden w-[216px] shrink-0 flex-col border-r border-ops-line bg-ops-surface md:flex">
          <div className="flex h-14 items-center gap-2.5 border-b border-ops-line px-4">
            <Link href="/ops" aria-label="SNK Courier — Home">
              <BrandMark />
            </Link>
          </div>

          <nav aria-label="Main" className="flex flex-col gap-0.5 px-2 pt-3">
            {NAV.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="mt-auto px-2 pb-2">
            <button
              type="button"
              className="flex h-9 w-full items-center gap-2.5 rounded-[var(--ops-r-control)] px-2.5 text-[13px] text-ops-text-secondary hover:bg-ops-hover hover:text-ops-text"
            >
              <LogOut className="size-4 shrink-0 text-ops-text-tertiary" />
              Log out
            </button>
          </div>

          <div className="flex items-center gap-2.5 border-t border-ops-line px-4 py-3">
            <Avatar initials="SH" tone="accent" className="size-7 text-[10px]" />
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-medium leading-4 text-ops-text">Syed Hyder</div>
              <div className="ops-num truncate text-[11px] leading-4 text-ops-text-tertiary">Owner</div>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------------- */}
        {/* Main column                                                    */}
        {/* ------------------------------------------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-ops-line bg-ops-surface px-4">
            <Link href="/ops" className="md:hidden" aria-label="SNK Courier — Home">
              <BrandMark />
            </Link>

            <button
              type="button"
              onClick={onOpenPalette}
              className="flex h-8 w-full max-w-[380px] items-center gap-2 rounded-[var(--ops-r-control)] border border-ops-line bg-ops-sunken px-2.5 text-left text-ops-text-tertiary transition-colors hover:border-ops-line-strong hover:bg-ops-surface"
            >
              <Search className="size-3.5 shrink-0" />
              <span className="truncate text-[12px]">Search entries, drivers, companies</span>
              <span className="ml-auto hidden sm:block">
                <Kbd>⌘K</Kbd>
              </span>
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              <PeriodSwitcher />
              <button
                type="button"
                onClick={toggle}
                aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
                className="grid size-8 place-items-center rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="relative grid size-8 place-items-center rounded-[var(--ops-r-control)] border border-ops-line bg-ops-surface text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
              >
                <Bell className="size-4" />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-ops-accent ring-2 ring-ops-surface" />
              </button>
            </div>
          </header>

          {/* Mobile nav — same destinations, one scrollable row. */}
          <nav aria-label="Main" className="flex items-center gap-1 overflow-x-auto border-b border-ops-line bg-ops-surface px-3 py-2 md:hidden">
            {NAV.map((item) => (
              <NavLink key={item.href} item={item} compact />
            ))}
          </nav>

          <main className="min-h-0 flex-1 overflow-y-auto bg-ops-workspace">{children}</main>

          <footer className="ops-num flex h-8 shrink-0 items-center gap-3 border-t border-ops-line bg-ops-surface px-4 text-[11px] text-ops-text-tertiary">
            <span>
              Last updated {formatDateFull(NOW)}, {formatTime(NOW)}
            </span>
            <span className="ml-auto hidden sm:block">All amounts in CAD</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
