"use client";

import * as React from "react";

/**
 * Small external stores for UI preferences.
 *
 * These use `useSyncExternalStore` rather than `useState` + `useEffect`.
 * Reading localStorage or a DOM class inside an effect and then calling
 * setState causes a second render pass on every mount (and trips React's
 * compiler lint). `useSyncExternalStore` reads the real value at render time,
 * supplies a stable server snapshot, and keeps every subscriber in sync.
 */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribeStorage(cb: () => void) {
  listeners.add(cb);
  // Keep tabs consistent: a dispatcher often has the console open twice.
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Boolean preference persisted to localStorage, safe in private mode. */
export function usePersistedFlag(key: string): [boolean, (value: boolean) => void] {
  const value = React.useSyncExternalStore(
    subscribeStorage,
    () => {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );

  const set = React.useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        /* private mode — the preference just won't persist */
      }
      emit();
    },
    [key],
  );

  return [value, set];
}

function subscribeTheme(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/**
 * Theme reads the live `dark` class rather than a mirrored copy, so it stays
 * correct no matter who toggles it (the pre-hydration script, this hook, or a
 * future OS-preference listener).
 */
export function useTheme(): { dark: boolean; toggle: () => void } {
  const dark = React.useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  const toggle = React.useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("snk-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, []);

  return { dark, toggle };
}
