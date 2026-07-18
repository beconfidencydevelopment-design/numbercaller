"use client";

import Image from "next/image";
import {
  BadgeCheck,
  BookOpen,
  Store,
  Ticket,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCases } from "@/lib/data";

const icons: Record<string, LucideIcon> = {
  ticket: Ticket,
  restaurant: UtensilsCrossed,
  retail: Store,
  education: BookOpen,
};

export function UseCases() {
  return (
    <section id="solutions" className="bg-background px-4 py-14 sm:px-8 lg:px-[60px] lg:py-20">
      <div className="relative overflow-hidden rounded-lg">
        <div className="relative min-h-[420px] w-full lg:h-[580px]">
          <Image
            src="/images/usecase-airport-1.jpg"
            alt="Airport waiting area with departure displays"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 1320px, 100vw"
          />
          <div className="absolute inset-0 bg-white/45" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-x-4 bottom-4 top-auto flex flex-col gap-5 rounded-lg bg-white/85 p-6 backdrop-blur-sm sm:inset-x-8 lg:inset-auto lg:right-[54px] lg:top-[100px] lg:w-[440px] lg:bg-white/80 lg:p-9"
          >
            <h2 className="font-display text-[32px] font-semibold leading-tight text-ink lg:text-[48px]">
              Perfect for Every Waiting Line
            </h2>
            <p className="text-sm leading-6 text-gray-08">
              Whether you&apos;re serving customers, managing attendees, or
              organizing participants, NumberCaller keeps everyone informed.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <span className="flex items-center gap-2 text-sm font-medium text-primary">
                <BadgeCheck className="size-5 fill-primary text-white" />
                No Hardware Required
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-primary">
                <BadgeCheck className="size-5 fill-primary text-white" />
                Works on Any Screen
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {useCases.map((useCase, i) => {
          const Icon = icons[useCase.icon];
          return (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
              className="flex flex-col gap-6 rounded-lg border border-primary-02 bg-primary-01 p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary-02">
                <Icon className="size-6 text-primary" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-ink">{useCase.title}</h3>
                <p className="text-sm leading-[22px] text-gray-08">{useCase.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
