# feature-clip – Claude Code skill

Silent, Norwegian feature-overview videos of a web app, made by Claude Code from the real UI:
real screenshots, camera zoom, cursor, click ripples and highlights. Each clip is made in one variant – numbered
step captions (default), or a persistent step checklist at the side for multi-section tutorials.

## Install

Needs Node 22+, pnpm and Edge or Chrome. Clone the repo and link (or copy) the skill folder into your personal skills:

```sh
git clone https://github.com/aejMulti/skill-feature-clip.git feature-clip-skill
```

- macOS/Linux: `ln -s "$PWD/feature-clip-skill/feature-clip" ~/.claude/skills/feature-clip`
- Windows (PowerShell): `New-Item -ItemType Junction -Path "$HOME\.claude\skills\feature-clip" -Target "$PWD\feature-clip-skill\feature-clip"`

Restart Claude Code. Update later with `git pull` in the clone.

## How to use it

Start Claude Code **in the app's repo** (so it can read the code behind every caption), have the app running
locally with demo data, and describe the clip. You can write in Norwegian or English; the clip text is always
Norwegian bokmål.

### Example prompt

```text
/feature-clip Lag et feature-klipp som viser hvordan man lagrer en tabellmal i registeret.
Målgruppe: prosjektledere som ikke har brukt funksjonen før. Ca. 40 sekunder.
Appen kjører på http://localhost:3000. Bruk demotavlen «Demo – Tabellmaler».
Ikke vis arkivering.
```

Worth including: the feature, the audience, a target length, the app URL, which demo project/board to use, and
anything to leave out. Ask for the **checklist** variant if it is a longer tutorial with several sections; captions
are the default. Not sure yet? Start with «Bare lag storyboardet først».

### What happens

| Step | What Claude does | What you do |
|---|---|---|
| 1. Intake | Asks once for anything missing (length, demo data, variant). | Answer in one message. |
| 2. Storyboard | Reads the code, checks every caption against it, writes `storyboard.md` (steps, seconds, exact captions, app bugs found). | Read it and approve or correct it. |
| 3. Capture | Writes a capture script and takes the screenshots with the browser. | Log in once (see below), then check the shots. |
| 4. Scenes | Builds the animated clip from the screenshots and the starter templates. | Nothing. |
| 5. Review | Opens the review editor in your browser. | Leave notes on frames and say «notes are ready». Repeat. |
| 6. Render | `pnpm final` renders the MP4 once you approve it. | Watch the MP4. |

Each clip gets its own folder outside the app repo: `feature-videos/<slug>/` with `storyboard.md` and `video/`.

### The browser (capture)

Screenshots come from the **real app**, driven by Playwright through your installed **Edge or Chrome** (Edge first
on Windows; set `CHROME_PATH` to use another Chromium browser). Claude does not click around your own browser window.

- First capture: `pnpm capture --login` opens a visible browser window. Log in by hand (SSO/Entra works). The
  session is saved in `capture/auth.json`, which is git-ignored, so later runs are headless with no window.
- After that, `pnpm capture` replays the steps and writes `shots/*.png` plus the position of every button the
  cursor will move to. Re-run it whenever the UI changes. The clip doesn't have to be rebuilt.
- Dev-only UI (test banners, debug toasts) is hidden with CSS in the clip config. Demo data changed during the
  capture is restored at the end of the script.

### The templates

| Template | Where | What it gives you |
|---|---|---|
| Clip starter | [`toolkit/starter/`](feature-clip/toolkit/starter/) | config, standard look (`shared/product.css`: 48 px captions, checklist panel, typing overlays), capture script, scene with captions + checklist wrappers |
| Storyboard | [`references/storyboard-template.md`](feature-clip/references/storyboard-template.md) | the table you approve in step 2 |
| Themes | [`references/themes.md`](feature-clip/references/themes.md) | cursor, highlight and zoom styles; one is chosen per clip with a reason |
| Your app | [`references/target-app.md`](feature-clip/references/target-app.md) | login, CSS to hide dev chrome, UI gotchas. Your own project/board IDs go in `references/target-app.local.md` (git-ignored). |

Claude copies the starter into each new clip; you rarely touch it yourself. To change the department look, edit
the starter in this repo.

### The review editor

Plays the clip live in the browser (http://localhost:4321; 4322 for a checklist clip). Nothing is rendered, so a
fix shows up within seconds.

- **Play / scrub:** Space plays and pauses. ← → step one second (Shift: one frame). Home goes to the start. Or click the timeline.
- **Leave a note:** pause, then **click** a spot or **drag** a box on the frame, type what should change («for fort
  her», «zoom inn på knappen», «feil tekst»), Enter saves. The note records the time, the spot and the caption on screen.
- **Hand over:** tell Claude «notes are ready» in the chat, or use **Copy for Claude** and paste. Claude fixes each
  note and replies on it in the page.
- **Close the loop:** mark a fixed note **Done**, or **Reopen** it with what is still wrong.
- When you're happy, say so, and Claude renders the MP4.

Notes are saved in `video/review/notes.json`, so a review can continue in a later session.

More detail: [user guide](feature-clip/README.md) · [commands](feature-clip/toolkit/README.md) ·
[troubleshooting](feature-clip/toolkit/TROUBLESHOOTING.md).

## Origin

Derived from [stentas/skill-c2v](https://github.com/stentas/skill-c2v) (narrated product videos); see the
[user guide](feature-clip/README.md#origin) for what was kept, removed and added. Fonts: Inter, SIL OFL
([feature-clip/toolkit/fonts/OFL-Inter.txt](feature-clip/toolkit/fonts/OFL-Inter.txt)).
