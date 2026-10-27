// Validate the data files and print a summary of the latest assessment.
// Usage: node scripts/validate.mjs [assessment-id]
import { readFileSync } from "node:fs";
import { computeModel, validate, validateIndex } from "../assets/model.js";

const read = (p) => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url)));
const taxonomy = read("taxonomy.json");
const occupations = read("occupations.json");
const index = read("assessments/index.json");
const assessments = Object.fromEntries(index.assessments.map((id) => [id, read(`assessments/${id}.json`)]));

let errors = [];
for (const id of index.assessments) errors.push(...validate({ taxonomy, occupations, assessment: assessments[id] }).map((e) => `[${id}] ${e}`));
errors.push(...validateIndex({ taxonomy, index, assessments }));
for (const e of errors) console.error(`  ✗ ${e}`);
if (errors.length) process.exit(1);

const id = process.argv[2] || index.latest;
const assessment = assessments[id];
const pct = (x) => x.toFixed(1).padStart(5);
for (const weight of ["wage", "employment"]) {
  const m = computeModel({ taxonomy, occupations, assessment, weight });
  const { f0, f1, f2, limit, flatAt, range, confidence } = m.index;
  const span = ([lo, hi]) => `(${lo.toFixed(1)}–${hi.toFixed(1)})`;
  console.log(`${id} weighted by ${weight}: Frontier ${pct(f0)}  F+1 ${pct(f1)} ${span(range.f1)}  F+2 ${pct(f2)} ${span(range.f2)}  ceiling ${pct(limit)}  gains < 1pt/gen at gen ${flatAt}  confidence high/medium/low ${pct(confidence.high)}/${pct(confidence.medium)}/${pct(confidence.low)}%`);
}
for (const sid of index.assessments) {
  const a = assessments[sid];
  console.log(`  ${a.date}  ${a.anchor.padEnd(18)} ${pct(computeModel({ taxonomy, occupations, assessment: a }).index.f0)}`);
}
const m = computeModel({ taxonomy, occupations, assessment });
console.log(`\n${m.occupations.length} occupations, ${(m.totals.employment / 1000).toFixed(1)}M jobs, $${(m.totals.wageBill / 1e6).toFixed(2)}T wage bill, ${(assessment.sources || []).length} sources`);
console.log("✓ data valid");
