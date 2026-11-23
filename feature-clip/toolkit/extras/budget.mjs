// Checks a feature clip before rendering: every scene silent, total length ≤ maxSeconds (default 60).
//
//   node extras/budget.mjs [--config <file>]      (pnpm budget)
//
// Prints one line per scene and the total; exits 1 when a scene is voiced or the total is too long.
// Config: "maxSeconds" (default 60). Silent scene length = its "duration" (render default 3 s).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../tools/config.mjs";

const toolkit = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const i = args.indexOf("--config");
const cfg = loadConfig({ explicit: i === -1 ? null : args[i + 1], start: process.cwd(), fallbackRoot: toolkit });
const max = cfg.maxSeconds ?? 60;

let total = 0, errors = 0;
for (const s of cfg.sceneList) {
  const voiced = !(s.silent === true || s.audio === "none" || s.audio === null) || s.text;
  const d = s.duration ?? 3;
  total += d;
  console.log(`${s.key}  ${String(d).padStart(5)} s  ${s.slug}${voiced ? "   ✗ ikke stille: sett \"silent\": true" : ""}`);
  if (voiced) errors++;
}
const over = total > max;
console.log(`\nTotalt ${total.toFixed(1)} s av maks ${max} s${over ? "  ✗ for lang" : "  ✓"}`);
if (over || errors) process.exit(1);
