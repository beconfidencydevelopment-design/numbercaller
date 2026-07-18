"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserCircle, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { navLinks } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-30 w-full">
      <div className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-[60px] lg:py-8">
        <Link href="#" aria-label="NumberCaller home" className="shrink-0">
          <Image
            src="/images/logo-full.svg"
            alt="NumberCaller"
            width={226}
            height={40}
            className="h-8 w-auto lg:h-10"
            preload
          />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "flex items-center gap-2 text-base leading-6 transition-colors hover:text-primary",
                link.active ? "text-primary" : "text-gray-08"
              )}
            >
              {link.active && (
                <span className="size-2 rounded-full bg-primary" aria-hidden />
              )}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <button
            type="button"
            className="rounded border border-[#fbfaff] bg-ink px-4 py-[9px] text-sm font-medium leading-[22px] text-gray-01 shadow-[var(--shadow-btn-dark)] transition-transform hover:-translate-y-0.5"
          >
            Get Started
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded border border-background bg-[#fbfaff] px-4 py-2 text-sm font-medium leading-[22px] text-primary shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
          >
            <UserCircle className="size-6" strokeWidth={1.5} />
            Log In
          </button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-4 rounded-md bg-white px-4 py-2 shadow-[var(--shadow-card)] lg:hidden"
        >
          <UserCircle className="size-6 text-primary" strokeWidth={1.5} />
          {open ? (
            <X className="size-6 text-ink" />
          ) : (
            <Menu className="size-6 text-ink" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full overflow-hidden border-b border-gray-02 bg-[#fbfaff] shadow-[var(--shadow-card)] lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded px-3 py-2.5 text-base",
                    link.active ? "bg-primary-01 text-primary" : "text-gray-08"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded bg-ink px-4 py-2.5 text-sm font-medium text-gray-01"
                >
                  Get Started
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2 rounded border border-gray-02 bg-white px-4 py-2.5 text-sm font-medium text-primary"
                >
                  <UserCircle className="size-5" strokeWidth={1.5} />
                  Log In
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
