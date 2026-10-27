import {
  compute,
  cleanEdits,
  cleanMixes,
  validateBundle,
  periodDate,
  KINDS,
} from "./model.js";
const $ = (id) => document.getElementById(id);
const esc = (x) =>
  String(x).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pct = (x) => `${x.toFixed(1)}%`,
  round = (x) => `${Math.round(x)}%`,
  num = (x) => x.toLocaleString("en-US", { maximumFractionDigits: 1 });
const date = (s) =>
  new Date(s + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
const count = (k) => (k >= 1000 ? `${num(k / 1000)}M` : `${num(k)}k`);
const names = {
  physical: "Physical execution",
  regulation: "Regulation & accountability",
  preference: "Human preference",
};
const views = ["overview", "jobs", "tasks", "constraints", "method"];
const store = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};
let data, model, baseline, key;
const state = {
  view: "overview",
  target: "",
  weight: "wage",
  edits: {},
  mixes: {},
  search: "",
  group: "all",
  sort: "now",
  layout: "ranked",
  taskSort: "share",
  filter: "all",
  horizon: 4,
};
const current = () => data.assessments[data.index.latest];
const term = () =>
  state.weight === "wage" ? "pay-weighted" : "worker-weighted";
const weightControl = () =>
  `<label class="control mobile-weight" style="margin-bottom:20px;max-width:210px">Weight the index by<select id="mobile-weight"><option value="wage" ${state.weight === "wage" ? "selected" : ""}>Pay</option><option value="employment" ${state.weight === "employment" ? "selected" : ""}>Workers</option></select></label>`;
function route() {
  const [v, id] = location.hash.slice(1).split("/");
  state.view = views.includes(v) ? v : "overview";
  state.target = id || "";
  render();
}
function params() {
  const u = new URL(location.href);
  u.searchParams.set("w", state.weight);
  if (Object.keys(state.edits).length || Object.keys(state.mixes).length)
    u.searchParams.set(
      "e",
      btoa(
        JSON.stringify({
          version: 1,
          assessment: data.index.latest,
          edits: state.edits,
          mixes: state.mixes,
        }),
      ),
    );
  else u.searchParams.delete("e");
  return u;
}
function persist() {
  store.set(key, { edits: state.edits, mixes: state.mixes });
  store.set("astra:weight", state.weight);
  history.replaceState(null, "", params());
}
function recompute() {
  model = compute(data, state.weight, state.edits, 8, state.mixes);
  baseline = compute(data, state.weight);
}
function render(focus) {
  recompute();
  document.querySelectorAll("[data-view]").forEach((a) => {
    if (a.dataset.view === state.view) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document
    .querySelectorAll("input[name=weight]")
    .forEach((e) => (e.checked = e.value === state.weight));
  const custom =
    Object.keys(state.edits).length + Object.keys(state.mixes).length;
  $("scenario").hidden = !custom;
  $("scenario-summary").textContent =
    `Now ${pct(model.proj[0])} · ${date(data.config.forecast_dates[1])} ${pct(model.proj[2])} · ${custom} changed assumption set${custom === 1 ? "" : "s"}`;
  const content = { overview, jobs, tasks, constraints, method }[state.view]();
  $("content").innerHTML = weightControl() + content;
  bindContent();
  if (focus) $(focus)?.focus();
}
function bars(proj) {
  return `<div class="stack" aria-hidden="true"><span class="now" style="width:${proj[0]}%"></span><span class="next" style="width:${proj[1] - proj[0]}%"></span><span class="later" style="width:${proj[2] - proj[1]}%"></span></div>`;
}
function legend() {
  return `<div class="legend"><span><i class="swatch"></i>Current estimate</span><span><i class="swatch next"></i>Added by ${date(data.config.forecast_dates[0])}</span><span><i class="swatch later"></i>Added by ${date(data.config.forecast_dates[1])}</span><span><i class="swatch rest"></i>Beyond this forecast</span></div>`;
}
const sourceLink = (s) =>
  `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} →</a>`;
function sources(ids) {
  return `<ol class="citations">${ids
    .map((id) => {
      const s = current().sources.find((s) => s.id === id);
      if (!s) return "";
      const review = data.config.source_reviews[id];
      return `<li>${sourceLink(s)}<p>${esc(s.tier === "secondary" ? "Secondary reporting" : s.tier === "independent" ? "Independent evaluator" : "Primary source")}${review ? " · Checked Oct 27, 2026" : ""}</p>${review ? `<p>${esc(review)}</p>` : ""}</li>`;
    })
    .join("")}</ol>`;
}
function overview() {
  const m = model,
    rank = [...m.occupations].sort((a, b) => b.proj[0] - a.proj[0]);
  const ranked = (os) =>
    `<ol class="ranking">${os.map((o) => `<li><a href="#jobs/${o.id}"><span>${esc(o.title)}<br><small>${count(o.employment)} payroll jobs</small></span><strong>${round(o.proj[0])} <span aria-hidden="true">→</span></strong>${bars(o.proj)}</a></li>`).join("")}</ol>`;
  const hourVals = [
      m.proj[0],
      m.proj[1] - m.proj[0],
      m.proj[2] - m.proj[1],
      100 - m.proj[2],
    ].map((v) => v * 0.4),
    hrs = hourVals.map(Math.floor);
  let left = 40 - hrs.reduce((a, b) => a + b, 0);
  hourVals
    .map((v, i) => ({ i, r: v % 1 }))
    .sort((a, b) => b.r - a.r)
    .forEach(({ i }) => {
      if (left-- > 0) hrs[i]++;
    });
  return `<div class="hero"><div><p class="eyebrow">The work model · ${date(data.config.as_of)}</p><h1>How much work<br>can AI do?</h1><div class="hero-score"><span class="metric">${Math.round(m.proj[0])}<small>%</small></span><p>of the work in our ${term()} basket could be done by frontier AI today.</p></div><p class="hero-note">A task-by-task estimate at competent-professional quality, with light review. Explore what makes up the number—and what could change it.</p><div class="scope"><span><b>98</b>occupation groups</span><span><b>${num(m.totalEmployment / 1000)} million</b>payroll jobs covered</span><span><b>${state.weight === "wage" ? "Pay" : "Workers"}</b>index weighting · <a href="#method">explained</a></span></div></div>
 <aside class="hero-panel card"><p class="eyebrow">If the modeled pace continues</p><h2>The next twelve months</h2>${[1, 2].map((n) => `<div class="forecast-line"><div><strong>${date(data.config.forecast_dates[n - 1])}</strong><small>+${(m.proj[n] - m.proj[0]).toFixed(1)} points from today</small></div><span class="metric">${round(m.proj[n])}</span></div>`).join("")}<p class="panel-note">These are dated forecasts for today’s basket of work. Each task’s progress rate and scenario cap are explicit, adjustable assumptions.</p><p style="margin-top:12px"><a href="#tasks">Inspect the assumptions →</a></p></aside></div>
 <div class="search-callout"><div><h2>What does this mean for your work?</h2><p>Find an occupation. Look inside its working week.</p></div><form id="hero-search"><label class="sr" for="hero-query">Find your occupation</label><input id="hero-query" type="search" placeholder="Try software engineer or teacher"><button class="button" type="submit">Explore</button></form></div>
 <section class="section card"><div class="section-head"><div><p class="kicker">The path</p><h2>From past estimates to future scenarios</h2><p class="note">Historical scores are retrospective estimates. The future path holds today’s task mix and scenario caps fixed.</p></div><label class="control forecast-controls">Show through<select id="horizon"><option value="4" ${state.horizon === 4 ? "selected" : ""}>Oct 2028</option><option value="8" ${state.horizon === 8 ? "selected" : ""}>Oct 2030</option></select></label></div>${timeline()}<div class="legend"><span><i class="swatch"></i>Retrospective estimate</span><span><i class="swatch next"></i>6- and 12-month forecast</span><span><i class="swatch projection"></i>Conditional extrapolation</span></div><p class="note">${state.horizon === 8 ? "Progress below one point per six months is a reporting threshold, not an end to AI progress. " : ""}Physical capabilities, rules and preferences may change the path. <a href="#constraints">Explore the constraints →</a></p></section>
 <section class="section"><div class="section-head"><div><p class="kicker">Put it in context</p><h2>A 40-hour illustration</h2></div><a class="micro-link" href="#method">What these hours mean →</a></div><div class="card"><p class="note">Applied to a 40-hour equivalent of the ${term()} basket: about <strong>${hrs[0]} hours</strong> of task coverage now, and <strong>${hrs[0] + hrs[1] + hrs[2]} hours</strong> by ${date(data.config.forecast_dates[1])}. This is task coverage before review and coordination costs; it is not measured time saved.</p><div class="week" role="img" aria-label="${hrs[0]} hours now, ${hrs[1]} additional by April 2027, ${hrs[2]} additional by October 2027, ${hrs[3]} beyond this forecast">${hrs.map((h, i) => Array.from({ length: h }, () => `<i class="${["now", "next", "later", "rest"][i]}"></i>`).join("")).join("")}</div>${legend()}<p class="note">The unfilled work is outside this forecast. It is not classified as permanently human.</p></div></section>
 <section class="section"><div class="section-head"><div><p class="kicker">The differences beneath the average</p><h2>Similar tools. Very different jobs.</h2></div><a href="#jobs" class="micro-link">All occupations →</a></div><div class="grid2"><div class="card"><h3>More task coverage today</h3>${ranked(rank.slice(0, 5))}</div><div class="card"><h3>Less task coverage today</h3>${ranked(rank.slice(-5).reverse())}</div></div></section>
 <section class="section card"><p class="kicker">What could change the path?</p><h2>Three constraints. Different timelines.</h2><p class="note" style="margin-top:10px">Robotics can change physical execution. Regulation can change permission. People can change what they want a human to do. We distinguish these mechanisms without assigning unsupported percentages to each.</p><div class="constraint-list">${KINDS.map((k) => `<a href="#constraints/${k}">${names[k]} →</a>`).join("")}</div></section>`;
}
function timeline() {
  const W =
      window.innerWidth < 760 ? Math.max(260, window.innerWidth - 76) : 920,
    H = window.innerWidth < 760 ? 260 : 300,
    pad = { l: 38, r: 25, t: 22, b: 40 },
    start = Date.parse(model.history[0].date) - 25 * 864e5,
    end = Date.parse(periodDate(data.config.as_of, state.horizon));
  const x = (d) =>
      pad.l + ((Date.parse(d) - start) / (end - start)) * (W - pad.l - pad.r),
    y = (v) => H - pad.b - (v / 100) * (H - pad.b - pad.t),
    path = (ps) =>
      ps
        .map(
          (p, i) =>
            `${i ? "L" : "M"}${x(p.date).toFixed(2)},${y(p.value).toFixed(2)}`,
        )
        .join(" ");
  const historical = model.history.map((p) => ({
    ...p,
    label: `${date(p.date)} · ${p.model} · ${pct(p.value)} · retrospective estimate`,
  }));
  const today = {
    date: data.config.as_of,
    value: model.proj[0],
    label: `${date(data.config.as_of)} · current scenario ${pct(model.proj[0])}`,
  };
  const future = Array.from({ length: state.horizon }, (_, i) => ({
    date: periodDate(data.config.as_of, i + 1),
    value: model.proj[i + 1],
    label: `${date(periodDate(data.config.as_of, i + 1))} · ${pct(model.proj[i + 1])} · ${i < 2 ? "forecast" : "conditional extrapolation"}`,
  }));
  const pts = [...historical, ...future];
  if (Object.keys(state.edits).length || Object.keys(state.mixes).length)
    pts.push(today);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="group" aria-label="AI task coverage over time. Exact values are available in the data table below.">${[0, 25, 50, 75, 100].map((v) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pad.l - 9}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`).join("")}<line x1="${x(data.config.as_of)}" x2="${x(data.config.as_of)}" y1="${pad.t}" y2="${H - pad.b}" stroke="var(--muted)" stroke-dasharray="3 5"/><text x="${x(data.config.as_of) + 7}" y="20">Assessment date</text><path d="${path(historical)}" fill="none" stroke="var(--now)" stroke-width="3"/><path d="${path([today, ...future.slice(0, 2)])}" fill="none" stroke="var(--next)" stroke-width="3"/><path d="${path(future.slice(1))}" fill="none" stroke="var(--next)" stroke-width="2" stroke-dasharray="6 5"/>${pts.map((p, i) => `<circle cx="${x(p.date)}" cy="${y(p.value)}" r="${i < historical.length ? 5 : 6}" fill="${i < historical.length ? "var(--now)" : "var(--surface)"}" stroke="var(--now)" stroke-width="2" tabindex="0" data-point="${esc(p.label)}" role="button" aria-label="${esc(p.label)}"><title>${esc(p.label)}</title></circle>`).join("")}${[historical[0], today, ...future.filter((_, i) => i === 1 || i === state.horizon - 1)].map((p) => `<text class="value" x="${x(p.date)}" y="${y(p.value) - 15}" text-anchor="middle">${round(p.value)}</text>`).join("")}${[historical[0], today, ...future.filter((_, i) => i === 1 || i === state.horizon - 1)].map((p) => `<text x="${x(p.date)}" y="${H - 10}" text-anchor="${p === historical[0] ? "start" : "middle"}">${date(p.date)}</text>`).join("")}</svg><div id="chart-detail" class="chart-tooltip" role="status">Select or focus a point for its date and value.</div><details><summary>View chart data</summary><div class="table-scroll"><table><thead><tr><th>Date</th><th>Interpretation</th><th class="number">Coverage</th></tr></thead><tbody>${historical.map((p) => `<tr><td>${date(p.date)}</td><td>Retrospective · ${esc(p.model)}</td><td class="number">${pct(p.value)}</td></tr>`).join("")}${Object.keys(state.edits).length || Object.keys(state.mixes).length ? `<tr><td>${date(today.date)}</td><td>Your current scenario</td><td class="number">${pct(today.value)}</td></tr>` : ""}${future.map((p, i) => `<tr><td>${date(p.date)}</td><td>${i < 2 ? "Forecast" : "Conditional extrapolation"}</td><td class="number">${pct(p.value)}</td></tr>`).join("")}</tbody></table></div></details>`;
}
function jobs() {
  if (state.target) {
    const o = model.occupations.find((o) => o.id === state.target);
    return o ? occupation(o) : missing("occupation", "jobs");
  }
  return `<p class="eyebrow">Inside the index</p><h1 class="section-title">Find the work<br>behind the number.</h1><p class="lede">Explore 98 occupations, their task mix and the path from today to ${date(data.config.forecast_dates[1])}.</p><div class="filters"><label class="control grow">Search occupations<input id="job-search" type="search" value="${esc(state.search)}" placeholder="Title, synonym or SOC code"></label><label class="control">Sector<select id="job-group"><option value="all">All sectors</option>${data.occupations.groups.map((g) => `<option value="${g.id}" ${state.group === g.id ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select></label><label class="control">Sort by<select id="job-sort">${[
    ["now", "Current coverage"],
    ["gain", "Forecast gain"],
    ["size", "Employment"],
    ["name", "Name"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}" ${state.sort === v ? "selected" : ""}>${l}</option>`,
    )
    .join(
      "",
    )}</select></label><label class="control">View<select id="job-layout"><option value="ranked" ${state.layout === "ranked" ? "selected" : ""}>One ranked list</option><option value="grouped" ${state.layout === "grouped" ? "selected" : ""}>Grouped by sector</option></select></label></div>${legend()}<div id="job-results">${jobResults()}</div>`;
}
function jobResults() {
  const q = state.search.toLowerCase().trim(),
    groupName = (id) => data.occupations.groups.find((g) => g.id === id)?.name;
  let os = model.occupations.filter(
    (o) =>
      (state.group === "all" || o.group === state.group) &&
      [
        o.title,
        ...o.codes,
        ...(data.config.aliases[o.id] || []),
        groupName(o.group),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
  );
  const sorts = {
    now: (a, b) => b.proj[0] - a.proj[0],
    gain: (a, b) => b.proj[2] - b.proj[0] - (a.proj[2] - a.proj[0]),
    size: (a, b) => b.employment - a.employment,
    name: (a, b) => a.title.localeCompare(b.title),
  };
  os.sort(sorts[state.sort]);
  if (!os.length)
    return `<p class="empty">No occupations match “${esc(state.search)}”. Try a broader title or clear the sector filter.</p>`;
  const row = (o) =>
    `<a class="result-row" href="#jobs/${o.id}"><div><h3>${esc(o.title)}</h3><p>${count(o.employment)} jobs · ${esc(groupName(o.group))}</p></div>${bars(o.proj)}<div class="numbers"><span>${round(o.proj[0])}</span><span>${round(o.proj[2])}</span></div></a>`;
  const heading = `<div class="list-head"><span>Occupation</span><span class="bar-title">Task coverage</span><div class="numbers"><span>Now</span><span>Oct ’27</span></div></div>`;
  return `<p class="note" role="status">${os.length} matching occupations · ${state.layout === "ranked" ? "Sorted across all results" : "Sorted within each sector"}</p>${
    state.layout === "ranked"
      ? heading + os.map(row).join("")
      : data.occupations.groups
          .map((g) => {
            const members = os.filter((o) => o.group === g.id);
            return members.length
              ? `<div class="group-label"><h3>${esc(g.name)}</h3><span>${members.length} matching occupations</span></div>${heading}${members.map(row).join("")}`
              : "";
          })
          .join("")
  }`;
}
function occupation(o) {
  const base = baseline.occupations.find((x) => x.id === o.id);
  const b = data.bls.rows.find((x) => x.occupation === o.id);
  return `<a class="back" href="#jobs">← All occupations</a><div class="detail-head"><div><p class="eyebrow">${esc(data.occupations.groups.find((g) => g.id === o.group).name)}</p><h1 style="margin-top:12px">${esc(o.title)}</h1></div><div class="detail-score">${round(o.proj[0])}<small>task coverage now</small></div></div><div class="scope-list"><span>${count(o.employment)} payroll jobs</span><span>$${num(o.wage)}k mean annual pay</span><span>${(o.weight * 100).toFixed(1)}% of the ${term()} basket</span></div><div class="summary-stats"><div><b>${(o.proj[0] * 0.4).toFixed(1)}h</b><span>Current coverage / 40-hour equivalent</span></div><div><b>${(o.proj[2] * 0.4).toFixed(1)}h</b><span>Forecast coverage / ${date(data.config.forecast_dates[1])}</span></div><div><b>+${(o.proj[2] - o.proj[0]).toFixed(1)} pts</b><span>Forecast change over twelve months</span></div></div><p class="note">Hours illustrate task coverage before review and coordination costs. The mix below is an authored estimate, not a BLS time-use measurement.</p><section class="section card"><h2>What fills the working week?</h2>${legend()}<div class="task-row head"><span>Task / capability type</span><span class="number">Week</span><span class="number">Now</span><span class="number future">Oct ’27</span></div>${o.tasks.map((t) => `<div class="task-row"><div><a href="#tasks/${t.id}">${esc(t.name)} →</a><p class="note">${esc(model.byId[t.id].name)}</p>${bars(t.proj)}</div><div class="number">${(t.share * 0.4).toFixed(1)}h<br><span class="note">${num(t.share)}%</span></div><div class="number">${round(t.proj[0])}</div><div class="number future">${round(t.proj[2])}</div></div>`).join("")}</section>
 <section class="section grid2"><div class="card"><h3>Check the task mix</h3><p class="note">These allocations describe a typical mix assumed for this occupation group. Changing them changes the estimate even when AI capability stays the same.</p>${o.id === "legal_other" ? '<p class="note">This group combines judicial and legal-support roles. Its current allocation applies one mix to both; that simplification needs occupation-specific time evidence.</p>' : ""}<details><summary>Adjust this occupation’s time allocation</summary><form id="mix-form" data-occ="${o.id}"><div class="edit-grid">${o.tasks.map((t, i) => `<label>${esc(t.name)} (%)<input type="number" name="mix-${i}" value="${t.share}" min="0" max="100" step="1" required></label>`).join("")}</div><p id="mix-error" class="editor-error" role="status"></p><div class="actions" style="margin-top:15px"><button class="button">Apply mix</button><button type="button" class="button quiet" id="reset-mix" data-occ="${o.id}">Reset mix</button></div></form></details><p class="frozen">Published mix: ${pct(base.proj[0])} now → ${pct(base.proj[2])} in Oct 2027.</p></div><div class="card"><h3>Population and source</h3><p class="note">BLS OEWS, May 2025. Employee jobs only; self-employed workers are excluded. Combined groups use employment-weighted mean wages.</p><p class="note">Constituent SOC codes: ${o.codes.map(esc).join(", ")}.</p><p class="note">${b ? `${num(b.employment)} jobs and $${num(b.annualMeanWage)} mean annual pay before display rounding. Reconciled to the official workbook on October 27, 2026.` : ""}</p><a class="micro-link" href="${esc(data.bls.source)}">Download the BLS source workbook →</a></div></section>`;
}
function tasks() {
  if (state.target) {
    const t = model.byId[state.target];
    return t ? task(t) : missing("task type", "tasks");
  }
  return `<p class="eyebrow">The building blocks</p><h1 class="section-title">29 types of work.<br>29 sets of assumptions.</h1><p class="lede">Open a task type to inspect its evidence, test its current score, or change the pace and cap used in its forecast.</p><div class="filters"><label class="control">Sort task types<select id="task-sort">${[
    ["share", "Share of the basket"],
    ["contribution", "Contribution today"],
    ["gain", "Contribution to forecast gains"],
    ["score", "Current capability"],
    ["name", "Name"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}" ${state.taskSort === v ? "selected" : ""}>${l}</option>`,
    )
    .join(
      "",
    )}</select></label></div><div class="list-head"><span>Task type / basket share</span><span class="bar-title">Task coverage</span><div class="numbers"><span>Now</span><span>Oct ’27</span></div></div>${taskRows()}`;
}
function taskRows() {
  const sort = {
    share: (a, b) => b.share - a.share,
    contribution: (a, b) => b.share * b.now - a.share * a.now,
    gain: (a, b) =>
      b.share * (b.proj[2] - b.now) - a.share * (a.proj[2] - a.now),
    score: (a, b) => b.now - a.now,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  return [...model.tasks]
    .sort(sort[state.taskSort])
    .map(
      (t) =>
        `<a class="result-row" href="#tasks/${t.id}"><div><h3>${esc(t.name)}</h3><p>${(t.share * 100).toFixed(2)}% of the ${term()} basket · ${esc(t.family)}</p></div>${bars(t.proj)}<div class="numbers"><span>${round(t.now)}</span><span>${round(t.proj[2])}</span></div></a>`,
    )
    .join("");
}
function task(t) {
  const base = baseline.byId[t.id],
    uses = model.occupations
      .filter((o) => o.tasks.some((x) => x.id === t.id))
      .sort((a, b) => b.weight - a.weight);
  return `<a class="back" href="#tasks">← All task types</a><p class="eyebrow">${esc(t.family)} · ${(t.share * 100).toFixed(2)}% of the ${term()} basket</p><h1 class="section-title">${esc(t.name)}</h1><div class="split section"><div><div class="card"><p class="kicker">Why this score?</p><p class="evidence-note">${esc(evidence(t))}</p><p class="frozen">Scoring confidence: ${esc(t.confidence)}. Confidence describes the evidence supporting this judgment; it is not a statistical interval.</p><details><summary>Read the supporting sources (${t.sources.length})</summary>${sources(t.sources)}</details></div><div class="card section"><h3>What the score means</h3><p class="note">${round(t.now)} is the estimated share of time spent on this task type that frontier systems could cover at competent-professional quality with light review. It is an authored calibration across different benchmarks, rather than a direct benchmark percentage.</p><p class="note">“Light review” means checking an otherwise usable result, without substantial redrafting, repair or repeated execution. Review time is not subtracted from the score; net time savings need a separate measurement.</p><details><summary>Calibration and measurement gaps</summary><p class="note">Benchmark success, quality comparisons, autonomous task length and whole-project completion measure different things. They are reference points, not mathematical upper and lower bounds on task-time coverage. This version preserves the published current score where evidence does not support a precise replacement.</p><p class="note">A stronger calibration needs representative work samples, durations, frequency weights, review costs and an explicit acceptance rubric. Context and integration requirements must be recorded alongside model capability.</p>${t.id === "edit" ? '<p class="note">Editing is separately allocated only to writers and reporters in the current basket. Some editing work is bundled into other tasks; these boundaries require a consistent time-allocation review.</p>' : ""}</details></div><div class="card section"><h3>Constraints to examine</h3><div class="constraint-list">${t.constraints.length ? t.constraints.map((k) => `<a href="#constraints/${k}">${names[k]} →</a>`).join("") : '<p class="note">No specific constraint has been tagged for this category. This is not a claim that no constraints exist.</p>'}</div><p class="note" style="margin-top:14px">The scenario cap of ${num(t.cap)}% is a joint assumption under current tools and institutions. The evidence does not yet quantify the separate contributions of these constraints.</p></div><div class="card section"><h3>Where this work appears</h3><ol class="ranking">${uses
    .slice(0, 7)
    .map(
      (o) =>
        `<li><a href="#jobs/${o.id}"><span>${esc(o.title)}<br><small>${o.tasks.filter((x) => x.id === t.id).reduce((s, x) => s + x.share, 0)}% of its assumed time</small></span><span>→</span></a></li>`,
    )
    .join("")}</ol></div></div>
 <aside class="card editor"><p class="kicker">Test an assumption</p><h2>Change the path</h2><p class="note" style="margin-top:10px">Preview the effect on the whole index, then apply it to your scenario.</p><form id="task-form" data-task="${t.id}"><div class="edit-grid"><label>Current task coverage (%)<input id="edit-now" name="now" type="number" min="0" max="100" step="0.1" value="${t.now}" required><small>Published estimate: ${base.now}%</small></label><label>Gap closed every six months (%)<input id="edit-rate" name="rate" type="number" min="0" max="100" step="0.1" value="${t.rate * 100}" required><small>How much of the remaining gap to the cap closes in each period.</small></label><label>Scenario cap (%)<input id="edit-cap" name="cap" type="number" min="0" max="100" step="0.1" value="${t.cap}" required><small>A conditional modeling assumption. Change it to explore different tools or institutions.</small></label></div><p id="edit-error" class="editor-error" role="status"></p><div class="scenario-result" aria-live="polite"><span class="note">Whole-index forecast if applied · Oct 2027</span><b id="preview-result">${pct(model.proj[2])}</b><span class="delta" id="preview-delta">${(model.proj[2] - baseline.proj[2]).toFixed(2)} points vs published Astra baseline</span></div><div class="actions"><button class="button">Apply assumptions</button><button class="button quiet" type="button" id="reset-task" data-task="${t.id}">Reset task</button></div></form><hr class="separator"><p class="note">Published Astra path for this task:</p><p>${pct(base.proj[0])} → ${pct(base.proj[1])} → ${pct(base.proj[2])}</p><p class="frozen">Oct 2026 → Apr 2027 → Oct 2027. Forecasts are computed from unrounded rates; rounding is only for display.</p></aside></div>`;
}
function evidence(t) {
  const revisions = {
    code: "Coding scores combine repository-level coding benchmarks with METR’s software-task reliability evidence. The primary Time Horizon 1.1 results separate success thresholds; they do not measure the fraction of a developer’s week covered. Later benchmark scores and the task-time mapping remain distinct judgments. The current estimate is 82% for contained code-writing work; a whole developer role also includes design, debugging, documentation and meetings.",
    physical:
      "A software agent can advise on physical work but cannot directly execute most on-site actions. Robotics may change this. Studies of robot cost competitiveness describe economics under a particular setting; they do not establish a permanent technical limit. The current 3% score and 15% scenario cap are assumptions for the present tool setting.",
    expert:
      "Professional benchmarks show strong performance on specified analytical deliverables, while longer, less structured work is harder. METR’s Opus 5.5 evaluation reports only modest improvement in research judgement over Fable 5.1. This supports distinguishing analytical assistance from accountable, end-to-end professional work; it does not directly measure the 56% time-coverage estimate.",
    relationship:
      "Relationship work includes ongoing trust, personal knowledge and accountability to clients. No benchmark directly measures its time coverage. The 12% current estimate is a judgment. Its future cap depends on which interactions customers accept from AI; it is not an immutable limit on machine intelligence.",
  };
  return revisions[t.id] || t.evidence;
}
function constraints() {
  return `<p class="eyebrow">What could change the path?</p><h1 class="section-title">Limits have<br>different causes.</h1><p class="lede">A model may know how to do something before it has a body to carry it out, permission to do it, or a customer who wants it to. Those are different questions.</p><div class="grid3 section">${KINDS.map((k, i) => `<section class="card" id="constraint-${k}"><div class="constraint-icon" aria-hidden="true">${["→", "§", "◎"][i]}</div><h2>${names[k]}</h2><p class="note" style="margin-top:12px">${esc(data.config.constraint_notes[k])}</p><p class="note">${["Examples: handling samples, operating equipment, or helping a patient in person. A remote conversation does not necessarily require embodiment.", "A human signature can remain mandatory even when AI performs much of the underlying analysis. Model retained review and sign-off time separately.", "Preference is specific to the service and situation. Acceptance of AI-generated routine correspondence says little about acceptance of an AI therapist."][i]}</p><div class="constraint-list">${data.config.constraint_tags[k].map((id) => `<a href="#tasks/${id}">${esc(model.byId[id].name)}</a>`).join("")}</div></section>`).join("")}</div><section class="section card"><div class="section-head"><div><p class="kicker">How this version treats them</p><h2>Separate mechanisms, explicit assumptions</h2></div></div><div class="grid2"><div><h3>The current model</h3><p class="note">Each task has a current coverage estimate, a progress rate and a joint scenario cap inherited from the published assessment. The tags above identify constraints to investigate. They are qualitative classifications, not separately measured percentages.</p><p class="note">The cap stays fixed within each scenario. You can change it in a task’s assumptions to explore a different setting. We do not describe the remainder as work that will always require a human.</p></div><div><h3>The next layer</h3><p class="note">A quantitative split needs task-and-context evidence for each constraint, dates, jurisdictions, and their overlap. A task may be blocked by all three at once. Adding their percentages, or multiplying independent assumptions, would double-count or impose unjustified independence.</p><p class="note">With those inputs, technically executable work and work feasible to delegate can be shown separately. Robot costs, integration costs and adoption would be additional economic questions.</p></div></div></section><section class="section"><div class="section-head"><div><h2>Which assumptions have the most weight?</h2><p class="note">The gap below each scenario cap is not attributed to a specific constraint. Start with large task shares when testing a different future.</p></div></div><div class="list-head"><span>Task type / basket share</span><span class="bar-title">Scenario cap</span><div class="numbers"><span>Now</span><span>Cap</span></div></div>${[
    ...model.tasks,
  ]
    .filter((t) => t.constraints.length)
    .sort((a, b) => b.share * (100 - b.cap) - a.share * (100 - a.cap))
    .slice(0, 10)
    .map(
      (t) =>
        `<a class="result-row" href="#tasks/${t.id}"><div><h3>${esc(t.name)}</h3><p>${(t.share * 100).toFixed(1)}% of the ${term()} basket</p></div><div class="stack" aria-hidden="true"><span class="now" style="width:${t.cap}%"></span></div><div class="numbers"><span>${round(t.now)}</span><span>${round(t.cap)}</span></div></a>`,
    )
    .join("")}</section>`;
}
function method() {
  const a = current(),
    contrib = [...model.tasks].sort((p, q) => q.share - p.share).slice(0, 5),
    swe = model.occupations.find((o) => o.id === "swe");
  return `<p class="eyebrow">A model you can inspect</p><h1 class="section-title">From tasks<br>to the headline.</h1><p class="lede">One fixed basket of work, scored against a defined standard. This page separates the observations, the authored judgments and the forecast assumptions.</p><div class="method-copy"><h2>1. Define the work and the standard</h2><p>We estimate the share of time spent on today’s tasks that frontier AI could cover at competent-professional quality, using available tools and with light review. Light review means checking an otherwise usable result; substantial rewriting, repair or repeated execution falls outside it.</p><p>This is task coverage, before review and coordination costs. It does not measure net hours saved, autonomous job replacement, realized payroll savings or GDP. The current scoring still includes judgments about context, institutions and preference; a pure technical-capability series would require separating those effects.</p><h2>2. Choose a population and a weighting</h2><p>The basket covers ${num(model.totalEmployment / 1000)} million employee jobs in 98 occupation groups. It includes selected management, professional, education, healthcare, sales and administrative roles. It excludes self-employment and many roles such as registered nurses and retail sales. “White-collar” is an authored scope, not an official BLS category.</p><p>Pay weighting uses employment × annual mean wage. Worker weighting uses employment alone. Neither is a direct measure of national hours: that would require hours worked by occupation. The 40-hour display is an illustrative equivalent. Within each occupation, task-time shares are authored estimates informed by task descriptions, not BLS time-use data.</p><div class="formula">Occupation score = sum of (task’s share of time × task capability score).<br>Index = sum of (occupation’s share of the chosen basket × occupation score).</div><p>Employment and wage weights stay fixed across history and forecasts, so changes isolate capability under a fixed task mix. Future points describe today’s work, rather than the jobs and tasks that may exist in a future economy.</p><details><summary>Worked example: software developers</summary><div class="table-scroll"><table><thead><tr><th>Task</th><th class="number">Time share</th><th class="number">AI coverage</th><th class="number">Contribution</th></tr></thead><tbody>${swe.tasks.map((t) => `<tr><td>${esc(t.name)}</td><td class="number">${num(t.share)}%</td><td class="number">${pct(t.proj[0])}</td><td class="number">${((t.share / 100) * t.proj[0]).toFixed(2)} pts</td></tr>`).join("")}<tr><td colspan="3">Occupation coverage</td><td class="number">${pct(swe.proj[0])}</td></tr></tbody></table></div><p><a href="#jobs/swe">Inspect or adjust this mix →</a></p></details><h2>3. Calibrate the task scores</h2><p>GDPval compares professional deliverables; METR measures reliability across task durations; RLI tests whole freelance projects. These provide different lenses. Their rates are not interchangeable or formal bounds on the share of professional time covered.</p><p>Each task page links to the sources and explains its score. Current scores remain calibrated judgments. A more reproducible calibration needs representative task samples, time weights, documented review costs and an acceptance rubric. We retain the published current estimate where the evidence does not justify a precise replacement.</p><details><summary>Evidence quality and priorities</summary><p>The assessment labels ${model.confidence.high.toFixed(1)}% of the ${term()} basket high confidence, ${model.confidence.medium.toFixed(1)}% medium and ${model.confidence.low.toFixed(1)}% low. These labels describe evidence strength; they are not statistical error bars.</p><p>The largest task shares are ${contrib.map((t) => `${esc(t.name.toLowerCase())} (${(t.share * 100).toFixed(1)}%)`).join(", ")}. Better time-allocation evidence for these categories can matter more than finer employment rounding. Editing is only separately allocated to writers and reporters; heterogeneous occupation groups also need more granular mixes.</p></details><h2>4. Forecast with explicit parameters</h2><p>The baseline uses the report’s gap-closure approach: 40% of the remaining gap per six months for codified tasks, 45% for coding/debugging, 25% for judgment-oriented tasks, 20% for strategy, 15% for sales/relationships/meetings and 12% for teaching/management/care/physical work. These are scenario parameters informed by the report’s approximate cluster rates; they are not statistically fitted forecasts.</p><div class="formula">Coverage after n half-years = cap − (cap − current coverage) × (1 − gap-closure rate)<sup>n</sup>.</div><p>All calculations use unrounded parameters. Forecasts are dated from October 27, 2026, with targets of April 27 and October 27, 2027. The chart may extend the same assumptions through 2030, but no permanent intelligence limit is inferred from a slowing curve. Scenario caps are conditional on tools and institutions; changing robotics, permission or preference can change them.</p><p>A gain under one point per half-year is a reporting convention. ${model.flatAt === null ? "The scenario does not reach that threshold within the displayed four-year calculation." : `The first qualifying interval ends in ${date(periodDate(data.config.as_of, model.flatAt))}.`} This does not establish the date when progress stops.</p><h2>5. Keep dates and evidence honest</h2><p>Historical points are retrospectively scored at the listed model release dates, using today’s fixed basket. They are not measurements recorded at the time. Later tests of an already-available model can inform a backfill; later-released models cannot. Historical per-task evidence attribution remains incomplete, so the curve is not a validated backtest.</p><p>The current point is placed at its October 27 assessment cutoff, rather than the September release date of its anchor model. This version does not repeat later peers as if they were available at earlier release dates. Historical score values are retained pending a task-level re-scoring with time-qualified evidence.</p><p>Future forecasts should be preserved as issued and evaluated against a matching task definition and basket. The <a href="forecast-2026-10-27.json">October 27, 2026 forecast</a> is archived with its parameters and occupation-level predictions. Neither target date has arrived, so there is no forecast error to report yet.</p></div>
 <section class="section card"><h2>Check against the original</h2><p class="note" style="margin-top:10px">The current scores and task allocations are shared with the published assessment unless you edit them. Astra replaces rounded forecast inputs with explicit rates, changes the meaning of caps, and uses a consistent assessment date. Differences below are calculated from the actual occupation data, not illustrative time mixes.</p><div class="table-scroll"><table class="method-table"><thead><tr><th>Occupation</th><th class="number">Now</th><th class="number">Original F+2<br>(published mix)</th><th class="number">Astra Oct ’27</th></tr></thead><tbody>${[
   "swe",
   "lawyer",
   "accountant",
   "physician",
   "k12_teacher",
   "secretary",
 ]
   .map((id) => {
     const o = model.occupations.find((o) => o.id === id);
     const original = data.occupations.occupations
       .find((x) => x.id === id)
       .tasks.reduce(
         (s, [, task, share]) =>
           s +
           (share / 100) *
             (a.overrides?.[`${id}:${task}`]?.f2 ?? a.scores[task].f2),
         0,
       );
     return `<tr><td><a href="#jobs/${id}">${esc(o.title)}</a></td><td class="number">${pct(o.proj[0])}</td><td class="number">${pct(original)}</td><td class="number">${pct(o.proj[2])}</td></tr>`;
   })
   .join(
     "",
   )}</tbody></table></div><p class="note">External studies such as ESADE use different occupation coverage and scoring definitions. Agreement with them is a consistency check, not independent validation of these scores.</p></section>
 <section class="section card"><h2>Primary-source checks</h2><p class="note" style="margin-top:10px">Checked October 27, 2026. Retrieving a source does not validate every claim derived from it. These are the specific checks completed for this comparison.</p>${sources(Object.keys(data.config.source_reviews))}<p class="note">The ESADE paper and several secondary references could not be independently retrieved in this environment. Their inherited claims remain unverified here. METR’s June GPT-5.6 evaluation gives an unstable estimate and explicitly rejects it as a robust measurement; we do not treat it as a reliable continuation of the horizon series.</p><details><summary>Full inherited bibliography</summary>${sources(a.sources.map((s) => s.id))}</details></section>
 <section class="section card"><h2>Take the data with you</h2><p class="note" style="margin:10px 0 15px">Exports include your current scenario, weighting and assessment date. All baseline model inputs remain inspectable.</p><div class="actions"><button id="download" class="button">Download occupation CSV</button><a class="button quiet" href="bundle.json" download="headroom-astra-baseline.json">Baseline data (JSON)</a><a class="button quiet" href="bls-verification.json">BLS reconciliation</a></div></section>`;
}
function missing(kind, view) {
  return `<h1>That ${kind} isn’t in this assessment.</h1><p class="lede"><a href="#${view}">Browse the available entries →</a></p>`;
}
function readTaskForm(form) {
  const v = Object.fromEntries(
    ["now", "rate", "cap"].map((k) => [
      k,
      form.elements[k].value.trim() === ""
        ? NaN
        : Number(form.elements[k].value),
    ]),
  );
  v.rate /= 100;
  return v;
}
function taskPreview() {
  const form = $("task-form");
  if (!form) return;
  const id = form.dataset.task,
    v = readTaskForm(form);
  const cleaned = cleanEdits({ [id]: v }, data);
  const valid =
    Number.isFinite(v.now) &&
    Number.isFinite(v.cap) &&
    Number.isFinite(v.rate) &&
    v.now >= 0 &&
    v.cap <= 100 &&
    v.cap >= v.now &&
    v.rate >= 0 &&
    v.rate <= 1;
  $("edit-error").textContent = valid
    ? ""
    : "Use 0–100 values and a cap at least as high as current coverage.";
  if (!valid) return false;
  const edits = { ...state.edits };
  delete edits[id];
  Object.assign(edits, cleaned);
  const preview = compute(data, state.weight, edits, 8, state.mixes);
  $("preview-result").textContent = pct(preview.proj[2]);
  $("preview-delta").textContent =
    `${(preview.proj[2] - baseline.proj[2]).toFixed(2)} points vs published Astra baseline`;
  return edits;
}
function bindContent() {
  $("mobile-weight")?.addEventListener("change", (e) =>
    setWeight(e.target.value),
  );
  $("hero-search")?.addEventListener("submit", (e) => {
    e.preventDefault();
    state.search = $("hero-query").value;
    state.group = "all";
    location.hash = "jobs";
  });
  $("horizon")?.addEventListener("change", (e) => {
    state.horizon = Number(e.target.value);
    render("horizon");
  });
  document.querySelectorAll("[data-point]").forEach((el) => {
    const show = () => ($("chart-detail").textContent = el.dataset.point);
    el.addEventListener("pointerenter", show);
    el.addEventListener("focus", show);
    el.addEventListener("click", show);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        show();
      }
      if (e.key === "Escape")
        $("chart-detail").textContent =
          "Select or focus a point for its date and value.";
    });
  });
  $("job-search")?.addEventListener("input", (e) => {
    state.search = e.target.value;
    $("job-results").innerHTML = jobResults();
  });
  for (const [id, k] of [
    ["job-group", "group"],
    ["job-sort", "sort"],
    ["job-layout", "layout"],
  ])
    $(id)?.addEventListener("change", (e) => {
      state[k] = e.target.value;
      $("job-results").innerHTML = jobResults();
    });
  $("task-sort")?.addEventListener("change", (e) => {
    state.taskSort = e.target.value;
    render("task-sort");
  });
  $("task-form")?.addEventListener("input", taskPreview);
  $("task-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const edits = taskPreview();
    if (edits === false) return;
    state.edits = edits;
    persist();
    render("edit-now");
    $("status").textContent = "Assumptions applied to your scenario.";
  });
  $("reset-task")?.addEventListener("click", (e) => {
    delete state.edits[e.currentTarget.dataset.task];
    persist();
    render("edit-now");
  });
  $("mix-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      o = model.occupations.find((o) => o.id === form.dataset.occ),
      values = o.tasks.map((_, i) =>
        form.elements["mix-" + i].value.trim() === ""
          ? NaN
          : Number(form.elements["mix-" + i].value),
      );
    if (
      values.some((x) => !Number.isFinite(x) || x < 0 || x > 100) ||
      Math.abs(values.reduce((s, x) => s + x, 0) - 100) > 0.00001
    ) {
      $("mix-error").textContent =
        "Time shares must be between 0 and 100 and sum to exactly 100%.";
      return;
    }
    delete state.mixes[o.id];
    Object.assign(state.mixes, cleanMixes({ [o.id]: values }, data));
    persist();
    render();
    $("status").textContent = "Occupation task mix applied.";
  });
  $("reset-mix")?.addEventListener("click", (e) => {
    delete state.mixes[e.currentTarget.dataset.occ];
    persist();
    render();
  });
  $("download")?.addEventListener("click", () => {
    const rows = [
      [
        "Assessment",
        "Weighting",
        "Scenario",
        "Occupation",
        "SOC codes",
        "Employment (thousands)",
        "Mean wage (USD thousands)",
        "Coverage now (%)",
        "Coverage Apr 2027 (%)",
        "Coverage Oct 2027 (%)",
      ],
      ...model.occupations.map((o) => [
        data.config.as_of,
        state.weight,
        Object.keys(state.edits).length || Object.keys(state.mixes).length
          ? "custom"
          : "baseline",
        o.title,
        o.codes.join(";"),
        o.employment,
        o.wage,
        ...o.proj.slice(0, 3).map((v) => v.toFixed(4)),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "headroom-astra-occupations.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
function setWeight(weight) {
  if (!["wage", "employment"].includes(weight)) return;
  state.weight = weight;
  persist();
  render();
  $("status").textContent = `Showing ${term()} results.`;
}
async function init() {
  let response = await fetch("bundle.json");
  if (response.ok) data = await response.json();
  else {
    const get = async (p) => {
      const r = await fetch(p);
      if (!r.ok) throw Error("The assessment data could not be loaded.");
      return r.json();
    };
    const [taxonomy, occupations, index, config, bls, access] =
      await Promise.all(
        [
          "../data/taxonomy.json",
          "../data/occupations.json",
          "../data/assessments/index.json",
          "config.json",
          "bls-verification.json",
          "source-access.json",
        ].map(get),
      );
    const assessments = Object.fromEntries(
      await Promise.all(
        index.assessments.map(async (id) => [
          id,
          await get(`../data/assessments/${id}.json`),
        ]),
      ),
    );
    data = { taxonomy, occupations, index, assessments, config, bls, access };
  }
  const errors = validateBundle(data);
  if (errors.length)
    throw Error(
      "The assessment contains inconsistent inputs. Please try again after the data has been updated.",
    );
  key = `astra:scenario:v1:${data.index.latest}`;
  const saved = store.get(key) || {},
    u = new URL(location.href);
  state.weight = ["wage", "employment"].includes(u.searchParams.get("w"))
    ? u.searchParams.get("w")
    : store.get("astra:weight") === "employment"
      ? "employment"
      : "wage";
  let scenario = saved;
  if (u.searchParams.has("e")) {
    scenario = {};
    try {
      const e = u.searchParams.get("e");
      if (e.length > 18000) throw Error("long");
      const v = JSON.parse(atob(e));
      if (v.version === 1 && v.assessment === data.index.latest) scenario = v;
      else throw Error("version");
    } catch {
      $("status").textContent =
        "This scenario link could not be read. Showing the baseline.";
    }
  }
  state.edits = cleanEdits(scenario.edits, data);
  state.mixes = cleanMixes(scenario.mixes, data);
  document
    .querySelectorAll("input[name=weight]")
    .forEach((e) => e.addEventListener("change", () => setWeight(e.value)));
  $("reset").addEventListener("click", () => {
    state.edits = {};
    state.mixes = {};
    persist();
    render();
    $("status").textContent = "Published Astra baseline restored.";
  });
  $("share").addEventListener("click", async () => {
    const url = params().href;
    try {
      await navigator.clipboard.writeText(url);
      $("share").textContent = "Link copied";
      $("status").textContent = "Scenario link copied.";
      setTimeout(() => ($("share").textContent = "Copy scenario link"), 1800);
    } catch {
      $("error").hidden = false;
      $("error").textContent = "Copy this scenario link: " + url;
    }
  });
  document.querySelector(".skip").addEventListener("click", (e) => {
    e.preventDefault();
    $("main").focus();
    $("main").scrollIntoView();
  });
  window.addEventListener("hashchange", () => {
    route();
    window.scrollTo(0, 0);
    if (state.view === "constraints" && KINDS.includes(state.target))
      requestAnimationFrame(() =>
        $("constraint-" + state.target)?.scrollIntoView(),
      );
  });
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (state.view === "overview") render();
    }, 150);
  });
  route();
}
init().catch((err) => {
  $("content").innerHTML = "";
  $("error").hidden = false;
  $("error").textContent =
    "We couldn’t load this assessment. Please reload the page. " + err.message;
});
