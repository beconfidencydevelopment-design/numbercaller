"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { createElement, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AnimatedTextProps = {
  text: string;
  /** Element tag to render */
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  /** Delay before the first word starts, seconds */
  delay?: number;
  /** Animate immediately on mount instead of on scroll into view */
  immediate?: boolean;
};

/**
 * Auxia-style masked text reveal: each word slides up from a clipped wrapper
 * with a stagger. Word-level so it survives responsive re-wrapping.
 *
 * Robustness: the reveal is driven by a single `useInView` plus a controlled
 * `animate` prop (not per-word `whileInView`), and a fallback timer force-shows
 * the text. This guarantees the heading is never left invisible if the
 * intersection observer or the rAF-driven animation fails to fire (e.g. the tab
 * was backgrounded, or the element scrolled past very quickly).
 */
export function AnimatedText({
  text,
  as = "h2",
  className,
  delay = 0,
  immediate = false,
}: AnimatedTextProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [fallback, setFallback] = useState(false);

  // Safety net: reveal the text even if inView / the animation never fires.
  useEffect(() => {
    const t = setTimeout(() => setFallback(true), immediate ? 1500 : 4000);
    return () => clearTimeout(t);
  }, [immediate]);

  const words = text.split(" ");

  if (reduceMotion) {
    return createElement(as, { className, ref }, text);
  }

  const show = immediate || inView || fallback;
  // If we're only showing because of the fallback, skip the stagger delay so it
  // appears promptly instead of drifting in late.
  const usesFallbackOnly = fallback && !inView && !immediate;

  return createElement(
    as,
    {
      className: cn("!leading-[1.15]", className),
      ref,
      "aria-label": text,
    },
    words.map((word, i) => {
      const variants: Variants = {
        hidden: { y: "110%" },
        visible: {
          y: "0%",
          transition: {
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            delay: usesFallbackOnly ? 0 : delay + i * 0.06,
          },
        },
      };
      const isLast = i === words.length - 1;
      return (
        <span
          key={`${word}-${i}`}
          aria-hidden
          className="inline-block overflow-clip pb-[0.12em] -mb-[0.12em] align-bottom"
          // Word gap via margin (em-scaled to the font's space) so it can't be
          // trimmed by the overflow-clip mask, while still allowing wrapping.
          style={isLast ? undefined : { marginInlineEnd: "0.32em" }}
        >
          <motion.span
            className="inline-block will-change-transform"
            variants={variants}
            initial="hidden"
            animate={show ? "visible" : "hidden"}
          >
            {word}
          </motion.span>
        </span>
      );
    })
  );
}
