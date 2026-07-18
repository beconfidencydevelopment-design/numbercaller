"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedText } from "@/components/motion/animated-text";
import { footerColumns } from "@/lib/data";

/** Turn contact strings into mailto:/tel: links; everything else stays a stub. */
function linkHref(link: string) {
  if (link.includes("@")) return `mailto:${link}`;
  if (/^[+\d][\d\s()-]{6,}$/.test(link)) return `tel:${link.replace(/\s/g, "")}`;
  return "#";
}

export function CtaFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#f7f7f8]">
      {/* Background treatment lifted from the Figma footer export: the interior
          photo fades INTO the section colour at the top (no seam with the FAQ
          above) and fades back to solid toward the bottom for the watermark. */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/images/footer-1.png"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        {/* top fade → #F6F6F7 (matches the section above, kills the seam) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #F6F6F7 0%, rgba(247,247,248,0) 16.72%)",
          }}
        />
        {/* bottom fade → solid #F7F7F8 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(247,247,248,0) 0%, #F7F7F8 76.59%)",
          }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-8 px-4 pt-16 text-center lg:gap-10 lg:pt-24">
        <div className="flex flex-col items-center gap-5">
          <AnimatedText
            as="h2"
            text="Give Your Customers a Better Waiting Experience"
            className="max-w-[820px] font-display text-[32px] font-semibold text-ink sm:text-[44px] lg:text-[54px]"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="max-w-[642px] text-base leading-6 text-gray-08"
          >
            Turn any TV, monitor, or projector into a live queue display with
            voice announcements. Ideal for restaurants, events, banks, clinics,
            and counters.
          </motion.p>
        </div>

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
                      href={linkHref(link)}
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

      {/* Giant watermark — SVG scales to fill the width so the full word is
          always visible; the bottom bleeds off the section edge like Figma */}
      <div
        className="pointer-events-none relative mt-10 select-none overflow-hidden px-4 lg:mt-14 lg:px-[60px]"
        aria-hidden
      >
        <svg viewBox="0 0 652 70" className="block w-full" role="presentation">
          <text
            x="326"
            y="78"
            textAnchor="middle"
            textLength="652"
            lengthAdjust="spacingAndGlyphs"
            fontSize="100"
            fontWeight="600"
            fill="#06021d"
            fillOpacity="0.06"
            style={{ fontFamily: "var(--font-josefin), sans-serif" }}
          >
            NumberCaller
          </text>
        </svg>
      </div>
    </footer>
  );
}
