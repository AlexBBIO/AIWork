import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  project,
  compute,
  cleanEdits,
  cleanMixes,
  validateBundle,
  periodDate,
  validDate,
} from "../astra/model.js";
const json = (p) =>
  JSON.parse(readFileSync(new URL("../" + p, import.meta.url)));
const index = json("data/assessments/index.json");
const bundle = {
  taxonomy: json("data/taxonomy.json"),
  occupations: json("data/occupations.json"),
  index,
  assessments: Object.fromEntries(
    index.assessments.map((id) => [id, json(`data/assessments/${id}.json`)]),
  ),
  config: json("astra/config.json"),
  bls: json("astra/bls-verification.json"),
};
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("Astra current coverage agrees with an independent weighted sum for both weightings", () => {
  for (const weight of ["wage", "employment"]) {
    const a = bundle.assessments[index.latest];
    let sum = 0,
      total = 0;
    for (const o of bundle.occupations.occupations) {
      const w = o.employment * (weight === "wage" ? o.wage : 1);
      total += w;
      sum +=
        w *
        o.tasks.reduce(
          (s, [, id, t]) =>
            s +
            (t / 100) * (a.overrides?.[`${o.id}:${id}`]?.f0 ?? a.scores[id].f0),
          0,
        );
    }
    const m = compute(bundle, weight);
    close(m.proj[0], sum / total);
    close(
      m.occupations.reduce((s, o) => s + o.weight, 0),
      1,
    );
    close(
      m.tasks.reduce((s, t) => s + t.share, 0),
      1,
    );
  }
});
test("relationship forecast uses an explicit rate, independent of rounded legacy tiers", () => {
  const a = compute(bundle);
  const changed = structuredClone(bundle);
  changed.assessments[index.latest].scores.relationship.f2 = 22;
  const b = compute(changed);
  assert.deepEqual(a.byId.relationship.proj, b.byId.relationship.proj);
  close(a.byId.relationship.proj[2], 50 - 38 * 0.85 ** 2);
  const relaxed = compute(bundle, "wage", { relationship: { cap: 80 } });
  assert.ok(relaxed.proj[2] > a.proj[2]);
  close(relaxed.proj[0], a.proj[0]);
});
test("zero progress stays flat and zero/complete coverage retain valid boundaries", () => {
  assert.deepEqual(project({ now: 12, cap: 50, rate: 0 }, 3), [12, 12, 12, 12]);
  assert.deepEqual(
    project({ now: 0, cap: 100, rate: 1 }, 3),
    [0, 100, 100, 100],
  );
  assert.deepEqual(
    project({ now: 100, cap: 100, rate: 0.5 }, 3),
    [100, 100, 100, 100],
  );
  assert.throws(() => project({ now: 50, cap: 40, rate: 0.3 }));
  assert.throws(() => project({ now: NaN, cap: 100, rate: 0.3 }));
});
test("threshold not reached is null and no fake horizon is reported", () => {
  const e = Object.fromEntries(
    bundle.taxonomy.archetypes.map((t) => [
      t.id,
      { now: 0, cap: 100, rate: 0.02 },
    ]),
  );
  const m = compute(bundle, "wage", e, 8);
  assert.equal(m.flatAt, null);
  assert.ok(m.proj[8] - m.proj[7] > 1);
});
test("scenario parsing rejects malformed parameters and unknown task ids", () => {
  const edits = cleanEdits(
    {
      relationship: { now: 70, cap: 20 },
      draft: { rate: Infinity },
      unknown: { now: 15 },
      code: { now: 80, cap: 99, rate: 0.4 },
    },
    bundle,
  );
  assert.deepEqual(Object.keys(edits), ["code"]);
  assert.deepEqual(cleanEdits([], bundle), {});
  assert.deepEqual(cleanMixes({ swe: [100, 100] }, bundle), {});
  const mix = [35, 25, 15, 15, 10];
  const cleaned = cleanMixes({ swe: mix }, bundle);
  assert.deepEqual(cleaned.swe, mix);
  const m = compute(bundle, "wage", {}, 8, cleaned);
  const o = m.occupations.find((x) => x.id === "swe");
  close(o.proj[0], 0.35 * 82 + 0.25 * 72 + 0.15 * 50 + 0.15 * 18 + 0.1 * 84);
});
test("Astra rejects audit failure cases without changing the original model", () => {
  assert.deepEqual(validateBundle(bundle), []);
  for (const mutate of [
    (b) => {
      b.occupations.occupations[0].tasks[0][2] = -5;
      b.occupations.occupations[0].tasks[1][2] += 25;
    },
    (b) => b.taxonomy.archetypes.push(b.taxonomy.archetypes[0]),
    (b) => (b.config.rates.relationship = NaN),
    (b) => (b.config.forecast_dates[0] = "2027-02-30"),
    (b) =>
      (b.assessments[index.latest].overrides = {
        "gen_ops_mgr:physical": { f0: 20 },
      }),
    (b) =>
      (b.assessments[index.latest].overrides = {
        "gen_ops_mgr:strategy": { f0: 120, ceiling: 150 },
      }),
    (b) => (b.occupations.occupations[0].wage = Infinity),
  ]) {
    const bad = structuredClone(bundle);
    mutate(bad);
    assert.ok(validateBundle(bad).length);
  }
});
test("calendar dates are strict and six-month steps clamp end-of-month", () => {
  assert.equal(validDate("2027-02-30"), false);
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(periodDate("2026-10-27", 1), "2027-04-27");
  assert.equal(periodDate("2026-08-31", 1), "2027-02-28");
});
test("historical current point uses assessment cutoff and score edits do not rewrite history", () => {
  const a = compute(bundle),
    b = compute(bundle, "wage", { relationship: { now: 20 } });
  assert.equal(a.history.at(-1).date, "2026-10-27");
  assert.deepEqual(a.history, b.history);
  assert.ok(b.proj[0] > a.proj[0]);
});
test("BLS records cover every occupation and include hidden constituent SOC codes", () => {
  assert.equal(bundle.bls.rows.length, bundle.occupations.occupations.length);
  const m = compute(bundle);
  assert.ok(
    m.occupations.find((o) => o.id === "dba").codes.includes("15-1243"),
  );
  assert.ok(
    m.occupations.find((o) => o.id === "actuary").codes.includes("15-2041"),
  );
});
