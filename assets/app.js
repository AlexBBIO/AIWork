import { computeModel, TIERS } from "./model.js";

const $ = (id) => document.getElementById(id);
const HORIZON = 8;
const fmt = (x, d = 1) => x.toFixed(d);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const state = {
  weight: store.get("headroom.weight", "wage"),
  assessmentId: null,
  sort: { key: "weight", dir: -1 },
  group: "",
  search: "",
  expanded: new Set(),
  showAllRemaining: false,
  edits: {},
};

let data; // { taxonomy, occupations, index, assessments: {id: assessment} }
let model;

async function load() {
  const get = (p) => fetch(p).then((r) => { if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); });
  const [taxonomy, occupations, index] = await Promise.all([get("data/taxonomy.json"), get("data/occupations.json"), get("data/assessments/index.json")]);
  const list = await Promise.all(index.assessments.map((id) => get(`data/assessments/${id}.json`)));
  data = { taxonomy, occupations, index, assessments: Object.fromEntries(list.map((a) => [a.id, a])) };
  state.assessmentId = index.latest;
  state.edits = store.get(`headroom.edits.${state.assessmentId}`, {});
  setupControls();
  render();
}

const assessment = () => data.assessments[state.assessmentId];
const tierLabel = (t) => assessment().tiers[t].label;
const genLabel = (n) => (n === 0 ? "Frontier" : `Frontier+${n}`);
const genYear = (n) => {
  const d = new Date(assessment().date);
  return Math.round((d.getFullYear() + d.getMonth() / 12 + (n * assessment().cadence_months) / 12) * 10) / 10;
};
const tierVar = (i) => `var(--t${i})`;

function setupControls() {
  const sel = $("assessment-select");
  sel.innerHTML = [...data.index.assessments].reverse().map((id) => `<option value="${id}">${esc(data.assessments[id].date)} · ${esc(data.assessments[id].title)}</option>`).join("");
  sel.value = state.assessmentId;
  sel.addEventListener("change", () => {
    state.assessmentId = sel.value;
    state.edits = store.get(`headroom.edits.${state.assessmentId}`, {});
    render();
  });
  for (const b of document.querySelectorAll(".seg button")) {
    b.addEventListener("click", () => { state.weight = b.dataset.weight; store.set("headroom.weight", state.weight); render(); });
  }
  const gf = $("group-filter");
  gf.innerHTML += data.occupations.groups.map((g) => `<option value="${g.id}">${g.id} · ${esc(g.name)}</option>`).join("");
  gf.addEventListener("change", () => { state.group = gf.value; renderOccupations(); });
  $("occ-search").addEventListener("input", (e) => { state.search = e.target.value.trim().toLowerCase(); renderOccupations(); });
  $("remaining-toggle").addEventListener("click", () => { state.showAllRemaining = !state.showAllRemaining; renderRemaining(); });
  const reset = () => { state.edits = {}; store.set(`headroom.edits.${state.assessmentId}`, {}); render(); };
  $("reset-edits").addEventListener("click", reset);
  $("reset-edits-top").addEventListener("click", reset);
}

function render() {
  model = computeModel({ ...data, assessment: assessment(), weight: state.weight, edits: state.edits, horizon: HORIZON });
  for (const b of document.querySelectorAll(".seg button")) b.setAttribute("aria-checked", String(b.dataset.weight === state.weight));
  const hasEdits = Object.keys(state.edits).length > 0;
  $("edits-banner").hidden = !hasEdits;
  $("reset-edits").disabled = !hasEdits;
  renderHero();
  renderCurve();
  renderRemaining();
  renderOccupations();
  renderGroups();
  renderArchetypes();
  renderHistory();
  renderMethod();
}

/* ---------- Hero ---------- */

function renderHero() {
  const a = assessment();
  const { f0, f1, f2, limit, flatAt } = model.index;
  const t = model.totals;
  const w = state.weight === "wage" ? "of the white-collar wage bill" : "of white-collar working time";
  $("hero-eyebrow").textContent = `Assessment ${a.id} · scored ${a.date} · ${a.status}`;
  $("hero-lede").textContent =
    `Covers ${model.occupations.length} occupations, ${fmt(t.employment / 1000)} million jobs and $${fmt(t.wageBill / 1e6, 2)} trillion in annual wages. ` +
    `Today's frontier models could do about ${Math.round(f0)}% ${w}. The trend points to a limit near ${Math.round(limit)}%, ` +
    `with gains falling under a point per generation after ${genLabel(flatAt - 1)} (around ${Math.floor(genYear(flatAt - 1))}).`;

  const stat = (label, sw, value, sub) => `
    <div class="stat">
      <span class="stat-label">${sw ? `<span class="swatch ${sw.startsWith("var") ? "" : sw}" style="${sw.startsWith("var") ? `background:${sw}` : ""}"></span>` : ""}${label}</span>
      <span class="stat-value">${value}<small>%</small></span>
      <span class="stat-sub">${sub}</span>
    </div>`;
  $("readout").innerHTML =
    stat(tierLabel("f0"), tierVar(0), fmt(f0), `of work saturated now`) +
    stat(tierLabel("f1"), tierVar(1), fmt(f1), `+${fmt(f1 - f0)} pts, est. ${Math.floor(genYear(1))}`) +
    stat(tierLabel("f2"), tierVar(2), fmt(f2), `+${fmt(f2 - f1)} pts, est. ${Math.floor(genYear(2))}`) +
    stat("Implied limit", "open", fmt(limit), `${fmt(limit - f0)} pts above today`) +
    stat("Structural floor", "var(--struct)", fmt(100 - limit), `stays human at any capability`);

  const segs = [
    { v: f0, c: "var(--t0)", label: tierLabel("f0") },
    { v: f1 - f0, c: "var(--t1)", label: `Added by ${tierLabel("f1")}` },
    { v: f2 - f1, c: "var(--t2)", label: `Added by ${tierLabel("f2")}` },
    { v: limit - f2, cls: "seg-open", label: "Open to later generations" },
    { v: 100 - limit, c: "var(--struct)", label: "Structural floor" },
  ];
  $("gauge").innerHTML = segs.map((s) =>
    `<div class="${s.cls || ""}" style="flex:0 0 max(0px, calc(${s.v}% - 2px));${s.c ? `background:${s.c}` : ""}" data-tip="${esc(s.label)}|${fmt(s.v)} pts"></div>`).join("");
  $("gauge").setAttribute("role", "img");
  $("gauge").setAttribute("aria-label", segs.map((s) => `${s.label} ${fmt(s.v)} points`).join("; "));
  $("gauge-legend").innerHTML = segs.map((s) =>
    `<span><span class="swatch ${s.cls ? "open" : ""}" style="${s.c ? `background:${s.c}` : ""}"></span>${esc(s.label)} <span class="mono">${fmt(s.v)}</span></span>`).join("");
  bindTips($("gauge"));
}

/* ---------- Curve ---------- */

function renderCurve() {
  const box = $("curve");
  const { proj, limit, flatAt } = model.index;
  const W = Math.max(440, Math.min(760, box.clientWidth || 760)), H = W < 600 ? 260 : 300, m = { l: 38, r: 16, t: 16, b: 44 };
  const x = (n) => m.l + (n / HORIZON) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v / 100) * (H - m.t - m.b);
  const pts = proj.map((v, n) => [x(n), y(v)]);
  const path = (arr) => arr.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const yTicks = [0, 20, 40, 60, 80, 100];

  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Saturation index by model generation">
    <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--struct)" stroke-width="2"/></pattern></defs>
    <rect x="${m.l}" y="${y(100)}" width="${W - m.l - m.r}" height="${y(limit) - y(100)}" fill="url(#hatch)" opacity="0.35"/>
    <g class="grid">${yTicks.map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>`).join("")}</g>
    ${yTicks.map((v) => `<text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    <line class="axis-base" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/>
    <line x1="${m.l}" x2="${W - m.r}" y1="${y(limit)}" y2="${y(limit)}" stroke="var(--ink-2)" stroke-width="1" stroke-dasharray="4 4"/>
    <text x="${W - m.r}" y="${y(limit) - 6}" text-anchor="end" class="lbl-strong">Limit ${fmt(limit)}</text>
    <text x="${W - m.r}" y="${y(100) + 14}" text-anchor="end">Structural floor</text>`;
  if (flatAt > 0) {
    svg += `<line x1="${x(flatAt - 1)}" x2="${x(flatAt - 1)}" y1="${m.t}" y2="${y(0)}" stroke="var(--rule-strong)" stroke-width="1"/>
      <text x="${x(flatAt - 1) + 6}" y="${y(4)}">gains &lt; 1 pt/gen after here</text>`;
  }
  for (let n = 0; n <= HORIZON; n++) {
    svg += `<text x="${x(n)}" y="${H - m.b + 18}" text-anchor="middle" class="${n <= 2 ? "lbl-strong" : ""}">${n === 0 ? "F" : `F+${n}`}</text>
      <text x="${x(n)}" y="${H - m.b + 32}" text-anchor="middle">${Math.floor(genYear(n))}</text>`;
  }
  svg += `<path d="${path(pts.slice(2))}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 5"/>
    <path d="${path(pts.slice(0, 3))}" fill="none" stroke="var(--t1)" stroke-width="2"/>`;
  pts.forEach(([px, py], n) => {
    const fill = n <= 2 ? tierVar(n) : "var(--surface)";
    const stroke = n <= 2 ? "var(--surface)" : "var(--muted)";
    svg += `<circle cx="${px}" cy="${py}" r="${n <= 2 ? 6 : 4}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  });
  [0, 1, 2].forEach((n) => { svg += `<text x="${pts[n][0]}" y="${pts[n][1] - 12}" text-anchor="middle" class="lbl-strong">${fmt(proj[n])}</text>`; });
  svg += `<line id="curve-cross" x1="0" x2="0" y1="${m.t}" y2="${y(0)}" stroke="var(--ink-2)" stroke-width="1" opacity="0"/>`;
  for (let n = 0; n <= HORIZON; n++) {
    const half = (W - m.l - m.r) / HORIZON / 2;
    const gain = n ? proj[n] - proj[n - 1] : null;
    const tip = `${genLabel(n)} · ~${Math.floor(genYear(n))}|Index ${fmt(proj[n])}${gain !== null ? `|Gain +${fmt(gain)} pts` : ""}|${n <= 2 ? "Scored" : "Projected"}`;
    svg += `<rect class="hit" data-x="${x(n)}" x="${x(n) - half}" y="${m.t}" width="${half * 2}" height="${y(0) - m.t}" fill="transparent" data-tip="${esc(tip)}"/>`;
  }
  box.innerHTML = svg + "</svg>";
  const cross = box.querySelector("#curve-cross");
  bindTips(box, (el) => { if (el) { cross.setAttribute("x1", el.dataset.x); cross.setAttribute("x2", el.dataset.x); } cross.setAttribute("opacity", el ? "0.4" : "0"); });
}

/* ---------- Remaining work by task type ---------- */

function renderRemaining() {
  const rows = model.archetypes
    .map((a) => ({ a, open: a.share * (a.limit - a.f2), struct: a.share * (100 - a.limit) }))
    .map((r) => ({ ...r, total: r.open + r.struct }))
    .sort((p, q) => q.total - p.total);
  const shown = state.showAllRemaining ? rows : rows.slice(0, 12);
  const max = rows[0].total;
  $("remaining").innerHTML = shown.map(({ a, open, struct, total }) => `
    <span class="name">${esc(a.name)}</span>
    <div class="track" data-tip="${esc(a.name)}|Open to later generations ${fmt(open, 2)} pts|Structural ${fmt(struct, 2)} pts|Share of all work ${fmt(a.share * 100)}%">
      <div class="seg-open" style="width:${(open / max) * 100}%"></div>
      <div class="seg-struct" style="width:${(struct / max) * 100}%"></div>
    </div>
    <span class="val">${fmt(total, 2)}</span>`).join("");
  $("remaining-toggle").textContent = state.showAllRemaining ? "Show top 12" : `Show all ${rows.length} task types`;
  bindTips($("remaining"));
}

/* ---------- Occupations ---------- */

const OCC_COLS = [
  { key: "title", label: "Occupation" },
  { key: "employment", label: "Jobs", num: true },
  { key: "wage", label: "Mean wage", num: true },
  { key: "weight", label: "Weight", num: true },
  { key: "f0", label: "Frontier", num: true },
  { key: "f1", label: "F+1", num: true },
  { key: "f2", label: "F+2", num: true },
  { key: "bar", label: "Saturation" },
  { key: "limit", label: "Limit", num: true },
];

function minibar(proj, limit) {
  return `<div class="minibar" aria-hidden="true">
    <div style="width:${proj[2]}%;background:var(--t2)"></div>
    <div style="width:${proj[1]}%;background:var(--t1)"></div>
    <div style="width:${proj[0]}%;background:var(--t0)"></div>
    <div class="limit" style="left:calc(${limit}% - 1px)"></div></div>`;
}

function renderOccupations() {
  const archName = Object.fromEntries(model.archetypes.map((a) => [a.id, a.name]));
  const val = (o, k) => ({ f0: o.proj[0], f1: o.proj[1], f2: o.proj[2], bar: o.proj[0] })[k] ?? o[k];
  let rows = model.occupations.filter((o) =>
    (!state.group || o.group === state.group) &&
    (!state.search || o.title.toLowerCase().includes(state.search) || o.soc.includes(state.search)));
  const { key, dir } = state.sort;
  rows = rows.sort((p, q) => (key === "title" ? p.title.localeCompare(q.title) : val(p, key) - val(q, key)) * dir);

  const head = `<thead><tr>${OCC_COLS.map((c) => `<th scope="col" class="${c.num ? "num " : ""}sortable" data-key="${c.key}" ${key === c.key ? `aria-sort="${dir > 0 ? "ascending" : "descending"}"` : ""} tabindex="0">${c.label}</th>`).join("")}</tr></thead>`;
  const body = rows.map((o) => {
    const open = state.expanded.has(o.id);
    let html = `<tr class="occ-row" data-id="${o.id}" aria-expanded="${open}" tabindex="0">
      <td class="occ-title"><span class="mono">${o.soc}</span>${esc(o.title)}</td>
      <td class="num">${o.employment >= 1000 ? `${fmt(o.employment / 1000, 2)}M` : `${o.employment}k`}</td>
      <td class="num">$${o.wage}k</td>
      <td class="num">${fmt(o.weight * 100, 2)}%</td>
      <td class="num">${fmt(o.proj[0])}</td><td class="num">${fmt(o.proj[1])}</td><td class="num">${fmt(o.proj[2])}</td>
      <td>${minibar(o.proj, o.limit)}</td>
      <td class="num">${fmt(o.limit)}</td></tr>`;
    if (open) {
      html += `<tr><td class="detail" colspan="${OCC_COLS.length}"><div class="tasks">
        <span class="h">Task</span><span class="h">Task type</span><span class="h num">Time</span><span class="h">Saturation</span><span class="h">F / F+1 / F+2</span>
        ${o.tasks.map((t) => `<span>${esc(t.name)}</span><span class="arch">${esc(archName[t.arch])}</span><span class="num">${t.share}%</span>
          <span>${minibar(t.proj, t.limit)}</span><span class="tiers">${t.proj.slice(0, 3).map((v) => Math.round(v)).join(" / ")} · lim ${Math.round(t.limit)}</span>`).join("")}
      </div></td></tr>`;
    }
    return html;
  }).join("");
  const table = $("occ-table");
  table.innerHTML = head + `<tbody>${body || `<tr><td colspan="${OCC_COLS.length}">No occupations match. Clear the search or pick another group.</td></tr>`}</tbody>`;

  table.querySelectorAll("th.sortable").forEach((th) => {
    const go = () => {
      const k = th.dataset.key;
      state.sort = { key: k, dir: state.sort.key === k ? -state.sort.dir : k === "title" ? 1 : -1 };
      renderOccupations();
    };
    th.addEventListener("click", go);
    th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  table.querySelectorAll("tr.occ-row").forEach((tr) => {
    const go = () => { const id = tr.dataset.id; state.expanded.has(id) ? state.expanded.delete(id) : state.expanded.add(id); renderOccupations(); };
    tr.addEventListener("click", go);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
}

function renderGroups() {
  const rows = [...model.groups].sort((a, b) => b.weight - a.weight);
  $("group-table").innerHTML = `<thead><tr><th>Group</th><th class="num">Jobs</th><th class="num">Weight</th><th class="num">Frontier</th><th class="num">F+1</th><th class="num">F+2</th><th>Saturation</th></tr></thead>
    <tbody>${rows.map((g) => `<tr><td><span class="mono">${g.id}</span> ${esc(g.name)}</td>
      <td class="num">${fmt(g.employment / 1000, 1)}M</td><td class="num">${fmt(g.weight * 100)}%</td>
      <td class="num">${fmt(g.proj[0])}</td><td class="num">${fmt(g.proj[1])}</td><td class="num">${fmt(g.proj[2])}</td>
      <td>${minibar(g.proj, g.proj[HORIZON])}</td></tr>`).join("")}</tbody>`;
}

/* ---------- Task scores (scenario editor) ---------- */

function renderArchetypes() {
  const published = assessment().scores;
  const rows = [...model.archetypes].sort((a, b) => b.share - a.share);
  const input = (a, k) => {
    const edited = state.edits[a.id]?.[k] !== undefined && state.edits[a.id][k] !== published[a.id][k];
    return `<input type="number" id="edit-${a.id}-${k}" min="0" max="100" step="1" value="${a[k]}" data-arch="${a.id}" data-k="${k}" class="${edited ? "edited" : ""}" aria-label="${esc(a.name)} ${k === "ceiling" ? "ceiling" : tierLabel(k)}" title="Published: ${published[a.id][k]}">`;
  };
  $("arch-table").innerHTML = `<thead><tr><th>Task type</th><th class="num">Share of work</th>
      ${TIERS.map((t) => `<th class="num">${tierLabel(t)}</th>`).join("")}<th class="num">Ceiling</th><th class="num">Limit</th><th>Limited by</th></tr></thead>
    <tbody>${rows.map((a) => `<tr><td>${esc(a.name)}<br><span class="fam">${esc(a.family)}</span></td>
      <td class="num">${fmt(a.share * 100)}%</td>
      ${TIERS.map((t) => `<td class="num">${input(a, t)}</td>`).join("")}
      <td class="num">${input(a, "ceiling")}</td>
      <td class="num">${fmt(a.limit)}</td>
      <td><span class="chip ${a.bound}">${a.bound === "intelligence" ? "Trend flattens" : "Ceiling"}</span></td></tr>`).join("")}</tbody>`;
  $("arch-table").querySelectorAll("input").forEach((el) => el.addEventListener("change", () => {
    const { arch, k } = el.dataset;
    const v = Math.max(0, Math.min(100, Number(el.value)));
    if (!Number.isFinite(v)) return;
    const next = { ...state.edits[arch], [k]: v };
    if (v === published[arch][k]) delete next[k];
    // Keep the tiers ordered so the projection stays meaningful.
    const s = { ...published[arch], ...next };
    if (!(s.f0 <= s.f1 && s.f1 <= s.f2 && s.f2 <= s.ceiling)) { el.setCustomValidity("Keep Frontier ≤ F+1 ≤ F+2 ≤ Ceiling"); el.reportValidity(); return; }
    el.setCustomValidity("");
    if (Object.keys(next).length) state.edits[arch] = next; else delete state.edits[arch];
    store.set(`headroom.edits.${state.assessmentId}`, state.edits);
    const focusId = el.id;
    render();
    $(focusId)?.focus();
  }));
}

/* ---------- History ---------- */

function renderHistory() {
  const ids = data.index.assessments;
  const runs = ids.map((id) => {
    const a = data.assessments[id];
    return { a, m: computeModel({ ...data, assessment: a, weight: state.weight, horizon: HORIZON }).index };
  });
  $("history-table").innerHTML = `<thead><tr><th>Assessment</th><th>Date</th><th class="num">Frontier</th><th class="num">F+1</th><th class="num">F+2</th><th class="num">Limit</th><th>Flattens after</th></tr></thead>
    <tbody>${runs.map(({ a, m }) => `<tr><td><span class="mono">${a.id}</span> ${esc(a.title)}</td><td class="mono">${a.date}</td>
      <td class="num">${fmt(m.f0)}</td><td class="num">${fmt(m.f1)}</td><td class="num">${fmt(m.f2)}</td><td class="num">${fmt(m.limit)}</td>
      <td>${genLabel(m.flatAt - 1)}</td></tr>`).join("")}</tbody>`;

  const box = $("history-chart");
  if (runs.length < 2) {
    box.innerHTML = `<p class="note">One assessment so far. The trend chart appears once a second dated assessment is added.</p>`;
    return;
  }
  const W = Math.max(440, Math.min(760, box.clientWidth || 760)), H = 220, m = { l: 38, r: 16, t: 16, b: 30 };
  const t = runs.map(({ a }) => new Date(a.date).getTime());
  const t0 = Math.min(...t), t1 = Math.max(...t);
  const x = (v) => m.l + ((v - t0) / (t1 - t0 || 1)) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v / 100) * (H - m.t - m.b);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Index by assessment date"><g class="grid">${[0, 25, 50, 75, 100].map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>`).join("")}</g>
    ${[0, 25, 50, 75, 100].map((v) => `<text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}`;
  ["f0", "f1", "f2", "limit"].forEach((k, i) => {
    const pts = runs.map(({ m: r }, j) => [x(t[j]), y(r[k])]);
    const color = k === "limit" ? "var(--struct)" : tierVar(i);
    svg += `<path d="${pts.map((p, j) => `${j ? "L" : "M"}${p[0]},${p[1]}`).join("")}" fill="none" stroke="${color}" stroke-width="2" ${k === "limit" ? 'stroke-dasharray="4 4"' : ""}/>`;
    svg += pts.map((p, j) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${color}" stroke="var(--surface)" stroke-width="2" data-tip="${esc(`${runs[j].a.date}|${k === "limit" ? "Limit" : tierLabel(k)} ${fmt(runs[j].m[k])}`)}"/>`).join("");
    const last = pts[pts.length - 1];
    svg += `<text x="${last[0] - 8}" y="${last[1] - 8}" text-anchor="end" class="lbl-strong">${k === "limit" ? "Limit" : tierLabel(k)}</text>`;
  });
  runs.forEach(({ a }, j) => { svg += `<text x="${x(t[j])}" y="${H - 8}" text-anchor="middle">${a.date}</text>`; });
  box.innerHTML = svg + "</svg>";
  bindTips(box);
}

function renderMethod() {
  $("method-definition").textContent = assessment().definition;
  $("method-source").textContent = data.occupations.source;
}

/* ---------- Tooltip ---------- */

function bindTips(root, onChange) {
  const tip = $("tooltip");
  const show = (el, e) => {
    const [title, ...rows] = el.dataset.tip.split("|");
    tip.innerHTML = `<b>${esc(title)}</b>${rows.map((r) => `<div class="row">${esc(r)}</div>`).join("")}`;
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    const px = Math.min(e.clientX + 14, window.innerWidth - r.width - 8);
    const py = e.clientY + 16 + r.height > window.innerHeight ? e.clientY - r.height - 12 : e.clientY + 16;
    tip.style.left = `${Math.max(8, px)}px`;
    tip.style.top = `${py}px`;
    onChange?.(el);
  };
  const hide = () => { tip.hidden = true; onChange?.(null); };
  root.querySelectorAll("[data-tip]").forEach((el) => {
    el.addEventListener("pointermove", (e) => show(el, e));
    el.addEventListener("pointerleave", hide);
  });
}

load().catch((err) => {
  document.querySelector("main").insertAdjacentHTML("afterbegin",
    `<div class="banner">Could not load the data files (${esc(err.message)}). Serve the folder over HTTP, for example with <code>python3 -m http.server</code>, and reload.</div>`);
});
