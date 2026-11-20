"use client";

import { useState } from "react";

import { COLS, JUNCTION, THROTTLE_C, T_MAX, T_MIN } from "@/lib/facility-data";

// sequential ramp with monotone lightness (dark teal → green → warm sand), mixed in OKLCH
const STOPS = ["oklch(36% 0.04 215)", "oklch(58% 0.07 160)", "oklch(83% 0.1 70)"];
const RAMP = `linear-gradient(90deg in oklch, ${STOPS.join(", ")})`;

function heat(t: number) {
  const k = Math.max(0, Math.min(1, (t - T_MIN) / (T_MAX - T_MIN)));
  const [a, b, f] = k < 0.5 ? [STOPS[0], STOPS[1], k / 0.5] : [STOPS[1], STOPS[2], (k - 0.5) / 0.5];
  return `color-mix(in oklch, ${b} ${Math.round(f * 100)}%, ${a})`;
}

export function JunctionHeatmap() {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const t = hover ? JUNCTION[hover.r][hover.c] : null;
  return (
    <div className="relative">
      <div className="overflow-x-auto pb-1">
        <div
          className="grid min-w-[620px] grid-cols-[34px_repeat(24,minmax(0,1fr))] gap-[2px]"
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="Hall 2 GPU junction temperature heat map. Hottest rows R07 and R08; node R08-N17 at 89 °C is above the 85 °C throttle threshold."
        >
          {JUNCTION.map((row, r) => (
            <div key={r} className="contents">
              <div className="num text-ink-3 flex items-center text-[10.5px]">
                R{String(r + 1).padStart(2, "0")}
              </div>
              {row.map((v, c) => {
                const hot = v >= THROTTLE_C;
                const on = hover?.r === r && hover?.c === c;
                return (
                  <div
                    key={c}
                    onPointerEnter={() => setHover({ r, c })}
                    className="aspect-[1.15] rounded-[3px] transition-[filter] duration-100"
                    style={{
                      background: heat(v),
                      boxShadow: hot
                        ? "inset 0 0 0 1.5px var(--color-crit-ink)"
                        : on
                          ? "inset 0 0 0 1.5px var(--color-ink-1)"
                          : undefined,
                      filter: on ? "brightness(1.15)" : undefined,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {hover && t !== null && (
        <div className="viz-tip -top-2 right-2">
          <p className="num text-ink-1 font-medium">
            R{String(hover.r + 1).padStart(2, "0")}-N{String(hover.c + 1).padStart(2, "0")}
          </p>
          <p className="mt-0.5 flex justify-between gap-4">
            Junction <span className="num text-ink-1">{t.toFixed(1)} °C</span>
          </p>
          <p className="text-ink-3 text-[11px]">
            {t >= THROTTLE_C
              ? "Above throttle threshold · capped to 300 W"
              : `${(THROTTLE_C - t).toFixed(1)} °C below throttle`}
          </p>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
        <div className="min-w-[220px] flex-1">
          <div className="h-2 rounded-full" style={{ background: RAMP }} />
          <div className="num text-ink-3 mt-1.5 flex justify-between text-[10.5px]">
            <span>{T_MIN} °C</span>
            <span>{(T_MIN + T_MAX) / 2} °C</span>
            <span>{T_MAX} °C</span>
          </div>
        </div>
        <p className="text-ink-3 flex items-center gap-2 pb-4 text-[12px]">
          <span className="border-crit-ink size-3 rounded-[3px] border-[1.5px]" /> At or above{" "}
          {THROTTLE_C} °C throttle threshold
        </p>
      </div>
      <p className="sr-only">{COLS} nodes per row.</p>
    </div>
  );
}
