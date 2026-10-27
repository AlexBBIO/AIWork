import { computeModel, TIERS } from "./model.js";

const $ = (id) => document.getElementById(id);
const HORIZON = 8;
const HOURS = 40;
const VIEWS = ["overview", "jobs", "tasks", "method"];
const fmt = (x, d = 1) => x.toFixed(d);
const pct = (x) => `${Math.round(x)}%`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const jobs = (k) => (k >= 1000 ? `${fmt(k / 1000, k >= 10000 ? 0 : 1)}M` : `${Math.round(k)}k`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d || 1)); };
const monthYear = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const addMonths = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()));

const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const state = {
  view: "overview",
  weight: store.get("headroom.weight", "wage"),
  edits: {},
  search: "",
  sort: "now",
  openGroups: new Set(),
  openOccs: new Set(),
  openArchs: new Set(),
};

let data;      // { taxonomy, occupations, index, assessments }
let model;     // model for the live assessment, with the viewer's edits
let snaps;     // every snapshot, oldest first, with its index

const live = () => data.assessments[data.index.latest];
const tierDate = (n) => addMonths(parseDate(live().date), n * live().cadence_months);
const weightPhrase = () => (state.weight === "wage" ? "measured by share of pay" : "measured by share of working time");

async function load() {
  const get = (p) => fetch(p).then((r) => { if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); });
  const [taxonomy, occupations, index] = await Promise.all([get("data/taxonomy.json"), get("data/occupations.json"), get("data/assessments/index.json")]);
  const list = await Promise.all(index.assessments.map((id) => get(`data/assessments/${id}.json`)));
  data = { taxonomy, occupations, index, assessments: Object.fromEntries(list.map((a) => [a.id, a])) };
  state.edits = store.get(`headroom.edits.${index.latest}`, {});
  setupControls();
  route();
}

/* ---------- Routing and controls ---------- */

function route() {
  const h = location.hash.slice(1);
  state.view = VIEWS.includes(h) ? h : "overview";
  render();
}

function setupControls() {
  window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });
  for (const b of document.querySelectorAll(".seg button")) {
    b.addEventListener("click", () => { state.weight = b.dataset.weight; store.set("headroom.weight", state.weight); render(); });
  }
  $("occ-search").addEventListener("input", (e) => { state.search = e.target.value.trim().toLowerCase(); renderJobs(); });
  $("occ-sort").addEventListener("change", (e) => { state.sort = e.target.value; renderJobs(); });
  const reset = () => { state.edits = {}; store.set(`headroom.edits.${data.index.latest}`, {}); render(); };
  $("reset-edits").addEventListener("click", reset);
  $("reset-edits-top").addEventListener("click", reset);
  window.addEventListener("scroll", hideTip, { passive: true });
}

function render() {
  model = computeModel({ ...data, assessment: live(), weight: state.weight, edits: state.edits, horizon: HORIZON });
  snaps = data.index.assessments
    .map((id) => data.assessments[id])
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => ({ a, m: a.id === data.index.latest ? model : computeModel({ ...data, assessment: a, weight: state.weight, horizon: HORIZON }) }));

  for (const b of document.querySelectorAll(".seg button")) b.setAttribute("aria-checked", String(b.dataset.weight === state.weight));
  for (const a of document.querySelectorAll(".tabs a")) {
    if (a.dataset.view === state.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  }
  for (const v of VIEWS) $(`view-${v}`).hidden = v !== state.view;
  const hasEdits = Object.keys(state.edits).length > 0;
  $("edits-banner").hidden = !hasEdits;
  $("reset-edits").disabled = !hasEdits;
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

function stackBar(proj, limit, { tall = false, scale = 100 } = {}) {
  const b = bands(proj, limit);
  const tip = b.map((x) => `${x.label} ${fmt(x.v)}%`).join("|");
  return `<div class="stack${tall ? " tall" : ""}" style="width:${scale}%" data-tip="Breakdown|${esc(tip)}" aria-hidden="true">${b
    .map((x) => `<div class="${x.cls || ""}" style="flex:0 0 max(0px, calc(${x.v}% - 2px));${x.color ? `background:${x.color}` : ""}"></div>`)
    .join("")}</div>`;
}

function legendHTML(withValues) {
  const b = bands(model.index.proj, model.index.limit);
  return b.map((x) => `<span><span class="swatch ${x.cls === "fill-open" ? "open" : x.cls || ""}" style="${x.color ? `background:${x.color}` : ""}"></span>${x.label}${withValues ? ` <b>${withValues(x)}</b>` : ""}</span>`).join("");
}

const shortModel = (s) => s.replace(/^Claude /, "");

/* ---------- Overview ---------- */

function renderOverview() {
  const a = live();
  const { proj, limit, flatAt } = model.index;
  const first = snaps[0];
  const y1 = monthYear(tierDate(1)), y2 = monthYear(tierDate(2));

  $("lead-eyebrow").textContent = `Updated ${monthYear(parseDate(a.date))} · Frontier model: ${a.anchor}`;
  $("lead-h1").innerHTML = `AI can now do about <em>${pct(proj[0])}</em> of U.S. white-collar work.`;
  $("lead-lede").textContent =
    (snaps.length > 1 ? `That's up from ${pct(first.m.index.f0)} when ${first.a.anchor} was the frontier in ${monthYear(parseDate(first.a.date))}. ` : "") +
    `The next two model generations, expected around ${y1} and ${y2}, take it to about ${pct(proj[1])} and ${pct(proj[2])}. ` +
    `Progress flattens near ${pct(limit)}; the remaining ${pct(100 - limit)} needs a person in the room, a signature, or a relationship. All figures are ${weightPhrase()}.`;

  const stat = (label, color, value, sub) => `<div class="stat">
    <span class="stat-label"><span class="swatch ${color === "open" ? "open" : ""}" style="${color !== "open" ? `background:${color}` : ""}"></span>${label}</span>
    <span class="stat-value">${fmt(value)}<small>%</small></span><span class="stat-sub">${sub}</span></div>`;
  $("readout").innerHTML =
    stat("Now", "var(--t0)", proj[0], `${esc(shortModel(a.anchor))}, ${monthYear(parseDate(a.date))}`) +
    stat("Next generation", "var(--t1)", proj[1], `+${fmt(proj[1] - proj[0])} pts, around ${y1}`) +
    stat("Generation after", "var(--t2)", proj[2], `+${fmt(proj[2] - proj[1])} pts, around ${y2}`) +
    stat("Ceiling", "open", limit, `Gains under 1 pt a generation after ~${tierDate(flatAt - 1).getUTCFullYear()}`);

  renderTimeline();
  renderWeek();

  const ranked = [...model.occupations].sort((p, q) => q.proj[0] - p.proj[0]);
  const item = (o) => `<li><span>${esc(o.title)}<br><span class="sub">${jobs(o.employment)} jobs</span></span><span class="val">${pct(o.proj[0])}</span>${stackBar(o.proj, o.limit)}</li>`;
  $("most").innerHTML = ranked.slice(0, 6).map(item).join("");
  $("least").innerHTML = ranked.slice(-6).reverse().map(item).join("");

  const g = [
    ["var(--t0)", "Frontier", `The best model available on the snapshot date. Today that's ${a.anchor}. Earlier snapshots track each Opus release back to ${first.a.anchor}.`],
    ["var(--t1)", "Next generation and the one after", `Frontier+1 and Frontier+2: the next two major capability steps, about ${a.cadence_months} months apart, roughly two Opus point releases each. These are forecasts.`],
    [null, "Can do", "AI can do the task at the quality of a competent professional, with no more than light review. This measures capability, not whether employers have adopted it."],
    ["open", "Ceiling", "The most of a task AI could ever take, even with unlimited intelligence. Above it sits work that needs physical presence, legal accountability, or a human relationship."],
    [null, "Pay or jobs", "Pay weights each job by its total wages, so the index reads as a share of what employers spend. Jobs weights by headcount, so it reads as a share of people's working time."],
    [null, "Jobs and tasks", `${model.occupations.length} occupations covering ${fmt(model.totals.employment / 1000)}M U.S. jobs (BLS, May 2025), each split into 2 to 6 tasks.`],
  ];
  $("glossary").innerHTML = g.map(([c, t, d]) => `<div><dt>${c ? `<span class="swatch ${c === "open" ? "open" : ""}" style="${c !== "open" ? `background:${c}` : ""}"></span>` : ""}${t}</dt><dd>${esc(d)}</dd></div>`).join("");
  bindTips($("view-overview"));
}

function renderTimeline() {
  const box = $("timeline");
  const { proj, limit, flatAt } = model.index;
  const W = Math.max(440, Math.min(980, box.clientWidth || 980));
  const narrow = W < 640;
  const H = narrow ? 300 : 340;
  const m = { l: 34, r: 14, t: 18, b: 40 };
  const lastGen = Math.min(HORIZON, Math.max(flatAt, 4));
  const past = snaps.map(({ a, m: mm }) => ({ d: parseDate(a.date), v: mm.index.f0, label: shortModel(a.anchor), a }));
  const future = Array.from({ length: lastGen }, (_, i) => ({ n: i + 1, d: tierDate(i + 1), v: proj[i + 1] }));
  const t0 = addMonths(past[0].d, -1).getTime(), t1 = future[future.length - 1].d.getTime();
  const x = (d) => m.l + ((d.getTime() - t0) / (t1 - t0)) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v / 100) * (H - m.t - m.b);
  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.d).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const now = past[past.length - 1];

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of white-collar work AI can do, by date">
    <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--struct)" stroke-width="2"/></pattern></defs>
    <rect x="${m.l}" y="${y(100)}" width="${W - m.l - m.r}" height="${y(limit) - y(100)}" fill="url(#hatch)" opacity="0.4"/>
    <g class="grid">${[0, 25, 50, 75, 100].map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>`).join("")}</g>
    ${[0, 25, 50, 75, 100].map((v) => `<text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    <line class="axis-base" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/>
    <text x="${W - m.r - 4}" y="${y(100) + 14}" text-anchor="end">Needs a person</text>
    <line x1="${m.l}" x2="${W - m.r}" y1="${y(limit)}" y2="${y(limit)}" stroke="var(--ink-2)" stroke-dasharray="4 4"/>
    <text x="${W - m.r - 4}" y="${y(limit) - 6}" text-anchor="end" class="lbl-strong">Ceiling ${fmt(limit)}%</text>
    <line x1="${x(now.d)}" x2="${x(now.d)}" y1="${m.t}" y2="${y(0)}" stroke="var(--rule-strong)"/>
    <text x="${x(now.d) + 5}" y="${y(4)}">Today</text>`;

  // x-axis: one tick per half year
  for (let d = new Date(Date.UTC(parseDate(past[0].a.date).getUTCFullYear(), 0, 1)); d.getTime() <= t1; d = addMonths(d, 6)) {
    if (d.getTime() < t0) continue;
    const yr = d.getUTCMonth() === 0;
    s += `<line x1="${x(d)}" x2="${x(d)}" y1="${y(0)}" y2="${y(0) + 4}" stroke="var(--rule-strong)"/>
      <text x="${x(d)}" y="${H - m.b + 18}" text-anchor="middle" class="${yr ? "lbl-strong" : ""}">${yr ? d.getUTCFullYear() : narrow ? "" : "Jul"}</text>`;
  }

  s += `<path d="${path(future.slice(1))}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 5"/>
    <path d="${path([now, future[0], future[1]])}" fill="none" stroke="var(--t1)" stroke-width="2"/>
    <path d="${path(past)}" fill="none" stroke="var(--t0)" stroke-width="2.5"/>`;

  // Past snapshots: dots plus model labels, alternating above and below to avoid collisions.
  past.forEach((p, i) => {
    const above = i % 2 === 1;
    const ly = above ? y(p.v) - 12 : y(p.v) + 20;
    s += `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="5" fill="var(--t0)" stroke="var(--surface)" stroke-width="2"/>`;
    if (i === past.length - 1) return;
    if (!narrow || i === 0) s += `<text x="${x(p.d)}" y="${ly}" text-anchor="middle" class="lbl-model">${esc(p.label)}</text>`;
  });
  s += `<text x="${x(now.d) - 8}" y="${y(now.v) - 10}" text-anchor="end" class="lbl-strong">${esc(now.label)} ${fmt(now.v)}%</text>`;
  future.forEach((p) => {
    const scored = p.n <= 2;
    s += `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="${scored ? 5 : 3.5}" fill="${scored ? `var(--t${p.n})` : "var(--surface)"}" stroke="${scored ? "var(--surface)" : "var(--muted)"}" stroke-width="2"/>`;
    if (scored) s += `<text x="${x(p.d)}" y="${y(p.v) + 20}" text-anchor="middle" class="lbl-strong">F+${p.n} ${fmt(p.v)}%</text>`;
  });

  // Hover targets
  const pts = [...past.map((p) => ({ ...p, tip: `${p.a.anchor}|${monthYear(p.d)}|AI can do ${fmt(p.v)}%${p.a.kind === "backfill" ? "|Backfilled snapshot" : ""}` })),
    ...future.map((p) => ({ ...p, tip: `Frontier+${p.n}|Around ${monthYear(p.d)}|${fmt(p.v)}%${p.n > 2 ? " (trend projection)" : " (scored forecast)"}` }))];
  pts.forEach((p) => { s += `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="14" fill="transparent" data-tip="${esc(p.tip)}"/>`; });
  box.innerHTML = s + "</svg>";

  $("timeline-note").textContent = `Each dark point is one Opus release, scored for what the frontier could do at the time. Blue points are the next two generations; the dashed line extends each task's trend until gains fall under a point per generation.`;
  $("timeline-legend").innerHTML = `<span><span class="dot" style="background:var(--t0)"></span>Measured snapshots</span>
    <span><span class="dot" style="background:var(--t1)"></span>Forecast, next two generations</span>
    <span><span class="dot" style="border:2px solid var(--muted)"></span>Trend projection</span>
    <span><span class="swatch open"></span>Needs a person</span>`;
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
  const match = (o) => !q || o.title.toLowerCase().includes(q) || o.soc.includes(q);
  const sorters = {
    now: (p, r) => r.proj[0] - p.proj[0],
    jump: (p, r) => (r.proj[2] - r.proj[0]) - (p.proj[2] - p.proj[0]),
    size: (p, r) => r.employment - p.employment,
    title: (p, r) => p.title.localeCompare(r.title),
  };
  const archName = Object.fromEntries(model.archetypes.map((a) => [a.id, a.name]));
  const groups = [...model.groups].sort((a, b) => b.weight - a.weight);

  const html = groups.map((g) => {
    const members = model.occupations.filter((o) => o.group === g.id && match(o)).sort(sorters[state.sort]);
    if (!members.length) return "";
    const open = q ? true : state.openGroups.has(g.id);
    const all = model.occupations.filter((o) => o.group === g.id);
    const glimit = all.reduce((s, o) => s + o.weight * o.limit, 0) / all.reduce((s, o) => s + o.weight, 0);
    return `<div class="group">
      <button type="button" class="row-btn" data-group="${g.id}" aria-expanded="${open}">
        <span class="chev">▶</span>
        <span class="title">${esc(g.name)}<span class="meta">${jobs(g.employment)} jobs · ${fmt(g.weight * 100)}% of ${state.weight === "wage" ? "pay" : "jobs"} · ${all.length} occupations</span></span>
        ${stackBar(g.proj, glimit, { tall: true })}
        <span class="nums"><b>${pct(g.proj[0])}</b> now → ${pct(g.proj[2])}</span>
      </button>
      ${open ? `<div class="occ-list">${members.map((o) => occRow(o, archName)).join("")}</div>` : ""}
    </div>`;
  }).join("");
  $("groups").innerHTML = html || `<p class="note">No jobs match "${esc(q)}". Try a shorter word or a SOC code like 13-2011.</p>`;

  $("groups").querySelectorAll("[data-group]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.group;
    if (state.search) return;
    state.openGroups.has(id) ? state.openGroups.delete(id) : state.openGroups.add(id);
    renderJobs();
    document.querySelector(`[data-group="${id}"]`)?.focus();
  }));
  $("groups").querySelectorAll("[data-occ]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.occ;
    state.openOccs.has(id) ? state.openOccs.delete(id) : state.openOccs.add(id);
    renderJobs();
    document.querySelector(`[data-occ="${id}"]`)?.focus();
  }));
  bindTips($("groups"));
}

function occRow(o, archName) {
  const open = state.openOccs.has(o.id);
  const maxShare = Math.max(...o.tasks.map((t) => t.share));
  return `<div class="occ">
    <button type="button" class="row-btn" data-occ="${o.id}" aria-expanded="${open}">
      <span class="chev">▶</span>
      <span class="title">${esc(o.title)}<span class="meta"><span class="mono">${o.soc}</span> · ${jobs(o.employment)} jobs · $${o.wage}k mean pay</span></span>
      ${stackBar(o.proj, o.limit)}
      <span class="nums"><b>${pct(o.proj[0])}</b> now → ${pct(o.proj[2])}</span>
    </button>
    ${open ? `<div class="occ-detail">
      <p class="note">In a 40-hour week, AI could handle about <b>${fmt((o.proj[0] / 100) * HOURS)} hours</b> of this job today and ${fmt((o.proj[2] / 100) * HOURS)} hours two generations from now. About ${fmt(((100 - o.limit) / 100) * HOURS)} hours need a person regardless.</p>
      ${o.tasks.map((t) => `<div class="task-row">
        <span class="tname">${esc(t.name)}<span class="ttype">${esc(archName[t.arch])}</span></span>
        ${stackBar(t.proj, t.limit, { scale: (t.share / maxShare) * 100 })}
        <span class="hrs">${fmt((t.share / 100) * HOURS)}h · ${pct(t.proj[0])}</span>
      </div>`).join("")}
    </div>` : ""}
  </div>`;
}

/* ---------- Tasks ---------- */

function renderTasks() {
  const a = live();
  const pastSnaps = snaps.filter((s) => s.a.id !== a.id);
  const rows = [...model.archetypes].sort((p, q) => q.f0 - p.f0);
  $("dots-legend").innerHTML = `<span><span class="dot" style="background:var(--past)"></span>Earlier Opus snapshots</span>
    <span><span class="dot" style="background:var(--t0)"></span>Now</span>
    <span><span class="dot" style="background:var(--t1)"></span>Next generation</span>
    <span><span class="dot" style="background:var(--t2)"></span>Generation after</span>
    <span><span class="tick"></span>Ceiling</span>`;

  const scale = `<div class="dot-scale" aria-hidden="true"><span class="spacer"></span><span class="spacer">Task type</span><span class="ticks"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></span><span>Now</span></div>`;
  $("dots").innerHTML = scale + rows.map((r) => {
    const open = state.openArchs.has(r.id);
    const hist = pastSnaps.map((s) => ({ v: s.a.scores[r.id]?.f0, label: shortModel(s.a.anchor) })).filter((h) => typeof h.v === "number");
    const evidence = a.evidence?.[r.id];
    return `<div class="dot-row">
      <button type="button" class="row-btn" data-arch="${r.id}" aria-expanded="${open}">
        <span class="chev">▶</span>
        <span class="title">${esc(r.name)}<span class="meta">${r.share < 0.001 ? "under 0.1" : fmt(r.share * 100)}% of all work</span></span>
        <span class="dot-track" data-tip="${esc(`${r.name}|${hist.map((h) => `${h.label} ${h.v}`).join("|")}${hist.length ? "|" : ""}Now ${r.f0} · F+1 ${r.f1} · F+2 ${r.f2}|Ceiling ${r.ceiling}`)}">
          <span class="line"></span>
          <span class="reach" style="left:${r.f0}%;width:${r.f2 - r.f0}%"></span>
          <span class="ceil" style="left:calc(${r.ceiling}% - 1px)"></span>
          ${hist.map((h) => `<i class="past" style="left:${h.v}%"></i>`).join("")}
          <i style="left:${r.f2}%;background:var(--t2)"></i><i style="left:${r.f1}%;background:var(--t1)"></i><i style="left:${r.f0}%;background:var(--t0)"></i>
        </span>
        <span class="nums"><b>${r.f0}</b></span>
      </button>
      ${open ? `<div class="dot-detail">
        <div class="kv">${hist.map((h) => `<span>${esc(h.label)} ${h.v}</span>`).join("")}<span>Now ${r.f0}</span><span>F+1 ${r.f1}</span><span>F+2 ${r.f2}</span><span>Ceiling ${r.ceiling}</span><span>Limit ${fmt(r.limit)} (${r.bound === "intelligence" ? "trend flattens first" : "set by ceiling"})</span></div>
        ${evidence ? `<p>${esc(evidence)}</p>` : `<p class="note">No evidence note for this task type yet.</p>`}
      </div>` : ""}
    </div>`;
  }).join("");
  $("dots").querySelectorAll("[data-arch]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.arch;
    state.openArchs.has(id) ? state.openArchs.delete(id) : state.openArchs.add(id);
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
  const input = (a, k) => {
    const edited = state.edits[a.id]?.[k] !== undefined;
    return `<input type="number" id="edit-${a.id}-${k}" min="0" max="100" step="1" value="${a[k]}" data-arch="${a.id}" data-k="${k}" class="${edited ? "edited" : ""}" aria-label="${esc(a.name)} ${label[k]}" title="Published: ${published[a.id][k]}">`;
  };
  $("arch-table").innerHTML = `<thead><tr><th>Task type</th><th class="num">Share of work</th>${[...TIERS, "ceiling"].map((k) => `<th class="num">${label[k]}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((a) => `<tr><td>${esc(a.name)}</td><td class="num">${fmt(a.share * 100)}%</td>${[...TIERS, "ceiling"].map((k) => `<td class="num">${input(a, k)}</td>`).join("")}</tr>`).join("")}</tbody>`;
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
    <div class="when">${monthYear(parseDate(s.date))}<span>${esc(s.label || s.id)}</span></div>
    <div class="what">
      <div><b>${esc(s.anchor)}</b><span class="pill">${s.kind === "backfill" ? "Backfilled" : "Live, with forecasts"}</span></div>
      ${s.peers ? `<span class="note">Peers: ${esc(s.peers)}</span>` : ""}
      ${s.highlights?.length ? `<ul>${s.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    </div>
    <div class="score">${fmt(m.index.f0)}%<small>AI can do</small></div>
  </div>`).join("");

  const blocks = [
    ["What's measured", [a.definition]],
    ["Structure", [`${model.occupations.length} occupations from BLS OEWS (${data.occupations.reference || "May 2025"}) are split into tasks with a share of working time. Each task maps to one of ${model.archetypes.length} task types, and each task type is scored 0 to 100 at every snapshot.`]],
    ["Snapshots and forecasts", [`Each Opus release since ${snaps[0].a.anchor} is a snapshot that scores only what that frontier could do. The live snapshot also forecasts the next two generations, about ${a.cadence_months} months apart.`, "When a forecast date arrives, the new snapshot shows whether the forecast was right."]],
    ["Ceiling and saturation", ["Each task type has a ceiling: the most AI could take even with unlimited intelligence, given physical presence, legal sign-off and human preference.", "Past Frontier+2, each task type's gap to the lower of its ceiling and its own flattening trend shrinks by the ratio implied by its last step. The saturation point is the first generation that adds under one point overall."]],
    ["Weights", ["Pay weights each occupation by employment times mean wage. Jobs weights by headcount."]],
    ["Limits", a.caveats || []],
  ];
  $("method-grid").innerHTML = blocks.filter(([, ps]) => ps.length).map(([h, ps]) => `<div><h3>${h}</h3>${ps.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`).join("");
  const sources = a.sources || [];
  $("sources").innerHTML = sources.length
    ? sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>${s.note ? ` · ${esc(s.note)}` : ""}</li>`).join("")
    : `<li>${esc(data.occupations.source)}</li>`;
}

/* ---------- Tooltip ---------- */

function hideTip() { $("tooltip").hidden = true; }

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
    el.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") show(el, e); });
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); });
  });
}

window.addEventListener("resize", () => { if (data && state.view === "overview") renderTimeline(); });

load().catch((err) => {
  document.querySelector("main").insertAdjacentHTML("afterbegin",
    `<div class="banner">Could not load the data files (${esc(err.message)}). Serve the folder over HTTP, for example with <code>python3 -m http.server</code>, and reload.</div>`);
});
