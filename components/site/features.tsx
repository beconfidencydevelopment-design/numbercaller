"use client";

import Image from "next/image";
import {
  LayoutGrid,
  Megaphone,
  MonitorPlay,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { QueueTable } from "@/components/site/queue-table";
import { queueTables } from "@/lib/data";
import { cn } from "@/lib/utils";

const chips: { icon: LucideIcon; label: string; active?: boolean }[] = [
  { icon: PhoneCall, label: "Four Calling Modes", active: true },
  { icon: MonitorPlay, label: "Live Display" },
  { icon: LayoutGrid, label: "Stunning Visuals" },
  { icon: Megaphone, label: "Voice Announcements" },
];

/* Elbow connectors between the queue tables, geometry from the Figma vectors */
function Connectors() {
  return (
    <svg
      viewBox="0 0 1202 565"
      fill="none"
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden
    >
      <g stroke="#5436fd" strokeWidth="1.5">
        {/* Sequential -> Queue Status */}
        <path d="M342 247.5 H 380 Q 386 247.5 386 241.5 V 153 Q 386 147 392 147 H 422" />
        {/* Queue Status -> Priority */}
        <path d="M642 147 H 752 Q 758 147 758 153 V 305" />
        {/* Priority -> Custom */}
        <path d="M868 410 H 973 Q 979 410 979 404 V 245" />
      </g>
      <g fill="#fafafa" stroke="#5436fd" strokeWidth="1.5">
        <circle cx="342" cy="247.5" r="4" />
        <circle cx="422" cy="147" r="4" />
        <circle cx="642" cy="147" r="4" />
        <circle cx="758" cy="305" r="4" />
        <circle cx="868" cy="410" r="4" />
        <circle cx="979" cy="245" r="4" />
      </g>
    </svg>
  );
}

export function Features() {
  return (
    <section id="features" className="bg-background pb-20 pt-14 lg:pt-20">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-[950px] px-4 text-center font-display text-[32px] font-semibold leading-tight text-ink sm:text-[44px] lg:text-[54px] lg:leading-[64px]"
      >
        Everything You Need to Manage Queues Efficiently
      </motion.h2>

      {/* Desktop composition: tables over the photo, connected */}
      <div className="mx-auto mt-[60px] hidden w-[1202px] max-w-full lg:block">
        <div className="relative h-[565px]">
          <Image
            src="/images/features-flowers-1.png"
            alt=""
            fill
            className="rounded-lg object-cover"
            sizes="1202px"
          />
          <Connectors />
          <QueueTable data={queueTables.sequential} className="absolute left-[122px] top-[138px]" />
          <QueueTable data={queueTables.queueStatus} className="absolute left-[422px] top-[42px]" />
          <QueueTable data={queueTables.priority} className="absolute left-[648px] top-[305px]" />
          <QueueTable data={queueTables.custom} className="absolute left-[869px] top-[35px]" />
        </div>
      </div>

      {/* Mobile composition: stacked tables */}
      <div className="mt-10 flex flex-col items-center gap-5 px-4 lg:hidden">
        <div className="relative h-[220px] w-full overflow-hidden rounded-lg">
          <Image
            src="/images/features-flowers-1.png"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="grid w-full max-w-[480px] grid-cols-1 gap-5 sm:max-w-none sm:grid-cols-2">
          {Object.values(queueTables).map((table) => (
            <QueueTable key={table.title} data={table} className="w-full" />
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 px-4">
        {chips.map((chip) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
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
