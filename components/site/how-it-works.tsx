"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnimatedText } from "@/components/motion/animated-text";
import { steps } from "@/lib/data";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const STEP_MS = 5000;

function NumberPadMockup() {
  const numbers = Array.from({ length: 18 }, (_, i) => i + 1);
  return (
    <div className="w-full rounded-lg bg-primary p-6 pb-0 sm:p-9 sm:pb-0">
      <div className="rounded-t-lg bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-08">
          <span>Token No :</span>
          <span className="rounded border border-gray-02 px-3 py-1 font-medium text-ink">
            10
          </span>
          <span className="ml-2">Counter :</span>
          <span className="flex items-center gap-2 rounded border border-gray-02 px-3 py-1 font-medium text-ink">
            Counter 03 <ChevronDown className="size-4" />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-6 gap-2 sm:gap-3">
          {numbers.map((n, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE, delay: 0.15 + i * 0.025 }}
              className={cn(
                "flex h-10 items-center justify-center rounded border text-sm sm:h-12 sm:text-base",
                n === 10
                  ? "border-primary bg-primary font-medium text-white"
                  : "border-gray-02 bg-gray-01 text-ink shadow-[0px_2px_4px_rgba(6,2,29,0.08)]"
              )}
            >
              {n}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const step = steps[active];

  const select = useCallback((i: number) => {
    setActive(i);
    setPaused(true);
  }, []);

  /* Auto-advance while the section is in view and the user hasn't taken over */
  useEffect(() => {
    if (paused || !inView || reduceMotion) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % steps.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, paused, inView, reduceMotion]);

  return (
    <section
      id="how-it-works"
      className="relative bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex flex-col lg:flex-row">
        {/* Step rail */}
        <div className="flex shrink-0 flex-row gap-6 overflow-x-auto px-4 py-6 lg:w-[147px] lg:flex-col lg:gap-9 lg:px-0 lg:pl-10 lg:pt-[298px]">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => select(i)}
              className={cn(
                "group relative whitespace-nowrap text-left font-display text-lg transition-colors",
                i === active
                  ? "font-semibold text-white"
                  : "font-normal text-gray-07 hover:text-gray-03"
              )}
            >
              Step {s.id}
              {/* Progress underline on the active step (auto-advance timer) */}
              <span className="absolute -bottom-2 left-0 hidden h-[2px] w-full overflow-hidden rounded-full bg-white/15 lg:block">
                {i === active && (
                  <motion.span
                    key={`${active}-${paused}-${inView}`}
                    className="block h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{
                      width: paused || !inView || reduceMotion ? "0%" : "100%",
                    }}
                    transition={{
                      duration: paused || !inView || reduceMotion ? 0 : STEP_MS / 1000,
                      ease: "linear",
                    }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Light panel */}
        <motion.div
          className="flex-1 rounded-tl-none bg-gray-02 px-4 py-10 lg:rounded-tl-lg lg:px-11 lg:py-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          onViewportEnter={() => setInView(true)}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <AnimatedText
              as="h2"
              text="Get Started in Minutes"
              className="max-w-[480px] font-display text-[36px] font-semibold text-gray-09 lg:text-[54px]"
            />
            <p className="max-w-[233px] text-sm leading-[22px] text-gray-08">
              No complicated setup. Launch your queue system and start calling
              numbers in just a few simple steps.
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ backgroundColor: step.cardColor }}
              className="mt-10 flex flex-col gap-8 rounded-lg p-6 lg:mt-14 lg:flex-row lg:items-stretch lg:justify-between lg:p-7"
            >
              <div className="flex flex-col justify-between gap-6 lg:max-w-[465px] lg:py-2">
                <motion.h3
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                  className="font-display text-2xl font-semibold text-ink"
                >
                  {step.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.18 }}
                  className="text-sm leading-[22px] text-gray-09"
                >
                  {step.body}
                </motion.p>
              </div>
              <div className="w-full lg:w-[396px] xl:w-[440px]">
                {step.image ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="relative aspect-[10/7] w-full overflow-hidden rounded-lg"
                  >
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 440px, 100vw"
                    />
                  </motion.div>
                ) : (
                  <NumberPadMockup />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
