# feature-clip – Claude Code skill

Silent, Norwegian feature-overview videos of MCApps (or another web app), made by Claude Code from the real UI:
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

## Use

Ask Claude Code e.g. «Lag et feature-klipp som viser hvordan man lagrer en tabellmal i MCApps, ca. 40 s»,
or run `/feature-clip`.

Full user guide: [feature-clip/README.md](feature-clip/README.md).

Your own demo project/board IDs go in `feature-clip/references/mcapps.local.md` (git-ignored); see
[references/mcapps.md](feature-clip/references/mcapps.md).

## Origin

Derived from [stentas/skill-c2v](https://github.com/stentas/skill-c2v) (narrated product videos); see the
[user guide](feature-clip/README.md#origin) for what was kept, removed and added. Fonts: Inter, SIL OFL
([feature-clip/toolkit/fonts/OFL-Inter.txt](feature-clip/toolkit/fonts/OFL-Inter.txt)).
