# Headroom site audit

Date: 2026-10-27. Scope: the deployed static site (`index.html`, `assets/`, `data/`), the model in `assets/model.js`, the report and research notes, and all 82 cited sources. Method is in the appendix.

## Summary

The site is well built. The validator passes, every BLS employment and wage figure matches the research note, the report's score table matches the JSON exactly, axe-core finds no accessibility violations, and a cold load is about 310KB. Five things hold it back.

1. **A projection artifact puts about 2 points of rounding noise into the headline "ceiling" and mislabels it "needs a person".** Integer-rounded F+1/F+2 scores make the trend-detection in `projectArchetype` stop 14 task types below the ceilings the author set (relationship ends at 37 instead of 50, strategy at 55.5 instead of 65). Moving one score by one point swings the headline ceiling by up to 2 points. Section 1.1 has the fix.
2. **The headline rests mostly on judgment with no benchmark, and the site shows no uncertainty.** 55% of the pay-weighted index sits in task types scored with low confidence; the Human family alone is 34%; meetings is the single largest type at 10.6%. The assessment states ±5 and ±8 point bands; nothing on the site draws them.
3. **Task time shares, the biggest input from 2027 on, are unsourced**, and the Jobs tab shows them to a tenth of an hour.
4. **Sources need a pass.** About a third of the 82 citations are secondary relays; one is dead, one moved, three point at the wrong document, and roughly 20 figures are contradicted or unsupported by their cited page. The METR time-horizon numbers are stale (pre-correction), and the 48.7% strict OSWorld figure that anchors the reliability argument has no primary source. The ESADE "authorship" claim behind several ceilings says the opposite of what the paper found.
5. **UX gaps on the detail tabs.** No colour legend on Jobs, an unlabelled "→ 48%" target, a Tasks list ranked so that the two least consequential types come first, no source links per score, touch tooltips that never dismiss, and nine SOC labels that break search.

### Priorities

| # | Change | Why | Effort |
|---|---|---|---|
| 1 | Project every type to its ceiling; drop the rounding-driven trend limit; relabel the residual (1.1, 1.2) | Headline integrity | Small |
| 2 | Draw the ±5/±8 bands; show the evidence-quality share of the index; whole-number precision (1.3, 3.2) | Trust | Medium |
| 3 | Fix the stale METR values, re-source or drop 48.7%, correct the ESADE authorship claim, SpreadsheetBench, Mercor IB, Yale (2.2) | Accuracy | Small |
| 4 | Link each task type to its sources; tier primary vs secondary; replace the ten relays that have primaries; add access dates (2.4, 3.5) | Credibility | Medium |
| 5 | Jobs tab: legend, label the F+2 target, flat ranking, fix SOC labels, out-of-scope note in the empty state (3.4) | Usability | Small |
| 6 | Tasks tab: rank by share of work, confidence chips, live readout in the editor (3.5) | Usability | Small |
| 7 | Task-mix provenance field, whole hours, calibration panel against ESADE (1.4) | Transparency | Medium |
| 8 | Explicit forecast dates in the data; keep retired forecasts; render predicted vs actual (1.6, 1.10) | Delivers the concept | Medium |
| 9 | Rename the Pay/Jobs toggle, deep links, dismiss touch tooltips, tooltip a11y, favicon and Open Graph tags (3.3, 3.7) | Polish | Small |
| 10 | Validator checks, model unit tests, Playwright smoke test (1.10, 3.8) | Maintenance | Small |


## 1. Modeling

### 1.1 The projection past Frontier+2 is shaped by rounding noise, not evidence

**How it works today.** `projectArchetype` in `assets/model.js` takes the two forecast steps, d1 = F+1 − Now and d2 = F+2 − F+1. If d2 < d1 it assumes the steps keep shrinking by the ratio r = d2/d1 and computes where that geometric series ends (the "trend"). Each task type then converges to the lower of its ceiling and that trend. The `bound` ("intelligence" vs "structural") and `trend` outputs are computed but never shown anywhere in the UI.

**Why it misfires.** The report (section 4 and Appendix A) says F+1 and F+2 were generated as Now + g × (Ceiling − Now), applied twice, then rounded to whole points. For unrounded values that series ends exactly at the ceiling, so the trend test can never bind. After rounding, d1 and d2 are small integers (3 and 3, 5 and 4, 6 and 5), the ratio is coarse, and the inferred trend falls below the ceiling for 14 of 29 task types. The model then stops those types short of a ceiling the author set deliberately.

| Task type | Ceiling (author) | Limit the model actually uses |
|---|---|---|
| relationship | 50 | 37.0 |
| strategy | 65 | 55.5 |
| sales | 70 | 64.0 |
| media | 94 | 87.0 |
| support | 91 | 88.0 |
| design_tech | 93 | 90.3 |
| research, docproc | 97 | 94.0 |
| draft | 98 | 96.0 |
| entry | 99 | 97.0 |
| scheduling | 96 | 94.8 |

**Effect on the headline.**

| Figure (pay-weighted) | Current code | Projecting to the author's ceilings |
|---|---|---|
| "Ceiling" stat | 72.5% | 74.3% |
| Year-8 projection (2030) | 69.0% | 69.9% |
| "Needs a person" residual | 27.5 pts | 25.7 pts |

About 1.9 points of the "remaining 28% needs a person" sentence is a rounding artifact. The number is also unstable: moving one score by one point swings it.

| Single edit | Headline ceiling |
|---|---|
| none | 72.5% |
| meetings F+2 29 → 28 | 70.6% |
| sales F+2 39 → 38 | 71.8% |
| relationship F+2 21 → 22 | 73.0% |

**Recommended fix.** Project every type toward its ceiling at the rate implied by the last step, and let the author state a sub-ceiling asymptote explicitly when they believe one exists, instead of having rounding infer one:

```js
export function projectArchetype({ f0, f1, f2, ceiling, asymptote }, horizon = 8) {
  const limit = Math.max(f2, Math.min(ceiling, asymptote ?? ceiling));
  const rate = limit - f1 > 0 ? (limit - f2) / (limit - f1) : 0;
  const proj = [f0, f1, f2];
  for (let n = 3; n <= horizon; n++) proj.push(limit - (limit - f2) * rate ** (n - 2));
  return { limit, rate, proj };
}
```

Then update the README and the Method tab ("extends each type's gap-closure rate toward its ceiling"), and add a unit test: scores built with a constant closure rate must converge to the ceiling. If you want to keep trend detection, store F+1/F+2 to one decimal or only let a trend bind when it sits more than the rounding tolerance below the ceiling. Both are weaker than the fix above.

### 1.2 "Needs a person" is mislabelled where the trend binds

`bands()` in `assets/app.js` defines the "Needs a person" band as 100 − limit. Where the limit sits below the ceiling, the difference is "the trend flattened", not "needs a person". The hatched region on the timeline, the week grid, every stacked bar and the lede inherit the mislabel. The fix in 1.1 removes it; otherwise draw the trend shortfall as its own band.

### 1.3 Most of the headline rests on judgment calls with no benchmark

| Share of the pay-weighted index by score confidence | |
|---|---|
| high | 14.9% |
| medium | 30.2% |
| low | 54.9% |

- The "Human" family (meetings, people, relationship, sales, strategy, care) is 33.6% of the pay-weighted index (27.9% by jobs). The evidence notes say it has no benchmark at all.
- Meetings alone is 10.6% of the index, the largest single type, scored 18 with a ceiling of 55 on the reasoning that "live participation is the human contribution". It is the biggest lever on both the headline and the ceiling.
- The "needs a person" residual (25.7 pts) comes mostly from six types: meetings 4.8, people 4.4, physical 3.5, teaching 2.8, care 2.7, relationship 2.1.
- Five management occupations have 90 to 100% of their time in low-confidence types (Architectural & Engineering Managers 100%, IT Managers 95%, Chief Executives 90%).

Recommendations:
- Show an evidence-quality breakdown on the Overview ("55% of this index rests on task types scored without a benchmark").
- Propagate per-type confidence to occupations and groups, and mark jobs whose score is mostly low-confidence.
- Treat the stated ±5 (F+1) and ±8 (F+2) bands as data (a per-type or per-cluster range in the JSON) and draw them.
- Consider splitting `meetings` into "present and communicate results" (already partly AI-done) and "live coordination and negotiation" (not), since the current type blends both.

### 1.4 Task time shares are the largest unsourced input

The 98 task mixes are author estimates; the research notes say no study reports white-collar time by work activity. The report's own conclusion says that from 2027 on the task mix and ceilings, not the scores, decide the occupation rankings. Yet `occupations.json` has no provenance field and the Jobs tab shows "AI could handle about 17.9 hours" to one decimal.

Recommendations:
- Add a `basis` field per occupation (for example "O*NET task statements and importance ratings, author time split") and show "task mix is an estimate" on the Jobs tab; round hours to whole numbers.
- Add a calibration panel on the Method tab. The site's group scores already line up loosely with ESADE's replaceable shares; showing it builds trust and exposes the outliers (Management and Sales).

| BLS major group | Site, now (pay-weighted) | ESADE replaceable share (Oct 2026) |
|---|---|---|
| Computer & Mathematical | 62.9 | 71.3 |
| Business & Financial Operations | 57.4 | 65.5 |
| Office & Administrative Support | 66.8 | 65.2 |
| Legal | 57.6 | 55.6 |
| Management | 36.6 | 48.9 |
| Architecture & Engineering | 46.3 | 45.6 |
| Arts, Design, Entertainment & Media | 51.5 | 44.6 |
| Life, Physical & Social Science | 47.5 | 41.9 |
| Community & Social Service | 36.8 | 39.8 |
| Educational Instruction & Library | 32.8 | 37.1 |
| Healthcare Practitioners (selected) | 34.9 | 32.0 |
| Sales (non-retail) | 39.4 | 59.2 (ESADE includes retail) |

- A cheap sensitivity: swap 5 points between each occupation's two largest tasks and show the resulting range on the job row.

### 1.5 Taxonomy and mapping issues

- `edit` (score 88, top of the Tasks list) is used by only 2 occupations and is 0.1% of the index; `translate` by 1 occupation (0.0%). Ranking the Tasks tab by score puts the two least consequential types first.
- `meetings` is a catch-all mapped into most occupations at 10 to 25% ("coordinate with", "present to", "attend"). See 1.3.
- Lawyers: "Negotiate and argue in court" maps to `sales` (now 28, ceiling 70). Court advocacy is licensure- and presence-bound; `expert` or a split fits better.
- `diagnosis` is used only by Physicians (1.0% of the index), so its evidence carries little weight; pharmacists' clinical recommendations map to `expert`.
- Nine combined BLS rows list only one of their SOC codes, so a SOC search misses the other half:

| Occupation id | Shown | Should be |
|---|---|---|
| legal_other | 23-1020 | 23-1020/2090 |
| designers | 27-1024 | 27-1024/1014 |
| physician | 29-1210 | 29-1210/1240 |
| med_records | 29-9021 | 29-9021/2072 |
| sales_rep | 41-4012 | 41-4011/4012 |
| fin_sales | 41-3021 | 41-3021/3031 |
| real_estate | 41-9022 | 41-9021/9022 |
| billing | 43-3021 | 43-3021/3051 |
| loan_clerks | 43-4131 | 43-4131/4141 |

Employment and mean wages for all 98 rows match the BLS May 2025 figures in `research_notes/.../bls_oews.md` (I checked every row, including the employment-weighted means for combined rows).

### 1.6 Forecast mechanics and dates

- F+1 and F+2 are not independent judgments. They are Now + g × (Ceiling − Now) with cluster rates (about 0.40 codified, 0.45 code and debug, 0.25 judgment, 0.20 strategy, 0.10 to 0.15 interpersonal). The site calls them "scored forecasts". Say how they were built on the Method tab and show g per cluster; that makes the future forecast-versus-actual check meaningful, because it is g that gets tested.
- Forecast dates derive from `updated` (2026-10-27) plus 6 and 12 months, not from the anchor model's date. Any edit that bumps `updated` slides F+1 and F+2 later without re-scoring, and moves the points on the chart. The report anchors F+1 to Opus 5.5 plus about seven months. Store explicit `f1_date` and `f2_date` in the assessment, or anchor to `date`.
- The dashed trend runs to April 2030 and reads as a forecast, while the assessment itself states ±5 at F+1 and ±8 at F+2 and nothing beyond. Draw the band and fade or cap the trend after F+4.
- The "saturation point" (first generation adding under 1 point) always arrives with a geometric series and depends on the weighting (generation 7 under both today). It is a convention, so label it as one. The "Ceiling" stat currently mixes a level (72.5%) with a date ("after ~2029").
- A "generation" is a capability step of two to three Opus point releases, not a release; the glossary says this, the chart does not.

### 1.7 Opus is the anchor, not always the frontier

From June 2026 Opus was not Anthropic's top public model (Fable 5 from June 9, Fable 5.1 from September 1). The method scores "the best publicly available model" on each Opus date, so the Opus 5 point (July 24) reflects Fable 5. The chart labels it "Opus 5" and the eyebrow says "Frontier model: Claude Opus 5.5". The data already carries `peers`; show "public frontier at the time" in the snapshot list and the point tooltips.

### 1.8 Coverage and the headline claim

| | |
|---|---|
| Occupations covered | 98 |
| Jobs covered | 60.5M |
| Wage bill covered | $5.76T |
| Jobs in the 12 BLS major groups | 87.1M |
| All U.S. wage-and-salary jobs (OEWS) | 155.5M |

The h1 reads "48% of U.S. white-collar work". Put the scope in the lede ("across 98 occupations and 60M jobs; excludes registered nurses, retail sales and the self-employed"). The report's Appendix B still says 56.0M and lists as omitted several occupations that are now included (services sales representatives 1.26M, managers all other 622k, property managers, instructional coordinators). It is stale.

### 1.9 Pay weighting as the default

The default weight is the wage bill, but the h1 says "of white-collar work". By headcount (closer to "work" as time) the figure is 50.5%, not 47.9%. Either default to Jobs for the "work" phrasing, or make the h1 follow the weighting ("48% of white-collar pay" / "50% of white-collar working time"). Pay weighting also makes Management 25.8% of the index (16.5% by jobs), which is why the pay-weighted headline is lower.

### 1.10 Validator gaps and code hygiene

`validate()` checks task shares, archetype ids, score ranges and the ordering Now ≤ F+1 ≤ F+2 ≤ Ceiling. It does not check that `index.latest` exists and is `kind: live`, that `cadence_months`, `date` and `updated` are present and well-formed (a backfill as `latest` would break every date on the site), that each type has `evidence` and `confidence`, that sources have title/url/group, that snapshot dates are unique and ascending, or that scores never fall between snapshots (the report asserts this; it holds today with 0 violations). Also:

- `assets/app.js` hard-codes the label "First agentic frontier" to decide which chart point to label.
- `.dot-track .beyond` in `style.css` is unused; `bound` and `trend` in `model.js` are unused.
- There are no unit tests for `model.js` (projection converges to ceiling, weights sum to 1, backfill collapses tiers, edit validation).
- README says assessment files are named `YYYY-MM.json`; they are `opus-5-5.json`.
- README says the snapshots list lets you check whether arriving models matched the previous F+1 forecast. That is not implemented: backfills carry no forecasts, and a live snapshot's F+1/F+2 are discarded when its `kind` flips to `backfill`. Keep retired forecasts (for example a `forecast` block) and render "predicted vs actual" once the next live snapshot lands. This is the most compelling feature the concept promises.

## 2. Content and sources

I checked all 82 cited URLs for reachability with curl, then had every page fetched and read against the specific figures the site or report attributes to it (about 120 claims). Dates and model names after mid-2026 were taken at face value from the pages.

### 2.1 Link health

| Result | URLs |
|---|---|
| Dead | noqta.tn (GPT-5.4): HTTP 410 Gone. Replace with OpenAI's GPT-5.4 announcement. |
| Moved | datalearner.com → llmlearner.com (301). Update the URL. |
| Wrong document | arXiv 2508.14909 is the WMT25 "Preliminary Ranking" paper, not the findings paper titled "Time to Stop Evaluating on Easy Test Sets" (ACL Anthology). The Yale Budget Lab link is the print view of a May 7, 2026 commentary, not a "February 2026 update". The Mercor March tweet is a links-only reply; the figures sit in the earlier tweet of the thread (status 2029635191803928828). |
| Blocked for automated fetchers, fine in a browser | datacamp (2), marktechpost, decodethefuture, bettersheets, yourstory, openai.com, bls.gov zip, venturebeat (rate-limited), x.com (3 tweets). |
| Reachable but empty to a reader | The New Stack GPT-6 Astra article serves only its headline to non-browser clients; nothing in it could be verified. |
| OK | The other 67. |

### 2.2 Claims the cited source contradicts or no longer supports

| Claim | Used in | What the source says now | Suggested action |
|---|---|---|---|
| METR horizons: Opus 4.1 19 min at 80%; GPT-5 3h34m/32m; Opus 4.5 5h20m/42m; Gemini 3 Pro, GPT-5.2, GPT-5.3-Codex, Gemini 3.1 Pro values | Opus 4.1 and 4.5 highlights; `code` evidence; report sections 1 and 2 | METR's current data file (after its March 3, 2026 regularization correction) gives Opus 4.1 1h40m / 23m, GPT-5 3h23m / 38m, Opus 4.5 4h53m / 49m, GPT-5.2 5h52m / 1h06m, Gemini 3.1 Pro 6h24m / 1h30m. Opus 4.6 (11h59m / 1h10m), GPT-5.4 and Mythos Preview (17.4h / 3h06m) match. The site's values match Wikipedia's stale table. Doubling time is now 128.7 days [104–158], not 130.8. | Take values from METR's file; the 80% story becomes "23 min → 49 min → 70 min → 3h06m". |
| "SpreadsheetBench V2 tops out near 35%" | `analysis`, `accounting` evidence; report | benchmarklist (Oct 3, 2026) tops at arito 54.51% and WPS AI 50.86%; Opus 4.6 34.89% is labelled SWE-agent; Kimi K3 34.8% is dated July, not September. | "General frontier models score about 35%; specialised spreadsheet tools 50–55%." |
| "APEX-Agents investment-banking analyst 54.4% mean (Opus 4.8)" | Opus 4.8 highlight; report | Mercor's page (updated Sep 23, 2026) shows Opus 4.8 61.5%, Fable 5 69.3%, Opus 5.5 73.7%, top Gemini 3.7 Flash 77.1%; GPT-5.5 is absent. | Refresh or date-stamp. |
| "OSWorld 2.0 81.8% partial but 48.7% strict" | Opus 5.5 highlight; `entry` and `support` evidence; report sections 2 and 5 and the conclusion's "33-point gap" | NeuralTrust (revised Oct 21) now compares GPT-6 Sol (60.5%), has no 48.7%. Anthropic's page has no strict score; kingy.ai now says "Anthropic didn't headline a strict score". One secondary leaderboard (presenc.ai) attributes 48.7% to the Opus 5.5 system card. The official OSWorld 2.0 board's best verified strict figure is Opus 5 at 44.33%. | Cite the system card directly or drop the figure. It is the main anchor of the reliability argument. |
| "GPT-6 Astra 72.6% on OSWorld 2.0, different harness" | Report Appendix B | Not on NeuralTrust; The New Stack body not served. | Unverified; drop or re-source. |
| ESADE "organisational-responsibility and authorship factors are nearly uncorrelated with exposure (\|ρ\| ≤ 0.13)" | Report section 5 (ceilings); `creative` evidence ("authorship factor keeps credited ideas with people") | ESADE: relational nexus and organisational responsibility are nearly unrelated (\|ρ\| ≤ 0.13). Authorship is different: it rises with every layer (0.28 with replaceable, 0.59 with expert complementarity). | Correct the report. The authorship argument behind the creative, design, compliance and project ceilings needs another basis. |
| Yale Budget Lab "February 2026 update", "AI-washing", occupational mix stable since 2023 | Sources; report | The linked page is "AI Is Probably Not (Yet) the Reason for Labor Market Weakening" (May 7, 2026). "No clear indication" is there; "AI-washing" and the occupational-mix claim are not. | Cite the tracker or the May 7 report; fix title and date. |
| Opus 5 "much of the capability of Claude Fable 5 at half the cost" (in quotation marks) | Report section 1 | Anthropic: "comes close to the frontier intelligence of Claude Fable 5 at half the price". TechCrunch: "cheaper and less restrictive than Fable". | Fix the quotation. |
| tau2 "retail ~85%, airline 82–88%" | `service`, `scheduling` evidence; report | BenchLM's tau2 page has no domain split (Opus 4.5 86.3%, unlabelled); its airline page lists no Claude model (top Trinity-Large-Thinking 88.0%). Only telecom (99.3%) is supported. | Re-source from Anthropic's Opus 4.6 table (image) or soften. |
| "Opus 5.5 AutomationBench 40.0% vs Gemini 4 Argon 51.3%" | `project` evidence; report | VentureBeat's table lists Opus 5.5 at 42.5% (Google's run); 40.0 is Anthropic's own run. | Say whose run each number is. |
| Package hallucination: "no 2026 frontier model has surpassed the best 2024 model" | Report section 4 | The paper's "2026 frontier" set is five models released Oct 2025 to Mar 2026 (Sonnet 4.6, Haiku 4.5, GPT-5.4-mini, Gemini 2.5 Pro, DeepSeek V3.2), not current flagships. | Qualify. |
| Opus 4.5 "beat every human candidate on Anthropic's 2-hour take-home" | Opus 4.5 highlight | Anthropic: "within our prescribed 2-hour time limit … scored higher than any human candidate ever", with parallel test-time compute; without the limit it matched the best human. | Add the caveat. |
| FrontierFinance 77.2% vs 70.9% vs 61.8% | `analysis` evidence; report | Confirmed, but on the 10-task human-graded subset of 25; on all 25 (LLM judge) GPT-5.4 87.5%, Opus 4.6 83.0%. | Qualify. |
| "Opus 5 broke 11 supplier promises on Vending-Bench" | `sales`, `project` evidence; report | getmegabrain (vendor blog, no byline): "broke 11 separate truces it had personally negotiated with its rivals"; Andon Labs' report is not linked. | Verify against Andon Labs or drop. |
| "Opus 4.6 tau2 telecom 99.25%" | Opus 4.6 highlight; `service` evidence | llmlearner shows 99.3 (provider-reported). | Trivial. |

### 2.3 Claims the cited page cannot support (figure only in an image, or absent)

- Anthropic Opus 4.5 page: SWE-bench Verified 80.9%, OSWorld 66.3% (chart image). Tim Kellogg's post has them only in image alt text.
- Anthropic Opus 4.6 page: tau2 telecom 99.25%, OSWorld-Verified 72.7%, BrowseComp 84.0% (chart). BigLaw Bench 90.2% is a Harvey customer quote on that page.
- Anthropic Opus 5 page: BrowseComp 90.8%, GDPval-AA 1861 vs 1736, OSWorld 70.6%, HLE 63.6% (charts). SWE-bench Pro 79.2% appears nowhere on Anthropic's page; it exists only at DataCamp, as the site already notes.
- "Opus 5.5 +138 over Opus 5 (1708)" is cited to itdoeswhatnow, which has neither number; both come from Anthropic's Opus 5.5 table.
- AA Intelligence Index 58 and Epoch ECI 169 are cited to TechCrunch, which mentions neither; the AA leaderboard (v4.3.2) and the Epoch Brief confirm both.
- "GPT-5.3-Codex, same day as Opus 4.6" is cited to Ubergizmo, which gives no date and never mentions Opus.
- LLM Stats Opus 4.8: GPT-5.5 1769 and the "v1" label are absent. Interesting Engineering: GDPval 84.9% absent (cite OpenAI's GPT-5.5 post). Wikipedia (Claude): no 1M-token context (Anthropic's Opus 4.6 page has it). Wikipedia (METR): no 88.6-day fit, no 17.4h or 185.9 min (METR's file has them).
- Fortune (McKinsey): the 44% agents / 13% robots split is absent; McKinsey's own release has it. Scale's RLI blog: "Upwork" and GPT-5 1.67% are not on the blog (the paper and leaderboard have them). GDPval sector parity (Government, Retail, Wholesale) is figure-only. Anthropic labor-market study: CSR's rank and Data Entry 67% are chart-only. Benchgen: no publication date.
- Epoch "4–5x a year" is cited to the epoch.ai/topics/scaling hub, which has no such figure; it is in the May 2024 post "Training compute of frontier AI models grows by 4-5x per year". The research note's "4.4x/yr since 2010" misreads it (4.4x is notable models since 2022; frontier 2010 to 2024 is 5.3x).

### 2.4 Source quality

About 28 of the 82 citations are secondary relays of vendor tables or aggregator pages: itdoeswhatnow, mer.vin, testmuai, BenchLM (4), LLM Stats (2), decodethefuture, Benchgen, getmegabrain, benchmarklist, bettersheets, llmlearner, agitracker, kingy.ai, NeuralTrust, computingforgeeks, noqta, DataCamp (2), Vellum, Tim Kellogg, MarkTechPost, YourStory. Several are templated or anonymous (itdoeswhatnow, agitracker, kingy.ai, NeuralTrust, computingforgeeks; LLM Stats shows placeholder widgets). Two were revised after the site cited them (kingy.ai Oct 20, NeuralTrust Oct 21), which is how the 48.7% figure went missing. Aggregators mix benchmark versions: BenchLM ranks Opus 5 (1862, v2) above Opus 5.5 (1846, v2.1) on GDPval-AA, and lists Opus 5.5 at 89.9% on SWE-bench Pro while noting OpenAI's July 2026 audit found about 30% of that benchmark's public tasks broken.

Where a primary exists, switch to it:

| Replace | With |
|---|---|
| YourStory | anthropic.com/research/employment-at-anthropic (Oct 16, 2026; all three figures confirmed there) |
| mer.vin | OpenAI's GPT-5.5 announcement |
| noqta.tn | OpenAI's GPT-5.4 announcement |
| Epoch X post | epoch.ai/data-insights/eci-frontier-trend (Sep 1, 2026) |
| Benchgen, getmegabrain | Andon Labs' Vending-Bench 2 page |
| Fortune (McKinsey) | McKinsey MGI's own page or press release |
| Wikipedia (METR) | METR's results file, with the access date |
| datalearner | llmlearner (moved) or Anthropic's table |
| snorkel.ai/?p=19158 | snorkel.ai/biglaw-bench-research/ |
| The New Stack | OpenAI's GPT-6 Astra announcement |

Add an access date to every citation and archive the secondary ones (Wayback), since several have already changed.

### 2.5 Anchors that check out

The figures that carry the most weight are confirmed in page text at primary sources: Anthropic's Opus 5.5 table (all eight rows: Terminal-Bench 4.0 66.4, GDPval-AA v2.1 1846/1735/1708/1542/1588, AutomationBench 40.0/41.4, HLE 67.7, OSWorld 2.1 partial 81.8, FrontierCode 54.4, Terminal-Bench-Science 58.7/64.6, the 680,000-line migration, 63 vs 93 minutes, the 18-hour run, METR and Frontier Design as external testers); the RLI leaderboard (all 14 values, 21.25% down to 0.83%); METR's Opus 5.5 and GPT-5.6 Sol evaluations and Time Horizon 1.1; the Epoch Brief (ECI 169 for Opus 5.5 and GPT-6 Astra; "cannot yet replace workers, at least not at Epoch"); ESADE (every number except the authorship correlation); all four Economic Index reports, the labor-market study and the robots study; Microsoft's "Working with AI" v7; Stanford's 19%; the GDPval paper (47.6%, 1.12x and 1.39x); HealthBench Professional (59.0 vs 43.7); Mercor's leaderboard and tweets; Vals; CAIS (15.8%, "more than quadrupled in under eight months"); AI Futures; LEAP; the Amodei quote. The release dates for all Opus, Fable and Mythos models match Wikipedia's model table.

### 2.6 Text and consistency

- The `scheduling` evidence string ends with a stray ")".
- The report's Appendix B says the occupation list covers 56.0M jobs and names as omitted several occupations the data now includes (services sales representatives, managers all other, property managers, instructional coordinators). The site covers 60.5M.
- Evidence strings carry no citations; the report has them per row (see 3.5).
- Snapshot labels "Opus release" (four of seven) say nothing; the `peers` field already holds the useful fact (who the public frontier was).
- The README's file-naming convention and forecast-comparison claim are wrong (see 1.10).
- The Method tab's "Limits" paragraph correctly says no independent METR horizon exists for models released after May 2026; the rest of the site should stop implying otherwise where it quotes "METR" next to Opus 5.5 (the METR Opus 5.5 post gives no horizon).

## 3. UX

### 3.1 What works

The Overview tells the story in the right order (answer, trend, week, examples, glossary). The headline is strong and the 40-hour grid is an effective device. Dark mode is consistent. axe-core reports 0 violations on Overview, Jobs and Tasks. Mobile has no horizontal overflow and tap targets are 32px or larger. A cold load is about 310KB over 20 requests (fonts 147KB, data 93KB, scripts 34KB, CSS 27KB) and the headline renders in about 1.5s against a local server.

### 3.2 Overview

1. **Precision.** The h1 says 48%, the stat says 47.9%, and the method states ±5 to ±8. Use whole numbers everywhere and show the range ("55% ± 5").
2. **The "Ceiling" stat mixes a level with a date** ("72.5% … Gains under 1 pt a generation after ~2029"). Split it: "Ceiling 74%" and "Saturation ~2030".
3. **The hatch pattern means three things.** It is "Open to later generations" in the bars and week grid, "Needs a person" on the timeline, and the swatch for the "Ceiling" stat. Use one encoding per meaning on the whole page.
4. **Timeline.** No uncertainty band. Backfilled points look identical to the live one (use hollow markers for backfills). The dashed trend to 2030 reads as a forecast. The y-axis has no title. The x-axis alternates "2026, Jul, 2027, Jul", which reads oddly. On mobile the F+1 and F+2 labels collide with the line.
5. **Ranked lists are dead ends.** "Data Entry Keyers" should open that job in the Jobs tab. The 10px bars with five segments make the hatched segment unreadable.
6. The lede copy ("needs a person in the room, a signature, or a relationship") is good. Keep it once 1.2 is fixed.

### 3.3 Header and navigation

1. **"Measure by Pay | Jobs" collides with the "Jobs" tab.** Rename the toggle ("Weight by wages / by people").
2. **Only the four views are addressable.** Put state in the URL (weight, open group and job, open task type, search) so a job or a task type can be shared: `#jobs/swe`, `#tasks/meetings`.
3. **The mobile sticky header is 96px**, 11% of an 844px screen. Collapse the brand row on scroll or stop sticking the tabs.
4. **No favicon (404), no Open Graph or Twitter card tags, no canonical.** A shared link shows no preview; a rendered headline card would travel well.
5. `<meta name="claude:viewport-fit-sides">` is a leftover from the artifact host; remove it.

### 3.4 Jobs tab

1. **No colour legend.** The five bands are explained only on the Overview. Reuse `legendHTML()` above the groups.
2. **"37% now → 48%" has no label on the target.** It is F+2 (about October 2027). Add a header row or "→ 48% by late 2027".
3. **Sorting only reorders jobs inside groups**, and the groups stay in pay-share order. Offer a flat ranked list of all 98 jobs, or flatten when a non-default sort is chosen.
4. **Search gaps.** "nurse" returns "No jobs match" with no hint that nurses are out of scope; SOC search misses the nine combined rows (29-1240, 41-4011, 43-3051, …). Fix the labels, match group names, and add "Not covered: registered nurses, retail sales, the self-employed" to the empty state.
5. **Task bars use two encodings** (length = share of the week, segments = share AI can do) with no explanation. Add a one-line note, or show the share as a number only.
6. **False precision**: "17.9 hours" from an estimated mix. Round to whole hours.
7. Group headers could show coverage ("15 of 23 BLS occupations in this group").

### 3.5 Tasks tab

1. **Rows ranked by score put Editing (0.1% of work) and Translation (0.0%) first.** Rank by share of work, or add a sort control; show share as a small bar.
2. **The evidence paragraph has no links.** The report cites sources per row; the JSON dropped them. Add `sources: [ids]` per type and render them in the detail.
3. **Confidence is hidden** until a row is expanded. Show it as a chip in the row and on the dot.
4. **Editor.** Edits persist and the banner works. But there is no live readout of the effect (index now, F+2, ceiling) next to the table, and no way to share a scenario. Add a readout and a "copy link" that encodes the edits in the URL.
5. Tooltips follow the pointer across the dot track and can cover the expanded detail text.
6. On mobile the list is about 4,000px tall; collapse by family with subtotals.

### 3.6 Method tab

1. **Sources are an undifferentiated list of 82 links** in four groups, with no mapping from any number to its source, and primary pages mixed with content-farm relays. Tier them (primary / independent evaluator / secondary relay) and link each task type to its own sources.
2. **Snapshots** are good. Add "public frontier at the time" and, once a second live snapshot exists, "F+1 forecast made then vs realized".
3. **"How the numbers are built"** should state the closure-rate rule for F+1/F+2 and the 1-point saturation convention.
4. Add the calibration block from 1.4.

### 3.7 Interaction and accessibility

1. **Touch tooltips never dismiss** except on scroll (verified: tap a week cell, tap elsewhere, the tooltip stays). Hide on any tap outside, or after a timeout.
2. `#tooltip` has `role="status"`, so every hover is announced by screen readers. Make the tooltip `aria-hidden` and give the bars accessible text instead (the stacked bars are `aria-hidden` with no text alternative in the Jobs rows).
3. The Pay/Jobs `radiogroup` puts both buttons in the Tab order with no arrow-key handling. Use real radio inputs or a roving tabindex.
4. Chart text is 11px on mobile, the eyebrow 11.8px, the "Find a job" labels 11.5px. Use 12px as the floor.
5. No "skip to content" link. The Overview has no focusable content, so Tab cycles the header; acceptable, but the ranked lists becoming links (3.2.5) would fix both.

### 3.8 Technical

- Fonts: four files, 147KB; the Archivo variable font (width and weight axes) is 90KB on its own. Subsetting or dropping the width axis would halve it.
- Data: 10 fetches on load (3 data files plus 7 assessments). Bundle the assessments into one file at build time, or inline them into `index.html`.
- `scripts/build.mjs` uses `new URL("..").pathname`, which breaks on paths with spaces or on Windows; use `fileURLToPath`.
- CI runs the build on every push. Add a Playwright smoke test (headline renders, no console errors) and the model unit tests from 1.10.

## Appendix: how this audit was done

- Read every file in the repository, including the report and the five research notes.
- Ran `node scripts/validate.mjs` and two analysis scripts against `assets/model.js` to reproduce the headline, decompose it by task type, family and confidence, test the projection against a ceiling-only alternative, and measure sensitivity to single-point edits. Checked all 98 employment and wage rows against the BLS research note, including the employment-weighted means for combined rows. Compared the report's CSV to all seven assessment files (0 mismatches).
- Built the site with `scripts/build.mjs`, served `dist/`, and rendered all four views at 1280px and 390px in light and dark mode with Playwright, exercising group, job and task expansion, search, the score editor, keyboard tab order and touch tooltips. Ran axe-core 4.10.2 on three views. Measured a cold load.
- Checked all 82 cited URLs with curl for status, redirects and titles, then had each page fetched and read against the specific figures the site or report attributes to it. Where a page was blocked or stale, tried the primary source once.
- Screenshots and scripts are in the session scratchpad, not in the repository.
