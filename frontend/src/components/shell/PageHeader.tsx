import type { ReactNode } from "react";

/** Snapshot time for the simulated control-room scenario (matches the design). */
export const SNAPSHOT_UTC = "14:06:32";

export function PageHeader({
  title,
  lede,
  action,
}: {
  title: string;
  lede: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pt-8 pb-5 sm:pt-10">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="headline">{title}</h1>
          <p className="num text-ink-3 text-[13px]">
            ATL-07 campus · {SNAPSHOT_UTC} <span className="acr">UTC</span>
          </p>
        </div>
        <p className="text-ink-2 mt-2 text-sm">{lede}</p>
      </div>
      {action}
    </header>
  );
}
