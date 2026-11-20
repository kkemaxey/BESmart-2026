"use client";

import { useState, type PointerEvent } from "react";

import { useWidth } from "@/components/charts/useWidth";
import { areaPath, linePath, linear } from "@/lib/chart-math";
import { TIERS, tierFromStress, type Row } from "@/lib/telemetry";

const ML = 46;
const MR = 14;
const P1 = { top: 22, h: 190 };
const P2 = { top: P1.top + P1.h + 40, h: 150 };
const AXIS_Y = P2.top + P2.h + 18;
const H = AXIS_Y + 6;
const NOW_IDX = 14; // Fri 14:00

/** Contiguous index runs where pred holds — used for shaded bands. */
function runs(rows: Row[], pred: (r: Row) => boolean) {
  const out: [number, number][] = [];
  let s = -1;
  rows.forEach((r, i) => {
    if (pred(r) && s < 0) s = i;
    if (!pred(r) && s >= 0) {
      out.push([s, i - 1]);
      s = -1;
    }
  });
  if (s >= 0) out.push([s, rows.length - 1]);
  return out;
}

/**
 * Price and carbon as two small multiples on one 48-hour axis —
 * $/MWh and gCO₂/kWh never share a y-scale.
 */
export function OutlookChart({ rows }: { rows: Row[] }) {
  const [ref, w] = useWidth<HTMLDivElement>(800);
  const [hover, setHover] = useState<number | null>(null);
  const x = linear(0, rows.length - 1, ML, w - MR);
  const yL = linear(0, 600, P1.top + P1.h, P1.top);
  const yC = linear(150, 600, P2.top + P2.h, P2.top);
  const cell = (w - ML - MR) / (rows.length - 1);

  const calm = runs(rows, (r) => r.stress < 50 && r.hour >= 0 && r.hour <= 7);
  const dispatch = runs(rows, (r) => r.stress >= 75);
  const lmpPts = rows.map((r, i) => [x(i), yL(r.lmp)] as [number, number]);
  const co2Pts = rows.map((r, i) => [x(i), yC(r.carbon)] as [number, number]);

  function onMove(e: PointerEvent<SVGRectElement>) {
    const b = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - b.left) / b.width) * (rows.length - 1));
    setHover(Math.max(0, Math.min(rows.length - 1, i)));
  }

  const band = (r: [number, number], fill: string, op: number) => (
    <rect
      key={`${fill}${r[0]}`}
      x={x(r[0]) - cell / 2}
      y={P1.top}
      width={(r[1] - r[0] + 1) * cell}
      height={P2.top + P2.h - P1.top}
      style={{ fill }}
      opacity={op}
      rx={3}
    />
  );
  const hr = hover === null ? null : rows[hover];
  const hx = hover === null ? 0 : x(hover);
  const flip = hx > w - 210;

  return (
    <div ref={ref} className="relative min-w-0 [contain:inline-size]">
      <svg
        width={w}
        height={H}
        className="block select-none"
        role="img"
        aria-label="48-hour price and carbon forecast. Both peak each afternoon between 13:00 and 17:00, with price reaching $542 per MWh on Saturday at 15:00."
      >
        {calm.map((r) => band(r, "var(--color-ok)", 0.08))}
        {dispatch.map((r) => band(r, "var(--color-crit)", 0.11))}

        <text x={ML} y={P1.top - 9} className="fill-ink-3 text-[11px]">
          <tspan className="acr">LMP</tspan> · <tspan className="num">$/MWh</tspan>
        </text>
        {[0, 200, 400, 600].map((v) => (
          <g key={v}>
            <line x1={ML} x2={w - MR} y1={yL(v)} y2={yL(v)} stroke="rgb(255 255 255 / 0.06)" />
            <text
              x={ML - 8}
              y={yL(v) + 4}
              textAnchor="end"
              className="num fill-ink-4 text-[10.5px]"
            >
              ${v}
            </text>
          </g>
        ))}
        <path
          d={areaPath(lmpPts, P1.top + P1.h)}
          style={{ fill: "var(--color-power)" }}
          opacity={0.1}
        />
        <path
          d={linePath(lmpPts)}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          style={{ stroke: "var(--color-power)" }}
        />

        <text x={ML} y={P2.top - 9} className="fill-ink-3 text-[11px]">
          Carbon intensity · <tspan className="num">gCO₂/kWh</tspan>
        </text>
        {[200, 400, 600].map((v) => (
          <g key={v}>
            <line x1={ML} x2={w - MR} y1={yC(v)} y2={yC(v)} stroke="rgb(255 255 255 / 0.06)" />
            <text
              x={ML - 8}
              y={yC(v) + 4}
              textAnchor="end"
              className="num fill-ink-4 text-[10.5px]"
            >
              {v}
            </text>
          </g>
        ))}
        <path
          d={linePath(co2Pts)}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          style={{ stroke: "var(--color-reserve)" }}
        />

        <line
          x1={x(NOW_IDX)}
          x2={x(NOW_IDX)}
          y1={P1.top - 4}
          y2={P2.top + P2.h}
          stroke="rgb(255 255 255 / 0.4)"
          strokeWidth={1.25}
        />

        {rows.map((r, i) =>
          r.hour % (w < 640 ? 12 : 6) === 0 ? (
            <text
              key={i}
              x={x(i)}
              y={AXIS_Y}
              textAnchor={i === 0 ? "start" : "middle"}
              className="num fill-ink-4 text-[10.5px]"
            >
              {r.hour === 0
                ? r.day === 1
                  ? "Fri 00:00"
                  : "Sat 00:00"
                : `${String(r.hour).padStart(2, "0")}:00`}
            </text>
          ) : null,
        )}

        {hr && (
          <g pointerEvents="none">
            <line x1={hx} x2={hx} y1={P1.top} y2={P2.top + P2.h} stroke="rgb(255 255 255 / 0.3)" />
            <circle
              cx={hx}
              cy={yL(hr.lmp)}
              r={4.5}
              strokeWidth={2}
              className="stroke-surface-1"
              style={{ fill: "var(--color-power)" }}
            />
            <circle
              cx={hx}
              cy={yC(hr.carbon)}
              r={4.5}
              strokeWidth={2}
              className="stroke-surface-1"
              style={{ fill: "var(--color-reserve)" }}
            />
          </g>
        )}
        <rect
          x={ML}
          y={P1.top}
          width={Math.max(0, w - ML - MR)}
          height={P2.top + P2.h - P1.top}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hr && (
        <div
          className="viz-tip"
          style={{
            left: flip ? hx - 12 : hx + 12,
            top: P1.top + 8,
            transform: flip ? "translateX(-100%)" : undefined,
          }}
        >
          <p className="num text-ink-1 mb-1.5 font-medium">
            {hr.day === 1 ? "Fri" : "Sat"} {String(hr.hour).padStart(2, "0")}:00
          </p>
          <p className="flex justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="bg-power h-0.5 w-3 rounded-full" /> <span className="acr">LMP</span>
            </span>
            <span className="num text-ink-1">${hr.lmp.toFixed(2)}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="bg-reserve h-0.5 w-3 rounded-full" /> Carbon
            </span>
            <span className="num text-ink-1">{hr.carbon} g</span>
          </p>
          <p className="border-line mt-1.5 flex items-center gap-2 border-t pt-1.5 text-[11px]">
            <span
              className="size-2 rounded-[2px]"
              style={{ background: TIERS[tierFromStress(hr.stress)].color }}
            />
            {TIERS[tierFromStress(hr.stress)].label}
          </p>
        </div>
      )}
    </div>
  );
}
