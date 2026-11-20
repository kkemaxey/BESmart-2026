"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";

const HOLD_MS = 1200;

/**
 * Tier-3 is destructive, so it is deliberately slower than everything else:
 * press and hold (pointer or Space/Enter). ⇧⌥E moves focus here.
 */
export function EmergencyShed() {
  const [holding, setHolding] = useState(false);
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && e.code === "KeyE") {
        e.preventDefault();
        btn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const begin = () => {
    if (armed) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      setArmed(true);
    }, HOLD_MS);
  };
  const cancel = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        ref={btn}
        type="button"
        aria-keyshortcuts="Shift+Alt+E"
        aria-describedby="shed-hint"
        onPointerDown={begin}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            begin();
          }
        }}
        onKeyUp={cancel}
        onClick={() => armed && setArmed(false)}
        className="btn text-crit-ink relative h-10 overflow-hidden border-[color-mix(in_oklch,var(--color-crit)_55%,transparent)] bg-[color-mix(in_oklch,var(--color-crit)_14%,transparent)] hover:bg-[color-mix(in_oklch,var(--color-crit)_22%,transparent)]!"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-[color-mix(in_oklch,var(--color-crit)_40%,transparent)]"
          style={{
            width: holding || armed ? "100%" : "0%",
            transition: holding ? `width ${HOLD_MS}ms linear` : "width 180ms var(--ease-out)",
          }}
        />
        <span className="relative flex items-center gap-2 font-semibold">
          <Icon name="alert" size={15} weight={2} />
          {armed ? "Tier-3 staged · click to clear" : "Emergency shed · Tier-3"}
        </span>
        <kbd className="num relative rounded-[4px] bg-[color-mix(in_oklch,var(--color-crit)_30%,transparent)] px-1.5 py-0.5 text-[10.5px]">
          ⇧⌥E
        </kbd>
      </button>
      <p id="shed-hint" className="text-ink-3 text-[11.5px]" aria-live="polite">
        {armed
          ? "Staged in simulation only — no signal sent to the grid."
          : "Press and hold to stage"}
      </p>
    </div>
  );
}
