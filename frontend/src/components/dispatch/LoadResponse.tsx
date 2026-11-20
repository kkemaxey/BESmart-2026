"use client";

import { useState, type PointerEvent } from "react";

import { useWidth } from "@/components/charts/useWidth";
import { linePath, linear } from "@/lib/chart-math";
import { BASELINE_MW, delivered, type Plan } from "@/lib/dispatch-model";

const ML = 46;
const MR = 14;
const TOP = 12;
const PH = 150;
const H = TOP + PH + 26;

export function LoadResponse({ p, t, end }: { p: Plan; t: number | null; end: number }) {
  const [ref, w] = useWidth<HTMLDivElement>(700);
  const [hover, setHover] = useState<number | null>(null);
  const x = linear(0, end, ML, w - MR);
  const lo = BASELINE_MW - 130;
  const y = linear(lo, BASELINE_MW + 10, TOP + PH, TOP);
  const load = (s: number) => BASELINE_MW - delivered(p.reduction, s);

  const samples = (from: number, to: number) => {
    const out: [number, number][] = [];
    const n = 80;
    for (let i = 0; i <= n; i++) {
      const s = from + ((to - from) * i) / n;
      out.push([x(s), y(load(s))]);
    }
    return out;
  };

  const tickStep = end > 240 || w < 520 ? 60 : 30;
  const ticks = Array.from({ length: Math.floor(end / tickStep) + 1 }, (_, i) => i * tickStep);

  function onMove(e: PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(Math.max(0, Math.min(end, ((e.clientX - r.left) / r.width) * end)));
  }

  const hx = hover === null ? 0 : x(hover);
  return (
    <div ref={ref} className="relative min-w-0 [contain:inline-size]">
      <svg
        width={w}
        height={H}
        className="block select-none"
        role="img"
        aria-label={`Projected load falls from ${BASELINE_MW} to ${p.settle} MW, starting after the 38 second checkpoint and limited to 8 MW per 10 seconds. Ramp deadline at ${p.rampS} seconds.`}
      >
        {[180, 220, 260, 300].map((v) => (
          <g key={v}>
            <line x1={ML} x2={w - MR} y1={y(v)} y2={y(v)} stroke="rgb(255 255 255 / 0.06)" />
            <text x={ML - 8} y={y(v) + 4} textAnchor="end" className="num fill-ink-4 text-[10.5px]">
              {v}
            </text>
          </g>
        ))}
        {ticks.map((s) => (
          <text
            key={s}
            x={x(s)}
            y={TOP + PH + 18}
            textAnchor={s === 0 ? "start" : "middle"}
            className="num fill-ink-4 text-[10.5px]"
          >
            {s === 0 ? "0 s" : `${s} s`}
          </text>
        ))}

        {/* target + deadline */}
        <line
          x1={ML}
          x2={w - MR}
          y1={y(p.settle)}
          y2={y(p.settle)}
          strokeDasharray="5 4"
          strokeWidth={1.5}
          style={{ stroke: "var(--color-sage)" }}
        />
        <line
          x1={x(p.rampS)}
          x2={x(p.rampS)}
          y1={TOP}
          y2={TOP + PH}
          strokeDasharray="5 4"
          strokeWidth={1.5}
          style={{ stroke: "var(--color-reserve)" }}
        />
        <text
          x={x(p.rampS) - 6}
          y={TOP + 10}
          textAnchor="end"
          className="num text-[10.5px]"
          style={{ fill: "var(--color-reserve)" }}
        >
          deadline {p.rampS} s
        </text>

        {/* full projection, faint; elapsed portion solid */}
        <path
          d={linePath(samples(0, end))}
          fill="none"
          strokeWidth={2}
          style={{ stroke: "var(--color-power)" }}
          opacity={t === null ? 0.9 : 0.25}
        />
        {t !== null && t > 0 && (
          <>
            <path
              d={linePath(samples(0, t))}
              fill="none"
              strokeWidth={2}
              style={{ stroke: "var(--color-power)" }}
              strokeLinejoin="round"
            />
            <circle
              cx={x(t)}
              cy={y(load(t))}
              r={4.5}
              strokeWidth={2}
              className="stroke-surface-1"
              style={{ fill: "var(--color-power)" }}
            />
          </>
        )}

        {hover !== null && (
          <g pointerEvents="none">
            <line x1={hx} x2={hx} y1={TOP} y2={TOP + PH} stroke="rgb(255 255 255 / 0.3)" />
            <circle
              cx={hx}
              cy={y(load(hover))}
              r={4}
              strokeWidth={2}
              className="stroke-surface-1"
              style={{ fill: "var(--color-ink-1)" }}
            />
          </g>
        )}
        <rect
          x={ML}
          y={TOP}
          width={Math.max(0, w - ML - MR)}
          height={PH}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hover !== null && (
        <div
          className="viz-tip"
          style={{
            left: hx > w - 190 ? hx - 12 : hx + 12,
            top: TOP + 24,
            transform: hx > w - 190 ? "translateX(-100%)" : undefined,
          }}
        >
          <p className="num text-ink-1 mb-1 font-medium">t + {hover.toFixed(0)} s</p>
          <p className="flex justify-between gap-4">
            Projected load <span className="num text-ink-1">{load(hover).toFixed(1)} MW</span>
          </p>
          <p className="flex justify-between gap-4">
            Delivered{" "}
            <span className="num text-ink-1">−{delivered(p.reduction, hover).toFixed(1)} MW</span>
          </p>
        </div>
      )}
      <ul className="text-ink-3 mt-1 flex flex-wrap gap-x-5 gap-y-1 pb-1 text-[12px]">
        <li className="flex items-center gap-1.5">
          <span className="bg-power h-0.5 w-3.5 rounded-full" /> Projected load
        </li>
        <li className="flex items-center gap-1.5">
          <span className="border-sage w-3.5 border-t-2 border-dashed" /> Target load
        </li>
        <li className="flex items-center gap-1.5">
          <span className="border-reserve w-3.5 border-t-2 border-dashed" /> Ramp deadline
        </li>
      </ul>
    </div>
  );
}
