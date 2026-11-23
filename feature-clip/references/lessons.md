# Lessons from earlier productions

## Silent MCApps clips (Nov 2026, six clips)

Client feedback on the first round (2026-11-19), now built into the hard rules:
- **"Gikk litt fort"** – too fast. Calm cursor (0.8–1.0 s), captions ≥ 3.5 s; `timeScale(1.25, …)` slows a finished scene.
- **"Vis hvert steg"** – show every step, not the first step and then a jump to the result.
- **Don't mix in side actions.** Archiving shown in a batch-edit clip made archiving look like a required step.

Process lessons:
- Iterate in the live review page with notes on frames, not by re-rendering MP4s – much faster round trips.
- A checklist variant made later meant copying the whole scene and hand-shifting every camera view; the timeline is
  now written once (`clipLayout` + `stepGuide`) so either variant can be chosen.
- Rendering both variants for every clip was wasted work (2026-11-20): pick one. Captions is the default; the
  checklist is for tutorials with several clear sections and several notes each. Never put «sjekkliste» in the
  file name or title.
- Checklist text (2026-11-20): labels 30 px; captions and title/end cards centred on the full stage, not beside the
  panel. Explanations written as step captions vanished in the checklist variant (seconds with no text) – use notes.
  One short highlight per jump cut read as flashing – use one highlight across the cuts.
- Fix app bugs and recapture rather than working around them; log them in `FOUND-ISSUES.md` as you go.
- Copying a clip folder including `node_modules` breaks `pnpm <script>` (dependency check) – copy without it.

## Narrated tender video (earlier, original skill)

From an earlier production: a 3:45 narrated feature-documentation video for a tender, 16 scenes,
recreated UI with fictional data, ~75 min wall clock with parallel agents.

## Where the time went
| Phase | Time | Cause | Fix now in place |
|---|---|---|---|
| Foundation | 21 min | generic engine written from scratch | toolkit reused |
| Scene agents (3 parallel) | 37 min | each re-read product source; many full renders; each worked around the same engine bug | stills-only iteration, central bug fixes, fixed engine |
| Style correction + re-render all | 15 min | colour differences found after scenes were done | design lock in phase 4 |
| Stall at the end | 5 min | font check failed on a text-less scene; render delegated to an agent | explicit font load; render from main session |

## Pitfalls
- **Server vs UI truth.** The UI filtered a user's data correctly, but the server still allowed
  access to everything in the organisation. Verify enforcement server-side before saying "the user
  only has access to …".
- **Stylesheet order.** Design-library variables said one text colour; a later global stylesheet
  overrode it for `body`, while form controls and muted text still used the library variable.
  Resolve which rule wins per element.
- **Hidden targets.** Cursor/camera targets inside a closed dialog or a removed row measured as (0,0)
  → fixed in the engine (cached targets). `display:none` crossfades break measuring → use opacity.
- **Hover** reacts to anything the cursor passes over; bow cursor paths around buttons.
- **Fonts from the network** fail intermittently in headless rendering → local fonts.
- **Hard-coded UI values** (a column that always showed the same text regardless of data)
  contradict the story; list them as must-fix and show the corrected UI only if the fix will ship.
- **Wrong texts in real assets** (an outdated e-mail subject, i18n typos, rich-text markers that do
  not match their components) – show corrected text or crop, and list the fix.
- **Destructive actions without confirmation** – never click them unless the scene is about them.
- **Third-party pages** (identity-provider login) – neutral stand-in only.
- **Voice text drift.** The voiced text differed slightly from the storyboard; agents must follow the
  audio text and update on-screen summaries accordingly.
- **Every video looked the same.** The engine's overlay defaults (orange frame, arrow cursor, same
  easing) were used in every production → themes, chosen per video (`references/themes.md`).
- **Mechanical steps in agents** add latency and can stall; run render/assemble as plain commands.
