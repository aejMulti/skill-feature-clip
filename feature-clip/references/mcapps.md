---
name: mcapps
description: MCApps-specific facts for capturing feature clips – login, demo data, CSS to hide dev chrome, and UI gotchas found while making the first clips.
metadata:
  tags: mcapps, capture, demo-data, gotchas
---
# MCApps capture facts

Collected while making the first six clips (Nov 2026). Dates say when a fact was last seen – re-check before relying
on IDs or bugs that may have been fixed since.

## Setup

- App: `http://localhost:3000` (frontend + local backend). Captures run against whatever database your backend uses.
- **Login is Microsoft Entra.** `pnpm capture --login` opens a headed window; log in by hand once. A fresh Playwright
  profile has failed with Entra – keep the persistent profile (`capture/profile/`, git-ignored with `capture/auth.json`).
- Viewport = config `page` (1670 × 940), `scale: 2` so zoomed shots stay sharp.

## Demo data

Project and board IDs are not kept in this repo. If `references/mcapps.local.md` exists (git-ignored), read it for
your demo project/board IDs and known problem issues. Otherwise ask the user for the project and a demo board, or
create a demo board with fictional data, and note its IDs in the storyboard and in `mcapps.local.md`.
Real boards may be filmed **read-only** only with the user's explicit OK for internal use.

- Custom attributes («Egne attributter») can't be deleted, only deactivated; their keys (A, B, …) are never reused.
  Capture retries leave inactive attributes behind – prefer clips that reuse existing attributes.
- Restore demo data in the capture script's `finally` (unsubscribe, archive copies **and** their actions – archiving
  does not cascade, reset changed fields) so the next capture starts from the same state.
- Batch edit: use a dropdown field (e.g. a revision «Status»), never a person or free-text field; MCApps has no
  batch-editable person fields.

## Hiding dev chrome

- Yellow task banner, external-issue banners and the red «TESTMILJØ» footer – in `capture.css` (starter config):
  `.mantine-AppShell-main > div > :not(.mantine-Flex-root) { display: none !important; }`
- Dev-only «Patch OK» / «Patch uten endring» RTKQ toasts – hidden per shot in `capture/steps.mjs` (starter), so real
  toasts can still be part of a clip. To hide **all** toasts instead:
  `[aria-live="polite"]:has(> .mantine-Notification-root) { display: none !important; }`
- ag-grid cell focus outline: hide it in clips where a focused cell would distract.

## Selectors and UI gotchas

- Mantine `Menu.Target` overrides child ids (e.g. `#saveTemplate`) – select by icon class, aria or text.
- Board settings tab: `[role=tab]:has(.fa-cog)`. Issue-window ≡ menu: `.mantine-Modal-content button:has(svg.tabler-icon-menu-2)`.
- ag-grid «Kolonnevalg» list is virtualised – filter via its search box before selecting an item.
- Status cells render UPPER CASE, but the API needs the stored values («Opprettet», «I prosess»).
- Clicking an ag-grid header in a capture step **sorts** the table – click elsewhere to close popups.
- Tall Mantine modals need scrolling at 940 px page height; scroll the modal to the top before each shot when a menu
  item takes focus.
- A same-URL `page.goto` doesn't reset Redux filters – use `page.reload()`.
- AI features need their API configuration on the local backend; without it, leave them out of the clip.

## Found app issues

Bugs found while verifying a storyboard go into `<workspace>/feature-videos/FOUND-ISSUES.md` (one table per clip:
#, severity, problem, file:line, status «Tested» / «Code only» / «Fixed (branch …)»). Prefer getting bugs fixed and
recapturing over working around them in the clip.
