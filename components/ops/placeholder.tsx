import { Construction } from "lucide-react";

/** Honest state for a screen that is scoped but not designed yet. */
export function Placeholder({ area }: { area: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="grid size-9 place-items-center rounded-full bg-ops-active text-ops-text-tertiary">
        <Construction className="size-4" />
      </div>
      <div className="text-[13px] font-medium text-ops-text">{area} is not in this pass</div>
      <p className="max-w-[320px] text-[12px] text-ops-text-secondary">
        Today, Shipments, Exceptions and Drivers carry the design system. This
        screen inherits it once its requirements are agreed.
      </p>
    </div>
  );
}
