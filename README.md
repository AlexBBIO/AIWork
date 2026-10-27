# Headroom

A regularly updated model of how much U.S. white-collar work AI models can do, and how far that is from a saturation point.

**Structure:** occupation → tasks (% of working time) → task type → saturation score for three model tiers.

| Tier | Meaning |
|---|---|
| Frontier | Best publicly available model on the assessment date |
| Frontier+1 | Next capability step (two or three point releases, about six months out) |
| Frontier+2 | The step after that |

Each task type also has a **ceiling**: the most of that task AI could take even with unlimited intelligence, given physical presence, legal sign-off and human preference. Past Frontier+2 the model keeps closing each task type's remaining gap to its ceiling at the rate implied by its last step, unless the assessment states an explicit lower `asymptote` for that type. The **saturation point** is the first generation that adds less than one point to the overall index; the one-point threshold is a convention.

Frontier+1 and Frontier+2 are not separate judgments: each is Now + g × (Ceiling − Now), applied twice, with a closure rate g per cluster of task types (see the report). Every task type carries a **confidence** (high, medium, low) and a forecast **range**: 5 points either side at Frontier+1 and 8 at Frontier+2 for medium confidence, scaled by 0.6 for high and 1.4 for low (`uncertainty` in the assessment), and cut off at today's score and at the ceiling, since scores do not fall and cannot pass the ceiling. The index range sums the task-type ranges, which assumes their errors move together.

Occupations are weighted by **wages** (employment × mean wage) or by **people** (headcount).

**History:** each Claude Opus release since Opus 4.1 (Aug 2025) is a dated snapshot. Earlier snapshots are *backfilled*: scored after the fact from benchmark results, for the frontier only, and the point reflects the best public model on that date even when it was not the Opus model (the Opus 5 point is scored at Fable 5 level). The live snapshot also carries forecasts for Frontier+1 and Frontier+2 with explicit dates. The research behind the scores is in `reports/` and `research_notes/`; `reports/site_audit_2026-10-27.md` is an audit of the site and its sources, and `reports/site_audit_2026-10-27_second_pass.md` a follow-up check.

## Two versions

The root site (`/`) is the original. `Opus/` is a revised version served at `/Opus/`, built from the audits in `reports/`: meetings split into live meetings and prep and follow-up, forecast ranges cut off at today's score and the ceiling, sourced snapshot highlights, higher-contrast colours and the corrections from both source checks. Each version has its own `index.html`, `assets/` and `data/`, so they can differ without affecting each other; `Opus/tests/` holds the revision's tests. To make the revision the main site, copy `Opus/index.html`, `Opus/assets` and `Opus/data` over the root ones.

## Files

```
data/occupations.json          98 occupations, BLS OEWS May 2025 employment & wages, task breakdowns
                               (groups carry employment_bls, the BLS total for the major group;
                               task_basis explains where the time shares come from)
data/taxonomy.json             29 task types
data/assessments/index.json    list of assessment ids; "latest" is shown by default and must be kind "live"
data/assessments/<id>.json     one snapshot (ids are the anchor model, e.g. opus-5-5): anchor, frontier,
                               scores per task type (f0, and for live snapshots f1 / f2 / ceiling,
                               confidence, sources), evidence notes, tiered sources with access dates,
                               forecast_dates, uncertainty, calibration
reports/, research_notes/      research behind the scores
assets/model.js                the model (shared by site, validator and tests)
assets/app.js, style.css       the site
scripts/validate.mjs           checks the data and prints the headline numbers (--site Opus for the revision)
scripts/build.mjs              validates both sites, copies them into dist/ and dist/Opus/, writes data/bundle.json
scripts/smoke.mjs              browser smoke test of both sites against dist/ (needs playwright)
scripts/og.mjs                 renders a site's share image, assets/og.png, from its data (needs playwright)
tests/model.test.mjs           unit tests for the model (node --test runs these and Opus/tests/)
Opus/                          the revised site: index.html, assets/, data/, tests/
```

## Running locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000 (the site falls back to the source data files)
node scripts/validate.mjs     # validate data and print the index (add --site Opus for the revision)
node --test                   # unit tests
node scripts/build.mjs        # validate and build dist/
```

The site is addressable: `#jobs/<occupation id>` opens a job, `#tasks/<task type id>` opens a task type, `?w=employment` switches the weighting, and the score editor's "Copy link" encodes edited scores as `?e=`.

## Adding a new assessment

1. Copy the latest file in `data/assessments/` to a new id named after the anchor model (e.g. `opus-6.json`) and update `id`, `date`, `anchor`, `frontier`, `peers`, `highlights`, `forecast_dates` and the sources' `accessed` dates.
2. Re-score `f0`, `f1`, `f2`, `ceiling` and `confidence` for each task type, keep `f0 ≤ f1 ≤ f2 ≤ ceiling`, update each `evidence` note and its `sources` ids. Add `asymptote` only where you believe a type flattens below its ceiling.
3. For an occupation where a task type behaves differently, add an override: `"overrides": {"lawyer:draft": {"f0": 60, "f1": 78, "f2": 88, "ceiling": 95}}`.
4. Change the previous live file's `kind` to `backfill` but **keep** its `f1`, `f2`, `ceiling` and `forecast_dates`: the Method tab scores each retired forecast against the snapshot closest to its due date.
5. Add the id to `index.json`, set `latest`, and run `node scripts/validate.mjs` and `node --test`. The validator rejects a `latest` that is not live, missing evidence or confidence, unknown source ids, a score that falls between snapshots, and malformed dates.
6. Regenerate the share image with `node scripts/og.mjs` (and `--site Opus`): it shows the headline percentage and the band split as a static picture.

## Caveats

- Scores are judgments calibrated to benchmarks (GDPval, METR time horizons, Remote Labor Index, OSWorld, domain evals) and labor studies, not direct measurements. About 55% of the wage-weighted index sits in task types scored with low confidence; the Overview shows the split.
- Task time shares are the author's estimates informed by O*NET task statements. No survey measures white-collar time by activity, and from 2027 on the mix matters more than the scores.
- Employment and wages are BLS OEWS May 2025, rounded; some rows combine SOC codes (listed as `11-3051/71`). OEWS excludes the self-employed. Coverage is 60.5M of the 87.1M jobs in the twelve white-collar major groups; registered nurses and retail sales are left out.
- Saturation measures technical capability, not adoption or job loss.
- Sources are tiered as primary, independent or secondary and carry access dates; about a third are secondary relays of vendor tables.

## Deploying

The site is static and deploys on Vercel. `vercel.json` runs `node scripts/build.mjs`, which validates the data (a bad data file fails the deploy), copies `index.html`, `assets/` and `data/` into `dist/` and writes `dist/data/bundle.json` so the page loads with one data request. The Opus revision goes to `dist/Opus/`; `trailingSlash` in `vercel.json` sends `/Opus` to `/Opus/` so its relative paths resolve. Research notes and reports are not deployed.

To set it up, import the GitHub repo at https://vercel.com/new, keep the settings from `vercel.json`, and deploy. Every push to the production branch then redeploys; other branches get preview URLs. Once the domain is known, set `og:image` in `index.html` to the absolute URL of `assets/og.png` and add `og:url`.

`.github/workflows/validate.yml` runs the unit tests and the build on every push, then the browser smoke test.
