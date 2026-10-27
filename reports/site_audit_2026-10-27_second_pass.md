# Headroom site audit, second pass

Date: 2026-10-27. Scope: the site, the model, the data, the report, and a re-check of the ten most load-bearing source claims. This pass follows `site_audit_2026-10-27.md` and the fixes that landed after it. Method is in the appendix.

## Verdict

The thesis holds up and the site presents it well. The model reproduces, the forecasts are a fair continuation of the record, the report matches the data exactly, and the sources behind the biggest numbers check out. This pass found one modelling inconsistency (forecast ranges that broke the model's own rules), one claim the site's own report contradicted (no METR horizon after May 2026), one figure with no readable source (OSWorld-Verified "about 90%"), and a set of smaller wording, labelling and UX issues. All of those are fixed on this branch. A short list of judgment calls is left for you at the end.

## What checks out

**The forecast is the recent pace, not an assumption.** F+1 and F+2 are exactly Now + g × (Ceiling − Now) with the stated closure rates, for all 29 task types to within rounding. At the index level, Frontier+1 closes 26% of the remaining gap to the ceiling in seven months; the seven months before Opus 5.5 closed 29% (27% and 30% by headcount). The bend in the timeline after today comes from the gap shrinking, not from a slower rate. The Overview now says this under the chart, because it is the obvious first question a reader will ask.

| Pace check | Wages | People |
|---|---|---|
| Share of gap closed, the 7 months to Sep 2026 | 29% | 30% |
| Share of gap closed by Frontier+1, 7 months | 26% | 27% |

**Report and data agree.** The Appendix A table matches the live JSON on every score and confidence, and the cluster means reproduce (codified 44 → 76 → 84 → 89, judgment 24 → 49 → 58 → 65, interpersonal 6 → 13 → 17 → 20).

**Sources behind the biggest numbers re-verified** (pages read on 2026-10-27):

| Claim | Result |
|---|---|
| Anthropic Opus 5.5 table: GDPval-AA 1846 vs Opus 5 1708, OSWorld 2.1 81.8% partial, TB 4.0 66.4%, AutomationBench 40.0%, 680,000-line migration, 93 → 63 minutes | Confirmed |
| Remote Labor Index: Opus 5.5 21.25% (#1), GPT-6 Astra 20.83%, Opus 4.8 8.33%, Opus 4.6 4.17% (Cowork), Opus 4.5 3.75% | Confirmed |
| METR results file: Opus 4.1 1h40m / 23m, GPT-5 3h23m / 38m, Opus 4.5 4h53m / 49m, Opus 4.6 11h59m / 1h10m, Mythos Preview 17.4h / 3h06m | Confirmed |
| ESADE: 37.8% replaceable, 48.4% augmentable, all 12 major-group values | Confirmed |
| Anthropic robots study: 0.3% of tasks, about 40 years to 10%, 46% of working time physical | Confirmed |
| Mercor investment banking: Opus 4.8 61.5%, Fable 5 69.3%, Opus 5.5 73.7% | Confirmed (the page calls it a September update, not a re-run) |
| OSWorld 2.0 strict vs partial: Fable 5.1 77.9% / 41.7% | Confirmed (gap is about 36 points, not 35; no Opus 5.5 row) |
| METR GPT-5.6 Sol about 11h18m, June 2026 | Confirmed, and it contradicts the site's caveat (below) |
| Mercor APEX consulting about 80% for Opus 5.5 | Confirmed, metric unlabelled (the site already says so) |
| OSWorld-Verified about 90% by October 2026 (decodethefuture) | Could not be verified: page blocked, possibly dated May 2026 |

**Build and render.** Validator, 11 unit tests and the browser smoke test pass. All four views render at 1280px and 390px in light and dark mode with no console errors and no horizontal overflow. Deep links land below the sticky header.

## Fixed in this pass

### Model

1. **Forecast ranges broke the model's own rules.** The ± range was applied symmetrically, so 19 of 29 task types had ranges running below today's score or above the ceiling. Meetings showed F+1 "24 ± 7", a low end of 17 against a score of 18 today; editing showed F+2 "95 ± 8", a high end of 103%. Ranges are now cut off at today's score and at the ceiling (`scoreRange` in `assets/model.js`) and shown as ranges, not ±. The index range barely moves and becomes slightly asymmetric:

   | | Before | After |
   |---|---|---|
   | Frontier+1 (wages) | 55% ± 6 (48.9–60.5) | 55% (50–61) |
   | Frontier+2 (wages) | 59% ± 9 (50.0–68.6) | 59% (51–68) |

   A unit test now checks every task type's range sits between its current score and its ceiling.

### Content accuracy

2. **METR caveat contradicted the report.** The site said no independent METR horizon exists for any model released after May 2026; the report cites METR's June 2026 measurement of GPT-5.6 Sol (about 11.3 hours, launched July 9). It now says METR has published no horizon for any Anthropic model since Mythos Preview, and that its one later horizon is one METR itself calls not robust. The report's summary had the same error and is fixed.
3. **"OSWorld-Verified about 90% by October 2026"** rested only on a blocked aggregator page that may predate October. Replaced with Opus 4.8's 83.4%, which is sourced, in the `support` evidence and three places in the report; the source is dropped.
4. **METR doubling time** updated to 128.7 days (CI 104–158) from METR's corrected results file, matching the post-correction horizons used everywhere else, with a note that the fit excludes models above 16 hours.
5. **Smaller source wording**: Mercor's September figures are an update, not a re-run; the strict-versus-partial OSWorld gap is about 36 points; source notes added for the METR GPT-5.6 Sol page and the OSWorld 2.0 table.
6. **Meetings evidence said "notes and summaries score under editing".** No occupation maps meeting notes to editing (editing is used by two occupations and is 0.1% of the index). The note now says what the score of 18 actually credits: the prep, notes, summaries and async replies inside meeting time.
7. **"Public frontier at the time" named models released after the snapshot date**: GPT-5.5 for Opus 4.7, GPT-5 for Opus 4.1, GPT-5.4 and Gemini 3.1 Pro for Opus 4.6, GPT-5.2 for Opus 4.5. Rewritten to describe the frontier on the day, with later releases marked as following. The peers lines no longer repeat the frontier line.
8. **Glossary misdescribed the closure rate** as "the share the last ten months closed". That share is larger (59% for drafting, against g = 0.43); g is that pace scaled to one generation. Fixed in the glossary and the method note.
9. **Calibration note** now says ESADE's group figures are unweighted averages across occupations (time-weighted within each), marks the two non-comparable rows (Sales, Healthcare), and states the result: median gap 5 points, 9 of 10 comparable groups within 10. The weighting choice barely matters (mean absolute gap 5.3 by wages, 5.9 by headcount, 6.0 unweighted).
10. **Dead reference.** The method note pointed readers to `reports/…md`, which is not deployed. The Method tab now links the report on GitHub (`report_url` in the assessment; the repository is public).
11. **Chart title vs first point.** "From the first agentic models to saturation" sat above a first point labelled "Before agentic models". Now "From Opus 4.1 to saturation".
12. **Duplicated and stale caveats.** The Limits block repeated the Uncertainty block word for word and hard-coded "55% of the wage-weighted index", which was wrong under People weighting (51%). Both removed; the evidence bar above shows the live figure.

### UX

13. **Definition under the headline.** "48% of white-collar work" invites the objection that AI is not doing half of anyone's job. A one-line definition now sits directly under the h1: share of working time in tasks the best public model can do to a competent professional's standard with light review, capability not adoption. It used to be in the glossary at the bottom of the page.
14. **Saturation stat** now gives the index level when gains flatten ("About 70% by Oct 2030"), so readers do not assume saturation means reaching the 74% ceiling. It also no longer borrows the grey "Needs a person" swatch.
15. **Timeline labels.** The F+2 label sat on the ceiling line on mobile and the F+1 label hung under the Today line. Both now sit under the band with their ranges.
16. **Sources list** states the common access date once instead of repeating it on all 81 entries.
17. **Shared scenario links** now carry the weighting, so the recipient sees the same numbers.

## Left for you

Ranked by how much they would improve the site. None is a correction.

1. **Split `meetings`.** It is the largest task type (10.7% of the wage-weighted index), low confidence, and blends prep, notes and async replies (which AI does well) with live participation (which it does not). Splitting it would make the score defensible line by line and would probably raise the index slightly: each 5 points on the meetings score moves the headline by about half a point. This is a modelling choice, so I did not make it.
2. **Link the snapshot highlights to sources.** The benchmark figures on the Method tab's snapshot cards carry no links; 41 of the 81 sources are reachable only from the full list. A `sources` array per highlight, like the task types have, would close that.
3. **F+2 colour contrast.** The Frontier+2 blue is about 2.1:1 against the surface in both themes (#86b6ef on white, #184f95 on #161a21), under the 3:1 guideline for chart marks. It shows in the week grid and the dot plot. A slightly deeper light-mode value and a lighter dark-mode value would fix it without changing the palette's logic.
4. **A "biggest movers" list on the Overview.** Most and least exposed today are both static rankings. A list of jobs gaining the most hours by Frontier+2 would show where the change lands next, which is the thesis's forward-looking half.
5. **Remaining secondary relays.** The 1866 GDPval-AA figure rests on an anonymous aggregator (itdoeswhatnow); the four BenchLM pages mix benchmark versions. Where Artificial Analysis publishes the figure directly, cite it instead.
6. **Generate the share image in the build.** `assets/og.png` is a static picture of the headline; the README now lists it as a step when adding an assessment, but rendering it from the data would stop it going stale.
7. **Small interaction fixes.** Group rows look clickable while a search is active but do nothing; Mercor's own benchmark pages could be tiered primary rather than independent.

## Appendix: how this pass was done

- Read every file in the repository. Reproduced the headline with `assets/model.js` and scripts in the session scratchpad: closure rates per type against the 10-month and 4-month historical record, index-level pace against the forecast, forecast ranges against floors and ceilings, calibration under three weightings, report CSV and cluster means against the JSON.
- Built `dist/`, rendered all views at 1280px and 390px in light and dark mode with Playwright, checked deep links against the sticky header, and ran the smoke test before and after the changes.
- Re-fetched the ten claims in the table above (METR's YAML and ESADE's PDF were parsed directly). Pages that blocked automated fetching were tried once more through another route.
