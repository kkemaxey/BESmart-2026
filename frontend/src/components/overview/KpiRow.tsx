"use client";

import { useState, type ReactNode } from "react";

import { Sparkline } from "@/components/charts/Sparkline";
import { TELEMETRY } from "@/lib/overview-data";

const actual = TELEMETRY.filter((p) => !p.forecast);
const step = (arr: number[], n: number) =>
  arr.filter((_, i) => i % n === 0 || i === arr.length - 1);
const POWER = step(
  actual.map((p) => p.power),
  2,
);
const RESERVE = step(
  actual.map((p) => p.reserve),
  2,
);
const PUE = [
  1.21, 1.2, 1.21, 1.2, 1.19, 1.2, 1.19, 1.19, 1.2, 1.19, 1.18, 1.19, 1.18, 1.18, 1.17, 1.18, 1.17,
  1.18, 1.17, 1.16, 1.17,
];

/** Nested radius: outer 14px with 4px padding → inner 10px. */
function Tile({ children }: { children: ReactNode }) {
  return (
    <div className="border-line bg-surface-1 rounded-(--radius-tile-outer) border p-1">
      <div className="border-line bg-surface-2 flex h-full flex-col rounded-(--radius-tile) border p-3.5">
        {children}
      </div>
    </div>
  );
}

function Value({
  value,
  unit,
  delta,
  tone,
}: {
  value: string;
  unit: ReactNode;
  delta: ReactNode;
  tone: "ok" | "warn";
}) {
  return (
    <div className="mt-3 flex items-baseline justify-between gap-2">
      <p className="flex items-baseline gap-1.5">
        <span className="num text-[30px] leading-none font-medium tracking-tight">{value}</span>
        <span className="num text-ink-3 text-[13px]">{unit}</span>
      </p>
      <span className={`num text-[12px] ${tone === "ok" ? "text-sage" : "text-warn"}`}>
        {delta}
      </span>
    </div>
  );
}

const TIERS = [
  { id: "normal", label: "Normal", color: "var(--color-ok)" },
  { id: "t1", label: "Tier-1 throttle", color: "var(--color-warn)" },
  { id: "t2", label: "Tier-2 pause & migrate", color: "var(--color-serious)" },
  { id: "t3", label: "Tier-3 emergency shed", color: "var(--color-crit)" },
];

export function KpiRow() {
  const [tier, setTier] = useState("t1");
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Tile>
        <p className="eyebrow">Total power draw</p>
        <Value value="246.8" unit="MW" delta="−58.3 vs 13:45" tone="ok" />
        <div className="mt-3">
          <Sparkline data={POWER} color="var(--color-power)" />
        </div>
        <p className="text-ink-3 mt-2.5 text-[12px]">Firm 180 MW · non-firm 66.8 MW</p>
      </Tile>
      <Tile>
        <p className="eyebrow">Utility grid reserve margin</p>
        <Value value="6.4" unit="%" delta="▼ 7.1 pts / 6 h" tone="warn" />
        <div className="mt-3">
          <Sparkline data={RESERVE} color="var(--color-reserve)" min={0} />
        </div>
        <p className="text-ink-3 mt-2.5 text-[12px]">Georgia BA · floor 5.0%</p>
      </Tile>
      <Tile>
        <p className="eyebrow">
          Facility <span className="acr">PUE</span> · <span className="acr">CDU</span> headroom
        </p>
        <Value
          value="1.17"
          unit={
            <>
              · 22% <span className="acr">hr</span>
            </>
          }
          delta="Loop B 11%"
          tone="warn"
        />
        <div className="mt-3">
          <Sparkline data={PUE} color="var(--color-power)" />
        </div>
        <p className="text-ink-3 mt-2.5 text-[12px]">Wet-bulb 24.1 °C · 6 of 6 CDUs online</p>
      </Tile>
      <Tile>
        <p className="eyebrow">Active curtailment tier</p>
        <ul
          className="-mx-1 mt-2 flex flex-col gap-0.5"
          role="radiogroup"
          aria-label="Curtailment tier"
        >
          {TIERS.map((t) => {
            const on = tier === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTier(t.id)}
                  className={`focus-ring flex h-8 w-full items-center gap-2.5 rounded-[7px] border px-2.5 text-left text-[13px] transition-colors duration-150 ${
                    on
                      ? "text-ink-1 border-[color-mix(in_oklch,var(--color-warn)_45%,transparent)] bg-[color-mix(in_oklch,var(--color-warn)_14%,transparent)] font-semibold"
                      : "text-ink-3 hover:bg-surface-3 border-transparent"
                  }`}
                >
                  <span
                    className="size-2 rounded-[2px]"
                    style={{ background: t.color, opacity: on ? 1 : 0.55 }}
                  />
                  <span className="flex-1">{t.label}</span>
                  {on && (
                    <span className="num text-warn text-[10.5px] font-medium tracking-wide">
                      ACTIVE
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Tile>
    </div>
  );
}
