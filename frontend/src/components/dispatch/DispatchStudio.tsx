"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import {
  delivered,
  fmtDuration,
  plan,
  stageState,
  type Plan,
  type StageState,
} from "@/lib/dispatch-model";

import { LoadResponse } from "./LoadResponse";

const REDUCTIONS = [40, 80, 120];
const RAMPS = [
  { value: 60, label: "60 s" },
  { value: 180, label: "3 min" },
  { value: 300, label: "5 min" },
];
const PLAYBACK_S = 6; // real seconds for a full rehearsal

type RunState = "idle" | "running" | "done";

export function DispatchStudio() {
  const [reduction, setReduction] = useState(80);
  const [ramp, setRamp] = useState(180);
  const [t, setT] = useState<number | null>(null);
  const [run, setRun] = useState<RunState>("idle");
  const [approval, setApproval] = useState<"none" | "requested">("none");
  const raf = useRef<number>(0);

  const p = useMemo(() => plan(reduction, ramp), [reduction, ramp]);
  const end = Math.max(p.verifiedS, p.rampS) + 2;

  const stop = () => cancelAnimationFrame(raf.current);
  useEffect(() => stop, []);

  const start = useCallback(() => {
    stop();
    setApproval("none");
    setRun("running");
    setT(0);
    const speed = end / PLAYBACK_S;
    const t0 = performance.now();
    const tick = (now: number) => {
      const sim = ((now - t0) / 1000) * speed;
      if (sim >= end) {
        setT(end);
        setRun("done");
        return;
      }
      setT(sim);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [end]);

  const reset = () => {
    stop();
    setRun("idle");
    setT(null);
    setApproval("none");
  };

  // changing the request invalidates a finished rehearsal
  const change =
    <T,>(fn: (v: T) => void) =>
    (v: T) => {
      if (run === "done") reset();
      fn(v);
    };

  const now = t ?? 0;
  const deliveredNow = t === null ? 0 : delivered(reduction, Math.min(now, end));

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
      <EventPanel
        p={p}
        reduction={reduction}
        ramp={ramp}
        run={run}
        approval={approval}
        onReduction={change(setReduction)}
        onRamp={change(setRamp)}
        onRun={start}
        onReset={reset}
        onExecute={() => setApproval("requested")}
      />
      <div className="flex min-w-0 flex-col gap-3">
        <StageGrid p={p} t={t} />
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Load response</h2>
            <p className="panel-sub">Substation revenue meter</p>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-1.5">
            <p className="flex items-baseline gap-2">
              <span className="num text-[34px] leading-none font-medium tracking-tight">
                {deliveredNow === 0 ? "0.0" : `−${deliveredNow.toFixed(1)}`}
              </span>
              <span className="num text-ink-3 text-[13px]">of {reduction} MW delivered</span>
            </p>
            <Outcome p={p} run={run} t={now} />
          </div>
          <div
            className="bg-surface-3 mx-1.5 mt-4 h-2 overflow-hidden rounded-full"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(deliveredNow / reduction) * 100}%`,
                background:
                  "linear-gradient(90deg in oklch, var(--color-accent), var(--color-sage))",
              }}
            />
          </div>
          <div className="px-1.5 pt-3">
            <LoadResponse p={p} t={t} end={end} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Outcome({ p, run, t }: { p: Plan; run: RunState; t: number }) {
  if (run === "idle") return <p className="text-ink-3 text-[13px]">Not yet rehearsed</p>;
  if (run === "running") {
    const phase =
      t < 38.2
        ? "Waiting for checkpoint ACK…"
        : t < p.finishS
          ? "Ramping under guard…"
          : "Signing meter receipt…";
    return (
      <p className="text-ink-2 flex items-center gap-2 text-[13px]">
        <span className="dot live-dot text-accent" />
        {phase}
      </p>
    );
  }
  return p.meetsDeadline ? (
    <p className="rise text-sage flex items-center gap-1.5 text-[13px]">
      <Icon name="check" size={14} weight={2} /> Event fulfilled — receipt signed
    </p>
  ) : (
    <p className="rise text-crit-ink flex items-center gap-1.5 text-[13px]">
      <Icon name="alert" size={14} /> Only −{p.deliveredAtDeadline.toFixed(1)} MW by deadline · late
      by {fmtDuration(p.finishS - p.rampS)}
    </p>
  );
}

function EventPanel({
  p,
  reduction,
  ramp,
  run,
  approval,
  onReduction,
  onRamp,
  onRun,
  onReset,
  onExecute,
}: {
  p: Plan;
  reduction: number;
  ramp: number;
  run: RunState;
  approval: "none" | "requested";
  onReduction: (v: number) => void;
  onRamp: (v: number) => void;
  onRun: () => void;
  onReset: () => void;
  onExecute: () => void;
}) {
  const rampLabel = RAMPS.find((r) => r.value === ramp)!.label;
  return (
    <section className="panel self-start">
      <div className="panel-head justify-between">
        <div className="flex flex-wrap items-baseline gap-x-2.5">
          <h2 className="panel-title">Incoming dispatch</h2>
          <p className="panel-sub">
            Open<span className="acr">ADR</span> 2.0b · EiEvent
          </p>
        </div>
        <span className="pill">
          <span className="dot text-ink-3" /> Simulation
        </span>
      </div>

      <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-y-2 px-1.5 text-[13px]">
        <dt className="text-ink-3">Event</dt>
        <dd className="num truncate">SIM-GA-20261120-03</dd>
        <dt className="text-ink-3">
          Source <span className="acr">VTN</span>
        </dt>
        <dd className="num truncate">GA Power EMS (sandbox)</dd>
        <dt className="text-ink-3">Signal</dt>
        <dd className="num">LOAD_DISPATCH · delta</dd>
        <dt className="text-ink-3">Window</dt>
        <dd className="num">14:00–17:00 local</dd>
      </dl>

      <div className="mt-5 px-1.5">
        <p className="eyebrow mb-2">Requested reduction</p>
        <Segmented
          label="Requested reduction"
          mono
          value={reduction}
          onChange={onReduction}
          disabled={run === "running"}
          options={REDUCTIONS.map((v) => ({ value: v, label: `${v} MW` }))}
        />
        <p className="eyebrow mt-4 mb-2">Ramp deadline</p>
        <Segmented
          label="Ramp deadline"
          mono
          value={ramp}
          onChange={onRamp}
          disabled={run === "running"}
          options={RAMPS}
        />
      </div>

      <div className="inner mx-0 mt-4 p-3">
        <p className="text-ink-1 text-[13px]">
          “Request <span className="num font-semibold">{reduction} MW</span> reduction within{" "}
          <span className="num font-semibold">{rampLabel}</span>.”
        </p>
        <p className="text-ink-3 mt-1.5 text-[12px] leading-relaxed">
          Campus would settle at <span className="num text-ink-2">{p.settle.toFixed(1)} MW</span>.
          P0 safety-critical inference stays exempt.
        </p>
        <p
          className={`mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed ${p.meetsDeadline ? "text-sage" : "text-crit-ink"}`}
        >
          <Icon name={p.meetsDeadline ? "check" : "alert"} size={13} className="mt-0.5 shrink-0" />
          <span>
            Checkpoint + ramp guard need <span className="num">{fmtDuration(p.finishS)}</span>
            {p.meetsDeadline ? ` — fits in ${rampLabel}.` : ` — misses the ${rampLabel} deadline.`}
          </span>
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          className="btn btn-primary h-11 w-full text-[15px]"
          onClick={onRun}
          disabled={run === "running"}
        >
          <span className="icon-swap">
            <Icon name="bolt" weight={2} data-shown={run !== "running"} />
            <Icon
              name="reset"
              weight={2}
              data-shown={run === "running"}
              className="animate-spin [animation-duration:1.2s]"
            />
          </span>
          <span>
            {run === "running" ? "Simulating…" : run === "done" ? "Run again" : "Run simulation"}
          </span>
        </button>
        <button
          type="button"
          className="btn w-full bg-transparent"
          onClick={onReset}
          disabled={run === "idle"}
        >
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="btn w-full bg-transparent"
          onClick={onExecute}
          disabled={run !== "done" || !p.meetsDeadline || approval === "requested"}
        >
          <Icon name={approval === "requested" ? "lock" : "key"} size={15} />
          <span>{approval === "requested" ? "Awaiting second operator…" : "Execute live"}</span>
        </button>
      </div>
      <p className="text-ink-3 mt-2.5 px-1.5 pb-1 text-[12px] leading-relaxed">
        {run === "done" && !p.meetsDeadline
          ? "Live execution is locked until a rehearsal meets its ramp deadline."
          : run !== "done"
            ? "Run a passing rehearsal to unlock live execution."
            : null}{" "}
        Live execution needs a second operator’s approval under{" "}
        <span className="acr">NERC CIP</span> role separation.
      </p>
    </section>
  );
}

const STAGES = [
  { id: "A", title: "Distributed checkpoint", via: "Slurm · KubeRay · torch.distributed" },
  { id: "B", title: "NVML power cap", via: "NVML · BMC Redfish" },
  { id: "C", title: "Reschedule non-urgent batch", via: "Slurm QoS · K8s PriorityClass" },
  { id: "D", title: "Signed telemetry → utility", via: "OpenADR 2.0b · IEEE 2030.5" },
] as const;

function StageGrid({ p, t }: { p: Plan; t: number | null }) {
  const body = (id: string, done: boolean) => {
    switch (id) {
      case "A":
        return {
          detail: "1,412 ranks across 3 jobs flushed to object store",
          foot: "ACK in 38.2 s",
          mw: "0.0 MW",
        };
      case "B":
        return {
          detail: `97,143 GPUs capped 700 → ${p.capW} W, InfiniBand fabric kept warm`,
          foot: "Applied in 1.6 s",
          mw: `−${p.capMw.toFixed(1)} MW`,
        };
      case "C":
        return {
          detail: `${Math.round(p.rescheduleMw * 7.4)} P3 jobs deferred to 02:00, ${Math.max(1, Math.round(p.rescheduleMw / 5))} P2 jobs → US-WEST-2`,
          foot: "Carbon check passed",
          mw: `−${p.rescheduleMw.toFixed(1)} MW`,
        };
      default:
        return {
          detail: "Revenue-meter readings signed and streamed to the VTN",
          foot: "sha256 9f3a…c71e",
          mw: done ? "Verified" : "Streaming",
        };
    }
  };
  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Multi-stage compute response</h2>
        <p className="panel-sub">Checkpoint first, then cap. Never the other way round.</p>
      </div>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {STAGES.map((s) => {
          const { state, progress } = stageState(p, t, s.id);
          const b = body(s.id, state === "complete");
          return (
            <StageCard
              key={`${s.id}-${state === "complete"}`}
              id={s.id}
              title={s.id === "B" ? `${s.title} → ${p.capW} W/GPU` : s.title}
              via={s.via}
              state={state}
              progress={progress}
              wide={s.id === "D"}
              {...b}
            />
          );
        })}
      </ol>
    </section>
  );
}

function StageCard({
  id,
  title,
  via,
  state,
  progress,
  detail,
  foot,
  mw,
  wide,
}: {
  id: string;
  title: string;
  via: string;
  state: StageState;
  progress: number;
  detail: string;
  foot: string;
  mw: string;
  wide: boolean;
}) {
  const tone =
    state === "complete"
      ? "var(--color-sage)"
      : state === "running"
        ? "var(--color-accent)"
        : "var(--color-ink-4)";
  return (
    <li
      className={`inner flex flex-col p-3 transition-colors duration-200 ${wide ? "sm:col-span-2 xl:col-span-3" : ""} ${
        state === "complete" ? "settle" : ""
      } ${state === "pending" ? "opacity-70" : ""}`}
      aria-label={`Stage ${id}: ${title}, ${state}`}
    >
      <div className="flex items-center justify-between">
        <span
          className="num grid size-6 place-items-center rounded-[6px] text-[12px] font-semibold transition-colors duration-200"
          style={{
            background: state === "pending" ? "var(--color-surface-4)" : tone,
            color: state === "pending" ? "var(--color-ink-2)" : "var(--color-accent-ink)",
          }}
        >
          {id}
        </span>
        <span
          className="num text-[12px]"
          style={{ color: state === "pending" ? "var(--color-ink-3)" : tone }}
        >
          {state === "complete" ? "Complete" : state === "running" ? "Running" : "Pending"}
        </span>
      </div>
      <h3 className="mt-2.5 text-[14px] font-semibold">{title}</h3>
      <p className="num text-ink-3 mt-1 text-[11.5px]">{via}</p>
      <div className="bg-surface-4 mt-3 h-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{ width: `${progress * 100}%`, background: tone }}
        />
      </div>
      <p className="text-ink-2 mt-2.5 flex-1 text-[13px]">{detail}</p>
      <div className="mt-2 flex items-baseline justify-between gap-2 text-[12px]">
        <span className="num text-ink-3">{foot}</span>
        <span className="num text-ink-1 font-semibold">{mw}</span>
      </div>
    </li>
  );
}
