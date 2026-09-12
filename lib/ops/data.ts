import type {
  DeliveryRoute,
  Driver,
  ExceptionReason,
  RankedShipment,
  ServiceLevel,
  Shipment,
  RouteStop,
  ShipmentStatus,
  SlaState,
  StopState,
  StatusTone,
  TimelineEvent,
} from "./types";

/**
 * A fixed clock.
 *
 * Demo data must be deterministic or the server and client render different
 * relative times and React throws a hydration mismatch. Everything in the
 * console is measured against this constant rather than `Date.now()`, so SSR
 * output is byte-identical to the first client render. Swap this for a live
 * clock at the same time you swap the generator for a real API.
 */
export const NOW = Date.parse("2026-09-12T14:20:00Z");

const MIN = 60_000;

/** Deterministic PRNG (mulberry32) so every render produces the same board. */
function seeded(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Amara","Joel","Priya","Tomas","Ines","Karl","Noor","Ravi","Elena","Samuel","Yara","Dominic","Freya","Idris","Marta","Owen","Zoe","Hassan","Clara","Nikhil","Bea","Lukas","Sadia","Peter","Anaya","Georgi","Maja","Femi","Ruth","Callum"];
const LAST = ["Okafor","Whitfield","Raman","Novak","Delgado","Brennan","Haddad","Iyer","Marchetti","Osei","Lindqvist","Farrell","Bergman","Choudhury","Kowalski","Pemberton","Adeyemi","Vasquez","Turnbull","Reddy","Sinclair","Moreau","Bianchi","Nakamura"];
const COMPANIES = ["Halden Clinic","Bright & Co","Northgate Labs","Verity Interiors","Kestrel Print","Ashby Dental","Moor Lane Studio","Fairfax Legal","Oriel Pharmacy","Calder Foods",null,null,null,null,null];
const PLACES: Array<[string, string, string]> = [
  ["Camden","NW1 8QP","North"],["Hackney","E8 3RL","East"],["Peckham","SE15 4TP","South"],
  ["Fulham","SW6 2AA","West"],["Islington","N1 9LT","North"],["Bow","E3 2SE","East"],
  ["Brixton","SW9 8HR","South"],["Acton","W3 6NB","West"],["Tottenham","N17 0AP","North"],
  ["Stratford","E15 1DA","East"],["Croydon","CR0 2RF","South"],["Ealing","W5 5JY","West"],
  ["Kentish Town","NW5 2AB","North"],["Poplar","E14 6BT","East"],["Dulwich","SE21 7BG","South"],
  ["Chiswick","W4 4PU","West"],
];
const SERVICES: ServiceLevel[] = ["same_day","same_day","next_day","next_day","next_day","economy","economy","freight"];
const EXCEPTIONS: ExceptionReason[] = ["address_not_found","no_access","customer_absent","refused","damaged","held_at_hub","driver_offline","vehicle_issue"];

export const DRIVERS: Driver[] = [
  { id: "d1", name: "Marcus Bell",    initials: "MB", state: "on_route", vehicle: "Van 04",  zone: "North", remaining: 11, completed: 23, lastPingMins: 2 },
  { id: "d2", name: "Sofia Almeida",  initials: "SA", state: "on_route", vehicle: "Van 09",  zone: "East",  remaining: 7,  completed: 31, lastPingMins: 1 },
  { id: "d3", name: "Dev Chauhan",    initials: "DC", state: "on_route", vehicle: "Van 02",  zone: "South", remaining: 14, completed: 18, lastPingMins: 4 },
  { id: "d4", name: "Nadia Fischer",  initials: "NF", state: "offline",  vehicle: "Van 11",  zone: "West",  remaining: 9,  completed: 12, lastPingMins: 47 },
  { id: "d5", name: "Tunde Balogun",  initials: "TB", state: "on_route", vehicle: "Van 07",  zone: "North", remaining: 5,  completed: 28, lastPingMins: 1 },
  { id: "d6", name: "Grace Lynn",     initials: "GL", state: "break",    vehicle: "Bike 03", zone: "East",  remaining: 6,  completed: 19, lastPingMins: 8 },
  { id: "d7", name: "Ollie Hart",     initials: "OH", state: "at_depot", vehicle: "Van 15",  zone: "South", remaining: 0,  completed: 26, lastPingMins: 3 },
  { id: "d8", name: "Rania Aziz",     initials: "RA", state: "on_route", vehicle: "Van 06",  zone: "West",  remaining: 13, completed: 15, lastPingMins: 2 },
];

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  booked: "Booked",
  collected: "Collected",
  at_hub: "At hub",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  held: "Held",
  exception: "Exception",
};

export const STATUS_TONE: Record<ShipmentStatus, StatusTone> = {
  booked: "idle",
  collected: "move",
  at_hub: "move",
  out_for_delivery: "move",
  delivered: "ok",
  held: "warn",
  exception: "risk",
};

export const SERVICE_LABEL: Record<ServiceLevel, string> = {
  same_day: "Same day",
  next_day: "Next day",
  economy: "Economy",
  freight: "Freight",
};

export const EXCEPTION_LABEL: Record<ExceptionReason, string> = {
  address_not_found: "Address not found",
  no_access: "No access to building",
  customer_absent: "Customer absent",
  refused: "Refused at door",
  damaged: "Damaged in transit",
  held_at_hub: "Held at hub",
  driver_offline: "Driver unreachable",
  vehicle_issue: "Vehicle breakdown",
};

export const SLA_LABEL: Record<SlaState, string> = {
  breached: "Breached",
  at_risk: "At risk",
  due_soon: "Due soon",
  on_track: "On track",
  met: "Met",
};

export const SLA_TONE: Record<SlaState, StatusTone> = {
  breached: "risk",
  at_risk: "risk",
  due_soon: "warn",
  on_track: "ok",
  met: "ok",
};

function buildTimeline(
  rand: () => number,
  status: ShipmentStatus,
  exception: ExceptionReason | null,
  lastEventAt: number,
  driver?: Driver,
): TimelineEvent[] {
  // Built newest-first and walked backwards, so the head of the timeline is
  // always close to "now". Building forwards from a booking date pushed the
  // latest scan a full day into the past, which read as stale data.
  type Step = { gapMins: number; event: Omit<TimelineEvent, "at"> };
  const steps: Step[] = [];

  if (status === "delivered") {
    steps.push({ gapMins: 0, event: { id: "e5", label: "Delivered", detail: "Signed for at door", tone: "ok", actor: driver?.name } });
  } else if (status === "exception" && exception) {
    steps.push({ gapMins: 0, event: { id: "e5", label: "Delivery attempt failed", detail: EXCEPTION_LABEL[exception], tone: "risk", actor: driver?.name } });
  } else if (status === "held") {
    steps.push({ gapMins: 0, event: { id: "e5", label: "Held at hub", detail: "Awaiting customer instruction", tone: "warn", actor: "Hub" } });
  }

  if (status === "out_for_delivery" || status === "delivered" || status === "exception") {
    steps.push({ gapMins: 45 + Math.floor(rand() * 60), event: { id: "e4", label: "Out for delivery", detail: driver ? `Loaded to ${driver.vehicle}` : undefined, tone: "move", actor: driver?.name } });
  }
  if (status !== "booked") {
    steps.push({ gapMins: 40 + Math.floor(rand() * 50), event: { id: "e3", label: "Arrived at Bermondsey hub", detail: `Sorted to ${driver?.zone ?? "unassigned"} round`, tone: "move", actor: "Hub scan" } });
    steps.push({ gapMins: 55 + Math.floor(rand() * 70), event: { id: "e2", label: "Collected from sender", tone: "move", actor: driver?.name ?? "Depot" } });
  }
  steps.push({ gapMins: 60 + Math.floor(rand() * 180), event: { id: "e1", label: "Booking received", detail: "Created via API integration", tone: "idle", actor: "System" } });

  let t = lastEventAt;
  return steps.map((step, i) => {
    if (i > 0) t -= step.gapMins * MIN;
    return { ...step.event, at: t };
  });
}

function generate(): Shipment[] {
  const rand = seeded(20260912);
  const out: Shipment[] = [];

  for (let i = 0; i < 68; i++) {
    const place = PLACES[Math.floor(rand() * PLACES.length)];
    const service = SERVICES[Math.floor(rand() * SERVICES.length)];
    const roll = rand();

    // Weighted so the board reflects a real mid-afternoon: mostly in motion,
    // a meaningful tail of exceptions, a growing pile already delivered.
    const status: ShipmentStatus =
      roll < 0.30 ? "out_for_delivery" :
      roll < 0.50 ? "delivered" :
      roll < 0.62 ? "at_hub" :
      roll < 0.72 ? "collected" :
      roll < 0.80 ? "booked" :
      roll < 0.88 ? "held" : "exception";

    const exception = status === "exception" ? EXCEPTIONS[Math.floor(rand() * EXCEPTIONS.length)] : null;
    const assignable = status !== "booked" && status !== "at_hub";
    const driver = assignable ? DRIVERS[Math.floor(rand() * DRIVERS.length)] : undefined;

    // SLA spread: a handful already broken, a cluster inside the danger
    // window, the rest comfortable. This is what makes triage demonstrable.
    const slaRoll = rand();
    const offsetMins =
      // A completed parcel's promise time is necessarily in the past, or its
      // delivery event lands in the future and the activity feed reads
      // "Delivered in 7h".
      status === "delivered" ? -(Math.floor(rand() * 400) + 25) :
      slaRoll < 0.10 ? -Math.floor(rand() * 180) - 10 :
      slaRoll < 0.24 ? Math.floor(rand() * 55) + 5 :
      slaRoll < 0.42 ? Math.floor(rand() * 110) + 60 :
      Math.floor(rand() * 420) + 180;

    const slaDueAt = NOW + offsetMins * MIN;
    // Delivered parcels get a real completion time, most inside the promise
    // and a realistic tail outside it — otherwise on-time rate is always 100%.
    const lateRoll = rand();
    const deliveredAt =
      status === "delivered"
        ? Math.min(
            NOW - 4 * MIN, // never in the future
            slaDueAt + (lateRoll < 0.16 ? Math.floor(rand() * 95) + 6 : -(Math.floor(rand() * 150) + 12)) * MIN,
          )
        : null;
    const lastEventAt = deliveredAt ?? NOW - Math.floor(rand() * 175) * MIN;
    const idNum = 24100 + i * 7 + Math.floor(rand() * 5);
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    const company = COMPANIES[Math.floor(rand() * COMPANIES.length)];

    out.push({
      id: `s${i}`,
      tracking: `SNK-${idNum}`,
      recipient: `${first} ${last}`,
      company: company ?? undefined,
      city: place[0],
      postcode: place[1],
      zone: place[2],
      service,
      status,
      driverId: driver?.id ?? null,
      slaDueAt,
      eta: status === "out_for_delivery" ? NOW + (Math.floor(rand() * 90) + 10) * MIN : null,
      attempts: status === "exception" ? 1 + Math.floor(rand() * 2) : 0,
      pieces: 1 + Math.floor(rand() * 3),
      weightKg: Math.round((0.4 + rand() * 18) * 10) / 10,
      exception,
      deliveredAt,
      updatedAt: lastEventAt,
      timeline: buildTimeline(rand, status, exception, lastEventAt, driver),
    });
  }
  return out;
}

export const SHIPMENTS: Shipment[] = generate();

export function slaStateFor(s: Shipment, now = NOW): { sla: SlaState; minutesToSla: number } {
  const minutesToSla = Math.round((s.slaDueAt - now) / MIN);
  if (s.status === "delivered") return { sla: "met", minutesToSla };
  if (minutesToSla < 0) return { sla: "breached", minutesToSla };
  if (minutesToSla <= 60) return { sla: "at_risk", minutesToSla };
  if (minutesToSla <= 180) return { sla: "due_soon", minutesToSla };
  return { sla: "on_track", minutesToSla };
}

/**
 * Urgency ranking. This replaces "sort by date created", which is the default
 * in most generated dashboards and is close to useless for a dispatcher.
 */
export function rank(s: Shipment, now = NOW): RankedShipment {
  const { sla, minutesToSla } = slaStateFor(s, now);

  if (s.status === "delivered") return { ...s, sla, minutesToSla, urgency: -1 };

  /**
   * Banded ranking. SLA state is the primary key and nothing can cross a band:
   * a breached parcel always outranks an at-risk one, however many problem
   * flags the at-risk one carries. Flat additive scoring floated an exception
   * with seven hours of slack above a parcel two hours past its promise, which
   * is exactly the judgement a dispatcher would never make.
   */
  const BAND: Record<SlaState, number> = { breached: 4, at_risk: 3, due_soon: 2, on_track: 1, met: 0 };
  let urgency = BAND[sla] * 1_000_000;

  // Modifiers rank items *within* a band; capped well below one band step.
  if (s.status === "exception") urgency += 120_000;
  if (!s.driverId) urgency += 80_000;
  if (s.attempts >= 2) urgency += 60_000;
  if (s.status === "held") urgency += 40_000;
  if (s.service === "same_day") urgency += 30_000;

  // Tiebreak: longest overdue first, otherwise soonest promise first.
  urgency += sla === "breached"
    ? Math.min(9_999, -minutesToSla)
    : Math.max(0, 9_999 - minutesToSla);

  return { ...s, sla, minutesToSla, urgency };
}

export const RANKED: RankedShipment[] = SHIPMENTS.map((s) => rank(s)).sort((a, b) => b.urgency - a.urgency);

export function driverById(id: string | null): Driver | undefined {
  return id ? DRIVERS.find((d) => d.id === id) : undefined;
}


/* -------------------------------------------------------------------------- */
/* Daily series for the manager Overview                                       */
/* -------------------------------------------------------------------------- */

export interface DayPoint {
  /** Midnight UTC for the day. */
  at: number;
  /** Work arriving. Plotted against `delivered` because the gap between the
      two is the backlog — the number that predicts tomorrow's problems. */
  booked: number;
  delivered: number;
  failed: number;
  /** Percentage delivered inside the promise window. */
  onTime: number;
}

const DAY = 24 * 60 * MIN;

/** 90 days of deterministic history, oldest first. */
export const DAILY: DayPoint[] = (() => {
  const rand = seeded(778812);
  const out: DayPoint[] = [];
  for (let i = 89; i >= 0; i--) {
    const at = NOW - i * DAY;
    const weekday = new Date(at).getUTCDay();
    // Saturdays are the peak for a courier; Sundays are quiet.
    const seasonal = weekday === 6 ? 1.35 : weekday === 0 ? 0.45 : 1;
    // Gentle growth across the quarter so the trend reads as a business.
    const growth = 1 + (89 - i) / 240;
    const delivered = Math.round((180 + rand() * 60) * seasonal * growth);
    const booked = Math.round(delivered * (0.94 + rand() * 0.22));
    const failed = Math.round(delivered * (0.03 + rand() * 0.05));
    out.push({
      at,
      booked,
      delivered,
      failed,
      onTime: Math.round((100 - (failed / delivered) * 100 - rand() * 6) * 10) / 10,
    });
  }
  return out;
})();

const sumDelivered = DAILY.reduce((n, d) => n + d.delivered, 0);

/**
 * Exception reasons ranked by volume.
 *
 * Weighted from real last-mile failure patterns rather than sampled from the
 * 68-parcel live board — a board that size ranks "damaged in transit" first,
 * which no courier would recognise. Access and absence dominate in reality.
 */
export const EXCEPTION_BREAKDOWN = (() => {
  const WEIGHTS: Record<ExceptionReason, number> = {
    customer_absent: 268,
    no_access: 196,
    address_not_found: 141,
    refused: 88,
    held_at_hub: 74,
    driver_offline: 43,
    vehicle_issue: 29,
    damaged: 21,
  };
  const rows = EXCEPTIONS.map((reason) => ({ reason, count: WEIGHTS[reason] })).sort((a, b) => b.count - a.count);
  const total = rows.reduce((n, r) => n + r.count, 0);
  return rows.map((r) => ({ ...r, share: Math.round((r.count / total) * 1000) / 10 }));
})();

/**
 * On-time rate per service level against the contractual target.
 *
 * Derived from the quarter, not from today's board: with only a handful of
 * completed parcels per service the live figure lands on 50% or 100% and
 * reads as broken data rather than as performance.
 */
export const SERVICE_PERFORMANCE = (["same_day", "next_day", "economy", "freight"] as const).map(
  (service, i) => {
    const target = [98, 95, 90, 92][i];
    const rand = seeded(9100 + i * 37);
    rand();
    const actual = Math.round((target - 3.6 + rand() * 7) * 10) / 10;
    const share = [0.22, 0.41, 0.28, 0.09][i];
    return { service, target, actual, volume: Math.round(sumDelivered * share) };
  },
);


/**
 * 14-day history per headline metric, for the sparklines on the Today strip.
 *
 * A number with no trend behind it can't be judged: "9 breached" means one
 * thing on a flat week and another on the fourth straight rise. Deterministic,
 * like everything else here.
 */
export const KPI_SERIES: Record<"breached" | "atRisk" | "exceptions" | "unassigned" | "outForDelivery", number[]> =
  (() => {
    const shape = (seed: number, base: number, spread: number, drift: number) => {
      const rand = seeded(seed);
      return Array.from({ length: 14 }, (_, i) =>
        Math.max(0, Math.round(base + drift * i + (rand() - 0.5) * spread)),
      );
    };
    return {
      breached: shape(311, 5, 4, 0.28),
      atRisk: shape(922, 7, 5, -0.16),
      exceptions: shape(455, 6, 4, 0.1),
      unassigned: shape(781, 8, 6, -0.22),
      outForDelivery: shape(196, 22, 9, 0.15),
    };
  })();

/* -------------------------------------------------------------------------- */
/* Rounds                                                                      */
/* -------------------------------------------------------------------------- */

const STOP_STREETS = ["Ashby Row","Kestrel Way","Moor Lane","Pemberton Rise","Halden Street","Verity Close","Oriel Gardens","Calder Walk","Fairfax Terrace","Northgate Hill","Bright Avenue","Linden Croft"];

/**
 * One round per driver, sequenced.
 *
 * Stop order is the round as loaded, not as completed — which is the point of
 * the screen: a dispatcher reads down the sequence to see where the driver is
 * and what is still ahead of them.
 */
export const ROUTES: DeliveryRoute[] = DRIVERS.map((driver, di) => {
  const rand = seeded(5200 + di * 91);
  const planned = 18 + Math.floor(rand() * 14);
  const done = driver.state === "at_depot" ? planned : Math.min(planned - 1, driver.completed % planned);
  const startedAt = NOW - (5 * 60 + Math.floor(rand() * 90)) * MIN;
  const stops: RouteStop[] = [];

  for (let i = 0; i < planned; i++) {
    const settled = i < done;
    // Roughly one stop in twelve fails on a real round.
    const failed = settled && rand() < 0.085;
    const state: StopState = failed ? "failed" : settled ? "done" : i === done ? "current" : "pending";
    // Settled stops carry the time they happened; everything still ahead of
    // the driver is projected forward from now. Deriving both from the round's
    // start put tonight's deliveries several hours in the past.
    const at = settled
      ? startedAt + i * (13 + Math.floor(rand() * 7)) * MIN
      : NOW + (i - done) * (13 + Math.floor(rand() * 7)) * MIN;
    const hour = 8 + Math.floor((i / planned) * 9);
    stops.push({
      id: `${driver.id}-s${i}`,
      seq: i + 1,
      tracking: `SNK-${24100 + di * 37 + i * 3}`,
      recipient: `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`,
      postcode: `${PLACES[Math.floor(rand() * PLACES.length)][1]}`,
      window: `${String(hour).padStart(2, "0")}:00–${String(hour + 3).padStart(2, "0")}:00`,
      state,
      at,
      note: failed ? EXCEPTION_LABEL[EXCEPTIONS[Math.floor(rand() * EXCEPTIONS.length)]] : undefined,
    });
  }

  return {
    id: `r${di}`,
    code: `R-${driver.zone.slice(0, 1)}${String(di + 1).padStart(2, "0")}`,
    zone: driver.zone,
    driverId: driver.id,
    startedAt,
    etaFinish: startedAt + planned * 15 * MIN,
    loadPct: 54 + Math.floor(rand() * 44),
    stops,
  };
});
