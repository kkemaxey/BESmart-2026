"use client";

import { areaPath, linePath, linear } from "@/lib/chart-math";
import { useWidth } from "./useWidth";

export function Sparkline({
  data,
  color,
  height = 26,
  min,
  max,
}: {
  data: number[];
  color: string;
  height?: number;
  min?: number;
  max?: number;
}) {
  const [ref, w] = useWidth<HTMLDivElement>(220);
  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const x = linear(0, data.length - 1, 1, w - 1);
  const y = linear(lo, hi, height - 2, 2);
  const pts = data.map((v, i) => [x(i), y(v)] as [number, number]);
  return (
    <div ref={ref} className="w-full min-w-0 [contain:inline-size]" aria-hidden="true">
      <svg width={w} height={height} className="block overflow-visible">
        <path d={areaPath(pts, height)} fill={color} opacity={0.14} />
        <path
          d={linePath(pts)}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
