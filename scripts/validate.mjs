// Validate the data files and print a summary of the latest assessment.
// Usage: node scripts/validate.mjs [--site original] [assessment-id]
// --site picks a site folder (default: the root site); each site has its own model and data.
import { readFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const at = args.indexOf("--site");
const site = at === -1 ? "" : `${args.splice(at, 2)[1]}/`;
const base = new URL(`../${site}`, import.meta.url);
const { computeModel, validate, validateIndex } = await import(new URL("assets/model.js", base));

const read = (p) => JSON.parse(readFileSync(new URL(`data/${p}`, base)));
const taxonomy = read("taxonomy.json");
const occupations = read("occupations.json");
const index = read("assessments/index.json");
const assessments = Object.fromEntries(index.assessments.map((id) => [id, read(`assessments/${id}.json`)]));

let errors = [];
for (const id of index.assessments) errors.push(...validate({ taxonomy, occupations, assessment: assessments[id] }).map((e) => `[${id}] ${e}`));
errors.push(...validateIndex({ taxonomy, index, assessments }));
const econPath = new URL("data/economics.json", base);
if (existsSync(econPath)) {
  const { validateEconomics } = await import(new URL("assets/model.js", base));
  const econ = JSON.parse(readFileSync(econPath));
  errors.push(...validateEconomics(econ, new Set((econ.sources || []).map((s) => s.id))));
}
for (const e of errors) console.error(`  ✗ ${site}${e}`);
if (errors.length) process.exit(1);

const id = args[0] || index.latest;
const assessment = assessments[id];
const pct = (x) => x.toFixed(1).padStart(5);
console.log(`site: /${site}`);
for (const weight of ["wage", "employment"]) {
  const m = computeModel({ taxonomy, occupations, assessment, weight });
  const { f0, f1, f2, limit, flatAt, confidence } = m.index;
  const span = m.index.range
    ? (k) => `(${m.index.range[k][0].toFixed(1)}–${m.index.range[k][1].toFixed(1)})`
    : (k) => `±${m.index.band[k].toFixed(1)}`;
  console.log(`${id} weighted by ${weight}: Frontier ${pct(f0)}  F+1 ${pct(f1)} ${span("f1")}  F+2 ${pct(f2)} ${span("f2")}  ceiling ${pct(limit)}  gains < 1pt/gen at gen ${flatAt}  confidence high/medium/low ${pct(confidence.high)}/${pct(confidence.medium)}/${pct(confidence.low)}%`);
}
for (const sid of index.assessments) {
  const a = assessments[sid];
  console.log(`  ${a.date}  ${a.anchor.padEnd(18)} ${pct(computeModel({ taxonomy, occupations, assessment: a }).index.f0)}`);
}
const m = computeModel({ taxonomy, occupations, assessment });
console.log(`\n${m.occupations.length} occupations, ${(m.totals.employment / 1000).toFixed(1)}M jobs, $${(m.totals.wageBill / 1e6).toFixed(2)}T wage bill, ${(assessment.sources || []).length} sources`);
console.log("✓ data valid");
