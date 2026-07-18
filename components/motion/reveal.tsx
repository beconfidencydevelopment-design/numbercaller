"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Vertical travel in px */
  y?: number;
  /** Animate immediately on mount instead of on scroll into view */
  immediate?: boolean;
};

/**
 * Standard scroll reveal: fade + rise with an expo-out ease.
 *
 * Driven by useInView + a controlled animate + a fallback timer so content is
 * never left invisible if the intersection/animation fails to fire.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  immediate = false,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFallback(true), immediate ? 1500 : 4000);
    return () => clearTimeout(t);
  }, [immediate]);

  if (reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const show = immediate || inView || fallback;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
