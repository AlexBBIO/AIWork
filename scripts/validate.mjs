// Validate the data files and print a summary of the latest assessment.
// Usage: node scripts/validate.mjs [assessment-id]
import { readFileSync } from "node:fs";
import { computeModel, validate } from "../assets/model.js";

const read = (p) => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url)));
const taxonomy = read("taxonomy.json");
const occupations = read("occupations.json");
const index = read("assessments/index.json");

let failed = false;
for (const id of index.assessments) {
  const errors = validate({ taxonomy, occupations, assessment: read(`assessments/${id}.json`) });
  for (const e of errors) console.error(`  ✗ [${id}] ${e}`);
  failed ||= errors.length > 0;
}
if (failed) process.exit(1);

const id = process.argv[2] || index.latest;
const assessment = read(`assessments/${id}.json`);
const pct = (x) => x.toFixed(1).padStart(5);
for (const weight of ["wage", "employment"]) {
  const m = computeModel({ taxonomy, occupations, assessment, weight });
  const { f0, f1, f2, limit, flatAt } = m.index;
  console.log(`${id} weighted by ${weight}: Frontier ${pct(f0)}  F+1 ${pct(f1)}  F+2 ${pct(f2)}  limit ${pct(limit)}  gains < 1pt/gen at gen ${flatAt}`);
}
for (const sid of index.assessments) {
  const a = read(`assessments/${sid}.json`);
  console.log(`  ${a.date}  ${a.anchor.padEnd(18)} ${pct(computeModel({ taxonomy, occupations, assessment: a }).index.f0)}`);
}
const m = computeModel({ taxonomy, occupations, assessment });
console.log(`\n${m.occupations.length} occupations, ${(m.totals.employment / 1000).toFixed(1)}M jobs, $${(m.totals.wageBill / 1e6).toFixed(2)}T wage bill`);
console.log("✓ data valid");
