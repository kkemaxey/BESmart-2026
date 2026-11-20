export function linear(d0: number, d1: number, r0: number, r1: number) {
  const k = (r1 - r0) / (d1 - d0 || 1);
  return (v: number) => r0 + (v - d0) * k;
}

export function linePath(pts: [number, number][]) {
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
}

export function areaPath(pts: [number, number][], baseY: number) {
  if (!pts.length) return "";
  return `${linePath(pts)}L${pts[pts.length - 1][0].toFixed(1)},${baseY}L${pts[0][0].toFixed(1)},${baseY}Z`;
}

/** Deterministic PRNG so mock telemetry renders identically on server and client. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
