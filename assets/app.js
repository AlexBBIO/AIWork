import { computeModel, TIERS, adoptionAt, driftAt, scopedRevenue, groupAverage, interpolate, revenueAt } from "./model.js";

const $ = (id) => document.getElementById(id);
const HORIZON = 8;
const HOURS = 40;
const VIEWS = ["overview", "jobs", "tasks", "value", "method"];
const r0 = (x) => Math.round(x);
const pct = (x) => `${r0(x)}%`;
const span = ([lo, hi]) => `${r0(lo)}–${r0(hi)}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// Tooltip content travels as JSON in data-tip: { title, sub, rows: [{ k, label, value, swatch }], help, note }.
const tipAttr = (t) => `data-tip="${esc(JSON.stringify(t))}"`;
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
  scenario: "base",
  custom: null,   // adoption growth and peak, price and cut the viewer set on the Value page; null means the scenario's
  openGroups: new Set(),
  closedInSearch: new Set(), // groups the viewer collapsed while a search is showing them all
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
    const economics = await get("data/economics.json").catch(() => null);
    data = { taxonomy, occupations, index, assessments: Object.fromEntries(list.map((a) => [a.id, a])), economics };
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
  const selector = { jobs: `[data-occ="${CSS.escape(id || "")}"]`, tasks: `[data-arch="${CSS.escape(id || "")}"]`, method: `#m-${CSS.escape(id || "")}` }[view];
  const target = id && selector ? document.querySelector(selector) : null;
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
  $("occ-search").addEventListener("input", (e) => { state.search = e.target.value.trim().toLowerCase(); state.closedInSearch.clear(); renderJobs(); });
  $("occ-sort").addEventListener("change", (e) => { state.sort = e.target.value; renderJobs(); });
  $("arch-sort").addEventListener("change", (e) => { state.archSort = e.target.value; renderTasks(); });
  const reset = () => { state.edits = {}; store.set(`headroom.edits.${data.index.latest}`, {}); render(); };
  $("reset-edits").addEventListener("click", reset);
  $("reset-edits-top").addEventListener("click", reset);
  $("copy-link").addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}#tasks?w=${state.weight}&e=${encodeEdits(state.edits)}`;
    try { await navigator.clipboard.writeText(url); $("copy-status").textContent = "Link copied."; }
    catch { $("copy-status").textContent = url; }
  });
  $("hero-search").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("hero-query").value.trim();
    $("occ-search").value = q;
    state.search = q.toLowerCase();
    state.closedInSearch.clear();
    location.hash = "jobs";
  });
  setupTips();
  for (const k of PARAMS)
    $(`${k}-in`).addEventListener("input", (e) => { state.custom = { ...scenarioParams(), [k]: Number(e.target.value) }; state.scenario = "custom"; renderValue(); });
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
  // The masthead strip is the index itself: now, the next two generations, open, needs a person.
  let at = 0;
  document.documentElement.style.setProperty("--strip", `linear-gradient(90deg, ${bands(model.index.proj, model.index.limit)
    .map((x) => `${x.color || (x.k === "open" ? "var(--open)" : "var(--struct)")} ${at}% ${(at += x.v)}%`).join(", ")})`);
  for (const t of document.querySelectorAll(".tabs a")) {
    if (t.dataset.view === state.view) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
  }
  for (const v of VIEWS) $(`view-${v}`).hidden = v !== state.view;
  const hasEdits = Object.keys(state.edits).length > 0;
  $("edits-banner").hidden = !hasEdits;
  $("reset-edits").disabled = !hasEdits;
  $("copy-link").disabled = !hasEdits;
  if (!hasEdits) $("copy-status").textContent = "";
  ({ overview: renderOverview, jobs: renderJobs, tasks: renderTasks, value: renderValue, method: renderMethod })[state.view]();
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
// What each band means, shown when the pointer is over it.
function bandHelp(k) {
  return {
    now: "Work today's best public model can do to a competent professional's standard, with light review.",
    f1: `What the next generation adds, expected around ${monthYear(tierDate(1))}.`,
    f2: `What the generation after adds, expected around ${monthYear(tierDate(2))}.`,
    open: "Below the ceiling but beyond the next two generations: later models could take it.",
    human: "Above the ceiling: it needs physical presence, a signature or a relationship, whatever the model.",
  }[k];
}

function stackBar(proj, limit, { tall = false, scale = 100, label = "", sub = "", note = "" } = {}) {
  const b = bands(proj, limit);
  const a11y = label ? `role="img" aria-label="${esc(label)}: ${esc(bandText(proj, limit))}"` : 'aria-hidden="true"';
  const tip = { title: label || "Breakdown", sub, rows: b.map((x) => ({ k: x.k, label: x.label, value: pct(x.v), swatch: x.k })), help: 1, note };
  return `<div class="stack${tall ? " tall" : ""}" style="width:${scale}%" ${tipAttr(tip)} ${a11y}>${b
    .map((x) => `<div data-band="${x.k}" class="${x.cls || ""}" style="flex:0 0 max(0px, calc(${x.v}% - 2px));${x.color ? `background:${x.color}` : ""}"></div>`)
    .join("")}</div>`;
}

const swatchFor = (x) => `<span class="swatch ${x.cls === "fill-open" ? "open" : x.cls === "fill-struct" ? "human" : ""}" style="${x.color ? `background:${x.color}` : ""}"></span>`;
// Legend entries explain their band and light it up across the page.
function legendHTML(withValues) {
  return bands(model.index.proj, model.index.limit).map((x) => `<span class="lg" data-band="${x.k}" ${tipAttr({ title: x.label, note: bandHelp(x.k) })}>${swatchFor(x)}${x.label}${withValues ? ` <b>${withValues(x)}</b>` : ""}</span>`).join("");
}
const confChip = (c) => `<span class="chip ${c}">${c} confidence</span>`;

/* ---------- Overview ---------- */

function renderOverview() {
  const a = live();
  const { proj, limit, flatAt, range, confidence } = model.index;
  const first = snaps[0];
  const d1 = tierDate(1), d2 = tierDate(2);

  $("lead-eyebrow").textContent = `U.S. white-collar work · ${monthYear(asOf())} · ${a.anchor}`;
  $("lead-h1").textContent = "How much work can AI do?";
  $("lead-figure").innerHTML = `${r0(proj[0])}<small>%</small>`;
  $("lead-figure-note").textContent = `of U.S. white-collar working time, ${weightPhrase()}, is in tasks today's best public AI model can do.`;
  $("lead-lede").textContent =
    (snaps.length > 1 ? `Up from ${pct(first.m.index.f0)} when ${first.a.anchor} was the frontier in ${monthYear(parseDate(first.a.date))}. ` : "") +
    `Progress flattens near ${pct(limit)}; the remaining ${pct(100 - limit)} needs a person in the room, a signature, or a relationship. ` +
    `${weightPhrase(otherWeight())[0].toUpperCase()}${weightPhrase(otherWeight()).slice(1)}, today's figure is ${pct(altIndex.f0)}.`;
  $("lead-scope").innerHTML = `<span><b>${model.occupations.length}</b>occupations</span>
    <span><b>${(model.totals.employment / 1000).toFixed(1)} million</b>jobs covered (BLS, May 2025)</span>
    <span><b>${state.weight === "wage" ? "Wages" : "People"}</b>index weighting · <a href="#method/weights">explained</a></span>`;

  const flattens = flatAt !== null;
  const pace = recentPace();
  const line = (n) => {
    const d = tierDate(n), r = range[`f${n}`], gain = proj[n] - proj[0];
    const tip = { title: `Frontier+${n}, around ${monthYear(d)}`, sub: n === 1 ? "The next capability step" : "The step after that",
      rows: [{ k: "v", label: "Forecast", value: pct(proj[n]), swatch: `f${n}` }, { label: "Range", value: `${span(r)}%` }, { label: "From today", value: `+${r0(gain)} pts` }],
      note: "Each task type closes a fixed share of its remaining gap to the ceiling per generation. The range adds up the task types' ranges, which assumes their errors move together." };
    return `<div class="forecast-line" tabindex="0" ${tipAttr(tip)}><div><strong>${monthYear(d)}</strong><small>+${r0(gain)} pts from today · range ${span(r)}</small></div><span class="metric">${r0(proj[n])}<small>%</small></span></div>`;
  };
  const ceilTip = { title: "Ceiling", rows: [{ label: "Most AI could ever take", value: pct(limit), swatch: "line" }, { k: "human", label: "Needs a person", value: pct(100 - limit), swatch: "human" },
    ...(flattens ? [{ label: `Index by ${monthYear(tierDate(flatAt))}`, value: pct(proj[flatAt]), swatch: "trend" }] : [])],
    note: "Each task type's ceiling is the most of it AI could take with unlimited intelligence, given physical presence, legal sign-off and human preference. Saturation is when gains fall under a point a generation." };
  $("readout").innerHTML = `<p class="eyebrow">If the modeled pace continues</p>
    <h2 id="readout-h">The next two generations</h2>
    ${line(1)}${line(2)}
    <div class="forecast-line ceil" tabindex="0" ${tipAttr(ceilTip)}><div><strong>Ceiling</strong><small>${flattens ? `Flattens by ~${tierDate(flatAt).getUTCFullYear()} near ${pct(proj[flatAt])}` : "Still rising at the end of the projection"} · ${pct(100 - limit)} needs a person</small></div><span class="metric">${r0(limit)}<small>%</small></span></div>
    <p class="panel-note">Forecasts carry today's pace forward: each task type closes a fixed share of its gap to the ceiling.${pace ? ` Frontier+1 closes ${pct(pace.ahead * 100)} of the remaining gap in ${pace.months} months; the ${pace.months} months before ${shortModel(a.anchor)} closed ${pct(pace.behind * 100)}.` : ""}</p>
    <p class="panel-link"><a href="#tasks">Inspect the assumptions →</a></p>`;
  const sw = (c) => `<span class="swatch" style="background:${c}"></span>`;

  renderTimeline();
  renderWeek();

  const ranked = [...model.occupations].sort((p, q) => q.proj[0] - p.proj[0]);
  const item = (o, val = pct(o.proj[0]), sub = `${jobs(o.employment)} jobs`) => `<li><a href="#jobs/${o.id}"><span class="title">${esc(o.title)}<br><span class="sub">${sub}</span></span><span class="val">${val}</span>${stackBar(o.proj, o.limit, { label: o.title, sub: `${jobs(o.employment)} jobs · $${o.wage}k mean pay`, note: "Select to open this job's working week." })}</a></li>`;
  $("most").innerHTML = ranked.slice(0, 6).map((o) => item(o)).join("");
  $("least").innerHTML = ranked.slice(-6).reverse().map((o) => item(o)).join("");
  const gain = (o) => o.proj[2] - o.proj[0];
  $("movers-h").textContent = `Biggest gains by ${monthYear(d2)}`;
  $("movers").innerHTML = [...model.occupations].sort((p, q) => gain(q) - gain(p)).slice(0, 6)
    .map((o) => item(o, `+${r0(gain(o))}`, `${pct(o.proj[0])} now → ${pct(o.proj[2])} · ${jobs(o.employment)} jobs`)).join("");

  const g = [
    [sw("var(--t0)"), "Frontier", `The best publicly available model on the snapshot date. Today that's ${a.anchor}. Earlier snapshots track each Opus release back to ${first.a.anchor}; where another public model led, the score follows the leader.`],
    [sw("var(--t1)"), "Next generation and the one after", `Frontier+1 and Frontier+2: the next two capability steps, roughly two or three point releases each. They are not separate judgments: each closes a fixed share of the remaining gap to the ceiling, set by the pace of the last ten months.`],
    ["", "Range", `The forecast range: 5 points either side at Frontier+1 and 8 at Frontier+2 for a task type with medium-confidence evidence, narrower with a direct benchmark, wider without one, and never below today's score or above the ceiling.`],
    ["", "Can do", "AI can do the task at the quality of a competent professional, with no more than light review. This measures capability, not whether employers have adopted it."],
    ['<span class="swatch line"></span>', "Ceiling", "The most of a task AI could ever take, even with unlimited intelligence. Above it sits work that needs physical presence, legal accountability, or a human relationship."],
    ["", "Wages or people", "Wages weights each job by its total pay, so the index reads as a share of what employers spend. People weights by headcount, so it reads as a share of working time."],
    ["", "Evidence", `${pct(confidence.high)} of the index rests on task types with a direct benchmark, ${pct(confidence.medium)} on adjacent evidence and ${pct(confidence.low)} on labor studies and judgment. The Tasks tab shows each type's confidence; the Method tab has the breakdown.`],
    ["", "Coverage", `${model.occupations.length} occupations covering ${jobs(model.totals.employment)} U.S. jobs (BLS OEWS, May 2025) in twelve white-collar groups, each split into ${Math.min(...model.occupations.map((o) => o.tasks.length))} to ${Math.max(...model.occupations.map((o) => o.tasks.length))} tasks. Registered nurses, retail sales and the self-employed are not covered.`],
  ];
  $("glossary").innerHTML = g.map(([s, t, d]) => `<div><dt>${s}${t}</dt><dd>${esc(d)}</dd></div>`).join("");
}

function renderTimeline() {
  const box = $("timeline");
  const { proj, limit, flatAt, range } = model.index;
  const W = Math.max(320, Math.min(980, box.clientWidth || 980));
  const narrow = W < 640;
  const H = narrow ? 280 : 340;
  const m = { l: 46, r: 14, t: 18, b: 40 };
  const lastGen = Math.min(HORIZON, Math.max(flatAt ?? HORIZON, 4));
  const past = snaps.map(({ a, m: mm }) => ({ d: parseDate(a.date), v: mm.index.f0, label: shortModel(a.anchor), a }));
  const future = Array.from({ length: lastGen }, (_, i) => ({ n: i + 1, d: tierDate(i + 1), v: proj[i + 1], r: i === 0 ? range.f1 : i === 1 ? range.f2 : null }));
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
    <text x="${x(asOf()) + 5}" y="${y(4)}">Today</text>
    <line id="tl-guide" class="guide" x1="0" x2="0" y1="${m.t}" y2="${y(0)}"/>`;

  // x-axis: a labelled tick each January, a minor tick each July
  for (let d = new Date(Date.UTC(past[0].d.getUTCFullYear(), 0, 1)); d.getTime() <= t1; d = addMonths(d, 6)) {
    if (d.getTime() < t0) continue;
    const jan = d.getUTCMonth() === 0;
    s += `<line x1="${x(d)}" x2="${x(d)}" y1="${y(0)}" y2="${y(0) + (jan ? 5 : 3)}" stroke="var(--rule-strong)"/>`;
    if (jan) s += `<text x="${x(d)}" y="${H - m.b + 18}" text-anchor="middle" class="lbl-strong">${narrow ? `'${String(d.getUTCFullYear()).slice(2)}` : d.getUTCFullYear()}</text>`;
  }

  // Forecast range: widens from today's point to Frontier+2
  s += `<path d="M${pt(now.d, now.v)} L${pt(f1.d, f1.r[1])} L${pt(f2.d, f2.r[1])} L${pt(f2.d, f2.r[0])} L${pt(f1.d, f1.r[0])} Z" fill="var(--t1)" opacity="0.18"/>`;
  s += `<path d="${path(future.slice(1))}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.8"/>
    <path d="${path([now, f1, f2])}" fill="none" stroke="var(--t1)" stroke-width="2"/>
    <path d="${path(past)}" fill="none" stroke="var(--t0)" stroke-width="2.5"/>`;

  // Past snapshots: hollow if backfilled. Label the first, the milestones and the latest.
  past.forEach((p, i) => {
    const last = i === past.length - 1;
    const hollow = p.a.kind === "backfill";
    s += `<circle id="tl-p${i}" class="pt" cx="${x(p.d)}" cy="${y(p.v)}" r="${last ? 6 : 4.5}" fill="${hollow ? "var(--surface)" : "var(--t0)"}" stroke="${hollow ? "var(--t0)" : "var(--surface)"}" stroke-width="2"/>`;
    if (last || !(i === 0 || p.a.milestone) || (narrow && i !== 0)) return;
    s += `<text x="${x(p.d) + (i === 0 ? 0 : -6)}" y="${i === 0 ? y(p.v) + 20 : y(p.v) - 12}" text-anchor="${i === 0 ? "start" : "end"}" class="lbl-model">${esc(p.label)}</text>`;
  });
  s += `<text x="${x(now.d) - 10}" y="${y(now.v) - 12}" text-anchor="end" class="lbl-strong">${narrow ? "" : `${esc(now.label)} · `}${pct(now.v)}</text>`;
  future.forEach((p) => {
    const scored = p.n <= 2;
    s += `<circle id="tl-f${p.n}" class="pt" cx="${x(p.d)}" cy="${y(p.v)}" r="${scored ? 5 : 3.5}" fill="${scored ? `var(--t${p.n})` : "var(--surface)"}" stroke="${scored ? "var(--surface)" : "var(--muted)"}" stroke-width="2"/>`;
    // Both labels sit under the band, F+1 centred on its point and F+2 starting at its
    // point, so they clear each other, the ceiling line and the trend.
    if (scored) {
      const first = p.n === 1;
      s += `<text x="${x(p.d) - (first ? 0 : 4)}" y="${y(p.r[0]) + 18}" text-anchor="${first ? "middle" : "start"}" class="lbl-strong">${narrow ? `F+${p.n}` : `F+${p.n} · ${pct(p.v)} (${span(p.r)})`}</text>`;
    }
  });
  const lastF = future[future.length - 1];
  if (!narrow) s += `<text x="${x(lastF.d)}" y="${y(lastF.v) + 18}" text-anchor="end">trend</text>`;

  // Hover and focus targets: each lights its point, shows the guide line, and opens the
  // snapshot's evidence or the forecast check when selected.
  const pts = [
    ...past.map((p, i) => ({ ...p, id: `tl-p${i}`, href: `method/${p.a.id}`, tip: {
      title: p.a.anchor, sub: `${monthYear(p.d)} · ${p.a.kind === "backfill" ? "scored after the fact" : "live snapshot"}`,
      rows: [{ label: "AI can do", value: pct(p.v), swatch: "now" }, ...(i ? [{ label: "Since the previous snapshot", value: `+${r0(p.v - past[i - 1].v)} pts` }] : [])],
      note: `${p.a.frontier ? `Frontier then: ${p.a.frontier}. ` : ""}Select for this snapshot's evidence.` } })),
    ...future.map((p) => ({ ...p, id: `tl-f${p.n}`, href: p.n <= 2 ? "method/forecasts" : null, tip: {
      title: `Frontier+${p.n}`, sub: `Around ${monthYear(p.d)}`,
      rows: [{ label: p.n <= 2 ? "Forecast" : "Trend", value: pct(p.v), swatch: p.n <= 2 ? `f${p.n}` : "trend" }, ...(p.r ? [{ label: "Range", value: `${span(p.r)}%` }] : []), { label: "From today", value: `+${r0(p.v - now.v)} pts` }],
      note: p.n <= 2 ? "Select to see how forecasts are checked against later snapshots." : "A trend, not a forecast: each task type keeps closing its gap at the rate of its last step." } })),
  ];
  pts.forEach((p) => {
    const label = `${p.tip.title}, ${p.tip.sub}: ${p.tip.rows.map((r) => `${r.label} ${r.value}`).join(", ")}`;
    s += `<circle class="hit" cx="${x(p.d)}" cy="${y(p.v)}" r="14" fill="transparent" tabindex="0" data-pt="${p.id}" data-x="${x(p.d).toFixed(1)}"${p.href ? ` data-href="${p.href}" role="link"` : ""} aria-label="${esc(label)}" ${tipAttr(p.tip)}/>`;
  });
  box.innerHTML = s + "</svg>";

  $("timeline-h").textContent = `From ${shortModel(past[0].a.anchor)} to saturation`;
  $("timeline-note").textContent = `Each point on the dark line is one Opus release, scored for what the public frontier could do at the time (hollow points were scored after the fact). The blue points are the next two generations with their forecast range; the dashed line carries each task type's gap-closure rate past Frontier+2 and is a trend, not a forecast. Hover, tap or tab to a point for details, and select it for the evidence.`;
  const lg = (inner, title, note) => `<span class="lg" ${tipAttr({ title, note })}>${inner}${title}</span>`;
  $("timeline-legend").innerHTML = [
    lg('<span class="dot hollow"></span>', "Backfilled snapshots", "Scored after the fact from benchmark results, for the frontier of that date only."),
    lg('<span class="dot" style="background:var(--t0)"></span>', "Live snapshot", "The current assessment, which also carries the two forecasts."),
    lg('<span class="band"></span>', "Forecast, next two generations, with range", "The shaded band is the forecast range, cut off at today's score and the ceiling."),
    lg('<span class="dot trend"></span>', "Trend projection", "Each task type keeps closing its gap to the ceiling at the rate of its last step. Not a forecast."),
    lg('<span class="swatch human"></span>', "Needs a person", bandHelp("human")),
  ].join("");
}

// Share of the gap to the ceiling that Frontier+1 closes, against the share closed over the
// same span before the live snapshot (read off the frontier on that earlier date).
function recentPace() {
  const a = live(), { f0, f1, limit } = model.index;
  const months = Math.round((tierDate(1) - parseDate(a.date)) / (1000 * 60 * 60 * 24 * 30.44));
  const then = addMonths(parseDate(a.date), -months);
  const before = snaps.filter((x) => parseDate(x.a.date) <= then).pop();
  if (!before || !(limit > before.m.index.f0) || !(limit > f0)) return null;
  return { months, ahead: (f1 - f0) / (limit - f0), behind: (f0 - before.m.index.f0) / (limit - before.m.index.f0) };
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
    `<div data-band="${x.k}" class="${x.cls || ""}" style="${x.color ? `background:${x.color}` : ""}"></div>`).join("")).join("");
  $("week").setAttribute("data-tip", JSON.stringify({ title: `An average ${HOURS}-hour week`, sub: `Across all covered jobs, ${weightPhrase()}`,
    rows: b.map((x, i) => ({ k: x.k, label: x.label, value: `${hrs[i]}h`, swatch: x.k })), help: 1 }));
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
      const open = q ? !state.closedInSearch.has(g.id) : state.openGroups.has(g.id);
      const coverage = g.employment_bls ? `${jobs(g.employment)} of ${jobs(g.employment_bls)} BLS jobs` : `${jobs(g.employment)} jobs`;
      return `<div class="group">
        <button type="button" class="row-btn" data-group="${g.id}" aria-expanded="${open}">
          <span class="chev" aria-hidden="true">▶</span>
          <span class="title">${esc(g.name)}<span class="meta">${coverage} · ${pct(g.weight * 100)} of ${weightNoun()} · ${g.count} occupations</span></span>
          ${stackBar(g.proj, g.limit, { tall: true, label: g.name, sub: `${g.count} occupations · ${pct(g.weight * 100)} of ${weightNoun()}`, note: open ? "Select to collapse the group." : "Select to show its jobs." })}
          <span class="nums"><b>${pct(g.proj[0])}</b> now → ${pct(g.proj[2])}</span>
        </button>
        ${open ? `<div class="occ-list">${members.map((o) => occRow(o, archName)).join("")}</div>` : ""}
      </div>`;
    }).join("");
  }
  $("groups").innerHTML = html || empty;

  $("groups").querySelectorAll("[data-group]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.group;
    const set = state.search ? state.closedInSearch : state.openGroups;
    set.has(id) ? set.delete(id) : set.add(id);
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
      ${stackBar(o.proj, o.limit, { label: o.title, sub: `${jobs(o.employment)} jobs · $${o.wage}k mean pay`, note: open ? "Select to close the task breakdown." : "Select to see which hours of its week AI can take." })}
      <span class="nums"><b>${pct(o.proj[0])}</b> now → ${pct(o.proj[2])}</span>
    </button>
    ${open ? `<div class="occ-detail">
      <p class="note">In a 40-hour week, AI could handle about <b>${h(o.proj[0])} hours</b> of this job today and ${h(o.proj[2])} hours (range ${h(o.range.f2[0])}–${h(o.range.f2[1])}) two generations from now. About ${h(100 - o.limit)} hours need a person regardless. Bar length is each task's share of the week; the colours show how much of it AI can do. The task mix is an estimate.${lowNote}</p>
      ${o.tasks.map((t) => `<div class="task-row">
        <span class="tname">${esc(t.name)}<span class="ttype">${esc(archName[t.arch])}</span></span>
        ${stackBar(t.proj, t.limit, { scale: (t.share / maxShare) * 100, label: t.name, sub: `${archName[t.arch]} · ${h(t.share)}h of the week`, note: `Bar length is this task's share of the week; colours split it by when AI can do it.` })}
        <span class="hrs">${h(t.share)}h · ${pct(t.proj[0])}</span>
      </div>`).join("")}
    </div>` : ""}
  </div>`;
}

/* ---------- Tasks ---------- */

// A task type's track as a tooltip: every snapshot, both forecasts with their ranges and
// the ceiling; the point nearest the pointer is highlighted.
function trackTip(r, hist) {
  return {
    title: r.name, sub: `${r.share < 0.001 ? "under 0.1" : (r.share * 100).toFixed(1)}% of all work · ${r.confidence} confidence`,
    rows: [
      ...hist.map((h, i) => ({ k: `p${i}`, label: h.label, value: String(h.v), swatch: "past" })),
      { k: "now", label: "Now", value: String(r.f0), swatch: "now" },
      { k: "f1", label: `Next generation · ${monthYear(tierDate(1))}`, value: `${r.f1} (${span(r.range.f1)})`, swatch: "f1" },
      { k: "f2", label: `Generation after · ${monthYear(tierDate(2))}`, value: `${r.f2} (${span(r.range.f2)})`, swatch: "f2" },
      { k: "ceil", label: "Ceiling", value: String(r.ceiling), swatch: "line" },
    ],
    note: "Select the row for the evidence and sources.",
  };
}

function renderTasks() {
  const a = live();
  $("arch-count").textContent = model.archetypes.length;
  const pastSnaps = snaps.filter((s) => s.a.id !== a.id);
  const srcById = Object.fromEntries((a.sources || []).map((s) => [s.id, s]));
  const lg = (inner, title, note) => `<span class="lg" ${tipAttr({ title, note })}>${inner}${title}</span>`;
  $("dots-legend").innerHTML = [
    lg('<span class="dot" style="background:var(--past)"></span>', "Earlier Opus snapshots", `Scores at each Opus release since ${shortModel(snaps[0].a.anchor)}, scored for the public frontier of the day.`),
    lg('<span class="dot" style="background:var(--t0)"></span>', "Now", bandHelp("now")),
    lg('<span class="dot" style="background:var(--t1)"></span>', "Next generation", `The Frontier+1 forecast, around ${monthYear(tierDate(1))}.`),
    lg('<span class="dot" style="background:var(--t2)"></span>', "Generation after", `The Frontier+2 forecast, around ${monthYear(tierDate(2))}.`),
    lg('<span class="tick"></span>', "Ceiling", "The most of this task type AI could take with unlimited intelligence."),
  ].join("") + '<span class="note">Hover a track to step through its points.</span>';

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
        <span class="dot-track" ${tipAttr(trackTip(r, hist))} role="img" aria-label="${esc(r.name)}: now ${r.f0}, next generation ${r.f1}, generation after ${r.f2}, ceiling ${r.ceiling}">
          <span class="line"></span>
          <span class="reach" style="left:${r.f0}%;width:${r.f2 - r.f0}%"></span>
          <span class="ceil" data-k="ceil" data-v="${r.ceiling}" style="left:calc(${r.ceiling}% - 1px)"></span>
          ${hist.map((h, i) => `<i class="past" data-k="p${i}" data-v="${h.v}" style="left:${h.v}%"></i>`).join("")}
          <i data-k="f2" data-v="${r.f2}" style="left:${r.f2}%;background:var(--t2)"></i><i data-k="f1" data-v="${r.f1}" style="left:${r.f1}%;background:var(--t1)"></i><i data-k="now" data-v="${r.f0}" style="left:${r.f0}%;background:var(--t0)"></i>
        </span>
        <span class="nums"><b>${r.f0}</b></span>
      </button>
      ${open ? `<div class="dot-detail">
        <div class="kv">${hist.map((h) => `<span>${esc(h.label)} ${h.v}</span>`).join("")}<span>Now ${r.f0}</span><span>F+1 ${r.f1} (${span(r.range.f1)})</span><span>F+2 ${r.f2} (${span(r.range.f2)})</span><span>Ceiling ${r.ceiling}</span><span>${esc(r.confidence)} confidence${edited}</span></div>
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

/* ---------- Value ---------- */

const YEAR = 365.25 * 24 * 3600 * 1000;
const usd = (bn) => (bn >= 1000 ? `$${(bn / 1000).toFixed(2)}T` : `$${bn >= 100 ? r0(bn) : bn.toFixed(bn >= 10 ? 0 : 1)}B`);
const pct1 = (x) => `${x < 10 ? x.toFixed(1) : r0(x)}%`;

// Each lab's reports as { t, v } in date order.
function labSeries(econ) {
  return (econ.labs || []).map((l) => ({ ...l, reports: econ.revenue.filter((r) => r.lab === l.id).map((r) => ({ t: parseDate(r.date).getTime(), v: r.run_rate, r })) }));
}
// Combined revenue (USD billions) where every lab is covered, or null.
function combinedAt(series, t) {
  let sum = 0;
  for (const l of series) { const v = revenueAt(l.reports, t); if (v === null) return null; sum += v; }
  return sum;
}

const PARAMS = ["growth", "peak", "price", "cut"];
const scenarioParams = () => {
  const sc = data.economics?.scenarios || {};
  const x = (state.scenario === "custom" && state.custom) || sc[state.scenario] || sc.base || { growth: 2, peak: 0.75, price: 0.15, cut: 0.6 };
  return Object.fromEntries(PARAMS.map((k) => [k, x[k]]));
};

function renderValue() {
  const econ = data.economics;
  if (!econ) { $("value-lede").textContent = "No revenue data is loaded."; return; }
  // Dollars always weight by wages, whatever the toggle says.
  const vm = state.weight === "wage" ? model : computeModel({ ...data, assessment: live(), weight: "wage", edits: state.edits, horizon: HORIZON });
  const W = vm.totals.wageBill / 1000; // USD billions
  const { proj } = vm.index;
  const today = parseDate(econ.as_of).getTime();
  const series = labSeries(econ);
  const scope = (l) => econ.scope?.[l.id] || { us: 1, work: 1 };
  const latest = (l) => l.reports[l.reports.length - 1].v;
  const rev0 = series.reduce((s, l) => s + latest(l), 0);
  const us0 = series.reduce((s, l) => s + scopedRevenue(latest(l), scope(l)), 0); // labs' revenue from U.S. work
  const mix = us0 / rev0;
  const i0 = proj[0] / 100, doable0 = W * i0;
  const price0 = econ.price.now, cut0 = econ.cut.now;
  const spend0 = us0 / cut0, done0 = spend0 / price0, a0 = done0 / doable0;
  const ad = econ.adoption || {};
  const saved = groupAverage(vm.groups, ad.saved), assisted = groupAverage(vm.groups, ad.assisted);
  const p = scenarioParams();
  const cents = (x) => `${r0(x * 100)}¢`;

  // Capability path: today, then each generation at its date.
  const capPts = [{ t: today, v: proj[0] }, ...Array.from({ length: HORIZON }, (_, i) => ({ t: tierDate(i + 1).getTime(), v: proj[i + 1] }))];
  const end = capPts[capPts.length - 1].t;
  const path = ({ growth, peak, price, cut }) => {
    const out = [];
    for (let t = today; t <= end + 1; t += YEAR / 12) {
      const idx = interpolate(capPts, t) / 100, a = adoptionAt((t - today) / YEAR, { a0, growth, peak });
      const pr = driftAt(a, { a0, peak, from: price0, to: price }), c = driftAt(a, { a0, peak, from: cut0, to: cut });
      const rev = W * idx * a * pr * c;
      out.push({ t, idx, does: idx * a, price: pr, cut: c, rev, all: rev / mix, share: (rev / W) * 100 });
    }
    return out;
  };
  const main = path(p);
  const flat = path({ growth: 1, peak: 1, price: price0, cut: cut0 });
  const sc = econ.scenarios || {};
  const slow = sc.slow ? path(sc.slow) : null, fast = sc.fast ? path(sc.fast) : null;

  // History: each lab's U.S. work revenue where every lab has reports, against the frontier of the day.
  const start = Math.max(...series.map((l) => l.reports[0].t));
  const hist = [];
  for (let t = start; t <= today; t += YEAR / 24) {
    let rev = 0;
    for (const l of series) { const v = revenueAt(l.reports, t); if (v === null) { rev = null; break; } rev += scopedRevenue(v, scope(l)); }
    if (rev === null) continue;
    const snap = snaps.filter((x) => parseDate(x.a.date).getTime() <= t).pop() || snaps[0];
    hist.push({ t, rev, all: rev / mix, idx: snap.m.index.f0 / 100, share: (rev / W) * 100 });
  }
  // Hold the latest reports flat to today so the record meets the projection.
  if (hist.length && hist[hist.length - 1].t < today) hist.push({ t: today, rev: us0, all: rev0, idx: i0, share: (us0 / W) * 100 });
  const year = hist.find((h) => h.t >= today - YEAR);
  const per = year ? YEAR / (today - year.t) : 1;
  const revGrowth = year ? Math.pow(us0 / year.rev, per) : null, capGrowth = year ? Math.pow(i0 / year.idx, per) : null;
  const savedGrowth = ad.saved_year_ago ? (saved * 100) / ad.saved_year_ago : null;

  $("value-lede").textContent = `AI can already do work that U.S. white-collar employers pay ${usd(doable0)} a year in wages for. The frontier labs earn about ${usd(us0)} a year from U.S. work. Customers pay about ${cents(price0)} for AI work per dollar the same work costs in wages, and about ${pct(cut0 * 100)} of that reaches the labs, so AI is doing roughly ${usd(done0)} of that work: ${pct(a0 * 100)} of what it could. Revenue grows as models can do more, as more of that work is handed to them, and as prices and the labs' cut shift.`;

  const card = (label, value, sub, tip) => `<div class="vstat"${tip ? ` tabindex="0" ${tipAttr(tip)}` : ""}><span class="stat-label">${label}</span><span class="vstat-value">${value}</span><span class="stat-sub">${sub}</span></div>`;
  $("value-stats").innerHTML =
    card("Work AI can do", usd(doable0), `${pct(proj[0])} of the ${usd(W)} wage bill, rising to ${usd(W * proj[2] / 100)} by ${monthYear(tierDate(2))}`) +
    card("Work AI does", usd(done0), `${pct(a0 * 100)} of what it can do, ${pct1((done0 / W) * 100)} of the wage bill`,
      { title: "Work AI does", rows: [{ label: "Labs' U.S. work revenue", value: usd(us0) }, { label: "÷ labs' cut", value: pct(cut0 * 100) }, { label: "÷ price per $1 of wages", value: cents(price0) }, { label: "= wages for the work AI does", value: usd(done0) }],
        note: "Implied by revenue, price and cut; the check below compares it with what workers report." }) +
    card("Price of AI work", cents(price0), "per $1 of wages for the same work, from what AI agents charge per task",
      { title: "Price of AI work", note: econ.price.note }) +
    card("Labs' cut", pct(cut0 * 100), `of that spending; the rest goes to apps and services built on the models`,
      { title: "Labs' cut", note: econ.cut.note });

  // Funnel: wage bill -> doable now (and by F+2) -> done -> customer spend -> lab revenue
  const bar = (label, v, sub, extra = 0, cls = "") => `<div class="fn-row"><span class="fn-label">${label}<small>${sub}</small></span><span class="fn-track"><span class="fn-bar ${cls}" style="width:max(3px, ${(v / W) * 100}%)"></span>${extra ? `<span class="fn-bar next" style="width:${(extra / W) * 100}%"></span>` : ""}</span><span class="fn-val">${usd(v)}</span></div>`;
  $("funnel").innerHTML = bar("U.S. white-collar wage bill", W, `${vm.occupations.length} occupations, ${jobs(vm.totals.employment)} jobs (BLS, May 2025)`) +
    bar("Work AI can do now", doable0, `${pct(proj[0])} of the wage bill · lighter: added by ${monthYear(tierDate(2))}`, W * (proj[2] - proj[0]) / 100) +
    bar("Work AI does", done0, `${pct(a0 * 100)} of what it can do, implied by the rows below`) +
    bar("What customers pay for it", spend0, `about ${cents(price0)} per $1 of wages`) +
    bar("Labs' revenue from U.S. work", us0, `${pct(cut0 * 100)} of that spending · ${usd(rev0)} worldwide, all uses`);
  $("funnel-note").textContent = `Bar lengths are to scale. The gap between the second and third bars is work AI could do but isn't doing yet. The last bar counts only the labs' U.S. revenue from work, ${pct(mix * 100)} of their ${usd(rev0)} combined run-rate, so that both ends of the chain cover the same thing.`;

  // Check: implied work against the survey's hours
  const rows = [
    { label: "Hours workers say AI saved them", v: saved, sub: `St. Louis Fed survey, ${esc(ad.label || "")}`, cls: "survey" },
    { label: "Work AI does, implied by revenue", v: done0 / W, sub: "share of the wage bill", cls: "implied" },
    { label: "Hours workers spent working with AI", v: assisted, sub: `St. Louis Fed survey, ${esc(ad.label || "")}`, cls: "survey" },
  ].filter((r) => Number.isFinite(r.v));
  const cmax = Math.max(...rows.map((r) => r.v)) * 1.1;
  $("vcheck").innerHTML = rows.map((r) => `<div class="fn-row"><span class="fn-label">${r.label}<small>${r.sub}</small></span><span class="fn-track"><span class="fn-bar ${r.cls}" style="width:${(r.v / cmax) * 100}%"></span></span><span class="fn-val">${pct1(r.v * 100)}</span></div>`).join("");
  $("vcheck-note").textContent = `Work AI does isn't measured directly, so the figure above is worked out from revenue. Surveys of workers bracket it: AI saves them ${pct1(saved * 100)} of their hours and is part of ${pct1(assisted * 100)} of them, by occupation group weighted by wages. Hours saved miss work agents do with no worker involved, so they are a floor.`;
  $("vcheck-trend").textContent = year
    ? `Past year: the labs' revenue grew ${revGrowth.toFixed(1)}x while the work AI can do grew ${capGrowth.toFixed(1)}x, so at steady prices the work AI does grew about ${(revGrowth / capGrowth).toFixed(1)}x.${savedGrowth ? ` Hours saved in the survey grew ${savedGrowth.toFixed(1)}x over the same year, which suggests most of the growth is work done by agents rather than by people using chat.` : ""}`
    : "";

  // Controls
  const scen = Object.entries(sc).map(([id, x]) => ({ id, label: x.label }));
  $("scen-seg").innerHTML = [...scen, ...(state.scenario === "custom" ? [{ id: "custom", label: "Custom" }] : [])]
    .map((x) => `<button type="button" role="radio" data-value="${x.id}" ${tipAttr({ title: x.label, note: sc[x.id]?.note || "Your own settings." })}>${esc(x.label)}</button>`).join("");
  syncScen = radiogroup($("scen-seg"), () => state.scenario, (v) => { state.scenario = v; state.custom = null; renderValue(); });
  $("growth-in").value = p.growth; $("growth-out").textContent = `${p.growth.toFixed(1)}x`;
  $("peak-in").value = p.peak; $("peak-out").textContent = pct(p.peak * 100);
  $("price-in").value = p.price; $("price-out").textContent = cents(p.price);
  $("cut-in").value = p.cut; $("cut-out").textContent = pct(p.cut * 100);

  // Chart: U.S. work revenue as a share of the wage bill
  const box = $("vchart");
  const Wd = Math.max(320, Math.min(980, box.clientWidth || 980)), narrow = Wd < 640, H = narrow ? 280 : 340;
  const m = { l: 46, r: 14, t: 18, b: 40 };
  const t0 = hist.length ? hist[0].t : today;
  const top = Math.max(...main.map((q) => q.share), ...(fast || []).map((q) => q.share), 1);
  const ymax = top <= 5 ? Math.ceil(top) : Math.ceil(top / 5) * 5;
  const x = (t) => m.l + ((t - t0) / (end - t0)) * (Wd - m.l - m.r);
  const y = (v) => m.t + (1 - v / ymax) * (H - m.t - m.b);
  const line = (pts, k = "share") => pts.map((q, i) => `${i ? "L" : "M"}${x(q.t).toFixed(1)},${y(q[k]).toFixed(1)}`).join("");
  const ticks = Array.from({ length: 6 }, (_, i) => (ymax * i) / 5);
  let svg = `<svg viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Labs' revenue from U.S. white-collar work as a share of the wage bill: ${pct1(hist.length ? hist[0].share : 0)} in ${monthYear(new Date(t0))}, ${pct1((us0 / W) * 100)} now, ${pct1(main[main.length - 1].share)} by ${monthYear(new Date(end))} in the ${esc(sc[state.scenario]?.label || "custom")} scenario">
    <g class="grid">${ticks.map((v) => `<line x1="${m.l}" x2="${Wd - m.r}" y1="${y(v)}" y2="${y(v)}"/>`).join("")}</g>
    ${ticks.map((v) => `<text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${v % 1 ? v.toFixed(1) : v}%</text>`).join("")}
    <line class="axis-base" x1="${m.l}" x2="${Wd - m.r}" y1="${y(0)}" y2="${y(0)}"/>
    <line x1="${x(today)}" x2="${x(today)}" y1="${m.t}" y2="${y(0)}" stroke="var(--rule-strong)"/><text x="${x(today) + 5}" y="${m.t + 10}">Today</text>`;
  for (let d = new Date(Date.UTC(new Date(t0).getUTCFullYear() + 1, 0, 1)); d.getTime() <= end; d = addMonths(d, 12))
    svg += `<line x1="${x(d.getTime())}" x2="${x(d.getTime())}" y1="${y(0)}" y2="${y(0) + 5}" stroke="var(--rule-strong)"/><text x="${x(d.getTime())}" y="${H - m.b + 18}" text-anchor="middle" class="lbl-strong">${narrow ? `'${String(d.getUTCFullYear()).slice(2)}` : d.getUTCFullYear()}</text>`;
  [1, 2].forEach((n) => { const t = tierDate(n).getTime(); svg += `<line x1="${x(t)}" x2="${x(t)}" y1="${y(0)}" y2="${y(0) - 6}" stroke="var(--t${n})" stroke-width="2"/><text x="${x(t)}" y="${y(0) - 10}" text-anchor="middle" class="lbl-strong">F+${n}</text>`; });
  if (slow && fast) svg += `<path d="${line(fast)} L${[...slow].reverse().map((q) => `${x(q.t).toFixed(1)},${y(q.share).toFixed(1)}`).join(" L")} Z" fill="var(--t1)" opacity="0.12"/>`;
  svg += `<path d="${line(flat)}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 5"/>
    <path d="${line(main)}" fill="none" stroke="var(--t1)" stroke-width="2.5"/>
    <path d="${line(hist)}" fill="none" stroke="var(--t0)" stroke-width="2.5"/>`;
  const last = main[main.length - 1];
  if (!narrow) svg += `<text x="${x(last.t) - 4}" y="${y(last.share) - 8}" text-anchor="end" class="lbl-strong">${pct1(last.share)} · ${usd(last.rev)}</text><text x="${x(end) - 4}" y="${y(flat[flat.length - 1].share) - 8}" text-anchor="end">capability only · ${pct1(flat[flat.length - 1].share)}</text>`;
  const tipFor = (q, kind) => ({ title: monthYear(new Date(q.t)), sub: kind,
    rows: [{ label: "Labs' U.S. work revenue", value: usd(q.rev), swatch: kind === "Reported" ? "now" : "f1" }, { label: "Share of the wage bill", value: pct1(q.share) }, { label: "AI can do", value: pct(q.idx * 100) },
      ...(kind === "Reported" ? [] : [{ label: "AI does", value: pct1(q.does * 100) }, { label: "Price per $1", value: cents(q.price) }, { label: "Labs' cut", value: pct(q.cut * 100) }])],
    note: kind === "Reported" ? `Each lab's run-rate, interpolated between its reports and cut to U.S. work at today's mix (${pct(mix * 100)} of revenue).` : `All lab revenue at today's mix: ${usd(q.all)}.` });
  hist.forEach((q, i) => { if (i % 2 === 0 || i === hist.length - 1) svg += `<circle class="hit" cx="${x(q.t)}" cy="${y(q.share)}" r="9" fill="transparent" tabindex="0" ${tipAttr(tipFor(q, "Reported"))}/>`; });
  main.forEach((q, i) => { if (i && i % 3 === 0) svg += `<circle class="hit" cx="${x(q.t)}" cy="${y(q.share)}" r="9" fill="transparent" tabindex="0" ${tipAttr(tipFor(q, `${sc[state.scenario]?.label || "Custom"} scenario`))}/>`; });
  box.innerHTML = svg + "</svg>";
  const lg = (inner, title, note) => `<span class="lg" ${tipAttr({ title, note })}>${inner}${title}</span>`;
  $("vchart-legend").innerHTML = [
    lg('<span class="swatch" style="background:var(--t0)"></span>', "Reported revenue", "The labs' combined run-rate, cut to U.S. work at today's mix."),
    lg('<span class="swatch" style="background:var(--t1)"></span>', `${sc[state.scenario]?.label || "Custom"} scenario`, "Capability follows the model's forecast and trend; adoption follows an S-curve to its peak; price and the labs' cut move to their long-run values as adoption matures."),
    lg('<span class="band"></span>', "Slow to fast range", "Between the slow and fast scenarios."),
    lg('<span class="dot trend"></span>', "Capability only", "Adoption, price and cut held at today's levels: revenue grows only as models can do more of the work."),
  ].join("");
  $("vpath-note").textContent = `Revenue = work AI can do × share of it AI does × price per $1 of wages × labs' cut. Capability follows this site's forecasts (${monthYear(tierDate(1))}, ${monthYear(tierDate(2))}) and trend. Adoption starts at ${pct(a0 * 100)} of the work AI can do, grows ${p.growth.toFixed(1)}x in the first year and slows as it nears ${pct(p.peak * 100)}. Price moves from ${cents(price0)} to ${cents(p.price)} and the labs' cut from ${pct(cut0 * 100)} to ${pct(p.cut * 100)} as adoption approaches its peak. Dollars are in today's terms with the wage bill held at May 2025 levels.`;

  // Table at the forecast dates and two later years
  const at = (pts, t) => pts.reduce((b, q) => (Math.abs(q.t - t) < Math.abs(b.t - t) ? q : b));
  const trows = [["Today", today], [`Frontier+1 · ${monthYear(tierDate(1))}`, tierDate(1).getTime()], [`Frontier+2 · ${monthYear(tierDate(2))}`, tierDate(2).getTime()],
    [monthYear(tierDate(4)), tierDate(4).getTime()], [monthYear(new Date(end)), end]];
  $("value-table").innerHTML = `<thead><tr><th></th><th class="num">AI can do</th><th class="num">AI does</th><th class="num">Price per $1</th><th class="num">Labs' cut</th><th class="num">U.S. work revenue</th><th class="num">All revenue*</th><th class="num">Capability only</th></tr></thead>
    <tbody>${trows.map(([label, t]) => { const q = at(main, t), f = at(flat, t); return `<tr><td>${label}</td><td class="num">${pct(q.idx * 100)}</td><td class="num">${pct1(q.does * 100)}</td><td class="num">${cents(q.price)}</td><td class="num">${pct(q.cut * 100)}</td><td class="num">${usd(q.rev)}</td><td class="num">${usd(q.all)}</td><td class="num">${usd(f.rev)}</td></tr>`; }).join("")}</tbody>
    <tfoot><tr><td colspan="8" class="note">AI can do and AI does are shares of the wage bill. *All lab revenue, worldwide and for every use, at today's mix (U.S. work is ${pct(mix * 100)} of it).</td></tr></tfoot>`;

  // Where the value sits: pay for AI-doable work by group, now and by Frontier+2
  const gs = [...vm.groups].map((g) => ({ g, total: g.weight * W, now: g.weight * W * g.proj[0] / 100, f2: g.weight * W * g.proj[2] / 100 })).sort((p, q) => q.now - p.now);
  const maxT = Math.max(...gs.map((r) => r.total));
  $("vgroups").innerHTML = gs.map(({ g, total, now, f2 }) => {
    const tip = { title: g.name, sub: `${usd(total)} wage bill`, rows: [{ k: "now", label: "AI can do now", value: usd(now), swatch: "now" }, { k: "f2", label: `Added by ${monthYear(tierDate(2))}`, value: usd(f2 - now), swatch: "f2" }, { label: "Rest of the wage bill", value: usd(total - f2), swatch: "human" }] };
    return `<div class="vg-row"><span class="vg-name">${esc(g.name)}</span><span class="stack vg-bar" style="width:${(total / maxT) * 100}%" ${tipAttr(tip)}><div data-band="now" style="flex:0 0 calc(${(now / total) * 100}% - 2px);background:var(--t0)"></div><div data-band="f2" style="flex:0 0 calc(${((f2 - now) / total) * 100}% - 2px);background:var(--t2)"></div><div data-band="human" class="fill-rest" style="flex:1 1 auto"></div></span><span class="vg-val">${usd(now)}</span></div>`;
  }).join("");
  $("vgroups-note").textContent = `Pay for the work AI can do now, by BLS major group (dark), what the next two generations add (light), and the rest of each group's wage bill (grey). Management and business roles hold the most dollars even though clerical jobs score higher, because their pay is higher.`;

  // Data and assumptions
  const src = Object.fromEntries((econ.sources || []).map((x) => [x.id, x]));
  const links = (ids, chips = false) => (ids || []).map((id) => src[id] ? `<a href="${esc(src[id].url)}" target="_blank" rel="noopener">${esc(src[id].title)}</a>${chips ? ` <span class="chip ${esc(src[id].tier || "secondary")}">${esc(src[id].tier || "secondary")}</span>` : ""}` : "").join(chips ? " " : "; ");
  $("vdata-note").textContent = `Annualized revenue run-rates as reported, ${series.map((l) => l.name).join(" and ")}${econ.excluded ? `. Not included: ${econ.excluded}` : ""}. Each lab is interpolated between its reports on a log scale.`;
  $("revenue-table").innerHTML = `<thead><tr><th>Lab</th><th>Date</th><th class="num">Run-rate</th><th>Source</th></tr></thead><tbody>${econ.revenue.map((r) => `<tr><td>${esc(series.find((l) => l.id === r.lab)?.name || r.lab)}</td><td>${monthYear(parseDate(r.date))}</td><td class="num">${usd(r.run_rate)}</td><td>${links(r.sources, true)}${r.note ? `<span class="src-note">${esc(r.note)}</span>` : ""}</td></tr>`).join("")}</tbody>`;
  $("scope-note").textContent = econ.scope_note || "";
  $("scope-table").innerHTML = `<thead><tr><th>Lab</th><th class="num">Run-rate</th><th class="num">U.S. share</th><th class="num">Work share</th><th class="num">U.S. work</th><th>Basis</th></tr></thead><tbody>${series.map((l) => { const s = scope(l); return `<tr><td>${esc(l.name)}</td><td class="num">${usd(latest(l))}</td><td class="num">${pct(s.us * 100)}</td><td class="num">${pct(s.work * 100)}</td><td class="num">${usd(scopedRevenue(latest(l), s))}</td><td>${esc(s.note || "")}<span class="src-note">${links(s.sources)}</span></td></tr>`; }).join("")}</tbody>`;
  const evidence = (k, el) => { $(`${k}-note`).textContent = econ[k].note || ""; $(el).innerHTML = `<thead><tr><th>Evidence</th><th class="num">Ratio</th><th>Source</th></tr></thead><tbody>${(econ[k].evidence || []).map((e) => `<tr><td>${esc(e.what)}</td><td class="num">${e.ratio != null ? (k === "price" ? cents(e.ratio) : pct(e.ratio * 100)) : ""}</td><td>${links(e.sources)}</td></tr>`).join("")}</tbody>`; };
  evidence("price", "price-table"); evidence("cut", "cut-table");
  // Calibration: the base scenario against the labs' own projections (all revenue at today's mix)
  const base = sc.base ? path(sc.base) : main;
  const baseAt = (iso) => at(base, parseDate(iso).getTime());
  $("vproj-note").textContent = `For comparison, the base scenario puts the two labs' total revenue, at today's mix, at ${usd(baseAt("2026-12-31").all)} at the end of 2026, ${usd(baseAt("2028-12-31").all)} at the end of 2028 and ${usd(at(base, end).all)} by ${monthYear(new Date(end))}.`;
  $("projection-table").innerHTML = `<thead><tr><th>Lab</th><th>Projection</th><th>Source</th></tr></thead><tbody>${(econ.projections || []).map((x) => `<tr><td>${esc(x.lab)}</td><td>${esc(x.what)}</td><td>${links(x.sources)}</td></tr>`).join("")}</tbody>`;
  $("value-method").innerHTML = (econ.method || []).map(([h, ps]) => `<div><h3>${esc(h)}</h3>${ps.map((x) => `<p>${esc(x)}</p>`).join("")}</div>`).join("");
}
let syncScen;

/* ---------- Method ---------- */

function renderMethod() {
  const a = live();
  const srcById = Object.fromEntries((a.sources || []).map((x) => [x.id, x]));
  const cite = (id) => {
    const x = srcById[id];
    return x ? `<a class="cite ${esc(x.tier || "secondary")}" href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.title)} (${esc(x.tier || "secondary")})">${esc(x.title.split(",")[0])}</a>` : "";
  };
  const highlight = (h) => typeof h === "string" ? `<li>${esc(h)}</li>` : `<li>${esc(h.text)}${h.sources?.length ? ` <span class="cites">${h.sources.map(cite).join("")}</span>` : ""}</li>`;
  $("snapshots").innerHTML = [...snaps].reverse().map(({ a: s, m }) => `<div class="snap" id="m-${esc(s.id)}">
    <div class="when">${monthYear(parseDate(s.date))}<span>${esc(s.label || "")}</span></div>
    <div class="what">
      <div><b>${esc(s.anchor)}</b><span class="pill">${s.kind === "backfill" ? "Backfilled" : "Live, with forecasts"}</span></div>
      ${s.frontier ? `<span class="frontier">Public frontier at the time: ${esc(s.frontier)}</span>` : ""}
      ${s.peers ? `<span class="note">Peers: ${esc(s.peers)}</span>` : ""}
      ${s.highlights?.length ? `<ul>${s.highlights.map(highlight).join("")}</ul>` : ""}
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
    ["Uncertainty", [`Forecast ranges are ${(a.uncertainty?.f1 ?? 5)} points either side at Frontier+1 and ${(a.uncertainty?.f2 ?? 8)} at Frontier+2 for a task type with medium-confidence evidence, narrower for high and wider for low, and cut off at today's score and at the ceiling. The index range adds the task-type ranges together, which assumes their errors move in the same direction; independent errors would give a narrower band.`]],
    ["Weights", ["Wages weights each occupation by employment times mean wage. People weights by headcount. The headline uses wages."]],
    ["Limits", a.caveats || []],
  ];
  $("method-grid").innerHTML = blocks.filter(([, ps]) => ps.length).map(([h, ps]) => `<div id="m-${h.toLowerCase().replace(/[^a-z]+/g, "-")}"><h3>${h}</h3>${ps.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`).join("")
    + (a.report_url ? `<div><h3>Full report</h3><p>The research report behind these scores has the evidence for every score, the derivation of the closure rates and ceilings, and all citations: <a href="${esc(a.report_url)}" target="_blank" rel="noopener">Frontier models absorb codified desk work first</a>.</p></div>` : "");

  const cal = a.calibration;
  if (cal) {
    const off = new Set(cal.not_comparable || []);
    const rows = model.groups.map((g) => ({ g, ref: cal.values[g.id], off: off.has(g.id) })).filter((r) => typeof r.ref === "number").sort((p, q) => q.g.proj[0] - p.g.proj[0]);
    const gaps = rows.filter((r) => !r.off).map((r) => Math.abs(r.g.proj[0] - r.ref)).sort((p, q) => p - q);
    const median = gaps.length ? (gaps[(gaps.length - 1) >> 1] + gaps[gaps.length >> 1]) / 2 : 0;
    $("calib-note").textContent = `${cal.label}. Site figures are today's score ${weightPhrase()}. Across the ${gaps.length} comparable groups the median gap is ${r0(median)} points, and ${gaps.filter((v) => v <= 10).length} are within 10. ${cal.note || ""}`;
    $("calibration").innerHTML = `<thead><tr><th>BLS major group</th><th class="num">Headroom, now</th><th class="num">ESADE replaceable</th><th class="num">Gap</th></tr></thead>
      <tbody>${rows.map(({ g, ref, off }) => `<tr${off ? ' class="off"' : ""}><td>${esc(g.name)}${off ? ' <span class="note">(not comparable)</span>' : ""}</td><td class="num">${pct(g.proj[0])}</td><td class="num">${ref.toFixed(1)}%</td><td class="num diff">${g.proj[0] - ref >= 0 ? "+" : ""}${r0(g.proj[0] - ref)}</td></tr>`).join("")}</tbody>`;
  }

  const groups = {};
  for (const s of a.sources || []) (groups[s.group || "Sources"] ||= []).push(s);
  // Most sources share one access date: say it once and flag only the exceptions.
  const counts = {};
  for (const s of a.sources || []) if (s.accessed) counts[s.accessed] = (counts[s.accessed] || 0) + 1;
  const usual = Object.entries(counts).sort((p, q) => q[1] - p[1])[0]?.[0];
  $("src-accessed").textContent = usual ? ` Links were checked on ${usual} unless marked otherwise.` : "";
  const li = (s) => {
    const accessed = s.accessed && s.accessed !== usual ? `accessed ${esc(s.accessed)}` : "";
    const note = [s.note && esc(s.note), accessed].filter(Boolean).join(" · ");
    return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><span class="chip ${esc(s.tier || "secondary")}">${esc(s.tier || "secondary")}</span>${note ? `<span class="src-note">${note}</span>` : ""}</li>`;
  };
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
      items.push({ a, n, due, predicted: fm[k], range: fm.range[k], actual });
    }
  }
  $("forecast-check").innerHTML = items.length ? items.map((it) => {
    const got = it.actual?.m.index.f0;
    const diff = it.actual ? got - it.predicted : null;
    const verdict = it.actual
      ? `${pct(got)} measured (${esc(it.actual.a.anchor)}, ${monthYear(parseDate(it.actual.a.date))}): ${got >= it.range[0] && got <= it.range[1] ? "within" : "outside"} the range (${diff >= 0 ? "+" : ""}${r0(diff)})`
      : `due ${monthYear(it.due)}`;
    return `<div class="check"><span>Frontier+${it.n} forecast made ${monthYear(parseDate(it.a.updated || it.a.date))} with ${esc(it.a.anchor)} as the frontier: <b>${pct(it.predicted)} (${span(it.range)})</b> by ${monthYear(it.due)}</span><span class="verdict">${verdict}</span></div>`;
  }).join("") : `<p class="note">No forecast has come due yet.</p>`;
}

/* ---------- Tooltips ---------- */

// One delegated handler serves every [data-tip] element: mouse hover follows the pointer,
// keyboard focus anchors above the element, a tap shows it for a few seconds. Bars, the
// week grid and legends light up the band under the pointer; task tracks light the
// nearest point; timeline points light their marker and a guide line.
let tipEl = null, tipKey, tipTimer;
let armed = null; // a touch target whose first tap showed its tooltip; the next tap follows it

function hlKey(el, e) {
  if (el.classList.contains("dot-track")) {
    if (!e || e.clientX === undefined) return null;
    const box = el.getBoundingClientRect();
    const v = ((e.clientX - box.left) / box.width) * 100;
    let best = null;
    for (const d of el.querySelectorAll("[data-k]")) {
      const dv = Number(d.dataset.v);
      if (!best || Math.abs(dv - v) < Math.abs(best.v - v)) best = { k: d.dataset.k, v: dv };
    }
    return best?.k ?? null;
  }
  return e?.target?.closest?.("[data-band]")?.dataset.band ?? el.dataset.band ?? null;
}

function markHl(el, k, on) {
  if (el.classList.contains("dot-track")) el.querySelectorAll("[data-k]").forEach((d) => d.classList.toggle("hl", on && d.dataset.k === k));
  else if (el.classList.contains("lg")) { if (on && k) document.body.dataset.hlBand = k; else delete document.body.dataset.hlBand; }
  else if (on && k) el.dataset.hl = k; else delete el.dataset.hl;
  if (el.dataset.pt) {
    document.getElementById(el.dataset.pt)?.classList.toggle("active", on);
    const guide = document.getElementById("tl-guide");
    if (guide) { guide.setAttribute("x1", el.dataset.x); guide.setAttribute("x2", el.dataset.x); guide.classList.toggle("on", on); }
  }
}

function renderTip(el, k) {
  let t;
  try { t = JSON.parse(el.dataset.tip); } catch { return false; }
  const notes = [t.help && k ? bandHelp(k) : null, t.note].filter(Boolean);
  $("tooltip").innerHTML = (t.title ? `<div class="tt-title">${esc(t.title)}</div>` : "")
    + (t.sub ? `<div class="tt-sub">${esc(t.sub)}</div>` : "")
    + (t.rows?.length ? `<div class="tt-rows">${t.rows.map((r) => `<div class="tt-row${k && r.k === k ? " hl" : ""}"><span class="swatch ${r.swatch || "none"}"${r.swatch ? "" : ' style="visibility:hidden"'}></span><span>${esc(r.label)}</span><span class="tt-val">${esc(r.value ?? "")}</span></div>`).join("")}</div>` : "")
    + notes.map((n) => `<div class="tt-note">${esc(n)}</div>`).join("");
  return true;
}

function placeTip(e, anchor) {
  const tip = $("tooltip"), r = tip.getBoundingClientRect(), pad = 8;
  let left, top;
  if (anchor) {
    const a = anchor.getBoundingClientRect();
    left = a.left + a.width / 2 - r.width / 2;
    top = a.top - r.height - 10;
    if (top < pad) top = a.bottom + 10;
  } else {
    left = e.clientX + 14;
    top = e.clientY + 18;
    if (left + r.width > innerWidth - pad) left = e.clientX - r.width - 14;
    if (top + r.height > innerHeight - pad) top = e.clientY - r.height - 12;
  }
  tip.style.transform = "";
  tip.style.left = `${Math.max(pad, Math.min(left, innerWidth - r.width - pad))}px`;
  tip.style.top = `${Math.max(pad, top)}px`;
}

function showTip(el, e, anchored) {
  const k = hlKey(el, e);
  if (el !== tipEl || k !== tipKey) {
    if (tipEl) markHl(tipEl, tipKey, false);
    if (!renderTip(el, k)) return;
    tipEl = el; tipKey = k;
    markHl(el, k, true);
  }
  $("tooltip").classList.add("on");
  placeTip(e, anchored ? el : null);
}

function hideTip() {
  clearTimeout(tipTimer);
  $("tooltip").classList.remove("on");
  if (tipEl) markHl(tipEl, tipKey, false);
  tipEl = null; tipKey = undefined;
}

function setupTips() {
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const el = e.target.closest?.("[data-tip]");
    if (el) showTip(el, e, false);
    else if (tipEl && !tipEl.matches(":focus-visible")) hideTip();
  }, { passive: true });
  // Touch pointers "leave" on every lift, so only the mouse leaving the page hides the tooltip.
  document.documentElement.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); });
  // On touch, a tap on a tipped element that does nothing else shows its tooltip for a while;
  // inside links and buttons the tap keeps doing its job instead.
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest?.("[data-tip]");
    if (!el) return hideTip();
    if (e.pointerType === "mouse" || (el.closest("a, button") && !el.matches("a, button"))) return;
    armed = el !== tipEl && el.dataset.href ? el : null;
    showTip(el, e, false);
    clearTimeout(tipTimer);
    tipTimer = setTimeout(hideTip, 5000);
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest?.("[data-tip]");
    if (el && el.matches(":focus-visible")) showTip(el, null, true);
  });
  document.addEventListener("focusout", (e) => { if (e.target === tipEl) hideTip(); });
  window.addEventListener("scroll", hideTip, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideTip();
    const go = e.target.closest?.("[data-href]");
    if (go && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); location.hash = go.dataset.href; }
  });
  document.addEventListener("click", (e) => {
    const go = e.target.closest?.("[data-href]");
    if (!go) return;
    if (armed === go) { armed = null; return; }
    location.hash = go.dataset.href;
  });
}

load().catch((err) => {
  document.querySelector("main").insertAdjacentHTML("afterbegin",
    `<div class="banner">Could not load the data files (${esc(err.message)}). Serve the folder over HTTP, for example with <code>python3 -m http.server</code>, and reload.</div>`);
});
