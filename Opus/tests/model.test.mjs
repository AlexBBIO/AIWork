import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeModel, projectArchetype, scoreBand, scoreRange, validate, validateIndex } from "../assets/model.js";

const read = (p) => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url)));
const taxonomy = read("taxonomy.json");
const occupations = read("occupations.json");
const index = read("assessments/index.json");
const assessments = Object.fromEntries(index.assessments.map((id) => [id, read(`assessments/${id}.json`)]));
const live = assessments[index.latest];
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test("scores built with a constant closure rate converge to the ceiling", () => {
  const g = 0.4, f0 = 50, C = 90;
  const f1 = f0 + g * (C - f0), f2 = f1 + g * (C - f1);
  const { limit, proj } = projectArchetype({ f0, f1, f2, ceiling: C }, 40);
  close(limit, C);
  close(proj[2], f2);
  close(proj[3], f2 + g * (C - f2));
  assert.ok(proj[40] > C - 1e-6 && proj[40] <= C);
  for (let n = 1; n < proj.length; n++) assert.ok(proj[n] >= proj[n - 1]);
});

test("whole-number rounding never pulls the limit below the ceiling", () => {
  const { limit } = projectArchetype({ f0: 12, f1: 17, f2: 21, ceiling: 50 });
  assert.equal(limit, 50);
  const stalled = projectArchetype({ f0: 10, f1: 13, f2: 13, ceiling: 35 });
  assert.equal(stalled.limit, 35);
  assert.ok(stalled.proj.every((v) => v === 13 || v === 10), "no progress in the last step means a flat projection");
});

test("an explicit asymptote binds below the ceiling", () => {
  const { limit, proj } = projectArchetype({ f0: 20, f1: 30, f2: 38, ceiling: 90, asymptote: 60 }, 30);
  assert.equal(limit, 60);
  assert.ok(proj[30] <= 60 && proj[30] > 59);
});

test("backfilled snapshots collapse every tier onto f0", () => {
  const a = assessments[index.assessments[0]];
  assert.equal(a.kind, "backfill");
  const m = computeModel({ taxonomy, occupations, assessment: a });
  for (const x of m.archetypes) { assert.equal(x.f1, x.f0); assert.equal(x.f2, x.f0); assert.deepEqual(x.range.f2, [x.f0, x.f0]); }
  for (const v of m.index.proj) close(v, m.index.f0);
});

test("weights and confidence shares sum to one", () => {
  for (const weight of ["wage", "employment"]) {
    const m = computeModel({ taxonomy, occupations, assessment: live, weight });
    close(m.occupations.reduce((s, o) => s + o.weight, 0), 1);
    close(m.archetypes.reduce((s, x) => s + x.share, 0), 1);
    const c = m.index.confidence;
    close(c.high + c.medium + c.low, 100, 1e-6);
    close(m.groups.reduce((s, g) => s + g.weight, 0), 1);
  }
});

test("the index ceiling equals the share-weighted sum of task-type ceilings", () => {
  const m = computeModel({ taxonomy, occupations, assessment: live });
  const expected = m.archetypes.reduce((s, x) => s + x.share * x.ceiling, 0);
  close(m.index.limit, expected, 1e-6);
});

test("edits apply on top of the live assessment and respect the ordering", () => {
  const base = computeModel({ taxonomy, occupations, assessment: live }).index;
  const bumped = computeModel({ taxonomy, occupations, assessment: live, edits: { meetings: { f0: 40 } } }).index;
  assert.ok(bumped.f0 > base.f0);
  const errs = validate({ taxonomy, occupations, assessment: { ...live, scores: { ...live.scores, meetings: { ...live.scores.meetings, f1: 5 } } } });
  assert.ok(errs.some((e) => e.includes("meetings") && e.includes("f0 <= f1")));
});

test("uncertainty bands follow confidence", () => {
  const high = scoreBand({ confidence: "high" }, live), low = scoreBand({ confidence: "low" }, live);
  assert.ok(high.f1 < low.f1 && high.f2 < low.f2);
  assert.ok(low.f2 > low.f1);
  const m = computeModel({ taxonomy, occupations, assessment: live });
  const width = (r) => r[1] - r[0];
  assert.ok(width(m.index.range.f2) > width(m.index.range.f1) && width(m.index.range.f1) > 0);
});

test("forecast ranges stay between today's score and the ceiling", () => {
  assert.deepEqual(scoreRange({ f0: 18, f1: 24, f2: 29, ceiling: 55 }, { f1: 7, f2: 11.2 }).f1, [18, 31]);
  assert.deepEqual(scoreRange({ f0: 88, f1: 92, f2: 95, ceiling: 99 }, { f1: 5, f2: 8 }).f2, [88, 99]);
  for (const weight of ["wage", "employment"]) {
    const m = computeModel({ taxonomy, occupations, assessment: live, weight });
    for (const x of m.archetypes) for (const k of ["f1", "f2"]) {
      const [lo, hi] = x.range[k];
      assert.ok(lo >= x.f0 && lo <= x[k] && hi >= x[k] && hi <= x.ceiling, `${x.id} ${k}: ${lo}–${hi}`);
    }
    const { f0, f1, f2, limit, range } = m.index;
    assert.ok(range.f1[0] >= f0 && range.f1[0] < f1 && range.f1[1] > f1 && range.f2[1] <= limit);
    assert.ok(range.f2[0] < f2 && range.f2[1] > f2);
  }
});

test("the shipped data validates", () => {
  for (const id of index.assessments) assert.deepEqual(validate({ taxonomy, occupations, assessment: assessments[id] }), []);
  assert.deepEqual(validateIndex({ taxonomy, index, assessments }), []);
});

test("validation catches a bad index and a missing source", () => {
  const bad = validateIndex({ taxonomy, index: { ...index, latest: index.assessments[0] }, assessments });
  assert.ok(bad.some((e) => e.includes("live")));
  const errs = validate({ taxonomy, occupations, assessment: { ...live, scores: { ...live.scores, draft: { ...live.scores.draft, sources: ["nope"] } } } });
  assert.ok(errs.some((e) => e.includes("unknown source id nope")));
});

test("every meetings task is split into live time and prep and follow-up", () => {
  for (const o of occupations.occupations) {
    o.tasks.forEach(([, arch, share], i) => {
      if (arch !== "meetings") return;
      const next = o.tasks[i + 1];
      assert.ok(next && next[1] === "followup", `${o.id}: meetings task without a follow-up task`);
      close(next[2] * 3, share, 1e-9);
    });
    assert.equal(o.tasks.filter((t) => t[1] === "followup").length, o.tasks.filter((t) => t[1] === "meetings").length, o.id);
  }
});

test("snapshot highlights cite sources the live snapshot lists", () => {
  const known = new Set(live.sources.map((s) => s.id));
  for (const id of index.assessments) for (const h of assessments[id].highlights || []) {
    assert.ok(typeof h === "object" && h.text && h.sources?.length, `${id}: highlight without sources`);
    for (const ref of h.sources) assert.ok(known.has(ref), `${id}: unknown source ${ref}`);
  }
  const broken = { ...assessments[index.assessments[0]], highlights: [{ text: "x", sources: ["nope"] }] };
  const errs = validateIndex({ taxonomy, index, assessments: { ...assessments, [broken.id]: broken } });
  assert.ok(errs.some((e) => e.includes("unknown source nope")));
});
