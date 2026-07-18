"use client";

import Image from "next/image";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";
import { testimonials } from "@/lib/data";

function TestimonialCard({
  quote,
  author,
  delay,
}: {
  quote: string;
  author: string;
  delay: number;
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className="flex h-full flex-col gap-10 rounded-lg bg-white py-6 pl-6 pr-8 lg:h-[296px]"
    >
      <span className="flex w-fit items-center rounded-lg bg-gray-08 p-2.5">
        <Quote className="size-6 rotate-180 fill-white text-white" aria-hidden />
      </span>
      <div className="flex flex-1 flex-col justify-between gap-6">
        <blockquote className="text-base leading-[30px] text-gray-08">
          {quote}
        </blockquote>
        <figcaption className="text-base font-medium leading-6 text-ink">
          {author}
        </figcaption>
      </div>
    </motion.figure>
  );
}

export function Testimonials() {
  return (
    <section className="bg-background px-4 py-14 sm:px-8 lg:px-[60px] lg:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto mb-10 max-w-[950px] text-center font-display text-[32px] font-semibold leading-tight text-ink sm:text-[44px] lg:mb-16 lg:text-[54px]"
      >
        Loved by Businesses Worldwide
      </motion.h2>

      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-5">
          <TestimonialCard quote={testimonials[0].quote} author={testimonials[0].author} delay={0} />
          <TestimonialCard quote={testimonials[1].quote} author={testimonials[1].author} delay={0.1} />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative order-first min-h-[320px] overflow-hidden rounded-lg md:order-none md:col-span-2 lg:col-span-1 lg:h-[612px]"
        >
          <Image
            src="/images/testimonial-1.jpg"
            alt="Business owner using NumberCaller on a laptop"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 426px, 100vw"
          />
        </motion.div>
        <div className="flex flex-col gap-5">
          <TestimonialCard quote={testimonials[2].quote} author={testimonials[2].author} delay={0.05} />
          <TestimonialCard quote={testimonials[3].quote} author={testimonials[3].author} delay={0.15} />
        </div>
      </div>
    </section>
  );
}
