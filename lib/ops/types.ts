/**
 * Domain model for the SNK operations console.
 *
 * The important modelling decision here: **status and SLA are orthogonal.**
 * Most courier dashboards collapse them into one "status" column, which hides
 * the single most valuable fact in the business — a parcel can be perfectly
 * "Out for delivery" and still be about to breach its promise. Keeping them
 * separate is what lets the console sort by risk instead of by state.
 */

export type StatusTone = "ok" | "move" | "warn" | "risk" | "idle";

export type ShipmentStatus =
  | "booked"
  | "collected"
  | "at_hub"
  | "out_for_delivery"
  | "delivered"
  | "held"
  | "exception";

export type SlaState = "breached" | "at_risk" | "due_soon" | "on_track" | "met";

export type ServiceLevel = "same_day" | "next_day" | "economy" | "freight";

export type ExceptionReason =
  | "address_not_found"
  | "no_access"
  | "customer_absent"
  | "refused"
  | "damaged"
  | "held_at_hub"
  | "driver_offline"
  | "vehicle_issue";

export type DriverState = "on_route" | "at_depot" | "break" | "offline";

export interface Driver {
  id: string;
  name: string;
  initials: string;
  state: DriverState;
  vehicle: string;
  zone: string;
  /** Jobs still to complete on today's manifest. */
  remaining: number;
  completed: number;
  /** Minutes since the device last reported. Rising numbers mean trouble. */
  lastPingMins: number;
}

export interface TimelineEvent {
  id: string;
  at: number;
  label: string;
  detail?: string;
  tone: StatusTone;
  actor?: string;
}

export interface Shipment {
  id: string;
  tracking: string;
  recipient: string;
  company?: string;
  city: string;
  postcode: string;
  service: ServiceLevel;
  status: ShipmentStatus;
  driverId: string | null;
  zone: string;
  /** The promise. Everything in the console is measured against this. */
  slaDueAt: number;
  eta: number | null;
  /** Actual completion time; null until delivered. Drives on-time rate. */
  deliveredAt: number | null;
  attempts: number;
  pieces: number;
  weightKg: number;
  exception: ExceptionReason | null;
  updatedAt: number;
  timeline: TimelineEvent[];
}

/** A shipment with its SLA position resolved against the current clock. */
export interface RankedShipment extends Shipment {
  sla: SlaState;
  /** Minutes until the promise is broken. Negative means already broken. */
  minutesToSla: number;
  /** Higher sorts first. Drives the default "worst first" ordering. */
  urgency: number;
}
