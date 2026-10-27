// Saturation model. Shared by the site (browser), scripts/validate.mjs and tests/ (Node).
//
// occupation -> tasks (% of working time) -> task type -> score per tier.
// Tiers: f0 is today's frontier, f1 is Frontier+1, f2 is Frontier+2. Each task type
// has a ceiling, the most of it AI could take with unlimited intelligence. Past f2
// the remaining gap to the ceiling keeps closing at the rate implied by the last
// step (f1 -> f2), unless the assessment states an explicit lower `asymptote` for
// that type. Nothing is inferred from the shape of the f0 -> f1 -> f2 path itself:
// with whole-number scores that shape is mostly rounding noise.

export const TIERS = ["f0", "f1", "f2"];
export const CONFIDENCE = ["high", "medium", "low"];
export const DEFAULT_UNCERTAINTY = { f1: 5, f2: 8, by_confidence: { high: 0.6, medium: 1, low: 1.4 } };

const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const isScore = (x) => typeof x === "number" && x >= 0 && x <= 100;

export function projectArchetype({ f0, f1, f2, ceiling, asymptote }, horizon = 8) {
  const limit = Math.max(f2, Math.min(ceiling, asymptote ?? ceiling));
  const rate = limit > f1 ? (limit - f2) / (limit - f1) : 1;
  const proj = [f0, f1, f2];
  for (let n = 3; n <= horizon; n++) proj.push(limit - (limit - f2) * rate ** (n - 2));
  return { limit, rate, proj };
}

// Half-width of the forecast range for one task type, in points, for f1 and f2.
export function scoreBand(score, assessment) {
  const u = { ...DEFAULT_UNCERTAINTY, ...(assessment.uncertainty || {}) };
  const mult = u.by_confidence?.[score.confidence] ?? 1;
  return { f1: score.range?.f1 ?? u.f1 * mult, f2: score.range?.f2 ?? u.f2 * mult };
}

// The forecast range as [low, high] for f1 and f2: the half-width either side of the
// forecast, cut off at today's score (scores do not fall) and at the ceiling.
export function scoreRange({ f0, f1, f2, ceiling }, half) {
  const cut = (v, h) => [Math.max(f0, v - h), Math.min(ceiling, v + h)];
  return { f1: cut(f1, half.f1), f2: cut(f2, half.f2) };
}

// Checks one assessment against the taxonomy and occupations. Returns a list of errors.
export function validate({ taxonomy, occupations, assessment }) {
  const errors = [];
  const archIds = new Set(taxonomy.archetypes.map((a) => a.id));
  if (archIds.size !== taxonomy.archetypes.length) errors.push("taxonomy: duplicate archetype id");
  const groupIds = new Set(occupations.groups.map((g) => g.id));
  for (const g of occupations.groups) {
    if (!g.id || !g.name) errors.push(`group ${JSON.stringify(g)}: needs id and name`);
    if (g.employment_bls !== undefined && !(g.employment_bls > 0)) errors.push(`group ${g.id}: employment_bls must be positive`);
  }
  const seen = new Set();
  for (const o of occupations.occupations) {
    if (seen.has(o.id)) errors.push(`duplicate occupation id ${o.id}`);
    seen.add(o.id);
    if (!o.title || !o.soc) errors.push(`${o.id}: needs title and soc`);
    if (!groupIds.has(o.group)) errors.push(`${o.id}: unknown group ${o.group}`);
    if (!(o.employment > 0) || !(o.wage > 0)) errors.push(`${o.id}: employment and wage must be positive`);
    if (!Array.isArray(o.tasks) || o.tasks.length < 2 || o.tasks.length > 7) errors.push(`${o.id}: expected 2 to 7 tasks`);
    const sum = (o.tasks || []).reduce((s, t) => s + t[2], 0);
    if (Math.abs(sum - 100) > 0.01) errors.push(`${o.id}: task shares sum to ${sum}, expected 100`);
    for (const [name, arch, share] of o.tasks || []) {
      if (!archIds.has(arch)) errors.push(`${o.id}: task "${name}" uses unknown archetype ${arch}`);
      if (!(share > 0)) errors.push(`${o.id}: task "${name}" needs a positive share`);
    }
  }

  const a = assessment;
  const tag = `assessment ${a.id}`;
  if (!a.id) errors.push("assessment: missing id");
  if (!isDate(a.date)) errors.push(`${tag}: date must be YYYY-MM-DD`);
  if (a.updated !== undefined && !isDate(a.updated)) errors.push(`${tag}: updated must be YYYY-MM-DD`);
  if (!a.anchor) errors.push(`${tag}: missing anchor`);
  if (a.report_url !== undefined && !/^https?:\/\//.test(a.report_url)) errors.push(`${tag}: report_url must be an http(s) url`);
  if (!["live", "backfill"].includes(a.kind)) errors.push(`${tag}: kind must be live or backfill`);
  const live = a.kind === "live";
  if (live) {
    if (!(a.cadence_months > 0)) errors.push(`${tag}: live snapshot needs cadence_months > 0`);
    const fd = a.forecast_dates;
    if (fd) {
      if (!isDate(fd.f1) || !isDate(fd.f2)) errors.push(`${tag}: forecast_dates.f1 and .f2 must be YYYY-MM-DD`);
      else if (!(a.date < fd.f1 && fd.f1 < fd.f2)) errors.push(`${tag}: expected date < forecast_dates.f1 < forecast_dates.f2`);
    }
    if (a.uncertainty) {
      for (const k of ["f1", "f2"]) if (a.uncertainty[k] !== undefined && !(a.uncertainty[k] >= 0)) errors.push(`${tag}: uncertainty.${k} must be >= 0`);
    }
  }
  const sourceIds = new Set();
  for (const s of a.sources || []) {
    if (!s.id) errors.push(`${tag}: source "${s.title}" needs an id`);
    else if (sourceIds.has(s.id)) errors.push(`${tag}: duplicate source id ${s.id}`);
    sourceIds.add(s.id);
    if (!s.title || !/^https?:\/\//.test(s.url || "")) errors.push(`${tag}: source ${s.id || s.title} needs title and http(s) url`);
    if (live && !s.group) errors.push(`${tag}: source ${s.id} needs a group`);
    if (s.tier !== undefined && !["primary", "independent", "secondary"].includes(s.tier)) errors.push(`${tag}: source ${s.id} tier must be primary, independent or secondary`);
    if (s.accessed !== undefined && !isDate(s.accessed)) errors.push(`${tag}: source ${s.id} accessed must be YYYY-MM-DD`);
  }
  for (const id of archIds) {
    const s = a.scores?.[id];
    if (!s) { errors.push(`${tag}: no score for ${id}`); continue; }
    if (!isScore(s.f0)) errors.push(`${tag} ${id}: f0 must be a number 0-100`);
    const hasTiers = ["f1", "f2", "ceiling"].some((k) => s[k] !== undefined);
    if (live || hasTiers) {
      const v = [s.f0, s.f1, s.f2, s.ceiling];
      if (!v.every(isScore)) errors.push(`${tag} ${id}: f0, f1, f2 and ceiling must be numbers 0-100`);
      else if (!(s.f0 <= s.f1 && s.f1 <= s.f2 && s.f2 <= s.ceiling)) errors.push(`${tag} ${id}: expected f0 <= f1 <= f2 <= ceiling`);
      if (s.asymptote !== undefined && !(isScore(s.asymptote) && s.f2 <= s.asymptote && s.asymptote <= s.ceiling)) errors.push(`${tag} ${id}: asymptote must satisfy f2 <= asymptote <= ceiling`);
    }
    if (live) {
      if (!CONFIDENCE.includes(s.confidence)) errors.push(`${tag} ${id}: confidence must be high, medium or low`);
      if (!a.evidence?.[id]) errors.push(`${tag} ${id}: missing evidence note`);
      for (const ref of s.sources || []) if (!sourceIds.has(ref)) errors.push(`${tag} ${id}: unknown source id ${ref}`);
      if (s.range) for (const k of ["f1", "f2"]) if (s.range[k] !== undefined && !(s.range[k] >= 0)) errors.push(`${tag} ${id}: range.${k} must be >= 0`);
    }
  }
  for (const [key, ov] of Object.entries(a.overrides || {})) {
    const [occ, arch] = key.split(":");
    if (!seen.has(occ) || !archIds.has(arch)) { errors.push(`${tag}: override ${key}: unknown occupation or archetype`); continue; }
    const m = { ...a.scores[arch], ...ov };
    if (!(m.f0 <= m.f1 && m.f1 <= m.f2 && m.f2 <= m.ceiling)) errors.push(`${tag}: override ${key}: expected f0 <= f1 <= f2 <= ceiling`);
  }
  return errors;
}

// Checks the set of assessments together: the index, dates and the history of scores.
export function validateIndex({ taxonomy, index, assessments }) {
  const errors = [];
  if (!index.assessments.includes(index.latest)) errors.push(`index: latest "${index.latest}" is not in the assessments list`);
  const list = index.assessments.map((id) => assessments[id]).filter(Boolean);
  if (list.length !== index.assessments.length) errors.push("index: an assessment file is missing");
  const latest = assessments[index.latest];
  if (latest && latest.kind !== "live") errors.push(`index: latest "${index.latest}" must be a live snapshot`);
  const dates = list.map((a) => a.date);
  if (new Set(dates).size !== dates.length) errors.push("index: two snapshots share a date");
  const byDate = [...list].sort((p, q) => p.date.localeCompare(q.date));
  if (latest && byDate[byDate.length - 1]?.id !== latest.id) errors.push("index: the latest snapshot is not the most recent by date");
  // Highlights may cite sources by id; every snapshot resolves them against the live snapshot's list.
  const known = new Set((latest?.sources || []).map((s) => s.id));
  for (const a of list) for (const h of a.highlights || []) {
    if (typeof h === "string") continue;
    if (!h.text) errors.push(`${a.id}: highlight needs text`);
    for (const ref of h.sources || []) if (!known.has(ref)) errors.push(`${a.id}: highlight "${h.text}" cites unknown source ${ref}`);
  }
  for (const arch of taxonomy.archetypes) {
    let prev = null;
    for (const a of byDate) {
      const v = a.scores?.[arch.id]?.f0;
      if (prev && typeof v === "number" && v < prev.v) errors.push(`${arch.id}: f0 falls from ${prev.v} (${prev.id}) to ${v} (${a.id}); scores should not fall between snapshots`);
      if (typeof v === "number") prev = { v, id: a.id };
    }
  }
  return errors;
}

// Averages the ends of the forecast ranges the way scores are averaged; avg(pick) applies
// the caller's weighted average to pick(range). Adding up the task-type ranges like this
// assumes their errors move together.
const mixRange = (avg) => ({
  f1: [avg((r) => r.f1[0]), avg((r) => r.f1[1])],
  f2: [avg((r) => r.f2[0]), avg((r) => r.f2[1])],
});

// weight: "wage" (share of the covered wage bill) or "employment" (share of jobs).
// edits: { archetypeId: { f0?, f1?, f2?, ceiling? } } applied on top of a live assessment.
export function computeModel({ taxonomy, occupations, assessment, weight = "wage", edits = {}, horizon = 8 }) {
  const backfill = assessment.kind === "backfill";
  const archetypes = taxonomy.archetypes.map((a) => {
    const stored = assessment.scores[a.id];
    // A backfilled snapshot scores only the frontier of its day; any stored f1/f2 are
    // the forecasts it made while live, kept for the predicted-vs-actual check.
    const s = backfill
      ? { f0: stored.f0, f1: stored.f0, f2: stored.f0, ceiling: 100 }
      : { f0: stored.f0, f1: stored.f1, f2: stored.f2, ceiling: stored.ceiling, asymptote: stored.asymptote, ...(edits[a.id] || {}) };
    const confidence = CONFIDENCE.includes(stored.confidence) ? stored.confidence : "medium";
    const band = backfill ? { f1: 0, f2: 0 } : scoreBand({ ...stored, confidence }, assessment);
    return { ...a, ...s, confidence, band, range: scoreRange(s, band), sources: stored.sources || [], ...projectArchetype(s, horizon), share: 0 };
  });
  const byId = Object.fromEntries(archetypes.map((x) => [x.id, x]));
  const overrides = assessment.overrides || {};

  const occs = occupations.occupations.map((o) => {
    const tasks = o.tasks.map(([name, arch, share]) => {
      const base = byId[arch];
      const ov = overrides[`${o.id}:${arch}`];
      const { proj, limit } = ov ? projectArchetype({ ...base, ...ov }, horizon) : base;
      const range = ov ? scoreRange({ ...base, ...ov }, base.band) : base.range;
      return { name, arch, share, proj, limit, range, confidence: base.confidence };
    });
    const mix = (f) => tasks.reduce((s, t) => s + (t.share / 100) * f(t), 0);
    const proj = Array.from({ length: horizon + 1 }, (_, n) => mix((t) => t.proj[n]));
    return {
      ...o, tasks, proj,
      limit: mix((t) => t.limit),
      range: mixRange((f) => mix((t) => f(t.range))),
      lowShare: tasks.filter((t) => t.confidence === "low").reduce((s, t) => s + t.share, 0),
      wageBill: o.employment * o.wage,
    };
  });

  const raw = (o) => (weight === "employment" ? o.employment : o.wageBill);
  const total = occs.reduce((s, o) => s + raw(o), 0);
  for (const o of occs) {
    o.weight = raw(o) / total;
    for (const t of o.tasks) byId[t.arch].share += o.weight * (t.share / 100);
  }
  const agg = (members, f) => members.reduce((s, o) => s + o.weight * f(o), 0);

  const proj = Array.from({ length: horizon + 1 }, (_, n) => agg(occs, (o) => o.proj[n]));
  const limit = agg(occs, (o) => o.limit);
  const range = mixRange((f) => agg(occs, (o) => f(o.range)));
  // First generation whose gain over the previous one is under one point.
  const flat = proj.findIndex((v, n) => n > 0 && v - proj[n - 1] < 1);
  const flatAt = flat === -1 ? null : flat; // null: still gaining a point or more at the end of the horizon
  const confidence = { high: 0, medium: 0, low: 0 };
  for (const x of archetypes) confidence[x.confidence] += x.share * 100;

  const groups = occupations.groups.map((g) => {
    const members = occs.filter((o) => o.group === g.id);
    const w = members.reduce((s, o) => s + o.weight, 0) || 1;
    return {
      ...g, weight: w,
      proj: proj.map((_, n) => agg(members, (o) => o.proj[n]) / w),
      limit: agg(members, (o) => o.limit) / w,
      range: mixRange((f) => agg(members, (o) => f(o.range)) / w),
      employment: members.reduce((s, o) => s + o.employment, 0),
      count: members.length,
    };
  });

  return {
    archetypes,
    occupations: occs,
    groups,
    index: { proj, limit, flatAt, f0: proj[0], f1: proj[1], f2: proj[2], range, confidence },
    totals: {
      employment: occs.reduce((s, o) => s + o.employment, 0),
      wageBill: occs.reduce((s, o) => s + o.wageBill, 0),
    },
  };
}

/* ---------- Economic value ---------- */
// What the labs earn from U.S. white-collar work, built from four links:
//   revenue(t) = value of the work AI can do(t) × adoption(t) × price(t) × cut(t)
// - The value of the work AI can do is the wage bill times this site's index.
// - Adoption is the share of that work AI actually does. It follows a logistic curve from
//   today's level toward a peak, starting at a stated annual growth multiple, so it can grow
//   fast early and must slow as it nears the peak.
// - Price is what customers pay for AI work per dollar of wages the same work costs.
// - Cut is the share of that spending that reaches the labs rather than the apps built on them.
// Price and cut move from today's levels to their long-run values in step with adoption.
// Today's adoption is not measured directly: it is what the labs' U.S. work revenue implies
// at today's price and cut, checked against surveys of hours worked with AI.

// Adoption t years from now.
export function adoptionAt(t, { a0, growth, peak }) {
  if (!(a0 > 0) || !(peak > a0) || !(growth > 1)) return a0;
  const k = Math.log(growth) / (1 - a0 / peak);
  return peak / (1 + ((peak - a0) / a0) * Math.exp(-k * t));
}

// A value that moves from `from` (at today's adoption) to `to` (at peak adoption).
export function driftAt(adoption, { a0, peak, from, to }) {
  if (!(peak > a0)) return from;
  const done = Math.min(1, Math.max(0, (adoption - a0) / (peak - a0)));
  return from + (to - from) * done;
}

// The part of each lab's revenue that comes from U.S. work: run-rate × U.S. share × work share.
export function scopedRevenue(rev, { us, work }) {
  return rev * us * work;
}

// A survey share of white-collar hours: figures by group, weighted by each group's weight in
// the model. Groups without a figure are left out of the average.
export function groupAverage(groups, byGroup) {
  let sum = 0, w = 0;
  for (const g of groups) {
    const v = byGroup?.[g.id];
    if (typeof v !== "number") continue;
    sum += g.weight * v;
    w += g.weight;
  }
  return w ? sum / w / 100 : NaN;
}

// Linear interpolation over sorted [{ t, v }] points, held flat beyond both ends.
export function interpolate(points, t) {
  if (!points.length) return NaN;
  if (t <= points[0].t) return points[0].v;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (t <= b.t) return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t);
  }
  return points[points.length - 1].v;
}

// Log-linear interpolation of one lab's revenue reports (growth is roughly exponential).
// Returns null outside the reported span, so labs are only summed where they are covered.
export function revenueAt(reports, t) {
  if (!reports.length || t < reports[0].t || t > reports[reports.length - 1].t) return null;
  for (let i = 1; i < reports.length; i++) {
    const a = reports[i - 1], b = reports[i];
    if (t <= b.t) return a.v * Math.pow(b.v / a.v, (t - a.t) / (b.t - a.t || 1));
  }
  return reports[0].v;
}

// Checks data/economics.json. Returns a list of errors.
export function validateEconomics(econ, sourceIds = new Set()) {
  const errors = [];
  if (!econ) return errors;
  if (!isDate(econ.as_of)) errors.push("economics: as_of must be YYYY-MM-DD");
  const labs = new Set((econ.labs || []).map((l) => l.id));
  if (!labs.size) errors.push("economics: no labs");
  const seen = new Set();
  for (const r of econ.revenue || []) {
    const tag = `economics: ${r.lab} ${r.date}`;
    if (!labs.has(r.lab)) errors.push(`${tag}: unknown lab`);
    if (!isDate(r.date)) errors.push(`${tag}: date must be YYYY-MM-DD`);
    if (!(r.run_rate > 0)) errors.push(`${tag}: run_rate must be positive (USD billions)`);
    if (seen.has(`${r.lab}|${r.date}`)) errors.push(`${tag}: duplicate report`);
    seen.add(`${r.lab}|${r.date}`);
    for (const s of r.sources || []) if (sourceIds.size && !sourceIds.has(s)) errors.push(`${tag}: unknown source id ${s}`);
  }
  for (const lab of labs) {
    const dates = (econ.revenue || []).filter((r) => r.lab === lab).map((r) => r.date);
    if (dates.some((d, i) => i && d < dates[i - 1])) errors.push(`economics: ${lab} reports must be in date order`);
  }
  const known = (tag, ids) => { for (const id of ids || []) if (sourceIds.size && !sourceIds.has(id)) errors.push(`economics: ${tag}: unknown source id ${id}`); };
  const frac = (v) => v > 0 && v <= 1;
  for (const lab of labs) {
    const sc = econ.scope?.[lab];
    if (!sc) { errors.push(`economics: no scope for ${lab}`); continue; }
    if (!frac(sc.us) || !frac(sc.work)) errors.push(`economics: scope for ${lab}: us and work must be shares above 0 and at most 1`);
    known(`scope ${lab}`, sc.sources);
  }
  for (const k of ["price", "cut"]) {
    const x = econ[k];
    if (!x || !frac(x.now)) errors.push(`economics: ${k}.now must be a share above 0 and at most 1`);
    known(k, x?.sources);
    for (const e of x?.evidence || []) known(`${k} evidence`, e.sources);
  }
  const ad = econ.adoption;
  if (!ad) errors.push("economics: no adoption survey data");
  else {
    if (!isDate(ad.as_of)) errors.push("economics: adoption as_of must be YYYY-MM-DD");
    for (const k of ["saved", "assisted"]) {
      const vals = Object.values(ad[k] || {});
      if (!vals.length) errors.push(`economics: adoption has no ${k} figures`);
      if (vals.some((v) => !(v >= 0 && v <= 100))) errors.push(`economics: adoption ${k} figures must be percentages from 0 to 100`);
    }
    known("adoption", ad.sources);
  }
  for (const [id, sc] of Object.entries(econ.scenarios || {})) {
    if (!(sc.growth >= 1)) errors.push(`economics: scenario ${id} growth must be >= 1`);
    for (const k of ["peak", "price", "cut"]) if (!frac(sc[k])) errors.push(`economics: scenario ${id} ${k} must be a share above 0 and at most 1`);
  }
  return errors;
}
