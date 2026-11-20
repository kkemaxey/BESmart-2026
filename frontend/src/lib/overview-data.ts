import { mulberry32 } from "@/lib/chart-math";

export const NOW_MIN = 14 * 60 + 6; // 14:06
export const STEP_MIN = 10;
export const CAP_MW = 250;
export const RESERVE_FLOOR = 5;
export const WINDOW = { start: 14 * 60, end: 17 * 60 };

export type TelemetryPoint = { min: number; power: number; reserve: number; forecast: boolean };

function build(): TelemetryPoint[] {
  const rnd = mulberry32(7);
  const out: TelemetryPoint[] = [];
  for (let min = 0; min <= 1440; min += STEP_MIN) {
    const n = () => rnd() - 0.5;
    const forecast = min > NOW_MIN;
    let power: number;
    let reserve: number;
    if (min < 13 * 60 + 50) {
      power = 286 + 16 * (min / 830) + 2.4 * Math.sin(min / 37) + n() * 3.2;
    } else if (!forecast) {
      // the dispatch: checkpoint → NVML cap drops load to the cap
      const k = Math.min(1, (min - (13 * 60 + 50)) / 16);
      power = 300 - k * (300 - 246.8);
    } else {
      power = 247.2 + 1.1 * Math.sin(min / 23) + n() * 1.6;
    }
    if (min < 10 * 60) {
      reserve = 14 + 0.35 * Math.sin(min / 41) + n() * 0.45;
    } else if (!forecast) {
      const k = (min - 600) / (NOW_MIN - 600);
      reserve = 14 - 7.6 * k ** 1.6 + n() * 0.2;
    } else if (min < 15 * 60) {
      const k = (min - NOW_MIN) / (15 * 60 - NOW_MIN);
      reserve = 6.4 - 1.0 * Math.sin((k * Math.PI) / 2);
    } else if (min < 20 * 60) {
      const k = (min - 900) / 300;
      reserve = 5.4 + 8.4 * (0.5 - 0.5 * Math.cos(k * Math.PI)) + n() * 0.25;
    } else {
      reserve = 13.8 + 0.3 * Math.sin(min / 29) + n() * 0.3;
    }
    out.push({ min, power, reserve, forecast });
  }
  // pin the "now" reading to the headline values
  const nowIdx = out.findIndex((p) => p.min >= NOW_MIN);
  out.splice(nowIdx, 0, { min: NOW_MIN, power: 246.8, reserve: 6.4, forecast: false });
  return out;
}

export const TELEMETRY = build();

export const fmtClock = (min: number) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const PRIORITY_TIERS = [
  { code: "P0", name: "Safety-critical inference", action: "Exempt", mw: 38, dispatchable: false },
  {
    code: "P1",
    name: "Frontier pre-training",
    action: "Checkpoint + cap",
    mw: 132,
    dispatchable: true,
  },
  { code: "P2", name: "Fine-tuning & eval", action: "Migrate", mw: 46, dispatchable: true },
  { code: "P3", name: "Batch / data prep", action: "Defer", mw: 29, dispatchable: true },
] as const;

export const WORKLOADS = [
  {
    job: "llm-pt-7b3",
    cls: "Frontier pre-train",
    gpus: "32,768",
    ckpt: "13:59:21",
    state: "Capped 350 W",
    tone: "warn",
  },
  {
    job: "mm-pt-v4",
    cls: "Frontier pre-train",
    gpus: "16,384",
    ckpt: "13:59:40",
    state: "Capped 350 W",
    tone: "warn",
  },
  {
    job: "rlhf-sweep-12",
    cls: "Fine-tune",
    gpus: "2,048",
    ckpt: "13:58:02",
    state: "Migrated → US-W2",
    tone: "info",
  },
  {
    job: "triage-infer",
    cls: "Safety-critical",
    gpus: "1,024",
    ckpt: "—",
    state: "Exempt · full power",
    tone: "ok",
  },
  {
    job: "dataprep-cc-09",
    cls: "Batch",
    gpus: "640 nodes",
    ckpt: "n/a",
    state: "Deferred → 02:00",
    tone: "muted",
  },
] as const;

export const AUDIT = [
  {
    what: "Telemetry receipt signed · −60.2 MW verified at meter",
    at: "14:00:41.208",
    hash: "9f3a…c71e",
  },
  { what: "NVML cap applied 700 → 350 W · 82,144 GPUs", at: "14:00:02.917", hash: "4b0d…2a9f" },
  { what: "Checkpoint ACK · mm-pt-v4 · 34.8 s", at: "13:59:40.112", hash: "e17c…09bd" },
  { what: "Checkpoint ACK · llm-pt-7b3 · 38.2 s", at: "13:59:21.540", hash: "a6f2…77e0" },
  {
    what: "OpenADR 2.0b event received · 60 MW · ramp 120 s",
    at: "13:58:44.003",
    hash: "0c88…d4a1",
  },
] as const;
