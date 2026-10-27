import { computeModel, TIERS } from "./model.js";

const $ = (id) => document.getElementById(id);
const HORIZON = 8;
const HOURS = 40;
const VIEWS = ["overview", "jobs", "tasks", "method"];
const r0 = (x) => Math.round(x);
const pct = (x) => `${r0(x)}%`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const jobs = (k) => (k >= 1000 ? `${(k / 1000).toFixed(k >= 10000 ? 0 : 1)}M` : `${r0(k)}k`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d || 1)); };
const monthYear = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const addMonths = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()));
const shortModel = (s) => s.replace(/^Claude /, "");
const TIER_ORDER = { primary: 0, independent: 1, secondary: 2 };
// "11-3051/71" lists two SOC codes: the second part replaces the tail of the first.
const socCodes = (soc) => {
  const [first, ...rest] = String(soc).split("/");
  return [first, ...rest.map((r) => first.slice(0, first.length - r.length) + r)];
};

const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const state = {
  view: "overview",
  target: null,
  weight: store.get("headroom.weight", "wage"),
  edits: {},
  search: "",
  sort: "now",
  flat: false,
  archSort: "share",
  openGroups: new Set(),
  openOccs: new Set(),
  openArchs: new Set(),
};

let data;      // { taxonomy, occupations, index, assessments }
let model;     // model for the live assessment with the viewer's edits, at the chosen weight
let altIndex;  // the index at the other weighting
let snaps;     // every snapshot, oldest first, with its model

const live = () => data.assessments[data.index.latest];
const asOf = () => parseDate(live().updated || live().date);
const otherWeight = () => (state.weight === "wage" ? "employment" : "wage");
const weightPhrase = (w = state.weight) => (w === "wage" ? "weighted by wages" : "weighted by headcount");
const weightNoun = (w = state.weight) => (w === "wage" ? "wages" : "people");

// Date of generation n for an assessment: its own date, the stated forecast dates for
// Frontier+1 and +2, then one cadence per generation beyond.
function tierDate(n, a = live()) {
  const base = parseDate(a.date);
  const fd = a.forecast_dates;
  if (n === 0) return base;
  if (fd) return n === 1 ? parseDate(fd.f1) : addMonths(parseDate(fd.f2), (n - 2) * a.cadence_months);
  return addMonths(base, n * a.cadence_months);
}

async function load() {
  const get = (p) => fetch(p).then((r) => { if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); });
  let bundle = null;
  try { bundle = await get("data/bundle.json"); } catch { /* not built; load the source files */ }
  if (bundle) {
    data = bundle;
  } else {
    const [taxonomy, occupations, index] = await Promise.all([get("data/taxonomy.json"), get("data/occupations.json"), get("data/assessments/index.json")]);
    const list = await Promise.all(index.assessments.map((id) => get(`data/assessments/${id}.json`)));
    data = { taxonomy, occupations, index, assessments: Object.fromEntries(list.map((a) => [a.id, a])) };
  }
  state.edits = store.get(`headroom.edits.${data.index.latest}`, {});
  setupControls();
  route();
}

/* ---------- Routing and controls ---------- */

// Hash routes: #view, #jobs/<occupation id>, #tasks/<task type id>, with optional
// ?w=wage|employment and ?e=<edits> (shared scenarios).
function parseHash() {
  const [path, query = ""] = location.hash.slice(1).split("?");
  const [view, id] = path.split("/");
  return { view: VIEWS.includes(view) ? view : "overview", id: id || null, params: Object.fromEntries(new URLSearchParams(query)) };
}

const encodeEdits = (edits) => Object.entries(edits).flatMap(([a, o]) => Object.entries(o).map(([k, v]) => `${a}.${k}:${v}`)).join(",");
function parseEdits(s) {
  const out = {};
  for (const part of s.split(",")) {
    const m = /^([a-z_]+)\.(f0|f1|f2|ceiling):(\d+(?:\.\d+)?)$/.exec(part);
    if (!m) continue;
    const v = Number(m[3]);
    if (v >= 0 && v <= 100) (out[m[1]] ||= {})[m[2]] = v;
  }
  return out;
}

function route() {
  const { view, id, params } = parseHash();
  const changedView = view !== state.view;
  state.view = view;
  state.target = id;
  if (["wage", "employment"].includes(params.w)) { state.weight = params.w; store.set("headroom.weight", state.weight); }
  if (params.e !== undefined && data) {
    const edits = parseEdits(params.e);
    const published = live().scores;
    const ok = Object.entries(edits).every(([a, o]) => published[a] && (({ f0, f1, f2, ceiling }) => f0 <= f1 && f1 <= f2 && f2 <= ceiling)({ ...published[a], ...o }));
    if (ok) { state.edits = edits; store.set(`headroom.edits.${data.index.latest}`, edits); }
  }
  if (id && view === "jobs") {
    const o = data.occupations.occupations.find((x) => x.id === id);
    if (o) { state.openGroups.add(o.group); state.openOccs.add(o.id); }
  }
  if (id && view === "tasks") state.openArchs.add(id);
  render();
  const target = id ? document.querySelector(view === "jobs" ? `[data-occ="${CSS.escape(id)}"]` : `[data-arch="${CSS.escape(id)}"]`) : null;
  if (target) {
    target.classList.add("target");
    requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  } else if (changedView) {
    window.scrollTo(0, 0);
  }
}

// Updates the address without firing hashchange, so opening a row is linkable.
function setHash(view, id) {
  const { params } = parseHash();
  const q = new URLSearchParams();
  if (params.w) q.set("w", params.w);
  const qs = q.toString();
  history.replaceState(null, "", `#${view}${id ? `/${id}` : ""}${qs ? `?${qs}` : ""}`);
}

// Accessible segmented control: roving tabindex, arrow keys, aria-checked.
function radiogroup(el, getValue, onChange) {
  const btns = [...el.querySelectorAll("[role=radio]")];
  const sync = () => btns.forEach((b) => { const on = b.dataset.value === getValue(); b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1; });
  btns.forEach((b, i) => {
    b.addEventListener("click", () => { onChange(b.dataset.value); sync(); });
    b.addEventListener("keydown", (e) => {
      const step = ["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(e.key) ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const nb = btns[(i + step + btns.length) % btns.length];
      onChange(nb.dataset.value); sync(); nb.focus();
    });
  });
  sync();
  return sync;
}

let syncWeight, syncFlat;
function setupControls() {
  window.addEventListener("hashchange", route);
  syncWeight = radiogroup($("weight-seg"), () => state.weight, (v) => { state.weight = v; store.set("headroom.weight", v); render(); });
  syncFlat = radiogroup($("occ-view"), () => (state.flat ? "flat" : "groups"), (v) => { state.flat = v === "flat"; renderJobs(); });
  $("occ-search").addEventListener("input", (e) => { state.search = e.target.value.trim().toLowerCase(); renderJobs(); });
  $("occ-sort").addEventListener("change", (e) => { state.sort = e.target.value; renderJobs(); });
  $("arch-sort").addEventListener("change", (e) => { state.archSort = e.target.value; renderTasks(); });
  const reset = () => { state.edits = {}; store.set(`headroom.edits.${data.index.latest}`, {}); render(); };
  $("reset-edits").addEventListener("click", reset);
  $("reset-edits-top").addEventListener("click", reset);
  $("copy-link").addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}#tasks?e=${encodeEdits(state.edits)}`;
    try { await navigator.clipboard.writeText(url); $("copy-status").textContent = "Link copied."; }
    catch { $("copy-status").textContent = url; }
  });
  // Tooltips: hide on scroll, on Escape, and on any tap outside a tipped element.
  window.addEventListener("scroll", hideTip, { passive: true });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTip(); });
  document.addEventListener("pointerdown", (e) => { if (!e.target.closest?.("[data-tip]")) hideTip(); });
  window.addEventListener("resize", () => { if (data && state.view === "overview") renderTimeline(); });
}

function render() {
  const a = live();
  model = computeModel({ ...data, assessment: a, weight: state.weight, edits: state.edits, horizon: HORIZON });
  altIndex = computeModel({ ...data, assessment: a, weight: otherWeight(), edits: state.edits, horizon: HORIZON }).index;
  snaps = data.index.assessments
    .map((id) => data.assessments[id])
    .sort((p, q) => p.date.localeCompare(q.date))
    .map((s) => ({ a: s, m: s.id === a.id ? model : computeModel({ ...data, assessment: s, weight: state.weight, horizon: HORIZON }) }));

  syncWeight?.();
  for (const t of document.querySelectorAll(".tabs a")) {
    if (t.dataset.view === state.view) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
  }
  for (const v of VIEWS) $(`view-${v}`).hidden = v !== state.view;
  const hasEdits = Object.keys(state.edits).length > 0;
  $("edits-banner").hidden = !hasEdits;
  $("reset-edits").disabled = !hasEdits;
  $("copy-link").disabled = !hasEdits;
  if (!hasEdits) $("copy-status").textContent = "";
  ({ overview: renderOverview, jobs: renderJobs, tasks: renderTasks, method: renderMethod })[state.view]();
}

/* ---------- Shared pieces ---------- */

// The five bands every bar on the site uses, in order.
function bands(proj, limit) {
  return [
    { k: "now", v: proj[0], color: "var(--t0)", label: "AI can do now" },
    { k: "f1", v: proj[1] - proj[0], color: "var(--t1)", label: "Added next generation" },
    { k: "f2", v: proj[2] - proj[1], color: "var(--t2)", label: "Added the generation after" },
    { k: "open", v: limit - proj[2], cls: "fill-open", label: "Open to later generations" },
    { k: "human", v: 100 - limit, cls: "fill-struct", label: "Needs a person" },
  ];
}
const bandText = (proj, limit) => bands(proj, limit).map((x) => `${x.label} ${r0(x.v)}%`).join(", ");

function stackBar(proj, limit, { tall = false, scale = 100, label = "" } = {}) {
  const b = bands(proj, limit);
  const tip = b.map((x) => `${x.label} ${r0(x.v)}%`).join("|");
  const a11y = label ? `role="img" aria-label="${esc(label)}: ${esc(bandText(proj, limit))}"` : 'aria-hidden="true"';
  return `<div class="stack${tall ? " tall" : ""}" style="width:${scale}%" data-tip="Breakdown|${esc(tip)}" ${a11y}>${b
    .map((x) => `<div class="${x.cls || ""}" style="flex:0 0 max(0px, calc(${x.v}% - 2px));${x.color ? `background:${x.color}` : ""}"></div>`)
    .join("")}</div>`;
}

const swatchFor = (x) => `<span class="swatch ${x.cls === "fill-open" ? "open" : x.cls === "fill-struct" ? "human" : ""}" style="${x.color ? `background:${x.color}` : ""}"></span>`;
function legendHTML(withValues) {
  return bands(model.index.proj, model.index.limit).map((x) => `<span>${swatchFor(x)}${x.label}${withValues ? ` <b>${withValues(x)}</b>` : ""}</span>`).join("");
}
const confChip = (c) => `<span class="chip ${c}">${c} confidence</span>`;

/* ---------- Overview ---------- */

function renderOverview() {
  const a = live();
  const { proj, limit, flatAt, band, confidence } = model.index;
  const first = snaps[0];
  const d1 = tierDate(1), d2 = tierDate(2);

  $("lead-eyebrow").textContent = `Updated ${monthYear(asOf())} · Frontier: ${a.anchor}, ${monthYear(parseDate(a.date))}`;
  $("lead-h1").innerHTML = `AI can now do about <em>${pct(proj[0])}</em> of U.S. white-collar work.`;
  $("lead-lede").textContent =
    (snaps.length > 1 ? `That's up from ${pct(first.m.index.f0)} when ${first.a.anchor} was the frontier in ${monthYear(parseDate(first.a.date))}. ` : "") +
    `The next two model generations, expected around ${monthYear(d1)} and ${monthYear(d2)}, take it to about ${pct(proj[1])} (± ${r0(band.f1)}) and ${pct(proj[2])} (± ${r0(band.f2)}). ` +
    `Progress flattens near ${pct(limit)}; the remaining ${pct(100 - limit)} needs a person in the room, a signature, or a relationship. ` +
    `Figures are ${weightPhrase()} across ${model.occupations.length} occupations and ${jobs(model.totals.employment)} jobs; ${weightPhrase(otherWeight())} it is ${pct(altIndex.f0)}.`;

  const stat = (label, swatch, value, sub) => `<div class="stat"><span class="stat-label">${swatch}${label}</span><span class="stat-value">${value}</span><span class="stat-sub">${sub}</span></div>`;
  const sw = (c) => `<span class="swatch" style="background:${c}"></span>`;
  const flattens = flatAt !== null;
  $("readout").innerHTML =
    stat("Now", sw("var(--t0)"), `${r0(proj[0])}<small>%</small>`, `${esc(shortModel(a.anchor))}, ${monthYear(parseDate(a.date))}`) +
    stat("Next generation", sw("var(--t1)"), `${r0(proj[1])}<small>%</small><span class="range">± ${r0(band.f1)}</span>`, `+${r0(proj[1] - proj[0])} pts, around ${monthYear(d1)}`) +
    stat("Generation after", sw("var(--t2)"), `${r0(proj[2])}<small>%</small><span class="range">± ${r0(band.f2)}</span>`, `+${r0(proj[2] - proj[1])} pts, around ${monthYear(d2)}`) +
    stat("Ceiling", '<span class="swatch line"></span>', `${r0(limit)}<small>%</small>`, `Needs a person: ${pct(100 - limit)}`) +
    stat("Saturation", '<span class="swatch human"></span>', flattens ? `~${tierDate(flatAt).getUTCFullYear()}` : `after ${tierDate(HORIZON).getUTCFullYear()}`,
      flattens ? `Gains fall under 1 pt a generation from ${monthYear(tierDate(flatAt))}` : "Still gaining over 1 pt a generation at the end of the projection");

  renderTimeline();
  renderWeek();

  const ranked = [...model.occupations].sort((p, q) => q.proj[0] - p.proj[0]);
  const item = (o) => `<li><a href="#jobs/${o.id}"><span class="title">${esc(o.title)}<br><span class="sub">${jobs(o.employment)} jobs</span></span><span class="val">${pct(o.proj[0])}</span>${stackBar(o.proj, o.limit, { label: o.title })}</a></li>`;
  $("most").innerHTML = ranked.slice(0, 6).map(item).join("");
  $("least").innerHTML = ranked.slice(-6).reverse().map(item).join("");

  const g = [
    [sw("var(--t0)"), "Frontier", `The best publicly available model on the snapshot date. Today that's ${a.anchor}. Earlier snapshots track each Opus release back to ${first.a.anchor}; where another public model led, the score follows the leader.`],
    [sw("var(--t1)"), "Next generation and the one after", `Frontier+1 and Frontier+2: the next two capability steps, roughly two or three point releases each. They are not separate judgments: each closes a fixed share of the gap to the ceiling, the share the last ten months closed.`],
    ["", "Range", `The ± figures are the forecast range: 5 points at Frontier+1 and 8 at Frontier+2 for a task type with medium-confidence evidence, narrower with a direct benchmark, wider without one.`],
    ["", "Can do", "AI can do the task at the quality of a competent professional, with no more than light review. This measures capability, not whether employers have adopted it."],
    ['<span class="swatch line"></span>', "Ceiling", "The most of a task AI could ever take, even with unlimited intelligence. Above it sits work that needs physical presence, legal accountability, or a human relationship."],
    ["", "Wages or people", "Wages weights each job by its total pay, so the index reads as a share of what employers spend. People weights by headcount, so it reads as a share of working time."],
    ["", "Evidence", `${pct(confidence.high)} of the index rests on task types with a direct benchmark, ${pct(confidence.medium)} on adjacent evidence and ${pct(confidence.low)} on labor studies and judgment. The Tasks tab shows each type's confidence; the Method tab has the breakdown.`],
    ["", "Coverage", `${model.occupations.length} occupations covering ${jobs(model.totals.employment)} U.S. jobs (BLS OEWS, May 2025) in twelve white-collar groups, each split into 2 to 6 tasks. Registered nurses, retail sales and the self-employed are not covered.`],
  ];
  $("glossary").innerHTML = g.map(([s, t, d]) => `<div><dt>${s}${t}</dt><dd>${esc(d)}</dd></div>`).join("");
  bindTips($("view-overview"));
}

function renderTimeline() {
  const box = $("timeline");
  const { proj, limit, flatAt, band } = model.index;
  const W = Math.max(320, Math.min(980, box.clientWidth || 980));
  const narrow = W < 640;
  const H = narrow ? 280 : 340;
  const m = { l: 46, r: 14, t: 18, b: 40 };
  const lastGen = Math.min(HORIZON, Math.max(flatAt ?? HORIZON, 4));
  const past = snaps.map(({ a, m: mm }) => ({ d: parseDate(a.date), v: mm.index.f0, label: shortModel(a.anchor), a }));
  const future = Array.from({ length: lastGen }, (_, i) => ({ n: i + 1, d: tierDate(i + 1), v: proj[i + 1], b: i === 0 ? band.f1 : i === 1 ? band.f2 : 0 }));
  const t0 = addMonths(past[0].d, -1).getTime(), t1 = future[future.length - 1].d.getTime();
  const x = (d) => m.l + ((d.getTime() - t0) / (t1 - t0)) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v / 100) * (H - m.t - m.b);
  const pt = (d, v) => `${x(d).toFixed(1)},${y(v).toFixed(1)}`;
  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${pt(p.d, p.v)}`).join("");
  const now = past[past.length - 1];
  const [f1, f2] = future;

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of white-collar work AI can do, by date: ${pct(past[0].v)} in ${monthYear(past[0].d)}, ${pct(now.v)} now, forecast ${pct(f1.v)} and ${pct(f2.v)}, ceiling ${pct(limit)}">
    <rect x="${m.l}" y="${y(100)}" width="${W - m.l - m.r}" height="${y(limit) - y(100)}" fill="var(--struct)" opacity="0.14"/>
    <g class="grid">${[0, 25, 50, 75, 100].map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>`).join("")}</g>
    ${[0, 25, 50, 75, 100].map((v) => `<text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    <text transform="rotate(-90)" x="${-(H - m.b + m.t) / 2}" y="12" text-anchor="middle" class="lbl-axis">% of work AI can do</text>
    <line class="axis-base" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/>
    <text x="${W - m.r - 4}" y="${y(100) + 14}" text-anchor="end">Needs a person</text>
    <line x1="${m.l}" x2="${W - m.r}" y1="${y(limit)}" y2="${y(limit)}" stroke="var(--ink)" stroke-dasharray="4 4"/>
    <text x="${W - m.r - 4}" y="${y(limit) - 6}" text-anchor="end" class="lbl-strong">Ceiling ${pct(limit)}</text>
    <line x1="${x(asOf())}" x2="${x(asOf())}" y1="${m.t}" y2="${y(0)}" stroke="var(--rule-strong)"/>
    <text x="${x(asOf()) + 5}" y="${y(4)}">Today</text>`;

  // x-axis: a labelled tick each January, a minor tick each July
  for (let d = new Date(Date.UTC(past[0].d.getUTCFullYear(), 0, 1)); d.getTime() <= t1; d = addMonths(d, 6)) {
    if (d.getTime() < t0) continue;
    const jan = d.getUTCMonth() === 0;
    s += `<line x1="${x(d)}" x2="${x(d)}" y1="${y(0)}" y2="${y(0) + (jan ? 5 : 3)}" stroke="var(--rule-strong)"/>`;
    if (jan) s += `<text x="${x(d)}" y="${H - m.b + 18}" text-anchor="middle" class="lbl-strong">${narrow ? `'${String(d.getUTCFullYear()).slice(2)}` : d.getUTCFullYear()}</text>`;
  }

  // Forecast range: widens from today's point to Frontier+2
  s += `<path d="M${pt(now.d, now.v)} L${pt(f1.d, f1.v + f1.b)} L${pt(f2.d, f2.v + f2.b)} L${pt(f2.d, f2.v - f2.b)} L${pt(f1.d, f1.v - f1.b)} Z" fill="var(--t1)" opacity="0.18"/>`;
  s += `<path d="${path(future.slice(1))}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.8"/>
    <path d="${path([now, f1, f2])}" fill="none" stroke="var(--t1)" stroke-width="2"/>
    <path d="${path(past)}" fill="none" stroke="var(--t0)" stroke-width="2.5"/>`;

  // Past snapshots: hollow if backfilled. Label the first, the milestones and the latest.
  past.forEach((p, i) => {
    const last = i === past.length - 1;
    const hollow = p.a.kind === "backfill";
    s += `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="${last ? 6 : 4.5}" fill="${hollow ? "var(--surface)" : "var(--t0)"}" stroke="${hollow ? "var(--t0)" : "var(--surface)"}" stroke-width="2"/>`;
    if (last || !(i === 0 || p.a.milestone) || (narrow && i !== 0)) return;
    s += `<text x="${x(p.d) + (i === 0 ? 0 : -6)}" y="${i === 0 ? y(p.v) + 20 : y(p.v) - 12}" text-anchor="${i === 0 ? "start" : "end"}" class="lbl-model">${esc(p.label)}</text>`;
  });
  s += `<text x="${x(now.d) - 10}" y="${y(now.v) - 12}" text-anchor="end" class="lbl-strong">${narrow ? "" : `${esc(now.label)} · `}${pct(now.v)}</text>`;
  future.forEach((p) => {
    const scored = p.n <= 2;
    s += `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="${scored ? 5 : 3.5}" fill="${scored ? `var(--t${p.n})` : "var(--surface)"}" stroke="${scored ? "var(--surface)" : "var(--muted)"}" stroke-width="2"/>`;
    // F+1 sits below-left of the band, F+2 above-right, so the two labels never collide.
    if (scored) {
      const below = p.n === 1;
      s += `<text x="${x(p.d) + (below ? 4 : -4)}" y="${below ? y(p.v - p.b) + 18 : y(p.v + p.b) - 8}" text-anchor="${below ? "end" : "start"}" class="lbl-strong">${narrow ? `F+${p.n}` : `F+${p.n} · ${pct(p.v)} ± ${r0(p.b)}`}</text>`;
    }
  });
  const lastF = future[future.length - 1];
  if (!narrow) s += `<text x="${x(lastF.d)}" y="${y(lastF.v) + 18}" text-anchor="end">trend</text>`;

  // Hover targets
  const pts = [
    ...past.map((p) => ({ ...p, tip: `${p.a.anchor}|${monthYear(p.d)}|AI can do ${pct(p.v)}${p.a.kind === "backfill" ? "|Backfilled: scored after the fact" : "|Live snapshot"}${p.a.frontier ? `|Frontier then: ${p.a.frontier}` : ""}` })),
    ...future.map((p) => ({ ...p, tip: `Frontier+${p.n}|Around ${monthYear(p.d)}|${pct(p.v)}${p.n <= 2 ? ` ± ${r0(p.b)} (forecast)` : " (trend, not a forecast)"}` })),
  ];
  pts.forEach((p) => { s += `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="14" fill="transparent" data-tip="${esc(p.tip)}"/>`; });
  box.innerHTML = s + "</svg>";

  $("timeline-note").textContent = `Each point on the dark line is one Opus release, scored for what the public frontier could do at the time (hollow points were scored after the fact). The blue points are the next two generations with their forecast range; the dashed line extends each task type's gap-closure rate toward its ceiling and is a trend, not a forecast.`;
  $("timeline-legend").innerHTML = `<span><span class="dot hollow"></span>Backfilled snapshots</span>
    <span><span class="dot" style="background:var(--t0)"></span>Live snapshot</span>
    <span><span class="band"></span>Forecast, next two generations, with range</span>
    <span><span class="dot trend"></span>Trend projection</span>
    <span><span class="swatch human"></span>Needs a person</span>`;
}

// Largest-remainder rounding so whole hours sum to the week.
function toHours(values) {
  const raw = values.map((v) => (v / 100) * HOURS);
  const out = raw.map(Math.floor);
  let left = HOURS - out.reduce((s, v) => s + v, 0);
  raw.map((v, i) => [v - Math.floor(v), i]).sort((p, q) => q[0] - p[0]).forEach(([, i]) => { if (left-- > 0) out[i]++; });
  return out;
}

function renderWeek() {
  const b = bands(model.index.proj, model.index.limit);
  const hrs = toHours(b.map((x) => x.v));
  $("week").innerHTML = b.map((x, i) => Array.from({ length: hrs[i] }, () =>
    `<div class="${x.cls || ""}" style="${x.color ? `background:${x.color}` : ""}" data-tip="${esc(x.label)}|${hrs[i]} of ${HOURS} hours"></div>`).join("")).join("");
  $("week").setAttribute("aria-label", b.map((x, i) => `${x.label}: ${hrs[i]} hours`).join(", "));
  $("week-note").textContent = `Each square is one hour of a 40-hour week, averaged across all covered jobs and ${weightPhrase()}. Today's frontier model could handle about ${hrs[0]} of them.`;
  $("week-legend").innerHTML = legendHTML((x) => `${hrs[b.findIndex((y) => y.k === x.k)]}h`);
}

/* ---------- Jobs ---------- */

function renderJobs() {
  const q = state.search;
  const groupName = Object.fromEntries(model.groups.map((g) => [g.id, g.name]));
  const match = (o) => !q || o.title.toLowerCase().includes(q) || socCodes(o.soc).some((c) => c.includes(q)) || groupName[o.group].toLowerCase().includes(q);
  const sorters = {
    now: (p, r) => r.proj[0] - p.proj[0],
    jump: (p, r) => (r.proj[2] - r.proj[0]) - (p.proj[2] - p.proj[0]),
    size: (p, r) => r.employment - p.employment,
    title: (p, r) => p.title.localeCompare(r.title),
  };
  const archName = Object.fromEntries(model.archetypes.map((a) => [a.id, a.name]));
  $("jobs-legend").innerHTML = legendHTML();
  $("groups-head").innerHTML = `<span></span><span>Occupation</span><span>Share of working time AI can do</span><span class="r">now → ${monthYear(tierDate(2))}</span>`;
  syncFlat?.();
  const empty = `<p class="note">No jobs match "${esc(q)}". Try a shorter word, a group name like "legal", or a SOC code like 13-2011. Not covered: registered nurses, retail sales, the self-employed and other occupations outside the ${model.occupations.length} listed.</p>`;

  let html;
  if (state.flat) {
    const members = model.occupations.filter(match).sort(sorters[state.sort]);
    html = members.length ? `<div class="flat">${members.map((o) => occRow(o, archName, groupName[o.group])).join("")}</div>` : "";
  } else {
    const groups = [...model.groups].sort((a, b) => b.weight - a.weight);
    html = groups.map((g) => {
      const members = model.occupations.filter((o) => o.group === g.id && match(o)).sort(sorters[state.sort]);
      if (!members.length) return "";
      const open = q ? true : state.openGroups.has(g.id);
      const coverage = g.employment_bls ? `${jobs(g.employment)} of ${jobs(g.employment_bls)} BLS jobs` : `${jobs(g.employment)} jobs`;
      return `<div class="group">
        <button type="button" class="row-btn" data-group="${g.id}" aria-expanded="${open}">
          <span class="chev" aria-hidden="true">▶</span>
          <span class="title">${esc(g.name)}<span class="meta">${coverage} · ${pct(g.weight * 100)} of ${weightNoun()} · ${g.count} occupations</span></span>
          ${stackBar(g.proj, g.limit, { tall: true, label: g.name })}
          <span class="nums"><b>${pct(g.proj[0])}</b> now → ${pct(g.proj[2])}</span>
        </button>
        ${open ? `<div class="occ-list">${members.map((o) => occRow(o, archName)).join("")}</div>` : ""}
      </div>`;
    }).join("");
  }
  $("groups").innerHTML = html || empty;

  $("groups").querySelectorAll("[data-group]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.group;
    if (state.search) return;
    state.openGroups.has(id) ? state.openGroups.delete(id) : state.openGroups.add(id);
    renderJobs();
    document.querySelector(`[data-group="${id}"]`)?.focus();
  }));
  $("groups").querySelectorAll("[data-occ]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.occ;
    const opening = !state.openOccs.has(id);
    opening ? state.openOccs.add(id) : state.openOccs.delete(id);
    setHash("jobs", opening ? id : null);
    renderJobs();
    document.querySelector(`[data-occ="${id}"]`)?.focus();
  }));
  bindTips($("groups"));
}

function occRow(o, archName, groupLabel) {
  const open = state.openOccs.has(o.id);
  const maxShare = Math.max(...o.tasks.map((t) => t.share));
  const h = (v) => r0((v / 100) * HOURS);
  const lowNote = o.lowShare >= 50 ? ` ${r0(o.lowShare)}% of this job's time is in task types scored with low confidence.` : "";
  return `<div class="occ${state.target === o.id ? " target" : ""}">
    <button type="button" class="row-btn" data-occ="${o.id}" aria-expanded="${open}">
      <span class="chev" aria-hidden="true">▶</span>
      <span class="title">${esc(o.title)}<span class="meta"><span class="mono">${esc(o.soc)}</span> · ${jobs(o.employment)} jobs · $${o.wage}k mean pay${groupLabel ? ` · ${esc(groupLabel)}` : ""}</span></span>
      ${stackBar(o.proj, o.limit, { label: o.title })}
      <span class="nums"><b>${pct(o.proj[0])}</b> now → ${pct(o.proj[2])}</span>
    </button>
    ${open ? `<div class="occ-detail">
      <p class="note">In a 40-hour week, AI could handle about <b>${h(o.proj[0])} hours</b> of this job today and ${h(o.proj[2])} hours (± ${h(o.band.f2)}) two generations from now. About ${h(100 - o.limit)} hours need a person regardless. Bar length is each task's share of the week; the colours show how much of it AI can do. The task mix is an estimate.${lowNote}</p>
      ${o.tasks.map((t) => `<div class="task-row">
        <span class="tname">${esc(t.name)}<span class="ttype">${esc(archName[t.arch])}</span></span>
        ${stackBar(t.proj, t.limit, { scale: (t.share / maxShare) * 100, label: t.name })}
        <span class="hrs">${h(t.share)}h · ${pct(t.proj[0])}</span>
      </div>`).join("")}
    </div>` : ""}
  </div>`;
}

/* ---------- Tasks ---------- */

function renderTasks() {
  const a = live();
  const pastSnaps = snaps.filter((s) => s.a.id !== a.id);
  const srcById = Object.fromEntries((a.sources || []).map((s) => [s.id, s]));
  $("dots-legend").innerHTML = `<span><span class="dot" style="background:var(--past)"></span>Earlier Opus snapshots</span>
    <span><span class="dot" style="background:var(--t0)"></span>Now</span>
    <span><span class="dot" style="background:var(--t1)"></span>Next generation</span>
    <span><span class="dot" style="background:var(--t2)"></span>Generation after</span>
    <span><span class="tick"></span>Ceiling</span>`;

  const sorters = {
    share: (p, q) => q.share - p.share,
    score: (p, q) => q.f0 - p.f0,
    gain: (p, q) => (q.f2 - q.f0) - (p.f2 - p.f0),
    name: (p, q) => p.name.localeCompare(q.name),
  };
  const row = (r) => {
    const open = state.openArchs.has(r.id);
    const hist = pastSnaps.map((s) => ({ v: s.a.scores[r.id]?.f0, label: shortModel(s.a.anchor) })).filter((h) => typeof h.v === "number");
    const published = a.scores[r.id];
    const edited = state.edits[r.id] ? " · edited here" : "";
    const srcs = (r.sources || []).map((id) => srcById[id]).filter(Boolean).sort((p, q) => TIER_ORDER[p.tier] - TIER_ORDER[q.tier]);
    return `<div class="dot-row${state.target === r.id ? " target" : ""}">
      <button type="button" class="row-btn" data-arch="${r.id}" aria-expanded="${open}">
        <span class="chev" aria-hidden="true">▶</span>
        <span class="title">${esc(r.name)}<span class="meta">${r.share < 0.001 ? "under 0.1" : (r.share * 100).toFixed(1)}% of all work ${confChip(r.confidence)}</span></span>
        <span class="dot-track" data-tip="${esc(`${r.name}|${hist.map((h) => `${h.label} ${h.v}`).join("|")}${hist.length ? "|" : ""}Now ${r.f0} · F+1 ${r.f1} ± ${r0(r.band.f1)} · F+2 ${r.f2} ± ${r0(r.band.f2)}|Ceiling ${r.ceiling}`)}" role="img" aria-label="${esc(r.name)}: now ${r.f0}, next generation ${r.f1}, generation after ${r.f2}, ceiling ${r.ceiling}">
          <span class="line"></span>
          <span class="reach" style="left:${r.f0}%;width:${r.f2 - r.f0}%"></span>
          <span class="ceil" style="left:calc(${r.ceiling}% - 1px)"></span>
          ${hist.map((h) => `<i class="past" style="left:${h.v}%"></i>`).join("")}
          <i style="left:${r.f2}%;background:var(--t2)"></i><i style="left:${r.f1}%;background:var(--t1)"></i><i style="left:${r.f0}%;background:var(--t0)"></i>
        </span>
        <span class="nums"><b>${r.f0}</b></span>
      </button>
      ${open ? `<div class="dot-detail">
        <div class="kv">${hist.map((h) => `<span>${esc(h.label)} ${h.v}</span>`).join("")}<span>Now ${r.f0}</span><span>F+1 ${r.f1} ± ${r0(r.band.f1)}</span><span>F+2 ${r.f2} ± ${r0(r.band.f2)}</span><span>Ceiling ${r.ceiling}</span><span>${esc(r.confidence)} confidence${edited}</span></div>
        ${a.evidence?.[r.id] ? `<p>${esc(a.evidence[r.id])}</p>` : `<p class="note">No evidence note for this task type yet.</p>`}
        ${srcs.length ? `<p class="srcs">Sources: ${srcs.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><span class="chip ${esc(s.tier || "secondary")}">${esc(s.tier || "secondary")}</span>`).join(" ")}</p>` : ""}
        ${edited ? `<p class="note">Published: now ${published.f0}, F+1 ${published.f1}, F+2 ${published.f2}, ceiling ${published.ceiling}.</p>` : ""}
      </div>` : ""}
    </div>`;
  };

  const scale = `<div class="dot-scale" aria-hidden="true"><span class="spacer"></span><span class="spacer">Task type</span><span class="ticks"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></span><span>Now</span></div>`;
  let body;
  if (state.archSort === "share") {
    const fams = {};
    for (const r of model.archetypes) (fams[r.family] ||= []).push(r);
    body = Object.entries(fams)
      .map(([name, rows]) => ({ name, rows: rows.sort(sorters.share), share: rows.reduce((s, r) => s + r.share, 0) }))
      .sort((p, q) => q.share - p.share)
      .map((f) => `<div class="fam-head"><span>${esc(f.name)}</span><span class="mono">${(f.share * 100).toFixed(1)}% of all work</span></div>${f.rows.map(row).join("")}`)
      .join("");
  } else {
    body = [...model.archetypes].sort(sorters[state.archSort]).map(row).join("");
  }
  $("dots").innerHTML = scale + body;
  $("dots").querySelectorAll("[data-arch]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.arch;
    const opening = !state.openArchs.has(id);
    opening ? state.openArchs.add(id) : state.openArchs.delete(id);
    setHash("tasks", opening ? id : null);
    renderTasks();
    document.querySelector(`[data-arch="${id}"]`)?.focus();
  }));
  bindTips($("dots"));
  renderEditor();
}

function renderEditor() {
  const published = live().scores;
  const rows = [...model.archetypes].sort((p, q) => q.share - p.share);
  const label = { f0: "Now", f1: "F+1", f2: "F+2", ceiling: "Ceiling" };
  const hasEdits = Object.keys(state.edits).length > 0;
  if (hasEdits) {
    const base = computeModel({ ...data, assessment: live(), weight: state.weight, horizon: HORIZON }).index;
    const i = model.index;
    $("editor-readout").innerHTML = `<span>With your edits: now <b>${pct(i.f0)}</b> · next generation <b>${pct(i.f1)}</b> · generation after <b>${pct(i.f2)}</b> · ceiling <b>${pct(i.limit)}</b></span>
      <span>Published: ${pct(base.f0)} · ${pct(base.f1)} · ${pct(base.f2)} · ${pct(base.limit)}</span>`;
  } else {
    $("editor-readout").innerHTML = `<span class="note">Change any score below to see what it does to the index.</span>`;
  }
  const input = (a, k) => {
    const edited = state.edits[a.id]?.[k] !== undefined;
    return `<input type="number" id="edit-${a.id}-${k}" min="0" max="100" step="1" value="${a[k]}" data-arch="${a.id}" data-k="${k}" class="${edited ? "edited" : ""}" aria-label="${esc(a.name)} ${label[k]}" title="Published: ${published[a.id][k]}">`;
  };
  $("arch-table").innerHTML = `<thead><tr><th>Task type</th><th class="num">Share of work</th>${[...TIERS, "ceiling"].map((k) => `<th class="num">${label[k]}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((a) => `<tr><td>${esc(a.name)}</td><td class="num">${(a.share * 100).toFixed(1)}%</td>${[...TIERS, "ceiling"].map((k) => `<td class="num">${input(a, k)}</td>`).join("")}</tr>`).join("")}</tbody>`;
  $("arch-table").querySelectorAll("input").forEach((el) => el.addEventListener("change", () => {
    const { arch, k } = el.dataset;
    const v = Math.max(0, Math.min(100, Number(el.value)));
    if (!Number.isFinite(v)) return;
    const next = { ...state.edits[arch], [k]: v };
    if (v === published[arch][k]) delete next[k];
    const s = { ...published[arch], ...next };
    if (!(s.f0 <= s.f1 && s.f1 <= s.f2 && s.f2 <= s.ceiling)) { el.setCustomValidity("Keep Now ≤ F+1 ≤ F+2 ≤ Ceiling"); el.reportValidity(); return; }
    el.setCustomValidity("");
    if (Object.keys(next).length) state.edits[arch] = next; else delete state.edits[arch];
    store.set(`headroom.edits.${data.index.latest}`, state.edits);
    const focusId = el.id;
    render();
    $("editor").open = true;
    $(focusId)?.focus();
  }));
}

/* ---------- Method ---------- */

function renderMethod() {
  const a = live();
  $("snapshots").innerHTML = [...snaps].reverse().map(({ a: s, m }) => `<div class="snap">
    <div class="when">${monthYear(parseDate(s.date))}<span>${esc(s.label || "")}</span></div>
    <div class="what">
      <div><b>${esc(s.anchor)}</b><span class="pill">${s.kind === "backfill" ? "Backfilled" : "Live, with forecasts"}</span></div>
      ${s.frontier ? `<span class="frontier">Public frontier at the time: ${esc(s.frontier)}</span>` : ""}
      ${s.peers ? `<span class="note">Peers: ${esc(s.peers)}</span>` : ""}
      ${s.highlights?.length ? `<ul>${s.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    </div>
    <div class="score">${pct(m.index.f0)}<small>AI can do</small></div>
  </div>`).join("");

  renderForecastCheck();

  const c = model.index.confidence;
  $("evidence").innerHTML = `<div class="row"><b>Evidence behind these scores</b>
      <span><span class="swatch conf-high"></span>High confidence ${pct(c.high)}</span>
      <span><span class="swatch conf-medium"></span>Medium ${pct(c.medium)}</span>
      <span><span class="swatch conf-low"></span>Low ${pct(c.low)}</span></div>
    <div class="bar" role="img" aria-label="Share of the index by score confidence: high ${pct(c.high)}, medium ${pct(c.medium)}, low ${pct(c.low)}"><span class="conf-high" style="width:${c.high}%"></span><span class="conf-medium" style="width:${c.medium}%"></span><span class="conf-low" style="width:${c.low}%"></span></div>
    <p class="note">${pct(c.low)} of this index sits in task types scored with low confidence: no benchmark measures them, so their scores rest on labor-side studies and judgment. Only ${pct(c.high)} sits in types with a direct benchmark. Forecast ranges widen with low confidence; the Tasks tab shows each type.</p>`;


  const blocks = [
    ["What's measured", [a.definition, a.method_note].filter(Boolean)],
    ["Structure", [`${model.occupations.length} occupations from BLS OEWS (${data.occupations.reference || "May 2025"}) are split into tasks with a share of working time. Each task maps to one of ${model.archetypes.length} task types, and each task type is scored 0 to 100 at every snapshot.`, data.occupations.task_basis].filter(Boolean)],
    ["Snapshots and forecasts", [`Each Opus release since ${snaps[0].a.anchor} is a snapshot that scores what the public frontier could do on that date. The live snapshot also carries forecasts for Frontier+1 (${monthYear(tierDate(1))}) and Frontier+2 (${monthYear(tierDate(2))}); later generations are spaced ${a.cadence_months} months apart.`, "When a forecast date arrives, the next snapshot is scored against the forecast on this page, so the method is tested, not just restated."]],
    ["Ceiling and saturation", ["Each task type has a ceiling: the most AI could take even with unlimited intelligence, given physical presence, legal sign-off and human preference.", "Past Frontier+2, each task type's remaining gap to its ceiling keeps closing at the rate implied by its last step. The saturation point is the first generation that adds under one point to the index; that one-point threshold is a convention."]],
    ["Uncertainty", [`Forecast ranges are ±${(a.uncertainty?.f1 ?? 5)} points at Frontier+1 and ±${(a.uncertainty?.f2 ?? 8)} at Frontier+2 for a task type with medium-confidence evidence, narrower for high and wider for low. The index range adds the task-type ranges together, which assumes their errors move in the same direction; independent errors would give a narrower band.`]],
    ["Weights", ["Wages weights each occupation by employment times mean wage. People weights by headcount. The headline uses wages."]],
    ["Limits", a.caveats || []],
  ];
  $("method-grid").innerHTML = blocks.filter(([, ps]) => ps.length).map(([h, ps]) => `<div><h3>${h}</h3>${ps.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`).join("");

  const cal = a.calibration;
  if (cal) {
    const rows = model.groups.map((g) => ({ g, ref: cal.values[g.id] })).filter((r) => typeof r.ref === "number").sort((p, q) => q.g.proj[0] - p.g.proj[0]);
    $("calib-note").textContent = `${cal.label}. Site figures are today's score ${weightPhrase()}. ${cal.note || ""}`;
    $("calibration").innerHTML = `<thead><tr><th>BLS major group</th><th class="num">Headroom, now</th><th class="num">ESADE replaceable</th><th class="num">Gap</th></tr></thead>
      <tbody>${rows.map(({ g, ref }) => `<tr><td>${esc(g.name)}</td><td class="num">${pct(g.proj[0])}</td><td class="num">${ref.toFixed(1)}%</td><td class="num diff">${g.proj[0] - ref >= 0 ? "+" : ""}${r0(g.proj[0] - ref)}</td></tr>`).join("")}</tbody>`;
  }

  const groups = {};
  for (const s of a.sources || []) (groups[s.group || "Sources"] ||= []).push(s);
  const li = (s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><span class="chip ${esc(s.tier || "secondary")}">${esc(s.tier || "secondary")}</span>${s.note || s.accessed ? `<span class="src-note">${s.note ? esc(s.note) + " · " : ""}${s.accessed ? `accessed ${esc(s.accessed)}` : ""}</span>` : ""}</li>`;
  $("sources").innerHTML = Object.entries(groups).map(([g, list]) => `<div class="src-group"><h3>${esc(g)}</h3><ul>${list
    .sort((p, q) => (TIER_ORDER[p.tier] ?? 9) - (TIER_ORDER[q.tier] ?? 9) || p.title.localeCompare(q.title)).map(li).join("")}</ul></div>`).join("")
    + `<div class="src-group"><h3>Employment and wages</h3><ul><li>${esc(data.occupations.source)}</li></ul></div>`;
}

// Scores every stored forecast against the snapshot closest to its due date.
function renderForecastCheck() {
  const items = [];
  const DUE_WINDOW = 1000 * 60 * 60 * 24 * 75;
  for (const { a } of snaps) {
    const forecasts = a.forecast_dates && Object.values(a.scores).every((s) => typeof s.f1 === "number" && typeof s.f2 === "number" && typeof s.ceiling === "number");
    if (!forecasts) continue;
    const fm = computeModel({ ...data, assessment: { ...a, kind: "live" }, weight: state.weight, horizon: HORIZON }).index;
    for (const [k, n] of [["f1", 1], ["f2", 2]]) {
      const due = parseDate(a.forecast_dates[k]);
      const actual = snaps.filter((s) => s.a.id !== a.id && parseDate(s.a.date) > parseDate(a.date) && Math.abs(parseDate(s.a.date) - due) <= DUE_WINDOW)
        .sort((p, q) => Math.abs(parseDate(p.a.date) - due) - Math.abs(parseDate(q.a.date) - due))[0];
      items.push({ a, n, due, predicted: fm[k], band: fm.band[k], actual });
    }
  }
  $("forecast-check").innerHTML = items.length ? items.map((it) => {
    const diff = it.actual ? it.actual.m.index.f0 - it.predicted : null;
    const verdict = it.actual
      ? `${pct(it.actual.m.index.f0)} measured (${esc(it.actual.a.anchor)}, ${monthYear(parseDate(it.actual.a.date))}): ${Math.abs(diff) <= it.band ? "within" : "outside"} the range (${diff >= 0 ? "+" : ""}${r0(diff)})`
      : `due ${monthYear(it.due)}`;
    return `<div class="check"><span>Frontier+${it.n} forecast made ${monthYear(parseDate(it.a.updated || it.a.date))} with ${esc(it.a.anchor)} as the frontier: <b>${pct(it.predicted)} ± ${r0(it.band)}</b> by ${monthYear(it.due)}</span><span class="verdict">${verdict}</span></div>`;
  }).join("") : `<p class="note">No forecast has come due yet.</p>`;
}

/* ---------- Tooltip ---------- */

let tipTimer;
function hideTip() { $("tooltip").hidden = true; clearTimeout(tipTimer); }

function bindTips(root) {
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
  };
  root.querySelectorAll("[data-tip]").forEach((el) => {
    el.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") show(el, e); });
    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      show(el, e);
      clearTimeout(tipTimer);
      tipTimer = setTimeout(hideTip, 4000);
    });
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); });
  });
}

load().catch((err) => {
  document.querySelector("main").insertAdjacentHTML("afterbegin",
    `<div class="banner">Could not load the data files (${esc(err.message)}). Serve the folder over HTTP, for example with <code>python3 -m http.server</code>, and reload.</div>`);
});
