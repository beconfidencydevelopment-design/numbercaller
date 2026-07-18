"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { footerColumns } from "@/lib/data";

export function CtaFooter() {
  return (
    <footer className="relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/images/footer-1.png"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/80" />
      </div>

      <div className="relative flex flex-col items-center gap-8 px-4 pt-16 text-center lg:gap-10 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-5"
        >
          <h2 className="max-w-[820px] font-display text-[32px] font-semibold leading-tight text-ink sm:text-[44px] lg:text-[54px]">
            Give Your Customers a Better Waiting Experience
          </h2>
          <p className="max-w-[642px] text-base leading-6 text-gray-08">
            Turn any TV, monitor, or projector into a live queue display with
            voice announcements. Ideal for restaurants, events, banks, clinics,
            and counters.
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
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
        </div>
      </div>

      <div className="relative mx-auto mt-16 flex max-w-[1320px] flex-col gap-10 px-4 lg:mt-24 lg:flex-row lg:items-start lg:justify-between lg:gap-0 lg:px-[60px]">
        <div className="flex flex-col items-start gap-4">
          <Image
            src="/images/logo-mark.svg"
            alt="NumberCaller logo"
            width={56}
            height={58}
            className="h-14 w-auto"
          />
          <p className="text-sm text-gray-07">
            © 2026 NumberCaller. All rights reserved.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:gap-[120px]">
          {footerColumns.map((column) => (
            <div key={column.title} className="flex flex-col gap-4 text-left">
              <p className="text-base font-semibold text-ink">{column.title}</p>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-gray-07 transition-colors hover:text-primary"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Giant watermark */}
      <div
        className="pointer-events-none relative mt-10 flex select-none justify-center overflow-hidden lg:mt-6"
        aria-hidden
      >
        <p className="-mb-[0.32em] whitespace-nowrap font-display text-[22vw] font-semibold leading-none text-ink/[0.04] lg:text-[218px]">
          NumberCaller
        </p>
      </div>
    </footer>
  );
}
