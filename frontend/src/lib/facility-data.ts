import { mulberry32 } from "./chart-math";

export const DT_LIMIT = 10;

export const CDUS = [
  { id: "CDU-A1", dt: 7.8, flow: 412, pump: 98 },
  { id: "CDU-A2", dt: 8.1, flow: 405, pump: 97 },
  { id: "CDU-B1", dt: 10.9, flow: 388, pump: 91 },
  { id: "CDU-B2", dt: 11.6, flow: 371, pump: 84 },
  { id: "CDU-C1", dt: 7.2, flow: 420, pump: 99 },
  { id: "CDU-C2", dt: 7.5, flow: 417, pump: 99 },
] as const;

export function cduStatus(dt: number) {
  if (dt > DT_LIMIT * 1.1) return "over" as const;
  if (dt > DT_LIMIT) return "watch" as const;
  return "nominal" as const;
}

export const BUSWAYS = [
  { id: "Busway A", amps: 2810 },
  { id: "Busway B", amps: 3420 },
  { id: "Busway C", amps: 2650 },
  { id: "Busway D", amps: 3790 },
] as const;
export const BUSWAY_RATING = 4000;
export const BUSWAY_WATCH = 0.8;

export const ALERTS = [
  {
    sev: "crit",
    title: "CDU-B2 ΔT 11.6 °C exceeds limit by 16%",
    detail: "Auto-downscale started on R07–R08 · −2.4 MW",
    at: "14:05:58",
  },
  {
    sev: "crit",
    title: "R08-N17 junction 89 °C",
    detail: "Node capped to 300 W · job unaffected",
    at: "14:05:12",
  },
  {
    sev: "warn",
    title: "Busway D at 95% of rating",
    detail: "Holding new load admission on Hall 2",
    at: "14:03:40",
  },
  {
    sev: "warn",
    title: "CDU-B1 pump efficiency down 6% / 24 h",
    detail: "Maintenance ticket FAC-2291 opened",
    at: "13:51:09",
  },
] as const;

export const ROWS = 10;
export const COLS = 24;
export const T_MIN = 55;
export const T_MAX = 92;
export const THROTTLE_C = 85;

/** Hall 2 GPU junction temps (°C): cooler aisle centre, hot spot on R07–R08 above loop B. */
export const JUNCTION: number[][] = (() => {
  const rnd = mulberry32(42);
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const aisle = (6 * Math.abs(c - 12.5)) / 12.5; // edges warmer
      let t = 61 + aisle + (rnd() - 0.5) * 5;
      if (r === 6 || r === 7) {
        const spot = Math.max(0, 1 - Math.abs(c - 6.5) / 4) + Math.max(0, 1 - Math.abs(c - 17) / 4);
        t += 7 + spot * 10 + (r === 7 ? 1.5 : 0);
      }
      if (r === 1) t += 2;
      return +Math.min(84.4, t).toFixed(1);
    }),
  );
})();
JUNCTION[7][16] = 89; // R08-N17 (1-indexed)
