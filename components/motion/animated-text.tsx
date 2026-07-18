"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { createElement } from "react";
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
 * Auxia-style masked text reveal: each word sits in an overflow-clipped
 * wrapper and slides up from 110% with a stagger. Word-level (not line-level)
 * so it survives responsive re-wrapping. Animation props live on each word so
 * there's no reliance on a dynamically-created motion parent.
 */
export function AnimatedText({
  text,
  as = "h2",
  className,
  delay = 0,
  immediate = false,
}: AnimatedTextProps) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  if (reduceMotion) {
    return createElement(as, { className }, text);
  }

  return createElement(
    as,
    { className: cn("!leading-[1.15]", className), "aria-label": text },
    words.map((word, i) => {
      const variants: Variants = {
        hidden: { y: "110%" },
        visible: {
          y: "0%",
          transition: {
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            delay: delay + i * 0.06,
          },
        },
      };
      const motionProps = immediate
        ? { animate: "visible" as const }
        : {
            whileInView: "visible" as const,
            viewport: { once: true, margin: "-80px" },
          };
      return (
        <span
          key={`${word}-${i}`}
          aria-hidden
          className="inline-block overflow-clip pb-[0.12em] -mb-[0.12em] align-bottom"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial="hidden"
            variants={variants}
            {...motionProps}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      );
    })
  );
}
