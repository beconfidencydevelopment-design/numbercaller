/**
 * The console's icon set.
 *
 * Every icon in the product comes through this file under our own name.
 * Nothing else imports from the underlying library, so swapping the library
 * again is a one-file change with zero call sites touched — which is exactly
 * how the last swap went.
 *
 * Library: HugeIcons, Stroke Rounded, 24 grid at 1.5 stroke. Both packages
 * are MIT, so client work and dev handoff are fine.
 *
 * Naming gotcha worth remembering: in HugeIcons a name ending 01 is a
 * chevron and 02 is a shafted arrow. Use 02 for calls to action, 01 for
 * dropdowns and steppers.
 */
import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity03Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  Building03Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckListIcon,
  CornerDownLeftIcon,
  DeliveryTruck01Icon,
  Download04Icon,
  GridViewIcon,
  Invoice03Icon,
  ListViewIcon,
  LockIcon,
  Logout03Icon,
  Money01Icon,
  PetrolPumpIcon,
  Moon02Icon,
  MoreHorizontalIcon,
  Notification03Icon,
  PieChartIcon,
  PlusSignIcon,
  Search01Icon,
  Shield01Icon,
  Sun03Icon,
  Tick02Icon,
  UserGroupIcon,
  Wallet02Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

export type IconProps = {
  className?: string;
  /** Pixel size. CSS on a parent still wins — see the note on Button. */
  size?: number;
  strokeWidth?: number;
};

/** Binds one icon from the library to our own component name. */
const make = (icon: Parameters<typeof HugeiconsIcon>[0]["icon"], displayName: string) => {
  /* `shrink-0` on every icon, always.
     An SVG is a flex item like any other, so inside a control that runs out
     of room it is the icon that gives way — a 12px arrow inside a 70px
     button on the close-period checklist was rendering at five pixels, which
     looks like a rendering fault rather than a tight button. An icon that
     cannot fit should overflow its button so the button gets fixed. */
  const Component = ({ className, size = 20, strokeWidth = 1.5 }: IconProps) => (
    <HugeiconsIcon
      icon={icon}
      className={`shrink-0 ${className ?? ""}`}
      size={size}
      strokeWidth={strokeWidth}
      color="currentColor"
    />
  );
  Component.displayName = displayName;
  return Component;
};

/* Navigation */
export const IconHome = make(GridViewIcon, "IconHome");
export const IconExpenses = make(Invoice03Icon, "IconExpenses");
export const IconClients = make(Building03Icon, "IconClients");
export const IconDrivers = make(UserGroupIcon, "IconDrivers");
export const IconFinancials = make(PieChartIcon, "IconFinancials");

/* Chrome */
export const IconSearch = make(Search01Icon, "IconSearch");
export const IconBell = make(Notification03Icon, "IconBell");
export const IconMoon = make(Moon02Icon, "IconMoon");
export const IconSun = make(Sun03Icon, "IconSun");
export const IconLogOut = make(Logout03Icon, "IconLogOut");

/* Direction. 02 is the shafted arrow for calls to action; 01 is the chevron. */
export const IconArrowRight = make(ArrowRight02Icon, "IconArrowRight");
export const IconChevronLeft = make(ArrowLeft01Icon, "IconChevronLeft");
export const IconChevronRight = make(ArrowRight01Icon, "IconChevronRight");
export const IconChevronDown = make(ArrowDown01Icon, "IconChevronDown");
export const IconEnter = make(CornerDownLeftIcon, "IconEnter");

/* Actions */
export const IconPlus = make(PlusSignIcon, "IconPlus");
export const IconDownload = make(Download04Icon, "IconDownload");
export const IconClose = make(Cancel01Icon, "IconClose");
export const IconCheck = make(Tick02Icon, "IconCheck");
export const IconLock = make(LockIcon, "IconLock");

/* Content */
export const IconCards = make(GridViewIcon, "IconCards");
export const IconList = make(ListViewIcon, "IconList");
export const IconChecklist = make(CheckListIcon, "IconChecklist");
export const IconActivity = make(Activity03Icon, "IconActivity");
export const IconCalendar = make(Calendar03Icon, "IconCalendar");
export const IconWallet = make(Wallet02Icon, "IconWallet");
export const IconMoney = make(Money01Icon, "IconMoney");

/* Expense categories.
   Shape, not hue, is what separates these. The categorical palette is spoken
   for by the companies, and a second colour axis on the same table would mean
   two different things in one row. An outline also survives greyscale and
   every form of colour blindness, which a tinted chip does not. */
export const IconDriverPay = make(Wallet02Icon, "IconDriverPay");
export const IconVehicle = make(DeliveryTruck01Icon, "IconVehicle");
export const IconFuel = make(PetrolPumpIcon, "IconFuel");
export const IconMaintenance = make(Wrench01Icon, "IconMaintenance");
export const IconInsurance = make(Shield01Icon, "IconInsurance");
export const IconOther = make(MoreHorizontalIcon, "IconOther");
