"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { faqCategories, faqs } from "@/lib/data";
import { cn } from "@/lib/utils";

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-6 text-left lg:gap-6"
      >
        <span
          className={cn(
            "flex-1 font-display text-lg leading-[30px] lg:text-2xl",
            open ? "text-gray-09" : "text-gray-08",
            open && "lg:max-w-[341px]"
          )}
        >
          {question}
        </span>
        <AnimatePresence initial={false} mode="popLayout">
          {open && (
            <motion.span
              key="answer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="hidden flex-1 overflow-hidden text-base font-normal leading-6 text-gray-08 lg:block"
            >
              {answer}
            </motion.span>
          )}
        </AnimatePresence>
        {open ? (
          <Minus className="size-6 shrink-0 text-gray-09" aria-hidden />
        ) : (
          <Plus className="size-6 shrink-0 text-gray-09" aria-hidden />
        )}
      </button>
      {/* Mobile: answer below the question */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer-mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden lg:hidden"
          >
            <p className="px-6 pb-6 text-base leading-6 text-gray-08">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-background px-4 py-14 sm:px-8 lg:px-[60px] lg:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto mb-10 text-center font-display text-[32px] font-semibold leading-tight text-gray-09 sm:text-[44px] lg:mb-16 lg:text-[54px]"
      >
        Frequently Asked Questions
      </motion.h2>

      <div className="mx-auto flex max-w-[1320px] flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <nav
          aria-label="FAQ categories"
          className="flex flex-row flex-wrap gap-4 lg:flex-col lg:gap-[27px]"
        >
          {faqCategories.map((category, i) => (
            <button
              key={category}
              type="button"
              className={cn(
                "text-left font-display text-lg lg:text-2xl",
                i === 0
                  ? "font-semibold text-gray-09"
                  : "font-normal text-gray-07 transition-colors hover:text-gray-09"
              )}
            >
              {category}
            </button>
          ))}
        </nav>

        <div className="flex w-full flex-col gap-5 lg:w-[933px]">
          {faqs.map((faq, i) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
