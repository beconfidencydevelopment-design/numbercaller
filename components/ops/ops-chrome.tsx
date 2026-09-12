"use client";

import * as React from "react";
import { AppShell } from "./app-shell";
import { CommandPalette } from "./command-palette";

/** Owns the one piece of state shared across the whole console. */
export function OpsChrome({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <AppShell onOpenPalette={() => setPaletteOpen(true)}>{children}</AppShell>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </>
  );
}
