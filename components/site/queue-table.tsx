import { cn } from "@/lib/utils";
import type { QueueTableData } from "@/lib/data";

export function QueueTable({
  data,
  className,
}: {
  data: QueueTableData;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-[220px] overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-center justify-center bg-primary-02 p-2.5">
        <p className="text-xl leading-8 text-ink">{data.title}</p>
      </div>
      <div className="flex items-center px-6 py-0.5 text-sm leading-[26px] text-ink">
        <p className="flex-1">Ticket No</p>
        <p>Counter</p>
      </div>
      {data.rows.map((row, i) => (
        <div
          key={row.ticket}
          className={cn(
            "flex items-center border-gray-02 px-6 text-ink",
            i === 0 && "border-t",
            i < data.rows.length - 1 && "border-b"
          )}
        >
          <p className="flex-1 text-lg leading-8">{row.ticket}</p>
          <p className="text-sm leading-7">{row.counter}</p>
        </div>
      ))}
    </div>
  );
}
