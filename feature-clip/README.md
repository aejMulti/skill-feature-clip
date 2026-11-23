# Feature clip – user guide

Short, silent feature-overview videos (1920×1080 MP4, ~30–60 s) of MCApps or another web app: real screenshots,
camera zoom, cursor, click ripples, highlights and Norwegian on-screen text. No voice, no audio.

Each clip is made in **one** variant, chosen when you order it:

| Variant | Use for | Looks like |
|---|---|---|
| Captions (default) | most clips | numbered step captions, one step at a time |
| Checklist | tutorials with several clear sections, each with several notes | a step list on the left that ticks off ✓ as the clip goes; captions for tips |

The file is `<slug>.mp4` either way.

Agent instructions: [SKILL.md](SKILL.md). Technical reference: [toolkit/README.md](toolkit/README.md).

## Install

Requirements: Node 22+, pnpm, Edge or Chrome (Edge is default on Windows).

1. Clone https://github.com/aejMulti/skill-feature-clip and link or copy its `feature-clip` folder to `~/.claude/skills/feature-clip`
   (Windows: `C:\Users\<you>\.claude\skills\feature-clip`) – see the repo README.
2. Optional check: in `toolkit/`, run `pnpm install`, `pnpm doctor`, `pnpm example` (renders `toolkit/examples/example.mp4`).
3. Restart Claude Code; `/feature-clip` is then available, and the skill also triggers on requests like the one below.

## Ordering a clip

> Lag et feature-klipp som viser hvordan man lagrer en tabellmal i MCApps. Målgruppe: prosjektledere. Ca. 40 sekunder.

Have MCApps running locally (`http://localhost:3000`) with demo data. What happens:

1. **Storyboard** – the agent reads the code, checks every caption against it, and writes `storyboard.md`
   (steps, timing, caption per step, app bugs found). You approve it.
2. **Capture** – a browser opens once; log in with Entra. Screenshots are then taken automatically.
3. **Review** – a local page opens (:4321; :4322 for a checklist clip). Scrub the timeline, click or drag on
   a frame and type a note («for fort her», «zoom inn på knappen»). Tell the agent "notes are ready"; it fixes them
   and answers each note in the page. Repeat until you're happy. Nothing is rendered in this phase.
4. **Render** – `pnpm final` renders the MP4. You get the paths, durations and a list of app issues found.

Clips live outside the product repo, e.g. `<workspace>/feature-videos/<slug>/video/`.

## Department defaults

Norwegian bokmål · captions 48 px (wrap to two lines) · MCApps blue look (`toolkit/starter/shared/product.css`) ·
calm pace (every step shown, no side actions) · ≤ 60 s unless you ask for longer · fictional demo data only ·
captions variant (checklist only for multi-section tutorials). Change a default for one clip by saying so when you order it; change it for everyone in this repo.

## Re-rendering

From the clip's `video/` folder:

| Task | Command |
|---|---|
| new screenshots after an app change | `pnpm capture` |
| final | `pnpm final` (`--copy ../../output` to collect) |
| one scene | `pnpm render scenes/01-x.html` / `pnpm render scenes/01-x-sjekkliste.html --config video.sjekkliste.json`, then `pnpm assemble` (`--config video.sjekkliste.json`) |
| review again | `pnpm review` (checklist clip: `pnpm review:sjekkliste`) |

Change a caption: edit `stepGuide` in the scene's `.js` file.

## Origin

Derived from a colleague's skill-c2v (github.com/stentas/skill-c2v, commit `9ffae77`, 2026-10-21), which makes
narrated product videos. Kept: the deterministic render engine, themes, render/assemble/contact/check tooling.
Removed: voice (Kokoro TTS, ElevenLabs, Whisper alignment), Remotion, Motion Canvas, Three.js guides.
Added: `toolkit/extras/` – step captions, checklist and screenshot layers (`steps.js`), real-app capture
(`capture.mjs`), length check (`budget.mjs`), live review page with notes (`review.mjs`), two-variant config and
final render (`variant.mjs`, `final.mjs`); `toolkit/starter/` (MCApps clip skeleton). Fixed for Windows: LF line
endings, `videoFrames` counts packets with `framecrc`. `@remotion/captions` replaced by a small inline SRT writer.
