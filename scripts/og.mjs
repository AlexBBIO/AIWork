// Render a site's share image (assets/og.png) from its live assessment, so the picture
// matches the headline. Usage: node scripts/og.mjs [--site original]   (needs playwright)
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const at = args.indexOf("--site");
const site = at === -1 ? "" : `${args[at + 1]}/`;
const base = new URL(`../${site}`, import.meta.url);
const { computeModel } = await import(new URL("assets/model.js", base));
const read = (p) => JSON.parse(readFileSync(new URL(`data/${p}`, base)));
const index = read("assessments/index.json");
const assessment = read(`assessments/${index.latest}.json`);
const m = computeModel({ taxonomy: read("taxonomy.json"), occupations: read("occupations.json"), assessment });
const { proj, limit } = m.index;

// Light-theme colours from the site's stylesheet, so the image follows the palette.
const css = readFileSync(new URL("assets/style.css", base), "utf8");
const color = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
const bands = [
  { v: proj[0], label: "Now", fill: color("t0") },
  { v: proj[1] - proj[0], label: "Next generation", fill: color("t1") },
  { v: proj[2] - proj[1], label: "Generation after", fill: color("t2") },
  { v: limit - proj[2], label: "Open to later generations", fill: `repeating-linear-gradient(135deg, ${color("open")} 0 6px, ${color("rule")} 6px 12px)` },
  { v: 100 - limit, label: "Needs a person", fill: color("struct") },
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const asOf = new Date(`${assessment.updated || assessment.date}T00:00:00Z`);
const eyebrow = ["Headroom", site ? `${site.replace("/", "")} version` : null, `${MONTHS[asOf.getUTCMonth()]} ${asOf.getUTCFullYear()}`].filter(Boolean).join(" · ");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; width: 1200px; height: 630px; background: ${color("bg")}; color: ${color("ink")}; font-family: "Helvetica Neue", Arial, sans-serif; }
  .wrap { padding: 150px 72px 0; }
  .eyebrow { font: 500 22px/1 "DejaVu Sans Mono", Menlo, monospace; letter-spacing: 0.12em; text-transform: uppercase; color: ${color("muted")}; }
  h1 { margin: 26px 0 0; font-size: 84px; line-height: 1.02; font-weight: 800; letter-spacing: -0.02em; }
  h1 em { font-style: normal; color: ${color("accent")}; }
  .bar { display: flex; gap: 4px; height: 34px; margin-top: 40px; }
  .bar div { height: 100%; border-radius: 2px; }
  .legend { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 18px; font-size: 20px; color: ${color("ink-2")}; }
  .legend span { display: inline-flex; align-items: center; gap: 10px; }
  .legend i { width: 18px; height: 18px; border-radius: 3px; display: inline-block; }
  .mark { position: absolute; right: 72px; bottom: 56px; font-size: 30px; font-weight: 800; }
</style></head><body><div class="wrap">
  <div class="eyebrow">${eyebrow}</div>
  <h1>AI can now do about <em>${Math.round(proj[0])}%</em><br>of U.S. white-collar work.</h1>
  <div class="bar">${bands.map((b) => `<div style="flex:0 0 calc(${b.v}% - 4px);background:${b.fill}"></div>`).join("")}</div>
  <div class="legend">${bands.map((b) => `<span><i style="background:${b.fill}"></i>${b.label}</span>`).join("")}</div>
</div><div class="mark">headroom</div></body></html>`;

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
const out = new URL("assets/og.png", base);
await page.screenshot({ path: out.pathname });
await browser.close();
console.log(`✓ wrote ${site}assets/og.png (${Math.round(proj[0])}%)`);
