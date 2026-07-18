"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { QueueTable } from "@/components/site/queue-table";
import { queueTables } from "@/lib/data";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

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
    <div
      className={cn(
        "flex items-center justify-center gap-3 rounded bg-surface p-4",
        active && "border border-background",
        className
      )}
    >
      <span
        className={cn(
          "size-2.5 rounded-full",
          active ? "bg-primary" : "bg-gray-03"
        )}
        aria-hidden
      />
      <p
        className={cn(
          "text-base leading-6 whitespace-nowrap",
          active ? "text-ink" : "text-gray-08"
        )}
      >
        {label}
      </p>
    </div>
  );
}

export function Hero() {
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
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 lg:gap-5"
          >
            <h1 className="font-display text-[44px] font-semibold leading-none text-ink sm:text-[64px] lg:text-[84px]">
              Call Numbers Smarter
            </h1>
            <p className="max-w-[642px] text-base leading-6 text-gray-08">
              Turn any TV, monitor, or projector into a live queue display with
              voice announcements. Ideal for restaurants, events, banks,
              clinics, and counters.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
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
          </motion.div>
        </div>

        {/* Mobile flow strip */}
        <div className="relative mt-12 h-[90px] w-full lg:hidden" aria-hidden>
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

        {/* Flow line + status chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative mt-10 hidden h-[94px] w-full lg:block"
        >
          <Image
            src="/images/flow-line.svg"
            alt=""
            width={1440}
            height={74}
            className="absolute left-0 top-2.5 h-[74px] w-full"
            aria-hidden
          />
          <div className="absolute left-[157px] top-[-17px] flex items-start gap-3 rounded bg-surface p-4">
            <span className="mt-[7px] size-2.5 rounded-full bg-gray-03" aria-hidden />
            <div className="text-base leading-6 text-gray-08">
              <p>Queue Created</p>
              <p>Display Connected</p>
              <p>Voice Enabled</p>
              <p>Ready to Call</p>
            </div>
          </div>
          <StatusChip label="TOKEN GENERATED" active className="absolute left-[576px] top-[56px]" />
          <StatusChip label="LIVE DISPLAY" className="absolute left-[873px] top-[56px]" />
          <StatusChip label="VOICE ANNOUNCEMENT" className="absolute left-[1128px] top-[56px]" />
        </motion.div>

        {/* Queue UI cards */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="mx-auto mt-10 flex w-full max-w-[1320px] flex-col items-center gap-5 px-4 pb-10 lg:mt-[45px] lg:flex-row lg:items-start lg:justify-end lg:px-0 lg:pb-[60px]"
        >
          <div className="hidden w-full max-w-[309px] flex-col gap-2.5 rounded-lg bg-ink p-6 leading-6 text-gray-01 lg:flex">
            <p className="font-display text-lg font-medium">
              LIVE QUEUE MANAGEMENT
            </p>
            <p className="text-base">
              Trusted by Restaurants, Events &amp; Service Centers
            </p>
          </div>

          <div className="w-full overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-card)] lg:max-w-[263px]">
            <div className="flex flex-col items-center gap-3.5 p-6">
              <p className="text-center text-xl leading-8 text-gray-08">
                Now Serving
              </p>
              <div className="flex w-full items-center justify-center border-y border-gray-02 px-2.5 py-3.5">
                <p className="font-display text-[70px] font-semibold leading-none text-ink">
                  A-105
                </p>
              </div>
              <p className="text-center text-xl leading-8 text-gray-01">
                Counter 03
              </p>
            </div>
            <div className="flex items-center justify-center bg-primary p-2.5">
              <p className="text-xl leading-8 text-gray-01">
                Please Keep your ticket
              </p>
            </div>
          </div>

          <QueueTable
            data={queueTables.queueStatus}
            className="hidden w-full max-w-[220px] lg:block"
          />
        </motion.div>
      </div>
    </section>
  );
}
