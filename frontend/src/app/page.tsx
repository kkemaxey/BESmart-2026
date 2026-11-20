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
  warn: "text-warn",
  info: "text-power",
  ok: "text-sage",
  muted: "text-ink-3",
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
          <p className="text-ink-3 mb-3 text-[13px]">
            <span className="num text-ink-1">{DISPATCHABLE.toFixed(1)} MW</span> dispatchable by job
            priority tier, of {TOTAL_IT.toFixed(1)} MW <span className="acr">IT</span> load
          </p>
          <ul className="flex flex-col gap-2.5">
            {PRIORITY_TIERS.map((t) => (
              <li
                key={t.code}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[260px_minmax(0,1fr)_72px]"
              >
                <p className="truncate text-[13px]">
                  <span className="num text-ink-3">{t.code}</span> · {t.name}
                  <span className="text-ink-3 ml-2 text-[12px]">{t.action}</span>
                </p>
                <div className="bg-surface-3 order-last col-span-2 h-2 overflow-hidden rounded-full sm:order-none sm:col-span-1">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(t.mw / TOTAL_IT) * 100}%`,
                      background: t.dispatchable ? "var(--color-accent)" : "var(--color-ink-4)",
                    }}
                  />
                </div>
                <p className="num text-right text-[13px]">{t.mw.toFixed(1)} MW</p>
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
          <div className="text-ink-3 mb-2 flex items-center justify-between text-[12px]">
            <span>5 of 41 shown</span>
            <Link
              href="/dispatch"
              className="focus-ring text-ink-2 hover:text-ink-1 rounded underline"
            >
              Open Dispatch Studio →
            </Link>
          </div>
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="text-ink-3 text-[11px] tracking-wide uppercase">
                <tr className="border-line border-b">
                  <th className="px-1 py-2 font-medium">Job</th>
                  <th className="px-1 py-2 font-medium">Class</th>
                  <th className="px-1 py-2 text-right font-medium">GPUs</th>
                  <th className="px-1 py-2 text-right font-medium">Last checkpoint</th>
                  <th className="px-1 py-2 pl-6 font-medium">State</th>
                </tr>
              </thead>
              <tbody>
                {WORKLOADS.map((r) => (
                  <tr key={r.job} className="border-line border-b last:border-0">
                    <td className="num text-ink-1 px-1 py-2.5">{r.job}</td>
                    <td className="text-ink-2 px-1 py-2.5">{r.cls}</td>
                    <td className="num px-1 py-2.5 text-right">{r.gpus}</td>
                    <td className="num text-ink-2 px-1 py-2.5 text-right">{r.ckpt}</td>
                    <td className={`px-1 py-2.5 pl-6 ${TONE[r.tone]}`}>{r.state}</td>
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
          <ol className="flex flex-col">
            {AUDIT.map((a) => (
              <li
                key={a.at}
                className="border-line flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2.5 last:border-0"
              >
                <span className="text-ink-1 text-[13px]">{a.what}</span>
                <span className="num text-ink-3 text-[11.5px]">
                  {a.at} · sha256 {a.hash}
                </span>
              </li>
            ))}
          </ol>
        </Collapsible>
      </div>
    </>
  );
}
