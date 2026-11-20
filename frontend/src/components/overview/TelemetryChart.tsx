"use client";

import { useMemo, useState, type PointerEvent } from "react";

import { useWidth } from "@/components/charts/useWidth";
import { areaPath, linePath, linear } from "@/lib/chart-math";
import {
  CAP_MW,
  NOW_MIN,
  RESERVE_FLOOR,
  TELEMETRY,
  WINDOW,
  fmtClock,
  type TelemetryPoint,
} from "@/lib/overview-data";

const ML = 46;
const MR = 14;
const P1 = { top: 22, h: 150 }; // power panel
const GAP = 30;
const P2 = { top: P1.top + P1.h + GAP, h: 92 }; // reserve panel
const AXIS_Y = P2.top + P2.h + 18;
const H = AXIS_Y + 6;

/**
 * Two small multiples on a shared time axis instead of one dual-axis chart:
 * MW and % never share a y-scale, and one crosshair links them.
 */
export function TelemetryChart() {
  const [ref, w] = useWidth<HTMLDivElement>(1000);
  const [hover, setHover] = useState<TelemetryPoint | null>(null);

  const x = useMemo(() => linear(0, 1440, ML, w - MR), [w]);
  const yP = linear(200, 320, P1.top + P1.h, P1.top);
  const yR = linear(0, 18, P2.top + P2.h, P2.top);

  const actual = TELEMETRY.filter((p) => !p.forecast);
  const fc = TELEMETRY.filter((p) => p.forecast || p.min === NOW_MIN);
  const pts = (arr: TelemetryPoint[], f: (p: TelemetryPoint) => number, y: (v: number) => number) =>
    arr.map((p) => [x(p.min), y(f(p))] as [number, number]);

  function onMove(e: PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const min = ((e.clientX - rect.left) / rect.width) * 1440;
    let best = TELEMETRY[0];
    for (const p of TELEMETRY) if (Math.abs(p.min - min) < Math.abs(best.min - min)) best = p;
    setHover(best);
  }

  const hx = hover ? x(hover.min) : 0;
  const flip = hx > w - 200;

  return (
    <div ref={ref} className="relative min-w-0 [contain:inline-size]">
      <svg
        width={w}
        height={H}
        className="block select-none"
        role="img"
        aria-label="24-hour power draw and grid reserve margin. Power fell from about 300 MW to 246.8 MW at 14:00, below the 250 MW cap. Reserve margin fell from 14% to 6.4% and is forecast to bottom at 5.4% near 15:00."
      >
        {/* curtailment window spans both panels */}
        <rect
          x={x(WINDOW.start)}
          y={P1.top}
          width={x(WINDOW.end) - x(WINDOW.start)}
          height={P2.top + P2.h - P1.top}
          style={{ fill: "var(--color-reserve)" }}
          opacity={0.07}
          rx={4}
        />

        {/* --- panel 1: power draw --- */}
        <text x={ML} y={P1.top - 9} className="fill-ink-3 text-[11px]">
          Power draw · <tspan className="num">MW</tspan>
        </text>
        {[220, 260, 300].map((v) => (
          <g key={v}>
            <line x1={ML} x2={w - MR} y1={yP(v)} y2={yP(v)} stroke="rgb(255 255 255 / 0.06)" />
            <text
              x={ML - 8}
              y={yP(v) + 4}
              textAnchor="end"
              className="num fill-ink-4 text-[10.5px]"
            >
              {v}
            </text>
          </g>
        ))}
        <path
          d={areaPath(
            pts(actual, (p) => p.power, yP),
            P1.top + P1.h,
          )}
          style={{ fill: "var(--color-power)" }}
          opacity={0.1}
        />
        <line
          x1={ML}
          x2={w - MR}
          y1={yP(CAP_MW)}
          y2={yP(CAP_MW)}
          style={{ stroke: "var(--color-crit-ink)" }}
          strokeDasharray="5 4"
          opacity={0.7}
        />
        <text
          x={ML + 6}
          y={yP(CAP_MW) - 6}
          className="num text-[10.5px]"
          style={{ fill: "var(--color-crit-ink)" }}
        >
          Non-firm cap 250 MW
        </text>
        <path
          d={linePath(pts(actual, (p) => p.power, yP))}
          fill="none"
          strokeWidth={2}
          style={{ stroke: "var(--color-power)" }}
          strokeLinejoin="round"
        />
        <path
          d={linePath(pts(fc, (p) => p.power, yP))}
          fill="none"
          strokeWidth={1.75}
          strokeDasharray="4 4"
          style={{ stroke: "var(--color-power)" }}
          opacity={0.85}
        />

        {/* --- panel 2: reserve margin --- */}
        <text x={ML} y={P2.top - 9} className="fill-ink-3 text-[11px]">
          Grid reserve margin · <tspan className="num">%</tspan>
        </text>
        {[0, 6, 12, 18].map((v) => (
          <g key={v}>
            <line x1={ML} x2={w - MR} y1={yR(v)} y2={yR(v)} stroke="rgb(255 255 255 / 0.06)" />
            <text
              x={ML - 8}
              y={yR(v) + 4}
              textAnchor="end"
              className="num fill-ink-4 text-[10.5px]"
            >
              {v}
            </text>
          </g>
        ))}
        <line
          x1={ML}
          x2={w - MR}
          y1={yR(RESERVE_FLOOR)}
          y2={yR(RESERVE_FLOOR)}
          style={{ stroke: "var(--color-crit-ink)" }}
          strokeDasharray="5 4"
          opacity={0.7}
        />
        <text
          x={w - MR - 4}
          y={yR(RESERVE_FLOOR) + 13}
          textAnchor="end"
          className="num text-[10.5px]"
          style={{ fill: "var(--color-crit-ink)" }}
        >
          Floor 5.0%
        </text>
        <path
          d={linePath(pts(actual, (p) => p.reserve, yR))}
          fill="none"
          strokeWidth={2}
          style={{ stroke: "var(--color-reserve)" }}
          strokeLinejoin="round"
        />
        <path
          d={linePath(pts(fc, (p) => p.reserve, yR))}
          fill="none"
          strokeWidth={1.75}
          strokeDasharray="4 4"
          style={{ stroke: "var(--color-reserve)" }}
          opacity={0.85}
        />

        {/* now marker */}
        <line
          x1={x(NOW_MIN)}
          x2={x(NOW_MIN)}
          y1={P1.top - 4}
          y2={P2.top + P2.h}
          stroke="rgb(255 255 255 / 0.55)"
          strokeWidth={1.5}
        />
        <g transform={`translate(${x(NOW_MIN) + 6},${P1.top + 2})`}>
          <rect width={74} height={18} rx={4} className="fill-surface-4" />
          <text x={8} y={12.5} className="num fill-ink-1 text-[10.5px] font-medium">
            NOW 14:06
          </text>
        </g>

        {/* x axis */}
        {[0, 4, 8, 12, 16, 20, 24].map((h) => (
          <text
            key={h}
            x={x(h * 60)}
            y={AXIS_Y}
            textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"}
            className="num fill-ink-4 text-[10.5px]"
          >
            {`${String(h).padStart(2, "0")}:00`}
          </text>
        ))}

        {/* crosshair */}
        {hover && (
          <g pointerEvents="none">
            <line x1={hx} x2={hx} y1={P1.top} y2={P2.top + P2.h} stroke="rgb(255 255 255 / 0.3)" />
            <circle
              cx={hx}
              cy={yP(hover.power)}
              r={4.5}
              strokeWidth={2}
              className="stroke-surface-1"
              style={{ fill: "var(--color-power)" }}
            />
            <circle
              cx={hx}
              cy={yR(hover.reserve)}
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

      {hover && (
        <div
          className="viz-tip"
          style={{
            left: flip ? hx - 12 : hx + 12,
            top: P1.top + 10,
            transform: flip ? "translateX(-100%)" : undefined,
          }}
        >
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <span className="num text-ink-1 font-medium">{fmtClock(hover.min)}</span>
            <span className="text-ink-3 text-[11px]">
              {hover.forecast ? "Forecast" : "Measured"}
            </span>
          </div>
          <Row
            color="var(--color-power)"
            label="Power draw"
            value={`${hover.power.toFixed(1)} MW`}
          />
          <Row
            color="var(--color-reserve)"
            label="Reserve margin"
            value={`${hover.reserve.toFixed(1)} %`}
          />
          {hover.min >= WINDOW.start && hover.min <= WINDOW.end && (
            <div className="border-line text-ink-3 mt-1.5 border-t pt-1.5 text-[11px]">
              Inside curtailment window
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="flex items-center gap-2">
        <span className="h-0.5 w-3 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="num text-ink-1">{value}</span>
    </div>
  );
}
