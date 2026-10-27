// Validate the data, then copy the static sites into dist/ for deployment.
// The root site goes to dist/, the Opus revision to dist/Opus/.
// Usage: node scripts/build.mjs
import { execFileSync } from "node:child_process";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const SITES = [{ src: root, out: "" }, { src: join(root, "Opus"), out: "Opus", flag: ["--site", "Opus"] }];

const dist = join(root, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const site of SITES) {
  execFileSync(process.execPath, [join(root, "scripts", "validate.mjs"), ...(site.flag || [])], { stdio: "inherit" });
  const out = join(dist, site.out);
  mkdirSync(out, { recursive: true });
  for (const p of ["index.html", "assets", "data"]) cpSync(join(site.src, p), join(out, p), { recursive: true });

  // One bundle so the site loads with a single data request; the source files stay as the fallback.
  const read = (p) => JSON.parse(readFileSync(join(site.src, "data", p), "utf8"));
  const index = read("assessments/index.json");
  const bundle = {
    taxonomy: read("taxonomy.json"),
    occupations: read("occupations.json"),
    index,
    assessments: Object.fromEntries(index.assessments.map((id) => [id, read(`assessments/${id}.json`)])),
  };
  writeFileSync(join(out, "data", "bundle.json"), JSON.stringify(bundle));
}
console.log("✓ built dist/ and dist/Opus/");
