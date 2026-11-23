// Review page for a clip project: plays the scenes live (no rendering), lets the user click/drag on a frame and
// leave a note, and reloads the scenes whenever a file in the project changes.
//
//   node extras/review.mjs [--config <file>] [--port 4321] [--no-open]      (pnpm review)
//
// Notes are stored in review/notes.json (array, newest last); with --config video.sjekkliste.json in
// review/notes.sjekkliste.json, so both variants can be reviewed at the same time:
//   { id, status: "open" | "fixed" | "done", text, created,
//     scene: { id, key, file },          file relative to the project root, e.g. "scenes/01-intro.html"
//     t, frame, globalT,                 scene-local seconds (frame-snapped), frame index, seconds into the whole clip
//     point: { x, y } | box: { x, y, w, h },   stage px (config width × height, e.g. 1920 × 1080)
//     element: { selector, text },       element under the click inside the scene
//     captions: [ "…" ],                 step captions / title text visible at that moment
//     replies: [ { by: "claude" | "user", text } ] }
// Agent loop: read notes with status "open", fix the scene, set status "fixed" and add a reply saying what changed.
// The user then marks it "done" or reopens it (optionally with a reply). Edit the file directly; the page follows.
import { createReadStream, existsSync, watch } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../tools/config.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1]; };
const configArg = opt("--config");
const port = Number(opt("--port") ?? 4321);
const noOpen = args.includes("--no-open");

const cfg0 = loadConfig({ explicit: configArg, start: process.cwd(), fallbackRoot: path.dirname(here) });
const root = cfg0.root;
const configFile = configArg ? path.resolve(configArg) : null;
const reviewDir = path.join(root, "review");
// One notes file per config: video.config.json → notes.json, video.sjekkliste.json → notes.sjekkliste.json.
const variantTag = configFile && !/^video\.config\.json$/i.test(path.basename(configFile))
  ? path.basename(configFile).replace(/^video\./i, "").replace(/\.json$/i, "") : null;
const notesFile = path.join(reviewDir, variantTag ? `notes.${variantTag}.json` : "notes.json");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".mp4": "video/mp4",
};

const info = () => {
  const cfg = loadConfig({ explicit: configArg, start: process.cwd(), fallbackRoot: path.dirname(here) });
  return {
    name: cfg.name, fps: cfg.fps, width: cfg.width, height: cfg.height,
    scenes: cfg.sceneList.filter((s) => existsSync(s.file)).map((s) => ({
      id: s.id, key: s.key, slug: s.slug, duration: s.raw.duration ?? null,
      url: "/" + path.relative(root, s.file).split(path.sep).join("/"),
    })),
  };
};

async function readNotes() {
  try { return JSON.parse(await readFile(notesFile, "utf8")); } catch (e) {
    if (e.code === "ENOENT") return [];
    throw new Error(`review/notes.json kunne ikke leses: ${e.message}`);
  }
}
async function writeNotes(notes) {
  await mkdir(reviewDir, { recursive: true });
  const tmp = notesFile + ".tmp";
  await writeFile(tmp, JSON.stringify(notes, null, 2) + "\n");
  await rename(tmp, notesFile);
}
async function applyOp(body) {
  const notes = await readNotes();
  if (body.op === "add") {
    const id = notes.reduce((m, n) => Math.max(m, n.id ?? 0), 0) + 1;
    notes.push({ id, status: "open", ...body.note, replies: [], created: new Date().toISOString() });
  } else {
    const i = notes.findIndex((n) => n.id === body.id);
    if (i === -1) throw new Error(`fant ikke notat ${body.id}`);
    if (body.op === "delete") notes.splice(i, 1);
    else if (body.op === "update") {
      const { reply, ...patch } = body.patch ?? {};
      Object.assign(notes[i], patch);
      if (reply) (notes[i].replies ??= []).push({ by: "user", text: reply });
    } else throw new Error(`ukjent op ${body.op}`);
  }
  await writeNotes(notes);
  return notes;
}

// ---------- Live reload ----------
const clients = new Set();
const send = (event, data) => { for (const res of clients) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };
const IGNORE = /^(node_modules|clips|stills|\.git|capture[\\/]profile|audio)([\\/]|$)|\.tmp$|\.mp4$/i;
let pending = new Set(), timer = null;
const mtimes = new Map();   // Windows reports plain reads (atime) as changes: only react when mtime/size moved
watch(root, { recursive: true }, async (_ev, file) => {
  if (!file || IGNORE.test(file)) return;
  const st = await stat(path.join(root, file)).catch(() => null);
  const sig = st ? `${st.mtimeMs}:${st.size}` : "gone";
  if (st?.isDirectory() || mtimes.get(file) === sig) return;
  const known = mtimes.has(file);
  mtimes.set(file, sig);
  if (!known && st && Date.now() - st.mtimeMs > 3000) return;   // first sighting of an old file = a read, not an edit
  pending.add(file.split(path.sep).join("/"));
  clearTimeout(timer);
  timer = setTimeout(() => {
    const files = [...pending]; pending = new Set();
    const notesOnly = files.every((f) => f.startsWith("review/"));
    send(notesOnly ? "notes" : "change", files);
  }, 200);
});

// ---------- HTTP ----------
const json = (res, code, data) => { res.writeHead(code, { "content-type": MIME[".json"], "cache-control": "no-store" }); res.end(JSON.stringify(data)); };

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    const p = decodeURIComponent(url.pathname);
    if (p === "/" || p === "/__review") { res.writeHead(302, { location: "/__review/" }); return res.end(); }
    if (p === "/__review/") return sendFile(res, path.join(here, "review.html"));
    if (p === "/__review/info") return json(res, 200, info());
    if (p === "/__review/notes" && req.method === "GET") return json(res, 200, await readNotes());
    if (p === "/__review/notes" && req.method === "POST") {
      let body = ""; for await (const c of req) body += c;
      return json(res, 200, await applyOp(JSON.parse(body)));
    }
    if (p === "/__review/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
      res.write(": ok\n\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    const file = path.resolve(root, "." + p);
    if (file !== root && !file.startsWith(root + path.sep)) return json(res, 403, { error: "utenfor prosjektet" });
    if (/[\\/]capture[\\/](auth\.json|profile)/i.test(file)) return json(res, 403, { error: "ikke servert" });
    return sendFile(res, file);
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

async function sendFile(res, file) {
  const st = await stat(file).catch(() => null);
  if (!st?.isFile()) return json(res, 404, { error: "fant ikke " + path.relative(root, file) });
  res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
  createReadStream(file).pipe(res);
}

server.listen(port, "127.0.0.1", () => {
  const link = `http://127.0.0.1:${port}/__review/`;
  console.log(`Review: ${link}\nProsjekt: ${root}${configFile ? `\nConfig: ${configFile}` : ""}\nNotater: ${path.relative(process.cwd(), notesFile) || notesFile}`);
  if (!noOpen) {
    const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", link]]
      : process.platform === "darwin" ? ["open", [link]] : ["xdg-open", [link]];
    spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).on("error", () => {}).unref();
  }
});
