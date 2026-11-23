# Troubleshooting

Messages printed by `render.mjs`, `assemble.mjs` and `pnpm capture`, with cause and fix. Lint and boundary output is explained in [README.md](README.md) › Rendering internals; the engine functions named below are in [ENGINE-API.md](ENGINE-API.md).

| Symptom | Cause and fix |
|---|---|
| `window.DEMO mangler etter 10 s` | `createDemo` did not run within the 10 s wait: a script error before it (see `sidefeil:` above it) – a missing script, a wrong path, a redeclared engine global (`const FPS`, `const $`) – or asynchronous loading that never finished |
| `fonter ble ikke lastet – mangler @font-face for X` | `fonts.css` not linked, or a family in `fonts` without local files |
| `… ikke synlig ved t=…, målt ved t=…` | target hidden when it is used; set `at` to a time it is visible, or fix the timing |
| `… fant ikke elementet på noe tidspunkt` | wrong selector, or the element is `display: none` all the time |
| `Fant ikke <sel>` / `Elementet er skjult` | `live` target / `stagePoint` on a missing or hidden element |
| cursor or camera jumps to a corner | measured while hidden; use cached targets (default) instead of `live` |
| crossfaded layer not measurable | `display: none` removes the box; use `crossfade`/`setVisible` or `{ keepLayout: true }` |
| hover flickers on the cursor path | hover reacts to everything under the cursor; bow the move (`bow`) around buttons or `hover: false` |
| `cue(): fant ikke «…»` | phrase not in the voice text (voice text drift); copy words from the audio text |
| `Scene n har ingen speakertekst` | `cue` called in a silent scene; use fixed times |
| `Advarsel: N bilder i klippet, forventet M` | encoder or concat problem; re-render the scene |
| `Kunne ikke starte nettleseren. Prøvde: …` | no Chromium-family browser could be launched (the message lists each candidate and per-OS install hints). macOS: `brew install --cask google-chrome` (or `microsoft-edge`); Debian/Ubuntu: `sudo apt install chromium` or Google's Chrome .deb; Windows: Edge is pre-installed. Or `CHROME_PATH=/path/to/binary`. `pnpm doctor` shows the same check without rendering |
| `lydnormalisering hoppet over` (assemble) | every clip is silent or the loudness could not be measured; the output is still written with a silent track. Expected for videos without voice |
| `Fant ikke ffmpeg (…)` | `pnpm install` did not fetch ffmpeg-static (build script not approved – check `pnpm-workspace.yaml` – or no network: use `FFMPEG_BIN`), or `FFMPEG_PATH` points to a missing file |
| lint `… er midt i en animasjon` at first/last frame | a fade/move overlaps the cut; end it a frame before |
| boundary `AVVIK` | end state of N ≠ start state of N+1 (page state, modal, camera, cursor); compare with the boundary table |
| audio not found (`Fant ikke lydfilen`) | `audioSrc` resolves against the scene file; for http(s) scenes against the scenes folder, then by file name in `dirs.audio` (the message lists the paths tried). `Lydfilen må være en lokal fil`: an http(s) `audioSrc` – use a relative path |
| caption visible in the last frame (lint / boundary `AVVIK` at the bottom) | `captionTrack` `until` is later than the voice (or past the clip); leave it at the default `S.lead + S.audioDuration` or set it before the last frame |
| wrong clip length | `duration` not from `sceneInfo` (voice changed: run `pnpm voice-meta`), or `lead`/`tail` not passed |
| `pnpm <script>` fails with a dependency check in a copied clip folder | `node_modules` was copied along with the project; delete it and run `pnpm install`, or run the script with node directly (`node extras/review.mjs`, `node render.mjs --all`) |
| checklist variant: seconds with no text | the explanation is a step caption (captions variant only) – move it to `notes` with `n` |
| highlight flashes during jump cuts | one `light()` per cut – use one highlight spanning all the cuts |
| checklist variant: camera crops content under the panel | a camera key bypasses `L.view()`/`L.views()`; or the zoom is too tight for the free area – add `checklist: { s: … }` to that view |
| both review pages show the same notes | run the checklist review via `pnpm review:sjekkliste` (own notes file); a second `pnpm review` without `--config` shares `review/notes.json` |
