// Saturation model. Shared by the site (browser) and scripts/validate.mjs (Node).
//
// occupation -> tasks (% of time) -> archetype -> saturation score per tier.
// Each archetype is projected past Frontier+2 by assuming the remaining gap to
// its limit keeps shrinking at the rate implied by the last two steps.

export const TIERS = ["f0", "f1", "f2"];

// Limit an archetype converges to, and the per-generation gap-shrink rate.
export function projectArchetype({ f0, f1, f2, ceiling }, horizon = 8) {
  const d1 = f1 - f0;
  const d2 = f2 - f1;
  let trend = Infinity; // where the f0->f1->f2 trajectory flattens out on its own
  if (d1 > 0 && d2 >= 0 && d2 < d1) {
    const r = d2 / d1;
    trend = f2 + (d2 * r) / (1 - r);
  }
  const limit = Math.max(f2, Math.min(ceiling, trend));
  const rate = limit - f1 > 0 ? (limit - f2) / (limit - f1) : 0;
  const proj = [f0, f1, f2];
  for (let n = 3; n <= horizon; n++) proj.push(limit - (limit - f2) * rate ** (n - 2));
  return { limit, rate, proj, bound: trend < ceiling ? "intelligence" : "structural", trend };
}

export function validate({ taxonomy, occupations, assessment }) {
  const errors = [];
  const archIds = new Set(taxonomy.archetypes.map((a) => a.id));
  const groupIds = new Set(occupations.groups.map((g) => g.id));
  const seen = new Set();
  for (const o of occupations.occupations) {
    if (seen.has(o.id)) errors.push(`duplicate occupation id ${o.id}`);
    seen.add(o.id);
    if (!groupIds.has(o.group)) errors.push(`${o.id}: unknown group ${o.group}`);
    if (!(o.employment > 0) || !(o.wage > 0)) errors.push(`${o.id}: employment and wage must be positive`);
    const sum = o.tasks.reduce((s, t) => s + t[2], 0);
    if (Math.abs(sum - 100) > 0.01) errors.push(`${o.id}: task shares sum to ${sum}, expected 100`);
    for (const [name, arch] of o.tasks) if (!archIds.has(arch)) errors.push(`${o.id}: task "${name}" uses unknown archetype ${arch}`);
  }
  for (const id of archIds) {
    const s = assessment.scores[id];
    if (!s) { errors.push(`assessment ${assessment.id}: no score for ${id}`); continue; }
    const v = [s.f0, s.f1, s.f2, s.ceiling];
    if (v.some((x) => typeof x !== "number" || x < 0 || x > 100)) errors.push(`${id}: scores must be numbers 0-100`);
    if (!(s.f0 <= s.f1 && s.f1 <= s.f2 && s.f2 <= s.ceiling)) errors.push(`${id}: expected f0 <= f1 <= f2 <= ceiling`);
  }
  for (const key of Object.keys(assessment.overrides || {})) {
    const [occ, arch] = key.split(":");
    if (!seen.has(occ) || !archIds.has(arch)) errors.push(`override ${key}: unknown occupation or archetype`);
  }
  return errors;
}

// weight: "wage" (share of white-collar wage bill) or "employment" (share of jobs).
// edits: { archetypeId: { f0?, f1?, f2?, ceiling? } } applied on top of the assessment.
export function computeModel({ taxonomy, occupations, assessment, weight = "wage", edits = {}, horizon = 8 }) {
  const archetypes = taxonomy.archetypes.map((a) => {
    const s = { ...assessment.scores[a.id], ...(edits[a.id] || {}) };
    return { ...a, f0: s.f0, f1: s.f1, f2: s.f2, ceiling: s.ceiling, ...projectArchetype(s, horizon), share: 0 };
  });
  const byId = Object.fromEntries(archetypes.map((a) => [a.id, a]));
  const overrides = assessment.overrides || {};

  const occs = occupations.occupations.map((o) => {
    const tasks = o.tasks.map(([name, arch, share]) => {
      const ov = overrides[`${o.id}:${arch}`];
      const { proj, limit } = ov ? projectArchetype({ ...byId[arch], ...ov }, horizon) : byId[arch];
      return { name, arch, share, proj, limit };
    });
    const proj = Array.from({ length: horizon + 1 }, (_, n) => tasks.reduce((s, t) => s + (t.share / 100) * t.proj[n], 0));
    const limit = tasks.reduce((s, t) => s + (t.share / 100) * t.limit, 0);
    return { ...o, tasks, proj, limit, wageBill: o.employment * o.wage };
  });

  const raw = (o) => (weight === "employment" ? o.employment : o.wageBill);
  const total = occs.reduce((s, o) => s + raw(o), 0);
  for (const o of occs) {
    o.weight = raw(o) / total;
    for (const t of o.tasks) byId[t.arch].share += o.weight * (t.share / 100);
  }

  const proj = Array.from({ length: horizon + 1 }, (_, n) => occs.reduce((s, o) => s + o.weight * o.proj[n], 0));
  const limit = occs.reduce((s, o) => s + o.weight * o.limit, 0);
  // First generation whose gain over the previous one is under one point.
  let flatAt = proj.findIndex((v, n) => n > 0 && v - proj[n - 1] < 1);
  if (flatAt === -1) flatAt = horizon;

  const groups = occupations.groups.map((g) => {
    const members = occs.filter((o) => o.group === g.id);
    const w = members.reduce((s, o) => s + o.weight, 0);
    const gp = proj.map((_, n) => members.reduce((s, o) => s + o.weight * o.proj[n], 0) / (w || 1));
    return { ...g, weight: w, proj: gp, employment: members.reduce((s, o) => s + o.employment, 0) };
  });

  return {
    archetypes,
    occupations: occs,
    groups,
    index: { proj, limit, flatAt, f0: proj[0], f1: proj[1], f2: proj[2] },
    totals: {
      employment: occs.reduce((s, o) => s + o.employment, 0),
      wageBill: occs.reduce((s, o) => s + o.wageBill, 0),
    },
  };
}
