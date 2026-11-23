// Capture script for «TITTEL» – local dev. Run pnpm capture --login once (log in with Entra in the window
// that opens), then pnpm capture. Writes shots/<id>.png and shared/rects.js (hotspot rects in page px).
//
// Rules: settled states only (no mid-animation shots); never click destructive actions the clip is not about;
// restore demo data in `finally` (archive copies, reset fields) so the next run starts from the same state.
const PROJECT = "PROJECT_ID";   // demo project – see references/target-app.md (IDs in target-app.local.md if present)
const BOARD = "BOARD_ID";       // demo board with fictional data

export default async ({ page, shot: rawShot, settle, baseUrl }) => {
  const log = (...a) => console.log("  ·", ...a);
  // Dev-only «Patch OK» / «Patch uten endring» toasts must never show; real toasts may be part of the clip.
  const shot = async (id, hots, opts) => {
    await page.evaluate(() => document.querySelectorAll(".mantine-Notification-root").forEach((n) => {
      if (/Patch/i.test(n.textContent)) n.style.display = "none";
    }));
    return rawShot(id, hots, opts);
  };
  // tRPC calls from the logged-in page (setup and cleanup of demo data).
  // eslint-disable-next-line no-unused-vars
  const api = (method, path, body) => page.evaluate(async ({ method, path, body }) => {
    const r = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, json: await r.json().catch(() => null) };
  }, { method, path, body });

  await page.goto(`${baseUrl}/#/project/${PROJECT}/issues/${BOARD}`);
  await page.waitForSelector(".ag-row", { timeout: 60_000 });
  await page.reload();                               // a same-URL goto keeps Redux filters – reload resets them
  await page.waitForSelector(".ag-row", { timeout: 30_000 });
  await settle(1500);

  try {
    // Hotspots: { name: selector }. Mantine Menu.Target overrides child ids – select by icon, aria or text instead.
    await shot("a01-board", { button: 'button:has-text("KNAPP")' });
    await page.locator('button:has-text("KNAPP")').click();
    await page.locator(".mantine-Menu-dropdown").first().waitFor();
    await settle(400);
    await shot("a02-menu", { item: '.mantine-Menu-item:has-text("VALG")' });
  } finally {
    log("cleanup");
    // Restore demo data here.
  }
};
