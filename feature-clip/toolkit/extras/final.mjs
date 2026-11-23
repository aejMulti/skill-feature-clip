// Final render of a clip: the clip's chosen variant, one command. Run from the clip's video/ folder once the review is approved.
//
//   node extras/final.mjs [--only captions|checklist] [--jobs 4] [--check] [--copy <dir>]      (pnpm final)
//
// Steps: budget → voice-meta → variant config (extras/variant.mjs) → per variant: render --all → assemble.
//   --check     also runs the boundary check on the rendered clips (skip for clips with intentional jump cuts – it reports them)
//   --copy dir  copies each finished MP4 to dir (e.g. ../../output)
// The variant comes from "variant" in video.config.json: "captions" (default) or "checklist". Legacy "variants": [...]
// configs still work; both are rendered only when a config lists both on explicit request.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1]; };
const jobs = opt("--jobs") ?? "4";
const only = opt("--only");
const copyTo = opt("--copy");
const check = args.includes("--check");

const run = (script, ...a) => {
  console.log(`\n▶ node ${script} ${a.join(" ")}`);
  const r = spawnSync(process.execPath, [path.join(root, script), ...a], { stdio: "inherit", cwd: process.cwd() });
  if (r.status !== 0) { console.error(`✗ ${script} feilet (exit ${r.status})`); process.exit(r.status ?? 1); }
};

const mainCfg = path.resolve("video.config.json");
if (!existsSync(mainCfg)) throw new Error("Kjør fra klippets video/-mappe (fant ikke video.config.json)");
const raw = JSON.parse(readFileSync(mainCfg, "utf8"));
const variants = (raw.variant ? [raw.variant] : (raw.variants ?? ["captions"])).filter((v) => !only || v === only);
const configs = { captions: "video.config.json", checklist: "video.sjekkliste.json" };

run("extras/budget.mjs");
run("tools/voice-meta.mjs");
if (variants.includes("checklist")) run("extras/variant.mjs");

const done = [];
for (const v of variants) {
  const cfg = configs[v];
  if (!cfg) throw new Error(`Ukjent variant «${v}» (bruk captions eller checklist)`);
  console.log(`\n===== ${v} (${cfg})`);
  run("render.mjs", "--all", "--jobs", jobs, "--config", cfg);
  if (check) {
    const r = spawnSync(process.execPath, [path.join(root, "render.mjs"), "--check-boundaries", "--clips", "--config", cfg], { stdio: "inherit" });
    if (r.status !== 0) console.warn("⚠ Grensesjekken fant forskjeller – greit for bevisste hoppklipp, ellers rett opp.");
  }
  run("assemble.mjs", "--config", cfg);
  const c = JSON.parse(readFileSync(cfg, "utf8"));
  const mp4 = path.resolve(c.output ?? `${c.name}.mp4`);
  done.push(mp4);
  if (copyTo) {
    mkdirSync(copyTo, { recursive: true });
    copyFileSync(mp4, path.join(copyTo, path.basename(mp4)));
    console.log(`Kopierte til ${path.join(copyTo, path.basename(mp4))}`);
  }
}
console.log(`\nFerdig:\n${done.map((f) => "  " + f).join("\n")}`);
