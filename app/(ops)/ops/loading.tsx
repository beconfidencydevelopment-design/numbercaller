/**
 * Skeleton for the console. Matches the real row height and column rhythm so
 * the layout does not shift when data lands — a shifting table is the most
 * common polish failure in generated dashboards.
 */
export default function Loading() {
  return (
    <div className="flex h-full flex-col" aria-busy="true" aria-label="Loading">
      <div className="h-[52px] shrink-0 border-b border-ops-line bg-ops-surface" />
      <div className="flex shrink-0 divide-x divide-ops-line border-b border-ops-line bg-ops-surface">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 px-3 py-2.5">
            <div className="h-2.5 w-16 animate-pulse rounded bg-ops-active" />
            <div className="mt-2 h-4 w-10 animate-pulse rounded bg-ops-active" />
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-hidden bg-ops-surface">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex h-9 items-center gap-3 border-b border-ops-line px-3">
            <div className="h-3 w-[76px] animate-pulse rounded bg-ops-active" />
            <div className="h-3 flex-1 animate-pulse rounded bg-ops-active" style={{ maxWidth: 220 }} />
            <div className="h-4 w-24 animate-pulse rounded-full bg-ops-active" />
            <div className="h-3 w-14 animate-pulse rounded bg-ops-active" />
          </div>
        ))}
      </div>
    </div>
  );
}
