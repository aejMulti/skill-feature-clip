# Storyboard template (silent feature clip)

Write in Norwegian bokmål for Norwegian products. File: `storyboard.md` next to the `video/` folder.

## 1. Overview

Feature · audience · target length (≤ 60 s) · **variant** (captions; checklist only for a multi-section tutorial) · theme (+ one-line reason) · app URL and demo data used.

| Step | Start | s | Screen / action | Caption (exact) | Checklist label (checklist clips only, ≤ ~22 chars) |
|---|---|---|---|---|---|
| – | 00:00 | 3 | title card | – | – |
| 1 | 00:03 | 9 | … | «…» | «…» |
| (note) | | | … | tip/result caption – both variants, or only one | – |
| … | | | | | |
| – | | 3 | end card | – | (all ✓) |
| | | **Σ ≤ 60** | | | |

Checklist clips only: write each section's checklist label next to its captions; the panel needs room on the left
(362 px) – flag views that are tight. Captions clips leave the label column empty or drop it.

## 2. Scenes

```
### Scene NN – <title> · <s> s
**Shots:** <shot ids from capture/steps.mjs>
**Beats:** t → action (cursor target, click, shot switch, camera s + target, highlight)
**Caption:** «exact text» (t0–t1)
**Source:** file:line of the components shown
**Note:** pitfalls (permissions, disabled states, things that must not be clicked)
```

Caption rules: one idea, ≤ ~60 characters, ≥ 3.5 s, numbered steps for a how-to, UI names exactly as on screen in «».
Checklist labels: imperative or noun phrase, ≤ ~22 characters («Åpne «Innstillinger»», «Velg type»).

## 3. Fact table

| Caption / shown behaviour | Source (file:line) |
|---|---|

## 4. Must be fixed before the clip is used

| # | Problem | Where (file) | Scenes |
|---|---|---|---|

## 5. Boundary table

| Cut | Shot | Camera (s, cx, cy) | Cursor | Caption |
|---|---|---|---|---|
