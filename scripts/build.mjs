// Validate the data, then copy the static site into dist/ for deployment.
// Usage: node scripts/build.mjs
import { execFileSync } from "node:child_process";
import { cpSync, rmSync, mkdirSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
execFileSync(process.execPath, [`${root}scripts/validate.mjs`], { stdio: "inherit" });

const out = `${root}dist`;
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const p of ["index.html", "assets", "data"]) cpSync(`${root}${p}`, `${out}/${p}`, { recursive: true });
console.log("✓ built dist/");
