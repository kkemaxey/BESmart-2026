"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";

type Effect = { good: boolean; text: string };
const SHIFTS: {
  id: string;
  title: string;
  why: string;
  cta: string;
  done: string;
  effects: Effect[];
}[] = [
  {
    id: "resume",
    title: "Shift llm-pt-7b3 resume to 01:00–07:00",
    why: "Avoids Fri 12:00–18:00 congestion peak",
    cta: "Accept",
    done: "Accepted",
    effects: [
      { good: true, text: "Saves $41.2k" },
      { good: true, text: "−18.4 t CO₂" },
    ],
  },
  {
    id: "precheckpoint",
    title: "Pre-checkpoint P1 runs at 13:30 Fri",
    why: "Dispatch probability 74% in 14:00 window",
    cta: "Schedule",
    done: "Scheduled",
    effects: [
      { good: true, text: "0 hours lost" },
      { good: false, text: "38 s storage I/O" },
    ],
  },
  {
    id: "hold",
    title: "Hold rlhf-sweep-12 in GA; do not migrate",
    why: "US-EAST-SERC marginal is 612 gCO₂/kWh",
    cta: "Apply",
    done: "Applied",
    effects: [
      { good: false, text: "Costs $2.1k more" },
      { good: true, text: "−6.3 t CO₂" },
    ],
  },
  {
    id: "cdu",
    title: "Raise CDU loop B setpoint margin",
    why: "Wet-bulb forecast 83.8 °F at 15:00 Fri",
    cta: "Review",
    done: "In review",
    effects: [
      { good: true, text: "+6% cooling headroom" },
      { good: false, text: "PUE +0.01" },
    ],
  },
];

export function ShiftList() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const pending = SHIFTS.length - done.size;
  return (
    <section className="panel flex flex-col">
      <div className="px-1.5 pt-1 pb-3">
        <h2 className="panel-title">Recommended scheduling shifts</h2>
        <p className="text-ink-3 mt-1 text-[13px]">
          <span className="num">{pending}</span> pending · <span className="text-sage">✓ gain</span>{" "}
          · <span className="text-crit-ink">− trade-off</span>
        </p>
      </div>
      <ul className="divide-line flex flex-col divide-y">
        {SHIFTS.map((s) => {
          const ok = done.has(s.id);
          return (
            <li key={s.id} className="flex items-center gap-3 py-3 pr-1 pl-1.5">
              <span
                className="w-[3px] self-stretch rounded-full transition-colors duration-200"
                style={{ background: ok ? "var(--color-sage)" : "var(--color-power)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="clamp-2 text-[14px] font-semibold">{s.title}</p>
                <p className="text-ink-3 mt-0.5 text-[12.5px]">{s.why}</p>
                <p className="num mt-1 flex flex-wrap gap-x-3 text-[12px]">
                  {s.effects.map((e) => (
                    <span key={e.text} className={e.good ? "text-sage" : "text-crit-ink"}>
                      {e.good ? "✓" : "−"} {e.text}
                    </span>
                  ))}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm min-w-[92px]"
                aria-pressed={ok}
                onClick={() =>
                  setDone((d) => {
                    const n = new Set(d);
                    if (n.has(s.id)) n.delete(s.id);
                    else n.add(s.id);
                    return n;
                  })
                }
              >
                <span className="icon-swap">
                  <Icon name="check" size={14} weight={2} data-shown={ok} className="text-sage" />
                </span>
                <span>{ok ? s.done : s.cta}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
