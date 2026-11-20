/** Types and pure helpers for the 48-hour telemetry CSV. Safe to import on server and client. */

export type TierId = "normal" | "t1" | "t2" | "t3";

export type Row = {
  timestamp: string;
  day: 1 | 2;
  hour: number;
  wetBulbF: number;
  reservePct: number;
  lmp: number;
  carbon: number;
  baselineMw: number;
  loadMw: number;
  shavedMw: number;
  gpuCapW: number;
  cduDeltaTF: number;
  csvTier: string;
  stress: number;
};

export const TIERS: Record<
  TierId,
  { label: string; short: string; action: string; color: string; range: string }
> = {
  normal: {
    label: "Normal",
    short: "N",
    action: "Full compute capacity",
    color: "var(--color-ok)",
    range: "0–49",
  },
  t1: {
    label: "Tier-1 Throttle",
    short: "T1",
    action: "Light GPU power cap",
    color: "var(--color-warn)",
    range: "50–74",
  },
  t2: {
    label: "Tier-2 Pause & Migrate",
    short: "T2",
    action: "Pause non-urgent batch jobs",
    color: "var(--color-serious)",
    range: "75–89",
  },
  t3: {
    label: "Tier-3 Emergency Shed",
    short: "T3",
    action: "Maximum safe load reduction",
    color: "var(--color-crit)",
    range: "90–100",
  },
};

/** Colour follows the stress index (the agreed rule), not the CSV's tier label. */
export function tierFromStress(stress: number): TierId {
  if (stress >= 90) return "t3";
  if (stress >= 75) return "t2";
  if (stress >= 50) return "t1";
  return "normal";
}

export function tierFromLabel(label: string): TierId {
  if (label.startsWith("Tier-3")) return "t3";
  if (label.startsWith("Tier-2")) return "t2";
  if (label.startsWith("Tier-1")) return "t1";
  return "normal";
}

export function parseCsv(text: string): Row[] {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header.split(",");
  const at = (name: string) => {
    const i = cols.indexOf(name);
    if (i < 0) throw new Error(`telemetry CSV is missing column ${name}`);
    return i;
  };
  const idx = {
    ts: at("timestamp"),
    day: at("day_label"),
    hour: at("hour"),
    wb: at("ambient_wet_bulb_f"),
    res: at("grid_reserve_margin_pct"),
    lmp: at("lmp_price_mwh"),
    co2: at("carbon_intensity_gco2"),
    base: at("baseline_load_mw"),
    load: at("modulated_load_mw"),
    shaved: at("mw_shaved"),
    cap: at("nvml_gpu_cap_w"),
    dt: at("cdu_delta_t_f"),
    tier: at("curtailment_tier"),
    gsi: at("grid_stress_index"),
  };
  return lines.map((line) => {
    const c = line.split(",");
    const n = (i: number) => Number(c[i]);
    return {
      timestamp: c[idx.ts],
      day: c[idx.day].trim().endsWith("2") ? 2 : 1,
      hour: n(idx.hour),
      wetBulbF: n(idx.wb),
      reservePct: n(idx.res),
      lmp: n(idx.lmp),
      carbon: n(idx.co2),
      baselineMw: n(idx.base),
      loadMw: n(idx.load),
      shavedMw: n(idx.shaved),
      gpuCapW: n(idx.cap),
      cduDeltaTF: n(idx.dt),
      csvTier: c[idx.tier],
      stress: n(idx.gsi),
    };
  });
}

/* ---------- sub-zone circuits (estimated) ---------- */

/** Busway currents from the Facility tab; used to apportion facility data across circuits A–D. */
export const ZONE_AMPS = { A: 2810, B: 3420, C: 2650, D: 3790 } as const;
export type ZoneId = keyof typeof ZONE_AMPS;
const TOTAL_AMPS = Object.values(ZONE_AMPS).reduce((a, b) => a + b, 0);

export function zoneRow(r: Row, zone: ZoneId): Row & { estimated: true } {
  const share = ZONE_AMPS[zone] / TOTAL_AMPS;
  const loading = share * 4; // 1.0 = average circuit
  const stress = Math.max(0, Math.min(100, Math.round(r.stress * (0.5 + 0.5 * loading))));
  return {
    ...r,
    stress,
    baselineMw: +(r.baselineMw * share).toFixed(1),
    loadMw: +(r.loadMw * share).toFixed(1),
    shavedMw: +(r.shavedMw * share).toFixed(1),
    csvTier: TIERS[tierFromStress(stress)].label,
    estimated: true,
  };
}

/* ---------- OLS with 95% confidence band ---------- */

export type Fit = {
  m: number;
  b: number;
  r2: number;
  n: number;
  /** half-width of the 95% CI for the mean response at x */
  ci: (x: number) => number;
  deterministic: boolean;
};

/** Two-sided 95% t critical value (Cornish–Fisher expansion; < 0.1% error for df ≥ 5). */
function t95(df: number) {
  const z = 1.959964;
  const z3 = z ** 3;
  const z5 = z ** 5;
  return z + (z3 + z) / (4 * df) + (5 * z5 + 16 * z3 + 3 * z) / (96 * df * df);
}

export function ols(xs: number[], ys: number[]): Fit {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let sst = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
    sst += (ys[i] - my) ** 2;
  }
  const m = sxy / sxx;
  const b = my - m * mx;
  let ssr = 0;
  for (let i = 0; i < n; i++) ssr += (ys[i] - (m * xs[i] + b)) ** 2;
  const deterministic = ssr < 1e-9 * Math.max(1, sst);
  const r2 = sst === 0 ? 1 : deterministic ? 1 : 1 - ssr / sst;
  const s = Math.sqrt(ssr / (n - 2));
  const t = t95(n - 2);
  return {
    m,
    b,
    r2,
    n,
    deterministic,
    ci: (x) => (deterministic ? 0 : t * s * Math.sqrt(1 / n + (x - mx) ** 2 / sxx)),
  };
}
