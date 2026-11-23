---
name: feature-clip
description: Make short silent feature-overview videos (MP4, 1920×1080, ~30–60 s) of a web app (MCApps by default) – real UI screenshots with camera zoom, cursor, click ripples, highlights and Norwegian text, no voice or audio. Each clip is made in one variant – numbered step captions (default), or a persistent step checklist at the side for multi-section tutorials. Checks every caption against the code, writes a storyboard, captures the real app with Playwright, iterates in a live review page where the user leaves notes on frames, then renders. Use when the user wants a feature clip, how-to clip, tutorial video, release-note video, GIF-like walkthrough or short screencast of one feature, even if they only ask for the storyboard first.
---

# Feature clip

Turns "show how feature X works" into a short, silent MP4 with Norwegian on-screen text, in **one** of two variants:

- **captions** (default) – numbered step captions («1 Åpne «Innstillinger» og …»). Enough for most clips.
- **checklist** – a persistent step list on the left that ticks off ✓ as the clip goes, plus captions for tips and
  results. Only for tutorials that clearly have several sections, each with several notes.

Pick the variant at intake and render only that one – never both by assumption. Either way the file is
`<slug>.mp4`: never label the video «sjekkliste»/«checklist» in its file name or title.

This file is the router. Load only what the task needs. MCApps specifics (login, demo data, CSS, gotchas):
`references/mcapps.md`.

## Hard rules

- **No audio; ≤ 60 s by default.** Every scene `"silent": true` with a `duration`; `pnpm budget` must pass. Raise
  `"maxSeconds"` only when the user allows a longer clip – and keep it concise.
- **One variant per clip.** `"variant": "captions"` (default) or `"checklist"` in `video.config.json`. Choose checklist
  only for a tutorial with several clear sections and several notes per section – propose it at intake, the user
  decides. Scene code lives in `scenes/NN-slug.js` (`stepGuide` works for either variant); keep only the HTML wrapper
  of the chosen variant. Both variants only when the user explicitly asks for both (`"variants": [...]`).
- **Calm pace – viewers are not fast.** Cursor moves ≈ 0.8–1.0 s, click ≈ 0.3 s after arrival, captions ≥ 3.5 s.
  Show **every** step of the procedure the clip is about – jump cuts only to skip waiting or repeated work, never
  steps the viewer must do. No side features (e.g. archiving in a batch-edit clip) that viewers may read as required.
  To slow a whole scene: `createDemo(timeScale(1.25, {...}))`.
- **Text standard (department default).** Norwegian bokmål. Captions 48 px, may wrap to two balanced lines (max
  1180 px); with two lines the caption covers the bottom ~230 px – frame the camera so nothing important sits there.
  UI names exactly as on screen in «». One idea per caption, ≤ ~60 characters. Checklist labels ≤ ~22 characters.
  Checklist step labels 30 px (`--checklist-size`). Captions and title/end cards are centred on the full stage in
  both variants – never offset beside the checklist panel; only the camera shifts. No caption that only repeats a visible title. The look is `starter/shared/product.css` – don't restyle per clip.
- **Truth first.** Every caption is checked against the code (fact table with file:line). Nothing that does not exist
  is shown. App bugs found on the way are listed for the team, not worked around silently.
- **Fictional data only.** Invented names, projects, issues; reuse the demo boards (`references/mcapps.md`). Never real
  customers or colleagues without the user's explicit OK.
- **Clean chrome.** Hide dev-only UI (dev banners/footers, «Patch OK» toasts) via `capture.css` / the capture script.
- **Deterministic rendering.** Every frame is a pure function of `t` (`toolkit/README.md` › Deterministic rules).
- **No MP4s while iterating.** Edits are shown in the live review page; render only after the user approves there.

## Workflow

| # | Phase | Output | Checkpoint |
|---|---|---|---|
| 0 | Intake | feature, audience, target length (default 30–45 s), app URL + login, demo board, anything to leave out; variant (captions unless it is a multi-section tutorial) | ask once, in one message |
| 1 | Verify the flow | exact UI strings and click path from the code; fact table caption → file:line; app issues found | – |
| 2 | Storyboard | `storyboard.md` per `references/storyboard-template.md`: beats, seconds, caption per step (+ checklist label for a checklist clip) | **approve** |
| 3 | Capture | `capture/steps.mjs` → `pnpm capture --login` once, then `pnpm capture` → `shots/*.png` + `shared/rects.js` | review shots |
| 4 | Scenes | `scenes/NN-slug.js` + the chosen variant's wrapper; `pnpm contact --all` to check every beat | – |
| 5 | Review | `pnpm review` (or `pnpm review:sjekkliste` for a checklist clip) → user leaves notes → fix notes → repeat | **user approves in review page** |
| 6 | Render | `pnpm final` (budget → voice-meta → the chosen variant rendered and assembled) | user watches the MP4 |
| 7 | Hand-over | MP4 path + duration, deviations from storyboard, app issues (append to the workspace `FOUND-ISSUES.md`), how to re-render | – |

## Project setup

One folder per clip, **outside** the product repo: `<workspace>/feature-videos/<slug>/` with `storyboard.md` and `video/`.

1. Copy `toolkit/` to `video/` **without** `node_modules/`, `examples/` and `starter/`.
2. Copy `toolkit/starter/*` over it (config, `shared/product.css`, `capture/steps.mjs`, `scenes/01-SLUG.*`). Replace
   `SLUG` in file names and contents with the clip slug (kebab-case Norwegian, e.g. `lagre-tabellmal`), and the
   `TITTEL`, `KNAPP`, `VALG` placeholders with real content.
3. `pnpm install`, `pnpm doctor`. Choose the theme (`references/themes.md`) and write the reason in `_theme`.
4. Re-run `pnpm voice-meta` after every `video.config.json` change (it writes `shared/voice.js`, the `VIDEO` config
   the engine reads – needed although nothing is voiced).

More scenes: add `{ id: 2, slug: "…" }` to `scenes` and create `02-slug.js` plus the chosen variant's wrapper (`02-slug.html` or
`02-slug-sjekkliste.html`) the same way. Most clips are one scene with hard cuts between views.

## Captions and checklist from one timeline

`toolkit/starter/scenes/01-SLUG.js` is the pattern. The two calls that make it work (`extras/steps.js`):

```js
const L = clipLayout();                       // reads VARIANT; in "checklist" shifts camera views right of the panel
const V = L.views({                           // write camera views for the captions variant…
  base: CAM_BASE,
  menu: { s: 1.45, cx: 900, cy: 480, checklist: { s: 1.3 } },   // …override where the free area is too narrow
});
// …camera / moves / clicks / highlights / shotSchedule exactly as usual, using V.*…
stepGuide({
  title: "Egne attributter", show: 2.6,       // checklist heading; panel appears after the title card
  steps: [                                    // ONE entry per procedure step, in order
    { t0: 3.0, t1: 7.2, done: 6.9, label: "Åpne «Innstillinger»", caption: "Åpne «Innstillinger» og finn «Egne attributter for saker»" },
    { t0: 7.2, t1: 13.2, label: "Tittel og seksjon", captions: [                  // split one step over several captions
      { t0: 7.4, t1: 11.2, text: "Gi feltet en tittel og en seksjon" },
      { t0: 11.2, t1: 13.2, text: "Et nytt seksjonsnavn lager en ny seksjon" }] },
  ],
  notes: [                                    // tips/results; both variants unless only: "captions" | "checklist"
    { t0: 22.5, t1: 26.5, text: "Legg til flere felt i samme seksjon på samme måte" },
    { t0: 43.0, t1: 45.4, text: "Endringene lagres med en gang", only: "checklist" },
  ],
}),
```

- Captions variant: each step's `caption`/`captions` with badge = step number, plus `notes`.
- Checklist variant: rows from `label`; a row is active from `t0` and gets ✓ at `done` (default `t1`) – set `done` to
  the click that completes the step. Captions show only `notes`. When a step caption carries a tip the checklist
  would lose, add a shorter `only: "checklist"` note for it. Explanations and "repeat for the others" captions
  (anything beyond the step's instruction) belong in `notes`, with `n` for the captions badge – as step captions
  they vanish in the checklist variant and leave seconds with no text.
- Jump cuts over repeated work: one steady highlight across all the cuts (on the fields that change), not one
  short highlight per cut – that reads as flashing.
- Camera: `L.views()` shifts each view right by half the panel (`cx -= 181 / s`), which matched the hand-tuned views
  of the first checklist clip. Check the tightest views in the checklist review page; add `checklist: { s }` overrides
  there. Camera keys written inline (not from `V`) go through `L.view({...})`.
- Cursor, highlights and shots are in page px and need no changes per variant.
- Checklist clips: `video.sjekkliste.json` is **generated** by `pnpm variant` (also by `pnpm review:sjekkliste` and
  `pnpm final`): output `<name>.mp4` (no suffix), clips/stills in `clips-sjekkliste/`, `stills-sjekkliste/`. Don't edit it.
- Stills/contact sheets of the checklist variant: add `--config video.sjekkliste.json`.

## Review loop (no rendering while iterating)

Start the page for the clip's variant in the background and give the user the URL:

- captions: `pnpm review` → http://localhost:4321 (notes in `review/notes.json`)
- checklist: `pnpm review:sjekkliste` → http://localhost:4322 (notes in `review/notes.sjekkliste.json`)

Several clips at once: pass `--port` (one port per clip). The page plays the scenes live from HTML,
reloads on every file change, keeps the playhead, and lets the user click or drag on a frame to leave a note.

When the user says notes are ready, read the notes file (format in the header of `extras/review.mjs`). For each
note with `"status": "open"`: `scene.file` + `t` locate the beat, `point`/`box` are stage px, `element.selector` and
`captions` say what was under the click. Fix the timeline, then set `"status": "fixed"` and append `{ "by": "claude", "text": "<what changed>" }` to `replies`. Leave `done`
notes alone; a reopened note has the user's follow-up as its last reply.

## Building scenes over screenshots

```js
shotLayers([{ id: "board", src: "../shots/board.png" }, { id: "menu", src: "../shots/menu.png" }], RECTS);
createDemo({
  duration: 8, lead: 0,
  camera: [{ t: 0, ...V.base }, { t: 1.2, ...L.view({ s: 1.8, sel: hot("board", "saveBtn"), dx: -200 }) }],
  moves:  [{ t0: 1.0, t1: 1.9, to: { sel: hot("board", "saveBtn") } }],
  clicks: [{ t: 2.2 }],
  highlights: [{ t0: 3.0, t1: 5.5, sel: hot("menu", "saveNew") }],
  states: [
    shotSchedule([{ t: 0, id: "board" }, { t: 2.3, id: "menu", fade: .12 }]),   // UI change right after the click
    stepGuide({ … }),
  ],
});
```

- A click changes the UI ≈ 0.1 s after the press: switch shots at `click + .1`, fade ≤ .15 s (menus), ≈ .2 s (dialogs).
- Typing: shoot the empty field, then `typeText(overlayAt("dialog", "nameInput", "fake-input"), "…", t0, t1, t)`.
  `.fake-input` (Mantine sm), `.fake-md` (Mantine md) and `.fake-ag` (ag-grid filters) are in the standard product.css.
- Camera zoom 1.4–2.0 on small controls. Bow cursor paths around buttons (hover reacts to everything under the cursor).
- Jump cuts between views are fine: hard camera cut (`camCut`), cursor `jump`, new shot – one idea per view.
- Boundaries (multi-scene clips): last frame of scene N = first frame of N+1 – `pnpm check` (skip for intentional cuts).
- Title and end cards: `mount('<div class="stage-layer card">…</div>', "stage")` with `fadeOut`/`fadeIn`.

## Reference files

`references/mcapps.md` (MCApps capture facts and gotchas) · `references/storyboard-template.md` ·
`references/lessons.md` (incl. client feedback) · `references/themes.md` · `references/ui-routes.md` (when the real
app cannot be used) · `references/look-and-feel.md` · `references/clip-contract.md` · `toolkit/README.md` (layout,
config, commands) · `toolkit/ENGINE-API.md` (every engine global) · `toolkit/TROUBLESHOOTING.md` ·
`toolkit/extras/steps.js`, `toolkit/extras/capture.mjs`, `toolkit/extras/review.mjs`, `toolkit/extras/final.mjs`
(headers document the API) · `tools/html-css-svg.md` · `tools/gsap.md` · `tools/ffmpeg.md`.

Voice, TTS, Remotion and Three.js parts of the original skill were removed on purpose; ignore mentions of
`cue()`, TTS/alignment commands or voice files in the inherited references – silent scenes use fixed times.
