// Astra uses explicit, unrounded parameters. Caps are conditional scenario
// assumptions, never inferred intelligence limits or permanent human shares.
export const KINDS = ["physical", "regulation", "preference"];
export const finite = (x, min, max) =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
export function project({ now, rate, cap }, periods = 8) {
  if (!finite(now, 0, 100) || !finite(cap, now, 100) || !finite(rate, 0, 1))
    throw new Error("Invalid scenario parameters");
  return Array.from(
    { length: periods + 1 },
    (_, n) => cap - (cap - now) * (1 - rate) ** n,
  );
}
export function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validateBundle(b) {
  const errors = [],
    ids = new Set(),
    occIds = new Set(),
    sourceIds = new Set();
  const a = b.assessments[b.index.latest];
  if (!a || a.kind !== "live" || b.config.assessment !== a.id)
    return ["Astra configuration must match the current assessment"];
  if (
    !validDate(b.config.as_of) ||
    b.config.forecast_dates.length !== 2 ||
    b.config.forecast_dates.some((d) => !validDate(d)) ||
    !(
      b.config.as_of < b.config.forecast_dates[0] &&
      b.config.forecast_dates[0] < b.config.forecast_dates[1]
    )
  )
    errors.push("Invalid assessment or forecast dates");
  if (
    validDate(b.config.as_of) &&
    b.config.forecast_dates.some(
      (d, i) => d !== periodDate(b.config.as_of, i + 1),
    )
  )
    errors.push("Forecast dates must match the six-month model periods");
  for (const s of a.sources) {
    if (sourceIds.has(s.id)) errors.push(`Duplicate source ${s.id}`);
    sourceIds.add(s.id);
    if (!/^https:\/\//.test(s.url)) errors.push(`Invalid source URL ${s.id}`);
  }
  for (const t of b.taxonomy.archetypes) {
    if (ids.has(t.id)) errors.push(`Duplicate task type ${t.id}`);
    ids.add(t.id);
    const s = a.scores[t.id];
    if (
      !s ||
      !finite(s.f0, 0, 100) ||
      !finite(s.ceiling, s.f0, 100) ||
      !finite(b.config.rates[t.id], 0, 1)
    )
      errors.push(`Invalid parameters ${t.id}`);
    if (!a.evidence[t.id]) errors.push(`Missing evidence ${t.id}`);
    for (const id of s?.sources || [])
      if (!sourceIds.has(id)) errors.push(`Unknown source ${id}`);
  }
  const groups = new Set(b.occupations.groups.map((g) => g.id));
  if (groups.size !== b.occupations.groups.length)
    errors.push("Duplicate group");
  for (const o of b.occupations.occupations) {
    if (occIds.has(o.id)) errors.push(`Duplicate occupation ${o.id}`);
    occIds.add(o.id);
    if (!groups.has(o.group)) errors.push(`Unknown group ${o.group}`);
    if (
      !finite(o.employment, Number.MIN_VALUE, Infinity) ||
      !finite(o.wage, Number.MIN_VALUE, Infinity)
    )
      errors.push(`Invalid employment or wage ${o.id}`);
    if (!Array.isArray(o.tasks) || !o.tasks.length) {
      errors.push(`Missing tasks ${o.id}`);
      continue;
    }
    if (Math.abs(o.tasks.reduce((s, t) => s + t[2], 0) - 100) > 0.00001)
      errors.push(`Task shares do not sum to 100: ${o.id}`);
    for (const [, id, share] of o.tasks)
      if (!ids.has(id) || !finite(share, Number.MIN_VALUE, 100))
        errors.push(`Invalid task allocation ${o.id}:${id}`);
  }
  for (const [key, ov] of Object.entries(a.overrides || {})) {
    const parts = key.split(":");
    const o = b.occupations.occupations.find((x) => x.id === parts[0]);
    if (parts.length !== 2 || !o?.tasks.some((t) => t[1] === parts[1])) {
      errors.push(`Invalid override target ${key}`);
      continue;
    }
    const s = { ...a.scores[parts[1]], ...ov };
    if (
      !finite(s.f0, 0, 100) ||
      !finite(s.ceiling, s.f0, 100) ||
      (ov.rate !== undefined && !finite(ov.rate, 0, 1))
    )
      errors.push(`Invalid override ${key}`);
  }
  if (new Set(b.index.assessments).size !== b.index.assessments.length)
    errors.push("Duplicate assessment index");
  for (const id of b.index.assessments) {
    const s = b.assessments[id];
    if (
      !s ||
      s.id !== id ||
      !validDate(s.date) ||
      !["live", "backfill"].includes(s.kind)
    ) {
      errors.push(`Invalid assessment ${id}`);
      continue;
    }
    for (const t of ids)
      if (!finite(s.scores?.[t]?.f0, 0, 100))
        errors.push(`Invalid historical score ${id}:${t}`);
  }
  for (const k of KINDS)
    for (const id of b.config.constraint_tags[k] || [])
      if (!ids.has(id)) errors.push(`Unknown constraint task ${id}`);
  return errors;
}
export function cleanEdits(raw, bundle) {
  const out = {},
    scores = bundle.assessments[bundle.index.latest].scores;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const id of Object.keys(scores)) {
    const e = raw[id];
    if (!e || typeof e !== "object" || Array.isArray(e)) continue;
    const p = {
      now: scores[id].f0,
      cap: scores[id].ceiling,
      rate: bundle.config.rates[id],
    };
    for (const k of ["now", "cap", "rate"])
      if (Object.hasOwn(e, k)) p[k] = e[k];
    if (
      !finite(p.now, 0, 100) ||
      !finite(p.cap, p.now, 100) ||
      !finite(p.rate, 0, 1)
    )
      continue;
    if (
      p.now !== scores[id].f0 ||
      p.cap !== scores[id].ceiling ||
      p.rate !== bundle.config.rates[id]
    )
      out[id] = p;
  }
  return out;
}
export function cleanMixes(raw, bundle) {
  const result = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return result;
  for (const o of bundle.occupations.occupations) {
    const v = raw[o.id];
    if (
      !Array.isArray(v) ||
      v.length !== o.tasks.length ||
      !v.every((x) => finite(x, 0, 100)) ||
      Math.abs(v.reduce((s, x) => s + x, 0) - 100) > 0.00001
    )
      continue;
    if (v.some((x, i) => x !== o.tasks[i][2])) result[o.id] = v;
  }
  return result;
}
export function compute(
  bundle,
  weight = "wage",
  edits = {},
  periods = 8,
  mixes = {},
) {
  const a = bundle.assessments[bundle.index.latest];
  const tasks = bundle.taxonomy.archetypes.map((t) => {
    const s = a.scores[t.id];
    const p = {
      now: s.f0,
      cap: s.ceiling,
      rate: bundle.config.rates[t.id],
      ...edits[t.id],
    };
    return {
      ...t,
      ...p,
      proj: project(p, periods),
      share: 0,
      confidence: s.confidence,
      sources: s.sources || [],
      evidence: a.evidence[t.id],
      constraints: KINDS.filter((k) =>
        bundle.config.constraint_tags[k].includes(t.id),
      ),
    };
  });
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const total = bundle.occupations.occupations.reduce(
    (s, o) => s + o.employment * (weight === "wage" ? o.wage : 1),
    0,
  );
  const occupations = bundle.occupations.occupations.map((o) => {
    const w = (o.employment * (weight === "wage" ? o.wage : 1)) / total;
    const ts = o.tasks.map(([name, id, originalShare], i) => {
      const share = mixes[o.id]?.[i] ?? originalShare;
      byId[id].share += (w * share) / 100;
      const base = byId[id],
        ov = a.overrides?.[`${o.id}:${id}`];
      const p = ov
        ? {
            now: ov.f0 ?? base.now,
            cap: ov.ceiling ?? base.cap,
            rate: ov.rate ?? base.rate,
          }
        : base;
      return {
        name,
        id,
        share,
        proj: ov ? project(p, periods) : base.proj,
        cap: p.cap,
      };
    });
    const proj = Array.from({ length: periods + 1 }, (_, n) =>
      ts.reduce((s, t) => s + (t.share / 100) * t.proj[n], 0),
    );
    const codes = bundle.bls.rows.find((v) => v.occupation === o.id)?.codes || [
      o.soc,
    ];
    return {
      ...o,
      codes,
      tasks: ts,
      weight: w,
      proj,
      cap: ts.reduce((s, t) => s + (t.share / 100) * t.cap, 0),
    };
  });
  const proj = Array.from({ length: periods + 1 }, (_, n) =>
    occupations.reduce((s, o) => s + o.weight * o.proj[n], 0),
  );
  const cap = occupations.reduce((s, o) => s + o.weight * o.cap, 0);
  const flat = proj.findIndex((v, n) => n > 0 && v - proj[n - 1] < 1);
  const confidence = Object.fromEntries(
    ["high", "medium", "low"].map((k) => [
      k,
      100 *
        tasks
          .filter((t) => t.confidence === k)
          .reduce((s, t) => s + t.share, 0),
    ]),
  );
  const history = bundle.index.assessments
    .map((id) => {
      const s = bundle.assessments[id];
      const value = occupations.reduce(
        (sum, o) =>
          sum +
          o.weight *
            o.tasks.reduce(
              (v, t) =>
                v +
                (t.share / 100) *
                  (s.overrides?.[`${o.id}:${t.id}`]?.f0 ?? s.scores[t.id].f0),
              0,
            ),
        0,
      );
      return {
        id,
        date: id === a.id ? bundle.config.as_of : s.date,
        model: s.anchor,
        value,
        kind: s.kind,
      };
    })
    .sort((x, y) => x.date.localeCompare(y.date));
  return {
    tasks,
    byId,
    occupations,
    proj,
    cap,
    flatAt: flat === -1 ? null : flat,
    confidence,
    history,
    totalEmployment: occupations.reduce((s, o) => s + o.employment, 0),
  };
}
export function periodDate(asOf, n) {
  const d = new Date(asOf + "T00:00:00Z"),
    day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 6 * n);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
