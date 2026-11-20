import Link from "next/link";

import { KpiRow } from "@/components/overview/KpiRow";
import { TelemetryChart } from "@/components/overview/TelemetryChart";
import { PageHeader } from "@/components/shell/PageHeader";
import { Collapsible } from "@/components/ui/Collapsible";
import { Icon } from "@/components/ui/Icon";
import { AUDIT, PRIORITY_TIERS, WORKLOADS } from "@/lib/overview-data";

const TOTAL_IT = 245;
const DISPATCHABLE = PRIORITY_TIERS.filter((t) => t.dispatchable).reduce((s, t) => s + t.mw, 0);

const TONE: Record<string, string> = {
  warn: "var(--color-warn)",
  info: "var(--color-power)",
  ok: "var(--color-sage)",
  muted: "var(--color-ink-3)",
};

/** P0 is exempt, so it's hatched rather than filled: visibly "not dispatchable". */
const TIER_FILL: Record<string, string> = {
  P0: "repeating-linear-gradient(135deg, var(--color-ink-4) 0 2px, var(--color-surface-3) 2px 5px)",
  P1: "var(--color-accent)",
  P2: "var(--color-power)",
  P3: "var(--color-sage)",
};

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Grid & Cluster Overview"
        lede="Holding 246.8 MW under the 250 MW cap. Training state is preserved on all P1 runs."
        action={
          <Link href="/dispatch" className="btn btn-primary">
            <Icon name="bolt" weight={2} />
            <span>Simulate dispatch</span>
          </Link>
        }
      />

      <div className="flex flex-col gap-3">
        <section className="panel">
          <div className="panel-head justify-between">
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="panel-title">24-hour telemetry</h2>
              <p className="panel-sub">Power draw vs. grid reserve margin</p>
            </div>
            <ul className="text-ink-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
              <li className="flex items-center gap-1.5">
                <span className="bg-power h-0.5 w-3.5 rounded-full" /> Power draw (MW)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="bg-reserve h-0.5 w-3.5 rounded-full" /> Reserve margin (%)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="border-ink-3 w-3.5 border-t-2 border-dashed" /> Forecast
              </li>
              <li className="flex items-center gap-1.5">
                <span className="bg-reserve/20 h-2.5 w-3.5 rounded-[2px]" /> Curtailment window
              </li>
            </ul>
          </div>
          <div className="px-1.5 pb-1">
            <TelemetryChart />
          </div>
        </section>

        <KpiRow />

        <Collapsible
          title="Flexible load"
          summary={
            <>
              <span className="num text-ink-1 font-medium">{DISPATCHABLE.toFixed(1)} MW</span>{" "}
              dispatchable of {TOTAL_IT.toFixed(1)} MW · refreshed 0.4 s ago
            </>
          }
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="flex items-baseline gap-2">
              <span className="num text-[30px] leading-none font-medium tracking-tight">
                {DISPATCHABLE.toFixed(1)}
              </span>
              <span className="num text-ink-3 text-[13px]">MW dispatchable</span>
            </p>
            <p className="text-ink-3 text-[12px]">
              by job priority tier, of {TOTAL_IT.toFixed(1)} MW <span className="acr">IT</span> load
            </p>
          </div>

          {/* one stacked bar; 2px surface gaps between segments, exempt load hatched */}
          <div
            className="mt-4 flex h-2.5 gap-[2px] overflow-hidden rounded-[3px]"
            role="img"
            aria-label={PRIORITY_TIERS.map((t) => `${t.code} ${t.mw} MW`).join(", ")}
          >
            {PRIORITY_TIERS.map((t) => (
              <div
                key={t.code}
                className="h-full first:rounded-l-[3px] last:rounded-r-[3px]"
                style={{ flexGrow: t.mw, flexBasis: 0, background: TIER_FILL[t.code] }}
              />
            ))}
          </div>

          <ul className="divide-line mt-3 flex flex-col divide-y">
            {PRIORITY_TIERS.map((t) => (
              <li key={t.code} className="flex items-center gap-3 py-2.5 text-[13px]">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ background: TIER_FILL[t.code] }}
                />
                <span className="min-w-0 flex-1 truncate">
                  <span className="num">{t.code}</span> · {t.name}
                </span>
                <span className="text-ink-3 hidden text-[12px] sm:inline">{t.action}</span>
                <span className="num w-[68px] text-right font-medium">{t.mw.toFixed(1)} MW</span>
              </li>
            ))}
          </ul>
        </Collapsible>

        <Collapsible
          title="Active workloads"
          summary={
            <>
              <span className="num text-ink-1 font-medium">41</span> running · 2 capped · 1 migrated
              · 1 deferred
            </>
          }
        >
          <div className="text-ink-3 mb-3 flex items-center justify-between text-[12px]">
            <span>5 of 41 shown</span>
            <Link
              href="/dispatch"
              className="focus-ring text-accent hover:text-accent-hover rounded underline"
            >
              Open Dispatch Studio →
            </Link>
          </div>
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="text-ink-3 text-[10.5px] tracking-[0.08em] uppercase">
                <tr className="border-line border-b">
                  <th className="px-1 py-2 font-medium">Job</th>
                  <th className="px-1 py-2 font-medium">Class</th>
                  <th className="px-1 py-2 text-right font-medium">GPUs</th>
                  <th className="px-1 py-2 pl-4 font-medium">Last checkpoint</th>
                  <th className="px-1 py-2 font-medium">State</th>
                </tr>
              </thead>
              <tbody>
                {WORKLOADS.map((r) => (
                  <tr key={r.job} className="border-line border-b last:border-0">
                    <td className="num text-ink-1 px-1 py-3">{r.job}</td>
                    <td className="text-ink-2 px-1 py-3">{r.cls}</td>
                    <td className="num px-1 py-3 text-right">{r.gpus}</td>
                    <td className="num text-ink-2 px-1 py-3 pl-4">{r.ckpt}</td>
                    <td className="px-1 py-3">
                      <span className="flex items-center gap-2" style={{ color: TONE[r.tone] }}>
                        <span className="dot" />
                        {r.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Collapsible>

        <Collapsible
          title="Audit"
          summary={
            <span className="inline-flex items-center gap-1.5">
              Last event <span className="num text-ink-1">14:00:41</span> ·
              <span className="text-sage inline-flex items-center gap-1">
                <Icon name="shield" size={13} /> Chain verified
              </span>
            </span>
          }
        >
          <p className="text-ink-3 mb-3 text-[12px]">
            Signed entries, <span className="acr">IEEE</span> 1588 time-synced
          </p>
          <ol className="divide-line flex flex-col divide-y">
            {AUDIT.map((a) => (
              <li key={a.at} className="flex gap-3 py-2.5">
                <span className="dot mt-[7px]" style={{ color: TONE[a.tone] }} />
                <div className="min-w-0">
                  <p className="text-ink-1 text-[13px]">{a.what}</p>
                  <p className="num text-ink-3 mt-0.5 text-[11.5px]">
                    {a.at} · sha256 {a.hash}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Collapsible>
      </div>
    </>
  );
}
