/**
 * Dispatch rehearsal model. Pure functions so the UI, the chart and the stage
 * cards all read the same numbers.
 *
 * - Checkpoint first, then cap: load cannot move until checkpoints ACK.
 * - The ramp-rate guard limits step changes to ±8 MW / 10 s (0.8 MW/s).
 * - GPU cap follows the telemetry CSV's OLS fit: load = 72 + 0.24 × cap,
 *   i.e. every 1 W of NVML cap is worth 0.24 MW across the campus.
 */
export const BASELINE_MW = 305;
export const CHECKPOINT_S = 38.2;
export const CAP_APPLY_S = 1.6;
export const RAMP_MW_PER_S = 0.8;
export const MW_PER_WATT = 0.24;
export const NOMINAL_CAP_W = 700;
const CAP_SHARE = 51 / 80; // share of the reduction taken by power capping vs. rescheduling

export type Plan = {
  reduction: number;
  rampS: number;
  capMw: number;
  rescheduleMw: number;
  capW: number;
  settle: number;
  finishS: number;
  meetsDeadline: boolean;
  deliveredAtDeadline: number;
  verifiedS: number;
};

export function plan(reduction: number, rampS: number): Plan {
  const capMw = +(reduction * CAP_SHARE).toFixed(1);
  const rescheduleMw = +(reduction - capMw).toFixed(1);
  const capW = Math.round((NOMINAL_CAP_W - capMw / MW_PER_WATT) / 5) * 5;
  const finishS = CHECKPOINT_S + reduction / RAMP_MW_PER_S;
  return {
    reduction,
    rampS,
    capMw,
    rescheduleMw,
    capW,
    settle: BASELINE_MW - reduction,
    finishS,
    meetsDeadline: finishS <= rampS,
    deliveredAtDeadline: delivered(reduction, rampS),
    verifiedS: finishS + 2,
  };
}

export function delivered(reduction: number, t: number) {
  return Math.min(reduction, Math.max(0, (t - CHECKPOINT_S) * RAMP_MW_PER_S));
}

export type StageState = "pending" | "running" | "complete";

export function stageState(
  p: Plan,
  t: number | null,
  stage: "A" | "B" | "C" | "D",
): { state: StageState; progress: number } {
  if (t === null) return { state: "pending", progress: 0 };
  const span: Record<typeof stage, [number, number]> = {
    A: [0, CHECKPOINT_S],
    B: [CHECKPOINT_S, CHECKPOINT_S + p.capMw / RAMP_MW_PER_S],
    C: [CHECKPOINT_S + p.capMw / RAMP_MW_PER_S, p.finishS],
    D: [CHECKPOINT_S, p.verifiedS],
  };
  const [a, b] = span[stage];
  if (t < a) return { state: "pending", progress: 0 };
  if (t >= b) return { state: "complete", progress: 1 };
  return { state: "running", progress: (t - a) / (b - a) };
}

export const fmtDuration = (s: number) =>
  s < 60 ? `${Math.round(s)} s` : `${+(s / 60).toFixed(1)} min`;
