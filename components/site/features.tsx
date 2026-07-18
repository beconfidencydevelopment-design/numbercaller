"use client";

import Image from "next/image";
import {
  LayoutGrid,
  Megaphone,
  MonitorPlay,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedText } from "@/components/motion/animated-text";
import { QueueTable } from "@/components/site/queue-table";
import { queueTables } from "@/lib/data";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const chips: { icon: LucideIcon; label: string; active?: boolean }[] = [
  { icon: PhoneCall, label: "Four Calling Modes", active: true },
  { icon: MonitorPlay, label: "Live Display" },
  { icon: LayoutGrid, label: "Stunning Visuals" },
  { icon: Megaphone, label: "Voice Announcements" },
];

/* Elbow connectors between the queue tables, geometry from the Figma vectors.
   Paths draw in sequence once the composition scrolls into view. */
function Connectors() {
  const reduceMotion = useReducedMotion();
  const paths = [
    "M342 247.5 H 380 Q 386 247.5 386 241.5 V 153 Q 386 147 392 147 H 422",
    "M642 147 H 752 Q 758 147 758 153 V 305",
    "M868 410 H 973 Q 979 410 979 404 V 245",
  ];
  const dots: [number, number, number][] = [
    // [cx, cy, drawIndex] — endpoints pop as their path finishes
    [342, 247.5, 0],
    [422, 147, 0],
    [642, 147, 1],
    [758, 305, 1],
    [868, 410, 2],
    [979, 245, 2],
  ];
  return (
    <motion.svg
      viewBox="0 0 1202 565"
      fill="none"
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-120px" }}
    >
      {paths.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="#5436fd"
          strokeWidth="1.5"
          variants={{
            hidden: { pathLength: reduceMotion ? 1 : 0 },
            visible: {
              pathLength: 1,
              transition: { duration: 0.8, ease: "easeInOut", delay: 0.5 + i * 0.35 },
            },
          }}
        />
      ))}
      {dots.map(([cx, cy, drawIndex]) => (
        <motion.circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="4"
          fill="#fafafa"
          stroke="#5436fd"
          strokeWidth="1.5"
          variants={{
            hidden: { scale: reduceMotion ? 1 : 0, opacity: reduceMotion ? 1 : 0 },
            visible: {
              scale: 1,
              opacity: 1,
              transition: { duration: 0.3, ease: EASE, delay: 0.5 + drawIndex * 0.35 },
            },
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
    </motion.svg>
  );
}

function PopIn({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="bg-background pb-20 pt-14 lg:pt-20">
      <AnimatedText
        as="h2"
        text="Everything You Need to Manage Queues Efficiently"
        className="mx-auto max-w-[950px] px-4 text-center font-display text-[32px] font-semibold text-ink sm:text-[44px] lg:text-[54px]"
      />

      {/* Desktop composition: tables over the photo, connected */}
      <div className="mx-auto mt-[60px] hidden w-[1202px] max-w-full lg:block">
        <div className="relative h-[565px]">
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-lg"
            initial={{ opacity: 0, scale: 0.985 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <Image
              src="/images/features-flowers-1.png"
              alt=""
              fill
              className="object-cover"
              sizes="1202px"
            />
          </motion.div>
          <Connectors />
          <PopIn delay={0.15} className="absolute left-[122px] top-[138px]">
            <QueueTable data={queueTables.sequential} />
          </PopIn>
          <PopIn delay={0.45} className="absolute left-[422px] top-[42px]">
            <QueueTable data={queueTables.queueStatus} />
          </PopIn>
          <PopIn delay={0.8} className="absolute left-[648px] top-[305px]">
            <QueueTable data={queueTables.priority} />
          </PopIn>
          <PopIn delay={1.15} className="absolute left-[869px] top-[35px]">
            <QueueTable data={queueTables.custom} />
          </PopIn>
        </div>
      </div>

      {/* Mobile composition: stacked tables */}
      <div className="mt-10 flex flex-col items-center gap-5 px-4 lg:hidden">
        <motion.div
          className="relative h-[220px] w-full overflow-hidden rounded-lg"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <Image
            src="/images/features-flowers-1.png"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
        <div className="grid w-full max-w-[480px] grid-cols-1 gap-5 sm:max-w-none sm:grid-cols-2">
          {Object.values(queueTables).map((table, i) => (
            <PopIn key={table.title} delay={i * 0.1}>
              <QueueTable data={table} className="w-full" />
            </PopIn>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 px-4">
        {chips.map((chip, i) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.2 + i * 0.09 }}
            className={cn(
              "flex items-center gap-2 rounded border p-2",
              chip.active
                ? "border-background bg-[#fbfaff] shadow-[var(--shadow-card)]"
                : "border-gray-02 bg-surface"
            )}
          >
            <chip.icon
              className={cn("size-6", chip.active ? "text-primary" : "text-gray-08")}
              strokeWidth={1.5}
            />
            <p
              className={cn(
                "text-sm font-medium leading-6",
                chip.active ? "text-primary" : "text-gray-08"
              )}
            >
              {chip.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
