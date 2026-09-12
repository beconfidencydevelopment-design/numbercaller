/**
 * Skeleton for the console.
 *
 * Matched to the real page header and table rhythm — 10px gutters, 40px rows —
 * so nothing shifts when the data lands. A skeleton with the wrong row height
 * is worse than none: it guarantees a visible jump on every navigation.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex h-full flex-col">
      <div className="border-b border-ops-line bg-ops-surface">
        <div className="mx-auto flex max-w-[1480px] items-center gap-4 px-5 pb-3 pt-4">
          <div>
            <div className="h-5 w-44 animate-pulse rounded bg-ops-active" />
            <div className="mt-2 h-3 w-64 animate-pulse rounded bg-ops-active" />
          </div>
          <div className="ml-auto flex gap-1.5">
            <div className="h-8 w-20 animate-pulse rounded-[var(--ops-r-control)] bg-ops-active" />
            <div className="h-8 w-28 animate-pulse rounded-[var(--ops-r-control)] bg-ops-active" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1480px] px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ops-card h-[136px] animate-pulse" />
          ))}
        </div>
        <div className="ops-card mt-4 overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex h-10 items-center gap-3 border-b border-ops-line px-4 last:border-b-0">
              <div className="h-3 w-24 animate-pulse rounded bg-ops-active" />
              <div className="h-3 w-20 animate-pulse rounded bg-ops-active" />
              <div className="h-3 flex-1 animate-pulse rounded bg-ops-active" style={{ maxWidth: 240 }} />
              <div className="ml-auto h-3 w-16 animate-pulse rounded bg-ops-active" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
