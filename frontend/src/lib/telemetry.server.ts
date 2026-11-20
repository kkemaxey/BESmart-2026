import { readFileSync } from "node:fs";
import path from "node:path";

import { parseCsv, type Row } from "./telemetry";

/** Reads the bundled CSV at prerender time; the page ships as static HTML. */
export function loadTelemetry(): Row[] {
  const file = path.join(process.cwd(), "src/data/telemetry.csv");
  return parseCsv(readFileSync(file, "utf8"));
}
