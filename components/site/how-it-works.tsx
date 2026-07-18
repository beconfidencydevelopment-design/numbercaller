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

function NumberPadMockup({
  count,
  cols,
  highlight,
}: {
  count: number;
  cols: number;
  highlight: number;
}) {
  const numbers = Array.from({ length: count }, (_, i) => i + 1);
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
        <div
          className="mt-4 grid gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {numbers.map((n) => (
            <div
              key={n}
              className={cn(
                "flex h-10 items-center justify-center rounded border text-sm sm:h-12 sm:text-base",
                n === highlight
                  ? "border-primary bg-primary font-medium text-white"
                  : "border-gray-02 bg-gray-01 text-ink shadow-[0px_2px_4px_rgba(6,2,29,0.08)]"
              )}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Shared card body (title, copy, and the image or number-pad visual). */
function StepBody({
  step,
  padVariant,
}: {
  step: (typeof steps)[number];
  padVariant: "desktop" | "mobile";
}) {
  return (
    <>
      <div className="flex flex-col justify-between gap-6 lg:max-w-[465px] lg:py-2">
        <h3 className="font-display text-2xl font-semibold text-ink">{step.title}</h3>
        <p className="text-sm leading-[22px] text-gray-09">{step.body}</p>
      </div>
      <div className="w-full lg:w-[396px] xl:w-[440px]">
        {step.image ? (
          <div className="relative aspect-[10/7] w-full overflow-hidden rounded-lg">
            <Image
              src={step.image}
              alt={step.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 440px, 100vw"
            />
          </div>
        ) : padVariant === "mobile" ? (
          <NumberPadMockup count={20} cols={5} highlight={9} />
        ) : (
          <NumberPadMockup count={18} cols={6} highlight={10} />
        )}
      </div>
    </>
  );
}

export function HowItWorks() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const step = steps[active];

  const select = useCallback((i: number) => {
    setActive(i);
    setPaused(true);
  }, []);

  /* Auto-advance while in view and the user hasn't taken over */
  useEffect(() => {
    if (paused || !inView || reduceMotion) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % steps.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, paused, inView, reduceMotion]);

  /* Keep the mobile carousel aligned to the active step */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.children[active] as HTMLElement | undefined;
    if (card) {
      scroller.scrollTo({
        left: card.offsetLeft - scroller.offsetLeft,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  }, [active, reduceMotion]);

  return (
    <section
      id="how-it-works"
      className="relative bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      {/* ---------- Desktop / tablet: vertical rail + swapping card ---------- */}
      <div className="hidden lg:flex lg:flex-row">
        <div className="flex w-[147px] shrink-0 flex-col gap-9 pl-10 pt-[298px]">
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
              <span className="absolute -bottom-2 left-0 block h-[2px] w-full overflow-hidden rounded-full bg-white/15">
                {i === active && (
                  <motion.span
                    key={`${active}-${paused}-${inView}`}
                    className="block h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: paused || !inView || reduceMotion ? "0%" : "100%" }}
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

        <motion.div
          className="flex-1 rounded-tl-lg bg-gray-02 px-11 py-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          onViewportEnter={() => setInView(true)}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-row items-start justify-between gap-6">
            <AnimatedText
              as="h2"
              text="Get Started in Minutes"
              className="max-w-[480px] font-display text-[54px] font-semibold text-gray-09"
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
              className="mt-14 flex flex-row items-stretch justify-between gap-8 rounded-lg p-7"
            >
              <StepBody step={step} padVariant="desktop" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ---------- Mobile: heading + rail + peek carousel in the panel ---------- */}
      <motion.div
        className="mt-3 rounded-t-lg bg-gray-02 px-4 py-10 lg:hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        onViewportEnter={() => setInView(true)}
        transition={{ duration: 0.6 }}
      >
        <AnimatedText
          as="h2"
          text="Get Started in Minutes"
          className="font-display text-[36px] font-semibold text-gray-09"
        />
        <p className="mt-4 max-w-[340px] text-sm leading-[22px] text-gray-08">
          No complicated setup. Launch your queue system and start calling
          numbers in just a few simple steps.
        </p>

        {/* Horizontal step rail */}
        <div className="mt-8 flex gap-6 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => select(i)}
              className={cn(
                "whitespace-nowrap font-display text-lg transition-colors",
                i === active ? "font-semibold text-primary" : "font-normal text-gray-07"
              )}
            >
              Step {s.id}
            </button>
          ))}
        </div>

        {/* Peek carousel */}
        <div
          ref={scrollerRef}
          className="mt-6 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {steps.map((s) => (
            <div
              key={s.id}
              style={{ backgroundColor: s.cardColor }}
              className="flex w-[85%] shrink-0 snap-start flex-col gap-8 rounded-lg p-6"
            >
              <StepBody step={s} padVariant="mobile" />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
