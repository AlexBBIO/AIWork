// Validate the data, then copy the static site into dist/ for deployment.
// Usage: node scripts/build.mjs
import { execFileSync } from "node:child_process";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
execFileSync(process.execPath, [join(root, "scripts", "validate.mjs")], { stdio: "inherit" });

const out = join(root, "dist");
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const p of ["index.html", "assets", "data"]) cpSync(join(root, p), join(out, p), { recursive: true });

// One bundle so the site loads with a single data request; the source files stay as the fallback.
const read = (p) => JSON.parse(readFileSync(join(root, "data", p), "utf8"));
const index = read("assessments/index.json");
const bundle = {
  taxonomy: read("taxonomy.json"),
  occupations: read("occupations.json"),
  index,
  assessments: Object.fromEntries(index.assessments.map((id) => [id, read(`assessments/${id}.json`)])),
};
writeFileSync(join(out, "data", "bundle.json"), JSON.stringify(bundle));
console.log("✓ built dist/");
