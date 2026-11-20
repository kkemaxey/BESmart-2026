const REGIONS = [
  { name: "GA · Southern", g: 452, tag: "HOME" },
  { name: "TVA", g: 388 },
  { name: "PJM · Dominion", g: 401 },
  { name: "MISO · South", g: 518 },
  { name: "ERCOT", g: 364 },
  { name: "SERC · East", g: 612 },
  { name: "CAISO", g: 214 },
  { name: "BPA · US-West-2", g: 92, tag: "TARGET" },
] as const;

const HOME = 452;
const LO = 80;
const HI = 640;
const STOPS = ["oklch(86% 0.07 135)", "oklch(68% 0.07 70)", "oklch(47% 0.1 32)"];
const RAMP = `linear-gradient(90deg in oklch, ${STOPS.join(", ")})`;

/** Sequential low→high carbon colour, mixed in OKLCH so it never greys out mid-ramp. */
function tone(g: number) {
  const k = Math.max(0, Math.min(1, (g - LO) / (HI - LO)));
  const [a, b, t] = k < 0.5 ? [STOPS[0], STOPS[1], k / 0.5] : [STOPS[1], STOPS[2], (k - 0.5) / 0.5];
  return { bg: `color-mix(in oklch, ${b} ${Math.round(t * 100)}%, ${a})`, dark: k < 0.45 };
}

export function CarbonMap() {
  return (
    <section className="panel">
      <div className="panel-head justify-between">
        <div className="flex flex-wrap items-baseline gap-x-2.5">
          <h2 className="panel-title">Carbon-aware dispatch map</h2>
          <p className="panel-sub">Marginal emissions by balancing authority</p>
        </div>
        <span className="pill">
          <span className="dot live-dot text-sage" /> WattTime · 5-min
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {REGIONS.map((r) => {
          const t = tone(r.g);
          const tag = "tag" in r ? r.tag : r.g > HOME ? "BLOCKED" : undefined;
          const ink = t.dark ? "oklch(24% 0.03 100)" : "oklch(97% 0.01 85)";
          return (
            <li
              key={r.name}
              className="relative flex min-h-[96px] flex-col rounded-[var(--radius-inner)] p-3 transition-transform duration-150 hover:-translate-y-0.5"
              style={{
                background: t.bg,
                color: ink,
                boxShadow:
                  tag === "HOME"
                    ? "0 0 0 2px var(--color-surface-1), 0 0 0 3.5px var(--color-ink-1)"
                    : undefined,
              }}
              title={
                tag === "BLOCKED" ? "Migrations blocked: dirtier than the home region" : undefined
              }
            >
              <div className="flex items-start justify-between gap-1.5">
                <p className="clamp-2 text-[12.5px] font-semibold">{r.name}</p>
                {tag && (
                  <span
                    className="num shrink-0 rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide"
                    style={{
                      background: "rgb(0 0 0 / 0.22)",
                      color: t.dark ? "oklch(24% 0.03 100)" : "oklch(97% 0.01 85)",
                    }}
                  >
                    {tag}
                  </span>
                )}
              </div>
              <p className="num mt-auto pt-3 text-[24px] leading-none font-semibold">{r.g}</p>
              <p className="num mt-1 text-[10.5px] opacity-75">gCO₂/kWh</p>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 px-0.5">
        <div className="h-2 rounded-full" style={{ background: RAMP }} />
        <div className="num text-ink-3 mt-1.5 flex justify-between text-[10.5px]">
          <span>{LO}</span>
          <span>{(LO + HI) / 2}</span>
          <span>{HI} gCO₂/kWh</span>
        </div>
      </div>
      <p className="text-ink-3 mt-2.5 px-0.5 pb-1 text-[12px]">
        Migrations are blocked into any region whose marginal intensity is above the home region’s.
      </p>
    </section>
  );
}
