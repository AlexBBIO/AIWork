// Browser smoke test: the built site renders every view without console errors.
// Usage: node scripts/build.mjs && node scripts/smoke.mjs   (needs playwright and a chromium install)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, extname } from "node:path";
import { createRequire } from "node:module";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  const path = join(
    root,
    decodeURIComponent(req.url.split("?")[0].replace(/\/$/, "/index.html")),
  );
  try {
    res.writeHead(200, {
      "content-type": types[extname(path)] || "application/octet-stream",
    });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
    : {},
);
const failures = [];
try {
  for (const vp of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: vp });
    page.on("pageerror", (e) => failures.push(`${vp.width}px: ${e.message}`));
    page.on("console", (m) => {
      // Optional web fonts can be blocked in the cloud runner. Keep application
      // and local asset errors fatal; font availability is checked separately.
      const url = m.location().url || "";
      if (
        m.type() === "error" &&
        !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url)
      )
        failures.push(`${vp.width}px console: ${m.text()}`);
    });
    for (const view of ["overview", "jobs/swe", "tasks/meetings", "method"]) {
      await page.goto(`${base}#${view}`, { waitUntil: "networkidle" });
      await page.waitForFunction(
        () =>
          !document.getElementById("lead-h1").textContent.startsWith("Loading"),
      );
      const w = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      if (w > 0)
        failures.push(`${vp.width}px #${view}: horizontal overflow of ${w}px`);
    }
    const h1 = await page.textContent("#lead-h1");
    if (!/\d+%/.test(h1))
      failures.push(`${vp.width}px: headline has no percentage: ${h1}`);
    const opened = await page.$('[data-occ="swe"][aria-expanded="true"]');
    await page.goto(`${base}#jobs/swe`, { waitUntil: "networkidle" });
    if (!(await page.$('[data-occ="swe"][aria-expanded="true"]')))
      failures.push(`${vp.width}px: deep link #jobs/swe did not open the job`);
    await page.close();
    const astra = await browser.newPage({ viewport: vp });
    astra.on("pageerror", (e) =>
      failures.push(`${vp.width}px Astra: ${e.message}`),
    );
    for (const view of [
      "overview",
      "jobs",
      "jobs/swe",
      "tasks",
      "tasks/relationship",
      "constraints",
      "method",
    ]) {
      await astra.goto(`${base}astra/#${view}`);
      await astra.waitForSelector("#content h1");
      if (await astra.locator("#error").isVisible())
        failures.push(`${vp.width}px Astra #${view}: load error`);
      if (
        await astra.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )
      )
        failures.push(`${vp.width}px Astra #${view}: overflow`);
    }
    await astra.goto(`${base}astra/#jobs`);
    await astra.locator("#job-search").fill("15-1243");
    if (!(await astra.locator('#job-results a[href="#jobs/dba"]').count()))
      failures.push("Astra constituent SOC search failed");
    await astra.goto(`${base}astra/#tasks/relationship`);
    await astra.locator("#edit-cap").fill("80");
    await astra
      .locator(
        '#task-form button[type="submit"], #task-form button:not([type])',
      )
      .click();
    if (!(await astra.locator("#scenario").isVisible()))
      failures.push("Astra scenario edit did not apply");
    const sharedUrl = astra.url();
    const clean = await browser.newContext();
    const linked = await clean.newPage();
    await linked.goto(sharedUrl);
    await linked.waitForSelector("#edit-cap");
    if ((await linked.locator("#edit-cap").inputValue()) !== "80")
      failures.push("Astra scenario URL did not restore cap");
    await clean.close();
    await astra.reload();
    await astra.locator("#reset").click();
    if (await astra.locator("#scenario").isVisible())
      failures.push("Astra scenario reset failed");
    await astra.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("✓ smoke test passed");
