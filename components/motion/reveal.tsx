"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Vertical travel in px */
  y?: number;
  /** Animate immediately on mount instead of on scroll into view */
  immediate?: boolean;
};

/** Standard scroll reveal: fade + rise with an expo-out ease. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  immediate = false,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const viewportProps = immediate
    ? { animate: { opacity: 1, y: 0 } }
    : {
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
      };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      {...viewportProps}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
