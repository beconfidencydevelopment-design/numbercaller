"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarClock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const CALENDLY_URL = "https://calendly.com/iliasmiah000/product-designer";

declare global {
  interface Window {
    Calendly?: { initPopupWidget: (options: { url: string }) => void };
  }
}

let assetsLoaded: Promise<void> | null = null;

/** Lazy-load the Calendly popup assets the first time the button is used. */
function loadCalendly() {
  assetsLoaded ??= new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.append(link);

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.onload = () => resolve();
    script.onerror = () => {
      assetsLoaded = null;
      reject(new Error("Calendly failed to load"));
    };
    document.head.append(script);
  });
  return assetsLoaded;
}

/**
 * Floating "Book a Call" button fixed to the corner of every page. Opens the
 * Calendly booking popup; falls back to a new tab if the widget can't load.
 */
export function CalendlyButton() {
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setLoading(true);
    try {
      await loadCalendly();
      window.Calendly?.initPopupWidget({ url: CALENDLY_URL });
    } catch {
      window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={open}
      disabled={loading}
      aria-label="Book a call"
      initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full border border-[#fbfaff] bg-primary py-3 pl-5 pr-3 text-base font-medium text-gray-01 shadow-[var(--shadow-btn-dark)] disabled:opacity-70 md:bottom-8 md:right-8"
    >
      <CalendarClock className="size-5" strokeWidth={2} />
      Book a Call
      <span className="flex size-8 items-center justify-center rounded-full bg-gray-01/15">
        <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </motion.button>
  );
}
