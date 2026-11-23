// Scene 01 – SLUG. One timeline; the clip's chosen variant decides the wrapper (01-SLUG.html = captions, the default;
// 01-SLUG-sjekkliste.html = checklist, only for multi-section tutorials).
// Times are absolute seconds; see storyboard.md. Shot ids and hotspot names come from capture/steps.mjs.

const L = clipLayout();                 // L.checklist === true in the checklist variant
const SHOTS = ["a01-board", "a02-menu"];
shotLayers(SHOTS.map((id) => ({ id, src: `../shots/${id}.png` })), RECTS);
const H = hot;

const title = mount(`<div class="stage-layer card"><div class="kicker">Register</div>
  <h1>TITTEL</h1><div class="bar"></div></div>`, "stage");
const end = mount(`<div class="stage-layer card"><h1>Klar til bruk</h1><div class="bar"></div>
  <p>EN SETNING OM RESULTATET</p></div>`, "stage");

// Camera views in page px (visible page area = 1920/s × 1080/s). Write them for the captions variant;
// L.views() shifts them right of the checklist panel in the checklist variant. Override per view with
// `checklist: { s: … }` when the free area is too narrow for the zoom.
const V = L.views({
  base: CAM_BASE,
  btn: { s: 1.6, cx: 900, cy: 400 },
  menu: { s: 1.45, cx: 900, cy: 480, checklist: { s: 1.3 } },
});

const camera = [], moves = [], clicks = [];
const cam = (t, v) => camera.push({ t, ...v });
const camCut = (t, from, to) => { cam(t - .001, from); cam(t, to); };   // hard cut (jump cut between views)
const move = (t0, to, dur = .9) => moves.push({ t0, t1: t0 + dur, to });  // calm: 0.8–1.0 s per move
const jump = (t, to) => moves.push({ t0: t, t1: t + .001, to });          // cursor teleports at a cut
const click = (t) => clicks.push({ t });                                  // ≈ 0.3 s after the move ends

// ---- 0 Tittel
const T = { titleOut: 2.4 };
cam(0, V.base);
// ---- 1 Steg 1
cam(3.0, V.base); cam(3.9, V.btn);
move(3.2, { sel: H("a01-board", "button") }); click(4.4);
// ---- 2 Steg 2
cam(4.6, V.btn); cam(5.4, V.menu);
move(6.0, { sel: H("a02-menu", "item") }); click(7.2);
// ---- Slutt
const END = 11, DURATION = 14;   // DURATION must equal the scene's "duration" in video.config.json

createDemo({
  duration: DURATION, lead: 0,
  cursorOpacity: (t) => prog(t, T.titleOut + .2, T.titleOut + .8) * (1 - prog(t, END, END + .4)),
  camera, moves, clicks,
  highlights: [
    { t0: 5.6, t1: 7.0, sel: H("a02-menu", "item") },
  ],
  states: [
    shotSchedule([
      { t: 0, id: "a01-board" },
      { t: 4.5, id: "a02-menu", fade: .12 },          // the UI changes ≈ 0.1 s after the click
    ]),
    (t) => fadeOut(title, T.titleOut, .5, t),
    (t) => fadeIn(end, END, .6, t),
    // Step text for both variants. caption = numbered caption (captions variant); label = checklist row
    // (≤ ~22 characters, checklist variant); done = when the row gets its ✓ (default t1).
    stepGuide({
      title: "TITTEL", show: 2.6,
      steps: [
        { t0: 3.0, t1: 6.0, done: 4.4, label: "Klikk «KNAPP»", caption: "Klikk «KNAPP» øverst i registeret" },
        { t0: 6.0, t1: 10.5, done: 7.2, label: "Velg «VALG»", caption: "Velg «VALG» i menyen" },
      ],
      notes: [
        // Extra captions; both variants unless only: "captions" | "checklist".
        { t0: 8.0, t1: 10.5, text: "Endringen lagres med en gang", only: "checklist" },
      ],
    }),
  ],
});
