import { CarbonMap } from "@/components/forecast/CarbonMap";
import { CongestionHeatMap } from "@/components/forecast/CongestionHeatMap";
import { OutlookChart } from "@/components/forecast/OutlookChart";
import { RegressionChart } from "@/components/forecast/RegressionChart";
import { ShiftList } from "@/components/forecast/ShiftList";
import { PageHeader } from "@/components/shell/PageHeader";
import { loadTelemetry } from "@/lib/telemetry.server";

export default function ForecastPage() {
  const rows = loadTelemetry();
  return (
    <>
      <PageHeader
        title="Predictive Forecast & Carbon-Aware Dispatch"
        lede="Plan around tomorrow’s stress before the utility has to ask."
      />
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="panel min-w-0">
            <div className="panel-head justify-between">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <h2 className="panel-title">Predictive 48-hour outlook</h2>
                <p className="panel-sub">Georgia Power zone · day-ahead + model ensemble</p>
              </div>
              <span className="pill text-sage">
                <span className="dot" /> Confidence 0.82
              </span>
            </div>
            <div className="px-1.5">
              <OutlookChart rows={rows} />
            </div>
            <ul className="text-ink-3 mt-2 flex flex-wrap gap-x-5 gap-y-1 px-1.5 pb-1 text-[12px]">
              <li className="flex items-center gap-1.5">
                <span className="bg-power h-0.5 w-3.5 rounded-full" />{" "}
                <span className="acr">LMP</span> ($/MWh)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="bg-reserve h-0.5 w-3.5 rounded-full" /> Carbon intensity (gCO₂/kWh)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="bg-ok/25 h-2.5 w-3.5 rounded-[2px]" /> Recommended run window
              </li>
              <li className="flex items-center gap-1.5">
                <span className="bg-crit/35 h-2.5 w-3.5 rounded-[2px]" /> Likely dispatch
              </li>
            </ul>
          </section>
          <ShiftList />
        </div>

        <CongestionHeatMap rows={rows} />
        <RegressionChart rows={rows} />
        <CarbonMap />
      </div>
    </>
  );
}
