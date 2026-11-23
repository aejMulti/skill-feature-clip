---
name: status
description: What the skill's toolkit provides and verifies, the licence rules that still apply, and the sources for dated facts.
metadata:
  tags: status, licence, verification, sources
---
# Status, licences and sources

This skill makes short silent feature clips. The voice, TTS, Remotion, Motion Canvas and Three.js parts of the original
skill were removed, and their status notes were dropped from this file. Dated facts (licences) must be re-checked when they matter.

## What is built

- Deterministic DOM engine (`toolkit/engine.js`, `base.css`) rendered frame by frame by `render.mjs`; `assemble.mjs` joins clips.
- Bundled ffmpeg: `ffmpeg-static` is a dependency; `toolkit/tools/ffbin.mjs` resolves the binary
  (`FFMPEG_PATH` > bundled > `ffmpeg` on PATH) and replaces ffprobe. Setup is Node 22+, pnpm, an installed
  Edge/Chrome/Chromium and `pnpm install`.
- `toolkit/tools/browser.mjs`: the configured channel is tried first, then msedge → chrome → chromium; an explicit
  `CHROME_PATH` / `browser.executablePath` never falls back. `pnpm doctor` runs the same checks plus Node version and ffmpeg.
- `assemble.mjs`: silence inputs for audio-less clips come after all clip inputs; normalisation is skipped with a note when
  every clip is silent; the output is capped at the clips' total frames ÷ `fps`.
- Themes: `theme` in `video.config.json` (presets `frame`, `calm`, `spotlight`, `energetic`, `minimal`); see `references/themes.md`.
- Contact sheets: `pnpm contact <scene>` writes one labelled still per click, camera key, highlight start and move end,
  plus the first and last frame; boundary checks via `pnpm check`.
- `pnpm capture` (`toolkit/extras/capture.mjs`) screenshots the real app; `pnpm budget` (`toolkit/extras/budget.mjs`)
  checks every scene is silent and the total is ≤ 60 s; `toolkit/extras/steps.js` draws the step captions.
- One variant per clip (`"variant"` in the config: `captions` default, `checklist` for multi-section tutorials), both
  from the same timeline code: `clipLayout()` / `stepGuide()` in `toolkit/extras/steps.js`; `pnpm variant`
  (`extras/variant.mjs`) generates `video.sjekkliste.json` for checklist clips (output `<name>.mp4`, no suffix);
  `pnpm final` (`extras/final.mjs`) renders and assembles the chosen variant; `pnpm review:sjekkliste` reviews it.
- `pnpm review` (`toolkit/extras/review.mjs` + `review.html`): live review page with notes on frames.
- `toolkit/starter/`: MCApps clip skeleton – config, standard `product.css`, capture script, scene with captions + checklist wrappers.
- `pnpm links` validates Markdown links, backtick file paths and `pnpm <script>` mentions; `pnpm test` runs `tools/*.test.mjs`.

## Gates (run before handing over a change to the skill)

- `cd toolkit && pnpm install && pnpm doctor && pnpm example && pnpm test && pnpm links` runs clean (`pnpm example` first: the SRT test reads its output).
- No design-library names (Mantine, Bootstrap) outside historical notes.

## Open points

- `-t` in assemble assumes every clip is at `cfg.fps`, which `render.mjs` guarantees and the clip contract requires.
- Double encoding: clips at CRF 14, assemble at CRF 16. `-c:v copy` would need the concat demuxer instead of the concat filter.
- `cue.test.mjs` cuts `makeCue` out of `engine.js` as text (`function makeCue(` in column 0 up to a closing brace line). Fragile, but fails loudly.
- Durations from `ffmpeg -i` have 10 ms resolution; under a third of a frame at 30 fps.
- Offline install (`FFMPEG_BIN` or `FFMPEG_BINARIES_URL`) is documented but untried.
- If `video/` becomes a package inside a parent pnpm workspace, `allowBuilds`/`onlyBuiltDependencies` must move to the workspace root.
- Generated files (`node_modules/`, `clips/`, `stills/`, `*.mp4`, `shared/`) are listed in `toolkit/.gitignore`.
- Optional: crossfade between clips in assemble (`xfade`).

## Licences (not legal advice)

| Tool | Licence | Rule that matters here |
|---|---|---|
| GSAP incl. all plugins | GSAP Standard License | free for commercial use; AI-generated code explicitly allowed; not for no-code tools competing with Webflow |
| Motion | MIT | free |
| Playwright | Apache-2.0 | free |
| ffmpeg (ffmpeg-static build) | GPL (libx264) | run as a separate process, never linked or redistributed |
| Inter | SIL OFL 1.1 | in the repo with its licence file |

The toolkit engine (Playwright + ffmpeg + own code) has no usage restriction.

## Verified API facts

- GSAP: `timeline.pause()`, `seek()`, `progress()`, `time()` are documented; `gsap.updateRoot(t)` after
  `gsap.ticker.remove(gsap.updateRoot)` gives a fully manual clock.
- Motion: `animate()` controls expose `pause()` and a `time` setter; `skipAnimations` jumps to end values.

## Sources

- GSAP licence: https://gsap.com/standard-license/ · Timeline: https://gsap.com/docs/v3/GSAP/Timeline/ · ticker: https://gsap.com/docs/v3/GSAP/gsap.ticker/ · `updateRoot`: https://gsap.com/docs/v3/GSAP/gsap.updateRoot()
- Motion licence: https://github.com/motiondivision/motion/blob/main/LICENSE.md · `animate()` controls: https://motion.dev/docs/animate
- ffmpeg: https://ffmpeg.org/legal.html · Playwright: https://github.com/microsoft/playwright/blob/main/LICENSE · Playwright docker: https://playwright.dev/docs/docker
