"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Grid & Cluster Overview" },
  { href: "/dispatch", label: "Dispatch Studio" },
  { href: "/forecast", label: "48-h Forecast & Carbon" },
  { href: "/facility", label: "Facility → Silicon" },
];

export function TabNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="-mb-px flex [scrollbar-width:none] gap-6 overflow-x-auto max-sm:gap-5"
    >
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            data-text={t.label}
            className={`tab focus-ring relative shrink-0 rounded-sm py-3.5 text-sm whitespace-nowrap transition-colors duration-150 ${
              active ? "text-ink-1 font-semibold" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            <span>{t.label}</span>
            <span
              aria-hidden="true"
              className={`bg-accent absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-[opacity,transform] duration-200 ease-(--ease-out) ${
                active ? "scale-x-100 opacity-100" : "scale-x-50 opacity-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
