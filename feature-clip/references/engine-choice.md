---
name: engine-choice
description: Which rendering engine and libraries to use for a silent feature clip – toolkit DOM engine, GSAP/Anime.js, Motion, explode, ffmpeg
metadata:
  tags: routing, engine, gsap, motion, licence, decision
---

# Choosing the engine and the libraries

Decide once per video in phase 0, and again per scene group in phase 4 if a group needs something
else. Write the choice and the reason into the storyboard ("Production" section). Every clip must satisfy `references/clip-contract.md`; `assemble` joins them.

## 1. Engine per video

```
What does the video mainly show?
├─ An existing application (feature clip, how-to, release notes)
│    → toolkit DOM engine (tools/html-css-svg.md) with UI route 1 / 2 / 3 (references/ui-routes.md)
│      Intro and summary scenes: HTML/SVG in the same engine; GSAP when the choreography is dense.
└─ A page or component "exploded" into layers → toolkit/explode (CSS 3D, crisp text)
```

Tie-breakers:

- If the product's React components can be rendered in a harness (route 2), the toolkit engine renders them with the exact look and no recreation work.
- Never pick an engine because of its animation library. GSAP, Anime.js and Motion run inside
  the engine in paused + seek mode.

## 2. Libraries per scene

| Need | Use | Not |
|---|---|---|
| Fade, slide, zoom, cross-fade of layers, modal open/close, typing, cursor, camera | engine helpers (`fadeIn`, `fadeWindow`, `crossfade`, `fadeModal`, `typeText`, camera keys) | a library |
| Many coordinated elements, staggers, SVG draw/morph, split-text reveals | GSAP timeline, `paused: true`, `tl.seek(t)` (tools/gsap.md) | self-running tweens |
| Same, but an OSI licence is required | Anime.js `createTimeline({ autoplay: false })` + `seek` (tools/gsap.md) | both libraries in one project |
| The product's own UI animates with Motion | disable it (route 1–2) or drive `animate()` controls with `time` (tools/motion.md) | new graphics in Motion |
| Diagrams, charts, arrows, counters, title cards | inline SVG/HTML set from `t` (tools/html-css-svg.md) | CSS animations, SMIL |
| Joining, loudness, converting foreign clips | ffmpeg via `render`/`assemble` (tools/ffmpeg.md) | re-rendering to fix audio levels |

## 3. Not suitable (do not propose)

| Library | Why |
|---|---|
| AOS and other scroll-triggered libraries | scroll is not a time source; nothing to seek |
| CSS `transition`/`animation`, Tailwind animate classes, SMIL `<animate>` | run on wall-clock time; flicker in frame-by-frame capture (base.css disables them) |
| `requestAnimationFrame` loops, `setInterval`, `Date`, `Math.random` | non-deterministic between seeks |
| Lottie/GIF players left to autoplay | same; only with a seekable API driven from `t` |
| Theatre.js, Editly | not maintained since 2024/2025 |

## 4. Licence check (phase 0)

| Engine / library | Ask |
|---|---|
| GSAP (all plugins) | nothing – free for commercial use; not an OSI licence |
| Anime.js, Motion, Playwright | nothing – MIT / Apache-2.0 |
| ffmpeg | nothing for running the binary (GPL build from `ffmpeg-static`, fetched by `pnpm install`, run as a separate process) |
| Fonts | each font file's licence; Inter (OFL) ships with the toolkit |

Details and sources: `tools/*.md` → "licence" in the frontmatter and the References section.
