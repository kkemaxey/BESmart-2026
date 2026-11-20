"use client";

import { useMemo, useState, type PointerEvent } from "react";

import { useWidth } from "@/components/charts/useWidth";
import { Segmented } from "@/components/ui/Segmented";
import { linear } from "@/lib/chart-math";
import { TIERS, ols, tierFromStress, type Row, type TierId } from "@/lib/telemetry";

type Mode = "heat" | "dial";

const MODES = {
  heat: {
    label: "Heat → power saved",
    x: (r: Row) => r.wetBulbF,
    y: (r: Row) => r.shavedMw,
    xDomain: [58, 88] as const,
    yDomain: [-10, 140] as const,
    xTicks: [60, 65, 70, 75, 80, 85],
    yTicks: [0, 30, 60, 90, 120],
    xLabel: "Outdoor wet-bulb temperature (°F)",
    yLabel: "Power saved (MW)",
    xFmt: (v: number) => `${v.toFixed(1)} °F`,
    yFmt: (v: number) => `${v.toFixed(1)} MW saved`,
    caption:
      "As afternoon heat rises, the software automatically shaves more megawatts off the grid.",
  },
  dial: {
    label: "GPU cap → total load",
    x: (r: Row) => r.gpuCapW,
    y: (r: Row) => r.loadMw,
    xDomain: [150, 725] as const,
    yDomain: [100, 250] as const,
    xTicks: [175, 300, 400, 500, 600, 700],
    yTicks: [100, 150, 200, 250],
    xLabel: "NVML GPU power limit (W)",
    yLabel: "Total data-centre draw (MW)",
    xFmt: (v: number) => `${v} W cap`,
    yFmt: (v: number) => `${v.toFixed(1)} MW draw`,
    caption:
      "Turning the GPU power dial down gives a reliable, straight-line drop in total building electricity use.",
  },
} as const;

const ML = 52;
const MR = 16;
const MT = 16;
const MB = 44;
const H = 340;

type Pt = { x: number; y: number; rows: Row[]; tier: TierId };

export function RegressionChart({ rows }: { rows: Row[] }) {
  const [mode, setMode] = useState<Mode>("heat");
  const [ref, w] = useWidth<HTMLDivElement>(900);
  const [hover, setHover] = useState<Pt | null>(null);
  const M = MODES[mode];

  const fit = useMemo(() => ols(rows.map(M.x), rows.map(M.y)), [rows, M]);
  // group identical readings so overlapping dots report their count
  const points = useMemo(() => {
    const map = new Map<string, Pt>();
    for (const r of rows) {
      const k = `${M.x(r)}|${M.y(r)}`;
      const p = map.get(k);
      if (p) p.rows.push(r);
      else map.set(k, { x: M.x(r), y: M.y(r), rows: [r], tier: tierFromStress(r.stress) });
    }
    return [...map.values()];
  }, [rows, M]);

  const sx = linear(M.xDomain[0], M.xDomain[1], ML, w - MR);
  const sy = linear(M.yDomain[0], M.yDomain[1], H - MB, MT);
  const [x0, x1] = M.xDomain;
  const band = useMemo(() => {
    const n = 40;
    const up: string[] = [];
    const dn: string[] = [];
    for (let i = 0; i <= n; i++) {
      const xv = x0 + ((x1 - x0) * i) / n;
      const yv = fit.m * xv + fit.b;
      up.push(`${sx(xv).toFixed(1)},${sy(yv + fit.ci(xv)).toFixed(1)}`);
      dn.unshift(`${sx(xv).toFixed(1)},${sy(yv - fit.ci(xv)).toFixed(1)}`);
    }
    return `M${up.join("L")}L${dn.join("L")}Z`;
  }, [fit, sx, sy, x0, x1]);

  function onMove(e: PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left + ML;
    const py = e.clientY - r.top + MT;
    let best: Pt | null = null;
    let bd = 28 ** 2;
    for (const p of points) {
      const d = (sx(p.x) - px) ** 2 + (sy(p.y) - py) ** 2;
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    setHover(best);
  }

  const sign = fit.b < 0 ? "−" : "+";
  const eq = `y = ${fit.m.toFixed(2)}x ${sign} ${Math.abs(fit.b).toFixed(1)}`;
  const hx = hover ? sx(hover.x) : 0;
  const hy = hover ? sy(hover.y) : 0;
  const flip = hx > w - 230;

  return (
    <section className="panel">
      <div className="panel-head justify-between gap-y-3">
        <div className="min-w-0">
          <h2 className="panel-title">Predictive regression & curtailment curve</h2>
          <p className="text-ink-3 mt-1 max-w-[68ch] text-[13px]">
            A cause-and-effect proof. Each dot is one hour from the data centre; the straight line
            shows the power savings follow a predictable pattern utilities can trust, not guesswork.
          </p>
        </div>
        <Segmented
          label="Regression variables"
          size="sm"
          value={mode}
          onChange={(m) => {
            setHover(null);
            setMode(m);
          }}
          options={[
            { value: "heat", label: MODES.heat.label, hint: "Mode A — wet-bulb vs. MW shaved" },
            {
              value: "dial",
              label: MODES.dial.label,
              hint: "Mode B — NVML cap vs. modulated load",
            },
          ]}
        />
      </div>

      <p className="text-ink-2 px-1.5 pb-3 text-[13px]">
        <span className="num text-ink-3 mr-2">{mode === "heat" ? "Mode A" : "Mode B"}</span>
        {M.caption}
      </p>

      <div ref={ref} className="relative min-w-0 [contain:inline-size]">
        <svg
          width={w}
          height={H}
          className="block select-none"
          role="img"
          aria-label={`Scatter of ${rows.length} hourly readings, ${M.xLabel} against ${M.yLabel}, with an ordinary least squares fit ${eq}, R squared ${fit.r2.toFixed(3)}.`}
        >
          {M.yTicks.map((v) => (
            <g key={`y${v}`}>
              <line x1={ML} x2={w - MR} y1={sy(v)} y2={sy(v)} stroke="rgb(255 255 255 / 0.06)" />
              <text
                x={ML - 8}
                y={sy(v) + 4}
                textAnchor="end"
                className="num fill-ink-4 text-[10.5px]"
              >
                {v}
              </text>
            </g>
          ))}
          {M.xTicks.map((v) => (
            <text
              key={`x${v}`}
              x={sx(v)}
              y={H - MB + 18}
              textAnchor="middle"
              className="num fill-ink-4 text-[10.5px]"
            >
              {v}
            </text>
          ))}
          <line x1={ML} x2={w - MR} y1={H - MB} y2={H - MB} stroke="rgb(255 255 255 / 0.14)" />
          <text
            x={(ML + w - MR) / 2}
            y={H - 6}
            textAnchor="middle"
            className="fill-ink-3 text-[11.5px]"
          >
            {M.xLabel}
          </text>
          <text
            transform={`translate(13 ${(MT + H - MB) / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-ink-3 text-[11.5px]"
          >
            {M.yLabel}
          </text>

          {/* 95% CI ribbon + OLS line */}
          <path d={band} className="fill-ink-1" opacity={0.09} />
          <line
            x1={sx(x0)}
            x2={sx(x1)}
            y1={sy(fit.m * x0 + fit.b)}
            y2={sy(fit.m * x1 + fit.b)}
            className="stroke-ink-1"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {points.map((p) => (
            <g
              key={`${p.x}|${p.y}`}
              style={{
                transform: `translate(${sx(p.x)}px, ${sy(p.y)}px)`,
                transition: "transform 280ms var(--ease-out)",
              }}
            >
              <circle
                r={p.rows.length > 1 ? 6 : 5}
                strokeWidth={2}
                className="stroke-surface-1"
                style={{ fill: TIERS[p.tier].color }}
              />
              {p.rows.length > 3 && (
                <text x={10} y={4} className="num fill-ink-3 text-[10px]">
                  ×{p.rows.length}
                </text>
              )}
            </g>
          ))}

          {hover && (
            <circle
              cx={hx}
              cy={hy}
              r={9}
              fill="none"
              className="stroke-ink-1"
              strokeWidth={1.5}
              pointerEvents="none"
            />
          )}
          <rect
            x={ML}
            y={MT}
            width={Math.max(0, w - ML - MR)}
            height={H - MT - MB}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {/* accuracy badge */}
        <div className="border-line-strong bg-surface-3/95 pointer-events-none absolute top-3 left-[66px] rounded-[10px] border px-3 py-2 backdrop-blur-sm">
          <p className="flex items-baseline gap-2">
            <span className="text-ink-3 text-[11px]">
              R<sup>2</sup>
            </span>
            <span className="num text-[18px] leading-none font-semibold">{fit.r2.toFixed(3)}</span>
          </p>
          <p className="num text-ink-2 mt-1 text-[12px]">{eq}</p>
          {fit.deterministic && (
            <p className="text-sage mt-1 text-[11px]">Deterministic NVML response · CI width 0</p>
          )}
        </div>

        {hover && (
          <div
            className="viz-tip"
            style={{
              left: flip ? hx - 14 : hx + 14,
              top: Math.max(8, hy - 20),
              transform: flip ? "translateX(-100%)" : undefined,
            }}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: TIERS[hover.tier].color }}
              />
              <span className="text-ink-1 font-medium">{TIERS[hover.tier].label}</span>
            </div>
            <p className="num text-ink-1">{M.xFmt(hover.x)}</p>
            <p className="num text-ink-1">{M.yFmt(hover.y)}</p>
            <p className="border-line text-ink-3 mt-1.5 border-t pt-1.5 text-[11px]">
              {hover.rows.length === 1
                ? `${hover.rows[0].day === 1 ? "Fri" : "Sat"} ${String(hover.rows[0].hour).padStart(2, "0")}:00`
                : `${hover.rows.length} hours at this reading · ${hover.rows
                    .slice(0, 3)
                    .map(
                      (r) => `${r.day === 1 ? "Fri" : "Sat"} ${String(r.hour).padStart(2, "0")}:00`,
                    )
                    .join(", ")}${hover.rows.length > 3 ? "…" : ""}`}
            </p>
          </div>
        )}
      </div>

      <ul className="text-ink-2 mt-2 flex flex-wrap gap-x-5 gap-y-2 px-1.5 pb-1 text-[12px]">
        {(Object.keys(TIERS) as TierId[]).map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: TIERS[t].color }} />
            {TIERS[t].label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="bg-ink-1 h-0.5 w-4 rounded-full" /> OLS fit
        </li>
        <li className="flex items-center gap-1.5">
          <span className="bg-ink-1/10 h-2.5 w-4 rounded-[2px]" /> 95% confidence
        </li>
      </ul>
      {mode === "heat" && (
        <p className="text-ink-3 mt-2 px-1.5 pb-1 text-[11.5px]">
          No power is shaved below about 71 °F, so those hours sit flat at zero while the line keeps
          sloping. The real response bends at that threshold, which is why R² is below 1.
        </p>
      )}
    </section>
  );
}
