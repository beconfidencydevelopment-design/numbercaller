"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnimatedText } from "@/components/motion/animated-text";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/* Queue simulation: ticket A-105 is being served at rest (per Figma), */
/* the table shows the Figma rows, and each cycle calls the next one.  */
/* ------------------------------------------------------------------ */

type Ticket = { ticket: string; counter: string };

const TICKETS: Ticket[] = [
  { ticket: "A-105", counter: "Counter 03" },
  { ticket: "A-104", counter: "Counter 02" },
  { ticket: "A-103", counter: "Counter 01" },
  { ticket: "B-207", counter: "Counter 05" },
  { ticket: "C-301", counter: "Counter 04" },
  { ticket: "A-106", counter: "Counter 01" },
  { ticket: "B-208", counter: "Counter 05" },
  { ticket: "C-302", counter: "Counter 02" },
];

const PHASES = ["token", "display", "announce"] as const;
type Phase = (typeof PHASES)[number];
/** Auxia-style cadence: activate → act → hold, ~7s per called ticket */
const PHASE_MS: Record<Phase, number> = {
  token: 1800,
  display: 2600,
  announce: 2600,
};

const at = (i: number) => TICKETS[((i % TICKETS.length) + TICKETS.length) % TICKETS.length];

function StatusChip({
  label,
  active,
  className,
}: {
  label: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        borderColor: active ? "var(--gray-02)" : "rgba(0,0,0,0)",
        backgroundColor: active ? "#ffffff" : "var(--surface)",
      }}
      transition={{ duration: 0.4 }}
      className={cn("flex items-center justify-center gap-3 rounded border p-4", className)}
    >
      <span className="relative flex size-2.5" aria-hidden>
        {active && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <motion.span
          className="relative size-2.5 rounded-full"
          animate={{ backgroundColor: active ? "var(--primary)" : "var(--gray-03)" }}
          transition={{ duration: 0.4 }}
        />
      </span>
      <motion.p
        animate={{ color: active ? "var(--ink)" : "var(--gray-08)" }}
        transition={{ duration: 0.4 }}
        className="text-base leading-6 whitespace-nowrap"
      >
        {label}
      </motion.p>
    </motion.div>
  );
}

/** Big ticket number with an Auxia-style masked roll on change. */
function RollingTicket({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "105%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-105%" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Queue Status table whose rows shift up as tickets get called. */
function LiveQueueTable({ rows, className }: { rows: Ticket[]; className?: string }) {
  return (
    <div
      className={cn(
        "w-[220px] overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-center justify-center bg-primary-02 p-2.5">
        <p className="text-xl leading-8 text-ink">Queue Status</p>
      </div>
      <div className="flex items-center px-6 py-0.5 text-sm leading-[26px] text-ink">
        <p className="flex-1">Ticket No</p>
        <p>Counter</p>
      </div>
      <div className="border-t border-gray-02">
        <AnimatePresence initial={false}>
          {rows.map((row, i) => (
            <motion.div
              key={row.ticket}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.45, ease: EASE }}
              className={cn(
                "flex items-center overflow-hidden px-6 text-ink",
                i < rows.length - 1 && "border-b border-gray-02"
              )}
            >
              <p className="flex-1 text-lg leading-8">{row.ticket}</p>
              <p className="text-sm leading-7">{row.counter}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Tiny equalizer shown while the announcement "plays". */
function VoiceBars({ active }: { active: boolean }) {
  return (
    <span className={cn("flex items-end gap-[3px] transition-opacity duration-300", active ? "opacity-100" : "opacity-0")} aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-white"
          animate={active ? { height: [5, 14, 7, 12, 5] } : { height: 5 }}
          transition={
            active
              ? { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }
              : { duration: 0.2 }
          }
        />
      ))}
    </span>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  /* servedIdx points at the ticket currently on the Now Serving display */
  const [servedIdx, setServedIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("token");
  const [running, setRunning] = useState(false);

  /* Start the loop once the entrance has settled */
  useEffect(() => {
    if (reduceMotion) return;
    const t = setTimeout(() => setRunning(true), 3000);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  /* Phase state machine: token → display (number rolls) → announce → next */
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      const next = PHASES[(PHASES.indexOf(phase) + 1) % PHASES.length];
      if (next === "display") setServedIdx((i) => i + 1);
      setPhase(next);
    }, PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [running, phase]);

  const serving = at(servedIdx);
  const queueRows = [1, 2, 3, 4].map((offset) => at(servedIdx + offset));
  const announcing = phase === "announce";

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Waiting-room photo pinned to the section bottom, fading up into the bg */}
      <div className="absolute inset-x-0 bottom-0 top-[47px]" aria-hidden>
        <Image
          src="/images/hero-waiting-room.png"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          preload
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background from-[47.5%] to-transparent" />
      </div>

      <div className="relative flex flex-col pb-0 pt-12 lg:pt-[70px]">
        <div className="flex flex-col items-center gap-8 px-4 text-center lg:gap-10">
          <div className="flex flex-col items-center gap-4 lg:gap-5">
            <AnimatedText
              as="h1"
              text="Call Numbers Smarter"
              immediate
              delay={0.1}
              className="font-display text-[44px] font-semibold text-ink sm:text-[64px] lg:text-[84px]"
            />
            <Reveal immediate delay={0.4} y={20}>
              <p className="max-w-[642px] text-base leading-6 text-gray-08">
                Turn any TV, monitor, or projector into a live queue display with
                voice announcements. Ideal for restaurants, events, banks,
                clinics, and counters.
              </p>
            </Reveal>
          </div>

          <Reveal
            immediate
            delay={0.55}
            y={20}
            className="flex w-full max-w-[398px] flex-col-reverse items-center gap-4 sm:w-auto sm:max-w-none sm:flex-row"
          >
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded border border-background bg-[#fbfaff] px-8 py-4 text-base font-medium leading-6 text-primary shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              <Play className="size-6 fill-primary text-primary" />
              Watch Demo
            </button>
            <button
              type="button"
              className="w-full rounded border border-[#fbfaff] bg-primary px-8 py-4 text-base font-medium leading-6 text-gray-01 shadow-[var(--shadow-btn-dark)] transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              Start Free Trial
            </button>
          </Reveal>
        </div>

        {/* Mobile / tablet flow strip — capped so it stays mobile-sized and
            centered instead of scattering across wider (tablet) viewports */}
        <div
          className="relative mx-auto mt-12 h-[90px] w-full max-w-[430px] overflow-hidden lg:hidden"
          aria-hidden
        >
          <Image
            src="/images/flow-line.svg"
            alt=""
            width={1440}
            height={74}
            className="absolute left-1/2 top-8 h-[74px] w-[1440px] max-w-none -translate-x-1/2"
          />
          <div className="absolute left-4 top-0 flex items-start gap-3 rounded bg-surface p-3">
            <span className="mt-1.5 size-2 rounded-full bg-gray-03" />
            <p className="max-w-[210px] text-sm leading-5 text-gray-08">
              Queue Created Display Connected Voice Enabled Ready to Call
            </p>
          </div>
          <span className="absolute left-[88px] top-[66px] flex size-7 items-center justify-center rounded bg-surface">
            <span className="size-2.5 rounded-full bg-gray-09" />
          </span>
          <div className="absolute left-[160px] top-[60px] flex items-center gap-2.5 rounded bg-surface px-3 py-2">
            <span className="size-2.5 rounded-full bg-primary" />
            <p className="text-sm text-ink">LIVE DISPLAY</p>
          </div>
          <span className="absolute right-[56px] top-[66px] flex size-7 items-center justify-center rounded bg-surface">
            <span className="size-2.5 rounded-full bg-gray-09" />
          </span>
        </div>

        {/* Flow line + status chips (desktop) */}
        <div className="relative mt-10 hidden h-[94px] w-full lg:block">
          {/* Inline flow line so the stroke can draw in like Auxia's DrawSVG */}
          <svg
            viewBox="0 0 1440 75"
            fill="none"
            preserveAspectRatio="none"
            className="absolute left-0 top-2.5 h-[74px] w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id="flow-grad" x1="0" y1="37.5" x2="1440" y2="37.5" gradientUnits="userSpaceOnUse">
                <stop offset="0.400709" stopColor="#5436FD" />
                <stop offset="0.544673" stopColor="#EEEBFF" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0 0.5H431.98C448.548 0.5 461.98 13.9315 461.98 30.5V44.5C461.98 61.0685 475.411 74.5 491.98 74.5H1440"
              stroke="url(#flow-grad)"
              strokeWidth="1"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: "easeInOut", delay: 0.7 }}
            />
          </svg>

          <Reveal immediate delay={1.0} y={14} className="absolute left-[157px] top-[-17px]">
            <div className="flex items-start gap-3 rounded bg-surface p-4">
              <span className="mt-[7px] size-2.5 rounded-full bg-gray-03" aria-hidden />
              <div className="text-base leading-6 text-gray-08">
                {["Queue Created", "Display Connected", "Voice Enabled", "Ready to Call"].map(
                  (line, i) => (
                    <motion.p
                      key={line}
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 1.2 + i * 0.25 }}
                    >
                      {line}
                    </motion.p>
                  )
                )}
              </div>
            </div>
          </Reveal>

          <Reveal immediate delay={1.3} y={14} className="absolute left-[576px] top-[56px]">
            <StatusChip label="TOKEN GENERATED" active={!running || phase === "token"} />
          </Reveal>
          <Reveal immediate delay={1.45} y={14} className="absolute left-[873px] top-[56px]">
            <StatusChip label="LIVE DISPLAY" active={running && phase === "display"} />
          </Reveal>
          <Reveal immediate delay={1.6} y={14} className="absolute left-[1128px] top-[56px]">
            <StatusChip label="VOICE ANNOUNCEMENT" active={running && phase === "announce"} />
          </Reveal>
        </div>

        {/* Queue UI cards */}
        <div className="mx-auto mt-10 flex w-full max-w-[1320px] flex-col items-center gap-5 px-4 pb-10 lg:mt-[45px] lg:flex-row lg:items-start lg:justify-end lg:px-0 lg:pb-[60px]">
          <Reveal immediate delay={1.5} y={24} className="hidden w-full max-w-[309px] lg:block">
            <div className="flex flex-col gap-2.5 rounded-lg bg-ink p-6 leading-6 text-gray-01">
              <p className="font-display text-lg font-medium">LIVE QUEUE MANAGEMENT</p>
              <p className="text-base">
                Trusted by Restaurants, Events &amp; Service Centers
              </p>
            </div>
          </Reveal>

          <Reveal immediate delay={1.65} y={24} className="w-full max-w-[430px] lg:max-w-[263px]">
            <motion.div
              animate={
                announcing && !reduceMotion
                  ? { scale: [1, 1.02, 1] }
                  : { scale: 1 }
              }
              transition={announcing ? { duration: 0.8, ease: "easeInOut" } : undefined}
              className="overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-col items-center gap-3.5 p-6">
                <p className="text-center text-xl leading-8 text-gray-08">Now Serving</p>
                <div className="flex w-full items-center justify-center border-y border-gray-02 px-2.5 py-3.5">
                  <RollingTicket
                    value={serving.ticket}
                    className="font-display text-[70px] font-semibold leading-none text-ink"
                  />
                </div>
                <RollingTicket
                  value={serving.counter}
                  className="w-full text-center text-xl leading-8 text-gray-01"
                />
              </div>
              <div className="relative flex items-center justify-center gap-3 bg-primary p-2.5">
                <p className="text-xl leading-8 text-gray-01">Please Keep your ticket</p>
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  <VoiceBars active={announcing && !reduceMotion} />
                </span>
              </div>
            </motion.div>
          </Reveal>

          <Reveal immediate delay={1.8} y={24} className="hidden w-full max-w-[220px] lg:block">
            <LiveQueueTable rows={queueRows} className="w-full" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
