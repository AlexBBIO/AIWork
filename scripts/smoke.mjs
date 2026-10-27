// Browser smoke test: the built site renders every view without console errors.
// Usage: node scripts/build.mjs && node scripts/smoke.mjs   (needs playwright and a chromium install)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, extname } from "node:path";
import { createRequire } from "node:module";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png" };
const server = createServer(async (req, res) => {
  const path = join(root, decodeURIComponent(req.url.split("?")[0].replace(/\/$/, "/index.html")));
  try { res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" }); res.end(await readFile(path)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const failures = [];
try {
  for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: vp });
    page.on("pageerror", (e) => failures.push(`${vp.width}px: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") failures.push(`${vp.width}px console: ${m.text()}`); });
    for (const view of ["overview", "jobs/swe", "tasks/meetings", "method"]) {
      await page.goto(`${base}#${view}`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => !document.getElementById("lead-h1").textContent.startsWith("Loading"));
      const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (w > 0) failures.push(`${vp.width}px #${view}: horizontal overflow of ${w}px`);
    }
    const h1 = await page.textContent("#lead-h1");
    if (!/\d+%/.test(h1)) failures.push(`${vp.width}px: headline has no percentage: ${h1}`);
    const opened = await page.$('[data-occ="swe"][aria-expanded="true"]');
    await page.goto(`${base}#jobs/swe`, { waitUntil: "networkidle" });
    if (!(await page.$('[data-occ="swe"][aria-expanded="true"]'))) failures.push(`${vp.width}px: deep link #jobs/swe did not open the job`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("✓ smoke test passed");
