"use client";

import { useId, useState, type ReactNode } from "react";

import { Icon } from "./Icon";

export function Collapsible({
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  title: string;
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border-line bg-surface-1 rounded-[16px] border">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="focus-ring hover:bg-surface-2/60 flex min-h-[52px] w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-colors duration-150"
        >
          <span className="text-[15px] font-semibold">{title}</span>
          <span className="text-ink-3 min-w-0 flex-1 truncate text-[13px]">{summary}</span>
          <Icon
            name="chevron"
            className={`text-ink-3 shrink-0 transition-transform duration-200 ease-(--ease-out) ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      <div id={id} className="disclosure" data-open={open}>
        <div>
          <div className="px-4 pt-1 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
