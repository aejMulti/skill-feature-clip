/* feature-clip extras – load after engine.js in a scene:  <script src="../extras/steps.js"></script>
 *
 * Silent clips carry their message in on-screen text instead of a voice. Helpers, all pure functions of t:
 *
 *   stepCaptions(steps, opts)  → state function: a caption bar on the stage (not zoomed), one step at a time.
 *   stepChecklist(items, opts) → state function: a step overview panel – faded, active, then ✓ done.
 *   callout(target, t0, t1, text, opts) → state function: a small label next to a page element (zoomed with the camera).
 *   clipLayout(opts) / stepGuide(spec) → one timeline for either variant: numbered captions (default) or a persistent checklist (bottom).
 *   shotLayers(shots, rects) / shotSchedule(schedule) → screenshots of the real app as page layers, with invisible
 *                              hotspot divs at captured rects so { sel: hot("menu", "saveNew") } targets work.
 *
 * Look: product.css :root – the --caption-* variables of base.css, plus --step-badge-bg, --step-badge-color,
 * --callout-bg, --callout-color, --callout-size.
 */

(function injectStepCss() {
  const css = `
#steps { position: absolute; inset: var(--steps-margin, 64px) 0; display: flex; justify-content: center; pointer-events: none; }
#steps .step { position: absolute; bottom: 0; display: none; align-items: center; gap: 16px; max-width: var(--step-max, 1180px);
               padding: var(--caption-pad); border-radius: var(--caption-radius); background: var(--caption-bg);
               color: var(--caption-color); font-family: var(--caption-font, "Inter", sans-serif); font-size: var(--caption-size);
               font-weight: var(--caption-weight); line-height: 1.3; white-space: normal; text-wrap: balance; text-align: center; }
#steps .step.top, #steps.pos-top .step { top: 0; bottom: auto; }
#steps.pos-top .step.bottom { top: auto; bottom: 0; }
#steps .step .n { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 1.5em; height: 1.5em;
                  border-radius: 50%; background: var(--step-badge-bg, #fff); color: var(--step-badge-color, #000);
                  font-size: .8em; font-weight: 700; }
.callout { position: absolute; display: none; padding: 6px 12px; border-radius: 6px; white-space: nowrap; pointer-events: none;
           background: var(--callout-bg, #1b1f24); color: var(--callout-color, #fff); font-family: var(--caption-font, "Inter", sans-serif);
           font-size: var(--callout-size, 18px); font-weight: 600; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
.checklist { position: absolute; top: var(--checklist-top, 64px); width: var(--checklist-width, 330px); box-sizing: border-box;
              padding: 22px 18px; border-radius: 14px; background: var(--checklist-bg, rgba(31, 35, 41, .92)); color: var(--checklist-color, #fff);
              font-family: var(--caption-font, "Inter", sans-serif); font-size: var(--checklist-size, 24px); pointer-events: none;
              box-shadow: 0 10px 30px rgba(0, 0, 0, .25); }
.checklist.left { left: 32px; }
.checklist.right { right: 32px; }
.checklist .cl-title { font-size: .7em; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; opacity: .65; margin: 0 8px 12px; }
.checklist .cl-row { display: flex; align-items: center; gap: 14px; padding: 10px 8px; border-radius: 10px; font-weight: 500;
                     background: rgba(255, 255, 255, calc(var(--a, 0) * .1)); }
.checklist .cl-badge { position: relative; flex: none; width: 1.45em; height: 1.45em; border-radius: 50%; box-sizing: border-box;
                       border: 2px solid rgba(255, 255, 255, .45); font-size: .8em; font-weight: 700;
                       background: color-mix(in srgb, var(--checklist-done, #2f9e44) calc(var(--d, 0) * 100%),
                                   color-mix(in srgb, var(--checklist-accent, #4782b8) calc(var(--a, 0) * 100%), transparent));
                       border-color: color-mix(in srgb, transparent calc(max(var(--a, 0), var(--d, 0)) * 100%), rgba(255, 255, 255, .45)); }
.checklist .cl-n, .checklist .cl-check { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
#page { z-index: 0; }   /* own stacking context: shot layers (z-index 0–2) stay below #highlights */
.shot { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.shot > img { display: block; width: 100%; height: 100%; }
.shot > [data-hot] { position: absolute; }
`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();

/**
 * stepCaptions([{ t0, t1, text, n?, pos? }], { pos = "bottom", fade = .25 }) → state function.
 * `n` shows a numbered badge (1, 2, …). Per-step `pos` ("top" | "bottom") overrides the default, e.g. to keep a
 * button near the bottom edge visible. Text is plain (escaped); use «» for UI names. Steps may touch (t1 = next t0):
 * the outgoing step fades out while the next fades in. Keep t1 < scene end so the last frame is clean, or use
 * t1 = Infinity when the next scene opens with the same caption (boundary!).
 */
function stepCaptions(steps, opts = {}) {
  const { pos = "bottom", fade = .25 } = opts;
  let box = null, els = [];
  const build = () => {
    ensureStage();
    box = document.getElementById("steps");
    if (!box) {
      box = Object.assign(document.createElement("div"), { id: "steps" });
      $("#stage").insertBefore(box, $("#ripple"));            // above page and camera, below ripple and cursor
    }
    box.className = pos === "top" ? "pos-top" : "";
    els = steps.map((s) => {
      const el = document.createElement("div");
      el.className = "step" + (s.pos ? ` ${s.pos}` : "");
      el.innerHTML = (s.n != null ? `<span class="n">${esc(String(s.n))}</span>` : "") + `<span class="tx">${esc(s.text)}</span>`;
      box.appendChild(el);
      return el;
    });
  };
  return (t) => {
    if (!box) build();
    steps.forEach((s, i) => {
      const el = els[i];
      const o = Math.min(prog(t, s.t0, s.t0 + fade), s.t1 === Infinity ? 1 : 1 - prog(t, s.t1 - fade, s.t1));
      const on = t >= s.t0 && t < s.t1;
      el.style.display = on ? "inline-flex" : "none";
      el.style.opacity = on ? o : 0;
    });
  };
}

/**
 * stepChecklist(items, opts) → state function: a step overview panel on the stage (not zoomed), usually on the left.
 *   items: [{ text, t0, t1 }] – the step is active from t0 and done (✓) from t1; before t0 it is faded.
 *   opts:  { title = "", show = 0, hide = Infinity, fade = .3, side = "left", pending = .4 }  – panel visible in [show, hide).
 * Each row: a round badge (number → ✓ when done) and a short title (≤ ~22 characters reads best).
 * Look (product.css): --checklist-width (330px), --checklist-bg, --checklist-color, --checklist-accent (active),
 * --checklist-done (✓ colour), --checklist-size (30px), --checklist-top (64px). opts.pending = faded opacity (.4).
 * Keep the camera off the panel: shift views right by half the panel width, e.g. cx -= (panelRight / 2) / s.
 * Captions and title/end cards stay centred on the full stage (department standard).
 */
function stepChecklist(items, opts = {}) {
  const { title = "", show = 0, hide = Infinity, fade = .3, side = "left", pending = .4 } = opts;
  let panel = null, rows = [];
  const build = () => {
    panel = mount(`<div class="checklist ${side}">${title ? `<div class="cl-title">${esc(title)}</div>` : ""}</div>`, "stage");
    rows = items.map((it, i) => {
      const row = document.createElement("div");
      row.className = "cl-row";
      row.innerHTML = `<span class="cl-badge"><span class="cl-n">${i + 1}</span><span class="cl-check">✓</span></span>` +
        `<span class="cl-text">${esc(it.text)}</span>`;
      panel.appendChild(row);
      return row;
    });
  };
  return (t) => {
    if (!panel) build();
    fadeWindow(panel, show, hide, fade, t);
    items.forEach((it, i) => {
      const row = rows[i];
      const active = prog(t, it.t0, it.t0 + .25) * (1 - prog(t, it.t1, it.t1 + .25));   // 0..1 highlight
      const done = prog(t, it.t1, it.t1 + .25);                                            // 0..1 check
      const started = prog(t, it.t0, it.t0 + .25);
      row.style.setProperty("--a", active.toFixed(3));
      row.style.opacity = (pending + (1 - pending) * started - .3 * done).toFixed(3);
      row.querySelector(".cl-n").style.opacity = (1 - done).toFixed(3);
      const check = row.querySelector(".cl-check");
      check.style.opacity = done.toFixed(3);
      check.style.transform = `scale(${(.4 + .6 * easeOut(done)).toFixed(3)})`;
      row.classList.toggle("done", done > 0);
      row.querySelector(".cl-badge").style.setProperty("--d", done.toFixed(3));
    });
  };
}

/**
 * callout(target, t0, t1, text, { side = "top", gap = 10, fade = .25 }) → state function.
 * target: selector or element on the page (measured in page px every frame); the label sits on `side`
 * (top | bottom | left | right) of it, inside #camera, so it zooms and pans with the page.
 */
function callout(target, t0, t1, text, opts = {}) {
  const { side = "top", gap = 10, fade = .25 } = opts;
  let el = null;
  return (t) => {
    if (!el) el = mount(`<div class="callout">${esc(text)}</div>`, "camera");
    const on = t >= t0 && t < t1;
    el.style.display = on ? "block" : "none";
    if (!on) return;
    el.style.opacity = Math.min(prog(t, t0, t0 + fade), t1 === Infinity ? 1 : 1 - prog(t, t1 - fade, t1));
    const r = pageRect(target), w = el.offsetWidth, h = el.offsetHeight;
    const pos = {
      top: [r.x + r.w / 2 - w / 2, r.y - h - gap],
      bottom: [r.x + r.w / 2 - w / 2, r.y + r.h + gap],
      left: [r.x - w - gap, r.y + r.h / 2 - h / 2],
      right: [r.x + r.w + gap, r.y + r.h / 2 - h / 2],
    }[side];
    el.style.left = `${pos[0]}px`;
    el.style.top = `${pos[1]}px`;
  };
}

/**
 * shotLayers(shots, rects) – builds one .shot layer per screenshot in #page, in order (later = on top).
 *   shots: [{ id, src }]  (src relative to the scene file, e.g. "../shots/03-menu.png")
 *   rects: { [id]: { [hotName]: { x, y, w, h } } }  in page px – written by extras/capture.mjs (shots/rects.json,
 *          loaded as shared/rects.js → const RECTS).
 * Each rect becomes <div data-hot="hotName"> inside its layer. Target it with hot(id, name).
 */
function shotLayers(shots, rects = {}) {
  const page = $("#page");
  for (const s of shots) {
    const layer = document.createElement("div");
    layer.className = "shot";
    layer.dataset.shot = s.id;
    layer.innerHTML = `<img src="${esc(s.src)}" alt="">` +
      Object.entries(rects[s.id] ?? {}).map(([name, r]) =>
        `<div data-hot="${esc(name)}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px"></div>`).join("");
    page.appendChild(layer);
  }
}

/** Selector of a hotspot: hot("menu", "saveNew") → '[data-shot="menu"] [data-hot="saveNew"]'. */
const hot = (shotId, name) => `[data-shot="${shotId}"] [data-hot="${name}"]`;

/**
 * shotSchedule([{ t, id, fade = 0 }]) → state function. From t on, layer `id` is shown, fading in over `fade` s on top
 * of the previous one (0 = hard switch, like an instant UI change). Before the first entry the first layer shows.
 * All layers keep their layout (setVisible), so hotspots stay measurable at any t.
 */
function shotSchedule(schedule) {
  return (t) => {
    let k = 0;
    for (let i = 0; i < schedule.length; i++) if (t >= schedule[i].t) k = i;
    const cur = schedule[k], prev = k > 0 ? schedule[k - 1] : null;
    const p = cur.fade > 0 ? prog(t, cur.t, cur.t + cur.fade) : 1;
    $$(".shot").forEach((el) => {
      const id = el.dataset.shot;
      if (id === cur.id) { setVisible(el, p); el.style.zIndex = 2; }
      else if (prev && id === prev.id && p < 1) { setVisible(el, 1); el.style.zIndex = 1; }
      else { setVisible(el, 0); el.style.zIndex = 0; }
    });
  };
}

/**
 * overlayAt(shotId, hotName, cls = "") → element positioned over a hotspot inside its layer (e.g. a fake input
 * text for typeText over an empty field in the screenshot). Style it in product.css to match the app.
 */
function overlayAt(shotId, hotName, cls = "") {
  const h = $(hot(shotId, hotName));
  const el = document.createElement("div");
  el.className = `overlay ${cls}`.trim();
  el.style.cssText = `position:absolute;left:${h.style.left};top:${h.style.top};width:${h.style.width};height:${h.style.height}`;
  h.parentNode.appendChild(el);
  return el;
}

/**
 * timeScale(k, cfg) → cfg for createDemo with every time stretched by k (k > 1 = slower): duration, camera keys,
 * cursor moves, clicks, highlights, cursorOpacity and all states (captions, shots, typing…). The scene keeps its
 * original times; only the clock is slowed. Ripple and fade lengths inside states stretch with it.
 *   createDemo(timeScale(1.25, { duration: 40, camera, moves, … }))
 */
function timeScale(k, cfg) {
  if (!k || k === 1) return cfg;
  const at = (f) => (typeof f === "function" ? (t, ...rest) => f(t / k, ...rest) : f);
  const states = typeof cfg.states === "function" ? [cfg.states] : (cfg.states ?? []);
  return {
    ...cfg,
    duration: Math.round(cfg.duration * k * 100) / 100,
    camera: (cfg.camera ?? []).map((c) => ({ ...c, t: c.t * k })),
    moves: (cfg.moves ?? []).map((m) => ({ ...m, t0: m.t0 * k, t1: m.t1 * k })),
    clicks: (cfg.clicks ?? []).map((c) => ({ ...c, t: c.t * k })),
    highlights: (cfg.highlights ?? []).map((h) => ({ ...h, t0: h.t0 * k, t1: h.t1 * k })),
    cursorOpacity: at(cfg.cursorOpacity),
    states: states.map(at),
  };
}

/* ---------------------------------------------------------------------------------------------------------------
 * Two variants from one timeline: "captions" (numbered step captions at the bottom) and "checklist" (a persistent
 * step list on the left that ticks off, with only the extra notes as captions). A clip is made in ONE of them
 * ("variant" in video.config.json; captions by default).
 *
 * The scene timeline lives in scenes/NN-slug.js. Two thin HTML wrappers load it:
 *   scenes/NN-slug.html             <script>const VARIANT = "captions";</script>
 *   scenes/NN-slug-sjekkliste.html  <script>const VARIANT = "checklist";</script>
 * (`?variant=checklist` in the URL also works, for quick looks in a browser.)
 * ------------------------------------------------------------------------------------------------------------- */

/** The variant of the current scene: "captions" (default) or "checklist". */
function clipVariant() {
  if (typeof VARIANT !== "undefined" && VARIANT) return VARIANT;
  return new URLSearchParams(location.search).get("variant") || "captions";
}

/**
 * clipLayout({ panel = 362 }) → { variant, checklist, panel, view(v), views(obj) }
 *   panel: stage px covered by the checklist on the left (32 px margin + 330 px panel).
 *   view(v): a camera view (or key) for the current variant. In the checklist variant the content moves right so it
 *     centres on the free area: cx -= panel / 2 / s (cx/cy views) or dx -= panel / 2 / s (sel/rect views). Put
 *     overrides for the checklist variant in v.checklist, e.g. { s: 1.3, cx: 900, cy: 470, checklist: { s: 1.2 } }
 *     when the free area is too narrow for the zoom. The shift is recomputed with the override's s unless it sets cx/dx.
 *   views(obj): view() over every entry of an object of named views.
 * Captions and title/end cards stay centred on the full stage in both variants; only the camera shifts.
 */
function clipLayout(opts = {}) {
  const variant = clipVariant();
  const checklist = variant === "checklist";
  const panel = opts.panel ?? 362;
  const view = (v) => {
    if (!v) return v;
    const { checklist: over, ...base } = v;
    if (!checklist) return base;
    const out = { ...base, ...(over ?? {}) };
    if (over && ("cx" in over || "dx" in over)) return out;
    const shift = panel / 2 / out.s;
    if ("cx" in base) out.cx = base.cx - shift;
    else out.dx = (base.dx ?? 0) - shift;
    return out;
  };
  const views = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, view(v)]));
  return { variant, checklist, panel, view, views };
}

/**
 * stepGuide({ title, show, hide, steps, notes }) → state function: the step text for the current variant.
 *   steps: [{ t0, t1, label, caption?, captions?, done? }]  – one entry per step of the procedure, in order.
 *     captions variant: `caption` is shown t0–t1 with badge n = position (1, 2, …); or `captions: [{ t0, t1, text, pos? }]`
 *                       to split one step over several captions (all get the step's badge).
 *     checklist variant: a row with `label` (≤ ~22 characters), active from t0, ✓ at `done` (default t1).
 *   notes: [{ t0, t1, text, pos?, n?, only? }] – extra captions (tips, results) in both variants. `n` shows a badge in
 *     the captions variant only. `only: "captions" | "checklist"` limits a note to one variant – use it when the
 *     checklist already says what a caption says, or a caption needs rewording without the step text.
 *   title / show / hide: checklist heading and visible window (show after the title card fades).
 * Captions and notes must not overlap in time within one variant (one caption at a time).
 */
function stepGuide({ title = "", show = 0, hide = Infinity, steps = [], notes = [], captionOpts = {}, checklistOpts = {} } = {}) {
  const checklist = clipVariant() === "checklist";
  const byT = (a, b) => a.t0 - b.t0;
  const mine = notes.filter((n) => !n.only || n.only === (checklist ? "checklist" : "captions"));
  if (checklist) {
    const list = stepChecklist(steps.map((s) => ({ text: s.label ?? s.caption, t0: s.t0, t1: s.done ?? s.t1 })),
      { title, show, hide, ...checklistOpts });
    const caps = stepCaptions(mine.map(({ n, ...c }) => c).sort(byT), captionOpts);
    return (t) => { list(t); caps(t); };
  }
  const caps = [];
  steps.forEach((s, i) => {
    if (s.captions) s.captions.forEach((c) => caps.push({ ...c, n: c.n ?? i + 1 }));
    else if (s.caption) caps.push({ t0: s.t0, t1: s.t1, text: s.caption, n: i + 1, ...(s.pos ? { pos: s.pos } : {}) });
  });
  return stepCaptions([...caps, ...mine].sort(byT), captionOpts);
}
