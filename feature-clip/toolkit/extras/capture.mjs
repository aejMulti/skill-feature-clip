// Captures settled states of the real app as screenshots (UI route 1) for silent feature clips.
//
//   node extras/capture.mjs [--config <file>] --login    (pnpm capture --login)  headed window: log in by hand once
//   node extras/capture.mjs [--config <file>]            (pnpm capture)          runs the step script headless
//   node extras/capture.mjs ... --headed                                         same, but visible (debugging)
//
// video.config.json:
//   "capture": {
//     "baseUrl": "http://localhost:3000",
//     "storageState": "capture/auth.json",        // written by --login, git-ignored (contains session cookies)
//     "loggedIn": "#some-selector-only-after-login",   // --login waits for this (5 min), then saves the session
//     "steps": "capture/steps.mjs",               // default export async ({ page, shot, settle, baseUrl }) => {}
//     "scale": 2,                                 // deviceScaleFactor: sharp when the camera zooms in
//     "css": "..."                                // optional extra CSS injected on every page (e.g. hide a banner)
//   }
// Viewport = config "page" size (default 1670×940), so a shot is exactly #page in the scenes.
//
// shot(id, hots = {}) writes shots/<id>.png and records hotspot rects ({ name: selector }) into shots/rects.json
// and shared/rects.js (const RECTS = …), in page px. Animations and transitions are disabled; settle() waits for
// the network to go idle, fonts and two animation frames.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { browserCandidates } from "../tools/browser.mjs";
import { loadConfig } from "../tools/config.mjs";

const toolkit = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const ci = args.indexOf("--config");
const cfg = loadConfig({ explicit: ci === -1 ? null : args[ci + 1], start: process.cwd(), fallbackRoot: toolkit });
const cap = { scale: 2, storageState: "capture/auth.json", steps: "capture/steps.mjs", ...(cfg.capture ?? {}) };
if (!cap.baseUrl) throw new Error('video.config.json mangler "capture.baseUrl"');
const login = args.includes("--login");
const headed = login || args.includes("--headed");
const statePath = cfg.abs(cap.storageState);

const NO_MOTION = `*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}
::-webkit-scrollbar{display:none} ${cap.css ?? ""}`;

// --login uses a persistent profile (capture/profile, git-ignored) so an SSO/MFA sign-in survives retries and
// "stay signed in" works; the capture run itself uses a clean context with only the saved storageState.
const profileDir = cfg.abs(cap.profile ?? "capture/profile");

async function launch() {
  const failures = [];
  for (const { label, ...opts } of browserCandidates(cfg)) {
    try {
      if (login) {
        const context = await chromium.launchPersistentContext(profileDir, { ...opts, headless: false, viewport: null });
        return { context, close: () => context.close() };
      }
      const browser = await chromium.launch({ ...opts, headless: !headed });
      const context = await browser.newContext({
        viewport: { width: cfg.page.w, height: cfg.page.h },
        deviceScaleFactor: cap.scale,
        reducedMotion: "reduce",
        storageState: existsSync(statePath) ? statePath : undefined,
      });
      return { context, close: () => browser.close() };
    } catch (e) { failures.push(`${label}: ${String(e?.message ?? e).split("\n")[0]}`); }
  }
  throw new Error(`Kunne ikke starte nettleseren:\n  ${failures.join("\n  ")}`);
}

const { context, close } = await launch();
try {
  if (!login) {
    await context.addInitScript((css) => {
      const add = () => { const s = document.createElement("style"); s.textContent = css; document.documentElement.appendChild(s); };
      if (document.documentElement) add(); else document.addEventListener("DOMContentLoaded", add);
    }, NO_MOTION);
  }
  const page = context.pages()[0] ?? await context.newPage();

  if (login) {
    if (!cap.loggedIn) throw new Error('--login trenger "capture.loggedIn" (en selector som bare finnes etter innlogging)');
    const minutes = Number(cap.loginMinutes ?? 10);
    await page.goto(cap.baseUrl);
    console.log(`Logg inn i nettleservinduet (profil ${path.relative(process.cwd(), profileDir)}). Venter på «${cap.loggedIn}» (maks ${minutes} min) …`);
    // Any tab/page in the window counts (SSO may open popups or navigate several times).
    await page.waitForSelector(cap.loggedIn, { timeout: minutes * 60_000 });
    mkdirSync(path.dirname(statePath), { recursive: true });
    await context.storageState({ path: statePath });
    console.log(`✓ Innlogging lagret i ${path.relative(process.cwd(), statePath)}`);
  } else {
    if (!existsSync(statePath)) console.warn(`Advarsel: ${cap.storageState} finnes ikke – kjør først med --login`);
    const shotsDir = cfg.abs("shots");
    mkdirSync(shotsDir, { recursive: true });
    const rectsFile = path.join(shotsDir, "rects.json");
    const rects = existsSync(rectsFile) ? JSON.parse(readFileSync(rectsFile, "utf8")) : {};

    const settle = async (ms = 250) => {
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.waitForTimeout(ms);
    };
    const shot = async (id, hots = {}, { mouse = "park" } = {}) => {
      if (mouse === "park") await page.mouse.move(cfg.page.w - 2, cfg.page.h - 2);   // no hover state in the shot
      // No red spell-check squiggles in shots (Chromium marks Norwegian text in inputs).
      await page.evaluate(() => document.querySelectorAll("input, textarea, [contenteditable]").forEach((e) => { e.spellcheck = false; }));
      await settle();
      rects[id] = {};
      for (const [name, sel] of Object.entries(hots)) {
        const loc = page.locator(sel).first();
        const box = await loc.boundingBox().catch(() => null);
        if (!box) { console.warn(`  ✗ ${id}: fant ikke «${name}» (${sel})`); continue; }
        rects[id][name] = { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
      }
      await page.screenshot({ path: path.join(shotsDir, `${id}.png`) });
      console.log(`✓ shots/${id}.png  ${Object.keys(rects[id]).join(", ")}`);
    };

    const steps = (await import(pathToFileURL(cfg.abs(cap.steps)).href)).default;
    await steps({ page, shot, settle, baseUrl: cap.baseUrl });

    writeFileSync(rectsFile, JSON.stringify(rects, null, 2) + "\n");
    const shared = cfg.abs("shared");
    mkdirSync(shared, { recursive: true });
    writeFileSync(path.join(shared, "rects.js"),
      `// GENERATED by extras/capture.mjs – hotspot rects (page px) per shot.\nconst RECTS = ${JSON.stringify(rects, null, 2)};\n`);
    console.log("✓ shots/rects.json + shared/rects.js");
  }
} finally {
  await close();
}
