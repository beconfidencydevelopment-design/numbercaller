"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
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
import {
  DRAFT_REVENUE,
  DRIVERS_UNSETTLED,
  EXPENSES,
  NOW,
  PERIOD,
  COMPANIES,
} from "@/lib/ops/data";
import { formatDateFull, formatTime } from "@/lib/ops/format";

/**
 * Navigation.
 *
 * A top pill bar rather than a left rail. Five destinations do not need a
 * permanent 200px column, and the pages underneath are wide ledgers — giving
 * the table the full width is worth more here than a persistent sidebar. It
 * is also the shape of all three dashboards the client picked as references.
 *
 * Counts are the open items on each page, so the nav answers "where is there
 * work" before you click anything.
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

function NavPill({ item }: { item: NavItem }) {
  const pathname = usePathname();
  // Exact match on the index route so Home does not stay lit on a child page.
  const active = item.href === "/ops" ? pathname === "/ops" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors",
        active
          ? "bg-ops-focal-bg text-ops-focal-fg"
          : "text-ops-text-secondary hover:bg-ops-hover hover:text-ops-text",
      )}
    >
      <Icon className={cn("size-[15px] shrink-0", active ? "opacity-90" : "text-ops-text-tertiary")} />
      <span>{item.label}</span>
      {item.count !== undefined && item.count > 0 && (
        <span
          className={cn(
            "ops-num ml-0.5 rounded-full px-1.5 text-[11px] font-semibold",
            active ? "bg-white/15 text-ops-focal-fg" : "bg-ops-active text-ops-text-tertiary",
          )}
        >
          {item.count}
        </span>
      )}
    </Link>
  );
}

/**
 * Period switcher.
 *
 * The single most important piece of context in the product: every figure on
 * every screen is scoped to it. In the current build it sits in the page
 * header and changes position from page to page; here it is fixed in the
 * chrome so it never moves and never has to be re-found.
 */
function PeriodSwitcher() {
  return (
    <div className="flex h-8 items-center gap-0.5 rounded-full border border-ops-line bg-ops-surface pl-1 pr-1">
      <button
        type="button"
        aria-label="Previous period"
        className="grid size-6 place-items-center rounded-full text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <span className="flex items-center gap-1.5 whitespace-nowrap px-1.5 text-[12px] font-semibold text-ops-text">
        <span className="size-1.5 rounded-full bg-ops-warn-dot" aria-hidden />
        {PERIOD.label}
        <span className="font-normal text-ops-text-tertiary">· open</span>
      </span>
      <button
        type="button"
        aria-label="Next period"
        disabled
        className="grid size-6 place-items-center rounded-full text-ops-text-tertiary disabled:opacity-35"
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
      <div className="flex flex-col">
        {/* ------------------------------------------------------------- */}
        {/* Chrome                                                         */}
        {/* ------------------------------------------------------------- */}
        <header className="flex shrink-0 flex-col border-b border-ops-line bg-ops-surface">
          <div className="flex h-14 items-center gap-3 px-4">
            <Link href="/ops" className="flex shrink-0 items-center gap-2.5" aria-label="SNK Courier — Home">
              <BrandMark />
              <span className="hidden h-5 w-px bg-ops-line lg:block" aria-hidden />
              <span className="hidden text-[12px] font-medium text-ops-text-tertiary lg:block">Operations</span>
            </Link>

            <nav aria-label="Main" className="ml-2 hidden items-center gap-0.5 md:flex">
              {NAV.map((item) => (
                <NavPill key={item.href} item={item} />
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenPalette}
                className="flex h-8 items-center gap-2 rounded-full border border-ops-line bg-ops-sunken pl-2.5 pr-1.5 text-left text-ops-text-tertiary transition-colors hover:border-ops-line-strong hover:bg-ops-surface"
              >
                <Search className="size-3.5 shrink-0" />
                <span className="hidden whitespace-nowrap text-[12px] lg:block">Search entries, drivers, companies</span>
                <span className="hidden sm:block">
                  <Kbd>⌘K</Kbd>
                </span>
              </button>

              <PeriodSwitcher />

              <button
                type="button"
                onClick={toggle}
                aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
                className="grid size-8 place-items-center rounded-full border border-ops-line bg-ops-surface text-ops-text-tertiary hover:bg-ops-hover hover:text-ops-text"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>

              <button
                type="button"
                className="flex h-8 items-center gap-2 rounded-full border border-ops-line bg-ops-surface pl-1 pr-2.5 hover:bg-ops-hover"
              >
                <Avatar initials="SH" tone="accent" className="size-6" />
                <span className="hidden whitespace-nowrap text-[12px] font-medium text-ops-text sm:block">Syed Hyder</span>
              </button>
            </div>
          </div>

          {/* Mobile nav. Same destinations, scrolled horizontally. */}
          <nav aria-label="Main" className="flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
            {NAV.map((item) => (
              <NavPill key={item.href} item={item} />
            ))}
          </nav>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-ops-workspace">{children}</main>

        {/* A ledger should always say how fresh it is. */}
        <footer className="flex h-8 shrink-0 items-center gap-3 border-t border-ops-line bg-ops-surface px-4 text-[11px] text-ops-text-tertiary">
          <span>
            Last updated {formatDateFull(NOW)}, {formatTime(NOW)}
          </span>
          <span className="ml-auto hidden sm:block">All amounts in CAD</span>
        </footer>
      </div>
    </div>
  );
}
