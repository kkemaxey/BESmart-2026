"use client";

import type { KeyboardEvent } from "react";

export type SegOption<T extends string | number> = { value: T; label: string; hint?: string };

/** Radio-group segmented control. Bold width reserved so selection never shifts layout. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
  size = "md",
  mono = false,
}: {
  label: string;
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  mono?: boolean;
}) {
  const idx = options.findIndex((o) => o.value === value);
  function onKey(e: KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (idx + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    const el = (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>("button")[next];
    el?.focus();
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            disabled={disabled}
            title={o.hint}
            data-text={o.label}
            onClick={() => onChange(o.value)}
            className={`tab focus-ring place-items-center rounded-[8px] border transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
              size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-9 px-3.5 text-[13px]"
            } ${mono ? "num" : ""} ${
              on
                ? "border-accent/55 bg-accent/15 text-ink-1 font-semibold"
                : "border-line-strong bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink-2"
            }`}
          >
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
