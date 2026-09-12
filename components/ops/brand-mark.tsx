"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The SNK wordmark, from the client's own asset pack.
 *
 * Two files rather than one recoloured file: the mark is charcoal lettering
 * with an orange chevron on light, and white lettering with the same orange
 * chevron on dark. Swapping by theme keeps the chevron — the only part of the
 * identity carrying brand colour — correct in both.
 *
 * Rendered at the pack's own aspect ratio (2.9:1). Never tint it: the logo
 * orange is #f37124 and measures 2.92:1 against white, which is why the
 * interface accent is a separate token.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative block h-[22px] w-[64px] shrink-0", className)}>
      <Image
        src="/brand/snk-logo-light.png"
        alt="SNK Courier"
        fill
        sizes="64px"
        priority
        className="object-contain object-left dark:hidden"
      />
      <Image
        src="/brand/snk-logo-dark.png"
        alt=""
        aria-hidden
        fill
        sizes="64px"
        priority
        className="hidden object-contain object-left dark:block"
      />
    </span>
  );
}
