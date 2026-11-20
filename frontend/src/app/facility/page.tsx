import { JunctionHeatmap } from "@/components/facility/JunctionHeatmap";
import { PageHeader } from "@/components/shell/PageHeader";
import { Icon } from "@/components/ui/Icon";
import {
  ALERTS,
  BUSWAYS,
  BUSWAY_RATING,
  BUSWAY_WATCH,
  CDUS,
  DT_LIMIT,
  cduStatus,
} from "@/lib/facility-data";

const STATUS = {
  nominal: { label: "Nominal", color: "var(--color-sage)", ring: "var(--color-line)" },
  watch: {
    label: "Watch",
    color: "var(--color-warn)",
    ring: "color-mix(in oklch, var(--color-warn) 45%, transparent)",
  },
  over: {
    label: "Over limit",
    color: "var(--color-crit-ink)",
    ring: "color-mix(in oklch, var(--color-crit) 55%, transparent)",
  },
};

export default function FacilityPage() {
  const critical = ALERTS.filter((a) => a.sev === "crit").length;
  return (
    <>
      <PageHeader
        title="Facility-to-Silicon Telemetry Bridge"
        lede="Loop B is running hot. Software throttling is holding it below hardware trip points."
      />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="panel min-w-0">
          <div className="panel-head justify-between">
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="panel-title">Coolant distribution units</h2>
              <p className="panel-sub">Secondary loop ΔT · limit {DT_LIMIT.toFixed(1)} °C</p>
            </div>
            <span className="pill">
              <span className="dot live-dot text-ink-3" /> Modbus TCP · 1 s
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 2xl:grid-cols-6">
            {CDUS.map((c) => {
              const s = STATUS[cduStatus(c.dt)];
              const pct = Math.min(1, c.dt / 14);
              return (
                <li key={c.id} className="inner p-3" style={{ borderColor: s.ring }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="num text-[13px] font-semibold">{c.id}</p>
                    <p
                      className="flex items-center gap-1.5 text-[11.5px]"
                      style={{ color: s.color }}
                    >
                      <span className="dot" /> {s.label}
                    </p>
                  </div>
                  <p className="mt-2.5 flex items-baseline gap-1.5">
                    <span className="num text-[26px] leading-none font-medium tracking-tight">
                      {c.dt.toFixed(1)}
                    </span>
                    <span className="num text-ink-3 text-[12px]">°C ΔT</span>
                  </p>
                  <div className="bg-surface-4 relative mt-3 h-1.5 rounded-full" aria-hidden="true">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct * 100}%`, background: s.color }}
                    />
                    <span
                      className="bg-ink-1 absolute -top-1 h-3.5 w-0.5 rounded-full"
                      style={{ left: `${(DT_LIMIT / 14) * 100}%` }}
                    />
                  </div>
                  <div className="num text-ink-3 mt-2 flex justify-between text-[11px]">
                    <span>{c.flow} L/min</span>
                    <span>pump {c.pump}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Electrical busways</h2>
            <p className="panel-sub">
              <span className="acr">BACnet</span> · 480 V
            </p>
          </div>
          <ul className="divide-line flex flex-col divide-y px-1.5">
            {BUSWAYS.map((b) => {
              const k = b.amps / BUSWAY_RATING;
              const color =
                k >= 0.9
                  ? "var(--color-crit-ink)"
                  : k >= BUSWAY_WATCH
                    ? "var(--color-warn)"
                    : "var(--color-sage)";
              return (
                <li key={b.id} className="py-3">
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span>{b.id}</span>
                    <span className="num text-ink-3 text-[12.5px]">
                      <span style={{ color: k >= BUSWAY_WATCH ? color : "var(--color-ink-1)" }}>
                        {b.amps.toLocaleString("en-US")} A
                      </span>{" "}
                      / {BUSWAY_RATING.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="bg-surface-4 relative mt-2 h-1.5 rounded-full" aria-hidden="true">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${k * 100}%`, background: color }}
                    />
                    <span
                      className="bg-ink-2/70 absolute -top-1 h-3.5 w-0.5 rounded-full"
                      style={{ left: `${BUSWAY_WATCH * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="inner mt-2 p-3">
            <p className="eyebrow">Ramp-rate guard</p>
            <p className="text-ink-2 mt-1.5 text-[13px] leading-relaxed">
              Step changes limited to <span className="num text-ink-1">±8 MW / 10 s</span> to
              protect switchgear and <span className="acr">UPS</span> strings.
            </p>
          </div>
        </section>

        <section className="panel min-w-0">
          <div className="panel-head justify-between">
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="panel-title">GPU junction temperature</h2>
              <p className="panel-sub">Hall 2 · 240 nodes · 1,920 GPUs</p>
            </div>
            <span className="pill">
              <span className="dot text-ink-3" /> NVML · DCGM
            </span>
          </div>
          <div className="px-1.5 pb-1">
            <JunctionHeatmap />
          </div>
        </section>

        <section className="panel self-start">
          <div className="panel-head justify-between">
            <h2 className="panel-title">Threshold alerts</h2>
            <span className="pill border-crit/50 bg-crit/15 text-crit-ink">
              <span className="dot" /> {critical} critical
            </span>
          </div>
          <ol className="divide-line flex flex-col divide-y px-1.5">
            {ALERTS.map((a) => (
              <li key={a.at} className="flex gap-3 py-3">
                <Icon
                  name="alert"
                  size={15}
                  className="mt-0.5 shrink-0"
                  style={{
                    color: a.sev === "crit" ? "var(--color-crit-ink)" : "var(--color-warn)",
                  }}
                  aria-label={a.sev === "crit" ? "Critical" : "Warning"}
                  aria-hidden={false}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13.5px] font-semibold">{a.title}</p>
                    <span className="num text-ink-3 shrink-0 text-[11.5px]">{a.at}</span>
                  </div>
                  <p className="text-ink-3 mt-0.5 text-[12.5px]">{a.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
