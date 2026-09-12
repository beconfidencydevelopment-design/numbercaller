export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-ops-line bg-ops-surface px-4 py-2.5">
      <div className="min-w-0">
        <h1 className="text-[15px] font-semibold leading-5 text-ops-text">{title}</h1>
        {subtitle && <p className="truncate text-[11px] text-ops-text-tertiary">{subtitle}</p>}
      </div>
      {actions && <div className="ml-auto flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}
