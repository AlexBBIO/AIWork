// Validate the data, then copy the static sites into dist/ for deployment.
// The root site goes to dist/, the Opus revision to dist/Opus/.
// Usage: node scripts/build.mjs
import { execFileSync } from "node:child_process";
import {
  existsSync,
  cpSync,
  rmSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { validateBundle } from "../astra/model.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const SITES = [
  { src: root, out: "" },
  { src: join(root, "Opus"), out: "Opus", flag: ["--site", "Opus"] },
];

const dist = join(root, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const site of SITES) {
  execFileSync(
    process.execPath,
    [join(root, "scripts", "validate.mjs"), ...(site.flag || [])],
    { stdio: "inherit" },
  );
  const out = join(dist, site.out);
  mkdirSync(out, { recursive: true });
  for (const p of ["index.html", "assets", "data"])
    cpSync(join(site.src, p), join(out, p), { recursive: true });

  // One bundle so the site loads with a single data request; the source files stay as the fallback.
  const read = (p) =>
    JSON.parse(readFileSync(join(site.src, "data", p), "utf8"));
  const index = read("assessments/index.json");
  const bundle = {
    taxonomy: read("taxonomy.json"),
    occupations: read("occupations.json"),
    index,
    assessments: Object.fromEntries(
      index.assessments.map((id) => [id, read(`assessments/${id}.json`)]),
    ),
  };
  // Optional: the economic-value page's revenue data (Opus revision).
  if (existsSync(join(site.src, "data", "economics.json")))
    bundle.economics = read("economics.json");
  writeFileSync(join(out, "data", "bundle.json"), JSON.stringify(bundle));
}
console.log("✓ built dist/ and dist/Opus/");

const bundle = JSON.parse(
  readFileSync(join(dist, "data", "bundle.json"), "utf8"),
);
// Keep the original site intact; Astra is an independent comparison route.
const astra = {
  ...bundle,
  config: JSON.parse(readFileSync(join(root, "astra", "config.json"), "utf8")),
  bls: JSON.parse(
    readFileSync(join(root, "astra", "bls-verification.json"), "utf8"),
  ),
  access: JSON.parse(
    readFileSync(join(root, "astra", "source-access.json"), "utf8"),
  ),
};
const errors = validateBundle(astra);
if (errors.length)
  throw new Error(`Astra validation failed:\n${errors.join("\n")}`);
cpSync(join(root, "astra"), join(dist, "astra"), { recursive: true });
writeFileSync(join(dist, "astra", "bundle.json"), JSON.stringify(astra));
let revision = process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
if (revision === "unknown") {
  try {
    revision = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    /* source archives may lack Git metadata */
  }
}
writeFileSync(
  join(dist, "astra", "version.json"),
  JSON.stringify({
    variant: "astra",
    revision,
    assessment: astra.config.as_of,
  }),
);
console.log("✓ built dist/astra/");
