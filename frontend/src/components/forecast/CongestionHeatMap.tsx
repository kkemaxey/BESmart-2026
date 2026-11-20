"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import {
  TIERS,
  ZONE_AMPS,
  tierFromLabel,
  tierFromStress,
  zoneRow,
  type Row,
  type TierId,
  type ZoneId,
} from "@/lib/telemetry";

type Scope = "facility" | ZoneId;
const SCOPES: { value: Scope; label: string }[] = [
  { value: "facility", label: "Facility" },
  { value: "A", label: "Circuit A" },
  { value: "B", label: "Circuit B" },
  { value: "C", label: "Circuit C" },
  { value: "D", label: "Circuit D" },
];
const DAY_NAME = { 1: "Fri 20 Nov", 2: "Sat 21 Nov" } as const;
const INK_ON: Record<TierId, string> = {
  normal: "oklch(26% 0.04 155)",
  t1: "oklch(26% 0.05 80)",
  t2: "oklch(22% 0.05 48)",
  t3: "oklch(96% 0.02 22)",
};
const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;
const TOTAL_AMPS = Object.values(ZONE_AMPS).reduce((a, b) => a + b, 0);

export function CongestionHeatMap({ rows }: { rows: Row[] }) {
  const [scope, setScope] = useState<Scope>("facility");
  const [pinned, setPinned] = useState(14); // Fri 14:00, the "now" hour
  const [hover, setHover] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  const data = useMemo(
    () => (scope === "facility" ? rows : rows.map((r) => zoneRow(r, scope))),
    [rows, scope],
  );
  const active = data[hover ?? pinned];

  function focusCell(i: number) {
    setPinned(i);
    grid.current?.querySelector<HTMLButtonElement>(`[data-i="${i}"]`)?.focus();
  }
  function onKey(e: KeyboardEvent, i: number) {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 24,
      ArrowUp: -24,
    };
    if (e.key === "Home") return (e.preventDefault(), focusCell(i - (i % 24)));
    if (e.key === "End") return (e.preventDefault(), focusCell(i - (i % 24) + 23));
    const d = moves[e.key];
    if (d === undefined) return;
    e.preventDefault();
    const next = i + d;
    if (next >= 0 && next < data.length) focusCell(next);
  }

  return (
    <section className="panel">
      <div className="panel-head justify-between gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            <h2 className="panel-title">48-hour grid & thermal congestion</h2>
            <span className="pill h-5 text-[10.5px]">grid_stress_index</span>
          </div>
          <p className="text-ink-3 mt-1 max-w-[68ch] text-[13px]">
            A two-day radar for the grid. Each square is one hour: green means run at full speed,
            amber to red means afternoon heat or grid bottlenecks, and the software dials power back
            automatically.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <Segmented
            label="Heat map scope"
            size="sm"
            value={scope}
            onChange={setScope}
            options={SCOPES}
          />
          <p className="text-ink-3 text-[11px]">
            {scope === "facility"
              ? "Facility-wide metered data"
              : `Estimated · ${Math.round((ZONE_AMPS[scope] / TOTAL_AMPS) * 100)}% of load by busway current`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="min-w-0 px-1.5">
          <div className="overflow-x-auto pb-1 max-lg:[mask-image:linear-gradient(90deg,black_92%,transparent)]">
            <div className="min-w-[680px] max-lg:pr-6">
              <div
                ref={grid}
                role="grid"
                aria-label="Grid stress by hour, two days"
                className="grid grid-cols-[76px_repeat(24,minmax(0,1fr))] gap-[2px]"
                onPointerLeave={() => setHover(null)}
              >
                {([1, 2] as const).map((day) => (
                  <div key={day} role="row" className="contents">
                    <div role="rowheader" className="flex flex-col justify-center pr-2">
                      <span className="text-ink-1 text-[12px] font-medium">Day {day}</span>
                      <span className="num text-ink-3 text-[10.5px]">{DAY_NAME[day]}</span>
                    </div>
                    {data
                      .map((r, i) => ({ r, i }))
                      .filter(({ r }) => r.day === day)
                      .map(({ r, i }) => {
                        const tier = tierFromStress(r.stress);
                        const mismatch = scope === "facility" && tierFromLabel(r.csvTier) !== tier;
                        const selected = i === pinned;
                        return (
                          <button
                            key={i}
                            type="button"
                            role="gridcell"
                            data-i={i}
                            tabIndex={selected ? 0 : -1}
                            aria-selected={selected}
                            aria-label={`${DAY_NAME[r.day]} ${pad(r.hour)}: stress ${r.stress}, ${TIERS[tier].label}, ${r.shavedMw} MW shaved${mismatch ? ", CSV tier label differs" : ""}`}
                            onPointerEnter={() => setHover(i)}
                            onFocus={() => setHover(null)}
                            onClick={() => setPinned(i)}
                            onKeyDown={(e) => onKey(e, i)}
                            className="focus-ring relative h-12 rounded-[4px] transition-[filter,transform] duration-100 hover:brightness-110 active:scale-95"
                            style={{
                              background: TIERS[tier].color,
                              color: INK_ON[tier],
                              boxShadow: selected
                                ? "0 0 0 2px var(--color-surface-1), 0 0 0 4px var(--color-ink-1)"
                                : undefined,
                              zIndex: selected ? 1 : undefined,
                            }}
                          >
                            <span className="num text-[11px] font-semibold">{r.stress}</span>
                            {mismatch && (
                              <span
                                aria-hidden="true"
                                className="absolute top-0 right-0 size-0 border-t-[7px] border-l-[7px] border-t-[oklch(96%_0.02_85)] border-l-transparent"
                              />
                            )}
                          </button>
                        );
                      })}
                  </div>
                ))}
                <div />
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="num text-ink-4 pt-1.5 text-center text-[10px]">
                    {h % 3 === 0 ? pad(h) : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ul className="text-ink-2 mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
            {(Object.keys(TIERS) as TierId[]).map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="size-3 rounded-[3px]" style={{ background: TIERS[t].color }} />
                <span>
                  {TIERS[t].label} <span className="num text-ink-3">{TIERS[t].range}</span>
                </span>
              </li>
            ))}
            {scope === "facility" && (
              <li className="text-ink-3 flex items-center gap-2">
                <span className="bg-surface-4 relative size-3 rounded-[3px]">
                  <span className="absolute top-0 right-0 size-0 border-t-[6px] border-l-[6px] border-t-[oklch(96%_0.02_85)] border-l-transparent" />
                </span>
                CSV tier label differs
              </li>
            )}
          </ul>
        </div>

        <Inspector row={active} pinned={hover === null} scope={scope} />
      </div>
    </section>
  );
}

function Inspector({ row, pinned, scope }: { row: Row; pinned: boolean; scope: Scope }) {
  const tier = tierFromStress(row.stress);
  const csv = tierFromLabel(row.csvTier);
  const mismatch = scope === "facility" && csv !== tier;
  return (
    <aside className="inner p-3.5" aria-live="polite">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <div className="flex items-center justify-between">
            <p className="num text-ink-1 text-[13px] font-medium">
              {DAY_NAME[row.day]} · {pad(row.hour)}
            </p>
            <span className="text-ink-3 text-[11px]">{pinned ? "Pinned" : "Previewing"}</span>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="size-3.5 rounded-[3px]" style={{ background: TIERS[tier].color }} />
            <p className="text-[14px] font-semibold">{TIERS[tier].label}</p>
          </div>
          <p className="text-ink-3 mt-0.5 pl-6 text-[12px]">{TIERS[tier].action}</p>
          <div className="mt-3">
            <div className="text-ink-3 flex justify-between text-[11px]">
              <span>Grid stress index</span>
              <span className="num text-ink-1">{row.stress} / 100</span>
            </div>
            <div className="bg-surface-4 relative mt-1.5 h-1.5 rounded-full">
              <div
                className="h-full rounded-full"
                style={{ width: `${row.stress}%`, background: TIERS[tier].color }}
              />
              {[50, 75, 90].map((b) => (
                <span
                  key={b}
                  className="bg-ink-3/60 absolute top-[-2px] h-2.5 w-px"
                  style={{ left: `${b}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2 self-center sm:grid-cols-3 xl:grid-cols-5">
          <Item label="Electricity price" value={`$${row.lmp.toFixed(2)}`} unit="/MWh" />
          <Item label="Outdoor heat (wet-bulb)" value={row.wetBulbF.toFixed(1)} unit="°F" />
          <Item label="Grid carbon" value={String(row.carbon)} unit="gCO₂/kWh" />
          <Item label="NVML GPU cap" value={String(row.gpuCapW)} unit="W" />
          <Item
            label="Action taken"
            value={row.shavedMw > 0 ? `−${row.shavedMw.toFixed(1)}` : "None"}
            unit={row.shavedMw > 0 ? "MW shaved" : "full power"}
            strong
          />
        </dl>
      </div>

      {mismatch && (
        <p className="bg-surface-3 text-ink-2 mt-3 flex gap-2 rounded-[6px] p-2.5 text-[12px] leading-relaxed">
          <Icon name="info" size={14} className="text-ink-3 mt-0.5 shrink-0" />
          <span>
            The CSV logs this hour as <b className="text-ink-1 font-medium">{TIERS[csv].label}</b>.
            Colour follows the stress index ({row.stress} ≥ 90 → Tier-3).
          </span>
        </p>
      )}
      {scope !== "facility" && (
        <p className="text-ink-3 mt-2 text-[11.5px] leading-relaxed">
          Circuit values are estimated from the facility CSV by busway share; price, heat and carbon
          are campus-wide.
        </p>
      )}
    </aside>
  );
}

function Item({
  label,
  value,
  unit,
  strong,
}: {
  label: string;
  value: string;
  unit: string;
  strong?: boolean;
}) {
  return (
    <div className="bg-surface-3/60 rounded-[6px] px-3 py-2.5">
      <dt className="text-ink-3 truncate text-[11.5px]">{label}</dt>
      <dd className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className={`num text-ink-1 text-[17px] leading-none ${strong ? "font-semibold" : ""}`}
        >
          {value}
        </span>
        <span className="num text-ink-3 truncate text-[11px]">{unit}</span>
      </dd>
    </div>
  );
}
